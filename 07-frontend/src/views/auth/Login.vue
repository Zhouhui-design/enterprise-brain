<template>
  <el-container class="login-container">
    <el-card shadow="hover" class="login-card">
      <h2 class="login-title">系统登录</h2>
      <el-form 
        :model="loginForm" 
        label-width="80px"
        :rules="loginRules"
        ref="loginFormRef"
        autocomplete="off"
      >
        <el-form-item label="用户名" required prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            :disabled="isLoading"
            autocomplete="username"
          ></el-input>
        </el-form-item>
        <el-form-item label="密码" required prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            :disabled="isLoading"
            autocomplete="current-password"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleLogin" 
            style="width: 100%"
            :loading="isLoading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { FormInstance } from 'element-plus';

// 本地模拟API类型定义（避免模块导入错误）
interface LoginParams {
  username: string;
  password: string;
}

interface LoginResult {
  token: string;
  username: string;
  role: string;
}

// 本地模拟登录接口（无需依赖外部API文件，解决模块找不到问题）
const mockLogin = (params: LoginParams): Promise<LoginResult> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (params.username === '周辉' && params.password === '000000') {
        resolve({
          token: 'super_admin_token',
          username: '周辉',
          role: 'super_admin'
        });
      } else {
        reject(new Error('用户名或密码错误'));
      }
    }, 500);
  });
};

const router = useRouter();
const loginFormRef = ref<FormInstance>();
const isLoading = ref(false);

// 登录表单数据
const loginForm = reactive<LoginParams>({
  username: '',
  password: ''
});

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2到20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
  ]
};

// 登录处理函数
const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  try {
    // 表单验证
    await loginFormRef.value.validate();
  } catch (error) {
    return; // 验证失败终止
  }

  isLoading.value = true;

  try {
    // 调用本地模拟登录接口（无需外部依赖）
    const response = await mockLogin(loginForm);
    
    // 存储登录状态（使用localStorage匹配路由守卫）
    localStorage.setItem('token', response.token);
    localStorage.setItem('username', response.username);
    localStorage.setItem('role', response.role);
    
    ElMessage.success(`登录成功！欢迎您，${response.role === 'super_admin' ? '超级管理员' : '用户'}`);
    
    // 清空密码提升安全性
    loginForm.password = '';
    
    // 跳转到dashboard（避免'/'重定向循环）
    router.push('/dashboard');
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败，请稍后再试');
    console.error('登录错误:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}
.login-card {
  width: 400px;
  padding: 20px;
  box-sizing: border-box;
}
.login-title {
  text-align: center;
  margin-bottom: 20px;
  color: #1989fa;
  font-size: 1.5rem;
  font-weight: 600;
}
:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f5f5;
  cursor: not-allowed;
}
:deep(.el-form-item__error) {
  text-align: left;
}
</style>
