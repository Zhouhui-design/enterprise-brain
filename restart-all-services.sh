#!/bin/bash

# ========================================
# 企业大脑系统 - 重启所有服务脚本
# ========================================

echo "🔄 企业大脑系统 - 重启所有服务"
echo "====================================="
echo ""

# 工作目录
WORK_DIR="/home/sardensy/enterprise-brain/enterpise-brain"
cd "$WORK_DIR"

# 1. 停止所有现有服务
echo "[1/4] 停止现有服务..."
bash "$WORK_DIR/stop-all-services.sh"
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
echo "[3/4] 启动前端服务 (端口3003)..."
cd "$WORK_DIR/07-frontend"
rm -rf node_modules/.vite
NODE_OPTIONS="--max-old-space-size=1024" nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  前端PID: $FRONTEND_PID"

# 等待前端启动
echo "  等待前端服务启动..."
for i in {1..20}; do
    sleep 1
    if netstat -tuln 2>/dev/null | grep -q ":3003.*LISTEN"; then
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
echo "   本机访问: http://localhost:3003/auth/login"
echo "   局域网访问: http://$(hostname -I | awk '{print $1}'):3003/auth/login"
echo ""
echo "🔧 后端API:"
echo "   本机访问: http://localhost:3005"
echo "   局域网访问: http://$(hostname -I | awk '{print $1}'):3005"
echo ""
echo "======================================"
echo "✅ 所有服务重启完成！"
echo "======================================"
echo ""
echo "查看日志："
echo "  后端: tail -f $WORK_DIR/backend.log"
echo "  前端: tail -f $WORK_DIR/07-frontend/frontend.log"
echo ""