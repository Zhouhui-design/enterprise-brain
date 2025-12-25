// 执行数据库迁移脚本 - 创建打包和组装工序计划表
const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔧 开始创建工序计划表...');

    // 读取SQL文件
    const packingSql = fs.readFileSync(path.join(__dirname, 'db/migration/create_packing_process_plans.sql'), 'utf8');
    const assemblySql = fs.readFileSync(path.join(__dirname, 'db/migration/create_assembly_process_plans.sql'), 'utf8');

    // 执行创建打包工序计划表
    console.log('📦 创建打包工序计划表...');
    await pool.query(packingSql);
    console.log('✅ 打包工序计划表创建成功');

    // 执行创建组装工序计划表
    console.log('🔧 创建组装工序计划表...');
    await pool.query(assemblySql);
    console.log('✅ 组装工序计划表创建成功');

    console.log('🎉 所有表创建完成!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

runMigration();
