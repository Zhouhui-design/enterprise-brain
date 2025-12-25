const db = require('../config/database');

console.log('开始创建projected_balances表...');

try {
  // 创建预计结存表
  db.exec(`
    CREATE TABLE IF NOT EXISTS projected_balances (
      id TEXT PRIMARY KEY,
      submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      projected_date DATE NOT NULL,
      sales_order_no TEXT,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      transaction_no TEXT UNIQUE NOT NULL,
      quantity REAL DEFAULT 0,
      base_unit TEXT,
      current_inventory REAL DEFAULT 0,
      projected_balance REAL DEFAULT 0,
      available_inventory REAL DEFAULT 0,
      create_by TEXT,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_by TEXT,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_projected_balances_date ON projected_balances(projected_date);
    CREATE INDEX IF NOT EXISTS idx_projected_balances_order ON projected_balances(sales_order_no);
    CREATE INDEX IF NOT EXISTS idx_projected_balances_product ON projected_balances(product_code);
    CREATE INDEX IF NOT EXISTS idx_projected_balances_transaction ON projected_balances(transaction_no);
  `);

  console.log('✅ projected_balances表创建成功！');
} catch (error) {
  console.error('❌ 创建表失败:', error);
  process.exit(1);
}
