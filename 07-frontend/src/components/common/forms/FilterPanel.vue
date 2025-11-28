<template>
  <div class="filter-panel-container">
    <!-- 过滤面板头部 -->
    <div class="filter-header" @click="togglePanel">
      <div class="filter-title">
        <el-icon><Filter /></el-icon>
        <span>{{ title }}</span>
        <el-badge v-if="activeFilterCount > 0" :value="activeFilterCount" type="danger" />
      </div>
      <el-icon :class="{ 'rotate': isExpanded }">
        <ArrowDown />
      </el-icon>
    </div>
    
    <!-- 过滤面板内容 -->
    <transition name="slide">
      <div v-if="isExpanded" class="filter-content">
        <el-form
          ref="filterFormRef"
          :model="filterData"
          :rules="rules"
          :label-width="labelWidth"
          :size="size"
          :disabled="disabled"
          :inline="inline"
          @validate="handleValidate"
        >
          <!-- 过滤字段 -->
          <template v-for="field in filterFields" :key="field.prop">
            <el-form-item
              v-if="!field.hidden"
              :label="field.label"
              :prop="field.prop"
              :rules="getFieldRules(field.prop)"
              :class="['filter-form-item', field.formItemClass]
            >
              <!-- 自定义渲染器 -->
              <template v-if="field.render">
                <component
                  :is="field.render"
                  v-model="filterData[field.prop]"
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
                  v-model="filterData[field.prop]"
                  v-bind="field.componentProps"
                  :disabled="disabled || field.disabled"
                  :size="size"
                  @change="handleFieldChange(field.prop, $event)"
                />
              </template>
            </el-form-item>
          </template>
        </el-form>
        
        <!-- 过滤操作按钮 -->
        <div class="filter-actions">
          <slot name="actions" :filterData="filterData" :activeFilters="activeFilters">
            <div class="default-actions">
              <el-button
                v-if="showApplyButton"
                type="primary"
                :size="size"
                @click="applyFilter"
                :disabled="disabled || !isValid"
                :loading="isLoading"
              >
                应用过滤
              </el-button>
              
              <el-button
                v-if="showResetButton"
                :size="size"
                @click="resetFilter"
                :disabled="disabled"
                plain
              >
                重置
              </el-button>
              
              <el-button
                v-if="showClearButton"
                :size="size"
                @click="clearFilter"
                :disabled="disabled || activeFilterCount === 0"
                text
              >
                清空 ({{ activeFilterCount }})
              </el-button>
            </div>
          </slot>
        </div>
      </div>
    </transition>
    
    <!-- 已选过滤条件标签 -->
    <div v-if="showSelectedFilters && activeFilterCount > 0" class="selected-filters">
      <el-tag
        v-for="(filter, index) in activeFilterTags"
        :key="index"
        closable
        @close="removeFilter(filter.prop)"
        :effect="tagEffect"
        :size="tagSize"
      >
        {{ filter.label }}: {{ formatFilterValue(filter.prop, filter.value) }}
      </el-tag>
      
      <el-button
        v-if="activeFilterCount > 0"
        type="text"
        size="small"
        @click="clearFilter"
        :disabled="disabled"
      >
        清空全部
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Filter,
  ArrowDown,
  Remove
} from '@element-plus/icons-vue'

// Props 定义
const props = defineProps({
  // 过滤字段配置
  fields: {
    type: Array,
    required: true,
    default: () => []
  },
  // 过滤数据模型
  modelValue: {
    type: Object,
    default: () => ({})
  },
  // 表单验证规则
  rules: {
    type: Object,
    default: () => ({})
  },
  // 面板标题
  title: {
    type: String,
    default: '过滤条件'
  },
  // 默认展开状态
  defaultExpanded: {
    type: Boolean,
    default: false
  },
  // 是否内联表单
  inline: {
    type: Boolean,
    default: true
  },
  // 是否显示已选过滤条件
  showSelectedFilters: {
    type: Boolean,
    default: true
  },
  // 是否显示应用按钮
  showApplyButton: {
    type: Boolean,
    default: true
  },
  // 是否显示重置按钮
  showResetButton: {
    type: Boolean,
    default: true
  },
  // 是否显示清空按钮
  showClearButton: {
    type: Boolean,
    default: true
  },
  // 是否自动应用过滤
  autoApply: {
    type: Boolean,
    default: false
  },
  // 自动应用延迟（毫秒）
  autoApplyDelay: {
    type: Number,
    default: 500
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 标签效果
  tagEffect: {
    type: String,
    default: 'light'
  },
  // 标签大小
  tagSize: {
    type: String,
    default: 'small'
  },
  // 表单配置
  labelWidth: {
    type: String,
    default: '100px'
  },
  size: {
    type: String,
    default: 'default'
  },
  disabled: {
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
  'apply',
  'reset',
  'clear',
  'change',
  'field-change',
  'toggle',
  'remove-filter',
  'validate'
])

// 表单引用
const filterFormRef = ref(null)

// 响应式数据
const isExpanded = ref(props.defaultExpanded)
const filterData = reactive({ ...props.modelValue })
const initialFilterData = ref({})
const validationStatus = reactive({})
const autoApplyTimer = ref(null)

// 监听模型值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    Object.assign(filterData, newValue)
    Object.assign(initialFilterData.value, newValue)
  }
}, { deep: true, immediate: true })

