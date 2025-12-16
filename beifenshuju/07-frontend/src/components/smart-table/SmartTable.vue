<template>
  <div class="smart-table-container">
    <TableToolbar 
      @createColumn="handleCreateColumn"
      @saveTable="handleSaveTable"
    />
    <TableEditor 
      :tableData="tableData"
      :columns="columns"
      @cellUpdated="handleCellUpdate"
    />
    <ColumnManager 
      v-if="showColumnManager"
      :columns="columns"
      @close="showColumnManager = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import TableToolbar from './TableToolbar.vue';
import TableEditor from './TableEditor.vue';
import ColumnManager from './ColumnManager.vue';
import useTableData from './hooks/useTableData';

const { tableData, columns, fetchTableData } = useTableData();
const showColumnManager = ref(false);

onMounted(() => {
  fetchTableData(1); // 假设加载ID为1的表格数据
});

const handleCellUpdate = (cellData) => {
  // 处理单元格更新逻辑
};

const handleCreateColumn = () => {
  showColumnManager.value = true;
};

const handleSaveTable = () => {
  // 保存表格数据逻辑
};
</script>
