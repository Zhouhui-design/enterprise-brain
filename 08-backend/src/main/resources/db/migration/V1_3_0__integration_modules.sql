-- 系统集成模块数据库表结构
-- 创建时间：2024-11-27
-- 版本：V1.3.0

-- =================
-- API集成管理模块
-- =================

-- API接口配置表
CREATE TABLE IF NOT EXISTS `api_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '接口ID',
    `api_name` VARCHAR(200) NOT NULL COMMENT '接口名称',
    `api_code` VARCHAR(100) UNIQUE COMMENT '接口编码',
    `api_url` VARCHAR(500) NOT NULL COMMENT '接口地址',
    `api_method` VARCHAR(20) DEFAULT 'POST' COMMENT '请求方法',
    `api_type` VARCHAR(50) COMMENT '接口类型(rest,soap,graphql)',
    `content_type` VARCHAR(100) DEFAULT 'application/json' COMMENT '内容类型',
    `timeout` INT DEFAULT 30000 COMMENT '超时时间(毫秒)',
    `retry_times` INT DEFAULT 3 COMMENT '重试次数',
    `auth_type` VARCHAR(50) COMMENT '认证类型(none,basic,bearer,oauth2)',
    `auth_config` JSON COMMENT '认证配置',
    `request_headers` JSON COMMENT '请求头配置',
    `request_params` JSON COMMENT '请求参数配置',
    `response_mapping` JSON COMMENT '响应映射配置',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_api_code` (`api_code`),
    INDEX `idx_api_type` (`api_type`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API接口配置表';

-- API调用记录表
CREATE TABLE IF NOT EXISTS `api_call_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
    `api_id` BIGINT NOT NULL COMMENT 'API配置ID',
    `call_id` VARCHAR(100) UNIQUE COMMENT '调用ID',
    `request_url` VARCHAR(500) COMMENT '请求地址',
    `request_method` VARCHAR(20) COMMENT '请求方法',
    `request_headers` JSON COMMENT '请求头',
    `request_body` MEDIUMTEXT COMMENT '请求体',
    `response_status` INT COMMENT '响应状态码',
    `response_headers` JSON COMMENT '响应头',
    `response_body` MEDIUMTEXT COMMENT '响应体',
    `response_time` INT COMMENT '响应时间(毫秒)',
    `is_success` TINYINT COMMENT '是否成功',
    `error_message` TEXT COMMENT '错误信息',
    `call_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '调用时间',
    `caller_ip` VARCHAR(50) COMMENT '调用者IP',
    `caller_id` BIGINT COMMENT '调用者ID',
    INDEX `idx_api_id` (`api_id`),
    INDEX `idx_call_id` (`call_id`),
    INDEX `idx_call_time` (`call_time`),
    INDEX `idx_is_success` (`is_success`),
    FOREIGN KEY (`api_id`) REFERENCES `api_config`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='API调用记录表';

-- =================
-- 消息队列模块
-- =================

-- 消息队列配置表
CREATE TABLE IF NOT EXISTS `message_queue_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '队列ID',
    `queue_name` VARCHAR(200) NOT NULL COMMENT '队列名称',
    `queue_type` VARCHAR(50) COMMENT '队列类型(rabbitmq,rocketmq,kafka)',
    `broker_url` VARCHAR(500) COMMENT '代理地址',
    `exchange_name` VARCHAR(200) COMMENT '交换机名称',
    `routing_key` VARCHAR(200) COMMENT '路由键',
    `queue_config` JSON COMMENT '队列配置',
    `consumer_count` INT DEFAULT 1 COMMENT '消费者数量',
    `max_retry` INT DEFAULT 3 COMMENT '最大重试次数',
    `dead_letter_queue` VARCHAR(200) COMMENT '死信队列',
    `is_durable` TINYINT DEFAULT 1 COMMENT '是否持久化',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE INDEX `idx_queue_name` (`queue_name`),
    INDEX `idx_queue_type` (`queue_type`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息队列配置表';

-- 消息记录表
CREATE TABLE IF NOT EXISTS `message_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
    `message_id` VARCHAR(100) UNIQUE COMMENT '消息唯一ID',
    `queue_id` BIGINT NOT NULL COMMENT '队列ID',
    `message_type` VARCHAR(100) COMMENT '消息类型',
    `message_topic` VARCHAR(200) COMMENT '消息主题',
    `message_content` MEDIUMTEXT COMMENT '消息内容',
    `message_headers` JSON COMMENT '消息头',
    `send_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    `consume_time` DATETIME COMMENT '消费时间',
    `retry_count` INT DEFAULT 0 COMMENT '重试次数',
    `message_status` TINYINT COMMENT '消息状态(1-待发送 2-已发送 3-已消费 4-消费失败 5-死信)',
    `error_message` TEXT COMMENT '错误信息',
    `sender_id` BIGINT COMMENT '发送者ID',
    `consumer_id` VARCHAR(100) COMMENT '消费者ID',
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_queue_id` (`queue_id`),
    INDEX `idx_message_type` (`message_type`),
    INDEX `idx_send_time` (`send_time`),
    INDEX `idx_message_status` (`message_status`),
    FOREIGN KEY (`queue_id`) REFERENCES `message_queue_config`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息记录表';

-- =================
-- 数据同步模块
-- =================

-- 数据源配置表
CREATE TABLE IF NOT EXISTS `data_source_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '数据源ID',
    `source_name` VARCHAR(200) NOT NULL COMMENT '数据源名称',
    `source_type` VARCHAR(50) COMMENT '数据源类型(mysql,oracle,sqlserver,mongodb,redis)',
    `connection_url` VARCHAR(500) COMMENT '连接地址',
    `username` VARCHAR(100) COMMENT '用户名',
    `password` VARCHAR(200) COMMENT '密码(加密)',
    `database_name` VARCHAR(100) COMMENT '数据库名',
    `connection_config` JSON COMMENT '连接配置',
    `pool_size` INT DEFAULT 10 COMMENT '连接池大小',
    `timeout` INT DEFAULT 30000 COMMENT '超时时间',
    `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
    `test_query` VARCHAR(200) COMMENT '测试查询SQL',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_source_name` (`source_name`),
    INDEX `idx_source_type` (`source_type`),
    INDEX `idx_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据源配置表';

-- 数据同步任务表
CREATE TABLE IF NOT EXISTS `data_sync_task` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
    `task_code` VARCHAR(100) UNIQUE COMMENT '任务编码',
    `source_id` BIGINT NOT NULL COMMENT '源数据库ID',
    `target_id` BIGINT NOT NULL COMMENT '目标数据库ID',
    `sync_type` TINYINT COMMENT '同步类型(1-全量 2-增量 3-实时)',
    `sync_mode` TINYINT COMMENT '同步模式(1-INSERT 2-UPDATE 3-UPSERT 4-DELETE)',
    `source_query` TEXT COMMENT '源查询SQL',
    `target_table` VARCHAR(200) COMMENT '目标表名',
    `field_mapping` JSON COMMENT '字段映射',
    `filter_condition` TEXT COMMENT '过滤条件',
    `batch_size` INT DEFAULT 1000 COMMENT '批处理大小',
    `schedule_expression` VARCHAR(100) COMMENT '调度表达式',
    `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_task_code` (`task_code`),
    INDEX `idx_source_id` (`source_id`),
    INDEX `idx_target_id` (`target_id`),
    INDEX `idx_is_enabled` (`is_enabled`),
    FOREIGN KEY (`source_id`) REFERENCES `data_source_config`(`id`),
    FOREIGN KEY (`target_id`) REFERENCES `data_source_config`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据同步任务表';

-- 数据同步执行记录表
CREATE TABLE IF NOT EXISTS `data_sync_execution` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '执行ID',
    `task_id` BIGINT NOT NULL COMMENT '任务ID',
    `execution_id` VARCHAR(100) UNIQUE COMMENT '执行批次号',
    `start_time` DATETIME COMMENT '开始时间',
    `end_time` DATETIME COMMENT '结束时间',
    `execution_status` TINYINT COMMENT '执行状态(1-运行中 2-成功 3-失败 4-部分失败)',
    `total_records` INT DEFAULT 0 COMMENT '总记录数',
    `success_records` INT DEFAULT 0 COMMENT '成功记录数',
    `failed_records` INT DEFAULT 0 COMMENT '失败记录数',
    `error_message` TEXT COMMENT '错误信息',
    `execution_log` MEDIUMTEXT COMMENT '执行日志',
    INDEX `idx_task_id` (`task_id`),
    INDEX `idx_execution_id` (`execution_id`),
    INDEX `idx_start_time` (`start_time`),
    INDEX `idx_execution_status` (`execution_status`),
    FOREIGN KEY (`task_id`) REFERENCES `data_sync_task`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据同步执行记录表';

-- =================
-- 文件集成模块
-- =================

-- 文件存储配置表
CREATE TABLE IF NOT EXISTS `file_storage_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '存储配置ID',
    `storage_name` VARCHAR(200) NOT NULL COMMENT '存储名称',
    `storage_type` VARCHAR(50) COMMENT '存储类型(local,aliyun,tencent,aws)',
    `access_key` VARCHAR(200) COMMENT '访问密钥',
    `secret_key` VARCHAR(200) COMMENT '密钥(加密)',
    `region` VARCHAR(100) COMMENT '区域',
    `bucket_name` VARCHAR(200) COMMENT '存储桶名称',
    `base_url` VARCHAR(500) COMMENT '基础访问地址',
    `storage_config` JSON COMMENT '存储配置',
    `is_default` TINYINT DEFAULT 0 COMMENT '是否默认存储',
    `is_enabled` TINYINT DEFAULT 1 COMMENT '是否启用',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_storage_name` (`storage_name`),
    INDEX `idx_storage_type` (`storage_type`),
    INDEX `idx_is_default` (`is_default`),
    INDEX `idx_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件存储配置表';

-- 文件记录表
CREATE TABLE IF NOT EXISTS `file_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '文件ID',
    `file_name` VARCHAR(500) NOT NULL COMMENT '文件名称',
    `original_name` VARCHAR(500) COMMENT '原始文件名',
    `file_path` VARCHAR(1000) COMMENT '文件路径',
    `file_url` VARCHAR(1000) COMMENT '访问地址',
    `file_size` BIGINT COMMENT '文件大小(字节)',
    `file_type` VARCHAR(100) COMMENT '文件类型',
    `mime_type` VARCHAR(200) COMMENT 'MIME类型',
    `file_md5` VARCHAR(100) COMMENT '文件MD5',
    `storage_id` BIGINT COMMENT '存储配置ID',
    `business_type` VARCHAR(100) COMMENT '业务类型',
    `business_id` VARCHAR(100) COMMENT '业务ID',
    `upload_status` TINYINT DEFAULT 1 COMMENT '上传状态(1-上传中 2-成功 3-失败)',
    `is_public` TINYINT DEFAULT 0 COMMENT '是否公开',
    `expire_time` DATETIME COMMENT '过期时间',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `created_by` BIGINT COMMENT '创建人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_file_name` (`file_name`),
    INDEX `idx_file_md5` (`file_md5`),
    INDEX `idx_storage_id` (`storage_id`),
    INDEX `idx_business` (`business_type`, `business_id`),
    INDEX `idx_upload_status` (`upload_status`),
    FOREIGN KEY (`storage_id`) REFERENCES `file_storage_config`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件记录表';