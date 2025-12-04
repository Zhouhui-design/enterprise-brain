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

  console.log('数据库初始化完成');
};

// 初始化数据库
initializeDatabase();

module.exports = db;