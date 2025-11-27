-- 测试数据
-- 用于单元测试和集成测试的数据
-- 创建时间：2024-11-27

-- =================
-- 测试用户数据
-- =================

-- 插入测试用户
INSERT IGNORE INTO `users` (`username`, `password`, `email`, `phone`, `status`, `created_time`) VALUES
('testuser1', '$2a$10$testpassword1hash', 'test1@test.com', '13900000001', 1, NOW()),
('testuser2', '$2a$10$testpassword2hash', 'test2@test.com', '13900000002', 1, NOW()),
('testuser3', '$2a$10$testpassword3hash', 'test3@test.com', '13900000003', 0, NOW()),
('testadmin', '$2a$10$testadminpasswordhash', 'testadmin@test.com', '13900000004', 1, NOW()),
('testsystem', '$2a$10$testsystempasswordhash', 'testsystem@test.com', '13900000005', 1, NOW());

-- =================
-- 测试产品数据
-- =================

-- 插入测试产品
INSERT IGNORE INTO `product` (`product_code`, `product_name`, `product_spec`, `category_id`, `unit`, `standard_price`, `cost_price`, `min_stock`, `max_stock`, `description`, `status`, `created_time`, `created_by`) VALUES
('TEST001', '测试产品A', '测试规格A', 1, '个', 100.00, 80.00, 10, 100, '用于测试的产品A', 1, NOW(), 1),
('TEST002', '测试产品B', '测试规格B', 2, '件', 200.00, 160.00, 5, 50, '用于测试的产品B', 1, NOW(), 1),
('TEST003', '测试产品C', '测试规格C', 3, '套', 300.00, 240.00, 2, 20, '用于测试的产品C', 0, NOW(), 1),
('TESTLOW', '低库存测试产品', '低库存测试规格', 1, '个', 50.00, 40.00, 100, 1000, '用于测试库存预警的产品', 1, NOW(), 1),
('TESTHIGH', '高价测试产品', '高价测试规格', 3, '套', 5000.00, 4000.00, 1, 10, '用于测试高价产品的功能', 1, NOW(), 1);

-- =================
-- 测试客户数据
-- =================

-- 插入测试客户
INSERT IGNORE INTO `customer` (`customer_code`, `customer_name`, `customer_type`, `contact_person`, `contact_phone`, `contact_email`, `address`, `credit_limit`, `payment_terms`, `status`, `created_time`, `created_by`) VALUES
('TC001', '测试客户A公司', 2, '测试联系人A', '13700000001', 'testa@testcustomer.com', '测试地址A', 100000.00, '月结30天', 1, NOW(), 1),
('TC002', '测试客户B企业', 2, '测试联系人B', '13700000002', 'testb@testcustomer.com', '测试地址B', 50000.00, '现金', 1, NOW(), 1),
('TC003', '测试个人客户', 1, '张测试', '13700000003', 'zhang@testpersonal.com', '个人测试地址', 10000.00, '货到付款', 1, NOW(), 1),
('TC004', '停用测试客户', 2, '停用联系人', '13700000004', 'disabled@testcustomer.com', '停用测试地址', 0.00, '月结30天', 0, NOW(), 1),
('TCVIP', 'VIP测试客户', 2, 'VIP联系人', '13700000005', 'vip@testcustomer.com', 'VIP测试地址', 500000.00, '月结90天', 1, NOW(), 1);

-- =================
-- 测试供应商数据
-- =================

