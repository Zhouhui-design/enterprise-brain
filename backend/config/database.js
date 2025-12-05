/**
 * MySQL数据库配置
 * 企业大脑系统 - 生产环境数据库
 */

const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试连接
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL数据库连接成功');
    console.log(`📊 数据库: ${dbConfig.database}`);
    console.log(`🔗 主机: ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL数据库连接失败:', err.message);
    process.exit(1);
  });

// 初始化数据库表结构
async function initializeDatabase() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 开始初始化数据库表结构...');
    
    // 创建物料表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        material_code VARCHAR(100) UNIQUE NOT NULL COMMENT '物料编码',
        bom_number VARCHAR(100) COMMENT 'BOM编号',
        material_name VARCHAR(200) NOT NULL COMMENT '物料名称',
        size_spec VARCHAR(100) COMMENT '尺寸规格',
        color VARCHAR(50) COMMENT '颜色',
        material VARCHAR(100) COMMENT '材质',
        major_category VARCHAR(100) COMMENT '大类',
        middle_category VARCHAR(100) COMMENT '中类',
        minor_category VARCHAR(100) COMMENT '小类',
        model VARCHAR(100) COMMENT '型号',
        series VARCHAR(100) COMMENT '系列',
        source VARCHAR(50) COMMENT '来源',
        description TEXT COMMENT '描述',
        material_image VARCHAR(500) COMMENT '物料图片',
        base_unit VARCHAR(20) DEFAULT '个' COMMENT '基本单位',
        sale_unit VARCHAR(20) COMMENT '销售单位',
        sale_conversion_rate DECIMAL(10,4) DEFAULT 1 COMMENT '销售换算率',
        purchase_unit VARCHAR(20) COMMENT '采购单位',
        purchase_conversion_rate DECIMAL(10,4) DEFAULT 1 COMMENT '采购换算率',
        kg_per_pcs DECIMAL(10,4) DEFAULT 0 COMMENT '每件公斤数',
        pcs_per_kg DECIMAL(10,4) DEFAULT 0 COMMENT '每公斤件数',
        process_name VARCHAR(100) COMMENT '工序名称',
        standard_time DECIMAL(10,2) DEFAULT 0 COMMENT '标准工时',
        quota_time DECIMAL(10,2) DEFAULT 0 COMMENT '定额工时',
        process_price DECIMAL(10,2) DEFAULT 0 COMMENT '加工单价',
        purchase_cycle VARCHAR(50) COMMENT '采购周期',
        purchase_price DECIMAL(10,2) DEFAULT 0 COMMENT '采购单价',
        base_price DECIMAL(10,2) DEFAULT 0 COMMENT '基础单价',
        status VARCHAR(20) DEFAULT 'active' COMMENT '状态',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_material_code (material_code),
        INDEX idx_material_name (material_name),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物料表'
    `);

    // 创建BOM表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS boms (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_bom_code (bom_code),
        INDEX idx_product_code (product_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM表'
    `);

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

    // 创建销售BOM表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_boms (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_bom_code (bom_code),
        INDEX idx_product_code (product_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售BOM表'
    `);

    // 创建设计BOM表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS design_boms (
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_bom_code (bom_code),
        INDEX idx_product_code (product_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设计BOM表'
    `);

    // 创建BOM子件表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bom_components (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bom_id INT NOT NULL COMMENT 'BOM ID',
        sequence INT NOT NULL COMMENT '序号',
        level INT DEFAULT 1 COMMENT '层级',
        component_code VARCHAR(100) NOT NULL COMMENT '子件编码',
        component_name VARCHAR(200) NOT NULL COMMENT '子件名称',
        standard_quantity DECIMAL(10,4) DEFAULT 1 COMMENT '标准用量',
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
        FOREIGN KEY (bom_id) REFERENCES boms(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM子件表'
    `);

    // 创建生产BOM草稿表
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

    // 创建BOM树结构表
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

    // 创建销售订单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id VARCHAR(100) PRIMARY KEY COMMENT '订单ID',
        internal_order_no VARCHAR(100) UNIQUE NOT NULL COMMENT '内部订单编号',
        customer_order_no VARCHAR(100) COMMENT '客户订单编号',
        customer_name VARCHAR(200) NOT NULL COMMENT '客户名称',
        customer_id VARCHAR(100) COMMENT '客户ID',
        salesperson VARCHAR(100) COMMENT '业务员',
        quotation_no VARCHAR(100) COMMENT '报价单号',
        order_type VARCHAR(50) COMMENT '订单类型',
        order_time DATETIME COMMENT '下单时间',
        promised_delivery DATETIME COMMENT '承诺交期',
        customer_delivery DATETIME COMMENT '客户要求交期',
        estimated_completion_date DATETIME COMMENT '预计完工日期',
        sales_department VARCHAR(100) COMMENT '销售部门',
        delivery_method VARCHAR(50) COMMENT '发货方式',
        return_order_no VARCHAR(100) COMMENT '退货订单编号',
        order_currency VARCHAR(20) DEFAULT 'CNY' COMMENT '订单币种',
        current_exchange_rate DECIMAL(10,4) DEFAULT 1.0000 COMMENT '当前汇率',
        tax_rate DECIMAL(5,2) DEFAULT 13.00 COMMENT '税率',
        fees DECIMAL(10,2) DEFAULT 0.00 COMMENT '费用',
        total_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '订单总金额',
        total_amount_excluding_tax DECIMAL(10,2) DEFAULT 0.00 COMMENT '订单不含税总金额',
        total_tax DECIMAL(10,2) DEFAULT 0.00 COMMENT '订单税额',
        order_attachment VARCHAR(500) COMMENT '订单附件',
        packaging_attachment VARCHAR(500) COMMENT '包装附件',
        order_notes TEXT COMMENT '订单备注',
        packaging_method VARCHAR(100) COMMENT '包装方式',
        packaging_requirements TEXT COMMENT '包装要求',
        consignee VARCHAR(100) COMMENT '收货人',
        delivery_address VARCHAR(500) COMMENT '发货地址',
        bill_recipient VARCHAR(100) COMMENT '开票人',
        bill_address VARCHAR(500) COMMENT '开票地址',
        payment_method VARCHAR(50) COMMENT '付款方式',
        advance_payment_ratio DECIMAL(5,2) DEFAULT 0.00 COMMENT '预付款比例',
        advance_payment_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '预付款金额',
        planned_payment_account VARCHAR(100) COMMENT '计划回款账户',
        total_receivable DECIMAL(10,2) DEFAULT 0.00 COMMENT '应收总金额',
        has_after_sales TINYINT DEFAULT 0 COMMENT '是否有售后',
        after_sales_order_no VARCHAR(100) COMMENT '售后订单编号',
        after_sales_details TEXT COMMENT '售后详情',
        status VARCHAR(50) DEFAULT 'draft' COMMENT '订单状态',
        created_by VARCHAR(100) DEFAULT 'admin' COMMENT '创建人',
        updated_by VARCHAR(100) COMMENT '更新人',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_internal_order_no (internal_order_no),
        INDEX idx_customer_order_no (customer_order_no),
        INDEX idx_customer_name (customer_name),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售订单表'
    `);

    // 创建销售订单产品明细表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_order_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL COMMENT '订单ID',
        product_code VARCHAR(100) NOT NULL COMMENT '产品编码',
        product_name VARCHAR(200) NOT NULL COMMENT '产品名称',
        product_spec VARCHAR(200) COMMENT '产品规格',
        product_color VARCHAR(100) COMMENT '产品颜色',
        product_unit VARCHAR(20) COMMENT '产品单位',
        order_quantity DECIMAL(10,2) NOT NULL COMMENT '订单数量',
        unit_price_excluding_tax DECIMAL(10,2) DEFAULT 0.00 COMMENT '不含税单价',
        tax_rate DECIMAL(5,2) DEFAULT 13.00 COMMENT '税率',
        total_price_excluding_tax DECIMAL(10,2) DEFAULT 0.00 COMMENT '不含税总价',
        total_tax DECIMAL(10,2) DEFAULT 0.00 COMMENT '税额',
        total_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '含税总价',
        accessories TEXT COMMENT '配件（JSON格式）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_order_id (order_id),
        INDEX idx_product_code (product_code),
        FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售订单产品明细表'
    `);

    // 创建销售订单回款计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sales_order_payment_schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL COMMENT '订单ID',
        payment_ratio DECIMAL(5,2) NOT NULL COMMENT '回款比例',
        payment_amount DECIMAL(10,2) NOT NULL COMMENT '回款金额',
        payment_date DATE NOT NULL COMMENT '回款日期',
        payment_account VARCHAR(100) COMMENT '回款账户',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_order_id (order_id),
        INDEX idx_payment_date (payment_date),
        FOREIGN KEY (order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='销售订单回款计划表'
    `);

    // 创建客户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_code VARCHAR(100) UNIQUE NOT NULL COMMENT '客户编码',
        customer_name VARCHAR(200) NOT NULL COMMENT '客户名称',
        customer_type VARCHAR(50) DEFAULT 'regular' COMMENT '客户类型',
        status VARCHAR(50) DEFAULT 'active' COMMENT '状态',
        contact_person VARCHAR(100) COMMENT '联系人',
        contact_phone VARCHAR(50) COMMENT '联系电话',
        contact_email VARCHAR(100) COMMENT '联系邮箱',
        company VARCHAR(200) COMMENT '公司名称',
        industry VARCHAR(100) COMMENT '行业',
        region VARCHAR(100) COMMENT '地区',
        contact_address VARCHAR(500) COMMENT '联系地址',
        credit_limit DECIMAL(15,2) DEFAULT 0.00 COMMENT '信用额度',
        sales_person VARCHAR(100) COMMENT '销售人员',
        tax_number VARCHAR(100) COMMENT '税号',
        remark TEXT COMMENT '备注',
        created_by VARCHAR(100) DEFAULT 'admin' COMMENT '创建人',
        updated_by VARCHAR(100) COMMENT '更新人',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_customer_code (customer_code),
        INDEX idx_customer_name (customer_name),
        INDEX idx_customer_type (customer_type),
        INDEX idx_status (status),
        INDEX idx_region (region),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户表'
    `);

    console.log('✅ 数据库表结构初始化完成');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行初始化
initializeDatabase().catch(err => {
  console.error('数据库初始化错误:', err);
  process.exit(1);
});

module.exports = pool;
