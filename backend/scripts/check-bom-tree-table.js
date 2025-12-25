const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/enterprise_brain.db');
const db = new Database(dbPath);

// 查询所有表
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

console.log('📋 数据库中的所有表：');
tables.forEach(table => {
  console.log(`  - ${table.name}`);
});

// 检查bom_tree_structures表
const bomTreeTable = tables.find(t => t.name === 'bom_tree_structures');

if (bomTreeTable) {
  console.log('\n✅ bom_tree_structures 表已存在！');

  // 查询表结构
  const columns = db.prepare('PRAGMA table_info(bom_tree_structures)').all();
  console.log('\n📊 表结构：');
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
} else {
  console.log('\n❌ bom_tree_structures 表不存在！');
}

db.close();
