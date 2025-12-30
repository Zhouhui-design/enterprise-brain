const { query } = require('../config/database');

/**
 * 跨表查询引擎服务
 * 支持MINIFS、MAXIFS、LOOKUP、SUMIFS等Excel公式查询
 */
class CrossTableQueryService {
  
  /**
   * MINIFS查询 - 查找满足多个条件的最小值
   * @param {string} targetTable 目标表名
   * @param {string} targetColumn 目标列名
   * @param {Object} conditions 查询条件 {column: value}
   * @returns {Promise<Number|null>} 最小值或null
   */
  async minIfs(targetTable, targetColumn, conditions) {
    try {
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      // 构建WHERE条件
      for (const [column, value] of Object.entries(conditions)) {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            // 处理IN条件
            whereClause += ` AND ${column} IN (${value.map(() => '?').join(',')})`;
            params.push(...value);
          } else if (typeof value === 'string' && value.includes('>=')) {
            // 处理大于等于条件
            const [operator, val] = value.split('>=');
            whereClause += ` AND ${column} >= ?`;
            params.push(val.trim());
          } else if (typeof value === 'string' && value.includes('>')) {
            // 处理大于条件
            const [operator, val] = value.split('>');
            whereClause += ` AND ${column} > ?`;
            params.push(val.trim());
          } else {
            // 处理等于条件
            whereClause += ` AND ${column} = ?`;
            params.push(value);
          }
        }
      }
      
      const sql = `
        SELECT MIN(${targetColumn}) as min_value 
        FROM ${targetTable} 
        ${whereClause}
      `;
      
