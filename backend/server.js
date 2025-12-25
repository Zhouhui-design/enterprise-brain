const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const logger = require('./config/logger');

// 设置全局日志记录器
global.logger = logger;

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3005;

// 导入分布式追踪中间件
const { traceMiddleware } = require('./middleware/traceMiddleware');

// 中间件 - 允许跨域访问
app.use(
  cors({
    origin: '*', // 开发环境允许所有来源，生产环境应该限制具体域名
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Trace-Id', 'X-Span-Id'],
  }),
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 分布式追踪中间件
app.use(traceMiddleware);

// 日志中间件 - 记录所有HTTP请求
const { accessLogger } = require('./config/logger');
app.use((req, res, next) => {
  accessLogger.info('HTTP Request', {
    method: req.method,
    url: req.path,
    ip: req.ip,
    traceId: req.traceId,
    spanId: req.spanId,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
      accept: req.get('Accept'),
      'x-trace-id': req.get('X-Trace-Id'),
      'x-span-id': req.get('X-Span-Id'),
    },
    query: req.query,
  });
  next();
});

// 路由自动加载
const loadRoutes = require('./utils/routeLoader');
loadRoutes(app);


// Swagger API文档
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Swagger UI路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
console.log('📚 Swagger API文档已注册: /api-docs');

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: 'Enterprise Brain Backend API Server',
    version: '1.0.0',
    endpoints: ['/api/customers', '/api/products', '/api/sales-orders', '/api/materials', '/health'],
  });
});

// 测试路由 - 简单JSON响应
app.get('/test-json', (req, res) => {
  // 测试多种JSON结构
  const testData = {
    list: [],
    total: 0,
    status: 'success',
    code: 200,
  };
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(testData));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error('Internal Server Error', {
    error: err,
    traceId: req.traceId,
    spanId: req.spanId,
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      headers: req.headers,
      body: req.body,
    },
    stack: err.stack,
  });
  res.status(500).json({
    code: 500,
    message: 'Internal Server Error',
    traceId: req.traceId,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Endpoint not found',
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

  // 执行数据库初始化 - 只在服务器启动时执行一次
  console.log('\n🔧 执行数据库初始化...');
  const { initializeDatabase } = require('./config/database');
  initializeDatabase().catch(err => {
    console.error('数据库初始化错误:', err);
  });

  // 启动自动备份任务
  console.log('\n💾 启动数据库自动备份系统...');
  require('./scripts/auto-backup');

  // 启动工序能力负荷表定时任务
  console.log('\n⏰ 启动工序能力负荷表定时任务...');
  const { scheduleDailyTask } = require('./scheduledTasks');
  scheduleDailyTask();

  // 启动WebSocket服务
  console.log('\n🔌 启动WebSocket服务...');
  const SalesWebSocket = require('./websocket/salesWebSocket');
  global.salesWebSocket = new SalesWebSocket(server);
  console.log('WebSocket服务已启动，路径: /ws/sales/realtime');

  // 启动监控服务
  console.log('\n📊 启动监控服务...');
  const monitoringService = require('./services/monitoringService');
  monitoringService.start();
  global.monitoringService = monitoringService;
  console.log('监控服务已启动');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // 关闭WebSocket服务
  if (global.salesWebSocket) {
    console.log('关闭WebSocket服务...');
    global.salesWebSocket.close();
  }
  
  // 关闭监控服务
  if (global.monitoringService) {
    console.log('关闭监控服务...');
    global.monitoringService.stop();
  }
  
  server.close(() => {
    console.log('HTTP server closed');
  });
});

// SIGINT信号处理 (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  
  // 关闭WebSocket服务
  if (global.salesWebSocket) {
    console.log('关闭WebSocket服务...');
    global.salesWebSocket.close();
  }
  
  // 关闭监控服务
  if (global.monitoringService) {
    console.log('关闭监控服务...');
    global.monitoringService.stop();
  }
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
