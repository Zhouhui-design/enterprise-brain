/**
 * 计划结束日期计算器
 * 
 * 计算规则：
 * 1. 需求工时 = 需补货数量 / 定时工额
 * 2. 基于计划开始日期（或排程日期）、企业日历、工序能力负荷表计算计划结束日期
 * 3. 计算逻辑：从计划开始日期开始，累加每日可用工时，直到满足需求工时
 */

const { pool } = require('../config/database');

class PlanEndDateCalculator {
  /**
   * 计算计划结束日期
   * 
   * @param {Object} params - 计算参数
   * @param {number} params.replenishmentQty - 需补货数量
   * @param {number} params.standardWorkQuota - 定时工额
   * @param {Date|string} params.planStartDate - 计划开始日期（如果为空，使用排程日期）
   * @param {Date|string} params.scheduleDate - 排程日期
   * @param {string} params.processName - 工序名称
   * @returns {Promise<Date|null>} 计划结束日期
   */
  static async calculate(params) {
    try {
      const {
        replenishmentQty,
        standardWorkQuota,
        planStartDate,
        scheduleDate,
        processName
      } = params;

      // 1. 计算需求工时
      const replenishment = parseFloat(replenishmentQty || 0);
      const quota = parseFloat(standardWorkQuota || 0);
      
      if (quota <= 0) {
        console.log(`⚠️ [计划结束日期] 定时工额<=0，无法计算: quota=${quota}`);
        return null;
      }
      
      if (replenishment <= 0) {
        console.log(`⚠️ [计划结束日期] 需补货数量<=0，无法计算: replenishment=${replenishment}`);
        return null;
      }
      
      const requiredWorkHours = parseFloat((replenishment / quota).toFixed(2));
      console.log(`📊 [计划结束日期] 需求工时 = ${replenishment} / ${quota} = ${requiredWorkHours}`);
      
      // 2. 确定起始日期（优先使用计划开始日期，否则使用排程日期）
      let startDate = planStartDate || scheduleDate;
      if (!startDate) {
        console.log(`⚠️ [计划结束日期] 计划开始日期和排程日期都为空，无法计算`);
        return null;
      }
      
      // 确保是Date对象
      if (typeof startDate === 'string') {
        startDate = new Date(startDate);
      }
      
      console.log(`📅 [计划结束日期] 起始日期: ${startDate.toISOString().split('T')[0]}`);
      
      // 3. 查询工序能力负荷表，从起始日期开始累加可用工时
      let currentDate = new Date(startDate);
      let accumulatedHours = 0;
      let daysChecked = 0;
      const maxDays = 365; // 最多查询365天，防止无限循环
      
      while (accumulatedHours < requiredWorkHours && daysChecked < maxDays) {
        // 将日期转换为数值格式 (YYYYMMDD)
        const dateNum = currentDate.getFullYear() * 10000 + 
                       (currentDate.getMonth() + 1) * 100 + 
                       currentDate.getDate();
        
        // 查询当天的工序能力负荷
        const [capacityRows] = await pool.execute(
          `SELECT work_shift, available_workstations, occupied_hours, remaining_hours
           FROM process_capacity_load 
           WHERE process_name = ? 
             AND (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) = ?`,
          [processName, dateNum]
        );
        
        if (capacityRows.length > 0) {
          const record = capacityRows[0];
          const workShift = parseFloat(record.work_shift || 0);
          const availableWorkstations = parseFloat(record.available_workstations || 0);
          const remainingHours = parseFloat(record.remaining_hours || 0);
          
          // 每日可用工时 = min(剩余工时, 上班时段 × 可用工位数)
          const dailyMaxHours = workShift * availableWorkstations;
          const dailyAvailableHours = Math.min(remainingHours, dailyMaxHours);
          
          if (dailyAvailableHours > 0) {
            accumulatedHours += dailyAvailableHours;
            console.log(`   ${currentDate.toISOString().split('T')[0]}: +${dailyAvailableHours}h (累计: ${accumulatedHours.toFixed(2)}h / ${requiredWorkHours}h)`);
          } else {
            console.log(`   ${currentDate.toISOString().split('T')[0]}: 无可用工时`);
          }
        } else {
          // 如果没有找到能力负荷记录，检查是否是工作日
          const dayOfWeek = currentDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          if (isWeekend) {
            console.log(`   ${currentDate.toISOString().split('T')[0]}: 周末，跳过`);
          } else {
            console.log(`   ${currentDate.toISOString().split('T')[0]}: 无能力负荷记录`);
          }
        }
        
        // 移动到下一天
        currentDate.setDate(currentDate.getDate() + 1);
        daysChecked++;
      }
      
      if (daysChecked >= maxDays) {
        console.log(`⚠️ [计划结束日期] 已查询${maxDays}天，仍未满足需求工时，可能是数据配置问题`);
        return null;
      }
      
      // 计划结束日期 = 最后一天（当前日期 - 1天，因为循环结束时已经+1了）
      currentDate.setDate(currentDate.getDate() - 1);
      
      console.log(`✅ [计划结束日期] 计算完成: ${currentDate.toISOString().split('T')[0]}`);
      console.log(`   需求工时: ${requiredWorkHours}h, 累计工时: ${accumulatedHours.toFixed(2)}h, 耗时: ${daysChecked}天`);
      
      return currentDate;
      
    } catch (error) {
      console.error(`❌ [计划结束日期] 计算失败:`, error);
      return null;
    }
  }
}

module.exports = PlanEndDateCalculator;
