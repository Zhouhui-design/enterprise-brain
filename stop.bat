@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Enterprise Brain 停止脚本 (Windows版本)
:: Docker容器化版本

echo.
echo ================================================
echo 🛑 Enterprise Brain 停止脚本
echo ================================================
echo.

:: 检查Docker环境
echo [INFO] 检查Docker环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose未安装
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过
echo.

:: 检查是否有运行中的服务
echo [INFO] 检查服务状态...
docker-compose ps -q >nul 2>&1
if errorlevel 1 (
    echo ⚠️ 没有运行中的服务
    goto end
)

:: 停止服务
echo [INFO] 停止Enterprise Brain服务...
docker-compose down
if errorlevel 1 (
    echo ❌ 服务停止失败
    pause
    exit /b 1
)

echo [INFO] 等待容器停止...
timeout /t 5 /nobreak >nul

:: 检查是否还有运行中的容器
docker-compose ps -q >nul 2>&1
if not errorlevel 1 (
    echo [INFO] 检测到仍有容器运行，强制停止...
    docker-compose down --force
    if errorlevel 1 (
        echo ❌ 强制停止失败
        pause
        exit /b 1
    )
)

echo ✅ 服务已停止
echo.

:: 检查是否需要备份
set backup=0
if "%1"=="--backup" set backup=1
if "%1"=="-backup" set backup=1

if %backup%==1 (
    echo [INFO] 备份数据...
    set backup_dir=backups\manual_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set backup_dir=%backup_dir: =0%
    
    if not exist "%backup_dir%" mkdir "%backup_dir%"
    
    if exist "data\mysql" (
        xcopy /E /I /H "data\mysql" "%backup_dir%\mysql" >nul
        echo ✅ MySQL数据已备份
    )
    
    if exist "data\redis" (
        xcopy /E /I /H "data\redis" "%backup_dir%\redis" >nul
        echo ✅ Redis数据已备份
    )
    
    if exist "data\uploads" (
        xcopy /E /I /H "data\uploads" "%backup_dir%\uploads" >nul
        echo ✅ 上传文件已备份
    )
    
    if exist ".env" copy ".env" "%backup_dir%\" >nul
    if exist "docker-compose.yml" copy "docker-compose.yml" "%backup_dir%\" >nul
    
    echo ✅ 数据备份完成: %backup_dir%
    echo.
)

:: 检查是否需要清理
set cleanup=0
if "%2"=="--cleanup" set cleanup=1
if "%2"=="-cleanup" set cleanup=1

if %cleanup%==1 (
    echo [INFO] 清理Docker资源...
    
    :: 清理停止的容器
    docker container prune -f >nul 2>&1
    
    :: 清理未使用的镜像
    docker image prune -f >nul 2>&1
    
    :: 清理未使用的网络
    docker network prune -f >nul 2>&1
    
    echo ✅ 资源清理完成
    echo.
)

:end
:: 检查最终状态
echo [INFO] 检查服务状态...
docker-compose ps -q >nul 2>&1
if errorlevel 1 (
    echo ✅ 所有服务已停止
) else (
    echo ⚠️ 仍有服务在运行
    docker-compose ps
)

echo.
echo 🎉 Enterprise Brain 停止完成！
echo.
echo 💡 提示：
echo    • 重新启动: start.bat
echo    • 查看日志: logs.bat
echo    • 查看状态: status.bat
echo.
pause
