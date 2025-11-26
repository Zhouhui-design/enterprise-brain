#!/bin/bash
echo "🤖 AI桌面1号完成工作..."
echo "======================================"
cd ~/ai_workspaces/ai_desktop_1
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"
if git diff-index --quiet HEAD --; then
    echo "⚠️  没有检测到文件更改"
    read -p "是否继续创建合并请求? (y/n): " continue_anyway
    if [ "$continue_anyway" != "y" ]; then
        echo "❌ 取消操作"
        exit 0
    fi
else
    echo "📝 检测到以下更改:"
    git status --short
    echo ""
    read -p "💬 请输入提交描述: " commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="feat: [AI桌面1号] 自动提交 $(date '+%Y-%m-%d %H:%M')"
    fi
    echo "💾 提交更改到本地仓库..."
    git add .
    git commit -m "$commit_msg"
    echo "📤 推送到远程feature_ai_desktop_1分支..."
    git push origin feature_ai_desktop_1
    echo "✅ 代码已提交并推送到远程feature_ai_desktop_1分支"
fi
echo ""
echo "🔄 最终同步develop分支最新代码..."
git fetch --all
git merge origin/develop --no-ff
git push origin feature_ai_desktop_1
echo "✅ 最终同步完成"
echo ""
echo "======================================"
echo "🌐 请创建合并请求"
echo "======================================"
echo ""
echo "📋 合并请求信息:"
echo "   源分支 (Source): feature_ai_desktop_1"
echo "   目标分支 (Target): develop"
echo "   标题: [AI桌面1号] $(date '+%Y-%m-%d') 工作提交"
echo ""
echo "🔗 直接访问链接:"
echo "   https://gitcode.com/sardenesy/enterprise-brain/merge_requests/new?source_branch=feature_ai_desktop_1&target_branch=develop"
echo ""
echo "📝 创建步骤:"
echo "   1. 点击上面链接或访问GitCode"
echo "   2. 确认源分支为 feature_ai_desktop_1"
echo "   3. 确认目标分支为 develop" 
echo "   4. 填写标题和描述"
echo "   5. 点击'提交合并请求'"
echo ""
echo "✅ AI桌面1号工作流程完成！"
echo "======================================"
