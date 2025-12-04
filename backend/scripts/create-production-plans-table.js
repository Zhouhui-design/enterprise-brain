const db = require('../config/database')

console.log('开始创建production_plans表...')

try {
  // 创建生产计划主表
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_plans (
      id TEXT PRIMARY KEY,
      plan_number TEXT UNIQUE NOT NULL,
      plan_name TEXT,
      product_code TEXT,
      product_name TEXT,
      plan_quantity REAL DEFAULT 0,
      completed_quantity REAL DEFAULT 0,
      unit TEXT,
      plan_start_date DATE,
      plan_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      status TEXT DEFAULT 'DRAFT',
      priority TEXT DEFAULT 'NORMAL',
      workshop TEXT,
      production_line TEXT,
      create_by TEXT,
      create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      update_by TEXT,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      remark TEXT
    )
  `)
  
  // 创建生产计划工序表
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_plan_processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id TEXT NOT NULL,
      process_code TEXT,
      process_name TEXT,
      sequence_no INTEGER,
      plan_hours REAL DEFAULT 0,
      actual_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'PENDING',
      FOREIGN KEY (plan_id) REFERENCES production_plans(id) ON DELETE CASCADE
    )
  `)
  
  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_production_plans_number ON production_plans(plan_number);
    CREATE INDEX IF NOT EXISTS idx_production_plans_product ON production_plans(product_code);
    CREATE INDEX IF NOT EXISTS idx_production_plans_status ON production_plans(status);
    CREATE INDEX IF NOT EXISTS idx_production_plan_processes_plan ON production_plan_processes(plan_id);
  `)
  
  console.log('✅ production_plans表创建成功！')
} catch (error) {
  console.error('❌ 创建表失败:', error)
  process.exit(1)
}
