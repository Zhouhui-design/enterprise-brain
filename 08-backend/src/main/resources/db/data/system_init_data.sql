-- 系统初始化数据
-- 包含系统启动所需的基础配置和数据
-- 创建时间：2024-11-27

-- =================
-- 系统配置数据
-- =================

-- 插入系统基础配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
-- 系统基础配置
('system.name', 'Enterprise Brain', '系统名称', '企业级智能管理系统名称', 'system', 1, 1, NOW()),
('system.version', '1.0.0', '系统版本', '当前系统版本号', 'system', 1, 1, NOW()),
('system.logo', '/assets/images/logo.png', '系统Logo', '系统Logo图片路径', 'system', 1, 1, NOW()),
('system.title', '企业大脑管理系统', '系统标题', '系统页面标题', 'system', 1, 1, NOW()),
('system.copyright', 'Copyright © 2024 Enterprise Brain Team', '版权信息', '系统版权声明', 'system', 1, 1, NOW()),

-- 安全配置
('security.session.timeout', '1800', '会话超时时间', '用户会话超时时间(秒)', 'security', 1, 1, NOW()),
('security.password.min_length', '8', '密码最小长度', '用户密码最小长度要求', 'security', 1, 1, NOW()),
('security.password.complexity', 'true', '密码复杂度检查', '是否启用密码复杂度检查', 'security', 1, 1, NOW()),
('security.login.max_attempts', '5', '最大登录尝试次数', '用户最大连续登录失败次数', 'security', 1, 1, NOW()),
('security.login.lockout_duration', '1800', '账户锁定时长', '账户被锁定的时长(秒)', 'security', 1, 1, NOW()),

-- 文件上传配置
('upload.max_file_size', '10485760', '最大文件大小', '单个文件最大上传大小(字节)', 'upload', 1, 1, NOW()),
('upload.allowed_types', '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx', '允许的文件类型', '允许上传的文件扩展名', 'upload', 1, 1, NOW()),
('upload.path', '/uploads', '上传路径', '文件上传保存路径', 'upload', 1, 1, NOW()),

-- 邮件配置
('mail.smtp.host', 'smtp.163.com', 'SMTP服务器', '邮件SMTP服务器地址', 'mail', 1, 1, NOW()),
('mail.smtp.port', '587', 'SMTP端口', '邮件SMTP服务器端口', 'mail', 1, 1, NOW()),
('mail.smtp.username', '', 'SMTP用户名', '邮件服务器用户名', 'mail', 1, 1, NOW()),
('mail.smtp.password', '', 'SMTP密码', '邮件服务器密码', 'mail', 1, 1, NOW()),
('mail.from', 'noreply@enterprise.com', '发件人地址', '系统邮件发件人地址', 'mail', 1, 1, NOW()),

-- 缓存配置
('cache.redis.enabled', 'true', '启用Redis缓存', '是否启用Redis缓存', 'cache', 1, 1, NOW()),
('cache.default.ttl', '3600', '默认缓存TTL', '默认缓存过期时间(秒)', 'cache', 1, 1, NOW()),

-- API配置
('api.rate_limit.enabled', 'true', '启用API限流', '是否启用API请求限流', 'api', 1, 1, NOW()),
('api.rate_limit.requests_per_minute', '100', 'API每分钟请求限制', '每分钟最大API请求次数', 'api', 1, 1, NOW()),
('api.documentation.enabled', 'true', '启用API文档', '是否启用Swagger API文档', 'api', 1, 1, NOW());

-- =================
-- 用户初始化数据
-- =================

-- 插入默认管理员用户（密码：admin123）
INSERT IGNORE INTO `users` (`username`, `password`, `email`, `phone`, `status`, `created_time`) VALUES
('admin', '$2a$10$8eZpnCZqZgOKgHYv1k4A0eZT5L5Y8gYgYhYhYhYhYhYhYhYhYhYhYh', 'admin@enterprise.com', '13800000000', 1, NOW()),
('system', '$2a$10$8eZpnCZqZgOKgHYv1k4A0eZT5L5Y8gYgYhYhYhYhYhYhYhYhYhYhYh', 'system@enterprise.com', '13800000001', 1, NOW());

-- =================
-- 仓库初始化数据
-- =================

-- 插入默认仓库
INSERT IGNORE INTO `warehouse` (`warehouse_code`, `warehouse_name`, `warehouse_type`, `address`, `manager`, `capacity`, `status`, `created_time`, `created_by`) VALUES
('WH001', '原料仓库', 1, '生产区A栋1楼', '张三', 1000.00, 1, NOW(), 1),
('WH002', '成品仓库', 2, '生产区B栋1楼', '李四', 2000.00, 1, NOW(), 1),
('WH003', '半成品仓库', 3, '生产区A栋2楼', '王五', 800.00, 1, NOW(), 1),
('WH004', '退货仓库', 2, '生产区C栋1楼', '赵六', 500.00, 1, NOW(), 1);

