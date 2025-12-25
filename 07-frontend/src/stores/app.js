import { defineStore } from 'pinia';

/**
 * 全局应用状态管理
 */
export const useAppStore = defineStore('app', {
  // 状态
  state: () => ({
    // 加载状态
    loading: false,
    loadingText: '加载中...',
    
    // 通知消息
    notifications: [],
    
    // 侧边栏状态
    sidebar: {
      opened: true,
      withoutAnimation: false
    },
    
    // 设备类型
    device: 'desktop',
    
    // 语言设置
    language: 'zh-CN',
    
    // 主题设置
    theme: {
      color: '#1890ff',
      mode: 'light'
    },
    
    // 面包屑导航
    breadcrumbs: []
  }),

  // Getters
  getters: {
    isMobile: (state) => state.device === 'mobile',
    isTablet: (state) => state.device === 'tablet',
    isDesktop: (state) => state.device === 'desktop'
  },

  // Actions
  actions: {
    // 设置加载状态
    setLoading(loading, text = '加载中...') {
      this.loading = loading;
      this.loadingText = text;
    },
    
    // 添加通知
    addNotification(notification) {
      const id = Date.now() + Math.random().toString(36).substr(2, 9);
      const newNotification = {
        id,
        title: '通知',
        message: '',
        type: 'info', // success, warning, error, info
        duration: 3000,
        ...notification
      };
      
      this.notifications.push(newNotification);
      
      // 自动移除通知
      if (newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, newNotification.duration);
      }
      
      return id;
    },
    
    // 移除通知
    removeNotification(id) {
      const index = this.notifications.findIndex(notification => notification.id === id);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    },
    
    // 清空所有通知
    clearNotifications() {
      this.notifications = [];
    },
    
    // 切换侧边栏
    toggleSidebar(withoutAnimation) {
      this.sidebar.opened = !this.sidebar.opened;
      this.sidebar.withoutAnimation = !!withoutAnimation;
    },
    
    // 关闭侧边栏
    closeSidebar(withoutAnimation) {
      this.sidebar.opened = false;
      this.sidebar.withoutAnimation = !!withoutAnimation;
    },
    
    // 设置设备类型
    setDevice(device) {
      this.device = device;
    },
    
    // 设置语言
    setLanguage(language) {
      this.language = language;
    },
    
    // 设置主题
    setTheme(theme) {
      this.theme = { ...this.theme, ...theme };
    },
    
    // 设置面包屑
    setBreadcrumbs(breadcrumbs) {
      this.breadcrumbs = breadcrumbs;
    },
    
    // 添加面包屑
    addBreadcrumb(breadcrumb) {
      this.breadcrumbs.push(breadcrumb);
    },
    
    // 清空面包屑
    clearBreadcrumbs() {
      this.breadcrumbs = [];
    }
  }
});
