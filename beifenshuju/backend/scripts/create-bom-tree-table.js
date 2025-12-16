const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../database/enterprise.db');
const db = new Database(dbPath);

// 创建BOM树结构表
const createTable = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS bom_tree_structures (
        id TEXT PRIMARY KEY,
        bom_code TEXT NOT NULL,
        bom_name TEXT,
        product_code TEXT NOT NULL,
        product_name TEXT,
        version TEXT,
        status TEXT,
        max_level INTEGER DEFAULT 0,
        tree_data TEXT NOT NULL,
        create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        create_by TEXT DEFAULT 'admin',
        UNIQUE(bom_code)
      );
      
      CREATE INDEX IF NOT EXISTS idx_bom_tree_bom_code ON bom_tree_structures(bom_code);
      CREATE INDEX IF NOT EXISTS idx_bom_tree_product_code ON bom_tree_structures(product_code);
    `);
    
    console.log('✅ BOM树结构表创建成功');
    return true;
  } catch (error) {
    console.error('❌ 创建BOM树结构表失败:', error.message);
    throw error;
  }
};

// 执行创建
createTable();

// 关闭数据库连接
db.close();
