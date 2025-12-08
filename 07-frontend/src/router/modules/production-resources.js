/**
 * 生产资源管理路由模块
 */
import Layout from '@/layout/index.vue'

export default {
  path: '/production-resources',
  component: Layout,
  redirect: '/production-resources/equipment/list',
  name: 'ProductionResources',
  meta: { 
    title: '生产资源管理',
    icon: 'Setting'
  },
  children: [
    {
      path: 'equipment/list',
      name: 'EquipmentList',
      component: () => import('@/pages/production-resources/equipment/EquipmentList.vue'),
      meta: { 
        title: '设备列表',
        icon: 'Cpu'
      }
    },
    {
      path: 'equipment/status',
      name: 'EquipmentStatus',
      component: () => import('@/pages/production-resources/equipment/EquipmentStatus.vue'),
      meta: { 
        title: '设备状态',
        icon: 'Monitor'
      }
    },
    {
      path: 'equipment/maintenance',
      name: 'EquipmentMaintenance',
      component: () => import('@/pages/production-resources/equipment/EquipmentMaintenance.vue'),
      meta: { 
        title: '设备维护',
        icon: 'Tools'
      }
    },
    {
      path: 'equipment/repair',
      name: 'RepairManagement',
      component: () => import('@/pages/production-resources/equipment/RepairManagement.vue'),
      meta: { 
        title: '维修管理',
        icon: 'EditPen'
      }
    },
    {
      path: 'equipment/utilization',
      name: 'UtilizationReport',
      component: () => import('@/pages/production-resources/equipment/UtilizationReport.vue'),
      meta: { 
        title: '利用率报表',
        icon: 'PieChart'
      }
    }
  ]
}
