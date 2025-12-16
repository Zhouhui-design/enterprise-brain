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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 工作目录
WORK_DIR="/home/sardenesy/ai_workspaces/ai_desktop_3"
LOG_DIR="$WORK_DIR/logs"

# 创建日志目录
mkdir -p "$LOG_DIR"

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

# 2. 检查MySQL数据库
echo "🗄️  第2步: 检查MySQL数据库"
echo "-------------------------------------"
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  未检测到mysql命令,跳过数据库检查${NC}"
else
    if mysql -h localhost -u root -pzH754277289hUi~197547 -e "USE enterprise_brain;" 2>/dev/null; then
        echo -e "${GREEN}✅ MySQL数据库连接正常${NC}"
    else
        echo -e "${YELLOW}⚠️  MySQL数据库连接失败,后端可能无法正常工作${NC}"
    fi
fi
echo ""

# 3. 启动后端服务
echo "🔧 第3步: 启动后端服务"
echo "-------------------------------------"
cd "$WORK_DIR"
echo "   工作目录: $(pwd)"
echo "   启动命令: node backend/server.js"

# 后台启动后端
nohup node backend/server.js > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend.pid"

echo "   等待后端启动..."
sleep 3

# 健康检查
BACKEND_HEALTHY=false
for i in {1..10}; do
    if curl -s http://localhost:3005/health > /dev/null 2>&1; then
        BACKEND_HEALTHY=true
        break
    fi
    sleep 1
    echo -e "   ${BLUE}等待后端响应... ($i/10)${NC}"
done

if [ "$BACKEND_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ 后端服务启动成功 (PID: $BACKEND_PID)${NC}"
    echo "   访问地址: http://localhost:3005"
    echo "   健康检查: http://localhost:3005/health"
    echo "   日志文件: $LOG_DIR/backend.log"
else
    echo -e "${RED}❌ 后端服务启动失败或健康检查超时${NC}"
    echo "   请查看日志: tail -f $LOG_DIR/backend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo ""

# 4. 启动前端服务
echo "🎨 第4步: 启动前端服务"
echo "-------------------------------------"
cd "$WORK_DIR/07-frontend"
echo "   工作目录: $(pwd)"
echo "   启动命令: npm run dev"

# 后台启动前端
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

echo "   等待前端启动..."
sleep 5

# 健康检查 (前端Vite启动较慢)
FRONTEND_HEALTHY=false
for i in {1..20}; do
    if curl -s http://localhost:3003 > /dev/null 2>&1; then
        FRONTEND_HEALTHY=true
        break
    fi
    sleep 1
    echo -e "   ${BLUE}等待前端响应... ($i/20)${NC}"
done

if [ "$FRONTEND_HEALTHY" = true ]; then
    echo -e "${GREEN}✅ 前端服务启动成功 (PID: $FRONTEND_PID)${NC}"
    echo "   访问地址: http://localhost:3003"
    echo "   日志文件: $LOG_DIR/frontend.log"
else
    echo -e "${YELLOW}⚠️  前端服务进程已启动,但健康检查超时${NC}"
    echo "   进程PID: $FRONTEND_PID"
    echo "   可能仍在编译中,请稍后访问: http://localhost:3003"
    echo "   查看日志: tail -f $LOG_DIR/frontend.log"
fi
echo ""

# 5. 服务状态总结
echo "📊 第5步: 服务状态总结"
echo "====================================="
echo -e "${GREEN}✅ 所有服务启动完成！${NC}"
echo ""
echo "服务信息:"
echo "  • 后端服务 (PID: $BACKEND_PID)"
echo "    - 地址: http://localhost:3005"
echo "    - 健康检查: http://localhost:3005/health"
echo "    - 采购计划: http://localhost:3005/api/procurement-plans"
echo "    - 日志: tail -f $LOG_DIR/backend.log"
echo ""
echo "  • 前端服务 (PID: $FRONTEND_PID)"
echo "    - 地址: http://localhost:3003"
echo "    - 采购计划页: http://localhost:3003/purchase/procurement-plan"
echo "    - 日志: tail -f $LOG_DIR/frontend.log"
echo ""
echo "停止服务:"
echo "  • 停止前端: kill $FRONTEND_PID (或 kill \$(cat $LOG_DIR/frontend.pid))"
echo "  • 停止后端: kill $BACKEND_PID (或 kill \$(cat $LOG_DIR/backend.pid))"
echo "  • 停止全部: kill $FRONTEND_PID $BACKEND_PID"
echo ""
echo "快捷命令:"
echo "  • 查看后端日志: tail -f $LOG_DIR/backend.log"
echo "  • 查看前端日志: tail -f $LOG_DIR/frontend.log"
echo "  • 查看进程状态: ps aux | grep -E 'node backend|npm.*dev'"
echo ""
echo "PID文件位置:"
echo "  • 后端PID: $LOG_DIR/backend.pid"
echo "  • 前端PID: $LOG_DIR/frontend.pid"
echo ""
echo -e "${YELLOW}💡 提示: 修改代码后需要重启服务,直接运行此脚本即可${NC}"
echo -e "${YELLOW}💡 数据库: MySQL (enterprise_brain@localhost:3306)${NC}"
echo "====================================="
