-- 为工序计划表添加"真需求工时"字段
ALTER TABLE process_plans 
ADD COLUMN actual_required_work_hours DECIMAL(10, 2) DEFAULT 0.00 COMMENT '真需求工时 = 需补货数量/定时工额，保留2位小数';

-- 为现有数据计算并填充"真需求工时"
UPDATE process_plans 
SET actual_required_work_hours = ROUND(replenishment_qty / NULLIF(standard_work_quota, 0), 2)
WHERE standard_work_quota > 0 AND replenishment_qty > 0;

-- 验证字段已添加
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'process_plans' 
AND COLUMN_NAME = 'actual_required_work_hours';
