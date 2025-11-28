<template>
  <div class="search-form-container">
    <el-form
      ref="searchFormRef"
      :model="searchData"
      :rules="rules"
      :label-width="labelWidth"
      :label-position="labelPosition"
      :size="size"
      :inline="inline"
      :disabled="disabled"
      :status-icon="statusIcon"
      @validate="handleValidate"
    >
      <!-- 搜索字段 -->
      <template v-for="field in visibleFields" :key="field.prop">
        <el-form-item
          :label="field.label"
          :prop="field.prop"
          :rules="getFieldRules(field.prop)"
          :class="['search-form-item', field.formItemClass]
        >
          <!-- 自定义渲染器 -->
          <template v-if="field.render">
            <component
              :is="field.render"
              v-model="searchData[field.prop]"
              v-bind="field.componentProps"
              :disabled="disabled || field.disabled"
              :size="size"
              @change="handleFieldChange(field.prop, $event)"
            />
          </template>
          
          <!-- 内置组件 -->
          <template v-else>
            <component
              :is="getFieldComponent(field.type)"
              v-model="searchData[field.prop]"
              v-bind="field.componentProps"
              :disabled="disabled || field.disabled"
              :size="size"
              @change="handleFieldChange(field.prop, $event)"
            />
          </template>
        </el-form-item>
      </template>
      
      <!-- 操作按钮区域 -->
      <el-form-item :class="['search-actions', { 'inline-actions': inline }]">
        <slot name="actions" :searchData="searchData" :isValid="isValid">
          <div class="default-actions">
            <!-- 高级搜索切换按钮 -->
            <el-button
              v-if="hasMoreFields"
              type="text"
              :size="size"
              @click="toggleAdvancedSearch"
              :disabled="disabled"
            >
              {{ showAdvanced ? '收起' : '高级搜索' }}
              <el-icon :size="16" :class="{ 'rotate': showAdvanced }">
                <ArrowDown />
              </el-icon>
            </el-button>
            
            <!-- 搜索按钮 -->
            <el-button
              type="primary"
              :size="size"
              @click="search"
              :disabled="disabled || !isValid"
              :loading="isLoading"
            >
              <el-icon><Search /></el-icon>
              {{ searchButtonText }}
            </el-button>
            
            <!-- 重置按钮 -->
            <el-button
              :size="size"
              @click="reset"
              :disabled="disabled"
              :plain="true"
            >
              <el-icon><Refresh /></el-icon>
              {{ resetButtonText }}
            </el-button>
            
            <!-- 清空按钮 -->
            <el-button
              v-if="allowClear"
              :size="size"
              @click="clear"
              :disabled="disabled"
              :plain="true"
              text
            >
              <el-icon><Close /></el-icon>
              {{ clearButtonText }}
            </el-button>
          </div>
        </slot>
      </el-form-item>
    </el-form>
    
    <!-- 高级搜索区域 -->
    <transition name="slide">
      <div v-if="showAdvanced && hasMoreFields" class="advanced-search-panel">
        <el-form
          :model="searchData"
          :rules="rules"
          :label-width="labelWidth"
          :label-position="labelPosition"
          :size="size"
          :disabled="disabled"
          :status-icon="statusIcon"
        >
          <template v-for="field in moreFields" :key="field.prop">
            <el-form-item
              :label="field.label"
              :prop="field.prop"
              :rules="getFieldRules(field.prop)"
              :class="['search-form-item', field.formItemClass]
            >
              <!-- 自定义渲染器 -->
              <template v-if="field.render">
                <component
                  :is="field.render"
                  v-model="searchData[field.prop]"
                  v-bind="field.componentProps"
                  :disabled="disabled || field.disabled"
                  :size="size"
                  @change="handleFieldChange(field.prop, $event)"
                />
              </template>
              
              <!-- 内置组件 -->
              <template v-else>
                <component
                  :is="getFieldComponent(field.type)"
                  v-model="searchData[field.prop]"
                  v-bind="field.componentProps"
                  :disabled="disabled || field.disabled"
                  :size="size"
                  @change="handleFieldChange(field.prop, $event)"
                />
              </template>
            </el-form-item>
          </template>
        </el-form>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Close,
  ArrowDown
} from '@element-plus/icons-vue'

