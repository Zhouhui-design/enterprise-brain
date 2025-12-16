<template>
  <el-container class="forgot-container">
    <el-card shadow="hover" class="forgot-card">
      <h2 class="forgot-title">忘记密码</h2>
      <el-form :model="forgotForm" label-width="80px">
        <el-form-item label="用户名" required>
          <el-input v-model="forgotForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleReset" style="width: 100%">重置密码</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const forgotForm = ref({
  username: ''
});

const handleReset = () => {
  router.push('/auth/login');
};
</script>

<style scoped>
.forgot-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}
.forgot-card {
  width: 400px;
  padding: 20px;
}
.forgot-title {
  text-align: center;
  margin-bottom: 20px;
  color: #1989fa;
}
</style>
