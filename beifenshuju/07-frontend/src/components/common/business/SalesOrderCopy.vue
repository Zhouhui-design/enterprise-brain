<!-- src/components/common/business/SalesOrderCopy.vue -->
<template>
  <div class="sales-order-copy">
    <el-card>
      <div slot="header">
        <span>销售订单复制功能</span>
      </div>
      
      <div class="operation-buttons">
        <CopyButton
          :content="JSON.stringify(selectedOrder)"
          type="salesOrder"
          show-save-template
          @copy-complete="handleCopyComplete"
        />
        <PasteButton
          type="salesOrder"
          @paste-complete="handlePasteComplete"
        />
        <el-button
          type="info"
          @click="showTemplateManager = true"
        >
          模板管理
        </el-button>
      </div>
      
      <!-- 销售订单列表（示例） -->
      <el-table
        :data="orderList"
        border
        @row-click="handleRowClick"
        :row-class-name="tableRowClassName"
      >
        <el-table-column
          prop="id"
          label="订单ID"
          width="120"
        />
        <el-table-column
          prop="orderNo"
          label="订单编号"
          width="180"
        />
        <el-table-column
          prop="customerName"
          label="客户名称"
        />
        <el-table-column
          prop="orderDate"
          label="订单日期"
          width="150"
        />
        <el-table-column
          prop="amount"
          label="订单金额"
          width="120"
        />
      </el-table>
    </el-card>
    
    <!-- 模板管理弹窗 -->
    <CopyTemplateManager
      :visible="showTemplateManager"
      type="salesOrder"
      @close="showTemplateManager = false"
      @use-template="handleUseTemplate"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import CopyButton from '../copy-paste/CopyButton.vue';
import PasteButton from '../copy-paste/PasteButton.vue';
import CopyTemplateManager from '../copy-paste/CopyTemplateManager.vue';

/**
 * 销售订单复制组件
 * 集成复制粘贴功能到销售订单业务场景
 */

// 选中的订单
const selectedOrder = ref(null);
// 订单列表（示例数据）
const orderList = ref([
  {
    id: 1,
    orderNo: 'SO2023001',
    customerName: '测试客户A',
    orderDate: '2023-07-01',
    amount: 12000
  },
  {
    id: 2,
    orderNo: 'SO2023002',
    customerName: '测试客户B',
    orderDate: '2023-07-05',
    amount: 8500
  }
]);
// 模板管理弹窗显示状态
const showTemplateManager = ref(false);

/**
 * 处理表格行点击事件
 * @param {Object} row 选中的行数据
 */
const handleRowClick = (row) => {
  selectedOrder.value = row;
};

/**
 * 表格行样式处理（高亮选中行）
 * @param {Object} param 行参数
 * @returns {string} 样式类名
 */
const tableRowClassName = ({ row }) => {
  return row.id === (selectedOrder.value?.id || -1) ? 'selected-row' : '';
};

/**
 * 处理复制完成事件
 * @param {Object} result 复制结果
 */
const handleCopyComplete = (result) => {
  if (result.success) {
    console.log('销售订单复制成功', result);
  }
};

/**
 * 处理粘贴完成事件
 * @param {string} businessId 生成的业务ID
 */
const handlePasteComplete = (businessId) => {
  ElMessage.success(`销售订单粘贴成功，新订单ID：${businessId}`);
  // 这里可以添加刷新列表等逻辑
};

/**
 * 处理使用模板事件
 * @param {Object} template 选中的模板
 */
const handleUseTemplate = (template) => {
  ElMessage.success(`使用模板：${template.name}`);
  // 这里可以添加使用模板数据填充表单等逻辑
  console.log('模板内容', template.content);
};
</script>

<style scoped>
.operation-buttons {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

::v-deep .selected-row {
  background-color: #e6f7ff;
}
</style>
