<template>
  <div class="broadcast-container">
    <h2 class="page-title">发送广播通知</h2>
    
    <el-card class="broadcast-form-card" :shadow="'hover'">
      <el-form 
        :model="broadcastForm" 
        :rules="formRules"
        ref="broadcastFormRef"
        label-width="120px"
        size="large"
      >
        <!-- 通知标题 -->
        <el-form-item label="通知标题" prop="title">
          <el-input 
            v-model="broadcastForm.title" 
            placeholder="请输入通知标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 通知内容 -->
        <el-form-item label="通知内容" prop="content">
          <el-input
            v-model="broadcastForm.content"
            type="textarea"
            placeholder="请输入通知内容"
            :rows="6"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <!-- 接收对象 -->
        <el-form-item label="接收对象" prop="receivers">
          <el-checkbox-group v-model="broadcastForm.receivers">
            <el-checkbox label="all" border>所有用户</el-checkbox>
            <el-checkbox label="department" border>按部门</el-checkbox>
            <el-checkbox label="role" border>按角色</el-checkbox>
            <el-checkbox label="user" border>指定用户</el-checkbox>
          </el-checkbox-group>
          
          <!-- 部门选择 -->
          <el-select
            v-if="broadcastForm.receivers.includes('department')"
            v-model="broadcastForm.departments"
            placeholder="选择部门"
            multiple
            style="width: 100%; margin-top: 10px;"
          >
            <el-option label="技术部" value="tech" />
            <el-option label="市场部" value="marketing" />
            <el-option label="销售部" value="sales" />
            <el-option label="财务部" value="finance" />
          </el-select>
          
          <!-- 角色选择 -->
          <el-select
            v-if="broadcastForm.receivers.includes('role')"
            v-model="broadcastForm.roles"
            placeholder="选择角色"
            multiple
            style="width: 100%; margin-top: 10px;"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="部门经理" value="manager" />
          </el-select>
          
          <!-- 用户选择 -->
          <el-select
            v-if="broadcastForm.receivers.includes('user')"
            v-model="broadcastForm.users"
            placeholder="选择用户"
            multiple
            style="width: 100%; margin-top: 10px;"
          >
            <el-option label="张三" value="user-001" />
            <el-option label="李四" value="user-002" />
            <el-option label="王五" value="user-003" />
          </el-select>
        </el-form-item>
        
        <!-- 通知类型 -->
        <el-form-item label="通知类型" prop="notificationTypes">
          <el-checkbox-group v-model="broadcastForm.notificationTypes">
            <el-checkbox label="system" border>系统通知</el-checkbox>
            <el-checkbox label="email" border>邮件</el-checkbox>
            <el-checkbox label="sms" border>短信</el-checkbox>
            <el-checkbox label="push" border>推送</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <!-- 发送时间 -->
        <el-form-item label="发送时间" prop="sendTime">
          <el-radio-group v-model="broadcastForm.sendType">
            <el-radio-button label="immediately">立即发送</el-radio-button>
            <el-radio-button label="scheduled">定时发送</el-radio-button>
          </el-radio-group>
          
          <el-date-picker
            v-if="broadcastForm.sendType === 'scheduled'"
            v-model="broadcastForm.sendTime"
            type="datetime"
            placeholder="选择发送时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabledDate"
            style="width: 100%; margin-top: 10px;"
          />
        </el-form-item>
        
        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" @click="handleSend" :loading="sending">发送通知</el-button>
          <el-button @click="handleReset">重置表单</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { notificationAPI } from '@/api'

const broadcastFormRef = ref()
const sending = ref(false)

// 广播通知表单
const broadcastForm = reactive({
  title: '',
  content: '',
  receivers: ['all'],
  departments: [],
  roles: [],
  users: [],
  notificationTypes: ['system'],
  sendType: 'immediately',
  sendTime: null
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { min: 5, max: 500, message: '内容长度在 5 到 500 个字符', trigger: 'blur' }
  ],
  receivers: [
    { required: true, message: '请选择接收对象', trigger: 'change' }
  ],
  notificationTypes: [
    { required: true, message: '请选择通知类型', trigger: 'change' }
  ],
  sendTime: [
    { required: broadcastForm.sendType === 'scheduled', message: '请选择发送时间', trigger: 'change' }
  ]
}

// 禁用过去的日期
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 8.64e6
}

// 发送通知
const handleSend = async () => {
  if (!broadcastFormRef.value) return
  
  try {
    await broadcastFormRef.value.validate()
    
    await ElMessageBox.confirm(
      '确定要发送此广播通知吗？发送后将无法撤回。',
      '发送确认',
      {
        confirmButtonText: '确定发送',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    sending.value = true
    await notificationAPI.sendBroadcast(broadcastForm)
    ElMessage.success('广播通知发送成功')
    handleReset()
  } catch (error) {
    if (error.name !== 'ElMessageError') {
      console.error('发送广播通知失败:', error)
      ElMessage.error('发送广播通知失败，请稍后重试')
    }
  } finally {
    sending.value = false
  }
}

// 重置表单
const handleReset = () => {
  if (broadcastFormRef.value) {
    broadcastFormRef.value.resetFields()
  }
  broadcastForm.receivers = ['all']
  broadcastForm.departments = []
  broadcastForm.roles = []
  broadcastForm.users = []
  broadcastForm.notificationTypes = ['system']
  broadcastForm.sendType = 'immediately'
  broadcastForm.sendTime = null
}
</script>

<style scoped>
.broadcast-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}

.broadcast-form-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-checkbox + .el-checkbox) {
  margin-left: 20px;
}
</style>