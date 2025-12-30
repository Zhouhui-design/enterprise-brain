#!/bin/bash

# Enterprise Brain 日志查看脚本
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
    if ! command -v docker &> /dev/null; then
        print_message $RED "❌ Docker未安装"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_message $RED "❌ Docker Compose未安装"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [服务名] [选项]"
    echo ""
    echo "服务名:"
    echo "  mysql      查看MySQL日志"
    echo "  redis      查看Redis日志"
    echo "  backend    查看后端日志"
    echo "  frontend    查看前端日志"
    echo "  nginx      查看Nginx日志"
    echo "  jenkins    查看Jenkins日志"
    echo "  prometheus  查看Prometheus日志"
    echo "  grafana    查看Grafana日志"
    echo "  all        查看所有服务日志（默认）"
    echo ""
    echo "选项:"
    echo "  -f, --follow     实时跟踪日志"
    echo "  -t, --tail N     显示最后N行日志（默认100）"
    echo "  -s, --since T    显示指定时间后的日志（如：1h, 30m, 2023-01-01T10:00:00）"
    echo "  -e, --grep P     过滤包含指定模式的日志"
    echo "  --no-color       不显示颜色"
    echo "  --help           显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 查看所有服务日志"
    echo "  $0 mysql -f          # 实时跟踪MySQL日志"
    echo "  $0 backend -t 50     # 查看后端最后50行日志"
    echo "  $0 all -e error      # 查看所有包含error的日志"
    echo "  $0 nginx -s 1h       # 查看Nginx最近1小时的日志"
}

# 解析参数
parse_args() {
    service=""
    follow=false
    tail_lines=100
    since_time=""
    grep_pattern=""
    no_color=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            mysql|redis|backend|frontend|nginx|jenkins|prometheus|grafana|all)
                service="$1"
                shift
                ;;
            -f|--follow)
                follow=true
                shift
                ;;
            -t|--tail)
                tail_lines="$2"
                shift 2
                ;;
            -s|--since)
                since_time="$2"
                shift 2
                ;;
            -e|--grep)
                grep_pattern="$2"
                shift 2
                ;;
            --no-color)
                no_color=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                print_message $RED "❌ 未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 默认查看所有服务
    if [ -z "$service" ]; then
        service="all"
    fi
}

# 构建docker logs命令
build_log_command() {
    local container="$1"
    local cmd="docker logs"
    
    # 添加容器名
    cmd="$cmd $container"
    
    # 添加跟踪选项
    if [ "$follow" = true ]; then
        cmd="$cmd --follow"
    fi
    
    # 添加行数选项
    if [ -n "$tail_lines" ] && [ "$tail_lines" != "all" ]; then
        cmd="$cmd --tail $tail_lines"
    fi
    
    # 添加时间选项
    if [ -n "$since_time" ]; then
        cmd="$cmd --since $since_time"
    fi
    
    # 添加过滤选项
    if [ -n "$grep_pattern" ]; then
        cmd="$cmd 2>&1 | grep -i '$grep_pattern' || true"
    fi
    
    echo "$cmd"
}

# 显示服务日志
show_service_logs() {
    local service="$1"
    local container_name="enterprise-$service"
    
    # 检查容器是否存在
    if ! docker ps -a --format "{{.Names}}" | grep -q "^$container_name$"; then
        print_message $RED "❌ 容器 $container_name 不存在"
        return 1
    fi
    
    # 检查容器是否运行
    if ! docker ps --format "{{.Names}}" | grep -q "^$container_name$"; then
        print_message $YELLOW "⚠️ 容器 $container_name 未运行，显示历史日志"
    fi
    
    # 构建并执行命令
    local cmd=$(build_log_command "$container_name")
    
    print_message $BLUE "📋 显示 $service 服务日志..."
    
    if [ "$follow" = true ]; then
        print_message $CYAN "🔄 实时跟踪模式，按 Ctrl+C 退出"
    fi
    
    # 执行命令
    if [ "$no_color" = true ]; then
        eval "$cmd"
    else
        eval "$cmd" | while IFS= read -r line; do
            # 根据日志级别着色
            if [[ "$line" =~ [Ee]rror|[Ee]xception|[Ff]atal ]]; then
                echo -e "${RED}$line${NC}"
            elif [[ "$line" =~ [Ww]arn ]]; then
                echo -e "${YELLOW}$line${NC}"
            elif [[ "$line" =~ [Ii]nfo|[Ii]nfomation ]]; then
                echo -e "${GREEN}$line${NC}"
            elif [[ "$line" =~ [Dd]ebug ]]; then
                echo -e "${PURPLE}$line${NC}"
            else
                echo "$line"
            fi
        done
    fi
}

# 显示所有服务日志
show_all_logs() {
    local services=("mysql" "redis" "backend" "frontend" "nginx" "jenkins" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        echo ""
        print_message $CYAN "========================================"
        print_message $CYAN "📋 $service 服务日志"
        print_message $CYAN "========================================"
        echo ""
        
        show_service_logs "$service" || true
    done
}

# 显示日志统计
show_logs_stats() {
    print_message $BLUE "📊 日志统计信息："
    echo ""
    
    local services=("mysql" "redis" "backend" "frontend" "nginx" "jenkins" "prometheus" "grafana")
    
    printf "${CYAN}%-15s %-10s %-10s %-10s %-15s${NC}\n" "服务" "总行数" "错误数" "警告数" "最后更新"
    echo "--------------------------------------------------------------"
    
    for service in "${services[@]}"; do
        local container_name="enterprise-$service"
        
        if docker ps -a --format "{{.Names}}" | grep -q "^$container_name$"; then
            # 获取日志统计
            local total_lines=$(docker logs "$container_name" 2>&1 | wc -l)
            local error_lines=$(docker logs "$container_name" 2>&1 | grep -ic error || echo "0")
            local warning_lines=$(docker logs "$container_name" 2>&1 | grep -ic warning || echo "0")
            local last_update=$(docker inspect "$container_name" --format='{{.State.FinishedAt}}' 2>/dev/null || echo "运行中")
            
            if [ "$last_update" = "运行中" ]; then
                last_update="运行中"
            fi
            
            printf "%-15s %-10s %-10s %-10s %-15s\n" "$service" "$total_lines" "$error_lines" "$warning_lines" "$last_update"
        fi
    done
    
    echo ""
}

# 主函数
main() {
    print_message $GREEN "📋 Enterprise Brain 日志查看脚本"
    print_message $GREEN "====================================="
    echo ""
    
    # 检查Docker环境
    check_docker
    
    # 解析参数
    parse_args "$@"
    
    # 显示日志统计（如果不是跟踪模式）
    if [ "$follow" = false ]; then
        show_logs_stats
    fi
    
    # 根据服务显示日志
    case "$service" in
        all)
            show_all_logs
            ;;
        *)
            show_service_logs "$service"
            ;;
    esac
}

# 错误处理
trap 'print_message $RED "❌ 日志查看过程中发生错误"; exit 1' ERR

# 执行主函数
main "$@"
