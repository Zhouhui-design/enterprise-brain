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
        
        <!-- 菜单查找功能 -->
        <div class="menu-search" v-show="!sidebarCollapsed">
          <el-input
            v-model="menuSearchKeyword"
            placeholder="搜索菜单..."
            :prefix-icon="'el-icon-search'"
            clearable
            @input="handleMenuSearch"
          />
        </div>
        
        <nav class="menu-container">
          <el-menu
            :default-active="activeMenu"
            class="el-menu-vertical"
            @select="handleMenuSelect"
            :collapse="sidebarCollapsed"
            :collapse-transition="false"
          >
            <template v-for="menu in filteredMenus" :key="menu.path">
              <!-- 有子菜单的菜单项 -->
              <el-sub-menu v-if="menu.children && menu.children.length > 0" :index="menu.path">
                <template #title>
                  <el-icon><component :is="menu.icon || 'el-icon-menu'" /></el-icon>
                  <span>{{ menu.meta.title }}</span>
                </template>
                
                <!-- 递归渲染子菜单 -->
                <template v-for="subMenu in menu.children" :key="subMenu.path">
                  <!-- 子菜单还有下级菜单 -->
                  <el-sub-menu v-if="subMenu.children && subMenu.children.length > 0" :index="subMenu.path">
                    <template #title>
                      <el-icon v-if="subMenu.icon"><component :is="subMenu.icon" /></el-icon>
                      <span>{{ subMenu.meta.title }}</span>
                    </template>
                    
                    <!-- 第三层菜单 -->
                    <template v-for="thirdMenu in subMenu.children" :key="thirdMenu.path">
                      <el-sub-menu v-if="thirdMenu.children && thirdMenu.children.length > 0" :index="thirdMenu.path">
                        <template #title>
                          <el-icon v-if="thirdMenu.icon"><component :is="thirdMenu.icon" /></el-icon>
                          <span>{{ thirdMenu.meta.title }}</span>
                        </template>
                        
                        <!-- 第四层菜单项 -->
                        <el-menu-item
                          v-for="fourthMenu in thirdMenu.children"
                          :key="fourthMenu.path"
                          :index="fourthMenu.path"
                          :disabled="!hasPermission(fourthMenu.meta?.permissions)"
                        >
                          <el-icon v-if="fourthMenu.icon"><component :is="fourthMenu.icon" /></el-icon>
                          <span>{{ fourthMenu.meta.title }}</span>
                        </el-menu-item>
                      </el-sub-menu>
                      
                      <!-- 第三层无子菜单 -->
