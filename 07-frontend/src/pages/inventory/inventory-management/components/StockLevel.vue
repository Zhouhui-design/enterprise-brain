<template>
  <div class="stock-level-component">
    <el-card shadow="hover" :body-style="{ padding: '15px' }">
      <template #header>
        <div class="card-header">
          <span>库存水位</span>
          <el-tag :type="getStatusType" size="small">
            {{ getStatusText }}
          </el-tag>
        </div>
      </template>

      <!-- 可视化库存水位 -->
      <div class="stock-level-visual">
        <div class="level-container">
          <!-- 最大库存线 -->
          <div class="level-line max-line">
            <span class="line-label">最大库存</span>
            <span class="line-value">{{ maxStock }}</span>
          </div>

          <!-- 库存柱状图 -->
          <div class="level-bar-container">
            <div 
              class="level-bar" 
              :style="{ 
                height: barHeight + '%',
                backgroundColor: barColor
              }"
            >
              <span class="bar-label">{{ currentStock }}</span>
            </div>
          </div>

          <!-- 安全库存线 -->
          <div class="level-line safety-line" :style="{ bottom: safetyLinePosition + '%' }">
            <span class="line-label">安全库存</span>
            <span class="line-value">{{ safetyStock }}</span>
          </div>

          <!-- 最小库存线 -->
          <div class="level-line min-line">
            <span class="line-label">最小库存</span>
            <span class="line-value">{{ minStock }}</span>
          </div>
        </div>
      </div>

      <!-- 库存信息 -->
      <el-divider />
      
      <el-row :gutter="10" class="stock-info">
        <el-col :span="12">
          <div class="info-item">
            <span class="info-label">当前库存:</span>
            <span class="info-value" :style="{ color: barColor }">
              {{ currentStock }} {{ unit }}
            </span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <span class="info-label">可用库存:</span>
            <span class="info-value">{{ availableStock }} {{ unit }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <span class="info-label">锁定库存:</span>
            <span class="info-value">{{ lockedStock }} {{ unit }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <span class="info-label">库存占用率:</span>
            <span class="info-value">{{ occupancyRate }}%</span>
          </div>
        </el-col>
      </el-row>

      <!-- 建议操作 -->
      <el-alert
        v-if="suggestion"
        :title="suggestion"
        :type="suggestionType"
        :closable="false"
        style="margin-top: 15px;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  availableStock: {
    type: Number,
    default: 0
  },
  lockedStock: {
    type: Number,
    default: 0
  },
  safetyStock: {
    type: Number,
    required: true,
    default: 100
  },
  minStock: {
    type: Number,
    default: 50
  },
  maxStock: {
    type: Number,
    required: true,
    default: 1000
  },
  unit: {
    type: String,
    default: '件'
  }
})

// 计算属性
const barHeight = computed(() => {
  return Math.min((props.currentStock / props.maxStock) * 100, 100)
})

const safetyLinePosition = computed(() => {
  return (props.safetyStock / props.maxStock) * 100
})

const barColor = computed(() => {
  if (props.currentStock <= props.minStock) return '#f56c6c'
  if (props.currentStock <= props.safetyStock) return '#e6a23c'
  if (props.currentStock >= props.maxStock * 0.9) return '#409eff'
  return '#67c23a'
})

const occupancyRate = computed(() => {
  return ((props.currentStock / props.maxStock) * 100).toFixed(1)
})

const getStatusType = computed(() => {
  if (props.currentStock <= props.minStock) return 'danger'
  if (props.currentStock <= props.safetyStock) return 'warning'
  if (props.currentStock >= props.maxStock * 0.9) return 'info'
  return 'success'
})

const getStatusText = computed(() => {
  if (props.currentStock <= props.minStock) return '缺货'
  if (props.currentStock <= props.safetyStock) return '预警'
  if (props.currentStock >= props.maxStock * 0.9) return '接近上限'
  return '正常'
})

const suggestionType = computed(() => {
  if (props.currentStock <= props.minStock) return 'error'
  if (props.currentStock <= props.safetyStock) return 'warning'
  if (props.currentStock >= props.maxStock * 0.9) return 'info'
  return 'success'
})

const suggestion = computed(() => {
  if (props.currentStock <= props.minStock) {
    return '库存已低于最小库存，建议立即补货'
  }
  if (props.currentStock <= props.safetyStock) {
    return '库存已低于安全库存，建议尽快补货'
  }
  if (props.currentStock >= props.maxStock * 0.9) {
    return '库存接近上限，注意库存积压风险'
  }
  return '库存水位正常'
})
</script>

<style scoped>
.stock-level-component {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-level-visual {
  padding: 20px 40px;
}

.level-container {
  position: relative;
  height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #f5f7fa;
}

.level-bar-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 20px;
}

.level-bar {
  width: 80%;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 10px;
}

.bar-label {
  color: white;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.level-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: #909399;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}

.level-line.max-line {
  top: 0;
  background: #409eff;
}

.level-line.safety-line {
  background: #e6a23c;
}

.level-line.min-line {
  bottom: 0;
  background: #f56c6c;
}

.line-label {
  font-size: 12px;
  color: #606266;
  background: white;
  padding: 2px 6px;
  border-radius: 2px;
}

.line-value {
  font-size: 12px;
  font-weight: bold;
  color: #303133;
  background: white;
  padding: 2px 6px;
  border-radius: 2px;
}

.stock-info {
  margin-top: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}
</style>
