#!/bin/bash
echo "==========================================="
echo "重启前端服务（清理缓存）"
echo "==========================================="
echo ""

echo "步骤1：停止当前前端服务..."
pkill -f "vite"
sleep 2

if pgrep -f "vite" > /dev/null; then
    echo "   ⚠️  前端服务仍在运行，强制结束..."
    pkill -9 -f "vite"
    sleep 1
fi

echo "   ✅ 前端服务已停止"

echo ""
echo "步骤2：清理前端缓存..."
cd /home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend

if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "   ✅ 已清理 Vite 缓存"
fi

if [ -d "dist" ]; then
    rm -rf dist
    echo "   ✅ 已清理 dist 目录"
fi

echo ""
echo "步骤3：重启前端服务..."
cd /home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend

# 后台启动前端服务
nohup npm run dev > ../frontend.log 2>&1 &

echo "   等待服务启动..."
sleep 5

# 检查服务是否启动成功
if curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo "   ✅ 前端服务启动成功！"
    echo "   访问地址: http://localhost:3003"
else
    echo "   ⚠️  前端服务可能还在启动中，请稍等..."
    echo "   可以查看日志: tail -f frontend.log"
fi

echo ""
echo "==========================================="
echo "完成！请按以下步骤操作："
echo "==========================================="
echo ""
echo "1. 打开浏览器"
echo "2. 按 Ctrl+Shift+Delete 清除浏览器缓存"
echo "3. 访问: http://localhost:3003"
echo "4. 按 Ctrl+Shift+R 硬刷新页面"
echo ""
echo "如果问题仍存在，请："
echo "1. 打开浏览器控制台（F12）"
echo "2. 查看 Console 标签的错误信息"
echo "3. 截图或复制错误信息反馈给我"
