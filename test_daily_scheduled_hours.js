/**
 * 测试当天已排程工时累积计算功能
 */

const { pool } = require('./backend/config/database');

async function testDailyScheduledHours() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 开始测试当天已排程工时累积计算功能\n');
    
    // 1. 查看现有的组装工序2026-01-03的记录
    console.log('📊 第一步：查看现有记录');
    const [existingRows] = await connection.execute(`
      SELECT id, plan_no, process_name, 
             DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date,
             daily_total_hours, daily_scheduled_hours, 
             scheduled_work_hours, schedule_quantity
      FROM real_process_plans 
      WHERE process_name = '组装' 
        AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = '2026-01-03'
      ORDER BY id
    `);
    
    console.log(`   现有记录数: ${existingRows.length}`);
    existingRows.forEach((row, index) => {
      console.log(`   记录${index + 1}:`);
      console.log(`     ID: ${row.id}`);
      console.log(`     计划编号: ${row.plan_no}`);
      console.log(`     当天总工时: ${row.daily_total_hours}`);
      console.log(`     当天已排程工时: ${row.daily_scheduled_hours}`);
      console.log(`     本条排程工时: ${row.scheduled_work_hours}`);
      console.log(`     排程数量: ${row.schedule_quantity}`);
    });
    console.log('');
    
    // 2. 创建测试备料计划(物料来源=自制,触发推送到真工序计划)
    console.log('📝 第二步：创建测试备料计划');
    const testPlanNo = `TEST_MPP_${Date.now()}`;
    
    await connection.execute(`
      INSERT INTO material_preparation_plans (
        plan_no, source_plan_no, parent_code, parent_name, material_code, material_name,
        material_source, material_unit, demand_quantity, available_stock, replenishment_quantity,
        source_process, demand_date, sales_order_no, customer_order_no,
        main_plan_product_code, main_plan_product_name, main_plan_quantity,
        promise_delivery_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testPlanNo,
      'TEST_SOURCE',
      'P001',
      '测试父件',
      'M001',  // 确保materials表有这个物料
      '测试物料',
      '自制',  // ✅ 物料来源=自制，满足推送条件
      '个',
      100,    // 需求数量
      30,     // 可用库存
      70,     // 需补货数量 > 0，满足推送条件
      '组装', // 来源工序
      '2026-01-05',  // 需求日期
      'SO001',
      'CO001',
      'P001',
      '测试产品',
      50,
      '2026-01-05',
      'admin'
    ]);
    
    console.log(`   测试备料计划已创建: ${testPlanNo}\n`);
    
    // 3. 触发推送到真工序计划
    console.log('🚀 第三步：触发推送到真工序计划');
    
    const MaterialPreparationPlanService = require('./backend/services/materialPreparationPlanService');
    
    // 获取刚创建的备料计划
    const [planRows] = await connection.execute(`
      SELECT * FROM material_preparation_plans WHERE plan_no = ?
    `, [testPlanNo]);
    
    if (planRows.length > 0) {
      const planData = planRows[0];
      
      // 转换为驼峰命名
      const data = {
        planNo: planData.plan_no,
        sourcePlanNo: planData.source_plan_no,
        materialCode: planData.material_code,
        materialName: planData.material_name,
        materialSource: planData.material_source,
        materialUnit: planData.material_unit,
        demandQuantity: planData.demand_quantity,
        availableStock: planData.available_stock,
        sourceProcess: planData.source_process,
        demandDate: planData.demand_date,
        salesOrderNo: planData.sales_order_no,
        customerOrderNo: planData.customer_order_no,
        mainPlanProductCode: planData.main_plan_product_code,
        mainPlanProductName: planData.main_plan_product_name,
        mainPlanQuantity: planData.main_plan_quantity,
        promiseDeliveryDate: planData.promise_delivery_date,
        customerName: planData.customer_name,
        createdBy: planData.created_by
      };
      
      console.log('   备料计划数据:', {
        planNo: data.planNo,
        materialCode: data.materialCode,
        sourceProcess: data.sourceProcess,
        demandQuantity: data.demandQuantity,
        availableStock: data.availableStock
      });
      console.log('');
      
      const pushResult = await MaterialPreparationPlanService.pushToRealProcessPlan(data);
      
      if (pushResult && pushResult.success) {
        console.log(`   ✅ 推送成功，真工序计划编号: ${pushResult.planNo}\n`);
        
        // 4. 验证新创建的真工序计划的当天已排程工时
        console.log('🔍 第四步：验证新记录的当天已排程工时');
        
        const [newPlanRows] = await connection.execute(`
          SELECT id, plan_no, process_name, 
                 DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date,
                 daily_total_hours, daily_scheduled_hours, 
                 scheduled_work_hours, schedule_quantity
          FROM real_process_plans 
          WHERE plan_no = ?
        `, [pushResult.planNo]);
        
        if (newPlanRows.length > 0) {
          const newPlan = newPlanRows[0];
          console.log('   新创建的真工序计划:');
          console.log(`     计划编号: ${newPlan.plan_no}`);
          console.log(`     工序名称: ${newPlan.process_name}`);
          console.log(`     计划排程日期: ${newPlan.schedule_date}`);
          console.log(`     当天总工时 (daily_total_hours): ${newPlan.daily_total_hours}`);
          console.log(`     当天已排程工时 (daily_scheduled_hours): ${newPlan.daily_scheduled_hours}`);
          console.log(`     本条排程工时 (scheduled_work_hours): ${newPlan.scheduled_work_hours}`);
          console.log(`     排程数量 (schedule_quantity): ${newPlan.schedule_quantity}\n`);
          
          // 验证规则
          console.log('   验证规则:');
          
          // 查询同工序同日期之前的记录
          const [previousRows] = await connection.execute(`
            SELECT COALESCE(SUM(scheduled_work_hours), 0) as previous_total
            FROM real_process_plans
            WHERE process_name = ?
              AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = ?
              AND id < ?
          `, [newPlan.process_name, newPlan.schedule_date, newPlan.id]);
          
          const previousTotal = parseFloat(previousRows[0].previous_total);
          const actualScheduled = parseFloat(newPlan.daily_scheduled_hours);
          
          console.log(`     之前记录的排程工时总和: ${previousTotal}`);
          console.log(`     新记录的当天已排程工时: ${actualScheduled}`);
          
          if (Math.abs(actualScheduled - previousTotal) < 0.01) {
            console.log(`   ✅ 测试通过！当天已排程工时正确累积之前记录: ${actualScheduled}\n`);
          } else {
            console.log(`   ❌ 测试失败！当天已排程工时不正确:`);
            console.log(`      预期: ${previousTotal}`);
            console.log(`      实际: ${actualScheduled}\n`);
          }
          
          // 5. 查看更新后的所有记录
          console.log('📊 第五步：查看更新后的所有记录');
          const [updatedRows] = await connection.execute(`
            SELECT id, plan_no, 
                   DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date,
                   daily_total_hours, daily_scheduled_hours, 
                   scheduled_work_hours
            FROM real_process_plans 
            WHERE process_name = '组装' 
              AND DATE_FORMAT(schedule_date, '%Y-%m-%d') = '2026-01-03'
            ORDER BY id
          `);
          
          console.log(`   更新后记录数: ${updatedRows.length}`);
          updatedRows.forEach((row, index) => {
            console.log(`   记录${index + 1} (ID: ${row.id}):`);
            console.log(`     当天总工时: ${row.daily_total_hours}`);
            console.log(`     当天已排程工时: ${row.daily_scheduled_hours}`);
            console.log(`     本条排程工时: ${row.scheduled_work_hours}`);
          });
          console.log('');
          
        } else {
          console.log('   ❌ 未找到新创建的真工序计划\n');
        }
        
      } else {
        console.log('   ❌ 推送失败或被跳过\n');
        console.log('   结果:', pushResult);
      }
    }
    
    // 6. 清理测试数据
    console.log('🧹 第六步：清理测试数据');
    await connection.execute('DELETE FROM material_preparation_plans WHERE plan_no = ?', [testPlanNo]);
    if (pushResult && pushResult.planNo) {
      await connection.execute('DELETE FROM real_process_plans WHERE plan_no = ?', [pushResult.planNo]);
      console.log(`   已删除测试数据: ${testPlanNo}, ${pushResult.planNo}\n`);
    } else {
      console.log(`   已删除测试数据: ${testPlanNo}\n`);
    }
    
    console.log('🎉 测试完成！\n');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    connection.release();
    process.exit(0);
  }
}

// 运行测试
testDailyScheduledHours();
