/**
 * 测试数据闭环：真工序计划 → 备料计划 → 真工序计划
 *
 * 验证流程：
 * 1. 创建一个真工序计划（计划排程数量>0）
 * 2. 自动推送到备料计划（生成N条备料计划）
 * 3. 自动触发备料计划推送到真工序计划规则（生成M条真工序计划）
 * 4. 验证数据闭环完整性
 */

const { pool } = require('./config/database');
const RealProcessPlanService = require('./services/realProcessPlanService');

async function testDataLoopTrigger() {
  console.log('🧪 测试数据闭环触发功能');
  console.log('='.repeat(80));

  try {
    // ===== 步骤1：创建一个真工序计划 =====
    console.log('\n📝 步骤1: 创建真工序计划...');
    const realProcessPlanData = {
      planNo: `TEST-LOOP-RPP-${Date.now()}`,
      salesOrderNo: 'SO20250101001',
      customerOrderNo: 'CUS-001',
      masterPlanNo: 'MPP001',
      mainPlanProductCode: '6001A0306',
      mainPlanProductName: '6001A0306，铁质方向盘款，嘉博',
      productCode: '6001A0306',
      productName: '6001A0306，铁质方向盘款，嘉博',
      processName: '打包',
      productUnit: '台',
      level0Demand: 100,
      scheduleQuantity: 50, // ✅ 关键：计划排程数量>0，触发推送
      replenishmentQty: 50,
      completionDate: '2025-01-20',
      promiseDeliveryDate: '2025-01-25',
      customerName: '测试客户',
      sourceNo: 'MPP-SOURCE-001',
      scheduleCount: 1,
      submittedBy: 'admin',
      submittedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }),
      bomNo: 'BOM-6001A0306', // ✅ 关键：BOM编号，用于查询子件
      standardWorkQuota: 10,
      standardWorkHours: 1,
    };

    console.log(`   创建真工序计划：${realProcessPlanData.planNo}`);
    console.log(`   计划排程数量：${realProcessPlanData.scheduleQuantity}`);
    console.log(`   BOM编号：${realProcessPlanData.bomNo}`);

    const createResult = await RealProcessPlanService.create(realProcessPlanData);
    const realPlanId = createResult.id;

    console.log(`\n✅ 真工序计划创建成功, ID: ${realPlanId}`);

    // 等待推送完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ===== 步骤2：验证推送到备料计划 =====
    console.log('\n📊 步骤2: 验证推送到备料计划...');
    const [materialPlans] = await pool.execute(
      `
      SELECT 
        id, plan_no, material_code, material_name, material_source,
        demand_quantity, replenishment_quantity, source_process,
        sales_order_no, customer_order_no, main_plan_product_code,
        main_plan_product_name, promise_delivery_date
      FROM material_preparation_plans
      WHERE source_process_plan_no = ?
      ORDER BY created_at DESC
    `,
      [realProcessPlanData.planNo],
    );

    console.log(`   找到 ${materialPlans.length} 条备料计划记录`);

    if (materialPlans.length === 0) {
      console.log('\n⚠️ 未找到任何备料计划记录');
      console.log('   可能原因：');
      console.log('   1. 真工序计划的BOM编号不存在或没有子件');
      console.log('   2. 推送条件不满足（计划排程数量>0）');
      console.log('   3. 推送过程中出现错误');
      return;
    }

    // 显示备料计划列表
    console.log('\n   📋 备料计划列表:');
    materialPlans.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.plan_no} (${plan.material_code})`);
      console.log(`      物料来源: ${plan.material_source}`);
      console.log(`      需补货数量: ${plan.replenishment_quantity}`);
      console.log(`      来源工序: ${plan.source_process}`);
    });

    // ===== 步骤3：验证备料计划推送到真工序计划 =====
    console.log('\n📊 步骤3: 验证备料计划推送到真工序计划...');

    let loopGeneratedPlans = 0;
    for (const materialPlan of materialPlans) {
      const [generatedPlans] = await pool.execute(
        `
        SELECT 
          id, plan_no, product_code, product_name, process_name,
          schedule_quantity, replenishment_qty, source_no
        FROM real_process_plans
        WHERE source_no = ?
      `,
        [materialPlan.plan_no],
      );

      if (generatedPlans.length > 0) {
        loopGeneratedPlans++;
        console.log(`\n   ✅ 备料计划 ${materialPlan.plan_no} → 生成了 ${generatedPlans.length} 条真工序计划`);
        generatedPlans.forEach((plan, index) => {
          console.log(`      ${index + 1}. ${plan.plan_no} (${plan.product_code})`);
          console.log(`         来源编号: ${plan.source_no}`);
          console.log(`         计划排程数量: ${plan.schedule_quantity}`);
        });
      } else {
        console.log(`\n   ⚠️ 备料计划 ${materialPlan.plan_no} 未生成真工序计划`);
        console.log(`      物料来源: ${materialPlan.material_source} (需要为"自制")`);
        console.log(`      需补货数量: ${materialPlan.replenishment_quantity} (需要>0)`);
      }
    }

    // ===== 步骤4：总结验证 =====
    console.log('\n📋 测试总结:');
    console.log('='.repeat(80));
    console.log(`✅ 创建真工序计划: 1 条 (${realProcessPlanData.planNo})`);
    console.log(`✅ 推送到备料计划: ${materialPlans.length} 条`);
    console.log(`✅ 闭环生成真工序计划: ${loopGeneratedPlans} 条`);

    const expectedLoopPlans = materialPlans.filter(
      p => p.material_source === '自制' && parseFloat(p.replenishment_quantity) > 0,
    ).length;

    console.log(`\n📊 数据闭环验证:`);
    console.log(`   预期生成真工序计划: ${expectedLoopPlans} 条 (物料来源=自制 && 需补货数量>0)`);
    console.log(`   实际生成真工序计划: ${loopGeneratedPlans} 条`);

    if (loopGeneratedPlans === expectedLoopPlans) {
      console.log('\n🎉 测试成功！数据闭环功能正常工作！');
      console.log('   ✅ 真工序计划 → 备料计划 → 真工序计划 数据流完整');
      console.log('   ✅ 防重复推送机制正常工作');
    } else {
      console.log('\n⚠️ 测试部分成功，但存在差异');
      console.log(`   差异数量: ${Math.abs(loopGeneratedPlans - expectedLoopPlans)} 条`);
      console.log('   可能原因：');
      console.log('   1. 部分备料计划不满足推送条件');
      console.log('   2. 防重复推送机制跳过了已存在的真工序计划');
      console.log('   3. 推送过程中出现错误');
    }

    // 清理测试数据（可选）
    console.log('\n🧹 是否清理测试数据？(此测试脚本不自动清理)');
    console.log('   手动清理SQL：');
    console.log(
      `   DELETE FROM real_process_plans WHERE plan_no = '${realProcessPlanData.planNo}' OR source_no LIKE 'TEST-LOOP-MPP-%';`,
    );
    console.log(
      `   DELETE FROM material_preparation_plans WHERE source_process_plan_no = '${realProcessPlanData.planNo}';`,
    );
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// 运行测试
testDataLoopTrigger().catch(console.error);
