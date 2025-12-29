@echo off
echo ========================================
echo 企业大脑系统 - 启动脚本
echo ========================================
echo.

echo [1/3] 清理旧进程...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] 启动后端服务 (端口: 3005)...
cd /d "%~dp0backend"
start "Backend-Server" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

echo [3/3] 启动前端服务 (端口: 3003)...
cd /d "%~dp007-frontend"
start "Frontend-Server" cmd /k "npx vite --host 0.0.0.0 --port 3003"

echo.
echo ========================================
echo 服务启动完成!
echo ========================================
echo 前端地址: http://localhost:3003
echo 后端地址: http://localhost:3005
echo ========================================
echo.
echo 提示: 请等待10-15秒让服务完全启动
timeout /t 5 /nobreak >nul

echo 正在打开浏览器...
start http://localhost:3003/auth/login

echo.
echo 脚本执行完成，按任意键关闭此窗口...
pause >nul
