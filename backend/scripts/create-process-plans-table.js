const { pool } = require('../config/database');

/**
 * 创建工序计划表
 */
async function createProcessPlansTable() {
  const connection = await pool.getConnection();
  
  try {
    console.log('开始创建工序计划表...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS process_plans (
        id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
        plan_no VARCHAR(50) NOT NULL UNIQUE COMMENT '工序计划编号',
        schedule_date DATE COMMENT '计划排程日期',
        sales_order_no VARCHAR(50) COMMENT '销售订单编号',
        master_plan_no VARCHAR(50) COMMENT '主生产计划编号',
        shipping_plan_no VARCHAR(50) COMMENT '发货计划编号',
        product_code VARCHAR(50) COMMENT '生产产品编号',
        product_name VARCHAR(200) COMMENT '生产产品名称',
        product_image TEXT COMMENT '产品图片',
        process_manager VARCHAR(50) COMMENT '工序负责人',
        process_name VARCHAR(100) COMMENT '工序名称',
        schedule_quantity DECIMAL(18, 4) DEFAULT 0 COMMENT '计划排程数量',
        used_work_hours DECIMAL(18, 4) DEFAULT 0 COMMENT '本次占用工时',
        product_unit VARCHAR(20) COMMENT '产品单位',
        level0_demand DECIMAL(18, 4) DEFAULT 0 COMMENT '0阶需求数量',
        completion_date DATE COMMENT '计划完工日期',
        workshop_name VARCHAR(100) COMMENT '车间名称',
        daily_available_hours DECIMAL(18, 4) DEFAULT 0 COMMENT '工序当天可用工时',
        remaining_schedule_hours DECIMAL(18, 4) DEFAULT 0 COMMENT '还需排程工时',
        schedule_count INT DEFAULT 0 COMMENT '排程次数',
        standard_work_hours DECIMAL(18, 4) DEFAULT 0 COMMENT '定额工时',
        standard_work_quota DECIMAL(18, 4) DEFAULT 0 COMMENT '定时工额',
        scheduled_hours DECIMAL(18, 4) DEFAULT 0 COMMENT '已排工时',
        unscheduled_hours DECIMAL(18, 4) DEFAULT 0 COMMENT '未排工时',
        source_page_name VARCHAR(50) COMMENT '来源页面名称',
        source_no VARCHAR(50) COMMENT '来源编号',
        previous_schedule_no VARCHAR(50) COMMENT '上一个排程单号',
        customer_name VARCHAR(100) COMMENT '客户名称',
        level0_product_name VARCHAR(200) COMMENT '0阶产品名称',
        level0_product_code VARCHAR(50) COMMENT '0阶产品编号',
        level0_production_qty DECIMAL(18, 4) DEFAULT 0 COMMENT '0阶主计划生产数量',
        product_source VARCHAR(50) COMMENT '产品来源',
        bom_no VARCHAR(50) COMMENT 'BOM编号',
        submitted_by VARCHAR(50) COMMENT '提交人',
        submitted_at TIMESTAMP NULL COMMENT '提交时间',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_plan_no (plan_no),
        INDEX idx_master_plan_no (master_plan_no),
        INDEX idx_process_name (process_name),
        INDEX idx_schedule_date (schedule_date),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工序计划表';
    `);
    
    console.log('✅ 工序计划表创建成功');
    
  } catch (error) {
    console.error('❌ 创建工序计划表失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行创建
createProcessPlansTable()
  .then(() => {
    console.log('数据库表创建完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('创建失败:', error);
    process.exit(1);
  });
