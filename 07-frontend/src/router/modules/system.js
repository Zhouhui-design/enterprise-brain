import Layout from '@/layout/index.vue';

export default {
  path: '/system',
  component: Layout,
  redirect: '/system/overview',
  name: 'System',
  meta: { 
    title: '系统管理', 
    icon: 'Setting',
    permission: ['system:view']
  },
  children: [
    {
      path: 'overview',
      name: 'SystemOverview',
      component: () => import('@/pages/system/Overview.vue'),
      meta: { 
        title: '系统总览',
        icon: 'Monitor',
        permission: ['system:overview']
      }
    },
    // 用户管理
    {
      path: 'users',
      name: 'UserManagement',
      redirect: '/system/users/list',
      meta: { 
        title: '用户管理', 
        icon: 'User',
        permission: ['system:users']
      },
      children: [
        {
          path: 'list',
          name: 'UserList',
          component: () => import('@/pages/system/users/UserList.vue'),
          meta: { 
            title: '用户列表',
            permission: ['system:users:list']
          }
        },
        {
          path: 'create',
          name: 'UserCreate',
          component: () => import('@/pages/system/users/UserForm.vue'),
          meta: { 
            title: '新增用户',
            permission: ['system:users:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'UserEdit',
          component: () => import('@/pages/system/users/UserForm.vue'),
          meta: { 
            title: '编辑用户',
            permission: ['system:users:edit'],
            hidden: true
          }
        },
        {
          path: 'profile/:id',
          name: 'UserProfile',
          component: () => import('@/pages/system/users/UserProfile.vue'),
          meta: { 
            title: '用户资料',
            permission: ['system:users:profile'],
            hidden: true
          }
        }
      ]
    },
    // 角色权限
    {
      path: 'roles',
      name: 'RoleManagement',
      redirect: '/system/roles/list',
      meta: { 
        title: '角色权限', 
        icon: 'Key',
        permission: ['system:roles']
      },
      children: [
        {
          path: 'list',
          name: 'RoleList',
          component: () => import('@/pages/system/roles/RoleList.vue'),
          meta: { 
            title: '角色列表',
            permission: ['system:roles:list']
          }
        },
        {
          path: 'create',
          name: 'RoleCreate',
          component: () => import('@/pages/system/roles/RoleForm.vue'),
          meta: { 
            title: '新增角色',
            permission: ['system:roles:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'RoleEdit',
          component: () => import('@/pages/system/roles/RoleForm.vue'),
          meta: { 
            title: '编辑角色',
            permission: ['system:roles:edit'],
            hidden: true
          }
        },
        {
          path: 'permissions',
          name: 'PermissionManagement',
          component: () => import('@/pages/system/roles/PermissionManagement.vue'),
          meta: { 
            title: '权限管理',
            permission: ['system:roles:permissions']
          }
        }
      ]
    },
    // 部门管理
    {
      path: 'departments',
      name: 'DepartmentManagement',
      redirect: '/system/departments/list',
      meta: { 
        title: '部门管理', 
        icon: 'OfficeBuilding',
        permission: ['system:departments']
      },
      children: [
        {
          path: 'list',
          name: 'DepartmentList',
          component: () => import('@/pages/system/departments/DepartmentList.vue'),
          meta: { 
            title: '部门列表',
            permission: ['system:departments:list']
          }
        },
        {
          path: 'create',
          name: 'DepartmentCreate',
          component: () => import('@/pages/system/departments/DepartmentForm.vue'),
          meta: { 
            title: '新增部门',
            permission: ['system:departments:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'DepartmentEdit',
          component: () => import('@/pages/system/departments/DepartmentForm.vue'),
          meta: { 
            title: '编辑部门',
            permission: ['system:departments:edit'],
            hidden: true
          }
        }
      ]
    },
    // 菜单管理
    {
      path: 'menu',
      name: 'MenuManagement',
      redirect: '/system/menu/list',
      meta: { 
        title: '菜单管理', 
        icon: 'Menu',
        permission: ['system:menu']
      },
      children: [
        {
          path: 'list',
          name: 'MenuList',
          component: () => import('@/pages/system/menu-management/MenuList.vue'),
          meta: { 
            title: '菜单列表',
            permission: ['system:menu:list']
          }
        },
        {
          path: 'builder',
          name: 'MenuBuilder',
          component: () => import('@/pages/system/menu-management/MenuBuilder.vue'),
          meta: { 
            title: '菜单构建器',
            permission: ['system:menu:builder']
          }
        },
        {
          path: 'drag-sort',
          name: 'MenuDragSort',
          component: () => import('@/pages/system/menu-management/MenuDragSort.vue'),
          meta: { 
            title: '拖拽排序',
            permission: ['system:menu:sort']
          }
        },
        {
          path: 'permission',
          name: 'MenuPermission',
          component: () => import('@/pages/system/menu-management/MenuPermission.vue'),
          meta: { 
            title: '权限管理',
            permission: ['system:menu:permission']
          }
        },
        {
          path: 'user-config',
          name: 'UserMenuConfig',
          component: () => import('@/pages/system/menu-management/UserMenuConfig.vue'),
          meta: { 
            title: '用户菜单配置',
            permission: ['system:menu:user-config']
          }
        }
      ]
    },
    // 字典管理
    {
      path: 'dictionary',
      name: 'DictionaryManagement',
      redirect: '/system/dictionary/list',
      meta: { 
        title: '字典管理', 
        icon: 'Collection',
        permission: ['system:dictionary']
      },
      children: [
        {
          path: 'list',
          name: 'DictionaryList',
          component: () => import('@/pages/system/dictionary/DictionaryList.vue'),
          meta: { 
            title: '字典列表',
            permission: ['system:dictionary:list']
          }
        },
        {
          path: 'create',
          name: 'DictionaryCreate',
          component: () => import('@/pages/system/dictionary/DictionaryForm.vue'),
          meta: { 
            title: '新增字典',
            permission: ['system:dictionary:create'],
            hidden: true
          }
        },
        {
          path: 'edit/:id',
          name: 'DictionaryEdit',
          component: () => import('@/pages/system/dictionary/DictionaryForm.vue'),
          meta: { 
            title: '编辑字典',
            permission: ['system:dictionary:edit'],
            hidden: true
          }
        }
      ]
    },
    // 系统配置
    {
      path: 'config',
      name: 'SystemConfig',
      redirect: '/system/config/basic',
      meta: { 
        title: '系统配置', 
        icon: 'Tools',
        permission: ['system:config']
      },
      children: [
        {
          path: 'basic',
          name: 'BasicConfig',
          component: () => import('@/pages/system/config/BasicConfig.vue'),
          meta: { 
            title: '基础配置',
            permission: ['system:config:basic']
          }
        },
        {
          path: 'security',
          name: 'SecurityConfig',
          component: () => import('@/pages/system/config/SecurityConfig.vue'),
          meta: { 
            title: '安全配置',
            permission: ['system:config:security']
          }
        },
        {
          path: 'email',
          name: 'EmailConfig',
          component: () => import('@/pages/system/config/EmailConfig.vue'),
          meta: { 
            title: '邮件配置',
            permission: ['system:config:email']
          }
        },
        {
          path: 'storage',
          name: 'StorageConfig',
          component: () => import('@/pages/system/config/StorageConfig.vue'),
          meta: { 
            title: '存储配置',
            permission: ['system:config:storage']
          }
        }
      ]
    },
    // 操作日志
    {
      path: 'audit-log',
      name: 'AuditLog',
      component: () => import('@/pages/system/audit-management/AuditLogList.vue'),
      meta: { 
        title: '操作日志',
        permission: ['system:audit:view']
      }
    },
    {
      path: 'data-change',
      name: 'DataChange',
      component: () => import('@/pages/system/audit-management/DataChangeList.vue'),
      meta: { 
        title: '数据变更记录',
        permission: ['system:audit:data']
      }
    },
    {
      path: 'operation-trace',
      name: 'OperationTrace',
      component: () => import('@/pages/system/audit-management/OperationTrace.vue'),
      meta: { 
        title: '操作轨迹',
        permission: ['system:audit:trace']
      }
    },
    // 系统监控
    {
      path: 'monitor',
      name: 'SystemMonitor',
      redirect: '/system/monitor/server',
      meta: { 
        title: '系统监控', 
        icon: 'View',
        permission: ['system:monitor']
      },
      children: [
        {
          path: 'server',
          name: 'ServerMonitor',
          component: () => import('@/pages/system/monitor/ServerMonitor.vue'),
          meta: { 
            title: '服务器监控',
            permission: ['system:monitor:server']
          }
        },
        {
          path: 'database',
          name: 'DatabaseMonitor',
          component: () => import('@/pages/system/monitor/DatabaseMonitor.vue'),
          meta: { 
            title: '数据库监控',
            permission: ['system:monitor:database']
          }
        },
        {
          path: 'cache',
          name: 'CacheMonitor',
          component: () => import('@/pages/system/monitor/CacheMonitor.vue'),
          meta: { 
            title: '缓存监控',
            permission: ['system:monitor:cache']
          }
        },
        {
          path: 'performance',
          name: 'PerformanceMonitor',
          component: () => import('@/pages/system/monitor/PerformanceMonitor.vue'),
          meta: { 
            title: '性能监控',
            permission: ['system:monitor:performance']
          }
        }
      ]
    }
  ]
};
