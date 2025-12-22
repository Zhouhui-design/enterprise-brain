#!/bin/bash

# 严格拉取脚本 - 以远程为权威，完全覆盖本地
# 规则：
# 1. 远程有，本地无 -> 拉取远程文件
# 2. 远程无，本地有 -> 删除本地文件
# 3. 都有但不同 -> 用远程覆盖本地

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

echo -e "${BLUE}=== 严格拉取：远程 -> 本地 ===${NC}"
echo -e "${YELLOW}规则：以远程为权威，完全覆盖本地${NC}"
echo ""

# 确认操作
echo -e "${RED}警告：这将完全覆盖本地所有更改！${NC}"
read -p "确认继续吗？(输入 'yes' 继续): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${YELLOW}操作取消${NC}"
    exit 0
fi

# 检查远程分支是否存在
echo -e "${YELLOW}检查远程仓库...${NC}"
if ! git ls-remote --exit-code "$REMOTE_REPO" "$BRANCH" >/dev/null 2>&1; then
    echo -e "${RED}错误: 远程分支 $BRANCH 不存在${NC}"
    exit 1
fi

# 如果本地目录不存在，直接克隆
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${YELLOW}本地目录不存在，直接克隆...${NC}"
    git clone --branch "$BRANCH" "$REMOTE_REPO" "$PROJECT_ROOT"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 克隆成功${NC}"
    else
        echo -e "${RED}✗ 克隆失败${NC}"
    fi
    exit 0
fi

cd "$PROJECT_ROOT" || exit 1

# 备份当前状态（可选）
BACKUP_DIR="/tmp/backup-$(basename "$PROJECT_ROOT")-$(date +%Y%m%d-%H%M%S)"
echo -e "${YELLOW}创建本地备份: $BACKUP_DIR${NC}"
mkdir -p "$BACKUP_DIR"
find . -maxdepth 1 -not -name "." -not -name ".git" -exec cp -r {} "$BACKUP_DIR/" \; 2>/dev/null || true

# 方法：使用git worktree实现精确同步
echo -e "${YELLOW}开始严格拉取...${NC}"

# 保存当前分支
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")

# 创建临时目录
TEMP_DIR=$(mktemp -d)
echo -e "${YELLOW}使用临时目录: $TEMP_DIR${NC}"

# 克隆远程仓库到临时目录
echo -e "${YELLOW}获取远程最新状态...${NC}"
git clone --branch "$BRANCH" --depth 1 "$REMOTE_REPO" "$TEMP_DIR/remote"

# 获取远程文件列表
echo -e "${YELLOW}分析文件差异...${NC}"
REMOTE_FILES_LIST=$(mktemp)
cd "$TEMP_DIR/remote"
find . -type f -not -path "./.git/*" | sed 's|^\./||' | sort > "$REMOTE_FILES_LIST"

# 获取本地文件列表
LOCAL_FILES_LIST=$(mktemp)
cd "$PROJECT_ROOT"
find . -type f -not -path "./.git/*" | sed 's|^\./||' | sort > "$LOCAL_FILES_LIST"

# 找出本地有但远程没有的文件
TO_REMOVE_LOCAL=$(mktemp)
grep -Fxv -f "$REMOTE_FILES_LIST" "$LOCAL_FILES_LIST" > "$TO_REMOVE_LOCAL"

REMOVE_COUNT=$(wc -l < "$TO_REMOVE_LOCAL")
if [ "$REMOVE_COUNT" -gt 0 ]; then
    echo -e "${YELLOW}发现 $REMOVE_COUNT 个文件需要从本地删除${NC}"
    
    # 备份这些文件到日志
    BACKUP_LOG="$BACKUP_DIR/deleted_files.log"
    echo "# 以下文件被删除（远程不存在）" > "$BACKUP_LOG"
    cat "$TO_REMOVE_LOCAL" >> "$BACKUP_LOG"
    
    # 删除这些文件
    while IFS= read -r file; do
        if [ -n "$file" ]; then
            rm -f "$file"
            # 删除空目录
            dir=$(dirname "$file")
            if [ -d "$dir" ]; then
                find "$dir" -type d -empty -delete 2>/dev/null || true
            fi
            echo -e "${RED}  - 删除本地文件: $file${NC}"
        fi
    done < "$TO_REMOVE_LOCAL"
fi

# 清理空目录
find . -type d -empty -not -path "./.git/*" -delete 2>/dev/null || true

# 重置本地仓库到远程状态
echo -e "${YELLOW}重置本地仓库...${NC}"

# 如果当前不是git仓库，重新初始化
if [ ! -d ".git" ]; then
    rm -rf .git
    git init
    git remote add origin "$REMOTE_REPO"
fi

# 获取远程所有分支和提交
git fetch origin --force

# 清理本地所有未跟踪文件
git clean -fd

# 重置到远程分支
git checkout -B "$BRANCH" "origin/$BRANCH" --force

# 确保所有远程文件都被检出
echo -e "${YELLOW}同步文件...${NC}"
cd "$TEMP_DIR/remote"
rsync -av --delete \
    --exclude='.git/' \
    --exclude='.gitignore' \
    --exclude='.gitmodules' \
    . "$PROJECT_ROOT/"

# 恢复.git目录
cd "$PROJECT_ROOT"
if [ -d "$TEMP_DIR/remote/.git" ]; then
    rm -rf .git
    cp -r "$TEMP_DIR/remote/.git" .
fi

# 验证结果
echo -e "${YELLOW}验证同步结果...${NC}"
cd "$PROJECT_ROOT"

# 检查本地状态
LOCAL_HASH=$(git log --oneline -1 --pretty=format:"%H")
REMOTE_HASH=$(git ls-remote origin "$BRANCH" | awk '{print $1}')

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    echo -e "${GREEN}✓ 严格拉取成功！本地与远程完全一致${NC}"
    
    # 显示统计信息
    echo ""
    echo -e "${BLUE}=== 同步统计 ===${NC}"
    echo -e "远程文件数: $(wc -l < "$REMOTE_FILES_LIST")"
    echo -e "删除文件数: $REMOVE_COUNT"
    if [ "$REMOVE_COUNT" -gt 0 ]; then
        echo -e "备份位置: $BACKUP_DIR"
    fi
else
    echo -e "${YELLOW}⚠ 哈希不匹配，但文件已同步${NC}"
    echo -e "本地: $LOCAL_HASH"
    echo -e "远程: $REMOTE_HASH"
fi

# 清理临时文件
rm -rf "$TEMP_DIR"
rm -f "$REMOTE_FILES_LIST" "$LOCAL_FILES_LIST" "$TO_REMOVE_LOCAL"

echo -e "${BLUE}=== 严格拉取完成 ===${NC}"
