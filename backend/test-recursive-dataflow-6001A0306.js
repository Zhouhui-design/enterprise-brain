/**
 * 测试6001A0306递归数据流完整性验证脚本
 *
 * 测试场景：
 * 1. 主生产计划执行排程 → 生成备料计划（6001A0306）
 * 2. 备料计划推送到打包工序计划（来源工序=打包）
 * 3. 打包工序计划推送BOM子件回备料计划（470001A、470002A、511442B）
 * 4. 备料计划再次推送到组装工序计划（470001A、470002A的来源工序=组装）
 * 5. 验证递归数据流是否正确执行
 */

const { pool } = require('./config/database');
const MaterialPreparationPlanService = require('./services/materialPreparationPlanService');

async function testRecursiveDataflow() {
  console.log('\n========================================');
  console.log('🧪 测试6001A0306递归数据流');
  console.log('========================================\n');

  try {
    // ✅ 步骤1: 检查备料计划是否存在
    console.log('📋 步骤1: 检查备料计划数据...\n');
    const [materialPlans] = await pool.execute(
      `SELECT id, plan_no, material_code, material_name, source_process, material_source, 
              replenishment_quantity, demand_quantity, available_stock
       FROM material_preparation_plans
       WHERE material_code = '6001A0306'
       ORDER BY created_at DESC
       LIMIT 1`,
    );

    if (materialPlans.length === 0) {
      console.log('❌ 未找到6001A0306的备料计划，请先执行主生产计划排程');
      return;
    }

    const materialPlan = materialPlans[0];
    console.log('✅ 找到备料计划:');
    console.log(`   编号: ${materialPlan.plan_no}`);
    console.log(`   物料: ${materialPlan.material_code} - ${materialPlan.material_name}`);
    console.log(`   来源工序: ${materialPlan.source_process}`);
    console.log(`   物料来源: ${materialPlan.material_source}`);
    console.log(`   需补货数量: ${materialPlan.replenishment_quantity}`);
    console.log(`   需求数量: ${materialPlan.demand_quantity}`);
    console.log(`   可用库存: ${materialPlan.available_stock}\n`);

    // ✅ 步骤2: 触发推送到工序计划
    console.log('📤 步骤2: 触发备料计划推送到工序计划...\n');

    // 检查推送条件
    const shouldPush =
      materialPlan.material_source === '自制' &&
      parseFloat(materialPlan.replenishment_quantity || 0) > 0 &&
      materialPlan.source_process;

    if (!shouldPush) {
      console.log('⚠️ 不满足推送条件:');
      console.log(`   物料来源=${materialPlan.material_source} (需要=自制)`);
      console.log(`   需补货数量=${materialPlan.replenishment_quantity} (需要>0)`);
      console.log(`   来源工序=${materialPlan.source_process} (需要不为空)`);
      return;
    }

    console.log('✅ 满足推送条件，开始推送...\n');

    // 调用推送逻辑
    const result = await MaterialPreparationPlanService.autoTriggerPush();

    console.log('\n✅ 推送执行完成:');
    console.log(`   满足条件的备料计划总数: ${result.total}`);
    console.log(`   成功推送数量: ${result.success}\n`);

    // ✅ 步骤3: 检查打包工序计划是否生成
    console.log('🔍 步骤3: 检查打包工序计划是否生成...\n');

    const [packingPlans] = await pool.execute(
      `SELECT id, plan_no, product_code, product_name, process_name, schedule_quantity,
              source_no, master_plan_product_code, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date
       FROM packing_process_plans
       WHERE source_no = ?
       ORDER BY created_at DESC`,
      [materialPlan.plan_no],
    );

    if (packingPlans.length > 0) {
      console.log(`✅ 找到 ${packingPlans.length} 条打包工序计划:`);
      packingPlans.forEach((plan, idx) => {
        console.log(`\n   【${idx + 1}】打包工序计划:`);
        console.log(`   编号: ${plan.plan_no}`);
        console.log(`   产品: ${plan.product_code} - ${plan.product_name}`);
        console.log(`   工序: ${plan.process_name}`);
        console.log(`   排程数量: ${plan.schedule_quantity}`);
        console.log(`   排程日期: ${plan.schedule_date}`);
        console.log(`   来源编号: ${plan.source_no}`);
        console.log(`   主计划产品: ${plan.master_plan_product_code}`);
      });
    } else {
      console.log('❌ 未找到打包工序计划，推送可能失败');
      return;
    }

    // ✅ 步骤4: 检查第2轮备料计划（BOM子件）
    console.log('\n\n🔍 步骤4: 检查第2轮备料计划（BOM子件）...\n');

    const [childMaterialPlans] = await pool.execute(
      `SELECT id, plan_no, material_code, material_name, source_process, material_source,
              replenishment_quantity, parent_code, parent_name
       FROM material_preparation_plans
       WHERE parent_code = '6001A0306'
       ORDER BY created_at DESC`,
    );

    if (childMaterialPlans.length > 0) {
      console.log(`✅ 找到 ${childMaterialPlans.length} 条第2轮备料计划（BOM子件）:`);
      childMaterialPlans.forEach((plan, idx) => {
        console.log(`\n   【${idx + 1}】备料计划:`);
        console.log(`   编号: ${plan.plan_no}`);
        console.log(`   物料: ${plan.material_code} - ${plan.material_name}`);
        console.log(`   来源工序: ${plan.source_process}`);
        console.log(`   物料来源: ${plan.material_source}`);
        console.log(`   需补货数量: ${plan.replenishment_quantity}`);
        console.log(`   父件: ${plan.parent_code} - ${plan.parent_name}`);
      });
    } else {
      console.log('❌ 未找到第2轮备料计划，BOM推送可能失败');
      return;
    }

    // ✅ 步骤5: 检查组装工序计划（第2轮推送）
    console.log('\n\n🔍 步骤5: 检查组装工序计划（第2轮推送）...\n');

    const childPlanNos = childMaterialPlans.map(p => p.plan_no);
    if (childPlanNos.length > 0) {
      const placeholders = childPlanNos.map(() => '?').join(',');
      const [assemblyPlans] = await pool.execute(
        `SELECT id, plan_no, product_code, product_name, process_name, schedule_quantity,
                source_no, master_plan_product_code, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date
         FROM assembly_process_plans
         WHERE source_no IN (${placeholders})
         ORDER BY created_at DESC`,
        childPlanNos,
      );

      if (assemblyPlans.length > 0) {
        console.log(`✅ 找到 ${assemblyPlans.length} 条组装工序计划:`);
        assemblyPlans.forEach((plan, idx) => {
          console.log(`\n   【${idx + 1}】组装工序计划:`);
          console.log(`   编号: ${plan.plan_no}`);
          console.log(`   产品: ${plan.product_code} - ${plan.product_name}`);
          console.log(`   工序: ${plan.process_name}`);
          console.log(`   排程数量: ${plan.schedule_quantity}`);
          console.log(`   排程日期: ${plan.schedule_date}`);
          console.log(`   来源编号: ${plan.source_no}`);
          console.log(`   主计划产品: ${plan.master_plan_product_code}`);
        });
      } else {
        console.log('⚠️ 未找到组装工序计划，可能是来源工序不是"组装"');
      }
    }

    // ✅ 步骤6: 统计数据流完整性
    console.log('\n\n📊 步骤6: 数据流完整性统计...\n');
    console.log('========================================');
    console.log('第1轮: 主生产计划 → 备料计划 (6001A0306)');
    console.log(`   备料计划数量: 1 条 ✅`);
    console.log('\n第2轮: 备料计划 → 打包工序计划');
    console.log(`   打包工序计划数量: ${packingPlans.length} 条 ${packingPlans.length > 0 ? '✅' : '❌'}`);
    console.log('\n第3轮: 打包工序计划 → 备料计划 (BOM子件)');
    console.log(`   备料计划数量: ${childMaterialPlans.length} 条 ${childMaterialPlans.length > 0 ? '✅' : '❌'}`);
    console.log(`   预期子件: 470001A, 470002A, 511442B`);

    const expectedCodes = ['470001A', '470002A', '511442B'];
    const actualCodes = childMaterialPlans.map(p => p.material_code);
    const foundCodes = expectedCodes.filter(code => actualCodes.includes(code));
    console.log(`   实际找到: ${foundCodes.join(', ')} (${foundCodes.length}/3)`);

    console.log('\n第4轮: 备料计划 → 组装工序计划');
    const assemblyCount = await pool.execute(
      `SELECT COUNT(*) as count FROM assembly_process_plans WHERE source_no IN (${childPlanNos.map(() => '?').join(',')})`,
      childPlanNos,
    );
    const actualAssemblyCount = assemblyCount[0][0].count;
    console.log(`   组装工序计划数量: ${actualAssemblyCount} 条 ${actualAssemblyCount > 0 ? '✅' : '⚠️'}`);

    console.log('\n========================================');
    console.log('✅ 递归数据流测试完成！');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  } finally {
    process.exit(0);
  }
}

// 执行测试
testRecursiveDataflow();
