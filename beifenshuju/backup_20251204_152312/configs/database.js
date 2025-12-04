const Database = require('better-sqlite3');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/enterprise_brain.db');

// 创建数据库连接
const db = new Database(dbPath, { 
  verbose: console.log,
  fileMustExist: false // 如果数据库不存在则创建
});

// 初始化数据库表
const initializeDatabase = () => {
  // 创建物料表
  db.exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_code TEXT UNIQUE NOT NULL,
      bom_number TEXT,
      material_name TEXT NOT NULL,
      size_spec TEXT,
      color TEXT,
      material TEXT,
      major_category TEXT,
      middle_category TEXT,
      minor_category TEXT,
      model TEXT,
      series TEXT,
      source TEXT,
      description TEXT,
      material_image TEXT,
      base_unit TEXT DEFAULT '个',
      sale_unit TEXT,
      sale_conversion_rate REAL DEFAULT 1,
      purchase_unit TEXT,
      purchase_conversion_rate REAL DEFAULT 1,
      kg_per_pcs REAL DEFAULT 0,
      pcs_per_kg REAL DEFAULT 0,
      process_name TEXT,
      standard_time REAL DEFAULT 0,
      quota_time REAL DEFAULT 0,
      process_price REAL DEFAULT 0,
      purchase_cycle TEXT,
      purchase_price REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_material_code ON materials(material_code);
    CREATE INDEX IF NOT EXISTS idx_material_name ON materials(material_name);
    CREATE INDEX IF NOT EXISTS idx_created_at ON materials(created_at);
  `);

  // 创建BOM表
  db.exec(`
    CREATE TABLE IF NOT EXISTS boms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_code TEXT UNIQUE NOT NULL,
      bom_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      version TEXT,
      status TEXT DEFAULT 'draft',
      designer TEXT,
      material_count INTEGER DEFAULT 0,
      remark TEXT,
      auditor TEXT,
      effective_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bom_code ON boms(bom_code);
    CREATE INDEX IF NOT EXISTS idx_product_code ON boms(product_code);
  `);

  // 创建生产BOM表
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_boms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_code TEXT UNIQUE NOT NULL,
      bom_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      version TEXT,
      status TEXT DEFAULT 'draft',
      designer TEXT,
      material_count INTEGER DEFAULT 0,
      remark TEXT,
      auditor TEXT,
      effective_date DATETIME,
      total_labor REAL DEFAULT 0,
      total_material REAL DEFAULT 0,
      product_image TEXT,
      is_pushed_to_manual INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建销售BOM表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales_boms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_code TEXT UNIQUE NOT NULL,
      bom_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      version TEXT,
      status TEXT DEFAULT 'draft',
      designer TEXT,
      material_count INTEGER DEFAULT 0,
      remark TEXT,
      auditor TEXT,
      effective_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建设计BOM表
  db.exec(`
    CREATE TABLE IF NOT EXISTS design_boms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_code TEXT UNIQUE NOT NULL,
      bom_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      version TEXT,
      status TEXT DEFAULT 'draft',
      designer TEXT,
      material_count INTEGER DEFAULT 0,
      remark TEXT,
      auditor TEXT,
      effective_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建BOM子件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS bom_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_id INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      level INTEGER DEFAULT 1,
      component_code TEXT NOT NULL,
      component_name TEXT NOT NULL,
      standard_quantity REAL DEFAULT 1,
      output_process TEXT,
      component_source TEXT,
      process_wage REAL DEFAULT 0,
      material_loss REAL DEFAULT 0,
      material_price REAL DEFAULT 0,
      material_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bom_id) REFERENCES boms(id) ON DELETE CASCADE
    )
  `);

  // 创建生产BOM草稿表
  db.exec(`
    CREATE TABLE IF NOT EXISTS production_bom_drafts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bom_code TEXT NOT NULL,
      bom_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      version TEXT,
      status TEXT DEFAULT 'draft',
      designer TEXT,
      material_count INTEGER DEFAULT 0,
      remark TEXT,
      auditor TEXT,
      effective_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建草稿子件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS bom_draft_components (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      draft_id INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      level INTEGER DEFAULT 1,
      component_code TEXT NOT NULL,
      component_name TEXT NOT NULL,
      standard_quantity REAL DEFAULT 1,
      output_process TEXT,
      component_source TEXT,
      process_wage REAL DEFAULT 0,
      material_loss REAL DEFAULT 0,
      material_price REAL DEFAULT 0,
      material_cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (draft_id) REFERENCES production_bom_drafts(id) ON DELETE CASCADE
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bom_components_bom_id ON bom_components(bom_id);
    CREATE INDEX IF NOT EXISTS idx_bom_components_component_code ON bom_components(component_code);
  `);

  // 创建BOM树结构表
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
    )
  `);

  // 创建BOM树结构索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bom_tree_bom_code ON bom_tree_structures(bom_code);
    CREATE INDEX IF NOT EXISTS idx_bom_tree_product_code ON bom_tree_structures(product_code);
  `);

  // ==================== 生产资源表 ====================
  
  // 创建设备资源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment_resources (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      model TEXT,
      capacity REAL DEFAULT 1,
      efficiency REAL DEFAULT 1.0,
      status TEXT DEFAULT 'available',
      department TEXT,
      location TEXT,
      current_load REAL DEFAULT 0,
      next_maintenance_date TEXT,
      maintenance_duration REAL DEFAULT 0,
      last_maintenance_date TEXT,
      mold_change_time REAL DEFAULT 0,
      current_mold TEXT,
      supported_fixtures TEXT,
      required_workers INTEGER DEFAULT 1,
      purchase_date TEXT,
      purchase_price REAL DEFAULT 0,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin',
      updated_by TEXT DEFAULT 'admin'
    )
  `);

  // 创建人员资源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS worker_resources (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department TEXT,
      position TEXT,
      skills TEXT,
      skill_levels TEXT,
      efficiency REAL DEFAULT 1.0,
      shift TEXT DEFAULT 'day',
      status TEXT DEFAULT 'available',
      max_tasks_per_day INTEGER DEFAULT 8,
      phone TEXT,
      email TEXT,
      hire_date TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin',
      updated_by TEXT DEFAULT 'admin'
    )
  `);

  // 创建物料资源表（扩展）
  db.exec(`
    CREATE TABLE IF NOT EXISTS material_resources (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT,
      current_stock REAL DEFAULT 0,
      safety_stock REAL DEFAULT 0,
      incoming_stock REAL DEFAULT 0,
      unit TEXT DEFAULT '件',
      lead_time INTEGER DEFAULT 0,
      unit_cost REAL DEFAULT 0,
      supplier TEXT,
      last_order_date TEXT,
      storage_location TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin',
      updated_by TEXT DEFAULT 'admin'
    )
  `);

  // 创建模具资源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS mold_resources (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      current_machine TEXT,
      lifecycle INTEGER DEFAULT 0,
      max_lifecycle INTEGER DEFAULT 10000,
      maintenance_cycle INTEGER DEFAULT 1000,
      last_maintenance_count INTEGER DEFAULT 0,
      cavities INTEGER DEFAULT 1,
      cycle_time REAL DEFAULT 30,
      purchase_date TEXT,
      purchase_price REAL DEFAULT 0,
      storage_location TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin',
      updated_by TEXT DEFAULT 'admin'
    )
  `);

  // 创建夹具资源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS fixture_resources (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      available INTEGER DEFAULT 1,
      in_use INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available',
      suitable_products TEXT,
      suitable_machines TEXT,
      storage_location TEXT,
      purchase_date TEXT,
      purchase_price REAL DEFAULT 0,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin',
      updated_by TEXT DEFAULT 'admin'
    )
  `);

  // 创建刀具资源表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tooling_resources (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      specification TEXT,
      quantity INTEGER DEFAULT 1,
      available INTEGER DEFAULT 1,
      in_use INTEGER DEFAULT 0,
      lifecycle INTEGER DEFAULT 0,
      max_lifecycle INTEGER DEFAULT 5000,
      status TEXT DEFAULT 'available',
      storage_location TEXT,
      purchase_date TEXT,
      unit_price REAL DEFAULT 0,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin',
      updated_by TEXT DEFAULT 'admin'
    )
  `);

  // ==================== 排程相关表 ====================
  
  // 创建排程任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduling_tasks (
      id TEXT PRIMARY KEY,
      order_code TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      due_date TEXT,
      priority INTEGER DEFAULT 5,
      status TEXT DEFAULT 'pending',
      algorithm TEXT DEFAULT 'priority',
      scheduled_at TEXT,
      completed_at TEXT,
      is_simulation INTEGER DEFAULT 0,
      simulation_date TEXT,
      estimated_completion_date TEXT,
      simulation_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin'
    )
  `);

  // 创建排程结果表
  db.exec(`
    CREATE TABLE IF NOT EXISTS scheduling_results (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      process_id TEXT NOT NULL,
      process_name TEXT NOT NULL,
      machine_id TEXT NOT NULL,
      machine_name TEXT NOT NULL,
      worker_id TEXT,
      worker_name TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration REAL NOT NULL,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES scheduling_tasks(id) ON DELETE CASCADE
    )
  `);

  // ==================== 数据同步表 ====================
  
  // 创建同步日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      records_count INTEGER DEFAULT 0,
      error_message TEXT,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建同步冲突表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_conflicts (
      id TEXT PRIMARY KEY,
      module TEXT NOT NULL,
      record_id TEXT NOT NULL,
      local_data TEXT NOT NULL,
      remote_data TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      resolved_at TEXT,
      resolved_by TEXT,
      resolution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==================== 创建索引 ====================
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment_resources(code);
    CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment_resources(type);
    CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment_resources(status);
    
    CREATE INDEX IF NOT EXISTS idx_worker_code ON worker_resources(code);
    CREATE INDEX IF NOT EXISTS idx_worker_department ON worker_resources(department);
    CREATE INDEX IF NOT EXISTS idx_worker_status ON worker_resources(status);
    
    CREATE INDEX IF NOT EXISTS idx_material_code ON material_resources(code);
    CREATE INDEX IF NOT EXISTS idx_material_type ON material_resources(type);
    
    CREATE INDEX IF NOT EXISTS idx_mold_code ON mold_resources(code);
    CREATE INDEX IF NOT EXISTS idx_mold_status ON mold_resources(status);
    
    CREATE INDEX IF NOT EXISTS idx_fixture_code ON fixture_resources(code);
    CREATE INDEX IF NOT EXISTS idx_fixture_type ON fixture_resources(type);
    
    CREATE INDEX IF NOT EXISTS idx_tooling_code ON tooling_resources(code);
    CREATE INDEX IF NOT EXISTS idx_tooling_type ON tooling_resources(type);
    
    CREATE INDEX IF NOT EXISTS idx_scheduling_task_order ON scheduling_tasks(order_code);
    CREATE INDEX IF NOT EXISTS idx_scheduling_task_status ON scheduling_tasks(status);
    
    CREATE INDEX IF NOT EXISTS idx_sync_log_module ON sync_logs(module);
    CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_logs(status);
  `);

  console.log('数据库初始化完成（包含生产资源表）');
};

// 初始化数据库
initializeDatabase();

module.exports = db;