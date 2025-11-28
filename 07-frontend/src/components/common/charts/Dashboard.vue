<template>
  <div class="dashboard-container" :class="{ 'dashboard-loading': loading }">
    <!-- 仪表盘标题 -->
    <div v-if="title" class="dashboard-header">
      <h2 class="dashboard-title">{{ title }}</h2>
      <div v-if="actions" class="dashboard-actions">
        <slot name="actions"></slot>
      </div>
    </div>
    
    <!-- 仪表盘内容 -->
    <div class="dashboard-content">
      <!-- KPI指标区域 -->
      <div v-if="kpiItems && kpiItems.length > 0" class="dashboard-kpi-section">
        <div 
          v-for="(item, index) in kpiItems" 
          :key="index" 
          class="kpi-item"
          :class="{ 'kpi-item-border': showKpiBorder }"
        >
          <div class="kpi-label">{{ item.label }}</div>
          <div class="kpi-value" :class="{ 'kpi-value-large': item.large }">
            {{ formatKpiValue(item.value, item.format) }}
          </div>
          <div v-if="item.change !== undefined" class="kpi-change" :class="getChangeClass(item.change)">
            <el-icon v-if="item.change > 0"><ArrowUp /></el-icon>
            <el-icon v-else-if="item.change < 0"><ArrowDown /></el-icon>
            <el-icon v-else><Minus /></el-icon>
            {{ Math.abs(item.change) }}%
          </div>
          <div v-if="item.description" class="kpi-description">{{ item.description }}</div>
        </div>
      </div>
      
      <!-- 图表区域 -->
      <div class="dashboard-charts-section">
        <slot></slot>
      </div>
    </div>
    
    <!-- 加载遮罩 -->
    <div v-if="loading" class="dashboard-loading-mask">
      <el-spinner size="large" />
      <p class="loading-text">{{ loadingText || '加载中...' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  // 仪表盘标题
  title: {
    type: String,
    default: ''
  },
  // KPI指标项
  kpiItems: {
    type: Array,
    default: () => []
  },
  // 是否显示KPI指标边框
  showKpiBorder: {
    type: Boolean,
    default: true
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  },
  // 加载文本
  loadingText: {
    type: String,
    default: ''
  },
  // 是否显示操作区域
  actions: {
    type: Boolean,
    default: false
  }
})

// 方法
const formatKpiValue = (value: any, format?: string): string => {
  if (value === null || value === undefined) return '--'
  
  switch (format) {
    case 'currency':
      return `¥${Number(value).toLocaleString()}`
    case 'percentage':
      return `${(Number(value) * 100).toFixed(2)}%`
    case 'number':
      return Number(value).toLocaleString()
    case 'decimal':
      return Number(value).toFixed(2)
    default:
      return String(value)
  }
}

const getChangeClass = (change: number): string => {
  if (change > 0) return 'kpi-change-positive'
  if (change < 0) return 'kpi-change-negative'
  return 'kpi-change-neutral'
}
</script>

<style scoped>
.dashboard-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dashboard-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.dashboard-actions {
  display: flex;
  gap: 12px;
}

.dashboard-content {
  width: 100%;
}

.dashboard-kpi-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.kpi-item {
  padding: 16px;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.kpi-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.kpi-item-border {
  border: 1px solid #ebeef5;
}

.kpi-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.kpi-value-large {
  font-size: 32px;
}

.kpi-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
}

.kpi-change-positive {
  color: #f56c6c;
}

.kpi-change-negative {
  color: #67c23a;
}

.kpi-change-neutral {
  color: #909399;
}

.kpi-description {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dashboard-charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.dashboard-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px;
  z-index: 10;
}

.loading-text {
  color: #606266;
  font-size: 14px;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .dashboard-kpi-section {
    grid-template-columns: 1fr;
  }
  
  .dashboard-charts-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .kpi-value {
    font-size: 20px;
  }
  
  .kpi-value-large {
    font-size: 24px;
  }
}
</style>