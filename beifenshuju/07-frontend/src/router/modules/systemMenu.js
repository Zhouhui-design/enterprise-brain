// 只保留正确的导入语句
import Layout from '@/layout/index.vue';

export default {
  path: '/system',
  component: Layout,
  redirect: '/system/menu-management',
  name: 'SystemManagement',
  meta: {
    title: '系统管理',
    icon: 'el-icon-setting',
    permissions: ['SYSTEM:MANAGE']
  },
  children: [
    {
      path: 'menu-management',
      component: () => import('@/pages/system/menu-management/MenuBuilder.vue'),
      name: 'MenuManagement',
      meta: {
        title: '菜单管理',
        icon: 'el-icon-menu',
        permissions: ['SYSTEM:MENU:VIEW']
      }
    },
    {
      path: 'menu-drag-sort',
      component: () => import('@/pages/system/menu-management/MenuDragSort.vue'),
      name: 'MenuDragSort',
      meta: {
        title: '菜单排序',
        icon: 'el-icon-sort',
        permissions: ['SYSTEM:MENU:SORT']
      }
    },
    {
      path: 'menu-permission',
      component: () => import('@/pages/system/menu-management/MenuPermission.vue'),
      name: 'MenuPermission',
      meta: {
        title: '菜单权限',
        icon: 'el-icon-lock',
        permissions: ['SYSTEM:MENU:PERMISSION']
      }
    },
    {
      path: 'user-menu-config',
      component: () => import('@/pages/system/menu-management/UserMenuConfig.vue'),
      name: 'UserMenuConfig',
      meta: {
        title: '用户菜单配置',
        icon: 'el-icon-user',
        permissions: ['SYSTEM:MENU:CONFIG']
      }
    }
  ]
}