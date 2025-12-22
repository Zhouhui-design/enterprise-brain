#!/bin/bash

# 正确推送脚本 - 本地有就推送，不删除远程文件
PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
REMOTE_REPO="https://gitcode.com/sardenesy/enterpise-brain.git"
BRANCH="feature-3"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 推送备份 ===${NC}"

# 检查目录
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}错误: 目录不存在${NC}"
    exit 1
fi

cd "$PROJECT_ROOT" || exit 1

# 检查git
if [ ! -d ".git" ]; then
    echo -e "${RED}错误: 不是git仓库${NC}"
    exit 1
fi

# 添加远程
if ! git remote | grep -q origin; then
    git remote add origin "$REMOTE_REPO"
fi

# 拉取最新
echo -e "${YELLOW}拉取远程更新...${NC}"
git fetch origin

# 检查远程分支
if git ls-remote --exit-code origin "$BRANCH" >/dev/null 2>&1; then
    echo -e "${GREEN}远程分支存在${NC}"
    
    # 合并远程（保留本地文件）
    git merge --strategy-option=theirs "origin/$BRANCH" --allow-unrelated-histories -m "合并远程 $(date '+%Y-%m-%d %H:%M:%S')"
else
    echo -e "${YELLOW}创建远程分支${NC}"
fi

# 添加所有文件
echo -e "${YELLOW}添加文件...${NC}"
git add .

# 提交
if ! git diff --cached --quiet; then
    git commit -m "备份推送 $(date '+%Y-%m-%d %H:%M:%S')"
fi

# 推送
echo -e "${YELLOW}推送到远程...${NC}"
git push -f origin "$BRANCH"

echo -e "${GREEN}✓ 推送完成${NC}"
