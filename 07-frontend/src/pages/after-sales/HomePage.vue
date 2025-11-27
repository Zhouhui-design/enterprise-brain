<!-- src/views/HomePage.vue -->
<template>
  <div class="home-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h1>系统管理平台</h1>
      <p>欢迎使用企业级业务管理系统</p>
    </div>

    <!-- 菜单卡片区域 - 展示所有一级菜单 -->
    <div class="menu-cards">
      <div 
        v-for="(menu, index) in firstLevelMenus" 
        :key="index" 
        class="menu-card"
        @click="handleMenuClick(menu)"
      >
        <div class="menu-icon">
          <component :is="menu.icon" />
        </div>
        <div class="menu-info">
          <h3>{{ menu.name }}</h3>
          <p>{{ menu.desc || '点击进入该模块' }}</p>
        </div>
        <el-icon class="arrow-icon"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 系统统计信息 -->
    <div class="system-stats" v-if="showStats">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, i) in stats" :key="i">
          <el-card>
            <div class="stat-item">
              <p class="stat-label">{{ stat.label }}</p>
              <p class="stat-value">{{ stat.value }}</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight } from '@element-plus/icons-vue';
// 导入菜单配置（与侧边栏共用同一配置）
import menuList from '@/utils/menu.ts';
// 导入所有可能用到的图标（根据实际menu.ts中的图标调整）
import * as Icons from '@element-plus/icons-vue';

const router = useRouter();

// 获取所有一级菜单（不包含子菜单的顶级菜单）
const firstLevelMenus = ref(menuList.filter(menu => !menu.isHidden));

// 系统统计信息（可根据实际业务调整）
const showStats = ref(true); // 控制是否显示统计信息
const stats = ref([
  { label: '总用户数', value: '1,284' },
  { label: '今日操作', value: '328' },
  { label: '活跃模块', value: '8' },
  { label: '系统状态', value: '正常' }
]);

/**
 * 处理菜单点击事件
 * @param menu 菜单对象，包含path属性用于跳转
 */
const handleMenuClick = (menu: any) => {
  // 如果有子菜单，跳转到第一个子菜单的路径
  if (menu.children && menu.children.length > 0) {
    router.push(menu.children[0].path);
  } else {
    router.push(menu.path);
  }
};
</script>

<style scoped>
.home-container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

.page-header h1 {
  font-size: 28px;
  color: #1d2129;
  margin-bottom: 10px;
}

.page-header p {
  color: #86909c;
  font-size: 16px;
}

.menu-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.menu-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.menu-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.menu-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #e8f3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: #1890ff;
}

.menu-info {
  flex: 1;
}

.menu-info h3 {
  font-size: 18px;
  margin-bottom: 5px;
  color: #1d2129;
}

.menu-info p {
  color: #86909c;
  font-size: 14px;
}

.arrow-icon {
  color: #c9cdD4;
  font-size: 16px;
}

.system-stats {
  margin-top: 30px;
}

.stat-item {
  padding: 15px 0;
}

.stat-label {
  color: #86909c;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1d2129;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .menu-cards {
    grid-template-columns: 1fr;
  }
  
  .system-stats .el-col {
    flex: 0 0 50% !important;
    max-width: 50% !important;
  }
}
</style>
