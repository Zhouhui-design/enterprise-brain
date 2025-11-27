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
    <el-select
      v-model="modelValue"
      :multiple="multiple"
      :disabled="disabled || isLoading"
      :clearable="clearable"
      :filterable="filterable"
      :remote="remote"
      :remote-method="handleRemoteMethod"
      :remote-search-suggestions="remoteSearchSuggestions"
      :loading="isLoading"
      :placeholder="placeholder"
      :popper-class="popperClass"
      :reserve-keyword="reserveKeyword"
      :default-first-option="defaultFirstOption"
      :multiple-limit="multipleLimit"
      :name="name"
      :id="id"
      :autocomplete="autocomplete"
      :placeholder="getPlaceholder"
      :value-key="valueKey"
      :label-key="labelKey"
      :no-data-text="noDataText"
      :no-match-text="noMatchText"
      :teleported="teleported"
      :collapse-tags="collapseTags"
      :collapse-tags-tooltip="collapseTagsTooltip"
      :value-collapse-tags="valueCollapseTags"
      :tooltip-effect="tooltipEffect"
      :token-separator="tokenSeparator"
      :allow-create="allowCreate"
      :create-tag="handleCreateTag"
      :default-active-first-option="defaultActiveFirstOption"
      :form="form"
      :validate-event="validateEvent"
      @change="handleChange"
      @visible-change="handleVisibleChange"
      @remove-tag="handleRemoveTag"
      @clear="handleClear"
      @focus="handleFocus"
      @blur="handleBlur"
      @select="handleSelect"
      @unselect="handleUnselect"
    >
      <!-- 自定义前缀图标 -->
      <template #prefix v-if="prefixIcon">
        <el-icon :size="16"><component :is="prefixIcon" /></el-icon>
      </template>
      
      <!-- 自定义选项模板 -->
      <template v-if="$slots.option">
        <el-option
          v-for="item in options"
          :key="getItemKey(item)"
          :label="getItemLabel(item)"
          :value="getItemValue(item)"
          :disabled="isItemDisabled(item)"
        >
          <slot name="option" :option="item" :index="options.indexOf(item)"></slot>
        </el-option>
      </template>
      
      <!-- 默认选项模板 -->
      <template v-else>
        <!-- 分组选项 -->
        <template v-for="group in options" :key="`group-${group[groupLabelKey]}`" v-if="group[groupOptionsKey]">
          <el-option-group :label="group[groupLabelKey]">
            <el-option
              v-for="item in group[groupOptionsKey]"
              :key="getItemKey(item)"
              :label="getItemLabel(item)"
              :value="getItemValue(item)"
              :disabled="isItemDisabled(item)"
            ></el-option>
          </el-option-group>
        </template>
        
        <!-- 普通选项 -->
        <template v-else>
          <el-option
            v-for="item in options"
            :key="getItemKey(item)"
            :label="getItemLabel(item)"
            :value="getItemValue(item)"
            :disabled="isItemDisabled(item)"
          ></el-option>
        </template>
      </template>
      
      <!-- 无匹配内容插槽 -->
      <template #empty v-if="$slots.empty">
        <slot name="empty" :query="remoteQuery"></slot>
      </template>
      
      <!-- 远程搜索加载中插槽 -->
      <template #loading v-if="$slots.loading">
        <slot name="loading"></slot>
      </template>
    </el-select>
    
    <!-- 帮助文本 -->
    <template #help v-if="help || $slots.help">
      <slot name="help">{{ help }}</slot>
    </template>
  </el-form-item>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { ElSelect, ElOption, ElOptionGroup } from 'element-plus'

