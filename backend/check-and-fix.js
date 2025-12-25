const { pool } = require('./config/database');

/**
 * 重新检查表结构并创建正确的插入语句
 */
async function checkTableAndFix() {
  console.log('=== 检查表结构并修复插入语句 ===');

  try {
    // 1. 检查表结构
    const [columns] = await pool.execute(`
      DESCRIBE process_plans
    `);

    console.log('表字段数量:', columns.length);
    console.log('字段列表:');
    columns.forEach((column, index) => {
      console.log(`${index + 1}. ${column.Field}`);
    });

    // 2. 构建正确的插入语句
    const fieldNames = columns.map(col => col.Field).join(', ');
    const placeholders = Array(columns.length).fill('?').join(', ');

    console.log('\n正确的INSERT语句:');
    console.log('字段:', fieldNames);
    console.log('占位符数量:', placeholders.split(',').length);

    // 3. 测试插入
    const sql = `INSERT INTO process_plans (${fieldNames}) VALUES (${placeholders})`;

    const testData = {
      planNo: 'TEST-FIXED-500-6',
      processName: '修复测试工序',
      replenishmentQty: 500,
      standardWorkQuota: 6,
      expectedRequiredHours: 83.33,
    };

    console.log('\n测试数据:');
    console.log(`- 需补货数量: ${testData.replenishmentQty}`);
    console.log(`- 定时工额: ${testData.standardWorkQuota}`);
    console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);

    // 计算需求工时
    const calculatedRequiredHours = parseFloat((testData.replenishmentQty / testData.standardWorkQuota).toFixed(2));
    console.log(`- 实际计算需求工时: ${calculatedRequiredHours}`);

    // 构建参数数组
    const params = [];
    columns.forEach((column, index) => {
      const fieldName = column.Field;

      // 根据字段名设置对应的值
      switch (fieldName) {
        case 'plan_no':
          params.push(testData.planNo);
          break;
        case 'process_name':
          params.push(testData.processName);
          break;
        case 'replenishment_qty':
          params.push(testData.replenishmentQty);
          break;
        case 'standard_work_quota':
          params.push(testData.standardWorkQuota);
          break;
        case 'required_work_hours':
          params.push(calculatedRequiredHours);
          break;
        case 'schedule_quantity':
        case 'used_work_hours':
        case 'level0_demand':
        case 'daily_available_hours':
        case 'remaining_schedule_hours':
        case 'schedule_count':
        case 'standard_work_hours':
        case 'scheduled_hours':
        case 'unscheduled_hours':
        case 'level0_production_qty':
          params.push(0);
          break;
        case 'created_at':
        case 'updated_at':
          params.push(new Date());
          break;
        default:
          params.push(null);
      }
    });

    console.log('参数数量:', params.length);
    console.log('参数和占位符匹配:', params.length === columns.length ? '✅ 是' : '❌ 否');

    // 执行插入
    const [result] = await pool.execute(sql, params);
    console.log(`✅ 插入成功, ID: ${result.insertId}`);

    // 查询验证
    const [rows] = await pool.execute('SELECT * FROM process_plans WHERE id = ?', [result.insertId]);
    if (rows.length > 0) {
      const plan = rows[0];
      console.log('\n数据库查询结果:');
      console.log(`- plan_no: ${plan.plan_no}`);
      console.log(`- process_name: ${plan.process_name}`);
      console.log(`- replenishment_qty: ${plan.replenishment_qty}`);
      console.log(`- standard_work_quota: ${plan.standard_work_quota}`);
      console.log(`- required_work_hours: ${plan.required_work_hours}`);

      const dbRequiredHours = parseFloat(plan.required_work_hours);
      console.log(`\n结果验证:`);
      console.log(`- 预期需求工时: ${testData.expectedRequiredHours}`);
      console.log(`- 数据库需求工时: ${dbRequiredHours}`);
      console.log(`- 结果匹配: ${dbRequiredHours == testData.expectedRequiredHours ? '✅ 通过' : '❌ 失败'}`);

      // 清理测试数据
      await pool.execute('DELETE FROM process_plans WHERE id = ?', [result.insertId]);
      console.log('\n✅ 清理测试数据完成');
    }
  } catch (error) {
    console.error('❌ 检查和修复失败:', error);
    throw error;
  }
}

// 执行检查和修复
checkTableAndFix()
  .then(() => {
    console.log('\n=== 检查和修复完成 ===');
    process.exit(0);
  })
  .catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
