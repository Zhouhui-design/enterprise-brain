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

// 封装查询函数，自动解构结果
const query = async (sql, params) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

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

    // 创建列表式生产BOM主表
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

    // 创建列表式生产BOM子件表
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

    // 创建产品手册表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_manual (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
        productCode VARCHAR(100) NOT NULL UNIQUE COMMENT '产品编号',
        productName VARCHAR(255) NOT NULL COMMENT '产品名称',
        productImage TEXT COMMENT '产品图片URL',
        source TEXT COMMENT '来源（JSON数组）',
        outputProcessName VARCHAR(100) COMMENT '产出工序名称',
        category VARCHAR(100) COMMENT '产品分类',
        specification VARCHAR(255) COMMENT '规格型号',
        unit VARCHAR(50) DEFAULT '个' COMMENT '单位',
        status VARCHAR(50) DEFAULT '在售' COMMENT '销售状态',
        productStatus VARCHAR(50) DEFAULT '正常' COMMENT '产品状态',
        version VARCHAR(50) DEFAULT 'V1.0' COMMENT '版本号',
        isEnabled TINYINT DEFAULT 1 COMMENT '是否启用 0-禁用 1-启用',
        designer VARCHAR(100) COMMENT '设计者',
        bomMaintainer VARCHAR(100) COMMENT 'BOM维护人',
        remark TEXT COMMENT '备注',
        createTime DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updateTime DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_productCode (productCode),
        INDEX idx_category (category),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品手册表'
    `);

    // 创建库存主表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
        material_code VARCHAR(100) NOT NULL COMMENT '物料编号',
        material_name VARCHAR(255) NOT NULL COMMENT '物料名称',
        warehouse_code VARCHAR(100) DEFAULT 'WH001' COMMENT '仓库编号',
        warehouse_name VARCHAR(100) DEFAULT '默认仓库' COMMENT '仓库名称',
        location VARCHAR(100) COMMENT '库位',
        batch_no VARCHAR(100) COMMENT '批次号',
        quantity DECIMAL(15,4) DEFAULT 0 COMMENT '库存数量',
        available_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '可用数量',
        frozen_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '冻结数量',
        in_transit_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '在途数量',
        in_production_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '在制数量',
        reserved_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '预留数量',
        unit VARCHAR(50) DEFAULT '个' COMMENT '单位',
        unit_price DECIMAL(15,2) DEFAULT 0 COMMENT '单价',
        total_amount DECIMAL(15,2) DEFAULT 0 COMMENT '总金额',
        safety_stock DECIMAL(15,4) DEFAULT 0 COMMENT '安全库存',
        max_stock DECIMAL(15,4) DEFAULT 0 COMMENT '最大库存',
        min_stock DECIMAL(15,4) DEFAULT 0 COMMENT '最小库存',
        production_date DATE COMMENT '生产日期',
        expire_date DATE COMMENT '到期日期',
        supplier VARCHAR(200) COMMENT '供应商',
        status VARCHAR(50) DEFAULT 'normal' COMMENT '状态: normal-正常, warning-预警, shortage-短缺, expired-过期',
        last_in_date DATETIME COMMENT '最后入库日期',
        last_out_date DATETIME COMMENT '最后出库日期',
        remark TEXT COMMENT '备注',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_material_code (material_code),
        INDEX idx_warehouse_code (warehouse_code),
        INDEX idx_batch_no (batch_no),
        INDEX idx_status (status),
        UNIQUE KEY uk_material_warehouse_batch (material_code, warehouse_code, batch_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存主表'
    `);

    // 创建库存明细表（流水记录）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory_details (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
        transaction_no VARCHAR(100) UNIQUE NOT NULL COMMENT '事务单号',
        material_code VARCHAR(100) NOT NULL COMMENT '物料编号',
        material_name VARCHAR(255) NOT NULL COMMENT '物料名称',
        warehouse_code VARCHAR(100) DEFAULT 'WH001' COMMENT '仓库编号',
        warehouse_name VARCHAR(100) DEFAULT '默认仓库' COMMENT '仓库名称',
        location VARCHAR(100) COMMENT '库位',
        batch_no VARCHAR(100) COMMENT '批次号',
        transaction_type VARCHAR(50) NOT NULL COMMENT '事务类型: in-入库, out-出库, transfer-调拨, adjust-盘点调整',
        quantity DECIMAL(15,4) NOT NULL COMMENT '数量',
        unit VARCHAR(50) DEFAULT '个' COMMENT '单位',
        unit_price DECIMAL(15,2) DEFAULT 0 COMMENT '单价',
        total_amount DECIMAL(15,2) DEFAULT 0 COMMENT '总金额',
        before_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '变动前数量',
        after_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '变动后数量',
        related_order_no VARCHAR(100) COMMENT '关联单号（采购单/销售单/生产单）',
        operator VARCHAR(100) COMMENT '操作人',
        operator_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
        remark TEXT COMMENT '备注',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        INDEX idx_transaction_no (transaction_no),
        INDEX idx_material_code (material_code),
        INDEX idx_warehouse_code (warehouse_code),
        INDEX idx_transaction_type (transaction_type),
        INDEX idx_operator_time (operator_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存明细表（流水记录）'
    `);

    // 创建库存移动记录表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
        movement_no VARCHAR(100) UNIQUE NOT NULL COMMENT '移动单号',
        material_code VARCHAR(100) NOT NULL COMMENT '物料编号',
        material_name VARCHAR(255) NOT NULL COMMENT '物料名称',
        from_warehouse_code VARCHAR(100) COMMENT '源仓库编号',
        from_warehouse_name VARCHAR(100) COMMENT '源仓库名称',
        from_location VARCHAR(100) COMMENT '源库位',
        to_warehouse_code VARCHAR(100) COMMENT '目标仓库编号',
        to_warehouse_name VARCHAR(100) COMMENT '目标仓库名称',
        to_location VARCHAR(100) COMMENT '目标库位',
        batch_no VARCHAR(100) COMMENT '批次号',
        quantity DECIMAL(15,4) NOT NULL COMMENT '移动数量',
        unit VARCHAR(50) DEFAULT '个' COMMENT '单位',
        movement_type VARCHAR(50) NOT NULL COMMENT '移动类型: warehouse_transfer-仓库间转移, location_transfer-库位转移',
        status VARCHAR(50) DEFAULT 'pending' COMMENT '状态: pending-待审核, approved-已审核, completed-已完成, cancelled-已取消',
        applicant VARCHAR(100) COMMENT '申请人',
        apply_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
        approver VARCHAR(100) COMMENT '审核人',
        approve_time DATETIME COMMENT '审核时间',
        executor VARCHAR(100) COMMENT '执行人',
        execute_time DATETIME COMMENT '执行时间',
        remark TEXT COMMENT '备注',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_movement_no (movement_no),
        INDEX idx_material_code (material_code),
        INDEX idx_status (status),
        INDEX idx_apply_time (apply_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存移动记录表'
    `);

    // 创建MRP产品需求表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS mrp_product_demands (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        mrp_code VARCHAR(50) NOT NULL UNIQUE COMMENT 'MRP编码（唯一标识）',
        source_no VARCHAR(50) COMMENT '来源单号（内部销售订单编号）',
        material_code VARCHAR(50) COMMENT '物料编号（产品编号）',
        material_name VARCHAR(200) COMMENT '物料名称（产品名称）',
        material_unit VARCHAR(20) DEFAULT '个' COMMENT '单位',
        source_type VARCHAR(50) COMMENT '需求来源',
        demand_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '需求数量',
        required_date DATE COMMENT '需求日期',
        current_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '当前库库存',
        in_transit_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '在途库存',
        in_production_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '在制库存',
        production_reserved_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '生产预扣库存',
        to_be_shipped_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '待发货库存',
        suggested_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '建议数量（自动计算）',
        adjusted_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '调整数量（用户可编辑）',
        execute_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '执行数量（自动计算）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_mrp_code (mrp_code),
        INDEX idx_material_code (material_code),
        INDEX idx_source_no (source_no)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MRP产品需求表'
    `);

    // 创建MRP物料需求表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS mrp_material_demands (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        source_mrp_code VARCHAR(50) COMMENT '来源MRP编号',
        material_code VARCHAR(50) COMMENT '物料编码',
        material_name VARCHAR(200) COMMENT '物料名称',
        material_unit VARCHAR(20) DEFAULT '件' COMMENT '单位',
        source_type VARCHAR(50) COMMENT '需求来源',
        demand_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '需求数量',
        required_date DATE COMMENT '需求日期',
        current_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '当前库存',
        in_transit_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '在途库存',
        in_production_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '在制库存',
        production_reserved_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '生产预扣库存',
        to_be_shipped_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '待发货库存',
        suggested_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '建议数量',
        adjusted_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '调整数量',
        execute_qty DECIMAL(15, 4) DEFAULT 0 COMMENT '执行数量',
        level INT DEFAULT 1 COMMENT 'BOM层级',
        output_process VARCHAR(100) COMMENT '产出工序',
        component_source VARCHAR(50) COMMENT '子件来源（自制/外购）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_source_mrp_code (source_mrp_code),
        INDEX idx_material_code (material_code),
        INDEX idx_level (level),
        UNIQUE KEY unique_material_demand (source_mrp_code, material_code, level)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MRP物料需求表'
    `);

    // 创建主生产计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS master_production_plans (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        plan_code VARCHAR(50) NOT NULL UNIQUE COMMENT '主生产计划编号',
        product_code VARCHAR(100) COMMENT '产品编号',
        product_name VARCHAR(200) COMMENT '产品名称',
        order_quantity DECIMAL(15, 4) DEFAULT 0 COMMENT '订单数量',
        salesperson VARCHAR(100) COMMENT '销售员',
        sales_unit VARCHAR(20) COMMENT '销售单位',
        available_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '可用库存',
        current_stock DECIMAL(15, 4) DEFAULT 0 COMMENT '实时库存',
        plan_quantity DECIMAL(15, 4) DEFAULT 0 COMMENT '计划数量',
        product_image VARCHAR(500) COMMENT '产品图片',
        output_process VARCHAR(100) COMMENT '产出工序',
        promised_delivery_date DATE COMMENT '订单承诺交期',
        status VARCHAR(50) DEFAULT '已下单' COMMENT '进度状态',
        planned_storage_date DATE COMMENT '计划入库日期',
        product_source VARCHAR(100) COMMENT '产品来源',
        internal_order_no VARCHAR(100) COMMENT '内部销售订单编号',
        customer_order_no VARCHAR(100) COMMENT '客户订单编号',
        customer_name VARCHAR(200) COMMENT '客户名称',
        submitter VARCHAR(100) DEFAULT 'admin' COMMENT '提交人',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_plan_code (plan_code),
        INDEX idx_product_code (product_code),
        INDEX idx_internal_order_no (internal_order_no),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='主生产计划表'
    `);

    // 创建备料计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS material_preparation_plans (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        plan_no VARCHAR(50) NOT NULL UNIQUE COMMENT '备料计划编号',
        source_plan_no VARCHAR(50) COMMENT '来源主计划编号',
        source_process_plan_no VARCHAR(50) COMMENT '来源工序计划编号',
        parent_code VARCHAR(100) COMMENT '父件编码',
        parent_name VARCHAR(200) COMMENT '父件名称',
        parent_schedule_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '父件排程数量',
        material_code VARCHAR(100) COMMENT '物料编码',
        material_name VARCHAR(200) COMMENT '物料名称',
        material_source VARCHAR(50) COMMENT '物料来源',
        material_unit VARCHAR(20) COMMENT '物料单位',
        demand_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '需求数量',
        need_mrp TINYINT DEFAULT 0 COMMENT '是否需要MRP运算',
        realtime_stock DECIMAL(15,4) DEFAULT 0 COMMENT '实时库存',
        projected_balance DECIMAL(15,4) DEFAULT 0 COMMENT '预计结余',
        available_stock DECIMAL(15,4) DEFAULT 0 COMMENT '可用库存',
        replenishment_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '需补货数量',
        source_process VARCHAR(100) COMMENT '来源工序',
        workshop_name VARCHAR(100) COMMENT '车间名称',
        parent_process_name VARCHAR(100) COMMENT '父件工序名称',
        process_interval_hours DECIMAL(10,2) DEFAULT 0 COMMENT '工序间隔时间',
        process_interval_unit VARCHAR(20) DEFAULT 'hour' COMMENT '工序间隔单位',
        process_schedule_date DATE COMMENT '工序排程日期',
        demand_date DATE COMMENT '需求日期',
        push_to_purchase TINYINT DEFAULT 0 COMMENT '是否推送采购',
        push_to_process TINYINT DEFAULT 0 COMMENT '是否推送工序',
        sales_order_no VARCHAR(100) COMMENT '销售订单号',
        customer_order_no VARCHAR(100) COMMENT '客户订单号',
        main_plan_product_code VARCHAR(100) COMMENT '主计划产品编码',
        main_plan_product_name VARCHAR(200) COMMENT '主计划产品名称',
        main_plan_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '主计划数量',
        promise_delivery_date DATE COMMENT '承诺交期',
        customer_name VARCHAR(200) COMMENT '客户名称',
        remark TEXT COMMENT '备注',
        created_by VARCHAR(100) DEFAULT 'admin' COMMENT '创建人',
        updated_by VARCHAR(100) COMMENT '更新人',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_plan_no (plan_no),
        INDEX idx_source_plan_no (source_plan_no),
        INDEX idx_material_code (material_code),
        INDEX idx_demand_date (demand_date),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备料计划表'
    `);

    // 创建真工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS real_process_plans (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        plan_no VARCHAR(50) NOT NULL UNIQUE COMMENT '工序计划编号',
        sales_order_no VARCHAR(100) COMMENT '销售订单号',
        customer_order_no VARCHAR(100) COMMENT '客户订单号',
        master_plan_no VARCHAR(50) COMMENT '主计划编号',
        main_plan_product_code VARCHAR(100) COMMENT '主计划产品编码',
        main_plan_product_name VARCHAR(200) COMMENT '主计划产品名称',
        shipping_plan_no VARCHAR(50) COMMENT '发运计划编号',
        product_code VARCHAR(100) COMMENT '产品编码',
        product_name VARCHAR(200) COMMENT '产品名称',
        product_image TEXT NULL COMMENT '产品图片',
        process_manager VARCHAR(50) NULL COMMENT '工序负责人',
        process_name VARCHAR(100) COMMENT '工序名称',
        order_promise_delivery_date DATE NULL COMMENT '订单承诺交期',
        workshop_name VARCHAR(100) NULL COMMENT '车间名称',
        source_page_name VARCHAR(100) NULL COMMENT '来源页面名称',
        level0_product_name VARCHAR(200) NULL COMMENT '0级产品名称',
        level0_product_code VARCHAR(50) NULL COMMENT '0级产品编号',
        level0_production_qty INT DEFAULT 0 COMMENT '0级生产数量',
        product_source VARCHAR(50) NULL COMMENT '产品来源',
        bom_no VARCHAR(50) NULL COMMENT 'BOM编号',
        previous_schedule_no VARCHAR(50) NULL COMMENT '上一个排程编号',
        product_unit VARCHAR(20) COMMENT '产品单位',
        level0_demand DECIMAL(15,4) DEFAULT 0 COMMENT 'L0需求',
        completion_date DATE COMMENT '计划完工日期',
        replenishment_qty DECIMAL(15,4) DEFAULT 0 COMMENT '需补货数量',
        standard_work_quota DECIMAL(10,2) DEFAULT 0 COMMENT '定时工额',
        standard_work_hours DECIMAL(10,2) DEFAULT 0 COMMENT '定额工时',
        required_work_hours DECIMAL(10,2) DEFAULT 0 COMMENT '需求工时',
        plan_end_date DATE COMMENT '计划结束日期',
        plan_start_date DATE COMMENT '计划开始日期',
        real_plan_start_date DATE COMMENT '真计划开始日期',
        schedule_date DATE COMMENT '计划排程日期',
        daily_total_hours DECIMAL(10,2) DEFAULT 0 COMMENT '当天总工时',
        daily_scheduled_hours DECIMAL(10,2) DEFAULT 0 COMMENT '当天已排程工时',
        daily_available_hours DECIMAL(10,2) DEFAULT 0 COMMENT '当天可用工时',
        scheduled_work_hours DECIMAL(10,2) DEFAULT 0 COMMENT '计划排程工时',
        schedule_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '计划排程数量',
        next_schedule_date DATE COMMENT '下一个排程日期',
        remaining_required_hours DECIMAL(10,2) DEFAULT 0 COMMENT '剩余需求工时',
        cumulative_schedule_qty DECIMAL(15,4) DEFAULT 0 COMMENT '累积排程数量',
        unscheduled_qty DECIMAL(15,4) DEFAULT 0 COMMENT '未排数量',
        customer_name VARCHAR(200) COMMENT '客户名称',
        source_no VARCHAR(100) COMMENT '来源编号',
        schedule_count INT DEFAULT 1 COMMENT '排程次数',
        submitted_by VARCHAR(100) DEFAULT 'admin' COMMENT '提交人',
        submitted_at DATETIME COMMENT '提交时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_plan_no (plan_no),
        INDEX idx_master_plan_no (master_plan_no),
        INDEX idx_process_name (process_name),
        INDEX idx_schedule_date (schedule_date),
        INDEX idx_source_no (source_no),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='真工序计划表'
    `);

    // ✅ 创建组装工序计划表（复用real_process_plans结构）
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS assembly_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE assembly_process_plans COMMENT='组装工序计划表'
    `);

    // ✅ 创建打包工序计划表（使用packing_process_plans表名）
    // ⚠️ 重要：此表原名packing（打包），现用于存储打包工序数据
    // 命名变更历史：打包工序计划 = 原真工序计划（功能继承）
    // 喷塑工序已迁移至独立表spray_painting_process_plans
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS packing_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE packing_process_plans COMMENT='打包工序计划表（原名packing，此表用于存储打包工序数据）'
    `);

    // ✅ 创建缝纫工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sewing_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE sewing_process_plans COMMENT='缝纫工序计划表'
    `);

    // ✅ 创建抛丸工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shot_blasting_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE shot_blasting_process_plans COMMENT='抛丸工序计划表'
    `);

    // ✅ 创建人工焊接工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS manual_welding_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE manual_welding_process_plans COMMENT='人工焊接工序计划表'
    `);

    // ✅ 创建弯管工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tube_bending_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE tube_bending_process_plans COMMENT='弯管工序计划表'
    `);

    // ✅ 创建激光切管工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS laser_tube_cutting_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE laser_tube_cutting_process_plans COMMENT='激光切管工序计划表'
    `);

    // ✅ 创建激光下料工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS laser_cutting_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE laser_cutting_process_plans COMMENT='激光下料工序计划表'
    `);

    // ✅ 创建折弯工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bending_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE bending_process_plans COMMENT='折弯工序计划表'
    `);

    // ✅ 创建打孔工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS drilling_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE drilling_process_plans COMMENT='打孔工序计划表'
    `);

    // ✅ 创建冲床工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS punching_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE punching_process_plans COMMENT='冲床工序计划表'
    `);

    // ✅ 创建人工下料工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS manual_cutting_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE manual_cutting_process_plans COMMENT='人工下料工序计划表'
    `);

    // ✅ 创建机器打磨工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS machine_grinding_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE machine_grinding_process_plans COMMENT='机器打磨工序计划表'
    `);

    // ✅ 创建裁剪工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS cutting_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE cutting_process_plans COMMENT='裁剪工序计划表'
    `);
    
    // ✅ 创建喷塑工序计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS spray_painting_process_plans LIKE real_process_plans
    `);
    await connection.execute(`
      ALTER TABLE spray_painting_process_plans COMMENT='喷塑工序计划表'
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

module.exports = { pool, query };