#!/bin/bash

# Enterprise Brain 状态检查脚本
# Docker容器化版本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_message $RED "❌ Docker Compose未安装"
        return 1
    fi
    
    if ! docker info &> /dev/null; then
        print_message $RED "❌ Docker服务未运行"
        return 1
    fi
    
    print_message $GREEN "✅ Docker环境正常"
    return 0
}

# 显示容器状态
show_container_status() {
    print_message $BLUE "📦 容器状态："
    echo ""
    
    # 获取容器状态
    local containers=$(docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}\t{{.Ports}}")
    
    if [ -z "$containers" ] || [ "$containers" = "NAME" ]; then
        print_message $YELLOW "⚠️ 没有容器在运行"
        return
    fi
    
    # 显示容器状态表格
    printf "${CYAN}%-25s %-15s %-20s %-30s${NC}\n" "容器名称" "状态" "健康状态" "端口映射"
    echo "----------------------------------------------------------------------------------------"
    
    # 解析容器状态
    while IFS= read -r line; do
        if [[ "$line" =~ ^enterprise- ]]; then
            local name=$(echo "$line" | awk '{print $1}')
            local state=$(echo "$line" | awk '{print $2}')
            local status=$(echo "$line" | awk '{print $3}')
            local ports=$(echo "$line" | cut -d' ' -f4-)
            
            # 状态颜色
            local state_color=$RED
            if [[ "$state" == "Up" ]]; then
                state_color=$GREEN
            elif [[ "$state" == "restarting" ]]; then
                state_color=$YELLOW
            fi
            
            # 健康状态
            local health_status="检查中..."
            if [[ "$state" == "Up" ]]; then
                local container_name=${name#*_}
                case $container_name in
                    "mysql")
                        if docker-compose exec -T mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
                            health_status="✅ 健康"
                        else
                            health_status="❌ 异常"
                        fi
                        ;;
                    "redis")
                        if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
                            health_status="✅ 健康"
                        else
                            health_status="❌ 异常"
                        fi
                        ;;
                    "backend")
                        if curl -s http://localhost:3005/health >/dev/null 2>&1; then
                            health_status="✅ 健康"
                        else
                            health_status="❌ 异常"
                        fi
                        ;;
                    "frontend")
                        if curl -s http://localhost:3006/health >/dev/null 2>&1; then
                            health_status="✅ 健康"
                        else
                            health_status="❌ 异常"
                        fi
                        ;;
                    "nginx")
                        if curl -s http://localhost/health >/dev/null 2>&1; then
                            health_status="✅ 健康"
                        else
                            health_status="❌ 异常"
                        fi
                        ;;
                    *)
                        health_status="❓ 未知"
                        ;;
                esac
            elif [[ "$state" == "restarting" ]]; then
                health_status="🔄 重启中"
            else
                health_status="❌ 停止"
            fi
            
            printf "${state_color}%-25s${NC} %-15s ${CYAN}%-20s${NC} %-30s\n" "$name" "$state" "$health_status" "$ports"
        fi
    done <<< "$containers"
    
    echo ""
}

# 显示资源使用情况
show_resource_usage() {
    print_message $BLUE "📊 资源使用情况："
    echo ""
    
    # Docker系统信息
    local docker_info=$(docker system df --format "table {{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}")
    
    if [ -n "$docker_info" ]; then
        printf "${CYAN}%-15s %-10s %-15s %-15s${NC}\n" "类型" "数量" "总大小" "可回收"
        echo "----------------------------------------------------"
        echo "$docker_info"
        echo ""
    fi
    
    # 容器资源使用
    local running_containers=$(docker-compose ps -q)
    if [ -n "$running_containers" ]; then
        print_message $CYAN "容器资源使用："
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" $running_containers 2>/dev/null || {
            print_message $YELLOW "⚠️ 无法获取容器资源使用信息"
        }
        echo ""
    fi
}

# 显示网络状态
show_network_status() {
    print_message $BLUE "🌐 网络状态："
    echo ""
    
    # 检查端口占用
    local ports=(80 3306 6379 3005 3006 8080 9090 3001)
    local services=("Nginx" "MySQL" "Redis" "Backend" "Frontend" "Jenkins" "Prometheus" "Grafana")
    
    printf "${CYAN}%-15s %-10s %-20s${NC}\n" "服务" "端口" "状态"
    echo "------------------------------------"
    
    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local service=${services[$i]}
        
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            printf "${GREEN}%-15s${NC} %-10d ${GREEN}%-20s${NC}\n" "$service" "$port" "✅ 监听中"
        else
            printf "${RED}%-15s${NC} %-10d ${RED}%-20s${NC}\n" "$service" "$port" "❌ 未监听"
        fi
    done
    
    echo ""
    
    # 检查网络连通性
    print_message $CYAN "服务连通性测试："
    
    # 测试HTTP服务
    local http_services=("http://localhost" "http://localhost:3005/health" "http://localhost:3006/health" "http://localhost/api-docs")
    local service_names=("主应用" "后端健康检查" "前端健康检查" "API文档")
    
    for i in "${!http_services[@]}"; do
        local url=${http_services[$i]}
        local name=${service_names[$i]}
        
        if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
            printf "${GREEN}✅ %-20s${NC}\n" "$name"
        else
            printf "${RED}❌ %-20s${NC}\n" "$name"
        fi
    done
    
    echo ""
}

