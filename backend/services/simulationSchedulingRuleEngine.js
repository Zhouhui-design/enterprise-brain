const { query } = require('../config/database');
const crossTableQueryService = require('./crossTableQueryService');

/**
 * 模拟排程工序表业务规则计算引擎
 * 实现复杂的业务规则和字段计算逻辑
 */
class SimulationSchedulingRuleEngine {
  
  /**
   * 规则1：模拟物料需求明细→排程工序表（更新规则）
   * @param {Object} materialRequirementData 模拟物料需求数据
   * @returns {Promise<Object>} 更新结果
   */
  async rule1_UpdateRule(materialRequirementData) {
    try {
      console.log('🔧 执行规则1：更新规则', materialRequirementData.internal_sales_order_no);
      
      // 检查触发条件
      if (!this._checkUpdateTriggerConditions(materialRequirementData)) {
        console.log('⚠️ 触发条件不满足，跳过更新规则');
        return null;
      }
      
      // 查询是否存在符合条件的记录
      const existingRecord = await this._findExistingRecord(materialRequirementData);
      
      if (!existingRecord) {
        console.log('⚠️ 未找到符合条件的记录，需要执行新增规则');
        return null;
      }
      
      // 计算更新字段
      const updateData = await this._calculateUpdateFields(existingRecord, materialRequirementData);
      
      // 执行更新
      await this._updateRecord(existingRecord.id, updateData);
      
      console.log('✅ 规则1执行成功');
      return updateData;
      
    } catch (error) {
      console.error('❌ 规则1执行失败:', error.message);
      throw error;
    }
  }

