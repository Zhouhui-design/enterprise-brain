#!/bin/bash
echo "========================================="
echo "系统完整功能验证测试"
echo "========================================="
echo ""

echo "1. 检查前端服务..."
curl -s http://localhost:3003 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ 前端服务正常 (http://localhost:3003)"
else
    echo "   ❌ 前端服务异常"
fi

echo ""
echo "2. 检查后端服务..."
HEALTH=$(curl -s http://localhost:3005/health 2>&1)
if [[ "$HEALTH" == *"ok"* ]]; then
    echo "   ✅ 后端服务正常 (http://localhost:3005)"
else
    echo "   ❌ 后端服务异常"
fi

echo ""
echo "3. 检查数据库连接..."
mysql -h localhost -u root -p123456 -e "SELECT 1" erp_system > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ 数据库连接正常"
else
    echo "   ❌ 数据库连接异常"
fi

echo ""
echo "4. 检查主生产计划API..."
PLANS=$(curl -s http://localhost:3005/api/master-production-plans 2>&1)
if [[ "$PLANS" == *'"code":200'* ]]; then
    echo "   ✅ 主生产计划API正常"
    COUNT=$(echo "$PLANS" | grep -o '"id":[0-9]*' | wc -l)
    echo "   📊 当前有 $COUNT 条主生产计划"
else
    echo "   ❌ 主生产计划API异常"
fi

echo ""
echo "5. 检查备料计划API..."
MATERIALS=$(curl -s http://localhost:3005/api/material-preparation-plans 2>&1)
if [[ "$MATERIALS" == *'"code":200'* ]]; then
    echo "   ✅ 备料计划API正常"
    COUNT=$(echo "$MATERIALS" | grep -o '"id":[0-9]*' | wc -l)
    echo "   📊 当前有 $COUNT 条备料计划"
else
    echo "   ❌ 备料计划API异常"
fi

echo ""
echo "6. 检查真工序计划API..."
PROCESS=$(curl -s http://localhost:3005/api/real-process-plans 2>&1)
if [[ "$PROCESS" == *'"code":200'* ]]; then
    echo "   ✅ 真工序计划API正常"
    COUNT=$(echo "$PROCESS" | grep -o '"id":[0-9]*' | wc -l)
    echo "   📊 当前有 $COUNT 条真工序计划"
else
    echo "   ❌ 真工序计划API异常"
fi

echo ""
echo "========================================="
echo "验证完成"
echo "========================================="
