<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :size="size"
    :disabled="disabled"
    :inline="inline"
    :validate-on-rule-change="validateOnRuleChange"
    :hide-required-asterisk="hideRequiredAsterisk"
    :require-asterisk-position="requireAsteriskPosition"
    :status-icon="statusIcon"
    @validate="handleValidate"
    @submit.native.prevent="handleSubmit"
  >
    <slot></slot>
  </el-form>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'

// Props 定义
const props = defineProps({
  // 表单数据模型
  modelValue: {
    type: Object,
    default: () => ({})
  },
  // 表单验证规则
  rules: {
    type: Object,
    default: () => ({})
  },
  // 标签宽度
  labelWidth: {
    type: String,
    default: '120px'
  },
  // 标签位置
  labelPosition: {
    type: String,
    values: ['left', 'right', 'top'],
    default: 'right'
  },
  // 表单大小
  size: {
    type: String,
    values: ['large', 'default', 'small'],
    default: 'default'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否行内表单
  inline: {
    type: Boolean,
    default: false
  },
  // 验证规则改变时是否立即触发验证
  validateOnRuleChange: {
    type: Boolean,
    default: true
  },
  // 是否隐藏必填项的星号
  hideRequiredAsterisk: {
    type: Boolean,
    default: false
  },
  // 必填项星号的位置
  requireAsteriskPosition: {
    type: String,
    values: ['left', 'right'],
    default: 'left'
  },
  // 是否显示校验状态图标
  statusIcon: {
    type: Boolean,
    default: false
  },
  // 是否自动聚焦第一个输入框
  autoFocus: {
    type: Boolean,
    default: false
  },
  // 表单唯一标识
  formKey: {
    type: String,
    default: ''
  }
})

// Emits 定义
const emit = defineEmits([
  'update:modelValue',
  'submit',
  'validate',
  'reset',
  'clearValidate',
  'error'
])

// 表单引用
const formRef = ref(null)

// 表单数据响应式处理
const formData = reactive({ ...props.modelValue })

// 监听模型值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(formData, newValue)
  }
}, { deep: true })

// 监听表单数据变化，同步到父组件
watch(formData, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// 表单验证状态
const validateStatus = ref({
  isValidating: false,
  validateResult: null
})

// 生命周期钩子 - 挂载后
onMounted(() => {
  // 自动聚焦处理
  if (props.autoFocus) {
    nextTick(() => {
      autoFocusFirstInput()
    })
  }
  
  console.log(`BaseForm mounted${props.formKey ? ` with key: ${props.formKey}` : ''}`)
})

// 生命周期钩子 - 卸载前
onBeforeUnmount(() => {
  console.log(`BaseForm unmounted${props.formKey ? ` with key: ${props.formKey}` : ''}`)
})

// 自动聚焦第一个输入框
function autoFocusFirstInput() {
  if (!formRef.value) return
  
  try {
    const formEl = formRef.value.$el
    const firstInput = formEl.querySelector('input[autofocus], input:not([disabled]), textarea:not([disabled])')
    if (firstInput) {
      firstInput.focus()
    }
  } catch (error) {
    console.warn('Failed to auto focus:', error)
  }
}

// 处理验证事件
function handleValidate(prop, isValid, message) {
  emit('validate', prop, isValid, message)
}

// 处理表单提交
async function handleSubmit() {
  if (!formRef.value) return
  
  try {
    validateStatus.value.isValidating = true
    await validate()
    emit('submit', { ...formData })
  } catch (error) {
    emit('error', error)
    console.error('Form submit validation failed:', error)
  } finally {
    validateStatus.value.isValidating = false
  }
}

// 验证整个表单
async function validate() {
  if (!formRef.value) return true
  
  return new Promise((resolve, reject) => {
    formRef.value.validate((valid, errors) => {
      validateStatus.value.validateResult = valid
      if (valid) {
        resolve(true)
      } else {
        // 滚动到第一个错误项
        scrollToFirstError()
        reject(new Error('Form validation failed'))
      }
    })
  })
}

// 验证指定字段
async function validateField(prop) {
  if (!formRef.value) return true
  
  return new Promise((resolve, reject) => {
    formRef.value.validateField(prop, (errorMessage) => {
      if (!errorMessage) {
        resolve(true)
      } else {
        reject(new Error(errorMessage))
      }
    })
  })
}

// 重置表单
function resetForm() {
  if (!formRef.value) return
  
  formRef.value.resetFields()
  emit('reset')
}

// 清空验证状态
function clearValidate(props) {
  if (!formRef.value) return
  
  formRef.value.clearValidate(props)
  emit('clearValidate')
}

// 滚动到第一个错误项
function scrollToFirstError() {
  const firstError = document.querySelector('.el-form-item.is-error .el-input__inner')
  if (firstError) {
    firstError.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
    firstError.focus()
  }
}

// 设置表单值
function setFormValue(values) {
  if (!values) return
  
  Object.keys(values).forEach(key => {
    if (key in formData) {
      formData[key] = values[key]
    }
  })
}

// 获取表单值
function getFormValue() {
  return { ...formData }
}

// 判断字段是否有验证规则
function hasRule(field) {
  return props.rules && field in props.rules
}

// 获取字段验证状态
function getFieldStatus(field) {
  if (!formRef.value || !formRef.value.fields) return null
  
  const fieldInstance = formRef.value.fields.find(f => f.prop === field)
  return fieldInstance ? fieldInstance.validateState : null
}

// 显示表单错误提示
function showError(message) {
  ElMessage.error(message)
}

// 显示表单成功提示
function showSuccess(message) {
  ElMessage.success(message)
}

// 暴露公共方法
defineExpose({
  // 表单引用
  formRef,
  // 表单数据
  formData,
  // 验证方法
  validate,
  validateField,
  // 重置方法
  resetForm,
  clearValidate,
  // 表单操作
  setFormValue,
  getFormValue,
  // 辅助方法
  hasRule,
  getFieldStatus,
  showError,
  showSuccess,
  // 状态
  validateStatus
})
</script>

<style scoped>
.form-container {
  position: relative;
}

/* 错误状态样式增强 */
:deep(.el-form-item.is-error) {
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

/* 禁用状态样式 */
:deep(.el-form.is-disabled) {
  opacity: 0.8;
}

/* 行内表单样式调整 */
:deep(.el-form--inline .el-form-item) {
  margin-right: 20px;
  margin-bottom: 15px;
}

/* 响应式标签宽度 */
@media screen and (max-width: 768px) {
  :deep(.el-form) {
    --el-form-label-width: 80px !important;
  }
}
</style>