-- 创建仓库管理表
CREATE TABLE IF NOT EXISTS warehouses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL COMMENT '仓库编码',
  name VARCHAR(100) NOT NULL COMMENT '仓库名称',
  type ENUM('raw_material', 'semi_finished', 'finished_product', 'waste') NOT NULL COMMENT '仓库类型',
  status ENUM('enabled', 'disabled') DEFAULT 'enabled' COMMENT '启用状态',
  capacity DECIMAL(10,2) DEFAULT 0 COMMENT '仓库容量(平方米)',
  locations INT DEFAULT 0 COMMENT '储位数量',
  region ENUM('east', 'south', 'north', 'central', 'southwest', 'northwest', 'northeast') COMMENT '所属区域',
  manager VARCHAR(50) COMMENT '负责人',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  address TEXT COMMENT '详细地址',
  description TEXT COMMENT '仓库描述',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_code (code),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='仓库管理表';

-- 插入初始数据
INSERT INTO warehouses (code, name, type, status, capacity, locations, region, manager, contact_phone, address, description) VALUES
('WH001', '原材料主仓', 'raw_material', 'enabled', 5000.00, 500, 'east', '张三', '13800138001', '上海市浦东新区张江高科技园区科苑路88号', '主要存储生产所需的各类原材料，是公司最大的原材料仓库'),
('WH002', '成品仓A', 'finished_product', 'enabled', 3000.00, 300, 'east', '李四', '13900139002', '上海市浦东新区川沙路5000号', '主要存储A系列产品的成品'),
('WH003', '半成品仓', 'semi_finished', 'enabled', 2000.00, 200, 'east', '王五', '13700137003', '上海市浦东新区金桥路1000号', '存储生产过程中的半成品'),
('WH004', '废料处理仓', 'waste', 'enabled', 1000.00, 100, 'east', '赵六', '13600136004', '上海市浦东新区老港工业区1号', '存储生产过程中产生的废料，等待处理'),
('WH005', '华南原材料仓', 'raw_material', 'enabled', 4000.00, 400, 'south', '陈七', '13500135005', '广东省深圳市南山区科技园南区T3栋', '华南地区原材料仓库'),
('WH006', '华北成品仓', 'finished_product', 'enabled', 3500.00, 350, 'north', '刘八', '13400134006', '北京市大兴区亦庄经济技术开发区荣华南路', '华北地区成品仓库'),
('WH007', '华中成品仓', 'finished_product', 'disabled', 2500.00, 250, 'central', '周九', '13300133007', '湖北省武汉市东湖新技术开发区光谷大道', '华中区成品仓库，目前暂时关闭'),
('WH008', '原材料辅仓', 'raw_material', 'enabled', 1500.00, 150, 'east', '吴十', '13200132008', '上海市嘉定区安亭镇新源路', '辅助原材料仓库，主要存储一些特殊材料');