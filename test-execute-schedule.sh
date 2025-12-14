#!/bin/bash
echo "==========================================="
echo "测试：主生产计划执行排程功能"
echo "==========================================="
echo ""

# 1. 获取第一条主生产计划
echo "1. 查询主生产计划..."
PLAN_ID=$(curl -s http://localhost:3005/api/master-production-plans | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

if [ -z "$PLAN_ID" ]; then
    echo "   ❌ 没有找到主生产计划"
    exit 1
else
    echo "   ✅ 找到主生产计划 ID: $PLAN_ID"
fi

echo ""
echo "2. 执行排程..."
RESULT=$(curl -s -X POST http://localhost:3005/api/master-production-plans/$PLAN_ID/execute-schedule 2>&1)

echo ""
echo "3. 检查响应..."
if [[ "$RESULT" == *'"code":200'* ]]; then
    echo "   ✅ 排程执行成功！"
    echo ""
    echo "返回结果："
    echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"
else
    echo "   ❌ 排程执行失败！"
    echo ""
    echo "错误信息："
    echo "$RESULT"
fi

echo ""
echo "==========================================="
