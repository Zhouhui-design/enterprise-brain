#!/bin/bash

# 严格推送脚本 - 以本地为权威，完全覆盖远程
# 规则：
# 1. 本地有，远程无 -> 推送本地文件
# 2. 本地无，远程有 -> 删除远程文件
# 3. 都有但不同 -> 用本地覆盖远程

# 配置变量
PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
REMOTE_REPO="https://gitcode.com/sardenesy/enterpise-brain.git"
BRANCH="feature-3"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 严格推送：本地 -> 远程 ===${NC}"
echo -e "${YELLOW}规则：以本地为权威，完全覆盖远程${NC}"
echo ""

# 检查目录
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}错误: 本地项目目录不存在${NC}"
    exit 1
fi

cd "$PROJECT_ROOT" || exit 1

# 检查git仓库
if [ ! -d ".git" ]; then
    echo -e "${RED}错误: 不是git仓库${NC}"
    exit 1
fi

# 配置远程仓库
if ! git remote | grep -q origin; then
    git remote add origin "$REMOTE_REPO"
fi

# 获取远程分支信息
echo -e "${YELLOW}获取远程信息...${NC}"
git fetch origin

# 创建临时工作区
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}创建临时工作区: $TEMP_DIR${NC}"

# 检查远程分支是否存在
if git ls-remote --exit-code origin "$BRANCH" >/dev/null 2>&1; then
    REMOTE_EXISTS=true
    echo -e "${GREEN}✓ 远程分支 $BRANCH 存在${NC}"
    
    # 克隆远程仓库到临时目录
    git clone --branch "$BRANCH" --single-branch "$REMOTE_REPO" "$TEMP_DIR/remote" 2>/dev/null
else
    REMOTE_EXISTS=false
    echo -e "${YELLOW}⚠ 远程分支 $BRANCH 不存在，将创建新分支${NC}"
fi

# 创建当前状态快照
echo -e "${YELLOW}创建本地快照...${NC}"
LOCAL_HASH=$(git log --oneline -1 --pretty=format:"%H" 2>/dev/null || echo "no-commits")

# 方法1：使用git diff和apply策略（更精确）
if [ "$REMOTE_EXISTS" = true ]; then
    echo -e "${YELLOW}开始严格同步...${NC}"
    
    # 临时切换到新分支进行同步操作
    CURRENT_BRANCH=$(git branch --show-current)
    SYNC_BRANCH="sync-$(date +%s)"
    
    # 创建同步分支
    git checkout -b "$SYNC_BRANCH" >/dev/null 2>&1
    
    # 拉取远程更改但不合并
    git fetch origin
    
    # 重置到远程状态
    git reset --hard "origin/$BRANCH" >/dev/null 2>&1
    
    # 创建要删除的文件列表（远程有但本地没有）
    echo -e "${YELLOW}识别需要删除的文件...${NC}"
    
    # 获取远程所有文件列表
    REMOTE_FILES=$(mktemp)
    git ls-tree -r --name-only "origin/$BRANCH" > "$REMOTE_FILES"
    
    # 获取本地所有文件列表
    LOCAL_FILES=$(mktemp)
    find . -type f -not -path "./.git/*" -not -name ".gitignore" -not -name ".gitmodules" | sed 's|^\./||' > "$LOCAL_FILES"
    
    # 找出远程有但本地没有的文件
    TO_DELETE=$(mktemp)
    grep -Fxv -f "$LOCAL_FILES" "$REMOTE_FILES" > "$TO_DELETE"
    
    DELETE_COUNT=$(wc -l < "$TO_DELETE")
    if [ "$DELETE_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}发现 $DELETE_COUNT 个文件需要从远程删除${NC}"
        
        # 删除这些文件
        while IFS= read -r file; do
            if [ -n "$file" ]; then
                git rm --cached "$file" 2>/dev/null
                echo -e "${RED}  - 删除远程文件: $file${NC}"
            fi
        done < "$TO_DELETE"
    fi
    
    # 清理临时文件
    rm -f "$REMOTE_FILES" "$LOCAL_FILES" "$TO_DELETE"
    
    # 添加所有本地文件（这会覆盖已存在的文件）
    echo -e "${YELLOW}添加/更新所有本地文件...${NC}"
    git add .
    
    # 提交更改
    COMMIT_MSG="严格同步: 本地 -> 远程 $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG" >/dev/null 2>&1 || {
        echo -e "${YELLOW}没有需要提交的更改${NC}"
        # 回滚到原分支
        git checkout "$CURRENT_BRANCH" >/dev/null 2>&1
        git branch -D "$SYNC_BRANCH" >/dev/null 2>&1
        echo -e "${GREEN}✓ 本地与远程已经一致${NC}"
        exit 0
    }
    
    # 强制推送到远程
    echo -e "${YELLOW}强制推送到远程...${NC}"
    git push -f origin "$SYNC_BRANCH:$BRANCH"
    
    # 返回原分支
    git checkout "$CURRENT_BRANCH" >/dev/null 2>&1
    git branch -D "$SYNC_BRANCH" >/dev/null 2>&1
    
else
    # 远程分支不存在，直接推送
    echo -e "${YELLOW}创建并推送新分支...${NC}"
    
    # 确保有提交
    if [ "$LOCAL_HASH" = "no-commits" ]; then
        git add .
        git commit -m "初始提交 - 严格同步 $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git push -u origin "$BRANCH"
fi

# 验证推送结果
echo -e "${YELLOW}验证同步结果...${NC}"
if git ls-remote --exit-code origin "$BRANCH" >/dev/null 2>&1; then
    # 获取远程最新提交
    REMOTE_HASH=$(git ls-remote origin "$BRANCH" | awk '{print $1}')
    
    if [ "$REMOTE_HASH" = "$(git rev-parse HEAD)" ]; then
        echo -e "${GREEN}✓ 严格同步成功！远程与本地完全一致${NC}"
    else
        echo -e "${GREEN}✓ 同步完成（远程已有新提交）${NC}"
    fi
else
    echo -e "${RED}✗ 同步失败${NC}"
    exit 1
fi

# 清理
rm -rf "$TEMP_DIR"

echo -e "${BLUE}=== 严格推送完成 ===${NC}"
