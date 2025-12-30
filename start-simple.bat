@echo off
echo =================================
echo 企业级Brain 简化启动脚本
echo =================================

echo.
echo 1. 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo [错误] 未安装Node.js，请先安装
    pause
    exit /b
)

echo.
echo 2. 启动后端服务...
cd /d "%~dp0backend"
start "后端服务" cmd /k "npm start"

echo.
echo 3. 等待3秒后启动前端...
timeout /t 3 /nobreak > nul

echo.
echo 4. 启动前端服务...
cd /d "%~dp007-frontend"
start "前端服务" cmd /k "npm run dev"

echo.
echo =================================
echo 服务启动完成！
echo 后端地址: http://localhost:3005
echo 前端地址: http://localhost:5173 或 http://localhost:3000
echo =================================
echo.
echo 按任意键关闭此窗口...
pause > nul