// Props 定义
const props = defineProps({
  // 搜索字段配置
  fields: {
    type: Array,
    required: true,
    default: () => []
  },
  // 搜索数据模型
  modelValue: {
    type: Object,
    default: () => ({})
  },
  // 表单验证规则
  rules: {
    type: Object,
    default: () => ({})
  },
  // 内联表单
  inline: {
    type: Boolean,
    default: true
  },
  // 是否显示搜索按钮
  showSearchButton: {
    type: Boolean,
    default: true
  },
  // 是否显示重置按钮
  showResetButton: {
    type: Boolean,
    default: true
  },
  // 是否允许清空
  allowClear: {
    type: Boolean,
    default: true
  },
  // 搜索按钮文本
  searchButtonText: {
    type: String,
    default: '搜索'
  },
  // 重置按钮文本
  resetButtonText: {
    type: String,
    default: '重置'
  },
  // 清空按钮文本
  clearButtonText: {
    type: String,
    default: '清空'
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 默认显示高级搜索
  defaultShowAdvanced: {
    type: Boolean,
    default: false
  },
  // 是否自动搜索
  autoSearch: {
    type: Boolean,
    default: false
  },
  // 自动搜索延迟（毫秒）
  autoSearchDelay: {
    type: Number,
    default: 500
  },
  // 表单配置
  labelWidth: {
    type: String,
    default: '80px'
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
      upload: 'FormItemsUploadField',
      checkbox: 'el-checkbox-group',
      radio: 'el-radio-group',
      switch: 'el-switch',
      slider: 'el-slider'
    })
  }
})

// Emits 定义
const emit = defineEmits([
  'update:modelValue',
  'search',
  'reset',
  'clear',
  'change',
  'field-change',
  'validate',
  'toggle-advanced'
])

// 表单引用
const searchFormRef = ref(null)

// 响应式数据
const searchData = reactive({ ...props.modelValue })
const showAdvanced = ref(props.defaultShowAdvanced)
const validationStatus = reactive({})
const autoSearchTimer = ref(null)

// 监听模型值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(searchData, newValue)
  }
}, { deep: true })

// 监听搜索数据变化
watch(searchData, (newValue, oldValue) => {
  emit('update:modelValue', { ...newValue })
  emit('change', newValue, oldValue)
  
  // 自动搜索
  if (props.autoSearch) {
    handleAutoSearch()
  }
}, { deep: true })

// 监听字段配置变化
watch(() => props.fields, () => {
  // 初始化表单字段的默认值
  initializeDefaults()
}, { deep: true, immediate: true })

// 生命周期钩子
onMounted(() => {
  initializeDefaults()
  
  console.log('SearchForm mounted with', props.fields.length, 'fields')
})

// 计算属性
const visibleFields = computed(() => {
  return props.fields.filter(field => !field.advanced && !field.hidden)
})

const moreFields = computed(() => {
  return props.fields.filter(field => field.advanced && !field.hidden)
})

const hasMoreFields = computed(() => {
  return moreFields.value.length > 0
})

const isValid = computed(() => {
  return Object.values(validationStatus).every(status => status !== false)
})

const isLoading = computed(() => props.loading)

// 初始化默认值
function initializeDefaults() {
  props.fields.forEach(field => {
    // 如果字段不存在于searchData中且有默认值
    if (!(field.prop in searchData) && field.default !== undefined) {
      searchData[field.prop] = typeof field.default === 'function' ? field.default() : field.default
    }
  })
}

