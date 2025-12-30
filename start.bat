@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Enterprise Brain 一键启动脚本 (Windows版本)
:: Docker容器化版本

echo.
echo ================================================
echo 🚀 Enterprise Brain Docker容器化启动脚本
echo ================================================
echo.

:: 检查Docker是否安装
echo [INFO] 检查Docker环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装，请先安装Docker Desktop
    echo 📥 下载地址: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose未安装，请先安装Docker Compose
    echo 📥 下载地址: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

:: 检查Docker服务是否运行
echo [INFO] 检查Docker服务状态...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker服务未启动，请启动Docker Desktop
    echo 💡 启动方法: 双击桌面上的Docker Desktop图标
    pause
    exit /b 1
)

echo ✅ Docker环境检查通过
echo.

:: 检查端口占用
echo [INFO] 检查端口占用情况...
netstat -an | findstr ":80 " >nul 2>&1
if not errorlevel 1 (
    echo ⚠️ 端口80已被占用 (Nginx)
    echo 💡 请检查是否有其他Web服务正在运行
    choice /c yn /m "是否继续启动? (y/n)"
    if errorlevel 2 exit /b 1
)

netstat -an | findstr ":3306" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️ 端口3306已被占用 (MySQL)
    echo 💡 请检查是否有MySQL服务正在运行
    choice /c yn /m "是否继续启动? (y/n)"
    if errorlevel 2 exit /b 1
)

netstat -an | findstr ":6379" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️ 端口6379已被占用 (Redis)
    echo ?? 请检查是否有Redis服务正在运行
    choice /c yn /m "是否继续启动? (y/n)"
    if errorlevel 2 exit /b 1
)

echo ✅ 端口检查完成
echo.

:: 创建必要的目录
echo [INFO] 创建必要的目录...
if not exist "data\mysql" mkdir "data\mysql"
if not exist "data\redis" mkdir "data\redis"
if not exist "data\uploads" mkdir "data\uploads"
if not exist "data\backups" mkdir "data\backups"
if not exist "logs\nginx" mkdir "logs\nginx"
if not exist "logs\mysql" mkdir "logs\mysql"
if not exist "logs\redis" mkdir "logs\redis"
if not exist "logs\backend" mkdir "logs\backend"
if not exist "monitoring\prometheus" mkdir "monitoring\prometheus"
if not exist "monitoring\grafana\dashboards" mkdir "monitoring\grafana\dashboards"
if not exist "monitoring\grafana\datasources" mkdir "monitoring\grafana\datasources"

echo ✅ 目录创建完成
echo.

:: 拉取最新镜像
echo [INFO] 拉取Docker镜像...
docker-compose pull
if errorlevel 1 (
    echo ❌ 镜像拉取失败
    pause
    exit /b 1
)

:: 构建自定义镜像
echo [INFO] 构建应用镜像...
docker-compose build --no-cache
if errorlevel 1 (
    echo ❌ 镜像构建失败
    pause
    exit /b 1
)

:: 启动服务
echo [INFO] 启动所有服务...
docker-compose up -d
if errorlevel 1 (
    echo ❌ 服务启动失败
    pause
    exit /b 1
)

echo ✅ 服务启动完成
echo.

:: 等待服务就绪
echo [INFO] 等待服务就绪...
set max_attempts=60
set attempt=1

:wait_loop
echo [INFO] 检查服务状态... (尝试 %attempt%/%max_attempts%)

:: 检查MySQL
docker-compose exec -T mysql mysqladmin ping -h localhost --silent >nul 2>&1
if not errorlevel 1 (
    echo ✅ MySQL服务就绪
    set mysql_ready=1
)

:: 检查Redis
docker-compose exec -T redis redis-cli ping >nul 2>&1
if not errorlevel 1 (
    echo ✅ Redis服务就绪
    set redis_ready=1
)

:: 检查后端
curl -s http://localhost:3005/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ 后端服务就绪
    set backend_ready=1
)

:: 检查前端
curl -s http://localhost:3006/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ 前端服务就绪
    set frontend_ready=1
)

:: 检查Nginx
curl -s http://localhost/health >nul 2>&1
if not errorlevel 1 (
    echo ✅ Nginx服务就绪
    set nginx_ready=1
)

if defined mysql_ready if defined redis_ready if defined backend_ready if defined frontend_ready if defined nginx_ready (
    echo 🎉 所有服务已就绪！
    goto show_info
)

timeout /t 5 /nobreak >nul
set /a attempt+=1
if %attempt% leq %max_attempts% goto wait_loop

echo ❌ 服务启动超时，请检查日志
docker-compose logs
pause
exit /b 1

:show_info
echo.
echo 📋 访问信息：
echo.
echo 🌐 主应用访问地址：
echo    • HTTP:  http://localhost
echo    • 局域网: http://192.168.x.x (请替换为实际IP)
echo.
echo 🔧 管理工具访问地址：
echo    • Jenkins:    http://localhost:8080
echo    • Prometheus: http://localhost:9090
echo    • Grafana:    http://localhost:3001
echo    • API文档:    http://localhost/api-docs
echo.
echo 📊 服务状态：
echo    • 健康检查:  http://localhost/health
echo    • Nginx状态: http://localhost/nginx_status (仅内网)
echo.
echo 🔑 默认账号密码：
echo    • Grafana:    admin / admin123456
echo    • MySQL:      enterprise_user / enterprise_pass
echo    • Redis:      (无密码)
echo.
echo 💡 管理命令：
echo    • 查看日志:  logs.bat
echo    • 停止服务:  stop.bat
echo    • 重启服务:  restart.bat
echo    • 查看状态:  status.bat
echo.

echo 🎉 Enterprise Brain 启动完成！
echo.
echo 💡 提示：首次启动可能需要较长时间初始化数据库
echo 💡 如果遇到问题，请运行 logs.bat 查看详细日志
echo.
pause
