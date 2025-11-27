<template>
  <div class="batch-operation-container">
    <!-- 批量操作按钮组 -->
    <div v-if="showToolbar" class="operation-toolbar">
      <div class="toolbar-left">
        <el-checkbox
          v-model="selectAll"
          :indeterminate="isIndeterminate"
          @change="handleSelectAllChange"
          :disabled="disabled || total === 0"
        >
          全选
        </el-checkbox>
        
        <span class="selected-info" v-if="total > 0">
          已选择 <span class="selected-count">{{ selectedCount }}</span> 项（共 {{ total }} 项）
        </span>
      </div>
      
      <div class="toolbar-right">
        <!-- 批量操作按钮 -->
        <template v-for="operation in operations" :key="operation.key">
          <el-dropdown
            v-if="operation.type === 'dropdown'"
            :disabled="disabled || selectedCount === 0"
            @command="(command) => handleBatchOperation(operation.key, command)"
          >
            <el-button :size="size" :type="operation.type" :icon="operation.icon">
              {{ operation.label }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in operation.options"
                  :key="option.value"
                  :command="option.value"
                >
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-button
            v-else
            :type="operation.type || 'primary'"
            :icon="operation.icon"
            :size="size"
            :disabled="disabled || selectedCount === 0 || (operation.requireMin && selectedCount < operation.requireMin)"
            @click="handleBatchOperation(operation.key)"
            :loading="operationLoading[operation.key]"
          >
            {{ operation.label }}
            <template v-if="operation.requireMin">
              <span class="require-count">（≥{{ operation.requireMin }}）</span>
            </template>
          </el-button>
        </template>
        
        <!-- 自定义操作插槽 -->
        <slot name="actions" :selectedCount="selectedCount" :disabled="disabled"></slot>
      </div>
    </div>
    
    <!-- 批量操作确认对话框 -->
    <el-dialog
      v-model="showConfirmDialog"
      :title="confirmDialogConfig.title"
      :width="confirmDialogConfig.width || '400px'"
      :confirm-button-text="confirmDialogConfig.confirmText || '确定'"
      :cancel-button-text="confirmDialogConfig.cancelText || '取消'"
      :close-on-click-modal="false"
      :show-close="false"
      @confirm="confirmBatchOperation"
      @cancel="cancelBatchOperation"
    >
      <!-- 确认对话框内容 -->
      <div class="confirm-dialog-content">
        <div class="confirm-icon">
          <el-icon v-if="confirmDialogConfig.type === 'warning'"><WarningFilled /></el-icon>
          <el-icon v-else-if="confirmDialogConfig.type === 'success'"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="confirmDialogConfig.type === 'error'"><CircleCloseFilled /></el-icon>
          <el-icon v-else><QuestionFilled /></el-icon>
        </div>
        
        <div class="confirm-message">
          {{ confirmDialogConfig.message }}
        </div>
        
        <!-- 操作表单 -->
        <div v-if="currentOperation?.formConfig" class="operation-form">
          <el-form
            ref="operationFormRef"
            :model="operationFormData"
            :rules="currentOperation.formConfig.rules"
            label-width="80px"
            size="small"
          >
            <template v-for="field in currentOperation.formConfig.fields" :key="field.prop">
              <el-form-item
                :label="field.label"
                :prop="field.prop"
                :required="field.required"
              >
                <component
                  :is="getFieldComponent(field.type)"
                  v-model="operationFormData[field.prop]"
                  v-bind="field.componentProps"
                  :size="'small'"
                />
              </el-form-item>
            </template>
          </el-form>
        </div>
      </div>
    </el-dialog>
    
    <!-- 批量操作结果提示 -->
    <el-dialog
      v-model="showResultDialog"
      :title="resultDialogConfig.title"
      :width="resultDialogConfig.width || '400px'"
      :show-close="false"
      @closed="resetResultDialog"
    >
      <div class="result-dialog-content">
        <div class="result-icon" :class="resultDialogConfig.type">
          <el-icon v-if="resultDialogConfig.type === 'success'"><CircleCheckFilled /></el-icon>
          <el-icon v-else-if="resultDialogConfig.type === 'error'"><CircleCloseFilled /></el-icon>
          <el-icon v-else-if="resultDialogConfig.type === 'warning'"><WarningFilled /></el-icon>
          <el-icon v-else><InfoFilled /></el-icon>
        </div>
        
        <div class="result-message">
          {{ resultDialogConfig.message }}
        </div>
        
        <!-- 详细结果 -->
        <div v-if="resultDialogConfig.details" class="result-details">
          <el-collapse>
            <el-collapse-item title="详细信息">
              <pre>{{ JSON.stringify(resultDialogConfig.details, null, 2) }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showResultDialog = false">关闭</el-button>
        <el-button
          v-if="resultDialogConfig.showRetry"
          type="primary"
          @click="retryOperation"
        >
          重试
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowDown,
  Check,
  Delete,
  Edit,
  Download,
  Upload,
  Share,
  Star,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  QuestionFilled,
  InfoFilled
} from '@element-plus/icons-vue'

// Props 定义
const props = defineProps({
  // 总数据量
  total: {
    type: Number,
    default: 0
  },
  // 已选择的数据ID列表
  selectedIds: {
    type: Array,
    default: () => []
  },
  // 是否显示工具栏
  showToolbar: {
    type: Boolean,
    default: true
  },
  // 批量操作配置
  operations: {
    type: Array,
    default: () => [
      {
        key: 'delete',
        label: '删除',
        type: 'danger',
        icon: Delete,
        confirm: true,
        confirmTitle: '确认删除',
        confirmMessage: '确定要删除选中的 {count} 条数据吗？此操作不可撤销！',
        confirmType: 'warning'
      },
      {
        key: 'export',
        label: '导出',
        icon: Download,
        confirm: true,
        confirmTitle: '确认导出',
        confirmMessage: '确定要导出选中的 {count} 条数据吗？'
      }
    ]
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 按钮尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 是否自动处理操作结果
  autoHandleResult: {
    type: Boolean,
    default: true
  },
  // 默认的字段组件映射
  fieldComponents: {
    type: Object,
    default: () => ({
      input: 'FormItemsInputField',
      select: 'FormItemsSelectField',
      date: 'FormItemsDatePickerField',
      upload: 'FormItemsUploadField',
      checkbox: 'el-checkbox-group',
      radio: 'el-radio-group',
      switch: 'el-switch'
    })
  }
})

// Emits 定义
const emit = defineEmits([
  'update:selectedIds',
  'select-all',
  'operation',
  'operation-start',
  'operation-end',
  'operation-error',
  'operation-success',
  'retry'
])

// 表单引用
const operationFormRef = ref(null)

// 响应式数据
const selectedIds = ref([...props.selectedIds])
const operationLoading = reactive({})
const showConfirmDialog = ref(false)
const showResultDialog = ref(false)
const operationFormData = reactive({})
const currentOperation = ref(null)
const currentOperationCommand = ref(null)
const retryOperationData = ref(null)

// 确认对话框配置
const confirmDialogConfig = reactive({
  title: '',
  message: '',
  type: 'warning',
  confirmText: '确定',
  cancelText: '取消',
  width: '400px'
})

// 结果对话框配置
const resultDialogConfig = reactive({
  title: '',
  message: '',
  type: 'info',
  details: null,
  showRetry: false
})

// 监听选中ID变化
watch(() => props.selectedIds, (newSelectedIds) => {
  selectedIds.value = [...newSelectedIds]
}, { deep: true, immediate: true })

// 监听选中ID变化，通知父组件
watch(selectedIds, (newSelectedIds) => {
  emit('update:selectedIds', [...newSelectedIds])
}, { deep: true })

// 生命周期钩子
onMounted(() => {
  console.log('BatchOperation mounted with', props.operations.length, 'operations')
})

// 计算属性
const selectedCount = computed(() => selectedIds.value.length)

const isIndeterminate = computed(() => {
  return selectedCount.value > 0 && selectedCount.value < props.total
})

const selectAll = computed({
  get: () => {
    return props.total > 0 && selectedCount.value === props.total
  },
  set: (value) => {
    handleSelectAllChange(value)
  }
})

// 获取字段组件
function getFieldComponent(type) {
  return props.fieldComponents[type] || 'FormItemsInputField'
}

// 处理全选变化
function handleSelectAllChange(checked) {
  emit('select-all', checked)
}

// 处理批量操作
function handleBatchOperation(operationKey, command = null) {
  if (props.disabled || selectedCount.value === 0) return
  
  const operation = props.operations.find(op => op.key === operationKey)
  if (!operation) return
  
  // 检查是否满足最小数量要求
  if (operation.requireMin && selectedCount.value < operation.requireMin) {
    ElMessage.warning(`至少需要选择 ${operation.requireMin} 项`)
    return
  }
  
  // 保存当前操作信息
  currentOperation.value = operation
  currentOperationCommand.value = command
  
  // 如果需要确认
  if (operation.confirm) {
    showConfirmDialog.value = true
    
    // 设置确认对话框内容
    confirmDialogConfig.title = operation.confirmTitle || '确认操作'
    confirmDialogConfig.message = operation.confirmMessage ? 
      operation.confirmMessage.replace(/{count}/g, selectedCount.value) : 
      `确定要执行操作吗？`
    confirmDialogConfig.type = operation.confirmType || 'warning'
    confirmDialogConfig.confirmText = operation.confirmButtonText || '确定'
    confirmDialogConfig.cancelText = operation.cancelButtonText || '取消'
    confirmDialogConfig.width = operation.confirmWidth || '400px'
    
    // 初始化表单数据
    if (operation.formConfig) {
      initializeFormData(operation.formConfig)
    }
  } else {
    // 直接执行操作
    executeOperation()
  }
}

// 初始化表单数据
function initializeFormData(formConfig) {
  // 清空之前的数据
  Object.keys(operationFormData).forEach(key => {
    delete operationFormData[key]
  })
  
  // 设置默认值
  if (formConfig.fields) {
    formConfig.fields.forEach(field => {
      if (field.default !== undefined) {
        operationFormData[field.prop] = typeof field.default === 'function' ? 
          field.default() : field.default
      }
    })
  }
}

// 确认批量操作
async function confirmBatchOperation() {
  // 如果有表单配置，需要先验证表单
  if (currentOperation.value?.formConfig) {
    const valid = await validateOperationForm()
    if (!valid) {
      return
    }
  }
  
  showConfirmDialog.value = false
  executeOperation()
}

// 验证操作表单
function validateOperationForm() {
  return new Promise((resolve) => {
    operationFormRef.value.validate((valid) => {
      resolve(valid)
    })
  })
}

// 取消批量操作
function cancelBatchOperation() {
  showConfirmDialog.value = false
  currentOperation.value = null
  currentOperationCommand.value = null
  
  // 清空表单数据
  Object.keys(operationFormData).forEach(key => {
    delete operationFormData[key]
  })
}

// 执行批量操作
async function executeOperation() {
  if (!currentOperation.value || props.disabled) return
  
  const operationKey = currentOperation.value.key
  
  // 设置加载状态
  operationLoading[operationKey] = true
  
  try {
    // 构建操作参数
    const operationData = {
      key: operationKey,
      selectedIds: [...selectedIds.value],
      count: selectedCount.value,
      command: currentOperationCommand.value,
      formData: { ...operationFormData }
    }
    
    // 保存重试数据
    retryOperationData.value = { ...operationData }
    
    // 通知操作开始
    emit('operation-start', operationData)
    
    // 执行操作
    const result = await emit('operation', operationData)
    
    // 处理操作结果
    if (props.autoHandleResult) {
      handleOperationResult(result, operationData)
    }
    
    // 通知操作成功
    emit('operation-success', result, operationData)
  } catch (error) {
    console.error('Batch operation error:', error)
    
    // 通知操作错误
    emit('operation-error', error, {
      key: operationKey,
      selectedIds: [...selectedIds.value]
    })
    
    // 自动处理错误结果
    if (props.autoHandleResult) {
      showResultDialog.value = true
      resultDialogConfig.title = '操作失败'
      resultDialogConfig.message = error.message || '操作执行失败，请稍后重试'
      resultDialogConfig.type = 'error'
      resultDialogConfig.details = error
      resultDialogConfig.showRetry = true
    }
  } finally {
    // 重置加载状态
    operationLoading[operationKey] = false
    
    // 通知操作结束
    emit('operation-end', {
      key: operationKey,
      selectedIds: [...selectedIds.value]
    })
    
    // 清空当前操作
    currentOperation.value = null
    currentOperationCommand.value = null
  }
}

// 处理操作结果
function handleOperationResult(result, operationData) {
  if (!result) return
  
  showResultDialog.value = true
  
  if (result.success) {
    resultDialogConfig.title = '操作成功'
    resultDialogConfig.message = result.message || `${operationData.key} 操作成功`
    resultDialogConfig.type = 'success'
    resultDialogConfig.details = result.data
    resultDialogConfig.showRetry = false
    
    // 操作成功后可以清空选择（可选）
    if (operationData.key === 'delete' && result.success) {
      nextTick(() => {
        selectedIds.value = []
      })
    }
  } else {
    resultDialogConfig.title = '操作失败'
    resultDialogConfig.message = result.message || `${operationData.key} 操作失败`
    resultDialogConfig.type = 'error'
    resultDialogConfig.details = result.data || result.error
    resultDialogConfig.showRetry = true
  }
}

// 重置结果对话框
function resetResultDialog() {
  resultDialogConfig.title = ''
  resultDialogConfig.message = ''
  resultDialogConfig.type = 'info'
  resultDialogConfig.details = null
  resultDialogConfig.showRetry = false
}

// 重试操作
function retryOperation() {
  showResultDialog.value = false
  
  if (retryOperationData.value) {
    // 重新执行操作
    currentOperation.value = props.operations.find(op => op.key === retryOperationData.value.key)
    currentOperationCommand.value = retryOperationData.value.command
    
    // 恢复表单数据
    if (retryOperationData.value.formData) {
      Object.assign(operationFormData, retryOperationData.value.formData)
    }
    
    // 执行操作
    executeOperation()
    
    // 通知重试
    emit('retry', retryOperationData.value)
  }
}

// 添加选中项
function addSelectedId(id) {
  if (!selectedIds.value.includes(id)) {
    selectedIds.value.push(id)
  }
}

// 移除选中项
function removeSelectedId(id) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  }
}

