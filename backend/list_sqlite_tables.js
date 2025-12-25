const sqlite3 = require('sqlite3').verbose();

// SQLite数据库文件路径
const dbPath = 'C:/Users/sardenesy/Projects/enterpise-brain/data/enterprise_brain.db';

// 打开SQLite数据库
const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error('❌ 打开SQLite数据库失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 已打开SQLite数据库:', dbPath);
});

// 列出所有表
console.log('🔍 列出SQLite数据库中的所有表:');

db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", (err, rows) => {
  if (err) {
    console.error('❌ 查询表失败:', err.message);
    db.close();
    process.exit(1);
  }

  console.log(`\n📋 共找到 ${rows.length} 个表:`);
  rows.forEach((row, index) => {
    console.log(`${index + 1}. ${row.name}`);
  });

  db.close();
});
