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
          <p>请选择下方部门进入对应的工作台。</p>
        </div>
      </el-card>

      <!-- 各部门首页菜单按钮 -->
      <el-card shadow="hover" class="department-card">
        <template #header>
          <div class="card-header">
            <span>部门工作台</span>
          </div>
        </template>
        <div class="department-grid">
          <div 
            v-for="(dept, index) in departments" 
            :key="index"
            class="department-item"
            @click="navigateToDepartment(dept.path)"
          >
            <div class="dept-icon" :style="{ backgroundColor: dept.color }">
              <el-icon :size="32"><component :is="dept.icon" /></el-icon>
            </div>
            <div class="dept-name">{{ dept.name }}</div>
            <div class="dept-desc">{{ dept.desc }}</div>
          </div>
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
import { 
  User, 
  BrainFilled, 
  DataAnalysis, 
  TrendCharts, 
  Promotion, 
  SuccessFilled 
} from '@element-plus/icons-vue';

export default {
  name: 'Dashboard',
  components: {
    User,
    BrainFilled,
    DataAnalysis,
    TrendCharts,
    Promotion,
    SuccessFilled
  },
  setup() {
    const router = useRouter();
    
    // 部门列表
    const departments = [
      {
        name: '人事部',
        desc: 'HR工作台',
        path: '/dashboard/hr',
        icon: 'User',
        color: '#409EFF'
      },
      {
        name: '智脑',
        desc: 'AI智能工作台',
        path: '/dashboard/ai',
        icon: 'BrainFilled',
        color: '#9C27B0'
      },
      {
        name: '技术/研发/设计',
        desc: 'R&D工作台',
        path: '/dashboard/rd',
        icon: 'DataAnalysis',
        color: '#00BCD4'
      },
      {
        name: '绩效',
        desc: 'KPI管理工作台',
        path: '/dashboard/kpi',
        icon: 'TrendCharts',
        color: '#FF9800'
      },
      {
        name: '销售部',
        desc: '销售管理工作台',
        path: '/dashboard/sales',
        icon: 'Promotion',
        color: '#4CAF50'
      },
      {
        name: '品保部',
        desc: '质量管理工作台',
        path: '/dashboard/quality',
        icon: 'SuccessFilled',
        color: '#F44336'
      }
    ];
    
    const handleLogout = () => {
      // 清除登录信息
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      
      // 跳转到登录页面
      router.push('/auth/login');
      ElMessage.success('已成功退出登录');
    };

    const navigateToDepartment = (path) => {
      router.push(path);
    };
    
    return {
      departments,
      handleLogout,
      navigateToDepartment
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

.card-header {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

/* 部门网格布局 */
.department-card {
  margin-bottom: 20px;
}

.department-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 10px 0;
}

.department-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  border-radius: 8px;
  background-color: #fff;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.department-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #409EFF;
}

.dept-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.department-item:hover .dept-icon {
  transform: scale(1.1);
}

.dept-name {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.dept-desc {
  font-size: 14px;
  color: #909399;
  text-align: center;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .department-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .department-item {
    padding: 20px 15px;
  }
  
  .dept-icon {
    width: 60px;
    height: 60px;
  }
  
  .dept-name {
    font-size: 16px;
  }
  
  .dept-desc {
    font-size: 12px;
  }
}
</style>