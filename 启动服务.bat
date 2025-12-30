@echo off
chcp 65001 >nul
echo =================================
echo 企业级Brain - 快速启动脚本
echo =================================

echo 🔍 检查环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 请先安装 Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js 环境正常
echo.

echo 🚀 启动服务...

echo [1/3] 启动后端服务...
start "后端服务" /min cmd /k "cd /d %~dp0backend && node server.js"

echo [2/3] 启动前端服务...
timeout /t 2 /nobreak >nul
start "前端服务" /min cmd /k "cd /d %~dp007-frontend && npx vite --port 3006 --host 0.0.0.0"

echo [3/3] 等待服务启动...
timeout /t 5 /nobreak >nul

echo.
echo =================================
echo 🎯 服务启动完成！
echo.
echo 📱 访问地址：
echo    前端: http://localhost:3006
echo    后端: http://localhost:3005
echo    API文档: http://localhost:3005/api
echo.
echo 💡 提示：
echo    - 首次启动需要2-3分钟
echo    - 如果页面空白，请等待后端完全启动
echo    - 关闭此窗口不会停止服务
echo    - 按 Ctrl+C 可停止当前窗口显示
echo =================================
echo.
echo 服务运行中... (按任意键关闭此窗口)
pause >nul
