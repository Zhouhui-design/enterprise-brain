<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>欢迎使用系统</h1>
      <el-button type="primary" @click="handleLogout">退出登录</el-button>
    </header>
    
    <main class="dashboard-content">
      <el-card shadow="hover" class="welcome-card">
        <template #header>
          <div class="card-header">
            <span>欢迎消息</span>
          </div>
        </template>
        <div class="welcome-content">
          <p>尊敬的管理员，您已成功登录系统！</p>
          <p>这是系统的首页，您可以从这里访问各项功能。</p>
        </div>
      </el-card>
      
      <div class="stats-container">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-number">100+</div>
            <div class="stat-label">用户数量</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-number">500+</div>
            <div class="stat-label">数据记录</div>
          </div>
        </el-card>
        <el-card shadow="hover" class="stat-card">
          <div class="stat-item">
            <div class="stat-number">99.9%</div>
            <div class="stat-label">系统可用性</div>
          </div>
        </el-card>
      </div>
    </main>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

export default {
  name: 'Dashboard',
  setup() {
    const router = useRouter();
    
    const handleLogout = () => {
      // 清除登录信息
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
      // 跳转到登录页面
      router.push('/auth/login');
      ElMessage.success('已成功退出登录');
    };
    
    return {
      handleLogout
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  padding: 20px 0;
}

.welcome-content p {
  margin: 10px 0;
  font-size: 16px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #1890ff;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
}
</style>