-- 创建页面设置表
CREATE TABLE IF NOT EXISTS `page_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `page_key` varchar(100) NOT NULL COMMENT '页面标识',
  `setting_key` varchar(100) NOT NULL COMMENT '设置键',
  `setting_value` text COMMENT '设置值',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_page_setting` (`page_key`,`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='页面设置表';

-- 插入默认数据
INSERT INTO `page_settings` (`id`, `page_key`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES 
(1,'capacity-load','displayDays','120','2025-12-08 09:30:38','2025-12-08 09:30:38'),
(2,'company-calendar','daysBeforeToday','90','2025-12-08 10:15:50','2025-12-08 10:15:50'),
(3,'company-calendar','daysAfterToday','180','2025-12-08 10:15:50','2025-12-08 23:02:07'),
(4,'company-calendar','standardWorkHours','8','2025-12-08 10:15:50','2025-12-08 10:15:50'),
(5,'company-calendar','weekendMode','single','2025-12-08 10:15:50','2025-12-08 23:02:07')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
