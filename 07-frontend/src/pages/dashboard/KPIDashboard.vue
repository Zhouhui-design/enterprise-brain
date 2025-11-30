<template>
  <div class="kpi-dashboard-container">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard/home' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>绩效管理工作台</el-breadcrumb-item>
      </el-breadcrumb>
      <h1>绩效管理工作台</h1>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon primary">
              <el-icon :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">85%</div>
              <div class="stat-label">本月完成率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon :size="32"><SuccessFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">156</div>
              <div class="stat-label">已完成目标</div>
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
              <div class="stat-value">23</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon info">
              <el-icon :size="32"><Histogram /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">4.2</div>
              <div class="stat-label">平均分</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="content-card">
      <template #header>
        <div class="card-header">
          <span>绩效概览</span>
        </div>
      </template>
      <div class="empty-content">
        <p>详细功能开发中...</p>
      </div>
    </el-card>
  </div>
</template>

<script>
import { 
  TrendCharts, 
  SuccessFilled, 
  Warning, 
  Histogram 
} from '@element-plus/icons-vue';

export default {
  name: 'KPIDashboard',
  components: {
    TrendCharts,
    SuccessFilled,
    Warning,
    Histogram
  }
};
</script>

<style scoped>
.kpi-dashboard-container {
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
  background-color: #FF9800;
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

.content-card {
  min-height: 300px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.empty-content {
  text-align: center;
  padding: 50px 0;
  color: #909399;
}
</style>
