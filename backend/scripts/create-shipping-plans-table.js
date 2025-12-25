const db = require('../config/database');

console.log('开始创建shipping_plans表...');

try {
  // 创建发货计划主表
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_plans (
      id TEXT PRIMARY KEY,
      plan_number TEXT UNIQUE NOT NULL,
      order_number TEXT,
      customer_name TEXT,
      customer_contact TEXT,
      customer_phone TEXT,
      ship_to_address TEXT,
      plan_ship_date DATE,
      actual_ship_date DATE,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'DRAFT',
      create_by TEXT,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_by TEXT,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      remark TEXT
    )
  `);

  // 创建发货计划明细表
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_plan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL,
      product_code TEXT,
      product_name TEXT,
      quantity REAL DEFAULT 0,
      unit TEXT,
      unit_price REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      FOREIGN KEY (plan_id) REFERENCES shipping_plans(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_shipping_plans_number ON shipping_plans(plan_number);
    CREATE INDEX IF NOT EXISTS idx_shipping_plans_order ON shipping_plans(order_number);
    CREATE INDEX IF NOT EXISTS idx_shipping_plans_customer ON shipping_plans(customer_name);
    CREATE INDEX IF NOT EXISTS idx_shipping_plans_status ON shipping_plans(status);
    CREATE INDEX IF NOT EXISTS idx_shipping_plan_items_plan ON shipping_plan_items(plan_id);
  `);

  console.log('✅ shipping_plans表创建成功！');
} catch (error) {
  console.error('❌ 创建表失败:', error);
  process.exit(1);
}
