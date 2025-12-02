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

// 路由
const materialsRouter = require('./routes/materials');
const productionBomsRouter = require('./routes/productionBoms');
const productionBomDraftsRouter = require('./routes/productionBomDrafts');

app.use('/api/materials', materialsRouter);
app.use('/api/production-boms', productionBomsRouter);
app.use('/api/production-bom-drafts', productionBomDraftsRouter);

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
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;