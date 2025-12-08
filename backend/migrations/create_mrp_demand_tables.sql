-- MRP物料需求管理表结构

-- 1. 产品需求表（表格1：产品名称及需求计算）
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MRP产品需求表';

-- 2. 物料需求表（表格2：半成品及物料需求计算）
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='MRP物料需求表';
