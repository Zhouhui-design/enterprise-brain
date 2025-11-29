<template>
  <div class="login-container">
    <div class="login-box">
      <h2 class="login-title">企业大脑系统</h2>
      <div class="login-subtitle">登录您的账户</div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="left"
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            type="text"
            clearable
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            type="password"
            show-password
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <div class="login-info">
          <span>提示：默认用户名/密码为 admin/password</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';

export default {
  name: 'Login',
  components: {
    User,
    Lock
  },
  setup() {
    const router = useRouter();
    const loginFormRef = ref(null);
    const loading = ref(false);
    
    // 用户名和密码绑定值
    const loginForm = reactive({
      username: '',
      password: ''
    });
    
    const rules = {
      username: [
        { required: true, message: '请输入用户名', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' }
      ]
    };
    
    const handleLogin = async () => {
      try {
        await loginFormRef.value.validate();
        loading.value = true;
        
        // 模拟登录请求延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 验证用户名密码是否与绑定值一致（admin/password）
        if (loginForm.username === 'admin' && loginForm.password === 'password') {
          // 登录成功，存储token和用户信息
          localStorage.setItem('token', 'mock-token-' + Date.now());
          localStorage.setItem('userInfo', JSON.stringify({
            username: loginForm.username,
            roles: ['admin'],
            permissions: ['*:*:*']
          }));
          
          // 获取重定向地址，如果没有则跳转到dashboard
          const redirect = router.currentRoute.value.query.redirect || '/dashboard/home';
          router.push(redirect);
          ElMessage.success('登录成功');
        } else {
          ElMessage.error('用户名或密码错误');
        }
        
        loading.value = false;
      } catch (error) {
        console.error('登录失败', error);
        loading.value = false;
        ElMessage.error('登录失败，请重试');
      }
    };
    
    return {
      loginFormRef,
      loading,
      loginForm,
      rules,
      handleLogin
    };
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  transition: transform 0.3s ease;
}

.login-box:hover {
  transform: translateY(-5px);
}

.login-title {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  text-align: center;
}

.login-subtitle {
  font-size: 16px;
  color: #606266;
  margin-bottom: 30px;
  text-align: center;
}

.login-form {
  margin-bottom: 20px;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.login-form .el-form-item__label {
  font-weight: 500;
  color: #606266;
}

.login-form .el-input {
  width: 100%;
}

.login-btn {
  margin-top: 10px;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
}

.login-info {
  font-size: 14px;
  color: #909399;
  margin-top: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-box {
    padding: 30px 20px;
    margin: 10px;
  }
  
  .login-title {
    font-size: 24px;
  }
  
  .login-subtitle {
    font-size: 14px;
  }
}
</style>