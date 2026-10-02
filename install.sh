#!/usr/bin/env bash
set -e

echo "========================================================"
echo "       Antigravity-CN 官方级全界面汉化一键安装程序"
echo "========================================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js (https://nodejs.org/)"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -d "$SCRIPT_DIR/node_modules/@electron/asar" ]; then
    echo "📦 正在安装依赖工具..."
    (cd "$SCRIPT_DIR" && npm install --no-audit --no-fund)
fi

echo "🚀 正在运行补丁程序..."
node "$SCRIPT_DIR/bin/cli.js" install "$@"
