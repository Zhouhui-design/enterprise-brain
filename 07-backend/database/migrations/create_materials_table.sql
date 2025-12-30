-- 创建物料表
CREATE TABLE IF NOT EXISTS materials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  material_code VARCHAR(50) UNIQUE COMMENT '物料编码',
  bom_number VARCHAR(50) COMMENT 'BOM编号',
  material_name VARCHAR(100) NOT NULL COMMENT '物料名称',
  size_spec VARCHAR(100) COMMENT '尺寸规格',
  color VARCHAR(50) COMMENT '颜色',
  material VARCHAR(50) COMMENT '材质',
  major_category VARCHAR(50) COMMENT '大类',
  middle_category VARCHAR(50) COMMENT '中类',
  minor_category VARCHAR(50) COMMENT '小类',
  model VARCHAR(50) COMMENT '型号',
  series VARCHAR(50) COMMENT '系列',
  source TEXT COMMENT '来源',
  description TEXT COMMENT '物料详述',
  material_image TEXT COMMENT '物料图片',
  base_unit VARCHAR(20) DEFAULT '个' COMMENT '基础单位',
  sale_unit VARCHAR(20) COMMENT '销售单位',
  sale_conversion_rate DECIMAL(10,2) DEFAULT 0.00 COMMENT '销售转化率',
  purchase_unit VARCHAR(20) COMMENT '采购单位',
  purchase_conversion_rate DECIMAL(10,2) DEFAULT 0.00 COMMENT '采购转化率',
  kg_per_pcs DECIMAL(10,4) DEFAULT 0.0000 COMMENT 'kg/pcs',
  pcs_per_kg DECIMAL(10,4) DEFAULT 0.0000 COMMENT 'pcs/kg',
  process_name VARCHAR(100) COMMENT '产出工序名称',
  standard_time DECIMAL(10,2) DEFAULT 0.00 COMMENT '定时工额',
  quota_time DECIMAL(10,2) DEFAULT 0.00 COMMENT '定额工时',
  minimum_packaging_quantity DECIMAL(10,6) DEFAULT 1.000000 COMMENT '最小包装量',
  process_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '工序单价',
  purchase_cycle VARCHAR(50) COMMENT '采购周期',
  purchase_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '采购单价',
  base_price DECIMAL(10,2) DEFAULT 0.00 COMMENT '基础单价',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_material_code (material_code),
  INDEX idx_material_name (material_name),
  INDEX idx_process_name (process_name),
  INDEX idx_major_category (major_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物料表';

-- 插入示例数据
INSERT INTO materials (
  material_code, bom_number, material_name, size_spec, color, material,
  major_category, middle_category, minor_category, model, series,
  source, description, material_image, base_unit, sale_unit,
  sale_conversion_rate, purchase_unit, purchase_conversion_rate,
  kg_per_pcs, pcs_per_kg, process_name, standard_time,
  quota_time, minimum_packaging_quantity, process_price,
  purchase_cycle, purchase_price, base_price
) VALUES 
('M20250001', 'BOM001', '传感器A1', '100*50*20mm', '银色', '不锈钢', '电子元器件', '传感器类', '压力传感器', 'SNS-100', '智能系列', '["自制", "外购"]', '高精度压力传感器，用于工业自动化控制系统', '', '个', '套', 1.00, '个', 1.00, 0.0500, 20.0000, '切割', 2.50, 3.00, 1.000000, 50.00, '7天', 45.00, 45.00),
('M20250002', 'BOM002', '电机B2', 'φ60*80mm', '蓝色', '铝合金', '电机类', '驱动电机', '步进电机', 'ST-200', '动力系列', '["自制"]', '高扭矩步进电机，适用于精密定位系统', '', '台', '台', 1.00, '台', 1.00, 2.5000, 0.4000, '组装', 4.00, 5.00, 1.000000, 120.00, '15天', 180.00, 180.00),
('M20250003', 'BOM003', '外壳C3', '200*150*100mm', '黑色', 'ABS塑料', '结构件类', '外壳类', '防护外壳', 'CS-300', '结构件系列', '["外购"]', 'ABS塑料外壳，IP65防护等级', '', '个', '个', 1.00, '个', 1.00, 0.2000, 5.0000, '喷涂', 1.50, 2.00, 10.000000, 30.00, '3天', 25.00, 25.00);