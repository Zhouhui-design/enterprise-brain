<template>
  <el-footer class="footer">
    <div class="footer-content">
      <div class="footer-left">
        <p>© 2025 企业智能管理系统 版权所有</p>
      </div>
      <div class="footer-right">
        <el-link type="text" @click="goToPath('/company/intro')">企业简介</el-link>
        <el-link type="text" @click="goToPath('/company/contact')">联系方式</el-link>
      </div>
    </div>
  </el-footer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goToPath = (path: string) => {
  router.push(path);
};
</script>

<style scoped>
.footer {
  background-color: #f8f9fa;
  border-top: 1px solid #e5e7eb;
  padding: 0 20px;
}
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  color: #666;
  font-size: 14px;
}
.footer-right {
  display: flex;
  gap: 20px;
}
</style>
