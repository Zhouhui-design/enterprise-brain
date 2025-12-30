#!/bin/bash

# Enterprise Brain 重启脚本
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

# 解析参数
parse_args() {
    force_rebuild=false
    backup_data=false
    update_images=false
    
    for arg in "$@"; do
        case $arg in
            --force|-f)
                force_rebuild=true
                print_message $YELLOW "🔨 强制重建模式已启用"
                ;;
            --backup|-b)
                backup_data=true
                print_message $YELLOW "💾 数据备份模式已启用"
                ;;
            --update|-u)
                update_images=true
                print_message $YELLOW "📥 镜像更新模式已启用"
                ;;
            --help|-h)
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
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --force, -f    强制重建所有容器"
    echo "  --backup, -b    重启前备份数据"
    echo "  --update, -u    更新到最新镜像"
    echo "  --help, -h      显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                # 正常重启"
    echo "  $0 --force       # 强制重建并重启"
    echo "  $0 --backup      # 备份数据后重启"
    echo "  $0 --update      # 更新镜像后重启"
    echo "  $0 --backup --force --update  # 完整重启流程"
}

# 备份数据
backup_data() {
    if [ "$backup_data" = true ]; then
        print_message $BLUE "💾 备份数据..."
        
        local backup_dir="backups/restart_$(date +%Y%m%d_%H%M%S)"
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

# 更新镜像
update_images() {
    if [ "$update_images" = true ]; then
        print_message $BLUE "📥 更新Docker镜像..."
        
        docker-compose pull
        print_message $GREEN "✅ 镜像更新完成"
    fi
}

# 停止服务
stop_services() {
    print_message $BLUE "🛑 停止现有服务..."
    
    if docker-compose ps -q | grep -q .; then
        docker-compose down
        print_message $GREEN "✅ 服务已停止"
        
        # 等待容器完全停止
        sleep 3
    else
        print_message $YELLOW "⚠️ 没有运行中的服务"
    fi
}

# 清理资源
cleanup_resources() {
    if [ "$force_rebuild" = true ]; then
        print_message $BLUE "🧹 清理Docker资源..."
        
        # 清理停止的容器
        docker container prune -f
        
        # 清理未使用的镜像（不包括正在使用的）
        docker image prune -f
        
        print_message $GREEN "✅ 资源清理完成"
    fi
}

# 重建镜像
rebuild_images() {
    if [ "$force_rebuild" = true ]; then
        print_message $BLUE "🔨 重建应用镜像..."
        
        docker-compose build --no-cache
        print_message $GREEN "✅ 镜像重建完成"
    fi
}

# 启动服务
start_services() {
    print_message $BLUE "🚀 启动Enterprise Brain服务..."
    
    docker-compose up -d
    print_message $GREEN "✅ 服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_message $BLUE "⏳ 等待服务就绪..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_message $YELLOW "检查服务状态... (尝试 $attempt/$max_attempts)"
        
        # 检查关键服务
        local services_ready=true
        
        # 检查MySQL
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
            print_message $GREEN "✅ MySQL服务就绪"
        else
            services_ready=false
        fi
        
        # 检查Redis
        if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
            print_message $GREEN "✅ Redis服务就绪"
        else
            services_ready=false
        fi
        
        # 检查后端
        if curl -s http://localhost:3005/health >/dev/null 2>&1; then
            print_message $GREEN "✅ 后端服务就绪"
        else
            services_ready=false
        fi
        
        # 检查前端
        if curl -s http://localhost:3006/health >/dev/null 2>&1; then
            print_message $GREEN "✅ 前端服务就绪"
        else
            services_ready=false
        fi
        
        # 检查Nginx
        if curl -s http://localhost/health >/dev/null 2>&1; then
            print_message $GREEN "✅ Nginx服务就绪"
        else
            services_ready=false
        fi
        
        if [ "$services_ready" = true ]; then
            print_message $GREEN "🎉 所有服务已就绪！"
            break
        fi
        
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_message $RED "❌ 服务启动超时，请检查日志"
        docker-compose logs --tail=50
        exit 1
    fi
}

# 显示重启信息
show_restart_info() {
    print_message $BLUE "📋 重启完成信息："
    echo ""
    print_message $GREEN "🌐 访问地址："
    echo "   • 主应用: http://localhost"
    echo "   • API文档: http://localhost/api-docs"
    echo "   • Jenkins: http://localhost:8080"
    echo "   • Grafana: http://localhost:3001"
    echo ""
    print_message $GREEN "🔧 管理命令："
    echo "   • 查看日志: ./logs.sh"
    echo "   • 停止服务: ./stop.sh"
    echo "   • 查看状态: ./status.sh"
    echo ""
    
    if [ "$backup_data" = true ]; then
        print_message $YELLOW "💾 数据已备份，备份文件位于 backups/ 目录"
    fi
}

# 主函数
main() {
    print_message $GREEN "🔄 Enterprise Brain 重启脚本"
    print_message $GREEN "================================="
    echo ""
    
    # 解析参数
    parse_args "$@"
    
    # 检查环境
    check_docker
    
    # 备份数据（如果需要）
    backup_data
    
    # 更新镜像（如果需要）
    update_images
    
    # 停止现有服务
    stop_services
    
    # 清理资源（如果需要）
    cleanup_resources
    
    # 重建镜像（如果需要）
    rebuild_images
    
    # 启动服务
    start_services
    
    # 等待服务就绪
    wait_for_services
    
    # 显示重启信息
    show_restart_info
    
    print_message $GREEN "🎉 Enterprise Brain 重启完成！"
}

# 错误处理
trap 'print_message $RED "❌ 重启过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
