<template>
  <div class="rd-dashboard-container">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>技术/研发/设计工作台</el-breadcrumb-item>
      </el-breadcrumb>
      <h1>技术/研发/设计工作台</h1>
    </div>

    <el-card shadow="hover" class="empty-card">
      <div class="empty-content">
        <el-icon :size="80" color="#909399"><DataAnalysis /></el-icon>
        <h2>R&D工作台</h2>
        <p>功能开发中，敬请期待...</p>
      </div>
    </el-card>
  </div>
</template>

<script>
import { DataAnalysis } from '@element-plus/icons-vue';

export default {
  name: 'RDDashboard',
  components: {
    DataAnalysis
  }
};
</script>

<style scoped>
.rd-dashboard-container {
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

.empty-card {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
}

.empty-content h2 {
  font-size: 24px;
  color: #303133;
  margin: 20px 0 10px;
}

.empty-content p {
  font-size: 16px;
  color: #909399;
}
</style>
