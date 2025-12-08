const { pool } = require('../config/database');

/**
 * 创建备料计划表
 */
async function createMaterialPreparationPlansTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('开始创建备料计划表...');
    
    // 创建备料计划表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS material_preparation_plans (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
        plan_no VARCHAR(50) NOT NULL UNIQUE COMMENT '备料计划编号',
        source_plan_no VARCHAR(50) COMMENT '来源主计划编号',
        source_process_plan_no VARCHAR(50) COMMENT '来源工序计划编号',
        material_code VARCHAR(50) NOT NULL COMMENT '计划物料编号',
        material_name VARCHAR(200) NOT NULL COMMENT '计划物料名称',
        material_source VARCHAR(20) COMMENT '物料来源',
        material_unit VARCHAR(20) COMMENT '物料单位',
        demand_quantity DECIMAL(18, 4) DEFAULT 0 COMMENT '需求数量',
        need_mrp TINYINT(1) DEFAULT 0 COMMENT '是否需要MRP运算',
        realtime_stock DECIMAL(18, 4) DEFAULT 0 COMMENT '实时库存',
        projected_balance DECIMAL(18, 4) DEFAULT 0 COMMENT '预计结存',
        available_stock DECIMAL(18, 4) DEFAULT 0 COMMENT '有效库存',
        source_process VARCHAR(100) COMMENT '来源工序',
        workshop_name VARCHAR(100) COMMENT '车间名称',
        demand_date DATE COMMENT '需求日期',
        push_to_purchase TINYINT(1) DEFAULT 0 COMMENT '是否下推采购计划',
        push_to_process TINYINT(1) DEFAULT 0 COMMENT '是否下推工序计划',
        sales_order_no VARCHAR(50) COMMENT '销售订单编号',
        customer_order_no VARCHAR(50) COMMENT '客户订单编号',
        main_plan_product_code VARCHAR(50) COMMENT '主计划产品编号',
        main_plan_product_name VARCHAR(200) COMMENT '主计划产品名称',
        main_plan_quantity DECIMAL(18, 4) DEFAULT 0 COMMENT '主计划排程数量',
        promise_delivery_date DATE COMMENT '订单承诺交期',
        remark TEXT COMMENT '备注',
        created_by VARCHAR(50) COMMENT '创建人',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_by VARCHAR(50) COMMENT '更新人',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_plan_no (plan_no),
        INDEX idx_source_plan_no (source_plan_no),
        INDEX idx_material_code (material_code),
        INDEX idx_demand_date (demand_date),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='备料计划表';
    `);
    
    console.log('✅ 备料计划表创建成功');
    
  } catch (error) {
    console.error('❌ 创建备料计划表失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行创建
createMaterialPreparationPlansTable()
  .then(() => {
    console.log('数据库表创建完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('创建失败:', error);
    process.exit(1);
  });
