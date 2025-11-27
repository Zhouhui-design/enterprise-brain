<template>
  <div class="filter-panel">
    <el-form :model="filterForm" label-width="100px" inline>
      <!-- 日期范围筛选 -->
      <el-form-item label="日期范围" v-if="showDateRange">
        <el-date-picker
          v-model="filterForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleFilterChange"
        />
      </el-form-item>

      <!-- 维度选择 -->
      <el-form-item label="维度" v-if="showDimensions">
        <el-select
          v-model="filterForm.dimension"
          placeholder="请选择维度"
          clearable
          @change="handleFilterChange"
        >
          <el-option
            v-for="dim in dimensionOptions"
            :key="dim.value"
            :label="dim.label"
            :value="dim.value"
          />
        </el-select>
      </el-form-item>

      <!-- 指标选择 -->
      <el-form-item label="指标" v-if="showMetrics">
        <el-select
          v-model="filterForm.metrics"
          placeholder="请选择指标"
          multiple
          collapse-tags
          @change="handleFilterChange"
        >
          <el-option
            v-for="metric in metricOptions"
            :key="metric.value"
            :label="metric.label"
            :value="metric.value"
          />
        </el-select>
      </el-form-item>

      <!-- 分组方式 -->
      <el-form-item label="分组" v-if="showGroupBy">
        <el-select
          v-model="filterForm.groupBy"
          placeholder="请选择分组方式"
          clearable
          @change="handleFilterChange"
        >
          <el-option label="按天" value="day" />
          <el-option label="按周" value="week" />
          <el-option label="按月" value="month" />
          <el-option label="按季度" value="quarter" />
          <el-option label="按年" value="year" />
        </el-select>
      </el-form-item>

      <!-- 自定义筛选条件 -->
      <slot name="custom-filters"></slot>

      <!-- 操作按钮 -->
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button @click="handleExport" v-if="showExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'

const props = defineProps({
  showDateRange: {
    type: Boolean,
    default: true
  },
  showDimensions: {
    type: Boolean,
    default: false
  },
  showMetrics: {
    type: Boolean,
    default: false
  },
  showGroupBy: {
    type: Boolean,
    default: false
  },
  showExport: {
    type: Boolean,
    default: true
  },
  dimensionOptions: {
    type: Array,
    default: () => []
  },
  metricOptions: {
    type: Array,
    default: () => []
  },
  initialFilters: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['query', 'reset', 'export', 'filter-change'])

const filterForm = reactive({
  dateRange: [],
  dimension: '',
  metrics: [],
  groupBy: 'day',
  ...props.initialFilters
})

// 监听初始筛选条件变化
watch(() => props.initialFilters, (newVal) => {
  Object.assign(filterForm, newVal)
}, { deep: true })

const handleFilterChange = () => {
  emit('filter-change', filterForm)
}

const handleQuery = () => {
  emit('query', filterForm)
}

const handleReset = () => {
  filterForm.dateRange = []
  filterForm.dimension = ''
  filterForm.metrics = []
  filterForm.groupBy = 'day'
  emit('reset')
}

const handleExport = () => {
  emit('export', filterForm)
}
</script>

<style scoped lang="scss">
.filter-panel {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  margin-bottom: 20px;

  .el-form {
    .el-form-item {
      margin-bottom: 10px;
    }
  }
}
</style>
