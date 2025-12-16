const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/enterprise_brain.db');
const db = new Database(dbPath);

console.log('开始修复外键约束...');

try {
  // 备份现有数据
  console.log('1. 备份bom_components表的数据...');
  const components = db.prepare('SELECT * FROM bom_components').all();
  console.log(`   找到 ${components.length} 条子件数据`);

  // 删除旧表
  console.log('2. 删除旧的bom_components表...');
  db.prepare('DROP TABLE IF EXISTS bom_components').run();

  // 创建新表（正确的外键引用）
  console.log('3. 创建新的bom_components表（外键引用production_boms）...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS bom_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_id INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      level INTEGER DEFAULT 1,
      component_code TEXT NOT NULL,
      component_name TEXT NOT NULL,
      standard_quantity REAL DEFAULT 1,
      output_process TEXT,
      component_source TEXT,
      process_wage REAL DEFAULT 0,
      material_loss REAL DEFAULT 0,
      material_price REAL DEFAULT 0,
      material_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bom_id) REFERENCES production_boms(id) ON DELETE CASCADE
    )
  `);

  // 恢复数据
  console.log('4. 恢复数据...');
  if (components.length > 0) {
    const insertStmt = db.prepare(`
      INSERT INTO bom_components (
        id, bom_id, sequence, level, component_code, component_name,
        standard_quantity, output_process, component_source,
        process_wage, material_loss, material_price, material_cost,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertStmt.run(
          item.id,
          item.bom_id,
          item.sequence,
          item.level,
          item.component_code,
          item.component_name,
          item.standard_quantity,
          item.output_process,
          item.component_source,
          item.process_wage,
          item.material_loss,
          item.material_price,
          item.material_cost,
          item.created_at,
          item.updated_at
        );
      }
    });

    insertMany(components);
    console.log(`   恢复了 ${components.length} 条数据`);
  } else {
    console.log('   没有数据需要恢复');
  }

  console.log('✅ 外键约束修复完成！');

  // 验证新表结构
  console.log('\n5. 验证新表结构：');
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE name='bom_components'").get();
  console.log(tableInfo.sql);

} catch (error) {
  console.error('❌ 修复失败:', error);
  process.exit(1);
} finally {
  db.close();
}
