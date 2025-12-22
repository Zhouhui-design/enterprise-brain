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
          <el-button v-if="showColumnSettings" @click="columnControlVisible = true" size="small">
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
      <el-table-column type="selection" width="55" v-if="showSelection" />
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
            <span class="header-label">{{ column.label }}</span>
            <el-popover
              :visible="activeFilterColumn === column.prop"
              placement="bottom"
              width="280"
              trigger="click"
              @show="handleFilterShow(column.prop, column.filterType)"
              @hide="handleFilterHide"
            >
              <template #reference>
                <el-icon
                  class="filter-icon"
                  :class="{ 'is-filtered': hasFilter(column.prop) }"
                  @click.stop="toggleFilter(column.prop)"
                >
                  <Filter />
                </el-icon>
              </template>

              <!-- 筛选内容 -->
              <div class="filter-content">
                <!-- 文本筛选 -->
                <div v-if="getFilterType(column) === 'input'" class="filter-input-group">
                  <el-select
                    v-model="filterConfigs[column.prop].operator"
                    size="small"
                    style="width: 100px; margin-bottom: 8px;"
                  >
                    <el-option label="包含" value="contains" />
                    <el-option label="等于" value="equals" />
                    <el-option label="不等于" value="notEquals" />
                    <el-option label="开头是" value="startsWith" />
                    <el-option label="结尾是" value="endsWith" />
                  </el-select>
                  <el-input
                    v-model="filterConfigs[column.prop].value"
                    size="small"
                    placeholder="输入筛选内容"
                    clearable
                  />
                </div>

                <!-- 选择筛选 -->
                <div v-if="getFilterType(column) === 'select'" class="filter-select-group">
                  <el-checkbox-group
                    v-model="filterConfigs[column.prop].values"
                    class="filter-checkbox-group"
                  >
                    <el-checkbox
                      v-for="option in getColumnOptions(column.prop)"
                      :key="option"
                      :label="option"
                    >
                      {{ option }}
                    </el-checkbox>
                  </el-checkbox-group>
                </div>

                <!-- 数字筛选 -->
                <div v-if="getFilterType(column) === 'number'" class="filter-number-group">
                  <el-select
                    v-model="filterConfigs[column.prop].operator"
                    size="small"
                    style="width: 100px; margin-bottom: 8px;"
                  >
                    <el-option label="等于" value="equals" />
                    <el-option label="不等于" value="notEquals" />
                    <el-option label="大于" value="greaterThan" />
                    <el-option label="小于" value="lessThan" />
                    <el-option label="区间" value="between" />
                  </el-select>
                  <el-input-number
                    v-if="filterConfigs[column.prop].operator !== 'between'"
                    v-model="filterConfigs[column.prop].value"
                    size="small"
                    style="width: 100%;"
                  />
                  <div v-else class="filter-range">
                    <el-input-number
                      v-model="filterConfigs[column.prop].minValue"
                      size="small"
                      placeholder="最小值"
                      style="width: 48%;"
                    />
                    <span>~</span>
                    <el-input-number
                      v-model="filterConfigs[column.prop].maxValue"
                      size="small"
                      placeholder="最大值"
                      style="width: 48%;"
                    />
                  </div>
                </div>

                <!-- 日期筛选 -->
                <div v-if="getFilterType(column) === 'date'" class="filter-date-group">
                  <el-date-picker
                    v-model="filterConfigs[column.prop].dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    size="small"
                    style="width: 100%;"
                  />
                </div>

                <!-- 操作按钮 -->
                <div class="filter-actions">
                  <el-button size="small" @click="clearFilter(column.prop)">
                    清除
                  </el-button>
                  <el-button
                    type="primary"
                    size="small"
                    @click="applyFilter(column.prop)"
                  >
                    应用
                  </el-button>
                </div>
              </div>
            </el-popover>
          </div>
        </template>
        <template #default="{ row, $index }">
          <slot :name="`column-${column.prop}`" :row="row" :index="$index">
            <!-- 支持formatter函数 -->
            <span v-if="column.formatter">
              {{ column.formatter(row, column, row[column.prop], $index) }}
            </span>
            <span v-else>
              {{ row[column.prop] }}
            </span>
          </slot>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="operationWidth" v-if="showOperation">
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
  // 显示列设置按钮
  showColumnSettings: { type: Boolean, default: true },
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
  summaryColumns: { type: Array, default: () => [] },
  // 本地存储键名（用于保存列设置）
  storageKey: { type: String, default: 'enhanced-table-columns' }
})

