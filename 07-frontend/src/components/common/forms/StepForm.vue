<template>
  <div class="step-form-container">
    <!-- 步骤指示器 -->
    <div class="step-indicator">
      <el-steps
        v-model="currentStepIndex"
        :active-icon="activeIcon"
        :finish-icon="finishIcon"
        :align-center="alignCenter"
        :simple="simple"
        :direction="direction"
      >
        <el-step
          v-for="(step, index) in steps"
          :key="index"
          :title="step.title"
          :description="step.description || ''"
          :icon="step.icon"
        ></el-step>
      </el-steps>
    </div>

    <!-- 表单内容区域 -->
    <div class="step-content">
      <el-form
        ref="formRef"
        :model="currentFormData"
        :rules="currentRules"
        :label-width="labelWidth"
        :label-position="labelPosition"
        :size="size"
        :disabled="disabled"
        :status-icon="statusIcon"
        @validate="handleValidate"
      >
        <!-- 步骤内容插槽 -->
        <slot :step="currentStep" :stepIndex="currentStepIndex"></slot>
        
        <!-- 当前步骤的表单字段（如果通过配置定义） -->
        <template v-if="currentStep.fields && currentStep.fields.length > 0">
          <component
            v-for="field in currentStep.fields"
            :key="field.prop"
            :is="getFieldComponent(field.type)"
            v-model="currentFormData[field.prop]"
            v-bind="field"
            :rules="getFieldRules(field.prop)"
          ></component>
        </template>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <div class="step-actions" v-if="showActions">
      <slot name="actions" :prev-disabled="isFirstStep" :next-disabled="isLastStep || isStepInvalid" :current-step="currentStepIndex">
        <div class="default-actions">
          <el-button
            v-if="!isFirstStep"
            :disabled="disabled || isLoading"
            @click="prevStep"
            :size="size"
          >
            上一步
          </el-button>
          
          <template v-if="isLastStep">
            <el-button
              v-if="allowReset"
              :disabled="disabled || isLoading"
              @click="resetAll"
              :size="size"
              plain
            >
              重置
            </el-button>
            <el-button
              type="primary"
              :disabled="disabled || isLoading || isStepInvalid"
              @click="submit"
              :size="size"
              :loading="isLoading"
            >
              {{ submitButtonText }}
            </el-button>
          </template>
          <template v-else>
            <el-button
              type="primary"
              :disabled="disabled || isLoading || isStepInvalid"
              @click="nextStep"
              :size="size"
              :loading="isLoading"
            >
              下一步
            </el-button>
          </template>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import BaseForm from './BaseForm.vue'

// Props 定义
const props = defineProps({
  // 步骤配置
  steps: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.length > 0 && value.every(step => step.title)
    }
  },
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
  // 当前步骤索引
  currentStep: {
    type: Number,
    default: 0
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: true
  },
  // 是否允许重置
  allowReset: {
    type: Boolean,
    default: true
  },
  // 提交按钮文本
  submitButtonText: {
    type: String,
    default: '提交'
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 步骤条配置
  alignCenter: {
    type: Boolean,
    default: true
  },
  simple: {
    type: Boolean,
    default: false
  },
  direction: {
    type: String,
    values: ['horizontal', 'vertical'],
    default: 'horizontal'
  },
  activeIcon: {
    type: String,
    default: ''
  },
  finishIcon: {
    type: String,
    default: ''
  },
  // 表单配置（继承自BaseForm）
  labelWidth: {
    type: String,
    default: '120px'
  },
  labelPosition: {
    type: String,
    default: 'right'
  },
  size: {
    type: String,
    default: 'default'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  statusIcon: {
    type: Boolean,
    default: false
  },
  // 字段组件映射
  fieldComponents: {
    type: Object,
    default: () => ({
      input: 'FormItemsInputField',
      select: 'FormItemsSelectField',
      date: 'FormItemsDatePickerField',
      upload: 'FormItemsUploadField'
    })
  }
})

// Emits 定义
const emit = defineEmits([
  'update:modelValue',
  'update:currentStep',
  'prev',
  'next',
  'change',
  'submit',
  'reset',
  'validate',
  'finish'
])

// 表单引用
const formRef = ref(null)

// 当前步骤索引
const currentStepIndex = ref(props.currentStep)

// 步骤验证状态
const stepValidations = reactive({})

// 表单数据
const formData = reactive({ ...props.modelValue })

// 监听模型值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(formData, newValue)
  }
}, { deep: true })

// 监听表单数据变化
watch(formData, (newValue) => {
  emit('update:modelValue', { ...newValue })
}, { deep: true })

// 监听当前步骤变化
watch(() => props.currentStep, (newStep) => {
  currentStepIndex.value = newStep
}, { immediate: true })

// 监听步骤索引变化
watch(currentStepIndex, (newIndex) => {
  emit('update:currentStep', newIndex)
  emit('change', newIndex, props.steps[newIndex])
  
  // 步骤切换时自动滚动到顶部
  nextTick(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })
})

