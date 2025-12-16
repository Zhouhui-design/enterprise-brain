<!-- src/components/common/business/BOMCopy.vue -->
<template>
  <div class="bom-copy">
    <el-card>
      <div slot="header">
        <span>BOM复制功能</span>
      </div>
      
      <div class="operation-buttons">
        <CopyButton
          :content="JSON.stringify(selectedBom)"
          type="bom"
          show-save-template
          @copy-complete="handleCopyComplete"
        />
        <PasteButton
          type="bom"
          @paste-complete="handlePasteComplete"
        />
        <el-button
          type="info"
          @click="showTemplateManager = true"
        >
          模板管理
        </el-button>
      </div>
      
      <!-- BOM列表（示例） -->
      <el-table
        :data="bomList"
        border
        @row-click="handleRowClick"
        :row-class-name="tableRowClassName"
      >
        <el-table-column
          prop="id"
          label="BOM ID"
          width="100"
        />
        <el-table-column
          prop="bomNo"
          label="BOM编号"
          width="150"
        />
        <el-table-column
          prop="productName"
          label="产品名称"
        />
        <el-table-column
          prop="version"
          label="版本号"
          width="80"
        />
        <el-table-column
          prop="status"
          label="状态"
          width="100"
        />
      </el-table>
    </el-card>
    
    <!-- 模板管理弹窗 -->
    <CopyTemplateManager
      :visible="showTemplateManager"
      type="bom"
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
 * BOM复制组件
 * 集成复制粘贴功能到BOM业务场景
 */

// 选中的BOM
const selectedBom = ref(null);
// BOM列表（示例数据）
const bomList = ref([
  {
    id: 1,
    bomNo: 'BOM001',
    productName: '产品A',
    version: 'V1.0',
    status: '生效'
  },
  {
    id: 2,
    bomNo: 'BOM002',
    productName: '产品B',
    version: 'V2.1',
    status: '生效'
  }
]);
// 模板管理弹窗显示状态
const showTemplateManager = ref(false);

/**
 * 处理表格行点击事件
 * @param {Object} row 选中的行数据
 */
const handleRowClick = (row) => {
  selectedBom.value = row;
};

/**
 * 表格行样式处理（高亮选中行）
 * @param {Object} param 行参数
 * @returns {string} 样式类名
 */
const tableRowClassName = ({ row }) => {
  return row.id === (selectedBom.value?.id || -1) ? 'selected-row' : '';
};

/**
 * 处理复制完成事件
 * @param {Object} result 复制结果
 */
const handleCopyComplete = (result) => {
  if (result.success) {
    console.log('BOM复制成功', result);
  }
};

/**
 * 处理粘贴完成事件
 * @param {string} businessId 生成的业务ID
 */
const handlePasteComplete = (businessId) => {
  ElMessage.success(`BOM粘贴成功，新BOM ID：${businessId}`);
};

/**
 * 处理使用模板事件
 * @param {Object} template 选中的模板
 */
const handleUseTemplate = (template) => {
  ElMessage.success(`使用BOM模板：${template.name}`);
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
