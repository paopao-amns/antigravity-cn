/**
 * Antigravity-CN Core Translation Engine
 * High-performance, non-intrusive DOM localization engine for Google Antigravity.
 * 
 * Features:
 * - O(1) text dictionary lookup with whitespace preservation
 * - RegEx pattern-based dynamic template replacement
 * - Smart code/terminal exclusion (never touches code blocks or user input)
 * - Microtask-batched MutationObserver
 * - Real-time on/off language toggle
 * - Community Translation Inspector mode (Ctrl+Shift+L)
 */

(function () {
  'use strict';

  // Disconnect existing observer if reloading
  if (window.__AGY_TRANSLATOR_OBSERVER__) {
    try {
      window.__AGY_TRANSLATOR_OBSERVER__.disconnect();
    } catch (e) {}
  }
  window.__AGY_TRANSLATOR_INITIALIZED__ = true;

  // Retrieve dictionary & dynamic rules from global or fallback
  const initialLocaleData = window.__AGY_LOCALE_DATA__ || { dict: {}, rules: [] };
  const fallbackDict = initialLocaleData.dict || {};
  const fallbackRules = (initialLocaleData.rules || []).map((r) => ({
    regex: new RegExp(r.pattern, r.flags || 'i'),
    replacement: r.replacement,
  }));

  function getDict() {
    return (window.__AGY_LOCALE_DATA__ && window.__AGY_LOCALE_DATA__.dict) || fallbackDict;
  }

  function getRules() {
    if (window.__AGY_LOCALE_DATA__ && window.__AGY_LOCALE_DATA__.rules) {
      return window.__AGY_LOCALE_DATA__.rules.map((r) => ({
        regex: new RegExp(r.pattern, r.flags || 'i'),
        replacement: r.replacement,
      }));
    }
    return fallbackRules;
  }

  // State
  let isEnabled = true;
  let isInspectorActive = false;
  let translatedNodesCount = 0;

  // WeakSet to track already translated text nodes without memory leaks
  const translatedNodes = new WeakSet();

  // Elements that must NEVER have their text content translated
  const EXCLUDED_TAGS = new Set([
    'CODE',
    'PRE',
    'SCRIPT',
    'STYLE',
    'TEXTAREA',
    'INPUT',
    'NOSCRIPT',
    'SVG',
    'PATH',
  ]);

  // CSS classes / attributes marking code or terminal areas
  const EXCLUDED_SELECTORS = [
    '.monaco-editor',
    '.prism-code',
    '.hljs',
    '.xterm',
    '.terminal',
    '[data-lexical-editor]',
    '[contenteditable="true"]',
    '.code-view',
    '.diff-view-content',
  ];

  function isExcludedNode(node) {
    if (!node) return true;
    let curr = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      if (EXCLUDED_TAGS.has(curr.tagName)) {
        return true;
      }
      for (const sel of EXCLUDED_SELECTORS) {
        if (curr.matches && curr.matches(sel)) {
          return true;
        }
      }
      curr = curr.parentElement;
    }
    return false;
  }

  // Technical model terms and thinking tiers that must NEVER be translated
  const PROTECTED_WORDS = new Set([
    'Fast',
    'High',
    'Medium',
    'Low',
    'Thinking',
    'Flash',
    'Pro',
    'Ultra',
    'Sonnet',
    'Opus',
    'Haiku',
    'Claude',
    'Gemini',
    'GPT'
  ]);

  /**
   * Translate a single text string
   */
  function translateString(rawText) {
    if (!rawText) return null;
    const trimmed = rawText.trim();
    if (!trimmed || trimmed.length < 2) return null;

    // Never translate protected technical tiers/model terms
    if (PROTECTED_WORDS.has(trimmed)) {
      return null;
    }

    const DICT = getDict();
    const DYNAMIC_RULES = getRules();

    // 1. Direct dictionary match
    if (DICT[trimmed] && DICT[trimmed] !== trimmed) {
      // Re-apply original leading/trailing whitespace
      const leading = rawText.match(/^\s*/)[0];
      const trailing = rawText.match(/\s*$/)[0];
      return leading + DICT[trimmed] + trailing;
    }

    // 2. Dynamic regex rules
    for (const rule of DYNAMIC_RULES) {
      if (rule.regex.test(trimmed)) {
        const replaced = trimmed.replace(rule.regex, rule.replacement);
        const leading = rawText.match(/^\s*/)[0];
        const trailing = rawText.match(/\s*$/)[0];
        return leading + replaced + trailing;
      }
    }

    return null;
  }

  /**
   * Translate a DOM Text Node
   */
  function translateTextNode(node) {
    if (!isEnabled) return;
    if (translatedNodes.has(node)) return;
    if (isExcludedNode(node)) return;

    const originalText = node.nodeValue;
    const translated = translateString(originalText);

    if (translated && translated !== originalText) {
      // Keep track of original for toggling back if needed
      if (!node.__agyOriginalText) {
        node.__agyOriginalText = originalText;
      }
      node.nodeValue = translated;
      translatedNodes.add(node);
      translatedNodesCount++;
    }
  }

  /**
   * Translate specific attributes (placeholder, title, aria-label)
   */
  const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'];

  function translateAttributes(el) {
    if (!isEnabled || !el.getAttribute) return;
    if (isExcludedNode(el)) return;

    for (const attr of TRANSLATABLE_ATTRS) {
      const val = el.getAttribute(attr);
      if (val) {
        const translated = translateString(val);
        if (translated && translated !== val) {
          if (!el[`__agyOrig_${attr}`]) {
            el[`__agyOrig_${attr}`] = val;
          }
          el.setAttribute(attr, translated);
        }
      }
    }
  }

  /**
   * Process a subtree recursively
   */
  function processSubtree(root) {
    if (!root || isExcludedNode(root)) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      translateAttributes(root);

      // Walk text nodes
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            if (translatedNodes.has(node)) {
              return NodeFilter.FILTER_REJECT;
            }
            if (isExcludedNode(node)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let curr;
      while ((curr = walker.nextNode())) {
        translateTextNode(curr);
      }
    }
  }

  // MutationObserver batching queue
  let pendingMutations = [];
  let isBatchScheduled = false;

  function flushBatch() {
    isBatchScheduled = false;
    const batch = pendingMutations;
    pendingMutations = [];

    for (const mutation of batch) {
      if (mutation.type === 'childList') {
        for (const added of mutation.addedNodes) {
          processSubtree(added);
        }
      } else if (mutation.type === 'characterData') {
        translateTextNode(mutation.target);
      } else if (mutation.type === 'attributes') {
        translateAttributes(mutation.target);
      }
    }
  }

  const observer = new MutationObserver((mutations) => {
    if (!isEnabled) return;
    pendingMutations.push(...mutations);
    if (!isBatchScheduled) {
      isBatchScheduled = true;
      requestAnimationFrame(flushBatch);
    }
  });

  function startObserver() {
    const target = document.documentElement;
    if (target) {
      window.__AGY_TRANSLATOR_OBSERVER__ = observer;
      processSubtree(target);
      try {
        observer.observe(target, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: TRANSLATABLE_ATTRS,
        });
      } catch (e) {
        console.error('[Antigravity-CN] Observer attach failed:', e);
      }
    }
  }

  // Start observing immediately
  startObserver();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.body) processSubtree(document.body);
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      if (document.body) processSubtree(document.body);
    });

    // Sweeps to catch initial React mount/hydration
    [300, 800, 1500, 3000].forEach((delay) => {
      setTimeout(() => {
        if (document.body) processSubtree(document.body);
      }, delay);
    });
  }

  // ==========================================
  // Inspector Mode: Click untranslated text to copy JSON
  // ==========================================
  function setupInspector() {
    let tooltip = null;

    function getOrCreateTooltip() {
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'agy-cn-inspector-tooltip';
        tooltip.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #1e1e2e;
          color: #cdd6f4;
          border: 1px solid #89b4fa;
          border-radius: 8px;
          padding: 10px 14px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 12px;
          z-index: 999999;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          pointer-events: none;
          display: none;
        `;
        document.body.appendChild(tooltip);
      }
      return tooltip;
    }

    window.addEventListener('keydown', (e) => {
      // Ctrl+Shift+L or Cmd+Shift+L toggles Inspector Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        isInspectorActive = !isInspectorActive;
        const tip = getOrCreateTooltip();
        if (isInspectorActive) {
          tip.style.display = 'block';
          tip.innerHTML = `🔍 <strong>Antigravity-CN 词条检查模式已开启</strong><br/>按住 Alt 点击任意英文文本可复制到剪贴板`;
          setTimeout(() => { tip.style.display = 'none'; }, 3000);
        } else {
          tip.style.display = 'block';
          tip.innerHTML = `✖ <strong>Antigravity-CN 词条检查模式已关闭</strong>`;
          setTimeout(() => { tip.style.display = 'none'; }, 2000);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!isInspectorActive && !e.altKey) return;
      const targetText = e.target?.innerText?.trim();
      if (targetText && targetText.length < 100) {
        e.preventDefault();
        e.stopPropagation();
        const snippet = `"${targetText}": ""`;
        navigator.clipboard.writeText(snippet);
        const tip = getOrCreateTooltip();
        tip.style.display = 'block';
        tip.innerHTML = `📋 已复制翻译词条模板:<br/><code>${snippet}</code>`;
        setTimeout(() => { tip.style.display = 'none'; }, 2500);
      }
    }, true);
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', setupInspector);
  }

  // ==========================================
  // Public Global API
  // ==========================================
  window.AntigravityChinese = {
    version: '1.0.0',
    toggle: function () {
      isEnabled = !isEnabled;
      console.log(`[Antigravity-CN] Chinese localization is now ${isEnabled ? 'ENABLED' : 'DISABLED'}`);
      if (isEnabled) {
        processSubtree(document.body);
      } else {
        location.reload();
      }
      return isEnabled;
    },
    reload: function () {
      processSubtree(document.body);
    },
    getStats: function () {
      const d = getDict();
      const r = getRules();
      return {
        enabled: isEnabled,
        translatedNodes: translatedNodesCount,
        dictEntries: Object.keys(d).length,
        dynamicRules: r.length,
      };
    },
    inspectMode: function (active) {
      isInspectorActive = active !== undefined ? active : !isInspectorActive;
      return isInspectorActive;
    },
  };

  const d = getDict();
  const r = getRules();
  console.log(`[Antigravity-CN] 汉化引擎已就绪 (词条数: ${Object.keys(d).length}, 规则数: ${r.length})`);
})();
