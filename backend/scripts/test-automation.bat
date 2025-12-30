@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Enterprise Brain 自动化测试脚本 (Windows版本)
:: 用于CI/CD流水线中的测试执行

echo.
echo ================================================
echo 🧪 Enterprise Brain 自动化测试脚本
echo ================================================
echo.

:: 配置变量
set TEST_TYPE=%1
if "%TEST_TYPE%"=="" set TEST_TYPE=all
set COVERAGE=%2
if "%COVERAGE%"=="" set COVERAGE=true
set REPORTS_DIR=test-results
set COVERAGE_DIR=coverage

:: 检查参数
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

:: 创建测试报告目录
call :create_report_dirs

:: 检查前置条件
call :check_prerequisites

:: 根据测试类型执行相应测试
if "%TEST_TYPE%"=="unit" (
    call :run_unit_tests
) else if "%TEST_TYPE%"=="integration" (
    call :run_integration_tests
) else if "%TEST_TYPE%"=="e2e" (
    call :run_e2e_tests
) else if "%TEST_TYPE%"=="performance" (
    call :run_performance_tests
) else if "%TEST_TYPE%"=="security" (
    call :run_security_tests
) else if "%TEST_TYPE%"=="contract" (
    call :run_contract_tests
) else (
    echo [INFO] 运行所有测试套件...
    call :run_unit_tests
    call :run_integration_tests
    call :run_contract_tests
    if defined CI if "%CI%"=="true" call :run_e2e_tests
    if defined JENKINS_URL if not "%JENKINS_URL%"=="" call :run_e2e_tests
    call :run_security_tests
)

:: 生成测试报告
call :generate_test_report

:: 清理测试环境
call :cleanup_test_env

echo.
echo ?? 自动化测试完成！
echo 📊 测试报告位置: %REPORTS_DIR%\index.html
echo.
pause
exit /b 0

:show_help
echo 用法: %0 [测试类型] [覆盖率] [报告目录]
echo.
echo 测试类型:
echo   unit         仅运行单元测试
echo   integration  仅运行集成测试
echo   e2e          仅运行E2E测试
echo   performance  仅运行性能测试
echo   security     仅运行安全测试
echo   contract     仅运行契约测试
echo   all          运行所有测试（默认）
echo.
echo 覆盖率:
echo   true         启用代码覆盖率（默认）
echo   false        禁用代码覆盖率
echo.
echo 示例:
echo   %0 unit true
echo   %0 all
echo   %0 performance false
pause
exit /b 0

:create_report_dirs
echo [INFO] 📁 创建测试报告目录...
if not exist "%REPORTS_DIR%\unit" mkdir "%REPORTS_DIR%\unit"
if not exist "%REPORTS_DIR%\integration" mkdir "%REPORTS_DIR%\integration"
if not exist "%REPORTS_DIR%\e2e" mkdir "%REPORTS_DIR%\e2e"
if not exist "%REPORTS_DIR%\performance" mkdir "%REPORTS_DIR%\performance"
if not exist "%REPORTS_DIR%\security" mkdir "%REPORTS_DIR%\security"
if not exist "%COVERAGE_DIR%" mkdir "%COVERAGE_DIR%"
echo ✅ 测试报告目录创建完成
goto :eof

:check_prerequisites
echo [INFO] 🔍 检查测试前置条件...

:: 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装
    exit /b 1
)

:: 检查npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未安装
    exit /b 1
)

:: 检查依赖
if not exist "node_modules" (
    echo [INFO] ⚠️ 依赖未安装，正在安装...
    npm install
)

:: 检查测试数据库
docker ps --format "{{.Names}}" | findstr /c:"test-mysql" >nul 2>&1
if errorlevel 1 (
    echo [INFO] ⚠️ 测试数据库未运行，正在启动...
    docker run -d --name test-mysql -e MYSQL_ROOT_PASSWORD=test123 -e MYSQL_DATABASE=test_enterprise -e MYSQL_USER=test_user -e MYSQL_PASSWORD=test_pass -p 3307:3306 mysql:8.0 --default-authentication-plugin=mysql_native_password
    
    echo [INFO] ⏳ 等待数据库启动...
    set /a count=0
:wait_mysql
docker run --rm mysql:8.0 mysql -h 127.0.0.1 -P 3307 -u test_user -ptest_pass test_enterprise -e "SELECT 1;" >nul 2>&1
if not errorlevel 1 goto mysql_ready
set /a count+=1
if %count% lss 30 (
    echo 等待数据库启动... (%count%/30)
    timeout /t 2 /nobreak >nul
    goto wait_mysql
)
echo ❌ 数据库启动超时
exit /b 1
:mysql_ready
    echo ✅ 数据库启动完成
)

