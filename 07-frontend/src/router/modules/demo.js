import Layout from '@/layout/index.vue'

export default {
  path: '/demo',
  component: Layout,
  redirect: '/demo/smart-select',
  name: 'Demo',
  meta: {
    title: '演示功能',
    icon: 'Menu'
  },
  children: [
    {
      path: 'smart-select',
      component: () => import('@/pages/demo/SmartSelectDemo.vue'),
      name: 'SmartSelectDemo',
      meta: {
        title: '智能下拉演示',
        icon: 'Select'
      }
    }
  ]
}