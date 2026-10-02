/**
 * Antigravity-CN Preload Hook
 * Injected into Electron's renderer context via dist/preload.js
 */

const { webFrame } = require('electron');
const fs = require('fs');
const path = require('path');

try {
  const dictPath = path.join(__dirname, 'zh-CN.json');
  const rulesPath = path.join(__dirname, 'dynamic-rules.json');
  const enginePath = path.join(__dirname, 'translator.js');

  if (fs.existsSync(dictPath) && fs.existsSync(enginePath)) {
    const dictContent = fs.readFileSync(dictPath, 'utf8');
    const rulesContent = fs.existsSync(rulesPath)
      ? fs.readFileSync(rulesPath, 'utf8')
      : '[]';
    const engineContent = fs.readFileSync(enginePath, 'utf8');

    // Execute in the main page world
    webFrame.executeJavaScript(`
      try {
        window.__AGY_LOCALE_DATA__ = {
          dict: ${dictContent},
          rules: ${rulesContent}
        };
        ${engineContent}
      } catch (e) {
        console.error('[Antigravity-CN] Runtime injection error:', e);
      }
    `);
  }
} catch (err) {
  console.error('[Antigravity-CN] Preload hook initialization failed:', err);
}
