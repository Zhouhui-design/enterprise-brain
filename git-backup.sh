#!/bin/bash
# ============================================
# Git 即时备份恢复脚本
# 版本：v1.0 - 专为开发测试设计
# 功能：测试通过后立即完整备份，修改混乱时一键恢复
# ============================================

# 配置常量
SCRIPT_NAME="$(basename "$0")"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_TAG="backup_$TIMESTAMP"
REMOTE="origin"
BRANCH="master"  # 或根据你的项目分支

# 颜色配置
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================
# 主菜单
# ============================================
show_menu() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║        Git 即时备份恢复工具           ║${NC}"
    echo -e "${CYAN}║      开发模式 vs 备份模式            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}【开发模式】${NC}"
    echo "  1. 🧪 测试通过，立即备份（推送）"
    echo "  2. 📝 只提交不上传（本地提交）"
    echo "  3. 🔍 查看当前状态"
    echo ""
    echo -e "${YELLOW}【恢复模式】${NC}"
    echo "  4. 🔄 恢复最新备份（拉取+强制覆盖）"
    echo "  5. 📋 列出所有备份"
    echo "  6. ⏮️  恢复到指定备份点"
    echo ""
    echo -e "${BLUE}【管理选项】${NC}"
    echo "  7. 🧹 清理本地未跟踪文件"
    echo "  8. 🔧 配置远程仓库"
    echo "  9. ❓ 帮助信息"
    echo "  0. 🚪 退出"
    echo ""
    echo -e "${CYAN}当前项目: $(basename $(pwd))${NC}"
    echo -e "${CYAN}当前分支: $(git branch --show-current 2>/dev/null || echo "未初始化")${NC}"
    echo ""
}

# ============================================
# 初始化检查
# ============================================
init_check() {
    # 检查是否在git仓库
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ 当前目录不是Git仓库${NC}"
        echo -e "是否初始化为Git仓库？(y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            git init
            echo -e "${GREEN}✅ 已初始化Git仓库${NC}"
        else
            exit 1
        fi
    fi
    
    # 检查是否有远程仓库
    if ! git remote | grep -q "^$REMOTE$"; then
        echo -e "${YELLOW}⚠️  未配置远程仓库 '$REMOTE'${NC}"
        echo -e "请输入远程仓库URL（如：https://github.com/user/repo.git）："
        read -r remote_url
        if [ -n "$remote_url" ]; then
            git remote add origin "$remote_url"
            echo -e "${GREEN}✅ 已添加远程仓库${NC}"
        fi
    fi
}

# ============================================
# 选项1：立即备份（完整推送）
# ============================================
backup_now() {
    echo -e "${BLUE}🧪 准备完整备份...${NC}"
    echo -e "${YELLOW}⚠️  此操作将：${NC}"
    echo "  1. 提交所有更改"
    echo "  2. 推送到远程仓库"
    echo "  3. 标记为备份点：$BACKUP_TAG"
    echo ""
    
    # 确认
    read -p "确定要备份吗？(y/n): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}取消备份${NC}"
        return
    fi
    
    echo ""
    echo -e "${CYAN}步骤1: 检查工作区状态...${NC}"
    
    # 检查是否有更改
    if git diff-index --quiet HEAD -- && git diff-index --cached --quiet HEAD --; then
        echo -e "${YELLOW}⚠️  没有需要提交的更改${NC}"
    else
        # 显示将要提交的文件
        echo -e "${CYAN}将要提交的文件：${NC}"
        git status --short
        
        # 添加所有文件（包括新文件）
        echo -e "\n${CYAN}步骤2: 添加所有文件...${NC}"
        git add -A
        
        # 提交
        echo -e "\n${CYAN}步骤3: 提交更改...${NC}"
        commit_msg="🔒 备份点: $BACKUP_TAG - $(date '+%Y-%m-%d %H:%M:%S')"
        if git commit -m "$commit_msg"; then
            echo -e "${GREEN}✅ 提交成功${NC}"
        else
            echo -e "${RED}❌ 提交失败${NC}"
            return 1
        fi
    fi
    
    # 推送到远程
    echo -e "\n${CYAN}步骤4: 推送到远程仓库...${NC}"
    current_branch=$(git branch --show-current)
    
    if git push --force "$REMOTE" "$current_branch"; then
        echo -e "${GREEN}✅ 推送成功${NC}"
        
        # 创建标签作为备份点
        echo -e "\n${CYAN}步骤5: 创建备份标签...${NC}"
        git tag -f "$BACKUP_TAG"
        git push --force "$REMOTE" "$BACKUP_TAG"
        echo -e "${GREEN}✅ 备份标签已创建: $BACKUP_TAG${NC}"
        
        echo -e "\n${GREEN}🎉 备份完成！${NC}"
        echo -e "备份点: $BACKUP_TAG"
        echo -e "时间: $(date '+%Y-%m-%d %H:%M:%S')"
        echo -e "远程: $REMOTE/$current_branch"
    else
        echo -e "${RED}❌ 推送失败${NC}"
        echo -e "${YELLOW}尝试使用更强制的方式...${NC}"
        
        # 尝试更强制的方式
        if git push --force-with-lease "$REMOTE" "$current_branch"; then
            echo -e "${GREEN}✅ 推送成功（使用force-with-lease）${NC}"
        else
            echo -e "${RED}❌ 推送完全失败，请检查网络和权限${NC}"
        fi
    fi
    
    echo ""
    read -p "按回车键继续..."
}

