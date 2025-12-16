<template>
  <el-container class="register-container">
    <el-card shadow="hover" class="register-card">
      <h2 class="register-title">用户注册</h2>
      <el-form :model="registerForm" label-width="80px">
        <el-form-item label="用户名" required>
          <el-input v-model="registerForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleRegister" style="width: 100%">注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const registerForm = ref({
  username: '',
  password: ''
});

const handleRegister = () => {
  router.push('/auth/login');
};
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}
.register-card {
  width: 400px;
  padding: 20px;
}
.register-title {
  text-align: center;
  margin-bottom: 20px;
  color: #1989fa;
}
</style>
