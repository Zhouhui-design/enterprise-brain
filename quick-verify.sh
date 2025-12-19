#!/bin/bash

echo "🎯 快速验证 - 备料计划数据显示"
echo "================================"
echo ""

# 检查数据库数据
echo "1️⃣ 检查数据库数据..."
count=$(mysql -u root -p'Sardensy@123' enterprise_brain -N -e "SELECT COUNT(*) FROM material_preparation_plans" 2>/dev/null)
if [ -n "$count" ]; then
  echo "   ✅ 数据库有 $count 条备料计划数据"
else
  echo "   ⚠️  无法连接数据库或无数据"
fi

# 测试API
echo ""
echo "2️⃣ 测试后端API..."
response=$(curl -s http://localhost:3000/api/material-preparation-plans?page=1&pageSize=20)
if echo "$response" | grep -q '"list"'; then
  list_count=$(echo "$response" | grep -o '"list":\[' | wc -l)
  total=$(echo "$response" | grep -o '"total":[0-9]*' | grep -o '[0-9]*' | head -1)
  echo "   ✅ API返回正常"
  echo "   📊 total: $total"
  echo "   📋 响应包含list字段: 是"
else
  echo "   ❌ API响应异常"
  echo "   响应: $response"
fi

echo ""
echo "================================"
echo "✅ 验证完成！"
echo ""
echo "📝 现在请："
echo "1. 在浏览器打开备料计划页面"
echo "2. 按 Ctrl + Shift + R 硬刷新"
echo "3. 查看是否显示数据"
echo ""
echo "期望看到："
echo "✅ Console: 转换数据格式: list → records"
echo "✅ Console: 过滤后的有效数据: 20 条"
echo "✅ 表格显示20条数据"
echo ""
