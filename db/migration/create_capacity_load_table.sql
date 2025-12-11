-- 工序能力负荷表
CREATE TABLE IF NOT EXISTS process_capacity_load (
  id INT PRIMARY KEY AUTO_INCREMENT,
  process_name VARCHAR(100) NOT NULL COMMENT '工序名称',
  date DATE NOT NULL COMMENT '日期',
  available_workstations INT DEFAULT 0 COMMENT '可用工位数量',
  work_shift VARCHAR(255) DEFAULT NULL COMMENT '上班时段',
  occupied_hours DECIMAL(10,2) DEFAULT 0 COMMENT '已占用工时',
  remaining_shift VARCHAR(255) DEFAULT NULL COMMENT '剩余时段',
  remaining_hours DECIMAL(10,2) DEFAULT 0 COMMENT '剩余工时',
  overtime_shift VARCHAR(255) DEFAULT NULL COMMENT '加班时段',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_process_date (process_name, date),
  INDEX idx_date (date),
  INDEX idx_process_name (process_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='工序能力负荷表';

-- 页面设置表（存储业务变量）
CREATE TABLE IF NOT EXISTS page_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page_key VARCHAR(100) NOT NULL COMMENT '页面标识',
  setting_key VARCHAR(100) NOT NULL COMMENT '设置键',
  setting_value TEXT COMMENT '设置值',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_page_setting (page_key, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面设置表';

-- 插入默认显示天数配置
INSERT INTO page_settings (page_key, setting_key, setting_value)
VALUES ('capacity-load', 'displayDays', '120')
ON DUPLICATE KEY UPDATE setting_value = '120';
