@echo off
chcp 65001 >nul
echo 🚀 快速提交助手

cd /d "C:\Users\Administrator\ai_workspaces\ai_laptop_1"

git diff-index --quiet HEAD --
if %errorlevel% equ 0 (
    echo ❌ 没有检测到更改
    pause
    exit /b 1
)

echo 📝 检测到更改：
git status --short

echo.
set /p "commit_msg=💬 提交描述: "
if "!commit_msg!"=="" (
    echo ❌ 必须输入提交描述
    pause
    exit /b 1
)

git add .
git commit -m "!commit_msg!"

echo.
echo ✅ 提交成功！
echo 💡 提示：完成工作后运行 ai_finish_work.bat
timeout /t 2 >nul