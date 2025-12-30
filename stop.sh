#!/bin/bash

# Enterprise Brain 停止脚本
# Docker容器化版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date '+%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# 检查Docker环境
check_docker() {
    print_message $BLUE "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_message $RED "❌ Docker Compose未安装"
        exit 1
    fi
    
    print_message $GREEN "✅ Docker环境检查通过"
}

# 停止服务
stop_services() {
    print_message $BLUE "停止Enterprise Brain服务..."
    
    if docker-compose ps -q | grep -q .; then
        print_message $YELLOW "🛑 正在停止容器..."
        docker-compose down
        
        # 等待容器完全停止
        print_message $YELLOW "⏳ 等待容器停止..."
        sleep 5
        
        # 检查是否还有运行中的容器
        if docker-compose ps -q | grep -q .; then
            print_message $YELLOW "⚠️ 强制停止剩余容器..."
            docker-compose down --force
        fi
        
        print_message $GREEN "✅ 服务已停止"
    else
        print_message $YELLOW "⚠️ 没有运行中的服务"
    fi
}

# 清理资源（可选）
cleanup_resources() {
    if [ "$1" = "--cleanup" ]; then
        print_message $BLUE "🧹 清理Docker资源..."
        
        # 清理停止的容器
        docker container prune -f
        
        # 清理未使用的镜像
        docker image prune -f
        
        # 清理未使用的网络
        docker network prune -f
        
        print_message $GREEN "✅ 资源清理完成"
    fi
}

# 备份数据（可选）
backup_data() {
    if [ "$1" = "--backup" ]; then
        print_message $BLUE "💾 备份数据..."
        
        local backup_dir="backups/manual_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        # 备份MySQL数据
        if [ -d "data/mysql" ]; then
            cp -r data/mysql "$backup_dir/"
            print_message $GREEN "✅ MySQL数据已备份"
        fi
        
        # 备份Redis数据
        if [ -d "data/redis" ]; then
            cp -r data/redis "$backup_dir/"
            print_message $GREEN "✅ Redis数据已备份"
        fi
        
        # 备份上传文件
        if [ -d "data/uploads" ]; then
            cp -r data/uploads "$backup_dir/"
            print_message $GREEN "✅ 上传文件已备份"
        fi
        
        # 备份配置文件
        cp .env "$backup_dir/" 2>/dev/null || true
        cp docker-compose.yml "$backup_dir/" 2>/dev/null || true
        
        print_message $GREEN "✅ 数据备份完成: $backup_dir"
    fi
}

# 显示状态
show_status() {
    print_message $BLUE "📊 检查服务状态..."
    
    if docker-compose ps -q | grep -q .; then
        print_message $YELLOW "⚠️ 仍有服务在运行："
        docker-compose ps
    else
        print_message $GREEN "✅ 所有服务已停止"
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --backup    停止前备份数据"
    echo "  --cleanup   停止后清理Docker资源"
    echo "  --help      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                # 仅停止服务"
    echo "  $0 --backup       # 停止服务并备份数据"
    echo "  $0 --cleanup      # 停止服务并清理资源"
    echo "  $0 --backup --cleanup  # 停止服务、备份数据并清理资源"
}

# 主函数
main() {
    local backup_flag=false
    local cleanup_flag=false
    
    # 解析参数
    for arg in "$@"; do
        case $arg in
            --backup)
                backup_flag=true
                ;;
            --cleanup)
                cleanup_flag=true
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_message $RED "❌ 未知参数: $arg"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_message $GREEN "🛑 Enterprise Brain 停止脚本"
    print_message $GREEN "================================"
    echo ""
    
    # 检查环境
    check_docker
    
    # 备份数据（如果需要）
    if [ "$backup_flag" = true ]; then
        backup_data
    fi
    
    # 停止服务
    stop_services
    
    # 清理资源（如果需要）
    if [ "$cleanup_flag" = true ]; then
        cleanup_resources --cleanup
    fi
    
    # 显示状态
    show_status
    
    print_message $GREEN "🎉 Enterprise Brain 停止完成！"
}

# 错误处理
trap 'print_message $RED "❌ 停止过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"