-- =================
-- 产品分类初始化数据
-- =================

-- 插入产品分类
INSERT IGNORE INTO `product_category` (`parent_id`, `category_name`, `category_code`, `category_desc`, `sort_order`, `is_enabled`, `created_time`, `created_by`) VALUES
-- 一级分类
(0, '原材料', 'RAW_MATERIAL', '生产所需的原材料', 1, 1, NOW(), 1),
(0, '半成品', 'SEMI_PRODUCT', '生产过程中的半成品', 2, 1, NOW(), 1),
(0, '成品', 'FINISHED_PRODUCT', '最终成品', 3, 1, NOW(), 1),
(0, '包装材料', 'PACKAGING', '产品包装所需材料', 4, 1, NOW(), 1);

-- 二级分类（原材料下）
INSERT IGNORE INTO `product_category` (`parent_id`, `category_name`, `category_code`, `category_desc`, `sort_order`, `is_enabled`, `created_time`, `created_by`) VALUES
(1, '金属材料', 'METAL', '各种金属原料', 1, 1, NOW(), 1),
(1, '塑料材料', 'PLASTIC', '各种塑料原料', 2, 1, NOW(), 1),
(1, '化工材料', 'CHEMICAL', '化工原料', 3, 1, NOW(), 1);

-- =================
-- 智能表格模板初始化数据
-- =================

-- 插入智能表格模板
INSERT IGNORE INTO `table_template` (`template_name`, `template_code`, `template_type`, `template_config`, `column_config`, `is_public`, `created_time`, `created_by`) VALUES
('销售订单模板', 'SALES_ORDER_TEMPLATE', 'business', 
 '{"title":"销售订单","editable":true,"exportable":true}',
 '[{"name":"订单号","key":"order_no","type":"text","required":true},{"name":"客户","key":"customer","type":"select","required":true},{"name":"产品","key":"product","type":"select","required":true},{"name":"数量","key":"quantity","type":"number","required":true},{"name":"单价","key":"price","type":"currency","required":true}]',
 1, NOW(), 1),
 
('库存统计模板', 'INVENTORY_TEMPLATE', 'report', 
 '{"title":"库存统计","readonly":true,"refreshInterval":300}',
 '[{"name":"产品编码","key":"product_code","type":"text"},{"name":"产品名称","key":"product_name","type":"text"},{"name":"库存数量","key":"quantity","type":"number"},{"name":"单位","key":"unit","type":"text"},{"name":"最后更新","key":"last_update","type":"datetime"}]',
 1, NOW(), 1),
 
('生产计划模板', 'PRODUCTION_PLAN_TEMPLATE', 'plan', 
 '{"title":"生产计划","editable":true,"workflow":true}',
 '[{"name":"计划编号","key":"plan_no","type":"text","required":true},{"name":"产品","key":"product","type":"select","required":true},{"name":"计划数量","key":"planned_qty","type":"number","required":true},{"name":"开始日期","key":"start_date","type":"date","required":true},{"name":"结束日期","key":"end_date","type":"date","required":true}]',
 1, NOW(), 1);

-- =================
-- 算法配置初始化数据
-- =================

-- 插入AI算法配置
INSERT IGNORE INTO `algorithm_config` (`algorithm_name`, `algorithm_code`, `algorithm_type`, `algorithm_class`, `input_params`, `output_params`, `version`, `is_enabled`, `created_time`, `created_by`) VALUES
('销售预测算法', 'SALES_PREDICTION', 'prediction', 'com.enterprise.brain.ai.SalesPredictionAlgorithm',
 '{"features":["historical_sales","season","promotion","market_trend"],"period":"monthly"}',
 '{"prediction_value":"number","confidence":"number","trend":"string"}',
 '1.0.0', 1, NOW(), 1),
 
('库存优化算法', 'INVENTORY_OPTIMIZATION', 'optimization', 'com.enterprise.brain.ai.InventoryOptimizationAlgorithm',
 '{"current_stock":"number","demand_forecast":"array","lead_time":"number","service_level":"number"}',
 '{"optimal_stock":"number","reorder_point":"number","order_quantity":"number"}',
 '1.0.0', 1, NOW(), 1),
 
('客户分类算法', 'CUSTOMER_CLASSIFICATION', 'classification', 'com.enterprise.brain.ai.CustomerClassificationAlgorithm',
 '{"purchase_amount":"number","purchase_frequency":"number","last_purchase_days":"number","return_rate":"number"}',
 '{"customer_level":"string","probability":"number","characteristics":"array"}',
 '1.0.0', 1, NOW(), 1);

-- =================
-- 推荐规则初始化数据
-- =================

