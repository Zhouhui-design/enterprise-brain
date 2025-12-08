-- 为销售订单产品明细表添加产出工序字段
-- 执行时间：2025-12-07

USE enterprise_brain;

-- 检查字段是否存在，如果不存在则添加
ALTER TABLE sales_order_products 
ADD COLUMN IF NOT EXISTS output_process VARCHAR(100) 
COMMENT '产出工序' 
AFTER accessories;

-- 验证字段添加成功
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'enterprise_brain'
  AND TABLE_NAME = 'sales_order_products'
  AND COLUMN_NAME = 'output_process';

-- 显示表结构确认
DESCRIBE sales_order_products;
