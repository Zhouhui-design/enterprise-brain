-- 数据清理存储过程
-- 系统数据清理和维护
-- 创建时间：2024-11-27

DELIMITER $$

-- 主数据清理存储过程
CREATE PROCEDURE `data_cleanup`(
    IN p_cleanup_type VARCHAR(50),       -- 清理类型
    IN p_days_to_keep INT,               -- 保留天数
    IN p_batch_size INT DEFAULT 1000,    -- 批处理大小
    OUT p_result_code INT,               -- 结果代码
    OUT p_message VARCHAR(1000)          -- 结果消息
)
BEGIN
    DECLARE v_total_deleted INT DEFAULT 0;
    DECLARE v_current_batch INT DEFAULT 0;
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_cleanup_date DATETIME;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @error_code = MYSQL_ERRNO, 
            @error_msg = MESSAGE_TEXT;
        SET v_error_count = v_error_count + 1;
        INSERT INTO cleanup_error_log (cleanup_type, error_code, error_message, created_time) 
        VALUES (p_cleanup_type, @error_code, @error_msg, NOW());
    END;

    -- 初始化
    SET p_result_code = 0;
    SET p_message = '';
    SET v_cleanup_date = DATE_SUB(NOW(), INTERVAL p_days_to_keep DAY);

    START TRANSACTION;

    -- 记录清理开始
    INSERT INTO cleanup_log (cleanup_type, cleanup_date, days_to_keep, status, start_time) 
    VALUES (p_cleanup_type, v_cleanup_date, p_days_to_keep, 'STARTED', NOW());
    
    SET @cleanup_log_id = LAST_INSERT_ID();

    -- 根据清理类型执行相应的清理操作
    CASE p_cleanup_type
        WHEN 'API_LOGS' THEN
            CALL cleanup_api_logs(v_cleanup_date, p_batch_size, v_total_deleted);
            
        WHEN 'AUDIT_LOGS' THEN
            CALL cleanup_audit_logs(v_cleanup_date, p_batch_size, v_total_deleted);
            
        WHEN 'TEMP_FILES' THEN
            CALL cleanup_temp_files(v_cleanup_date, p_batch_size, v_total_deleted);
            
        WHEN 'DELETED_RECORDS' THEN
            CALL cleanup_deleted_records(v_cleanup_date, p_batch_size, v_total_deleted);
            
        WHEN 'ERROR_LOGS' THEN
            CALL cleanup_error_logs(v_cleanup_date, p_batch_size, v_total_deleted);
            
        WHEN 'SESSION_DATA' THEN
            CALL cleanup_session_data(v_cleanup_date, p_batch_size, v_total_deleted);
            
        WHEN 'CACHE_DATA' THEN
            CALL cleanup_cache_data(v_cleanup_date, p_batch_size, v_total_deleted);
            
        WHEN 'ALL' THEN
            -- 执行所有清理
            CALL cleanup_api_logs(v_cleanup_date, p_batch_size, v_current_batch);
            SET v_total_deleted = v_total_deleted + v_current_batch;
            
            CALL cleanup_audit_logs(v_cleanup_date, p_batch_size, v_current_batch);
            SET v_total_deleted = v_total_deleted + v_current_batch;
            
            CALL cleanup_temp_files(v_cleanup_date, p_batch_size, v_current_batch);
            SET v_total_deleted = v_total_deleted + v_current_batch;
            
            CALL cleanup_deleted_records(v_cleanup_date, p_batch_size, v_current_batch);
            SET v_total_deleted = v_total_deleted + v_current_batch;
            
            CALL cleanup_error_logs(v_cleanup_date, p_batch_size, v_current_batch);
            SET v_total_deleted = v_total_deleted + v_current_batch;
            
        ELSE
            SET p_result_code = -1;
            SET p_message = CONCAT('不支持的清理类型: ', p_cleanup_type);
            ROLLBACK;
            LEAVE;
    END CASE;

    -- 检查是否有错误
    IF v_error_count > 0 THEN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_message = CONCAT('数据清理出现错误，错误数量: ', v_error_count);
    ELSE
        -- 更新清理日志
        UPDATE cleanup_log 
        SET status = 'COMPLETED', 
            end_time = NOW(), 
            deleted_count = v_total_deleted 
        WHERE id = @cleanup_log_id;
        
        COMMIT;
        SET p_result_code = 1;
        SET p_message = CONCAT('数据清理完成，清理类型: ', p_cleanup_type, 
                              '，删除记录数: ', v_total_deleted);
    END IF;

END$$