-- 插入测试供应商
INSERT IGNORE INTO `supplier` (`supplier_code`, `supplier_name`, `contact_person`, `contact_phone`, `contact_email`, `address`, `payment_terms`, `quality_grade`, `status`, `created_time`, `created_by`) VALUES
('TS001', '测试供应商A', '供应商联系人A', '13600000001', 'suppliera@test.com', '供应商测试地址A', '月结30天', 'A', 1, NOW(), 1),
('TS002', '测试供应商B', '供应商联系人B', '13600000002', 'supplierb@test.com', '供应商测试地址B', '预付款', 'B', 1, NOW(), 1),
('TS003', '质量差供应商', '质量差联系人', '13600000003', 'poor@test.com', '质量差测试地址', '货到付款', 'D', 1, NOW(), 1),
('TS004', '停用测试供应商', '停用联系人', '13600000004', 'disabled@testsupplier.com', '停用供应商地址', '月结30天', 'C', 0, NOW(), 1),
('TSPRE', '优选测试供应商', '优选联系人', '13600000005', 'preferred@test.com', '优选供应商地址', '月结60天', 'A', 1, NOW(), 1);

-- =================
-- 测试订单数据
-- =================

-- 插入测试销售订单
INSERT IGNORE INTO `sales_order` (`order_no`, `customer_id`, `order_date`, `delivery_date`, `total_amount`, `discount_amount`, `tax_amount`, `final_amount`, `order_status`, `remarks`, `created_time`, `created_by`) VALUES
('TEST_SO_001', 6, '2024-11-01', '2024-11-15', 1000.00, 50.00, 123.50, 1073.50, 1, '测试销售订单1-待确认', NOW(), 1),
('TEST_SO_002', 7, '2024-11-02', '2024-11-20', 2000.00, 0.00, 260.00, 2260.00, 2, '测试销售订单2-已确认', NOW(), 1),
('TEST_SO_003', 8, '2024-11-03', '2024-11-25', 500.00, 25.00, 61.75, 536.75, 3, '测试销售订单3-生产中', NOW(), 1),
('TEST_SO_004', 6, '2024-11-04', '2024-11-30', 15000.00, 500.00, 1885.00, 16385.00, 4, '测试销售订单4-已完成', NOW(), 1),
('TEST_SO_005', 10, '2024-11-05', '2024-12-01', 25000.00, 1000.00, 3120.00, 27120.00, 5, '测试销售订单5-已取消', NOW(), 1);

-- 插入测试销售订单明细
INSERT IGNORE INTO `sales_order_item` (`order_id`, `product_id`, `quantity`, `unit_price`, `discount_rate`, `line_amount`, `delivery_date`, `remarks`, `created_time`) VALUES
(6, 10, 10, 100.00, 0.0500, 950.00, '2024-11-15', '测试订单明细1', NOW()),
(7, 11, 10, 200.00, 0.0000, 2000.00, '2024-11-20', '测试订单明细2', NOW()),
(8, 12, 1, 500.00, 0.0500, 475.00, '2024-11-25', '测试订单明细3', NOW()),
(9, 14, 3, 5000.00, 0.0333, 14500.00, '2024-11-30', '测试高价产品订单', NOW()),
(10, 10, 100, 100.00, 0.0400, 9600.00, '2024-12-01', '取消的大批量订单', NOW());

-- 插入测试采购订单
INSERT IGNORE INTO `purchase_order` (`order_no`, `supplier_id`, `order_date`, `expected_date`, `total_amount`, `tax_amount`, `final_amount`, `order_status`, `remarks`, `created_time`, `created_by`) VALUES
('TEST_PO_001', 6, '2024-11-01', '2024-11-10', 8000.00, 1040.00, 9040.00, 1, '测试采购订单1-待确认', NOW(), 1),
('TEST_PO_002', 7, '2024-11-02', '2024-11-12', 3200.00, 416.00, 3616.00, 2, '测试采购订单2-已确认', NOW(), 1),
('TEST_PO_003', 10, '2024-11-03', '2024-11-15', 12000.00, 1560.00, 13560.00, 3, '测试采购订单3-部分到货', NOW(), 1),
('TEST_PO_004', 6, '2024-11-04', '2024-11-18', 6000.00, 780.00, 6780.00, 4, '测试采购订单4-全部到货', NOW(), 1),
('TEST_PO_005', 7, '2024-11-05', '2024-11-20', 2000.00, 260.00, 2260.00, 5, '测试采购订单5-已取消', NOW(), 1);

