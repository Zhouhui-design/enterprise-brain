@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Enterprise Brain 日志查看脚本 (Windows版本)
:: Docker容器化版本

echo.
echo ================================================
echo 📋 Enterprise Brain 日志查看脚本
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

:: 解析参数
set service=
set follow=
set tail=
set since=
set grep=
set no_color=0

:parse_args
if "%1"=="" goto args_done
if "%1"=="mysql" (
    set service=mysql
    shift
    goto parse_args
)
if "%1"=="redis" (
    set service=redis
    shift
    goto parse_args
)
if "%1"=="backend" (
    set service=backend
    shift
    goto parse_args
)
if "%1"=="frontend" (
    set service=frontend
    shift
    goto parse_args
)
if "%1"=="nginx" (
    set service=nginx
    shift
    goto parse_args
)
if "%1"=="jenkins" (
    set service=jenkins
    shift
    goto parse_args
)
if "%1"=="prometheus" (
    set service=prometheus
    shift
    goto parse_args
)
if "%1"=="grafana" (
    set service=grafana
    shift
    goto parse_args
)
if "%1"=="all" (
    set service=all
    shift
    goto parse_args
)
if "%1"=="-f" (
    set follow=--follow
    shift
    goto parse_args
)
if "%1"=="--follow" (
    set follow=--follow
    shift
    goto parse_args
)
if "%1"=="-t" (
    set tail=--tail %2
    shift
    shift
    goto parse_args
)
if "%1"=="--tail" (
    set tail=--tail %2
    shift
    shift
    goto parse_args
)
if "%1"=="-s" (
    set since=--since %2
    shift
    shift
    goto parse_args
)
if "%1"=="--since" (
    set since=--since %2
    shift
    shift
    goto parse_args
)
if "%1"=="-e" (
    set grep=--grep %2
    shift
    shift
    goto parse_args
)
if "%1"=="--grep" (
    set grep=--grep %2
    shift
    shift
    goto parse_args
)
if "%1"=="--no-color" (
    set no_color=1
    shift
    goto parse_args
)
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

echo ❌ 未知参数: %1
goto show_help

:args_done
:: 默认查看所有服务
if "%service%"=="" set service=all

:: 显示帮助信息
if "%service%"=="help" goto show_help

:: 显示服务日志
if "%service%"=="all" goto show_all_logs
goto show_service_logs

:show_help
echo 用法: %0 [服务名] [选项]
echo.
echo 服务名:
echo   mysql      查看MySQL日志
echo   redis      查看Redis日志
echo   backend    查看后端日志
echo   frontend    查看前端日志
echo   nginx      查看Nginx日志
echo   jenkins    查看Jenkins日志
echo   prometheus  查看Prometheus日志
echo   grafana    查看Grafana日志
echo   all        查看所有服务日志（默认）
echo.
echo 选项:
echo   -f, --follow     实时跟踪日志
echo   -t, --tail N     显示最后N行日志（默认100）
echo   -s, --since T    显示指定时间后的日志（如：1h, 30m）
echo   -e, --grep P     过滤包含指定模式的日志
echo   --no-color       不显示颜色
echo   --help, -h      显示此帮助信息
echo.
echo 示例:
echo   %0                    # 查看所有服务日志
echo   %0 mysql -f          # 实时跟踪MySQL日志
echo   %0 backend -t 50     # 查看后端最后50行日志
echo   %0 all -e error      # 查看所有包含error的日志
echo   %0 nginx -s 1h       # 查看Nginx最近1小时的日志
pause
exit /b 0

:show_service_logs
echo [INFO] 显示 %service% 服务日志...

:: 检查容器是否存在
set container_name=enterprise-%service%
docker ps -a --format "{{.Names}}" | findstr /c:"^%container_name%$" >nul
if errorlevel 1 (
    echo ❌ 容器 %container_name% 不存在
    pause
    exit /b 1
)

:: 检查容器是否运行
docker ps --format "{{.Names}}" | findstr /c:"^%container_name%$" >nul
if errorlevel 1 (
    echo ⚠️ 容器 %container_name% 未运行，显示历史日志
)

:: 构建docker logs命令
set docker_cmd=docker logs %container_name%
if defined follow set docker_cmd=%docker_cmd% %follow%
if defined tail set docker_cmd=%docker_cmd% %tail%
if defined since set docker_cmd=%docker_cmd% %since%

:: 执行命令
if defined grep (
    %docker_cmd% 2>&1 | findstr /i "%grep:~8%"
) else (
    %docker_cmd%
)

goto end

:show_all_logs
echo [INFO] 显示所有服务日志...

:: 显示MySQL日志
echo.
echo ========================================
echo 📋 MySQL 服务日志
echo ========================================
echo.
call :show_single_service mysql

:: 显示Redis日志
echo.
echo ========================================
echo 📋 Redis 服务日志
echo ========================================
echo.
call :show_single_service redis

:: 显示后端日志
echo.
echo ========================================
echo 📋 Backend 服务日志
echo ========================================
echo.
call :show_single_service backend

:: 显示前端日志
echo.
echo ========================================
echo 📋 Frontend 服务日志
echo ========================================
echo.
call :show_single_service frontend

:: 显示Nginx日志
echo.
echo ========================================
echo 📋 Nginx 服务日志
echo ========================================
echo.
call :show_single_service nginx

:: 显示Jenkins日志
echo.
echo ========================================
echo 📋 Jenkins 服务日志
echo ========================================
echo.
call :show_single_service jenkins

:: 显示Prometheus日志
echo.
echo ========================================
echo 📋 Prometheus 服务日志
echo ========================================
echo.
call :show_single_service prometheus

:: 显示Grafana日志
echo.
echo ========================================
echo ?? Grafana 服务日志
echo ========================================
echo.
call :show_single_service grafana

goto end

:show_single_service
set container_name=enterprise-%1
docker ps -a --format "{{.Names}}" | findstr /c:"^%container_name%$" >nul
if not errorlevel 1 (
    echo [INFO] 显示 %1 服务日志...
    if defined grep (
        docker logs %container_name% %follow% %tail% %since% 2>&1 | findstr /i "%grep:~8%"
    ) else (
        docker logs %container_name% %follow% %tail% %since%
    )
)
goto :eof

:end
echo.
echo 📋 日志查看完成
echo.
pause
