const { pool } = require('./backend/config/database');

async function test6Requirements() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 测试6个需求的实现情况...');
    
    // 清空测试数据
    await connection.execute('DELETE FROM real_process_plans WHERE plan_no LIKE "TEST-%"');
    
    // 1. 创建基础测试数据
    console.log('\n📝 1. 创建基础测试数据...');
    const baseData = [
      {
        plan_no: 'TEST-REQ1-001',
        process_name: '组装工序',
        product_code: 'TEST-PRODUCT',
        product_name: '测试产品',
        plan_start_date: '2025-01-15',
        workshop_name: '组装车间'
      },
      {
        plan_no: 'TEST-REQ2-001',
        process_name: '焊接工序',
        product_code: 'TEST-PRODUCT',
        product_name: '测试产品',
        plan_start_date: '2025-01-15',
        schedule_date: '2025-01-15',  // 手动设置排程日期
        scheduled_work_hours: 8,      // 手动设置排程工时
        workshop_name: '焊接车间'
      },
      {
        plan_no: 'TEST-REQ2-002',
        process_name: '焊接工序',
        product_code: 'TEST-PRODUCT',
        product_name: '测试产品',
        plan_start_date: '2025-01-15',
        schedule_date: '2025-01-15',  // 同一工序，同一日期
        scheduled_work_hours: 6,      // 不同排程工时
        workshop_name: '焊接车间'
      }
    ];
    
    for (let i = 0; i < baseData.length; i++) {
      const data = baseData[i];
      const sql = `
        INSERT INTO real_process_plans (
          plan_no, process_name, product_code, product_name, 
          plan_start_date, schedule_date, scheduled_work_hours, 
          workshop_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.execute(sql, [
        data.plan_no,
        data.process_name,
        data.product_code,
        data.product_name,
        data.plan_start_date,
        data.schedule_date || null,
        data.scheduled_work_hours || 0,
        data.workshop_name
      ]);
      
      console.log(`  ✅ 创建: ${data.plan_no}`);
    }
    
    // 2. 验证需求1：计划排程日期 = 计划开始日期
    console.log('\n✅ 验证需求1: 计划排程日期 = 计划开始日期');
    const [req1Rows] = await connection.execute(
      'SELECT id, plan_no, plan_start_date, schedule_date FROM real_process_plans WHERE plan_no = "TEST-REQ1-001"'
    );
    
    if (req1Rows.length > 0) {
      const row = req1Rows[0];
      const req1Ok = row.schedule_date && row.schedule_date.toISOString().split('T')[0] === row.plan_start_date.toISOString().split('T')[0];
      console.log(`  计划开始日期: ${row.plan_start_date.toISOString().split('T')[0]}`);
      console.log(`  计划排程日期: ${row.schedule_date ? row.schedule_date.toISOString().split('T')[0] : 'NULL'}`);
      console.log(`  结果: ${req1Ok ? '✅ 通过' : '❌ 失败 (需要手动设置)'}`);
    }
    
    // 3. 验证需求2：当天已排程工时 SUMIFS
    console.log('\n✅ 验证需求2: 当天已排程工时 = SUMIFS(计划排程工时, 同工序+同日期+前面序号)');
    
    // 先获取焊接工序在同一天的所有记录，按ID排序
    const [weldingRows] = await connection.execute(`
      SELECT id, plan_no, process_name, schedule_date, scheduled_work_hours 
      FROM real_process_plans 
      WHERE process_name = '焊接工序' AND schedule_date = '2025-01-15'
      ORDER BY id
    `);
    
    console.log('  焊接工序 2025-01-15 的记录:');
    let cumulativeSum = 0;
    weldingRows.forEach((row, index) => {
      cumulativeSum += parseFloat(row.scheduled_work_hours || 0);
      console.log(`    记录${index + 1}: ${row.plan_no}, 排程工时=${row.scheduled_work_hours}, 累计=${cumulativeSum}`);
      
      // 这里应该更新 daily_scheduled_hours 字段
      // 但由于是测试，我们手动计算验证
    });
    
    console.log(`  预期结果: 每条记录的 daily_scheduled_hours 应该等于前面记录的 scheduled_work_hours 累加`);
    
    // 4. 手动模拟需求2的计算逻辑
    console.log('\n🔧 手动模拟需求2计算逻辑:');
    for (let i = 0; i < weldingRows.length; i++) {
      const currentRow = weldingRows[i];
      
      // SUMIFS: 求和条件1：序号<本行序号，条件2：工序名称=本行工序名称，条件3：排程日期=本行排程日期
      const [sumRows] = await connection.execute(`
        SELECT COALESCE(SUM(scheduled_work_hours), 0) as total_hours
        FROM real_process_plans 
        WHERE process_name = ? 
          AND schedule_date = ?
          AND id < ?
      `, [currentRow.process_name, currentRow.schedule_date, currentRow.id]);
      
      const expectedDailyScheduledHours = parseFloat(sumRows[0].total_hours);
      console.log(`  ${currentRow.plan_no}: 期望 daily_scheduled_hours = ${expectedDailyScheduledHours}`);
    }
    
    // 5. 验证其他需求的基础数据
    console.log('\n📊 查看所有测试数据的完整信息:');
    const [allRows] = await connection.execute(`
      SELECT plan_no, process_name, schedule_date, plan_start_date,
             scheduled_work_hours, daily_total_hours, daily_scheduled_hours,
             daily_available_hours, schedule_quantity, next_schedule_date
      FROM real_process_plans 
      WHERE plan_no LIKE 'TEST-%'
      ORDER BY plan_no
    `);
    
    allRows.forEach(row => {
      console.log(`\n📋 ${row.plan_no}:`);
      console.log(`  工序名称: ${row.process_name}`);
      console.log(`  计划开始日期: ${row.plan_start_date}`);
      console.log(`  计划排程日期: ${row.schedule_date}`);
      console.log(`  计划排程工时: ${row.scheduled_work_hours}`);
      console.log(`  当天总工时: ${row.daily_total_hours}`);
      console.log(`  当天已排程工时: ${row.daily_scheduled_hours}`);
      console.log(`  当天可用工时: ${row.daily_available_hours}`);
      console.log(`  计划排程数量: ${row.schedule_quantity}`);
      console.log(`  下次排程日期: ${row.next_schedule_date}`);
    });
    
    console.log('\n🎉 测试完成！');
    console.log('\n📝 修复建议:');
    console.log('1. 需求1: 在创建/更新记录时，如果 plan_start_date 不为空，自动设置 schedule_date = plan_start_date');
    console.log('2. 需求2: 需要实现 daily_scheduled_hours 的自动计算逻辑（SUMIFS）');
    console.log('3. 需求3-6: 需要添加对应的计算逻辑和后端API支持');
    
  } catch (error) {
    console.error('❗ 测试失败:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

test6Requirements().catch(error => {
  console.error('❗ 测试执行失败:', error);
  process.exit(1);
});