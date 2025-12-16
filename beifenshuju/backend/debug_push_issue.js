/**
 * 诊断真工序计划推送到备料计划的问题
 */

const { pool } = require('./config/database');

async function diagnose() {
  try {
    console.log('\n=== 真工序计划推送诊断 ===\n');
    
    // 1. 查询最新的真工序计划
    const [realPlans] = await pool.execute(`
      SELECT 
        id, plan_no, product_code, product_name, process_name,
        schedule_quantity, schedule_date, master_plan_no, source_no,
        customer_order_no, main_plan_product_code, main_plan_product_name,
        promise_delivery_date, created_at
      FROM real_process_plans 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📊 最新的5条真工序计划：`);
    realPlans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ID=${plan.id}, 编号=${plan.plan_no}`);
      console.log(`   产品: ${plan.product_code} - ${plan.product_name}`);
      console.log(`   工序: ${plan.process_name}`);
      console.log(`   计划排程数量: ${plan.schedule_quantity} (类型: ${typeof plan.schedule_quantity})`);
      console.log(`   排程日期: ${plan.schedule_date}`);
      console.log(`   主计划编号: ${plan.master_plan_no}`);
      console.log(`   来源编号: ${plan.source_no}`);
      console.log(`   客户订单编号: ${plan.customer_order_no}`);
      console.log(`   主计划产品编号: ${plan.main_plan_product_code}`);
      console.log(`   主计划产品名称: ${plan.main_plan_product_name}`);
      console.log(`   订单承诺交期: ${plan.promise_delivery_date}`);
      console.log(`   创建时间: ${plan.created_at}`);
      console.log(`   是否满足推送条件 (排程数量>0): ${plan.schedule_quantity && parseFloat(plan.schedule_quantity) > 0 ? '✅ 满足' : '❌ 不满足'}`);
    });
    
    // 2. 查询备料计划中是否有从真工序计划推送的记录
    console.log(`\n\n📊 备料计划中的记录（按创建时间倒序）：`);
    const [materialPlans] = await pool.execute(`
      SELECT 
        id, plan_no, source_plan_no, source_process_plan_no,
        material_code, material_name, demand_quantity, replenishment_quantity,
        parent_code, parent_name, parent_process_name,
        customer_order_no, main_plan_product_code, main_plan_product_name,
        promise_delivery_date,
        created_at
      FROM material_preparation_plans
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    materialPlans.forEach((plan, index) => {
      console.log(`\n${index + 1}. ID=${plan.id}, 编号=${plan.plan_no}`);
      console.log(`   来源主计划编号: ${plan.source_plan_no}`);
      console.log(`   来源工序计划编号: ${plan.source_process_plan_no}`);
      console.log(`   物料: ${plan.material_code} - ${plan.material_name}`);
      console.log(`   需求数量: ${plan.demand_quantity}`);
      console.log(`   需补货数量: ${plan.replenishment_quantity}`);
      console.log(`   父件: ${plan.parent_code} - ${plan.parent_name}`);
      console.log(`   父件工序: ${plan.parent_process_name || '(空)'}`);
      console.log(`   客户订单编号: ${plan.customer_order_no || '(空)'}`);
      console.log(`   主计划产品编号: ${plan.main_plan_product_code || '(空)'}`);
      console.log(`   主计划产品名称: ${plan.main_plan_product_name || '(空)'}`);
      console.log(`   订单承诺交期: ${plan.promise_delivery_date || '(空)'}`);
      console.log(`   创建时间: ${plan.created_at}`);
      
      // 判断是否由真工序计划推送
      const isPushedFromRealPlan = plan.source_process_plan_no && plan.source_process_plan_no.trim() !== '' && plan.source_process_plan_no !== '/';
      console.log(`   是否由真工序计划推送: ${isPushedFromRealPlan ? '✅ 是' : '❌ 否'}`);
      
      // 检查6个新增字段是否完整
      const hasNewFields = plan.customer_order_no && plan.main_plan_product_code && plan.main_plan_product_name && plan.promise_delivery_date;
      console.log(`   新增字段是否完整: ${hasNewFields ? '✅ 完整' : '⚠️ 不完整'}`);
    });
    
    // 3. 统计推送情况
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN source_process_plan_no IS NOT NULL AND source_process_plan_no != '' AND source_process_plan_no != '/' THEN 1 ELSE 0 END) as pushed_from_real_plan
      FROM material_preparation_plans
    `);
    
    console.log(`\n\n📊 备料计划统计：`);
    console.log(`   总记录数: ${stats[0].total}`);
    console.log(`   由真工序计划推送的: ${stats[0].pushed_from_real_plan}`);
    console.log(`   由主生产计划创建的: ${stats[0].total - stats[0].pushed_from_real_plan}`);
    
    // 4. 检查列表式BOM是否存在
    console.log(`\n\n📊 检查列表式生产BOM：`);
    const [bomParents] = await pool.execute(`
      SELECT parent_code, parent_name, COUNT(*) as child_count
      FROM list_style_production_boms parent
      LEFT JOIN list_style_bom_children children ON parent.id = children.parent_id
      WHERE parent.is_default = '是'
      GROUP BY parent.id, parent.parent_code, parent.parent_name
      LIMIT 5
    `);
    
    if (bomParents.length === 0) {
      console.log('   ⚠️ 未找到任何列表式生产BOM数据');
    } else {
      bomParents.forEach((bom, index) => {
        console.log(`   ${index + 1}. ${bom.parent_code} - ${bom.parent_name} (子件数: ${bom.child_count})`);
      });
    }
    
    console.log('\n=== 诊断完成 ===\n');
    
  } catch (error) {
    console.error('❌ 诊断失败:', error);
  } finally {
    await pool.end();
  }
}

diagnose();