// 计算属性
const currentStep = computed(() => props.steps[currentStepIndex.value] || {})
const currentFormData = computed(() => formData)
const currentRules = computed(() => {
  // 如果步骤中定义了特定规则，则使用步骤规则
  if (currentStep.value.rules) {
    return currentStep.value.rules
  }
  return props.rules
})
const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value === props.steps.length - 1)
const isStepInvalid = computed(() => {
  // 检查当前步骤是否有效
  return stepValidations[currentStepIndex.value] === false
})
const isLoading = computed(() => props.loading)

// 生命周期钩子
onMounted(() => {
  // 初始化步骤验证状态
  props.steps.forEach((_, index) => {
    stepValidations[index] = index === 0 // 第一个步骤默认有效
  })
  
  console.log('StepForm mounted with', props.steps.length, 'steps')
})

// 获取字段组件
function getFieldComponent(type) {
  return props.fieldComponents[type] || 'FormItemsInputField'
}

// 获取字段验证规则
function getFieldRules(prop) {
  if (currentRules.value && currentRules.value[prop]) {
    return currentRules.value[prop]
  }
  return []
}

// 处理验证事件
function handleValidate(prop, isValid, message) {
  emit('validate', prop, isValid, message, currentStepIndex.value)
  
  // 如果有一个字段验证失败，整个步骤就失败
  if (!isValid) {
    stepValidations[currentStepIndex.value] = false
  }
}

// 验证当前步骤
async function validateCurrentStep() {
  if (!formRef.value) return true
  
  try {
    await formRef.value.validate()
    stepValidations[currentStepIndex.value] = true
    return true
  } catch (error) {
    stepValidations[currentStepIndex.value] = false
    return false
  }
}

// 上一步
async function prevStep() {
  if (isFirstStep.value || isLoading.value) return
  
  emit('prev', currentStepIndex.value, currentStep.value)
  currentStepIndex.value--
}

// 下一步
async function nextStep() {
  if (isLastStep.value || isLoading.value) return
  
  // 验证当前步骤
  const isValid = await validateCurrentStep()
  if (!isValid) {
    ElMessage.warning('请检查当前步骤的表单数据')
    return
  }
  
  emit('next', currentStepIndex.value, currentStep.value)
  currentStepIndex.value++
}

// 跳转到指定步骤
async function goToStep(index) {
  if (index < 0 || index >= props.steps.length || index === currentStepIndex.value) return
  
  // 向前跳不需要验证
  if (index < currentStepIndex.value) {
    currentStepIndex.value = index
    return
  }
  
  // 向后跳需要验证当前步骤
  const isValid = await validateCurrentStep()
  if (!isValid) {
    ElMessage.warning('请先完成当前步骤')
    return
  }
  
  currentStepIndex.value = index
}

// 提交表单
async function submit() {
  if (!isLastStep.value || isLoading.value) return
  
  // 验证所有已访问的步骤
  for (let i = 0; i <= currentStepIndex.value; i++) {
    // 切换到该步骤进行验证
    const oldIndex = currentStepIndex.value
    currentStepIndex.value = i
    
    await nextTick()
    const isValid = await validateCurrentStep()
    
    if (!isValid) {
      ElMessage.error(`第 ${i + 1} 步表单验证失败`)
      return
    }
    
    // 切回原来的步骤
    if (i < oldIndex) {
      currentStepIndex.value = oldIndex
    }
  }
  
  emit('submit', { ...formData })
  emit('finish', { ...formData })
}

// 重置当前步骤
function resetCurrentStep() {
  if (!formRef.value) return
  
  formRef.value.resetFields()
  // 清除当前步骤的验证状态
  stepValidations[currentStepIndex.value] = null
}

// 重置所有步骤
function resetAll() {
  resetCurrentStep()
  currentStepIndex.value = 0
  
  // 重置所有步骤的验证状态
  props.steps.forEach((_, index) => {
    stepValidations[index] = index === 0
  })
  
  emit('reset')
}

// 获取所有步骤的验证状态
function getValidationStatus() {
  return { ...stepValidations }
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

// 暴露公共方法
defineExpose({
  // 表单引用
  formRef,
  // 步骤控制
  prevStep,
  nextStep,
  goToStep,
  // 验证方法
  validateCurrentStep,
  getValidationStatus,
  // 重置方法
  resetCurrentStep,
  resetAll,
  // 表单操作
  setFormValue,
  // 计算属性
  currentStepIndex,
  currentStep,
  formData
})
</script>

<style scoped>
.step-form-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.step-indicator {
  margin-bottom: 30px;
}

.step-content {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

.step-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.default-actions {
  display: flex;
  gap: 12px;
}

/* 垂直方向步骤条的布局调整 */
:deep(.el-steps--vertical) {
  display: flex;
  flex-direction: row;
}

:deep(.el-steps--vertical .el-steps__items) {
  margin-right: 40px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .step-content {
    padding: 15px;
  }
  
  .step-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .default-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .default-actions .el-button {
    width: 100%;
  }
}
</style>