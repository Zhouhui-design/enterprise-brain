@echo off
chcp 65001 >nul
echo ========================================
echo 企业大脑系统 - 快速恢复脚本
echo ========================================
echo.
echo 此脚本用于从远程仓库恢复完整项目
echo.

set TARGET_DIR=%~dp0
if "%TARGET_DIR:~-1%"=="\" set TARGET_DIR=%TARGET_DIR:~0,-1%

echo 目标目录: %TARGET_DIR%
echo.

echo [步骤1/5] 拉取最新代码...
git pull origin main
if %errorlevel% neq 0 (
    echo ⚠ 尝试从master分支拉取...
    git pull origin master
)
echo.

echo [步骤2/5] 恢复数据库...
if exist "full-backup\enterprise_brain_latest.db" (
    if not exist "data" mkdir "data"
    copy "full-backup\enterprise_brain_latest.db" "data\enterprise_brain.db" /Y
    echo ✓ 主数据库已恢复
) else (
    echo ⚠ 未找到主数据库备份
)

if exist "full-backup\enterprise_latest.db" (
    if not exist "backend\database" mkdir "backend\database"
    copy "full-backup\enterprise_latest.db" "backend\database\enterprise.db" /Y
    echo ✓ 后端数据库已恢复
) else (
    echo ⚠ 未找到后端数据库备份
)
echo.

echo [步骤3/5] 恢复配置文件...
if exist "full-backup\config" (
    if not exist "backend\config" mkdir "backend\config"
    xcopy "full-backup\config" "backend\config\" /E /I /Y >nul
    echo ✓ 配置文件已恢复
)
echo.

echo [步骤4/5] 安装依赖...
echo 正在安装后端依赖...
cd /d "%TARGET_DIR%\backend"
call npm install
echo.

echo 正在安装前端依赖...
cd /d "%TARGET_DIR%\07-frontend"
call npm install
echo.

echo [步骤5/5] 清理缓存...
if exist "07-frontend\node_modules\.vite" (
    rmdir /S /Q "07-frontend\node_modules\.vite"
    echo ✓ Vite缓存已清理
)
echo.

echo ========================================
echo ✅ 恢复完成！
echo ========================================
echo.
echo 📋 恢复内容：
echo   ✓ 源代码
echo   ✓ 数据库
echo   ✓ 配置文件
echo   ✓ 依赖包
echo.
echo 🚀 下一步：
echo   运行 start-all-services.bat 启动服务
echo.
pause
