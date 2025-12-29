-- 添加生产BOM子件表的5个新字段
USE enterprise_brain;

-- 检查并添加字段（如果不存在）
SET @dbname = 'enterprise_brain';
SET @tablename = 'bom_components';

-- 后道工序名称
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tablename
   AND COLUMN_NAME='next_process_name') > 0,
  'SELECT ''next_process_name already exists'' AS info',
  'ALTER TABLE bom_components ADD COLUMN next_process_name VARCHAR(100) COMMENT ''后道工序名称'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 后道工序产品编号
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tablename
   AND COLUMN_NAME='next_product_code') > 0,
  'SELECT ''next_product_code already exists'' AS info',
  'ALTER TABLE bom_components ADD COLUMN next_product_code VARCHAR(50) COMMENT ''后道工序产品编号'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 后道工序产品名称
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tablename
   AND COLUMN_NAME='next_product_name') > 0,
  'SELECT ''next_product_name already exists'' AS info',
  'ALTER TABLE bom_components ADD COLUMN next_product_name VARCHAR(100) COMMENT ''后道工序产品名称'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 后道0阶标准用量
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tablename
   AND COLUMN_NAME='next_standard_qty') > 0,
  'SELECT ''next_standard_qty already exists'' AS info',
  'ALTER TABLE bom_components ADD COLUMN next_standard_qty DECIMAL(10,4) DEFAULT 1 COMMENT ''后道0阶标准用量'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 后道产品层阶地址
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tablename
   AND COLUMN_NAME='next_level_address') > 0,
  'SELECT ''next_level_address already exists'' AS info',
  'ALTER TABLE bom_components ADD COLUMN next_level_address VARCHAR(200) COMMENT ''后道产品层阶地址'''
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- 验证字段已添加
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA='enterprise_brain' 
  AND TABLE_NAME='bom_components'
  AND COLUMN_NAME IN ('next_process_name', 'next_product_code', 'next_product_name', 'next_standard_qty', 'next_level_address');
