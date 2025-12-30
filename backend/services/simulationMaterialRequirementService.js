/**
 * 模拟物料需求明细服务
 * 基于模拟排程列表数据，通过复杂的跨表查询和计算逻辑，自动生成详细的物料需求明细
 */

const { query, executeTransaction } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crossTableQueryService = require('./crossTableQueryService');

/**
 * 计算模拟物料需求明细
 * @param {Array<string>} simulationIds - 模拟排程ID数组
 * @returns {Promise<Object>} 计算结果
 */
const calculateMaterialRequirements = async (simulationIds) => {
  if (!Array.isArray(simulationIds) || simulationIds.length === 0) {
    return { success: true, data: { calculatedCount: 0 } };
  }

  return await executeTransaction(async (connection) => {
    // 1. 获取满足触发条件的模拟排程数据
    const simulations = await getTriggeredSimulations(connection, simulationIds);
    
    if (simulations.length === 0) {
      console.log('📋 没有满足触发条件的模拟排程数据');
      return { success: true, data: { calculatedCount: 0 } };
    }

    console.log(`📋 开始计算 ${simulations.length} 个模拟排程的物料需求`);

    // 2. 删除旧的需求数据
    await deleteOldRequirements(connection, simulations);

    // 3. 对每个模拟排程计算物料需求
    const allRequirements = [];
    let sequenceNumber = 1;

    for (const simulation of simulations) {
      try {
        const requirements = await calculateSingleSimulationRequirements(
          connection, 
          simulation, 
          sequenceNumber
        );
        
        allRequirements.push(...requirements);
        sequenceNumber += requirements.length;

        console.log(`✅ 模拟排程 ${simulation.simulation_no} 计算完成，生成 ${requirements.length} 条需求明细`);
      } catch (error) {
        console.error(`❌ 模拟排程 ${simulation.simulation_no} 计算失败:`, error.message);
        // 继续处理其他模拟排程，不中断整个计算过程
      }
    }

    // 4. 批量插入计算结果
    if (allRequirements.length > 0) {
      await insertRequirements(connection, allRequirements);
      console.log(`✅ 总计插入 ${allRequirements.length} 条物料需求明细`);
    }

    return {
      success: true,
      data: {
        calculatedCount: allRequirements.length,
        simulations: simulations.map(s => s.simulation_no),
        message: `成功计算 ${allRequirements.length} 条物料需求明细`
      }
    };
  });
};

/**
 * 获取满足触发条件的模拟排程
 * @param {Object} connection - 数据库连接
 * @param {Array<string>} simulationIds - 模拟排程ID数组
 * @returns {Promise<Array>} 满足条件的模拟排程列表
 */
const getTriggeredSimulations = async (connection, simulationIds) => {
  const placeholders = simulationIds.map(() => '?').join(',');
  const [simulations] = await connection.execute(`
    SELECT 
      id,
      sequence_number,
      simulation_no,
      order_status,
      internal_sales_order_no,
      customer_delivery_date,
      product_code,
      product_name,
      suggested_replenishment_qty,
      product_source,
      output_process,
      simulation_status,
      waiting_number,
      submitter,
      submit_time,
      created_at
    FROM simulation_scheduling_list 
    WHERE id IN (${placeholders})
      AND customer_delivery_date IS NOT NULL 
      AND product_code IS NOT NULL 
      AND product_code != ''
      AND suggested_replenishment_qty IS NOT NULL 
      AND suggested_replenishment_qty > 0
    ORDER BY submit_time DESC, internal_sales_order_no ASC
  `, simulationIds);

  return simulations;
};

/**
 * 删除旧的需求数据
 * @param {Object} connection - 数据库连接
 * @param {Array} simulations - 模拟排程列表
 */
const deleteOldRequirements = async (connection, simulations) => {
  const sourceNos = simulations.map(s => s.simulation_no);
  const placeholders = sourceNos.map(() => '?').join(',');
  
  await connection.execute(`
    DELETE FROM simulation_material_requirements 
    WHERE source_no IN (${placeholders})
  `, sourceNos);
};

/**
 * 计算单个模拟排程的物料需求
 * @param {Object} connection - 数据库连接
 * @param {Object} simulation - 模拟排程数据
 * @param {number} startSequenceNumber - 起始序号
 * @returns {Promise<Array>} 物料需求明细列表
 */
