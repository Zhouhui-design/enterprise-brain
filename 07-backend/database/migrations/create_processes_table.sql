-- 创建工序列表
CREATE TABLE IF NOT EXISTS processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  process_code VARCHAR(50) NOT NULL COMMENT '工序编号',
  process_name VARCHAR(100) NOT NULL COMMENT '工序名称',
  responsible_person VARCHAR(100) COMMENT '工序负责人',
  dispatch_method VARCHAR(20) DEFAULT 'manual' COMMENT '派工方式',
  self_or_outsource VARCHAR(20) COMMENT '自制/外协',
  available_workstations INT DEFAULT 0 COMMENT '可用工位数量',
  is_warehousing TINYINT(1) DEFAULT 0 COMMENT '是否入库',
  completion_warehouse VARCHAR(100) COMMENT '完工绑定仓库',
  workshop_name VARCHAR(100) COMMENT '所属车间名称',
  process_wage DECIMAL(10,2) DEFAULT 0.00 COMMENT '工序工资',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序列表';

-- 插入示例数据
INSERT INTO processes (
  process_code, process_name, responsible_person, dispatch_method,
  self_or_outsource, available_workstations, is_warehousing,
  completion_warehouse, workshop_name, process_wage
) VALUES 
('P20250001', '切割', '张三', 'auto', '自制', 5, 1, '成品仓', '生产车间', 100.00),
('P20250002', '焊接', '李四', 'manual', '自制', 3, 0, '', '生产车间', 150.00),
('P20250003', '组装', '王五', 'auto', '自制', 8, 1, '半成品仓', '装配车间', 120.00),
('P20250004', '喷涂', '赵六', 'manual', '外协', 2, 1, '外协仓', '喷涂车间', 200.00),
('P20250005', '包装', '钱七', 'auto', '自制', 4, 1, '成品仓', '包装车间', 80.00);