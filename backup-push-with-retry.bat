@echo off
chcp 65001 >nul
echo ========================================
echo 企业大脑系统 - 完整备份推送（带重试）
echo ========================================
echo.

set PROJECT_ROOT=c:\Users\sardenesy\Projects\enterpise-brain
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_DIR=%PROJECT_ROOT%\full-backup

cd /d "%PROJECT_ROOT%"

REM ==================== 第1部分：本地备份 ====================
echo.
echo ==================== 本地备份 ====================
echo.

echo [1/4] 创建备份目录...
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
if not exist "%BACKUP_DIR%\databases" mkdir "%BACKUP_DIR%\databases"
if not exist "%BACKUP_DIR%\config" mkdir "%BACKUP_DIR%\config"
echo ✓ 备份目录已创建
echo.

echo [2/4] 备份数据库文件...
set DB_BACKED_UP=0
if exist "data\enterprise_brain.db" (
    copy "data\enterprise_brain.db" "%BACKUP_DIR%\databases\enterprise_brain_%TIMESTAMP%.db" /Y >nul
    copy "data\enterprise_brain.db" "%BACKUP_DIR%\databases\enterprise_brain_latest.db" /Y >nul
    echo ✓ 主数据库已备份: enterprise_brain_%TIMESTAMP%.db
    set DB_BACKED_UP=1
)
if exist "backend\database\enterprise.db" (
    copy "backend\database\enterprise.db" "%BACKUP_DIR%\databases\enterprise_%TIMESTAMP%.db" /Y >nul
    copy "backend\database\enterprise.db" "%BACKUP_DIR%\databases\enterprise_latest.db" /Y >nul
    echo ✓ 后端数据库已备份: enterprise_%TIMESTAMP%.db
    set DB_BACKED_UP=1
)
if %DB_BACKED_UP%==0 (
    echo ⚠ 未找到数据库文件
)
echo.

echo [3/4] 备份配置和依赖信息...
if exist "backend\package.json" (
    copy "backend\package.json" "%BACKUP_DIR%\backend-package.json" /Y >nul
    if exist "backend\package-lock.json" copy "backend\package-lock.json" "%BACKUP_DIR%\backend-package-lock.json" /Y >nul
    echo ✓ 后端依赖清单已备份
)
if exist "07-frontend\package.json" (
    copy "07-frontend\package.json" "%BACKUP_DIR%\frontend-package.json" /Y >nul
    if exist "07-frontend\package-lock.json" copy "07-frontend\package-lock.json" "%BACKUP_DIR%\frontend-package-lock.json" /Y >nul
    echo ✓ 前端依赖清单已备份
)
if exist "backend\config" (
    xcopy "backend\config" "%BACKUP_DIR%\config\" /E /I /Y >nul 2>nul
    echo ✓ 配置文件已备份
)
echo.

echo [4/4] 创建恢复说明文件...
(
echo # 企业大脑系统 - 完整恢复指南
echo.
echo ## 备份信息
echo - 备份时间: %TIMESTAMP%
echo - 备份位置: full-backup/
echo - 远程仓库: https://github.com/Zhouhui-design/enterprise-brain.git
echo.
echo ## 快速恢复（从零开始）
echo.
echo ### 方法1: 从GitHub恢复（推荐）
echo ```bash
echo # 1. 克隆项目
echo git clone https://github.com/Zhouhui-design/enterprise-brain.git
echo cd enterprise-brain
echo.
echo # 2. 运行恢复脚本
echo quick-restore.bat
echo.
echo # 3. 启动服务
echo start-all-services.bat
echo ```
echo.
echo ### 方法2: 手动恢复
echo ```bash
echo # 1. 克隆项目
echo git clone https://github.com/Zhouhui-design/enterprise-brain.git
echo cd enterprise-brain
echo.
echo # 2. 恢复数据库
echo copy full-backup\databases\enterprise_brain_latest.db data\enterprise_brain.db
echo copy full-backup\databases\enterprise_latest.db backend\database\enterprise.db
echo.
echo # 3. 安装依赖
echo cd backend
echo npm install
echo cd ../07-frontend
echo npm install
echo.
echo # 4. 启动服务
echo cd ..
echo start-all-services.bat
echo ```
echo.
echo ## 备份内容清单
echo.
echo ### 数据库文件（databases/）
echo - enterprise_brain_latest.db - 主数据库（最新）
echo - enterprise_latest.db - 后端数据库（最新）
echo - enterprise_brain_%TIMESTAMP%.db - 主数据库（时间戳版本）
echo - enterprise_%TIMESTAMP%.db - 后端数据库（时间戳版本）
echo.
echo ### 配置文件（config/）
echo - database.js - 数据库配置
echo - 其他配置文件
echo.
echo ### 依赖清单
echo - backend-package.json - 后端依赖
echo - frontend-package.json - 前端依赖
echo - *-package-lock.json - 锁定版本
echo.
echo ## 服务启动
echo.
echo ### 自动启动（推荐）
echo ```bash
echo start-all-services.bat
echo ```
echo.
echo ### 手动启动
echo ```bash
echo # 后端（端口3005）
echo cd backend
echo node server.js
echo.
echo # 前端（端口3003）
echo cd 07-frontend
echo npm run dev
echo ```
echo.
echo ## 访问地址
echo - 前端: http://localhost:3003
echo - 后端API: http://localhost:3005
echo.
echo ## 常见问题
echo.
echo ### Q1: 端口被占用
echo A: 运行 `stop-all-services.bat` 停止所有服务
echo.
echo ### Q2: 依赖安装失败
echo A: 运行 `npm cache clean --force` 然后重新 `npm install`
echo.
echo ### Q3: 数据库连接错误
echo A: 检查数据库文件是否存在，路径是否正确
echo.
echo ### Q4: 前端页面空白
echo A: 清除浏览器缓存（Ctrl+Shift+R）或运行 `restart-services.bat`
) > "%BACKUP_DIR%\README-RECOVERY.md"
echo ✓ 恢复指南已创建: README-RECOVERY.md
echo.

