@echo off
chcp 65001 >nul
echo ================================
echo 企业大脑系统 - 停止所有服务
echo ================================
echo.

echo 正在停止所有Node.js进程...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ 所有服务已停止
) else (
    echo ℹ 没有运行中的Node进程
)
echo.

echo 当前端口占用情况：
netstat -ano | findstr ":3003" 2>nul
netstat -ano | findstr ":3005" 2>nul
echo.

echo ================================
echo 停止完成！
echo ================================
pause
