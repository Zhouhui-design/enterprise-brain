const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'enterprise_brain.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查 material_preparation_plans 表结构...');

db.all("PRAGMA table_info(material_preparation_plans)", (err, rows) => {
  if (err) {
    console.error('❌ 查询表结构失败:', err);
    return;
  }
  
  console.log('\n📋 表结构信息:');
  console.log('列数:', rows.length);
  console.log('\n字段列表:');
  
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'} - ${row.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  console.log('\n📝 不包含id字段的INSERT列名:');
  const insertColumns = rows
    .filter(row => row.name !== 'id')
    .map(row => row.name)
    .join(', ');
  console.log(insertColumns);
  
  console.log('\n📊 占位符数量:');
  const placeholderCount = rows.filter(row => row.name !== 'id').length;
  console.log('?', '?'.repeat(placeholderCount - 1).split('').join(', '));
  console.log('总计:', placeholderCount, '个?');
  
  db.close();
});