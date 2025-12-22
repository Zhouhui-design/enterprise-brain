#!/bin/bash

# 增强版同步脚本
# 支持推送和拉取选择

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

# 显示菜单
show_menu() {
    echo -e "${BLUE}=== Git 同步工具 ===${NC}"
    echo -e "${GREEN}1. 推送备份到远程（覆盖）${NC}"
    echo -e "${GREEN}2. 从远程拉取恢复${NC}"
    echo -e "${GREEN}3. 查看远程分支${NC}"
    echo -e "${GREEN}4. 查看本地状态${NC}"
    echo -e "${GREEN}0. 退出${NC}"
    echo -n "请选择操作 (0-4): "
}

# 推送备份函数
push_backup() {
    echo -e "${GREEN}=== 开始推送备份 ===${NC}"
    
    cd "$PROJECT_ROOT" || {
        echo -e "${RED}错误: 无法进入项目目录${NC}"
        return 1
    }
    
    # 备份当前更改
    BACKUP_BRANCH="backup-$(date +%Y%m%d-%H%M%S)"
    
    # 添加并提交所有更改
    git add .
    git commit -m "自动备份: $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || \
        echo -e "${YELLOW}没有新的更改需要提交${NC}"
    
    # 创建备份分支
    git branch "$BACKUP_BRANCH"
    
    # 强制推送到远程
    if git push -f origin "$BRANCH"; then
        echo -e "${GREEN}✓ 主分支推送成功${NC}"
        
        # 推送备份分支
        if git push origin "$BACKUP_BRANCH"; then
            echo -e "${GREEN}✓ 备份分支推送成功: $BACKUP_BRANCH${NC}"
        fi
        
        echo -e "${GREEN}备份完成!${NC}"
    else
        echo -e "${RED}✗ 推送失败${NC}"
    fi
}

# 拉取恢复函数
pull_restore() {
    echo -e "${GREEN}=== 开始拉取恢复 ===${NC}"
    
    cd "$PROJECT_ROOT" || {
        echo -e "${RED}错误: 无法进入项目目录${NC}"
        return 1
    }
    
    # 确认操作
    echo -e "${YELLOW}警告: 这将覆盖本地所有未提交的更改！${NC}"
    read -p "确认要继续吗？(y/N): " confirm
    
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo -e "${YELLOW}操作已取消${NC}"
        return
    fi
    
    # 拉取最新代码
    git fetch origin
    
    # 重置到远程状态
    if git reset --hard "origin/$BRANCH"; then
        echo -e "${GREEN}✓ 拉取恢复成功${NC}"
        
        # 清理未被跟踪的文件
        git clean -fd
        echo -e "${GREEN}✓ 已清理未被跟踪的文件${NC}"
    else
        echo -e "${RED}✗ 拉取恢复失败${NC}"
        echo -e "${YELLOW}尝试克隆仓库...${NC}"
        
        cd ..
        rm -rf "$(basename "$PROJECT_ROOT")"
        git clone "$REMOTE_REPO" "$(basename "$PROJECT_ROOT")"
    fi
}

# 查看远程分支
list_remote_branches() {
    echo -e "${GREEN}=== 远程分支列表 ===${NC}"
    git ls-remote --heads "$REMOTE_REPO" | awk -F'/' '{print $3}'
}

# 查看本地状态
show_local_status() {
    echo -e "${GREEN}=== 本地状态 ===${NC}"
    cd "$PROJECT_ROOT" 2>/dev/null && {
        echo -e "${YELLOW}当前分支:${NC}"
        git branch --show-current
        echo -e "${YELLOW}状态:${NC}"
        git status --short
        echo -e "${YELLOW}最近提交:${NC}"
        git log --oneline -5
    } || echo -e "${RED}项目目录不存在${NC}"
}

# 主循环
while true; do
    show_menu
    read choice
    
    case $choice in
        1) push_backup ;;
        2) pull_restore ;;
        3) list_remote_branches ;;
        4) show_local_status ;;
        0) 
            echo -e "${GREEN}再见!${NC}"
            exit 0
            ;;
        *) 
            echo -e "${RED}无效的选择，请重新输入${NC}"
            ;;
    esac
    
    echo ""
    read -p "按回车键继续..."
    clear
done
