/**
 * 计划开始日期计算器（倒拉式排程）
 *
 * 计算规则：
 * 计划开始日期 = MAX(工序能力负荷表的日期 WHERE 工序名称=当前工序 AND 剩余工时>剩余工时小于 AND 日期<=计划结束日期)
 */

const { pool } = require('../config/database');

class PlanStartDateCalculator {
  /**
   * 倒拉式计算计划开始日期
   *
   * @param {Object} params
   * @param {Date|string} params.planEndDate - 计划结束日期
   * @param {string} params.processName - 工序名称
   * @param {number} params.minRemainingHours - 剩余工时小于（默认0.5）
   * @returns {Promise<Date|null>} 计划开始日期
   */
  static async calculate(params) {
    try {
      const { planEndDate, processName, minRemainingHours = 0.5 } = params;

      if (!planEndDate || !processName) {
        console.log(`⚠️ [计划开始日期] 缺少必要参数`);
        return null;
      }

      // 确保是Date对象
      let endDate = planEndDate;
      if (typeof endDate === 'string') {
        endDate = new Date(endDate);
      }

      const formattedEndDate = endDate.toISOString().split('T')[0];

      console.log(
        `🔍 [计划开始日期] 工序=${processName}, 结束日期=${formattedEndDate}, 剩余工时小于=${minRemainingHours}`,
      );

      // 查询满足条件的最大日期
      const [rows] = await pool.execute(
        `
        SELECT MAX(date) as max_date
        FROM process_capacity_load
        WHERE process_name = ?
          AND remaining_hours > ?
          AND date <= ?
      `,
        [processName, minRemainingHours, formattedEndDate],
      );

      if (rows.length > 0 && rows[0].max_date) {
        const startDate = new Date(rows[0].max_date);
        console.log(`✅ [计划开始日期] 计算成功: ${startDate.toISOString().split('T')[0]}`);
        return startDate;
      } else {
        console.log(`⚠️ [计划开始日期] 未找到满足条件的日期`);
        return null;
      }
    } catch (error) {
      console.error('❌ [计划开始日期] 计算失败:', error);
      return null;
    }
  }
}

module.exports = PlanStartDateCalculator;
