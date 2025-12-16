#!/bin/bash

# ========================================
# 企业大脑系统 - 停止开发环境脚本
# ========================================

echo "🛑 企业大脑系统 - 停止开发环境"
echo "====================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 工作目录
WORK_DIR="/home/sardenesy/ai_workspaces/ai_desktop_3"
LOG_DIR="$WORK_DIR/logs"

# 停止服务函数
stop_service() {
    local service_name=$1
    local pid_file=$2
    local port=$3
    
    echo "停止${service_name}..."
    
    # 方法1: 从PID文件读取
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            kill $pid 2>/dev/null
            sleep 1
            if ps -p $pid > /dev/null 2>&1; then
                kill -9 $pid 2>/dev/null
            fi
            echo -e "${GREEN}✅ ${service_name}已停止 (PID: $pid)${NC}"
            rm -f "$pid_file"
            return 0
        else
            echo -e "${YELLOW}⚠️  ${service_name}进程不存在 (PID: $pid)${NC}"
            rm -f "$pid_file"
        fi
    fi
    
    # 方法2: 从端口查找
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        local pids=$(lsof -ti:$port)
        echo "   从端口 $port 找到进程: $pids"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ ${service_name}已停止 (端口: $port)${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}⚠️  ${service_name}未运行${NC}"
    return 1
}

# 停止后端
echo "📋 第1步: 停止后端服务"
echo "-------------------------------------"
stop_service "后端服务" "$LOG_DIR/backend.pid" 3005
echo ""

# 停止前端
echo "📋 第2步: 停止前端服务"
echo "-------------------------------------"
stop_service "前端服务" "$LOG_DIR/frontend.pid" 3003
echo ""

# 确认所有进程已停止
echo "📊 第3步: 验证进程状态"
echo "====================================="

REMAINING_BACKEND=$(ps aux | grep "[n]ode backend/server.js" | wc -l)
REMAINING_FRONTEND=$(ps aux | grep "[n]pm.*dev" | wc -l)

if [ $REMAINING_BACKEND -eq 0 ] && [ $REMAINING_FRONTEND -eq 0 ]; then
    echo -e "${GREEN}✅ 所有服务已成功停止！${NC}"
else
    echo -e "${YELLOW}⚠️  检测到残留进程:${NC}"
    [ $REMAINING_BACKEND -gt 0 ] && echo "   - 后端进程: $REMAINING_BACKEND 个"
    [ $REMAINING_FRONTEND -gt 0 ] && echo "   - 前端进程: $REMAINING_FRONTEND 个"
    echo ""
    echo "手动清理命令:"
    echo "  killall -9 node"
    echo "  pkill -9 -f 'npm.*dev'"
fi

echo ""
echo "日志文件位置:"
echo "  • 后端日志: $LOG_DIR/backend.log"
echo "  • 前端日志: $LOG_DIR/frontend.log"
echo ""
echo -e "${YELLOW}💡 提示: 重新启动服务请运行: ./start-dev.sh${NC}"
echo "====================================="
