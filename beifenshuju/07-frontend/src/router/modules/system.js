import Layout from '@/layout/index.vue';

export default {
  path: '/system',
  component: Layout,
  redirect: '/system/audit-log',
  name: 'System',
  meta: { title: '系统管理', icon: 'Setting' },
  children: [
    {
      path: 'audit-log',
      name: 'AuditLog',
      component: () => import('@/pages/system/audit-management/AuditLogList.vue'),
      meta: { title: '审计日志' }
    },
    {
      path: 'data-change',
      name: 'DataChange',
      component: () => import('@/pages/system/audit-management/DataChangeList.vue'),
      meta: { title: '数据变更记录' }
    },
    {
      path: 'operation-trace',
      name: 'OperationTrace',
      component: () => import('@/pages/system/audit-management/OperationTrace.vue'),
      meta: { title: '操作轨迹' }
    }
  ]
};
