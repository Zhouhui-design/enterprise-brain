const PlanEndDateCalculator = require('../utils/planEndDateCalculator');
const { pool } = require('../config/database');
const { formatLocalDate } = require('../utils/dateFormatter');

/**
 * 基础工序计划服务
 * 为各种工序计划服务提供公共逻辑
 */
class BaseProcessPlanService {
  constructor(tableName, serviceName) {
    this.tableName = tableName;
    this.serviceName = serviceName;
  }

  /**
   * 获取所有工序计划(分页)
   */
  async getAll(params = {}) {
    try {
      const { page = 1, pageSize = 20, planNo, masterPlanNo, processName, scheduleDateStart, scheduleDateEnd } = params;

      let whereClause = [];
      const queryParams = [];

      if (planNo) {
        whereClause.push('plan_no LIKE ?');
        queryParams.push(`%${planNo}%`);
      }

      if (masterPlanNo) {
        whereClause.push('master_plan_no LIKE ?');
        queryParams.push(`%${masterPlanNo}%`);
      }

      if (processName) {
        whereClause.push('process_name LIKE ?');
        queryParams.push(`%${processName}%`);
      }

      if (scheduleDateStart) {
        whereClause.push('schedule_date >= ?');
        queryParams.push(scheduleDateStart);
      }

      if (scheduleDateEnd) {
        whereClause.push('schedule_date <= ?');
        queryParams.push(scheduleDateEnd);
      }

      const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';

      // 查询总数
      const countSQL = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereSQL}`;
      const [countResult] = await pool.execute(countSQL, queryParams);
      const total = countResult[0].total;

      // 计算偏移量
      const offset = (page - 1) * pageSize;

      // 查询数据
      const dataSQL = `
        SELECT * FROM ${this.tableName} 
        ${whereSQL} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      queryParams.push(pageSize, offset);
      const [data] = await pool.execute(dataSQL, queryParams);

      return {
        total,
        page,
        pageSize,
        data: data.map(item => ({
          ...item,
          scheduleDate: item.schedule_date ? formatLocalDate(item.schedule_date) : null,
          createdAt: item.created_at ? formatLocalDate(item.created_at) : null,
          updatedAt: item.updated_at ? formatLocalDate(item.updated_at) : null,
        })),
      };
    } catch (error) {
      console.error(`${this.serviceName} - 获取所有计划失败:`, error);
      throw error;
    }
  }

  /**
   * 根据ID获取工序计划
   */
  async getById(id) {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const [result] = await pool.execute(sql, [id]);
      
      if (result.length === 0) {
        return null;
      }
      
      const item = result[0];
      return {
        ...item,
        scheduleDate: item.schedule_date ? formatLocalDate(item.schedule_date) : null,
        createdAt: item.created_at ? formatLocalDate(item.created_at) : null,
        updatedAt: item.updated_at ? formatLocalDate(item.updated_at) : null,
      };
    } catch (error) {
      console.error(`${this.serviceName} - 根据ID获取计划失败:`, error);
      throw error;
    }
  }

  /**
   * 创建工序计划
   */
  async create(planData) {
    try {
      // 计算计划结束日期
      const endDate = PlanEndDateCalculator.calculate(planData);
      
      const sql = `
        INSERT INTO ${this.tableName} (
          plan_no, master_plan_no, product_no, product_name, process_no, process_name, 
          quantity, schedule_date, start_time, end_time, plan_status, 
          created_by, created_at, updated_at, end_date, lead_time, 
          machine_no, team_no, worker_no, remark, work_center, 
          setup_time, run_time_per_unit, actual_start_time, actual_end_time, actual_quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(sql, [
        planData.planNo,
        planData.masterPlanNo,
        planData.productNo,
        planData.productName,
        planData.processNo,
        planData.processName,
        planData.quantity,
        planData.scheduleDate,
        planData.startTime,
        planData.endTime,
        planData.planStatus || 'planned',
        planData.createdBy || 'system',
        endDate,
        planData.leadTime || 0,
        planData.machineNo,
        planData.teamNo,
        planData.workerNo,
        planData.remark,
        planData.workCenter,
        planData.setupTime || 0,
        planData.runTimePerUnit || 0,
        planData.actualStartTime,
        planData.actualEndTime,
        planData.actualQuantity || 0
      ]);
      
      return this.getById(result.insertId);
    } catch (error) {
      console.error(`${this.serviceName} - 创建计划失败:`, error);
      throw error;
    }
  }

  /**
   * 更新工序计划
   */
  async update(id, planData) {
    try {
      // 计算计划结束日期
      const endDate = PlanEndDateCalculator.calculate(planData);
      
      const sql = `
        UPDATE ${this.tableName} SET 
          plan_no = ?, master_plan_no = ?, product_no = ?, product_name = ?, process_no = ?, process_name = ?, 
          quantity = ?, schedule_date = ?, start_time = ?, end_time = ?, plan_status = ?, 
          updated_at = NOW(), end_date = ?, lead_time = ?, 
          machine_no = ?, team_no = ?, worker_no = ?, remark = ?, work_center = ?, 
          setup_time = ?, run_time_per_unit = ?, actual_start_time = ?, actual_end_time = ?, actual_quantity = ? 
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(sql, [
        planData.planNo,
        planData.masterPlanNo,
        planData.productNo,
        planData.productName,
        planData.processNo,
        planData.processName,
        planData.quantity,
        planData.scheduleDate,
        planData.startTime,
        planData.endTime,
        planData.planStatus,
        endDate,
        planData.leadTime || 0,
        planData.machineNo,
        planData.teamNo,
        planData.workerNo,
        planData.remark,
        planData.workCenter,
        planData.setupTime || 0,
        planData.runTimePerUnit || 0,
        planData.actualStartTime,
        planData.actualEndTime,
        planData.actualQuantity || 0,
        id
      ]);
      
      if (result.affectedRows === 0) {
        return null;
      }
      
      return this.getById(id);
    } catch (error) {
      console.error(`${this.serviceName} - 更新计划失败:`, error);
      throw error;
    }
  }

  /**
   * 删除工序计划
   */
  async delete(id) {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const [result] = await pool.execute(sql, [id]);
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error(`${this.serviceName} - 删除计划失败:`, error);
      throw error;
    }
  }

  /**
   * 批量创建工序计划
   */
  async batchCreate(plansData) {
    try {
      if (!Array.isArray(plansData) || plansData.length === 0) {
        return { success: false, message: '请提供有效的计划数据' };
      }
      
      const insertPromises = plansData.map(planData => this.create(planData));
      const results = await Promise.all(insertPromises);
      
      return {
        success: true,
        count: results.length,
        data: results
      };
    } catch (error) {
      console.error(`${this.serviceName} - 批量创建计划失败:`, error);
      throw error;
    }
  }

  /**
   * 批量更新工序计划状态
   */
  async batchUpdateStatus(ids, status) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return { success: false, message: '请提供有效的计划ID' };
      }
      
      const placeholders = ids.map(() => '?').join(',');
      const sql = `UPDATE ${this.tableName} SET plan_status = ?, updated_at = NOW() WHERE id IN (${placeholders})`;
      
      const [result] = await pool.execute(sql, [status, ...ids]);
      
      return {
        success: true,
        updatedCount: result.affectedRows
      };
    } catch (error) {
      console.error(`${this.serviceName} - 批量更新状态失败:`, error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(params = {}) {
    try {
      const { dateStart, dateEnd, status } = params;
      
      let whereClause = [];
      const queryParams = [];
      
      if (dateStart && dateEnd) {
        whereClause.push('schedule_date BETWEEN ? AND ?');
        queryParams.push(dateStart, dateEnd);
      } else if (dateStart) {
        whereClause.push('schedule_date >= ?');
        queryParams.push(dateStart);
      } else if (dateEnd) {
        whereClause.push('schedule_date <= ?');
        queryParams.push(dateEnd);
      }
      
      if (status) {
        whereClause.push('plan_status = ?');
        queryParams.push(status);
      }
      
      const whereSQL = whereClause.length > 0 ? 'WHERE ' + whereClause.join(' AND ') : '';
      
      // 总计划数
      const totalSql = `SELECT COUNT(*) as total FROM ${this.tableName} ${whereSQL}`;
      const [totalResult] = await pool.execute(totalSql, [...queryParams]);
      
      // 按状态分组统计
      const statusSql = `SELECT plan_status, COUNT(*) as count FROM ${this.tableName} ${whereSQL} GROUP BY plan_status`;
      const [statusResult] = await pool.execute(statusSql, [...queryParams]);
      
      // 总数量
      const quantitySql = `SELECT SUM(quantity) as totalQuantity FROM ${this.tableName} ${whereSQL}`;
      const [quantityResult] = await pool.execute(quantitySql, [...queryParams]);
      
      return {
        total: totalResult[0].total,
        byStatus: statusResult.reduce((acc, item) => {
          acc[item.plan_status] = item.count;
          return acc;
        }, {}),
        totalQuantity: quantityResult[0].totalQuantity || 0
      };
    } catch (error) {
      console.error(`${this.serviceName} - 获取统计信息失败:`, error);
      throw error;
    }
  }
}

module.exports = BaseProcessPlanService;