// 定义Props
const props = defineProps({
  // 绑定值
  modelValue: {
    type: [String, Number, Boolean, Array, Object],
    default: multiple => multiple ? [] : ''
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
  // 选项数据
  options: {
    type: Array,
    default: () => []
  },
  // 选项的value键名
  valueKey: {
    type: String,
    default: 'value'
  },
  // 选项的label键名
  labelKey: {
    type: String,
    default: 'label'
  },
  // 选项的disabled键名
  disabledKey: {
    type: String,
    default: 'disabled'
  },
  // 分组选项的标签键名
  groupLabelKey: {
    type: String,
    default: 'label'
  },
  // 分组选项的子选项键名
  groupOptionsKey: {
    type: String,
    default: 'options'
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 是否可清空
  clearable: {
    type: Boolean,
    default: true
  },
  // 是否可搜索
  filterable: {
    type: Boolean,
    default: false
  },
  // 是否远程搜索
  remote: {
    type: Boolean,
    default: false
  },
  // 远程搜索建议列表
  remoteSearchSuggestions: {
    type: Array,
    default: () => []
  },
  // 远程搜索方法
  remoteMethod: {
    type: Function,
    default: null
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
  // 弹出框样式类名
  popperClass: {
    type: String,
    default: ''
  },
  // 搜索时是否保留关键字
  reserveKeyword: {
    type: Boolean,
    default: true
  },
  // 输入框聚焦时默认选中第一个选项
  defaultFirstOption: {
    type: Boolean,
    default: false
  },
  // 多选时用户最多可以选择的项目数
  multipleLimit: {
    type: Number,
    default: 0
  },
  // 组件大小
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['large', 'default', 'small'].includes(value)
  },
  // name属性
  name: {
    type: String,
    default: ''
  },
  // id属性
  id: {
    type: String,
    default: ''
  },
  // 自动完成属性
  autocomplete: {
    type: String,
    default: 'off'
  },
  // 无数据时显示的文本
  noDataText: {
    type: String,
    default: ''
  },
  // 无匹配数据时显示的文本
  noMatchText: {
    type: String,
    default: ''
  },
  // 是否使用teleport
  teleported: {
    type: Boolean,
    default: true
  },
  // 多选时是否折叠标签
  collapseTags: {
    type: Boolean,
    default: false
  },
  // 折叠标签是否显示提示
  collapseTagsTooltip: {
    type: Boolean,
    default: true
  },
  // 多选值是否以折叠形式显示
  valueCollapseTags: {
    type: Boolean,
    default: false
  },
  // 提示框主题
  tooltipEffect: {
    type: String,
    default: 'dark'
  },
  // 多选时的分隔符
  tokenSeparator: {
    type: String,
    default: ','
  },
  // 是否允许创建新选项
  allowCreate: {
    type: Boolean,
    default: false
  },
  // 创建新选项的方法
  createTag: {
    type: Function,
    default: null
  },
  // 是否默认激活第一个选项
  defaultActiveFirstOption: {
    type: Boolean,
    default: true
  },
  // 表单标识
  form: {
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
  }
})

// 定义Emits
const emit = defineEmits([
  'update:modelValue',
  'change',
  'visible-change',
  'remove-tag',
  'clear',
  'focus',
  'blur',
  'select',
  'unselect',
  'create-tag',
  'remote-search'
])

// 内部状态
const isLoading = ref(false)
const remoteQuery = ref('')
const searchTimer = ref(null)

// 计算属性 - 动态占位符
const getPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder
  return props.multiple ? '请选择（可多选）' : '请选择'
})

// 获取选项的值
const getItemValue = (item) => {
  return item[props.valueKey] !== undefined ? item[props.valueKey] : item
}

// 获取选项的标签
const getItemLabel = (item) => {
  return item[props.labelKey] !== undefined ? item[props.labelKey] : item
}

