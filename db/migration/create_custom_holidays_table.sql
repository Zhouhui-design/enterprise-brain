-- 自定义节日表
CREATE TABLE IF NOT EXISTS custom_holidays (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  name VARCHAR(100) NOT NULL COMMENT '节日名称',
  date_type ENUM('solar', 'lunar') DEFAULT 'solar' COMMENT '日历类型（solar-阳历，lunar-阴历）',
  month INT NOT NULL COMMENT '月份（1-12）',
  day INT NOT NULL COMMENT '日期（1-31）',
  remark VARCHAR(500) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_date (month, day),
  INDEX idx_date_type (date_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='自定义节日表';