<template>
  <el-card class="assignment-card" :body-style="{ padding: '16px' }">
    <div class="card-header">
      <div class="card-title">
        <span class="assignment-number">{{ assignment.assignmentNumber }}</span>
        <el-tag :type="getStatusType(assignment.status)">{{ getStatusText(assignment.status) }}</el-tag>
      </div>
      <div class="card-actions">
        <el-tooltip content="查看详情">
          <el-button size="small" type="primary" text @click="viewDetails">
            <el-icon><View /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="编辑">
          <el-button size="small" text @click="editAssignment" v-if="canEdit">
            <el-icon><Edit /></el-icon>
          </el-button>
        </el-tooltip>
        <el-tooltip content="取消">
          <el-button size="small" text danger @click="cancelAssignment" v-if="canCancel">
            <el-icon><Delete /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
    
    <div class="card-content">
      <div class="info-row">
        <span class="label">产品：</span>
        <span class="value">{{ assignment.productName }}</span>
      </div>
      <div class="info-row">
        <span class="label">工序：</span>
        <span class="value">{{ assignment.processName }}</span>
      </div>
      <div class="info-row">
        <span class="label">派工数量：</span>
        <span class="value">{{ assignment.quantity }} 件</span>
      </div>
      <div class="info-row">
        <span class="label">预计工时：</span>
        <span class="value">{{ assignment.expectedHours }} 小时</span>
      </div>
      <div class="info-row">
        <span class="label">开始时间：</span>
        <span class="value">{{ formatDate(assignment.startTime) }}</span>
      </div>
      <div class="info-row">
        <span class="label">截止时间：</span>
        <span class="value">{{ formatDate(assignment.endTime) }}</span>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="worker-info">
        <el-avatar :size="24" :src="assignment.workerAvatar || ''">{{ getWorkerInitial(assignment.workerName) }}</el-avatar>
        <span class="worker-name">{{ assignment.workerName }}</span>
        <span class="worker-workshop">{{ assignment.workshopName }}</span>
      </div>
      <div class="progress-info">
        <el-progress :percentage="assignment.progress" :format="progressFormat" :color="getProgressColor(assignment.progress)" />
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue';
import { View, Edit, Delete } from '@element-plus/icons-vue';

// Props
const props = defineProps({
  assignment: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      assignmentNumber: '',
      productName: '',
      processName: '',
      quantity: 0,
      expectedHours: 0,
      startTime: '',
      endTime: '',
      workerName: '',
      workerAvatar: '',
      workshopName: '',
      status: 'PENDING',
      progress: 0
    })
  }
});

// Emits
const emit = defineEmits(['view', 'edit', 'cancel']);

// 计算属性：是否可以编辑
const canEdit = computed(() => {
  return ['PENDING', 'IN_PROGRESS'].includes(props.assignment.status);
});

// 计算属性：是否可以取消
const canCancel = computed(() => {
  return ['PENDING', 'IN_PROGRESS'].includes(props.assignment.status);
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

// 方法：获取员工姓名首字母
const getWorkerInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0);
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

// 方法：获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage >= 100) return '#67c23a';
  if (percentage >= 50) return '#409eff';
  return '#e6a23c';
};

// 方法：进度条格式化
const progressFormat = (percentage) => {
  return `${percentage}%`;
};

// 方法：查看详情
const viewDetails = () => {
  emit('view', props.assignment);
};

// 方法：编辑派工
const editAssignment = () => {
  emit('edit', props.assignment);
};

// 方法：取消派工
const cancelAssignment = () => {
  emit('cancel', props.assignment);
};
</script>

<style scoped>
.assignment-card {
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.assignment-card:hover {
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignment-number {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.card-content {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  width: 80px;
  color: #909399;
  font-size: 14px;
}

.value {
  flex: 1;
  color: #303133;
  font-size: 14px;
}

.card-footer {
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.worker-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.worker-name {
  font-weight: bold;
  color: #303133;
}

.worker-workshop {
  color: #909399;
  font-size: 12px;
}

.progress-info {
  margin-top: 8px;
}
</style>