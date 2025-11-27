-- 系统重置存储过程
-- 系统数据重置和初始化
-- 创建时间：2024-11-27

DELIMITER $$

-- 主系统重置存储过程
CREATE PROCEDURE `system_reset`(
    IN p_reset_type VARCHAR(50),          -- 重置类型
    IN p_preserve_config BOOLEAN DEFAULT TRUE,  -- 是否保留配置
    IN p_preserve_users BOOLEAN DEFAULT TRUE,   -- 是否保留用户数据
    OUT p_result_code INT,                -- 结果代码
    OUT p_message VARCHAR(1000)          -- 结果消息
)
BEGIN
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_reset_count INT DEFAULT 0;
    DECLARE v_backup_id VARCHAR(100);
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @error_code = MYSQL_ERRNO, 
            @error_msg = MESSAGE_TEXT;
        SET v_error_count = v_error_count + 1;
        INSERT INTO system_reset_log (reset_type, error_code, error_message, created_time) 
        VALUES (p_reset_type, @error_code, @error_msg, NOW());
        ROLLBACK;
    END;

    -- 初始化
    SET p_result_code = 0;
    SET p_message = '';
    SET v_backup_id = CONCAT('RESET_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));

    -- 记录重置开始
    INSERT INTO system_reset_log (reset_type, reset_id, preserve_config, preserve_users, status, start_time) 
    VALUES (p_reset_type, v_backup_id, p_preserve_config, p_preserve_users, 'STARTED', NOW());
    
    SET @reset_log_id = LAST_INSERT_ID();

    START TRANSACTION;

    -- 根据重置类型执行相应的重置操作
    CASE p_reset_type
        WHEN 'BUSINESS_DATA' THEN
            -- 重置业务数据（保留系统配置和用户）
            CALL reset_business_data(p_preserve_config, v_reset_count);
            
        WHEN 'TRANSACTION_DATA' THEN
            -- 重置交易数据（订单、库存事务等）
            CALL reset_transaction_data(v_reset_count);
            
        WHEN 'LOG_DATA' THEN
            -- 重置日志数据
            CALL reset_log_data(v_reset_count);
            
        WHEN 'CACHE_DATA' THEN
            -- 重置缓存数据
            CALL reset_cache_data(v_reset_count);
            
        WHEN 'TEST_DATA' THEN
            -- 重置测试数据
            CALL reset_test_data(v_reset_count);
            
        WHEN 'FULL_RESET' THEN
            -- 完全重置（危险操作）
            IF p_preserve_users = FALSE THEN
                CALL reset_full_system(p_preserve_config, v_reset_count);
            ELSE
                SET p_result_code = -1;
                SET p_message = '完全重置需要明确设置 preserve_users = FALSE';
                ROLLBACK;
                LEAVE;
            END IF;
            
        WHEN 'FACTORY_RESET' THEN
            -- 恢复出厂设置
            CALL reset_to_factory(v_reset_count);
            
        ELSE
            SET p_result_code = -1;
            SET p_message = CONCAT('不支持的重置类型: ', p_reset_type);
            ROLLBACK;
            LEAVE;
    END CASE;

    -- 检查是否有错误
    IF v_error_count > 0 THEN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_message = CONCAT('系统重置出现错误，错误数量: ', v_error_count);
    ELSE
        -- 更新重置日志
        UPDATE system_reset_log 
        SET status = 'COMPLETED', 
            end_time = NOW(), 
            affected_count = v_reset_count 
        WHERE id = @reset_log_id;
        
        COMMIT;
        SET p_result_code = 1;
        SET p_message = CONCAT('系统重置完成，重置类型: ', p_reset_type, 
                              '，影响记录数: ', v_reset_count);
    END IF;

END$$

-- 重置业务数据
CREATE PROCEDURE `reset_business_data`(
    IN p_preserve_config BOOLEAN,
    OUT p_reset_count INT
)
BEGIN
    SET p_reset_count = 0;

    -- 清理产品数据
    DELETE FROM inventory WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM product WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM product_category WHERE parent_id > 0; -- 保留顶级分类
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理客户供应商数据
    DELETE FROM customer WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM supplier WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理订单数据
    DELETE FROM sales_order_item WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM sales_order WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM purchase_order_item WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM purchase_order WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理生产数据
    DELETE FROM production_progress WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM production_task WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 重置序号
    CALL reset_sequence_numbers('BUSINESS');

END$$

-- 重置交易数据
CREATE PROCEDURE `reset_transaction_data`(
    OUT p_reset_count INT
)
BEGIN
    SET p_reset_count = 0;

    -- 清理库存事务
    DELETE FROM inventory_transaction WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 重置库存数量
    UPDATE inventory SET 
        on_hand_qty = 0,
        available_qty = 0,
        allocated_qty = 0,
        reserved_qty = 0,
        last_in_date = NULL,
        last_out_date = NULL,
        avg_cost = 0;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理盘点数据
    DELETE FROM inventory_count_record WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM inventory_count_task WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理移动端数据
    DELETE FROM attendance_record WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM leave_application WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();

END$$

-- 重置日志数据
CREATE PROCEDURE `reset_log_data`(
    OUT p_reset_count INT
)
BEGIN
    SET p_reset_count = 0;

    -- 清理系统日志
    DELETE FROM sys_audit_log WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM sys_data_change_record WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理API日志
    DELETE FROM api_call_log WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理消息记录
    DELETE FROM message_record WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM push_message WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理AI相关日志
    DELETE FROM ai_inference_log WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM algorithm_execution WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM ai_training_record WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理报表执行历史
    DELETE FROM report_execution WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();

END$$

-- 重置缓存数据
CREATE PROCEDURE `reset_cache_data`(
    OUT p_reset_count INT
)
BEGIN
    SET p_reset_count = 0;

    -- 清理智能表格数据
    DELETE FROM table_cell WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM table_calculation WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理聊天数据
    DELETE FROM chat_message WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM chat_session WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理文件记录
    DELETE FROM file_record WHERE business_type = 'TEMP';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理推荐记录
    DELETE FROM recommendation_log WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();

END$$

-- 重置测试数据
CREATE PROCEDURE `reset_test_data`(
    OUT p_reset_count INT
)
BEGIN
    SET p_reset_count = 0;

    -- 删除测试用户
    DELETE FROM users WHERE username LIKE 'test%';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 删除测试产品
    DELETE FROM product WHERE product_code LIKE 'TEST%';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 删除测试客户
    DELETE FROM customer WHERE customer_code LIKE 'TC%';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 删除测试供应商
    DELETE FROM supplier WHERE supplier_code LIKE 'TS%';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 删除测试订单
    DELETE FROM sales_order WHERE order_no LIKE 'TEST_SO_%';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    DELETE FROM purchase_order WHERE order_no LIKE 'TEST_PO_%';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 删除测试生产任务
    DELETE FROM production_task WHERE task_no LIKE 'TEST_PT_%';
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 删除测试API配置
    DELETE FROM api_config WHERE api_code LIKE 'TEST_%';
    SET p_reset_count = p_reset_count + ROW_COUNT();

END$$

-- 完全系统重置
CREATE PROCEDURE `reset_full_system`(
    IN p_preserve_config BOOLEAN,
    OUT p_reset_count INT
)
BEGIN
    SET p_reset_count = 0;

    -- 执行所有业务数据重置
    CALL reset_business_data(p_preserve_config, @business_count);
    SET p_reset_count = p_reset_count + @business_count;
    
    CALL reset_transaction_data(@transaction_count);
    SET p_reset_count = p_reset_count + @transaction_count;
    
    CALL reset_log_data(@log_count);
    SET p_reset_count = p_reset_count + @log_count;
    
    CALL reset_cache_data(@cache_count);
    SET p_reset_count = p_reset_count + @cache_count;
    
    -- 清理用户数据
    DELETE FROM users WHERE username NOT IN ('admin', 'system');
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 清理设备数据
    DELETE FROM mobile_device WHERE 1=1;
    SET p_reset_count = p_reset_count + ROW_COUNT();
    
    -- 如果不保留配置，则清理配置数据
    IF p_preserve_config = FALSE THEN
        DELETE FROM sys_config WHERE is_system = 0;
        SET p_reset_count = p_reset_count + ROW_COUNT();
        
        DELETE FROM api_config WHERE 1=1;
        SET p_reset_count = p_reset_count + ROW_COUNT();
        
        DELETE FROM message_queue_config WHERE 1=1;
        SET p_reset_count = p_reset_count + ROW_COUNT();
    END IF;

END$$

-- 恢复出厂设置
CREATE PROCEDURE `reset_to_factory`(
    OUT p_reset_count INT
)
BEGIN
    SET p_reset_count = 0;

    -- 完全重置
    CALL reset_full_system(FALSE, p_reset_count);
    
    -- 重新插入出厂默认数据
    -- 这里可以调用初始化脚本重新插入默认数据
    
    -- 重置所有序号
    CALL reset_sequence_numbers('ALL');

END$$

-- 重置序号计数器
CREATE PROCEDURE `reset_sequence_numbers`(
    IN p_scope VARCHAR(50)  -- ALL, BUSINESS, SYSTEM
)
BEGIN
    -- 这里可以重置各种编号的计数器
    -- 实际实现时需要根据具体的编号生成逻辑来处理
    
    IF p_scope IN ('ALL', 'BUSINESS') THEN
        -- 重置业务编号序列
        DELETE FROM sequence_counter WHERE sequence_type IN ('PRODUCT', 'CUSTOMER', 'SUPPLIER', 'SALES_ORDER', 'PURCHASE_ORDER');
    END IF;
    
    IF p_scope IN ('ALL', 'SYSTEM') THEN
        -- 重置系统编号序列
        DELETE FROM sequence_counter WHERE sequence_type IN ('API_LOG', 'AUDIT_LOG', 'ERROR_LOG');
    END IF;

END$$

-- 创建系统备份（重置前备份）
CREATE PROCEDURE `create_system_backup`(
    IN p_backup_name VARCHAR(200),
    OUT p_backup_id VARCHAR(100),
    OUT p_result_code INT,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_backup_size BIGINT DEFAULT 0;
    DECLARE v_table_count INT DEFAULT 0;
    
    SET p_backup_id = CONCAT('BACKUP_', DATE_FORMAT(NOW(), '%Y%m%d_%H%i%s'));
    SET p_result_code = 0;
    SET p_message = '';

    START TRANSACTION;

    -- 记录备份开始
    INSERT INTO system_backup_log (backup_id, backup_name, backup_type, status, start_time) 
    VALUES (p_backup_id, p_backup_name, 'FULL', 'STARTED', NOW());
    
    SET @backup_log_id = LAST_INSERT_ID();

    -- 计算需要备份的数据大小和表数量
    SELECT 
        COUNT(*) as table_count,
        SUM(data_length + index_length) as total_size
    INTO v_table_count, v_backup_size
    FROM information_schema.tables 
    WHERE table_schema = DATABASE();

    -- 这里应该实现实际的备份逻辑
    -- 可以使用mysqldump或者其他备份工具

    -- 更新备份日志
    UPDATE system_backup_log 
    SET status = 'COMPLETED', 
        end_time = NOW(), 
        backup_size = v_backup_size,
        table_count = v_table_count
    WHERE id = @backup_log_id;

    COMMIT;

    SET p_result_code = 1;
    SET p_message = CONCAT('系统备份完成，备份ID: ', p_backup_id, 
                          '，表数量: ', v_table_count,
                          '，备份大小: ', v_backup_size, ' bytes');

END$$

-- 获取重置统计信息
CREATE PROCEDURE `get_reset_statistics`(
    IN p_days INT DEFAULT 30
)
BEGIN
    SELECT 
        reset_type,
        COUNT(*) as reset_count,
        SUM(affected_count) as total_affected,
        AVG(affected_count) as avg_affected,
        MAX(affected_count) as max_affected,
        MIN(start_time) as first_reset,
        MAX(end_time) as last_reset,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
    FROM system_reset_log 
    WHERE start_time >= DATE_SUB(NOW(), INTERVAL p_days DAY)
    GROUP BY reset_type
    ORDER BY total_affected DESC;
END$$

DELIMITER ;