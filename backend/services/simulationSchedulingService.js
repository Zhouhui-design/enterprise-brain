const { query, executeTransaction } = require('../config/database');
const crossTableQueryService = require('./crossTableQueryService');
const simulationSchedulingRuleEngine = require('./simulationSchedulingRuleEngine');

/**
 * 模拟排程工序表服务
 * 处理数据接收、事件处理和业务逻辑
 */
class SimulationSchedulingService {
  
  /**
   * 接收模拟物料需求数据并触发业务规则
   * @param {Array<Object>} materialRequirements 模拟物料需求明细数据
   * @returns {Promise<Object>} 处理结果
   */
  async receiveMaterialRequirements(materialRequirements) {
    try {
      console.log(`📥 接收到${materialRequirements.length}条模拟物料需求数据`);
      
      const results = {
        processed: 0,
        updated: 0,
        inserted: 0,
        selfUpdated: 0,
        autoIncremented: 0,
        errors: []
      };
      
      // 使用事务处理所有数据
      await executeTransaction(async (connection) => {
        for (const materialData of materialRequirements) {
          try {
            // 执行规则1：更新规则
            const updateResult = await simulationSchedulingRuleEngine.rule1_UpdateRule(materialData);
            if (updateResult) {
              results.updated++;
              console.log(`✅ 更新记录: ${materialData.internal_sales_order_no}`);
            }
            
            // 执行规则2：新增规则
            const insertResult = await simulationSchedulingRuleEngine.rule2_InsertRule(materialData);
            if (insertResult) {
              results.inserted++;
              console.log(`✅ 新增记录: ${materialData.internal_sales_order_no}`);
            }
            
            // 如果有更新或新增，继续执行自更新和自增行规则
            if (updateResult || insertResult) {
              const sourceData = updateResult || insertResult;
              
              // 执行规则3：自更新规则
              const selfUpdateResult = await simulationSchedulingRuleEngine.rule3_SelfUpdateRule(sourceData);
              if (selfUpdateResult) {
                results.selfUpdated++;
                console.log(`✅ 自更新记录: ${sourceData.simulation_process_no}`);
              }
              
              // 执行规则4：自增行规则
              const autoIncrementResult = await simulationSchedulingRuleEngine.rule4_AutoIncrementRule(sourceData);
              if (autoIncrementResult) {
                results.autoIncremented++;
                console.log(`✅ 自增行记录: ${autoIncrementResult.simulation_process_no}`);
              }
              
              // 执行规则5：销售订单回填规则
              const salesOrderResult = await simulationSchedulingRuleEngine.rule5_SalesOrderUpdateRule(sourceData);
              if (salesOrderResult) {
                console.log(`✅ 销售订单回填: ${sourceData.internal_sales_order_no}`);
              }
            }
            
            results.processed++;
            
          } catch (error) {
            const errorMsg = `处理物料需求数据失败: ${error.message}`;
            console.error(`❌ ${errorMsg}`, materialData);
            results.errors.push({
              internal_sales_order_no: materialData.internal_sales_order_no,
              error: error.message
            });
          }
        }
      });
      
      console.log(`🎉 数据处理完成: 处理${results.processed}条，更新${results.updated}条，新增${results.inserted}条，自更新${results.selfUpdated}条，自增${results.autoIncremented}条，错误${results.errors.length}条`);
      
      return results;
      
    } catch (error) {
      console.error('❌ 接收模拟物料需求数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取模拟排程工序表列表（分页）
   * @param {Object} queryParams 查询参数
   * @returns {Promise<Object>} 分页数据
   */
  async getSimulationSchedulingList(queryParams) {
    try {
      const {
        page = 1,
        pageSize = 50,
        internal_sales_order_no,
        product_code,
        current_process,
        effective_planned_date_start,
        effective_planned_date_end,
        continue_scheduling
      } = queryParams;
      
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      // 构建查询条件
      if (internal_sales_order_no) {
        whereClause += ' AND internal_sales_order_no LIKE ?';
        params.push(`%${internal_sales_order_no}%`);
      }
      
      if (product_code) {
        whereClause += ' AND product_code LIKE ?';
        params.push(`%${product_code}%`);
      }
      
      if (current_process) {
        whereClause += ' AND current_process LIKE ?';
        params.push(`%${current_process}%`);
      }
      
      if (effective_planned_date_start) {
        whereClause += ' AND effective_planned_date >= ?';
        params.push(effective_planned_date_start);
      }
      
      if (effective_planned_date_end) {
        whereClause += ' AND effective_planned_date <= ?';
        params.push(effective_planned_date_end);
      }
      
      if (continue_scheduling !== undefined) {
        whereClause += ' AND continue_scheduling = ?';
        params.push(continue_scheduling);
      }
      
      // 查询总数
      const countSQL = `SELECT COUNT(*) as total FROM simulation_scheduling_process_table ${whereClause}`;
      const countResult = await query(countSQL, params);
      const total = countResult[0].total;
      
      // 查询数据
      const offset = (page - 1) * pageSize;
      const dataSQL = `
        SELECT * FROM simulation_scheduling_process_table 
        ${whereClause} 
        ORDER BY sequence_number ASC, created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      const data = await query(dataSQL, [...params, pageSize, offset]);
      
      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };
      
    } catch (error) {
      console.error('❌ 获取模拟排程工序表列表失败:', error.message);
      throw error;
    }
  }

  /**
   * 根据ID获取模拟排程工序详情
   * @param {string} id 记录ID
   * @returns {Promise<Object>} 详情数据
   */
  async getSimulationSchedulingById(id) {
    try {
      const sql = 'SELECT * FROM simulation_scheduling_process_table WHERE id = ?';
      const result = await query(sql, [id]);
      return result.length > 0 ? result[0] : null;
      
    } catch (error) {
      console.error('❌ 获取模拟排程工序详情失败:', error.message);
      throw error;
    }
  }

  /**
   * 根据模拟排程工序编号获取记录
   * @param {string} simulationProcessNo 模拟排程工序编号
   * @returns {Promise<Object>} 记录数据
   */
  async getSimulationSchedulingByNo(simulationProcessNo) {
    try {
      const sql = 'SELECT * FROM simulation_scheduling_process_table WHERE simulation_process_no = ?';
      const result = await query(sql, [simulationProcessNo]);
      return result.length > 0 ? result[0] : null;
      
    } catch (error) {
      console.error('❌ 根据编号获取模拟排程工序失败:', error.message);
      throw error;
    }
  }

  /**
   * 更新模拟排程工序记录
   * @param {string} id 记录ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<boolean>} 更新结果
   */
  async updateSimulationScheduling(id, updateData) {
    try {
      const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updateData);
      
      const sql = `
        UPDATE simulation_scheduling_process_table 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      const result = await query(sql, [...values, id]);
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error('❌ 更新模拟排程工序失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除模拟排程工序记录
   * @param {string} id 记录ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteSimulationScheduling(id) {
    try {
      const sql = 'DELETE FROM simulation_scheduling_process_table WHERE id = ?';
      const result = await query(sql, [id]);
      return result.affectedRows > 0;
      
    } catch (error) {
      console.error('❌ 删除模拟排程工序失败:', error.message);
      throw error;
    }
  }

  /**
   * 批量删除模拟排程工序记录
   * @param {Array<string>} ids 记录ID数组
   * @returns {Promise<number>} 删除数量
   */
  async batchDeleteSimulationScheduling(ids) {
    try {
      if (!ids || ids.length === 0) return 0;
      
      const placeholders = ids.map(() => '?').join(',');
      const sql = `DELETE FROM simulation_scheduling_process_table WHERE id IN (${placeholders})`;
      const result = await query(sql, ids);
      return result.affectedRows;
      
    } catch (error) {
      console.error('❌ 批量删除模拟排程工序失败:', error.message);
      throw error;
    }
  }

  /**
   * 导出模拟排程工序数据
   * @param {Object} queryParams 查询参数
   * @returns {Promise<Array>} 导出数据
   */
  async exportSimulationSchedulingData(queryParams) {
    try {
      // 使用相同的查询逻辑，但不分页
      const listResult = await this.getSimulationSchedulingList({
        ...queryParams,
        page: 1,
        pageSize: 100000 // 设置一个很大的数字以获取所有数据
      });
      
      return listResult.data;
      
    } catch (error) {
      console.error('❌ 导出模拟排程工序数据失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取模拟排程工序统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getSimulationSchedulingStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN continue_scheduling = 1 THEN 1 END) as continuing_count,
          COUNT(CASE WHEN continue_scheduling = 0 THEN 1 END) as completed_count,
          COUNT(CASE WHEN remaining_unscheduled_qty > 0 THEN 1 END) as pending_count,
          SUM(current_planned_quantity) as total_planned_quantity,
          SUM(remaining_unscheduled_qty) as total_remaining_quantity,
          MIN(effective_planned_date) as min_planned_date,
          MAX(effective_planned_date) as max_planned_date
        FROM simulation_scheduling_process_table
      `;
      
      const result = await query(sql);
      return result.length > 0 ? result[0] : {
        total_count: 0,
        continuing_count: 0,
        completed_count: 0,
        pending_count: 0,
        total_planned_quantity: 0,
        total_remaining_quantity: 0,
        min_planned_date: null,
        max_planned_date: null
      };
      
    } catch (error) {
      console.error('❌ 获取模拟排程工序统计失败:', error.message);
      throw error;
    }
  }

  /**
   * 重新计算指定记录的计算字段
   * @param {string} id 记录ID
   * @returns {Promise<Object>} 计算结果
   */
  async recalculateSimulationScheduling(id) {
    try {
      console.log('🔄 重新计算模拟排程工序记录:', id);
      
      // 获取原始数据
      const originalData = await this.getSimulationSchedulingById(id);
      if (!originalData) {
        throw new Error('记录不存在');
      }
      
      // 构造模拟物料需求数据格式
      const materialData = {
        order_status: originalData.order_status,
        internal_sales_order_no: originalData.internal_sales_order_no,
        customer_delivery_date: originalData.customer_delivery_date,
        product_code: originalData.product_code,
        product_name: originalData.product_name,
        suggested_replenishment_qty: originalData.suggested_replenishment_qty,
        level_address: originalData.level_address,
        estimated_return_date: originalData.effective_planned_date,
        downstream_required_qty: originalData.downstream_required_qty,
        downstream_product_code: originalData.downstream_product_code,
        downstream_process_name: originalData.downstream_process_name,
        downstream_level_address: originalData.downstream_level_address,
        downstream_available_inventory: originalData.downstream_available_inventory
      };
      
      // 重新执行计算
      const updateResult = await simulationSchedulingRuleEngine.rule1_UpdateRule(materialData);
      
      if (updateResult) {
        await this.updateSimulationScheduling(id, updateResult);
        console.log('✅ 重新计算完成');
        return updateResult;
      } else {
        throw new Error('重新计算失败：不满足计算条件');
      }
      
    } catch (error) {
      console.error('❌ 重新计算模拟排程工序失败:', error.message);
      throw error;
    }
  }

  /**
   * 触发自增行规则（手动触发）
   * @param {string} id 记录ID
   * @returns {Promise<Object>} 自增结果
   */
  async triggerAutoIncrement(id) {
    try {
      console.log('🔄 手动触发自增行规则:', id);
      
      // 获取源数据
      const sourceData = await this.getSimulationSchedulingById(id);
      if (!sourceData) {
        throw new Error('记录不存在');
      }
      
      // 执行自增行规则
      const autoIncrementResult = await simulationSchedulingRuleEngine.rule4_AutoIncrementRule(sourceData);
      
      if (autoIncrementResult) {
        console.log('✅ 自增行规则执行成功');
        return autoIncrementResult;
      } else {
        throw new Error('自增行规则执行失败：不满足触发条件');
      }
      
    } catch (error) {
      console.error('❌ 触发自增行规则失败:', error.message);
      throw error;
    }
  }
}

module.exports = new SimulationSchedulingService();
