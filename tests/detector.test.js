const test = require('node:test');
const assert = require('node:assert');
const { detectAntigravity, getCandidatePaths } = require('../src/patcher/detector');

test('Detector candidate paths are non-empty list', () => {
  const candidates = getCandidatePaths();
  assert.ok(Array.isArray(candidates));
  assert.ok(candidates.length > 0);
});

test('Detector returns valid object structure', () => {
  const result = detectAntigravity();
  assert.strictEqual(typeof result.found, 'boolean');
  assert.strictEqual(typeof result.installDir, 'string');
  assert.strictEqual(typeof result.resourcesDir, 'string');
  assert.strictEqual(typeof result.asarPath, 'string');
  assert.strictEqual(typeof result.backupPath, 'string');
});

test('Detector handles non-existent custom path gracefully', () => {
  const result = detectAntigravity('/non/existent/path/for/testing');
  assert.strictEqual(typeof result.found, 'boolean');
});
