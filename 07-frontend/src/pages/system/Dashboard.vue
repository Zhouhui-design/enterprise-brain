<template>
  <div class="dashboard-container">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="logo">
        <span>企业管理系统</span>
      </div>
      <nav class="main-nav">
        <ul>
          <li class="active">首页</li>
          <li>系统设置</li>
          <li>帮助中心</li>
        </ul>
      </nav>
      <div class="user-menu">
        <el-avatar icon="User" class="avatar"></el-avatar>
        <span class="user-name">管理员</span>
      </div>
    </header>

    <!-- 主体内容区 -->
    <main class="main-content">
      <div class="page-header">
        <h1>系统概览</h1>
        <p>欢迎回来，今天是 {{ currentDate }}</p>
      </div>

      <!-- 功能按钮区域 -->
      <div class="function-buttons">
        <!-- 人事管理按钮 -->
        <el-button 
          type="primary" 
          size="large" 
          class="hr-management-btn"
          @click="navigateToUserList"
        >
          <el-icon><User /></el-icon>
          <span>人事管理</span>
        </el-button>
        
        <!-- 其他功能按钮 -->
        <el-button size="large">
          <el-icon><Document /></el-icon>
          <span>文档中心</span>
        </el-button>
        <el-button size="large">
          <el-icon><Setting /></el-icon>
          <span>系统配置</span>
        </el-button>
      </div>

      <!-- 数据卡片区域 -->
      <div class="stats-cards">
        <el-card class="stat-card">
          <div class="stat-title">总用户数</div>
          <div class="stat-value">246</div>
          <div class="stat-trend">↑ 5% 较上月</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-title">部门数量</div>
          <div class="stat-value">12</div>
          <div class="stat-trend">→ 持平</div>
        </el-card>
        <el-card class="stat-card">
          <div class="stat-title">今日新增</div>
          <div class="stat-value">3</div>
          <div class="stat-trend">↑ 1 较昨日</div>
        </el-card>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="page-footer">
      <p>© 2023 企业管理系统 - 版权所有</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { User, Document, Setting } from '@element-plus/icons-vue';

const router = useRouter();
const currentDate = ref('');

// 格式化当前日期
onMounted(() => {
  const date = new Date();
  currentDate.value = date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
});

// 导航到人事管理页面
const navigateToUserList = () => {
  router.push('/pages/system/user-management/UserList');
};
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

/* 顶部导航 */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.logo {
  font-size: 18px;
  font-weight: bold;
  color: #165DFF;
}

.main-nav ul {
  display: flex;
  list-style: none;
  gap: 30px;
}

.main-nav li {
  cursor: pointer;
  padding: 5px 0;
  position: relative;
}

.main-nav li.active {
  color: #165DFF;
}

.main-nav li.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #165DFF;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 主体内容 */
.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

/* 功能按钮区域 */
.function-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.hr-management-btn {
  background-color: #165DFF;
}

/* 数据卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  padding: 20px;
  background-color: #fff;
}

.stat-title {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-trend {
  font-size: 12px;
}

.stat-trend[class*="↑"] {
  color: #00B42A;
}

/* 页脚 */
.page-footer {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #666;
}
</style>

