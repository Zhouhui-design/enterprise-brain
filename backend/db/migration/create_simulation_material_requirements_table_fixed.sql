-- 模拟物料需求明细表
-- 用于存储基于模拟排程列表计算出的详细物料需求信息

CREATE TABLE simulation_material_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  sequence_number INT NOT NULL COMMENT '序号',
  requirement_no VARCHAR(50) UNIQUE NOT NULL COMMENT '物料需求明细编号',
  order_status VARCHAR(50) COMMENT '订单状态',
  internal_sales_order_no VARCHAR(100) COMMENT '内部销售订单编号',
  customer_delivery_date DATE COMMENT '客户交期',
  product_code VARCHAR(100) COMMENT '产品编号',
  product_name VARCHAR(255) COMMENT '产品名称',
  suggested_replenishment_qty DECIMAL(15,2) COMMENT '建议补货数量',
  level_address VARCHAR(200) COMMENT '层阶地址',
  level0_bom_code VARCHAR(100) COMMENT '0阶BOM编号',
  level_standard_qty DECIMAL(10,4) COMMENT '层阶-0阶标准用量',
  level0_bom_quantity DECIMAL(15,2) COMMENT '0阶BOM编号数量',
  current_process VARCHAR(100) COMMENT '当前工序',
  current_level_address VARCHAR(200) COMMENT '当前层阶地址',
  current_material_code VARCHAR(100) COMMENT '当前物料编号',
  current_material_name VARCHAR(200) COMMENT '当前物料名称',
  current_level0_standard_qty DECIMAL(10,4) COMMENT '当前0阶标准用量',
  current_required_qty DECIMAL(15,2) COMMENT '当前需求数量',
  available_inventory DECIMAL(15,2) COMMENT '可用库存',
  total_required_by_order DECIMAL(15,2) COMMENT '按顺序总需',
  still_needed_qty DECIMAL(15,2) COMMENT '还需数量',
  planned_purchase_date DATE COMMENT '计划采购日期',
  requirement_days INT COMMENT '需求天数',
  estimated_return_date DATE COMMENT '预计回厂日期',
  downstream_level_address VARCHAR(200) COMMENT '后道产品层阶地址',
  downstream_process_name VARCHAR(200) COMMENT '后道工序名称',
  downstream_product_code VARCHAR(100) COMMENT '后道工序产品编号',
  downstream_product_name VARCHAR(200) COMMENT '后道工序产品名称',
  downstream_level0_standard_qty DECIMAL(10,4) COMMENT '后道0阶标准用量',
  downstream_required_qty DECIMAL(15,2) COMMENT '后道需求数量',
  downstream_available_inventory DECIMAL(15,2) COMMENT '后道可用库存',
  submit_time DATETIME COMMENT '提交时间',
  continue_scheduling TINYINT(1) DEFAULT 1 COMMENT '是否继续排程',
  downstream_product_source VARCHAR(50) COMMENT '后道产品来源',
  requirement_detail_no VARCHAR(50) COMMENT '物料需求明细编号',
  source_no VARCHAR(100) COMMENT '来源编号',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模拟物料需求明细表';

-- 创建索引以优化查询性能
CREATE INDEX idx_requirement_no ON simulation_material_requirements(requirement_no);
CREATE INDEX idx_internal_sales_order_no ON simulation_material_requirements(internal_sales_order_no);
CREATE INDEX idx_product_code ON simulation_material_requirements(product_code);
CREATE INDEX idx_current_material_code ON simulation_material_requirements(current_material_code);
CREATE INDEX idx_source_no ON simulation_material_requirements(source_no);
CREATE INDEX idx_created_at ON simulation_material_requirements(created_at);
CREATE INDEX idx_customer_delivery_date ON simulation_material_requirements(customer_delivery_date);
CREATE INDEX idx_level_address ON simulation_material_requirements(level_address);
CREATE INDEX idx_downstream_product_code ON simulation_material_requirements(downstream_product_code);

-- 添加外键约束（如果需要的话）
-- ALTER TABLE simulation_material_requirements ADD CONSTRAINT fk_source_no FOREIGN KEY (source_no) REFERENCES simulation_scheduling_list(simulation_no);