const { pool } = require('../config/database');

/**
 * 工序计划服务
 */
class ProcessPlanService {
  /**
   * 获取所有工序计划(分页)
   */
  static async getAll(params = {}) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        planNo, 
        masterPlanNo, 
        processName,
        scheduleDateStart,
        scheduleDateEnd 
      } = params;
      
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
      const countSQL = `SELECT COUNT(*) as total FROM process_plans ${whereSQL}`;
      const [countResult] = await pool.execute(countSQL, queryParams);
      const total = countResult[0].total;
      
      // 分页查询
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT * FROM process_plans 
        ${whereSQL}
        ORDER BY created_at DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await pool.execute(dataSQL, queryParams);
      
      return {
        records: rows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      console.error('获取工序计划列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取工序计划
   */
  static async getById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM process_plans WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('获取工序计划详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建工序计划
   */
  static async create(data) {
    try {
      const sql = `
        INSERT INTO process_plans (
          plan_no, schedule_date, sales_order_no, master_plan_no, shipping_plan_no,
          product_code, product_name, product_image, process_manager, process_name,
          schedule_quantity, used_work_hours, product_unit, level0_demand, completion_date,
          workshop_name, daily_available_hours, remaining_schedule_hours, schedule_count,
          standard_work_hours, standard_work_quota, scheduled_hours, unscheduled_hours,
          source_page_name, source_no, previous_schedule_no, customer_name,
          level0_product_name, level0_product_code, level0_production_qty,
          product_source, bom_no, submitted_by, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(sql, [
        data.planNo,
        data.scheduleDate || null,
        data.salesOrderNo || null,
        data.masterPlanNo || null,
        data.shippingPlanNo || null,
        data.productCode || null,
        data.productName || null,
        data.productImage || null,
        data.processManager || null,
        data.processName || null,
        data.scheduleQuantity || 0,
        data.usedWorkHours || 0,
        data.productUnit || null,
        data.level0Demand || 0,
        data.completionDate || null,
        data.workshopName || null,
        data.dailyAvailableHours || 0,
        data.remainingScheduleHours || 0,
        data.scheduleCount || 0,
        data.standardWorkHours || 0,
        data.standardWorkQuota || 0,
        data.scheduledHours || 0,
        data.unscheduledHours || 0,
        data.sourcePageName || null,
        data.sourceNo || null,
        data.previousScheduleNo || null,
        data.customerName || null,
        data.level0ProductName || null,
        data.level0ProductCode || null,
        data.level0ProductionQty || 0,
        data.productSource || null,
        data.bomNo || null,
        data.submittedBy || null,
        data.submittedAt || null
      ]);
      
      console.log(`工序计划创建成功, ID: ${result.insertId}, 编号: ${data.planNo}`);
      return { id: result.insertId };
    } catch (error) {
      console.error('创建工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 更新工序计划
   */
  static async update(id, data) {
    try {
      const sql = `
        UPDATE process_plans SET
          schedule_date = ?, sales_order_no = ?, master_plan_no = ?, shipping_plan_no = ?,
          product_code = ?, product_name = ?, product_image = ?, process_manager = ?,
          process_name = ?, schedule_quantity = ?, used_work_hours = ?, product_unit = ?,
          level0_demand = ?, completion_date = ?, workshop_name = ?, daily_available_hours = ?,
          remaining_schedule_hours = ?, schedule_count = ?, standard_work_hours = ?,
          standard_work_quota = ?, scheduled_hours = ?, unscheduled_hours = ?,
          source_page_name = ?, source_no = ?, previous_schedule_no = ?, customer_name = ?,
          level0_product_name = ?, level0_product_code = ?, level0_production_qty = ?,
          product_source = ?, bom_no = ?, submitted_by = ?, submitted_at = ?
        WHERE id = ?
      `;
      
      const [result] = await pool.execute(sql, [
        data.scheduleDate || null,
        data.salesOrderNo || null,
        data.masterPlanNo || null,
        data.shippingPlanNo || null,
        data.productCode || null,
        data.productName || null,
        data.productImage || null,
        data.processManager || null,
        data.processName || null,
        data.scheduleQuantity || 0,
        data.usedWorkHours || 0,
        data.productUnit || null,
        data.level0Demand || 0,
        data.completionDate || null,
        data.workshopName || null,
        data.dailyAvailableHours || 0,
        data.remainingScheduleHours || 0,
        data.scheduleCount || 0,
        data.standardWorkHours || 0,
        data.standardWorkQuota || 0,
        data.scheduledHours || 0,
        data.unscheduledHours || 0,
        data.sourcePageName || null,
        data.sourceNo || null,
        data.previousScheduleNo || null,
        data.customerName || null,
        data.level0ProductName || null,
        data.level0ProductCode || null,
        data.level0ProductionQty || 0,
        data.productSource || null,
        data.bomNo || null,
        data.submittedBy || null,
        data.submittedAt || null,
        id
      ]);
      
      if (result.affectedRows === 0) {
        throw new Error('工序计划不存在或未更新');
      }
      
      console.log(`工序计划更新成功, ID: ${id}`);
      return { id };
    } catch (error) {
      console.error('更新工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 删除工序计划
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM process_plans WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('工序计划不存在');
      }
      
      console.log(`工序计划删除成功, ID: ${id}`);
      return { success: true };
    } catch (error) {
      console.error('删除工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 批量删除工序计划
   */
  static async batchDelete(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      for (const id of ids) {
        const [result] = await connection.execute('DELETE FROM process_plans WHERE id = ?', [id]);
        successCount += result.affectedRows;
      }
      
      await connection.commit();
      console.log(`批量删除工序计划完成: 成功${successCount}条/总共${ids.length}条`);
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      console.error('批量删除工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = ProcessPlanService;
