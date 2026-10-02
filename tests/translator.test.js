const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const dictPath = path.resolve(__dirname, '../locales/zh-CN.json');
const rulesPath = path.resolve(__dirname, '../locales/dynamic-rules.json');

const DICT = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
const DYNAMIC_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8')).map((r) => ({
  regex: new RegExp(r.pattern, r.flags || 'i'),
  replacement: r.replacement,
}));

function mockTranslateString(rawText) {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  if (!trimmed || trimmed.length < 2) return null;

  if (DICT[trimmed] && DICT[trimmed] !== trimmed) {
    const leading = rawText.match(/^\s*/)[0];
    const trailing = rawText.match(/\s*$/)[0];
    return leading + DICT[trimmed] + trailing;
  }

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

test('Translate exact strings correctly', () => {
  assert.strictEqual(mockTranslateString('New Conversation'), '新建会话');
  assert.strictEqual(mockTranslateString('Scheduled Tasks'), '计划任务');
  assert.strictEqual(mockTranslateString('Settings'), '设置');
  assert.strictEqual(mockTranslateString('Terminal Sandbox'), '终端沙箱环境');
});

test('Preserve leading and trailing whitespace', () => {
  assert.strictEqual(mockTranslateString('  New Conversation\n'), '  新建会话\n');
  assert.strictEqual(mockTranslateString('\tAccept Step '), '\t接受步骤 ');
});

test('Translate dynamic regex rules', () => {
  assert.strictEqual(mockTranslateString('Thought for 4.2s'), '已思考 4.2 秒');
  assert.strictEqual(mockTranslateString('Thought for 12 seconds'), '已思考 12 秒');
  assert.strictEqual(mockTranslateString('5 files changed'), '5 个文件已变更');
  assert.strictEqual(mockTranslateString('Last 7 days'), '最近 7 天');
  assert.strictEqual(mockTranslateString('Step 1 of 5'), '第 1 / 5 步');
  assert.strictEqual(mockTranslateString('Just now'), '刚刚');
});

test('Do not alter unknown strings or single characters', () => {
  assert.strictEqual(mockTranslateString('x'), null);
  assert.strictEqual(mockTranslateString('SomeCustomCodeIdentifier_123'), null);
});

test('Translate slash commands correctly', () => {
  assert.strictEqual(
    mockTranslateString('Run until the specified goal is completely finished.'),
    '全力运行直至指定的任务目标彻底完成（长任务深度执行）'
  );
  assert.strictEqual(
    mockTranslateString('Run an instruction on a recurring schedule or as a one-time timer.'),
    '按周期性计划执行指令，或设定单次定时提醒'
  );
  assert.strictEqual(
    mockTranslateString('Invoke a browser agent for web tasks.'),
    '唤起浏览器智能体执行网页自动化交互任务'
  );
});

test('Protected model speed and thinking intensity tiers must NEVER be translated', () => {
  const protectedWords = ['Fast', 'High', 'Medium', 'Low', 'Thinking', 'Flash', 'Pro', 'Ultra'];
  const PROTECTED_SET = new Set(protectedWords);
  for (const word of protectedWords) {
    assert.strictEqual(PROTECTED_SET.has(word), true);
    assert.strictEqual(DICT[word], undefined, `Expected "${word}" NOT to be in dictionary`);
  }
});

test('Translate new dynamic regex rules', () => {
  assert.strictEqual(mockTranslateString('30 tools enabled'), '30 项工具已启用');
  assert.strictEqual(mockTranslateString('2 items'), '2 个项目');
  assert.strictEqual(mockTranslateString('1.5k Tokens (MCP)'), '1.5k Token (MCP)');
});

