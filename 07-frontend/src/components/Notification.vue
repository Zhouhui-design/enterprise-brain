<template>
  <div class="notification-container" ref="containerRef">
    <transition-group name="notification" tag="div">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="notification-item"
        :class="notification.type"
        @click="handleClick(notification)"
      >
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-message">{{ notification.message }}</div>
        </div>
        <button
          class="notification-close"
          @click.stop="removeNotification(notification.id)"
        >
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '../stores/app';
import { Events } from '../utils/eventBus';
import eventBus from '../utils/eventBus';
import { Close } from '@element-plus/icons-vue';

// 获取通知列表
const appStore = useAppStore();
const notifications = computed(() => appStore.notifications);
const containerRef = ref(null);

// 移除通知
const removeNotification = (id) => {
  appStore.removeNotification(id);
};

// 点击通知
const handleClick = (notification) => {
  // 可以在这里添加点击通知后的处理逻辑
  console.log('点击通知:', notification);
  removeNotification(notification.id);
  
  // 如果通知有回调函数，执行回调
  if (notification.onClick) {
    notification.onClick(notification);
  }
};

// 事件总线监听
const handleAddNotification = (notification) => {
  appStore.addNotification(notification);
};

const handleRemoveNotification = (id) => {
  appStore.removeNotification(id);
};

const handleClearNotifications = () => {
  appStore.clearNotifications();
};

// 生命周期钩子
onMounted(() => {
  // 注册事件监听器
  eventBus.on(Events.NOTIFICATION_ADD, handleAddNotification);
  eventBus.on(Events.NOTIFICATION_REMOVE, handleRemoveNotification);
  eventBus.on(Events.NOTIFICATION_CLEAR, handleClearNotifications);
});

onUnmounted(() => {
  // 移除事件监听器
  eventBus.off(Events.NOTIFICATION_ADD, handleAddNotification);
  eventBus.off(Events.NOTIFICATION_REMOVE, handleRemoveNotification);
  eventBus.off(Events.NOTIFICATION_CLEAR, handleClearNotifications);
});
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 300px;
  background-color: #fff;
  border-left: 4px solid #1890ff;
}

.notification-item.success {
  border-left-color: #67c23a;
  background-color: #f0f9eb;
}

.notification-item.warning {
  border-left-color: #e6a23c;
  background-color: #fdf6ec;
}

.notification-item.error {
  border-left-color: #f56c6c;
  background-color: #fef0f0;
}

.notification-item.info {
  border-left-color: #1890ff;
  background-color: #ecf5ff;
}

.notification-content {
  flex: 1;
  margin-right: 12px;
}

.notification-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 12px;
  color: #606266;
}

.notification-close {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #909399;
  padding: 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.notification-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
  color: #606266;
}

/* 动画效果 */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-active {
  position: absolute;
  right: 0;
}
</style>