// 获取字段组件
function getFieldComponent(type) {
  return props.fieldComponents[type] || 'FormItemsInputField'
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

// 处理字段变化
function handleFieldChange(prop, value) {
  emit('field-change', prop, value)
  
  // 验证单个字段
  if (props.rules && props.rules[prop]) {
    validateField(prop)
  }
}

// 自动搜索处理
function handleAutoSearch() {
  // 清除之前的定时器
  if (autoSearchTimer.value) {
    clearTimeout(autoSearchTimer.value)
  }
  
  // 设置新的定时器
  autoSearchTimer.value = setTimeout(() => {
    search()
  }, props.autoSearchDelay)
}

// 验证单个字段
function validateField(prop) {
  if (!searchFormRef.value) return
  
  return new Promise((resolve) => {
    searchFormRef.value.validateField(prop, (errorMessage) => {
      const isValid = !errorMessage
      validationStatus[prop] = isValid
      resolve(isValid)
    })
  })
}

// 验证整个表单
function validate() {
  if (!searchFormRef.value) return Promise.resolve(true)
  
  return new Promise((resolve) => {
    searchFormRef.value.validate((valid) => {
      if (valid) {
        props.fields.forEach(field => {
          validationStatus[field.prop] = true
        })
      }
      resolve(valid)
    })
  })
}

// 切换高级搜索
function toggleAdvancedSearch() {
  showAdvanced.value = !showAdvanced.value
  emit('toggle-advanced', showAdvanced.value)
  
  nextTick(() => {
    // 滚动到高级搜索区域
    if (showAdvanced.value && hasMoreFields.value) {
      const advancedPanel = document.querySelector('.advanced-search-panel')
      if (advancedPanel) {
        advancedPanel.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  })
}

// 搜索
async function search() {
  if (disabled.value || isLoading.value) return
  
  // 验证表单
  const valid = await validate()
  if (!valid) {
    ElMessage.warning('请检查搜索条件')
    return
  }
  
  // 构建搜索参数（过滤空值）
  const searchParams = { ...searchData }
  Object.keys(searchParams).forEach(key => {
    const value = searchParams[key]
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      delete searchParams[key]
    }
  })
  
  emit('search', searchParams)
}

// 重置
function reset() {
  if (!searchFormRef.value || disabled.value) return
  
  searchFormRef.value.resetFields()
  
  // 重置到默认值
  props.fields.forEach(field => {
    if (field.default !== undefined) {
      searchData[field.prop] = typeof field.default === 'function' ? field.default() : field.default
    } else {
      // 根据字段类型设置默认值
      const fieldType = field.type
      if (fieldType === 'checkbox' || fieldType === 'select' && field.multiple) {
        searchData[field.prop] = []
      } else if (fieldType === 'switch') {
        searchData[field.prop] = false
      } else {
        searchData[field.prop] = null
      }
    }
    
    // 清除验证状态
    if (validationStatus[field.prop] !== undefined) {
      validationStatus[field.prop] = undefined
    }
  })
  
  emit('reset')
  
  // 重置后自动搜索
  if (props.autoSearch) {
    handleAutoSearch()
  }
}

// 清空
function clear() {
  if (disabled.value) return
  
  // 清空所有字段值
  props.fields.forEach(field => {
    const fieldType = field.type
    if (fieldType === 'checkbox' || fieldType === 'select' && field.multiple) {
      searchData[field.prop] = []
    } else if (fieldType === 'switch') {
      searchData[field.prop] = false
    } else {
      searchData[field.prop] = null
    }
    
    // 清除验证状态
    if (validationStatus[field.prop] !== undefined) {
      validationStatus[field.prop] = undefined
    }
  })
  
  // 清除表单验证
  if (searchFormRef.value) {
    searchFormRef.value.clearValidate()
  }
  
  emit('clear')
  
  // 清空后自动搜索
  if (props.autoSearch) {
    handleAutoSearch()
  }
}

// 设置搜索值
function setSearchValue(values) {
  if (!values) return
  
  Object.keys(values).forEach(key => {
    if (key in searchData) {
      searchData[key] = values[key]
    }
  })
}

// 获取搜索值
function getSearchValue() {
  return { ...searchData }
}

// 设置字段可见性
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

// 获取验证状态
function getValidationStatus() {
  return { ...validationStatus }
}

// 暴露公共方法
defineExpose({
  // 表单引用
  searchFormRef,
  // 验证方法
  validate,
  validateField,
  getValidationStatus,
  // 搜索操作
  search,
  reset,
  clear,
  toggleAdvancedSearch,
  setSearchValue,
  getSearchValue,
  // 字段控制
  setFieldVisible,
  setFieldDisabled,
  updateFieldOptions,
  // 计算属性
  searchData,
  showAdvanced,
  isValid
})
</script>

<style scoped>
.search-form-container {
  width: 100%;
}

.search-form-item {
  margin-bottom: 0;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.inline-actions {
  margin-left: 10px;
}

.default-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.advanced-search-panel {
  margin-top: 16px;
  padding: 20px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.rotate {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .default-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .default-actions .el-button {
    width: 100%;
  }
  
  :deep(.el-form--inline .el-form-item) {
    width: 100%;
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .inline-actions {
    margin-left: 0;
  }
}
</style>