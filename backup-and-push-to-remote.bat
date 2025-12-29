@echo off
chcp 65001 >nul
echo ========================================
echo 企业大脑系统 - 完整备份并推送到远程
echo ========================================
echo.

set PROJECT_ROOT=c:\Users\sardenesy\Projects\enterpise-brain
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo [步骤1/8] 准备备份目录...
if not exist "%PROJECT_ROOT%\full-backup" mkdir "%PROJECT_ROOT%\full-backup"
echo ✓ 备份目录已准备
echo.

echo [步骤2/8] 创建数据库备份...
if exist "%PROJECT_ROOT%\data\enterprise_brain.db" (
    copy "%PROJECT_ROOT%\data\enterprise_brain.db" "%PROJECT_ROOT%\full-backup\enterprise_brain_%TIMESTAMP%.db" >nul
    echo ✓ 主数据库已备份: enterprise_brain_%TIMESTAMP%.db
) else (
    echo ⚠ 主数据库不存在: data\enterprise_brain.db
)

if exist "%PROJECT_ROOT%\backend\database\enterprise.db" (
    copy "%PROJECT_ROOT%\backend\database\enterprise.db" "%PROJECT_ROOT%\full-backup\enterprise_%TIMESTAMP%.db" >nul
    echo ✓ 后端数据库已备份: enterprise_%TIMESTAMP%.db
) else (
    echo ⚠ 后端数据库不存在: backend\database\enterprise.db
)
echo.

echo [步骤3/8] 创建MySQL数据库备份脚本...
echo -- MySQL数据库备份说明 > "%PROJECT_ROOT%\full-backup\mysql-restore-guide.sql"
echo -- 如果使用MySQL，请使用以下命令导出数据： >> "%PROJECT_ROOT%\full-backup\mysql-restore-guide.sql"
echo -- mysqldump -u root -p enterprise_brain ^> enterprise_brain_backup.sql >> "%PROJECT_ROOT%\full-backup\mysql-restore-guide.sql"
echo -- 恢复时使用： >> "%PROJECT_ROOT%\full-backup\mysql-restore-guide.sql"
echo -- mysql -u root -p enterprise_brain ^< enterprise_brain_backup.sql >> "%PROJECT_ROOT%\full-backup\mysql-restore-guide.sql"
echo ✓ MySQL备份指南已创建
echo.

echo [步骤4/8] 创建依赖清单...
cd /d "%PROJECT_ROOT%\backend"
if exist "package.json" (
    copy package.json "%PROJECT_ROOT%\full-backup\backend-package.json" >nul
    copy package-lock.json "%PROJECT_ROOT%\full-backup\backend-package-lock.json" >nul 2>nul
    echo ✓ 后端依赖清单已备份
)

cd /d "%PROJECT_ROOT%\07-frontend"
if exist "package.json" (
    copy package.json "%PROJECT_ROOT%\full-backup\frontend-package.json" >nul
    copy package-lock.json "%PROJECT_ROOT%\full-backup\frontend-package-lock.json" >nul 2>nul
    echo ✓ 前端依赖清单已备份
)
echo.

echo [步骤5/8] 创建环境配置备份...
if exist "%PROJECT_ROOT%\backend\config" (
    xcopy "%PROJECT_ROOT%\backend\config" "%PROJECT_ROOT%\full-backup\config\" /E /I /Y >nul
    echo ✓ 配置文件已备份
)
echo.

echo [步骤6/8] 创建恢复指南...
(
echo # 企业大脑系统 - 完整恢复指南
echo.
echo ## 备份时间: %TIMESTAMP%
echo.
echo ## 快速恢复步骤
echo.
echo ### 1. 克隆项目
echo ```bash
echo git clone https://github.com/Zhouhui-design/enterprise-brain.git
echo cd enterprise-brain
echo ```
echo.
echo ### 2. 安装依赖
echo ```bash
echo # 后端依赖
echo cd backend
echo npm install
echo.
echo # 前端依赖
echo cd ../07-frontend
echo npm install
echo ```
echo.
echo ### 3. 恢复数据库
echo ```bash
echo # 方式1: 使用SQLite（从full-backup目录复制）
echo copy full-backup\enterprise_brain_*.db data\enterprise_brain.db
echo copy full-backup\enterprise_*.db backend\database\enterprise.db
echo.
echo # 方式2: 使用MySQL（如果有SQL备份）
echo mysql -u root -p enterprise_brain ^< full-backup\enterprise_brain_backup.sql
echo ```
echo.
echo ### 4. 配置环境
echo ```bash
echo # 复制配置文件
echo copy full-backup\config\* backend\config\
echo.
echo # 如果需要，创建.env文件
echo copy backend\.env.example backend\.env
echo ```
echo.
echo ### 5. 启动服务
echo ```bash
echo # 使用启动脚本
echo start-all-services.bat
echo.
echo # 或手动启动
echo # 后端
echo cd backend
echo node server.js
echo.
echo # 前端
echo cd 07-frontend
echo npm run dev
echo ```
echo.
echo ## 数据库文件说明
echo.
echo - `enterprise_brain_*.db`: 主数据库（SQLite）
echo - `enterprise_*.db`: 后端数据库（SQLite）
echo - `mysql-restore-guide.sql`: MySQL恢复指南
echo.
echo ## 配置文件说明
echo.
echo - `backend-package.json`: 后端依赖清单
echo - `frontend-package.json`: 前端依赖清单
echo - `config/`: 后端配置文件
echo.
echo ## 验证恢复
echo.
echo 1. 访问 http://localhost:3003 查看前端
echo 2. 访问 http://localhost:3005/health 检查后端
echo 3. 登录系统验证数据完整性
echo.
echo ## 常见问题
echo.
echo ### 端口被占用
echo ```bash
echo # Windows
echo taskkill /F /IM node.exe
echo.
echo # 或使用停止脚本
echo stop-all-services.bat
echo ```
echo.
echo ### 依赖安装失败
echo ```bash
echo npm cache clean --force
echo npm install
echo ```
echo.
echo ### 数据库连接错误
echo ```bash
echo # 检查配置文件
echo type backend\config\database.js
echo.
echo # 确保数据库文件存在
echo dir data\*.db
echo dir backend\database\*.db
echo ```
) > "%PROJECT_ROOT%\full-backup\RECOVERY-GUIDE.md"
echo ✓ 恢复指南已创建
echo.