// 切换选中项
function toggleSelectedId(id) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

// 设置选中项
function setSelectedIds(ids) {
  selectedIds.value = [...ids]
}

// 清空选中项
function clearSelectedIds() {
  selectedIds.value = []
}

// 获取选中项
function getSelectedIds() {
  return [...selectedIds.value]
}

// 判断ID是否被选中
function isSelected(id) {
  return selectedIds.value.includes(id)
}

// 获取操作配置
function getOperationConfig(operationKey) {
  return props.operations.find(op => op.key === operationKey)
}

// 暴露公共方法
defineExpose({
  // 选择操作
  addSelectedId,
  removeSelectedId,
  toggleSelectedId,
  setSelectedIds,
  clearSelectedIds,
  getSelectedIds,
  isSelected,
  handleSelectAllChange,
  // 操作执行
  handleBatchOperation,
  retryOperation,
  // 状态查询
  getOperationConfig,
  // 计算属性
  selectedIds,
  selectedCount,
  selectAll
})
</script>

<style scoped>
.batch-operation-container {
  width: 100%;
}

.operation-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
  gap: 15px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.selected-info {
  font-size: 14px;
  color: #606266;
}

.selected-count {
  color: #409eff;
  font-weight: 500;
}

.require-count {
  font-size: 12px;
  color: #909399;
  font-weight: normal;
}