const emit = defineEmits([
  'add', 'edit', 'delete', 'batch-delete', 'delete-single', 'export', 'import', 'refresh',
  'selection-change', 'sort-change', 'page-change', 'size-change', 'filter-change',
  'column-order-change', 'column-visibility-change'
])

const tableRef = ref(null)
const selectedRows = ref([])
const columnControlVisible = ref(false)
const selectedColumnProps = ref([])
const draggableColumns = ref([])

// 筛选相关状态
const activeFilterColumn = ref(null)
const filterConfigs = ref({})
const activeFilters = ref({})

const currentPage = ref(props.page)
const currentPageSize = ref(props.pageSize)

// 计算筛选后的数据
const filteredData = computed(() => {
  let data = props.data
  
  // 应用所有激活的筛选条件
  Object.keys(activeFilters.value).forEach(prop => {
    const filter = activeFilters.value[prop]
    
    if (filter.type === 'input' && filter.value) {
      // 文本筛选
      data = data.filter(row => {
        const value = String(row[prop] || '').toLowerCase()
        const filterValue = String(filter.value).toLowerCase()
        
        switch (filter.operator) {
          case 'contains':
            return value.includes(filterValue)
          case 'equals':
            return value === filterValue
          case 'notEquals':
            return value !== filterValue
          case 'startsWith':
            return value.startsWith(filterValue)
          case 'endsWith':
            return value.endsWith(filterValue)
          default:
            return true
        }
      })
    } else if (filter.type === 'select' && filter.values.length > 0) {
      // 选择筛选
      data = data.filter(row => filter.values.includes(row[prop]))
    } else if (filter.type === 'number') {
      // 数字筛选
      data = data.filter(row => {
        const value = Number(row[prop])
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value
          case 'notEquals':
            return value !== filter.value
          case 'greaterThan':
            return value > filter.value
          case 'lessThan':
            return value < filter.value
          case 'between':
            return value >= filter.minValue && value <= filter.maxValue
          default:
            return true
        }
      })
    } else if (filter.type === 'date' && filter.dateRange) {
      // 日期筛选
      const [startDate, endDate] = filter.dateRange
      data = data.filter(row => {
        const rowDate = new Date(row[prop])
        return rowDate >= startDate && rowDate <= endDate
      })
    }
  })
  
  return data
})

const tableData = computed(() => filteredData.value)

// 可见列
const visibleColumns = computed(() => {
  return draggableColumns.value.filter(col => selectedColumnProps.value.includes(col.prop))
})

// 从本地存储加载列设置
const loadColumnSettings = () => {
  try {
    const saved = localStorage.getItem(props.storageKey)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载列设置失败:', error)
  }
  return null
}

// 保存列设置到本地存储
const saveColumnSettings = () => {
  try {
    const settings = {
      columns: draggableColumns.value,
      visibleFields: selectedColumnProps.value
    }
    localStorage.setItem(props.storageKey, JSON.stringify(settings))
  } catch (error) {
    console.error('保存列设置失败:', error)
  }
}