echo [步骤7/8] 修改.gitignore以允许备份文件...
cd /d "%PROJECT_ROOT%"

REM 创建临时.gitignore，允许full-backup目录
(
echo # Logs
echo logs
echo *.log
echo npm-debug.log*
echo.
echo # Dependencies - 保留package.json和package-lock.json
echo node_modules
echo.
echo # Build outputs
echo dist
echo *.local
echo.
echo # Editor directories
echo .idea
echo .vscode/
echo.
echo # Environment variables
echo .env.local
echo .env
echo.
echo # Database files - 除了full-backup目录
echo *.db
echo !full-backup/*.db
echo.
echo # Backup files - 除了full-backup目录
echo *.tar.gz
echo *.zip
echo beifenshuju/
echo beifenshuju_backup_*/
echo backup_*/
echo !full-backup/
echo.
echo # Test files
echo test_*.js
echo test-*.js
echo diagnose-*.js
echo manual-*.js
echo check-*.js
echo.
echo # Temporary files
echo *.tmp
echo *.temp
echo.
echo # OS files
echo .DS_Store
echo Thumbs.db
echo.
echo # Codebuddy files
echo .codebuddy/
echo.
echo # MCP configuration
echo .mcp.json
echo.
echo # Batch files - 除了服务管理脚本
echo !start-all-services.bat
echo !stop-all-services.bat
echo !restart-services.bat
echo !check-services.bat
echo !diagnose-startup-issues.bat
echo.
echo # Documentation files - 保留重要文档
echo !README.md
echo !RECOVERY-GUIDE.md
echo !服务管理脚本使用指南.md
) > .gitignore.backup

move /Y .gitignore .gitignore.old >nul
move /Y .gitignore.backup .gitignore >nul
echo ✓ .gitignore已更新（原文件备份为.gitignore.old）
echo.

echo [步骤8/8] 提交并强制推送到远程...
git add -A
git status
echo.
echo 准备提交...
set /p COMMIT_MSG="请输入提交信息 (直接回车使用默认): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=完整备份: 包含代码+依赖+数据库+配置 - %TIMESTAMP%

git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo ⚠ 没有新的更改需要提交，或提交失败
    echo.
    echo 尝试查看当前状态：
    git status
    echo.
    set /p FORCE_PUSH="是否强制推送现有内容? (y/n): "
    if /i not "%FORCE_PUSH%"=="y" (
        echo 操作已取消
        pause
        exit /b 1
    )
)

echo.
echo 正在推送到远程仓库...
echo ⚠ 即将执行强制推送 (git push -f)
echo.
set /p CONFIRM="确认强制推送? 这将覆盖远程仓库 (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo 操作已取消
    pause
    exit /b 1
)

git push -f origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ 推送失败！
    echo.
    echo 可能的原因：
    echo 1. 网络问题
    echo 2. 认证失败
    echo 3. 分支名称不是main（可能是master）
    echo.
    echo 请手动执行：
    echo git push -f origin master
    echo 或
    echo git push -f origin main
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ 备份完成！
echo ========================================
echo.
echo 📦 备份内容：
echo   - 源代码: 已推送到远程
echo   - 数据库: full-backup\enterprise_brain_%TIMESTAMP%.db
echo   - 配置: full-backup\config\
echo   - 依赖清单: full-backup\*-package.json
echo   - 恢复指南: full-backup\RECOVERY-GUIDE.md
echo.
echo 🔗 远程仓库：
echo   https://github.com/Zhouhui-design/enterprise-brain.git
echo.
echo 📖 恢复方法：
echo   1. git clone https://github.com/Zhouhui-design/enterprise-brain.git
echo   2. 查看 full-backup\RECOVERY-GUIDE.md
echo.
echo ⚠ 注意：
echo   - .gitignore已修改，原文件保存为.gitignore.old
echo   - 如需恢复原.gitignore，执行: move /Y .gitignore.old .gitignore
echo.
pause