# 显示数据状态
show_data_status() {
    print_message $BLUE "💾 数据状态："
    echo ""
    
    # MySQL数据大小
    if [ -d "data/mysql" ]; then
        local mysql_size=$(du -sh data/mysql 2>/dev/null | cut -f1)
        printf "${CYAN}MySQL数据大小:${NC} %s\n" "$mysql_size"
    fi
    
    # Redis数据大小
    if [ -d "data/redis" ]; then
        local redis_size=$(du -sh data/redis 2>/dev/null | cut -f1)
        printf "${CYAN}Redis数据大小:${NC} %s\n" "$redis_size"
    fi
    
    # 上传文件大小
    if [ -d "data/uploads" ]; then
        local uploads_size=$(du -sh data/uploads 2>/dev/null | cut -f1)
        local uploads_count=$(find data/uploads -type f 2>/dev/null | wc -l)
        printf "${CYAN}上传文件大小:${NC} %s (%d个文件)\n" "$uploads_size" "$uploads_count"
    fi
    
    # 备份文件
    if [ -d "backups" ]; then
        local backup_count=$(find backups -maxdepth 1 -type d 2>/dev/null | wc -l)
        local backup_size=$(du -sh backups 2>/dev/null | cut -f1)
        printf "${CYAN}备份文件:${NC} %s (%d个备份)\n" "$backup_size" "$backup_count"
    fi
    
    echo ""
}

# 显示日志摘要
show_logs_summary() {
    print_message $BLUE "📋 日志摘要："
    echo ""
    
    # 显示最近的错误日志
    local services=("mysql" "redis" "backend" "frontend" "nginx")
    
    for service in "${services[@]}"; do
        local container_name="enterprise-$service"
        if docker ps --format "{{.Names}}" | grep -q "^$container_name$"; then
            local error_count=$(docker logs "$container_name" --since=1h 2>&1 | grep -i error | wc -l)
            local warning_count=$(docker logs "$container_name" --since=1h 2>&1 | grep -i warning | wc -l)
            
            if [ $error_count -gt 0 ]; then
                printf "${RED}❌ %-15s: %d 个错误${NC}\n" "$service" "$error_count"
            elif [ $warning_count -gt 0 ]; then
                printf "${YELLOW}⚠️ %-15s: %d 个警告${NC}\n" "$service" "$warning_count"
            else
                printf "${GREEN}✅ %-15s: 正常${NC}\n" "$service"
            fi
        fi
    done
    
    echo ""
}

# 显示访问信息
show_access_info() {
    print_message $BLUE "🔗 访问信息："
    echo ""
    
    # 获取本机IP
    local local_ip=$(hostname -I | awk '{print $1}')
    
    printf "${CYAN}主应用访问地址:${NC}\n"
    echo "   • 本地访问: http://localhost"
    echo "   • 局域网访问: http://$local_ip"
    echo ""
    
    printf "${CYAN}管理工具访问地址:${NC}\n"
    echo "   • Jenkins:    http://localhost:8080"
    echo "   • Prometheus: http://localhost:9090"
    echo "   • Grafana:    http://localhost:3001"
    echo "   • API文档:    http://localhost/api-docs"
    echo ""
    
    printf "${CYAN}监控端点:${NC}\n"
    echo "   • 健康检查:  http://localhost/health"
    echo "   • Nginx状态: http://localhost/nginx_status"
    echo ""
}

# 显示快捷操作
show_quick_actions() {
    print_message $BLUE "⚡ 快捷操作："
    echo ""
    echo "📝 查看日志:"
    echo "   ./logs.sh                    # 查看所有服务日志"
    echo "   ./logs.sh mysql             # 查看MySQL日志"
    echo "   ./logs.sh backend            # 查看后端日志"
    echo ""
    echo "🔄 服务管理:"
    echo "   ./restart.sh                 # 重启所有服务"
    echo "   ./restart.sh --force         # 强制重建并重启"
    echo "   ./restart.sh --backup        # 备份数据后重启"
    echo ""
    echo "🛑 服务控制:"
    echo "   ./stop.sh                   # 停止所有服务"
    echo "   ./stop.sh --backup          # 停止前备份数据"
    echo "   ./stop.sh --cleanup         # 停止后清理资源"
    echo ""
    echo "💾 数据管理:"
    echo "   docker-compose exec mysql mysql -u root -p  # 进入MySQL"
    echo "   docker-compose exec redis redis-cli           # 进入Redis"
    echo ""
}

# 主函数
main() {
    local detailed=false
    
    # 解析参数
    for arg in "$@"; do
        case $arg in
            --detailed|-d)
                detailed=true
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo ""
                echo "选项:"
                echo "  --detailed, -d  显示详细状态信息"
                echo "  --help, -h      显示此帮助信息"
                exit 0
                ;;
        esac
    done
    
    print_message $GREEN "📊 Enterprise Brain 状态检查"
    print_message $GREEN "================================"
    echo ""
    
    # 检查Docker环境
    if ! check_docker; then
        print_message $RED "❌ Docker环境异常，无法继续检查"
        exit 1
    fi
    
    # 显示容器状态
    show_container_status
    
    # 显示资源使用情况
    if [ "$detailed" = true ]; then
        show_resource_usage
    fi
    
    # 显示网络状态
    show_network_status
    
    # 显示数据状态
    show_data_status
    
    # 显示日志摘要
    if [ "$detailed" = true ]; then
        show_logs_summary
    fi
    
    # 显示访问信息
    show_access_info
    
    # 显示快捷操作
    show_quick_actions
    
    print_message $GREEN "✅ 状态检查完成"
}

# 执行主函数
main "$@"
