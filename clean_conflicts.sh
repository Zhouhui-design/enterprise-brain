#!/bin/bash

echo "清理Git合并冲突..."

# 修复 ProductionOrderCreate.vue - 删除重复代码块(第154-167行)
sed -i '154,167d' 07-frontend/src/pages/manufacturing/production-order/ProductionOrderCreate.vue

# 修复 ProductionOrderList.vue - 删除重复代码块(第61-137行)
sed -i '61,137d' 07-frontend/src/pages/manufacturing/production-order/ProductionOrderList.vue

# 修复 ProductionProgress.vue - 删除重复行(第494和501-503行)
sed -i '494d; 501,503d' 07-frontend/src/pages/manufacturing/production-order/ProductionProgress.vue

echo "✅ 清理完成"
