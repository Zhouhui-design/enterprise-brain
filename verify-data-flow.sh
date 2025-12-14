#!/bin/bash
echo "==========================================="
echo "验证数据流水线完整性"
echo "==========================================="
echo ""

echo "1. 查询刚创建的备料计划..."
MATERIAL_PLAN=$(curl -s "http://localhost:3005/api/material-preparation-plans?planNo=MPP2025090719334")
if [[ "$MATERIAL_PLAN" == *'"code":200'* ]]; then
    echo "   ✅ 备料计划已创建"
    echo "   计划编号: MPP2025090719334"
else
    echo "   ❌ 备料计划未找到"
fi

echo ""
echo "2. 查询刚创建的真工序计划..."
PROCESS_PLAN=$(curl -s "http://localhost:3005/api/real-process-plans?planNo=PP2025090723698")
if [[ "$PROCESS_PLAN" == *'"code":200'* ]]; then
    echo "   ✅ 真工序计划已创建"
    echo "   计划编号: PP2025090723698"
else
    echo "   ❌ 真工序计划未找到"
fi

echo ""
echo "3. 检查真工序计划是否推送了BOM子件到备料计划..."
NEW_MATERIALS=$(curl -s "http://localhost:3005/api/material-preparation-plans?sourceProcessPlanNo=PP2025090723698")
COUNT=$(echo "$NEW_MATERIALS" | grep -o '"id":[0-9]*' | wc -l)
if [ $COUNT -gt 0 ]; then
    echo "   ✅ 已推送 $COUNT 条BOM子件到备料计划"
else
    echo "   ⚠️  未推送BOM子件（可能产品没有BOM子件）"
fi

echo ""
echo "==========================================="
echo "数据流水线验证完成"
echo "==========================================="
