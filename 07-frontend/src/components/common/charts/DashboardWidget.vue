<template>
  <div 
    class="dashboard-widget" 
    :class="{ 
      'dashboard-widget-loading': loading,
      [`dashboard-widget-${size}`]: size,
      'dashboard-widget-bordered': bordered,
      'dashboard-widget-hoverable': hoverable
    }"
  >
    <!-- 标题区域 -->
    <div v-if="showHeader" class="widget-header">
      <h3 class="widget-title">
        <component v-if="icon" :is="icon" class="widget-icon" />
        {{ title }}
      </h3>
      <div v-if="showActions || $slots.actions" class="widget-actions">
        <slot name="actions">
          <el-button v-if="showRefresh" type="text" size="small" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button v-if="showSettings" type="text" size="small" @click="handleSettings">
            <el-icon><Setting /></el-icon>
          </el-button>
        </slot>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div class="widget-content" :class="{ 'widget-content-padding': contentPadding }">
      <!-- 加载状态 -->
      <div v-if="loading" class="widget-loading">
        <el-skeleton :rows="3" animated />
      </div>
      <!-- 错误状态 -->
      <div v-else-if="error" class="widget-error">
        <el-empty description="加载失败" />
        <el-button type="primary" size="small" @click="handleRefresh">重新加载</el-button>
      </div>
      <!-- 空状态 -->
      <div v-else-if="empty" class="widget-empty">
        <el-empty :description="emptyText || '暂无数据'" />
      </div>
      <!-- 实际内容 -->
      <div v-else class="widget-body">
        <slot></slot>
      </div>
    </div>
    
    <!-- 底部区域 -->
    <div v-if="showFooter || $slots.footer" class="widget-footer">
      <slot name="footer">{{ footerText }}</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Refresh, Setting } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  // 标题
  title: {
    type: String,
    default: ''
  },
  // 图标
  icon: {
    type: [String, Object],
    default: null
  },
  // 尺寸: 'small', 'medium', 'large'
  size: {
    type: String,
    default: 'medium'
  },
  // 是否显示边框
  bordered: {
    type: Boolean,
    default: true
  },
  // 是否可悬浮
  hoverable: {
    type: Boolean,
    default: true
  },
  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示底部
  showFooter: {
    type: Boolean,
    default: false
  },
  // 底部文本
  footerText: {
    type: String,
    default: ''
  },
  // 是否显示刷新按钮
  showRefresh: {
    type: Boolean,
    default: false
  },
  // 是否显示设置按钮
  showSettings: {
    type: Boolean,
    default: false
  },
  // 是否显示操作区域
  showActions: {
    type: Boolean,
    default: false
  },
  // 是否显示内容内边距
  contentPadding: {
    type: Boolean,
    default: true
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 是否显示错误
  error: {
    type: Boolean,
    default: false
  },
  // 是否显示空状态
  empty: {
    type: Boolean,
    default: false
  },
  // 空状态文本
  emptyText: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['refresh', 'settings', 'click'])

// 方法
const handleRefresh = () => {
  emit('refresh')
}

const handleSettings = () => {
  emit('settings')
}
</script>

<style scoped>
.dashboard-widget {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dashboard-widget-bordered {
  border: 1px solid #ebeef5;
}

.dashboard-widget-hoverable:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 尺寸变体 */
.dashboard-widget-small {
  padding: 12px;
}

.dashboard-widget-medium {
  padding: 16px;
}

.dashboard-widget-large {
  padding: 20px;
}

/* 头部样式 */
.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.widget-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.widget-icon {
  font-size: 18px;
  color: #1890ff;
}

.widget-actions {
  display: flex;
  gap: 4px;
}

/* 内容样式 */
.widget-content {
  position: relative;
  min-height: 50px;
}

.widget-content-padding {
  padding: 0;
}

.widget-body {
  width: 100%;
  height: 100%;
}

.widget-loading,
.widget-error,
.widget-empty {
  width: 100%;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.widget-error {
  gap: 12px;
}

/* 底部样式 */
.widget-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-widget-small {
    padding: 10px;
  }
  
  .dashboard-widget-medium {
    padding: 12px;
  }
  
  .dashboard-widget-large {
    padding: 16px;
  }
  
  .widget-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .widget-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
  
  .widget-title {
    font-size: 14px;
  }
}
</style>