#!/usr/bin/env node

/**
 * 企业大脑后端服务启动脚本
 * 支持BOM导入导出功能
 */

// 加载环境变量
require('dotenv').config();

const { spawn } = require('child_process');
const path = require('path');

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
  console.error('❌ 需要Node.js 14或更高版本，当前版本:', nodeVersion);
  process.exit(1);
}

// 检查必要的依赖
const requiredPackages = ['express', 'multer', 'xlsx', 'mysql2'];
const missingPackages = [];

try {
  for (const pkg of requiredPackages) {
    require.resolve(pkg);
  }
} catch (error) {
  missingPackages.push(error.message.split("'")[1]);
}

if (missingPackages.length > 0) {
  console.error('❌ 缺少必要的依赖包:');
  missingPackages.forEach(pkg => console.error(`   - ${pkg}`));
  console.log('\n?? 请运行以下命令安装依赖:');
  console.log('   npm install ' + requiredPackages.join(' '));
  process.exit(1);
}

// 环境变量设置
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '3001';
process.env.HOST = process.env.HOST || '0.0.0.0';

// 启动信息
console.log(`
🚀 启动企业大脑后端服务...
╔══════════════════════════════════════════════════════════╗
║                        版本信息                                      ║
╠══════════════════════════════════════════════════════════╣
║  Node.js版本: ${nodeVersion}                                   ║
║  运行环境: ${process.env.NODE_ENV}                              ║
║  服务端口: ${process.env.PORT}                                     ║
║  绑定地址: ${process.env.HOST}                                   ║
╚══════════════════════════════════════════════════════════╝

🔧 服务配置:
• 主服务器: http://${process.env.HOST}:${process.env.PORT}
• 健康检查: http://${process.env.HOST}:${process.env.PORT}/health
• 上传目录: ${path.join(__dirname, 'uploads')}

🎯 功能模块:
✅ BOM导入导出 (/api/bom-import)
✅ 物料管理 (/api/materials)  
✅ BOM草稿 (/api/bom-draft)
✅ BOM树结构 (/api/bom-tree-structure)
✅ 列表式生产BOM (/api/list-style-production-bom)
✅ 产能负荷 (/api/capacity-load)
✅ 物料准备计划 (/api/material-preparation-plans)
✅ 打包工序计划 (/api/packing-process-plans)
✅ 产品管理 (/api/products)
✅ 销售订单 (/api/sales-orders)

📝 日志级别: ${process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO'}

🌐 服务启动中...
`);

// 启动服务器
const serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
  stdio: 'inherit',
  env: process.env
});

// 处理进程退出
serverProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ 服务器正常关闭');
  } else {
    console.log(`\n❌ 服务器异常退出，代码: ${code}`);
    process.exit(code);
  }
});

// 处理进程错误
serverProcess.on('error', (error) => {
  console.error('\n❌ 服务器启动失败:');
  console.error(error.message);
  process.exit(1);
});

// 优雅关闭处理
process.on('SIGINT', () => {
  console.log('\n🛑 收到关闭信号，正在优雅关闭服务器...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 收到终止信号，正在优雅关闭服务器...');
  serverProcess.kill('SIGTERM');
});
