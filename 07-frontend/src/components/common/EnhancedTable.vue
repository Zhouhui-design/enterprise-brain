<template>
  <div class="enhanced-table">
    <!-- 工具栏 -->
    <div class="table-toolbar" v-if="showToolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left">
          <el-button @click="$emit('add')" type="primary" size="small" v-if="showAdd">
            <el-icon><Plus /></el-icon>
            新增
          </el-button>
          <el-button @click="handleBatchDelete" :disabled="selectedRows.length === 0" size="small" v-if="showBatchDelete">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
          <el-button @click="$emit('export')" size="small" v-if="showExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button @click="$emit('import')" size="small" v-if="showImport">
            <el-icon><Upload /></el-icon>
            导入
          </el-button>
          <el-button @click="handlePrint" size="small" v-if="showPrint">
            <el-icon><Printer /></el-icon>
            打印
          </el-button>
        </slot>
      </div>
      <div class="toolbar-right">
        <slot name="toolbar-right">
          <el-button @click="columnControlVisible = true" size="small">
            <el-icon><Setting /></el-icon>
            列设置
          </el-button>
          <el-button @click="$emit('refresh')" size="small">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </slot>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      :height="height"
      :max-height="maxHeight"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" fixed="left" v-if="showSelection" />
      <el-table-column
        v-for="column in visibleColumns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :sortable="column.sortable ? 'custom' : false"
        :fixed="column.fixed"
        :align="column.align || 'left'"
      >
        <template #header v-if="column.filterable && showFilter">
          <div class="filter-header">
            <span>{{ column.label }}</span>
            <el-icon class="filter-icon" @click="showFilterDialog(column)">
              <Filter />
            </el-icon>
          </div>
        </template>
        <template #default="{ row, $index }">
          <slot :name="`column-${column.prop}`" :row="row" :index="$index">
            {{ row[column.prop] }}
          </slot>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="operationWidth" fixed="right" v-if="showOperation">
        <template #default="{ row, $index }">
          <slot name="operation" :row="row" :index="$index">
            <el-button type="primary" size="small" @click="$emit('edit', row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleSingleDelete(row)">删除</el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 统计行 -->
    <div class="table-summary" v-if="showSummary && summaryData">
      <el-row :gutter="20">
        <el-col :span="summaryColumns.length > 0 ? 24 / summaryColumns.length : 24" v-for="col in summaryColumns" :key="col.prop">
          <div class="summary-item">
            <span class="summary-label">{{ col.label }}：</span>
            <span class="summary-value">{{ formatSummaryValue(col, summaryData[col.prop]) }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <div class="table-pagination" v-if="showPagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="paginationLayout"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 列控制对话框 -->
    <el-dialog v-model="columnControlVisible" title="列设置" width="500px">
      <div class="column-control">
        <el-checkbox-group v-model="selectedColumnProps">
          <draggable v-model="draggableColumns" item-key="prop" handle=".drag-handle">
            <template #item="{ element }">
              <div class="column-item">
                <el-icon class="drag-handle"><Rank /></el-icon>
                <el-checkbox :label="element.prop">{{ element.label }}</el-checkbox>
              </div>
            </template>
          </draggable>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="columnControlVisible = false">取消</el-button>
        <el-button type="primary" @click="applyColumnSettings">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus, Delete, Download, Upload, Printer, Setting, Refresh, Filter, Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  // 表格数据
  data: { type: Array, default: () => [] },
  // 列配置
  columns: { type: Array, required: true },
  // 加载状态
  loading: { type: Boolean, default: false },
  // 显示边框
  border: { type: Boolean, default: true },
  // 显示斑马纹
  stripe: { type: Boolean, default: true },
  // 表格高度
  height: { type: [String, Number], default: undefined },
  // 最大高度
  maxHeight: { type: [String, Number], default: undefined },
  // 显示工具栏
  showToolbar: { type: Boolean, default: true },
  // 显示新增按钮
  showAdd: { type: Boolean, default: true },
  // 显示批量删除
  showBatchDelete: { type: Boolean, default: true },
  // 显示导出
  showExport: { type: Boolean, default: true },
  // 显示导入
  showImport: { type: Boolean, default: true },
  // 显示打印
  showPrint: { type: Boolean, default: true },
  // 显示选择框
  showSelection: { type: Boolean, default: true },
  // 显示操作列
  showOperation: { type: Boolean, default: true },
  // 操作列宽度
  operationWidth: { type: Number, default: 180 },
  // 显示筛选
  showFilter: { type: Boolean, default: true },
  // 显示分页
  showPagination: { type: Boolean, default: true },
  // 分页布局
  paginationLayout: { type: String, default: 'total, sizes, prev, pager, next, jumper' },
  // 每页大小选项
  pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
  // 总数
  total: { type: Number, default: 0 },
  // 当前页
  page: { type: Number, default: 1 },
  // 每页大小
  pageSize: { type: Number, default: 20 },
  // 显示统计
  showSummary: { type: Boolean, default: false },
  // 统计数据
  summaryData: { type: Object, default: () => ({}) },
  // 统计列
  summaryColumns: { type: Array, default: () => [] }
})

