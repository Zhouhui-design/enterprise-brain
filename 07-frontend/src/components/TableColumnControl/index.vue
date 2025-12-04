<template>
  <div class="table-column-control">
    <el-popover
      placement="bottom-end"
      :width="350"
      trigger="click"
    >
      <template #reference>
        <el-button :icon="Setting" circle size="small" />
      </template>
      
      <div class="column-control-panel">
        <div class="panel-header">
          <span>列显示设置</span>
          <el-button type="primary" link size="small" @click="resetColumns">重置</el-button>
        </div>
        
        <el-divider style="margin: 10px 0;" />
        
        <div class="column-list">
          <draggable
            v-model="localColumns"
            item-key="prop"
            handle=".drag-handle"
            @end="handleDragEnd"
          >
            <template #item="{ element }">
              <div class="column-item">
                <div class="column-item-left">
                  <el-icon class="drag-handle"><Rank /></el-icon>
                  <el-checkbox
                    v-model="element.visible"
                    :label="element.label"
                    @change="handleVisibleChange"
                  />
                </div>
                <div class="column-item-right">
                  <el-tag v-if="element.fixed" size="small" type="info">固定</el-tag>
                </div>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Setting, Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits(['update:columns', 'change'])

// 本地列配置
const localColumns = ref([])
const originalColumns = ref([])

// 初始化
const initColumns = () => {
  localColumns.value = JSON.parse(JSON.stringify(props.columns))
  originalColumns.value = JSON.parse(JSON.stringify(props.columns))
}

// 监听外部列变化
watch(() => props.columns, () => {
  if (props.columns.length > 0 && localColumns.value.length === 0) {
    initColumns()
  }
}, { immediate: true, deep: true })

// 拖拽结束
const handleDragEnd = () => {
  emitChange()
}

// 可见性变化
const handleVisibleChange = () => {
  emitChange()
}

// 重置列
const resetColumns = () => {
  localColumns.value = JSON.parse(JSON.stringify(originalColumns.value))
  emitChange()
}

// 发送变化事件
const emitChange = () => {
  emit('update:columns', localColumns.value)
  emit('change', localColumns.value)
}
</script>

<style scoped>
.table-column-control {
  display: inline-block;
}

.column-control-panel {
  padding: 5px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.column-list {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 5px;
  border-radius: 4px;
  cursor: move;
  transition: background-color 0.2s;
}

.column-item:hover {
  background-color: #f5f7fa;
}

.column-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.drag-handle {
  cursor: move;
  color: #909399;
  font-size: 16px;
}

.drag-handle:hover {
  color: #409eff;
}

.column-item-right {
  margin-left: 10px;
}

.column-list :deep(.el-checkbox) {
  width: 100%;
}

.column-list :deep(.el-checkbox__label) {
  color: #606266;
  font-size: 14px;
}
</style>
