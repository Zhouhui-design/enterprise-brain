/**
 * 测试真工序计划的当天总工时生成功能
 */

const { pool } = require('./backend/config/database');

async function testDailyTotalHours() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🧪 开始测试真工序计划当天总工时生成功能\n');
    
    // 1. 查询工序能力负荷表数据
    console.log('📊 第一步：查询工序能力负荷表数据');
    const [capacityRows] = await connection.execute(`
      SELECT process_name, DATE_FORMAT(date, '%Y-%m-%d') as date, 
             work_shift, available_workstations, total_hours
      FROM process_capacity_load 
      WHERE process_name = '组装' AND date = '2026-01-03'
      LIMIT 1
    `);
    
    if (capacityRows.length > 0) {
      const record = capacityRows[0];
      console.log(`   工序: ${record.process_name}`);
      console.log(`   日期: ${record.date}`);
      console.log(`   班次工时: ${record.work_shift}`);
      console.log(`   可用工位数: ${record.available_workstations}`);
      console.log(`   当前total_hours: ${record.total_hours}`);
      
      const expectedTotalHours = parseFloat(record.work_shift) * parseFloat(record.available_workstations);
      console.log(`   预期总工时: ${expectedTotalHours}\n`);
    } else {
      console.log('   ❌ 未找到工序能力负荷记录\n');
      return;
    }
    
    // 2. 创建一个测试备料计划
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
      'TEST_MPP_SOURCE',
      'P001',
      '测试父件',
      'M001',
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
    
    // 获取刚创建的备料计划数据
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
        materialName: data.materialName,
        sourceProcess: data.sourceProcess,
        demandQuantity: data.demandQuantity,
        availableStock: data.availableStock,
        replenishmentQty: data.demandQuantity - data.availableStock
      });
      console.log('');
      
      const pushResult = await MaterialPreparationPlanService.pushToRealProcessPlan(data);
      
      if (pushResult && pushResult.success) {
        console.log(`   ✅ 推送成功，真工序计划编号: ${pushResult.planNo}\n`);
        
        // 4. 验证真工序计划的当天总工时
        console.log('🔍 第四步：验证真工序计划的当天总工时');
        
        const [realPlanRows] = await connection.execute(`
          SELECT plan_no, process_name, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date,
                 daily_total_hours, scheduled_work_hours, schedule_quantity
          FROM real_process_plans 
          WHERE plan_no = ?
        `, [pushResult.planNo]);
        
        if (realPlanRows.length > 0) {
          const realPlan = realPlanRows[0];
          console.log('   真工序计划数据:');
          console.log(`     计划编号: ${realPlan.plan_no}`);
          console.log(`     工序名称: ${realPlan.process_name}`);
          console.log(`     计划排程日期: ${realPlan.schedule_date}`);
          console.log(`     当天总工时 (daily_total_hours): ${realPlan.daily_total_hours}`);
          console.log(`     计划排程工时 (scheduled_work_hours): ${realPlan.scheduled_work_hours}`);
          console.log(`     计划排程数量 (schedule_quantity): ${realPlan.schedule_quantity}\n`);
          
          // 验证结果
          const expectedTotalHours = parseFloat(capacityRows[0].work_shift) * parseFloat(capacityRows[0].available_workstations);
          const actualTotalHours = parseFloat(realPlan.daily_total_hours);
          
          if (Math.abs(actualTotalHours - expectedTotalHours) < 0.01) {
            console.log(`   ✅ 测试通过！当天总工时正确生成: ${actualTotalHours} (预期: ${expectedTotalHours})`);
          } else {
            console.log(`   ❌ 测试失败！当天总工时不正确: ${actualTotalHours} (预期: ${expectedTotalHours})`);
          }
        } else {
          console.log('   ❌ 未找到创建的真工序计划\n');
        }
        
      } else {
        console.log('   ❌ 推送失败或被跳过\n');
        console.log('   结果:', pushResult);
      }
    }
    
    // 5. 清理测试数据
    console.log('\n🧹 第五步：清理测试数据');
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
testDailyTotalHours();
