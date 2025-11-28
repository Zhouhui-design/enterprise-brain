<template>
  <el-form-item
    :label="label"
    :prop="prop"
    :rules="rules"
    :required="required"
    :error="error"
    :validate-status="validateStatus"
    :size="size"
    :class="customClass"
    :style="customStyle"
  >
    <!-- 日期选择器 -->
    <el-date-picker
      v-model="modelValue"
      :type="type"
      :format="format"
      :value-format="valueFormat"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :clearable="clearable"
      :editable="editable"
      :size="size"
      :default-value="defaultValue"
      :start-placeholder="startPlaceholder"
      :end-placeholder="endPlaceholder"
      :range-separator="rangeSeparator"
      :unlink-panels="unlinkPanels"
      :disabled-date="disabledDate"
      :disabled-time="disabledTime"
      :cell-class-name="cellClassName"
      :cell-style="cellStyle"
      :picker-options="pickerOptions"
      :popper-class="popperClass"
      :teleported="teleported"
      :id="id"
      :name="name"
      :validate-event="validateEvent"
      :unlink-panels="unlinkPanels"
      :append-to-body="appendToBody"
      :align="align"
      :popper-options="popperOptions"
      :input-class="inputClass"
      :input-style="inputStyle"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
      @clear="handleClear"
      @calendar-change="handleCalendarChange"
      @panel-change="handlePanelChange"
    >
      <!-- 自定义范围分隔符 -->
      <template #range-separator v-if="$slots['range-separator']">
        <slot name="range-separator"></slot>
      </template>
      
      <!-- 自定义日期单元格 -->
      <template #default="scope" v-if="$slots.default">
        <slot v-bind="scope"></slot>
      </template>
    </el-date-picker>
    
    <!-- 帮助文本 -->
    <template #help v-if="help || $slots.help">
      <slot name="help">{{ help }}</slot>
    </template>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElDatePicker } from 'element-plus'

// 定义Props
const props = defineProps({
  // 绑定值
  modelValue: {
    type: [String, Number, Date, Array],
    default: null
  },
  // 字段标签
  label: {
    type: String,
    default: ''
  },
  // 字段属性名，用于表单验证
  prop: {
    type: String,
    required: true
  },
  // 表单验证规则
  rules: {
    type: [Object, Array],
    default: () => {}
  },
  // 是否必填
  required: {
    type: Boolean,
    default: false
  },
  // 日期选择类型
  type: {
    type: String,
    default: 'date',
    validator: (value) => [
      'year', 'month', 'date', 'dates', 'datetime', 'datetimerange', 
      'daterange', 'monthrange', 'week', 'weekrange'
    ].includes(value)
  },
  // 显示格式
  format: {
    type: String,
    default: (props) => {
      // 根据类型设置默认格式
      const formatMap = {
        'year': 'YYYY',
        'month': 'YYYY-MM',
        'date': 'YYYY-MM-DD',
        'dates': 'YYYY-MM-DD',
        'datetime': 'YYYY-MM-DD HH:mm:ss',
        'datetimerange': 'YYYY-MM-DD HH:mm:ss',
        'daterange': 'YYYY-MM-DD',
        'monthrange': 'YYYY-MM',
        'week': 'YYYY-w',
        'weekrange': 'YYYY-w'
      }
      return formatMap[props.type] || 'YYYY-MM-DD'
    }
  },
  // 绑定值格式
  valueFormat: {
    type: String,
    default: 'YYYY-MM-DD'
  },
  // 占位文本
  placeholder: {
    type: String,
    default: ''
  },
  // 范围选择器开始占位符
  startPlaceholder: {
    type: String,
    default: ''
  },
  // 范围选择器结束占位符
  endPlaceholder: {
    type: String,
    default: ''
  },
  // 范围分隔符
  rangeSeparator: {
    type: String,
    default: '至'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否只读
  readonly: {
    type: Boolean,
    default: false
  },
  // 是否可清空
  clearable: {
    type: Boolean,
    default: true
  },
  // 文本框是否可输入
  editable: {
    type: Boolean,
    default: true
  },
  // 组件大小
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  // 默认值
  defaultValue: {
    type: [String, Number, Date],
    default: null
  },
  // 是否禁用面板联动
  unlinkPanels: {
    type: Boolean,
    default: false
  },
  // 禁用日期函数
  disabledDate: {
    type: Function,
    default: null
  },
  // 禁用时间函数
  disabledTime: {
    type: Function,
    default: null
  },
  // 单元格类名
  cellClassName: {
    type: [String, Function],
    default: null
  },
  // 单元格样式
  cellStyle: {
    type: [Object, Function],
    default: null
  },
  // 选择器额外选项
  pickerOptions: {
    type: Object,
    default: () => ({})
  },
  // 弹出框样式类名
  popperClass: {
    type: String,
    default: ''
  },
  // 是否使用teleport
  teleported: {
    type: Boolean,
    default: true
  },
  // 是否插入到body
  appendToBody: {
    type: Boolean,
    default: false
  },
  // 对齐方式
  align: {
    type: String,
    default: 'left',
    validator: (value) => ['left', 'center', 'right'].includes(value)
  },
  // 弹出框额外选项
  popperOptions: {
    type: Object,
    default: () => ({})
  },
  // 输入框类名
  inputClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 输入框样式
  inputStyle: {
    type: [String, Object],
    default: ''
  },
  // id属性
  id: {
    type: String,
    default: ''
  },
  // name属性
  name: {
    type: String,
    default: ''
  },
  // 是否在change时触发表单验证
  validateEvent: {
    type: Boolean,
    default: true
  },
  // 错误提示信息
  error: {
    type: String,
    default: ''
  },
  // 验证状态
  validateStatus: {
    type: String,
    default: '',
    validator: (value) => ['', 'success', 'error', 'validating', 'warning'].includes(value)
  },
  // 自定义类名
  customClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 自定义样式
  customStyle: {
    type: [String, Object],
    default: ''
  },
  // 帮助文本
  help: {
    type: String,
    default: ''
  },
  // 前缀图标
  prefixIcon: {
    type: [String, Object],
    default: ''
  },
  // 后缀图标
  suffixIcon: {
    type: [String, Object],
    default: ''
  }
})

// 定义Emits
const emit = defineEmits([
  'update:modelValue',
  'change',
  'blur',
  'focus',
  'clear',
  'calendar-change',
  'panel-change'
])

// 处理v-model双向绑定
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  }
})

