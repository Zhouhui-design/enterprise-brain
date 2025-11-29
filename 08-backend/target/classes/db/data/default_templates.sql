-- 默认模板和样例数据
-- 包含系统预置的模板配置和示例数据
-- 创建时间：2024-11-27

-- =================
-- 报表模板数据
-- =================

-- 插入预置报表模板
INSERT IGNORE INTO `report_definition` (`report_name`, `report_code`, `report_type`, `data_source`, `query_sql`, `report_config`, `chart_config`, `filter_config`, `is_public`, `created_time`, `created_by`) VALUES
('销售订单统计报表', 'SALES_ORDER_REPORT', 'table', 'default', 
'SELECT 
    DATE_FORMAT(order_date, ''%Y-%m'') as month,
    COUNT(*) as order_count,
    SUM(final_amount) as total_amount,
    AVG(final_amount) as avg_amount
FROM sales_order 
WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
    AND deleted = 0
GROUP BY DATE_FORMAT(order_date, ''%Y-%m'')
ORDER BY month DESC',
'{"title":"销售订单统计","exportable":true,"pagination":true}',
'{"type":"line","xAxis":"month","yAxis":["order_count","total_amount"]}',
'[{"name":"日期范围","key":"date_range","type":"daterange","default":"last_12_months"}]',
1, NOW(), 1),

('库存预警报表', 'INVENTORY_ALERT_REPORT', 'table', 'default',
'SELECT 
    p.product_code,
    p.product_name,
    p.unit,
    i.on_hand_qty,
    p.min_stock,
    (p.min_stock - i.on_hand_qty) as shortage_qty,
    w.warehouse_name
FROM product p 
JOIN inventory i ON p.id = i.product_id
JOIN warehouse w ON i.warehouse_id = w.id
WHERE i.on_hand_qty < p.min_stock
    AND p.deleted = 0 
    AND w.deleted = 0
ORDER BY shortage_qty DESC',
'{"title":"库存预警报表","alert":true,"refreshInterval":300}',
'{"type":"bar","xAxis":"product_name","yAxis":"shortage_qty"}',
'[{"name":"仓库","key":"warehouse_id","type":"select","source":"warehouse"}]',
1, NOW(), 1),

('生产任务进度报表', 'PRODUCTION_PROGRESS_REPORT', 'dashboard', 'default',
'SELECT 
    task_status,
    COUNT(*) as task_count,
    SUM(planned_quantity) as total_planned,
    SUM(completed_quantity) as total_completed,
    ROUND(SUM(completed_quantity)/SUM(planned_quantity)*100, 2) as completion_rate
FROM production_task 
WHERE deleted = 0
GROUP BY task_status',
'{"title":"生产任务进度","widgets":["chart","summary","progress"]}',
'{"type":"pie","dataKey":"task_count","nameKey":"task_status"}',
'[{"name":"状态","key":"task_status","type":"multiselect","options":[{"value":"1","label":"待开始"},{"value":"2","label":"进行中"},{"value":"3","label":"已完成"}]}]',
1, NOW(), 1);

-- =================
-- 数据分析模板
-- =================

-- 插入分析算法模板配置
INSERT IGNORE INTO `algorithm_config` (`algorithm_name`, `algorithm_code`, `algorithm_type`, `algorithm_class`, `input_params`, `output_params`, `version`, `is_enabled`, `created_time`, `created_by`) VALUES
('需求预测模板', 'DEMAND_FORECAST_TEMPLATE', 'prediction', 'com.enterprise.brain.ai.DemandForecastAlgorithm',
'{"time_series_data":"array","seasonal_factors":"array","external_factors":"object","prediction_period":"number"}',
'{"forecast_values":"array","confidence_intervals":"array","trend_analysis":"object","accuracy_metrics":"object"}',
'1.0.0', 1, NOW(), 1),

('ABC分析模板', 'ABC_ANALYSIS_TEMPLATE', 'classification', 'com.enterprise.brain.ai.ABCAnalysisAlgorithm',
'{"sales_data":"array","value_field":"string","quantity_field":"string","analysis_period":"string"}',
'{"classification_result":"object","category_statistics":"object","recommendations":"array"}',
'1.0.0', 1, NOW(), 1),

('异常检测模板', 'ANOMALY_DETECTION_TEMPLATE', 'detection', 'com.enterprise.brain.ai.AnomalyDetectionAlgorithm',
'{"time_series":"array","threshold_method":"string","sensitivity":"number","window_size":"number"}',
'{"anomalies":"array","anomaly_scores":"array","threshold_values":"array","summary":"object"}',
'1.0.0', 1, NOW(), 1);

-- =================
-- 业务模板数据
-- =================

