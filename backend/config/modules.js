/**
 * 模块化配置文件
 * 集中管理所有模块依赖和配置
 */

module.exports = {
  // 核心模块配置
  core: {
    express: {
      enabled: true,
      cors: {
        origin: '*', // 开发环境允许所有来源，生产环境应该限制具体域名
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
      jsonLimit: '50mb',
      urlencodedLimit: '50mb',
    },
    database: {
      enabled: true,
      type: process.env.DB_TYPE || 'mysql',
      pool: {
        acquireTimeout: 30000,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
      },
    },
    logger: {
      enabled: true,
      level: process.env.LOG_LEVEL || 'info',
      file: {
        enabled: true,
        path: './logs/app.log',
        maxSize: '10m',
        maxFiles: 5,
      },
    },
    swagger: {
      enabled: true,
      path: '/api-docs',
      title: 'Enterprise Brain API Documentation',
      description: 'API documentation for Enterprise Brain System',
      version: '1.0.0',
      basePath: '/api',
    },
  },

  // 业务模块配置
  modules: {
    // 物料管理模块
    materials: {
      enabled: true,
      routes: {
        prefix: '/api/materials',
        enabled: true,
      },
      controller: {
        enabled: true,
        path: './controllers/materialsController',
      },
      service: {
        enabled: true,
        path: './services/materialService',
      },
      middleware: {
        enabled: false,
        path: './middleware/materialsMiddleware',
      },
    },

    // 生产BOM模块
    productionBoms: {
      enabled: true,
      routes: {
        prefix: '/api/production-boms',
        enabled: true,
      },
      controller: {
        enabled: true,
        path: './controllers/productionBomController',
      },
      service: {
        enabled: true,
        path: './services/bomService',
      },
      middleware: {
        enabled: false,
        path: './middleware/bomMiddleware',
      },
    },

    // 销售订单模块
    salesOrders: {
      enabled: true,
      routes: {
        prefix: '/api/sales-orders',
        enabled: true,
      },
      controller: {
        enabled: true,
        path: './controllers/salesController',
      },
      service: {
        enabled: true,
        path: './services/salesService',
      },
    },

    // 库存管理模块
    inventory: {
      enabled: true,
      routes: {
        prefix: '/api/inventory',
        enabled: true,
      },
      service: {
        enabled: true,
        path: './services/inventoryService',
      },
    },

    // MRP计算模块
    mrpCalculation: {
      enabled: true,
      routes: {
        prefix: '/api/mrp',
        enabled: true,
      },
      service: {
        enabled: true,
        path: './services/mrpService',
      },
    },

    // 工序计划模块
    processPlans: {
      enabled: true,
      routes: {
        prefix: '/api/process-plans',
        enabled: true,
      },
      service: {
        enabled: true,
        path: './services/processPlanService',
      },
      utils: {
        enabled: true,
        path: './services/processPlanUtils',
      },
    },

    // 实际工序计划模块
    realProcessPlans: {
      enabled: true,
      routes: {
        prefix: '/api/real-process-plans',
        enabled: true,
      },
      service: {
        enabled: true,
        path: './services/realProcessPlanService',
      },
    },

    // 备料计划模块
    materialPreparationPlans: {
      enabled: true,
      routes: {
        prefix: '/api/material-preparation-plans',
        enabled: true,
      },
      service: {
        enabled: true,
        path: './services/materialPreparationPlanService',
      },
    },

    // 产能负荷模块
    capacityLoad: {
      enabled: true,
      routes: {
        prefix: '/api/capacity-load',
        enabled: true,
      },
      service: {
        enabled: true,
        path: './services/capacityLoadService',
      },
    },

    // BOM推送模块
    bomPush: {
      enabled: true,
      routes: {
        prefix: '/api/bom-push',
        enabled: true,
      },
      service: {
        enabled: true,
        path: './services/bomSyncService',
      },
    },

    // 各种工序计划子模块
    processPlanTypes: {
      assemblyProcessPlans: {
        enabled: true,
        routes: {
          prefix: '/api/assembly-process-plans',
          enabled: true,
        },
        service: {
          enabled: true,
          path: './services/assemblyProcessPlanService',
        },
      },
      bendingProcessPlans: {
        enabled: true,
        routes: {
          prefix: '/api/bending-process-plans',
          enabled: true,
        },
        service: {
          enabled: true,
          path: './services/bendingProcessPlanService',
        },
      },
      cuttingProcessPlans: {
        enabled: true,
        routes: {
          prefix: '/api/cutting-process-plans',
          enabled: true,
        },
        service: {
          enabled: true,
          path: './services/cuttingProcessPlanService',
        },
      },
      drillingProcessPlans: {
        enabled: true,
        routes: {
          prefix: '/api/drilling-process-plans',
          enabled: true,
        },
        service: {
          enabled: true,
          path: './services/drillingProcessPlanService',
        },
      },
      laserCuttingProcessPlans: {
        enabled: true,
        routes: {
          prefix: '/api/laser-cutting-process-plans',
          enabled: true,
        },
        service: {
          enabled: true,
          path: './services/laserCuttingProcessPlanService',
        },
      },
      packingProcessPlans: {
        enabled: true,
        routes: {
          prefix: '/api/packing-process-plans',
          enabled: true,
        },
        service: {
          enabled: true,
          path: './services/packingProcessPlanService',
        },
      },
    },
  },

  // 工具模块配置
  utils: {
    dateFormatter: {
      enabled: true,
      path: './utils/dateFormatter',
    },
    planEndDateCalculator: {
      enabled: true,
      path: './utils/planEndDateCalculator',
    },
    validation: {
      enabled: true,
      path: './utils/validation',
    },
    routeLoader: {
      enabled: true,
      path: './utils/routeLoader',
    },
  },

  // 定时任务配置
  scheduledTasks: {
    enabled: true,
    autoBackup: {
      enabled: true,
      cron: '0 8 * * *', // 每天08:00执行
      frequency: 'daily',
    },
    capacityLoadUpdate: {
      enabled: true,
      cron: '0 */4 * * *', // 每4小时执行一次
      frequency: 'every4hours',
    },
  },

  // API端点配置
  endpoints: {
    healthCheck: {
      enabled: true,
      path: '/health',
    },
    root: {
      enabled: true,
      path: '/',
    },
    testJson: {
      enabled: true,
      path: '/test-json',
    },
  },
};
