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

// 检查processes表是否存在
console.log('🔍 检查processes表是否存在...');

db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='processes'", (err, row) => {
  if (err) {
    console.error('❌ 查询表失败:', err.message);
    db.close();
    process.exit(1);
  }

  if (row) {
    console.log('✅ 找到processes表');

    // 查询表结构
    console.log('\n📋 processes表结构:');
    db.all('PRAGMA table_info(processes)', (err, columns) => {
      if (err) {
        console.error('❌ 查询表结构失败:', err.message);
        db.close();
        process.exit(1);
      }

      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });

      // 查询数据条数
      console.log('\n📊 查询数据条数...');
      db.get('SELECT COUNT(*) as count FROM processes', (err, result) => {
        if (err) {
          console.error('❌ 查询数据条数失败:', err.message);
          db.close();
          process.exit(1);
        }

        const count = result.count;
        console.log(`✅ processes表中共有 ${count} 条数据`);

        // 如果有数据，显示前5条
        if (count > 0) {
          console.log('\n📋 前5条数据:');
          db.all('SELECT * FROM processes LIMIT 5', (err, rows) => {
            if (err) {
              console.error('❌ 查询数据失败:', err.message);
              db.close();
              process.exit(1);
            }

            rows.forEach(row => {
              console.log(`  - ID: ${row.id}, 工序名称: ${row.process_name}, 自制/外协: ${row.self_or_outsource}`);
            });

            db.close();
          });
        } else {
          db.close();
        }
      });
    });
  } else {
    console.error('❌ SQLite数据库中不存在processes表');
    db.close();
    process.exit(1);
  }
});
