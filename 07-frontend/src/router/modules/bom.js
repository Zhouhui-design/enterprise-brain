import Layout from '@/layout/index.vue'

const bomRouter = {
  path: '/bom',
  component: Layout,
  redirect: '/bom/design',
  meta: { 
    title: 'BOM管理',
    icon: 'List'
  },
  children: [
    {
      path: 'design',
      name: 'DesignBom',
      component: () => import('@/pages/bom/DesignBom.vue'),
      meta: { title: '设计BOM' }
    },
    {
      path: 'production',
      name: 'ProductionBom',
      component: () => import('@/pages/bom/ProductionBom.vue'),
      meta: { title: '生产BOM' }
    },
    {
      path: 'list-style-production-bom',
      name: 'ListStyleProductionBom',
      component: () => import('@/pages/bom/ListStyleProductionBom.vue'),
      meta: { title: '列表式生产BOM' }
    },
    {
      path: 'sales',
      name: 'SalesBom',
      component: () => import('@/pages/bom/SalesBom.vue'),
      meta: { title: '销售BOM' }
    }
  ]
}

export default bomRouter
