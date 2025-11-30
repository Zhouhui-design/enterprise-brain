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

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 路由
const materialsRouter = require('./routes/materials');

app.use('/api/materials', materialsRouter);

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

// 启动服务器
app.listen(PORT, () => {
  console.log(`Enterprise Brain Backend Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;