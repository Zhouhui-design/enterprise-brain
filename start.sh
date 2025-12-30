#!/bin/bash

# Enterprise Brain 一键启动脚本
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

# 检查Docker是否安装
check_docker() {
    print_message $BLUE "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker未安装，请先安装Docker"
        print_message $YELLOW "📥 安装指南: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_message $RED "❌ Docker Compose未安装，请先安装Docker Compose"
        print_message $YELLOW "📥 安装指南: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    # 检查Docker服务是否运行
    if ! docker info &> /dev/null; then
        print_message $RED "❌ Docker服务未启动，请启动Docker服务"
        print_message $YELLOW "🔧 启动命令: sudo systemctl start docker"
        exit 1
    fi
    
    print_message $GREEN "✅ Docker环境检查通过"
}

# 检查端口占用
check_ports() {
    print_message $BLUE "检查端口占用情况..."
    
    local ports=(80 3306 6379 3005 3006 8080 9090 3001)
    local services=("Nginx" "MySQL" "Redis" "Backend" "Frontend" "Jenkins" "Prometheus" "Grafana")
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local service=${services[$i]}
        
        if netstat -tuln 2>/dev/null | grep -q ":${port} "; then
            print_message $YELLOW "⚠️ 端口 ${port} 已被占用 (${service})"
            print_message $YELLOW "💡 请检查是否有其他服务正在使用该端口"
            
            # 询问是否继续
            read -p "是否继续启动？(y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_message $RED "❌ 启动已取消"
                exit 1
            fi
        fi
    done
    
    print_message $GREEN "✅ 端口检查完成"
}

# 创建必要的目录
create_directories() {
    print_message $BLUE "创建必要的目录..."
    
    local directories=(
        "data/mysql"
        "data/redis"
        "data/uploads"
        "data/backups"
        "logs/nginx"
        "logs/mysql"
        "logs/redis"
        "logs/backend"
        "monitoring/prometheus"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        print_message $GREEN "📁 创建目录: $dir"
    done
    
    # 设置权限
    chmod -R 755 data/
    chmod -R 755 logs/
    chmod -R 755 monitoring/
    
    print_message $GREEN "✅ 目录创建完成"
}

# 构建和启动服务
start_services() {
    print_message $BLUE "启动Enterprise Brain服务..."
    
    # 拉取最新镜像
    print_message $YELLOW "?? 拉取Docker镜像..."
    docker-compose pull
    
    # 构建自定义镜像
    print_message $YELLOW "🔨 构建应用镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    print_message $YELLOW "🚀 启动所有服务..."
    docker-compose up -d
    
    print_message $GREEN "✅ 服务启动完成"
}

# 等待服务就绪
wait_for_services() {
    print_message $BLUE "等待服务就绪..."
    
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_message $YELLOW "⏳ 检查服务状态... (尝试 $attempt/$max_attempts)"
        
        # 检查MySQL
        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
            print_message $GREEN "✅ MySQL服务就绪"
            mysql_ready=true
        fi
        
        # 检查Redis
        if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
            print_message $GREEN "✅ Redis服务就绪"
            redis_ready=true
        fi
        
        # 检查后端
        if curl -s http://localhost:3005/health >/dev/null 2>&1; then
            print_message $GREEN "✅ 后端服务就绪"
            backend_ready=true
        fi
        
        # 检查前端
        if curl -s http://localhost:3006/health >/dev/null 2>&1; then
            print_message $GREEN "✅ 前端服务就绪"
            frontend_ready=true
        fi
        
        # 检查Nginx
        if curl -s http://localhost/health >/dev/null 2>&1; then
            print_message $GREEN "✅ Nginx服务就绪"
            nginx_ready=true
        fi
        
        if [[ "$mysql_ready" == true && "$redis_ready" == true && "$backend_ready" == true && "$frontend_ready" == true && "$nginx_ready" == true ]]; then
            print_message $GREEN "🎉 所有服务已就绪！"
            break
        fi
        
        sleep 5
        ((attempt++))
    done
    
    if [ $attempt -gt $max_attempts ]; then
        print_message $RED "❌ 服务启动超时，请检查日志"
        docker-compose logs
        exit 1
    fi
}

# 显示访问信息
show_access_info() {
    print_message $BLUE "📋 访问信息："
    echo ""
    print_message $GREEN "🌐 主应用访问地址："
    echo "   • HTTP:  http://localhost"
    echo "   • 局域网: http://$(hostname -I | awk '{print $1}')"
    echo ""
    print_message $GREEN "🔧 管理工具访问地址："
    echo "   • Jenkins:    http://localhost:8080"
    echo "   • Prometheus: http://localhost:9090"
    echo "   • Grafana:    http://localhost:3001"
    echo "   • API文档:    http://localhost/api-docs"
    echo ""
    print_message $GREEN "📊 服务状态："
    echo "   • 健康检查:  http://localhost/health"
    echo "   • Nginx状态: http://localhost/nginx_status (仅内网)"
    echo ""
    print_message $GREEN "🔑 默认账号密码："
    echo "   • Grafana:    admin / admin123456"
    echo "   • MySQL:      enterprise_user / enterprise_pass"
    echo "   • Redis:      (无密码)"
    echo ""
    print_message $YELLOW "💡 管理命令："
    echo "   • 查看日志:  ./logs.sh"
    echo "   • 停止服务:  ./stop.sh"
    echo "   • 重启服务:  ./restart.sh"
    echo "   • 查看状态:  ./status.sh"
    echo ""
}

# 主函数
main() {
    print_message $GREEN "🚀 Enterprise Brain Docker容器化启动脚本"
    print_message $GREEN "=================================================="
    echo ""
    
    # 检查环境
    check_docker
    check_ports
    
    # 准备环境
    create_directories
    
    # 启动服务
    start_services
    
    # 等待服务就绪
    wait_for_services
    
    # 显示访问信息
    show_access_info
    
    print_message $GREEN "🎉 Enterprise Brain 启动完成！"
}

# 错误处理
trap 'print_message $RED "❌ 启动过程中发生错误，请检查日志"; exit 1' ERR

# 执行主函数
main "$@"
