-- 智能功能模块数据库表结构
-- 创建时间：2024-11-27
-- 版本：V1.2.0

-- =================
-- 智能表格模块
-- =================

-- 智能表格配置表（扩展现有的smart_table表）
CREATE TABLE IF NOT EXISTS `smart_table_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    `table_id` BIGINT NOT NULL COMMENT '表格ID',
    `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `config_value` TEXT COMMENT '配置值(JSON格式)',
    `config_type` VARCHAR(50) COMMENT '配置类型(display,calculation,validation,etc.)',
    `is_system` TINYINT DEFAULT 0 COMMENT '是否系统配置',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY `uk_table_config` (`table_id`, `config_key`),
    INDEX `idx_config_type` (`config_type`),
    FOREIGN KEY (`table_id`) REFERENCES `smart_table`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='智能表格配置表';

-- 表格模板表
CREATE TABLE IF NOT EXISTS `table_template` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '模板ID',
    `template_name` VARCHAR(200) NOT NULL COMMENT '模板名称',
    `template_code` VARCHAR(100) UNIQUE COMMENT '模板编码',
    `template_type` VARCHAR(50) COMMENT '模板类型',
    `template_config` JSON COMMENT '模板配置(JSON格式)',
    `column_config` JSON COMMENT '列配置',
    `formula_config` JSON COMMENT '公式配置',
    `validation_config` JSON COMMENT '验证配置',
    `is_public` TINYINT DEFAULT 0 COMMENT '是否公共模板',
    `usage_count` INT DEFAULT 0 COMMENT '使用次数',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_template_code` (`template_code`),
    INDEX `idx_template_type` (`template_type`),
    INDEX `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='表格模板表';

-- 表格共享权限表
CREATE TABLE IF NOT EXISTS `table_share` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    `table_id` BIGINT NOT NULL COMMENT '表格ID',
    `share_type` TINYINT NOT NULL COMMENT '共享类型(1-用户 2-角色 3-部门)',
    `share_target_id` BIGINT NOT NULL COMMENT '共享目标ID',
    `permission` TINYINT DEFAULT 1 COMMENT '权限(1-查看 2-编辑 3-管理)',
    `expire_time` DATETIME COMMENT '过期时间',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `created_by` BIGINT COMMENT '创建人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY `uk_table_share` (`table_id`, `share_type`, `share_target_id`),
    INDEX `idx_share_target` (`share_type`, `share_target_id`),
    FOREIGN KEY (`table_id`) REFERENCES `smart_table`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='表格共享权限表';

-- =================
-- 数据分析模块
-- =================

