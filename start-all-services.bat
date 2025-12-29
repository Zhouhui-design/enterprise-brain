@echo off
chcp 65001 >nul
echo ================================
echo 企业大脑系统 - 服务启动脚本
echo ================================
echo.

REM 设置项目根目录
set PROJECT_ROOT=c:\Users\sardenesy\Projects\enterpise-brain

REM 第1步：停止所有现有Node进程
echo [1/6] 停止所有现有Node进程...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo ✓ 已停止现有进程
) else (
    echo ℹ 没有运行中的Node进程
)
echo.

REM 第2步：清理前端缓存
echo [2/6] 清理前端Vite缓存...
if exist "%PROJECT_ROOT%\07-frontend\node_modules\.vite" (
    rmdir /S /Q "%PROJECT_ROOT%\07-frontend\node_modules\.vite" 2>nul
    echo ✓ Vite缓存已清理
) else (
    echo ℹ Vite缓存不存在
)
echo.

REM 第3步：检查npm依赖
echo [3/6] 检查npm依赖...
cd /d "%PROJECT_ROOT%\backend"
if not exist "node_modules" (
    echo ⚠ 后端依赖缺失，正在安装...
    call npm install
)
cd /d "%PROJECT_ROOT%\07-frontend"
if not exist "node_modules" (
    echo ⚠ 前端依赖缺失，正在安装...
    call npm install
)
echo ✓ 依赖检查完成
echo.

REM 第4步：启动后端服务
echo [4/6] 启动后端服务 (端口3005)...
cd /d "%PROJECT_ROOT%\backend"
start "后端-3005" cmd /k "node server.js"
echo ✓ 后端服务启动命令已执行
echo.

REM 第5步：等待后端启动
echo [5/6] 等待后端服务就绪...
powershell -Command "Start-Sleep 5"
netstat -ano | findstr ":3005" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✓ 后端服务已就绪 (端口3005)
) else (
    echo ⚠ 后端服务可能需要更长时间启动，请稍后检查
)
echo.

REM 第6步：启动前端服务
echo [6/6] 启动前端服务 (端口3003)...
cd /d "%PROJECT_ROOT%\07-frontend"
start "前端-3003" cmd /k "npm run dev"
echo ✓ 前端服务启动命令已执行
echo.

REM 第7步：等待前端启动并验证
echo [7/7] 等待前端服务就绪...
powershell -Command "Start-Sleep 10"
netstat -ano | findstr ":3003" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo ✓ 前端服务已就绪 (端口3003)
) else (
    echo ⚠ 前端服务可能需要更长时间启动，请稍后检查
)
echo.

REM 显示服务状态
echo ================================
echo 服务状态检查
echo ================================
netstat -ano | findstr ":3003" | findstr "LISTENING"
netstat -ano | findstr ":3005" | findstr "LISTENING"
echo.

echo ================================
echo 启动完成！
echo ================================
echo.
echo 📌 访问地址：
echo    前端: http://localhost:3003
echo    后端: http://localhost:3005
echo.
echo 💡 提示：
echo    - 如果服务未启动，请查看对应的CMD窗口查看错误信息
echo    - 前端窗口标题：前端-3003
echo    - 后端窗口标题：后端-3005
echo.
echo 按任意键在浏览器中打开前端...
pause >nul
start http://localhost:3003
