<template>
  <div class="table-header-filter">
    <el-popover
      placement="bottom-start"
      :width="250"
      trigger="click"
      v-model:visible="visible"
    >
      <template #reference>
        <el-button 
          :icon="Filter" 
          link 
          size="small"
          :class="{ 'is-filtered': hasFilter }"
        >
          筛选
        </el-button>
      </template>
      
      <div class="filter-panel">
        <div class="filter-content">
          <!-- 文本筛选 -->
          <el-input
            v-if="column.filterType === 'input'"
            v-model="filterValue"
            :placeholder="`搜索${column.label}`"
            clearable
            size="small"
          />
          
          <!-- 下拉筛选 -->
          <el-select
            v-else-if="column.filterType === 'select'"
            v-model="filterValue"
            :placeholder="`选择${column.label}`"
            clearable
            size="small"
            style="width: 100%;"
          >
            <el-option
              v-for="option in column.filterOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          
          <!-- 日期筛选 -->
          <el-date-picker
            v-else-if="column.filterType === 'date'"
            v-model="filterValue"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            style="width: 100%;"
          />
          
          <!-- 数字范围筛选 -->
          <div v-else-if="column.filterType === 'number'">
            <el-input-number
              v-model="numberRange.min"
              :placeholder="`最小值`"
              size="small"
              style="width: 100%; margin-bottom: 10px;"
            />
            <el-input-number
              v-model="numberRange.max"
              :placeholder="`最大值`"
              size="small"
              style="width: 100%;"
            />
          </div>
        </div>
        
        <div class="filter-actions">
          <el-button size="small" @click="handleReset">重置</el-button>
          <el-button type="primary" size="small" @click="handleConfirm">确定</el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Filter } from '@element-plus/icons-vue'

const props = defineProps({
  column: {
    type: Object,
    required: true
  },
  modelValue: {
    type: [String, Number, Array, Object],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'filter'])

const visible = ref(false)
const filterValue = ref(props.modelValue)
const numberRange = ref({ min: null, max: null })

// 是否有筛选条件
const hasFilter = computed(() => {
  if (props.column.filterType === 'number') {
    return numberRange.value.min !== null || numberRange.value.max !== null
  }
  return filterValue.value !== null && filterValue.value !== '' && filterValue.value !== undefined
})

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  if (props.column.filterType === 'number' && typeof newVal === 'object') {
    numberRange.value = newVal || { min: null, max: null }
  } else {
    filterValue.value = newVal
  }
}, { immediate: true })

// 确定筛选
const handleConfirm = () => {
  let value = filterValue.value
  
  if (props.column.filterType === 'number') {
    value = numberRange.value
  }
  
  emit('update:modelValue', value)
  emit('filter', {
    prop: props.column.prop,
    value: value
  })
  visible.value = false
}

// 重置筛选
const handleReset = () => {
  if (props.column.filterType === 'number') {
    numberRange.value = { min: null, max: null }
  } else {
    filterValue.value = null
  }
  
  emit('update:modelValue', null)
  emit('filter', {
    prop: props.column.prop,
    value: null
  })
  visible.value = false
}
</script>

<style scoped>
.table-header-filter {
  display: inline-block;
  margin-left: 5px;
}

.is-filtered {
  color: #409eff;
}

.filter-panel {
  padding: 10px;
}

.filter-content {
  margin-bottom: 15px;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
