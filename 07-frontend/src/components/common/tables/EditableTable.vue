<template>
  <div class="editable-table-wrapper">
    <BaseTable
      ref="baseTableRef"
      :data="tableData"
      :columns="editableColumns"
      v-bind="$attrs"
      @row-click="handleRowClick"
    >
      <!-- 动态插槽 -->
      <template v-for="column in editableColumns" :key="column.prop" #[column.slot]="scope">
        <div v-if="isEditing(scope.row, column.prop)" class="edit-cell">
          <!-- 输入框 -->
          <el-input
            v-if="column.editType === 'input' || !column.editType"
            v-model="scope.row[column.prop]"
            :placeholder="column.placeholder || `请输入${column.label}`"
            size="small"
            @blur="handleBlur(scope.row, column.prop)"
            @keyup.enter="handleBlur(scope.row, column.prop)"
          />
          
          <!-- 数字输入框 -->
          <el-input-number
            v-else-if="column.editType === 'number'"
            v-model="scope.row[column.prop]"
            :min="column.min"
            :max="column.max"
            :precision="column.precision"
            :step="column.step"
            size="small"
            controls-position="right"
            @blur="handleBlur(scope.row, column.prop)"
          />
          
          <!-- 下拉选择 -->
          <el-select
            v-else-if="column.editType === 'select'"
            v-model="scope.row[column.prop]"
            :placeholder="column.placeholder || `请选择${column.label}`"
            size="small"
            @change="handleBlur(scope.row, column.prop)"
          >
            <el-option
              v-for="option in column.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          
          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="column.editType === 'date'"
            v-model="scope.row[column.prop]"
            type="date"
            :placeholder="column.placeholder || `请选择${column.label}`"
            size="small"
            value-format="YYYY-MM-DD"
            @change="handleBlur(scope.row, column.prop)"
          />
          
          <!-- 日期时间选择 -->
          <el-date-picker
            v-else-if="column.editType === 'datetime'"
            v-model="scope.row[column.prop]"
            type="datetime"
            :placeholder="column.placeholder || `请选择${column.label}`"
            size="small"
            value-format="YYYY-MM-DD HH:mm:ss"
            @change="handleBlur(scope.row, column.prop)"
          />
          
          <!-- 开关 -->
          <el-switch
            v-else-if="column.editType === 'switch'"
            v-model="scope.row[column.prop]"
            @change="handleBlur(scope.row, column.prop)"
          />
          
          <!-- 自定义编辑组件 -->
          <component
            v-else-if="column.editComponent"
            :is="column.editComponent"
            v-model="scope.row[column.prop]"
            :row="scope.row"
            :column="column"
            @blur="handleBlur(scope.row, column.prop)"
          />
        </div>
        
        <!-- 非编辑状态 -->
        <div v-else class="view-cell" @dblclick="handleEdit(scope.row, column.prop)">
          <span v-if="column.formatter">
            {{ column.formatter(scope.row, column, scope.row[column.prop], scope.$index) }}
          </span>
          <span v-else>
            {{ scope.row[column.prop] }}
          </span>
          <el-icon v-if="column.editable" class="edit-icon">
            <Edit />
          </el-icon>
        </div>
      </template>
      
      <!-- 操作列 -->
      <template #action="{ row, $index }">
        <el-button
          v-if="showAddBtn && $index === tableData.length - 1"
          type="primary"
          size="small"
          :icon="Plus"
          link
          @click="handleAdd"
        >
          添加
        </el-button>
        <el-button
          v-if="showDeleteBtn"
          type="danger"
          size="small"
          :icon="Delete"
          link
          @click="handleDelete(row, $index)"
        >
          删除
        </el-button>
        <slot name="action" :row="row" :index="$index" />
      </template>
    </BaseTable>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Plus, Delete } from '@element-plus/icons-vue'
