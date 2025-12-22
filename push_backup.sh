#!/bin/bash

# 一键推送备份脚本
# 将本地代码推送到远程仓库并强制覆盖

# 配置变量
PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
REMOTE_REPO="https://gitcode.com/sardenesy/enterpise-brain.git"
BRANCH="feature-3"
BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 开始备份推送 ===${NC}"

# 检查项目目录是否存在
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}错误: 项目目录不存在: $PROJECT_ROOT${NC}"
    exit 1
fi

# 进入项目目录
cd "$PROJECT_ROOT" || exit 1

echo -e "${YELLOW}当前目录: $(pwd)${NC}"

# 检查是否在git仓库中
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}初始化git仓库...${NC}"
    git init
    
    # 配置远程仓库
    echo -e "${YELLOW}添加远程仓库...${NC}"
    git remote add origin "$REMOTE_REPO"
    
    # 创建初始提交
    echo -e "${YELLOW}创建初始提交...${NC}"
    git add .
    git commit -m "初始提交 - $(date '+%Y-%m-%d %H:%M:%S')"
else
    # 检查远程仓库配置
    if ! git remote | grep -q origin; then
        echo -e "${YELLOW}添加远程仓库...${NC}"
        git remote add origin "$REMOTE_REPO"
    fi
    
    # 拉取远程最新代码（避免冲突）
    echo -e "${YELLOW}拉取远程最新代码...${NC}"
    git fetch origin
    
    # 添加所有更改
    echo -e "${YELLOW}添加所有更改到暂存区...${NC}"
    git add .
    
    # 提交更改
    echo -e "${YELLOW}提交更改...${NC}"
    git commit -m "备份提交 - $(date '+%Y-%m-%d %H:%M:%S')" || echo -e "${YELLOW}没有新的更改需要提交${NC}"
fi

# 创建备份分支
echo -e "${YELLOW}创建备份分支: $BACKUP_BRANCH${NC}"
git branch "$BACKUP_BRANCH"

# 推送代码到远程仓库（强制覆盖）
echo -e "${YELLOW}强制推送到远程仓库 $BRANCH 分支...${NC}"
git push -f origin "$BRANCH"

# 推送备份分支
echo -e "${YELLOW}推送备份分支到远程...${NC}"
git push origin "$BACKUP_BRANCH"

echo -e "${GREEN}=== 备份推送完成 ===${NC}"
echo -e "${GREEN}主分支: $BRANCH${NC}"
echo -e "${GREEN}备份分支: $BACKUP_BRANCH${NC}"
echo -e "${GREEN}远程仓库: $REMOTE_REPO${NC}"