// 获取选项的键（用于v-for）
const getItemKey = (item) => {
  const value = getItemValue(item)
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

// 判断选项是否禁用
const isItemDisabled = (item) => {
  return item[props.disabledKey] || false
}

// 处理远程搜索方法
const handleRemoteMethod = (query) => {
  remoteQuery.value = query
  
  // 清除之前的定时器
  if (searchTimer.value) {
    clearTimeout(searchTimer.value)
  }
  
  // 防抖处理
  searchTimer.value = setTimeout(() => {
    if (props.remoteMethod) {
      isLoading.value = true
      
      // 调用远程搜索方法
      Promise.resolve(props.remoteMethod(query))
        .then(() => {
          // 远程搜索完成
          emit('remote-search', query)
        })
        .finally(() => {
          isLoading.value = false
        })
    } else {
      emit('remote-search', query)
    }
  }, props.debounceDelay || 300)
}

// 处理创建标签
const handleCreateTag = (value) => {
  if (props.createTag) {
    const result = props.createTag(value)
    if (result !== false) {
      emit('create-tag', value)
      return result
    }
    return false
  }
  
  // 默认创建标签
  emit('create-tag', value)
  return { value, label: value }
}

// 转发事件
const handleChange = (value) => emit('update:modelValue', value)
const handleVisibleChange = (visible) => emit('visible-change', visible)
const handleRemoveTag = (tag) => emit('remove-tag', tag)
const handleClear = () => emit('clear')
const handleFocus = (event) => emit('focus', event)
const handleBlur = (event) => emit('blur', event)
const handleSelect = (val) => emit('select', val)
const handleUnselect = (val) => emit('unselect', val)

// 监听远程方法变化
watch(() => props.remoteMethod, (newMethod) => {
  if (newMethod && remoteQuery.value && props.remote) {
    handleRemoteMethod(remoteQuery.value)
  }
})

// 监听选项变化
watch(() => props.options, () => {
  // 选项变化时，如果是单选且没有选中值，可以考虑自动选择第一个选项
  if (!props.multiple && !props.modelValue && props.options.length > 0 && !props.remote) {
    const firstOption = props.options.find(opt => 
      !isItemDisabled(opt) && (!opt[props.groupOptionsKey] || opt[props.groupOptionsKey].length === 0)
    )
    
    if (firstOption) {
      nextTick(() => {
        emit('update:modelValue', getItemValue(firstOption))
      })
    }
  }
}, { deep: true, immediate: true })

// 生命周期
onMounted(() => {
  // 组件挂载后，如果配置了默认选中第一个选项且有选项数据
  if (props.defaultFirstOption && !props.modelValue && props.options.length > 0 && !props.remote) {
    const firstOption = props.options.find(opt => 
      !isItemDisabled(opt) && (!opt[props.groupOptionsKey] || opt[props.groupOptionsKey].length === 0)
    )
    
    if (firstOption) {
      nextTick(() => {
        emit('update:modelValue', getItemValue(firstOption))
      })
    }
  }
})

// 暴露公共方法
defineExpose({
  focus: () => {
    const selectElement = document.querySelector(`#${props.id || props.prop}`)
    if (selectElement) selectElement.focus()
  },
  blur: () => {
    const selectElement = document.querySelector(`#${props.id || props.prop}`)
    if (selectElement) selectElement.blur()
  },
  clear: () => {
    emit('update:modelValue', props.multiple ? [] : '')
    emit('clear')
  },
  // 获取当前选中的选项对象
  getSelectedOption: () => {
    if (!props.modelValue) return null
    
    if (props.multiple) {
      return props.modelValue.map(value => {
        // 递归查找选项
        const findInOptions = (options) => {
          for (const opt of options) {
            if (opt[props.groupOptionsKey]) {
              const found = findInOptions(opt[props.groupOptionsKey])
              if (found) return found
            } else if (JSON.stringify(getItemValue(opt)) === JSON.stringify(value)) {
              return opt
            }
          }
          return null
        }
        return findInOptions(props.options)
      }).filter(Boolean)
    } else {
      // 递归查找选项
      const findInOptions = (options) => {
        for (const opt of options) {
          if (opt[props.groupOptionsKey]) {
            const found = findInOptions(opt[props.groupOptionsKey])
            if (found) return found
          } else if (JSON.stringify(getItemValue(opt)) === JSON.stringify(props.modelValue)) {
            return opt
          }
        }
        return null
      }
      return findInOptions(props.options)
    }
  },
  // 手动触发远程搜索
  remoteSearch: (query) => {
    handleRemoteMethod(query)
  },
  // 更新加载状态
  setLoading: (loading) => {
    isLoading.value = loading
  }
})
</script>

<style scoped>
/* 自定义选择器样式 */
:deep(.el-select) {
  width: 100%;
}

/* 多选标签样式 */
:deep(.el-select__tags) {
  flex-wrap: wrap;
}

:deep(.el-select__tags .el-tag) {
  margin: 2px;
}

/* 折叠标签样式 */
:deep(.el-select__tags-text) {
  color: var(--el-text-color-primary);
}

/* 搜索框样式 */
:deep(.el-select__input) {
  color: var(--el-text-color-primary);
}

/* 禁用状态样式 */
:deep(.el-select.is-disabled .el-input.is-disabled .el-input__inner) {
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-disabled);
}

/* 下拉菜单样式 */
:deep(.el-select-dropdown) {
  max-height: 300px;
}

/* 分组标题样式 */
:deep(.el-option-group__label) {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 0 20px;
}

/* 选项悬停样式 */
:deep(.el-option:hover) {
  background-color: var(--el-fill-color-light);
}

/* 选中项样式 */
:deep(.el-option.is-selected) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 禁用选项样式 */
:deep(.el-option.is-disabled) {
  color: var(--el-text-color-disabled);
  background-color: var(--el-fill-color-blank);
}

/* 前缀图标样式 */
:deep(.el-select__prefix) {
  color: var(--el-text-color-secondary);
}
</style>