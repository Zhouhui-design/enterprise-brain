-- 移动端模块数据库表结构
-- 创建时间：2024-11-27
-- 版本：V1.5.0

-- =================
-- 移动设备管理模块
-- =================

-- 移动设备信息表
CREATE TABLE IF NOT EXISTS `mobile_device` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '设备ID',
    `device_id` VARCHAR(200) UNIQUE COMMENT '设备唯一标识',
    `user_id` BIGINT COMMENT '用户ID',
    `device_name` VARCHAR(200) COMMENT '设备名称',
    `device_type` VARCHAR(50) COMMENT '设备类型(android,ios,web)',
    `device_model` VARCHAR(200) COMMENT '设备型号',
    `os_version` VARCHAR(50) COMMENT '操作系统版本',
    `app_version` VARCHAR(50) COMMENT 'APP版本',
    `device_token` VARCHAR(500) COMMENT '推送令牌',
    `last_login_ip` VARCHAR(50) COMMENT '最后登录IP',
    `last_login_time` DATETIME COMMENT '最后登录时间',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
    `is_online` TINYINT DEFAULT 0 COMMENT '是否在线',
    `registration_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_device_id` (`device_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_device_type` (`device_type`),
    INDEX `idx_is_active` (`is_active`),
    INDEX `idx_last_login_time` (`last_login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='移动设备信息表';

-- 设备权限表
CREATE TABLE IF NOT EXISTS `device_permission` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '权限ID',
    `device_id` BIGINT NOT NULL COMMENT '设备ID',
    `permission_type` VARCHAR(100) NOT NULL COMMENT '权限类型',
    `permission_value` TINYINT DEFAULT 0 COMMENT '权限值(0-拒绝 1-允许)',
    `granted_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '授权时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `granted_by` BIGINT COMMENT '授权人',
    UNIQUE KEY `uk_device_permission` (`device_id`, `permission_type`),
    INDEX `idx_permission_type` (`permission_type`),
    FOREIGN KEY (`device_id`) REFERENCES `mobile_device`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='设备权限表';

-- =================
-- 移动端考勤模块
-- =================

-- 考勤规则配置表
CREATE TABLE IF NOT EXISTS `attendance_rule` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '规则ID',
    `rule_name` VARCHAR(200) NOT NULL COMMENT '规则名称',
    `rule_code` VARCHAR(100) UNIQUE COMMENT '规则编码',
    `work_start_time` TIME COMMENT '上班时间',
    `work_end_time` TIME COMMENT '下班时间',
    `late_threshold` INT DEFAULT 15 COMMENT '迟到阈值(分钟)',
    `early_leave_threshold` INT DEFAULT 15 COMMENT '早退阈值(分钟)',
    `location_based` TINYINT DEFAULT 0 COMMENT '是否基于位置',
    `allowed_locations` JSON COMMENT '允许的位置坐标',
    `location_radius` INT DEFAULT 100 COMMENT '位置范围(米)',
    `flexible_time` TINYINT DEFAULT 0 COMMENT '是否弹性工作时间',
    `overtime_enabled` TINYINT DEFAULT 1 COMMENT '是否允许加班',
    `weekend_work` TINYINT DEFAULT 0 COMMENT '是否允许周末工作',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_rule_code` (`rule_code`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤规则配置表';

-- 考勤记录表
CREATE TABLE IF NOT EXISTS `attendance_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '考勤记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `device_id` BIGINT COMMENT '设备ID',
    `attendance_date` DATE NOT NULL COMMENT '考勤日期',
    `check_in_time` DATETIME COMMENT '签到时间',
    `check_out_time` DATETIME COMMENT '签退时间',
    `check_in_location` VARCHAR(200) COMMENT '签到位置',
    `check_out_location` VARCHAR(200) COMMENT '签退位置',
    `check_in_latitude` DECIMAL(10,7) COMMENT '签到纬度',
    `check_in_longitude` DECIMAL(10,7) COMMENT '签到经度',
    `check_out_latitude` DECIMAL(10,7) COMMENT '签退纬度',
    `check_out_longitude` DECIMAL(10,7) COMMENT '签退经度',
    `work_hours` DECIMAL(5,2) COMMENT '工作时长(小时)',
    `overtime_hours` DECIMAL(5,2) DEFAULT 0 COMMENT '加班时长(小时)',
    `late_minutes` INT DEFAULT 0 COMMENT '迟到时长(分钟)',
    `early_leave_minutes` INT DEFAULT 0 COMMENT '早退时长(分钟)',
    `attendance_status` TINYINT COMMENT '考勤状态(1-正常 2-迟到 3-早退 4-旷工 5-请假)',
    `remarks` VARCHAR(500) COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY `uk_user_date` (`user_id`, `attendance_date`),
    INDEX `idx_device_id` (`device_id`),
    INDEX `idx_attendance_date` (`attendance_date`),
    INDEX `idx_attendance_status` (`attendance_status`),
    FOREIGN KEY (`device_id`) REFERENCES `mobile_device`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='考勤记录表';

-- 请假申请表
CREATE TABLE IF NOT EXISTS `leave_application` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '申请ID',
    `user_id` BIGINT NOT NULL COMMENT '申请人ID',
    `leave_type` TINYINT NOT NULL COMMENT '请假类型(1-事假 2-病假 3-年假 4-调休 5-其他)',
    `start_date` DATE NOT NULL COMMENT '开始日期',
    `end_date` DATE NOT NULL COMMENT '结束日期',
    `leave_days` DECIMAL(3,1) NOT NULL COMMENT '请假天数',
    `reason` TEXT COMMENT '请假原因',
    `attachment_url` VARCHAR(500) COMMENT '附件地址',
    `application_status` TINYINT DEFAULT 1 COMMENT '申请状态(1-待审批 2-已通过 3-已拒绝 4-已撤销)',
    `approver_id` BIGINT COMMENT '审批人ID',
    `approve_time` DATETIME COMMENT '审批时间',
    `approve_remarks` VARCHAR(500) COMMENT '审批备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_leave_type` (`leave_type`),
    INDEX `idx_start_date` (`start_date`),
    INDEX `idx_application_status` (`application_status`),
    INDEX `idx_approver_id` (`approver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='请假申请表';

-- =================
-- 移动端库存管理模块
-- =================

-- 库存盘点任务表
CREATE TABLE IF NOT EXISTS `inventory_count_task` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '盘点任务ID',
    `task_no` VARCHAR(100) UNIQUE NOT NULL COMMENT '任务编号',
    `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
    `warehouse_id` BIGINT NOT NULL COMMENT '仓库ID',
    `count_type` TINYINT COMMENT '盘点类型(1-全盘 2-循环盘点 3-抽样盘点)',
    `planned_start_date` DATE COMMENT '计划开始日期',
    `planned_end_date` DATE COMMENT '计划结束日期',
    `actual_start_date` DATE COMMENT '实际开始日期',
    `actual_end_date` DATE COMMENT '实际结束日期',
    `task_status` TINYINT DEFAULT 1 COMMENT '任务状态(1-待开始 2-进行中 3-已完成 4-已取消)',
    `assigned_users` JSON COMMENT '分配的盘点人员',
    `count_rules` JSON COMMENT '盘点规则配置',
    `remarks` TEXT COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_task_no` (`task_no`),
    INDEX `idx_warehouse_id` (`warehouse_id`),
    INDEX `idx_task_status` (`task_status`),
    INDEX `idx_planned_start_date` (`planned_start_date`),
    FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存盘点任务表';

-- 库存盘点记录表
CREATE TABLE IF NOT EXISTS `inventory_count_record` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '盘点记录ID',
    `task_id` BIGINT NOT NULL COMMENT '盘点任务ID',
    `product_id` BIGINT NOT NULL COMMENT '产品ID',
    `location` VARCHAR(200) COMMENT '盘点位置',
    `system_quantity` DECIMAL(15,4) COMMENT '系统数量',
    `actual_quantity` DECIMAL(15,4) COMMENT '实盘数量',
    `difference_quantity` DECIMAL(15,4) COMMENT '差异数量',
    `count_status` TINYINT COMMENT '盘点状态(1-待盘点 2-已盘点 3-有差异 4-已确认)',
    `counter_id` BIGINT COMMENT '盘点人ID',
    `count_time` DATETIME COMMENT '盘点时间',
    `device_id` BIGINT COMMENT '盘点设备ID',
    `gps_location` VARCHAR(200) COMMENT 'GPS位置',
    `photo_urls` JSON COMMENT '盘点照片',
    `remarks` VARCHAR(500) COMMENT '备注',
    `verified_by` BIGINT COMMENT '确认人ID',
    `verify_time` DATETIME COMMENT '确认时间',
    INDEX `idx_task_id` (`task_id`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_count_status` (`count_status`),
    INDEX `idx_counter_id` (`counter_id`),
    INDEX `idx_count_time` (`count_time`),
    FOREIGN KEY (`task_id`) REFERENCES `inventory_count_task`(`id`),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
    FOREIGN KEY (`device_id`) REFERENCES `mobile_device`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存盘点记录表';

-- =================
-- 移动端生产管理模块
-- =================

-- 生产任务表
CREATE TABLE IF NOT EXISTS `production_task` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '生产任务ID',
    `task_no` VARCHAR(100) UNIQUE NOT NULL COMMENT '任务编号',
    `task_name` VARCHAR(200) NOT NULL COMMENT '任务名称',
    `product_id` BIGINT NOT NULL COMMENT '产品ID',
    `order_id` BIGINT COMMENT '订单ID',
    `planned_quantity` DECIMAL(15,4) NOT NULL COMMENT '计划数量',
    `completed_quantity` DECIMAL(15,4) DEFAULT 0 COMMENT '完成数量',
    `quality_quantity` DECIMAL(15,4) DEFAULT 0 COMMENT '合格数量',
    `defect_quantity` DECIMAL(15,4) DEFAULT 0 COMMENT '不良数量',
    `planned_start_date` DATE COMMENT '计划开始日期',
    `planned_end_date` DATE COMMENT '计划结束日期',
    `actual_start_date` DATE COMMENT '实际开始日期',
    `actual_end_date` DATE COMMENT '实际结束日期',
    `task_status` TINYINT DEFAULT 1 COMMENT '任务状态(1-待开始 2-进行中 3-已完成 4-已暂停 5-已取消)',
    `priority` TINYINT DEFAULT 3 COMMENT '优先级(1-紧急 2-高 3-中 4-低)',
    `assigned_workers` JSON COMMENT '分配的工人',
    `work_center` VARCHAR(100) COMMENT '工作中心',
    `equipment` VARCHAR(200) COMMENT '使用设备',
    `process_route` JSON COMMENT '工艺路线',
    `remarks` TEXT COMMENT '备注',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_task_no` (`task_no`),
    INDEX `idx_product_id` (`product_id`),
    INDEX `idx_order_id` (`order_id`),
    INDEX `idx_task_status` (`task_status`),
    INDEX `idx_planned_start_date` (`planned_start_date`),
    FOREIGN KEY (`product_id`) REFERENCES `product`(`id`),
    FOREIGN KEY (`order_id`) REFERENCES `sales_order`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产任务表';

-- 生产进度报告表
CREATE TABLE IF NOT EXISTS `production_progress` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '进度报告ID',
    `task_id` BIGINT NOT NULL COMMENT '生产任务ID',
    `reporter_id` BIGINT NOT NULL COMMENT '报告人ID',
    `device_id` BIGINT COMMENT '设备ID',
    `report_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '报告时间',
    `completed_quantity` DECIMAL(15,4) COMMENT '完成数量',
    `quality_quantity` DECIMAL(15,4) COMMENT '合格数量',
    `defect_quantity` DECIMAL(15,4) COMMENT '不良数量',
    `defect_types` JSON COMMENT '不良类型统计',
    `work_hours` DECIMAL(5,2) COMMENT '工时',
    `efficiency` DECIMAL(5,2) COMMENT '效率(%)',
    `equipment_status` TINYINT COMMENT '设备状态(1-正常 2-故障 3-维护)',
    `material_consumption` JSON COMMENT '物料消耗',
    `quality_issues` TEXT COMMENT '质量问题',
    `suggestions` TEXT COMMENT '改进建议',
    `photo_urls` JSON COMMENT '现场照片',
    `gps_location` VARCHAR(200) COMMENT 'GPS位置',
    INDEX `idx_task_id` (`task_id`),
    INDEX `idx_reporter_id` (`reporter_id`),
    INDEX `idx_device_id` (`device_id`),
    INDEX `idx_report_time` (`report_time`),
    FOREIGN KEY (`task_id`) REFERENCES `production_task`(`id`),
    FOREIGN KEY (`device_id`) REFERENCES `mobile_device`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='生产进度报告表';

-- =================
-- 推送通知模块
-- =================

-- 推送消息模板表
CREATE TABLE IF NOT EXISTS `push_template` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '模板ID',
    `template_name` VARCHAR(200) NOT NULL COMMENT '模板名称',
    `template_code` VARCHAR(100) UNIQUE COMMENT '模板编码',
    `message_type` TINYINT COMMENT '消息类型(1-文本 2-图片 3-链接 4-富文本)',
    `title_template` VARCHAR(500) COMMENT '标题模板',
    `content_template` TEXT COMMENT '内容模板',
    `action_type` VARCHAR(50) COMMENT '动作类型(open_app,open_url,open_page)',
    `action_params` JSON COMMENT '动作参数',
    `is_active` TINYINT DEFAULT 1 COMMENT '是否激活',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` BIGINT COMMENT '创建人',
    `updated_by` BIGINT COMMENT '更新人',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_template_code` (`template_code`),
    INDEX `idx_message_type` (`message_type`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推送消息模板表';

-- 推送消息记录表
CREATE TABLE IF NOT EXISTS `push_message` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '消息ID',
    `message_id` VARCHAR(100) UNIQUE COMMENT '消息唯一标识',
    `template_id` BIGINT COMMENT '模板ID',
    `target_type` TINYINT COMMENT '推送目标类型(1-单用户 2-用户组 3-全部用户)',
    `target_users` JSON COMMENT '目标用户列表',
    `message_title` VARCHAR(500) COMMENT '消息标题',
    `message_content` TEXT COMMENT '消息内容',
    `message_data` JSON COMMENT '消息数据',
    `send_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    `scheduled_time` DATETIME COMMENT '预定发送时间',
    `send_status` TINYINT COMMENT '发送状态(1-待发送 2-发送中 3-发送成功 4-发送失败)',
    `total_count` INT DEFAULT 0 COMMENT '目标用户总数',
    `success_count` INT DEFAULT 0 COMMENT '发送成功数',
    `failed_count` INT DEFAULT 0 COMMENT '发送失败数',
    `click_count` INT DEFAULT 0 COMMENT '点击数',
    `error_message` TEXT COMMENT '错误信息',
    `created_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `created_by` BIGINT COMMENT '创建人',
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_template_id` (`template_id`),
    INDEX `idx_send_time` (`send_time`),
    INDEX `idx_send_status` (`send_status`),
    FOREIGN KEY (`template_id`) REFERENCES `push_template`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='推送消息记录表';