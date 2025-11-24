<template>
  <div class="user-create-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/system/user-management' }">用户管理</el-breadcrumb-item>
      <el-breadcrumb-item>新增用户</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card style="margin-top: 20px;">
      <el-form 
        ref="userForm" 
        :model="userForm" 
        :rules="rules" 
        label-width="120px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="userForm.realName" placeholder="请输入真实姓名"></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="userForm.password" 
            type="password" 
            placeholder="请输入密码"
          ></el-input>
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="userForm.confirmPassword" 
            type="password" 
            placeholder="请确认密码"
          ></el-input>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>

        <el-form-item label="所属角色" prop="roleIds">
          <role-selector v-model="userForm.roleIds"></role-selector>
        </el-form-item>

        <el-form-item label="状态">
          <el-radio-group v-model="userForm.status">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import RoleSelector from './components/RoleSelector.vue'
import { createUser } from '@/services/api/userService'

const router = useRouter()
const userForm = reactive({
  username: '',
  realName: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: '',
  roleIds: [],
  status: '1'
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3-20 个字符', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6-20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== userForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { 
      pattern: /^1[3-9]\d{9}$/, 
      message: '请输入正确的手机号', 
      trigger: 'blur' 
    }
  ],
  email: [
    { 
      type: 'email', 
      message: '请输入正确的邮箱格式', 
      trigger: ['blur', 'change'] 
    }
  ],
  roleIds: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const userFormRef = ref(null)

// 提交表单
const handleSubmit = async () => {
  try {
    await userFormRef.value.validate()
    await createUser(userForm)
    ElMessage.success('用户创建成功')
    router.push('/system/user-management')
  } catch (err) {
    if (err.name !== 'ValidationError') {
      ElMessage.error('用户创建失败')
    }
  }
}

// 取消
const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.user-create-container {
  padding: 20px;
}
</style>
