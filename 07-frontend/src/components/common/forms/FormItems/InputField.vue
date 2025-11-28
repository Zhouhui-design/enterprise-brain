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
    <el-input
      v-model="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :minlength="minlength"
      :show-word-limit="showWordLimit"
      :prefix-icon="prefixIcon"
      :suffix-icon="suffixIcon"
      :autocomplete="autocomplete"
      :clearable="clearable"
      :show-password="showPassword"
      :resize="resize"
      :autofocus="autofocus"
      :form="form"
      :tabindex="tabindex"
      :input-style="inputStyle"
      :number="number"
      :id="id"
      :name="name"
      :validate-event="validateEvent"
      :aria-label="ariaLabel"
      :on-icon-click="handleIconClick"
      @input="handleInput"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <template #prepend v-if="prepend">{{ prepend }}</template>
      <template #append v-if="append">{{ append }}</template>
      <template #prefix v-if="$slots.prefix"><slot name="prefix" /></template>
      <template #suffix v-if="$slots.suffix"><slot name="suffix" /></template>
      <template #default v-if="$slots.default"><slot /></template>
    </el-input>
    <template #help v-if="help || $slots.help">
      <slot name="help">{{ help }}</slot>
    </template>
  </el-form-item>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElInput, ElFormItem } from 'element-plus'
import { isString, isBoolean, isNumber, isArray } from '@/utils/type-check'

// 定义Props
const props = defineProps({
  // 绑定值
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
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
  // 输入框类型
  type: {
    type: String,
    default: 'text',
    validator: (value) => [
      'text', 'password', 'number', 'email', 'url', 'tel', 'date', 'datetime',
      'month', 'week', 'time', 'search', 'color', 'hidden'
    ].includes(value)
  },
  // 占位文本
  placeholder: {
    type: String,
    default: ''
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
  // 最大长度
  maxlength: {
    type: Number,
    default: undefined
  },
  // 最小长度
  minlength: {
    type: Number,
    default: undefined
  },
  // 是否显示字数统计
  showWordLimit: {
    type: Boolean,
    default: false
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
  },
  // 自动完成属性
  autocomplete: {
    type: String,
    default: 'off'
  },
  // 是否可清空
  clearable: {
    type: Boolean,
    default: true
  },
  // 是否显示密码切换
  showPassword: {
    type: Boolean,
    default: false
  },
  // 文本框大小
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  // 文本框可调整大小
  resize: {
    type: String,
    default: 'none',
    validator: (value) => ['none', 'both', 'horizontal', 'vertical'].includes(value)
  },
  // 是否自动聚焦
  autofocus: {
    type: Boolean,
    default: false
  },
  // 表单标识
  form: {
    type: String,
    default: ''
  },
  //  tabindex属性
  tabindex: {
    type: [String, Number],
    default: 0
  },
  // 输入框样式
  inputStyle: {
    type: [String, Object],
    default: ''
  },
  // 是否将输入值转为数字
  number: {
    type: Boolean,
    default: false
  },
  // 自定义ID
  id: {
    type: String,
    default: ''
  },
  // name属性
  name: {
    type: String,
    default: ''
  },
  // 是否在输入时触发表单验证
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
  // 前置内容
  prepend: {
    type: String,
    default: ''
  },
  // 后置内容
  append: {
    type: String,
    default: ''
  },
  // 帮助文本
  help: {
    type: String,
    default: ''
  },
  // aria-label属性
  ariaLabel: {
    type: String,
    default: ''
  }
})

// 定义Emits
const emit = defineEmits([
  'update:modelValue',
  'input',
  'change',
  'focus',
  'blur',
  'clear',
  'mouseenter',
  'mouseleave',
  'icon-click'
])

// 处理v-model双向绑定
const modelValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    // 如果是数字类型，转换为Number
    if (props.number && value !== '') {
      const numValue = Number(value)
      emit('update:modelValue', isNaN(numValue) ? value : numValue)
    } else {
      emit('update:modelValue', value)
    }
  }
})

// 处理图标点击事件
const handleIconClick = (iconName) => {
  emit('icon-click', iconName)
}

// 转发事件
const handleInput = (value) => emit('input', value)
const handleChange = (value) => emit('change', value)
const handleFocus = (event) => emit('focus', event)
const handleBlur = (event) => emit('blur', event)
const handleClear = () => emit('clear')
const handleMouseEnter = () => emit('mouseenter')
const handleMouseLeave = () => emit('mouseleave')

// 暴露公共方法
defineExpose({
  focus: () => {
    // 获取内部input元素并聚焦
    const inputElement = document.querySelector(`#${props.id || props.prop}`)
    if (inputElement) inputElement.focus()
  },
  blur: () => {
    const inputElement = document.querySelector(`#${props.id || props.prop}`)
    if (inputElement) inputElement.blur()
  },
  select: () => {
    const inputElement = document.querySelector(`#${props.id || props.prop}`)
    if (inputElement) inputElement.select()
  }
})
</script>

<style scoped>
/* 自定义输入框样式 */
:deep(.el-input) {
  width: 100%;
}

/* 错误状态样式 */
:deep(.el-input.is-error .el-input__inner) {
  border-color: var(--el-color-danger);
}

/* 只读状态样式 */
:deep(.el-input.is-readonly .el-input__inner) {
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-secondary);
}

/* 禁用状态样式 */
:deep(.el-input.is-disabled .el-input__inner) {
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-disabled);
}

/* 前置/后置内容样式 */
:deep(.el-input-group__prepend), :deep(.el-input-group__append) {
  background-color: var(--el-fill-color-light);
  border-color: var(--el-border-color);
  color: var(--el-text-color-secondary);
}

/* 聚焦状态样式 */
:deep(.el-input__inner:focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px rgba(55, 161, 255, 0.2);
}

/* 字数统计样式 */
:deep(.el-input__count) {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

/* 图标样式 */
:deep(.el-input__prefix, .el-input__suffix) {
  color: var(--el-text-color-secondary);
}

/* 密码切换图标 */
:deep(.el-input__suffix .el-icon-view, .el-input__suffix .el-icon-view-off) {
  cursor: pointer;
}
</style>