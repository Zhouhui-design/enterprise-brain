@echo off
chcp 65001 >nul
echo ================================
echo 企业大脑系统 - 重启所有服务
echo ================================
echo.

REM 先停止
call "%~dp0stop-all-services.bat"
echo.

REM 等待2秒
echo 等待进程完全停止...
powershell -Command "Start-Sleep 2"
echo.

REM 再启动
call "%~dp0start-all-services.bat"
