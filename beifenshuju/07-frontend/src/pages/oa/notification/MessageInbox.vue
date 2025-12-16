# 创建 MessageInbox.vue
cat > oa/notification/MessageInbox.vue <<'EOF'
<template>
  <div class="message-inbox">
    <h2>消息收件箱</h2>
    <el-table :data="messages">
      <el-table-column prop="sender" label="发件人" />
      <el-table-column prop="title" label="标题" />
      <el-table-column prop="time" label="时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button link type="primary" @click="handleRead(scope.row)">查看</el-button>
          <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
const messages = [
  { id: 1, sender: '系统管理员', title: '系统维护通知', time: '2024-01-15 10:00', read: false },
  { id: 2, sender: '项目经理', title: '项目会议邀请', time: '2024-01-14 15:30', read: true }
]

const handleRead = (message) => {
  console.log('查看消息:', message)
}

const handleDelete = (message) => {
  console.log('删除消息:', message)
}
</script>
EOF

# 创建 AlertSetting.vue
cat > oa/notification/AlertSetting.vue <<'EOF'
<template>
  <div class="alert-setting">
    <h2>提醒设置</h2>
    <el-form :model="settings" label-width="200px">
      <el-form-item label="邮件通知">
        <el-switch v-model="settings.email" />
      </el-form-item>
      <el-form-item label="短信通知">
        <el-switch v-model="settings.sms" />
      </el-form-item>
      <el-form-item label="桌面通知">
        <el-switch v-model="settings.desktop" />
      </el-form-item>
      <el-form-item label="审批提醒">
        <el-switch v-model="settings.approvalAlert" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSave">保存设置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const settings = ref({
  email: true,
  sms: false,
  desktop: true,
  approvalAlert: true
})

const handleSave = () => {
  console.log('保存设置:', settings.value)
}
</script>
EOF

# 创建 Broadcast.vue
cat > oa/notification/Broadcast.vue <<'EOF'
<template>
  <div class="broadcast">
    <h2>公告广播</h2>
    <el-form :model="broadcastForm" label-width="100px">
      <el-form-item label="公告标题">
        <el-input v-model="broadcastForm.title" />
      </el-form-item>
      <el-form-item label="公告内容">
        <el-input v-model="broadcastForm.content" type="textarea" rows="5" />
      </el-form-item>
      <el-form-item label="接收部门">
        <el-select v-model="broadcastForm.departments" multiple>
          <el-option label="技术部" value="tech" />
          <el-option label="销售部" value="sales" />
          <el-option label="财务部" value="finance" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSend">发送公告</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const broadcastForm = ref({
  title: '',
  content: '',
  departments: []
})

const handleSend = () => {
  console.log('发送公告:', broadcastForm.value)
}
</script>
EOF