import { defineStore } from 'pinia';

/**
 * 用户信息状态管理
 */
export const useUserStore = defineStore('user', {
  // 状态
  state: () => ({
    id: null,
    username: '',
    name: '',
    email: '',
    avatar: '',
    roles: [],
    permissions: [],
    isLoggedIn: false,
    loading: false,
    error: null
  }),

  // Getters
  getters: {
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission);
    },
    hasRole: (state) => (role) => {
      return state.roles.includes(role);
    }
  },

  // Actions
  actions: {
    // 登录
    async login(credentials) {
      this.loading = true;
      this.error = null;
      try {
        // 这里应该调用API进行登录验证
        // const response = await api.login(credentials);
        // 模拟登录成功
        setTimeout(() => {
          this.id = 1;
          this.username = credentials.username;
          this.name = '测试用户';
          this.email = 'test@example.com';
          this.avatar = '';
          this.roles = ['admin'];
          this.permissions = ['read', 'write', 'delete'];
          this.isLoggedIn = true;
          this.loading = false;
        }, 1000);
      } catch (error) {
        this.error = error.message;
        this.loading = false;
      }
    },

    // 登出
    logout() {
      this.id = null;
      this.username = '';
      this.name = '';
      this.email = '';
      this.avatar = '';
      this.roles = [];
      this.permissions = [];
      this.isLoggedIn = false;
    },

    // 更新用户信息
    updateUserInfo(info) {
      this.name = info.name || this.name;
      this.email = info.email || this.email;
      this.avatar = info.avatar || this.avatar;
    }
  }
});
