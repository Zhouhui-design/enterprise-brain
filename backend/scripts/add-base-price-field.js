const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/enterprise_brain.db');
const db = new Database(dbPath);

console.log('开始添加基础单价字段...\n');

try {
  // 1. 检查字段是否已存在
  console.log('1. 检查字段是否已存在...');
  const tableInfo = db.prepare('PRAGMA table_info(materials)').all();
  const hasBasePrice = tableInfo.some(col => col.name === 'base_price');
  
  if (hasBasePrice) {
    console.log('   ✅ 字段已存在，跳过添加');
  } else {
    // 2. 添加字段
    console.log('2. 添加 base_price 字段...');
    db.exec(`
      ALTER TABLE materials 
      ADD COLUMN base_price REAL DEFAULT 0
    `);
    console.log('   ✅ 字段添加成功');
  }

  // 3. 计算并更新所有现有物料的基础单价
  console.log('\n3. 计算现有物料的基础单价...');
  const materials = db.prepare(`
    SELECT id, purchase_price, purchase_conversion_rate 
    FROM materials
  `).all();
  
  console.log(`   找到 ${materials.length} 条物料记录`);
  
  let updatedCount = 0;
  const updateStmt = db.prepare('UPDATE materials SET base_price = ? WHERE id = ?');
  
  for (const material of materials) {
    const purchasePrice = material.purchase_price || 0;
    const purchaseConversionRate = material.purchase_conversion_rate || 1;
    
    // 基础单价 = 采购单价 / 采购转化率
    const basePrice = purchaseConversionRate > 0 
      ? purchasePrice / purchaseConversionRate 
      : 0;
    
    updateStmt.run(basePrice, material.id);
    updatedCount++;
  }
  
  console.log(`   ✅ 已更新 ${updatedCount} 条记录的基础单价\n`);

  // 4. 验证数据
  console.log('4. 验证数据（前5条）...');
  const samples = db.prepare(`
    SELECT 
      material_code,
      material_name,
      purchase_price,
      purchase_conversion_rate,
      base_price
    FROM materials
    LIMIT 5
  `).all();
  
  console.table(samples);
  
  console.log('\n✅ 基础单价字段添加完成！');
  console.log('\n📋 字段说明：');
  console.log('   - 字段名：base_price');
  console.log('   - 计算公式：base_price = purchase_price / purchase_conversion_rate');
  console.log('   - 默认值：0');
  console.log('   - 精度：2位小数（前端显示）\n');

} catch (error) {
  console.error('❌ 操作失败:', error.message);
  process.exit(1);
} finally {
  db.close();
}
