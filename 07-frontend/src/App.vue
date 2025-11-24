<template>
  <!-- 路由出口：所有页面都会渲染到这里 -->
  <router-view />
</template>

<script setup lang="ts">
// 暂时注释组件导入，先确保路由正常
// import Navbar from '@/components/common/Navbar.vue';
// import Sidebar from '@/components/common/Sidebar.vue';
// import Footer from '@/components/common/Footer.vue';
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}
</style>
