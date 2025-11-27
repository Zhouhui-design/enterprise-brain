<template>
  <div class="column-manager">
    <!-- 列设置按钮 -->
    <el-button
      :icon="SettingIcon"
      size="small"
      @click="showDialog = true"
      title="列设置"
    >
      列设置
    </el-button>

    <!-- 列设置对话框 -->
    <el-dialog
      v-model="showDialog"
      title="列设置"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="column-manager-content">
        <!-- 搜索框 -->
        <el-input
          v-model="searchQuery"
          placeholder="搜索列名"
          prefix-icon="Search"
          clearable
          size="small"
          style="margin-bottom: 15px"
        />

        <!-- 全选/取消全选 -->
        <div class="select-actions">
          <el-checkbox
            v-model="selectAll"
            :indeterminate="isIndeterminate"
            @change="handleSelectAll"
          >
            全选
          </el-checkbox>
          <el-button size="small" @click="resetColumns">重置</el-button>
          <el-button size="small" @click="showHiddenColumns">显示隐藏列</el-button>
        </div>

        <!-- 列表 -->
        <div class="column-list">
          <el-scrollbar height="300px">
            <div
              v-for="column in filteredColumns"
              :key="column.prop"
              class="column-item"
              :class="{ disabled: column.required }"
            >
              <div class="column-info">
                <el-checkbox
                  v-model="column.visible"
                  :disabled="column.required"
                  @change="handleColumnChange"
                >
                  <div class="column-title">
                    <i v-if="column.icon" :class="column.icon" style="margin-right: 5px;"></i>
                    {{ column.label || column.prop }}
                  </div>
                  <div class="column-description" v-if="column.description">
                    {{ column.description }}
                  </div>
                </el-checkbox>
              </div>
              
              <div class="column-actions">
                <el-tooltip content="拖拽调整顺序" placement="top">
                  <i class="fas fa-grip-vertical grip-handle"></i>
                </el-tooltip>
                <el-tooltip content="固定列" placement="top">
                  <el-button
                    size="small"
                    text
                    :icon="column.fixed ? 'fas fa-thumbtack' : 'far fa-thumbtack'"
                    :class="{ 'is-active': column.fixed }"
                    @click="toggleFixed(column)"
                  />
                </el-tooltip>
                <el-tooltip content="列宽设置" placement="top">
                  <el-button
                    size="small"
                    text
                    icon="fas fa-arrows-alt-h"
                    @click="showWidthDialog(column)"
                  />
                </el-tooltip>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- 统计信息 -->
        <div class="column-stats">
          <span>共 {{ totalColumns }} 列</span>
          <span>已选择 {{ selectedColumns }} 列</span>
          <span>固定 {{ fixedColumns }} 列</span>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button @click="resetColumns">重置</el-button>
          <el-button type="primary" @click="applySettings">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 列宽设置对话框 -->
    <el-dialog
      v-model="showWidthDialogFlag"
      title="列宽设置"
      width="400px"
    >
      <el-form :model="widthForm" label-width="80px">
        <el-form-item label="宽度">
          <el-input-number
            v-model="widthForm.width"
            :min="50"
            :max="500"
            placeholder="请输入宽度(px)"
          />
        </el-form-item>
        <el-form-item label="自适应">
          <el-switch v-model="widthForm.autoWidth" />
        </el-form-item>
        <el-form-item label="最小宽度" v-if="!widthForm.autoWidth">
          <el-input-number
            v-model="widthForm.minWidth"
            :min="50"
            placeholder="请输入最小宽度(px)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showWidthDialogFlag = false">取消</el-button>
          <el-button type="primary" @click="applyWidth">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Setting as SettingIcon } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Column {
  prop: string
  label: string
  visible?: boolean
  fixed?: boolean | 'left' | 'right'
  width?: number
  minWidth?: number
  required?: boolean
  description?: string
  icon?: string
  order?: number
}

