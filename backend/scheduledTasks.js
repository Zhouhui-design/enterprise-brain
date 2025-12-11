const { pool } = require('./config/database');
const { dailyUpdateCalendar } = require('./routes/companyCalendar');

/**
 * 每天凌晨0:00执行的定时任务
 * 1. 删除过期数据（早于今天的数据）
 * 2. 确保所有工序有未来N天的数据
 */
async function dailyUpdate() {
  const connection = await pool.getConnection();
  try {
    console.log('[定时任务] 开始执行每日更新...');
    
    await connection.beginTransaction();
    
    // 1. 获取今天的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // 2. 删除过期数据
    const [deleteResult] = await connection.execute(
      'DELETE FROM process_capacity_load WHERE date < ?',
      [todayStr]
    );
    console.log(`[定时任务] 删除了 ${deleteResult.affectedRows} 条过期数据`);
    
    // 3. 获取显示天数配置
    const [settingRows] = await connection.execute(
      "SELECT setting_value FROM page_settings WHERE page_key = 'capacity-load' AND setting_key = 'displayDays'"
    );
    const displayDays = settingRows.length > 0 ? parseInt(settingRows[0].setting_value) : 120;
    
    // 4. 获取所有已加载的工序（去重）
    const [processRows] = await connection.execute(`
      SELECT DISTINCT process_name, available_workstations
      FROM process_capacity_load
      ORDER BY process_name
    `);
    
    console.log(`[定时任务] 找到 ${processRows.length} 个工序需要更新`);
    
    // 5. 为每个工序补充缺失的日期数据
    let insertedCount = 0;
    
    for (const process of processRows) {
      const { process_name, available_workstations } = process;
      
      // 检查未来N天的数据是否完整
      for (let i = 0; i < displayDays; i++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // 使用 INSERT IGNORE 避免重复插入
        const [result] = await connection.execute(`
          INSERT IGNORE INTO process_capacity_load (
            process_name, date, available_workstations,
            work_shift, occupied_hours, remaining_shift, remaining_hours, overtime_shift
          ) VALUES (?, ?, ?, NULL, 0, NULL, 0, NULL)
        `, [process_name, dateStr, available_workstations || 0]);
        
        insertedCount += result.affectedRows;
      }
    }
    
    console.log(`[定时任务] 新增了 ${insertedCount} 条数据`);
    
    await connection.commit();
    console.log('[定时任务] 每日更新完成');
    
  } catch (error) {
    await connection.rollback();
    console.error('[定时任务] 更新失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 如果直接执行此文件，则立即运行一次
if (require.main === module) {
  dailyUpdate()
    .then(() => {
      console.log('任务执行成功');
      process.exit(0);
    })
    .catch(error => {
      console.error('任务执行失败:', error);
      process.exit(1);
    });
}

// 设置定时任务（每天凌晨0:00执行）
function scheduleDailyTask() {
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // 明天
    0, 0, 0 // 00:00:00
  );
  const msToMidnight = night.getTime() - now.getTime();
  
  console.log(`[定时任务] 将在 ${Math.round(msToMidnight / 1000 / 60)} 分钟后执行下一次更新`);
  
  setTimeout(() => {
    // 同时执行工序能力负荷表和企业日历的更新
    Promise.all([
      dailyUpdate(),
      dailyUpdateCalendar()
    ]).then(() => {
      // 执行完后，再次安排下一天的任务
      scheduleDailyTask();
    }).catch(error => {
      console.error('[定时任务] 执行失败:', error);
      // 即使失败，也要安排下一次任务
      scheduleDailyTask();
    });
  }, msToMidnight);
}

// 导出函数供外部调用
module.exports = { dailyUpdate, scheduleDailyTask };
