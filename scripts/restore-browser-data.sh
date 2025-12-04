#!/bin/bash

##############################################################################
# 企业大脑浏览器数据恢复脚本
# 功能：快速启动恢复工具或自动恢复指定备份
# 作者：AI Assistant
# 日期：2024-12-04
##############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
WORKSPACE_ROOT="/home/sardenesy/ai_workspaces/ai_desktop_3"
BACKUP_ROOT="${WORKSPACE_ROOT}/beifenshuju"
RESTORE_TOOL_PORT=8888

# 函数：打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函数：显示使用说明
show_usage() {
    cat << EOF
使用方法:
  $0 [选项] [备份目录]

选项:
  -h, --help              显示此帮助信息
  -l, --list              列出所有可用备份
  -t, --tool              启动Web恢复工具（推荐）
  -q, --quick             快速恢复最新备份的浏览器数据
  -f, --file <文件>       从指定JSON文件恢复浏览器数据

示例:
  $0 --tool                                    # 启动Web恢复工具
  $0 --list                                    # 列出所有备份
  $0 --quick                                   # 快速恢复最新备份
  $0 --file backup.json                        # 从文件恢复
  $0 /path/to/backup_20241204_152312           # 从指定目录恢复

EOF
}

# 函数：列出所有备份
list_backups() {
    print_info "可用的备份："
    echo ""
    
    cd "${BACKUP_ROOT}"
    
    local count=1
    ls -td backup_* 2>/dev/null | grep -v ".tar.gz" | while read -r dir; do
        if [ -d "$dir" ]; then
            local timestamp=$(echo "$dir" | sed 's/backup_//')
            local date_formatted=$(date -d "${timestamp:0:8} ${timestamp:9:2}:${timestamp:11:2}:${timestamp:13:2}" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$timestamp")
            local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
            
            echo -e "${count}. ${GREEN}${dir}${NC}"
            echo "   时间: ${date_formatted}"
            echo "   大小: ${size}"
            
            # 检查是否有浏览器数据备份
            if [ -f "${BACKUP_ROOT}/${dir}/frontend-data/"*.json 2>/dev/null ]; then
                echo -e "   浏览器数据: ${GREEN}✅ 已备份${NC}"
            else
                echo -e "   浏览器数据: ${YELLOW}⚠️  需手动备份${NC}"
            fi
            
            echo ""
            ((count++))
        fi
    done
    
    # 检查单独的JSON备份文件
    print_info "单独的浏览器数据备份文件："
    echo ""
    ls -t localStorage_backup_*.json 2>/dev/null | head -n 5 | while read -r file; do
        local size=$(du -sh "$file" 2>/dev/null | cut -f1)
        local timestamp=$(stat -c %y "$file" | cut -d'.' -f1)
        echo -e "- ${GREEN}${file}${NC}"
        echo "  时间: ${timestamp}"
        echo "  大小: ${size}"
        echo ""
    done
}

# 函数：启动Web恢复工具
start_restore_tool() {
    print_info "启动Web数据恢复工具..."
    echo ""
    
    # 检查端口是否被占用
    if lsof -Pi :${RESTORE_TOOL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "端口 ${RESTORE_TOOL_PORT} 已被占用，尝试使用其他端口..."
        RESTORE_TOOL_PORT=$((RESTORE_TOOL_PORT + 1))
    fi
    
    cd "${WORKSPACE_ROOT}"
    
    echo "======================================"
    echo -e "${GREEN}数据恢复工具已启动${NC}"
    echo "======================================"
    echo ""
    echo "访问地址："
    echo -e "  ${BLUE}http://localhost:${RESTORE_TOOL_PORT}/scripts/browser-data-restore.html${NC}"
    echo ""
    echo "操作步骤："
    echo "  1. 在浏览器中打开上述地址"
    echo "  2. 点击'📁 选择备份文件'"
    echo "  3. 选择备份文件: ${BACKUP_ROOT}/localStorage_backup_*.json"
    echo "  4. 点击'🔄 恢复数据'"
    echo "  5. 等待恢复完成后刷新页面"
    echo ""
    echo "提示："
    echo "  - 备份文件位置: ${BACKUP_ROOT}/"
    echo "  - 最新备份: $(ls -t ${BACKUP_ROOT}/localStorage_backup_*.json 2>/dev/null | head -n1)"
    echo ""
    echo "按 Ctrl+C 停止服务"
    echo "======================================"
    echo ""
    
    # 启动HTTP服务器
    python3 -m http.server ${RESTORE_TOOL_PORT}
}

# 函数：快速恢复最新备份
quick_restore() {
    print_info "查找最新的浏览器数据备份..."
    
    local latest_backup=$(ls -t "${BACKUP_ROOT}"/localStorage_backup_*.json 2>/dev/null | head -n1)
    
    if [ -z "$latest_backup" ]; then
        print_error "未找到浏览器数据备份文件"
        echo ""
        print_info "建议使用以下方式恢复："
        echo "  $0 --tool    # 启动Web恢复工具"
        exit 1
    fi
    
    print_success "找到最新备份: $latest_backup"
    print_info "使用Web恢复工具进行恢复..."
    echo ""
    
    # 直接启动恢复工具
    start_restore_tool
}

# 函数：从指定备份目录恢复
restore_from_backup_dir() {
    local backup_dir=$1
    
    if [ ! -d "$backup_dir" ]; then
        print_error "备份目录不存在: $backup_dir"
        exit 1
    fi
    
    print_info "从备份目录恢复: $backup_dir"
    echo ""
    
    # 恢复配置文件
    if [ -d "${backup_dir}/configs" ]; then
        print_info "恢复配置文件..."
        
        if [ -f "${backup_dir}/configs/.env.development" ]; then
            cp "${backup_dir}/configs/.env.development" "${WORKSPACE_ROOT}/07-frontend/"
            print_success "已恢复: .env.development"
        fi
        
        if [ -f "${backup_dir}/configs/.env.production" ]; then
            cp "${backup_dir}/configs/.env.production" "${WORKSPACE_ROOT}/07-frontend/"
            print_success "已恢复: .env.production"
        fi
        
        if [ -f "${backup_dir}/configs/database.js" ]; then
            mkdir -p "${WORKSPACE_ROOT}/backend/config"
            cp "${backup_dir}/configs/database.js" "${WORKSPACE_ROOT}/backend/config/"
            print_success "已恢复: database.js"
        fi
    fi
    
    # 恢复后端数据库
    if [ -f "${backup_dir}/backend-database/enterprise_brain.db" ]; then
        print_info "恢复后端数据库..."
        mkdir -p "${WORKSPACE_ROOT}/backend"
        cp "${backup_dir}/backend-database/enterprise_brain.db" "${WORKSPACE_ROOT}/backend/"
        print_success "已恢复: enterprise_brain.db"
    fi
    
    # 检查浏览器数据备份
    local browser_backup=$(find "${backup_dir}/frontend-data" -name "*.json" 2>/dev/null | head -n1)
    
    if [ -n "$browser_backup" ]; then
        print_info "找到浏览器数据备份: $browser_backup"
        print_info "启动Web恢复工具..."
        echo ""
        print_warning "请在浏览器中手动选择以下文件进行恢复："
        echo "  $browser_backup"
        echo ""
        start_restore_tool
    else
        print_warning "未找到浏览器数据备份，跳过"
        print_info "如果需要恢复浏览器数据，请手动使用恢复工具"
        echo ""
        echo "恢复完成！"
    fi
}

# 函数：从指定JSON文件恢复
restore_from_json() {
    local json_file=$1
    
    if [ ! -f "$json_file" ]; then
        print_error "备份文件不存在: $json_file"
        exit 1
    fi
    
    print_success "找到备份文件: $json_file"
    print_info "启动Web恢复工具..."
    echo ""
    print_warning "请在浏览器中手动选择以下文件进行恢复："
    echo "  $json_file"
    echo ""
    
    start_restore_tool
}

# 函数：交互式恢复
interactive_restore() {
    echo ""
    echo "======================================"
    echo "  企业大脑系统 - 数据恢复向导"
    echo "======================================"
    echo ""
    
    print_info "请选择恢复方式："
    echo ""
    echo "1. 使用Web恢复工具（推荐）"
    echo "2. 从最新备份快速恢复"
    echo "3. 从指定备份目录恢复"
    echo "4. 查看所有可用备份"
    echo "5. 退出"
    echo ""
    
    read -p "请输入选项 (1-5): " choice
    
    case $choice in
        1)
            start_restore_tool
            ;;
        2)
            quick_restore
            ;;
        3)
            list_backups
            echo ""
            read -p "请输入备份目录名称: " backup_name
            restore_from_backup_dir "${BACKUP_ROOT}/${backup_name}"
            ;;
        4)
            list_backups
            echo ""
            interactive_restore
            ;;
        5)
            print_info "退出恢复向导"
            exit 0
            ;;
        *)
            print_error "无效的选项"
            interactive_restore
            ;;
    esac
}

# 主流程
main() {
    # 解析命令行参数
    if [ $# -eq 0 ]; then
        interactive_restore
        exit 0
    fi
    
    case "$1" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -l|--list)
            list_backups
            exit 0
            ;;
        -t|--tool)
            start_restore_tool
            exit 0
            ;;
        -q|--quick)
            quick_restore
            exit 0
            ;;
        -f|--file)
            if [ -z "$2" ]; then
                print_error "请指定备份文件"
                show_usage
                exit 1
            fi
            restore_from_json "$2"
            exit 0
            ;;
        *)
            if [ -d "$1" ]; then
                restore_from_backup_dir "$1"
            else
                print_error "无效的参数或目录不存在: $1"
                show_usage
                exit 1
            fi
            ;;
    esac
}

# 执行主流程
main "$@"
