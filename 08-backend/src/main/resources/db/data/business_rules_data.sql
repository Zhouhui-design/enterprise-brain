-- 业务规则和配置数据
-- 包含业务逻辑相关的规则配置数据
-- 创建时间：2024-11-27

-- =================
-- 产品业务规则数据
-- =================

-- 插入产品单位数据
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('product.units', '["个","件","套","台","米","千米","克","千克","吨","升","毫升","平方米","立方米","小时","天","月","年"]', '产品单位列表', '系统支持的产品单位', 'product', 1, 1, NOW()),
('product.status_mapping', '{"0":"停产","1":"正常","2":"新品"}', '产品状态映射', '产品状态值对应的中文描述', 'product', 1, 1, NOW());

-- 产品编码规则
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('product.code.prefix', 'P', '产品编码前缀', '产品编码的固定前缀', 'product', 1, 1, NOW()),
('product.code.length', '10', '产品编码长度', '产品编码总长度（包含前缀）', 'product', 1, 1, NOW()),
('product.code.auto_generate', 'true', '自动生成编码', '是否自动生成产品编码', 'product', 1, 1, NOW());

-- =================
-- 订单业务规则数据  
-- =================

-- 订单状态配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('order.sales_status', '{"1":"待确认","2":"已确认","3":"生产中","4":"已完成","5":"已取消"}', '销售订单状态', '销售订单状态映射', 'order', 1, 1, NOW()),
('order.purchase_status', '{"1":"待确认","2":"已确认","3":"部分到货","4":"全部到货","5":"已取消"}', '采购订单状态', '采购订单状态映射', 'order', 1, 1, NOW());

-- 订单编码规则
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('order.sales.prefix', 'SO', '销售订单前缀', '销售订单编号前缀', 'order', 1, 1, NOW()),
('order.purchase.prefix', 'PO', '采购订单前缀', '采购订单编号前缀', 'order', 1, 1, NOW()),
('order.date_format', 'yyyyMMdd', '订单日期格式', '订单编号中日期部分的格式', 'order', 1, 1, NOW()),
('order.sequence_length', '4', '订单序号长度', '订单编号中序号部分的长度', 'order', 1, 1, NOW());

-- 订单业务规则
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('order.min_amount', '0.01', '订单最小金额', '订单最小允许的金额', 'order', 1, 1, NOW()),
('order.max_amount', '1000000', '订单最大金额', '订单最大允许的金额', 'order', 1, 1, NOW()),
('order.auto_confirm', 'false', '自动确认订单', '是否自动确认新创建的订单', 'order', 1, 1, NOW()),
('order.delivery_lead_time', '7', '默认交期天数', '默认的订单交期天数', 'order', 1, 1, NOW());

-- =================
-- 库存业务规则数据
-- =================

-- 库存事务类型配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('inventory.transaction_types', '{"1":"入库","2":"出库","3":"调拨","4":"盘点"}', '库存事务类型', '库存事务类型映射', 'inventory', 1, 1, NOW()),
('inventory.alert_threshold', '10', '库存预警阈值', '默认库存预警阈值', 'inventory', 1, 1, NOW()),
('inventory.auto_allocate', 'true', '自动分配库存', '是否自动分配库存给订单', 'inventory', 1, 1, NOW());

-- 库存编码规则
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('inventory.transaction.prefix', 'INV', '库存事务前缀', '库存事务编号前缀', 'inventory', 1, 1, NOW()),
('inventory.count.prefix', 'CNT', '盘点任务前缀', '盘点任务编号前缀', 'inventory', 1, 1, NOW());

-- =================
-- 财务业务规则数据
-- =================

-- 税率配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('finance.default_tax_rate', '0.13', '默认税率', '默认增值税税率', 'finance', 1, 1, NOW()),
('finance.tax_rates', '[{"name":"13%增值税","rate":0.13},{"name":"9%增值税","rate":0.09},{"name":"6%增值税","rate":0.06},{"name":"3%增值税","rate":0.03},{"name":"免税","rate":0.00}]', '税率选项', '可选的税率配置', 'finance', 1, 1, NOW());

-- 付款条件配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('finance.payment_terms', '["现金","月结30天","月结60天","月结90天","预付款","货到付款","分期付款"]', '付款条件', '可选的付款条件', 'finance', 1, 1, NOW());

-- 币种配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('finance.currencies', '[{"code":"CNY","name":"人民币","symbol":"¥","rate":1.00},{"code":"USD","name":"美元","symbol":"$","rate":7.2},{"code":"EUR","name":"欧元","symbol":"€","rate":7.8}]', '支持币种', '系统支持的货币类型', 'finance', 1, 1, NOW()),
('finance.default_currency', 'CNY', '默认币种', '系统默认使用的币种', 'finance', 1, 1, NOW());

-- =================
-- 生产业务规则数据
-- =================

-- 生产任务状态配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('production.task_status', '{"1":"待开始","2":"进行中","3":"已完成","4":"已暂停","5":"已取消"}', '生产任务状态', '生产任务状态映射', 'production', 1, 1, NOW()),
('production.priority_levels', '{"1":"紧急","2":"高","3":"中","4":"低"}', '优先级级别', '生产任务优先级映射', 'production', 1, 1, NOW());