# ============================================
# 选项2：只提交不同步
# ============================================
commit_only() {
    echo -e "${BLUE}📝 本地提交（不上传）${NC}"
    
    # 显示状态
    git status --short
    
    echo ""
    echo "选择提交范围："
    echo "1. 提交所有更改（包括新文件）"
    echo "2. 只提交已修改的文件（不提交新文件）"
    echo "3. 提交指定文件"
    echo "0. 返回"
    
    read -p "请选择: " -r choice
    
    case $choice in
        1)
            git add -A
            ;;
        2)
            git add -u
            ;;
        3)
            echo "请输入要提交的文件（空格分隔，支持通配符）："
            read -r files
            if [ -n "$files" ]; then
                git add $files
            else
                echo -e "${YELLOW}未选择文件，取消提交${NC}"
                return
            fi
            ;;
        0)
            return
            ;;
        *)
            echo -e "${RED}无效选择${NC}"
            return
            ;;
    esac
    
    # 输入提交信息
    echo ""
    echo "请输入提交信息（留空使用默认信息）："
    read -r commit_msg
    if [ -z "$commit_msg" ]; then
        commit_msg="📝 本地提交: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    # 提交
    if git commit -m "$commit_msg"; then
        echo -e "${GREEN}✅ 本地提交成功${NC}"
        echo -e "提交信息: $commit_msg"
        echo -e "哈希: $(git rev-parse --short HEAD)"
    else
        echo -e "${RED}❌ 提交失败${NC}"
    fi
    
    echo ""
    read -p "按回车键继续..."
}

# ============================================
# 选项4：恢复最新备份
# ============================================
restore_latest_backup() {
    echo -e "${YELLOW}🔄 警告：此操作将完全覆盖本地文件！${NC}"
    echo -e "${RED}⚠️  所有未提交的更改都将丢失！${NC}"
    echo ""
    echo "将执行的操作："
    echo "1. 丢弃所有本地更改"
    echo "2. 从远程拉取最新代码"
    echo "3. 完全覆盖本地文件"
    echo ""
    
    read -p "确定要恢复最新备份吗？(输入'YES'确认): " -r
    if [ "$REPLY" != "YES" ]; then
        echo -e "${YELLOW}取消恢复${NC}"
        return
    fi
    
    echo ""
    echo -e "${CYAN}步骤1: 获取远程最新状态...${NC}"
    git fetch --all --tags
    
    echo -e "\n${CYAN}步骤2: 丢弃所有本地更改...${NC}"
    
    # 方法1：重置到远程最新
    current_branch=$(git branch --show-current)
    git reset --hard "$REMOTE/$current_branch"
    
    # 方法2：如果方法1失败，使用更彻底的方式
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  使用备选恢复方案...${NC}"
        
        # 保存当前分支
        if [ -n "$current_branch" ]; then
            # 切换到临时分支
            git checkout --orphan temp_restore
            git add -A
            git commit -m "临时保存"
            
            # 删除原分支
            git branch -D "$current_branch"
            
            # 重新创建分支
            git checkout -b "$current_branch"
            git fetch "$REMOTE"
            git reset --hard "$REMOTE/$current_branch"
        fi
    fi
    
    echo -e "\n${CYAN}步骤3: 清理未跟踪文件...${NC}"
    git clean -fd
    
    echo -e "\n${CYAN}步骤4: 检查恢复结果...${NC}"
    
    # 显示恢复后的状态
    echo -e "${GREEN}✅ 恢复完成！${NC}"
    echo ""
    echo -e "当前提交: $(git log --oneline -1)"
    echo -e "远程分支: $REMOTE/$current_branch"
    echo -e "恢复时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    echo ""
    echo -e "${BLUE}📋 恢复后的文件状态：${NC}"
    git status --short
    
    echo ""
    read -p "按回车键继续..."
}

