<template>
  <div class="hr-dashboard-container">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>人事部工作台</el-breadcrumb-item>
      </el-breadcrumb>
      <h1>人事部工作台</h1>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon primary">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">326</div>
              <div class="stat-label">在职员工</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon :size="32"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">12</div>
              <div class="stat-label">本月入职</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon :size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">3</div>
              <div class="stat-label">本月离职</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon info">
              <el-icon :size="32"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">15</div>
              <div class="stat-label">待审批假条</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 功能模块 -->
    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <span>快捷功能</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="handleAction('addEmployee')">录入新员工</el-button>
            <el-button type="success" @click="handleAction('attendance')">考勤管理</el-button>
            <el-button type="warning" @click="handleAction('leave')">请假审批</el-button>
            <el-button type="info" @click="handleAction('training')">培训管理</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card shadow="hover" class="content-card">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <div class="todo-list">
            <div v-for="(item, index) in todoItems" :key="index" class="todo-item">
              <el-icon class="todo-icon"><CircleCheck /></el-icon>
              <span>{{ item }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus';
import { 
  User, 
  UserFilled, 
  Warning, 
  Calendar,
  CircleCheck
} from '@element-plus/icons-vue';

export default {
  name: 'HRDashboard',
  components: {
    User,
    UserFilled,
    Warning,
    Calendar,
    CircleCheck
  },
  data() {
    return {
      todoItems: [
        '审批张三的入职申请',
        '处理李四的转正评估',
        '完成本月考勤统计',
        '准备下周新员工培训',
        '更新员工花名册'
      ]
    };
  },
  methods: {
    handleAction(action) {
      ElMessage.info(`${action} 功能开发中...`);
    }
  }
};
</script>

<style scoped>
.hr-dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #303133;
  margin-top: 10px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: #fff;
}

.stat-icon.primary {
  background-color: #409EFF;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.info {
  background-color: #909399;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.content-row {
  margin-bottom: 20px;
}

.content-card {
  min-height: 300px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px 0;
}

.quick-actions .el-button {
  justify-content: flex-start;
}

.todo-list {
  padding: 10px 0;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-icon {
  color: #67C23A;
  margin-right: 10px;
  font-size: 18px;
}
</style>
