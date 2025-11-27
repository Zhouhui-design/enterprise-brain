-- 编码生成存储过程
-- 系统各类编号自动生成
-- 创建时间：2024-11-27

DELIMITER $$

-- 通用编码生成存储过程
CREATE PROCEDURE `generate_codes`(
    IN p_code_type VARCHAR(50),          -- 编码类型
    IN p_prefix VARCHAR(10),             -- 前缀
    IN p_date_format VARCHAR(20),        -- 日期格式
    IN p_sequence_length INT,            -- 序号长度
    IN p_business_date DATE,             -- 业务日期
    IN p_count INT,                      -- 生成数量
    OUT p_codes TEXT                     -- 返回的编码列表
)
BEGIN
    DECLARE v_current_sequence INT DEFAULT 0;
    DECLARE v_max_sequence INT DEFAULT 0;
    DECLARE v_date_part VARCHAR(20);
    DECLARE v_sequence_part VARCHAR(20);
    DECLARE v_full_code VARCHAR(100);
    DECLARE v_codes_result TEXT DEFAULT '';
    DECLARE v_counter INT DEFAULT 0;
    DECLARE v_table_name VARCHAR(50);
    DECLARE v_column_name VARCHAR(50);

    -- 根据编码类型确定查询表和字段
    CASE p_code_type
        WHEN 'PRODUCT' THEN 
            SET v_table_name = 'product';
            SET v_column_name = 'product_code';
        WHEN 'CUSTOMER' THEN 
            SET v_table_name = 'customer';
            SET v_column_name = 'customer_code';
        WHEN 'SUPPLIER' THEN 
            SET v_table_name = 'supplier';
            SET v_column_name = 'supplier_code';
        WHEN 'SALES_ORDER' THEN 
            SET v_table_name = 'sales_order';
            SET v_column_name = 'order_no';
        WHEN 'PURCHASE_ORDER' THEN 
            SET v_table_name = 'purchase_order';
            SET v_column_name = 'order_no';
        WHEN 'PRODUCTION_TASK' THEN 
            SET v_table_name = 'production_task';
            SET v_column_name = 'task_no';
        WHEN 'INVENTORY_TRANSACTION' THEN 
            SET v_table_name = 'inventory_transaction';
            SET v_column_name = 'transaction_no';
        ELSE 
            SET v_table_name = 'sequence_number';
            SET v_column_name = 'sequence_code';
    END CASE;

    -- 格式化日期部分
    IF p_date_format IS NOT NULL AND p_business_date IS NOT NULL THEN
        SET v_date_part = DATE_FORMAT(p_business_date, p_date_format);
    ELSE
        SET v_date_part = '';
    END IF;

    -- 获取当前最大序号
    SET @sql = CONCAT(
        'SELECT COALESCE(MAX(CAST(SUBSTRING(', v_column_name, ', LENGTH(''', p_prefix, v_date_part, ''') + 1) AS UNSIGNED)), 0) INTO @max_seq FROM ', v_table_name, 
        ' WHERE ', v_column_name, ' LIKE ''', p_prefix, v_date_part, '%'' AND deleted = 0'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SET v_max_sequence = @max_seq;

    -- 生成编码
    WHILE v_counter < p_count DO
        SET v_current_sequence = v_max_sequence + v_counter + 1;
        SET v_sequence_part = LPAD(v_current_sequence, p_sequence_length, '0');
        SET v_full_code = CONCAT(p_prefix, v_date_part, v_sequence_part);
        
        IF v_counter = 0 THEN
            SET v_codes_result = v_full_code;
        ELSE
            SET v_codes_result = CONCAT(v_codes_result, ',', v_full_code);
        END IF;
        
        SET v_counter = v_counter + 1;
    END WHILE;

    SET p_codes = v_codes_result;

END$$

-- 产品编码生成存储过程
CREATE PROCEDURE `generate_product_code`(
    IN p_category_id BIGINT,
    OUT p_product_code VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_category_code VARCHAR(10);
    DECLARE v_sequence_length INT DEFAULT 5;
    DECLARE v_codes TEXT;

    -- 获取分类编码作为前缀的一部分
    SELECT COALESCE(category_code, 'P') INTO v_category_code
    FROM product_category 
    WHERE id = p_category_id;

    -- 组合前缀
    SET v_prefix = CONCAT('P', LEFT(v_category_code, 2));

    -- 生成编码
    CALL generate_codes('PRODUCT', v_prefix, NULL, v_sequence_length, NULL, 1, v_codes);
    
    SET p_product_code = v_codes;

END$$

-- 销售订单编号生成存储过程
CREATE PROCEDURE `generate_sales_order_no`(
    IN p_order_date DATE,
    OUT p_order_no VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10) DEFAULT 'SO';
    DECLARE v_date_format VARCHAR(20) DEFAULT '%Y%m%d';
    DECLARE v_sequence_length INT DEFAULT 4;
    DECLARE v_codes TEXT;

    -- 生成订单编号
    CALL generate_codes('SALES_ORDER', v_prefix, v_date_format, v_sequence_length, p_order_date, 1, v_codes);
    
    SET p_order_no = v_codes;

END$$

-- 采购订单编号生成存储过程
CREATE PROCEDURE `generate_purchase_order_no`(
    IN p_order_date DATE,
    OUT p_order_no VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10) DEFAULT 'PO';
    DECLARE v_date_format VARCHAR(20) DEFAULT '%Y%m%d';
    DECLARE v_sequence_length INT DEFAULT 4;
    DECLARE v_codes TEXT;

    -- 生成采购订单编号
    CALL generate_codes('PURCHASE_ORDER', v_prefix, v_date_format, v_sequence_length, p_order_date, 1, v_codes);
    
    SET p_order_no = v_codes;

END$$

-- 生产任务编号生成存储过程
CREATE PROCEDURE `generate_production_task_no`(
    IN p_planned_date DATE,
    OUT p_task_no VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10) DEFAULT 'PT';
    DECLARE v_date_format VARCHAR(20) DEFAULT '%Y%m%d';
    DECLARE v_sequence_length INT DEFAULT 4;
    DECLARE v_codes TEXT;

    -- 生成生产任务编号
    CALL generate_codes('PRODUCTION_TASK', v_prefix, v_date_format, v_sequence_length, p_planned_date, 1, v_codes);
    
    SET p_task_no = v_codes;

END$$

-- 库存事务编号生成存储过程
CREATE PROCEDURE `generate_inventory_transaction_no`(
    IN p_transaction_date DATE,
    IN p_transaction_type TINYINT,
    OUT p_transaction_no VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_date_format VARCHAR(20) DEFAULT '%Y%m%d';
    DECLARE v_sequence_length INT DEFAULT 4;
    DECLARE v_codes TEXT;

    -- 根据事务类型确定前缀
    CASE p_transaction_type
        WHEN 1 THEN SET v_prefix = 'IN';    -- 入库
        WHEN 2 THEN SET v_prefix = 'OUT';   -- 出库
        WHEN 3 THEN SET v_prefix = 'TRF';   -- 调拨
        WHEN 4 THEN SET v_prefix = 'CNT';   -- 盘点
        ELSE SET v_prefix = 'INV';          -- 默认
    END CASE;

    -- 生成库存事务编号
    CALL generate_codes('INVENTORY_TRANSACTION', v_prefix, v_date_format, v_sequence_length, p_transaction_date, 1, v_codes);
    
    SET p_transaction_no = v_codes;

END$$

-- 客户编号生成存储过程
CREATE PROCEDURE `generate_customer_code`(
    IN p_customer_type TINYINT,
    OUT p_customer_code VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_sequence_length INT DEFAULT 5;
    DECLARE v_codes TEXT;

    -- 根据客户类型确定前缀
    CASE p_customer_type
        WHEN 1 THEN SET v_prefix = 'CP';    -- 个人客户
        WHEN 2 THEN SET v_prefix = 'CC';    -- 企业客户
        ELSE SET v_prefix = 'C';            -- 默认
    END CASE;

    -- 生成客户编号
    CALL generate_codes('CUSTOMER', v_prefix, NULL, v_sequence_length, NULL, 1, v_codes);
    
    SET p_customer_code = v_codes;

END$$

-- 供应商编号生成存储过程
CREATE PROCEDURE `generate_supplier_code`(
    OUT p_supplier_code VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10) DEFAULT 'S';
    DECLARE v_sequence_length INT DEFAULT 5;
    DECLARE v_codes TEXT;

    -- 生成供应商编号
    CALL generate_codes('SUPPLIER', v_prefix, NULL, v_sequence_length, NULL, 1, v_codes);
    
    SET p_supplier_code = v_codes;

END$$

-- 盘点任务编号生成存储过程
CREATE PROCEDURE `generate_inventory_count_task_no`(
    IN p_planned_date DATE,
    OUT p_task_no VARCHAR(100)
)
BEGIN
    DECLARE v_prefix VARCHAR(10) DEFAULT 'CNT';
    DECLARE v_date_format VARCHAR(20) DEFAULT '%Y%m%d';
    DECLARE v_sequence_length INT DEFAULT 4;
    DECLARE v_codes TEXT;

    -- 生成盘点任务编号
    CALL generate_codes('INVENTORY_COUNT_TASK', v_prefix, v_date_format, v_sequence_length, p_planned_date, 1, v_codes);
    
    SET p_task_no = v_codes;

END$$

-- 批次生成多个编码存储过程
CREATE PROCEDURE `batch_generate_codes`(
    IN p_code_type VARCHAR(50),
    IN p_count INT,
    IN p_business_date DATE,
    OUT p_codes TEXT
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_date_format VARCHAR(20);
    DECLARE v_sequence_length INT;

    -- 根据编码类型设置参数
    CASE p_code_type
        WHEN 'PRODUCT' THEN 
            SET v_prefix = 'P';
            SET v_date_format = NULL;
            SET v_sequence_length = 7;
        WHEN 'CUSTOMER' THEN 
            SET v_prefix = 'C';
            SET v_date_format = NULL;
            SET v_sequence_length = 5;
        WHEN 'SUPPLIER' THEN 
            SET v_prefix = 'S';
            SET v_date_format = NULL;
            SET v_sequence_length = 5;
        WHEN 'SALES_ORDER' THEN 
            SET v_prefix = 'SO';
            SET v_date_format = '%Y%m%d';
            SET v_sequence_length = 4;
        WHEN 'PURCHASE_ORDER' THEN 
            SET v_prefix = 'PO';
            SET v_date_format = '%Y%m%d';
            SET v_sequence_length = 4;
        ELSE 
            SET v_prefix = 'CODE';
            SET v_date_format = NULL;
            SET v_sequence_length = 6;
    END CASE;

    -- 调用通用生成方法
    CALL generate_codes(p_code_type, v_prefix, v_date_format, v_sequence_length, p_business_date, p_count, p_codes);

END$$

-- 重置编码序号存储过程（用于年度重置等场景）
CREATE PROCEDURE `reset_code_sequence`(
    IN p_code_type VARCHAR(50),
    IN p_reset_date DATE,
    OUT p_result_code INT,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_affected_rows INT DEFAULT 0;

    START TRANSACTION;

    -- 这里可以添加重置逻辑，比如清理旧的编号记录等
    -- 实际实现时需要根据具体业务需求来处理

    -- 记录重置操作
    INSERT INTO code_sequence_log (
        code_type, 
        reset_date, 
        operation_type, 
        created_time, 
        created_by
    ) VALUES (
        p_code_type,
        p_reset_date,
        'RESET',
        NOW(),
        0  -- 系统操作
    );

    SET v_affected_rows = ROW_COUNT();

    IF v_affected_rows > 0 THEN
        COMMIT;
        SET p_result_code = 1;
        SET p_message = CONCAT('编码序号重置成功：', p_code_type);
    ELSE
        ROLLBACK;
        SET p_result_code = 0;
        SET p_message = CONCAT('编码序号重置失败：', p_code_type);
    END IF;

END$$

-- 编码验证存储过程
CREATE PROCEDURE `validate_code`(
    IN p_code VARCHAR(100),
    IN p_code_type VARCHAR(50),
    OUT p_is_valid BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_pattern VARCHAR(200);
    DECLARE v_table_name VARCHAR(50);
    DECLARE v_column_name VARCHAR(50);

    -- 初始化
    SET p_is_valid = FALSE;
    SET p_message = '';

    -- 根据编码类型确定验证表和字段
    CASE p_code_type
        WHEN 'PRODUCT' THEN 
            SET v_table_name = 'product';
            SET v_column_name = 'product_code';
            SET v_pattern = '^P[A-Z0-9]{2}[0-9]{5}$';
        WHEN 'CUSTOMER' THEN 
            SET v_table_name = 'customer';
            SET v_column_name = 'customer_code';
            SET v_pattern = '^C[P|C][0-9]{5}$';
        WHEN 'SUPPLIER' THEN 
            SET v_table_name = 'supplier';
            SET v_column_name = 'supplier_code';
            SET v_pattern = '^S[0-9]{5}$';
        WHEN 'SALES_ORDER' THEN 
            SET v_table_name = 'sales_order';
            SET v_column_name = 'order_no';
            SET v_pattern = '^SO[0-9]{8}[0-9]{4}$';
        WHEN 'PURCHASE_ORDER' THEN 
            SET v_table_name = 'purchase_order';
            SET v_column_name = 'order_no';
            SET v_pattern = '^PO[0-9]{8}[0-9]{4}$';
        ELSE 
            SET p_message = '不支持的编码类型';
            LEAVE;
    END CASE;

    -- 格式验证
    IF p_code NOT REGEXP v_pattern THEN
        SET p_message = '编码格式不正确';
        LEAVE;
    END IF;

    -- 唯一性验证
    SET @sql = CONCAT('SELECT COUNT(*) FROM ', v_table_name, ' WHERE ', v_column_name, ' = ? AND deleted = 0');
    PREPARE stmt FROM @sql;
    EXECUTE stmt USING p_code;
    DEALLOCATE PREPARE stmt;

    IF @count > 0 THEN
        SET p_message = '编码已存在';
        LEAVE;
    END IF;

    -- 验证通过
    SET p_is_valid = TRUE;
    SET p_message = '编码验证通过';

END$$

DELIMITER ;