-- 数据报表定义表
CREATE TABLE IF NOT EXISTS `report_definition` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '报表ID',
    `report_name` VARCHAR(200) NOT NULL COMMENT '报表名称',
    `report_code` VARCHAR(100) UNIQUE COMMENT '报表编码',
    `report_type` VARCHAR(50) COMMENT '报表类型(table,chart,dashboard)',
    `data_source` VARCHAR(100) COMMENT '数据源',
    `query_sql` TEXT COMMENT '查询SQL',
    `report_config` JSON COMMENT '报表配置',
    `chart_config` JSON COMMENT '图表配置',
    `filter_config` JSON COMMENT '筛选配置',
    `is_public` TINYINT DEFAULT 0 COMMENT '是否公开',
    `refresh_interval` INT DEFAULT 0 COMMENT '刷新间隔(分钟)',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_report_code` (`report_code`),
    INDEX `idx_report_type` (`report_type`),
    INDEX `idx_is_public` (`is_public`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据报表定义表';

-- 报表执行历史表
CREATE TABLE IF NOT EXISTS `report_execution` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    `report_id` BIGINT NOT NULL COMMENT '报表ID',
    `execution_time` DATETIME NOT NULL COMMENT '执行时间',
    `execution_duration` INT COMMENT '执行耗时(毫秒)',
    `result_rows` INT COMMENT '结果行数',
    `execution_status` TINYINT COMMENT '执行状态(1-成功 2-失败 3-超时)',
    `error_message` TEXT COMMENT '错误信息',
    `executed_by` BIGINT COMMENT '执行人',
    INDEX `idx_report_id` (`report_id`),
    INDEX `idx_execution_time` (`execution_time`),
    INDEX `idx_execution_status` (`execution_status`),
    FOREIGN KEY (`report_id`) REFERENCES `report_definition`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='报表执行历史表';

-- =================
-- 智能算法模块
-- =================

-- 算法配置表
CREATE TABLE IF NOT EXISTS `algorithm_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '算法ID',
    `algorithm_name` VARCHAR(200) NOT NULL COMMENT '算法名称',
    `algorithm_code` VARCHAR(100) UNIQUE COMMENT '算法编码',
    `algorithm_type` VARCHAR(50) COMMENT '算法类型(prediction,optimization,classification)',
    `algorithm_class` VARCHAR(200) COMMENT '算法实现类',
    `input_params` JSON COMMENT '输入参数配置',
    `output_params` JSON COMMENT '输出参数配置',
    `model_path` VARCHAR(500) COMMENT '模型文件路径',
    `version` VARCHAR(20) COMMENT '版本号',
    `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_algorithm_code` (`algorithm_code`),
    INDEX `idx_algorithm_type` (`algorithm_type`),
    INDEX `idx_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='算法配置表';

-- 算法执行记录表
CREATE TABLE IF NOT EXISTS `algorithm_execution` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID',
    `algorithm_id` BIGINT NOT NULL COMMENT '算法ID',
    `execution_id` VARCHAR(100) UNIQUE COMMENT '执行ID',
    `input_data` JSON COMMENT '输入数据',
    `output_data` JSON COMMENT '输出结果',
    `execution_time` DATETIME NOT NULL COMMENT '执行时间',
    `execution_duration` INT COMMENT '执行耗时(毫秒)',
    `execution_status` TINYINT COMMENT '执行状态(1-成功 2-失败 3-运行中)',
    `error_message` TEXT COMMENT '错误信息',
    `accuracy` DECIMAL(5,4) COMMENT '准确率',
    `executed_by` BIGINT COMMENT '执行人',
    INDEX `idx_algorithm_id` (`algorithm_id`),
    INDEX `idx_execution_id` (`execution_id`),
    INDEX `idx_execution_time` (`execution_time`),
    INDEX `idx_execution_status` (`execution_status`),
    FOREIGN KEY (`algorithm_id`) REFERENCES `algorithm_config`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='算法执行记录表';

-- =================
-- 智能推荐模块
-- =================

-- 推荐规则表
CREATE TABLE IF NOT EXISTS `recommendation_rule` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '规则ID',
    `rule_name` VARCHAR(200) NOT NULL COMMENT '规则名称',
    `rule_code` VARCHAR(100) UNIQUE COMMENT '规则编码',
    `rule_type` VARCHAR(50) COMMENT '规则类型(product,customer,price)',
    `trigger_condition` JSON COMMENT '触发条件',
    `recommendation_logic` TEXT COMMENT '推荐逻辑',
    `priority` INT DEFAULT 0 COMMENT '优先级',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
    `effective_start` DATE COMMENT '生效开始日期',
    `effective_end` DATE COMMENT '生效结束日期',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_rule_code` (`rule_code`),
    INDEX `idx_rule_type` (`rule_type`),
    INDEX `idx_priority` (`priority`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推荐规则表';

-- 推荐记录表
CREATE TABLE IF NOT EXISTS `recommendation_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    `rule_id` BIGINT NOT NULL COMMENT '规则ID',
    `user_id` BIGINT COMMENT '用户ID',
    `recommendation_type` VARCHAR(50) COMMENT '推荐类型',
    `recommendation_data` JSON COMMENT '推荐数据',
    `is_adopted` TINYINT DEFAULT 0 COMMENT '是否被采纳',
    `feedback_score` TINYINT COMMENT '反馈评分(1-5)',
    `feedback_comment` VARCHAR(500) COMMENT '反馈意见',
    `recommended_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '推荐时间',
    `adopted_time` DATETIME COMMENT '采纳时间',
    INDEX `idx_rule_id` (`rule_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_recommendation_type` (`recommendation_type`),
    INDEX `idx_recommended_time` (`recommended_time`),
    INDEX `idx_is_adopted` (`is_adopted`),
    FOREIGN KEY (`rule_id`) REFERENCES `recommendation_rule`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推荐记录表';