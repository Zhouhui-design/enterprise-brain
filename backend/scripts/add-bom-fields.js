const db = require('../config/database');

/**
 * 为生产BOM表添加新字段的迁移脚本
 * 新增字段：
 * - total_labor: 总人工费用
 * - total_material: 总材料费用  
 * - product_image: 产品图片
 * - is_pushed_to_manual: 是否推送给产品手册
 */

console.log('开始添加生产BOM表新字段...');

try {
  // 检查字段是否已存在
  const tableInfo = db.prepare("PRAGMA table_info(production_boms)").all();
  const existingColumns = tableInfo.map(col => col.name);
  
  console.log('现有字段:', existingColumns.join(', '));
  
  // 添加 total_labor 字段
  if (!existingColumns.includes('total_labor')) {
    db.exec(`ALTER TABLE production_boms ADD COLUMN total_labor REAL DEFAULT 0`);
    console.log('✅ 已添加字段: total_labor');
  } else {
    console.log('⏭️  字段已存在: total_labor');
  }
  
  // 添加 total_material 字段
  if (!existingColumns.includes('total_material')) {
    db.exec(`ALTER TABLE production_boms ADD COLUMN total_material REAL DEFAULT 0`);
    console.log('✅ 已添加字段: total_material');
  } else {
    console.log('⏭️  字段已存在: total_material');
  }
  
  // 添加 product_image 字段
  if (!existingColumns.includes('product_image')) {
    db.exec(`ALTER TABLE production_boms ADD COLUMN product_image TEXT`);
    console.log('✅ 已添加字段: product_image');
  } else {
    console.log('⏭️  字段已存在: product_image');
  }
  
  // 添加 is_pushed_to_manual 字段
  if (!existingColumns.includes('is_pushed_to_manual')) {
    db.exec(`ALTER TABLE production_boms ADD COLUMN is_pushed_to_manual INTEGER DEFAULT 0`);
    console.log('✅ 已添加字段: is_pushed_to_manual');
  } else {
    console.log('⏭️  字段已存在: is_pushed_to_manual');
  }
  
  console.log('\n字段添加完成！');
  
  // 显示更新后的表结构
  const updatedTableInfo = db.prepare("PRAGMA table_info(production_boms)").all();
  console.log('\n更新后的表结构:');
  updatedTableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
  });
  
} catch (error) {
  console.error('❌ 添加字段失败:', error);
  process.exit(1);
}

console.log('\n迁移脚本执行完成！');
process.exit(0);