// 监听过滤数据变化
watch(filterData, (newValue, oldValue) => {
  emit('update:modelValue', { ...newValue })
  emit('change', newValue, oldValue)
  
  // 自动应用过滤
  if (props.autoApply) {
    handleAutoApply()
  }
}, { deep: true })

// 监听字段配置变化
watch(() => props.fields, () => {
  initializeDefaults()
}, { deep: true, immediate: true })

// 生命周期钩子
onMounted(() => {
  initializeDefaults()
  Object.assign(initialFilterData.value, { ...filterData })
  
  console.log('FilterPanel mounted with', props.fields.length, 'fields')
})

// 计算属性
const filterFields = computed(() => props.fields)

const activeFilters = computed(() => {
  const filters = []
  
  props.fields.forEach(field => {
    const value = filterData[field.prop]
    const isActive = isValueActive(value)
    
    if (isActive) {
      filters.push({
        prop: field.prop,
        label: field.label,
        value: value,
        field: field
      })
    }
  })
  
  return filters
})

const activeFilterCount = computed(() => activeFilters.value.length)

const activeFilterTags = computed(() => activeFilters.value)

const isValid = computed(() => {
  return Object.values(validationStatus).every(status => status !== false)
})

const isLoading = computed(() => props.loading)

// 初始化默认值
function initializeDefaults() {
  props.fields.forEach(field => {
    // 如果字段不存在于filterData中且有默认值
    if (!(field.prop in filterData) && field.default !== undefined) {
      filterData[field.prop] = typeof field.default === 'function' ? field.default() : field.default
    }
  })
}

