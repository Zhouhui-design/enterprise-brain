#!/bin/bash
echo "==========================================="
echo "完整数据流水线测试（模拟3天前的流程）"
echo "==========================================="
echo ""

echo "📋 测试目标："
echo "   销售订单 → 主生产计划 → 备料计划 → 真工序计划"
echo "   ├─ 推送工时到工序能力负荷表"
echo "   └─ 真工序计划推送BOM子件到备料计划"
echo ""

# 1. 检查是否有主生产计划
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤1：检查主生产计划"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
PLAN_ID=$(curl -s http://localhost:3005/api/master-production-plans | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -z "$PLAN_ID" ]; then
    echo "❌ 没有主生产计划，无法继续测试"
    exit 1
fi
echo "✅ 找到主生产计划 ID: $PLAN_ID"

# 2. 记录执行排程前的数据量
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤2：记录执行前的数据"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
BEFORE_MATERIAL=$(curl -s http://localhost:3005/api/material-preparation-plans | grep -o '"id":[0-9]*' | wc -l)
BEFORE_PROCESS=$(curl -s http://localhost:3005/api/real-process-plans | grep -o '"id":[0-9]*' | wc -l)
echo "📊 执行前备料计划数量: $BEFORE_MATERIAL"
echo "📊 执行前真工序计划数量: $BEFORE_PROCESS"

# 3. 执行排程
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤3：执行排程"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
RESULT=$(curl -s -X POST http://localhost:3005/api/master-production-plans/$PLAN_ID/execute-schedule)

if [[ "$RESULT" == *'"code":200'* ]]; then
    echo "✅ 排程执行成功！"
    
    # 提取计划编号
    MATERIAL_PLAN_NO=$(echo "$RESULT" | grep -o '"planNo":"[^"]*"' | head -1 | cut -d'"' -f4)
    PROCESS_PLAN_NO=$(echo "$RESULT" | grep -o '"processPlanNo":"[^"]*"' | cut -d'"' -f4)
    
    echo "   📝 生成备料计划: $MATERIAL_PLAN_NO"
    echo "   📝 生成真工序计划: $PROCESS_PLAN_NO"
else
    echo "❌ 排程执行失败！"
    echo "$RESULT"
    exit 1
fi

# 4. 等待数据写入
sleep 2

# 5. 验证数据增长
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤4：验证数据生成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
AFTER_MATERIAL=$(curl -s http://localhost:3005/api/material-preparation-plans | grep -o '"id":[0-9]*' | wc -l)
AFTER_PROCESS=$(curl -s http://localhost:3005/api/real-process-plans | grep -o '"id":[0-9]*' | wc -l)
echo "📊 执行后备料计划数量: $AFTER_MATERIAL (增加 $((AFTER_MATERIAL - BEFORE_MATERIAL)) 条)"
echo "📊 执行后真工序计划数量: $AFTER_PROCESS (增加 $((AFTER_PROCESS - BEFORE_PROCESS)) 条)"

# 6. 验证真工序计划推送BOM子件
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤5：验证真工序计划推送BOM子件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ ! -z "$PROCESS_PLAN_NO" ]; then
    BOM_MATERIALS=$(curl -s "http://localhost:3005/api/material-preparation-plans?sourceProcessPlanNo=$PROCESS_PLAN_NO")
    BOM_COUNT=$(echo "$BOM_MATERIALS" | grep -o '"id":[0-9]*' | wc -l)
    
    if [ $BOM_COUNT -gt 0 ]; then
        echo "✅ 真工序计划已推送 $BOM_COUNT 条BOM子件到备料计划"
    else
        echo "⚠️  真工序计划未推送BOM子件（可能产品无BOM或推送失败）"
    fi
fi

# 7. 查询工序能力负荷表（检查是否推送了工时）
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "步骤6：检查工序能力负荷表"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 获取真工序计划的详细信息
if [ ! -z "$PROCESS_PLAN_NO" ]; then
    PROCESS_DETAIL=$(curl -s "http://localhost:3005/api/real-process-plans?planNo=$PROCESS_PLAN_NO")
    SCHEDULED_HOURS=$(echo "$PROCESS_DETAIL" | grep -o '"scheduledWorkHours":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ ! -z "$SCHEDULED_HOURS" ] && [ "$SCHEDULED_HOURS" != "0" ] && [ "$SCHEDULED_HOURS" != "null" ]; then
        echo "✅ 真工序计划已计算排程工时: ${SCHEDULED_HOURS}h"
        echo "   （应该已推送到工序能力负荷表的已占用工时）"
    else
        echo "⚠️  真工序计划未计算排程工时"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "测试完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "总结："
if [[ "$RESULT" == *'"code":200'* ]] && [ $BOM_COUNT -gt 0 ]; then
    echo "🎉 完整数据流水线正常工作！"
    echo "   ✅ 主生产计划 → 备料计划"
    echo "   ✅ 备料计划 → 真工序计划"
    echo "   ✅ 真工序计划 → 推送BOM子件到备料计划"
    echo ""
    echo "⚠️  还需手动验证："
    echo "   - 工序能力负荷表的已占用工时是否正确更新"
    echo "   - 删除真工序计划时是否正确释放占用工时"
else
    echo "⚠️  部分功能可能有问题，请查看上面的详细输出"
fi
