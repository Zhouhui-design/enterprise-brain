#!/bin/bash

# 一键拉取恢复脚本
# 从远程仓库拉取代码到本地

# 配置变量
PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
REMOTE_REPO="https://gitcode.com/sardenesy/enterpise-brain.git"
BRANCH="feature-3"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 开始拉取恢复 ===${NC}"

# 检查项目目录是否存在
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${YELLOW}项目目录不存在，创建目录...${NC}"
    mkdir -p "$PROJECT_ROOT"
fi

# 进入项目目录
cd "$PROJECT_ROOT" || exit 1

echo -e "${YELLOW}当前目录: $(pwd)${NC}"

# 检查是否在git仓库中
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}克隆远程仓库...${NC}"
    git clone "$REMOTE_REPO" .
    
    # 切换到指定分支
    echo -e "${YELLOW}切换到 $BRANCH 分支...${NC}"
    git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH"
else
    # 保存当前更改（如果有）
    echo -e "${YELLOW}保存当前更改...${NC}"
    git stash
    
    # 拉取远程最新代码
    echo -e "${YELLOW}拉取远程 $BRANCH 分支最新代码...${NC}"
    git fetch origin
    
    # 重置本地代码到远程状态（强制覆盖）
    echo -e "${YELLOW}重置本地代码到远程状态...${NC}"
    git reset --hard "origin/$BRANCH"
    
    # 清理未被跟踪的文件
    echo -e "${YELLOW}清理未被跟踪的文件...${NC}"
    git clean -fd
fi

echo -e "${GREEN}=== 拉取恢复完成 ===${NC}"
echo -e "${GREEN}分支: $BRANCH${NC}"
echo -e "${GREEN}源: $REMOTE_REPO${NC}"
echo -e "${GREEN}目标目录: $PROJECT_ROOT${NC}"
