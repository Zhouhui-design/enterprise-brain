-- BOM导入导出相关表结构
-- 创建时间: 2024-12-30

-- 1. 创建BOM导入日志表
CREATE TABLE IF NOT EXISTS `bom_import_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  `user_id` VARCHAR(50) NOT NULL DEFAULT 'system' COMMENT '用户ID',
  `file_name` VARCHAR(255) DEFAULT NULL COMMENT '导入文件名',
  `total_records` INT NOT NULL DEFAULT 0 COMMENT '总记录数',
  `success_count` INT NOT NULL DEFAULT 0 COMMENT '成功记录数',
  `error_count` INT NOT NULL DEFAULT 0 COMMENT '错误记录数',
  `warning_count` INT NOT NULL DEFAULT 0 COMMENT '警告记录数',
  `status` ENUM('success', 'error', 'warning', 'partial') NOT NULL DEFAULT 'unknown' COMMENT '导入状态',
  `error_details` JSON DEFAULT NULL COMMENT '错误详情JSON',
  `import_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '导入时间',
  `duration_ms` INT DEFAULT NULL COMMENT '导入耗时（毫秒）',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '客户端IP地址',
  `user_agent` TEXT DEFAULT NULL COMMENT '用户代理信息',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_import_time` (`import_time`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM导入日志表';

-- 2. 创建BOM导入临时表（用于批量处理）
CREATE TABLE IF NOT EXISTS `bom_import_temp` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '临时ID',
  `session_id` VARCHAR(100) NOT NULL COMMENT '导入会话ID',
  `row_number` INT NOT NULL COMMENT '行号',
  `bom_code` VARCHAR(100) NOT NULL COMMENT 'BOM编号',
  `bom_name` VARCHAR(255) NOT NULL COMMENT 'BOM名称',
  `product_code` VARCHAR(100) NOT NULL COMMENT '产品编号',
  `product_name` VARCHAR(255) NOT NULL COMMENT '产品名称',
  `version` VARCHAR(50) DEFAULT 'V1.0' COMMENT '版本号',
  `status` ENUM('draft', 'reviewing', 'approved', 'obsolete') DEFAULT 'draft' COMMENT '状态',
  `designer` VARCHAR(100) DEFAULT NULL COMMENT '设计人员',
  `reviewer` VARCHAR(100) DEFAULT NULL COMMENT '审核人员',
  `item_count` INT DEFAULT 1 COMMENT '物料数量',
  `effective_date` DATE DEFAULT NULL COMMENT '生效日期',
  `remark` TEXT DEFAULT NULL COMMENT '备注',
  `total_labor` DECIMAL(15,2) DEFAULT 0.00 COMMENT '总人工费用',
  `total_material` DECIMAL(15,2) DEFAULT 0.00 COMMENT '总材料费用',
  `children_data` JSON DEFAULT NULL COMMENT '子件数据JSON',
  `validation_status` ENUM('pending', 'valid', 'error') DEFAULT 'pending' COMMENT '验证状态',
  `validation_errors` JSON DEFAULT NULL COMMENT '验证错误信息',
  `import_status` ENUM('pending', 'imported', 'skipped', 'error') DEFAULT 'pending' COMMENT '导入状态',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY `uk_session_row` (`session_id`, `row_number`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_bom_code` (`bom_code`),
  KEY `idx_validation_status` (`validation_status`),
  KEY `idx_import_status` (`import_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM导入临时表';

-- 3. 创建BOM导入配置表
CREATE TABLE IF NOT EXISTS `bom_import_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
  `setting_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
  `setting_value` TEXT NOT NULL COMMENT '配置值',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '配置描述',
  `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM导入配置表';

-- 4. 插入默认配置
INSERT IGNORE INTO `bom_import_settings` (`setting_key`, `setting_value`, `description`) VALUES
('max_file_size', '10485760', '最大文件大小（字节）'),
('allowed_extensions', '["xlsx","xls"]', '允许的文件扩展名'),
('skip_duplicates_default', 'false', '默认跳过重复项'),
('batch_size', '100', '批量处理大小'),
('auto_cleanup_days', '30', '自动清理天数'),
('require_validation', 'true', '是否需要验证'),
('max_error_rows', '100', '最大错误行数');

-- 5. 创建BOM导出任务表
CREATE TABLE IF NOT EXISTS `bom_export_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
  `task_id` VARCHAR(100) NOT NULL UNIQUE COMMENT '任务唯一标识',
  `user_id` VARCHAR(50) NOT NULL DEFAULT 'system' COMMENT '用户ID',
  `export_type` ENUM('full', 'filtered', 'selected') NOT NULL COMMENT '导出类型',
  `bom_ids` JSON DEFAULT NULL COMMENT '选中的BOM ID列表',
  `filter_criteria` JSON DEFAULT NULL COMMENT '筛选条件',
  `format` ENUM('excel', 'csv', 'json') DEFAULT 'excel' COMMENT '导出格式',
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending' COMMENT '任务状态',
  `progress` INT DEFAULT 0 COMMENT '进度百分比',
  `total_records` INT DEFAULT 0 COMMENT '总记录数',
  `processed_records` INT DEFAULT 0 COMMENT '已处理记录数',
  `file_path` VARCHAR(500) DEFAULT NULL COMMENT '生成文件路径',
  `file_size` INT DEFAULT NULL COMMENT '文件大小（字节）',
  `download_url` VARCHAR(500) DEFAULT NULL COMMENT '下载链接',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `started_at` DATETIME DEFAULT NULL COMMENT '开始时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `expires_at` DATETIME DEFAULT NULL COMMENT '过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_task_id` (`task_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='BOM导出任务表';

-- 6. 为现有的production_boms表添加导入导出相关字段（如果不存在）
ALTER TABLE `production_boms` 
ADD COLUMN IF NOT EXISTS `import_batch_id` VARCHAR(100) DEFAULT NULL COMMENT '导入批次ID' AFTER `update_user`,
ADD COLUMN IF NOT EXISTS `export_included` TINYINT(1) DEFAULT 0 COMMENT '是否已导出' AFTER `import_batch_id`,
ADD COLUMN IF NOT EXISTS `last_export_time` DATETIME DEFAULT NULL COMMENT '最后导出时间' AFTER `export_included`;

-- 7. 为现有的production_bom_children表添加导入导出相关字段（如果不存在）
ALTER TABLE `production_bom_children` 
ADD COLUMN IF NOT EXISTS `import_batch_id` VARCHAR(100) DEFAULT NULL COMMENT '导入批次ID' AFTER `sequence`,
ADD COLUMN IF NOT EXISTS `validation_status` ENUM('pending', 'valid', 'error') DEFAULT 'valid' COMMENT '验证状态' AFTER `import_batch_id`,
ADD COLUMN IF NOT EXISTS `validation_errors` JSON DEFAULT NULL COMMENT '验证错误信息' AFTER `validation_status`;

-- 8. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS `idx_production_boms_import_batch` ON `production_boms` (`import_batch_id`);
CREATE INDEX IF NOT EXISTS `idx_production_boms_last_export` ON `production_boms` (`last_export_time`);
CREATE INDEX IF NOT EXISTS `idx_production_bom_children_import_batch` ON `production_bom_children` (`import_batch_id`);
CREATE INDEX IF NOT EXISTS `idx_production_bom_children_validation` ON `production_bom_children` (`validation_status`);

-- 9. 创建视图用于导入统计
CREATE OR REPLACE VIEW `v_bom_import_stats` AS
SELECT 
  DATE(import_time) as import_date,
  COUNT(*) as total_imports,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_imports,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as failed_imports,
  SUM(CASE WHEN status = 'warning' THEN 1 ELSE 0 END) as warning_imports,
  SUM(total_records) as total_records_processed,
  SUM(success_count) as total_success_records,
  SUM(error_count) as total_error_records,
  AVG(duration_ms) as avg_duration_ms,
  MAX(duration_ms) as max_duration_ms
FROM bom_import_logs
WHERE import_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(import_time)
ORDER BY import_date DESC;

-- 10. 创建清理存储过程
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `CleanupBOMImportLogs`()
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
  
  -- 清理30天前的导入日志
  DELETE FROM bom_import_logs 
  WHERE import_time < DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  -- 清理过期的导出任务
  DELETE FROM bom_export_tasks 
  WHERE status IN ('completed', 'failed', 'cancelled') 
    AND expires_at < NOW();
  
  -- 清理24小时前的临时数据
  DELETE FROM bom_import_temp 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
  
  COMMIT;
END //
DELIMITER ;

-- 创建定时事件（如果未启用，需要手动启用）
-- SET GLOBAL event_scheduler = ON;
-- CREATE EVENT IF NOT EXISTS `cleanup_bom_import_logs`
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO CALL CleanupBOMImportLogs();
