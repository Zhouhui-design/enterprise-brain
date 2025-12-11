-- 企业日历表
CREATE TABLE IF NOT EXISTS company_calendar (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  calendar_date DATE NOT NULL UNIQUE COMMENT '日期',
  weekday VARCHAR(20) COMMENT '星期',
  is_workday TINYINT DEFAULT 1 COMMENT '休息/上班（0-休息，1-上班）',
  standard_work_hours DECIMAL(4,2) DEFAULT 8.00 COMMENT '标准上班时长（小时）',
  adjusted_work_hours DECIMAL(4,2) COMMENT '调整后工时（小时）',
  is_adjusted TINYINT DEFAULT 0 COMMENT '是否调整工时（0-否，1-是）',
  holiday_name VARCHAR(100) COMMENT '节假日名称',
  remark VARCHAR(500) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_calendar_date (calendar_date),
  INDEX idx_is_workday (is_workday),
  INDEX idx_weekday (weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='企业日历表';

-- 插入企业日历默认设置（使用已存在的page_settings表结构）
INSERT INTO page_settings (page_key, setting_key, setting_value) VALUES
('company-calendar', 'daysBeforeToday', '90'),
('company-calendar', 'daysAfterToday', '365'),
('company-calendar', 'standardWorkHours', '8'),
('company-calendar', 'weekendMode', 'double')
ON DUPLICATE KEY UPDATE 
  setting_value = VALUES(setting_value);
