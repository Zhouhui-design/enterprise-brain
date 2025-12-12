/**
 * 临时脚本：同步已存在的真工序计划到工序能力负荷表
 */

const { pool } = require('../config/database');

async function syncExistingPlans() {
  try {
    console.log('🔄 开始同步已存在的真工序计划到工序能力负荷表...\n');
    
    // 1. 查询所有真工序计划
    const [plans] = await pool.execute(`
      SELECT id, plan_no, process_name, schedule_date, scheduled_work_hours
      FROM real_process_plans
      WHERE scheduled_work_hours > 0
      ORDER BY id
    `);
    
    console.log(`找到 ${plans.length} 条需要同步的真工序计划\n`);
    
    // 2. 按工序+日期分组累加
    const groupedMap = new Map();
    
    plans.forEach(plan => {
      const processName = plan.process_name;
      const scheduleDate = plan.schedule_date instanceof Date
        ? plan.schedule_date.toISOString().split('T')[0]
        : String(plan.schedule_date).split('T')[0];
      const key = `${processName}__${scheduleDate}`;
      
      if (groupedMap.has(key)) {
        groupedMap.get(key).totalHours += parseFloat(plan.scheduled_work_hours);
        groupedMap.get(key).count++;
      } else {
        groupedMap.set(key, {
          processName,
          scheduleDate,
          totalHours: parseFloat(plan.scheduled_work_hours),
          count: 1
        });
      }
    });
    
    console.log(`合并后需要更新 ${groupedMap.size} 条工序能力负荷记录\n`);
    
    // 3. 逐个更新工序能力负荷表
    let successCount = 0;
    let notFoundCount = 0;
    
    for (const [key, group] of groupedMap) {
      const { processName, scheduleDate, totalHours, count } = group;
      
      console.log(`📝 处理: 工序=${processName}, 日期=${scheduleDate}, 累计工时=${totalHours.toFixed(2)} (${count}条计划)`);
      
      // 查询工序能力负荷表记录
      const [capacityRows] = await pool.execute(
        'SELECT id, work_shift, available_workstations, occupied_hours FROM process_capacity_load WHERE process_name = ? AND date = ?',
        [processName, scheduleDate]
      );
      
      if (capacityRows.length > 0) {
        const record = capacityRows[0];
        const previousOccupiedHours = parseFloat(record.occupied_hours || 0);
        const newOccupiedHours = parseFloat((previousOccupiedHours + totalHours).toFixed(2));
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
        
        console.log(`   ✅ 更新成功: ${previousOccupiedHours} → ${newOccupiedHours}, 剩余工时: ${newRemainingHours}\n`);
        successCount++;
      } else {
        console.warn(`   ⚠️ 未找到记录，跳过\n`);
        notFoundCount++;
      }
    }
    
    console.log('🎉 同步完成！');
    console.log(`   成功: ${successCount} 条`);
    console.log(`   未找到: ${notFoundCount} 条`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 同步失败:', error);
    process.exit(1);
  }
}

syncExistingPlans();
