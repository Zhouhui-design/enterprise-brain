import Layout from '@/layout/index.vue';

export default {
  path: '/scheduling',
  component: Layout,
  redirect: '/scheduling/list',
  name: 'Scheduling',
  meta: {
    title: '生产调度',
    icon: 'Clock',
    permission: ['scheduling:view']
  },
  children: [
    {
      path: 'list',
      name: 'ScheduleList',
      component: () => import('@/pages/scheduling/ScheduleList.vue'),
      meta: {
        title: '调度列表',
        permission: ['scheduling:list']
      }
    },
    {
      path: 'create',
      name: 'ScheduleCreate',
      component: () => import('@/pages/scheduling/ScheduleCreate.vue'),
      meta: {
        title: '创建调度',
        permission: ['scheduling:create']
      }
    },
    {
      path: 'board',
      name: 'ScheduleBoard',
      component: () => import('@/pages/scheduling/ScheduleBoard.vue'),
      meta: {
        title: '调度看板',
        permission: ['scheduling:board']
      }
    },
    {
      path: 'machine-loading',
      name: 'MachineLoading',
      component: () => import('@/pages/scheduling/MachineLoading.vue'),
      meta: {
        title: '设备负荷',
        permission: ['scheduling:machine-loading']
      }
    },
    {
      path: 'optimize',
      name: 'ScheduleOptimize',
      component: () => import('@/pages/scheduling/ScheduleOptimize.vue'),
      meta: {
        title: '调度优化',
        permission: ['scheduling:optimize']
      }
    },
    {
      path: 'demo',
      name: 'SchedulingDemo',
      component: () => import('@/pages/scheduling/SchedulingDemo.vue'),
      meta: {
        title: '调度演示',
        permission: ['scheduling:demo']
      }
    }
  ]
};