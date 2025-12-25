const { query } = require('./config/database');

(async () => {
  try {
    console.log('Checking if procurement_plans table exists...');
    const result = await query("SHOW TABLES LIKE 'procurement_plans'");
    console.log('Table exists:', result.length > 0);

    if (result.length === 0) {
      console.log('Creating procurement_plans table...');
      await query(`
        CREATE TABLE procurement_plans (
          id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
          procurement_plan_no VARCHAR(100) UNIQUE NOT NULL COMMENT '采购计划编号',
          purchase_order_no VARCHAR(100) COMMENT '采购订单编号',
          source_form_name VARCHAR(100) COMMENT '来源单据名称',
          source_no VARCHAR(100) COMMENT '来源单号',
          material_code VARCHAR(100) COMMENT '物料编码',
          material_name VARCHAR(200) COMMENT '物料名称',
          material_image VARCHAR(500) COMMENT '物料图片',
          required_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '需求数量',
          base_unit VARCHAR(20) DEFAULT '个' COMMENT '基本单位',
          sales_order_no VARCHAR(100) COMMENT '销售订单号',
          customer_order_no VARCHAR(100) COMMENT '客户订单号',
          master_plan_no VARCHAR(100) COMMENT '主计划编号',
          process_plan_no VARCHAR(100) COMMENT '工序计划编号',
          material_plan_no VARCHAR(100) COMMENT '物料计划编号',
          plan_arrival_date DATE COMMENT '计划到货日期',
          procurement_status VARCHAR(50) DEFAULT 'PENDING_INQUIRY' COMMENT '采购状态',
          supplier_name VARCHAR(200) COMMENT '供应商名称',
          purchaser VARCHAR(100) COMMENT '采购员',
          inquiry_date DATE COMMENT '询价日期',
          order_date DATE COMMENT '下单日期',
          promised_arrival_date DATE COMMENT '承诺到货日期',
          plan_purchase_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '计划采购数量',
          conversion_rate DECIMAL(10,4) DEFAULT 1 COMMENT '换算率',
          purchase_unit VARCHAR(20) COMMENT '采购单位',
          plan_unit_price DECIMAL(10,2) DEFAULT 0 COMMENT '计划单价',
          plan_total_amount DECIMAL(15,2) DEFAULT 0 COMMENT '计划总金额',
          actual_purchase_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '实际采购数量',
          actual_unit_price DECIMAL(10,2) DEFAULT 0 COMMENT '实际单价',
          actual_total_amount DECIMAL(15,2) DEFAULT 0 COMMENT '实际总金额',
          actual_arrival_date DATE COMMENT '实际到货日期',
          actual_warehouse_quantity DECIMAL(15,4) DEFAULT 0 COMMENT '实际入库数量',
          warehouse_receipt_no VARCHAR(100) COMMENT '入库单号',
          warehouse_person VARCHAR(100) COMMENT '库管员',
          quality_inspector VARCHAR(100) COMMENT '质检员',
          return_order_no VARCHAR(100) COMMENT '退货单号',
          return_handler VARCHAR(100) COMMENT '退货处理人',
          actual_warehouse_unit_price DECIMAL(10,2) DEFAULT 0 COMMENT '实际入库单价',
          supplier_delivery_note_no VARCHAR(100) COMMENT '供应商送货单号',
          delivery_note_image VARCHAR(500) COMMENT '送货单图片',
          payment_method VARCHAR(50) COMMENT '付款方式',
          is_paid TINYINT DEFAULT 0 COMMENT '是否付款',
          payment_no VARCHAR(100) COMMENT '付款单号',
          payment_person VARCHAR(100) COMMENT '付款人',
          reimbursement_no VARCHAR(100) COMMENT '报销单号',
          reimbursement_person VARCHAR(100) COMMENT '报销人',
          monthly_reconciliation_date DATE COMMENT '月结对账日期',
          monthly_payment_date DATE COMMENT '月结付款日期',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='采购计划表'
      `);
      console.log('✅ procurement_plans table created successfully');
    } else {
      console.log('✅ procurement_plans table already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
