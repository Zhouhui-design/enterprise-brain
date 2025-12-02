#!/bin/bash

# 企业大脑系统 - 服务启动脚本

echo "======================================"
echo "企业大脑系统 - 服务启动"
echo "======================================"

# 设置工作目录
WORK_DIR="/home/sardenesy/ai_workspaces/ai_desktop_3"
cd "$WORK_DIR"

# 1. 停止所有现有服务
echo "[1/4] 停止现有服务..."
killall -9 node 2>/dev/null
sleep 2

# 2. 启动后端服务
echo "[2/4] 启动后端服务 (端口3005)..."
cd "$WORK_DIR"
nohup node --max-old-space-size=512 backend/server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "  后端PID: $BACKEND_PID"

# 等待后端启动
sleep 3

# 验证后端
if curl -s http://localhost:3005/health > /dev/null; then
    echo "  ✅ 后端服务启动成功"
else
    echo "  ❌ 后端服务启动失败"
    exit 1
fi

# 3. 启动前端服务
echo "[3/4] 启动前端服务 (端口3001)..."
cd "$WORK_DIR/07-frontend"
rm -rf node_modules/.vite
NODE_OPTIONS="--max-old-space-size=1024" nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  前端PID: $FRONTEND_PID"

# 等待前端启动
echo "  等待前端服务启动..."
for i in {1..20}; do
    sleep 1
    if netstat -tuln 2>/dev/null | grep -q ":3001.*LISTEN"; then
        echo "  ✅ 前端服务启动成功"
        break
    fi
    if [ $i -eq 20 ]; then
        echo "  ❌ 前端服务启动超时"
        exit 1
    fi
done

# 4. 显示状态
echo "[4/4] 服务状态检查..."
echo ""
echo "======================================"
echo "服务访问地址："
echo "======================================"
echo "📱 前端服务:"
echo "   本机访问: http://localhost:3001"
echo "   局域网访问: http://192.168.2.229:3001"
echo ""
echo "🔧 后端API:"
echo "   本机访问: http://localhost:3005"
echo "   局域网访问: http://192.168.2.229:3005"
echo ""
echo "======================================"
echo "✅ 所有服务启动完成！"
echo "======================================"
echo ""
echo "查看日志："
echo "  后端: tail -f $WORK_DIR/backend.log"
echo "  前端: tail -f $WORK_DIR/07-frontend/frontend.log"
echo ""
