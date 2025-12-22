#!/bin/bash

PROJECT_ROOT="/home/sardensy/enterprise-brain/enterpise-brain"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_menu() {
    clear
    echo "=== 同步管理 ==="
    echo "1. 推送（本地→远程）"
    echo "2. 拉取（远程→本地）"
    echo "3. 检查状态"
    echo "4. 查看脚本"
    echo "0. 退出"
    echo ""
    read -p "选择: " choice
    
    case $choice in
        1) do_push ;;
        2) do_pull ;;
        3) check_status ;;
        4) list_scripts ;;
        0) exit 0 ;;
        *) echo -e "${RED}无效选择${NC}" ;;
    esac
}

do_push() {
    echo -e "${YELLOW}执行推送...${NC}"
    bash push_backup.sh
    read -p "按回车继续..."
}

do_pull() {
    echo -e "${RED}警告：将覆盖本地文件！${NC}"
    read -p "确认？(y/N): " confirm
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
        bash pull_restore.sh
    fi
    read -p "按回车继续..."
}

check_status() {
    cd "$PROJECT_ROOT" 2>/dev/null || {
        echo -e "${RED}目录不存在${NC}"
        return
    }
    
    echo -e "${YELLOW}=== 状态检查 ===${NC}"
    
    # Git状态
    if [ -d ".git" ]; then
        echo -e "${GREEN}✓ Git仓库${NC}"
        echo "当前分支: $(git branch --show-current 2>/dev/null || echo '未知')"
        echo "最新提交: $(git log --oneline -1 2>/dev/null || echo '无')"
    else
        echo -e "${RED}✗ 不是Git仓库${NC}"
    fi
    
    # 脚本状态
    echo ""
    echo -e "${YELLOW}脚本文件:${NC}"
    for script in push_backup.sh pull_restore.sh sync_manager.sh; do
        if [ -f "$script" ]; then
            echo -e "${GREEN}  ✓ $script${NC}"
        else
            echo -e "${RED}  ✗ $script${NC}"
        fi
    done
    
    read -p "按回车继续..."
}

list_scripts() {
    echo -e "${YELLOW}=== 可用脚本 ===${NC}"
    echo "1. push_backup.sh - 推送备份"
    echo "2. pull_restore.sh - 拉取恢复"
    echo "3. sync_manager.sh - 管理菜单"
    echo ""
    echo "用法："
    echo "  ./push_backup.sh    # 推送本地到远程"
    echo "  ./pull_restore.sh   # 从远程拉取"
    echo "  ./sync_manager.sh   # 打开管理菜单"
    echo ""
    read -p "按回车继续..."
}

while true; do
    show_menu
done
