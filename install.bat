@echo off
chcp 65001 >nul
title Antigravity-CN 一键汉化安装工具

echo ========================================================
echo        Antigravity-CN 官方级全界面汉化一键安装程序
echo ========================================================
echo.

node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js 环境，请先安装 Node.js (https://nodejs.org/)
    pause
    exit /b 1
)

echo [1/3] 正在检查依赖环境...
if not exist "%~dp0node_modules\@electron\asar" (
    echo [提示] 正在安装必要解包工具，请稍候...
    call npm install --no-audit --no-fund
)

echo.
echo [2/3] 正在执行汉化补丁安装...
node "%~dp0bin\cli.js" install

echo.
echo ========================================================
echo 操作完成。如果安装成功，请启动 Antigravity 查看效果！
echo ========================================================
pause
