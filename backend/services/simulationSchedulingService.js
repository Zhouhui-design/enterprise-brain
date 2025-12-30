/**
 * 模拟排程列表服务
 * 销售订单模拟排程功能的核心服务
 */

const { query, executeTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * 生成模拟排程编号
 * 格式: SS + 年份 + 6位递增序号
 */
const generateSimulationNo = async () => {
  const year = new Date().getFullYear();
  const [countResult] = await query('SELECT COUNT(*) as count FROM simulation_scheduling_list WHERE YEAR(created_at) = ?', [year]);
  let baseCount = countResult[0].count + 1;
  return `SS${year}${String(baseCount).padStart(6, '0')}`;
};

/**
 * 生成序号（Excel行号）
 * 获取当前记录数 + 1
 */
const generateSequenceNumber = async () => {
  const [countResult] = await query('SELECT COUNT(*) as count FROM simulation_scheduling_list');
  return countResult[0].count + 1;
};

/**
 * 获取模拟排程列表（分页）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @param {string} params.search - 搜索关键词
 * @param {string} params.simulationStatus - 模拟排程状态筛选
 * @param {string} params.productCode - 产品编号筛选
 * @param {string} params.internalSalesOrderNo - 内部销售订单编号筛选
 * @returns {Promise<Object>} 分页结果
 */
const getSimulationSchedulingList = async (params) => {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    simulationStatus = '',
    productCode = '',
    internalSalesOrderNo = ''
  } = params;

  const pageInt = parseInt(page);
  const pageSizeInt = parseInt(pageSize);
  const offset = (pageInt - 1) * pageSizeInt;

  // 构建WHERE条件
  let whereConditions = [];
  let queryParams = [];

  if (search) {
    whereConditions.push(`(
      simulation_no LIKE ? OR
      internal_sales_order_no LIKE ? OR
      product_code LIKE ? OR
      product_name LIKE ? OR
      submitter LIKE ?
    )`);
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (simulationStatus) {
    whereConditions.push('simulation_status = ?');
    queryParams.push(simulationStatus);
  }

  if (productCode) {
    whereConditions.push('product_code LIKE ?');
    queryParams.push(`%${productCode}%`);
  }

  if (internalSalesOrderNo) {
    whereConditions.push('internal_sales_order_no LIKE ?');
    queryParams.push(`%${internalSalesOrderNo}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 获取总数
  const [countResult] = await query(
    `SELECT COUNT(*) as total FROM simulation_scheduling_list ${whereClause}`,
    queryParams
  );
  const total = countResult && countResult[0] ? countResult[0].total : 0;

  // 获取列表数据（按创建时间倒序，序号正序）
  // ⚠️ Windows MySQL 修复：LIMIT和OFFSET不能用占位符，必须直接拼接
  const [list] = await query(`
    SELECT * FROM simulation_scheduling_list 
    ${whereClause} 
    ORDER BY created_at DESC, sequence_number ASC 
    LIMIT ${pageSizeInt} OFFSET ${offset}
  `, queryParams);

  // 确保返回结构完整
  return {
    success: true,
    data: {
      list: list || [], // 确保list是数组
      total: total || 0, // 确保total有值
      page: pageInt,
      pageSize: pageSizeInt,
    }
  };
};

/**
 * 根据ID获取模拟排程详情
 * @param {string} id - 记录ID
 * @returns {Promise<Object>} 模拟排程详情
 */
const getSimulationSchedulingById = async (id) => {
  const [records] = await query(
    'SELECT * FROM simulation_scheduling_list WHERE id = ?',
    [id]
  );

  if (records.length === 0) {
    throw new Error('模拟排程记录不存在');
  }

  return {
    success: true,
    data: records[0]
  };
};

/**
 * 创建模拟排程记录
 * @param {Object} data - 模拟排程数据
 * @returns {Promise<Object>} 创建结果
 */
const createSimulationScheduling = async (data) => {
  const {
    orderStatus,
    internalSalesOrderNo,
    customerDeliveryDate,
    estimatedCompletionDate,
    productCode,
    productName,
    orderQuantity,
    realtimeInventory,
    effectiveInventory,
    suggestedReplenishmentQty,
    productSource,
    outputProcess,
    simulationStatus = '待开发',
    waitingNumber = 1,
    submitter = '待开发（缺少账号管理）'
  } = data;

  return await executeTransaction(async (connection) => {
    // 生成序号和模拟排程编号
    const sequenceNumber = await generateSequenceNumber();
    const simulationNo = await generateSimulationNo();

    const insertSql = `
      INSERT INTO simulation_scheduling_list (
        sequence_number,
        simulation_no,
        order_status,
        internal_sales_order_no,
        customer_delivery_date,
        estimated_completion_date,
        product_code,
        product_name,
        order_quantity,
        realtime_inventory,
        effective_inventory,
        suggested_replenishment_qty,
        product_source,
        output_process,
        simulation_status,
        waiting_number,
        submitter,
        submit_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(insertSql, [
      sequenceNumber,
      simulationNo,
      orderStatus,
      internalSalesOrderNo,
      customerDeliveryDate,
      estimatedCompletionDate,
      productCode,
      productName,
      orderQuantity,
      realtimeInventory,
      effectiveInventory,
      suggestedReplenishmentQty,
      productSource,
      outputProcess,
      simulationStatus,
      waitingNumber,
      submitter,
      new Date() // 提交时间
    ]);

    return {
      success: true,
      data: {
        id: result.insertId,
        sequenceNumber,
        simulationNo,
        message: '模拟排程记录创建成功'
      }
    };
  });
};

/**
 * 更新模拟排程记录
 * @param {string} id - 记录ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新结果
 */
const updateSimulationScheduling = async (id, data) => {
  const {
    orderStatus,
    customerDeliveryDate,
    estimatedCompletionDate,
    productCode,
    productName,
    orderQuantity,
    realtimeInventory,
    effectiveInventory,
    suggestedReplenishmentQty,
    productSource,
    outputProcess,
    simulationStatus,
    waitingNumber,
    submitter
  } = data;

  return await executeTransaction(async (connection) => {
    // 检查记录是否存在
    const [existingRecords] = await connection.execute(
      'SELECT id FROM simulation_scheduling_list WHERE id = ?',
      [id]
    );

    if (existingRecords.length === 0) {
      throw new Error('模拟排程记录不存在');
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (orderStatus !== undefined) {
      updateFields.push('order_status = ?');
      updateValues.push(orderStatus);
    }
    if (customerDeliveryDate !== undefined) {
      updateFields.push('customer_delivery_date = ?');
      updateValues.push(customerDeliveryDate);
    }
    if (estimatedCompletionDate !== undefined) {
      updateFields.push('estimated_completion_date = ?');
      updateValues.push(estimatedCompletionDate);
    }
    if (productCode !== undefined) {
      updateFields.push('product_code = ?');
      updateValues.push(productCode);
    }
    if (productName !== undefined) {
      updateFields.push('product_name = ?');
      updateValues.push(productName);
    }
    if (orderQuantity !== undefined) {
      updateFields.push('order_quantity = ?');
      updateValues.push(orderQuantity);
    }
    if (realtimeInventory !== undefined) {
      updateFields.push('realtime_inventory = ?');
      updateValues.push(realtimeInventory);
    }
    if (effectiveInventory !== undefined) {
      updateFields.push('effective_inventory = ?');
      updateValues.push(effectiveInventory);
    }
    if (suggestedReplenishmentQty !== undefined) {
      updateFields.push('suggested_replenishment_qty = ?');
      updateValues.push(suggestedReplenishmentQty);
    }
    if (productSource !== undefined) {
      updateFields.push('product_source = ?');
      updateValues.push(productSource);
    }
    if (outputProcess !== undefined) {
      updateFields.push('output_process = ?');
      updateValues.push(outputProcess);
    }
    if (simulationStatus !== undefined) {
      updateFields.push('simulation_status = ?');
      updateValues.push(simulationStatus);
    }
    if (waitingNumber !== undefined) {
      updateFields.push('waiting_number = ?');
      updateValues.push(waitingNumber);
    }
    if (submitter !== undefined) {
      updateFields.push('submitter = ?');
      updateValues.push(submitter);
    }

    if (updateFields.length === 0) {
      throw new Error('没有提供要更新的字段');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const updateSql = `
      UPDATE simulation_scheduling_list 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    await connection.execute(updateSql, updateValues);

    return {
      success: true,
      data: {
        message: '模拟排程记录更新成功'
      }
    };
  });
};

/**
 * 删除模拟排程记录
 * @param {string} id - 记录ID
 * @returns {Promise<Object>} 删除结果
 */
const deleteSimulationScheduling = async (id) => {
  return await executeTransaction(async (connection) => {
    // 检查记录是否存在
    const [existingRecords] = await connection.execute(
      'SELECT id, simulation_no FROM simulation_scheduling_list WHERE id = ?',
      [id]
    );

    if (existingRecords.length === 0) {
      throw new Error('模拟排程记录不存在');
    }

    // 删除记录
    await connection.execute(
      'DELETE FROM simulation_scheduling_list WHERE id = ?',
      [id]
    );

    return {
      success: true,
      data: {
        simulationNo: existingRecords[0].simulation_no,
        message: '模拟排程记录删除成功'
      }
    };
  });
};

/**
 * 批量删除模拟排程记录
 * @param {Array<string>} ids - 记录ID数组
 * @returns {Promise<Object>} 删除结果
 */
const batchDeleteSimulationScheduling = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('请提供要删除的记录ID');
  }

  return await executeTransaction(async (connection) => {
    // 检查记录是否存在
    const placeholders = ids.map(() => '?').join(',');
    const [existingRecords] = await connection.execute(
      `SELECT id, simulation_no FROM simulation_scheduling_list WHERE id IN (${placeholders})`,
      ids
    );

    if (existingRecords.length === 0) {
      throw new Error('没有找到要删除的模拟排程记录');
    }

    // 删除记录
    await connection.execute(
      `DELETE FROM simulation_scheduling_list WHERE id IN (${placeholders})`,
      ids
    );

    return {
      success: true,
      data: {
        deletedCount: existingRecords.length,
        deletedRecords: existingRecords.map(record => ({
          id: record.id,
          simulationNo: record.simulation_no
        })),
        message: `成功删除 ${existingRecords.length} 条模拟排程记录`
      }
    };
  });
};

/**
 * 从销售订单推送数据到模拟排程列表
 * @param {Array<string>} salesOrderIds - 销售订单ID数组
 * @returns {Promise<Object>} 推送结果
 */
const pushFromSalesOrders = async (salesOrderIds) => {
  if (!Array.isArray(salesOrderIds) || salesOrderIds.length === 0) {
    throw new Error('请选择要推送的销售订单');
  }

  return await executeTransaction(async (connection) => {
    // 1. 查询选中的销售订单数据
    const placeholders = salesOrderIds.map(() => '?').join(',');
    const [salesOrders] = await connection.execute(
      `SELECT 
        so.id,
        so.order_number,
        so.status as order_status,
        so.created_at as customer_delivery,
        sop.product_code,
        sop.product_name,
        sop.order_quantity,
        sop.output_process,
        sop.product_source
      FROM sales_orders so
      LEFT JOIN sales_order_products sop ON so.id = sop.order_id
      WHERE so.id IN (${placeholders})
      ORDER BY so.created_at DESC`,
      salesOrderIds
    );

    if (salesOrders.length === 0) {
      throw new Error('没有找到选中的销售订单');
    }

    // 检查是否已存在相同的销售订单编号
    const internalOrderNos = salesOrders.map(order => order.order_number);
    const checkPlaceholders = internalOrderNos.map(() => '?').join(',');
    const [existingRecords] = await connection.execute(
      `SELECT internal_sales_order_no, simulation_no 
       FROM simulation_scheduling_list 
       WHERE internal_sales_order_no IN (${checkPlaceholders})`,
      internalOrderNos
    );

    if (existingRecords.length > 0) {
      const existingOrders = existingRecords.map(record => 
        `订单号: ${record.internal_sales_order_no} (模拟排程号: ${record.simulation_no})`
      ).join(', ');
      throw new Error(`以下销售订单已存在于模拟排程列表中: ${existingOrders}`);
    }

    // 2. 批量插入模拟排程列表
    const insertResults = [];
    let currentSequenceNumber = await generateSequenceNumber();

    for (const salesOrder of salesOrders) {
      const simulationNo = await generateSimulationNo();
      
      // 计算实时库存、有效库存、建议补货数量
      // 这里需要根据实际业务逻辑计算，暂时使用默认值
      const realtimeInventory = 0; // 需要从库存表查询
      const effectiveInventory = 0; // 需要计算
      const suggestedReplenishmentQty = 0; // 需要计算

      const [result] = await connection.execute(`
        INSERT INTO simulation_scheduling_list (
          sequence_number,
          simulation_no,
          order_status,
          internal_sales_order_no,
          customer_delivery_date,
          estimated_completion_date,
          product_code,
          product_name,
          order_quantity,
          realtime_inventory,
          effective_inventory,
          suggested_replenishment_qty,
          product_source,
          output_process,
          simulation_status,
          waiting_number,
          submitter,
          submit_time
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        currentSequenceNumber++,
        simulationNo,
        salesOrder.order_status,
        salesOrder.order_number,
        salesOrder.customer_delivery,
        null, // 预计完成日期暂时为空
        salesOrder.product_code,
        salesOrder.product_name,
        salesOrder.order_quantity,
        realtimeInventory,
        effectiveInventory,
        suggestedReplenishmentQty,
        salesOrder.product_source || '自制',
        salesOrder.output_process || '组装',
        '待开发',
        1,
        '待开发（缺少账号管理）',
        new Date() // 提交时间
      ]);

      insertResults.push({
        salesOrderId: salesOrder.id,
        internalOrderNo: salesOrder.order_number,
        simulationId: result.insertId,
        simulationNo,
        sequenceNumber: currentSequenceNumber - 1
      });
    }

    return {
      success: true,
      data: {
        pushedCount: salesOrders.length,
        insertResults,
        message: `成功推送 ${salesOrders.length} 条销售订单到模拟排程列表`
      }
    };
  });
};

/**
 * 获取模拟排程统计信息
 * @returns {Promise<Object>} 统计信息
 */
const getSimulationSchedulingStats = async () => {
  const [stats] = await query(`
    SELECT 
      COUNT(*) as totalCount,
      SUM(CASE WHEN simulation_status = '待开发' THEN 1 ELSE 0 END) as pendingCount,
      SUM(CASE WHEN simulation_status = '进行中' THEN 1 ELSE 0 END) as inProgressCount,
      SUM(CASE WHEN simulation_status = '已完成' THEN 1 ELSE 0 END) as completedCount,
      SUM(order_quantity) as totalOrderQuantity
    FROM simulation_scheduling_list
  `);

  return {
    success: true,
    data: stats[0]
  };
};

module.exports = {
  getSimulationSchedulingList,
  getSimulationSchedulingById,
  createSimulationScheduling,
  updateSimulationScheduling,
  deleteSimulationScheduling,
  batchDeleteSimulationScheduling,
  pushFromSalesOrders,
  getSimulationSchedulingStats
};