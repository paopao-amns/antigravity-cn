/**
 * Asar Archive Utilities
 * Wrapper around @electron/asar with safe temp directory handling and validations.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const asar = require('@electron/asar');

/**
 * Creates a unique temporary working directory
 */
function createTempDir(prefix = 'agy-cn-') {
  const tmpBase = os.tmpdir();
  const dirName = `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const fullPath = path.join(tmpBase, dirName);
  fs.mkdirSync(fullPath, { recursive: true });
  return fullPath;
}

/**
 * Recursively deletes a directory
 */
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Extracts an asar archive to a destination directory
 * @param {string} asarPath
 * @param {string} destDir
 */
function extractAsar(asarPath, destDir) {
  if (!fs.existsSync(asarPath)) {
    throw new Error(`Asar archive not found: ${asarPath}`);
  }
  fs.mkdirSync(destDir, { recursive: true });
  asar.extractAll(asarPath, destDir);
}

/**
 * Packs a directory into an asar archive
 * @param {string} srcDir
 * @param {string} destAsarPath
 */
async function packAsar(srcDir, destAsarPath) {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source directory not found: ${srcDir}`);
  }
  // Remove existing target file if any to prevent collision
  if (fs.existsSync(destAsarPath)) {
    fs.unlinkSync(destAsarPath);
  }
  await asar.createPackage(srcDir, destAsarPath);
}

module.exports = {
  createTempDir,
  removeDir,
  extractAsar,
  packAsar,
};