const calculateSingleSimulationRequirements = async (connection, simulation, startSequenceNumber) => {
  const requirements = [];

  try {
    // 1. 计算层阶地址
    const bomQuery = await crossTableQueryService.queryProductionBOM(
      simulation.product_code, 
      null, 
      null
    );

    let levelAddress = bomQuery.levelAddress;
    let levelStandardQty = bomQuery.levelStandardQty;
    let bomCode = bomQuery.bomCode;

    // 2. 监控器：当层阶地址=9999999时，弹出提示
    if (levelAddress === '9999999') {
      console.warn(`⚠️ 该产品无生产BOM，无法模拟排程：${simulation.product_code}`);
      return requirements; // 停止该产品的所有后续模拟排程
    }

    // 3. 计算0阶BOM编号
    bomCode = await crossTableQueryService.queryBOMCode(
      levelAddress,
      bomCode,
      simulation.product_code
    );

    // 4. 计算0阶BOM编号数量
    let bomQuantity = 0;
    if (levelAddress !== '9999999' && levelStandardQty > 0) {
      bomQuantity = simulation.suggested_replenishment_qty / levelStandardQty;
      // 取小数点后11位数，但数据库字段是DECIMAL(15,2)，所以这里保留4位小数
      bomQuantity = parseFloat(bomQuantity.toFixed(4));
    }

    // 5. 获取采购子件列表
    const purchaseComponents = await crossTableQueryService.queryPurchaseComponents(
      levelAddress,
      bomCode,
      simulation.product_code
    );

    // 6. 为每个采购子件生成需求记录
    for (const component of purchaseComponents) {
      const requirement = await buildRequirementRecord(
        connection,
        simulation,
        component,
        levelAddress,
        bomCode,
        bomQuantity,
        startSequenceNumber + requirements.length
      );

      if (requirement) {
        requirements.push(requirement);
      }
    }

  } catch (error) {
    console.error(`计算模拟排程 ${simulation.simulation_no} 时出错:`, error);
    throw error;
  }

  return requirements;
};

/**
 * 构建需求记录
 * @param {Object} connection - 数据库连接
 * @param {Object} simulation - 模拟排程数据
 * @param {Object} component - 采购组件信息
 * @param {string} levelAddress - 层阶地址
 * @param {string} bomCode - BOM编号
 * @param {number} bomQuantity - BOM编号数量
 * @param {number} sequenceNumber - 序号
 * @returns {Promise<Object>} 需求记录
 */
const buildRequirementRecord = async (
  connection,
  simulation,
  component,
  levelAddress,
  bomCode,
  bomQuantity,
  sequenceNumber
) => {
  try {
    // 基础字段
    const requirement = {
      sequence_number: sequenceNumber,
      requirement_no: crossTableQueryService.generateRequirementDetailNo(),
      order_status: simulation.order_status,
      internal_sales_order_no: simulation.internal_sales_order_no,
      customer_delivery_date: simulation.customer_delivery_date,
      product_code: simulation.product_code,
      product_name: simulation.product_name,
      suggested_replenishment_qty: simulation.suggested_replenishment_qty,
      level_address: levelAddress,
      level0_bom_code: bomCode,
      level_standard_qty: levelAddress === '0' ? 1 : component.currentLevel0StandardQty,
      level0_bom_quantity: bomQuantity,
      current_process: '采购',
      current_level_address: component.currentLevelAddress,
      current_material_code: component.currentMaterialCode,
      current_material_name: component.currentMaterialName,
      current_level0_standard_qty: component.currentLevel0StandardQty,
      source_no: simulation.simulation_no,
      submit_time: new Date()
    };

    // 计算当前需求数量
    if (levelAddress !== '9999999' && component.currentLevel0StandardQty > 0) {
      requirement.current_required_qty = bomQuantity * component.currentLevel0StandardQty;
    } else {
      requirement.current_required_qty = 0;
    }

    // 查询可用库存
    const systemDate = crossTableQueryService.getSystemDate();
    const inventoryResult = await crossTableQueryService.queryProjectedBalanceMinIFS(
      component.currentMaterialCode,
      systemDate
    );
    requirement.available_inventory = inventoryResult.availableInventory;

    // 计算按顺序总需（需要先查询前面所有的需求）
    const totalRequired = await calculateTotalRequiredByOrder(
      connection,
      component.currentMaterialCode,
      sequenceNumber
    );
    requirement.total_required_by_order = totalRequired;

    // 计算还需数量
    if (totalRequired && inventoryResult.availableInventory !== null) {
      requirement.still_needed_qty = totalRequired - inventoryResult.availableInventory;
    } else {
      requirement.still_needed_qty = 0;
    }

    // 计划采购日期 = 系统当天日期+1天
    requirement.planned_purchase_date = crossTableQueryService.getSystemDatePlusDays(1);

    // 计算需求天数
    if (requirement.still_needed_qty <= 0) {
      requirement.requirement_days = 0;
    } else {
      const materialInfo = await crossTableQueryService.queryMaterialLibrary(
        component.currentMaterialCode
      );
      requirement.requirement_days = materialInfo.purchaseCycle || 0;
    }

    // 预计回厂日期 = 系统当天日期+1天+需求天数
    requirement.estimated_return_date = crossTableQueryService.getSystemDatePlusDays(
      1 + (requirement.requirement_days || 0)
    );

    // 后道产品字段
    if (levelAddress !== '9999999' && component.currentLevelAddress) {
      requirement.downstream_level_address = component.downstreamLevelAddress;
      requirement.downstream_process_name = component.downstreamProcessName;
      requirement.downstream_product_code = component.downstreamProductCode;
      requirement.downstream_product_name = component.downstreamProductName;
      requirement.downstream_level0_standard_qty = component.downstreamLevel0StandardQty;
      requirement.downstream_product_source = component.downstreamProductSource;

      // 计算后道需求数量
      if (component.downstreamLevel0StandardQty > 0) {
        requirement.downstream_required_qty = bomQuantity * component.downstreamLevel0StandardQty;
      } else {
        requirement.downstream_required_qty = 0;
      }

      // 查询后道可用库存
      if (component.downstreamProductCode && requirement.estimated_return_date) {
        const downstreamInventoryResult = await crossTableQueryService.queryProjectedBalanceMaxIFS(
          component.downstreamProductCode,
          new Date(requirement.estimated_return_date.getTime() + 24 * 60 * 60 * 1000) // +1天
        );
        requirement.downstream_available_inventory = downstreamInventoryResult.availableInventory;
      }
    }

    // 是否继续排程
    requirement.continue_scheduling = component.currentMaterialCode === simulation.product_code ? 0 : 1;

    // 物料需求明细编号 = 系统自动生成
    requirement.requirement_detail_no = requirement.requirement_no;

    return requirement;

  } catch (error) {
    console.error(`构建需求记录失败:`, error);
    return null;
  }
};

