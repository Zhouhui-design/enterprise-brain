const { pool } = require('../config/database');

/**
 * 工序计划通用工具类
 * 提供各工序计划服务共享的辅助方法
 */
class ProcessPlanUtils {
  /**
   * 格式化日期字段为中国时区YYYY-MM-DD格式
   * @param {Date|string} date - 日期对象或字符串
   * @returns {string} 格式化后的日期字符串
   */
  static formatDate(date) {
    if (!date) return null;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * 将日期转换为数值格式 (YYYYMMDD)
   * @param {Date|string} date - 日期对象或字符串
   * @returns {number} 数值格式的日期
   */
  static dateToNumber(date) {
    if (!date) return null;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.getFullYear() * 10000 + (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
  }

  /**
   * 加载工序间隔设置
   * @returns {Array} 工序间隔设置列表
   */
  static async loadProcessIntervalSettings() {
    try {
      const [rows] = await pool.execute(
        'SELECT previous_process, next_process, interval_value, interval_unit FROM process_interval_settings',
      );

      // 转换字段名为驼峰格式
      const settings = rows.map(row => ({
        previousProcess: row.previous_process,
        nextProcess: row.next_process,
        intervalValue: parseFloat(row.interval_value || 0),
        intervalUnit: row.interval_unit || '小时',
      }));

      console.log(`✅ 从数据库加载了 ${settings.length} 条工序间隔设置`);
      return settings;
    } catch (error) {
      console.error('❌ 加载工序间隔设置失败:', error);
      return [];
    }
  }

  /**
   * 生成新的计划编号
   * @param {string} prefix - 计划编号前缀
   * @param {number} count - 当前计划数量
   * @returns {string} 新的计划编号
   */
  static generatePlanNo(prefix, count) {
    return `${prefix}-${count + 1}`;
  }

  /**
   * 计算当天已排程工时
   * @param {string} tableName - 表名
   * @param {string} processName - 工序名称
   * @param {string} scheduleDate - 计划排程日期 (YYYY-MM-DD)
   * @param {number} currentRowIndex - 当前行索引（从0开始）
   * @returns {number} 当天已排程工时
   */
  static async calculateDailyScheduledHours(tableName, processName, scheduleDate, currentRowIndex) {
    try {
      if (!processName || !scheduleDate) {
        return 0;
      }

      const sql = `
        SELECT COALESCE(SUM(scheduled_work_hours), 0) as total
        FROM (
          SELECT 
            scheduled_work_hours,
            ROW_NUMBER() OVER (ORDER BY schedule_date ASC, created_at ASC) as row_num
          FROM ${tableName}
          WHERE process_name = ?
            AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = ?
        ) as ranked
        WHERE row_num < ?
      `;

      // currentRowIndex是从0开始，序号 = currentRowIndex + 1
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
   * 重置工序能力负荷表的已占用工时
   * @param {string} tableName - 表名
   * @param {string} processName - 工序名称
   * @param {Date|string} scheduleDate - 计划排程日期
   * @param {object} connection - 数据库连接对象（可选）
   */
  static async resetOccupiedHours(tableName, processName, scheduleDate, connection = null) {
    try {
      // 使用数值化日期匹配
      const scheduleDateObj = typeof scheduleDate === 'string' ? new Date(scheduleDate) : scheduleDate;
      const scheduleDateNum = ProcessPlanUtils.dateToNumber(scheduleDateObj);

      console.log(`🔄 自动重置已占用工时: 工序=${processName}, 日期数值=${scheduleDateNum}`);
      console.log(`   原始日期值: ${scheduleDate}, 类型: ${typeof scheduleDate}`);

      // 使用提供的连接或获取新连接
      const dbConnection = connection || await pool.getConnection();
      
      try {
        // SUMIF - 重新统计该工序+日期下所有计划的计划排程工时总和
        const [sumRows] = await dbConnection.execute(
          `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
           FROM ${tableName} 
           WHERE process_name = ? 
             AND (YEAR(schedule_date) * 10000 + MONTH(schedule_date) * 100 + DAY(schedule_date)) = ?`,
          [processName, scheduleDateNum],
        );

        // 补充规则: if(sumifs的结果返回null, 0, sumifs的结果)
        const sumResult = sumRows[0].total_hours;
        const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
        const newOccupiedHours = parseFloat(validResult.toFixed(2));

        console.log(`  SUMIF查询结果: ${sumResult}, 新占用工时: ${newOccupiedHours}`);

        // 查询工序能力负荷记录（使用数值化匹配）
        const [capacityRows] = await dbConnection.execute(
          `SELECT id, work_shift, available_workstations, occupied_hours, date,
                  (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) as date_num
           FROM process_capacity_load 
           WHERE process_name = ? 
             AND (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) = ?`,
          [processName, scheduleDateNum],
        );

        if (capacityRows.length > 0) {
          const record = capacityRows[0];
          const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
          const workShift = parseFloat(record.work_shift || 0);
          const availableWorkstations = parseFloat(record.available_workstations || 0);

          // 重新计算剩余工时和剩余时段
          const newRemainingHours = parseFloat((workShift * availableWorkstations - newOccupiedHours).toFixed(2));

          let newRemainingShift = null;
          if (availableWorkstations > 0) {
            newRemainingShift = parseFloat((newRemainingHours / availableWorkstations).toFixed(2));
          }

          // 更新数据库
          await dbConnection.execute(
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
          console.log(`   目标记录: date=${record.date}, date_num=${record.date_num}`);
        } else {
          console.warn(`⚠️ 未找到工序能力负荷记录: 工序=${processName}, 日期数值=${scheduleDateNum}`);
        }
        
        // 如果使用了新连接，释放它
        if (!connection) {
          dbConnection.release();
        }
      } catch (error) {
        // 如果使用了新连接，释放它
        if (!connection) {
          dbConnection.release();
        }
        throw error;
      }
    } catch (error) {
      console.error(`⚠️ 自动重置已占用工时失败:`, error.message);
      // 不抛出错误，继续执行
    }
  }

  /**
   * 批量重置工序能力负荷表的已占用工时
   * @param {string} tableName - 表名
   * @param {Set} affectedProcessDates - 受影响的工序+日期集合
   * @param {object} connection - 数据库连接对象
   */
  static async batchResetOccupiedHours(tableName, affectedProcessDates, connection) {
    try {
      console.log(`🔄 批量重置 ${affectedProcessDates.size} 个工序+日期的已占用工时`);

      for (const key of affectedProcessDates) {
        const [processName, scheduleDateNumStr] = key.split('|');
        const scheduleDateNum = parseInt(scheduleDateNumStr);

        try {
          // SUMIF - 重新统计该工序+日期下所有计划的计划排程工时总和
          const [sumRows] = await connection.execute(
            `SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours 
             FROM ${tableName} 
             WHERE process_name = ? 
               AND (YEAR(schedule_date) * 10000 + MONTH(schedule_date) * 100 + DAY(schedule_date)) = ?`,
            [processName, scheduleDateNum],
          );

          const sumResult = sumRows[0].total_hours;
          const validResult = sumResult !== null && sumResult !== undefined ? parseFloat(sumResult) : 0;
          const newOccupiedHours = parseFloat(validResult.toFixed(2));

          // 查询工序能力负荷记录（使用数值化匹配）
          const [capacityRows] = await connection.execute(
            `SELECT id, work_shift, available_workstations, occupied_hours, date,
                    (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) as date_num
             FROM process_capacity_load 
             WHERE process_name = ? 
               AND (YEAR(date) * 10000 + MONTH(date) * 100 + DAY(date)) = ?`,
            [processName, scheduleDateNum],
          );

          if (capacityRows.length > 0) {
            const record = capacityRows[0];
            const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
            const workShift = parseFloat(record.work_shift || 0);
            const availableWorkstations = parseFloat(record.available_workstations || 0);

            // 重新计算剩余工时和剩余时段
            const newRemainingHours = parseFloat((workShift * availableWorkstations - newOccupiedHours).toFixed(2));

            let newRemainingShift = null;
            if (availableWorkstations > 0) {
              newRemainingShift = parseFloat((newRemainingHours / availableWorkstations).toFixed(2));
            }

            // 更新数据库
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
              `✅ [工序=${processName}, 日期数值=${scheduleDateNum}, date=${record.date}] ${previousOccupiedHours} → ${newOccupiedHours}`,
            );
          }
        } catch (error) {
          console.error(`⚠️ [工序=${processName}, 日期数值=${scheduleDateNum}] 重置失败:`, error.message);
          // 继续处理其他记录
        }
      }
    } catch (error) {
      console.error('批量重置已占用工时失败:', error);
      // 不抛出错误，继续执行
    }
  }
}

module.exports = ProcessPlanUtils;
