<template>
  <div class="dynamic-form-container">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :size="size"
      :disabled="disabled"
      :status-icon="statusIcon"
      @validate="handleValidate"
    >
      <!-- 分组渲染 -->
      <template v-if="hasGroups">
        <el-card
          v-for="group in groupedFields"
          :key="group.name"
          :title="group.label"
          :shadow="groupShadow"
          :class="['field-group', { 'collapsible': group.collapsible }]"
          v-if="!group.hidden"
        >
          <template v-if="group.collapsible" #header>
            <div class="card-header">
              <span>{{ group.label }}</span>
              <el-button
                type="text"
                :icon="group.expanded ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"
                @click="toggleGroup(group.name)"
              ></el-button>
            </div>
          </template>
          
          <template v-if="!group.collapsible || group.expanded">
            <div class="group-fields">
              <FormItemRenderer
                v-for="field in group.fields"
                :key="field.prop"
                :field="field"
                :model="formData"
                :rules="getFieldRules(field.prop)"
                :size="size"
                :disabled="disabled || field.disabled"
                :form-item-class="field.formItemClass"
                :component-props="field.componentProps"
                @update:modelValue="updateFieldValue(field.prop, $event)"
                @validate="handleFieldValidate"
              />
            </div>
          </template>
        </el-card>
      </template>
      
      <!-- 非分组渲染 -->
      <template v-else>
        <FormItemRenderer
          v-for="field in flatFields"
          :key="field.prop"
          :field="field"
          :model="formData"
          :rules="getFieldRules(field.prop)"
          :size="size"
          :disabled="disabled || field.disabled"
          :form-item-class="field.formItemClass"
          :component-props="field.componentProps"
          @update:modelValue="updateFieldValue(field.prop, $event)"
          @validate="handleFieldValidate"
        />
      </template>
      
      <!-- 自定义内容插槽 -->
      <slot :formData="formData" :fields="flatFields"></slot>
    </el-form>
    
    <!-- 操作按钮 -->
    <div class="form-actions" v-if="showActions">
      <slot name="actions" :valid="isValid" :dirty="isDirty">
        <div class="default-actions">
          <el-button
            v-if="allowReset"
            :disabled="disabled || isLoading"
            @click="reset"
            :size="size"
            plain
          >
            重置
          </el-button>
          <el-button
            v-if="allowSubmit"
            type="primary"
            :disabled="disabled || isLoading || !isValid"
            @click="submit"
            :size="size"
            :loading="isLoading"
          >
            {{ submitButtonText }}
          </el-button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import BaseForm from './BaseForm.vue'

