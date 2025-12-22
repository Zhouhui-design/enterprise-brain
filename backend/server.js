const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3005;

// 中间件 - 允许跨域访问
app.use(cors({
  origin: '*', // 开发环境允许所有来源，生产环境应该限制具体域名
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 测试中间件 - 记录所有请求
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.path}`);
  next();
});

// 路由
const materialsRouter = require('./routes/materials');
const productionBomsRouter = require('./routes/productionBoms');
const productionBomDraftsRouter = require('./routes/productionBomDrafts');
const customersRouter = require('./routes/customers');
const mrpDemandsRouter = require('./routes/mrpDemands');
const salesOrdersRouter = require('./routes/salesOrders');
const shippingPlansRouter = require('./routes/shippingPlans');
const productionPlansRouter = require('./routes/productionPlans');
const projectedBalancesRouter = require('./routes/projectedBalances');
const bomTreeStructuresRouter = require('./routes/bomTreeStructures');
const processesRouter = require('./routes/processes');
const mrpCalculationRouter = require('./routes/mrpCalculation');
const productManualRouter = require('./routes/productManual');
const inventoryRouter = require('./routes/inventory');
const masterProductionPlansRouter = require('./routes/masterProductionPlans');
const materialPreparationPlansRouter = require('./routes/materialPreparationPlans');
const processPlansRouter = require('./routes/processPlans');
const realProcessPlansRouter = require('./routes/realProcessPlans');
const assemblyProcessPlansRouter = require('./routes/assemblyProcessPlans');
const sewingProcessPlansRouter = require('./routes/sewingProcessPlans');
const sprayPaintingProcessPlansRouter = require('./routes/sprayPaintingProcessPlans');
// ✅ 新增11个工序计划路由
const shotBlastingProcessPlansRouter = require('./routes/shotBlastingProcessPlans');
const manualWeldingProcessPlansRouter = require('./routes/manualWeldingProcessPlans');
const tubeBendingProcessPlansRouter = require('./routes/tubeBendingProcessPlans');
const laserTubeCuttingProcessPlansRouter = require('./routes/laserTubeCuttingProcessPlans');
const laserCuttingProcessPlansRouter = require('./routes/laserCuttingProcessPlans');
const bendingProcessPlansRouter = require('./routes/bendingProcessPlans');
const drillingProcessPlansRouter = require('./routes/drillingProcessPlans');
const punchingProcessPlansRouter = require('./routes/punchingProcessPlans');
const manualCuttingProcessPlansRouter = require('./routes/manualCuttingProcessPlans');
const machineGrindingProcessPlansRouter = require('./routes/machineGrindingProcessPlans');
const cuttingProcessPlansRouter = require('./routes/cuttingProcessPlans');
// ✅ 添加打包工序计划路由
const packingProcessPlansRouter = require('./routes/packingProcessPlans');
const capacityLoadRouter = require('./routes/capacityLoad');
const companyCalendarRouter = require('./routes/companyCalendar');
const listStyleProductionBomsRouter = require('./routes/listStyleProductionBoms');
const testDataFlowRouter = require('./routes/testDataFlow');
const procurementPlansRouter = require('./routes/procurementPlans');
const supplierEvaluationsRouter = require('./routes/supplierEvaluations');
const supplierManagementRouter = require('./routes/supplierManagement');
const warehousesRouter = require('./routes/warehouses-test-simple');

app.use('/api/materials', materialsRouter);
app.use('/api/production-boms', productionBomsRouter);
app.use('/api/production-bom-drafts', productionBomDraftsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/mrp-demands', mrpDemandsRouter);
app.use('/api/sales-orders', salesOrdersRouter);
app.use('/api/shipping-plans', shippingPlansRouter);
app.use('/api/production-plans', productionPlansRouter);
app.use('/api/product-manual', productManualRouter);
app.use('/api/projected-balances', projectedBalancesRouter);
app.use('/api/bom-tree-structures', bomTreeStructuresRouter);
app.use('/api/processes', processesRouter);
app.use('/api/mrp', mrpCalculationRouter);
// 为库存路由添加调试中间件
app.use('/api/inventory', (req, res, next) => {
  console.log(`[Inventory Route Debug] ${req.method} ${req.originalUrl}`);
  next();
}, inventoryRouter);
app.use('/api/master-production-plans', masterProductionPlansRouter);
app.use('/api/material-preparation-plans', materialPreparationPlansRouter);
app.use('/api/process-plans', processPlansRouter);
app.use('/api/real-process-plans', realProcessPlansRouter);
app.use('/api/assembly-process-plans', assemblyProcessPlansRouter);
console.log('🔧 组装工序计划路由已注册: /api/assembly-process-plans');
app.use('/api/sewing-process-plans', sewingProcessPlansRouter);
console.log('🔧 缝纫工序计划路由已注册: /api/sewing-process-plans');
app.use('/api/spray-painting-process-plans', sprayPaintingProcessPlansRouter);
console.log('🔧 喷塑工序计划路由已注册: /api/spray-painting-process-plans');
// ✅ 注册11个新工序计划路由
app.use('/api/shot-blasting-process-plans', shotBlastingProcessPlansRouter);
console.log('🔧 抛丸工序计划路由已注册: /api/shot-blasting-process-plans');
app.use('/api/manual-welding-process-plans', manualWeldingProcessPlansRouter);
console.log('🔧 人工焊接工序计划路由已注册: /api/manual-welding-process-plans');
app.use('/api/tube-bending-process-plans', tubeBendingProcessPlansRouter);
console.log('🔧 弯管工序计划路由已注册: /api/tube-bending-process-plans');
app.use('/api/laser-tube-cutting-process-plans', laserTubeCuttingProcessPlansRouter);
console.log('🔧 激光切管工序计划路由已注册: /api/laser-tube-cutting-process-plans');
app.use('/api/laser-cutting-process-plans', laserCuttingProcessPlansRouter);
console.log('🔧 激光下料工序计划路由已注册: /api/laser-cutting-process-plans');
app.use('/api/bending-process-plans', bendingProcessPlansRouter);
console.log('🔧 折弯工序计划路由已注册: /api/bending-process-plans');
app.use('/api/drilling-process-plans', drillingProcessPlansRouter);
console.log('🔧 打孔工序计划路由已注册: /api/drilling-process-plans');
app.use('/api/punching-process-plans', punchingProcessPlansRouter);
console.log('🔧 冲床工序计划路由已注册: /api/punching-process-plans');
app.use('/api/manual-cutting-process-plans', manualCuttingProcessPlansRouter);
console.log('🔧 人工下料工序计划路由已注册: /api/manual-cutting-process-plans');
app.use('/api/machine-grinding-process-plans', machineGrindingProcessPlansRouter);
console.log('🔧 机器打磨工序计划路由已注册: /api/machine-grinding-process-plans');
app.use('/api/cutting-process-plans', cuttingProcessPlansRouter);
console.log('🔧 裁剪工序计划路由已注册: /api/cutting-process-plans');
// ✅ 注册打包工序计划路由
app.use('/api/packing-process-plans', packingProcessPlansRouter);
console.log('🔧 打包工序计划路由已注册: /api/packing-process-plans');
app.use('/api/capacity-load', capacityLoadRouter);
console.log('📡 工序能力负荷表路由已注册: /api/capacity-load');
app.use('/api/company-calendar', companyCalendarRouter);
app.use('/api/list-style-production-boms', listStyleProductionBomsRouter);
app.use('/api/test-data-flow', testDataFlowRouter);
console.log('🧪 测试数据流路由已注册: /api/test-data-flow');
app.use('/api/procurement-plans', procurementPlansRouter);
console.log('🛒 采购计划路由已注册: /api/procurement-plans');
app.use('/api/supplier-evaluations', supplierEvaluationsRouter);
console.log('⭐ 供应商评价路由已注册: /api/supplier-evaluations');
app.use('/api/supplier-management', supplierManagementRouter);
console.log('🏢 供应商管理路由已注册: /api/supplier-management');
app.use('/api/warehouses', warehousesRouter);
console.log('🏭 仓库管理路由已注册: /api/warehouses');



// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径
app.get('/', (req, res) => {
  res.json({ 
    message: 'Enterprise Brain Backend API Server',
    version: '1.0.0',
    endpoints: [
      '/api/customers',
      '/api/products',
      '/api/sales-orders',
      '/api/materials',
      '/health'
    ]
  });
});

// 测试路由 - 简单JSON响应
app.get('/test-json', (req, res) => {
  // 测试多种JSON结构
  const testData = {
    list: [],
    total: 0,
    status: 'success',
    code: 200
  };
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(testData));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    code: 500,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Endpoint not found'
  });
});

// 启动服务器 - 监听所有网络接口，允许局域网访问
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enterprise Brain Backend Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.2.229:${PORT}`);
  console.log('Server is accessible from other devices on the network');
  console.log('Press Ctrl+C to stop the server');
  
  // 启动自动备份任务
  console.log('\n💾 启动数据库自动备份系统...');
  require('./scripts/auto-backup');
  
  // 启动工序能力负荷表定时任务
  console.log('\n⏰ 启动工序能力负荷表定时任务...');
  const { scheduleDailyTask } = require('./scheduledTasks');
  scheduleDailyTask();
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;