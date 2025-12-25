const fs = require('fs');
const path = require('path');

/**
 * 路由自动加载工具
 * 自动扫描routes目录中的所有路由文件并注册到Express应用
 * @param {Object} app - Express应用实例
 */
function loadRoutes(app) {
  const routesDir = path.join(__dirname, '../routes');
  const routeFiles = fs.readdirSync(routesDir).filter(file => file.endsWith('.js'));

  // 路由文件与API路径的映射规则
  const routeMappings = {
    'materials': '/api/materials',
    'productionBoms': '/api/production-boms',
    'productionBomDrafts': '/api/production-bom-drafts',
    'customers': '/api/customers',
    'mrpDemands': '/api/mrp-demands',
    'salesOrders': '/api/sales-orders',
    'shippingPlans': '/api/shipping-plans',
    'productionPlans': '/api/production-plans',
    'projectedBalances': '/api/projected-balances',
    'bomTreeStructures': '/api/bom-tree-structures',
    'processes': '/api/processes',
    'mrpCalculation': '/api/mrp',
    'productManual': '/api/product-manual',
    'inventory': '/api/inventory',
    'masterProductionPlans': '/api/master-production-plans',
    'materialPreparationPlans': '/api/material-preparation-plans',
    'processPlans': '/api/process-plans',
    'realProcessPlans': '/api/real-process-plans',
    'assemblyProcessPlans': '/api/assembly-process-plans',
    'sewingProcessPlans': '/api/sewing-process-plans',
    'sprayPaintingProcessPlans': '/api/spray-painting-process-plans',
    'shotBlastingProcessPlans': '/api/shot-blasting-process-plans',
    'manualWeldingProcessPlans': '/api/manual-welding-process-plans',
    'tubeBendingProcessPlans': '/api/tube-bending-process-plans',
    'laserTubeCuttingProcessPlans': '/api/laser-tube-cutting-process-plans',
    'laserCuttingProcessPlans': '/api/laser-cutting-process-plans',
    'bendingProcessPlans': '/api/bending-process-plans',
    'drillingProcessPlans': '/api/drilling-process-plans',
    'punchingProcessPlans': '/api/punching-process-plans',
    'manualCuttingProcessPlans': '/api/manual-cutting-process-plans',
    'machineGrindingProcessPlans': '/api/machine-grinding-process-plans',
    'cuttingProcessPlans': '/api/cutting-process-plans',
    'packingProcessPlans': '/api/packing-process-plans',
    'capacityLoad': '/api/capacity-load',
    'companyCalendar': '/api/company-calendar',
    'listStyleProductionBoms': '/api/list-style-production-boms',
    'testDataFlow': '/api/test-data-flow',
    'procurementPlans': '/api/procurement-plans',
    'supplierEvaluations': '/api/supplier-evaluations',
    'supplierManagement': '/api/supplier-management',
    'warehouses-test-simple': '/api/warehouses',
    'bomPushRoutes': '/api/bom-push',
    'logs': '/api/logs'
  };

  // 过滤掉备份文件和特殊文件
  const validRouteFiles = routeFiles.filter(file => {
    return !file.includes('_backup') && 
           !file.includes('_complete') && 
           !file.includes('_fixed') && 
           file !== 'warehouses-test.js';
  });

  validRouteFiles.forEach(file => {
    const routeName = file.replace('.js', '');
    const apiPath = routeMappings[routeName];

    if (apiPath) {
      try {
        const router = require(path.join(routesDir, file));
        
        // 为库存路由添加特殊调试中间件
        if (routeName === 'inventory') {
          app.use(
            apiPath,
            (req, res, next) => {
              console.log(`[Inventory Route Debug] ${req.method} ${req.originalUrl}`);
              next();
            },
            router
          );
        } else {
          app.use(apiPath, router);
        }
        
        console.log(`🔧 路由已注册: ${apiPath} (${routeName})`);
      } catch (error) {
        console.error(`❌ 路由加载失败: ${routeName}`, error.message);
      }
    }
  });
}

module.exports = loadRoutes;
