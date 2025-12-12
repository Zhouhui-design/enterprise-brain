const { pool } = require('../config/database');

/**
 * 真工序计划服务
 */
class RealProcessPlanService {
  /**
   * 获取所有真工序计划(分页)
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
      const countSQL = `SELECT COUNT(*) as total FROM real_process_plans ${whereSQL}`;
      const [countResult] = await pool.execute(countSQL, queryParams);
      const total = countResult[0].total;
      
      // 分页查询
      const offset = (parseInt(page) - 1) * parseInt(pageSize);
      const limit = parseInt(pageSize);
      const dataSQL = `
        SELECT * FROM real_process_plans 
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
          source_no: convertedRows[0].sourceNo,  // ✅ 添加来源编号转换日志
          schedule_count: convertedRows[0].scheduleCount  // ✅ 添加排程次数转换日志
        });
      }
      
      return {
        records: convertedRows,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      };
    } catch (error) {
      console.error('获取真工序计划列表失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取真工序计划
   */
  static async getById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM real_process_plans WHERE id = ?', [id]);
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
      console.error('获取真工序计划详情失败:', error);
      throw error;
    }
  }

  /**
   * 创建真工序计划
   */
  static async create(data) {
    try {
      // 正确的SQL，包含所有字段，数量匹配
      const sql = `
        INSERT INTO real_process_plans (
          plan_no, schedule_date, sales_order_no, master_plan_no, shipping_plan_no,
          product_code, product_name, product_image, process_manager, process_name,
          schedule_quantity, product_unit, level0_demand, completion_date,
          plan_start_date, real_plan_start_date, plan_end_date,
          workshop_name, daily_available_hours, remaining_required_hours, schedule_count,
          standard_work_hours, standard_work_quota, cumulative_schedule_qty, unscheduled_qty,
          source_page_name, source_no, previous_schedule_no, customer_name,
          level0_product_name, level0_product_code, level0_production_qty,
          product_source, bom_no, submitted_by, submitted_at, replenishment_qty,
          required_work_hours,
          daily_total_hours, daily_scheduled_hours, scheduled_work_hours, next_schedule_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.execute(sql, [
        data.planNo,                                 // 1. plan_no
        data.scheduleDate || null,                    // 2. schedule_date
        data.salesOrderNo || null,                    // 3. sales_order_no
        data.masterPlanNo || null,                    // 4. master_plan_no
        data.shippingPlanNo || null,                  // 5. shipping_plan_no
        data.productCode || null,                     // 6. product_code
        data.productName || null,                     // 7. product_name
        data.productImage || null,                    // 8. product_image
        data.processManager || null,                  // 9. process_manager
        data.processName || null,                     // 10. process_name
        data.scheduleQuantity || 0,                   // 11. schedule_quantity
        data.productUnit || null,                     // 12. product_unit
        data.level0Demand || 0,                       // 13. level0_demand
        data.completionDate || null,                  // 14. completion_date
        data.planStartDate || null,                    // 15. plan_start_date
        data.realPlanStartDate || null,                // 16. real_plan_start_date (✅ 新增)
        data.planEndDate || null,                      // 17. plan_end_date
        data.workshopName || null,                    // 18. workshop_name
        data.dailyAvailableHours || 0,                 // 19. daily_available_hours
        data.remainingRequiredHours || 0,              // 20. remaining_required_hours
        data.scheduleCount || 0,                       // 21. schedule_count
        data.standardWorkHours || 0,                  // 22. standard_work_hours
        data.standardWorkQuota || 0,                  // 23. standard_work_quota
        data.cumulativeScheduleQty || 0,              // 24. cumulative_schedule_qty
        data.unscheduledQty || 0,                     // 25. unscheduled_qty
        data.sourcePageName || null,                  // 26. source_page_name
        data.sourceNo || null,                         // 27. source_no
        data.previousScheduleNo || null,              // 28. previous_schedule_no
        data.customerName || null,                     // 29. customer_name
        data.level0ProductName || null,                // 30. level0_product_name
        data.level0ProductCode || null,                // 31. level0_product_code
        data.level0ProductionQty || 0,                // 32. level0_production_qty
        data.productSource || null,                    // 33. product_source
        data.bomNo || null,                            // 34. bom_no
        data.submittedBy || null,                      // 35. submitted_by
        data.submittedAt || null,                      // 36. submitted_at
        data.replenishmentQty || 0,                   // 37. replenishment_qty
        data.requiredWorkHours || 0,                   // 38. required_work_hours
        data.dailyTotalHours || 0,                    // 39. daily_total_hours (✅ 新增)
        data.dailyScheduledHours || 0,                // 40. daily_scheduled_hours (✅ 新增)
        data.scheduledWorkHours || 0,                 // 41. scheduled_work_hours (✅ 新增)
        data.nextScheduleDate || null                 // 42. next_schedule_date (✅ 新增)
      ]);
      
      console.log(`真工序计划创建成功, ID: ${result.insertId}, 编号: ${data.planNo}`);
      
      // ✅ 自动推送已排程工时到工序能力负荷表
      if (data.scheduledWorkHours && data.scheduledWorkHours > 0 && data.processName && data.scheduleDate) {
        try {
          const processName = data.processName;
          const scheduleDate = data.scheduleDate instanceof Date
            ? data.scheduleDate.toISOString().split('T')[0]
            : String(data.scheduleDate).split('T')[0];
          const scheduledHours = parseFloat(data.scheduledWorkHours);
          
          console.log(`🔄 推送已排程工时到工序能力负荷表: 工序=${processName}, 日期=${scheduleDate}, 排程工时=${scheduledHours}`);
          
          // 查询工序能力负荷表记录
          const [capacityRows] = await pool.execute(
            'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
            [processName, scheduleDate]
          );
          
          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const newOccupiedHours = parseFloat((previousOccupiedHours + scheduledHours).toFixed(2));
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);
            
            // 重新计算剩余工时和剩余时段
            const newRemainingHours = parseFloat(
              (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
            );
            
            let newRemainingShift = 0;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat(
                (newRemainingHours / availableWorkstations).toFixed(2)
              );
            }
            
            // 更新数据库
            await pool.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
            );
            
            console.log(`✅ 已占用工时更新成功: ${previousOccupiedHours} → ${newOccupiedHours} (增加${scheduledHours}小时)`);
            console.log(`   剩余工时: ${newRemainingHours}, 剩余时段: ${newRemainingShift}`);
          } else {
            console.warn(`⚠️ 未找到工序能力负荷记录: 工序=${processName}, 日期=${scheduleDate}`);
          }
        } catch (error) {
          console.error(`⚠️ 推送已占用工时失败:`, error.message);
          // 不阻塞主流程,继续返回结果
        }
      }
      
      return { id: result.insertId };
    } catch (error) {
      console.error('创建真工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 更新真工序计划
   */
  static async update(id, data) {
    try {
      const sql = `
        UPDATE real_process_plans SET
          schedule_date = ?, sales_order_no = ?, master_plan_no = ?, shipping_plan_no = ?,
          product_code = ?, product_name = ?, product_image = ?, process_manager = ?,
          process_name = ?, schedule_quantity = ?, product_unit = ?,
          level0_demand = ?, completion_date = ?, plan_start_date = ?, real_plan_start_date = ?, plan_end_date = ?,
          workshop_name = ?, daily_available_hours = ?,
          remaining_required_hours = ?, schedule_count = ?, standard_work_hours = ?,
          standard_work_quota = ?, cumulative_schedule_qty = ?, unscheduled_qty = ?,
          source_page_name = ?, source_no = ?, previous_schedule_no = ?, customer_name = ?,
          level0_product_name = ?, level0_product_code = ?, level0_production_qty = ?,
          product_source = ?, bom_no = ?, submitted_by = ?, submitted_at = ?, replenishment_qty = ?,
          required_work_hours = ?,
          daily_total_hours = ?, daily_scheduled_hours = ?, scheduled_work_hours = ?, next_schedule_date = ?
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
        data.productUnit || null,
        data.level0Demand || 0,
        data.completionDate || null,
        data.planStartDate || null,
        data.realPlanStartDate || null,                // ✅ 新增
        data.planEndDate || null,
        data.workshopName || null,
        data.dailyAvailableHours || 0,
        data.remainingRequiredHours || 0,
        data.scheduleCount || 0,
        data.standardWorkHours || 0,
        data.standardWorkQuota || 0,
        data.cumulativeScheduleQty || 0,
        data.unscheduledQty || 0,
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
        data.requiredWorkHours || 0,
        data.dailyTotalHours || 0,                    // ✅ 新增
        data.dailyScheduledHours || 0,                // ✅ 新增
        data.scheduledWorkHours || 0,                 // ✅ 新增
        data.nextScheduleDate || null,                // ✅ 新增
        id
      ]);
      
      if (result.affectedRows === 0) {
        throw new Error('真工序计划不存在或未更新');
      }
      
      console.log(`真工序计划更新成功, ID: ${id}`);
      return { id };
    } catch (error) {
      console.error('更新真工序计划失败:', error);
      throw error;
    }
  }

  /**
   * 删除真工序计划
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // ✅ 步颂1: 先查询真工序计划详情(用于后续释放已占用工时)
      const [planRows] = await connection.execute(
        'SELECT plan_no, process_name, schedule_date FROM real_process_plans WHERE id = ?',
        [id]
      );
      
      if (planRows.length === 0) {
        await connection.rollback();
        throw new Error('真工序计划不存在');
      }
      
      const plan = planRows[0];
      console.log(`🗑️ 删除真工序计划: ${plan.plan_no}`);
      
      // ✅ 步颂2: 执行删除
      const [result] = await connection.execute('DELETE FROM real_process_plans WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        await connection.rollback();
        throw new Error('真工序计划不存在');
      }
      
      console.log(`✅ 真工序计划删除成功, ID: ${id}`);
      
      // ✅ 步颂3: 删除后自动重置已占用工时(调用SUMIF逻辑)
      if (plan.process_name && plan.schedule_date) {
        try {
          const processName = plan.process_name;
          const scheduleDate = plan.schedule_date instanceof Date
            ? plan.schedule_date.toISOString().split('T')[0]
            : String(plan.schedule_date).split('T')[0];
          
          console.log(`🔄 自动重置已占用工时: 工序=${processName}, 日期=${scheduleDate}`);
          
          // ✅ SUMIF - 重新统计该工序+日期下所有真工序计划的计划排程工时总和
          const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(used_work_hours), 0) as total_hours 
             FROM real_process_plans 
             WHERE process_name = ? 
               AND schedule_date = ?`,
            [processName, scheduleDate]
          );
          
          // ✅ 补充规则: if(sumifs的结果返回null, 0, sumifs的结果)
          const sumResult = sumRows[0].total_hours;
          const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
          const newOccupiedHours = parseFloat(validResult.toFixed(2));
          
          console.log(`  SUMIF查询结果: ${sumResult}, 新占用工时: ${newOccupiedHours}`);
          
          // ✅ 查询工序能力负荷记录
          const [capacityRows] = await connection.execute(
            'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
            [processName, scheduleDate]
          );
          
          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);
            
            // ✅ 重新计算剩余工时和剩余时段
            const newRemainingHours = parseFloat(
              (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
            );
            
            let newRemainingShift = null;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat(
                (newRemainingHours / availableWorkstations).toFixed(2)
              );
            }
            
            // ✅ 更新数据库
            await connection.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
            );
            
            console.log(`✅ 已占用工时重置成功: ${previousOccupiedHours} → ${newOccupiedHours} (释放${(previousOccupiedHours - newOccupiedHours).toFixed(2)}小时)`);
          } else {
            console.warn(`⚠️ 未找到工序能力负荷记录: 工序=${processName}, 日期=${scheduleDate}`);
          }
        } catch (error) {
          console.error(`⚠️ 自动重置已占用工时失败:`, error.message);
          // 不阻塞删除流程,继续提交
        }
      }
      
      await connection.commit();
      console.log(`✅ 真工序计划删除成功, ID: ${id}`);
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('删除真工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 批量删除真工序计划
   */
  static async batchDelete(ids) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      let successCount = 0;
      const affectedProcessDates = new Set(); // 记录受影响的工序+日期
      
      for (const id of ids) {
        // ✅ 步颂1: 先查询真工序计划详情
        const [planRows] = await connection.execute(
          'SELECT plan_no, process_name, schedule_date FROM real_process_plans WHERE id = ?',
          [id]
        );
        
        if (planRows.length > 0) {
          const plan = planRows[0];
          
          // ✅ 记录受影响的工序+日期
          if (plan.process_name && plan.schedule_date) {
            const scheduleDate = plan.schedule_date instanceof Date
              ? plan.schedule_date.toISOString().split('T')[0]
              : String(plan.schedule_date).split('T')[0];
            affectedProcessDates.add(`${plan.process_name}|${scheduleDate}`);
          }
          
          // ✅ 步颂2: 执行删除
          const [result] = await connection.execute('DELETE FROM real_process_plans WHERE id = ?', [id]);
          successCount += result.affectedRows;
        }
      }
      
      // ✅ 步颂3: 批量重置受影响的工序+日期的已占用工时
      console.log(`🔄 批量重置 ${affectedProcessDates.size} 个工序+日期的已占用工时`);
      
      for (const key of affectedProcessDates) {
        const [processName, scheduleDate] = key.split('|');
        
        try {
          // ✅ SUMIF - 重新统计该工序+日期下所有真工序计划的计划排程工时总和
          const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(used_work_hours), 0) as total_hours 
             FROM real_process_plans 
             WHERE process_name = ? 
               AND schedule_date = ?`,
            [processName, scheduleDate]
          );
          
          const sumResult = sumRows[0].total_hours;
          const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
          const newOccupiedHours = parseFloat(validResult.toFixed(2));
          
          // ✅ 查询工序能力负荷记录
          const [capacityRows] = await connection.execute(
            'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
            [processName, scheduleDate]
          );
          
          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);
            
            // ✅ 重新计算剩余工时和妉余时段
            const newRemainingHours = parseFloat(
              (workShift * availableWorkstations - newOccupiedHours).toFixed(2)
            );
            
            let newRemainingShift = null;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat(
                (newRemainingHours / availableWorkstations).toFixed(2)
              );
            }
            
            // ✅ 更新数据库
            await connection.execute(
              `UPDATE process_capacity_load 
               SET occupied_hours = ?, 
                   remaining_hours = ?, 
                   remaining_shift = ?,
                   updated_at = NOW()
               WHERE id = ?`,
              [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
            );
            
            console.log(`✅ [工序=${processName}, 日期=${scheduleDate}] ${previousOccupiedHours} → ${newOccupiedHours}`);
          }
        } catch (error) {
          console.error(`⚠️ [工序=${processName}, 日期=${scheduleDate}] 重置失败:`, error.message);
          // 继续处理其他记录
        }
      }
      
      await connection.commit();
      console.log(`批量删除真工序计划完成: 成功${successCount}条/总共${ids.length}条`);
      return { successCount, totalCount: ids.length };
    } catch (error) {
      await connection.rollback();
      console.error('批量删除真工序计划失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * ✅ 需求2: 计算当天已排程工时 (SUMIFS)
   * @param {string} processName - 工序名称
   * @param {string} scheduleDate - 计划排程日期 (YYYY-MM-DD)
   * @param {number} currentRowIndex - 当前行索引（从0开始）
   * @returns {number} 当天已排程工时
   */
  static async calculateDailyScheduledHours(processName, scheduleDate, currentRowIndex) {
    try {
      if (!processName || !scheduleDate) {
        return 0;
      }
      
      // SUMIFS: 求和条件1 - 工序名称匹配
      // SUMIFS: 求和条件2 - 计划排程日期匹配
      // SUMIFS: 求和条件3 - 序号 < 当前行序号（不包含当前行）
      // 注意：序号是显示顺序，需要按照schedule_date ASC, created_at ASC排序后计算
      
      const sql = `
        SELECT COALESCE(SUM(scheduled_work_hours), 0) as total
        FROM (
          SELECT 
            scheduled_work_hours,
            ROW_NUMBER() OVER (ORDER BY schedule_date ASC, created_at ASC) as row_num
          FROM real_process_plans
          WHERE process_name = ?
            AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = ?
        ) as ranked
        WHERE row_num < ?
      `;
      
      // currentRowIndex是从0开始，序号 = currentRowIndex + 1
      // 求和条件是序号 < 当前序号，即 row_num < (currentRowIndex + 1)
      const currentRowNumber = currentRowIndex + 1;
      const [rows] = await pool.execute(sql, [processName, scheduleDate, currentRowNumber]);
      const total = parseFloat(rows[0]?.total || 0);
      
      return parseFloat(total.toFixed(2));
    } catch (error) {
      console.error('计算当天已排程工时失败:', error);
      return 0;
    }
  }

  /**
   * ✅ 检查并创建自增行（递归排程）
   * @param {number} sourceRecordId - 来源记录ID
   * @param {number} maxDepth - 最大递归深度（防止无限循环）
   * @param {number} currentDepth - 当前递归深度
   */
  static async checkAndCreateIncremental(sourceRecordId, maxDepth = 100, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      console.log(`⚠️ 达到最大递归深度${maxDepth}，停止自增`);
      return;
    }

    const connection = await pool.getConnection();
    try {
      // 1. 查询来源记录
      const [records] = await connection.execute(`
        SELECT * FROM real_process_plans WHERE id = ?
      `, [sourceRecordId]);

      if (records.length === 0) {
        console.log(`⚠️ 来源记录不存在，ID: ${sourceRecordId}`);
        return;
      }

      const sourceRecord = records[0];
      
      // 2. 检查自增触发条件
      const unscheduledQty = parseFloat(sourceRecord.unscheduled_qty || 0);
      const scheduleDate = sourceRecord.schedule_date;
      const nextScheduleDate = sourceRecord.next_schedule_date;
      const scheduleCount = parseInt(sourceRecord.schedule_count || 0);
      const remainingRequiredHours = parseFloat(sourceRecord.remaining_required_hours || 0);
      const replenishmentQty = parseFloat(sourceRecord.replenishment_qty || 0);

      console.log(`\n📋 [自增检查 #${currentDepth + 1}] 来源记录 ID=${sourceRecordId}, 排程次数=${scheduleCount}`);
      console.log(`   未排数量: ${unscheduledQty}`);
      console.log(`   计划排程日期: ${scheduleDate}`);
      console.log(`   下一个排程日期: ${nextScheduleDate}`);
      console.log(`   剩余需求工时: ${remainingRequiredHours}`);

      // 自增触发条件：AND(未排数量>0，计划排程日期不为空，下一个排程日期不为空，排程次数不为空，剩余需求工时不为空，未排数量不为空，需补货数量不为空）
      if (!(
        unscheduledQty > 0 &&
        scheduleDate &&
        nextScheduleDate &&
        scheduleCount > 0 &&
        remainingRequiredHours !== null &&
        replenishmentQty > 0
      )) {
        console.log(`✅ 不满足自增条件，停止递归`);
        return;
      }

      console.log(`🔁 满足自增条件，开始创建自增行...`);

      // 3. 生成新的排程次数和编号
      const newScheduleCount = scheduleCount + 1;
      const planNoPrefix = sourceRecord.plan_no.split('-')[0];
      const newPlanNo = `${planNoPrefix}-${newScheduleCount}`;

      console.log(`   新排程次数: ${newScheduleCount}`);
      console.log(`   新计划编号: ${newPlanNo}`);

      // 4. 计算自增行的计划排程日期 = 来源行的下一个排程日期
      const newScheduleDate = nextScheduleDate;
      console.log(`   新计划排程日期: ${newScheduleDate}`);

      // 5. 查询工序能力负荷表 - 获取当天总工时
      let dailyTotalHours = 0;
      const processName = sourceRecord.process_name;
      
      if (processName && newScheduleDate) {
        const [capacityRows] = await connection.execute(`
          SELECT work_shift, available_workstations
          FROM process_capacity_load
          WHERE process_name = ? AND date = ?
          LIMIT 1
        `, [processName, newScheduleDate]);
        
        if (capacityRows.length > 0) {
          const workShift = parseFloat(capacityRows[0].work_shift || 0);
          const availableWorkstations = parseFloat(capacityRows[0].available_workstations || 0);
          dailyTotalHours = parseFloat((workShift * availableWorkstations).toFixed(2));
          console.log(`   当天总工时: ${dailyTotalHours}`);
        }
      }

      // 6. 计算当天已排程工时 (SUMIFS - 不包含即将创建的这一行)
      const [sumRows] = await connection.execute(`
        SELECT COALESCE(SUM(scheduled_work_hours), 0) as total
        FROM real_process_plans
        WHERE process_name = ? AND schedule_date = ?
      `, [processName, newScheduleDate]);
      
      const dailyScheduledHours = parseFloat(sumRows[0].total || 0);
      console.log(`   当天已排程工时: ${dailyScheduledHours}`);

      // 7. 当天可用工时 = 总工时 - 已排程工时
      const dailyAvailableHours = parseFloat((dailyTotalHours - dailyScheduledHours).toFixed(2));
      console.log(`   当天可用工时: ${dailyAvailableHours}`);

      // 8. 需求工时 = 来源行的剩余需求工时
      const newRequiredWorkHours = remainingRequiredHours;
      console.log(`   新需求工时: ${newRequiredWorkHours}`);

      // 9. 计划排程工时 = MIN(需求工时, 当天可用工时)
      let scheduledWorkHours = 0;
      if (newRequiredWorkHours > 0 && dailyAvailableHours > 0) {
        scheduledWorkHours = parseFloat(Math.min(newRequiredWorkHours, dailyAvailableHours).toFixed(2));
      }
      console.log(`   计划排程工时: ${scheduledWorkHours}`);

      // 10. 计划排程数量 = 排程工时 × 定时工额
      const standardWorkQuota = parseFloat(sourceRecord.standard_work_quota || 0);
      let scheduleQuantity = 0;
      if (scheduledWorkHours > 0 && standardWorkQuota > 0) {
        scheduleQuantity = parseFloat((scheduledWorkHours * standardWorkQuota).toFixed(2));
      }
      console.log(`   计划排程数量: ${scheduleQuantity}`);

      // 11. 下一个排程日期 = 计划排程日期 + 1天
      let newNextScheduleDate = null;
      if (newScheduleDate) {
        const nextDate = new Date(newScheduleDate);
        nextDate.setDate(nextDate.getDate() + 1);
        const year = nextDate.getFullYear();
        const month = String(nextDate.getMonth() + 1).padStart(2, '0');
        const day = String(nextDate.getDate()).padStart(2, '0');
        newNextScheduleDate = `${year}-${month}-${day}`;
        console.log(`   下一个排程日期: ${newNextScheduleDate}`);
      }

      // 12. 剩余需求工时 = 需求工时 - 计划排程工时
      let newRemainingRequiredHours = 0;
      if (newRequiredWorkHours > 0 && scheduledWorkHours > 0) {
        newRemainingRequiredHours = parseFloat((newRequiredWorkHours - scheduledWorkHours).toFixed(2));
      } else if (newRequiredWorkHours > 0) {
        newRemainingRequiredHours = newRequiredWorkHours;
      }
      console.log(`   剩余需求工时: ${newRemainingRequiredHours}`);

      // 13. 累积排程数量 = SUMIFS(来源编号=本行来源编号) - 需要在INSERT后重新计算
      // 先用当前的计划排程数量作为初始值
      let cumulativeScheduleQty = scheduleQuantity;

      // 14. 未排数量 = 需补货数量 - 累积排程数量
      const newReplenishmentQty = parseFloat(sourceRecord.replenishment_qty || 0);
      let newUnscheduledQty = 0;
      if (newReplenishmentQty > 0 && cumulativeScheduleQty >= 0) {
        newUnscheduledQty = parseFloat((newReplenishmentQty - cumulativeScheduleQty).toFixed(2));
      } else if (newReplenishmentQty > 0) {
        newUnscheduledQty = newReplenishmentQty;
      }

      // 15. 构建自增行数据对象
      const incrementalData = {
        planNo: newPlanNo,
        scheduleDate: newScheduleDate,
        salesOrderNo: sourceRecord.sales_order_no,
        masterPlanNo: sourceRecord.master_plan_no,
        shippingPlanNo: sourceRecord.shipping_plan_no,
        productCode: sourceRecord.product_code,
        productName: sourceRecord.product_name,
        productImage: sourceRecord.product_image,
        processManager: sourceRecord.process_manager,
        processName: sourceRecord.process_name,
        scheduleQuantity: scheduleQuantity,
        productUnit: sourceRecord.product_unit,
        level0Demand: sourceRecord.level0_demand,
        completionDate: sourceRecord.completion_date,
        planStartDate: null,  // ✅ 自增行必须清空计划开始日期
        realPlanStartDate: null,  // ✅ 自增行也清空真计划开始日期
        planEndDate: sourceRecord.plan_end_date,
        workshopName: sourceRecord.workshop_name,
        dailyAvailableHours: dailyAvailableHours,
        remainingRequiredHours: newRemainingRequiredHours,
        scheduleCount: newScheduleCount,
        standardWorkHours: sourceRecord.standard_work_hours,
        standardWorkQuota: standardWorkQuota,
        cumulativeScheduleQty: cumulativeScheduleQty,
        unscheduledQty: newUnscheduledQty,
        sourcePageName: sourceRecord.source_page_name,
        sourceNo: sourceRecord.source_no,  // ✅ 继承来源编号
        previousScheduleNo: sourceRecord.plan_no,  // ✅ 上一个排程编号 = 来源行编号
        customerName: sourceRecord.customer_name,
        level0ProductName: sourceRecord.level0_product_name,
        level0ProductCode: sourceRecord.level0_product_code,
        level0ProductionQty: sourceRecord.level0_production_qty,
        productSource: sourceRecord.product_source,
        bomNo: sourceRecord.bom_no,
        submittedBy: sourceRecord.submitted_by,
        submittedAt: sourceRecord.submitted_at,
        replenishmentQty: newReplenishmentQty,  // ✅ 继承需补货数量
        requiredWorkHours: newRequiredWorkHours,  // ✅ 新需求工时 = 来源行剩余需求工时
        dailyTotalHours: dailyTotalHours,
        dailyScheduledHours: dailyScheduledHours,
        scheduledWorkHours: scheduledWorkHours,
        nextScheduleDate: newNextScheduleDate
      };

      // 16. 创建自增行
      console.log(`   📝 开始插入自增行到数据库...`);
      const createResult = await RealProcessPlanService.create(incrementalData);
      const newRecordId = createResult.id;
      console.log(`   ✅ 自增行创建成功, ID: ${newRecordId}`);

      // 17. 重新计算累积排程数量 (SUMIFS - 包含刚创建的这一行)
      if (sourceRecord.source_no) {
        const [cumulativeRows] = await connection.execute(`
          SELECT COALESCE(SUM(schedule_quantity), 0) as total
          FROM real_process_plans
          WHERE source_no = ?
        `, [sourceRecord.source_no]);
        
        cumulativeScheduleQty = parseFloat(cumulativeRows[0].total || 0);
        console.log(`   📊 重新计算累积排程数量: ${cumulativeScheduleQty}`);

        // 18. 重新计算未排数量
        newUnscheduledQty = 0;
        if (newReplenishmentQty > 0 && cumulativeScheduleQty >= 0) {
          newUnscheduledQty = parseFloat((newReplenishmentQty - cumulativeScheduleQty).toFixed(2));
        } else if (newReplenishmentQty > 0) {
          newUnscheduledQty = newReplenishmentQty;
        }
        console.log(`   📊 重新计算未排数量: ${newUnscheduledQty}`);

        // 19. 更新刚创建的记录
        await connection.execute(`
          UPDATE real_process_plans 
          SET cumulative_schedule_qty = ?, unscheduled_qty = ?
          WHERE id = ?
        `, [cumulativeScheduleQty, newUnscheduledQty, newRecordId]);
        console.log(`   ✅ 累积数量和未排数量已更新`);
      }

      console.log(`\n✅ 自增行 #${newScheduleCount} 创建完成`);
      console.log(`   未排数量: ${newUnscheduledQty}`);

      // 20. 递归检查：如果未排数量 > 0，继续创建下一个自增行
      if (newUnscheduledQty > 0 && newNextScheduleDate) {
        console.log(`\n🔁 未排数量=${newUnscheduledQty} > 0，继续递归创建下一个自增行...`);
        connection.release();  // 先释放当前连接
        await RealProcessPlanService.checkAndCreateIncremental(newRecordId, maxDepth, currentDepth + 1);
      } else {
        console.log(`\n🎉 排程完毕！未排数量=${newUnscheduledQty}，停止递归`);
        connection.release();
      }
      
    } catch (error) {
      console.error('❌ 创建自增行失败:', error);
      connection.release();
      throw error;
    }
  }
}

module.exports = RealProcessPlanService;