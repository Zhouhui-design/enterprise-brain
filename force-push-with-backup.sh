#!/bin/bash

# ========================================  
# 企业大脑系统 - 强制推送并备份脚本  
# 功能：创建本地备份 → 强制推送远程 → 验证结果  
# ========================================  

echo "🔄 企业大脑系统 - 强制推送并备份"
echo "====================================="
echo ""

# 工作目录  
WORK_DIR="/home/sardensy/enterprise-brain/enterpise-brain"
cd "$WORK_DIR"

# 1. 创建本地备份  
echo "[1/3] 创建本地备份..."
BACKUP_DIR="$WORK_DIR/git-backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz"

git archive --format=tar.gz --output="$BACKUP_FILE" HEAD
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

echo "  ✅ 备份完成: $BACKUP_FILE"
echo "  📊 备份大小: $BACKUP_SIZE"
echo ""

# 2. 强制推送远程  
echo "[2/3] 执行强制推送..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 执行强制推送  
git push -f origin "$CURRENT_BRANCH"
PUSH_RESULT=$?

if [ $PUSH_RESULT -eq 0 ]; then
    echo "  ✅ 强制推送成功!"
    echo "  分支: $CURRENT_BRANCH"
    echo "  远程: origin"
else
    echo "  ❌ 强制推送失败!"
    echo "  错误码: $PUSH_RESULT"
    exit 1
fi
echo ""

# 3. 验证推送结果  
echo "[3/3] 验证推送结果..."

# 检查本地与远程是否一致  
git fetch origin
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/$CURRENT_BRANCH)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    echo "  ✅ 验证通过: 本地与远程仓库一致"
    echo "  提交ID: $LOCAL_COMMIT"
else
    echo "  ❌ 验证失败: 本地与远程仓库不一致"
    echo "  本地: $LOCAL_COMMIT"
    echo "  远程: $REMOTE_COMMIT"
    exit 1
fi

echo ""
echo "====================================="
echo "🎉 强制推送并备份任务完成!"
echo "====================================="
echo "  📁 备份文件: $BACKUP_FILE"
echo "  🌿 分支: $CURRENT_BRANCH"
echo "  🎯 远程: origin"
echo "  ✅ 状态: 成功"
echo "====================================="