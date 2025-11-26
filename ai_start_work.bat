@echo off
chcp 65001 >nul
echo 🤖 AI笔记本1号开始工作...
echo ======================================

:: 切换到工作目录
cd /d "C:\Users\Administrator\ai_workspaces\ai_laptop_1"

:: 验证目录是否正确
if not exist ".git" (
    echo ❌ 错误：当前目录不是Git仓库
    pause
    exit /b 1
)

:: 检查当前分支
for /f "delim=" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo 📍 当前分支: %CURRENT_BRANCH%

if not "%CURRENT_BRANCH%"=="feature_ai_laptop_1" (
    echo ⚠️  警告：不在正确的分支，正在切换到 feature_ai_laptop_1...
    git checkout feature_ai_laptop_1
)

echo.
echo 📥 获取远程更新...
git fetch --all

echo.
echo 📊 分支状态:
for /f "tokens=*" %%i in ('git log -1 --format=%%h\ %%s origin/develop') do echo   开发主干: %%i
for /f "tokens=*" %%i in ('git log -1 --format=%%h\ %%s HEAD') do echo   当前分支: %%i

echo.
echo 🔄 同步最新代码...
git merge origin/develop --no-ff

if %errorlevel% equ 0 (
    echo ✅ 同步成功
    echo 📤 推送到远程...
    git push origin feature_ai_laptop_1
    echo ✅ 已更新远程分支
) else (
    echo ❌ 发现代码冲突！
    echo.
    echo 请手动解决以下文件的冲突：
    git status --porcelain | findstr /r "^UU ^AA ^DD"
    echo.
    echo 💡 解决方法：
    echo   1. 用VS Code打开冲突文件
    echo   2. 解决冲突（删除 <<<<<<<, =======, >>>>>>> 标记）
    echo   3. 执行: git add .
    echo   4. 执行: git commit -m "resolve: 解决冲突"
    echo   5. 重新运行此脚本
    pause
    exit /b 1
)

echo.
echo 🎯 准备工作完成！
echo 💡 接下来：在CodeBuddy中编写代码
echo 💡 完成后运行：ai_finish_work.bat
echo ======================================
timeout /t 3 >nul