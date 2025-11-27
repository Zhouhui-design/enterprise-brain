@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ===============================================
echo          智能提交推送脚本
echo ===============================================
echo.

:: 设置Git仓库路径
set REPO_PATH=%~dp0
cd /d "%REPO_PATH%"

:: 显示当前分支
echo 当前分支: 
git branch --show-current
echo.

:: 获取状态信息
echo 分析文件变化...
for /f "tokens=1,2" %%i in ('git status --porcelain') do (
    set "status=%%i"
    set "file=%%j"
    
    if "!status!"=="M" (
        set /a modified_count+=1
        set "modified_files=!modified_files! !file!"
    )
    if "!status!"=="A" (
        set /a added_count+=1
        set "added_files=!added_files! !file!"
    )
    if "!status=="??" (
        set /a new_count+=1
        set "new_files=!new_files! !file!"
    )
    if "!status!"=="D" (
        set /a deleted_count+=1
        set "deleted_files=!deleted_files! !file!"
    )
)

:: 统计文件数量
if not defined modified_count set modified_count=0
if not defined added_count set added_count=0
if not defined new_count set new_count=0
if not defined deleted_count set deleted_count=0

set /a total_files=modified_count+added_count+new_count+deleted_count

echo 变更统计:
echo   - 修改文件: %modified_count% 个
echo   - 新增文件: %added_count% 个  
echo   - 新文件: %new_count% 个
echo   - 删除文件: %deleted_count% 个
echo   - 总计: %total_files% 个文件
echo.

:: 如果没有变化
if %total_files%==0 (
    echo 没有文件变化，无需提交。
    pause
    exit /b 0
)

:: 生成智能提交信息
set "commit_message="

if %added_count% gtr 0 (
    set "commit_message=!commit_message!新增: "
    :: 提取文件类型
    for %%f in (%added_files%) do (
        set "filename=%%~nf"
        if "!filename!"=="ProjectManagement" set "commit_message=!commit_message!项目管理 "
        if "!filename!"=="DesignManagement" set "commit_message=!commit_message!设计管理 "
        if "!filename!"=="DocumentManagement" set "commit_message=!commit_message!文档管理 "
        if "!filename!"=="VersionControl" set "commit_message=!commit_message!版本控制 "
        if "!filename!"=="DesignReview" set "commit_message=!commit_message!设计评审 "
    )
)

if %new_count% gtr 0 (
    if defined commit_message set "commit_message=!commit_message!; "
    set "commit_message=!commit_message!组件: "
    :: 提取组件文件
    for %%f in (%new_files%) do (
        set "filename=%%~nf"
        if "!filename!"=="ProjectGantt" set "commit_message=!commit_message!甘特图 "
        if "!filename!"=="DesignViewer" set "commit_message=!commit_message!设计查看器 "
        if "!filename!"=="VersionHistory" set "commit_message=!commit_message!版本历史 "
    )
)

if %deleted_count% gtr 0 (
    if defined commit_message set "commit_message=!commit_message!; "
    set "commit_message=!commit_message!删除 %deleted_count% 个文件"
)

if !commit_message!=="" (
    set "commit_message=更新 %total_files% 个文件"
)

:: 添加时间戳
set "commit_message=!commit_message! - %date:~0,4%-%date:~5,2%-%date:~8,2% %time:~0,2%:%time:~3,2%"

:: 显示生成的提交信息
echo 生成的提交信息: 
echo "%commit_message%"
echo.

:: 询问是否使用自动生成的提交信息
set /p use_auto="使用自动生成的提交信息? (Y/n): "
if /i not "%use_auto%"=="n" (
    if /i not "%use_auto%"=="no" (
        goto :do_commit
    )
)

:: 手动输入提交信息
set /p commit_msg="请输入提交信息: "
if not "%commit_msg%"=="" (
    set "commit_message=%commit_msg%"
)

:do_commit
:: 添加所有文件
echo 正在添加文件...
git add .

:: 提交更改
echo 正在提交更改...
git commit -m "%commit_message%"

if %errorlevel% neq 0 (
    echo ❌ 提交失败！
    pause
    exit /b 1
)

:: 推送到远程仓库
echo.
echo 正在推送到远程仓库...
git push origin feature_ai_laptop_1

if %errorlevel% neq 0 (
    echo ❌ 推送失败！
    pause
    exit /b 1
)

echo.
echo ===============================================
echo              ✅ 推送成功！
echo ===============================================
echo  📁 仓库地址: https://gitcode.com/sardenesy/enterprise-brain
echo  🌿 分支: feature_ai_laptop_1  
echo  📝 提交信息: %commit_message%
echo  📊 文件统计: %total_files% 个文件
echo ===============================================
echo.

:: 询问是否查看仓库
set /p open_repo="是否在浏览器中打开仓库? (Y/n): "
if /i not "%open_repo%"=="n" (
    if /i not "%open_repo%"=="no" (
        start https://gitcode.com/sardenesy/enterprise-brain/tree/feature_ai_laptop_1
    )
)

pause