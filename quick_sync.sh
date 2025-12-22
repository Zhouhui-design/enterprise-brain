#!/bin/bash

# 快速同步脚本 - 包含严格推送和严格拉取

PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
REMOTE_REPO="https://gitcode.com/sardenesy/enterpise-brain.git"
BRANCH="feature-3"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_menu() {
    clear
    echo -e "${BLUE}=== 严格同步工具 ===${NC}"
    echo ""
    echo -e "${RED}[推送规则]${NC}"
    echo -e "  本地有，远程无 → 推送本地"
    echo -e "  本地无，远程有 → 删除远程"
    echo -e "  都有但不同 → 用本地覆盖远程"
    echo ""
    echo -e "${GREEN}[拉取规则]${NC}"
    echo -e "  远程有，本地无 → 拉取远程"
    echo -e "  远程无，本地有 → 删除本地"
    echo -e "  都有但不同 → 用远程覆盖本地"
    echo ""
    echo -e "${BLUE}操作选项:${NC}"
    echo -e "  1. 严格推送（本地 -> 远程）"
    echo -e "  2. 严格拉取（远程 -> 本地）"
    echo -e "  3. 查看状态"
    echo -e "  0. 退出"
    echo ""
    read -p "请选择 (0-3): " choice
    
    case $choice in
        1)
            echo -e "\n${YELLOW}执行严格推送...${NC}"
            # 调用严格推送函数
            strict_push
            ;;
        2)
            echo -e "\n${YELLOW}执行严格拉取...${NC}"
            # 调用严格拉取函数
            strict_pull
            ;;
        3)
            show_status
            ;;
        0)
            exit 0
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            sleep 1
            ;;
    esac
}

strict_push() {
    cd "$PROJECT_ROOT" 2>/dev/null || {
        echo -e "${RED}目录不存在${NC}"
        return
    }
    
    # 简化版严格推送
    echo -e "${YELLOW}强制推送本地状态到远程...${NC}"
    
    # 保存所有更改
    git add .
    git commit -m "强制同步: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || true
    
    # 强制推送
    if git push -f origin "$BRANCH"; then
        echo -e "${GREEN}✓ 严格推送成功${NC}"
    else
        echo -e "${RED}✗ 推送失败${NC}"
    fi
}

strict_pull() {
    echo -e "${RED}警告：这将完全覆盖本地！${NC}"
    read -p "确认？(y/N): " confirm
    [[ "$confirm" != "y" ]] && return
    
    cd "$PROJECT_ROOT" 2>/dev/null || {
        # 如果目录不存在，直接克隆
        git clone --branch "$BRANCH" "$REMOTE_REPO" "$PROJECT_ROOT"
        return
    }
    
    # 备份
    BACKUP="/tmp/$(basename "$PROJECT_ROOT")-backup-$(date +%s)"
    cp -r "$PROJECT_ROOT" "$BACKUP" 2>/dev/null || true
    
    # 清理并拉取
    rm -rf "$PROJECT_ROOT"
    git clone --branch "$BRANCH" "$REMOTE_REPO" "$PROJECT_ROOT"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 严格拉取成功${NC}"
        echo -e "${YELLOW}备份保存在: $BACKUP${NC}"
    else
        echo -e "${RED}✗ 拉取失败，恢复备份...${NC}"
        mv "$BACKUP" "$PROJECT_ROOT"
    fi
}

show_status() {
    echo -e "${BLUE}=== 状态信息 ===${NC}"
    
    if [ -d "$PROJECT_ROOT/.git" ]; then
        cd "$PROJECT_ROOT"
        echo -e "本地分支: $(git branch --show-current)"
        echo -e "最后提交: $(git log --oneline -1 2>/dev/null || echo '无提交')"
    else
        echo -e "${YELLOW}本地: 不是git仓库${NC}"
    fi
    
    echo -e "远程: $REMOTE_REPO"
    echo -e "分支: $BRANCH"
    
    if git ls-remote --exit-code "$REMOTE_REPO" "$BRANCH" >/dev/null 2>&1; then
        echo -e "${GREEN}远程分支存在${NC}"
    else
        echo -e "${RED}远程分支不存在${NC}"
    fi
}

while true; do
    show_menu
    echo ""
    read -p "按回车继续..."
done
