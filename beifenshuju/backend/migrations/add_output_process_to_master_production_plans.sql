-- 为主生产计划表添加产出工序字段
USE enterprise_brain;

-- 检查字段是否存在，如果不存在则添加
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'enterprise_brain'
  AND TABLE_NAME = 'master_production_plans'
  AND COLUMN_NAME = 'output_process';

-- 如果上面的查询没有结果，执行以下语句添加字段
ALTER TABLE master_production_plans 
ADD COLUMN output_process VARCHAR(100) 
COMMENT '产出工序' 
AFTER product_image;
