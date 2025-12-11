#!/bin/bash

# 删除重复的script标签和其后的代码
# ProductionOrderCreate.vue - 删除688行开始的重复代码
tail -n +1 src/pages/manufacturing/production-order/ProductionOrderCreate.vue | head -687 > /tmp/tmp_file && mv /tmp/tmp_file src/pages/manufacturing/production-order/ProductionOrderCreate.vue

# ProductionOrderList.vue - 删除重复的script块  
sed -i '/^<script setup>$/,/^<\/script>$/{ /^<script setup>$/{ :a; N; /^<\/script>$/!ba; /^<script setup>$/d; /^<\/script>$/d; } }' src/pages/manufacturing/production-order/ProductionOrderList.vue

echo "✅ 修复完成"
