# 设置UTF-8编码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# 显示横幅
Write-ColorOutput Cyan "================================================"
Write-ColorOutput Cyan "           一键推送脚本 PowerShell版"
Write-ColorOutput Cyan "================================================"
Write-Output ""

# 设置Git仓库路径
$RepoPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoPath

# 显示当前分支
$CurrentBranch = git branch --show-current
Write-Output "📍 当前分支: $CurrentBranch"
Write-Output ""

# 检查Git状态
Write-Output "🔍 检查文件状态..."
$Status = git status --porcelain

if (-not $Status) {
    Write-ColorOutput Yellow "没有文件变化，无需提交。"
    Write-Output ""
    Write-Output "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 0
}

# 分析文件变化
$Modified = @()
$Added = @()
$Deleted = @()
$Untracked = @()

$Status | ForEach-Object {
    $Code = $_.Substring(0, 2)
    $File = $_.Substring(3)
    
    switch -Regex ($Code) {
        " M" { $Modified += $File }
        "A " { $Added += $File }
        "D " { $Deleted += $File }
        "\?\?" { $Untracked += $File }
    }
}

Write-Output "📊 变更统计:"
if ($Modified.Count -gt 0) { Write-Output "  📝 修改文件: $($Modified.Count) 个" }
if ($Added.Count -gt 0) { Write-Output "  ➕ 新增文件: $($Added.Count) 个" }
if ($Deleted.Count -gt 0) { Write-Output "  ➖ 删除文件: $($Deleted.Count) 个" }
if ($Untracked.Count -gt 0) { Write-Output "  🆕 新文件: $($Untracked.Count) 个" }

$TotalFiles = $Modified.Count + $Added.Count + $Deleted.Count + $Untracked.Count
Write-Output "  📈 总计: $TotalFiles 个文件"
Write-Output ""

# 生成智能提交信息
function Get-SmartCommitMessage {
    $Message = ""
    
    # 分析Vue组件
    $VueFiles = @()
    $Components = @()
    
    ($Added + $Untracked) | Where-Object { $_ -match "\.vue$" } | ForEach-Object {
        $VueFiles += $_
        $FileName = [System.IO.Path]::GetFileNameWithoutExtension($_)
        
        switch ($FileName) {
            "ProjectManagement" { $Components += "项目管理" }
            "DesignManagement" { $Components += "设计管理" }
            "DocumentManagement" { $Components += "文档管理" }
            "VersionControl" { $Components += "版本控制" }
            "DesignReview" { $Components += "设计评审" }
            "ProjectGantt" { $Components += "甘特图" }
            "DesignViewer" { $Components += "设计查看器" }
            "VersionHistory" { $Components += "版本历史" }
            default { $Components += $FileName }
        }
    }
    
    if ($Components.Count -gt 0) {
        $Message = "feat: 添加" + ($Components -join "、") + "组件"
    } elseif ($Modified.Count -gt 0) {
        $Message = "fix: 更新$($Modified.Count)个文件"
    } else {
        $Message = "chore: 更新代码"
    }
    
    # 添加时间戳
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message += " - $Timestamp"
    
    return $Message
}

$AutoMessage = Get-SmartCommitMessage
Write-Output "📝 建议的提交信息:"
Write-ColorOutput Green "  $AutoMessage"
Write-Output ""

# 询问是否使用自动生成的提交信息
Write-Output "使用自动生成的提交信息? (Y/n): "
$Choice = Read-Host

if ($Choice -eq "" -or $Choice -eq "y" -or $Choice -eq "Y") {
    $CommitMessage = $AutoMessage
} else {
    Write-Output "请输入提交信息:"
    $CommitMessage = Read-Host
}

# 执行Git操作
Write-Output ""
Write-Output "🔄 正在添加文件..."
git add .

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ 添加文件失败！"
    Write-Output "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Output "📦 正在提交更改..."
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ 提交失败！"
    Write-Output "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Output "🚀 正在推送到远程仓库..."
git push origin $CurrentBranch

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ 推送失败！"
    Write-Output "按任意键退出..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# 显示成功信息
Write-Output ""
Write-ColorOutput Green "================================================"
Write-ColorOutput Green "              ✅ 推送成功！"
Write-ColorOutput Green "================================================"
Write-Output "📁 仓库地址: https://gitcode.com/sardenesy/enterprise-brain"
Write-Output "🌿 分支: $CurrentBranch"
Write-Output "📝 提交信息: $CommitMessage"
Write-Output "📊 文件统计: $TotalFiles 个文件"
Write-ColorOutput Green "================================================"
Write-Output ""

# 询问是否查看仓库
Write-Output "是否在浏览器中打开仓库? (Y/n): "
$OpenRepo = Read-Host

if ($OpenRepo -eq "" -or $OpenRepo -eq "y" -or $OpenRepo -eq "Y") {
    Start-Process "https://gitcode.com/sardenesy/enterprise-brain/tree/$CurrentBranch"
}

Write-Output ""
Write-Output "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")