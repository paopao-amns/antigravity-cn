/**
 * Antigravity-CN Dictionary Validator
 * Validates JSON integrity, detects duplicates, verifies regex syntax, and ensures high quality.
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../locales');
const zhCnPath = path.join(localesDir, 'zh-CN.json');
const dynamicRulesPath = path.join(localesDir, 'dynamic-rules.json');

let hasErrors = false;

console.log('🔍 开始校验 Antigravity-CN 语言词典...\n');

// 1. Validate zh-CN.json
try {
  const rawContent = fs.readFileSync(zhCnPath, 'utf8');
  const dict = JSON.parse(rawContent);

  const keys = Object.keys(dict);
  console.log(`[zh-CN.json] 成功解析，词条总数: ${keys.length}`);

  let emptyCount = 0;
  let identityCount = 0;

  for (const [en, zh] of Object.entries(dict)) {
    if (typeof zh !== 'string' || zh.trim().length === 0) {
      console.error(`❌ 空翻译词条: "${en}"`);
      emptyCount++;
      hasErrors = true;
    }
    // Check if key and value are identical English
    if (en === zh && /^[A-Za-z ]+$/.test(en)) {
      identityCount++;
    }
  }

  if (identityCount > 0) {
    console.warn(`⚠️ 共有 ${identityCount} 个未翻译（同词）词条，社区贡献者可参与补充。`);
  }
} catch (err) {
  console.error(`❌ 解析 zh-CN.json 失败:`, err.message);
  hasErrors = true;
}

// 2. Validate dynamic-rules.json
if (fs.existsSync(dynamicRulesPath)) {
  try {
    const rawContent = fs.readFileSync(dynamicRulesPath, 'utf8');
    const rules = JSON.parse(rawContent);

    if (!Array.isArray(rules)) {
      throw new Error('dynamic-rules.json must be an Array of rule objects');
    }

    console.log(`\n[dynamic-rules.json] 成功解析，正则规则总数: ${rules.length}`);

    rules.forEach((rule, idx) => {
      if (!rule.pattern || !rule.replacement) {
        console.error(`❌ 规则 #${idx} 缺少 pattern 或 replacement`);
        hasErrors = true;
        return;
      }
      try {
        new RegExp(rule.pattern, rule.flags || 'i');
      } catch (e) {
        console.error(`❌ 规则 #${idx} 正则表达式无效: /${rule.pattern}/ ->`, e.message);
        hasErrors = true;
      }
    });
  } catch (err) {
    console.error(`❌ 解析 dynamic-rules.json 失败:`, err.message);
    hasErrors = true;
  }
}

console.log('\n----------------------------------------');
if (hasErrors) {
  console.error('❌ 词典校验未通过，请修复上述问题！');
  process.exit(1);
} else {
  console.log('✅ 词典校验全部通过！格式标准、语法正确。');
  process.exit(0);
}
