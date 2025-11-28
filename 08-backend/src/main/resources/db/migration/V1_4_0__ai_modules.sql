-- AI智能模块数据库表结构
-- 创建时间：2024-11-27
-- 版本：V1.4.0

-- =================
-- AI模型管理模块
-- =================

-- AI模型配置表
CREATE TABLE IF NOT EXISTS `ai_model_config` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '模型ID',
    `model_name` VARCHAR(200) NOT NULL COMMENT '模型名称',
    `model_code` VARCHAR(100) UNIQUE COMMENT '模型编码',
    `model_type` VARCHAR(50) COMMENT '模型类型(nlp,cv,recommendation,prediction)',
    `model_framework` VARCHAR(50) COMMENT '框架类型(tensorflow,pytorch,sklearn)',
    `model_version` VARCHAR(50) COMMENT '模型版本',
    `model_path` VARCHAR(500) COMMENT '模型文件路径',
    `model_config` JSON COMMENT '模型配置参数',
    `input_schema` JSON COMMENT '输入数据结构',
    `output_schema` JSON COMMENT '输出数据结构',
    `preprocessing` JSON COMMENT '预处理配置',
    `postprocessing` JSON COMMENT '后处理配置',
    `performance_metrics` JSON COMMENT '性能指标',
    `training_data` VARCHAR(500) COMMENT '训练数据路径',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
    `deployment_status` TINYINT COMMENT '部署状态(1-未部署 2-部署中 3-已部署 4-部署失败)',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_model_code` (`model_code`),
    INDEX `idx_model_type` (`model_type`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_deployment_status` (`deployment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型配置表';

-- AI模型训练记录表
CREATE TABLE IF NOT EXISTS `ai_training_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '训练记录ID',
    `model_id` BIGINT NOT NULL COMMENT '模型ID',
    `training_id` VARCHAR(100) UNIQUE COMMENT '训练批次ID',
    `training_type` TINYINT COMMENT '训练类型(1-初始训练 2-增量训练 3-迁移学习)',
    `dataset_path` VARCHAR(500) COMMENT '数据集路径',
    `training_config` JSON COMMENT '训练配置',
    `hyperparameters` JSON COMMENT '超参数配置',
    `start_time` DATETIME COMMENT '开始时间',
    `end_time` DATETIME COMMENT '结束时间',
    `training_status` TINYINT COMMENT '训练状态(1-待开始 2-训练中 3-成功 4-失败 5-中断)',
    `epochs` INT COMMENT '训练轮数',
    `batch_size` INT COMMENT '批次大小',
    `learning_rate` DECIMAL(10,8) COMMENT '学习率',
    `training_loss` DECIMAL(15,8) COMMENT '训练损失',
    `validation_loss` DECIMAL(15,8) COMMENT '验证损失',
    `accuracy` DECIMAL(8,6) COMMENT '准确率',
    `model_size` BIGINT COMMENT '模型大小(字节)',
    `training_log` MEDIUMTEXT COMMENT '训练日志',
    `error_message` TEXT COMMENT '错误信息',
    `trained_by` BIGINT COMMENT '训练发起人',
    INDEX `idx_model_id` (`model_id`),
    INDEX `idx_training_id` (`training_id`),
    INDEX `idx_start_time` (`start_time`),
    INDEX `idx_training_status` (`training_status`),
    FOREIGN KEY (`model_id`) REFERENCES `ai_model_config`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI模型训练记录表';

-- AI推理服务表
CREATE TABLE IF NOT EXISTS `ai_inference_service` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '服务ID',
    `service_name` VARCHAR(200) NOT NULL COMMENT '服务名称',
    `service_code` VARCHAR(100) UNIQUE COMMENT '服务编码',
    `model_id` BIGINT NOT NULL COMMENT '模型ID',
    `service_url` VARCHAR(500) COMMENT '服务地址',
    `service_port` INT COMMENT '服务端口',
    `max_concurrent` INT DEFAULT 10 COMMENT '最大并发数',
    `timeout` INT DEFAULT 30000 COMMENT '超时时间(毫秒)',
    `load_balancer` VARCHAR(50) COMMENT '负载均衡策略',
    `health_check_url` VARCHAR(200) COMMENT '健康检查地址',
    `service_status` TINYINT COMMENT '服务状态(1-停止 2-启动中 3-运行中 4-异常)',
    `resource_limit` JSON COMMENT '资源限制配置',
    `monitoring_config` JSON COMMENT '监控配置',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_service_code` (`service_code`),
    INDEX `idx_model_id` (`model_id`),
    INDEX `idx_service_status` (`service_status`),
    FOREIGN KEY (`model_id`) REFERENCES `ai_model_config`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI推理服务表';

-- AI推理调用记录表
CREATE TABLE IF NOT EXISTS `ai_inference_log` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '调用记录ID',
    `service_id` BIGINT NOT NULL COMMENT '服务ID',
    `request_id` VARCHAR(100) UNIQUE COMMENT '请求ID',
    `input_data` JSON COMMENT '输入数据',
    `output_data` JSON COMMENT '输出结果',
    `confidence_score` DECIMAL(5,4) COMMENT '置信度',
    `inference_time` INT COMMENT '推理耗时(毫秒)',
    `request_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '请求时间',
    `response_time` DATETIME COMMENT '响应时间',
    `status` TINYINT COMMENT '状态(1-成功 2-失败 3-超时)',
    `error_code` VARCHAR(50) COMMENT '错误码',
    `error_message` TEXT COMMENT '错误信息',
    `caller_ip` VARCHAR(50) COMMENT '调用者IP',
    `caller_id` BIGINT COMMENT '调用者ID',
    `business_type` VARCHAR(100) COMMENT '业务类型',
    `business_id` VARCHAR(100) COMMENT '业务ID',
    INDEX `idx_service_id` (`service_id`),
    INDEX `idx_request_id` (`request_id`),
    INDEX `idx_request_time` (`request_time`),
    INDEX `idx_status` (`status`),
    INDEX `idx_business` (`business_type`, `business_id`),
    FOREIGN KEY (`service_id`) REFERENCES `ai_inference_service`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI推理调用记录表';

-- =================
-- 自然语言处理模块
-- =================

-- 文本处理任务表
CREATE TABLE IF NOT EXISTS `nlp_task` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
    `task_type` VARCHAR(50) COMMENT '任务类型(sentiment,classification,ner,summarization)',
    `input_text` MEDIUMTEXT COMMENT '输入文本',
    `processed_text` MEDIUMTEXT COMMENT '处理后文本',
    `result_data` JSON COMMENT '处理结果',
    `confidence_score` DECIMAL(5,4) COMMENT '置信度',
    `processing_time` INT COMMENT '处理时间(毫秒)',
    `task_status` TINYINT COMMENT '任务状态(1-待处理 2-处理中 3-成功 4-失败)',
    `error_message` TEXT COMMENT '错误信息',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    INDEX `idx_task_type` (`task_type`),
    INDEX `idx_task_status` (`task_status`),
    INDEX `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文本处理任务表';

-- 知识图谱实体表
CREATE TABLE IF NOT EXISTS `knowledge_entity` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '实体ID',
    `entity_name` VARCHAR(200) NOT NULL COMMENT '实体名称',
    `entity_type` VARCHAR(100) COMMENT '实体类型',
    `entity_attributes` JSON COMMENT '实体属性',
    `description` TEXT COMMENT '描述',
    `source` VARCHAR(100) COMMENT '数据来源',
    `confidence` DECIMAL(5,4) COMMENT '置信度',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_entity_name` (`entity_name`),
    INDEX `idx_entity_type` (`entity_type`),
    INDEX `idx_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识图谱实体表';

-- 知识图谱关系表
CREATE TABLE IF NOT EXISTS `knowledge_relation` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关系ID',
    `source_entity_id` BIGINT NOT NULL COMMENT '源实体ID',
    `target_entity_id` BIGINT NOT NULL COMMENT '目标实体ID',
    `relation_type` VARCHAR(100) NOT NULL COMMENT '关系类型',
    `relation_weight` DECIMAL(5,4) DEFAULT 1.0 COMMENT '关系权重',
    `relation_attributes` JSON COMMENT '关系属性',
    `confidence` DECIMAL(5,4) COMMENT '置信度',
    `source` VARCHAR(100) COMMENT '数据来源',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_source_entity` (`source_entity_id`),
    INDEX `idx_target_entity` (`target_entity_id`),
    INDEX `idx_relation_type` (`relation_type`),
    FOREIGN KEY (`source_entity_id`) REFERENCES `knowledge_entity`(`id`),
    FOREIGN KEY (`target_entity_id`) REFERENCES `knowledge_entity`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识图谱关系表';

-- =================
-- 计算机视觉模块
-- =================

-- 图像处理任务表
CREATE TABLE IF NOT EXISTS `cv_task` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
    `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
    `task_type` VARCHAR(50) COMMENT '任务类型(classification,detection,segmentation,ocr)',
    `image_url` VARCHAR(1000) COMMENT '图像地址',
    `image_metadata` JSON COMMENT '图像元数据',
    `processing_config` JSON COMMENT '处理配置',
    `result_data` JSON COMMENT '处理结果',
    `confidence_score` DECIMAL(5,4) COMMENT '置信度',
    `processing_time` INT COMMENT '处理时间(毫秒)',
    `task_status` TINYINT COMMENT '任务状态(1-待处理 2-处理中 3-成功 4-失败)',
    `error_message` TEXT COMMENT '错误信息',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    INDEX `idx_task_type` (`task_type`),
    INDEX `idx_task_status` (`task_status`),
    INDEX `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图像处理任务表';

-- =================
-- 智能对话模块
-- =================

-- 对话会话表
CREATE TABLE IF NOT EXISTS `chat_session` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '会话ID',
    `session_id` VARCHAR(100) UNIQUE COMMENT '会话唯一标识',
    `user_id` BIGINT COMMENT '用户ID',
    `session_name` VARCHAR(200) COMMENT '会话名称',
    `session_type` VARCHAR(50) COMMENT '会话类型(customer_service,assistant,qa)',
    `context_data` JSON COMMENT '上下文数据',
    `session_status` TINYINT DEFAULT 1 COMMENT '会话状态(1-活跃 2-暂停 3-结束)',
    `start_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
    `end_time` DATETIME COMMENT '结束时间',
    `last_message_time` DATETIME COMMENT '最后消息时间',
    `message_count` INT DEFAULT 0 COMMENT '消息数量',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_session_type` (`session_type`),
    INDEX `idx_session_status` (`session_status`),
    INDEX `idx_start_time` (`start_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话会话表';

-- 对话消息表
CREATE TABLE IF NOT EXISTS `chat_message` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
    `session_id` BIGINT NOT NULL COMMENT '会话ID',
    `message_id` VARCHAR(100) UNIQUE COMMENT '消息唯一标识',
    `sender_type` TINYINT COMMENT '发送者类型(1-用户 2-AI 3-系统)',
    `sender_id` BIGINT COMMENT '发送者ID',
    `message_type` VARCHAR(50) COMMENT '消息类型(text,image,file,audio)',
    `message_content` MEDIUMTEXT COMMENT '消息内容',
    `message_metadata` JSON COMMENT '消息元数据',
    `reply_to_id` BIGINT COMMENT '回复的消息ID',
    `is_system` TINYINT DEFAULT 0 COMMENT '是否系统消息',
    `send_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    `read_time` DATETIME COMMENT '已读时间',
    `is_deleted` TINYINT DEFAULT 0 COMMENT '是否删除',
    INDEX `idx_session_id` (`session_id`),
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_sender` (`sender_type`, `sender_id`),
    INDEX `idx_send_time` (`send_time`),
    FOREIGN KEY (`session_id`) REFERENCES `chat_session`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话消息表';