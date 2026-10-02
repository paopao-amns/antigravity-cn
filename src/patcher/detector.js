/**
 * Antigravity Installation Detector
 * Automatically detects Antigravity install directories across Windows, macOS, and Linux.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getCandidatePaths() {
  const platform = os.platform();
  const candidates = [];

  // Allow custom override via env
  if (process.env.ANTIGRAVITY_PATH) {
    candidates.push(process.env.ANTIGRAVITY_PATH);
  }

  if (platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    candidates.push(
      path.join(localAppData, 'Programs', 'antigravity'),
      path.join(localAppData, 'Programs', 'Antigravity'),
      path.join(programFiles, 'antigravity'),
      path.join(programFiles, 'Antigravity'),
      path.join(programFilesX86, 'antigravity'),
      path.join(programFilesX86, 'Antigravity')
    );
  } else if (platform === 'darwin') {
    candidates.push(
      '/Applications/Antigravity.app',
      path.join(os.homedir(), 'Applications', 'Antigravity.app')
    );
  } else {
    // Linux
    candidates.push(
      '/opt/antigravity',
      '/opt/Antigravity',
      '/usr/lib/antigravity',
      path.join(os.homedir(), '.local', 'share', 'antigravity')
    );
  }

  return candidates;
}

/**
 * Resolves Antigravity resource directories
 * @param {string} [customPath]
 * @returns {{ found: boolean, installDir: string, resourcesDir: string, asarPath: string, backupPath: string, error?: string }}
 */
function detectAntigravity(customPath) {
  const candidates = customPath ? [customPath, ...getCandidatePaths()] : getCandidatePaths();

  for (const dir of candidates) {
    if (!dir || !fs.existsSync(dir)) continue;

    // On macOS, resources is inside Contents/Resources
    let resourcesDir;
    if (os.platform() === 'darwin' && dir.endsWith('.app')) {
      resourcesDir = path.join(dir, 'Contents', 'Resources');
    } else {
      resourcesDir = path.join(dir, 'resources');
      // Or maybe the user pointed directly to resources folder
      if (!fs.existsSync(resourcesDir) && fs.existsSync(path.join(dir, 'app.asar'))) {
        resourcesDir = dir;
      }
    }

    const asarPath = path.join(resourcesDir, 'app.asar');
    if (fs.existsSync(asarPath)) {
      return {
        found: true,
        installDir: dir,
        resourcesDir,
        asarPath,
        backupPath: path.join(resourcesDir, 'app.asar.original_backup'),
      };
    }
  }

  return {
    found: false,
    installDir: '',
    resourcesDir: '',
    asarPath: '',
    backupPath: '',
    error: `Could not automatically locate Antigravity installation. Checked:\n${candidates.join('\n')}`,
  };
}

module.exports = {
  detectAntigravity,
  getCandidatePaths,
};
