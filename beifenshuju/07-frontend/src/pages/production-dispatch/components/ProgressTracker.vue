<template>
  <div class="progress-tracker">
    <div class="tracker-header">
      <h3 class="tracker-title">{{ title }}</h3>
      <div class="tracker-stats">
        <el-statistic :value="totalTasks" :precision="0" label="总任务" />
        <el-statistic :value="completedTasks" :precision="0" label="已完成" :value-style="{ color: '#67c23a' }" />
        <el-statistic :value="inProgressTasks" :precision="0" label="进行中" :value-style="{ color: '#409eff' }" />
        <el-statistic :value="pendingTasks" :precision="0" label="待开始" :value-style="{ color: '#e6a23c' }" />
      </div>
    </div>
    
    <div class="tracker-content">
      <!-- 进度条概览 -->
      <div class="progress-overview">
        <div class="progress-bar-container">
          <div class="progress-label">总体进度</div>
          <el-progress 
            :percentage="overallProgress" 
            :format="progressFormat" 
            :color="getOverallProgressColor(overallProgress)"
            :show-text="true"
          />
        </div>
      </div>
      
      <!-- 时间线进度 -->
      <div class="timeline-section" v-if="progressItems.length > 0">
        <h4 class="section-title">执行进度</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(item, index) in progressItems"
            :key="index"
            :timestamp="formatTime(item.timestamp)"
            :type="getItemType(item.type)"
            :icon="getItemIcon(item.type)"
          >
            <div class="timeline-content">
              <h5 class="content-title">{{ item.title }}</h5>
              <p class="content-desc">{{ item.description }}</p>
              <div class="content-details" v-if="item.details && Object.keys(item.details).length > 0">
                <div class="detail-item" v-for="(value, key) in item.details" :key="key">
                  <span class="detail-key">{{ key }}：</span>
                  <span class="detail-value">{{ value }}</span>
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <!-- 进度详情表格 -->
      <div class="details-section" v-if="details.length > 0">
        <h4 class="section-title">任务明细</h4>
        <el-table :data="details" style="width: 100%" stripe size="small">
          <el-table-column prop="processName" label="工序名称" min-width="120" />
          <el-table-column prop="workerName" label="执行人员" min-width="80" />
          <el-table-column prop="plannedQuantity" label="计划数量" width="80" align="right" />
          <el-table-column prop="completedQuantity" label="完成数量" width="80" align="right" />
          <el-table-column label="完成率" width="100">
            <template #default="scope">
              <div class="cell-progress">
                <el-progress 
                  :percentage="calculateCompletionRate(scope.row)" 
                  :show-text="false" 
                  :color="getCompletionColor(calculateCompletionRate(scope.row))"
                />
                <span class="progress-text">{{ calculateCompletionRate(scope.row) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" min-width="140" :formatter="formatDate" />
          <el-table-column prop="endTime" label="结束时间" min-width="140" :formatter="formatDate" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Check, Operation, Clock, Close } from '@element-plus/icons-vue';

// Props
const props = defineProps({
  title: {
    type: String,
    default: '进度跟踪'
  },
  totalTasks: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  inProgressTasks: {
    type: Number,
    default: 0
  },
  pendingTasks: {
    type: Number,
    default: 0
  },
  progressItems: {
    type: Array,
    default: () => []
  },
  details: {
    type: Array,
    default: () => []
  }
});

// 计算属性：总体进度
const overallProgress = computed(() => {
  if (props.totalTasks === 0) return 0;
  return Math.round((props.completedTasks / props.totalTasks) * 100);
});

// 方法：格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 方法：格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 方法：获取总体进度颜色
const getOverallProgressColor = (progress) => {
  if (progress >= 100) return '#67c23a';
  if (progress >= 75) return '#409eff';
  if (progress >= 50) return '#e6a23c';
  return '#f56c6c';
};

// 方法：进度条格式化
const progressFormat = (percentage) => {
  return `${percentage}%`;
};

// 方法：获取时间线项目类型
const getItemType = (type) => {
  const typeMap = {
    'START': 'primary',
    'PROGRESS': 'info',
    'COMPLETE': 'success',
    'ISSUE': 'warning',
    'CANCEL': 'danger'
  };
  return typeMap[type] || 'default';
};

// 方法：获取时间线项目图标
const getItemIcon = (type) => {
  const iconMap = {
    'START': Clock,
    'PROGRESS': Operation,
    'COMPLETE': Check,
    'ISSUE': WarningFilled,
    'CANCEL': Close
  };
  return iconMap[type] || Clock;
};

// 方法：计算完成率
const calculateCompletionRate = (row) => {
  if (!row.plannedQuantity || row.plannedQuantity === 0) return 0;
  return Math.round((row.completedQuantity / row.plannedQuantity) * 100);
};

// 方法：获取完成率颜色
const getCompletionColor = (rate) => {
  if (rate >= 100) return '#67c23a';
  if (rate >= 75) return '#409eff';
  if (rate >= 50) return '#e6a23c';
  return '#f56c6c';
};

// 方法：获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'PENDING': '待开始',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  };
  return statusMap[status] || '未知';
};

// 方法：获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    'PENDING': 'info',
    'IN_PROGRESS': 'primary',
    'COMPLETED': 'success',
    'CANCELLED': 'danger'
  };
  return typeMap[status] || 'default';
};
</script>

<style scoped>
.progress-tracker {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tracker-header {
  margin-bottom: 20px;
}

.tracker-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
}

.tracker-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.progress-overview {
  margin-bottom: 24px;
}

.progress-bar-container {
  margin-bottom: 12px;
}

.progress-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.timeline-section,
.details-section {
  margin-top: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 16px;
}

.timeline-content {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.content-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.content-desc {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.content-details {
  background-color: #fff;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-item {
  display: flex;
  margin-bottom: 4px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-key {
  color: #909399;
  margin-right: 4px;
}

.detail-value {
  color: #303133;
  font-weight: 500;
}

.cell-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 35px;
}
</style>