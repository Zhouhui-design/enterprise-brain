<template>
  <div class="cell-renderer">
    <!-- 文本类型 -->
    <span v-if="column.type === 'text'" :class="cellClass">
      {{ value }}
    </span>
    
    <!-- 数字类型 -->
    <span v-else-if="column.type === 'number'" :class="cellClass">
      {{ formatNumber(value) }}
    </span>
    
    <!-- 货币类型 -->
    <span v-else-if="column.type === 'currency'" :class="cellClass">
      {{ formatCurrency(value) }}
    </span>
    
    <!-- 百分比类型 -->
    <span v-else-if="column.type === 'percentage'" :class="cellClass">
      {{ formatPercentage(value) }}
    </span>
    
    <!-- 日期类型 -->
    <span v-else-if="column.type === 'date'" :class="cellClass">
      {{ formatDate(value) }}
    </span>
    
    <!-- 状态类型 -->
    <el-tag v-else-if="column.type === 'status'" :type="getStatusType(value)" size="small">
      {{ getStatusLabel(value) }}
    </el-tag>
    
    <!-- 开关类型 -->
    <el-switch
      v-else-if="column.type === 'switch'"
      :model-value="value"
      @change="handleSwitchChange"
      :disabled="column.editable === false"
    />
    
    <!-- 下拉类型 -->
    <el-select
      v-else-if="column.type === 'select'"
      :model-value="value"
      @change="handleSelectChange"
      :disabled="column.editable === false"
      :placeholder="column.placeholder"
      size="small"
    >
      <el-option
        v-for="option in column.options"
        :key="option.value"
        :label="option.label"
        :value="option.value"
      />
    </el-select>
    
    <!-- 按钮类型 -->
    <el-button
      v-else-if="column.type === 'button'"
      :type="column.buttonType || 'primary'"
      size="small"
      @click="handleButtonClick"
      :icon="column.icon"
      :disabled="column.disabled"
    >
      {{ column.buttonText || value }}
    </el-button>
    
    <!-- 链接类型 -->
    <el-link
      v-else-if="column.type === 'link'"
      :type="column.linkType || 'primary'"
      @click="handleLinkClick"
      :underline="column.underline !== false"
    >
      {{ value }}
    </el-link>
    
    <!-- 图标类型 -->
    <i v-else-if="column.type === 'icon'" :class="value" :style="iconStyle"></i>
    
    <!-- 标签类型 -->
    <el-tag
      v-else-if="column.type === 'tag'"
      :type="getTagType(value)"
      size="small"
      :effect="column.effect || 'light'"
    >
      {{ value }}
    </el-tag>
    
    <!-- 图片类型 -->
    <el-image
      v-else-if="column.type === 'image'"
      :src="value"
      :style="imageStyle"
      :preview-src-list="previewList"
      fit="cover"
      lazy
    />
    
    <!-- 进度条类型 -->
    <el-progress
      v-else-if="column.type === 'progress'"
      :percentage="value"
      :stroke-width="column.strokeWidth || 6"
      :show-text="column.showText !== false"
      :status="getProgressStatus(value)"
    />
    
    <!-- 评分类型 -->
    <el-rate
      v-else-if="column.type === 'rate'"
      :model-value="value"
      :max="column.max || 5"
      :disabled="column.editable === false"
      :show-score="column.showScore !== false"
      :texts="column.texts"
    />
    
    <!-- 颜色选择器类型 -->
    <el-color-picker
      v-else-if="column.type === 'color'"
      :model-value="value"
      @change="handleColorChange"
      :disabled="column.editable === false"
      :size="column.size || 'default'"
    />
    
    <!-- 自定义插槽 -->
    <slot v-else :name="column.prop" :row="row" :column="column" :value="value" :index="index">
      {{ value }}
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

interface Column {
  prop: string
  type: string
  label?: string
  editable?: boolean
  placeholder?: string
  buttonType?: string
  buttonText?: string
  linkType?: string
  underline?: boolean
  effect?: string
  strokeWidth?: number
  showText?: boolean
  max?: number
  showScore?: boolean
  texts?: string[]
  size?: string
  icon?: string
  disabled?: boolean
  statusMap?: Record<string, string>
  options?: Array<{ label: string; value: any }>
  tagTypeMap?: Record<string, string>
  dateFormat?: string
  numberFormat?: {
    decimals?: number
    thousands?: boolean
  }
  currency?: {
    symbol?: string
    code?: string
  }
  imageStyle?: Record<string, any>
  preview?: boolean
}

