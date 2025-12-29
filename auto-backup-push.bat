@echo off
chcp 65001 >nul
echo ========================================
echo 企业大脑系统 - 自动备份推送（无需确认）
echo ========================================
echo.

set PROJECT_ROOT=c:\Users\sardenesy\Projects\enterpise-brain
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

cd /d "%PROJECT_ROOT%"

echo [1/6] 创建备份目录...
if not exist "full-backup" mkdir "full-backup"

echo [2/6] 备份数据库...
if exist "data\enterprise_brain.db" (
    copy "data\enterprise_brain.db" "full-backup\enterprise_brain_latest.db" /Y >nul
    echo ✓ 主数据库已备份
)
if exist "backend\database\enterprise.db" (
    copy "backend\database\enterprise.db" "full-backup\enterprise_latest.db" /Y >nul
    echo ✓ 后端数据库已备份
)

echo [3/6] 备份配置和依赖清单...
if exist "backend\package.json" copy "backend\package.json" "full-backup\backend-package.json" /Y >nul
if exist "07-frontend\package.json" copy "07-frontend\package.json" "full-backup\frontend-package.json" /Y >nul
if exist "backend\config" xcopy "backend\config" "full-backup\config\" /E /I /Y >nul 2>nul

echo [4/6] 更新.gitignore...
(
echo node_modules
echo *.log
echo dist
echo .env
echo .env.local
echo .idea
echo .vscode/
echo .codebuddy/
echo .mcp.json
echo *.tmp
echo *.temp
echo .DS_Store
echo Thumbs.db
echo beifenshuju/
echo backup_*/
echo test_*.js
echo test-*.js
echo diagnose-*.js
echo manual-*.js
echo check-*.js
echo # 允许备份目录和服务脚本
echo !full-backup/
echo !start-all-services.bat
echo !stop-all-services.bat
echo !restart-services.bat
) > .gitignore

echo [5/6] 提交到Git...
git add -A
git commit -m "自动备份: %TIMESTAMP%" >nul 2>&1

echo [6/6] 推送到远程...
git push -f origin main
if %errorlevel% neq 0 (
    echo ⚠ 尝试推送到master分支...
    git push -f origin master
)

echo.
echo ========================================
echo ✅ 自动备份完成！
echo ========================================
echo.
echo 备份时间: %TIMESTAMP%
echo 远程仓库: https://github.com/Zhouhui-design/enterprise-brain.git
echo.
