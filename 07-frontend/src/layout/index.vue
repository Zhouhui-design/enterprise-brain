<template>
  <div class="app-container">
    <template v-if="isLoggedIn">
      <!-- 侧边栏 -->
      <aside class="sidebar" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <div class="sidebar-header">
          <div class="logo">企业大脑</div>
          <el-button
            type="text"
            class="collapse-btn"
            @click="toggleSidebar"
            :icon="sidebarCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"
          ></el-button>
        </div>
        
        <nav class="menu-container">
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            @select="handleMenuSelect"
            :collapse="sidebarCollapsed"
            :collapse-transition="false"
          >
            <template v-for="menu in menus" :key="menu.path">
              <!-- 有子菜单的菜单项 -->
              <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
                <template #title>
                  <el-icon><component :is="menu.icon || 'el-icon-menu'" /></el-icon>
                  <span>{{ menu.meta.title }}</span>
                </template>
                <el-menu-item
                  v-for="subMenu in menu.children"
                  :key="subMenu.path"
                  :index="subMenu.path"
                  :disabled="!hasPermission(subMenu.meta?.permissions)"
                >
                  <el-icon v-if="subMenu.icon"><component :is="subMenu.icon" /></el-icon>
                  <span>{{ subMenu.meta.title }}</span>
                </el-menu-item>
              </el-sub-menu>
              <!-- 无子菜单的菜单项 -->
              <el-menu-item
                v-else
                :index="menu.path"
                :disabled="!hasPermission(menu.meta?.permissions)"
              >
                <el-icon><component :is="menu.icon || 'el-icon-document'" /></el-icon>
                <span>{{ menu.meta.title }}</span>
              </el-menu-item>
            </template>
          </el-menu>
        </nav>
      </aside>

      <!-- 主内容区域 -->
      <main class="main-content">
        <!-- 顶部导航栏 -->
        <header class="navbar">
          <el-button
            type="text"
            class="sidebar-toggle"
            @click="toggleSidebar"
            :icon="sidebarCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"
          ></el-button>
          
          <div class="breadcrumb-container">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
              <el-breadcrumb-item v-for="(item, index) in breadcrumbList" :key="index">
                {{ item.meta.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          
          <div class="user-info">
            <el-dropdown>
              <span class="user-avatar">
                <el-avatar :size="36">{{ userInfo?.username?.charAt(0) || 'U' }}</el-avatar>
                <span class="user-name">{{ userInfo?.username || '' }}</span>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleProfile">个人信息</el-dropdown-item>
                  <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </header>

        <!-- 页面内容 -->
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </template>
    
    <!-- 未登录状态，直接显示路由内容（如登录页） -->
    <div v-else class="unauthorized-container">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Layout',
  data() {
    return {
      sidebarCollapsed: false,
      menus: [],
      breadcrumbList: []
    }
  },
  computed: {
    isLoggedIn() {
      // 检查是否已登录
      return localStorage.getItem('token') !== null
    },
    
    userInfo() {
      // 获取用户信息
      const userInfoStr = localStorage.getItem('userInfo')
      return userInfoStr ? JSON.parse(userInfoStr) : null
    },
    
    activeMenu() {
      // 获取当前激活的菜单
      return this.$route.path || '/'
    }
  },
  watch: {
    // 监听路由变化，更新面包屑和菜单
    $route: {
      handler() {
        this.updateBreadcrumb()
      },
      immediate: true
    },
    
    // 监听登录状态变化，重新加载菜单
    isLoggedIn: {
      handler(newVal) {
        if (newVal) {
          this.loadMenus()
        }
      },
      immediate: true
    }
  },
  methods: {
    // 切换侧边栏
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    // 处理菜单选择
    handleMenuSelect(key, keyPath) {
      this.$router.push(key)
    },
    
    // 加载菜单
    loadMenus() {
      // 在实际项目中，这里应该从后端获取菜单
      // 现在我们使用模拟数据
      this.menus = [
        {
          path: '/dashboard',
          name: 'Dashboard',
          meta: { title: '首页' },
          icon: 'el-icon-s-home'
        },
        {
          path: '/receipt',
          name: 'Receipt',
          meta: { title: '回厂管理' },
          icon: 'el-icon-box',
          children: [
            {
              path: '/receipt/list',
              name: 'ReceiptList',
              meta: { title: '回厂单列表' },
              icon: 'el-icon-document'
            },
            {
              path: '/receipt/quality-check',
              name: 'QualityCheck',
              meta: { title: '质量检验' },
              icon: 'el-icon-check'
            }
          ]
        },
        {
          path: '/warehouse',
          name: 'Warehouse',
          meta: { title: '仓库管理' },
          icon: 'el-icon-warehouse',
          children: [
            {
              path: '/warehouse/in',
              name: 'WarehouseIn',
              meta: { title: '入库管理' },
              icon: 'el-icon-download'
            },
            {
              path: '/warehouse/out',
              name: 'WarehouseOut',
              meta: { title: '出库管理' },
              icon: 'el-icon-upload'
            },
            {
              path: '/warehouse/stock-transfer',
              name: 'StockTransfer',
              meta: { title: '库存转移' },
              icon: 'el-icon-switch-button'
            },
            {
              path: '/warehouse/inventory-count',
              name: 'InventoryCount',
              meta: { title: '库存盘点' },
              icon: 'el-icon-s-finance'
            },
            {
              path: '/warehouse/location-management',
              name: 'LocationManagement',
              meta: { title: '库位管理' },
              icon: 'el-icon-s-grid'
            }
          ]
        }
      ]
    },
    
    // 更新面包屑
    updateBreadcrumb() {
      const path = this.$route.path
      const breadcrumb = []
      
      // 简单的面包屑生成逻辑，实际项目中可能需要更复杂的处理
      let currentPath = ''
      const pathParts = path.split('/').filter(part => part)
      
      pathParts.forEach((part, index) => {
        currentPath += '/' + part
        const route = this.$router.resolve(currentPath).matched[0]
        if (route) {
          breadcrumb.push(route)
        }
      })
      
      this.breadcrumbList = breadcrumb
    },
    
    // 检查是否有权限
    hasPermission(permissions) {
      // 在实际项目中，应该根据用户角色和权限进行检查
      // 现在简化为所有登录用户都有权限
      return true
    },
    
    // 处理个人信息
    handleProfile() {
      this.$message.info('查看个人信息功能待实现')
    },
    
    // 处理退出登录
    handleLogout() {
      this.$confirm('确定要退出登录吗？', '确认退出', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 清除登录信息
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        
        // 跳转到登录页
        this.$router.push('/auth/login')
        
        this.$message.success('退出登录成功')
      }).catch(() => {
        // 取消退出
      })
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 侧边栏样式 */
.sidebar {
  width: 240px;
  background-color: #001529;
  color: #fff;
  transition: width 0.3s ease;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  overflow-y: auto;
}

.sidebar.sidebar-collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #1f2937;
}

.sidebar-header .logo {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  transition: opacity 0.3s ease;
}

.sidebar.sidebar-collapsed .sidebar-header .logo {
  opacity: 0;
}

.collapse-btn {
  color: #fff;
  font-size: 16px;
}

.menu-container {
  padding: 16px 0;
}

.el-menu-vertical {
  background-color: transparent;
  border-right: none;
}

.el-menu {
  border-right: none;
}

.el-menu-item,
.el-sub-menu__title {
  color: rgba(255, 255, 255, 0.65);
  height: 40px;
  line-height: 40px;
  padding: 0 20px;
  background-color: transparent;
}

.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: #1f2937;
  color: #fff;
}

.el-menu-item.is-active {
  background-color: #1890ff;
  color: #fff;
}

/* 主内容区域样式 */
.main-content {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-collapsed + .main-content {
  margin-left: 64px;
}

/* 顶部导航栏样式 */
.navbar {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  padding: 0 20px;
  z-index: 10;
}

.sidebar-toggle {
  margin-right: 20px;
}

.breadcrumb-container {
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-name {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}

/* 页面内容区域 */
.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

/* 未授权状态 */
.unauthorized-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.sidebar-expanded {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .breadcrumb-container {
    display: none;
  }
}
</style>