/**
 * 计算按顺序总需
 * @param {Object} connection - 数据库连接
 * @param {string} materialCode - 物料编号
 * @param {number} currentSequence - 当前序号
 * @returns {Promise<number>} 按顺序总需
 */
const calculateTotalRequiredByOrder = async (connection, materialCode, currentSequence) => {
  try {
    // SUMIFS(求和条件1：当前物料编号=本行的"当前物料编号"，求和条件2：序号<=本行的"序号"，求和列：当前需求数量）
    const [results] = await connection.execute(`
      SELECT COALESCE(SUM(current_required_qty), 0) as total
      FROM simulation_material_requirements 
      WHERE current_material_code = ? 
        AND sequence_number <= ?
    `, [materialCode, currentSequence]);

    return results.length > 0 ? results[0].total : 0;
  } catch (error) {
    console.error('计算按顺序总需失败:', error);
    return 0;
  }
};

/**
 * 批量插入需求记录
 * @param {Object} connection - 数据库连接
 * @param {Array} requirements - 需求记录列表
 */
const insertRequirements = async (connection, requirements) => {
  if (requirements.length === 0) return;

  const insertSql = `
    INSERT INTO simulation_material_requirements (
      sequence_number, requirement_no, order_status, internal_sales_order_no,
      customer_delivery_date, product_code, product_name, suggested_replenishment_qty,
      level_address, level0_bom_code, level_standard_qty, level0_bom_quantity,
      current_process, current_level_address, current_material_code, current_material_name,
      current_level0_standard_qty, current_required_qty, available_inventory,
      total_required_by_order, still_needed_qty, planned_purchase_date,
      requirement_days, estimated_return_date, downstream_level_address,
      downstream_process_name, downstream_product_code, downstream_product_name,
      downstream_level0_standard_qty, downstream_required_qty, downstream_available_inventory,
      submit_time, continue_scheduling, downstream_product_source,
      requirement_detail_no, source_no
    ) VALUES ${requirements.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
  `;

  const values = [];
  for (const req of requirements) {
    values.push(
      req.sequence_number,
      req.requirement_no,
      req.order_status,
      req.internal_sales_order_no,
      req.customer_delivery_date,
      req.product_code,
      req.product_name,
      req.suggested_replenishment_qty,
      req.level_address,
      req.level0_bom_code,
      req.level_standard_qty,
      req.level0_bom_quantity,
      req.current_process,
      req.current_level_address,
      req.current_material_code,
      req.current_material_name,
      req.current_level0_standard_qty,
      req.current_required_qty,
      req.available_inventory,
      req.total_required_by_order,
      req.still_needed_qty,
      req.planned_purchase_date,
      req.requirement_days,
      req.estimated_return_date,
      req.downstream_level_address,
      req.downstream_process_name,
      req.downstream_product_code,
      req.downstream_product_name,
      req.downstream_level0_standard_qty,
      req.downstream_required_qty,
      req.downstream_available_inventory,
      req.submit_time,
      req.continue_scheduling,
      req.downstream_product_source,
      req.requirement_detail_no,
      req.source_no
    );
  }

  await connection.execute(insertSql, values);
};