      const result = await query(sql, params);
      return result.length > 0 ? result[0].min_value : null;
      
    } catch (error) {
      console.error('❌ MINIFS查询失败:', error.message);
      throw error;
    }
  }

  /**
   * MAXIFS查询 - 查找满足多个条件的最大值
   * @param {string} targetTable 目标表名
   * @param {string} targetColumn 目标列名
   * @param {Object} conditions 查询条件
   * @returns {Promise<Number|null>} 最大值或null
   */
  async maxIfs(targetTable, targetColumn, conditions) {
    try {
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      for (const [column, value] of Object.entries(conditions)) {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            whereClause += ` AND ${column} IN (${value.map(() => '?').join(',')})`;
            params.push(...value);
          } else if (typeof value === 'string' && value.includes('<=')) {
            const [operator, val] = value.split('<=');
            whereClause += ` AND ${column} <= ?`;
            params.push(val.trim());
          } else if (typeof value === 'string' && value.includes('<')) {
            const [operator, val] = value.split('<');
            whereClause += ` AND ${column} < ?`;
            params.push(val.trim());
          } else {
            whereClause += ` AND ${column} = ?`;
            params.push(value);
          }
        }
      }
      
      const sql = `
        SELECT MAX(${targetColumn}) as max_value 
        FROM ${targetTable} 
        ${whereClause}
      `;
      
      const result = await query(sql, params);
      return result.length > 0 ? result[0].max_value : null;
      
    } catch (error) {
      console.error('❌ MAXIFS查询失败:', error.message);
      throw error;
    }
  }

  /**
   * LOOKUP查询 - 查找满足条件的单个值
   * @param {string} targetTable 目标表名
   * @param {string} targetColumn 目标列名
   * @param {Object} conditions 查询条件
   * @returns {Promise<any>} 查询结果
   */
  async lookup(targetTable, targetColumn, conditions) {
    try {
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      for (const [column, value] of Object.entries(conditions)) {
        if (value !== null && value !== undefined) {
          whereClause += ` AND ${column} = ?`;
          params.push(value);
        }
      }
      
      const sql = `
        SELECT ${targetColumn} as lookup_value 
        FROM ${targetTable} 
        ${whereClause}
        LIMIT 1
      `;
      
      const result = await query(sql, params);
      return result.length > 0 ? result[0].lookup_value : null;
      
    } catch (error) {
      console.error('❌ LOOKUP查询失败:', error.message);
      throw error;
    }
  }

  /**
   * SUMIFS查询 - 满足条件的总和
   * @param {string} targetTable 目标表名
   * @param {string} targetColumn 目标列名
   * @param {Object} conditions 查询条件
   * @returns {Promise<Number>} 总和
   */
  async sumIfs(targetTable, targetColumn, conditions) {
    try {
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      for (const [column, value] of Object.entries(conditions)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'string' && value.includes('<=')) {
            const [operator, val] = value.split('<=');
            whereClause += ` AND ${column} <= ?`;
            params.push(val.trim());
          } else if (typeof value === 'string' && value.includes('<')) {
            const [operator, val] = value.split('<');
            whereClause += ` AND ${column} < ?`;
            params.push(val.trim());
          } else {
            whereClause += ` AND ${column} = ?`;
            params.push(value);
          }
        }
      }
      
      const sql = `
        SELECT COALESCE(SUM(${targetColumn}), 0) as sum_value 
        FROM ${targetTable} 
        ${whereClause}
      `;
      
      const result = await query(sql, params);
      return result.length > 0 ? parseFloat(result[0].sum_value) || 0 : 0;
      
    } catch (error) {
      console.error('❌ SUMIFS查询失败:', error.message);
      throw error;
    }
  }

  /**
   * COUNTIFS查询 - 满足条件的记录数
   * @param {string} targetTable 目标表名
   * @param {Object} conditions 查询条件
   * @returns {Promise<Number>} 记录数
   */
  async countIfs(targetTable, conditions) {
    try {
      let whereClause = 'WHERE 1=1';
      let params = [];
      
      for (const [column, value] of Object.entries(conditions)) {
        if (value !== null && value !== undefined) {
          whereClause += ` AND ${column} = ?`;
          params.push(value);
        }
      }
      
      const sql = `
        SELECT COUNT(*) as count_value 
        FROM ${targetTable} 
        ${whereClause}
      `;
      
      const result = await query(sql, params);
      return result.length > 0 ? parseInt(result[0].count_value) || 0 : 0;
      
    } catch (error) {
      console.error('❌ COUNTIFS查询失败:', error.message);
      throw error;
    }
  }

  // ==================== 业务特定的查询方法 ====================

  /**
   * 查询工序能力负荷表 - 获取最小有效排程日期
   * @param {Date} plannedScheduleDate 计划排程日期
   * @param {string} currentProcess 当前工序
   * @returns {Promise<Date|null>} 有效计划排程日期
   */
  async getEffectivePlannedDate(plannedScheduleDate, currentProcess) {
    try {
      const conditions = {
        'date': `>=${plannedScheduleDate}`,
        'process_name': currentProcess,
        'remaining_hours': '>0'
      };
      
      return await this.minIfs('process_capacity_load', 'date', conditions);
      
    } catch (error) {
      console.error('❌ 查询有效计划排程日期失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询工序能力负荷表 - 获取当天剩余工时
   * @param {Date} effectivePlannedDate 有效计划排程日期
   * @param {string} currentProcess 当前工序
   * @returns {Promise<Number>} 当天剩余工时
   */
  async getDailyRemainingHours(effectivePlannedDate, currentProcess) {
    try {
      const conditions = {
        'date': effectivePlannedDate,
        'process_name': currentProcess
      };
      
      const result = await this.lookup('process_capacity_load', 'remaining_hours', conditions);
      return parseFloat(result) || 0;
      
    } catch (error) {
      console.error('❌ 查询当天剩余工时失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询产品物料库 - 获取定时工额
   * @param {string} materialCode 物料编号
   * @returns {Promise<Number>} 定时工额
   */
  async getHourlyQuota(materialCode) {
    try {
      const conditions = {
        'material_code': materialCode
      };
      
      const result = await this.lookup('materials', 'standard_time', conditions);
      return parseFloat(result) || 0;
      
    } catch (error) {
      console.error('❌ 查询定时工额失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询生产BOM - 获取后道工序信息
   * @param {string} levelAddress 层阶地址
   * @returns {Promise<Object|null>} 后道工序信息
   */
  async getDownstreamProcessInfo(levelAddress) {
    try {
      const conditions = {
        'level_address': levelAddress
      };
      
      const sql = `
        SELECT 
          downstream_level_address,
          downstream_process_name,
          downstream_product_code,
          downstream_product_name,
          downstream_level0_standard_usage,
          downstream_product_source
        FROM list_style_bom_children lsc
        JOIN list_style_production_boms lsp ON lsc.parent_id = lsp.id
        WHERE lsc.child_code = ?
        LIMIT 1
      `;
      
      const result = await query(sql, [levelAddress]);
      return result.length > 0 ? result[0] : null;
      
    } catch (error) {
      console.error('❌ 查询后道工序信息失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询预计结存 - 获取后道可用库存
   * @param {Date} effectivePlannedDate 有效计划排程日期
   * @param {string} downstreamProductCode 后道工序产品编号
   * @returns {Promise<Number>} 后道可用库存
   */
  async getDownstreamAvailableInventory(effectivePlannedDate, downstreamProductCode) {
    try {
      // 计算effectivePlannedDate + 1天
      const nextDay = new Date(effectivePlannedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // 先找出最大日期
      const maxDate = await this.maxIfs('projected_balance', 'estimated_date', {
        'estimated_date': `<=${nextDay.toISOString().split('T')[0]}`,
        'product_code': downstreamProductCode
      });
      
      if (!maxDate) return 0;
      
      // 再找出该日期下的最大序号
      const maxSequence = await this.maxIfs('projected_balance', 'sequence', {
        'estimated_date': maxDate,
        'product_code': downstreamProductCode
      });
      
      if (!maxSequence) return 0;
      
      // 查询预计结存值
      const conditions = {
        'estimated_date': maxDate,
        'product_code': downstreamProductCode,
        'sequence': maxSequence
      };
      
      const result = await this.lookup('projected_balance', 'estimated_balance', conditions);
      return parseFloat(result) || 0;
      
    } catch (error) {
      console.error('❌ 查询后道可用库存失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询模拟排程工序表 - 按顺序总需
   * @param {string} currentMaterialCode 当前物料编号
   * @param {number} sequenceNumber 序号
   * @returns {Promise<Number>} 按顺序总需
   */
  async getTotalRequiredByOrder(currentMaterialCode, sequenceNumber) {
    try {
      const conditions = {
        'current_material_code': currentMaterialCode,
        'sequence_number': `<=${sequenceNumber}`
      };
      
      return await this.sumIfs('simulation_scheduling_process_table', 'current_required_qty', conditions);
      
    } catch (error) {
      console.error('❌ 查询按顺序总需失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询模拟排程工序表 - 当前累计排程数量
   * @param {string} productCode 产品编号
   * @param {string} internalSalesOrderNo 内部销售订单编号
   * @param {string} currentLevelAddress 当前层阶地址
   * @param {number} sequenceNumber 序号
   * @returns {Promise<Number>} 当前累计排程数量
   */
  async getCurrentCumulativeQuantity(productCode, internalSalesOrderNo, currentLevelAddress, sequenceNumber) {
    try {
      const conditions = {
        'product_code': productCode,
        'internal_sales_order_no': internalSalesOrderNo,
        'current_level_address': currentLevelAddress,
        'sequence_number': `<=${sequenceNumber}`
      };
      
      return await this.sumIfs('simulation_scheduling_process_table', 'current_planned_quantity', conditions);
      
    } catch (error) {
      console.error('❌ 查询当前累计排程数量失败:', error.message);
      throw error;
    }
  }

  /**
   * 查询模拟排程工序表 - 当天模拟累计工时
   * @param {Date} effectivePlannedDate 有效计划排程日期
   * @param {string} currentProcess 当前工序
   * @param {number} sequenceNumber 序号
   * @returns {Promise<Number>} 当天模拟累计工时
   */
  async getDailyCumulativeHours(effectivePlannedDate, currentProcess, sequenceNumber) {
    try {
      const conditions = {
        'effective_planned_date': effectivePlannedDate,
        'current_process': currentProcess,
        'sequence_number': `<${sequenceNumber}`
      };
      
      return await this.sumIfs('simulation_scheduling_process_table', 'current_planned_hours', conditions);
      
    } catch (error) {
      console.error('❌ 查询当天模拟累计工时失败:', error.message);
      throw error;
    }
  }
}

module.exports = new CrossTableQueryService();