-- 插入产品BOM模板
INSERT IGNORE INTO `table_template` (`template_name`, `template_code`, `template_type`, `template_config`, `column_config`, `is_public`, `created_time`, `created_by`) VALUES
('产品BOM模板', 'PRODUCT_BOM_TEMPLATE', 'bom',
'{"title":"物料清单","hierarchical":true,"editable":true,"versionControl":true}',
'[
  {"name":"序号","key":"sequence","type":"number","width":60,"fixed":true},
  {"name":"物料编码","key":"material_code","type":"text","required":true,"width":120},
  {"name":"物料名称","key":"material_name","type":"text","required":true,"width":200},
  {"name":"规格型号","key":"specification","type":"text","width":150},
  {"name":"单位","key":"unit","type":"select","required":true,"width":80,"options":["个","件","套","米","千克"]},
  {"name":"用量","key":"quantity","type":"number","required":true,"precision":4,"width":100},
  {"name":"损耗率(%)","key":"loss_rate","type":"number","precision":2,"width":100,"default":0},
  {"name":"替代料","key":"substitute","type":"text","width":120},
  {"name":"备注","key":"remarks","type":"text","width":200}
]',
1, NOW(), 1),

('采购计划模板', 'PURCHASE_PLAN_TEMPLATE', 'plan',
'{"title":"采购计划","approval":true,"workflow":true,"schedulable":true}',
'[
  {"name":"物料编码","key":"material_code","type":"text","required":true,"searchable":true},
  {"name":"物料名称","key":"material_name","type":"text","required":true},
  {"name":"当前库存","key":"current_stock","type":"number","readonly":true},
  {"name":"安全库存","key":"safety_stock","type":"number"},
  {"name":"需求数量","key":"demand_qty","type":"number","required":true},
  {"name":"建议采购量","key":"suggested_qty","type":"number","formula":"demand_qty + safety_stock - current_stock"},
  {"name":"优选供应商","key":"preferred_supplier","type":"select","source":"supplier"},
  {"name":"预计单价","key":"estimated_price","type":"currency"},
  {"name":"预计到货日期","key":"expected_date","type":"date","required":true},
  {"name":"紧急程度","key":"urgency","type":"select","options":["普通","紧急","特急"],"default":"普通"}
]',
1, NOW(), 1),

('质检报告模板', 'QUALITY_INSPECTION_TEMPLATE', 'inspection',
'{"title":"质量检验报告","printable":true,"signature":true,"photosRequired":true}',
'[
  {"name":"检验批号","key":"batch_no","type":"text","required":true,"readonly":true},
  {"name":"产品名称","key":"product_name","type":"text","required":true},
  {"name":"检验类型","key":"inspection_type","type":"select","required":true,"options":["进货检验","过程检验","最终检验"]},
  {"name":"检验日期","key":"inspection_date","type":"date","required":true,"default":"today"},
  {"name":"检验数量","key":"inspection_qty","type":"number","required":true},
  {"name":"检验标准","key":"standard","type":"textarea"},
  {"name":"检验项目","key":"inspection_items","type":"json","template":"quality_items"},
  {"name":"检验结果","key":"result","type":"select","required":true,"options":["合格","不合格","待定"]},
  {"name":"不合格项","key":"defects","type":"multiselect","source":"defect_types"},
  {"name":"检验员","key":"inspector","type":"text","required":true},
  {"name":"审核员","key":"reviewer","type":"text"}
]',
1, NOW(), 1);

-- =================
-- 移动端模板数据
-- =================

-- 插入移动端表单模板
INSERT IGNORE INTO `table_template` (`template_name`, `template_code`, `template_type`, `template_config`, `column_config`, `is_public`, `created_time`, `created_by`) VALUES
('移动考勤模板', 'MOBILE_ATTENDANCE_TEMPLATE', 'mobile_form',
'{"title":"考勤打卡","mobile":true,"gpsRequired":true,"photoRequired":false}',
'[
  {"name":"打卡类型","key":"type","type":"radio","required":true,"options":[{"value":"in","label":"签到"},{"value":"out","label":"签退"}]},
  {"name":"打卡时间","key":"time","type":"datetime","required":true,"default":"now","readonly":true},
  {"name":"打卡地点","key":"location","type":"text","readonly":true,"gpsAuto":true},
  {"name":"工作内容","key":"work_content","type":"textarea","placeholder":"请简述今日工作内容"},
  {"name":"异常说明","key":"exception_note","type":"textarea","placeholder":"如有异常情况请说明"}
]',
1, NOW(), 1),

('现场巡检模板', 'FIELD_INSPECTION_TEMPLATE', 'mobile_form',
'{"title":"现场巡检","mobile":true,"offline":true,"photosRequired":true,"signature":true}',
'[
  {"name":"巡检区域","key":"area","type":"select","required":true,"source":"inspection_areas"},
  {"name":"巡检时间","key":"inspection_time","type":"datetime","required":true,"default":"now"},
  {"name":"设备状态","key":"equipment_status","type":"checkbox_group","options":[{"value":"normal","label":"正常"},{"value":"warning","label":"预警"},{"value":"fault","label":"故障"}]},
  {"name":"发现问题","key":"issues","type":"textarea","placeholder":"详细描述发现的问题"},
  {"name":"处理措施","key":"actions","type":"textarea","placeholder":"已采取的处理措施"},
  {"name":"现场照片","key":"photos","type":"file_upload","accept":"image/*","multiple":true,"required":true},
  {"name":"巡检员签名","key":"inspector_signature","type":"signature","required":true}
]',
1, NOW(), 1);

