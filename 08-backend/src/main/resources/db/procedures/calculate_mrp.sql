-- MRP计算存储过程
-- 物料需求计划计算
-- 创建时间：2024-11-27

DELIMITER $$

-- 主MRP计算存储过程
CREATE PROCEDURE `calculate_mrp`(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_product_ids TEXT,
    OUT p_result_code INT,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_error_count INT DEFAULT 0;
    DECLARE v_total_products INT DEFAULT 0;
    DECLARE v_processed_products INT DEFAULT 0;
    DECLARE v_current_product_id BIGINT;
    DECLARE v_done INT DEFAULT FALSE;
    
    -- 声明游标
    DECLARE product_cursor CURSOR FOR 
        SELECT id FROM product 
        WHERE (p_product_ids IS NULL OR FIND_IN_SET(id, p_product_ids) > 0)
        AND status = 1 AND deleted = 0;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION 
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @error_code = MYSQL_ERRNO, 
            @error_msg = MESSAGE_TEXT;
        SET v_error_count = v_error_count + 1;
        INSERT INTO sys_error_log (error_code, error_message, procedure_name, created_time) 
        VALUES (@error_code, @error_msg, 'calculate_mrp', NOW());
    END;

    -- 初始化结果
    SET p_result_code = 0;
    SET p_message = '开始MRP计算...';

    START TRANSACTION;

    -- 创建临时表存储计算结果
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_mrp_result (
        product_id BIGINT,
        requirement_date DATE,
        gross_requirement DECIMAL(15,4),
        on_hand_stock DECIMAL(15,4),
        scheduled_receipts DECIMAL(15,4),
        net_requirement DECIMAL(15,4),
        planned_order_receipt DECIMAL(15,4),
        planned_order_release DECIMAL(15,4),
        lead_time INT DEFAULT 1,
        lot_size_rule VARCHAR(20) DEFAULT 'LOT_FOR_LOT',
        created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- 获取产品总数
    SELECT COUNT(*) INTO v_total_products 
    FROM product 
    WHERE (p_product_ids IS NULL OR FIND_IN_SET(id, p_product_ids) > 0)
    AND status = 1 AND deleted = 0;

    -- 打开游标并开始计算
    OPEN product_cursor;
    
    read_loop: LOOP
        FETCH product_cursor INTO v_current_product_id;
        IF v_done THEN
            LEAVE read_loop;
        END IF;

        -- 调用单个产品MRP计算
        CALL calculate_product_mrp(v_current_product_id, p_start_date, p_end_date);
        
        SET v_processed_products = v_processed_products + 1;
        
        -- 记录处理进度
        INSERT INTO mrp_calculation_log (product_id, calculation_date, status, processed_time) 
        VALUES (v_current_product_id, CURDATE(), 'COMPLETED', NOW());
        
    END LOOP;
    
    CLOSE product_cursor;

    -- 检查是否有错误
    IF v_error_count > 0 THEN
        ROLLBACK;
        SET p_result_code = -1;
        SET p_message = CONCAT('MRP计算出现错误，错误数量：', v_error_count);
    ELSE
        -- 保存计算结果到正式表
        INSERT INTO mrp_calculation_result (
            product_id, requirement_date, gross_requirement, on_hand_stock,
            scheduled_receipts, net_requirement, planned_order_receipt, 
            planned_order_release, lead_time, lot_size_rule, created_time
        )
        SELECT * FROM temp_mrp_result;
        
        COMMIT;
        SET p_result_code = 1;
        SET p_message = CONCAT('MRP计算完成，处理产品数量：', v_processed_products, '/', v_total_products);
    END IF;

    -- 清理临时表
    DROP TEMPORARY TABLE IF EXISTS temp_mrp_result;

END$$

-- 单个产品MRP计算存储过程
CREATE PROCEDURE `calculate_product_mrp`(
    IN p_product_id BIGINT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    DECLARE v_current_date DATE;
    DECLARE v_on_hand_stock DECIMAL(15,4) DEFAULT 0;
    DECLARE v_gross_requirement DECIMAL(15,4) DEFAULT 0;
    DECLARE v_scheduled_receipts DECIMAL(15,4) DEFAULT 0;
    DECLARE v_net_requirement DECIMAL(15,4) DEFAULT 0;
    DECLARE v_planned_order_receipt DECIMAL(15,4) DEFAULT 0;
    DECLARE v_planned_order_release DECIMAL(15,4) DEFAULT 0;
    DECLARE v_lead_time INT DEFAULT 1;
    DECLARE v_min_stock DECIMAL(15,4) DEFAULT 0;
    DECLARE v_lot_size DECIMAL(15,4) DEFAULT 1;
    DECLARE v_running_stock DECIMAL(15,4) DEFAULT 0;

    -- 获取产品基础信息
    SELECT 
        COALESCE(p.min_stock, 0),
        1 -- 默认提前期1天，实际应该从产品或供应商表获取
    INTO v_min_stock, v_lead_time
    FROM product p 
    WHERE p.id = p_product_id;

    -- 获取期初库存
    SELECT COALESCE(SUM(on_hand_qty), 0) INTO v_running_stock
    FROM inventory i
    WHERE i.product_id = p_product_id;

    -- 按日期循环计算
    SET v_current_date = p_start_date;
    
    WHILE v_current_date <= p_end_date DO
        -- 计算毛需求（来自销售订单、生产订单等）
        SELECT COALESCE(SUM(soi.quantity), 0) INTO v_gross_requirement
        FROM sales_order_item soi
        JOIN sales_order so ON soi.order_id = so.id
        WHERE soi.product_id = p_product_id 
        AND so.delivery_date = v_current_date
        AND so.order_status IN (1, 2, 3) -- 待确认、已确认、生产中
        AND so.deleted = 0;

        -- 加上生产订单的原料需求
        SELECT v_gross_requirement + COALESCE(SUM(bom.quantity * pt.planned_quantity), 0) 
        INTO v_gross_requirement
        FROM production_task pt
        JOIN product_bom bom ON pt.product_id = bom.product_id
        WHERE bom.material_id = p_product_id
        AND pt.planned_start_date = v_current_date
        AND pt.task_status IN (1, 2) -- 待开始、进行中
        AND pt.deleted = 0;

        -- 计算计划入库（来自采购订单、生产计划等）
        SELECT COALESCE(SUM(poi.quantity - poi.received_quantity), 0) INTO v_scheduled_receipts
        FROM purchase_order_item poi
        JOIN purchase_order po ON poi.order_id = po.id
        WHERE poi.product_id = p_product_id
        AND po.expected_date = v_current_date
        AND po.order_status IN (2, 3) -- 已确认、部分到货
        AND po.deleted = 0;

        -- 加上生产计划的产出
        SELECT v_scheduled_receipts + COALESCE(SUM(pt.planned_quantity), 0)
        INTO v_scheduled_receipts
        FROM production_task pt
        WHERE pt.product_id = p_product_id
        AND pt.planned_end_date = v_current_date
        AND pt.task_status IN (1, 2) -- 待开始、进行中
        AND pt.deleted = 0;

        -- 计算库存余额
        SET v_running_stock = v_running_stock + v_scheduled_receipts - v_gross_requirement;

        -- 计算净需求
        IF v_running_stock < v_min_stock THEN
            SET v_net_requirement = v_min_stock - v_running_stock;
        ELSE
            SET v_net_requirement = 0;
        END IF;

        -- 确定计划订单收货量（批量规则处理）
        IF v_net_requirement > 0 THEN
            -- 简单的批量处理：向上取整到最小批量
            SET v_planned_order_receipt = CEILING(v_net_requirement / v_lot_size) * v_lot_size;
            SET v_running_stock = v_running_stock + v_planned_order_receipt;
        ELSE
            SET v_planned_order_receipt = 0;
        END IF;

        -- 计算计划订单发出量（考虑提前期）
        IF v_planned_order_receipt > 0 THEN
            SET v_planned_order_release = v_planned_order_receipt;
        ELSE
            SET v_planned_order_release = 0;
        END IF;

        -- 插入计算结果到临时表
        INSERT INTO temp_mrp_result (
            product_id, requirement_date, gross_requirement, on_hand_stock,
            scheduled_receipts, net_requirement, planned_order_receipt,
            planned_order_release, lead_time, created_time
        ) VALUES (
            p_product_id, v_current_date, v_gross_requirement, v_running_stock,
            v_scheduled_receipts, v_net_requirement, v_planned_order_receipt,
            v_planned_order_release, v_lead_time, NOW()
        );

        -- 移动到下一天
        SET v_current_date = DATE_ADD(v_current_date, INTERVAL 1 DAY);
    END WHILE;

END$$

-- MRP重新计算存储过程（清理旧数据并重新计算）
CREATE PROCEDURE `recalculate_mrp`(
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_product_ids TEXT,
    OUT p_result_code INT,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_delete_count INT DEFAULT 0;
    
    START TRANSACTION;
    
    -- 清理指定日期范围的旧MRP数据
    DELETE FROM mrp_calculation_result 
    WHERE requirement_date BETWEEN p_start_date AND p_end_date
    AND (p_product_ids IS NULL OR FIND_IN_SET(product_id, p_product_ids) > 0);
    
    SET v_delete_count = ROW_COUNT();
    
    -- 调用MRP计算
    CALL calculate_mrp(p_start_date, p_end_date, p_product_ids, p_result_code, p_message);
    
    IF p_result_code > 0 THEN
        COMMIT;
        SET p_message = CONCAT('MRP重新计算完成，清理旧数据：', v_delete_count, '行。', p_message);
    ELSE
        ROLLBACK;
        SET p_message = CONCAT('MRP重新计算失败：', p_message);
    END IF;
    
END$$

-- 获取MRP计算结果查询存储过程
CREATE PROCEDURE `get_mrp_results`(
    IN p_product_id BIGINT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        r.product_id,
        p.product_code,
        p.product_name,
        r.requirement_date,
        r.gross_requirement,
        r.on_hand_stock,
        r.scheduled_receipts,
        r.net_requirement,
        r.planned_order_receipt,
        r.planned_order_release,
        r.lead_time,
        r.lot_size_rule,
        r.created_time
    FROM mrp_calculation_result r
    JOIN product p ON r.product_id = p.id
    WHERE (p_product_id IS NULL OR r.product_id = p_product_id)
    AND r.requirement_date BETWEEN COALESCE(p_start_date, '1900-01-01') AND COALESCE(p_end_date, '2099-12-31')
    ORDER BY r.product_id, r.requirement_date;
END$$

-- MRP异常检查存储过程
CREATE PROCEDURE `check_mrp_exceptions`(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    -- 检查库存不足的情况
    SELECT 
        'STOCK_SHORTAGE' as exception_type,
        r.product_id,
        p.product_code,
        p.product_name,
        r.requirement_date,
        r.on_hand_stock,
        p.min_stock,
        (p.min_stock - r.on_hand_stock) as shortage_qty,
        '库存不足' as description
    FROM mrp_calculation_result r
    JOIN product p ON r.product_id = p.id
    WHERE r.requirement_date BETWEEN p_start_date AND p_end_date
    AND r.on_hand_stock < p.min_stock
    
    UNION ALL
    
    -- 检查计划订单数量过大的情况
    SELECT 
        'LARGE_PLANNED_ORDER' as exception_type,
        r.product_id,
        p.product_code,
        p.product_name,
        r.requirement_date,
        r.planned_order_receipt,
        p.max_stock,
        (r.planned_order_receipt - p.max_stock) as excess_qty,
        '计划订单量过大' as description
    FROM mrp_calculation_result r
    JOIN product p ON r.product_id = p.id
    WHERE r.requirement_date BETWEEN p_start_date AND p_end_date
    AND r.planned_order_receipt > p.max_stock
    
    ORDER BY product_id, requirement_date, exception_type;
END$$

DELIMITER ;