-- =================
-- 测试库存数据
-- =================

-- 插入测试库存记录
INSERT IGNORE INTO `inventory` (`warehouse_id`, `product_id`, `on_hand_qty`, `available_qty`, `allocated_qty`, `reserved_qty`, `last_in_date`, `last_out_date`, `avg_cost`, `created_time`) VALUES
(1, 10, 150.0000, 140.0000, 10.0000, 0.0000, '2024-11-01', '2024-10-30', 80.00, NOW()),
(1, 11, 80.0000, 70.0000, 10.0000, 0.0000, '2024-11-02', '2024-10-29', 160.00, NOW()),
(2, 12, 15.0000, 14.0000, 1.0000, 0.0000, '2024-11-03', '2024-10-28', 240.00, NOW()),
(1, 13, 5.0000, 5.0000, 0.0000, 0.0000, '2024-10-20', '2024-10-15', 40.00, NOW()), -- 低库存测试
(3, 14, 8.0000, 5.0000, 3.0000, 0.0000, '2024-11-04', '2024-11-04', 4000.00, NOW()),
(4, 10, 0.0000, 0.0000, 0.0000, 0.0000, NULL, '2024-09-15', 80.00, NOW()), -- 零库存测试
(1, 11, 200.0000, 200.0000, 0.0000, 0.0000, '2024-11-05', NULL, 160.00, NOW()); -- 充足库存测试

-- =================
-- 测试生产任务数据
-- =================

-- 插入测试生产任务
INSERT IGNORE INTO `production_task` (`task_no`, `task_name`, `product_id`, `order_id`, `planned_quantity`, `completed_quantity`, `quality_quantity`, `defect_quantity`, `planned_start_date`, `planned_end_date`, `actual_start_date`, `actual_end_date`, `task_status`, `priority`, `assigned_workers`, `work_center`, `equipment`, `remarks`, `created_time`, `created_by`) VALUES
('TEST_PT_001', '测试生产任务1', 10, 6, 20.0000, 0.0000, 0.0000, 0.0000, '2024-11-10', '2024-11-15', NULL, NULL, 1, 2, '["testworker1"]', 'TEST_WC_001', 'TEST_EQ_001', '待开始的测试任务', NOW(), 1),
('TEST_PT_002', '测试生产任务2', 11, 7, 15.0000, 8.0000, 8.0000, 0.0000, '2024-11-08', '2024-11-18', '2024-11-08', NULL, 2, 1, '["testworker2","testworker3"]', 'TEST_WC_002', 'TEST_EQ_002', '进行中的测试任务', NOW(), 1),
('TEST_PT_003', '测试生产任务3', 12, 8, 5.0000, 5.0000, 4.0000, 1.0000, '2024-11-05', '2024-11-10', '2024-11-05', '2024-11-09', 3, 3, '["testworker1","testworker4"]', 'TEST_WC_001', 'TEST_EQ_001', '已完成的测试任务', NOW(), 1),
('TEST_PT_004', '测试暂停任务', 10, NULL, 30.0000, 10.0000, 10.0000, 0.0000, '2024-11-01', '2024-11-12', '2024-11-01', NULL, 4, 2, '["testworker2"]', 'TEST_WC_003', 'TEST_EQ_003', '暂停的测试任务', NOW(), 1),
('TEST_PT_005', '测试取消任务', 11, NULL, 25.0000, 0.0000, 0.0000, 0.0000, '2024-11-15', '2024-11-25', NULL, NULL, 5, 4, '["testworker5"]', 'TEST_WC_002', 'TEST_EQ_002', '已取消的测试任务', NOW(), 1);

-- =================
-- 测试考勤数据
-- =================

