#!/bin/bash
echo "🤖 AI桌面1号开始工作..."
echo "======================================"
cd ~/ai_workspaces/ai_desktop_1
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 当前分支: $CURRENT_BRANCH"
echo "🔄 工作流程: 同步develop → 本地feature_ai_desktop_1 → 远程feature_ai_desktop_1"
echo ""
echo "📥 获取所有远程分支更新..."
git fetch --all
echo ""
echo "📊 分支状态概览:"
echo "  - develop最新提交: $(git log -1 --format="%h %s" origin/develop)"
echo "  - 当前分支最新提交: $(git log -1 --format="%h %s" HEAD)"
echo ""
echo "🔄 正在将develop分支的更新合并到当前分支..."
git merge origin/develop --no-ff
if [ $? -eq 0 ]; then
    echo "✅ 同步成功！develop分支的更新已合并到当前分支"
    echo "📤 推送更新到远程feature_ai_desktop_1分支..."
    git push origin feature_ai_desktop_1
    echo "✅ 已推送到远程feature_ai_desktop_1分支"
else
    echo "❌ 发现代码冲突！需要手动解决"
    echo ""
    echo "冲突文件列表:"
    git status --porcelain | grep -E "^(UU|AA|DD)" || echo "   无冲突文件显示，请手动检查git status"
    echo ""
    echo "💡 解决方法:"
    echo "  1. 手动编辑冲突文件（搜索 <<<<<<< 标记）"
    echo "  2. 解决冲突后执行: git add ."
    echo "  3. 执行: git commit -m 'resolve: 解决冲突'"
    echo "  4. 执行: git push origin feature_ai_desktop_1"
    echo "  5. 重新运行此脚本继续工作"
    exit 1
fi
echo ""
echo "🎯 准备工作完成！"
echo "💡 接下来: 在VS Code中编写代码，完成后运行 ./ai_finish_work.sh"
echo "======================================"
