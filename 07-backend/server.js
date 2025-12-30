const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;

// 导入路由模块
const bomImportRoutes = require('./routes/bom-import');
const materialRoutes = require('./routes/materials');
const bomDraftRoutes = require('./routes/bom-draft');
const bomTreeStructureRoutes = require('./routes/bomTreeStructure');
const listStyleProductionBomRoutes = require('./routes/listStyleProductionBom');
const capacityLoadRoutes = require('./routes/capacityLoad');
const materialPreparationRoutes = require('./routes/materialPreparationPlans');
const packingProcessRoutes = require('./routes/packingProcessPlans');
const processRoutes = require('./routes/processes');
const productRoutes = require('./routes/products');
const salesOrderRoutes = require('./routes/salesOrders');

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5173'], // 允许前端访问
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 创建uploads目录
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true }).catch(console.error);

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  services: {
      'bom-import': true,
      'materials': true,
      'bom-draft': true,
      'bom-tree-structure': true,
      'list-style-production-bom': true,
      'capacity-load': true,
      'material-preparation-plans': true,
      'packing-process-plans': true,
      'processes': true,
      'products': true,
      'sales-orders': true
    }
  });
});
// API路由
app.use('/api/bom-import', bomImportRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/bom-draft', bomDraftRoutes);
app.use('/api/bom-tree-structure', bomTreeStructureRoutes);
app.use('/api/list-style-production-bom', listStyleProductionBomRoutes);
app.use('/api/capacity-load', capacityLoadRoutes);
app.use('/api/material-preparation-plans', materialPreparationRoutes);
app.use('/api/packing-process-plans', packingProcessRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales-orders', salesOrderRoutes);

// 根路径
app.get('/', (req, res) => {
  res.json({
    message: '企业大脑后端服务',
    version: '1.0.0',
    apis: {
      'BOM导入导出': '/api/bom-import',
      '物料管理': '/api/materials',
      'BOM草稿': '/api/bom-draft',
      'BOM树结构': '/api/bom-tree-structure',
      '列表式生产BOM': '/api/list-style-production-bom',
      '产能负荷': '/api/capacity-load',
      '物料准备计划': '/api/material-preparation-plans',
      '打包工序计划': '/api/packing-process-plans',
      '工序管理': '/api/processes',
      '产品管理': '/api/products',
      '销售订单': '/api/sales-orders'
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    message: `路径 ${req.originalUrl} 未找到`,
    available_apis: [
      '/api/bom-import',
      '/api/materials',
      '/api/bom-draft',
      '/api/bom-tree-structure',
      '/api/list-style-production-bom',
      '/api/capacity-load',
      '/api/material-preparation-plans',
      '/api/packing-process-plans',
      '/api/products',
      '/api/sales-orders'
    ]
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  
  // 文件上传错误
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: '文件过大',
      message: '上传文件大小超过限制（10MB）'
    });
  }
  
  // 文件类型错误
  if (error.message && error.message.includes('只支持Excel文件')) {
    return res.status(400).json({
      error: '文件格式错误',
      message: error.message
    });
  }
  
  // 默认错误
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '服务暂时不可用，请稍后重试'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                        企业大脑后端服务启动成功                        ║
╠════════════════════════════════════════════════════════════╣
║  服务地址: http://${HOST}:${PORT}                                  ║
║  健康检查: http://${HOST}:${PORT}/health                          ║
║  环境: ${process.env.NODE_ENV || 'development'}                     ║
║  时间: ${new Date().toLocaleString('zh-CN')}                         ║
╚══════════════════════════════════════════════════════════════╝
🚀 可用的API接口:
┌─────────────────────────────────────────────────────────────────────┐
│ BOM导入导出:          /api/bom-import                           │
│ 物料管理:             /api/materials                          │
│ BOM草稿:              /api/bom-draft                          │
│ BOM树结构:            /api/bom-tree-structure                 │
│ 列表式生产BOM:         /api/list-style-production-bom            │
│ 产能负荷:             /api/capacity-load                       │
│ 物料准备计划:          /api/material-preparation-plans           │
│ 打包工序计划:          /api/packing-process-plans               │
│ 工序管理:              /api/processes                           │
│ 产品管理:              /api/products                           │
│ 销售订单:              /api/sales-orders                        │
└─────────────────────────────────────────────────────────────────────┘

📝 BOM导入导出功能说明:
• 支持 Excel (.xlsx, .xls) 文件导入
• 提供导入预览和验证
• 支持批量数据处理
• 自动错误检测和报告
• 支持导出为 Excel、CSV、JSON 格式
• 提供导入模板下载
• 完整的导入日志记录

🔧 使用说明:
1. 导入: POST /api/bom-import/import
2. 导出: GET /api/bom-import/export
3. 预览: POST /api/bom-import/preview
4. 验证: POST /api/bom-import/validate
5. 模板: GET /api/bom-import/template

📊 统计信息:
• 访问 http://${HOST}:${PORT}/health 查看服务状态
• 查看导入历史和统计信息
• 监控系统性能和错误率

✨ 新功能已就绪！
`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭服务器...');
  process.exit(0);
});

module.exports = app;
