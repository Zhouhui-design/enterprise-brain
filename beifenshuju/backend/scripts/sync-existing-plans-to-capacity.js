const { pool } = require('../config/database');

/**
 * 同步已存在的真工序计划到工序能力负荷表
 * 将已排程工时推送到工序能力负荷表的已占用工时
 */
async function syncExistingPlansToCapacity() {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 开始同步已存在的真工序计划到工序能力负荷表...\n');

    // 1. 查询所有有排程工时的真工序计划
    const [plans] = await connection.execute(`
      SELECT id, plan_no, process_name, schedule_date, scheduled_work_hours
      FROM real_process_plans
      WHERE scheduled_work_hours > 0
      ORDER BY schedule_date ASC, created_at ASC
    `);

    console.log(`📊 查询到 ${plans.length} 条需要同步的记录\n`);

    if (plans.length === 0) {
      console.log('✅ 没有需要同步的记录');
      return;
    }

    // 2. 按工序+日期分组累加 (避免重复更新)
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

    console.log(`📋 按工序+日期分组后共 ${groupedMap.size} 个组:\n`);

    // 3. 逐个更新工序能力负荷表
    let successCount = 0;
    let errorCount = 0;

    for (const [key, group] of groupedMap) {
      const { processName, scheduleDate, totalHours, count } = group;
      
      try {
        console.log(`🔍 处理: 工序=${processName}, 日期=${scheduleDate}, 累计排程工时=${totalHours.toFixed(2)} (${count}条记录)`);
        
        // 查询工序能力负荷表记录
        const [capacityRows] = await connection.execute(
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
          await connection.execute(
            `UPDATE process_capacity_load 
             SET occupied_hours = ?, 
                 remaining_hours = ?, 
                 remaining_shift = ?,
                 updated_at = NOW()
             WHERE id = ?`,
            [newOccupiedHours, newRemainingHours, newRemainingShift, record.id]
          );
          
          console.log(`   ✅ 已占用工时: ${previousOccupiedHours} → ${newOccupiedHours} (增加${totalHours.toFixed(2)}小时)`);
          console.log(`   剩余工时: ${newRemainingHours}, 剩余时段: ${newRemainingShift}\n`);
          successCount++;
        } else {
          console.warn(`   ⚠️ 未找到工序能力负荷记录\n`);
          errorCount++;
        }
      } catch (error) {
        console.error(`   ❌ 处理失败:`, error.message, '\n');
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ 同步完成！`);
    console.log(`   成功: ${successCount} 个`);
    console.log(`   失败: ${errorCount} 个`);
    console.log(`${'='.repeat(60)}\n`);

  } catch (error) {
    console.error('❌ 同步失败:', error);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// 执行同步
syncExistingPlansToCapacity().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
