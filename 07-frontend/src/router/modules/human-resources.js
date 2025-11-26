// 07-frontend/src/router/modules/human-resources.js
import Layout from '@/layout/index.vue';

export default {
  path: '/human-resources',
  component: Layout,
  redirect: '/human-resources/dashboard',
  name: 'HumanResources',
  meta: { title: '人事管理', icon: 'User' }, // 使用用户图标
  children: [
    {
      path: 'dashboard',
      name: 'HRDashboard',
      component: () => import('@/pages/human-resources/HRDashboard.vue'),
      meta: { title: '人事概览' }
    },
    {
      path: 'user-list',
      name: 'UserList',
      component: () => import('@/pages/system/user-management/UserList.vue'), // 关联现有用户列表组件
      meta: { title: '用户列表' }
    },
    // 可添加更多部门门管理、职位管理等子路由
  ]
};
