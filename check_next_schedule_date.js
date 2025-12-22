const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain'
};

async function checkNextScheduleDate() {
  let connection;
  try {
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 成功连接到数据库');
    
    const planNo = 'RPP2512211401';
    
    // 1. 先查询打包工序计划记录的基本信息
    console.log(`\n🔍 步骤1: 查询packing_process_plans表中的记录: ${planNo}`);
    const [packingRows] = await connection.execute(
      `SELECT * FROM packing_process_plans WHERE plan_no = ?`,
      [planNo]
    );
    
    if (packingRows.length > 0) {
      console.log('✅ 找到打包工序计划记录');
      const record = packingRows[0];
      console.log(`📋 记录详情:`);
      console.log(`   计划编号: ${record.plan_no}`);
      console.log(`   工序名称: ${record.process_name}`);
      console.log(`   计划排程日期: ${record.schedule_date}`);
      console.log(`   下一个计划排程日期: ${record.next_schedule_date || '未设置'}`);
      console.log(`   所需工时: ${record.required_work_hours}`);
      console.log(`   已排程工时: ${record.scheduled_work_hours}`);
      console.log(`   剩余所需工时: ${record.remaining_required_hours}`);
      
      // 2. 关键查询：查询工序能力负荷表(process_capacity_load)，这才是下一个排程日期的数据源
      console.log(`\n🔍 步骤2: 查询工序能力负荷表(process_capacity_load)中的符合条件记录`);
      console.log(`   查询条件:`);
      console.log(`   - 工序名称 = ${record.process_name}`);
      console.log(`   - 日期 > ${record.schedule_date}`);
      console.log(`   - 剩余工时 > 0.5`);
      
      const scheduleDateStr = record.schedule_date.toISOString().split('T')[0];
      
      // 查询所有符合条件的记录
      const [capacityRows] = await connection.execute(
        `SELECT date, DATE_FORMAT(date, '%Y-%m-%d') as formatted_date, remaining_hours 
         FROM process_capacity_load 
         WHERE process_name = ? 
         ORDER BY date ASC`,
        [record.process_name]
      );
      
      console.log(`\n📊 所有打包工序的能力负荷记录:`);
      console.log(`   共找到${capacityRows.length}条记录，显示前20条:`);
      capacityRows.slice(0, 20).forEach((row, index) => {
        console.log(`   ${index + 1}. 原始日期: ${row.date}, 格式化日期: ${row.formatted_date}, 剩余工时: ${row.remaining_hours}小时`);
      });
      
      // 手动筛选符合条件的记录
      const filteredRows = capacityRows.filter(row => {
        const rowDate = new Date(row.date);
        const scheduleDateObj = new Date(record.schedule_date);
        
        // 筛选条件1: 日期 > 计划排程日期
        const isDateAfter = rowDate > scheduleDateObj;
        
        // 筛选条件2: 剩余工时 > 0.5
        const hasEnoughHours = row.remaining_hours > 0.5;
        
        return isDateAfter && hasEnoughHours;
      });
      
      console.log(`\n📋 筛选后的记录 (日期 > ${record.schedule_date}, 剩余工时 > 0.5):`);
      if (filteredRows.length > 0) {
        console.log(`   共找到${filteredRows.length}条符合条件的记录:`);
        filteredRows.forEach((row, index) => {
          console.log(`   ${index + 1}. 日期: ${row.date}, 剩余工时: ${row.remaining_hours}小时`);
        });
        
        // 获取最小日期
        const nextScheduleDate = filteredRows[0].date;
        console.log(`\n✅ 计算结果:`);
        console.log(`   符合条件的最小日期: ${nextScheduleDate}`);
        console.log(`   该日期的剩余工时: ${filteredRows[0].remaining_hours}小时`);
        
        // 检查数据库中存储的日期是否正确
        if (record.next_schedule_date) {
          const storedDateStr = record.next_schedule_date.toISOString().split('T')[0];
          const calculatedDateStr = nextScheduleDate.toISOString().split('T')[0];
          
          if (storedDateStr === calculatedDateStr) {
            console.log(`   数据库中存储的日期: ${record.next_schedule_date} ✅ 正确`);
          } else {
            console.log(`   数据库中存储的日期: ${record.next_schedule_date} ❌ 不正确`);
            console.log(`   建议更新为: ${nextScheduleDate}`);
          }
        } else {
          console.log(`   数据库中存储的日期: 未设置 ❌ 应该设置为: ${nextScheduleDate}`);
        }
        
      } else {
        console.log(`   ❌ 没有找到符合条件的记录`);
      }
      
      // 3. 查看完整的工序能力负荷表中的打包工序数据
      console.log(`\n🔍 步骤3: 查看工序能力负荷表中所有打包工序的记录（最近10条）`);
      const [allPackingCapacityRows] = await connection.execute(
        `SELECT date, remaining_hours 
         FROM process_capacity_load 
         WHERE process_name = ? 
         ORDER BY date ASC 
         LIMIT 10`,
        [record.process_name]
      );
      
      console.log(`📊 所有打包工序的能力负荷记录:`);
      allPackingCapacityRows.forEach((row, index) => {
        console.log(`   ${index + 1}. 日期: ${row.date}, 剩余工时: ${row.remaining_hours}小时`);
      });
      
    } else {
      console.log('❌ 未找到该打包工序计划记录');
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 执行查询
checkNextScheduleDate();