:: 检查测试Redis
docker ps --format "{{.Names}}" | findstr /c:"test-redis" >nul 2>&1
if errorlevel 1 (
    echo [INFO] ⚠️ 测试Redis未运行，正在启动...
    docker run -d --name test-redis -p 6380:6379 redis:7-alpine
    echo ✅ Redis启动完成
)

echo ✅ 前置条件检查完成
goto :eof

:run_unit_tests
echo [INFO] ?? 运行单元测试...

if "%COVERAGE%"=="true" (
    npm run test:unit -- --coverage --coverageDirectory=%COVERAGE_DIR% --reporter=json --reporter=lcov --reporter=text
) else (
    npm run test:unit
)

:: 生成JUnit格式报告
npm run test:unit -- --reporter=junit --outputFile=%REPORTS_DIR%\unit\junit.xml

echo ✅ 单元测试完成
goto :eof

:run_integration_tests
echo [INFO] 🧪 运行集成测试...

:: 设置测试环境变量
set NODE_ENV=test
set DB_HOST=localhost
set DB_PORT=3307
set DB_NAME=test_enterprise
set DB_USER=test_user
set DB_PASSWORD=test_pass
set REDIS_HOST=localhost
set REDIS_PORT=6380

:: 运行数据库迁移
npm run db:migrate:test

:: 运行集成测试
npm run test:integration -- --reporter=json --outputFile=%REPORTS_DIR%\integration\results.json

:: 生成JUnit格式报告
npm run test:integration -- --reporter=junit --outputFile=%REPORTS_DIR%\integration\junit.xml

echo ✅ 集成测试完成
goto :eof

:run_e2e_tests
echo [INFO] 🧪 运行E2E测试...

:: 检查是否启动了应用服务
curl -s http://localhost:3005/health >nul 2>&1
if errorlevel 1 (
    echo [INFO] ⚠️ 应用服务未启动，正在启动...
    start /b npm run start:test
    
    echo [INFO] ⏳ 等待应用服务启动...
    set /a count=0
:wait_app
curl -s http://localhost:3005/health >nul 2>&1
if not errorlevel 1 goto app_ready
set /a count+=1
if %count% lss 30 (
    echo 等待应用服务启动... (%count%/30)
    timeout /t 2 /nobreak >nul
    goto wait_app
)
echo ❌ 应用服务启动超时
exit /b 1
:app_ready
    echo ✅ 应用服务启动完成
)

:: 运行E2E测试
npm run test:e2e -- --reporter=json --outputFile=%REPORTS_DIR%\e2e\results.json

:: 生成HTML报告
npm run test:e2e:report

echo ✅ E2E测试完成
goto :eof

:run_performance_tests
echo [INFO] 📊 运行性能测试...

:: 检查应用服务状态
curl -s http://localhost:3005/health >nul 2>&1
if errorlevel 1 (
    echo ❌ 应用服务未运行，无法执行性能测试
    exit /b 1
)

:: 运行负载测试
npm run test:performance:load

:: 生成性能报告
npm run test:performance:report

echo ✅ 性能测试完成
goto :eof

:run_security_tests
echo [INFO] 🔒 运行安全测试...

:: npm审计
echo [INFO] 🔍 执行npm依赖安全审计...
npm audit --json > %REPORTS_DIR%\security\npm-audit.json

:: API安全测试
npm run test:security:api -- --reporter=json --outputFile=%REPORTS_DIR%\security\api-security.json

echo ✅ 安全测试完成
goto :eof

:run_contract_tests
echo [INFO] 📋 运行契约测试...

:: 生成API文档
npm run docs:generate

:: 验证API契约
npm run test:contract -- --reporter=json --outputFile=%REPORTS_DIR%\contract\contract-tests.json

echo ✅ 契约测试完成
goto :eof

:generate_test_report
echo [INFO] 📊 生成测试报告...