-- 插入推荐规则
INSERT IGNORE INTO `recommendation_rule` (`rule_name`, `rule_code`, `rule_type`, `trigger_condition`, `recommendation_logic`, `priority`, `is_active`, `created_time`, `created_by`) VALUES
('关联产品推荐', 'RELATED_PRODUCT', 'product', 
 '{"trigger":"add_to_cart","min_amount":100}',
 'SELECT related_products FROM product_association WHERE base_product_id = ? ORDER BY correlation_score DESC LIMIT 5',
 1, 1, NOW(), 1),
 
('客户等级折扣推荐', 'CUSTOMER_DISCOUNT', 'price', 
 '{"trigger":"order_calculation","customer_level":["VIP","GOLD"]}',
 'SELECT discount_rate FROM customer_level_discount WHERE customer_level = ? AND product_category = ?',
 2, 1, NOW(), 1),
 
('库存预警推荐', 'INVENTORY_ALERT', 'inventory', 
 '{"trigger":"stock_check","threshold":10}',
 'SELECT reorder_suggestion FROM inventory_analysis WHERE current_stock < min_stock',
 3, 1, NOW(), 1);

-- =================
-- 考勤规则初始化数据
-- =================

-- 插入默认考勤规则
INSERT IGNORE INTO `attendance_rule` (`rule_name`, `rule_code`, `work_start_time`, `work_end_time`, `late_threshold`, `early_leave_threshold`, `location_based`, `allowed_locations`, `location_radius`, `flexible_time`, `overtime_enabled`, `weekend_work`, `is_active`, `created_time`, `created_by`) VALUES
('标准工作制', 'STANDARD_WORK', '09:00:00', '18:00:00', 15, 15, 0, '[]', 100, 0, 1, 0, 1, NOW(), 1),
('弹性工作制', 'FLEXIBLE_WORK', '08:00:00', '17:00:00', 30, 30, 0, '[]', 100, 1, 1, 0, 1, NOW(), 1),
('现场工作制', 'FIELD_WORK', '08:00:00', '17:00:00', 15, 15, 1, '[{"name":"生产区","lat":39.9042,"lng":116.4074,"radius":50},{"name":"仓库区","lat":39.9052,"lng":116.4084,"radius":30}]', 50, 0, 1, 1, 1, NOW(), 1);

-- =================
-- 推送消息模板初始化数据
-- =================

-- 插入推送消息模板
INSERT IGNORE INTO `push_template` (`template_name`, `template_code`, `message_type`, `title_template`, `content_template`, `action_type`, `action_params`, `is_active`, `created_time`, `created_by`) VALUES
('库存预警通知', 'INVENTORY_ALERT', 1, '库存预警', '产品【{product_name}】库存不足，当前库存：{current_stock}，最低库存：{min_stock}，请及时补货。', 'open_page', '{"page":"/inventory/list","params":{"product_id":"{product_id}"}}', 1, NOW(), 1),
('生产任务提醒', 'PRODUCTION_TASK', 1, '生产任务提醒', '您有新的生产任务【{task_name}】，计划开始时间：{start_date}，请及时处理。', 'open_page', '{"page":"/production/task","params":{"task_id":"{task_id}"}}', 1, NOW(), 1),
('订单状态更新', 'ORDER_STATUS', 1, '订单状态更新', '订单【{order_no}】状态已更新为：{status}，请查看详情。', 'open_page', '{"page":"/sales/order","params":{"order_id":"{order_id}"}}', 1, NOW(), 1),
('考勤提醒', 'ATTENDANCE_REMINDER', 1, '考勤提醒', '{reminder_type}提醒：请记得{action}，当前时间：{current_time}。', 'open_page', '{"page":"/attendance/record"}', 1, NOW(), 1),
('系统公告', 'SYSTEM_ANNOUNCEMENT', 1, '系统公告', '{content}', 'open_app', '{}', 1, NOW(), 1);

-- =================
-- 文件存储配置初始化数据
-- =================

-- 插入默认文件存储配置
INSERT IGNORE INTO `file_storage_config` (`storage_name`, `storage_type`, `access_key`, `secret_key`, `region`, `bucket_name`, `base_url`, `storage_config`, `is_default`, `is_enabled`, `created_time`, `created_by`) VALUES
('本地存储', 'local', '', '', '', '', '/api/files', '{"base_path":"/opt/enterprise-brain/uploads","url_prefix":"/api/files"}', 1, 1, NOW(), 1),
('阿里云OSS', 'aliyun', '', '', 'oss-cn-hangzhou', '', '', '{"endpoint":"oss-cn-hangzhou.aliyuncs.com","ssl":true}', 0, 0, NOW(), 1),
('腾讯云COS', 'tencent', '', '', 'ap-guangzhou', '', '', '{"domain":"cos.ap-guangzhou.myqcloud.com","ssl":true}', 0, 0, NOW(), 1);