const emit = defineEmits([
  'add', 'edit', 'delete', 'delete-single', 'export', 'import', 'refresh',
  'selection-change', 'sort-change', 'page-change', 'size-change'
])

const tableRef = ref(null)
const selectedRows = ref([])
const columnControlVisible = ref(false)
const selectedColumnProps = ref([])
const draggableColumns = ref([])

const currentPage = ref(props.page)
const currentPageSize = ref(props.pageSize)
const tableData = computed(() => props.data)

// 可见列
const visibleColumns = computed(() => {
  return draggableColumns.value.filter(col => selectedColumnProps.value.includes(col.prop))
})

// 初始化列配置
watch(() => props.columns, (newColumns) => {
  draggableColumns.value = [...newColumns]
  selectedColumnProps.value = newColumns.map(col => col.prop)
}, { immediate: true })

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}

// 排序变化
const handleSortChange = ({ column, prop, order }) => {
  emit('sort-change', { column, prop, order })
}

// 分页变化
const handleCurrentChange = (page) => {
  currentPage.value = page
  emit('page-change', page)
}

const handleSizeChange = (size) => {
  currentPageSize.value = size
  emit('size-change', size)
}

// 打印
const handlePrint = () => {
  window.print()
}

// 显示筛选对话框
const showFilterDialog = (column) => {
  console.log('筛选列:', column)
  // TODO: 实现筛选对话框
}

// 应用列设置
const applyColumnSettings = () => {
  columnControlVisible.value = false
}

// 格式化统计值
const formatSummaryValue = (column, value) => {
  // 如果format是函数，直接调用
  if (typeof column.format === 'function') {
    return column.format(value)
  }
  // 如果format是字符串，根据类型格式化
  if (typeof column.format === 'string') {
    switch (column.format) {
      case 'number':
        return value?.toLocaleString() || '0'
      case 'money':
        return `¥${value?.toFixed(2) || '0.00'}`
      case 'percent':
        return `${value?.toFixed(2) || '0'}%`
      default:
        return value || 0
    }
  }
  // 如果没有format，根据type格式化
  if (column.type === 'money') {
    return `¥${value?.toFixed(2) || '0.00'}`
  }
  return value || 0
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '删除确认',
      {
        type: 'warning'
      }
    )
    emit('delete', selectedRows.value)
  } catch {
    // 用户取消删除
  }
}

// 单条删除
const handleSingleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条记录吗？',
      '删除确认',
      {
        type: 'warning'
      }
    )
    emit('delete-single', row)
  } catch {
    // 用户取消删除
  }
}

// 暴露方法
defineExpose({
  clearSelection: () => tableRef.value?.clearSelection(),
  toggleRowSelection: (row, selected) => tableRef.value?.toggleRowSelection(row, selected),
  toggleAllSelection: () => tableRef.value?.toggleAllSelection(),
  getSelectedRows: () => selectedRows.value
})
</script>

<style scoped>
.enhanced-table {
  width: 100%;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-bottom: none;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 8px;
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-icon {
  margin-left: 4px;
  cursor: pointer;
}

.filter-icon:hover {
  color: var(--el-color-primary);
}

.table-summary {
  padding: 16px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-top: none;
}

.summary-item {
  padding: 8px;
  text-align: center;
}

.summary-label {
  font-weight: 600;
  color: #606266;
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-color-primary);
  margin-left: 8px;
}

.table-pagination {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  background: #fff;
  border: 1px solid #ebeef5;
  border-top: none;
}

.column-control {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: move;
  border-bottom: 1px solid #ebeef5;
}

.drag-handle {
  margin-right: 8px;
  cursor: move;
  color: #909399;
}

.drag-handle:hover {
  color: var(--el-color-primary);
}

/* 打印样式 */
@media print {
  .table-toolbar,
  .table-pagination {
    display: none !important;
  }
}
</style>