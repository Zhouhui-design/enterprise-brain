#!/bin/bash

# ========================================
# 企业大脑系统 - 查看日志脚本
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 工作目录
WORK_DIR="/home/sardenesy/ai_workspaces/ai_desktop_3"
LOG_DIR="$WORK_DIR/logs"

echo "📋 企业大脑系统 - 日志查看工具"
echo "====================================="
echo ""

# 检查日志目录
if [ ! -d "$LOG_DIR" ]; then
    echo -e "${RED}❌ 日志目录不存在: $LOG_DIR${NC}"
    echo "请先启动服务: ./start-dev.sh"
    exit 1
fi

# 菜单选择
echo "请选择要查看的日志:"
echo "  1) 后端日志 (实时)"
echo "  2) 前端日志 (实时)"
echo "  3) 后端日志 (最后100行)"
echo "  4) 前端日志 (最后100行)"
echo "  5) 服务状态"
echo "  6) 查看所有日志文件"
echo "  0) 退出"
echo ""
read -p "请输入选项 (0-6): " choice

case $choice in
    1)
        echo -e "${GREEN}📖 查看后端日志 (实时) - 按Ctrl+C退出${NC}"
        echo ""
        tail -f "$LOG_DIR/backend.log"
        ;;
    2)
        echo -e "${GREEN}📖 查看前端日志 (实时) - 按Ctrl+C退出${NC}"
        echo ""
        tail -f "$LOG_DIR/frontend.log"
        ;;
    3)
        echo -e "${GREEN}📖 后端日志 (最后100行)${NC}"
        echo "====================================="
        tail -n 100 "$LOG_DIR/backend.log"
        ;;
    4)
        echo -e "${GREEN}📖 前端日志 (最后100行)${NC}"
        echo "====================================="
        tail -n 100 "$LOG_DIR/frontend.log"
        ;;
    5)
        echo -e "${BLUE}📊 服务状态${NC}"
        echo "====================================="
        echo ""
        
        # 检查后端
        if [ -f "$LOG_DIR/backend.pid" ]; then
            BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
            if ps -p $BACKEND_PID > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 后端服务运行中${NC}"
                echo "   PID: $BACKEND_PID"
                echo "   地址: http://localhost:3005"
                if curl -s http://localhost:3005/health > /dev/null 2>&1; then
                    echo -e "   健康检查: ${GREEN}✅ 正常${NC}"
                else
                    echo -e "   健康检查: ${RED}❌ 失败${NC}"
                fi
            else
                echo -e "${RED}❌ 后端服务未运行${NC} (PID文件存在但进程不存在)"
            fi
        else
            echo -e "${YELLOW}⚠️  后端服务未运行${NC} (无PID文件)"
        fi
        
        echo ""
        
        # 检查前端
        if [ -f "$LOG_DIR/frontend.pid" ]; then
            FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
            if ps -p $FRONTEND_PID > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 前端服务运行中${NC}"
                echo "   PID: $FRONTEND_PID"
                echo "   地址: http://localhost:3003"
                if curl -s http://localhost:3003 > /dev/null 2>&1; then
                    echo -e "   健康检查: ${GREEN}✅ 正常${NC}"
                else
                    echo -e "   健康检查: ${YELLOW}⚠️  编译中或启动中${NC}"
                fi
            else
                echo -e "${RED}❌ 前端服务未运行${NC} (PID文件存在但进程不存在)"
            fi
        else
            echo -e "${YELLOW}⚠️  前端服务未运行${NC} (无PID文件)"
        fi
        
        echo ""
        echo "端口占用情况:"
        echo "  3005端口: $(lsof -Pi :3005 -sTCP:LISTEN -t >/dev/null 2>&1 && echo -e '${GREEN}已占用${NC}' || echo -e '${YELLOW}空闲${NC}')"
        echo "  3003端口: $(lsof -Pi :3003 -sTCP:LISTEN -t >/dev/null 2>&1 && echo -e '${GREEN}已占用${NC}' || echo -e '${YELLOW}空闲${NC}')"
        ;;
    6)
        echo -e "${BLUE}📁 日志文件列表${NC}"
        echo "====================================="
        ls -lh "$LOG_DIR"
        ;;
    0)
        echo "退出"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ 无效选项${NC}"
        exit 1
        ;;
esac
