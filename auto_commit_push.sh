#!/bin/bash

echo "🚀 AI桌面3号 - 自动提交推送助手"
echo "================================"

cd /home/sardenesy/ai_workspaces/ai_desktop_3

# 检查Git状态
echo ""
echo "📊 检查当前Git状态..."
git status --short

# 检查是否有更改
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo ""
    echo "✅ 没有检测到未提交的更改"
    echo "💡 检查是否有未推送的提交..."
    
    # 检查是否有未推送的提交
    UNPUSHED=$(git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null | wc -l)
    if [ "$UNPUSHED" -gt 0 ]; then
        echo "📤 发现 $UNPUSHED 个未推送的提交"
        read -p "是否立即推送? (y/n): " push_choice
        if [ "$push_choice" = "y" ] || [ "$push_choice" = "Y" ]; then
            CURRENT_BRANCH=$(git branch --show-current)
            echo "🚀 推送到 origin/$CURRENT_BRANCH ..."
            git push origin $CURRENT_BRANCH
            echo "✅ 推送完成！"
        fi
    else
        echo "✅ 所有提交已推送到远程"
    fi
    exit 0
fi

# 显示详细更改
echo ""
echo "📝 检测到以下更改:"
git status --short

# 自动生成提交信息
CURRENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')
CHANGED_FILES=$(git diff --name-only HEAD | wc -l)
DEFAULT_MSG="更新代码 - $CHANGED_FILES 个文件修改 ($CURRENT_TIME)"

echo ""
echo "💬 默认提交信息: $DEFAULT_MSG"
read -p "是否使用默认提交信息? (y/自定义): " use_default

if [ "$use_default" = "y" ] || [ "$use_default" = "Y" ]; then
    COMMIT_MSG="$DEFAULT_MSG"
else
    read -p "请输入提交描述: " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        echo "❌ 提交描述不能为空，使用默认信息"
        COMMIT_MSG="$DEFAULT_MSG"
    fi
fi

# 添加所有更改
echo ""
echo "📦 添加所有更改到暂存区..."
git add .

# 提交
echo "💾 提交更改..."
git commit -m "$COMMIT_MSG"

if [ $? -eq 0 ]; then
    echo "✅ 提交成功！"
    
    # 询问是否推送
    echo ""
    read -p "是否立即推送到远程仓库? (y/n): " push_now
    
    if [ "$push_now" = "y" ] || [ "$push_now" = "Y" ]; then
        CURRENT_BRANCH=$(git branch --show-current)
        echo "🚀 推送到 origin/$CURRENT_BRANCH ..."
        git push origin $CURRENT_BRANCH
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 推送成功！"
            echo "================================"
            echo "✅ 所有操作完成"
        else
            echo ""
            echo "❌ 推送失败，请检查网络连接或权限"
            echo "💡 稍后可手动执行: git push origin $CURRENT_BRANCH"
        fi
    else
        echo ""
        echo "✅ 提交完成，未推送"
        echo "💡 稍后可手动执行: git push origin $(git branch --show-current)"
    fi
else
    echo "❌ 提交失败"
    exit 1
fi

echo ""
echo "================================"
echo "📊 当前Git状态:"
git status --short