// 初始化列配置
watch(() => props.columns, (newColumns) => {
  const savedSettings = loadColumnSettings()
  
  if (savedSettings && savedSettings.columns) {
    // 使用保存的列顺序
    draggableColumns.value = savedSettings.columns
    // 使用保存的可见字段
    selectedColumnProps.value = savedSettings.visibleFields || newColumns.map(col => col.prop)
  } else {
    // 使用默认列顺序
    draggableColumns.value = [...newColumns]
    selectedColumnProps.value = newColumns.map(col => col.prop)
  }
  
  // 初始化筛选配置
  newColumns.forEach(col => {
    if (col.filterable && !filterConfigs.value[col.prop]) {
      filterConfigs.value[col.prop] = {
        type: col.filterType || 'input',
        operator: 'contains',
        value: '',
        values: [],
        minValue: null,
        maxValue: null,
        dateRange: null
      }
    }
  })
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

// 筛选相关方法
const toggleFilter = (prop) => {
  activeFilterColumn.value = activeFilterColumn.value === prop ? null : prop
}

const handleFilterShow = (prop, filterType) => {
  activeFilterColumn.value = prop
  if (!filterConfigs.value[prop]) {
    filterConfigs.value[prop] = {
      type: filterType || 'input',
      operator: 'contains',
      value: '',
      values: [],
      minValue: null,
      maxValue: null,
      dateRange: null
    }
  }
}

const handleFilterHide = () => {
  activeFilterColumn.value = null
}

const getFilterType = (column) => {
  return column.filterType || 'input'
}

const hasFilter = (prop) => {
  return !!activeFilters.value[prop]
}

const getColumnOptions = (prop) => {
  const options = new Set()
  props.data.forEach(row => {
    const value = row[prop]
    if (value !== null && value !== undefined && value !== '') {
      options.add(value)
    }
  })
  return Array.from(options).slice(0, 100) // 限制100个选项
}

const applyFilter = (prop) => {
  const config = filterConfigs.value[prop]
  
  // 根据筛选类型构建筛选条件
  if (config.type === 'input' && config.value) {
    activeFilters.value[prop] = { ...config }
  } else if (config.type === 'select' && config.values.length > 0) {
    activeFilters.value[prop] = { ...config }
  } else if (config.type === 'number' && (config.value !== null || (config.minValue !== null && config.maxValue !== null))) {
    activeFilters.value[prop] = { ...config }
  } else if (config.type === 'date' && config.dateRange) {
    activeFilters.value[prop] = { ...config }
  } else {
    delete activeFilters.value[prop]
  }
  
  activeFilterColumn.value = null
  // 发送筛选事件
  emit('filter-change', activeFilters.value)
}

const clearFilter = (prop) => {
  // 清除筛选配置
  const config = filterConfigs.value[prop]
  if (config) {
    config.value = ''
    config.values = []
    config.minValue = null
    config.maxValue = null
    config.dateRange = null
  }
  
  delete activeFilters.value[prop]
  activeFilterColumn.value = null
  emit('filter-change', activeFilters.value)
}

// 显示筛选对话框（兼容旧版本）
const showFilterDialog = (column) => {
  toggleFilter(column.prop)
}

// 应用列设置
const applyColumnSettings = () => {
  // 保存拖拽后的列顺序
  columnControlVisible.value = false
  
  // 保存设置到本地存储
  saveColumnSettings()
  
  // 发送事件通知父组件
  emit('column-order-change', draggableColumns.value)
  emit('column-visibility-change', selectedColumnProps.value)
  
  ElMessage.success('列设置已保存')
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
    emit('batch-delete', selectedRows.value)
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

.header-label {
  flex: 1;
}

.filter-icon {
  margin-left: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #909399;
  transition: color 0.3s;
}

.filter-icon:hover {
  color: var(--el-color-primary);
}

.filter-icon.is-filtered {
  color: var(--el-color-primary);
}

/* 筛选内容样式 */
.filter-content {
  padding: 8px;
}

.filter-type-selector {
  margin-bottom: 12px;
}

.filter-input-group,
.filter-select-group,
.filter-number-group,
.filter-date-group {
  margin-bottom: 12px;
}

.filter-checkbox-group {
  max-height: 200px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.filter-checkbox-group .el-checkbox {
  margin: 4px 0;
}

.filter-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid #ebeef5;
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