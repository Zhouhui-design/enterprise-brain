import Layout from '@/layout/index.vue'

const materialRouter = {
  path: '/material',
  component: Layout,
  redirect: '/material/list',
  meta: { title: '物料管理' },
  children: [
    {
      path: 'list',
      name: 'MaterialList',
      component: () => import('@/pages/material/MaterialList.vue'),
      meta: { title: '产品物料库' }
    }
  ]
}

export default materialRouter
