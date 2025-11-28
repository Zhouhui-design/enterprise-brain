<template>
  <div class="search-table-wrapper">
    <!-- 搜索表单 -->
    <el-card v-if="showSearch" class="search-card" shadow="never">
      <el-form
        ref="searchFormRef"
        :model="searchForm"
        :inline="inline"
        :label-width="labelWidth"
        @submit.prevent="handleSearch"
      >
        <el-row :gutter="16">
          <el-col
            v-for="field in visibleSearchFields"
            :key="field.prop"
            :span="field.span || (inline ? 8 : 24)"
          >
            <el-form-item :label="field.label" :prop="field.prop">
              <!-- 输入框 -->
              <el-input
                v-if="field.type === 'input' || !field.type"
                v-model="searchForm[field.prop]"
                :placeholder="field.placeholder || `请输入${field.label}`"
                clearable
              />
              
              <!-- 选择框 -->
              <el-select
                v-else-if="field.type === 'select'"
                v-model="searchForm[field.prop]"
                :placeholder="field.placeholder || `请选择${field.label}`"
                clearable
                filterable
              >
                <el-option
                  v-for="option in field.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              
              <!-- 日期选择 -->
              <el-date-picker
                v-else-if="field.type === 'date'"
                v-model="searchForm[field.prop]"
                type="date"
                :placeholder="field.placeholder || `请选择${field.label}`"
                value-format="YYYY-MM-DD"
                clearable
              />
              
              <!-- 日期范围 -->
              <el-date-picker
                v-else-if="field.type === 'daterange'"
                v-model="searchForm[field.prop]"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                clearable
              />
              
              <!-- 时间范围 -->
              <el-date-picker
                v-else-if="field.type === 'datetimerange'"
                v-model="searchForm[field.prop]"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                clearable
              />
              
              <!-- 数字输入 -->
              <el-input-number
                v-else-if="field.type === 'number'"
                v-model="searchForm[field.prop]"
                :min="field.min"
                :max="field.max"
                :precision="field.precision"
                :placeholder="field.placeholder || `请输入${field.label}`"
                controls-position="right"
              />
              
              <!-- 自定义组件 -->
              <component
                v-else-if="field.component"
                :is="field.component"
                v-model="searchForm[field.prop]"
                v-bind="field.componentProps"
              />
            </el-form-item>
          </el-col>
          
          <!-- 操作按钮 -->
          <el-col :span="inline ? 8 : 24">
            <el-form-item v-if="inline" label=" ">
              <el-button type="primary" :icon="Search" @click="handleSearch">
                查询
              </el-button>
              <el-button :icon="Refresh" @click="handleReset">
                重置
              </el-button>
              <el-button
                v-if="searchFields.length > defaultShowCount"
                link
                @click="toggleExpand"
              >
                {{ expanded ? '收起' : '展开' }}
                <el-icon>
                  <component :is="expanded ? ArrowUp : ArrowDown" />
                </el-icon>
              </el-button>
            </el-form-item>
            <el-form-item v-else>
              <el-button type="primary" :icon="Search" @click="handleSearch">
                查询
              </el-button>
              <el-button :icon="Refresh" @click="handleReset">
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 工具栏 -->
    <el-card v-if="showToolbar" class="toolbar-card" shadow="never">
      <div class="toolbar-content">
        <div class="toolbar-left">
          <slot name="toolbar-left">
            <el-button
              v-if="showAddBtn"
              type="primary"
              :icon="Plus"
              @click="emit('add')"
            >
              新增
            </el-button>
            <el-button
              v-if="showDeleteBtn"
              type="danger"
              :icon="Delete"
              :disabled="!hasSelection"
              @click="emit('batch-delete', selectedRows)"
            >
              批量删除
            </el-button>
            <el-button
              v-if="showExportBtn"
              :icon="Download"
              @click="emit('export')"
            >
              导出
            </el-button>
          </slot>
        </div>
        <div class="toolbar-right">
          <slot name="toolbar-right">
            <el-tooltip content="刷新">
              <el-button :icon="Refresh" circle @click="handleRefresh" />
            </el-tooltip>
            <el-tooltip content="列设置">
              <el-button :icon="Setting" circle @click="showColumnSetting = true" />
            </el-tooltip>
          </slot>
        </div>
      </div>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <BaseTable
        ref="baseTableRef"
        v-model:data="tableData"
        :columns="columns"
        :show-selection="showSelection"
        :show-pagination="showPagination"
        :total="total"
        :page-num="pageNum"
        :page-size="pageSize"
        v-bind="$attrs"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <!-- 插槽透传 -->
        <template v-for="(_, slot) in $slots" #[slot]="scope">
          <slot :name="slot" v-bind="scope" />
        </template>
      </BaseTable>
    </el-card>

    <!-- 列设置对话框 -->
    <el-dialog v-model="showColumnSetting" title="列设置" width="500px">
      <el-checkbox-group v-model="visibleColumnProps">
        <div v-for="column in columns" :key="column.prop" class="column-setting-item">
          <el-checkbox :label="column.prop">{{ column.label }}</el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="showColumnSetting = false">取消</el-button>
        <el-button type="primary" @click="handleSaveColumnSetting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Refresh, Plus, Delete, Download, Setting, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import BaseTable from './BaseTable.vue'