interface Props {
  value: any
  row: Record<string, any>
  column: Column
  index: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [value: any, row: Record<string, any>, column: Column]
  'switch-change': [value: boolean, row: Record<string, any>, column: Column]
  'select-change': [value: any, row: Record<string, any>, column: Column]
  'button-click': [row: Record<string, any>, column: Column]
  'link-click': [row: Record<string, any>, column: Column]
  'color-change': [value: string, row: Record<string, any>, column: Column]
}>()

const cellClass = computed(() => {
  return {
    'cell-text': true,
    'cell-number': props.column.type === 'number',
    'cell-currency': props.column.type === 'currency',
    'cell-percentage': props.column.type === 'percentage',
    'cell-date': props.column.type === 'date'
  }
})

const iconStyle = computed(() => {
  return {
    fontSize: '16px',
    color: props.row[`${props.column.prop}_color`] || '#606266',
    ...props.column.imageStyle
  }
})

const imageStyle = computed(() => {
  return {
    width: '40px',
    height: '40px',
    borderRadius: '4px',
    ...props.column.imageStyle
  }
})

const previewList = computed(() => {
  if (props.column.preview && props.value) {
    return [props.value]
  }
  return []
})

const formatNumber = (value: any) => {
  if (value === null || value === undefined) return ''
  const { decimals = 2, thousands = true } = props.column.numberFormat || {}
  let num = Number(value)
  if (isNaN(num)) return value
  
  num = num.toFixed(decimals)
  if (thousands) {
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  return num
}

const formatCurrency = (value: any) => {
  if (value === null || value === undefined) return ''
  const { symbol = '¥', code = 'CNY' } = props.column.currency || {}
  const formatted = formatNumber(value)
  return `${symbol}${formatted}`
}

const formatPercentage = (value: any) => {
  if (value === null || value === undefined) return ''
  const num = Number(value)
  if (isNaN(num)) return value
  return `${(num * 100).toFixed(2)}%`
}

const formatDate = (value: any) => {
  if (!value) return ''
  const format = props.column.dateFormat || 'YYYY-MM-DD'
  return dayjs(value).format(format)
}

const getStatusType = (value: any) => {
  if (props.column.statusMap && props.column.statusMap[value]) {
    return props.column.statusMap[value]
  }
  const statusMap: Record<string, string> = {
    active: 'success',
    inactive: 'info',
    pending: 'warning',
    error: 'danger',
    success: 'success',
    fail: 'danger'
  }
  return statusMap[value] || 'info'
}

const getStatusLabel = (value: any) => {
  const statusMap: Record<string, string> = {
    active: '激活',
    inactive: '未激活',
    pending: '待处理',
    error: '错误',
    success: '成功',
    fail: '失败'
  }
  return statusMap[value] || value
}

const getTagType = (value: any) => {
  if (props.column.tagTypeMap && props.column.tagTypeMap[value]) {
    return props.column.tagTypeMap[value]
  }
  return ''
}

const getProgressStatus = (value: number) => {
  if (value >= 100) return 'success'
  if (value >= 80) return ''
  return 'exception'
}

const handleSwitchChange = (value: boolean) => {
  emit('switch-change', value, props.row, props.column)
  emit('change', value, props.row, props.column)
}

const handleSelectChange = (value: any) => {
  emit('select-change', value, props.row, props.column)
  emit('change', value, props.row, props.column)
}

const handleButtonClick = () => {
  emit('button-click', props.row, props.column)
}

const handleLinkClick = () => {
  emit('link-click', props.row, props.column)
}

const handleColorChange = (value: string) => {
  emit('color-change', value, props.row, props.column)
  emit('change', value, props.row, props.column)
}
</script>

<style scoped>
.cell-renderer {
  width: 100%;
}

.cell-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-number {
  text-align: right;
  font-family: 'Courier New', monospace;
}

.cell-currency {
  text-align: right;
  font-weight: 500;
  color: #f56c6c;
}

.cell-percentage {
  text-align: right;
  font-weight: 500;
  color: #409eff;
}

.cell-date {
  text-align: center;
  color: #606266;
}

:deep(.el-progress) {
  width: 100%;
}

:deep(.el-image) {
  cursor: pointer;
}
</style>