<el-menu-item
                        v-else
                        :index="thirdMenu.path"
                        :disabled="!hasPermission(thirdMenu.meta?.permissions)"
                      >
                        <el-icon v-if="thirdMenu.icon"><component :is="thirdMenu.icon" /></el-icon>
                        <span>{{ thirdMenu.meta.title }}</span>
                      </el-menu-item>
                    </template>
                  </el-sub-menu>
                  
                  <!-- 子菜单无下级 -->
                  <el-menu-item
                    v-else
                    :index="subMenu.path"
                    :disabled="!hasPermission(subMenu.meta?.permissions)"
                  >
                    <el-icon v-if="subMenu.icon"><component :is="subMenu.icon" /></el-icon>
                    <span>{{ subMenu.meta.title }}</span>
                  </el-menu-item>
                </template>
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
          <router-view v-slot="{ Component, route }">
            <transition name="fade" mode="out-in">
              <!-- ✅ 使用route.fullPath作key，确保路由切换时组件重新渲染 -->
              <component :is="Component" :key="route.fullPath" v-if="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </template>
    
    <!-- 未登录状态，直接显示路由内容（如登录页） -->
    <div v-else class="unauthorized-container">
      <router-view v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <!-- ✅ 使用route.fullPath作key，确保路由切换时组件重新渲染 -->
          <component :is="Component" :key="route.fullPath" v-if="Component" />
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
      menuSearchKeyword: '',
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
    },
    
    // 过滤后的菜单列表
    filteredMenus() {
      if (!this.menuSearchKeyword) {
        return this.menus
      }
      
      const keyword = this.menuSearchKeyword.toLowerCase()
      return this.menus.filter(menu => {
        // 搜索菜单标题
        const titleMatch = menu.meta.title.toLowerCase().includes(keyword)
        
        // 搜索子菜单
        if (menu.children && menu.children.length > 0) {
          const childMatch = menu.children.some(child => 
            child.meta.title.toLowerCase().includes(keyword)
          )
          return titleMatch || childMatch
        }
        
        return titleMatch
      })
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
    // 切换侧边栏折叠
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    // 处理菜单搜索
    handleMenuSearch() {
      // 搜索关键词变化时，过滤菜单会自动更新
    },
    
    // 处理菜单选择
    handleMenuSelect(key, keyPath) {
      console.log('📡 菜单点击:', key, keyPath)
      console.log('📋 当前路由:', this.$route.path)
      console.log('📋 当前完整路由:', this.$route.fullPath)
      
      // 如果点击的是当前路由，不需要跳转
      if (key === this.$route.path) {
        console.log('⚠️ 已经在该页面，不需要跳转')
        return
      }
      
      // ✅ 关键修复：使用replace而reload强制刷新页面
      console.log('🚀 准备跳转到:', key)
      
      this.$router.push(key)
        .then(() => {
          console.log('✅ 路由跳转成功:', key)
          console.log('📋 新路由:', this.$route.path)
          // ✅ 强制重新渲染组件
          this.$forceUpdate()
        })
        .catch(err => {
          // 忽略重复导航错误
          if (err.name !== 'NavigationDuplicated') {
            console.error('❌ 路由跳转失败:', err)
          }
        })
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
          path: '/system-manual',
          name: 'SystemManual',
          meta: { title: '系统操作说明书' },
          icon: 'el-icon-reading',
          children: []
        },
        {
          path: '/initial-setup',
          name: 'InitialSetup',
          meta: { title: '期初设置' },
          icon: 'el-icon-setting',
          children: []
        },
        {
          path: '/sales-management',
          name: 'SalesManagement',
          meta: { title: '销售管理' },
          icon: 'el-icon-sell',
          children: [
            {
              path: '/sales/orders/customers',
              name: 'CustomerList',
              meta: { title: '客户台账' },
              icon: 'el-icon-user'
            },
            {
              path: '/sales/orders/list',
              name: 'SalesOrderList',
              meta: { title: '销售订单' },
              icon: 'el-icon-document'
            },
            {
              path: '/sales/simulation-scheduling/list',
              name: 'SimulationSchedulingList',
              meta: { title: '模拟排程列表' },
              icon: 'el-icon-s-order'
            },
            {
              path: '/sales/simulation-material-requirements/list',
              name: 'SimulationMaterialRequirementList',
              meta: { title: '模拟物料需求明细' },
              icon: 'el-icon-document-copy'
            },
            {
              path: '/sales/orders/mock-scheduling-process-list',
              name: 'MockSchedulingProcessList',
              meta: { title: '模拟排程工序表' },
              icon: 'el-icon-data-board'
            },
            {
              path: '/bom/sales',
              name: 'SalesBom',
              meta: { title: '销售BOM' },
              icon: 'el-icon-sell'
            },
            {
              path: '/product',
              name: 'Product',
              meta: { title: '产品管理' },
              icon: 'el-icon-box',
              children: [
                {
                  path: '/product/manual',
                  name: 'ProductManual',
                  meta: { title: '产品手册' },
                  icon: 'el-icon-document'
                }
              ]
            }
          ]
        },
        {
          path: '/rd-management',
          name: 'RDManagement',
          meta: { title: '技术&研发&设计管理' },
          icon: 'el-icon-s-flag',
          children: [
            {
              path: '/material/list',
              name: 'MaterialList',
              meta: { title: '产品物料库' },
              icon: 'el-icon-goods'
            },
            {
              path: '/bom/design',
              name: 'DesignBom',
              meta: { title: '设计BOM' },
              icon: 'el-icon-edit'
            },
            {
              path: '/after-sales/project-management',
              name: 'ProjectManagement',
              meta: { title: '研发项目管理' },
              icon: 'el-icon-s-flag'
            }
          ]
        },
        {
          path: '/production-management',
          name: 'ProductionManagement',
          meta: { title: '生产管理' },
          icon: 'el-icon-s-operation',
          children: [
            {
              path: '/bom/production',
              name: 'ProductionBom',
              meta: { title: '生产BOM' },
              icon: 'el-icon-setting'
            },
            {
              path: '/manufacturing/list-style-production-bom',
              name: 'ListStyleProductionBom',
              meta: { title: '列表式生产BOM' },
              icon: 'el-icon-document'
            },
            {
              path: '/bom-tree-structure',
              name: 'BomTreeStructure',
              meta: { title: '生产BOM树结构' },
              icon: 'el-icon-s-grid'
            },
            {
              path: '/manufacturing/process',
              name: 'ProcessList',
              meta: { title: '工序' },
              icon: 'el-icon-s-operation'
            },
            {
              path: '/manufacturing/process-interval-settings',
              name: 'ProcessIntervalSettings',
              meta: { title: '工序间隔设置' },
              icon: 'el-icon-time'
            }
          ]
        },
        {
          path: '/production-resources',
          name: 'ProductionResources',
          meta: { title: '生产资源管理' },
          icon: 'el-icon-s-tools',
          children: [
            {
              path: '/equipment-management',
              name: 'EquipmentManagement',
              meta: { title: '设备管理' },
              icon: 'el-icon-s-operation',
              children: [
                {
                  path: '/production-resources/equipment/list',
                  name: 'EquipmentList',
                  meta: { title: '设备列表' },
                  icon: 'el-icon-document'
                },
                {
                  path: '/production-resources/equipment/maintenance',
                  name: 'EquipmentMaintenance',
                  meta: { title: '设备维护' },
                  icon: 'el-icon-setting'
                },
                {
                  path: '/production-resources/equipment/status',
                  name: 'EquipmentStatus',
                  meta: { title: '设备状态' },
                  icon: 'el-icon-data-line'
                },
                {
                  path: '/production-resources/equipment/repair',
                  name: 'RepairManagement',
                  meta: { title: '维修管理' },
                  icon: 'el-icon-s-tools'
                },
                {
                  path: '/production-resources/equipment/utilization',
                  name: 'UtilizationReport',
                  meta: { title: '利用率报告' },
                  icon: 'el-icon-s-data'
                }
              ]
            },
            {
              path: '/fixture-management',
              name: 'FixtureManagement',
              meta: { title: '夹具管理' },
              icon: 'el-icon-s-platform',
              children: [
                {
                  path: '/production-resources/fixture/management',
                  name: 'FixtureManagementPage',
                  meta: { title: '夹具管理' },
                  icon: 'el-icon-document'
                },
                {
                  path: '/production-resources/fixture/inventory',
                  name: 'FixtureInventory',
                  meta: { title: '夹具库存' },
                  icon: 'el-icon-box'
                },
                {
                  path: '/production-resources/fixture/maintenance',
                  name: 'FixtureMaintenance',
                  meta: { title: '夹具维护' },
                  icon: 'el-icon-setting'
                },
                {
                  path: '/production-resources/fixture/design',
                  name: 'FixtureDesign',
                  meta: { title: '夹具设计' },
                  icon: 'el-icon-edit'
                },
                {
                  path: '/production-resources/fixture/setup',
                  name: 'FixtureSetup',
                  meta: { title: '夹具配置' },
                  icon: 'el-icon-s-tools'
                }
              ]
            },
            {
              path: '/mold-management',
              name: 'MoldManagement',
              meta: { title: '模具管理' },
              icon: 'el-icon-s-grid',
              children: [
                {
                  path: '/production-resources/mold/management',
                  name: 'MoldManagementPage',
                  meta: { title: '模具管理' },
                  icon: 'el-icon-document'
                },
                {
                  path: '/production-resources/mold/maintenance',
                  name: 'MoldMaintenance',
                  meta: { title: '模具维护' },
                  icon: 'el-icon-setting'
                },
                {
                  path: '/production-resources/mold/lifecycle',
                  name: 'MoldLifecycle',
                  meta: { title: '模具生命周期' },
                  icon: 'el-icon-data-line'
                },
                {
                  path: '/production-resources/mold/schedule',
                  name: 'MoldSchedule',
                  meta: { title: '模具排程' },
                  icon: 'el-icon-s-order'
                },
                {
                  path: '/production-resources/mold/storage',
                  name: 'MoldStorage',
                  meta: { title: '模具存储' },
                  icon: 'el-icon-box'
                }
              ]
            },
            {
              path: '/tooling-management',
              name: 'ToolingManagement',
              meta: { title: '刀具管理' },
              icon: 'el-icon-s-tools',
              children: [
                {
                  path: '/production-resources/tooling/management',
                  name: 'ToolingManagementPage',
                  meta: { title: '刀具管理' },
                  icon: 'el-icon-document'
                },
                {
                  path: '/production-resources/tooling/inventory',
                  name: 'ToolingInventory',
                  meta: { title: '刀具库存' },
                  icon: 'el-icon-box'
                },
                {
                  path: '/production-resources/tooling/issue',
                  name: 'ToolingIssue',
                  meta: { title: '刀具发放' },
                  icon: 'el-icon-upload'
                },
                {
                  path: '/production-resources/tooling/return',
                  name: 'ToolingReturn',
                  meta: { title: '刀具回收' },
                  icon: 'el-icon-download'
                },
                {
                  path: '/production-resources/tooling/maintenance',
                  name: 'ToolingMaintenance',
                  meta: { title: '刀具维护' },
                  icon: 'el-icon-setting'
                }
              ]
            }
          ]
        },
        {
          path: '/planning-control',
          name: 'PlanningControl',
          meta: { title: '计划&物控管理' },
          icon: 'el-icon-s-data',
          children: [
            {
              path: '/production-planning',
              name: 'ProductionPlanning',
              meta: { title: '生产计划' },
              icon: 'el-icon-s-order',
              children: [
                {
                  path: '/production-planning/plan-list',
                  name: 'ProductionPlanList',
                  meta: { title: '主生产计划' },
                  icon: 'el-icon-document'
                },
                {
                  path: '/production-planning/adjustment',
                  name: 'PlanAdjustment',
                  meta: { title: '主生产计划调整' },
                  icon: 'el-icon-edit'
                },
                {
                  path: '/production-planning/material-preparation-new',
                  name: 'MaterialPreparationPlanNew',
                  meta: { title: '备料计划' },
                  icon: 'el-icon-s-grid'
                },
                // ========================================
                // ⛔ 已禁用：旧的打包工序计划菜单
                // 路由：/process-planning/real-process-plan
                // 原因：该路径为历史遗留路由，已迁移至新路径
                // 禁用时间：2025-12-17
                // 替代方案：使用下方新的打包工序计划菜单
                // ========================================
                // {
                //   path: '/process-planning/real-process-plan',
                //   name: 'RealProcessPlanList',
                //   meta: { title: '打包工序计划(旧-已禁用)' },
                //   icon: 'el-icon-s-claim'
                // },
                
                // ✅ 当前启用：新的打包工序计划菜单
                {
                  path: '/production-planning/packing-process-plan',
                  name: 'PackingProcessPlanList',
                  meta: { title: '打包工序计划' },
                  icon: 'el-icon-box'
                },
                
                // ========================================
                // ⛔ 已禁用：旧的喷塑工序计划配置（路径冲突）
                // 路由：/production-planning/packing-process-plan
                // 原因：与打包工序路径冲突，命名混淆
                // 禁用时间：2025-12-17
                // 替代方案：使用下方独立的喷塑工序计划菜单
                // ========================================
                // {
                //   path: '/production-planning/packing-process-plan',
                //   name: 'PackingProcessPlanList',
                //   meta: { title: '喷塑工序计划(旧-已禁用)' },
                //   icon: 'el-icon-box'
                // },
                
                // ✅ 当前启用：新的喷塑工序计划菜单
                {
                  path: '/production-planning/spray-painting-process-plan',
                  name: 'SprayPaintingProcessPlanList',
                  meta: { title: '喷塑工序计划' },
                  icon: 'el-icon-brush'
                },
                {
                  path: '/production-planning/assembly-process-plan',
                  name: 'AssemblyProcessPlanList',
                  meta: { title: '组装工序计划' },
                  icon: 'el-icon-setting'
                },
                {
                  path: '/production-planning/sewing-process-plan',
                  name: 'SewingProcessPlanList',
                  meta: { title: '缝纫工序计划' },
                  icon: 'el-icon-scissors'
                },
                // ✅ 新增11个工序计划菜单项
                {
                  path: '/production-planning/shot-blasting-process-plan',
                  name: 'ShotBlastingProcessPlanList',
                  meta: { title: '抛丸工序计划' },
                  icon: 'el-icon-magic-stick'
                },
                {
                  path: '/production-planning/manual-welding-process-plan',
                  name: 'ManualWeldingProcessPlanList',
                  meta: { title: '人工焊接工序计划' },
                  icon: 'el-icon-connection'
                },
                {
                  path: '/production-planning/tube-bending-process-plan',
                  name: 'TubeBendingProcessPlanList',
                  meta: { title: '弯管工序计划' },
                  icon: 'el-icon-turn-off'
                },
                {
                  path: '/production-planning/laser-tube-cutting-process-plan',
                  name: 'LaserTubeCuttingProcessPlanList',
                  meta: { title: '激光切管工序计划' },
                  icon: 'el-icon-scissors'
                },
                {
                  path: '/production-planning/laser-cutting-process-plan',
                  name: 'LaserCuttingProcessPlanList',
                  meta: { title: '激光下料工序计划' },
                  icon: 'el-icon-position'
                },
                {
                  path: '/production-planning/bending-process-plan',
                  name: 'BendingProcessPlanList',
                  meta: { title: '折弯工序计划' },
                  icon: 'el-icon-finished'
                },
                {
                  path: '/production-planning/drilling-process-plan',
                  name: 'DrillingProcessPlanList',
                  meta: { title: '打孔工序计划' },
                  icon: 'el-icon-aim'
                },
                {
                  path: '/production-planning/punching-process-plan',
                  name: 'PunchingProcessPlanList',
                  meta: { title: '冲床工序计划' },
                  icon: 'el-icon-postcard'
                },
                {
                  path: '/production-planning/manual-cutting-process-plan',
                  name: 'ManualCuttingProcessPlanList',
                  meta: { title: '人工下料工序计划' },
                  icon: 'el-icon-knife-fork'
                },
                {
                  path: '/production-planning/machine-grinding-process-plan',
                  name: 'MachineGrindingProcessPlanList',
                  meta: { title: '机器打磨工序计划' },
                  icon: 'el-icon-brush'
                },
                {
                  path: '/production-planning/cutting-process-plan',
                  name: 'CuttingProcessPlanList',
                  meta: { title: '裁剪工序计划' },
                  icon: 'el-icon-crop'
                },
                {
                  path: '/production-planning/capacity-planning',
                  name: 'CapacityPlanning',
                  meta: { title: '产能规划' },
                  icon: 'el-icon-s-data'
                }
              ]
            },
            {
              path: '/material-control',
              name: 'MaterialControl',
              meta: { title: '物控管理' },
              icon: 'el-icon-s-cooperation',
              children: [
                {
                  path: '/inventory/projected-balance',
                  name: 'ProjectedBalance',
                  meta: { title: '预计结存' },
                  icon: 'el-icon-s-data'
                },
                {
                  path: '/mrp/capacity-load',
                  name: 'CapacityLoad',
                  meta: { title: '工序能力负荷表' },
                  icon: 'el-icon-s-data'
                },
                {
                  path: '/mrp/plan-approve',
                  name: 'MRPPlanApprove',
                  meta: { title: 'MRP计划审核' },
                  icon: 'el-icon-finished'
                },
                {
                  path: '/mrp/material-demand',
                  name: 'MaterialDemand',
                  meta: { title: '物料需求明细' },
                  icon: 'el-icon-document-copy'
                }
              ]
            },
            {
              path: '/process-planning',
              name: 'ProcessPlanning',
              meta: { title: '工序计划' },
              icon: 'el-icon-s-order',
              children: [
                {
                  path: '/process-planning/operation-sequence',
                  name: 'OperationSequence',
                  meta: { title: '工序顺序管理' },
                  icon: 'el-icon-sort'
                },
                {
                  path: '/process-planning/process-plan-create',
                  name: 'ProcessPlanCreate',
                  meta: { title: '工序计划创建' },
                  icon: 'el-icon-document-add'
                },
                {
                  path: '/process-planning/process-route',
                  name: 'ProcessRoute',
                  meta: { title: '工序路线管理' },
                  icon: 'el-icon-share'
                },
                {
                  path: '/process-planning/work-instruction',
                  name: 'WorkInstruction',
                  meta: { title: '工作指导书管理' },
                  icon: 'el-icon-document'
                }
              ]
            }
          ]
        },
        {
          path: '/purchase-management',
          name: 'PurchaseManagement',
          meta: { title: '采购管理' },
          icon: 'el-icon-shopping-cart-2',
          children: [
            {
              path: '/purchase/orders',
              name: 'PurchaseOrders',
              meta: { title: '采购订单' },
              icon: 'el-icon-document',
              children: [
                {
                  path: '/purchase/order-create',
                  name: 'PurchaseOrderCreate',
                  meta: { title: '创建采购订单' },
                  icon: 'el-icon-document-add'
                },
                {
                  path: '/purchase/order-approve',
                  name: 'PurchaseOrderApprove',
                  meta: { title: '采购订单审批' },
                  icon: 'el-icon-check'
                }
              ]
            },
            {
              path: '/purchase/tracking',
              name: 'PurchaseTracking',
              meta: { title: '采购跟踪' },
              icon: 'el-icon-view'
            },
            {
              path: '/purchase/supplier-evaluation',
              name: 'SupplierEvaluation',
              meta: { title: '供应商评估' },
              icon: 'el-icon-s-data'
            },
            {
              path: '/purchase/supplier-management',
              name: 'SupplierManagement',
              meta: { title: '供应商管理' },
              icon: 'el-icon-office-building'
            },
            {
              path: '/purchase/procurement-plan',
              name: 'ProcurementPlan',
              meta: { title: '采购计划' },
              icon: 'el-icon-s-order'
            },
            {
              path: '/purchase/purchase-statistics',
              name: 'PurchaseStatistics',
              meta: { title: '采购统计' },
              icon: 'el-icon-s-data'
            },
            {
              path: '/purchase/purchase-tracking-detail',
              name: 'PurchaseTrackingDetail',
              meta: { title: '采购跟踪详情页' },
              icon: 'el-icon-document'
            }
          ]
        },
        {
          path: '/equipment-technician',
          name: 'EquipmentTechnician',
          meta: { title: '设备&技工管理（待部署）' },
          icon: 'el-icon-s-tools',
          children: []
        },
        {
          path: '/mold-fixture',
          name: 'MoldFixture',
          meta: { title: '模具&工装夹具管理（待部署）' },
          icon: 'el-icon-s-platform',
          children: []
        },
        {
          path: '/quality-management',
          name: 'QualityManagement',
          meta: { title: '品保管理' },
          icon: 'el-icon-s-check',
          children: []
        },
        {
          path: '/finance-management',
          name: 'FinanceManagement',
          meta: { title: '财务管理' },
          icon: 'el-icon-s-finance',
          children: [
            {
              path: '/finance/overview',
              name: 'FinanceOverview',
              meta: { title: '财务概览' },
              icon: 'el-icon-data-line'
            },
            {
              path: '/finance/cost-management',
              name: 'CostManagement',
              meta: { title: '成本管理' },
              icon: 'el-icon-coin'
            },
            {
              path: '/finance/expense-reimbursement',
              name: 'ExpenseReimbursement',
              meta: { title: '费用报销' },
              icon: 'el-icon-document'
            },
            {
              path: '/cost/budget-management',
              name: 'BudgetManagement',
              meta: { title: '预算管理' },
              icon: 'el-icon-s-finance'
            },
            {
              path: '/finance/payment-application',
              name: 'PaymentApplication',
              meta: { title: '付款申请' },
              icon: 'el-icon-document-add'
            },
            {
              path: '/finance/payment-plan',
              name: 'PaymentPlan',
              meta: { title: '付款计划' },
              icon: 'el-icon-s-order'
            },
            {
              path: '/finance/collection-management',
              name: 'CollectionManagement',
              meta: { title: '收款管理' },
              icon: 'el-icon-money'
            },
            {
              path: '/finance/payment-follow-up',
              name: 'PaymentFollowUp',
              meta: { title: '回款跟进' },
              icon: 'el-icon-view'
            },
            {
              path: '/finance/account-receivable',
              name: 'AccountReceivable',
              meta: { title: '应收账款' },
              icon: 'el-icon-wallet'
            },
            {
              path: '/finance/invoice-management',
              name: 'InvoiceManagement',
              meta: { title: '发票管理' },
              icon: 'el-icon-tickets'
            },
            {
              path: '/finance/financial-report',
              name: 'FinancialReport',
              meta: { title: '财务报表' },
              icon: 'el-icon-document'
            },
            {
              path: '/finance/financial-analysis',
              name: 'FinancialAnalysis',
              meta: { title: '财务分析' },
              icon: 'el-icon-data-analysis'
            },
            {
              path: '/finance/tax-management',
              name: 'TaxManagement',
              meta: { title: '税务管理' },
              icon: 'el-icon-s-claim'
            },
            {
              path: '/cost/cost-center',
              name: 'CostCenter',
              meta: { title: '成本中心' },
              icon: 'el-icon-office-building'
            },
            {
              path: '/cost/cost-item',
              name: 'CostItem',
              meta: { title: '成本项目' },
              icon: 'el-icon-notebook-2'
            },
            {
              path: '/cost/cost-allocation',
              name: 'CostAllocation',
              meta: { title: '成本分配' },
              icon: 'el-icon-share'
            },
            {
              path: '/cost/cost-analysis',
              name: 'CostAnalysis',
              meta: { title: '成本分析' },
              icon: 'el-icon-data-board'
            },
            {
              path: '/cost/profit-analysis',
              name: 'ProfitAnalysis',
              meta: { title: '利润分析' },
              icon: 'el-icon-trophy'
            }
          ]
        },
        {
          path: '/logistics-management',
          name: 'LogisticsManagement',
          meta: { title: '后勤管理' },
          icon: 'el-icon-s-goods',
          children: []
        },
        {
          path: '/admin-management',
          name: 'AdminManagement',
          meta: { title: '行政管理' },
          icon: 'el-icon-s-custom',
          children: []
        },
        {
          path: '/info-communication',
          name: 'InfoCommunication',
          meta: { title: '信息沟通' },
          icon: 'el-icon-message',
          children: []
        },
        {
          path: '/oa-application',
          name: 'OAApplication',
          meta: { title: 'OA申请' },
          icon: 'el-icon-document-checked',
          children: [
            {
              path: '/purchase/requisition',
              name: 'PurchaseRequisition',
              meta: { title: '采购申请' },
              icon: 'el-icon-document-add'
            }
          ]
        },
        {
          path: '/warehouse-logistics',
          name: 'WarehouseLogistics',
          meta: { title: '仓储&物流管理' },
          icon: 'el-icon-box',
          children: [
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
              icon: 'el-icon-s-home',
              children: [
                {
                  path: '/warehouse/manage',
                  name: 'WarehouseManage',
                  meta: { title: '仓库管理' },
                  icon: 'el-icon-s-home'
                },
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
            },
            {
              path: '/inventory',
              name: 'InventoryManagement',
              meta: { title: '库存管理' },
              icon: 'el-icon-s-data',
              children: [
                {
                  path: '/inventory/list',
                  name: 'InventoryList',
                  meta: { title: '库存列表' },
                  icon: 'el-icon-document'
                },
                {
                  path: '/inventory/detail',
                  name: 'InventoryDetail',
                  meta: { title: '库存明细' },
                  icon: 'el-icon-tickets'
                },
                {
                  path: '/inventory/report',
                  name: 'InventoryReport',
                  meta: { title: '库存报表' },
                  icon: 'el-icon-s-marketing'
                },
                {
                  path: '/inventory/stock-movement',
                  name: 'StockMovement',
                  meta: { title: '库存移动' },
                  icon: 'el-icon-sort'
                }
              ]
            },
            {
              path: '/shipping',
              name: 'Shipping',
              meta: { title: '发货计划' },
              icon: 'el-icon-s-promotion',
              children: [
                {
                  path: '/shipping/logistics-tracking',
                  name: 'LogisticsTracking',
                  meta: { title: '发货物流跟踪' },
                  icon: 'el-icon-location'
                },
                {
                  path: '/shipping/delivery-note',
                  name: 'DeliveryNote',
                  meta: { title: '发货单' },
                  icon: 'el-icon-document'
                },
                {
                  path: '/shipping/shipping-execution',
                  name: 'ShippingExecution',
                  meta: { title: '发货执行' },
                  icon: 'el-icon-s-promotion'
                },
                {
                  path: '/shipping/shipping-application',
                  name: 'ShippingApplication',
                  meta: { title: '发货申请' },
                  icon: 'el-icon-document-add'
                }
              ]
            }
          ]
        },
        {
          path: '/scheduling',
          name: 'Scheduling',
          meta: { title: '排程管理' },
          icon: 'el-icon-s-data',
          children: [
            {
              path: '/scheduling/list',
              name: 'ScheduleList',
              meta: { title: '排程列表' },
              icon: 'el-icon-document'
            },
            {
              path: '/scheduling/create',
              name: 'ScheduleCreate',
              meta: { title: '创建排程' },
              icon: 'el-icon-document-add'
            },
            {
              path: '/scheduling/board',
              name: 'ScheduleBoard',
              meta: { title: '排程看板' },
              icon: 'el-icon-s-platform'
            },
            {
              path: '/scheduling/optimize',
              name: 'ScheduleOptimize',
              meta: { title: '排程优化' },
              icon: 'el-icon-s-tools'
            },
            {
              path: '/scheduling/machine-loading',
              name: 'MachineLoading',
              meta: { title: '机器负载' },
              icon: 'el-icon-s-operation'
            }
          ]
        },
        {
          path: '/production-dispatch',
          name: 'ProductionDispatch',
          meta: { title: '生产派工' },
          icon: 'el-icon-s-custom',
          children: [
            {
              path: '/production-dispatch/list',
              name: 'DispatchList',
              meta: { title: '派工列表' },
              icon: 'el-icon-document'
            },
            {
              path: '/production-dispatch/create',
              name: 'DispatchCreate',
              meta: { title: '创建派工' },
              icon: 'el-icon-document-add'
            },
            {
              path: '/production-dispatch/board',
              name: 'DispatchBoard',
              meta: { title: '派工看板' },
              icon: 'el-icon-s-platform'
            },
            {
              path: '/production-dispatch/work-assignment',
              name: 'WorkAssignment',
              meta: { title: '工作分配' },
              icon: 'el-icon-s-operation'
            },
            {
              path: '/production-dispatch/worker-schedule',
              name: 'WorkerSchedule',
              meta: { title: '工人排程' },
              icon: 'el-icon-user'
            }
          ]
        },
        {
          path: '/production-reporting',
          name: 'ProductionReporting',
          meta: { title: '生产报工' },
          icon: 'el-icon-document-checked',
          children: [
            {
              path: '/production-reporting/work-report',
              name: 'WorkReport',
              meta: { title: '工作报工' },
              icon: 'el-icon-edit'
            },
            {
              path: '/production-reporting/progress-report',
              name: 'ProgressReport',
              meta: { title: '进度报告' },
              icon: 'el-icon-data-line'
            },
            {
              path: '/production-reporting/output-report',
              name: 'OutputReport',
              meta: { title: '产出报告' },
              icon: 'el-icon-s-data'
            },
            {
              path: '/production-reporting/quality-report',
              name: 'QualityReport',
              meta: { title: '质量报告' },
              icon: 'el-icon-s-check'
            },
            {
              path: '/production-reporting/defect-report',
              name: 'DefectReport',
              meta: { title: '缺陷报告' },
              icon: 'el-icon-warning'
            }
          ]
        },
        {
          path: '/human-resources',
          name: 'HumanResources',
          meta: { title: '人事管理' },
          icon: 'el-icon-user',
          children: [
            {
              path: '/human-resources/dashboard',
              name: 'HRDashboard',
              meta: { title: '人事概览' },
              icon: 'el-icon-data-line'
            },
            {
              path: '/human-resources/employee-list',
              name: 'EmployeeList',
              meta: { title: '员工台账' },
              icon: 'el-icon-user'
            },
            {
              path: '/human-resources/user-list',
              name: 'UserList',
              meta: { title: '用户列表' },
              icon: 'el-icon-user-solid'
            },
            {
              path: '/human-resources/company-calendar',
              name: 'CompanyCalendar',
              meta: { title: '企业日历' },
              icon: 'el-icon-date'
            }
          ]
        },
        {
          path: '/demo',
          name: 'Demo',
          meta: { title: '演示功能' },
          icon: 'el-icon-monitor',
          children: [
            {
              path: '/demo/smart-select',
              name: 'SmartSelectDemo',
              meta: { title: '智能下拉演示' },
              icon: 'el-icon-select'
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
  background-color: #ffffff;
  color: #303133;
  transition: width 0.3s ease;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  overflow-y: auto;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.sidebar.sidebar-collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.sidebar-header .logo {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  transition: opacity 0.3s ease;
}

.sidebar.sidebar-collapsed .sidebar-header .logo {
  opacity: 0;
}

.collapse-btn {
  color: #606266;
  font-size: 16px;
}

/* 菜单搜索框 */
.menu-search {
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.menu-search .el-input {
  width: 100%;
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
  color: #303133 !important;
  height: 40px;
  line-height: 40px;
  padding: 0 20px;
  background-color: transparent;
}

.el-menu-item span,
.el-sub-menu__title span {
  color: #303133 !important;
}

.el-menu-item:hover,
.el-sub-menu__title:hover {
  background-color: #f5f7fa !important;
  color: #409EFF !important;
}

.el-menu-item:hover span,
.el-sub-menu__title:hover span {
  color: #409EFF !important;
}

.el-menu-item.is-active {
  background-color: #ecf5ff !important;
  color: #409EFF !important;
}

.el-menu-item.is-active span {
  color: #409EFF !important;
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
  font-size: 14px;
  color: #606266;
}

.sidebar-toggle:hover {
  color: #409EFF;
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