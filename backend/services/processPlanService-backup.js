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
      const countSQL = `SELECT COUNT(*) as total FROM process_plans ${whereSQL}`;
      const [countResult] = await pool.execute(countSQL, queryParams);
      const total = countResult[0].total;

      // 分页查询
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT * FROM process_plans 
        ${whereSQL}
        ORDER BY schedule_date ASC, created_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `;
      const [rows] = await pool.execute(dataSQL, queryParams);

      // 转换字段名：snake_case -> camelCase
      const convertedRows = rows.map(row => {
        const convertedRow = {};
        Object.keys(row).forEach(key => {
          // 将下划线命名转换为驼峰命名
          const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
          convertedRow[camelKey] = row[key];
        });
        return convertedRow;
      });

      console.log(`✅ 查询成功，共 ${total} 条记录，当前页 ${convertedRows.length} 条`);
      if (convertedRows.length > 0) {
        console.log(`首条记录: ${convertedRows[0].planNo} - ${convertedRows[0].processName}`);
        console.log('🔍 字段转换示例:', {
          plan_no: convertedRows[0].planNo,
          process_name: convertedRows[0].processName,
          master_plan_no: convertedRows[0].masterPlanNo,
          source_no: convertedRows[0].sourceNo, // ✅ 添加来源编号转换日志
          schedule_count: convertedRows[0].scheduleCount, // ✅ 添加排程次数转换日志
        });
      }

      return {
        records: convertedRows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
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
      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];
      // 转换字段名：snake_case -> camelCase
      const convertedRow = {};
      Object.keys(row).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
        convertedRow[camelKey] = row[key];
      });

      return convertedRow;
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
      // ✅ 计算需求工时：需补货数量 / 定时工额，保留2位小数
      let requiredWorkHours = 0;
      if (
        data.replenishmentQty &&
        data.standardWorkQuota &&
        parseFloat(data.replenishmentQty) > 0 &&
        parseFloat(data.standardWorkQuota) > 0
      ) {
        requiredWorkHours = parseFloat(
          (parseFloat(data.replenishmentQty) / parseFloat(data.standardWorkQuota)).toFixed(2),
        );
        console.log(`✅ 计算需求工时: ${data.replenishmentQty} / ${data.standardWorkQuota} = ${requiredWorkHours}`);
      }

      const sql = `
        INSERT INTO process_plans (
          plan_no, schedule_date, sales_order_no, master_plan_no, shipping_plan_no,
          product_code, product_name, product_image, process_manager, process_name,
          schedule_quantity, used_work_hours, product_unit, level0_demand, completion_date,
          plan_start_date, plan_end_date,
          workshop_name, daily_available_hours, remaining_schedule_hours, schedule_count,
          standard_work_hours, standard_work_quota, scheduled_hours, unscheduled_hours,
          source_page_name, source_no, previous_schedule_no, customer_name,
          level0_product_name, level0_product_code, level0_production_qty,
          product_source, bom_no, submitted_by, submitted_at, replenishment_qty,
          required_work_hours
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        data.planStartDate || null,
        data.planEndDate || null,
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
        data.replenishmentQty || 0,
        requiredWorkHours,
      ]);

      console.log(`工序计划创建成功, ID: ${result.insertId}, 编号: ${data.planNo}, 需求工时: ${requiredWorkHours}`);
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
      // ✅ 计算需求工时：需补货数量 / 定时工额，保留2位小数
      let requiredWorkHours = data.requiredWorkHours || 0;
      if (
        data.replenishmentQty !== undefined &&
        data.standardWorkQuota !== undefined &&
        parseFloat(data.replenishmentQty) > 0 &&
        parseFloat(data.standardWorkQuota) > 0
      ) {
        requiredWorkHours = parseFloat(
          (parseFloat(data.replenishmentQty) / parseFloat(data.standardWorkQuota)).toFixed(2),
        );
        console.log(`✅ 更新计算需求工时: ${data.replenishmentQty} / ${data.standardWorkQuota} = ${requiredWorkHours}`);
      }

      const sql = `
        UPDATE process_plans SET
          schedule_date = ?, sales_order_no = ?, master_plan_no = ?, shipping_plan_no = ?,
          product_code = ?, product_name = ?, product_image = ?, process_manager = ?,
          process_name = ?, schedule_quantity = ?, used_work_hours = ?, product_unit = ?,
          level0_demand = ?, completion_date = ?, plan_start_date = ?, plan_end_date = ?,
          workshop_name = ?, daily_available_hours = ?,
          remaining_schedule_hours = ?, schedule_count = ?, standard_work_hours = ?,
          standard_work_quota = ?, scheduled_hours = ?, unscheduled_hours = ?,
          source_page_name = ?, source_no = ?, previous_schedule_no = ?, customer_name = ?,
          level0_product_name = ?, level0_product_code = ?, level0_production_qty = ?,
          product_source = ?, bom_no = ?, submitted_by = ?, submitted_at = ?, replenishment_qty = ?,
          required_work_hours = ?
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
        data.planStartDate || null,
        data.planEndDate || null,
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
        data.replenishmentQty || 0,
        requiredWorkHours,
        id,
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
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // ✅ 步颂1: 先查询工序计划详情(用于后续释放已占用工时)
      const [planRows] = await connection.execute(
        'SELECT plan_no, process_name, schedule_date, used_work_hours FROM process_plans WHERE id = ?',
        [id],
      );

      if (planRows.length === 0) {
        await connection.rollback();
        throw new Error('工序计划不存在');
      }

      const plan = planRows[0];
      console.log(`🗑️ 删除工序计划: ${plan.plan_no}`);

      // ✅ 步颂2: 执行删除
      const [result] = await connection.execute('DELETE FROM process_plans WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        await connection.rollback();
        throw new Error('工序计划不存在');
      }

      console.log(`✅ 工序计划删除成功, ID: ${id}`);

      // ✅ 步颂3: 删除后自动重置已占用工时(调用SUMIF逻辑)
      if (plan.process_name && plan.schedule_date) {
        try {
          const processName = plan.process_name;
          const scheduleDate =
            plan.schedule_date instanceof Date
              ? plan.schedule_date.toISOString().split('T')[0]
              : String(plan.schedule_date).split('T')[0];

          console.log(`🔄 自动重置已占用工时: 工序=${processName}, 日期=${scheduleDate}`);

          // ✅ SUMIF - 重新统计该工序+日期下所有工序计划的计划排程工时总和
          const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(used_work_hours), 0) as total_hours 
             FROM process_plans 
             WHERE process_name = ? 
               AND schedule_date = ?`,
            [processName, scheduleDate],
          );

          // ✅ 补充规则: if(sumifs的结果返回null, 0, sumifs的结果)
          const sumResult = sumRows[0].total_hours;
          const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
          const newOccupiedHours = parseFloat(validResult.toFixed(2));

          console.log(`  SUMIF查询结果: ${sumResult}, 新占用工时: ${newOccupiedHours}`);

          // ✅ 查询工序能力负荷记录
          const [capacityRows] = await connection.execute(
            'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
            [processName, scheduleDate],
          );

          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);

            // ✅ 重新计算剩余工时和剩余时段
            const newRemainingHours = parseFloat((workShift * availableWorkstations - newOccupiedHours).toFixed(2));

            let newRemainingShift = null;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat((newRemainingHours / availableWorkstations).toFixed(2));
            }

            // ✅ 更新数据库
            await connection.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id],
            );

            console.log(
              `✅ 已占用工时重置成功: ${previousOccupiedHours} → ${newOccupiedHours} (释放${(previousOccupiedHours - newOccupiedHours).toFixed(2)}小时)`,
            );
          } else {
            console.warn(`⚠️ 未找到工序能力负荷记录: 工序=${processName}, 日期=${scheduleDate}`);
          }
        } catch (error) {
          console.error(`⚠️ 自动重置已占用工时失败:`, error.message);
          // 不阻塞删除流程,继续提交
        }
      }

      await connection.commit();
      console.log(`✅ 工序计划删除成功, ID: ${id}`);
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('删除工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
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
      const affectedProcessDates = new Set(); // 记录受影响的工序+日期

      for (const id of ids) {
        // ✅ 步颂1: 先查询工序计划详情
        const [planRows] = await connection.execute(
          'SELECT plan_no, process_name, schedule_date FROM process_plans WHERE id = ?',
          [id],
        );

        if (planRows.length > 0) {
          const plan = planRows[0];

          // ✅ 记录受影响的工序+日期
          if (plan.process_name && plan.schedule_date) {
            const scheduleDate =
              plan.schedule_date instanceof Date
                ? plan.schedule_date.toISOString().split('T')[0]
                : String(plan.schedule_date).split('T')[0];
            affectedProcessDates.add(`${plan.process_name}|${scheduleDate}`);
          }

          // ✅ 步颂2: 执行删除
          const [result] = await connection.execute('DELETE FROM process_plans WHERE id = ?', [id]);
          successCount += result.affectedRows;
        }
      }

      // ✅ 步颂3: 批量重置受影响的工序+日期的已占用工时
      console.log(`🔄 批量重置 ${affectedProcessDates.size} 个工序+日期的已占用工时`);

      for (const key of affectedProcessDates) {
        const [processName, scheduleDate] = key.split('|');

        try {
          // ✅ SUMIF - 重新统计该工序+日期下所有工序计划的计划排程工时总和
          const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(used_work_hours), 0) as total_hours 
             FROM process_plans 
             WHERE process_name = ? 
               AND schedule_date = ?`,
            [processName, scheduleDate],
          );

          const sumResult = sumRows[0].total_hours;
          const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
          const newOccupiedHours = parseFloat(validResult.toFixed(2));

          // ✅ 查询工序能力负荷记录
          const [capacityRows] = await connection.execute(
            'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
            [processName, scheduleDate],
          );

          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);

            // ✅ 重新计算剩余工时和妉余时段
            const newRemainingHours = parseFloat((workShift * availableWorkstations - newOccupiedHours).toFixed(2));

            let newRemainingShift = null;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat((newRemainingHours / availableWorkstations).toFixed(2));
            }

            // ✅ 更新数据库
            await connection.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id],
            );

            console.log(
              `✅ [工序=${processName}, 日期=${scheduleDate}] ${previousOccupiedHours} → ${newOccupiedHours}`,
            );
          }
        } catch (error) {
          console.error(`⚠️ [工序=${processName}, 日期=${scheduleDate}] 重置失败:`, error.message);
          // 继续处理其他记录
        }
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