// 表单字段渲染器组件（局部定义）
const FormItemRenderer = {
  name: 'FormItemRenderer',
  props: {
    field: {
      type: Object,
      required: true
    },
    model: {
      type: Object,
      required: true
    },
    rules: {
      type: Array,
      default: () => []
    },
    size: {
      type: String,
      default: 'default'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    formItemClass: {
      type: String,
      default: ''
    },
    componentProps: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['update:modelValue', 'validate'],
  setup(props, { emit }) {
    // 根据字段类型获取对应的组件名
    const getComponentName = (type) => {
      const componentMap = {
        input: 'FormItemsInputField',
        select: 'FormItemsSelectField',
        date: 'FormItemsDatePickerField',
        upload: 'FormItemsUploadField',
        checkbox: 'el-checkbox',
        radio: 'el-radio',
        switch: 'el-switch',
        slider: 'el-slider',
        rate: 'el-rate',
        color: 'el-color-picker'
      }
      return componentMap[type] || 'FormItemsInputField'
    }
    
    // 处理值变化
    const handleInput = (value) => {
      emit('update:modelValue', value)
    }
    
    return {
      getComponentName,
      handleInput
    }
  },
  template: `
    <el-form-item
      v-if="!field.hidden"
      :label="field.label"
      :prop="field.prop"
      :rules="rules"
      :required="field.required"
      :class="formItemClass"
      :label-width="field.labelWidth"
    >
      <!-- 自定义渲染器 -->
      <template v-if="field.render">
        <component
          :is="field.render"
          v-model="model[field.prop]"
          v-bind="field.componentProps"
          :disabled="disabled || field.disabled"
          :size="size"
          @update:modelValue="handleInput"
        />
      </template>
      
      <!-- 内置组件 -->
      <template v-else>
        <component
          :is="getComponentName(field.type)"
          v-model="model[field.prop]"
          v-bind="field.componentProps"
          :disabled="disabled || field.disabled"
          :size="size"
          @update:modelValue="handleInput"
        />
      </template>
      
      <!-- 提示信息 -->
      <div v-if="field.help" class="el-form-item__error form-field-help">
        {{ field.help }}
      </div>
    </el-form-item>
  `
}

// Props 定义
const props = defineProps({
  // 表单字段配置
  fields: {
    type: Array,
    required: true,
    default: () => []
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
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: true
  },
  // 是否允许提交
  allowSubmit: {
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
  // 卡片阴影样式
  groupShadow: {
    type: String,
    default: 'hover'
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
  // 是否监听字段变化进行实时验证
  validateOnChange: {
    type: Boolean,
    default: true
  }
})

// Emits 定义
const emit = defineEmits([
  'update:modelValue',
  'validate',
  'submit',
  'reset',
  'change',
  'field-change'
])

// 表单引用
const formRef = ref(null)

// 表单数据
const formData = reactive({ ...props.modelValue })

// 字段初始值（用于判断脏数据）
const initialValues = ref({})

// 字段验证状态
const validationStatus = reactive({})

// 分组展开状态
const groupExpandedState = reactive({})

// 监听模型值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(formData, newValue)
    // 更新初始值
    Object.assign(initialValues.value, newValue)
  }
}, { deep: true, immediate: true })

// 监听表单数据变化
watch(formData, (newValue, oldValue) => {
  emit('update:modelValue', { ...newValue })
  emit('change', newValue, oldValue)
  
  // 实时验证
  if (props.validateOnChange) {
    // 找出变化的字段并验证
    Object.keys(newValue).forEach(key => {
      if (JSON.stringify(newValue[key]) !== JSON.stringify(oldValue?.[key])) {
        validateField(key)
        emit('field-change', key, newValue[key], oldValue?.[key])
      }
    })
  }
}, { deep: true })

// 监听字段配置变化
watch(() => props.fields, () => {
  // 初始化表单字段的默认值
  initializeFormDefaults()
  
  // 初始化分组状态
  initializeGroupStates()
}, { deep: true, immediate: true })

// 生命周期钩子
onMounted(() => {
  initializeFormDefaults()
  initializeGroupStates()
  
  console.log('DynamicForm mounted with', props.fields.length, 'fields')
})

// 计算属性
const flatFields = computed(() => {
  return props.fields.filter(field => !field.group)
})

const hasGroups = computed(() => {
  return props.fields.some(field => field.group)
})

const groupedFields = computed(() => {
  const groups = {}
  
  // 按group属性分组
  props.fields.forEach(field => {
    if (field.group) {
      if (!groups[field.group]) {
        groups[field.group] = {
          name: field.group,
          label: field.groupLabel || field.group,
          fields: [],
          collapsible: field.groupCollapsible || false,
          expanded: groupExpandedState[field.group] !== false,
          hidden: field.groupHidden || false
        }
      }
      groups[field.group].fields.push(field)
    }
  })
  
  return Object.values(groups)
})

const isValid = computed(() => {
  return Object.values(validationStatus).every(status => status === true)
})

const isDirty = computed(() => {
  return Object.keys(formData).some(key => {
    return JSON.stringify(formData[key]) !== JSON.stringify(initialValues.value[key])
  })
})

const isLoading = computed(() => props.loading)

// 初始化表单默认值
function initializeFormDefaults() {
  props.fields.forEach(field => {
    // 如果字段不存在于formData中且有默认值
    if (!(field.prop in formData) && field.default !== undefined) {
      formData[field.prop] = typeof field.default === 'function' ? field.default() : field.default
    }
    
    // 初始化初始值
    if (initialValues.value[field.prop] === undefined && formData[field.prop] !== undefined) {
      initialValues.value[field.prop] = JSON.parse(JSON.stringify(formData[field.prop]))
    }
  })
}

// 初始化分组状态
function initializeGroupStates() {
  props.fields.forEach(field => {
    if (field.group && field.groupExpanded !== undefined) {
      groupExpandedState[field.group] = field.groupExpanded
    }
  })
}

// 获取字段验证规则
function getFieldRules(prop) {
  if (props.rules && props.rules[prop]) {
    return props.rules[prop]
  }
  return []
}

// 处理验证事件
function handleValidate(prop, isValid, message) {
  validationStatus[prop] = isValid
  emit('validate', prop, isValid, message)
}

// 处理字段验证
function handleFieldValidate(prop, isValid, message) {
  handleValidate(prop, isValid, message)
}

// 验证单个字段
function validateField(prop) {
  if (!formRef.value) return
  
  return new Promise((resolve) => {
    formRef.value.validateField(prop, (errorMessage) => {
      const isValid = !errorMessage
      validationStatus[prop] = isValid
      resolve(isValid)
    })
  })
}

// 验证多个字段
async function validateFields(propsList) {
  if (!formRef.value || !propsList.length) return true
  
  const promises = propsList.map(prop => validateField(prop))
  const results = await Promise.all(promises)
  return results.every(result => result)
}

// 验证整个表单
function validate() {
  if (!formRef.value) return Promise.resolve(true)
  
  return new Promise((resolve) => {
    formRef.value.validate((valid) => {
      // 更新所有字段的验证状态
      if (valid) {
        props.fields.forEach(field => {
          validationStatus[field.prop] = true
        })
      }
      resolve(valid)
    })
  })
}

// 更新字段值
function updateFieldValue(prop, value) {
  formData[prop] = value
}

// 切换分组展开状态
function toggleGroup(groupName) {
  groupExpandedState[groupName] = !groupExpandedState[groupName]
}

// 提交表单
async function submit() {
  if (!props.allowSubmit || isLoading.value) return
  
  const valid = await validate()
  if (!valid) {
    ElMessage.warning('请检查表单数据')
    return
  }
  
  emit('submit', { ...formData })
}

// 重置表单
function reset() {
  if (!formRef.value) return
  
  formRef.value.resetFields()
  
  // 恢复初始值
  Object.keys(initialValues.value).forEach(key => {
    formData[key] = JSON.parse(JSON.stringify(initialValues.value[key]))
  })
  
  // 清除验证状态
  Object.keys(validationStatus).forEach(key => {
    validationStatus[key] = undefined
  })
  
  emit('reset')
}

// 清空表单
function clear() {
  if (!formRef.value) return
  
  props.fields.forEach(field => {
    formData[field.prop] = field.default !== undefined ? 
      (typeof field.default === 'function' ? field.default() : field.default) : 
      null
    validationStatus[field.prop] = undefined
  })
  
  formRef.value.clearValidate()
}

// 根据条件显示/隐藏字段
function setFieldVisible(prop, visible) {
  const field = props.fields.find(f => f.prop === prop)
  if (field) {
    field.hidden = !visible
  }
}

// 设置字段禁用状态
function setFieldDisabled(prop, disabled) {
  const field = props.fields.find(f => f.prop === prop)
  if (field) {
    field.disabled = disabled
  }
}

// 更新字段选项（适用于select、radio等）
function updateFieldOptions(prop, options) {
  const field = props.fields.find(f => f.prop === prop)
  if (field && field.componentProps) {
    field.componentProps.options = options
  }
}

// 获取表单数据
function getFormData() {
  return { ...formData }
}

// 获取验证状态
function getValidationStatus() {
  return { ...validationStatus }
}

// 暴露公共方法
defineExpose({
  // 表单引用
  formRef,
  // 验证方法
  validate,
  validateField,
  validateFields,
  getValidationStatus,
  // 表单操作
  submit,
  reset,
  clear,
  updateFieldValue,
  getFormData,
  // 字段控制
  setFieldVisible,
  setFieldDisabled,
  updateFieldOptions,
  // 计算属性
  formData,
  isValid,
  isDirty
})
</script>

<style scoped>
.dynamic-form-container {
  width: 100%;
}

.field-group {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.group-fields {
  padding-top: 10px;
}

.form-field-help {
  color: #606266;
  font-size: 12px;
  line-height: 1;
  padding-top: 4px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.default-actions {
  display: flex;
  gap: 12px;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .form-actions {
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