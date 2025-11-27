import Layout from '@/layout/index.vue';

export default {
  path: '/quality-management',
  component: Layout,
  redirect: '/quality-management/dashboard',
  name: 'QualityManagement',
  meta: {
    title: '质量管理',
    icon: 'el-icon-medal',
    permissions: ['QUALITY:MANAGE']
  },
  children: [
    {
      path: 'dashboard',
      component: () => import('@/pages/quality-management/QualityDashboard.vue'),
      name: 'QualityDashboard',
      meta: {
        title: '质量仪表板',
        icon: 'el-icon-data-analysis',
        permissions: ['QUALITY:DASHBOARD:VIEW']
      }
    },
    {
      path: 'quality-plan',
      component: () => import('@/pages/quality-management/QualityPlan.vue'),
      name: 'QualityPlan',
      meta: {
        title: '质量计划',
        icon: 'el-icon-document',
        permissions: ['QUALITY:PLAN:VIEW']
      }
    },
    {
      path: 'quality-inspection',
      component: () => import('@/pages/quality-management/QualityInspection.vue'),
      name: 'QualityInspection',
      meta: {
        title: '质量检验',
        icon: 'el-icon-search',
        permissions: ['QUALITY:INSPECTION:VIEW']
      }
    },
    {
      path: 'quality-check',
      component: () => import('@/pages/quality-management/QualityCheck.vue'),
      name: 'QualityCheck',
      meta: {
        title: '质量检查',
        icon: 'el-icon-check',
        permissions: ['QUALITY:CHECK:VIEW']
      }
    },
    {
      path: 'quality-control',
      component: () => import('@/pages/quality-management/QualityControl.vue'),
      name: 'QualityControl',
      meta: {
        title: '质量控制',
        icon: 'el-icon-s-operation',
        permissions: ['QUALITY:CONTROL:VIEW']
      }
    },
    {
      path: 'quality-audit',
      component: () => import('@/pages/quality-management/QualityAudit.vue'),
      name: 'QualityAudit',
      meta: {
        title: '质量审核',
        icon: 'el-icon-upload',
        permissions: ['QUALITY:AUDIT:VIEW']
      }
    },
    {
      path: 'defect-analysis',
      component: () => import('@/pages/quality-management/DefectAnalysis.vue'),
      name: 'DefectAnalysis',
      meta: {
        title: '缺陷分析',
        icon: 'el-icon-warning',
        permissions: ['QUALITY:DEFECT:VIEW']
      }
    },
    {
      path: 'spc-chart',
      component: () => import('@/pages/quality-management/SPCChart.vue'),
      name: 'SPCChart',
      meta: {
        title: '统计过程控制',
        icon: 'el-icon-data-line',
        permissions: ['QUALITY:SPC:VIEW']
      }
    }
  ]
};