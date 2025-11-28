@echo off
chcp 65001 >nul
echo 🤖 AI笔记本1号完成工作...
echo ======================================

cd /d "C:\Users\Administrator\ai_workspaces\ai_laptop_1"

:: 检查更改
git diff-index --quiet HEAD --
if %errorlevel% equ 0 (
    echo ⚠️  没有检测到文件更改
) else (
    echo 📝 检测到以下更改：
    git status --short
    
    echo.
    set /p "commit_msg=💬 请输入提交描述: "
    if "!commit_msg!"=="" (
        set "commit_msg=feat: [AI笔记本1号] 工作提交 %date% %time%"
    )
    
    echo 💾 提交更改...
    git add .
    git commit -m "!commit_msg!"
    
    echo 📤 推送到远程...
    git push origin feature_ai_laptop_1
    echo ✅ 代码已提交
)

echo.
echo 🔄 最终同步...
git fetch --all
git merge origin/develop --no-ff
git push origin feature_ai_laptop_1
echo ✅ 同步完成

echo.
echo ======================================
echo 🌐 创建合并请求
echo ======================================
echo.
echo 请访问以下链接创建合并请求：
echo.
echo 🔗 https://gitcode.com/sardenesy/enterprise-brain/merge_requests/new?source_branch=feature_ai_laptop_1^&target_branch=develop
echo.
echo 📋 填写信息：
echo   源分支: feature_ai_laptop_1
echo   目标分支: develop  
echo   标题: [AI笔记本1号] %date%
echo.
echo ✅ 工作流程完成！
echo ======================================
timeout /t 5 >nul