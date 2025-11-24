cat > oa/notification/NotificationCenter.vue <<'EOF'
<template>
  <div class="notification-center">
    <div class="header">
      <h1>通知中心</h1>
      <el-button @click="markAllAsRead">全部标记已读</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="全部" name="all">
        <notification-list :notifications="allNotifications" />
      </el-tab-pane>
      <el-tab-pane label="未读" name="unread">
        <notification-list :notifications="unreadNotifications" />
      </el-tab-pane>
      <el-tab-pane label="已读" name="read">
        <notification-list :notifications="readNotifications" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NotificationList from './components/NotificationList.vue'

const activeTab = ref('all')

// 模拟通知数据
const notifications = ref([
  {
    id: 1,
    title: '系统更新通知',
    content: '系统将于今晚进行维护更新',
    type: 'system',
    time: '2024-01-15 10:00',
    read: false
  },
  {
    id: 2,
    title: '新的审批任务',
    content: '您有一个新的采购申请需要审批',
    type: 'approval',
    time: '2024-01-15 09:30',
    read: true
  }
])

const allNotifications = computed(() => notifications.value)
const unreadNotifications = computed(() => notifications.value.filter(n => !n.read))
const readNotifications = computed(() => notifications.value.filter(n => n.read))

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}
</script>

<style scoped>
.notification-center {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
EOF