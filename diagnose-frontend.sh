#!/bin/bash
echo "==========================================="
echo "前端问题诊断"
echo "==========================================="
echo ""

# 1. 检查前端服务状态
echo "1. 检查前端服务..."
if pgrep -f "vite" > /dev/null; then
    echo "   ✅ 前端服务正在运行"
    PID=$(pgrep -f "vite" | head -1)
    echo "   进程PID: $PID"
else
    echo "   ❌ 前端服务未运行！"
    echo "   需要启动前端服务"
fi

echo ""
echo "2. 检查前端端口..."
if curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo "   ✅ 前端端口3003可访问"
else
    echo "   ❌ 前端端口3003无法访问"
fi

echo ""
echo "3. 检查后端服务..."
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "   ✅ 后端服务正常"
else
    echo "   ❌ 后端服务异常"
fi

echo ""
echo "4. 检查主生产计划API..."
PLANS=$(curl -s "http://localhost:3005/api/master-production-plans?page=1&pageSize=10")
if [[ "$PLANS" == *'"code":200'* ]]; then
    COUNT=$(echo "$PLANS" | grep -o '"total":[0-9]*' | head -1 | cut -d: -f2)
    echo "   ✅ 主生产计划API正常，共 $COUNT 条数据"
else
    echo "   ❌ 主生产计划API异常"
    echo "   返回: $PLANS"
fi

echo ""
echo "==========================================="
echo "诊断建议："
echo "==========================================="
echo ""
echo "如果前端服务未运行，执行："
echo "  cd 07-frontend && npm run dev"
echo ""
echo "如果端口无法访问，检查："
echo "  1. 防火墙设置"
echo "  2. Vite配置文件"
echo "  3. 端口是否被占用"
echo ""
echo "如果API正常但前端看不到数据："
echo "  1. 清除浏览器缓存（Ctrl+Shift+Delete）"
echo "  2. 硬刷新页面（Ctrl+Shift+R）"
echo "  3. 检查浏览器控制台错误（F12）"
