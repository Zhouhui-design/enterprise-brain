-- 企业级系统数据库初始化脚本
-- 创建时间和字符集配置
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库用户和权限
CREATE USER IF NOT EXISTS 'enterprise_user'@'%' IDENTIFIED BY 'enterprise_pass';
GRANT ALL PRIVILEGES ON enterprise_brain.* TO 'enterprise_user'@'%';
FLUSH PRIVILEGES;

-- 创建基础表结构（如果不存在）
USE enterprise_brain;

-- 企业日历表
CREATE TABLE IF NOT EXISTS company_calendar (
    id INT PRIMARY KEY AUTO_INCREMENT,
    calendar_date DATE NOT NULL UNIQUE,
    day_of_week TINYINT NOT NULL,
    is_workday BOOLEAN DEFAULT TRUE,
    is_holiday BOOLEAN DEFAULT FALSE,
    work_shift_type VARCHAR(20) DEFAULT 'NORMAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_calendar_date (calendar_date),
    INDEX idx_is_workday (is_workday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 工序类型表
CREATE TABLE IF NOT EXISTS process_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type_code (type_code),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认工序类型
INSERT IGNORE INTO process_types (type_code, type_name, description) VALUES
('CUTTING', '裁剪工序', '布料裁剪处理工序'),
('SEWING', '缝纫工序', '缝制和车缝工序'),
('PACKING', '打包工序', '产品包装工序'),
('IRONING', '熨烫工序', '熨烫和整理工序'),
('QC', '质检工序', '质量检验工序'),
('ASSEMBLY', '组装工序', '产品组装工序');

SET FOREIGN_KEY_CHECKS = 1;

-- 设置时区
SET GLOBAL time_zone = '+8:00';