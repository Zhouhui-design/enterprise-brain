import Layout from '@/layout/index.vue'

export default {
  path: '/product',
  component: Layout,
  redirect: '/product/manual',
  meta: { 
    title: '产品管理',
    icon: 'Box'
  },
  children: [
    {
      path: 'manual',
      name: 'ProductManual',
      component: () => import('@/pages/product/ProductManual.vue'),
      meta: { title: '产品手册' }
    }
  ]
}
