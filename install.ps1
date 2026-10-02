# Antigravity-CN PowerShell 一键安装脚本
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       Antigravity-CN 官方级全界面汉化一键安装程序" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "[错误] 未检测到 Node.js，请先安装 Node.js (https://nodejs.org/)" -ForegroundColor Red
    Read-Host "按回车键退出..."
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path "$scriptDir\node_modules\@electron\asar")) {
    Write-Host "[提示] 正在安装依赖工具..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "install --no-audit --no-fund" -WorkingDirectory $scriptDir -NoNewWindow -Wait
}

Write-Host "`n正在运行补丁程序..." -ForegroundColor Yellow
& node "$scriptDir\bin\cli.js" install $args

Write-Host "`n按任意键退出..."
[Console]::ReadKey() | Out-Null
