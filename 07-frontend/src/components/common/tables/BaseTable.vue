<template>
  <div class="base-table-wrapper">
    <el-table
      ref="tableRef"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      :height="height"
      :max-height="maxHeight"
      :size="size"
      :loading="loading"
      :default-sort="defaultSort"
      :highlight-current-row="highlightCurrentRow"
      :row-key="rowKey"
      :tree-props="treeProps"
      :select-on-indeterminate="selectOnIndeterminate"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
      @current-change="handleCurrentChange"
      v-bind="$attrs"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        :reserve-selection="reserveSelection"
        fixed="left"
      />

      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="序号"
        width="60"
        align="center"
        fixed="left"
        :index="indexMethod"
      />

      <!-- 动态列 -->
      <template v-for="(column, index) in visibleColumns" :key="column.prop || index">
        <el-table-column
          v-if="!column.hidden"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :align="column.align || 'left'"
          :header-align="column.headerAlign || column.align || 'left'"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
          :resizable="column.resizable !== false"
        >
          <template v-if="column.slot" #default="scope">
            <slot :name="column.slot" :row="scope.row" :column="column" :$index="scope.$index" />
          </template>
          <template v-else-if="column.formatter" #default="scope">
            {{ column.formatter(scope.row, column, scope.row[column.prop], scope.$index) }}
          </template>
          <template v-else-if="column.render" #default="scope">
            <component
              :is="column.render"
              :row="scope.row"
              :column="column"
              :index="scope.$index"
            />
          </template>
        </el-table-column>
      </template>

      <!-- 操作列 -->
      <el-table-column
        v-if="showAction"
        label="操作"
        :width="actionWidth"
        :fixed="actionFixed"
        align="center"
      >
        <template #default="scope">
          <slot name="action" :row="scope.row" :$index="scope.$index">
            <el-button
              v-for="btn in getActionButtons(scope.row)"
              :key="btn.key"
              :type="btn.type || 'primary'"
              :size="btn.size || 'small'"
              :icon="btn.icon"
              :disabled="btn.disabled"
              link
              @click="handleAction(btn.key, scope.row, scope.$index)"
            >
              {{ btn.label }}
            </el-button>
          </slot>
        </template>
      </el-table-column>

      <!-- 空数据 -->
      <template #empty>
        <slot name="empty">
          <el-empty :description="emptyText" />
        </slot>
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination" class="table-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="pageSizes"
        :layout="paginationLayout"
        :background="paginationBackground"
        @size-change="handleSizeChange"
        @current-change="handleCurrentPageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  // 表格数据
  data: {
    type: Array,
    default: () => []
  },
  // 列配置
  columns: {
    type: Array,
    default: () => []
  },
  // 是否显示边框
  border: {
    type: Boolean,
    default: true
  },
  // 是否显示斑马纹
  stripe: {
    type: Boolean,
    default: true
  },
  // 表格高度
  height: {
    type: [String, Number],
    default: undefined
  },
  // 最大高度
  maxHeight: {
    type: [String, Number],
    default: undefined
  },
  // 尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
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
  // 是否显示操作列
  showAction: {
    type: Boolean,
    default: false
  },
  // 操作列宽度
  actionWidth: {
    type: [String, Number],
    default: 200
  },
  // 操作列固定
  actionFixed: {
    type: String,
    default: 'right'
  },
  // 操作按钮配置
  actionButtons: {
    type: [Array, Function],
    default: () => []
  },
  // 默认排序
  defaultSort: {
    type: Object,
    default: () => ({})
  },
  // 高亮当前行
  highlightCurrentRow: {
    type: Boolean,
    default: false
  },
  // 行数据的 Key
  rowKey: {
    type: [String, Function],
    default: 'id'
  },
  // 树形数据配置
  treeProps: {
    type: Object,
    default: () => ({ children: 'children', hasChildren: 'hasChildren' })
  },
  // 保留选择
  reserveSelection: {
    type: Boolean,
    default: false
  },
  // 选择不确定状态
  selectOnIndeterminate: {
    type: Boolean,
    default: true
  },
  // 空数据文本
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: false
  },
  // 总条数
  total: {
    type: Number,
    default: 0
  },
  // 当前页
  pageNum: {
    type: Number,
    default: 1
  },
  // 每页条数
  pageSize: {
    type: Number,
    default: 10
  },
  // 每页条数选项
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  // 分页布局
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  // 分页背景
  paginationBackground: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'selection-change',
  'sort-change',
  'row-click',
  'row-dblclick',
  'current-change',
  'action',
  'page-change',
  'size-change'
])

const tableRef = ref(null)
const tableData = ref([])
const currentPage = ref(props.pageNum)
const pageSize = ref(props.pageSize)

// 可见列
const visibleColumns = computed(() => {
  return props.columns.filter(col => !col.hidden)
})

// 监听数据变化
watch(() => props.data, (newVal) => {
  tableData.value = newVal || []
}, { immediate: true, deep: true })

watch(() => props.pageNum, (newVal) => {
  currentPage.value = newVal
})

watch(() => props.pageSize, (newVal) => {
  pageSize.value = newVal
})

// 序号方法
const indexMethod = (index) => {
  return (currentPage.value - 1) * pageSize.value + index + 1
}

// 获取操作按钮
const getActionButtons = (row) => {
  if (typeof props.actionButtons === 'function') {
    return props.actionButtons(row)
  }
  return props.actionButtons
}

// 选择改变
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

// 排序改变
const handleSortChange = (sortInfo) => {
  emit('sort-change', sortInfo)
}

// 行点击
const handleRowClick = (row, column, event) => {
  emit('row-click', row, column, event)
}

// 行双击
const handleRowDblClick = (row, column, event) => {
  emit('row-dblclick', row, column, event)
}

// 当前行改变
const handleCurrentChange = (currentRow, oldCurrentRow) => {
  emit('current-change', currentRow, oldCurrentRow)
}

// 操作按钮点击
const handleAction = (action, row, index) => {
  emit('action', { action, row, index })
}

// 页码改变
const handleCurrentPageChange = (page) => {
  currentPage.value = page
  emit('page-change', { page, pageSize: pageSize.value })
}

// 每页条数改变
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  emit('size-change', { page: 1, pageSize: size })
}

// 清空选择
const clearSelection = () => {
  tableRef.value?.clearSelection()
}

// 切换所有选择
const toggleAllSelection = () => {
  tableRef.value?.toggleAllSelection()
}

// 切换行选择
const toggleRowSelection = (row, selected) => {
  tableRef.value?.toggleRowSelection(row, selected)
}

// 设置当前行
const setCurrentRow = (row) => {
  tableRef.value?.setCurrentRow(row)
}

// 刷新布局
const doLayout = () => {
  tableRef.value?.doLayout()
}

// 排序
const sort = (prop, order) => {
  tableRef.value?.sort(prop, order)
}

// 暴露方法
defineExpose({
  clearSelection,
  toggleAllSelection,
  toggleRowSelection,
  setCurrentRow,
  doLayout,
  sort,
  tableRef
})

onMounted(() => {
  // 初始化后刷新布局
  setTimeout(() => {
    doLayout()
  }, 100)
})
</script>

<style scoped lang="scss">
.base-table-wrapper {
  width: 100%;

  .table-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
