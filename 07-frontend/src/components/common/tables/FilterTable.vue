<template>
  <div class="filter-table-wrapper">
    <el-table
      ref="tableRef"
      v-bind="$attrs"
      :data="paginatedData"
      @selection-change="handleSelectionChange"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        fixed="left"
      />

      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="70"
        align="center"
        fixed="left"
      />

      <!-- 动态列 -->
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :fixed="column.fixed"
        :align="column.align || 'left'"
        :sortable="column.sortable"
        :show-overflow-tooltip="column.showOverflowTooltip !== false"
      >
        <!-- 自定义表头 - 添加筛选图标 -->
        <template #header="{ column: col }">
          <div class="filter-header">
            <span class="header-label">{{ col.label }}</span>
            <el-popover
              :visible="activeFilterColumn === column.prop"
              placement="bottom"
              width="280"
              trigger="click"
              @show="handleFilterShow(column.prop)"
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
                <div class="filter-type-selector">
                  <el-radio-group
                    v-model="filterConfigs[column.prop].type"
                    size="small"
                  >
                    <el-radio-button label="input">文本</el-radio-button>
                    <el-radio-button label="select">选择</el-radio-button>
                    <el-radio-button label="number">数字</el-radio-button>
                    <el-radio-button label="date">日期</el-radio-button>
                  </el-radio-group>
                </div>

                <!-- 文本筛选 -->
                <div v-if="filterConfigs[column.prop].type === 'input'" class="filter-input-group">
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
                <div v-if="filterConfigs[column.prop].type === 'select'" class="filter-select-group">
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
                <div v-if="filterConfigs[column.prop].type === 'number'" class="filter-number-group">
                  <el-select
                    v-model="filterConfigs[column.prop].operator"
                    size="small"
                    style="width: 100px; margin-bottom: 8px;"
                  >
                    <el-option label="等于" value="equals" />
                    <el-option label="不等于" value="notEquals" />
                    <el-option label="大于" value="greaterThan" />
                    <el-option label="小于" value="lessThan" />
                    <el-option label="大于等于" value="greaterThanOrEqual" />
                    <el-option label="小于等于" value="lessThanOrEqual" />
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
                <div v-if="filterConfigs[column.prop].type === 'date'" class="filter-date-group">
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

        <!-- 单元格内容 -->
        <template #default="scope">
          <slot
            :name="column.prop"
            :row="scope.row"
            :column="scope.column"
            :$index="scope.$index"
          >
            {{ scope.row[column.prop] }}
          </slot>
        </template>
      </el-table-column>

      <!-- 操作列插槽 -->
      <slot name="actions" />
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="currentPageSize"
        :page-sizes="pageSizes"
        :total="filteredTotal"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { Filter } from '@element-plus/icons-vue'

const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 列配置
  columns: {
    type: Array,
    required: true
  },
  // 是否显示选择列
  showSelection: {
    type: Boolean,
    default: false
  },
  // 是否显示序号列
  showIndex: {
    type: Boolean,
    default: false
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: true
  },
  // 总数
  total: {
    type: Number,
    default: 0
  },
  // 当前页
  pageNum: {
    type: Number,
    default: 1
  },
  // 每页数量
  pageSize: {
    type: Number,
    default: 20
  },
  // 分页大小选项
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100, 200]
  }
})

const emit = defineEmits([
  'selection-change',
  'page-change',
  'size-change',
  'filter-change'
])

const tableRef = ref(null)
const activeFilterColumn = ref(null)
const currentPage = ref(props.pageNum)
const currentPageSize = ref(props.pageSize)

// 筛选配置
const filterConfigs = reactive({})

// 初始化筛选配置
const initFilterConfigs = () => {
  props.columns.forEach(column => {
    if (!filterConfigs[column.prop]) {
      filterConfigs[column.prop] = {
        type: 'input', // input, select, number, date
        operator: 'contains', // contains, equals, notEquals, greaterThan, lessThan, etc.
        value: null,
        values: [], // for select type
        minValue: null,
        maxValue: null,
        dateRange: null,
        active: false
      }
    }
  })
}

// 获取列的所有选项（用于选择筛选）- 添加缓存优化
const columnOptionsCache = new Map()

const getColumnOptions = (prop) => {
  // 使用缓存避免重复计算
  const cacheKey = `${prop}_${props.data.length}`
  if (columnOptionsCache.has(cacheKey)) {
    return columnOptionsCache.get(cacheKey)
  }
  
  const values = new Set()
  // 只取前1000条数据提取选项，避免性能问题
  const dataSlice = props.data.slice(0, 1000)
  dataSlice.forEach(row => {
    const value = row[prop]
    if (value !== null && value !== undefined && value !== '') {
      // 处理数组类型
      if (Array.isArray(value)) {
        value.forEach(v => values.add(String(v)))
      } else {
        values.add(String(value))
      }
    }
  })
  
  const result = Array.from(values).sort().slice(0, 100) // 最多100个选项
  columnOptionsCache.set(cacheKey, result)
  return result
}

// 检查列是否有筛选
const hasFilter = (prop) => {
  return filterConfigs[prop]?.active
}

// 显示筛选
const handleFilterShow = (prop) => {
  activeFilterColumn.value = prop
}

// 隐藏筛选
const handleFilterHide = () => {
  activeFilterColumn.value = null
}