  /**
   * 规则2：模拟物料需求明细→排程工序表（新增规则）
   * @param {Object} materialRequirementData 模拟物料需求数据
   * @returns {Promise<Object>} 新增结果
   */
  async rule2_InsertRule(materialRequirementData) {
    try {
      console.log('🔧 执行规则2：新增规则', materialRequirementData.internal_sales_order_no);
      
      // 检查触发条件
      if (!this._checkInsertTriggerConditions(materialRequirementData)) {
        console.log('⚠️ 触发条件不满足，跳过新增规则');
        return null;
      }
      
      // 生成新的序号
      const sequenceNumber = await this._generateSequenceNumber();
      const simulationProcessNo = `SP${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
      
      // 构建新增数据
      const insertData = await this._calculateInsertFields(materialRequirementData, sequenceNumber, simulationProcessNo);
      
      // 执行插入
      const insertId = await this._insertRecord(insertData);
      
      console.log('✅ 规则2执行成功，ID:', insertId);
      return { ...insertData, id: insertId };
      
    } catch (error) {
      console.error('❌ 规则2执行失败:', error.message);
      throw error;
    }
  }

  /**
   * 规则3：排程工序表自更新规则（后道工序更新）
   * @param {Object} sourceData 源数据行
   * @returns {Promise<Object>} 更新结果
   */
  async rule3_SelfUpdateRule(sourceData) {
    try {
      console.log('🔧 执行规则3：自更新规则', sourceData.simulation_process_no);
      
      // 检查触发条件
      if (!this._checkSelfUpdateTriggerConditions(sourceData)) {
        console.log('⚠️ 触发条件不满足，跳过自更新规则');
        return null;
      }
      
      // 查询是否存在符合条件的后道工序记录
      const existingDownstreamRecord = await this._findDownstreamRecord(sourceData);
      
      if (!existingDownstreamRecord) {
        console.log('⚠️ 未找到符合条件的后道工序记录，需要执行新增规则');
        return null;
      }
      
      // 计算更新字段
      const updateData = await this._calculateSelfUpdateFields(existingDownstreamRecord, sourceData);
      
      // 执行更新
      await this._updateRecord(existingDownstreamRecord.id, updateData);
      
      console.log('✅ 规则3执行成功');
      return updateData;
      
    } catch (error) {
      console.error('❌ 规则3执行失败:', error.message);
      throw error;
    }
  }

  /**
   * 规则4：排程工序表自增行规则（排程延续）
   * @param {Object} sourceData 源数据行
   * @returns {Promise<Object>} 新增结果
   */
  async rule4_AutoIncrementRule(sourceData) {
    try {
      console.log('🔧 执行规则4：自增行规则', sourceData.simulation_process_no);
      
      // 检查触发条件
      if (!this._checkAutoIncrementTriggerConditions(sourceData)) {
        console.log('⚠️ 触发条件不满足，跳过自增行规则');
        return null;
      }
      
      // 生成新的序号
      const sequenceNumber = await this._generateSequenceNumber();
      const simulationProcessNo = `SP${Date.now()}${Math.random().toString(36).substr(2, 6)}`;
      
      // 构建自增行数据
      const insertData = await this._calculateAutoIncrementFields(sourceData, sequenceNumber, simulationProcessNo);
      
      // 执行插入
      const insertId = await this._insertRecord(insertData);
      
      console.log('✅ 规则4执行成功，ID:', insertId);
      return { ...insertData, id: insertId };
      
    } catch (error) {
      console.error('❌ 规则4执行失败:', error.message);
      throw error;
    }
  }

  /**
   * 规则5：销售订单回填规则
   * @param {Object} schedulingData 排程数据
   * @returns {Promise<Object>} 更新结果
   */
  async rule5_SalesOrderUpdateRule(schedulingData) {
    try {
      console.log('🔧 执行规则5：销售订单回填规则', schedulingData.simulation_process_no);
      
      // 检查触发条件
      if (!this._checkSalesOrderUpdateConditions(schedulingData)) {
        console.log('⚠️ 触发条件不满足，跳过销售订单回填');
        return null;
      }
      
      // 查找对应的销售订单
      const salesOrder = await this._findSalesOrder(schedulingData);
      
      if (!salesOrder) {
        console.log('⚠️ 未找到对应的销售订单');
        return null;
      }
      
      // 更新销售订单的预计完成日期
      await this._updateSalesOrder(salesOrder.id, schedulingData.effective_planned_date);
      
      console.log('✅ 规则5执行成功');
      return { updated: true, sales_order_id: salesOrder.id };
      
    } catch (error) {
      console.error('❌ 规则5执行失败:', error.message);
      throw error;
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 检查更新规则的触发条件
   */
  _checkUpdateTriggerConditions(data) {
    return data.continue_scheduling === 1 &&
           data.downstream_required_qty > 0 &&
           data.downstream_product_code &&
           data.downstream_process_name &&
           data.downstream_level_address &&
           data.estimated_return_date;
  }

  /**
   * 检查新增规则的触发条件
   */
  _checkInsertTriggerConditions(data) {
    return data.continue_scheduling === 1 &&
           data.downstream_required_qty > 0 &&
           data.downstream_product_code &&
           data.downstream_process_name &&
           data.downstream_level_address &&
           data.estimated_return_date;
  }

  /**
   * 检查自更新规则的触发条件
   */
  _checkSelfUpdateTriggerConditions(data) {
    return data.continue_scheduling === 1 &&
           data.downstream_required_qty > 0 &&
           data.submit_time &&
           data.downstream_process_name &&
           data.downstream_available_inventory != null &&
           data.downstream_product_code &&
           data.downstream_level_address;
  }

  /**
   * 检查自增行规则的触发条件
   */
  _checkAutoIncrementTriggerConditions(data) {
    return data.remaining_unscheduled_qty > 0 &&
           data.effective_planned_date &&
           data.current_process &&
           data.current_level_address &&
           data.current_material_code &&
           data.current_level0_standard_qty;
  }

  /**
   * 检查销售订单更新条件的触发条件
   */
  _checkSalesOrderUpdateConditions(data) {
    return data.continue_scheduling === 0 &&
           data.remaining_unscheduled_qty <= 0;
  }

  /**
   * 查找存在的记录（更新规则用）
   */
  async _findExistingRecord(data) {
    const sql = `
      SELECT * FROM simulation_scheduling_process_table 
      WHERE internal_sales_order_no = ? 
        AND product_code = ? 
        AND downstream_level_address = ? 
        AND planned_schedule_date > ?
      LIMIT 1
    `;
    const result = await query(sql, [
      data.internal_sales_order_no,
      data.product_code,
      data.level_address,
      data.estimated_return_date
    ]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 查找后道工序记录（自更新规则用）
   */
  async _findDownstreamRecord(data) {
    const sql = `
      SELECT * FROM simulation_scheduling_process_table 
      WHERE internal_sales_order_no = ? 
        AND product_code = ? 
        AND level_address = ? 
        AND level0_bom_code = ? 
        AND current_level_address = ? 
        AND effective_planned_date <= ?
      LIMIT 1
    `;
    const result = await query(sql, [
      data.internal_sales_order_no,
      data.product_code,
      data.level_address,
      data.level0_bom_code,
      data.downstream_level_address,
      data.effective_planned_date
    ]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 查找销售订单
   */
  async _findSalesOrder(data) {
    const sql = `
      SELECT id FROM sales_orders 
      WHERE internal_order_no = ? 
      LIMIT 1
    `;
    const result = await query(sql, [data.internal_sales_order_no]);
    return result.length > 0 ? result[0] : null;
  }

  /**
   * 计算更新字段
   */
  async _calculateUpdateFields(existingRecord, materialData) {
    // 1. 计划排程日期 = 预计回厂日期
    const planned_schedule_date = new Date(materialData.estimated_return_date);
    
    // 2. 有效计划排程日期 = MINIFS查询
    const effective_planned_date = await crossTableQueryService.getEffectivePlannedDate(
      planned_schedule_date, 
      existingRecord.current_process
    );
    
    // 3. 当天剩余工时 = LOOKUP查询
    const daily_remaining_hours = await crossTableQueryService.getDailyRemainingHours(
      effective_planned_date,
      existingRecord.current_process
    );
    
    // 4. 当天模拟累计工时 = SUMIFS查询
    const daily_cumulative_hours = await crossTableQueryService.getDailyCumulativeHours(
      effective_planned_date,
      existingRecord.current_process,
      existingRecord.sequence_number
    );
    
    // 5. 当前可用排程工时 = 当天剩余工时 - 当天模拟累计工时
    const current_available_hours = Math.max(0, daily_remaining_hours - daily_cumulative_hours);
    
    // 6. 当前计划排程工时 = MIN(当前可用排程工时, 需求总工时)
    const current_planned_hours = Math.min(current_available_hours, existingRecord.required_total_hours);
    
    // 7. 当前计划排程数量 = ROUND(当前计划排程工时 * 定时工额, 0)
    const current_planned_quantity = Math.round(current_planned_hours * existingRecord.hourly_quota);
    
    // 8. 当前累计排程数量 = SUMIFS查询
    const current_cumulative_quantity = await crossTableQueryService.getCurrentCumulativeQuantity(
      existingRecord.product_code,
      existingRecord.internal_sales_order_no,
      existingRecord.current_level_address,
      existingRecord.sequence_number
    );
    
    // 9. 剩余未排数量 = 还需数量 - 当前累计排程数量
    const remaining_unscheduled_qty = existingRecord.still_needed_qty - current_cumulative_quantity;
    
    // 10. 可用库存 = 后道可用库存
    const available_inventory = materialData.downstream_available_inventory;
    
    return {
      planned_schedule_date,
      effective_planned_date,
      daily_remaining_hours,
      daily_cumulative_hours,
      current_available_hours,
      current_planned_hours,
      current_planned_quantity,
      current_cumulative_quantity,
      remaining_unscheduled_qty,
      available_inventory
    };
  }

  /**
   * 计算新增字段
   */
  async _calculateInsertFields(materialData, sequenceNumber, simulationProcessNo) {
    const baseFields = {
      sequence_number: sequenceNumber,
      simulation_process_no: simulationProcessNo,
      source_no: materialData.material_requirement_no,
      source_form: '模拟物料需求明细',
      
      // 基础信息字段映射
      order_status: materialData.order_status,
      internal_sales_order_no: materialData.internal_sales_order_no,
      customer_delivery_date: materialData.customer_delivery_date,
      product_code: materialData.product_code,
      product_name: materialData.product_name,
      suggested_replenishment_qty: materialData.suggested_replenishment_qty,
      
      // BOM和工序字段映射
      level_address: materialData.level_address,
      current_process: materialData.downstream_process_name,
      current_layer_address: materialData.downstream_level_address,
      current_material_code: materialData.downstream_product_code,
      current_material_name: materialData.downstream_product_name,
      current_level0_standard_qty: materialData.downstream_level0_standard_usage,
      
      // 当前需求数量和库存映射
      current_required_qty: materialData.downstream_required_qty,
      available_inventory: materialData.downstream_available_inventory,
      
      // 0阶BOM信息映射
      level0_bom_code: materialData.level0_bom_code,
      level0_bom_quantity: materialData.level0_bom_quantity,
      level_standard_qty: materialData.level_standard_qty,
      
      // 后道信息
      downstream_product_source: materialData.downstream_product_source,
      downstream_level_address: materialData.downstream_product_layer_address,
      downstream_process_name: materialData.downstream_process_name,
      downstream_product_code: materialData.downstream_product_code,
      downstream_product_name: materialData.downstream_product_name,
      downstream_level0_standard_qty: materialData.downstream_level0_standard_usage,
      downstream_required_qty: materialData.downstream_required_qty,
      downstream_available_inventory: materialData.downstream_available_inventory,
      
      // 时间信息
      submit_time: new Date()
    };
    
    // 计算复杂字段
    // 1. 按顺序总需 = SUMIFS查询
    const total_required_by_order = await crossTableQueryService.getTotalRequiredByOrder(
      materialData.downstream_product_code,
      sequenceNumber
    );
    
    // 2. 还需数量 = 按顺序总需 - 可用库存
    const still_needed_qty = Math.max(0, total_required_by_order - materialData.downstream_available_inventory);
    
    // 3. 定时工额 = LOOKUP查询
    const hourly_quota = await crossTableQueryService.getHourlyQuota(materialData.downstream_product_code);
    
    // 4. 需求总工时 = 还需数量 / 定时工额
    const required_total_hours = hourly_quota > 0 ? parseFloat((still_needed_qty / hourly_quota).toFixed(2)) : 0;
    
    // 5. 计划排程日期 = 预计回厂日期 + 1天
    const planned_schedule_date = new Date(materialData.estimated_return_date);
    planned_schedule_date.setDate(planned_schedule_date.getDate() + 1);
    
    // 6. 有效计划排程日期 = MINIFS查询
    const effective_planned_date = await crossTableQueryService.getEffectivePlannedDate(
      planned_schedule_date,
      materialData.downstream_process_name
    );
    
    // 7. 当天剩余工时 = LOOKUP查询
    const daily_remaining_hours = await crossTableQueryService.getDailyRemainingHours(
      effective_planned_date,
      materialData.downstream_process_name
    );
    
    // 8. 当天模拟累计工时 = SUMIFS查询
    const daily_cumulative_hours = await crossTableQueryService.getDailyCumulativeHours(
      effective_planned_date,
      materialData.downstream_process_name,
      sequenceNumber
    );
    
    // 9. 当前可用排程工时 = 当天剩余工时 - 当天模拟累计工时
    const current_available_hours = Math.max(0, daily_remaining_hours - daily_cumulative_hours);
    
    // 10. 当前计划排程工时 = MIN(当前可用排程工时, 需求总工时)
    const current_planned_hours = Math.min(current_available_hours, required_total_hours);
    
    // 11. 当前计划排程数量 = ROUND(当前计划排程工时 * 定时工额, 0)
    const current_planned_quantity = Math.round(current_planned_hours * hourly_quota);
    
    // 12. 当前累计排程数量 = SUMIFS查询
    const current_cumulative_quantity = await crossTableQueryService.getCurrentCumulativeQuantity(
      materialData.product_code,
      materialData.internal_sales_order_no,
      materialData.downstream_product_layer_address,
      sequenceNumber
    );
    
    // 13. 剩余未排数量 = 还需数量 - 当前累计排程数量
    const remaining_unscheduled_qty = Math.max(0, still_needed_qty - current_cumulative_quantity);
    
    // 14. 是否继续排程 = IF(当前物料编号=产品编号, 否, 是)
    const continue_scheduling = materialData.downstream_product_code === materialData.product_code ? 0 : 1;
    
    return {
      ...baseFields,
      total_required_by_order,
      still_needed_qty,
      hourly_quota,
      required_total_hours,
      planned_schedule_date,
      effective_planned_date,
      daily_remaining_hours,
      daily_cumulative_hours,
      current_available_hours,
      current_planned_hours,
      current_planned_quantity,
      current_cumulative_quantity,
      remaining_unscheduled_qty,
      continue_scheduling
    };
  }

  /**
   * 计算自更新字段
   */
  async _calculateSelfUpdateFields(existingRecord, sourceData) {
    // 1. 可用库存 = 后道可用库存
    const available_inventory = sourceData.downstream_available_inventory;
    
    // 2. 计划排程日期 = 有效计划排程日期 + 1天
    const planned_schedule_date = new Date(sourceData.effective_planned_date);
    planned_schedule_date.setDate(planned_schedule_date.getDate() + 1);
    
    // 3. 有效计划排程日期 = MINIFS查询
    const effective_planned_date = await crossTableQueryService.getEffectivePlannedDate(
      planned_schedule_date,
      existingRecord.current_process
    );
    
    // 4. 当天剩余工时 = LOOKUP查询
    const daily_remaining_hours = await crossTableQueryService.getDailyRemainingHours(
      effective_planned_date,
      existingRecord.current_process
    );
    
    // 5. 当天模拟累计工时 = SUMIFS查询
    const daily_cumulative_hours = await crossTableQueryService.getDailyCumulativeHours(
      effective_planned_date,
      existingRecord.current_process,
      existingRecord.sequence_number
    );
    
    // 6. 当前可用排程工时 = 当天剩余工时 - 当天模拟累计工时
    const current_available_hours = Math.max(0, daily_remaining_hours - daily_cumulative_hours);
    
    // 7. 当前计划排程工时 = MIN(当前可用排程工时, 需求总工时)
    const current_planned_hours = Math.min(current_available_hours, existingRecord.required_total_hours);
    
    // 8. 当前计划排程数量 = ROUND(当前计划排程工时 * 定时工额, 0)
    const current_planned_quantity = Math.round(current_planned_hours * existingRecord.hourly_quota);
    
    // 9. 当前累计排程数量 = SUMIFS查询
    const current_cumulative_quantity = await crossTableQueryService.getCurrentCumulativeQuantity(
      existingRecord.product_code,
      existingRecord.internal_sales_order_no,
      existingRecord.current_level_address,
      existingRecord.sequence_number
    );
    
    // 10. 剩余未排数量 = 还需数量 - 当前累计排程数量
    const remaining_unscheduled_qty = existingRecord.still_needed_qty - current_cumulative_quantity;
    
    return {
      available_inventory,
      planned_schedule_date,
      effective_planned_date,
      daily_remaining_hours,
      daily_cumulative_hours,
      current_available_hours,
      current_planned_hours,
      current_planned_quantity,
      current_cumulative_quantity,
      remaining_unscheduled_qty
    };
  }

  /**
   * 计算自增行字段
   */
  async _calculateAutoIncrementFields(sourceData, sequenceNumber, simulationProcessNo) {
    const planned_schedule_date = new Date(sourceData.effective_planned_date);
    planned_schedule_date.setDate(planned_schedule_date.getDate() + 1);
    
    const effective_planned_date = await crossTableQueryService.getEffectivePlannedDate(
      planned_schedule_date,
      sourceData.current_process
    );
    
    const daily_remaining_hours = await crossTableQueryService.getDailyRemainingHours(
      effective_planned_date,
      sourceData.current_process
    );
    
    const daily_cumulative_hours = await crossTableQueryService.getDailyCumulativeHours(
      effective_planned_date,
      sourceData.current_process,
      sequenceNumber
    );
    
    const current_available_hours = Math.max(0, daily_remaining_hours - daily_cumulative_hours);
    const current_planned_hours = Math.min(current_available_hours, sourceData.required_total_hours);
    const current_planned_quantity = Math.round(current_planned_hours * sourceData.hourly_quota);
    const current_cumulative_quantity = sourceData.current_cumulative_quantity + current_planned_quantity;
    const remaining_unscheduled_qty = sourceData.still_needed_qty - current_planned_quantity;
    
    return {
      sequence_number: sequenceNumber,
      simulation_process_no: simulationProcessNo,
      
      // 基础字段复制
      order_status: sourceData.order_status,
      internal_sales_order_no: sourceData.internal_sales_order_no,
      customer_delivery_date: sourceData.customer_delivery_date,
      product_code: sourceData.product_code,
      product_name: sourceData.product_name,
      suggested_replenishment_qty: sourceData.suggested_replenishment_qty,
      level_address: sourceData.level_address,
      level0_bom_code: sourceData.level0_bom_code,
      level0_bom_quantity: sourceData.level0_bom_quantity,
      level_standard_qty: sourceData.level_standard_qty,
      current_level0_standard_qty: sourceData.current_level0_standard_qty,
      
      // 当前工序字段
      current_process: sourceData.current_process,
      current_layer_address: sourceData.current_level_address,
      current_material_code: sourceData.current_material_code,
      current_material_name: sourceData.current_material_name,
      current_required_qty: 0, // 新增行当前需求数量为0
      available_inventory: sourceData.available_inventory,
      
      // 需求相关
      total_required_by_order: sourceData.total_required_by_order,
      still_needed_qty: sourceData.remaining_unscheduled_qty, // 使用上一行的剩余未排数量
      
      // 工时相关
      hourly_quota: sourceData.hourly_quota,
      required_total_hours: parseFloat((sourceData.remaining_unscheduled_qty / sourceData.hourly_quota).toFixed(2)),
      
      // 日期相关
      planned_schedule_date,
      effective_planned_date,
      daily_remaining_hours,
      daily_cumulative_hours,
      current_available_hours,
      current_planned_hours,
      current_planned_quantity,
      current_cumulative_quantity,
      remaining_unscheduled_qty,
      
      // 后道信息复制
      downstream_product_source: sourceData.downstream_product_source,
      downstream_level_address: sourceData.downstream_level_address,
      downstream_process_name: sourceData.downstream_process_name,
      downstream_product_code: sourceData.downstream_product_code,
      downstream_product_name: sourceData.downstream_product_name,
      downstream_level0_standard_qty: sourceData.downstream_level0_standard_qty,
      downstream_required_qty: sourceData.downstream_required_qty,
      downstream_available_inventory: sourceData.downstream_available_inventory,
      
      // 状态信息
      continue_scheduling: sourceData.continue_scheduling,
      submit_time: sourceData.submit_time,
      source_no: sourceData.simulation_process_no,
      source_form: '模拟排程工序'
    };
  }

  /**
   * 生成序号
   */
  async _generateSequenceNumber() {
    const sql = 'SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_seq FROM simulation_scheduling_process_table';
    const result = await query(sql);
    return result[0].next_seq;
  }

  /**
   * 更新记录
   */
  async _updateRecord(id, updateData) {
    const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    
    const sql = `
      UPDATE simulation_scheduling_process_table 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await query(sql, [...values, id]);
  }

  /**
   * 插入记录
   */
  async _insertRecord(insertData) {
    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);
    
    const sql = `
      INSERT INTO simulation_scheduling_process_table (${columns}) 
      VALUES (${placeholders})
    `;
    
    const result = await query(sql, values);
    return result.insertId;
  }

  /**
   * 更新销售订单
   */
  async _updateSalesOrder(salesOrderId, estimatedCompletionDate) {
    const sql = `
      UPDATE sales_orders 
      SET estimated_completion_date = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await query(sql, [estimatedCompletionDate, salesOrderId]);
  }
}

module.exports = new SimulationSchedulingRuleEngine();
