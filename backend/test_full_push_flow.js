/**
 * 测试完整的数据流：销售订单 → 主生产计划 → 备料计划 → 真工序计划 → 推送到备料计划
 */

const { pool } = require('./config/database');

async function testFullFlow() {
  const connection = await pool.getConnection();

  try {
    console.log('\n=== 开始测试完整数据流 ===\n');

    // 1. 清理测试数据
    console.log('📝 步骤1: 清理旧的测试数据...');
    await connection.execute(`DELETE FROM real_process_plans WHERE master_plan_no LIKE 'TEST%'`);
    await connection.execute(`DELETE FROM material_preparation_plans WHERE source_plan_no LIKE 'TEST%'`);
    await connection.execute(`DELETE FROM master_production_plans WHERE plan_code LIKE 'TEST%'`);
    console.log('✅ 清理完成\n');

    const salesOrderNo = `TEST-SO-${Date.now()}`;

    // 2. 创建主生产计划
    console.log('📝 步骤2: 创建主生产计划...');
    const masterPlanNo = `TEST-MPS-${Date.now()}`;
    const [planResult] = await connection.execute(
      `
      INSERT INTO master_production_plans (
        plan_code, product_code, product_name, order_quantity,
        plan_quantity, output_process, promised_delivery_date,
        planned_storage_date, internal_order_no, customer_order_no,
        customer_name, salesperson, submitter, submit_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, '2026-01-20', '2026-01-18', ?, ?, ?, 'admin', 'admin', NOW(), '已下单')
    `,
      [
        masterPlanNo,
        '6001A0306',
        '6001A0306，铁质方向盘款，嘉博',
        50,
        50,
        '打包',
        salesOrderNo,
        'TEST-CUS-001',
        '测试客户',
      ],
    );
    console.log(`✅ 创建主生产计划: ${masterPlanNo}\n`);

    // 3. 执行排程 - 创建备料计划
    console.log('📝 步骤3: 执行排程，创建备料计划...');
    const MaterialPreparationPlanService = require('./services/materialPreparationPlanService');
    const materialPlanNo = `TEST-MPP-${Date.now()}`;

    const materialPlanData = {
      planNo: materialPlanNo,
      sourcePlanNo: masterPlanNo,
      sourceProcessPlanNo: '/',
      sourceProcess: '打包',
      materialCode: '6001A0306',
      materialName: '6001A0306，铁质方向盘款，嘉博',
      materialSource: '自制', // ✅ 设置为“自制”以触发自动推送
      materialUnit: '台',
      demandQuantity: 50,
      demandDate: '2026-01-18',
      salesOrderNo: salesOrderNo,
      customerOrderNo: 'TEST-CUS-001',
      mainPlanProductCode: '6001A0306',
      mainPlanProductName: '6001A0306，铁质方向盘款，嘉博',
      mainPlanQuantity: 50,
      promiseDeliveryDate: '2026-01-20',
      customerName: '测试客户',
      submitter: 'admin',
    };

    const materialResult = await MaterialPreparationPlanService.create(materialPlanData);
    console.log(`✅ 创建备料计划: ${materialPlanNo}`);
    console.log(`   生成的真工序计划编号: ${materialResult.processPlanNo || '(未生成)'}\n`);

    // 4. 检查真工序计划是否创建
    console.log('📝 步骤4: 检查真工序计划...');
    const [realPlans] = await connection.execute(
      `
      SELECT id, plan_no, product_code, product_name, schedule_quantity, process_name
      FROM real_process_plans 
      WHERE master_plan_no = ?
      ORDER BY created_at DESC
    `,
      [masterPlanNo],
    );

    console.log(`   找到 ${realPlans.length} 条真工序计划:`);
    realPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_no} - ${plan.product_code} (排程数量: ${plan.schedule_quantity})`);
    });
    console.log('');

    // 5. 检查是否推送到备料计划
    console.log('📝 步骤5: 检查是否推送到备料计划...');
    const [materialPlans] = await connection.execute(
      `
      SELECT id, plan_no, source_process_plan_no, material_code, material_name,
             parent_code, parent_name, customer_order_no, main_plan_product_code
      FROM material_preparation_plans
      WHERE source_plan_no = ?
      ORDER BY created_at DESC
    `,
      [masterPlanNo],
    );

    console.log(`   找到 ${materialPlans.length} 条备料计划:`);
    materialPlans.forEach((plan, index) => {
      const isPushedFromRealPlan =
        plan.source_process_plan_no && plan.source_process_plan_no.trim() !== '' && plan.source_process_plan_no !== '/';
      console.log(`   ${index + 1}. ${plan.plan_no}`);
      console.log(`      来源工序计划编号: ${plan.source_process_plan_no || '(空)'}`);
      console.log(`      物料: ${plan.material_code} - ${plan.material_name}`);
      console.log(`      父件: ${plan.parent_code || '(空)'} - ${plan.parent_name || '(空)'}`);
      console.log(`      客户订单编号: ${plan.customer_order_no || '(空)'}`);
      console.log(`      主计划产品编号: ${plan.main_plan_product_code || '(空)'}`);
      console.log(`      是否由真工序计划推送: ${isPushedFromRealPlan ? '✅ 是' : '❌ 否'}`);
    });

    // 7. 验证结果
    const pushedPlans = materialPlans.filter(
      p => p.source_process_plan_no && p.source_process_plan_no.trim() !== '' && p.source_process_plan_no !== '/',
    );

    console.log('\n=== 测试结果 ===');
    console.log(`销售订单: ${salesOrderNo}`);
    console.log(`主生产计划: ${masterPlanNo}`);
    console.log(`备料计划: ${materialPlanNo}`);
    console.log(`真工序计划数量: ${realPlans.length}`);
    console.log(`备料计划总数: ${materialPlans.length}`);
    console.log(`由真工序计划推送的备料计划数量: ${pushedPlans.length}`);

    if (pushedPlans.length > 0) {
      console.log('\n✅ 测试成功！真工序计划已成功推送到备料计划');
    } else {
      console.log('\n❌ 测试失败！真工序计划未推送到备料计划');
      console.log('   可能原因：');
      console.log('   1. 真工序计划的计划排程数量<=0');
      console.log('   2. 产品没有列表式BOM数据');
      console.log('   3. 推送逻辑执行失败');
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

testFullFlow();
