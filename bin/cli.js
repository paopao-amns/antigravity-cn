#!/usr/bin/env node

/**
 * Antigravity-CN CLI
 * Command line utility to install, check, and restore Chinese localization for Antigravity.
 */

const { getStatus, installPatch, restoreOriginal, killAntigravity } = require('../src/patcher/patcher');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0] || 'help';

function parseFlags() {
  const flags = {
    customPath: null,
    force: false,
    kill: false,
  };
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--path' && args[i + 1]) {
      flags.customPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--force' || args[i] === '-f') {
      flags.force = true;
    } else if (args[i] === '--kill' || args[i] === '-k') {
      flags.kill = true;
    }
  }
  return flags;
}

const flags = parseFlags();

async function main() {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║         🚀 Antigravity-CN 官方级全界面汉化补丁        ║
  ║      Community Chinese Localization for Antigravity   ║
  ╚═══════════════════════════════════════════════════════╝
  `);

  switch (command.toLowerCase()) {
    case 'install':
    case 'i': {
      try {
        console.log('[1/3] 正在检测 Antigravity 安装路径...');
        const status = getStatus(flags.customPath);
        if (!status.installed) {
          console.error(`❌ 未找到 Antigravity 安装路径。`);
          console.error(status.message);
          console.error(`提示：可以使用 --path 参数手动指定，例如:`);
          console.error(`  npx antigravity-chinese install --path "C:\\Program Files\\antigravity"`);
          process.exit(1);
        }

        console.log(`✓ 找到安装目录: ${status.installDir}`);
        if (status.isRunning) {
          if (flags.kill) {
            console.log('\n[提示] 正在自动关闭运行中的 Antigravity 进程...');
            killAntigravity();
            await new Promise((r) => setTimeout(r, 1500));
          } else if (!flags.force) {
            console.warn(`\n⚠️ 警告: 检测到 Antigravity 正在运行！`);
            console.warn(`为了防止文件被系统锁定导致安装失败，请先彻底关闭 Antigravity 窗口与托盘程序。`);
            console.warn(`提示：您也可以添加 --kill 参数自动关闭并安装:`);
            console.warn(`  npx antigravity-chinese install --kill\n`);
            process.exit(1);
          }
        }

        console.log('\n[2/3] 正在应用汉化补丁...');
        await installPatch({ customPath: flags.customPath, force: flags.force });

        console.log('\n[3/3] 安装完成！');
        console.log(`\n======================================================`);
        console.log(`🎉 Antigravity 中文补丁已就绪！`);
        console.log(`- 现在可以重新启动 Antigravity 体验全中文界面。`);
        console.log(`- 在界面中按下 Ctrl+Shift+L (Mac: Cmd+Shift+L) 可开启「词条检查器」。`);
        console.log(`- 若想还原官方英文版，随时运行: npx antigravity-chinese restore`);
        console.log(`======================================================\n`);
      } catch (err) {
        console.error(`\n❌ 安装失败: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'restore':
    case 'r':
    case 'uninstall': {
      try {
        console.log('正在还原官方原始版本...');
        restoreOriginal({ customPath: flags.customPath, force: flags.force });
        console.log('✓ 已成功恢复官方英文版。');
      } catch (err) {
        console.error(`❌ 还原失败: ${err.message}`);
        process.exit(1);
      }
      break;
    }

    case 'status':
    case 's': {
      const status = getStatus(flags.customPath);
      console.log('--- 当前状态报告 ---');
      console.log(`是否检测到安装: ${status.installed ? '是' : '否'}`);
      if (status.installed) {
        console.log(`安装路径:       ${status.installDir}`);
        console.log(`资源目录:       ${status.resourcesDir}`);
        console.log(`是否已打补丁:   ${status.patched ? '已汉化 ✓' : '官方英文版'}`);
        console.log(`备份文件存在:   ${status.backupExists ? '是 ✓' : '否'}`);
        console.log(`当前运行状态:   ${status.isRunning ? '运行中 (需关闭以安装)' : '未运行'}`);
      } else {
        console.log(status.message);
      }
      break;
    }

    case 'help':
    case '--help':
    case '-h':
    default: {
      console.log(`
使用方式 (Usage):
  npx antigravity-chinese <command> [options]

常用命令 (Commands):
  install, i       一键安装中文汉化补丁 (自动备份原始文件)
  restore, r       一键还原为官方英文原版
  status, s        查看 Antigravity 安装与汉化状态
  help, -h         显示帮助信息

选项参数 (Options):
  --path <dir>     手动指定 Antigravity 的安装目录或 resources 目录
  --kill, -k       自动关闭正在运行的 Antigravity 进程并继续安装
  --force, -f      忽略进程运行检测，强制执行操作

示例 (Examples):
  npx antigravity-chinese install
  npx antigravity-chinese install --kill
  npx antigravity-chinese restore
  npx antigravity-chinese install --path "D:\\Software\\antigravity"
      `);
      break;
    }
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
