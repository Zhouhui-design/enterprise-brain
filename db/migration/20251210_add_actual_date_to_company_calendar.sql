-- =====================================================
-- 企业日历表增加真日期字段
-- 创建时间: 2025-12-10
-- 说明: 新增actual_date字段，值为日期+1天
-- =====================================================

-- 增加真日期字段
ALTER TABLE company_calendar 
ADD COLUMN actual_date DATE COMMENT '真日期（日期+1天）' AFTER calendar_date;

-- 为现有数据填充真日期值（日期+1天）
UPDATE company_calendar 
SET actual_date = DATE_ADD(calendar_date, INTERVAL 1 DAY) 
WHERE actual_date IS NULL;

-- 验证数据
SELECT 
  calendar_date AS '日期',
  actual_date AS '真日期',
  weekday AS '星期',
  is_workday AS '是否上班'
FROM company_calendar 
ORDER BY calendar_date 
LIMIT 10;
