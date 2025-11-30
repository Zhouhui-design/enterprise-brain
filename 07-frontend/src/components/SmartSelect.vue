<template>
  <el-select
    v-model="localValue"
    :filterable="filterable"
    :remote="remote"
    :remote-method="handleRemoteSearch"
    :loading="loading"
    :placeholder="placeholder"
    :clearable="clearable"
    :multiple="multiple"
    :collapse-tags="collapseTags"
    :collapse-tags-tooltip="collapseTagsTooltip"
    :max-collapse-tags="maxCollapseTags"
    :disabled="disabled"
    :size="size"
    :popper-class="popperClass"
    @change="handleChange"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
    :style="style"
  >
    <el-option
      v-for="item in filteredOptions"
      :key="getOptionKey(item)"
      :label="getOptionLabel(item)"
      :value="getOptionValue(item)"
      :disabled="item.disabled || false"
    >
      <slot name="option" :item="item">
        <span>{{ getOptionLabel(item) }}</span>
        <span 
          v-if="showDescription && item.description" 
          style="color: #909399; margin-left: 10px;"
        >
          {{ item.description }}
        </span>
      </slot>
    </el-option>
  </el-select>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElSelect, ElOption } from 'element-plus'

// 定义组件属性
const props = defineProps({
  // 绑定值
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
    default: ''
  },
  // 选项数据源
  options: {
    type: Array,
    default: () => []
  },
  // 选项标签字段名
  labelField: {
    type: String,
    default: 'label'
  },
  // 选项值字段名
  valueField: {
    type: String,
    default: 'value'
  },
  // 描述字段名（可选）
  descriptionField: {
    type: String,
    default: 'description'
  },
  // 占位符
  placeholder: {
    type: String,
    default: '请选择'
  },
  // 是否可过滤
  filterable: {
    type: Boolean,
    default: true
  },
  // 是否远程搜索
  remote: {
    type: Boolean,
    default: false
  },
  // 是否可清空
  clearable: {
    type: Boolean,
    default: true
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 多选时是否折叠标签
  collapseTags: {
    type: Boolean,
    default: false
  },
  // 多选时折叠标签是否显示Tooltip
  collapseTagsTooltip: {
    type: Boolean,
    default: false
  },
  // 多选时最大折叠标签数
  maxCollapseTags: {
    type: Number,
    default: 1
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 尺寸
  size: {
    type: String,
    default: 'default'
  },
  // 自定义类名
  popperClass: {
    type: String,
    default: ''
  },
  // 自定义样式
  style: {
    type: [String, Object],
    default: ''
  },
  // 是否显示描述信息
  showDescription: {
    type: Boolean,
    default: false
  },
  // 自定义过滤方法
  customFilter: {
    type: Function,
    default: null
  },
  // 远程搜索方法
  remoteMethod: {
    type: Function,
    default: null
  }
})

// 定义事件
const emits = defineEmits([
  'update:modelValue',
  'change',
  'focus',
  'blur',
  'clear',
  'search'
])

// 内部状态
const localValue = ref(props.modelValue)
const loading = ref(false)
const searchQuery = ref('')

// 计算属性 - 过滤后的选项
const filteredOptions = computed(() => {
  // 如果是远程搜索，直接返回原始选项
  if (props.remote) {
    return props.options
  }
  
  // 如果有自定义过滤方法，使用自定义方法
  if (props.customFilter && typeof props.customFilter === 'function') {
    return props.customFilter(props.options, searchQuery.value)
  }
  
  // 如果没有搜索关键词，返回所有选项
  if (!searchQuery.value) {
    return props.options
  }
  
  // 默认过滤逻辑 - 根据标签字段过滤
  return props.options.filter(item => {
    const label = getOptionLabel(item)
    return label.toLowerCase().includes(searchQuery.value.toLowerCase())
  })
})

// 方法 - 获取选项的键值
const getOptionKey = (item) => {
  return typeof item === 'object' ? item[props.valueField] : item
}

// 方法 - 获取选项的标签
const getOptionLabel = (item) => {
  if (typeof item === 'object') {
    return item[props.labelField] || item[props.valueField] || ''
  }
  return item
}

// 方法 - 获取选项的值
const getOptionValue = (item) => {
  if (typeof item === 'object') {
    return item[props.valueField] !== undefined ? item[props.valueField] : item
  }
  return item
}

// 方法 - 处理远程搜索
const handleRemoteSearch = async (query) => {
  searchQuery.value = query
  emits('search', query)
  
  // 如果是远程搜索且提供了远程方法
  if (props.remote && props.remoteMethod) {
    loading.value = true
    try {
      await props.remoteMethod(query)
    } finally {
      loading.value = false
    }
  }
}

// 方法 - 处理值变化
const handleChange = (value) => {
  localValue.value = value
  emits('update:modelValue', value)
  emits('change', value)
}

// 方法 - 处理聚焦
const handleFocus = (event) => {
  emits('focus', event)
}

// 方法 - 处理失焦
const handleBlur = (event) => {
  emits('blur', event)
}

// 方法 - 处理清空
const handleClear = () => {
  searchQuery.value = ''
  emits('clear')
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue
})

// 监听本地值变化
watch(localValue, (newValue) => {
  emits('update:modelValue', newValue)
})

// 组件挂载时
onMounted(() => {
  localValue.value = props.modelValue
})
</script>

<style scoped>
/* 可以在这里添加自定义样式 */
</style>