#!/bin/bash

# ========================================
# 企业大脑系统 - 停止所有服务脚本
# ========================================

echo "🛑 企业大脑系统 - 停止所有服务"
echo "====================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 工作目录
WORK_DIR="/home/sardensy/enterprise-brain/enterpise-brain"

# 停止服务函数
stop_service() {
    local service_name=$1
    local port=$2
    
    echo "停止${service_name}..."
    
    # 从端口查找并停止进程
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        local pids=$(lsof -ti:$port)
        echo "   从端口 $port 找到进程: $pids"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✅ ${service_name}已停止 (端口: $port)${NC}"
        return 0
    fi
    
    # 从进程名查找并停止进程
    local process_pattern=$3
    if [ -n "$process_pattern" ]; then
        local process_count=$(ps aux | grep "$process_pattern" | grep -v grep | wc -l)
        if [ $process_count -gt 0 ]; then
            local pids=$(ps aux | grep "$process_pattern" | grep -v grep | awk '{print $2}')
            echo "   从进程名找到进程: $pids"
            ps aux | grep "$process_pattern" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
            echo -e "${GREEN}✅ ${service_name}已停止 (进程名匹配)${NC}"
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠️  ${service_name}未运行${NC}"
    return 1
}

# 停止后端
echo "📋 第1步: 停止后端服务"
echo "-------------------------------------"
stop_service "后端服务" 3005 "\[n\]ode backend/server.js"
echo ""

# 停止前端
echo "📋 第2步: 停止前端服务"
echo "-------------------------------------"
stop_service "前端服务" 3003 "\[n\]pm.*run.*dev"
echo ""

# 确认所有进程已停止
echo "📊 第3步: 验证进程状态"
echo "====================================="

REMAINING_BACKEND=$(ps aux | grep "\[n\]ode backend/server.js" | wc -l)
REMAINING_FRONTEND=$(ps aux | grep "\[n\]pm.*run.*dev" | wc -l)

if [ $REMAINING_BACKEND -eq 0 ] && [ $REMAINING_FRONTEND -eq 0 ]; then
    echo -e "${GREEN}✅ 所有服务已成功停止！${NC}"
else
    echo -e "${YELLOW}⚠️  检测到残留进程:${NC}"
    [ $REMAINING_BACKEND -gt 0 ] && echo "   - 后端进程: $REMAINING_BACKEND 个"
    [ $REMAINING_FRONTEND -gt 0 ] && echo "   - 前端进程: $REMAINING_FRONTEND 个"
    echo ""
    echo "手动清理命令:"
    echo "  killall -9 node"
    echo "  pkill -9 -f 'npm.*run.*dev'"
fi

echo ""
echo "====================================="
echo "✅ 停止服务完成！"
echo "====================================="