// 切换筛选
const toggleFilter = (prop) => {
  if (activeFilterColumn.value === prop) {
    activeFilterColumn.value = null
  } else {
    activeFilterColumn.value = prop
  }
}

// 应用筛选
const applyFilter = (prop) => {
  filterConfigs[prop].active = true
  activeFilterColumn.value = null
  
  // 筛选后重置到第一页
  currentPage.value = 1
  
  // 触发筛选变化事件
  emit('filter-change', getActiveFilters())
}

// 清除单个筛选
const clearFilter = (prop) => {
  filterConfigs[prop].value = null
  filterConfigs[prop].values = []
  filterConfigs[prop].minValue = null
  filterConfigs[prop].maxValue = null
  filterConfigs[prop].dateRange = null
  filterConfigs[prop].active = false
  activeFilterColumn.value = null
  
  // 清除筛选后重置到第一页
  currentPage.value = 1
  
  // 触发筛选变化事件
  emit('filter-change', getActiveFilters())
}

// 清除所有筛选
const clearAllFilters = () => {
  Object.keys(filterConfigs).forEach(prop => {
    clearFilter(prop)
  })
}

// 获取激活的筛选
const getActiveFilters = () => {
  const filters = {}
  Object.keys(filterConfigs).forEach(prop => {
    if (filterConfigs[prop].active) {
      filters[prop] = { ...filterConfigs[prop] }
    }
  })
  return filters
}

// 筛选数据
const filteredData = computed(() => {
  let result = [...props.data]
  
  Object.keys(filterConfigs).forEach(prop => {
    const config = filterConfigs[prop]
    if (!config.active) return
    
    result = result.filter(row => {
      const cellValue = row[prop]
      
      switch (config.type) {
        case 'input':
          return filterTextValue(cellValue, config)
        case 'select':
          return filterSelectValue(cellValue, config)
        case 'number':
          return filterNumberValue(cellValue, config)
        case 'date':
          return filterDateValue(cellValue, config)
        default:
          return true
      }
    })
  })
  
  return result
})

// 分页数据（在筛选后的数据上分页）
const paginatedData = computed(() => {
  if (!props.showPagination) {
    return filteredData.value
  }
  
  const start = (currentPage.value - 1) * currentPageSize.value
  const end = start + currentPageSize.value
  return filteredData.value.slice(start, end)
})

// 筛选后的总数
const filteredTotal = computed(() => {
  return filteredData.value.length
})

// 文本筛选
const filterTextValue = (value, config) => {
  if (!config.value) return true
  const str = String(value || '').toLowerCase()
  const filterStr = String(config.value).toLowerCase()
  
  switch (config.operator) {
    case 'contains':
      return str.includes(filterStr)
    case 'equals':
      return str === filterStr
    case 'notEquals':
      return str !== filterStr
    case 'startsWith':
      return str.startsWith(filterStr)
    case 'endsWith':
      return str.endsWith(filterStr)
    default:
      return true
  }
}

// 选择筛选
const filterSelectValue = (value, config) => {
  if (!config.values || config.values.length === 0) return true
  
  // 处理数组类型
  if (Array.isArray(value)) {
    return value.some(v => config.values.includes(String(v)))
  }
  
  return config.values.includes(String(value))
}

// 数字筛选
const filterNumberValue = (value, config) => {
  const num = parseFloat(value)
  if (isNaN(num)) return false
  
  switch (config.operator) {
    case 'equals':
      return num === config.value
    case 'notEquals':
      return num !== config.value
    case 'greaterThan':
      return num > config.value
    case 'lessThan':
      return num < config.value
    case 'greaterThanOrEqual':
      return num >= config.value
    case 'lessThanOrEqual':
      return num <= config.value
    case 'between':
      return num >= config.minValue && num <= config.maxValue
    default:
      return true
  }
}

// 日期筛选
const filterDateValue = (value, config) => {
  if (!config.dateRange || config.dateRange.length !== 2) return true
  
  const date = new Date(value)
  const startDate = new Date(config.dateRange[0])
  const endDate = new Date(config.dateRange[1])
  
  return date >= startDate && date <= endDate
}

// 选择改变
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

// 页码改变
const handleCurrentChange = (page) => {
  currentPage.value = page
  emit('page-change', { page, pageSize: currentPageSize.value })
}

// 每页数量改变
const handleSizeChange = (size) => {
  currentPageSize.value = size
  currentPage.value = 1
  emit('size-change', { page: 1, pageSize: size })
}

// 监听数据变化，初始化筛选配置
watch(() => props.data, () => {
  initFilterConfigs()
}, { immediate: true })

// 监听columns变化
watch(() => props.columns, () => {
  initFilterConfigs()
}, { immediate: true })

// 暴露方法
defineExpose({
  clearAllFilters,
  clearFilter,
  getActiveFilters,
  tableRef
})
</script>

<style scoped lang="scss">
.filter-table-wrapper {
  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    
    .header-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .filter-icon {
      margin-left: 4px;
      cursor: pointer;
      color: #909399;
      transition: color 0.3s;
      
      &:hover {
        color: #409EFF;
      }
      
      &.is-filtered {
        color: #409EFF;
      }
    }
  }
  
  .filter-content {
    padding: 8px 0;
    
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
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
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
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #EBEEF5;
    }
  }
  
  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

// 打印时隐藏筛选图标
@media print {
  .filter-icon {
    display: none !important;
  }
}
</style>
