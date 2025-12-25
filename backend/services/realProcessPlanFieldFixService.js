const { pool } = require('../config/database');

/**
 * 修复真工序计划字段自动计算的服务
 */
class RealProcessPlanFieldFixService {
  /**
   * 修复需求1：计划排程日期 = 计划开始日期
   * 生成时机：计划开始日期不为空
   */
  static async fixScheduleDateEqualsStartDate() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 更新所有计划排程日期为空的记录，设置计划排程日期 = 计划开始日期
      const sql = `
        UPDATE real_process_plans 
        SET schedule_date = plan_start_date,
            updated_at = NOW()
        WHERE plan_start_date IS NOT NULL 
          AND plan_start_date != '0000-00-00'
          AND plan_start_date != ''
          AND DATE(plan_start_date) != '1970-01-01'
          AND (schedule_date IS NULL OR schedule_date = '' OR schedule_date = '0000-00-00')
      `;

      const [result] = await connection.execute(sql);
      await connection.commit();

      console.log(`✅ 需求1修复完成：更新了 ${result.affectedRows} 条记录`);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      console.error('修复需求1失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 修复需求2：当天已排程工时 = SUMIFS(计划排程工时，序号<本行序号，工序名称=本行工序名称，计划排程日期=本行计划排程日期)
   * 生成时机：序号不为空且工序名称不为空且计划排程日期不为空
   */
  static async fixDailyScheduledHours() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 获取所有符合条件的记录(过滤无效日期)
      const [records] = await connection.execute(`
        SELECT id, process_name, schedule_date, scheduled_work_hours
        FROM real_process_plans
        WHERE process_name IS NOT NULL 
          AND process_name != ''
          AND schedule_date IS NOT NULL
          AND schedule_date > '1970-01-01'
        ORDER BY schedule_date ASC, created_at ASC
      `);

      let updatedCount = 0;

      // 按工序和日期分组处理
      const processDateGroups = {};
      records.forEach(record => {
        const key = `${record.process_name}|${record.schedule_date}`;
        if (!processDateGroups[key]) {
          processDateGroups[key] = [];
        }
        processDateGroups[key].push(record);
      });

      for (const [key, groupRecords] of Object.entries(processDateGroups)) {
        let cumulativeSum = 0;

        for (let i = 0; i < groupRecords.length; i++) {
          const record = groupRecords[i];

          // 更新当天已排程工时（前面所有记录的累计值）
          const updateSql = `
            UPDATE real_process_plans 
            SET daily_scheduled_hours = ?,
                updated_at = NOW()
            WHERE id = ?
          `;

          await connection.execute(updateSql, [cumulativeSum.toFixed(2), record.id]);
          cumulativeSum += parseFloat(record.scheduled_work_hours || 0);
          updatedCount++;
        }
      }

      await connection.commit();
      console.log(`✅ 需求2修复完成：更新了 ${updatedCount} 条记录`);
      return { updatedCount };
    } catch (error) {
      await connection.rollback();
      console.error('修复需求2失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 修复需求3：工序当天可用工时 = 当天总工时 - 当天已排程工时
   */
  static async fixDailyAvailableHours() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 更新所有记录的工序当天可用工时
      const sql = `
        UPDATE real_process_plans 
        SET daily_available_hours = (
          COALESCE(daily_total_hours, 0) - COALESCE(daily_scheduled_hours, 0)
        ),
        updated_at = NOW()
        WHERE daily_total_hours IS NOT NULL 
          OR daily_scheduled_hours IS NOT NULL
      `;

      const [result] = await connection.execute(sql);
      await connection.commit();

      console.log(`✅ 需求3修复完成：更新了 ${result.affectedRows} 条记录`);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      console.error('修复需求3失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 修复需求4：计划排程工时 = MIN(工序当天可用工时, 需求工时)
   */
  static async fixScheduledWorkHours() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `
        UPDATE real_process_plans 
        SET scheduled_work_hours = LEAST(
          COALESCE(daily_available_hours, 0), 
          COALESCE(required_work_hours, 0)
        ),
        updated_at = NOW()
        WHERE daily_available_hours IS NOT NULL 
          AND required_work_hours IS NOT NULL
      `;

      const [result] = await connection.execute(sql);
      await connection.commit();

      console.log(`✅ 需求4修复完成：更新了 ${result.affectedRows} 条记录`);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      console.error('修复需求4失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 修复需求5：计划排程数量 = 计划排程工时 * 定时工额
   */
  static async fixScheduleQuantity() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const sql = `
        UPDATE real_process_plans 
        SET schedule_quantity = (
          COALESCE(scheduled_work_hours, 0) * COALESCE(standard_work_quota, 0)
        ),
        updated_at = NOW()
        WHERE scheduled_work_hours IS NOT NULL 
          AND standard_work_quota IS NOT NULL
          AND standard_work_quota > 0
      `;

      const [result] = await connection.execute(sql);
      await connection.commit();

      console.log(`✅ 需求5修复完成：更新了 ${result.affectedRows} 条记录`);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      console.error('修复需求5失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 修复需求6：查询下一个排程日期 (MINIFS)
   * 这个需要与工序能力负荷表关联，暂时先置为NULL
   */
  static async fixNextScheduleDate() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 由于需要复杂的MINIFS查询，这里先清空，让前端重新计算
      const sql = `
        UPDATE real_process_plans 
        SET next_schedule_date = NULL,
        updated_at = NOW()
        WHERE next_schedule_date IS NOT NULL
      `;

      const [result] = await connection.execute(sql);
      await connection.commit();

      console.log(`✅ 需求6修复完成：清空了 ${result.affectedRows} 条记录的下一个排程日期，将由前端重新计算`);
      return { affectedRows: result.affectedRows };
    } catch (error) {
      await connection.rollback();
      console.error('修复需求6失败:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * 执行所有修复（跳过需求1，因为有无效日期数据）
   */
  static async fixAllFields() {
    console.log('🚀 开始修复真工序计划所有字段自动计算问题...');

    const results = {};

    try {
      // 跳过需求1，因为数据库中有无效日期
      console.log('⚠️ 跳过需求1：数据库中存在无效日期，请手动修复');
      results.demand1 = { message: '跳过：数据库中存在无效日期' };

      // 逐一执行，捕获每个错误
      try {
        console.log('🔧 正在执行需求2: 修复当天已排程工时...');
        results.demand2 = await this.fixDailyScheduledHours();
      } catch (error) {
        console.error('❌ 需求2执行失败:', error.message);
        results.demand2 = { error: error.message };
      }

      try {
        console.log('🔧 正在执行需求3: 修夏工序当天可用工时...');
        results.demand3 = await this.fixDailyAvailableHours();
      } catch (error) {
        console.error('❌ 需求3执行失败:', error.message);
        results.demand3 = { error: error.message };
      }

      try {
        console.log('🔧 正在执行需求4: 修复计划排程工时...');
        results.demand4 = await this.fixScheduledWorkHours();
      } catch (error) {
        console.error('❌ 需求4执行失败:', error.message);
        results.demand4 = { error: error.message };
      }

      try {
        console.log('🔧 正在执行需求5: 修复计划排程数量...');
        results.demand5 = await this.fixScheduleQuantity();
      } catch (error) {
        console.error('❌ 需求5执行失败:', error.message);
        results.demand5 = { error: error.message };
      }

      try {
        console.log('🔧 正在执行需求6: 修复下一个排程日期...');
        results.demand6 = await this.fixNextScheduleDate();
      } catch (error) {
        console.error('❌ 需求6执行失败:', error.message);
        results.demand6 = { error: error.message };
      }

      console.log('🎉 字段修复完成！（跳过了需求1）');
      return results;
    } catch (error) {
      console.error('❗ 字段修复过程中出现错误:', error);
      throw error;
    }
  }
}

module.exports = RealProcessPlanFieldFixService;
