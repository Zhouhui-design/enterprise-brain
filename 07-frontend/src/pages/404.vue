<template>
  <div class="not-found">
    <div class="error-container">
      <div class="error-code">404</div>
      <div class="error-message">页面未找到</div>
      <div class="error-description">
        抱歉，您访问的页面 <code class="error-path">{{ currentPath }}</code> 不存在
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" @click="goHome" size="large">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack" size="large">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
        <el-button type="info" @click="reloadPage" size="large">
          <el-icon><Refresh /></el-icon>
          刷新页面
        </el-button>
      </div>
      
      <div class="help-links">
        <p>您可能在寻找：</p>
        <div class="link-list">
          <el-link @click="$router.push('/dashboard')" type="primary">系统首页</el-link>
          <el-link @click="$router.push('/sales/simulation-scheduling/list')" type="primary">模拟排程列表</el-link>
          <el-link @click="$router.push('/sales/orders/list')" type="primary">销售订单</el-link>
          <el-link @click="$router.push('/material/list')" type="primary">产品物料库</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { House, ArrowLeft, Refresh } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const currentPath = ref('')

onMounted(() => {
  currentPath.value = route.path
})

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

const reloadPage = () => {
  window.location.reload()
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.error-container {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #f56c6c;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  animation: bounce 2s infinite;
}

.error-message {
  font-size: 32px;
  color: #303133;
  margin-bottom: 16px;
  font-weight: 600;
}

.error-description {
  font-size: 16px;
  color: #606266;
  margin-bottom: 40px;
  line-height: 1.6;
}

.error-path {
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #e6a23c;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  min-width: 120px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-links {
  border-top: 1px solid #e4e7ed;
  padding-top: 30px;
}

.help-links p {
  color: #909399;
  margin-bottom: 16px;
  font-size: 14px;
}

.link-list {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.link-list .el-link {
  font-size: 14px;
  transition: all 0.3s ease;
}

.link-list .el-link:hover {
  transform: translateY(-2px);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@media (max-width: 768px) {
  .error-container {
    padding: 40px 20px;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-message {
    font-size: 24px;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .action-buttons .el-button {
    width: 200px;
  }
  
  .link-list {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