// 转发事件
const handleChange = (value) => {
  emit('update:modelValue', value)
  emit('change', value)
}

const handleBlur = (event) => emit('blur', event)
const handleFocus = (event) => emit('focus', event)
const handleClear = () => {
  emit('update:modelValue', props.type.includes('range') ? [] : null)
  emit('clear')
}
const handleCalendarChange = (value) => emit('calendar-change', value)
const handlePanelChange = (...args) => emit('panel-change', ...args)

// 暴露公共方法
defineExpose({
  focus: () => {
    const pickerElement = document.querySelector(`#${props.id || props.prop}`)
    if (pickerElement) pickerElement.focus()
  },
  blur: () => {
    const pickerElement = document.querySelector(`#${props.id || props.prop}`)
    if (pickerElement) pickerElement.blur()
  },
  clear: () => {
    handleClear()
  },
  // 获取当前日期范围（如果是范围选择器）
  getDateRange: () => {
    if (props.type.includes('range') && Array.isArray(props.modelValue) && props.modelValue.length === 2) {
      return {
        start: props.modelValue[0],
        end: props.modelValue[1]
      }
    }
    return null
  },
  // 设置日期范围（如果是范围选择器）
  setDateRange: (start, end) => {
    if (props.type.includes('range')) {
      emit('update:modelValue', [start, end])
    }
  },
  // 格式化日期
  formatDate: (date, formatStr = props.format) => {
    if (!date) return ''
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      
      // 简单的日期格式化实现
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const hours = String(d.getHours()).padStart(2, '0')
      const minutes = String(d.getMinutes()).padStart(2, '0')
      const seconds = String(d.getSeconds()).padStart(2, '0')
      
      return formatStr
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds)
    } catch (error) {
      console.error('Date format error:', error)
      return ''
    }
  },
  // 获取当前选中的日期对象
  getSelectedDate: () => {
    if (!props.modelValue) return null
    
    if (Array.isArray(props.modelValue)) {
      return props.modelValue.map(date => date ? new Date(date) : null).filter(d => d && !isNaN(d.getTime()))
    } else {
      const date = new Date(props.modelValue)
      return isNaN(date.getTime()) ? null : date
    }
  }
})
</script>

<style scoped>
/* 自定义日期选择器样式 */
:deep(.el-date-editor) {
  width: 100%;
}

/* 范围选择器样式 */
:deep(.el-date-editor--daterange),
:deep(.el-date-editor--datetimerange),
:deep(.el-date-editor--monthrange),
:deep(.el-date-editor--weekrange) {
  width: 100%;
}

/* 输入框样式 */
:deep(.el-input__inner) {
  transition: all 0.3s;
}

/* 禁用状态样式 */
:deep(.el-date-editor.is-disabled .el-input__inner) {
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-disabled);
}

/* 只读状态样式 */
:deep(.el-date-editor.is-readonly .el-input__inner) {
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-secondary);
}

/* 错误状态样式 */
:deep(.el-date-editor.is-error .el-input__inner) {
  border-color: var(--el-color-danger);
}

/* 聚焦状态样式 */
:deep(.el-input__inner:focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(55, 161, 255, 0.2);
}

/* 图标样式 */
:deep(.el-input__prefix-icon),
:deep(.el-input__suffix-icon) {
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

:deep(.el-input__suffix-icon:hover) {
  color: var(--el-text-color-primary);
}

/* 日期范围分隔符样式 */
:deep(.el-range-separator) {
  color: var(--el-text-color-regular);
  padding: 0 5px;
  user-select: none;
}

/* 弹出框样式 */
:deep(.el-picker-panel) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 日期单元格样式 */
:deep(.el-date-table td) {
  transition: background-color 0.2s;
}

:deep(.el-date-table td:hover:not(.is-disabled)) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-date-table td.is-selected) {
  background-color: var(--el-color-primary);
  color: #fff;
}

:deep(.el-date-table td.is-disabled) {
  color: var(--el-text-color-disabled);
}

/* 月份/年份选择样式 */
:deep(.el-year-table td:hover:not(.is-disabled)),
:deep(.el-month-table td:hover:not(.is-disabled)) {
  background-color: var(--el-fill-color-light);
}

/* 时间选择器样式 */
:deep(.el-time-spinner__item:hover:not(.is-disabled)) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-time-spinner__item.active:not(.is-disabled)) {
  color: var(--el-color-primary);
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  :deep(.el-date-editor) {
    font-size: 14px;
  }
  
  :deep(.el-range-editor.is-active) {
    box-shadow: none;
  }
}
</style>