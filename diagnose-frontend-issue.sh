#!/bin/bash

echo "🔍 备料计划前端问题诊断工具"
echo "================================"
echo ""

# 1. 检查后端服务
echo "1️⃣ 检查后端服务..."
if curl -s http://localhost:3000/api/material-preparation-plans?page=1&pageSize=1 > /dev/null; then
  echo "   ✅ 后端服务运行正常"
else
  echo "   ❌ 后端服务未运行或无法访问"
  echo "   请先启动后端服务: cd backend && node server.js"
  exit 1
fi

# 2. 测试API响应
echo ""
echo "2️⃣ 测试API响应..."
response=$(curl -s http://localhost:3000/api/material-preparation-plans?page=1&pageSize=20)
code=$(echo $response | grep -o '"code":[0-9]*' | grep -o '[0-9]*')
total=$(echo $response | grep -o '"total":[0-9]*' | grep -o '[0-9]*')

if [ "$code" = "200" ]; then
  echo "   ✅ API响应正常"
  echo "   📊 返回数据总数: $total 条"
else
  echo "   ❌ API响应异常"
  echo "   响应内容: $response"
  exit 1
fi

# 3. 检查前端服务
echo ""
echo "3️⃣ 检查前端服务..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
  echo "   ✅ 前端服务运行正常"
else
  echo "   ❌ 前端服务未运行"
  echo "   请启动前端服务: cd 07-frontend && npm run dev"
  exit 1
fi

# 4. 生成测试URL
echo ""
echo "4️⃣ 生成测试链接..."
echo "   📋 备料计划页面: http://localhost:5173/#/production-planning/material-preparation"
echo "   🧪 API测试页面: file://$(pwd)/test-frontend-material-prep.html"

# 5. 检查数据库
echo ""
echo "5️⃣ 验证数据库数据..."
echo "   运行: node verify-material-prep-data.js"
node verify-material-prep-data.js 2>&1 | grep -E "总数:|list数量:|数据一致性:"

echo ""
echo "================================"
echo "✅ 诊断完成！"
echo ""
echo "📝 下一步操作:"
echo "1. 在浏览器打开: http://localhost:5173/#/production-planning/material-preparation"
echo "2. 按 F12 打开开发者工具"
echo "3. 查看 Console 标签的日志输出"
echo "4. 查看 Network 标签的 /api/material-preparation-plans 请求"
echo "5. 如有错误，截图发送给技术支持"
echo ""
