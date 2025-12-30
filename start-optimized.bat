@echo off
chcp 65001 >nul
echo =================================
echo 企业级Brain 优化启动脚本
echo =================================
echo.

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
echo 📦 安装依赖（使用国内镜像）...
cd /d "%~dp0backend"
call npm config set registry https://registry.npmmirror.com
call npm install
if %errorlevel% neq 0 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 2
)

echo ✅ 后端依赖安装完成

echo.
cd /d "%~dp007-frontend"
call npm install
if %errorlevel% neq 0 (
    echo [错误] 前端依赖安装失败
    pause
    exit /b 3
)

echo ✅ 前端依赖安装完成

echo.
echo 🚀 启动服务...
echo 后端服务启动中...
start "企业级Brain-后端" /min cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 3 /nobreak >nul

echo 前端服务启动中...
start "企业级Brain-前端" /min cmd /k "cd /d %~dp007-frontend && npm run dev"

echo.
echo =================================
echo 🎯 服务启动完成！
echo.
echo 📱 访问地址：
echo    前端: http://localhost:5173
echo    后端: http://localhost:3005
echo.
echo 💡 提示：
echo    - 首次启动可能需要2-3分钟
echo    - 如遇端口冲突，请检查端口占用
echo    - 日志文件位置: ../logs/
echo =================================
echo.
echo 按任意键关闭此窗口...
pause >nul