import BaseTable from './BaseTable.vue'

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
  // 是否显示添加按钮
  showAddBtn: {
    type: Boolean,
    default: true
  },
  // 是否显示删除按钮
  showDeleteBtn: {
    type: Boolean,
    default: true
  },
  // 新行默认数据
  defaultRow: {
    type: Object,
    default: () => ({})
  },
  // 是否需要确认删除
  confirmDelete: {
    type: Boolean,
    default: true
  },
  // 单元格模式（click/dblclick）
  editMode: {
    type: String,
    default: 'dblclick'
  }
})

const emit = defineEmits(['update:data', 'add', 'delete', 'cell-change'])

const baseTableRef = ref(null)
const tableData = ref([])
const editingCells = ref(new Set())

// 监听数据变化
watch(() => props.data, (newVal) => {
  tableData.value = JSON.parse(JSON.stringify(newVal || []))
}, { immediate: true, deep: true })

// 处理后的列配置
const editableColumns = computed(() => {
  return props.columns.map(col => {
    if (col.editable) {
      return {
        ...col,
        slot: col.slot || `edit_${col.prop}`
      }
    }
    return col
  })
})

// 判断单元格是否在编辑状态
const isEditing = (row, prop) => {
  const key = `${row.id || row._index}_${prop}`
  return editingCells.value.has(key)
}

// 进入编辑模式
const handleEdit = (row, prop) => {
  const column = props.columns.find(col => col.prop === prop)
  if (!column?.editable) return
  
  const key = `${row.id || row._index}_${prop}`
  editingCells.value.add(key)
}

// 退出编辑模式
const handleBlur = (row, prop) => {
  const key = `${row.id || row._index}_${prop}`
  editingCells.value.delete(key)
  
  // 触发单元格变更事件
  emit('cell-change', { row, prop, value: row[prop] })
  
  // 更新数据
  emit('update:data', tableData.value)
}

// 行点击事件
const handleRowClick = (row, column, event) => {
  if (props.editMode === 'click' && column.property) {
    const col = props.columns.find(c => c.prop === column.property)
    if (col?.editable) {
      handleEdit(row, column.property)
    }
  }
}

// 添加行
const handleAdd = () => {
  const newRow = {
    ...props.defaultRow,
    _index: tableData.value.length,
    _isNew: true
  }
  tableData.value.push(newRow)
  emit('update:data', tableData.value)
  emit('add', newRow)
}

// 删除行
const handleDelete = async (row, index) => {
  if (props.confirmDelete) {
    try {
      await ElMessageBox.confirm('确定要删除这条数据吗？', '提示', {
        type: 'warning'
      })
    } catch {
      return
    }
  }
  
  tableData.value.splice(index, 1)
  emit('update:data', tableData.value)
  emit('delete', { row, index })
  ElMessage.success('删除成功')
}

// 批量添加行
const batchAdd = (rows) => {
  rows.forEach((row, index) => {
    tableData.value.push({
      ...row,
      _index: tableData.value.length + index,
      _isNew: true
    })
  })
  emit('update:data', tableData.value)
}

// 批量删除行
const batchDelete = (indexes) => {
  const sortedIndexes = indexes.sort((a, b) => b - a)
  sortedIndexes.forEach(index => {
    tableData.value.splice(index, 1)
  })
  emit('update:data', tableData.value)
}

// 获取表格数据
const getData = () => {
  return tableData.value
}

// 设置表格数据
const setData = (data) => {
  tableData.value = JSON.parse(JSON.stringify(data))
  emit('update:data', tableData.value)
}

// 暴露方法
defineExpose({
  batchAdd,
  batchDelete,
  getData,
  setData,
  baseTableRef
})
</script>

<style scoped lang="scss">
.editable-table-wrapper {
  width: 100%;

  .edit-cell {
    width: 100%;

    :deep(.el-input),
    :deep(.el-input-number),
    :deep(.el-select),
    :deep(.el-date-picker) {
      width: 100%;
    }
  }

  .view-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    padding: 4px 0;

    &:hover {
      .edit-icon {
        opacity: 1;
      }
    }

    .edit-icon {
      opacity: 0;
      margin-left: 8px;
      color: #409eff;
      transition: opacity 0.3s;
    }
  }
}
</style>
