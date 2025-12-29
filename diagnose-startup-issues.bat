@echo off
chcp 65001 >nul
echo ================================
echo 企业大脑系统 - 启动问题诊断
echo ================================
echo.

set PROJECT_ROOT=c:\Users\sardenesy\Projects\enterpise-brain
set ERROR_FOUND=0

echo [检查1] Node.js 环境
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装或不在PATH中
    set ERROR_FOUND=1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo ✓ Node.js 版本: %%i
)
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装或不在PATH中
    set ERROR_FOUND=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo ✓ npm 版本: %%i
)
echo.

echo [检查2] 项目目录结构
if not exist "%PROJECT_ROOT%\backend" (
    echo ❌ backend 目录不存在
    set ERROR_FOUND=1
) else (
    echo ✓ backend 目录存在
)
if not exist "%PROJECT_ROOT%\07-frontend" (
    echo ❌ 07-frontend 目录不存在
    set ERROR_FOUND=1
) else (
    echo ✓ 07-frontend 目录存在
)
echo.

echo [检查3] package.json 文件
if not exist "%PROJECT_ROOT%\backend\package.json" (
    echo ❌ backend/package.json 不存在
    set ERROR_FOUND=1
) else (
    echo ✓ backend/package.json 存在
    findstr /C:"\"name\"" "%PROJECT_ROOT%\backend\package.json"
)
if not exist "%PROJECT_ROOT%\07-frontend\package.json" (
    echo ❌ 07-frontend/package.json 不存在
    set ERROR_FOUND=1
) else (
    echo ✓ 07-frontend/package.json 存在
    findstr /C:"\"name\"" "%PROJECT_ROOT%\07-frontend\package.json"
)
echo.

echo [检查4] node_modules 依赖
if not exist "%PROJECT_ROOT%\backend\node_modules" (
    echo ⚠ backend/node_modules 不存在 - 需要运行 npm install
    set ERROR_FOUND=1
) else (
    echo ✓ backend/node_modules 存在
)
if not exist "%PROJECT_ROOT%\07-frontend\node_modules" (
    echo ⚠ 07-frontend/node_modules 不存在 - 需要运行 npm install
    set ERROR_FOUND=1
) else (
    echo ✓ 07-frontend/node_modules 存在
)
echo.

echo [检查5] 主要入口文件
if not exist "%PROJECT_ROOT%\backend\server.js" (
    echo ❌ backend/server.js 不存在
    set ERROR_FOUND=1
) else (
    echo ✓ backend/server.js 存在
)
if not exist "%PROJECT_ROOT%\07-frontend\vite.config.ts" (
    echo ⚠ 07-frontend/vite.config.ts 不存在（可能使用其他配置文件）
) else (
    echo ✓ 07-frontend/vite.config.ts 存在
)
echo.

echo [检查6] 端口占用情况
netstat -ano | findstr ":3005" >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠ 端口3005已被占用
    netstat -ano | findstr ":3005"
) else (
    echo ✓ 端口3005空闲
)
netstat -ano | findstr ":3003" >nul 2>&1
if %errorlevel% == 0 (
    echo ⚠ 端口3003已被占用
    netstat -ano | findstr ":3003"
) else (
    echo ✓ 端口3003空闲
)
echo.

echo [检查7] 数据库配置
if exist "%PROJECT_ROOT%\backend\config\database.js" (
    echo ✓ 数据库配置文件存在
) else (
    echo ⚠ 数据库配置文件不存在
)
if exist "%PROJECT_ROOT%\backend\database.db" (
    echo ✓ SQLite数据库文件存在
) else (
    echo ℹ SQLite数据库文件不存在（可能使用MySQL）
)
echo.

echo [检查8] npm缓存状态
npm cache verify >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ npm缓存正常
) else (
    echo ⚠ npm缓存可能有问题，建议运行: npm cache clean --force
)
echo.

echo ================================
echo 诊断结果
echo ================================
if %ERROR_FOUND% == 1 (
    echo.
    echo ❌ 发现问题！请根据上述提示修复后重试
    echo.
    echo 🔧 常见修复方法：
    echo    1. 安装依赖: 
    echo       cd %PROJECT_ROOT%\backend ^&^& npm install
    echo       cd %PROJECT_ROOT%\07-frontend ^&^& npm install
    echo.
    echo    2. 清理缓存:
    echo       npm cache clean --force
    echo.
    echo    3. 释放端口:
    echo       运行 stop-all-services.bat
    echo.
) else (
    echo.
    echo ✓ 所有检查通过！可以启动服务
    echo.
    echo 运行 start-all-services.bat 启动服务
    echo.
)
echo ================================
pause