-- API调用日志清理
CREATE PROCEDURE `cleanup_api_logs`(
    IN p_cleanup_date DATETIME,
    IN p_batch_size INT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_batch_deleted INT DEFAULT 0;
    SET p_deleted_count = 0;

    REPEAT
        DELETE FROM api_call_log 
        WHERE call_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        -- 避免长时间锁表
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

END$$

-- 审计日志清理
CREATE PROCEDURE `cleanup_audit_logs`(
    IN p_cleanup_date DATETIME,
    IN p_batch_size INT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_batch_deleted INT DEFAULT 0;
    SET p_deleted_count = 0;

    REPEAT
        DELETE FROM sys_audit_log 
        WHERE operation_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 同时清理数据变更记录
    REPEAT
        DELETE FROM sys_data_change_record 
        WHERE change_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

END$$

-- 临时文件清理
CREATE PROCEDURE `cleanup_temp_files`(
    IN p_cleanup_date DATETIME,
    IN p_batch_size INT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_batch_deleted INT DEFAULT 0;
    SET p_deleted_count = 0;

    REPEAT
        DELETE FROM file_record 
        WHERE created_time < p_cleanup_date 
        AND business_type = 'TEMP'
        AND upload_status IN (1, 3) -- 上传中或失败的临时文件
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理过期的文件记录
    REPEAT
        DELETE FROM file_record 
        WHERE expire_time IS NOT NULL 
        AND expire_time < NOW()
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

END$$

-- 逻辑删除记录清理
CREATE PROCEDURE `cleanup_deleted_records`(
    IN p_cleanup_date DATETIME,
    IN p_batch_size INT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_batch_deleted INT DEFAULT 0;
    SET p_deleted_count = 0;

    -- 清理产品删除记录
    REPEAT
        DELETE FROM product 
        WHERE deleted = 1 
        AND updated_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理客户删除记录
    REPEAT
        DELETE FROM customer 
        WHERE deleted = 1 
        AND updated_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理供应商删除记录
    REPEAT
        DELETE FROM supplier 
        WHERE deleted = 1 
        AND updated_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理订单删除记录
    REPEAT
        DELETE FROM sales_order 
        WHERE deleted = 1 
        AND updated_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

END$$

-- 错误日志清理
CREATE PROCEDURE `cleanup_error_logs`(
    IN p_cleanup_date DATETIME,
    IN p_batch_size INT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_batch_deleted INT DEFAULT 0;
    SET p_deleted_count = 0;

    -- 清理系统错误日志
    REPEAT
        DELETE FROM sys_error_log 
        WHERE created_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理清理过程的错误日志
    REPEAT
        DELETE FROM cleanup_error_log 
        WHERE created_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

END$$

-- 会话数据清理
CREATE PROCEDURE `cleanup_session_data`(
    IN p_cleanup_date DATETIME,
    IN p_batch_size INT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_batch_deleted INT DEFAULT 0;
    SET p_deleted_count = 0;

    -- 清理过期的聊天会话
    REPEAT
        DELETE FROM chat_session 
        WHERE session_status = 3  -- 结束状态
        AND end_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理对应的聊天消息
    REPEAT
        DELETE cm FROM chat_message cm
        WHERE NOT EXISTS (
            SELECT 1 FROM chat_session cs 
            WHERE cs.id = cm.session_id
        )
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

END$$

-- 缓存数据清理
CREATE PROCEDURE `cleanup_cache_data`(
    IN p_cleanup_date DATETIME,
    IN p_batch_size INT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_batch_deleted INT DEFAULT 0;
    SET p_deleted_count = 0;

    -- 清理算法执行记录
    REPEAT
        DELETE FROM algorithm_execution 
        WHERE execution_time < p_cleanup_date 
        AND execution_status IN (1, 2) -- 成功或失败的记录
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理报表执行历史
    REPEAT
        DELETE FROM report_execution 
        WHERE execution_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

    -- 清理AI推理调用记录
    REPEAT
        DELETE FROM ai_inference_log 
        WHERE request_time < p_cleanup_date 
        LIMIT p_batch_size;
        
        SET v_batch_deleted = ROW_COUNT();
        SET p_deleted_count = p_deleted_count + v_batch_deleted;
        
        IF v_batch_deleted > 0 THEN
            COMMIT;
            START TRANSACTION;
        END IF;
        
    UNTIL v_batch_deleted = 0 END REPEAT;

END$$

-- 数据库优化存储过程
CREATE PROCEDURE `optimize_database`(
    OUT p_result_code INT,
    OUT p_message VARCHAR(1000)
)
BEGIN
    DECLARE v_table_count INT DEFAULT 0;
    DECLARE v_optimized_count INT DEFAULT 0;
    DECLARE v_table_name VARCHAR(100);
    DECLARE v_done INT DEFAULT FALSE;
    DECLARE v_sql TEXT;
    
    DECLARE table_cursor CURSOR FOR 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_type = 'BASE TABLE';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

    SET p_result_code = 0;
    SET p_message = '';

    -- 开始优化
    INSERT INTO cleanup_log (cleanup_type, status, start_time) 
    VALUES ('DATABASE_OPTIMIZE', 'STARTED', NOW());
    
    SET @optimize_log_id = LAST_INSERT_ID();

    OPEN table_cursor;
    
    read_loop: LOOP
        FETCH table_cursor INTO v_table_name;
        IF v_done THEN
            LEAVE read_loop;
        END IF;
        
        SET v_table_count = v_table_count + 1;
        
        -- 优化表
        SET v_sql = CONCAT('OPTIMIZE TABLE ', v_table_name);
        SET @sql = v_sql;
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
        SET v_optimized_count = v_optimized_count + 1;
        
    END LOOP;
    
    CLOSE table_cursor;

    -- 更新优化日志
    UPDATE cleanup_log 
    SET status = 'COMPLETED', 
        end_time = NOW(),
        deleted_count = v_optimized_count
    WHERE id = @optimize_log_id;

    SET p_result_code = 1;
    SET p_message = CONCAT('数据库优化完成，优化表数量: ', v_optimized_count, '/', v_table_count);

END$$

-- 清理统计存储过程
CREATE PROCEDURE `get_cleanup_statistics`(
    IN p_days INT DEFAULT 30
)
BEGIN
    SELECT 
        cleanup_type,
        COUNT(*) as cleanup_count,
        SUM(deleted_count) as total_deleted,
        AVG(deleted_count) as avg_deleted,
        MAX(deleted_count) as max_deleted,
        MIN(start_time) as first_cleanup,
        MAX(end_time) as last_cleanup
    FROM cleanup_log 
    WHERE start_time >= DATE_SUB(NOW(), INTERVAL p_days DAY)
    AND status = 'COMPLETED'
    GROUP BY cleanup_type
    ORDER BY total_deleted DESC;
END$$

DELIMITER ;