<template>
  <div class="user-role-container">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/system/user-management' }">用户管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色分配</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card style="margin-top: 20px;">
      <div class="user-info">
        <p>用户名: {{ userInfo.username }}</p>
        <p>真实姓名: {{ userInfo.realName }}</p>
      </div>

      <el-divider content-position="left">分配角色</el-divider>

      <el-form ref="roleForm" :model="roleForm">
        <el-form-item label="可选角色">
          <role-selector 
            v-model="roleForm.roleIds" 
            :multiple="true"
          ></role-selector>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">保存</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import RoleSelector from './components/RoleSelector.vue'
import { getUserById, assignUserRoles } from '@/services/api/userService'

const router = useRouter()
const route = useRoute()
const userId = route.query.id

const userInfo = ref({})
const roleForm = reactive({
  roleIds: []
})

// 获取用户信息
const loadUserInfo = async () => {
  try {
    const res = await getUserById(userId)
    userInfo.value = res.data
    roleForm.roleIds = res.data.roleIds || []
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
}

onMounted(() => {
  loadUserInfo()
})

// 提交分配
const handleSubmit = async () => {
  try {
    await assignUserRoles(userId, roleForm.roleIds)
    ElMessage.success('角色分配成功')
    router.push('/system/user-management')
  } catch (err) {
    ElMessage.error('角色分配失败')
  }
}

// 取消
const handleCancel = () => {
  router.back()
}
</script>

<style scoped>
.user-role-container {
  padding: 20px;
}

.user-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>