/* 确认对话框样式 */
.confirm-dialog-content {
  padding: 10px 0;
}

.confirm-icon {
  text-align: center;
  margin-bottom: 20px;
  font-size: 48px;
  color: #e6a23c;
}

.confirm-message {
  text-align: center;
  margin-bottom: 20px;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.operation-form {
  margin-top: 20px;
}

/* 结果对话框样式 */
.result-dialog-content {
  padding: 20px 0;
}

.result-icon {
  text-align: center;
  margin-bottom: 20px;
  font-size: 64px;
}

.result-icon.success {
  color: #67c23a;
}

.result-icon.error {
  color: #f56c6c;
}

.result-icon.warning {
  color: #e6a23c;
}

.result-icon.info {
  color: #909399;
}

.result-message {
  text-align: center;
  margin-bottom: 20px;
  font-size: 16px;
  color: #303133;
  font-weight: 500;
}

.result-details {
  margin-top: 20px;
}

.result-details pre {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  color: #606266;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .operation-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .toolbar-left {
    justify-content: center;
  }
  
  .toolbar-right {
    justify-content: center;
  }
  
  .toolbar-right .el-button {
    width: 100%;
    max-width: 120px;
  }
  
  .toolbar-right .el-dropdown {
    width: 100%;
    max-width: 120px;
  }
  
  .toolbar-right .el-dropdown .el-button {
    width: 100%;
  }
}
</style>