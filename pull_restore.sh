#!/bin/bash

# 正确拉取脚本 - 远程有就拉取，删除本地独有的文件
PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
REMOTE_REPO="https://gitcode.com/sardenesy/enterpise-brain.git"
BRANCH="feature-3"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== 拉取恢复 ===${NC}"

# 确认
echo -e "${RED}警告：将覆盖本地文件！${NC}"
read -p "确认？(y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}取消${NC}"
    exit 0
fi

# 检查目录
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${YELLOW}克隆仓库...${NC}"
    git clone --branch "$BRANCH" "$REMOTE_REPO" "$PROJECT_ROOT"
    exit 0
fi

cd "$PROJECT_ROOT" || exit 1

# 备份
BACKUP_DIR="/tmp/backup-$(basename "$PROJECT_ROOT")-$(date +%s)"
echo -e "${YELLOW}备份到: $BACKUP_DIR${NC}"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" 2>/dev/null || true

# 重置到远程
echo -e "${YELLOW}重置到远程状态...${NC}"
git fetch origin
git reset --hard "origin/$BRANCH"

# 清理未跟踪文件
echo -e "${YELLOW}清理未跟踪文件...${NC}"
git clean -fd

echo -e "${GREEN}✓ 拉取完成${NC}"
echo -e "${YELLOW}备份位置: $BACKUP_DIR${NC}"