# ============================================
# 选项5：列出备份点
# ============================================
list_backups() {
    echo -e "${BLUE}📋 可用的备份点：${NC}"
    echo ""
    
    # 获取本地标签
    echo -e "${CYAN}本地标签：${NC}"
    git tag -l "backup_*" --sort=-v:refname | head -10 | while read tag; do
        commit_date=$(git log -1 --format="%ai" "$tag")
        echo -e "  🏷️   $tag"
        echo -e "     📅 $commit_date"
        echo -e "     🔗 $(git log -1 --format="%h" "$tag")"
        echo ""
    done
    
    # 获取远程标签
    echo -e "${CYAN}远程标签：${NC}"
    git ls-remote --tags "$REMOTE" | grep "backup_" | sort -V -r | head -10 | while read line; do
        hash=$(echo "$line" | awk '{print $1}')
        tag=$(echo "$line" | awk '{print $2}' | sed 's|refs/tags/||')
        echo -e "  🏷️   $tag"
        echo -e "     🔗 ${hash:0:7}"
        echo ""
    done
    
    echo ""
    read -p "按回车键继续..."
}

# ============================================
# 选项7：清理本地文件
# ============================================
clean_local() {
    echo -e "${YELLOW}🧹 清理本地未跟踪文件${NC}"
    echo ""
    echo "选择清理级别："
    echo "1. 查看将删除的文件（预览）"
    echo "2. 删除所有未跟踪文件（危险！）"
    echo "3. 删除未跟踪文件和目录"
    echo "0. 返回"
    
    read -p "请选择: " -r choice
    
    case $choice in
        1)
            echo -e "\n${CYAN}将删除的文件：${NC}"
            git clean -dn
            ;;
        2)
            echo -e "\n${RED}⚠️  确定删除所有未跟踪文件？(y/n): ${NC}"
            read -r confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                git clean -f
                echo -e "${GREEN}✅ 已清理${NC}"
            fi
            ;;
        3)
            echo -e "\n${RED}⚠️  确定删除所有未跟踪文件和目录？(y/n): ${NC}"
            read -r confirm
            if [[ $confirm =~ ^[Yy]$ ]]; then
                git clean -fd
                echo -e "${GREEN}✅ 已清理${NC}"
            fi
            ;;
    esac
    
    echo ""
    read -p "按回车键继续..."
}

# ============================================
# 关于IDE提交的建议
# ============================================
show_ide_advice() {
    echo -e "${CYAN}🤔 关于IDE自动提交的建议：${NC}"
    echo ""
    echo -e "${YELLOW}建议方案：${NC}"
    echo "1. 📍 禁用IDE的自动提交功能"
    echo "2. 🔧 使用此脚本进行有控制的提交"
    echo "3. 📝 理由："
    echo "   - IDE的自动提交可能打断你的工作流"
    echo "   - 自动提交的提交信息可能没有意义"
    echo "   - 可能导致不必要的提交历史"
    echo ""
    echo -e "${GREEN}推荐工作流：${NC}"
    echo "1. 开发时：IDE自动保存，但不要自动提交"
    echo "2. 测试通过后：使用此脚本的【立即备份】"
    echo "3. 修改混乱时：使用此脚本的【恢复备份】"
    echo ""
    echo -e "${BLUE}IDE设置建议：${NC}"
    echo "- VS Code: 禁用 git.autofetch 和 git.postCommitCommand"
    echo "- IntelliJ: 禁用 'Commit on Save'"
    echo "- Vim/Emacs: 使用手动提交"
    echo ""
    
    read -p "按回车键继续..."
}

# ============================================
# 主循环
# ============================================
main() {
    # 初始化检查
    init_check
    
    while true; do
        show_menu
        
        echo -e "${CYAN}请选择操作 (0-9): ${NC}"
        read -r choice
        
        case $choice in
            1) backup_now ;;
            2) commit_only ;;
            3) 
                echo -e "${CYAN}📊 当前状态：${NC}"
                git status
                echo ""
                read -p "按回车键继续..."
                ;;
            4) restore_latest_backup ;;
            5) list_backups ;;
            6) 
                echo -e "${YELLOW}功能开发中...${NC}"
                read -p "按回车键继续..."
                ;;
            7) clean_local ;;
            8) 
                echo "当前远程仓库："
                git remote -v
                echo ""
                read -p "按回车键继续..."
                ;;
            9) show_ide_advice ;;
            0) 
                echo -e "${GREEN}👋 再见！${NC}"
                exit 0
                ;;
            *) 
                echo -e "${RED}❌ 无效选择${NC}"
                sleep 1
                ;;
        esac
    done
}

# ============================================
# 脚本入口
# ============================================

# 检查参数
if [ "$1" = "--backup" ] || [ "$1" = "-b" ]; then
    # 命令行模式：直接备份
    init_check
    backup_now
elif [ "$1" = "--restore" ] || [ "$1" = "-r" ]; then
    # 命令行模式：直接恢复
    init_check
    restore_latest_backup
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "用法: $SCRIPT_NAME [选项]"
    echo "选项:"
    echo "  -b, --backup   立即备份"
    echo "  -r, --restore  恢复最新备份"
    echo "  -h, --help     显示帮助"
    echo ""
    echo "无参数：进入交互模式"
else
    # 交互模式
    main
fi
