import Layout from '@/layout/index.vue';

/**
 * 生产计划路由模块
 */
export default {
  path: '/production-planning',
  name: 'ProductionPlanning',
  component: Layout,
  meta: { 
    title: '生产计划',
    icon: 'Calendar'
  },
  children: [
    {
      path: 'plan-list',
      name: 'ProductionPlanList',
      component: () => import('@/pages/production-planning/ProductionPlanList.vue'),
      meta: { 
        title: '主生产计划',
        icon: 'Document'
      }
    },
    {
      path: 'plan-create',
      name: 'ProductionPlanCreate',
      component: () => import('@/pages/production-planning/ProductionPlanCreate.vue'),
      meta: { 
        title: '新建计划',
        icon: 'Plus',
        hidden: true
      }
    },
    {
      path: 'plan-detail/:id',
      name: 'PlanDetail',
      component: () => import('@/pages/production-planning/PlanDetail.vue'),
      meta: { 
        title: '计划详情',
        icon: 'View',
        hidden: true
      }
    },
    {
      path: 'adjustment',
      name: 'PlanAdjustment',
      component: () => import('@/pages/production-planning/PlanAdjustment.vue'),
      meta: { 
        title: '计划调整',
        icon: 'Edit'
      }
    },
    {
      path: 'material-preparation',
      name: 'MaterialPreparationPlan',
      component: () => import('@/pages/production-planning/MaterialPreparationPlan.vue'),
      meta: { 
        title: '备料计划',
        icon: 'Grid'
      }
    },
    {
      path: 'material-preparation-new',
      name: 'MaterialPreparationPlanNew',
      component: () => import('@/pages/production-planning/MaterialPreparationPlanNew.vue'),
      meta: { 
        title: '备料计划（新架构）',
        icon: 'Grid'
      }
    },
    // 工序计划路由
    { 
      path: 'process-plan',
      name: 'ProcessPlanList',
      component: () => import('@/pages/production-planning/ProcessPlanList.vue'),
      meta: { 
        title: '工序计划',
        icon: 'List',
        hidden: true  // 添加此属性禁用菜单显示
      }
    },
    // ✅ 真工序计划（保留，显示所有工序）
    {
      path: 'real-process-plan',
      name: 'RealProcessPlanList',
      component: () => import('@/pages/production-planning/RealProcessPlanList.vue'),
      meta: { 
        title: '真工序计划',
        icon: 'List'
      },
      // ✅ 添加统筹页面子路由
      children: [
        {
          path: 'by-sales-order',
          name: 'RealProcessPlanBySalesOrder',
          component: () => import('@/pages/production-planning/consolidated/RealProcessPlanBySalesOrder.vue'),
          meta: { 
            title: '按销售订单合并',
            hidden: true
          }
        },
        {
          path: 'by-master-plan',
          name: 'RealProcessPlanByMasterPlan',
          component: () => import('@/pages/production-planning/consolidated/RealProcessPlanByMasterPlan.vue'),
          meta: { 
            title: '按来源主计划编号合并',
            hidden: true
          }
        },
        {
          path: 'by-material-plan',
          name: 'RealProcessPlanByMaterialPlan',
          component: () => import('@/pages/production-planning/consolidated/RealProcessPlanByMaterialPlan.vue'),
          meta: { 
            title: '按备料计划编号合并',
            hidden: true
          }
        },
        {
          path: 'by-demand-date',
          name: 'RealProcessPlanByDemandDate',
          component: () => import('@/pages/production-planning/consolidated/RealProcessPlanByDemandDate.vue'),
          meta: { 
            title: '按需求日期合并',
            hidden: true
          }
        },
        {
          path: 'by-material-code',
          name: 'RealProcessPlanByMaterialCode',
          component: () => import('@/pages/production-planning/consolidated/RealProcessPlanByMaterialCode.vue'),
          meta: { 
            title: '按计划物料编号合并',
            hidden: true
          }
        }
      ]
    },
    // ✅ 打包工序计划（只显示打包工序）
    {
      path: 'packing-process-plan',
      name: 'PackingProcessPlanList',
      component: () => import('@/pages/production-planning/PackingProcessPlanList.vue'),
      meta: { 
        title: '打包工序计划',
        icon: 'Box'
      }
    },
    // ✅ 组装工序计划（只显示组装工序）
    {
      path: 'assembly-process-plan',
      name: 'AssemblyProcessPlanList',
      component: () => import('@/pages/production-planning/AssemblyProcessPlanList.vue'),
      meta: { 
        title: '组装工序计划',
        icon: 'Setting'
      }
    },
    // ✅ 缝纫工序计划（只显示缝纫工序）
    {
      path: 'sewing-process-plan',
      name: 'SewingProcessPlanList',
      component: () => import('@/pages/production-planning/SewingProcessPlanList.vue'),
      meta: { 
        title: '缝纫工序计划',
        icon: 'Scissors'
      }
    },  // 这里添加逗号！
    // ✅ 喷塑工序计划（只显示喷塑工序）
    {
      path: 'spray-painting-process-plan',
      name: 'SprayPaintingProcessPlanList',
      component: () => import('@/pages/production-planning/SprayPaintingProcessPlanList.vue'),
      meta: { 
        title: '喷塑工序计划',
        icon: 'Palette'
      }
    }

  ]
}