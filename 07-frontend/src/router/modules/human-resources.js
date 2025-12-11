// 07-frontend/src/router/modules/human-resources.js
import Layout from '@/layout/index.vue';

export default {
  path: '/human-resources',
  component: Layout,
  redirect: '/human-resources/dashboard',
  name: 'HumanResources',
  meta: { title: '人事管理', icon: 'User' },
  children: [
    {
      path: 'dashboard',
      name: 'HRDashboard',
      component: () => import('@/pages/human-resources/HRDashboard.vue'),
      meta: { title: '人事概览' }
    },
    {
      path: 'employee-list',
      name: 'EmployeeList',
      component: () => import('@/pages/human-resources/employee-management/EmployeeList.vue'),
      meta: { title: '员工台账' }
    },
    {
      path: 'employee-create',
      name: 'EmployeeCreate',
      component: () => import('@/pages/human-resources/employee-management/EmployeeCreate.vue'),
      meta: { title: '新增员工', hidden: true }
    },
    {
      path: 'employee-detail/:id',
      name: 'EmployeeDetail',
      component: () => import('@/pages/human-resources/employee-management/EmployeeDetail.vue'),
      meta: { title: '员工详情', hidden: true }
    },
    {
      path: 'user-list',
      name: 'UserList',
      component: () => import('@/pages/system/user-management/UserList.vue'),
      meta: { title: '用户列表' }
    },
    {
      path: 'company-calendar',
      name: 'CompanyCalendar',
      component: () => import('@/pages/human-resources/CompanyCalendar.vue'),
      meta: { title: '企业日历' }
    }
  ]
};