/**
 * 获取物料需求明细列表（分页）
 * @param {Object} params - 查询参数
 * @returns {Promise<Object>} 分页结果
 */
const getMaterialRequirementList = async (params) => {
  const {
    page = 1,
    pageSize = 20,
    search = '',
    internalSalesOrderNo = '',
    productCode = '',
    currentMaterialCode = ''
  } = params;

  const pageInt = parseInt(page);
  const pageSizeInt = parseInt(pageSize);
  const offset = (pageInt - 1) * pageSizeInt;

  // 构建WHERE条件
  let whereConditions = [];
  let queryParams = [];

  if (search) {
    whereConditions.push(`(
      requirement_no LIKE ? OR
      internal_sales_order_no LIKE ? OR
      product_code LIKE ? OR
      product_name LIKE ? OR
      current_material_code LIKE ? OR
      current_material_name LIKE ?
    )`);
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
  }

  if (internalSalesOrderNo) {
    whereConditions.push('internal_sales_order_no LIKE ?');
    queryParams.push(`%${internalSalesOrderNo}%`);
  }

  if (productCode) {
    whereConditions.push('product_code LIKE ?');
    queryParams.push(`%${productCode}%`);
  }

  if (currentMaterialCode) {
    whereConditions.push('current_material_code LIKE ?');
    queryParams.push(`%${currentMaterialCode}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 获取总数
  const [countResult] = await query(`
    SELECT COUNT(*) as total FROM simulation_material_requirements ${whereClause}
  `, queryParams);

  const total = countResult && countResult[0] ? countResult[0].total : 0;

  // 获取列表数据（按优先级排序：提交时间>内部销售订单编号）
  const [list] = await query(`
    SELECT * FROM simulation_material_requirements 
    ${whereClause} 
    ORDER BY submit_time DESC, internal_sales_order_no ASC, sequence_number ASC
    LIMIT ${pageSizeInt} OFFSET ${offset}
  `, queryParams);

  return {
    success: true,
    data: {
      list: list || [],
      total: total || 0,
      page: pageInt,
      pageSize: pageSizeInt,
      hasSimulationData: total > 0
    }
  };
};

/**
 * 手动刷新物料需求计算
 * @returns {Promise<Object>} 刷新结果
 */
const refreshMaterialRequirements = async () => {
  try {
    // 1. 获取所有模拟排程ID
    const [simulations] = await query(`
      SELECT id FROM simulation_scheduling_list 
      WHERE customer_delivery_date IS NOT NULL 
        AND product_code IS NOT NULL 
        AND product_code != ''
        AND suggested_replenishment_qty IS NOT NULL 
        AND suggested_replenishment_qty > 0
    `);

    if (simulations.length === 0) {
      return { success: true, data: { calculatedCount: 0 } };
    }

    const simulationIds = simulations.map(s => s.id);
    return await calculateMaterialRequirements(simulationIds);

  } catch (error) {
    console.error('刷新物料需求失败:', error);
    throw new Error(`刷新物料需求失败: ${error.message}`);
  }
};

/**
 * 处理模拟排程更新事件
 * @param {Array<string>} simulationIds - 模拟排程ID数组
 * @returns {Promise<Object>} 处理结果
 */
const handleSimulationSchedulingUpdate = async (simulationIds) => {
  try {
    console.log('📥 处理模拟排程更新事件:', simulationIds);
    
    const result = await calculateMaterialRequirements(simulationIds);
    
    // 触发前端更新事件
    if (result.data.calculatedCount > 0) {
      console.log('📤 触发物料需求更新事件');
      // 这里可以通过WebSocket或其他机制通知前端
    }

    return result;
  } catch (error) {
    console.error('处理模拟排程更新事件失败:', error);
    throw new Error(`处理模拟排程更新事件失败: ${error.message}`);
  }
};

module.exports = {
  calculateMaterialRequirements,
  getMaterialRequirementList,
  refreshMaterialRequirements,
  handleSimulationSchedulingUpdate
};
