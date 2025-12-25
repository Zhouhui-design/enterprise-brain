const db = require('../config/database');

console.log('开始创建customers表...');

try {
  // 创建customers表
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      customer_code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_type TEXT DEFAULT 'regular',
      status TEXT DEFAULT 'active',
      
      -- 联系信息
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      contact_address TEXT,
      
      -- 公司信息
      company TEXT,
      company_address TEXT,
      industry TEXT,
      region TEXT,
      tax_number TEXT,
      
      -- 财务信息
      credit_level TEXT,
      credit_limit REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      
      -- 销售信息
      sales_person TEXT,
      source TEXT,
      first_order_date DATETIME,
      last_order_date DATETIME,
      
      -- 其他信息
      tags TEXT,
      remark TEXT,
      
      -- 创建信息
      created_by TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ customers表创建成功！');

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
    CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
    CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
    CREATE INDEX IF NOT EXISTS idx_customers_region ON customers(region);
  `);

  console.log('✅ 索引创建成功！');

  // 检查表结构
  const tableInfo = db.prepare('PRAGMA table_info(customers)').all();
  console.log('\n表结构：');
  console.table(tableInfo);
} catch (error) {
  console.error('❌ 创建表失败:', error);
  process.exit(1);
}