-- 插入测试考勤记录
INSERT IGNORE INTO `attendance_record` (`user_id`, `attendance_date`, `check_in_time`, `check_out_time`, `check_in_location`, `check_out_location`, `work_hours`, `overtime_hours`, `late_minutes`, `early_leave_minutes`, `attendance_status`, `remarks`, `created_time`) VALUES
-- 正常考勤测试数据
(3, '2024-11-01', '2024-11-01 09:00:00', '2024-11-01 18:00:00', '测试地点A', '测试地点A', 8.00, 0.00, 0, 0, 1, '正常考勤测试', NOW()),
(4, '2024-11-01', '2024-11-01 08:55:00', '2024-11-01 18:05:00', '测试地点B', '测试地点B', 8.17, 0.08, 0, 0, 1, '正常考勤测试-有加班', NOW()),

-- 迟到测试数据
(3, '2024-11-02', '2024-11-02 09:20:00', '2024-11-02 18:00:00', '测试地点A', '测试地点A', 7.67, 0.00, 20, 0, 2, '迟到测试', NOW()),
(4, '2024-11-02', '2024-11-02 09:30:00', '2024-11-02 18:30:00', '测试地点B', '测试地点B', 8.00, 0.50, 30, 0, 2, '迟到测试-有加班补偿', NOW()),

-- 早退测试数据
(3, '2024-11-03', '2024-11-03 09:00:00', '2024-11-03 17:30:00', '测试地点A', '测试地点A', 7.50, 0.00, 0, 30, 3, '早退测试', NOW()),

-- 旷工测试数据
(3, '2024-11-04', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, 0, 4, '旷工测试', NOW()),

-- 请假测试数据
(4, '2024-11-05', NULL, NULL, NULL, NULL, 0.00, 0.00, 0, 0, 5, '请假测试', NOW()),

-- 周末加班测试数据
(3, '2024-11-09', '2024-11-09 09:00:00', '2024-11-09 15:00:00', '测试地点A', '测试地点A', 6.00, 6.00, 0, 0, 1, '周末加班测试', NOW());

-- =================
-- 测试智能表格数据
-- =================

-- 插入测试智能表格
INSERT IGNORE INTO `smart_table` (`name`, `description`, `create_user_id`, `create_time`, `update_time`) VALUES
('测试智能表格1', '用于单元测试的智能表格', 3, NOW(), NOW()),
('测试数据分析表', '用于测试数据分析功能的表格', 4, NOW(), NOW()),
('测试报表模板', '用于测试报表生成的模板表格', 3, NOW(), NOW());

-- 插入测试表格列配置
INSERT IGNORE INTO `table_column` (`table_id`, `column_name`, `column_type`, `column_index`, `is_formula_column`, `formula_expression`, `column_config`, `is_visible`) VALUES
(6, '测试列1', 'TEXT', 1, 0, NULL, '{"required":true,"maxLength":50}', 1),
(6, '测试列2', 'NUMBER', 2, 0, NULL, '{"precision":2,"min":0,"max":999999}', 1),
(6, '测试计算列', 'NUMBER', 3, 1, 'SUM(测试列2)', '{"readonly":true,"precision":2}', 1),
(7, '数据列A', 'TEXT', 1, 0, NULL, '{"required":true}', 1),
(7, '数据列B', 'NUMBER', 2, 0, NULL, '{"precision":4}', 1),
(7, '分析结果', 'TEXT', 3, 1, 'ANALYSIS(数据列A,数据列B)', '{"readonly":true}', 1),
(8, '报表字段1', 'TEXT', 1, 0, NULL, '{}', 1),
(8, '报表字段2', 'DATE', 2, 0, NULL, '{"format":"yyyy-MM-dd"}', 1),
(8, '报表字段3', 'CURRENCY', 3, 0, NULL, '{"currency":"CNY"}', 1);

-- =================
-- 测试API配置数据
-- =================

