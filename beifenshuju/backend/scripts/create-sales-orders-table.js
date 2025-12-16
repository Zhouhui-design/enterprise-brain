const db = require('../config/database')

console.log('开始创建sales_orders表...')

try {
  // 创建销售订单主表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_orders (
      id TEXT PRIMARY KEY,
      internal_order_no TEXT UNIQUE NOT NULL,
      customer_order_no TEXT,
      customer_name TEXT NOT NULL,
      customer_id TEXT,
      salesperson TEXT,
      quotation_no TEXT,
      order_type TEXT,
      
      -- 时间信息
      order_time DATETIME,
      promised_delivery DATE,
      customer_delivery DATE,
      estimated_completion_date DATE,
      
      -- 部门信息
      sales_department TEXT,
      delivery_method TEXT,
      return_order_no TEXT,
      
      -- 金额信息
      order_currency TEXT DEFAULT 'CNY',
      current_exchange_rate REAL DEFAULT 1.0,
      tax_rate REAL DEFAULT 13,
      fees REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      total_amount_excluding_tax REAL DEFAULT 0,
      total_tax REAL DEFAULT 0,
      
      -- 附件说明
      order_attachment TEXT,
      packaging_attachment TEXT,
      order_notes TEXT,
      
      -- 包装信息
      packaging_method TEXT,
      packaging_requirements TEXT,
      
      -- 收货信息
      consignee TEXT,
      delivery_address TEXT,
      bill_recipient TEXT,
      bill_address TEXT,
      
      -- 回款信息
      payment_method TEXT,
      advance_payment_ratio REAL DEFAULT 0,
      advance_payment_amount REAL DEFAULT 0,
      planned_payment_account TEXT,
      total_receivable REAL DEFAULT 0,
      
      -- 售后信息
      has_after_sales INTEGER DEFAULT 0,
      after_sales_order_no TEXT,
      after_sales_details TEXT,
      
      -- 状态
      status TEXT DEFAULT 'draft',
      
      -- 创建信息
      created_by TEXT,
      updated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // 创建销售订单产品明细表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_order_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_code TEXT,
      product_name TEXT,
      product_spec TEXT,
      product_color TEXT,
      product_unit TEXT DEFAULT '个',
      order_quantity REAL DEFAULT 1,
      unit_price_excluding_tax REAL DEFAULT 0,
      tax_rate REAL DEFAULT 13,
      total_price_excluding_tax REAL DEFAULT 0,
      total_tax REAL DEFAULT 0,
      total_price REAL DEFAULT 0,
      accessories TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
    )
  `)
  
  // 创建回款计划表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_order_payment_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      payment_ratio REAL DEFAULT 0,
      payment_amount REAL DEFAULT 0,
      payment_date DATE,
      payment_account TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
    )
  `)
  
  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_sales_orders_internal_no ON sales_orders(internal_order_no);
    CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_name ON sales_orders(customer_name);
    CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
    CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_order_products_order_id ON sales_order_products(order_id);
    CREATE INDEX IF NOT EXISTS idx_sales_order_payment_schedule_order_id ON sales_order_payment_schedule(order_id);
  `)
  
  console.log('✅ sales_orders表创建成功！')
  console.log('✅ sales_order_products表创建成功！')
  console.log('✅ sales_order_payment_schedule表创建成功！')
  console.log('✅ 索引创建成功！')
} catch (error) {
  console.error('❌ 创建表失败:', error)
  process.exit(1)
}