-- =================
-- API集成模板数据
-- =================

-- 插入API接口模板
INSERT IGNORE INTO `api_config` (`api_name`, `api_code`, `api_url`, `api_method`, `api_type`, `content_type`, `timeout`, `retry_times`, `auth_type`, `auth_config`, `request_headers`, `request_params`, `response_mapping`, `is_active`, `created_time`, `created_by`) VALUES
('ERP系统同步接口', 'ERP_SYNC_API', 'http://erp.company.com/api/sync', 'POST', 'rest', 'application/json', 30000, 3, 'bearer',
'{"token_url":"http://erp.company.com/oauth/token","client_id":"enterprise_brain","scope":"read write"}',
'{"Accept":"application/json","User-Agent":"Enterprise-Brain/1.0"}',
'{"sync_type":"string","data":"object","timestamp":"datetime"}',
'{"success":"boolean","message":"string","data":"object","error_code":"string"}',
1, NOW(), 1),

('第三方物流接口', 'LOGISTICS_API', 'https://api.logistics.com/tracking', 'GET', 'rest', 'application/json', 15000, 2, 'basic',
'{"username":"api_user","password":"api_password"}',
'{"Accept":"application/json"}',
'{"tracking_no":"string","carrier":"string"}',
'{"status":"string","location":"string","timestamp":"datetime","details":"array"}',
1, NOW(), 1),

('短信通知接口', 'SMS_API', 'https://sms.provider.com/send', 'POST', 'rest', 'application/json', 10000, 3, 'bearer',
'{"api_key":"your_api_key","secret":"your_secret"}',
'{"Content-Type":"application/json"}',
'{"mobile":"string","content":"string","template_id":"string","params":"object"}',
'{"success":"boolean","msg_id":"string","remaining":"number"}',
1, NOW(), 1);

-- =================
-- 消息队列模板数据
-- =================

-- 插入消息队列配置模板
INSERT IGNORE INTO `message_queue_config` (`queue_name`, `queue_type`, `broker_url`, `exchange_name`, `routing_key`, `queue_config`, `consumer_count`, `max_retry`, `dead_letter_queue`, `is_durable`, `is_active`, `created_time`, `created_by`) VALUES
('订单状态变更队列', 'rabbitmq', 'amqp://localhost:5672', 'order.exchange', 'order.status.changed',
'{"auto_delete":false,"exclusive":false,"arguments":{"x-message-ttl":86400000}}',
2, 3, 'order.dlq', 1, 1, NOW(), 1),

('库存预警队列', 'rabbitmq', 'amqp://localhost:5672', 'inventory.exchange', 'inventory.alert',
'{"auto_delete":false,"exclusive":false,"arguments":{"x-message-ttl":3600000}}',
1, 5, 'inventory.alert.dlq', 1, 1, NOW(), 1),

('生产任务分派队列', 'rabbitmq', 'amqp://localhost:5672', 'production.exchange', 'task.assigned',
'{"auto_delete":false,"exclusive":false,"priority_queue":true}',
3, 3, 'production.task.dlq', 1, 1, NOW(), 1);

-- =================
-- 知识图谱模板数据
-- =================

-- 插入知识图谱示例实体
INSERT IGNORE INTO `knowledge_entity` (`entity_name`, `entity_type`, `entity_attributes`, `description`, `source`, `confidence`, `created_time`, `created_by`) VALUES
('产品管理', 'BUSINESS_DOMAIN', '{"module":"product","functions":["CRUD","search","export","import"]}', '产品信息管理业务域', 'system_init', 1.0, NOW(), 1),
('销售订单', 'BUSINESS_ENTITY', '{"table":"sales_order","key_fields":["order_no","customer_id"],"related_entities":["customer","product"]}', '销售订单业务实体', 'system_init', 1.0, NOW(), 1),
('库存管理', 'BUSINESS_PROCESS', '{"steps":["入库","出库","盘点","调拨"],"triggers":["订单确认","生产完成","采购到货"]}', '库存管理业务流程', 'system_init', 1.0, NOW(), 1),
('质量检验', 'BUSINESS_RULE', '{"conditions":["进货必检","首件必检","终检必须"],"actions":["记录结果","生成报告","异常处理"]}', '质量检验业务规则', 'system_init', 1.0, NOW(), 1);

-- 插入知识图谱关系
INSERT IGNORE INTO `knowledge_relation` (`source_entity_id`, `target_entity_id`, `relation_type`, `relation_weight`, `relation_attributes`, `confidence`, `source`, `created_time`, `created_by`) VALUES
(1, 2, 'CONTAINS', 1.0, '{"description":"产品管理包含销售订单管理"}', 1.0, 'system_init', NOW(), 1),
(2, 3, 'TRIGGERS', 0.8, '{"description":"销售订单触发库存管理"}', 0.9, 'system_init', NOW(), 1),
(3, 4, 'REQUIRES', 0.9, '{"description":"库存管理需要质量检验"}', 0.8, 'system_init', NOW(), 1),
(1, 4, 'IMPLEMENTS', 0.7, '{"description":"产品管理实现质量检验规则"}', 0.8, 'system_init', NOW(), 1);