-- 插入测试API配置
INSERT IGNORE INTO `api_config` (`api_name`, `api_code`, `api_url`, `api_method`, `api_type`, `content_type`, `timeout`, `retry_times`, `auth_type`, `auth_config`, `request_headers`, `request_params`, `response_mapping`, `is_active`, `created_time`, `created_by`) VALUES
('测试API接口', 'TEST_API', 'http://test.api.com/test', 'POST', 'rest', 'application/json', 5000, 2, 'none', '{}', '{"Content-Type":"application/json"}', '{"test_param":"string"}', '{"success":"boolean","data":"object"}', 1, NOW(), 1),
('测试认证API', 'TEST_AUTH_API', 'http://test.api.com/auth', 'GET', 'rest', 'application/json', 3000, 1, 'basic', '{"username":"testuser","password":"testpass"}', '{}', '{}', '{"token":"string","expires":"datetime"}', 1, NOW(), 1),
('停用测试API', 'DISABLED_TEST_API', 'http://disabled.api.com/test', 'GET', 'rest', 'application/json', 5000, 3, 'none', '{}', '{}', '{}', '{}', 0, NOW(), 1);

-- =================
-- 测试消息模板数据
-- =================

-- 插入测试推送模板
INSERT IGNORE INTO `push_template` (`template_name`, `template_code`, `message_type`, `title_template`, `content_template`, `action_type`, `action_params`, `is_active`, `created_time`, `created_by`) VALUES
('测试通知模板', 'TEST_NOTIFICATION', 1, '测试通知', '这是一条测试通知消息：{message}', 'open_app', '{}', 1, NOW(), 1),
('测试页面跳转模板', 'TEST_PAGE_JUMP', 1, '测试跳转', '请查看详细信息：{details}', 'open_page', '{"page":"/test/page","params":{"id":"{item_id}"}}', 1, NOW(), 1),
('停用测试模板', 'DISABLED_TEST_TEMPLATE', 1, '停用测试', '这是停用的测试模板', 'open_app', '{}', 0, NOW(), 1);

-- =================
-- 测试算法配置数据
-- =================

-- 插入测试算法配置
INSERT IGNORE INTO `algorithm_config` (`algorithm_name`, `algorithm_code`, `algorithm_type`, `algorithm_class`, `input_params`, `output_params`, `version`, `is_enabled`, `created_time`, `created_by`) VALUES
('测试预测算法', 'TEST_PREDICTION', 'prediction', 'com.test.TestPredictionAlgorithm', '{"input_data":"array","parameters":"object"}', '{"prediction":"number","confidence":"number"}', '1.0.0', 1, NOW(), 1),
('测试分类算法', 'TEST_CLASSIFICATION', 'classification', 'com.test.TestClassificationAlgorithm', '{"features":"array","model_params":"object"}', '{"category":"string","probability":"number"}', '1.0.0', 1, NOW(), 1),
('停用测试算法', 'DISABLED_TEST_ALGORITHM', 'optimization', 'com.test.DisabledTestAlgorithm', '{"input":"object"}', '{"output":"object"}', '1.0.0', 0, NOW(), 1);

-- =================
-- 性能测试数据
-- =================

-- 插入大量测试数据用于性能测试（可选，根据需要取消注释）
/*
-- 批量插入产品测试数据
INSERT IGNORE INTO `product` (`product_code`, `product_name`, `product_spec`, `category_id`, `unit`, `standard_price`, `cost_price`, `min_stock`, `max_stock`, `description`, `status`, `created_time`, `created_by`)
SELECT 
    CONCAT('PERF', LPAD(n, 6, '0')) as product_code,
    CONCAT('性能测试产品', n) as product_name,
    CONCAT('性能测试规格', n) as product_spec,
    ((n - 1) % 4) + 1 as category_id,
    '个' as unit,
    ROUND(RAND() * 1000 + 10, 2) as standard_price,
    ROUND((RAND() * 1000 + 10) * 0.8, 2) as cost_price,
    FLOOR(RAND() * 50) + 10 as min_stock,
    FLOOR(RAND() * 500) + 100 as max_stock,
    CONCAT('性能测试产品', n, '的描述') as description,
    1 as status,
    NOW() as created_time,
    1 as created_by
FROM (
    SELECT ROW_NUMBER() OVER() as n
    FROM information_schema.columns 
    LIMIT 1000
) t;
*/