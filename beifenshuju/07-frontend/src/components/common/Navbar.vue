<template>
  <el-header class="navbar">
    <el-row :gutter="20" class="navbar-row">
      <el-col :span="6" class="navbar-logo">
        <el-icon class="logo-icon"><Brain /></el-icon>
        <span class="logo-text">企业智能管理系统</span>
      </el-col>
      <el-col :span="12" class="navbar-menu">
        <el-menu :default-active="activeMenu" mode="horizontal" class="menu-horizontal">
          <el-menu-item index="/dashboard">首页</el-menu-item>
          <el-sub-menu index="/oa">
            <template #title>OA办公</template>
            <el-menu-item index="/oa/document">文档中心</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/company/intro">企业简介</el-menu-item>
        </el-menu>
      </el-col>
      <el-col :span="6" class="navbar-user">
        <el-dropdown placement="bottom">
          <span class="user-info">
            <el-avatar icon="User" class="user-avatar"></el-avatar>
            <span class="user-name">管理员</span>
            <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item index="1">
                <el-icon><User /></el-icon>
                <span>个人中心</span>
              </el-dropdown-item>
              <el-dropdown-item index="3" @click="handleLogout">
                <el-icon><Logout /></el-icon>
                <span>退出登录</span>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-col>
    </el-row>
  </el-header>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Brain, ArrowDown, User, Logout } from '@element-plus/icons-vue';

const router = useRouter();
const activeMenu = ref('/dashboard');

const handleLogout = () => {
  router.push('/auth/login');
};
</script>

<style scoped>
.navbar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
}
.navbar-row {
  height: 100%;
  align-items: center;
}
.navbar-logo {
  display: flex;
  align-items: center;
}
.logo-icon {
  font-size: 24px;
  color: #1989fa;
  margin-right: 10px;
}
.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #1989fa;
}
.navbar-user {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}
.user-avatar {
  margin-right: 10px;
}
</style>
