@echo off
chcp 65001 >nul
echo ===============================================
echo             自动推送脚本
echo ===============================================
echo.

:: 设置Git仓库路径
set REPO_PATH=%~dp0
cd /d "%REPO_PATH%"

:: 显示当前分支
echo 当前分支:
git branch --show-current
echo.

:: 检查是否有未提交的更改
echo 检查文件状态...
git status --porcelain

:: 添加所有更改
echo.
echo 正在添加所有更改...
git add .

:: 检查是否有文件被添加
git diff --cached --quiet
if %errorlevel%==0 (
    echo 没有新的更改需要提交。
    echo.
    pause
    exit /b 0
)

:: 提示输入提交信息
echo.
set /p commit_msg=请输入提交信息: 
if "%commit_msg%"=="" (
    set commit_msg=自动提交 - %date% %time%
)

:: 提交更改
echo.
echo 正在提交更改...
git commit -m "%commit_msg%"

if %errorlevel% neq 0 (
    echo 提交失败！
    pause
    exit /b 1
)

:: 推送到远程仓库
echo.
echo 正在推送到远程仓库...
git push origin feature_ai_laptop_1

if %errorlevel% neq 0 (
    echo 推送失败！
    pause
    exit /b 1
)

echo.
echo ===============================================
echo              推送成功！
echo ===============================================
echo 仓库地址: https://gitcode.com/sardenesy/enterprise-brain
echo 分支: feature_ai_laptop_1
echo ===============================================
echo.

pause