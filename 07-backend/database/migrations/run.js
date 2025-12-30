const fs = require('fs').promises;
const path = require('path');
const db = require('../mysql');

async function runMigrations() {
  try {
    console.log('🚀 开始运行数据库迁移...');
    
    // 读取迁移文件目录
    const migrationsDir = path.join(__dirname);
    const files = await fs.readdir(migrationsDir);
    
    // 过滤出SQL文件并按文件名排序
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📝 找到 ${sqlFiles.length} 个迁移文件`);
    
    // 执行每个迁移文件
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, 'utf8');
      
      console.log(`🔄 执行迁移: ${file}`);
      
      try {
        // 分割SQL语句（以分号分隔）
        const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
        
        for (const statement of statements) {
          if (statement.trim()) {
            await db.query(statement.trim());
          }
        }
        
        console.log(`✅ 迁移完成: ${file}`);
      } catch (error) {
        console.error(`❌ 迁移失败: ${file}`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await db.close();
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };