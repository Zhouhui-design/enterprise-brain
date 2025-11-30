<template>
  <div class="login-page">
    <div class="login-box">
      <h2>企业大脑系统</h2>
      <p class="subtitle">登录您的账户</p>
      
      <div class="form-group">
        <label>用户名</label>
        <input v-model="username" type="text" placeholder="admin" class="input-field" @keyup.enter="handleLogin" />
      </div>
      
      <div class="form-group">
        <label>密码</label>
        <input v-model="password" type="password" placeholder="password" class="input-field" @keyup.enter="handleLogin" />
      </div>
      
      <button @click="handleLogin" class="login-btn" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
      
      <p class="tip">提示：用户名/密码为 admin/password</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    alert('请输入用户名和密码')
    return
  }
  
  loading.value = true
  
  setTimeout(() => {
    if (username.value === 'admin' && password.value === 'password') {
      localStorage.setItem('token', 'mock-token-' + Date.now())
      localStorage.setItem('userInfo', JSON.stringify({
        username: username.value,
        roles: ['admin']
      }))
      
      router.push('/dashboard/home')
    } else {
      alert('用户名或密码错误')
    }
    loading.value = false
  }, 300)
}
</script>

<style scoped>
.login-page {
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
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.login-box h2 {
  text-align: center;
  margin-bottom: 10px;
  font-size: 28px;
  color: #303133;
}

.subtitle {
  text-align: center;
  margin-bottom: 30px;
  color: #606266;
  font-size: 16px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-weight: 500;
}

.input-field {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #409EFF;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #409EFF;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.login-btn:hover {
  background: #66b1ff;
}

.login-btn:disabled {
  background: #a0cfff;
  cursor: not-allowed;
}

.tip {
  text-align: center;
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
}
</style>
