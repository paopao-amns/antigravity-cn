/**
 * Antigravity-CN Patcher
 * Handles installation, uninstallation/restore, status checking, and dictionary updates.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { detectAntigravity } = require('./detector');
const { createTempDir, removeDir, extractAsar, packAsar } = require('./asar-util');

const PATCH_TAG_START = '/* [ANTIGRAVITY-CN-PATCH-START] */';
const PATCH_TAG_END = '/* [ANTIGRAVITY-CN-PATCH-END] */';

/**
 * Checks if Antigravity is currently running
 */
function isAntigravityRunning() {
  try {
    if (process.platform === 'win32') {
      const output = execSync('tasklist /FI "IMAGENAME eq Antigravity.exe" /NH', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return output.toLowerCase().includes('antigravity.exe');
    } else {
      const output = execSync('pgrep -i antigravity || true', {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      return output.trim().length > 0;
    }
  } catch (e) {
    return false;
  }
}/**
 * Kills running Antigravity processes
 */
function killAntigravity() {
  try {
    if (process.platform === 'win32') {
      execSync('taskkill /F /IM Antigravity.exe /T', { stdio: 'ignore' });
    } else {
      execSync('pkill -f -i antigravity', { stdio: 'ignore' });
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Checks the current installation status
 */
function getStatus(customPath) {
  const detection = detectAntigravity(customPath);
  if (!detection.found) {
    return {
      installed: false,
      patched: false,
      backupExists: false,
      message: detection.error,
    };
  }

  const backupExists = fs.existsSync(detection.backupPath);
  let isPatched = false;

  try {
    // Quick inspection of asar without full extraction:
    // Read the asar header or a portion to check if our patch tag is present
    const asarBuffer = fs.readFileSync(detection.asarPath);
    if (asarBuffer.includes(Buffer.from('[ANTIGRAVITY-CN-PATCH-START]'))) {
      isPatched = true;
    }
  } catch (err) {
    // ignore
  }

  return {
    installed: true,
    installDir: detection.installDir,
    resourcesDir: detection.resourcesDir,
    asarPath: detection.asarPath,
    backupExists,
    patched: isPatched,
    isRunning: isAntigravityRunning(),
  };
}

/**
 * Install the Chinese localization patch
 */
async function installPatch(options = {}) {
  const detection = detectAntigravity(options.customPath);
  if (!detection.found) {
    throw new Error(detection.error);
  }

  if (isAntigravityRunning() && !options.force) {
    throw new Error(
      '⚠️ Antigravity 正在运行中！请先完全关闭 Antigravity 应用程序后再执行汉化补丁安装，以避免文件被占用。'
    );
  }

  // 1. Create original backup if not present
  if (!fs.existsSync(detection.backupPath)) {
    console.log(`[Antigravity-CN] 正在创建原始备份: ${detection.backupPath}`);
    fs.copyFileSync(detection.asarPath, detection.backupPath);
  } else {
    console.log(`[Antigravity-CN] 已检测到现有备份: ${detection.backupPath}`);
  }

  const tempExtractDir = createTempDir('agy-extract-');
  const tempPackAsar = path.join(createTempDir('agy-pack-'), 'app.asar');

  try {
    console.log(`[Antigravity-CN] 正在解包核心资源 (app.asar)...`);
    extractAsar(detection.asarPath, tempExtractDir);

    const preloadPath = path.join(tempExtractDir, 'dist', 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      throw new Error(`dist/preload.js not found in ${tempExtractDir}`);
    }

    // 2. Build standalone inlined bundle with zero require dependencies
    const projectRoot = path.resolve(__dirname, '../../');
    const dict = JSON.parse(fs.readFileSync(path.join(projectRoot, 'locales', 'zh-CN.json'), 'utf8'));
    const rules = JSON.parse(fs.readFileSync(path.join(projectRoot, 'locales', 'dynamic-rules.json'), 'utf8'));
    const engine = fs.readFileSync(path.join(projectRoot, 'src', 'engine', 'translator.js'), 'utf8');

    const inlinedBundle = `\n${PATCH_TAG_START}
try {
  window.__AGY_LOCALE_DATA__ = {
    dict: ${JSON.stringify(dict)},
    rules: ${JSON.stringify(rules)}
  };
  ${engine}
} catch (err) {
  console.error('[Antigravity-CN] Translator error:', err);
}
${PATCH_TAG_END}\n`;

    // 3. Inject standalone bundle directly into dist/preload.js
    let preloadContent = fs.readFileSync(preloadPath, 'utf8');

    // Remove existing patch if present to allow re-patching cleanly
    if (preloadContent.includes(PATCH_TAG_START)) {
      const regex = new RegExp(
        `${escapeRegExp(PATCH_TAG_START)}[\\s\\S]*?${escapeRegExp(PATCH_TAG_END)}`,
        'g'
      );
      preloadContent = preloadContent.replace(regex, '');
    }

    preloadContent += inlinedBundle;
    fs.writeFileSync(preloadPath, preloadContent, 'utf8');

    // 4. Also optionally patch native menus in dist/menu.js
    const menuPath = path.join(tempExtractDir, 'dist', 'menu.js');
    if (fs.existsSync(menuPath)) {
      let menuContent = fs.readFileSync(menuPath, 'utf8');
      menuContent = menuContent
        .replace(/label:\s*'New Window'/g, "label: '新建窗口'")
        .replace(/label:\s*'Connect to WSL'/g, "label: '连接到 WSL'")
        .replace(/label:\s*'Reopen Locally'/g, "label: '在本地重新打开'")
        .replace(/label:\s*'Docs'/g, "label: '官方文档'")
        .replace(/addItemToSubmenu\(menu,\s*'File'/g, "addItemToSubmenu(menu, '文件'")
        .replace(/addItemToSubmenu\(menu,\s*'Help'/g, "addItemToSubmenu(menu, '帮助'");
      fs.writeFileSync(menuPath, menuContent, 'utf8');
    }

    // 5. Repack asar
    console.log(`[Antigravity-CN] 正在打包汉化资源...`);
    await packAsar(tempExtractDir, tempPackAsar);

    // 6. Replace target asar
    fs.copyFileSync(tempPackAsar, detection.asarPath);
    console.log(`[Antigravity-CN] 汉化补丁安装成功！`);

    return {
      success: true,
      asarPath: detection.asarPath,
      backupPath: detection.backupPath,
    };
  } finally {
    removeDir(tempExtractDir);
    removeDir(path.dirname(tempPackAsar));
  }
}

/**
 * Restore original unpatched Antigravity
 */
function restoreOriginal(options = {}) {
  const detection = detectAntigravity(options.customPath);
  if (!detection.found) {
    throw new Error(detection.error);
  }

  if (isAntigravityRunning() && !options.force) {
    throw new Error(
      '⚠️ Antigravity 正在运行中！请先关闭 Antigravity 应用程序后再执行还原。'
    );
  }

  if (!fs.existsSync(detection.backupPath)) {
    throw new Error(
      `未找到原始备份文件: ${detection.backupPath}，无法自动还原。`
    );
  }

  console.log(`[Antigravity-CN] 正在还原原始 app.asar...`);
  fs.copyFileSync(detection.backupPath, detection.asarPath);

  if (options.deleteBackup) {
    fs.unlinkSync(detection.backupPath);
  }

  console.log(`[Antigravity-CN] 已成功还原为官方原始英文版！`);
  return { success: true };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  isAntigravityRunning,
  killAntigravity,
  getStatus,
  installPatch,
  restoreOriginal,
};