:: 创建HTML报告
(
echo ^<!DOCTYPE html^>
echo ^<html lang="zh-CN"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Enterprise Brain 测试报告^</title^>
echo     ^<style^>
echo         body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
echo         .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba^(0,0,0,0.1^); }
echo         h1 { color: #333; text-align: center; margin-bottom: 30px; }
echo         .test-section { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
echo         .test-section h2 { color: #2c3e50; margin-top: 0; }
echo         .test-status { display: inline-block; padding: 4px 8px; border-radius: 3px; color: white; font-weight: bold; }
echo         .status-pass { background-color: #27ae60; }
echo         .status-fail { background-color: #e74c3c; }
echo         .status-skip { background-color: #f39c12; }
echo         .summary { display: grid; grid-template-columns: repeat^(auto-fit, minmax^(200px, 1fr^)^); gap: 20px; margin-bottom: 30px; }
echo         .summary-card { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
echo         .summary-card h3 { margin: 0 0 10px 0; color: #2c3e50; }
echo         .summary-card .number { font-size: 2em; font-weight: bold; color: #3498db; }
echo         .test-link { display: inline-block; margin: 5px 10px 5px 0; padding: 8px 15px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; }
echo         .test-link:hover { background: #2980b9; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<div class="container"^>
echo         ^<h1^>🧪 Enterprise Brain 测试报告^</h1^>
echo         
echo         ^<div class="summary"^>
echo             ^<div class="summary-card"^>
echo                 ^<h3^>构建编号^</h3^>
echo                 ^<div class="number"^>%BUILD_NUMBER%^</div^>
echo             ^</div^>
echo             ^<div class="summary-card"^>
echo                 ^<h3^>测试时间^</h3^>
echo                 ^<div class="number"^>%date% %time%^</div^>
echo             ^</div^>
echo             ^<div class="summary-card"^>
echo                 ^<h3^>测试类型^</h3^>
echo                 ^<div class="number"^>%TEST_TYPE%^</div^>
echo             ^</div^>
echo         ^</div^>
echo         
echo         ^<div class="test-section"^>
echo             ^<h2^>📊 单元测试^</h2^>
echo             ^<p^>单元测试覆盖率: ^<span class="test-status status-pass"^>查看详细报告^</span^>^</p^>
echo             ^<a href="unit/index.html" class="test-link"^>查看单元测试报告^</a^>
echo         ^</div^>
echo         
echo         ^<div class="test-section"^>
echo             ^<h2^>🔗 集成测试^</h2^>
echo             ^<p^>API集成测试结果^</p^>
echo             ^<a href="integration/junit.xml" class="test-link"^>查看JUnit报告^</a^>
echo         ^</div^>
echo         
echo         ^<div class="test-section"^>
echo             ^<h2^>🌐 E2E测试^</h2^>
echo             ^<p^>端到端测试结果^</p^>
echo             ^<a href="e2e/index.html" class="test-link"^>查看E2E测试报告^</a^>
echo         ^</div^>
echo         
echo         ^<div class="test-section"^>
echo             ^<h2^>📈 性能测试^</h2^>
echo             ^<p^>API性能测试结果^</p^>
echo             ^<a href="performance/index.html" class="test-link"^>查看性能测试报告^</a^>
echo         ^</div^>
echo         
echo         ^<div class="test-section"^>
echo             ^<h2^>🔒 安全测试^</h2^>
echo             ^<p^>依赖安全审计和代码扫描结果^</p^>
echo             ^<a href="security/npm-audit.json" class="test-link"^>查看安全扫描报告^</a^>
echo         ^</div^>
echo     ^</div^>
echo ^</body^>
echo ^</html^>
) > "%REPORTS_DIR%\index.html"

echo ✅ 测试报告生成完成: %REPORTS_DIR%\index.html
goto :eof

:cleanup_test_env
echo [INFO] 🧹 清理测试环境...

:: 停止测试数据库
docker stop test-mysql >nul 2>&1
docker rm test-mysql >nul 2>&1

:: 停止测试Redis
docker stop test-redis >nul 2>&1
docker rm test-redis >nul 2>&1

:: 清理测试进程
taskkill /f /im node.exe >nul 2>&1

echo ✅ 测试环境清理完成
goto :eof
