-- 系统重装后数据库修复脚本
-- 解决字段缺失问题，确保所有功能正常运行

USE enterprise_brain;

-- 1. 销售订单相关表修复
ALTER TABLE sales_orders 
ADD COLUMN IF NOT EXISTS submitter VARCHAR(100) DEFAULT 'admin' COMMENT '提交人' 
AFTER salesperson;

ALTER TABLE sales_order_products 
ADD COLUMN IF NOT EXISTS output_process VARCHAR(100) COMMENT '产出工序' 
AFTER accessories;

-- 2. 物料和采购相关表修复
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS default_procurement_lead_time INT DEFAULT 3 COMMENT '默认采购提前期（天）' 
AFTER purchase_cycle;

ALTER TABLE procurement_plans 
ADD COLUMN IF NOT EXISTS procurement_lead_time INT DEFAULT 3 COMMENT '采购提前期（天）' 
AFTER plan_arrival_date;

-- 3. 确保必要索引存在
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_order_products_order_id ON sales_order_products(order_id);
CREATE INDEX IF NOT EXISTS idx_materials_material_code ON materials(material_code);
CREATE INDEX IF NOT EXISTS idx_procurement_plans_source_no ON procurement_plans(source_no);

-- 4. 检查并更新数据一致性
UPDATE materials SET default_procurement_lead_time = 3 WHERE default_procurement_lead_time IS NULL;
UPDATE procurement_plans SET procurement_lead_time = 3 WHERE procurement_lead_time IS NULL;

-- 5. 显示修复结果
SELECT '数据库修复完成' AS message;
SHOW COLUMNS FROM sales_orders LIKE 'submitter';
SHOW COLUMNS FROM sales_order_products LIKE 'output_process';
SHOW COLUMNS FROM materials LIKE 'default_procurement_lead_time';
SHOW COLUMNS FROM procurement_plans LIKE 'procurement_lead_time';