export default {
  path: '/bom-tree-structure',
  name: 'BomTreeStructure',
  component: () => import('@/pages/bom/BomTreeStructure.vue'),
  meta: {
    title: 'BOM树结构',
    icon: 'Grid',
    requiresAuth: false
  }
}
