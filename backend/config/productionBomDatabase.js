/**
 * MySQL数据库配置
 * 企业大脑系统 - 生产BOM专用数据库
 */

const mysql = require('mysql2/promise');

// 生产BOM专用数据库连接配置
const productionBomDbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain_production_bom',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
const pool = mysql.createPool(productionBomDbConfig);

// 封装查询函数，自动解构结果
const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

// 初始化生产BOM专用数据库
const initializeProductionBomDatabase = async () => {
  try {
    // 先创建数据库（如果不存在）
    const createDbConnection = await mysql.createConnection({
      host: productionBomDbConfig.host,
      port: productionBomDbConfig.port,
      user: productionBomDbConfig.user,
      password: productionBomDbConfig.password
    });
    
    await createDbConnection.execute(
      `CREATE DATABASE IF NOT EXISTS ${productionBomDbConfig.database} 
       CHARACTER SET utf8mb4 
       COLLATE utf8mb4_unicode_ci`
    );
    await createDbConnection.end();
    
    console.log('✅ 生产BOM专用数据库创建成功');
    
    // 获取连接并创建表
    const connection = await pool.getConnection();
    
    console.log('🔧 开始初始化生产BOM专用数据库表结构...');
    
    // 创建生产BOM表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS production_boms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bom_code VARCHAR(100) UNIQUE NOT NULL COMMENT 'BOM编码',
        bom_name VARCHAR(200) NOT NULL COMMENT 'BOM名称',
        product_code VARCHAR(100) NOT NULL COMMENT '产品编码',
        product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
        version VARCHAR(50) COMMENT '版本号',
        status VARCHAR(20) DEFAULT 'draft' COMMENT '状态',
        designer VARCHAR(50) COMMENT '设计者',
        material_count INT DEFAULT 0 COMMENT '物料数量',
        remark TEXT COMMENT '备注',
        auditor VARCHAR(50) COMMENT '审核人',
        effective_date DATETIME COMMENT '生效日期',
        total_labor DECIMAL(10,2) DEFAULT 0 COMMENT '总人工成本',
        total_material DECIMAL(10,2) DEFAULT 0 COMMENT '总物料成本',
        product_image VARCHAR(500) COMMENT '产品图片',
        is_pushed_to_manual TINYINT DEFAULT 0 COMMENT '是否推送到产品手册',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_bom_code (bom_code),
        INDEX idx_product_code (product_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产BOM表'
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bom_components (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bom_id INT NOT NULL COMMENT 'BOM ID',
        sequence INT NOT NULL COMMENT '序号',
        level INT DEFAULT 1 COMMENT '层级',
        component_code VARCHAR(100) NOT NULL COMMENT '子件编码',
        component_name VARCHAR(200) NOT NULL COMMENT '子件名称',
        quantity DECIMAL(10,4) DEFAULT 1 COMMENT '数量',
        output_process VARCHAR(100) COMMENT '产出工序',
        component_source VARCHAR(50) COMMENT '子件来源',
        process_wage DECIMAL(10,2) DEFAULT 0 COMMENT '加工工资',
        material_loss DECIMAL(10,2) DEFAULT 0 COMMENT '物料损耗',
        material_price DECIMAL(10,2) DEFAULT 0 COMMENT '物料单价',
        material_cost DECIMAL(10,2) DEFAULT 0 COMMENT '物料成本',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_bom_id (bom_id),
        INDEX idx_component_code (component_code),
        FOREIGN KEY (bom_id) REFERENCES production_boms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM子件表'
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS list_style_production_boms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sequence INT NOT NULL COMMENT '序号',
        bom_code VARCHAR(100) UNIQUE NOT NULL COMMENT 'BOM编号',
        parent_code VARCHAR(100) NOT NULL COMMENT '父件编号',
        parent_name VARCHAR(200) NOT NULL COMMENT '父件名称',
        status VARCHAR(20) DEFAULT 'draft' COMMENT 'BOM状态',
        is_default VARCHAR(10) DEFAULT '否' COMMENT '默认BOM',
        version_count INT DEFAULT 1 COMMENT '版本次数',
        remark TEXT COMMENT 'BOM备注',
        parent_main_category VARCHAR(100) COMMENT '父件大类',
        parent_mid_category VARCHAR(100) COMMENT '父件中类',
        parent_sub_category VARCHAR(100) COMMENT '父件小类',
        parent_model VARCHAR(100) COMMENT '父件型号',
        parent_series VARCHAR(100) COMMENT '父件系列',
        parent_output_process VARCHAR(100) COMMENT '父件产出工序',
        total_material DECIMAL(10,2) DEFAULT 0 COMMENT '总材料',
        total_labor DECIMAL(10,2) DEFAULT 0 COMMENT '总人工',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_bom_code (bom_code),
        INDEX idx_parent_code (parent_code),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='列表式生产BOM主表'
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS list_style_bom_children (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT NOT NULL COMMENT '父件ID',
        child_sequence INT NOT NULL COMMENT '子件序号',
        child_code VARCHAR(100) NOT NULL COMMENT '子件编码',
        child_name VARCHAR(200) NOT NULL COMMENT '子件名称',
        output_process VARCHAR(100) COMMENT '产出工序',
        component_source VARCHAR(50) COMMENT '子件来源（自制/外购）',
        standard_usage DECIMAL(10,4) DEFAULT 1 COMMENT '标准用量',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_parent_id (parent_id),
        INDEX idx_child_code (child_code),
        FOREIGN KEY (parent_id) REFERENCES list_style_production_boms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='列表式生产BOM子件表'
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS production_bom_drafts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        draft_id VARCHAR(100) UNIQUE NOT NULL COMMENT '草稿ID',
        bom_code VARCHAR(100) NOT NULL COMMENT 'BOM编码',
        bom_name VARCHAR(200) NOT NULL COMMENT 'BOM名称',
        product_code VARCHAR(100) NOT NULL COMMENT '产品编码',
        product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
        version VARCHAR(50) COMMENT '版本号',
        status VARCHAR(20) DEFAULT 'draft' COMMENT '状态',
        designer VARCHAR(50) COMMENT '设计者',
        material_count INT DEFAULT 0 COMMENT '物料数量',
        remark TEXT COMMENT '备注',
        auditor VARCHAR(50) COMMENT '审核人',
        effective_date DATETIME COMMENT '生效日期',
        draft_data LONGTEXT COMMENT '草稿数据JSON',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_draft_id (draft_id),
        INDEX idx_bom_code (bom_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产BOM草稿表'
    `);
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bom_tree_structures (
        id VARCHAR(100) PRIMARY KEY COMMENT 'ID',
        bom_code VARCHAR(100) NOT NULL COMMENT 'BOM编码',
        bom_name VARCHAR(200) COMMENT 'BOM名称',
        product_code VARCHAR(100) NOT NULL COMMENT '产品编码',
        product_name VARCHAR(200) COMMENT '产品名称',
        version VARCHAR(50) COMMENT '版本号',
        status VARCHAR(20) COMMENT '状态',
        max_level INT DEFAULT 0 COMMENT '最大层级',
        tree_data LONGTEXT NOT NULL COMMENT '树结构数据JSON',
        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        create_by VARCHAR(50) DEFAULT 'admin' COMMENT '创建人',
        UNIQUE KEY unique_bom_code (bom_code),
        INDEX idx_bom_code (bom_code),
        INDEX idx_product_code (product_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM树结构表'
    `);
    
    console.log('✅ 生产BOM专用数据库表结构初始化完成');
    connection.release();
    
    // 测试连接
    await pool.getConnection()
      .then(connection => {
        console.log('✅ 生产BOM专用数据库连接成功');
        console.log(`📊 数据库: ${productionBomDbConfig.database}`);
        console.log(`🔗 主机: ${productionBomDbConfig.host}:${productionBomDbConfig.port}`);
        connection.release();
      });
    
  } catch (error) {
    console.error('❌ 初始化生产BOM专用数据库失败:', error.message);
    throw error;
  }
};

module.exports = {
  pool,
  query,
  initializeProductionBomDatabase,
  dbConfig: productionBomDbConfig
};
