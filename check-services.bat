@echo off
chcp 65001 >nul
echo ================================
echo 企业大脑系统 - 服务状态检查
echo ================================
echo.

echo [1] Node.js 进程检查
powershell -Command "Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Select-Object Id,ProcessName,StartTime | Format-Table -AutoSize"
echo.

echo [2] 端口占用情况
echo.
echo 后端服务 (3005)：
netstat -ano | findstr ":3005"
echo.
echo 前端服务 (3003)：
netstat -ano | findstr ":3003"
echo.

echo [3] 服务可访问性测试
echo.
echo 测试后端API...
curl -s -o nul -w "后端健康检查: %%{http_code}\n" http://localhost:3005/health 2>nul
if %errorlevel% neq 0 (
    echo 后端健康检查: 无法连接
)
echo.
echo 测试前端页面...
curl -s -o nul -w "前端访问状态: %%{http_code}\n" http://localhost:3003 2>nul
if %errorlevel% neq 0 (
    echo 前端访问状态: 无法连接
)
echo.

echo ================================
echo 检查完成！
echo ================================
echo.
echo 💡 提示：
echo    - LISTENING 状态表示服务正常运行
echo    - 200/302 状态码表示服务可访问
echo.
pause