// 检查值是否为有效（非空）
function isValueActive(value) {
  if (value === null || value === undefined || value === '') {
    return false
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return false
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    // 检查日期范围
    if (value.start && value.end) {
      return true
    }
    // 检查其他对象类型
    return Object.keys(value).length > 0
  }
  
  return true
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

// 自动应用处理
function handleAutoApply() {
  // 清除之前的定时器
  if (autoApplyTimer.value) {
    clearTimeout(autoApplyTimer.value)
  }
  
  // 设置新的定时器
  autoApplyTimer.value = setTimeout(() => {
    applyFilter()
  }, props.autoApplyDelay)
}

// 验证单个字段
function validateField(prop) {
  if (!filterFormRef.value) return
  
  return new Promise((resolve) => {
    filterFormRef.value.validateField(prop, (errorMessage) => {
      const isValid = !errorMessage
      validationStatus[prop] = isValid
      resolve(isValid)
    })
  })
}

// 验证整个表单
function validate() {
  if (!filterFormRef.value) return Promise.resolve(true)
  
  return new Promise((resolve) => {
    filterFormRef.value.validate((valid) => {
      if (valid) {
        props.fields.forEach(field => {
          validationStatus[field.prop] = true
        })
      }
      resolve(valid)
    })
  })
}

// 切换面板展开状态
function togglePanel() {
  if (props.disabled) return
  
  isExpanded.value = !isExpanded.value
  emit('toggle', isExpanded.value)
  
  nextTick(() => {
    // 触发滚动
    if (isExpanded.value) {
      const container = document.querySelector('.filter-panel-container')
      if (container) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  })
}

// 应用过滤
async function applyFilter() {
  if (props.disabled || isLoading.value) return
  
  // 验证表单
  const valid = await validate()
  if (!valid) {
    ElMessage.warning('请检查过滤条件')
    return
  }
  
  // 构建过滤参数（只包含有效字段）
  const filterParams = {}
  Object.keys(filterData).forEach(key => {
    const value = filterData[key]
    if (isValueActive(value)) {
      filterParams[key] = value
    }
  })
  
  emit('apply', filterParams)
}

// 重置过滤
function resetFilter() {
  if (!filterFormRef.value || props.disabled) return
  
  filterFormRef.value.resetFields()
  
  // 恢复到初始值
  Object.keys(initialFilterData.value).forEach(key => {
    filterData[key] = JSON.parse(JSON.stringify(initialFilterData.value[key]))
  })
  
  // 清除验证状态
  Object.keys(validationStatus).forEach(key => {
    validationStatus[key] = undefined
  })
  
  emit('reset')
  
  // 重置后自动应用
  if (props.autoApply) {
    handleAutoApply()
  }
}

// 清空过滤
function clearFilter() {
  if (props.disabled) return
  
  // 清空所有字段值
  props.fields.forEach(field => {
    const fieldType = field.type
    if (fieldType === 'checkbox' || fieldType === 'select' && field.multiple) {
      filterData[field.prop] = []
    } else if (fieldType === 'switch') {
      filterData[field.prop] = false
    } else if (fieldType === 'date' && field.range) {
      filterData[field.prop] = []
    } else {
      filterData[field.prop] = null
    }
    
    // 清除验证状态
    if (validationStatus[field.prop] !== undefined) {
      validationStatus[field.prop] = undefined
    }
  })
  
  // 清除表单验证
  if (filterFormRef.value) {
    filterFormRef.value.clearValidate()
  }
  
  emit('clear')
  
  // 清空后自动应用
  if (props.autoApply) {
    handleAutoApply()
  }
}

// 移除单个过滤条件
function removeFilter(prop) {
  if (props.disabled) return
  
  const field = props.fields.find(f => f.prop === prop)
  if (field) {
    const fieldType = field.type
    if (fieldType === 'checkbox' || fieldType === 'select' && field.multiple) {
      filterData[prop] = []
    } else if (fieldType === 'switch') {
      filterData[prop] = false
    } else if (fieldType === 'date' && field.range) {
      filterData[prop] = []
    } else {
      filterData[prop] = null
    }
    
    // 清除验证状态
    if (validationStatus[prop] !== undefined) {
      validationStatus[prop] = undefined
    }
    
    emit('remove-filter', prop)
    
    // 移除后自动应用
    if (props.autoApply) {
      handleAutoApply()
    }
  }
}

// 格式化过滤值显示
function formatFilterValue(prop, value) {
  if (!value) return '-'  
  
  const field = props.fields.find(f => f.prop === prop)
  if (!field) return String(value)
  
  // 根据字段类型格式化
  if (Array.isArray(value)) {
    if (value.length === 0) return '-'
    
    // 如果是选项类型，尝试显示标签
    if (field.componentProps && field.componentProps.options) {
      const options = field.componentProps.options
      const labels = value.map(v => {
        const option = options.find(opt => opt.value === v)
        return option ? option.label : v
      })
      return labels.join(', ')
    }
    
    return value.join(', ')
  }
  
  if (typeof value === 'object' && !Array.isArray(value)) {
    // 处理日期范围
    if (value.start && value.end) {
      return `${value.start} - ${value.end}`
    }
    
    // 处理其他对象
    return JSON.stringify(value)
  }
  
  // 处理选项类型的单值
  if (field.componentProps && field.componentProps.options && 
      (field.type === 'select' || field.type === 'radio')) {
    const option = field.componentProps.options.find(opt => opt.value === value)
    return option ? option.label : value
  }
  
  return String(value)
}

// 设置过滤值
function setFilterValue(values) {
  if (!values) return
  
  Object.keys(values).forEach(key => {
    if (key in filterData) {
      filterData[key] = values[key]
    }
  })
}

// 获取过滤值
function getFilterValue() {
  return { ...filterData }
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

// 更新字段选项
function updateFieldOptions(prop, options) {
  const field = props.fields.find(f => f.prop === prop)
  if (field && field.componentProps) {
    field.componentProps.options = options
  }
}

// 强制展开面板
function expandPanel() {
  if (!isExpanded.value) {
    isExpanded.value = true
    emit('toggle', true)
  }
}

// 强制收起面板
function collapsePanel() {
  if (isExpanded.value) {
    isExpanded.value = false
    emit('toggle', false)
  }
}

// 获取验证状态
function getValidationStatus() {
  return { ...validationStatus }
}

// 暴露公共方法
defineExpose({
  // 面板控制
  togglePanel,
  expandPanel,
  collapsePanel,
  // 过滤操作
  applyFilter,
  resetFilter,
  clearFilter,
  removeFilter,
  setFilterValue,
  getFilterValue,
  // 验证方法
  validate,
  validateField,
  getValidationStatus,
  // 字段控制
  setFieldVisible,
  setFieldDisabled,
  updateFieldOptions,
  // 计算属性
  filterData,
  isExpanded,
  activeFilterCount,
  activeFilters
})
</script>

<style scoped>
.filter-panel-container {
  width: 100%;
  background-color: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 20px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  transition: background-color 0.3s;
}

.filter-header:hover {
  background-color: #ecf5ff;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.rotate {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

.filter-content {
  padding: 20px;
}

.filter-form-item {
  margin-bottom: 15px;
}

.filter-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.default-actions {
  display: flex;
  gap: 10px;
}

.selected-filters {
  padding: 15px 20px;
  background-color: #f0f2f5;
  border-top: 1px solid #e4e7ed;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

/* 过渡动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .filter-header {
    padding: 12px 15px;
  }
  
  .filter-content {
    padding: 15px;
  }
  
  .selected-filters {
    padding: 12px 15px;
  }
  
  .filter-actions {
    flex-direction: column;
  }
  
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
}
</style>