-- 生产编码规则
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('production.task.prefix', 'PT', '生产任务前缀', '生产任务编号前缀', 'production', 1, 1, NOW()),
('production.plan.prefix', 'PP', '生产计划前缀', '生产计划编号前缀', 'production', 1, 1, NOW());

-- 生产参数配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('production.standard_work_hours', '8', '标准工作小时', '每日标准工作小时数', 'production', 1, 1, NOW()),
('production.efficiency_threshold', '85', '效率阈值', '生产效率达标阈值（百分比）', 'production', 1, 1, NOW()),
('production.quality_threshold', '95', '质量阈值', '产品质量达标阈值（百分比）', 'production', 1, 1, NOW());

-- =================
-- 质量管理规则数据
-- =================

-- 质量等级配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('quality.grades', '{"A":"优秀","B":"良好","C":"一般","D":"较差","E":"不合格"}', '质量等级', '产品/供应商质量等级', 'quality', 1, 1, NOW()),
('quality.inspection_types', '["进货检验","首件检验","过程检验","最终检验","出货检验"]', '检验类型', '质量检验类型列表', 'quality', 1, 1, NOW());

-- 不良类型配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('quality.defect_types', '["尺寸不符","外观缺陷","功能异常","材料问题","工艺问题","包装问题","其他"]', '不良类型', '产品不良类型分类', 'quality', 1, 1, NOW()),
('quality.defect_levels', '{"1":"轻微","2":"一般","3":"严重","4":"致命"}', '缺陷等级', '产品缺陷严重程度等级', 'quality', 1, 1, NOW());

-- =================
-- 客户管理规则数据
-- =================

-- 客户类型和等级配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('customer.types', '{"1":"个人","2":"企业"}', '客户类型', '客户类型分类', 'customer', 1, 1, NOW()),
('customer.levels', '{"VIP":"VIP客户","GOLD":"金牌客户","SILVER":"银牌客户","BRONZE":"铜牌客户","NORMAL":"普通客户"}', '客户等级', '客户等级分类', 'customer', 1, 1, NOW());

-- 供应商等级配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('supplier.quality_grades', '{"A":"优秀","B":"良好","C":"一般","D":"较差"}', '供应商质量等级', '供应商质量评级', 'supplier', 1, 1, NOW()),
('supplier.cooperation_levels', '{"STRATEGIC":"战略合作","PREFERRED":"优选供应商","QUALIFIED":"合格供应商","PROBATION":"试用供应商"}', '合作等级', '供应商合作等级', 'supplier', 1, 1, NOW());

-- =================
-- 工作流规则数据
-- =================

-- 审批流程配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('workflow.approval_levels', '{"1":"部门主管","2":"部门经理","3":"总监","4":"总经理"}', '审批层级', '系统审批层级定义', 'workflow', 1, 1, NOW()),
('workflow.auto_approval_amount', '1000', '自动审批金额', '小于此金额的订单可自动审批', 'workflow', 1, 1, NOW());

-- 审批规则
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('workflow.sales_order_approval', '{"rules":[{"amount_range":[0,1000],"levels":[]},{"amount_range":[1000,10000],"levels":["部门主管"]},{"amount_range":[10000,100000],"levels":["部门主管","部门经理"]},{"amount_range":[100000,null],"levels":["部门主管","部门经理","总监","总经理"]}]}', '销售订单审批规则', '销售订单的审批流程规则', 'workflow', 1, 1, NOW()),
('workflow.purchase_order_approval', '{"rules":[{"amount_range":[0,5000],"levels":["部门主管"]},{"amount_range":[5000,50000],"levels":["部门主管","部门经理"]},{"amount_range":[50000,null],"levels":["部门主管","部门经理","总监","总经理"]}]}', '采购订单审批规则', '采购订单的审批流程规则', 'workflow', 1, 1, NOW()),
('workflow.leave_approval', '{"rules":[{"days_range":[0,3],"levels":["直属主管"]},{"days_range":[3,7],"levels":["直属主管","部门经理"]},{"days_range":[7,null],"levels":["直属主管","部门经理","人事部门","总经理"]}]}', '请假审批规则', '员工请假的审批流程规则', 'workflow', 1, 1, NOW());

-- =================
-- 系统集成规则数据
-- =================

-- API限流配置
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('api.rate_limits', '{"default":{"requests_per_minute":60,"requests_per_hour":1000,"requests_per_day":10000},"vip":{"requests_per_minute":300,"requests_per_hour":5000,"requests_per_day":50000}}', 'API限流规则', '不同用户等级的API限流配置', 'api', 1, 1, NOW());

-- 数据同步规则
INSERT IGNORE INTO `sys_config` (`config_key`, `config_value`, `config_name`, `description`, `config_type`, `is_system`, `is_enabled`, `created_time`) VALUES
('sync.batch_sizes', '{"small":100,"medium":1000,"large":5000}', '同步批次大小', '数据同步的批次大小配置', 'sync', 1, 1, NOW()),
('sync.retry_policy', '{"max_retries":3,"retry_delay":5000,"exponential_backoff":true}', '同步重试策略', '数据同步失败的重试策略', 'sync', 1, 1, NOW());