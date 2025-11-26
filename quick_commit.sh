#!/bin/bash
echo "🚀 AI桌面2号快速提交助手"

cd ~/ai_workspaces/ai_desktop_2

# 检查是否有更改
if git diff-index --quiet HEAD --; then
    echo "❌ 没有检测到文件更改"
    exit 1
fi

# 显示更改状态
echo "📝 当前更改:"
git status --short

# 显示主要修改的文件类型
echo ""
echo "📊 修改统计:"
find . -name "*.java" -type f | xargs git diff --name-only HEAD 2>/dev/null | head -5

# 获取提交信息
echo ""
read -p "💬 请输入提交描述: " commit_msg

if [ -z "$commit_msg" ]; then
    echo "❌ 提交描述不能为空"
    exit 1
fi

# 提交更改
git add .
git commit -m "$commit_msg"

echo ""
echo "✅ 提交成功!"
echo "💡 提示: 使用 'git push origin feature_ai_desktop_2' 推送到远程"