interface Props {
  columns: Column[]
  defaultColumns?: Column[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [columns: Column[]]
  reset: []
}>()

const showDialog = ref(false)
const showWidthDialogFlag = ref(false)
const searchQuery = ref('')
const editingColumn = ref<Column | null>(null)

// 创建列的副本用于编辑
const editableColumns = ref<Column[]>([])

const widthForm = ref({
  width: 120,
  autoWidth: false,
  minWidth: 80
})

// 初始化编辑列
const initEditableColumns = () => {
  editableColumns.value = props.columns.map(col => ({
    ...col,
    visible: col.visible !== false,
    order: col.order || 0
  }))
}

watch(() => props.columns, () => {
  initEditableColumns()
}, { immediate: true, deep: true })

// 过滤列
const filteredColumns = computed(() => {
  if (!searchQuery.value) {
    return editableColumns.value.sort((a, b) => a.order - b.order)
  }
  return editableColumns.value
    .filter(col => 
      (col.label || col.prop).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
    .sort((a, b) => a.order - b.order)
})

// 统计信息
const totalColumns = computed(() => editableColumns.value.length)

const selectedColumns = computed(() => 
  editableColumns.value.filter(col => col.visible).length
)

const fixedColumns = computed(() => 
  editableColumns.value.filter(col => col.fixed).length
)

// 全选状态
const selectAll = computed({
  get: () => {
    const optionalColumns = editableColumns.value.filter(col => !col.required)
    return optionalColumns.length > 0 && optionalColumns.every(col => col.visible)
  },
  set: (value: boolean) => {
    editableColumns.value.forEach(col => {
      if (!col.required) {
        col.visible = value
      }
    })
  }
})

// 是否半选状态
const isIndeterminate = computed(() => {
  const optionalColumns = editableColumns.value.filter(col => !col.required)
  const visibleCount = optionalColumns.filter(col => col.visible).length
  return visibleCount > 0 && visibleCount < optionalColumns.length
})

// 全选/取消全选
const handleSelectAll = (value: boolean) => {
  selectAll.value = value
}

// 列变化处理
const handleColumnChange = () => {
  // 可以在这里添加额外的变化处理逻辑
}

// 切换固定
const toggleFixed = (column: Column) => {
  if (column.fixed === 'left') {
    column.fixed = 'right'
  } else if (column.fixed === 'right') {
    column.fixed = false
  } else {
    column.fixed = 'left'
  }
}

// 显示列宽设置
const showWidthDialog = (column: Column) => {
  editingColumn.value = column
  widthForm.value = {
    width: column.width || 120,
    autoWidth: !column.width,
    minWidth: column.minWidth || 80
  }
  showWidthDialogFlag.value = true
}

// 应用列宽设置
const applyWidth = () => {
  if (editingColumn.value) {
    if (widthForm.value.autoWidth) {
      editingColumn.value.width = undefined
    } else {
      editingColumn.value.width = widthForm.value.width
      editingColumn.value.minWidth = widthForm.value.minWidth
    }
  }
  showWidthDialogFlag.value = false
  ElMessage.success('列宽设置已应用')
}

// 重置列设置
const resetColumns = () => {
  if (props.defaultColumns) {
    editableColumns.value = props.defaultColumns.map(col => ({
      ...col,
      visible: col.visible !== false,
      order: col.order || 0
    }))
  } else {
    initEditableColumns()
  }
  ElMessage.success('已重置为默认设置')
}

// 显示隐藏列
const showHiddenColumns = () => {
  editableColumns.value.forEach(col => {
    col.visible = true
  })
  ElMessage.success('已显示所有列')
}

// 应用设置
const applySettings = () => {
  emit('change', editableColumns.value)
  showDialog.value = false
  ElMessage.success('列设置已应用')
}
</script>

<style scoped>
.column-manager {
  display: inline-block;
}

.column-manager-content {
  padding: 10px 0;
}

.select-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.column-list {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.column-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.column-item:hover {
  background-color: #f5f7fa;
}

.column-item:last-child {
  border-bottom: none;
}

.column-item.disabled {
  opacity: 0.6;
}

.column-info {
  flex: 1;
}

.column-title {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #303133;
}

.column-description {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
  padding-left: 20px;
}

.column-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grip-handle {
  color: #c0c4cc;
  cursor: move;
  font-size: 14px;
}

.grip-handle:hover {
  color: #909399;
}

.column-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 15px;
  padding: 10px;
  background: #f0f2f5;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-checkbox__label) {
  width: 100%;
}

:deep(.el-button.is-active) {
  color: #409eff;
  background-color: #ecf5ff;
  border-color: #a0cfff;
}

:deep(.el-dialog__body) {
  padding: 20px;
}
</style>