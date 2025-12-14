#!/bin/bash

# ========================================
# 企业大脑系统 - 开发环境启动脚本
# ========================================

echo "🚀 企业大脑系统 - 开发环境启动"
echo "====================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否已有服务运行
check_service() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  检测到端口 $port 已被占用 ($service_name)${NC}"
        echo "   正在停止旧服务..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
        echo -e "${GREEN}✅ 旧服务已停止${NC}"
    fi
}

# 1. 停止旧服务
echo "📋 第1步: 停止旧服务"
echo "-------------------------------------"
check_service 3003 "前端服务"
check_service 3005 "后端服务"
echo ""

# 2. 启动后端服务
echo "🔧 第2步: 启动后端服务"
echo "-------------------------------------"
cd /home/sardenesy/ai_workspaces/ai_desktop_3
echo "   工作目录: $(pwd)"
echo "   启动命令: node backend/server.js"

# 后台启动后端
nohup node backend/server.js > backend-dev.log 2>&1 &
BACKEND_PID=$!

echo "   等待后端启动..."
sleep 3

# 检查后端是否启动成功
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ 后端服务启动成功 (PID: $BACKEND_PID)${NC}"
    echo "   访问地址: http://localhost:3005"
    echo "   日志文件: backend-dev.log"
else
    echo -e "${RED}❌ 后端服务启动失败${NC}"
    echo "   请查看日志: tail -f backend-dev.log"
    exit 1
fi
echo ""

# 3. 启动前端服务
echo "🎨 第3步: 启动前端服务"
echo "-------------------------------------"
cd /home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend
echo "   工作目录: $(pwd)"
echo "   启动命令: npm run dev"

# 后台启动前端
nohup npm run dev > ../frontend-dev.log 2>&1 &
FRONTEND_PID=$!

echo "   等待前端启动..."
sleep 5

# 检查前端是否启动成功
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ 前端服务启动成功 (PID: $FRONTEND_PID)${NC}"
    echo "   访问地址: http://localhost:3003"
    echo "   日志文件: frontend-dev.log"
else
    echo -e "${RED}❌ 前端服务启动失败${NC}"
    echo "   请查看日志: tail -f frontend-dev.log"
    exit 1
fi
echo ""

# 4. 服务状态总结
echo "📊 第4步: 服务状态总结"
echo "====================================="
echo -e "${GREEN}✅ 所有服务启动完成！${NC}"
echo ""
echo "服务信息:"
echo "  • 后端服务 (PID: $BACKEND_PID)"
echo "    - 地址: http://localhost:3005"
echo "    - 日志: tail -f /home/sardenesy/ai_workspaces/ai_desktop_3/backend-dev.log"
echo ""
echo "  • 前端服务 (PID: $FRONTEND_PID)"
echo "    - 地址: http://localhost:3003"
echo "    - 日志: tail -f /home/sardenesy/ai_workspaces/ai_desktop_3/frontend-dev.log"
echo ""
echo "停止服务:"
echo "  • 停止前端: kill $FRONTEND_PID"
echo "  • 停止后端: kill $BACKEND_PID"
echo "  • 停止全部: kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo "快捷命令:"
echo "  • 查看后端日志: tail -f /home/sardenesy/ai_workspaces/ai_desktop_3/backend-dev.log"
echo "  • 查看前端日志: tail -f /home/sardenesy/ai_workspaces/ai_desktop_3/frontend-dev.log"
echo ""
echo -e "${YELLOW}💡 提示: 修改代码后需要重启服务,直接运行此脚本即可${NC}"
echo "====================================="
