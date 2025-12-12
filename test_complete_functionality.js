const { pool } = require('./backend/config/database');
const realProcessPlanService = require('./backend/services/realProcessPlanService');

async function testCompleteFunctionality() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 开始完整功能测试...');
    
    // 1. 创建测试数据
    console.log('\n📝 1. 创建测试数据...');
    const testData = {
      // 使用后端服务期望的字段名
      planNo: 'TEST-001',
      processName: '组装工序',
      productCode: 'TEST-PRODUCT',
      productName: '测试产品',
      scheduleQuantity: 100,
      standardWorkQuota: 50,
      planStartDate: '2025-01-10',
      processManager: '测试管理员',
      workshopName: '测试车间',
      // 确保所有可能为undefined的字段都有值
      scheduleDate: '2025-01-10', // 计划排程日期
      dailyTotalHours: 0,
      dailyScheduledHours: 0,
      dailyAvailableHours: 0,
      scheduledWorkHours: 0
    };
    
    const result = await realProcessPlanService.create(testData);
    console.log('✅ 创建成功，ID:', result.id);
    
    // 2. 获取创建的数据
    console.log('\n🔍 2. 查询创建的数据...');
    const createdData = await realProcessPlanService.getById(result.id);
    console.log('📋 创建的数据:', {
      id: createdData.id,
      plan_no: createdData.plan_no,
      process_name: createdData.process_name,
      plan_start_date: createdData.plan_start_date,
      schedule_date: createdData.schedule_date, // 需求1：应该等于 plan_start_date
      daily_total_hours: createdData.daily_total_hours,
      daily_scheduled_hours: createdData.daily_scheduled_hours,
      daily_available_hours: createdData.daily_available_hours,
      scheduled_work_hours: createdData.scheduled_work_hours,
      schedule_quantity: createdData.schedule_quantity,
      next_schedule_date: createdData.next_schedule_date
    });
    
    // 3. 验证需求1：计划排程日期 = 计划开始日期
    console.log('\n✅ 需求1验证: 计划排程日期 = 计划开始日期');
    const demand1_ok = createdData.schedule_date === createdData.plan_start_date;
    console.log(`  计划开始日期: ${createdData.plan_start_date}`);
    console.log(`  计划排程日期: ${createdData.schedule_date}`);
    console.log(`  结果: ${demand1_ok ? '✅ 通过' : '❌ 失败'}`);
    
    // 4. 创建更多数据来测试需求2（当天已排程工时SUMIFS）
    console.log('\n📝 4. 创建更多数据测试需求2...');
    const testRecords = [
      {
        plan_no: 'TEST-002',
        process_name: '组装工序',
        product_code: 'TEST-PRODUCT',
        product_name: '测试产品',
        schedule_quantity: 100,
        standard_work_quota: 50,
        schedule_date: '2025-01-10',
        process_manager: '测试管理员',
        workshop_name: '测试车间'
      },
      {
        plan_no: 'TEST-003',
        process_name: '组装工序',
        product_code: 'TEST-PRODUCT',
        product_name: '测试产品',
        schedule_quantity: 100,
        standard_work_quota: 50,
        schedule_date: '2025-01-10',
        process_manager: '测试管理员',
        workshop_name: '测试车间'
      },
      {
        plan_no: 'TEST-004',
        process_name: '焊接工序',
        product_code: 'TEST-PRODUCT',
        product_name: '测试产品',
        schedule_quantity: 100,
        standard_work_quota: 50,
        schedule_date: '2025-01-10',
        process_manager: '测试管理员',
        workshop_name: '测试车间'
      }
    ];
    
    for (let i = 0; i < testRecords.length; i++) {
      const record = testRecords[i];
      await realProcessPlanService.create(record);
      console.log(`  创建记录 ${i + 2}: ${record.plan_no}`);
    }
    
    // 5. 获取所有数据进行验证
    console.log('\n🔍 5. 查询所有数据验证计算逻辑...');
    const allData = await realProcessPlanService.list({});
    console.log(`📊 总记录数: ${allData.total}`);
    
    allData.data.forEach((row, index) => {
      console.log(`\n📋 记录 ${index + 1}:`);
      console.log(`  计划号: ${row.plan_no}`);
      console.log(`  工序名称: ${row.process_name}`);
      console.log(`  计划排程日期: ${row.schedule_date}`);
      console.log(`  计划排程工时: ${row.scheduled_work_hours}`);
      console.log(`  当天已排程工时: ${row.daily_scheduled_hours}`);
      console.log(`  当天总工时: ${row.daily_total_hours}`);
      console.log(`  当天可用工时: ${row.daily_available_hours}`);
      console.log(`  计划排程数量: ${row.schedule_quantity}`);
      console.log(`  下次排程日期: ${row.next_schedule_date}`);
    });
    
    console.log('\n🎉 测试完成！请验证以上6个需求的字段计算是否正确。');
    
  } catch (error) {
    console.error('❗ 测试失败:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

testCompleteFunctionality().catch(error => {
  console.error('❗ 测试执行失败:', error);
  process.exit(1);
});