const props = defineProps({
  // 数据
  data: {
    type: Array,
    default: () => []
  },
  // 列配置
  columns: {
    type: Array,
    default: () => []
  },
  // 搜索字段配置
  searchFields: {
    type: Array,
    default: () => []
  },
  // 是否显示搜索
  showSearch: {
    type: Boolean,
    default: true
  },
  // 是否显示工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 是否显示选择列
  showSelection: {
    type: Boolean,
    default: true
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
  // 页码
  pageNum: {
    type: Number,
    default: 1
  },
  // 每页数量
  pageSize: {
    type: Number,
    default: 10
  },
  // 搜索表单是否内联
  inline: {
    type: Boolean,
    default: true
  },
  // 标签宽度
  labelWidth: {
    type: String,
    default: '100px'
  },
  // 默认显示字段数量
  defaultShowCount: {
    type: Number,
    default: 6
  },
  // 是否显示新增按钮
  showAddBtn: {
    type: Boolean,
    default: true
  },
  // 是否显示删除按钮
  showDeleteBtn: {
    type: Boolean,
    default: true
  },
  // 是否显示导出按钮
  showExportBtn: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'search',
  'reset',
  'refresh',
  'add',
  'batch-delete',
  'export',
  'page-change',
  'size-change'
])

const searchFormRef = ref(null)
const baseTableRef = ref(null)
const searchForm = ref({})
const expanded = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const showColumnSetting = ref(false)
const visibleColumnProps = ref([])

// 初始化搜索表单
const initSearchForm = () => {
  const form = {}
  props.searchFields.forEach(field => {
    form[field.prop] = field.defaultValue || null
  })
  searchForm.value = form
}

// 可见搜索字段
const visibleSearchFields = computed(() => {
  if (!expanded.value && props.searchFields.length > props.defaultShowCount) {
    return props.searchFields.slice(0, props.defaultShowCount)
  }
  return props.searchFields
})

// 是否有选中行
const hasSelection = computed(() => {
  return selectedRows.value && selectedRows.value.length > 0
})

// 监听数据变化
watch(() => props.data, (newVal) => {
  tableData.value = newVal
}, { immediate: true })

// 初始化可见列
watch(() => props.columns, (newVal) => {
  visibleColumnProps.value = newVal.map(col => col.prop)
}, { immediate: true })

// 切换展开
const toggleExpand = () => {
  expanded.value = !expanded.value
}

// 查询
const handleSearch = () => {
  emit('search', searchForm.value)
}

// 重置
const handleReset = () => {
  searchFormRef.value?.resetFields()
  initSearchForm()
  emit('reset')
}

// 刷新
const handleRefresh = () => {
  emit('refresh')
}

// 选择改变
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 页码改变
const handlePageChange = (data) => {
  emit('page-change', data)
}

// 每页数量改变
const handleSizeChange = (data) => {
  emit('size-change', data)
}

// 保存列设置
const handleSaveColumnSetting = () => {
  showColumnSetting.value = false
  // TODO: 保存到本地存储
}

// 初始化
initSearchForm()

// 暴露方法
defineExpose({
  searchForm,
  baseTableRef,
  handleSearch,
  handleReset
})
</script>

<style scoped lang="scss">
.search-table-wrapper {
  .search-card,
  .toolbar-card,
  .table-card {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .toolbar-content {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      gap: 8px;
    }
  }

  .column-setting-item {
    padding: 8px 0;
  }
}
</style>