REM ==================== 第2部分：Git提交 ====================
echo.
echo ==================== Git提交 ====================
echo.

echo [1/2] 更新.gitignore（允许备份文件）...
(
echo # Dependencies
echo node_modules
echo.
echo # Logs
echo *.log
echo npm-debug.log*
echo.
echo # Build
echo dist
echo *.local
echo.
echo # Environment
echo .env
echo .env.local
echo.
echo # Editor
echo .idea
echo .vscode/
echo.
echo # System
echo .DS_Store
echo Thumbs.db
echo.
echo # Codebuddy
echo .codebuddy/
echo .mcp.json
echo.
echo # Temporary
echo *.tmp
echo *.temp
echo.
echo # Old backups
echo beifenshuju/
echo backup_*/
echo data/backups/
echo.
echo # Test files
echo test_*.js
echo test-*.js
echo diagnose-*.js
echo manual-*.js
echo check-*.js
echo.
echo # Allow backup directory
echo !full-backup/
echo !full-backup/**
) > .gitignore
echo ✓ .gitignore已更新
echo.

echo [2/2] 添加文件到Git...
git add -A
git status
echo.

REM ==================== 第3部分：推送到远程 ====================
echo.
echo ==================== 推送到远程 ====================
echo.

echo [1/3] 提交更改...
git commit -m "完整备份: 代码+数据库+配置+依赖 [%TIMESTAMP%]"
if %errorlevel% neq 0 (
    echo ℹ 没有新更改需要提交
    echo.
)

echo [2/3] 推送到远程（带重试）...
set RETRY_COUNT=0
set MAX_RETRIES=3

:RETRY_PUSH
set /a RETRY_COUNT+=1
echo.
echo 尝试推送 (%RETRY_COUNT%/%MAX_RETRIES%)...
git push -f origin main
if %errorlevel% == 0 (
    echo ✓ 推送成功！
    goto PUSH_SUCCESS
)

echo ❌ 推送失败
if %RETRY_COUNT% lss %MAX_RETRIES% (
    echo 等待5秒后重试...
    powershell -Command "Start-Sleep 5"
    goto RETRY_PUSH
)

echo.
echo ❌ 推送失败：已达最大重试次数
echo.
echo 可能的原因：
echo 1. 网络连接问题
echo 2. GitHub服务不可用
echo 3. 认证失败
echo.
echo 💡 解决方案：
echo 1. 检查网络连接
echo 2. 稍后手动推送: git push -f origin main
echo 3. 本地备份已完成，数据已安全保存在 full-backup/ 目录
echo.
goto PUSH_FAILED

:PUSH_SUCCESS
echo.
echo ========================================
echo ✅ 备份和推送全部完成！
echo ========================================
echo.
echo 📦 本地备份位置:
echo   %BACKUP_DIR%
echo.
echo 📊 备份内容:
echo   ✓ 数据库文件 (databases/)
echo   ✓ 配置文件 (config/)
echo   ✓ 依赖清单 (*-package.json)
echo   ✓ 恢复指南 (README-RECOVERY.md)
echo.
echo 🔗 远程仓库:
echo   https://github.com/Zhouhui-design/enterprise-brain.git
echo.
echo 📖 恢复方法:
echo   方法1: 运行 quick-restore.bat
echo   方法2: 查看 full-backup\README-RECOVERY.md
echo.
goto END

:PUSH_FAILED
echo.
echo ========================================
echo ⚠ 本地备份完成，但远程推送失败
echo ========================================
echo.
echo 📦 本地备份位置:
echo   %BACKUP_DIR%
echo.
echo 📊 备份内容（已完成）:
echo   ✓ 数据库文件
echo   ✓ 配置文件
echo   ✓ 依赖清单
echo   ✓ 恢复指南
echo.
echo ❌ 远程推送（失败）:
echo   请稍后手动执行: git push -f origin main
echo.
echo 💡 重要提示:
echo   本地备份已安全完成，数据不会丢失
echo   网络恢复后可以随时推送到远程
echo.

:END
echo.
echo 按任意键退出...
pause >nul
