/**
 * Utility to install Antigravity Chinese Rule globally (~/.gemini/config/GEMINI.md)
 * or to the current workspace (.agents/rules/chinese-developer.md).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ruleSource = path.join(__dirname, 'GEMINI.md');
const globalConfigDir = path.join(os.homedir(), '.gemini', 'config');
const globalRuleTarget = path.join(globalConfigDir, 'GEMINI.md');

function applyGlobalRule() {
  if (!fs.existsSync(globalConfigDir)) {
    fs.mkdirSync(globalConfigDir, { recursive: true });
  }

  // Backup existing global GEMINI.md if present
  if (fs.existsSync(globalRuleTarget)) {
    const backupTarget = path.join(globalConfigDir, `GEMINI.backup.${Date.now()}.md`);
    fs.copyFileSync(globalRuleTarget, backupTarget);
    console.log(`[提示] 已备份原有全局规则至: ${backupTarget}`);
  }

  fs.copyFileSync(ruleSource, globalRuleTarget);
  console.log(`✓ 成功安装全局中文规则至: ${globalRuleTarget}`);
  console.log('现在所有 Antigravity 会话与项目均会自动采用中文思考与回复！');
}

applyGlobalRule();
