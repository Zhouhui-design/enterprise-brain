/**
 * 测试真工序计划UPDATE推送到备料计划后,备料计划UPDATE能否触发推送到真工序计划
 * 完整数据闭环测试
 */

const { pool } = require('./config/database');
const realProcessPlanToMaterialService = require('./services/realProcessPlanToMaterialService');

async function runTest() {
  let connection;
  
  try {
    console.log('🧪 开始测试UPDATE触发推送数据闭环...\n');
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // 1️⃣ 清空测试数据
    console.log('1️⃣ 清空测试数据...');
    await connection.execute(`DELETE FROM real_process_plans WHERE plan_no LIKE 'TEST-UPDATE-%'`);
    await connection.execute(`DELETE FROM material_preparation_plans WHERE plan_no LIKE 'TEST-MPP-%'`);
    console.log('   ✅ 清空完成\n');
    
    // 2️⃣ 创建真工序计划(计划排程数量>0)
    console.log('2️⃣ 创建真工序计划...');
    const realProcessPlanNo = `TEST-UPDATE-RPP-${Date.now()}`;
    
    const [insertResult] = await connection.execute(`
      INSERT INTO real_process_plans (
        plan_no, sales_order_no, master_plan_no,
        product_code, product_name, process_name,
        product_unit, level0_demand, completion_date,
        replenishment_qty, standard_work_quota, standard_work_hours,
        customer_name, source_no, schedule_count,
        schedule_quantity, schedule_date,
        submitted_by, submitted_at, created_at, updated_at
      ) VALUES (
        ?, 'TEST-SO-001', 'TEST-MPS-001',
        '6001A0306', '6001A0306,铁质方向盘款,嘉博', '总装',
        '台', 100, '2026-01-10',
        100, 0.5, 2,
        '测试客户', 'TEST-SOURCE', 1,
        50, '2026-01-08',
        'admin', NOW(), NOW(), NOW()
      )
    `, [realProcessPlanNo]);
    
    const realPlanId = insertResult.insertId;
    console.log(`   ✅ 创建真工序计划: ${realProcessPlanNo} (ID: ${realPlanId})`);
    console.log(`      产品编号: 6001A0306`);
    console.log(`      计划排程数量: 50\n`);
    
    await connection.commit();
    connection.release();
    
    // 3️⃣ 查询真工序计划完整信息
    console.log('3️⃣ 查询真工序计划完整信息...');
    const [realPlans] = await pool.execute(`
      SELECT * FROM real_process_plans WHERE id = ?
    `, [realPlanId]);
    
    const realPlan = realPlans[0];
    console.log(`   ✅ 找到真工序计划数据\n`);
    
    // 4️⃣ 加载工序间隔设置
    console.log('4️⃣ 加载工序间隔设置...');
    const [intervalSettings] = await pool.execute(`
      SELECT previous_process, next_process, interval_value as interval_hours, interval_unit
      FROM process_interval_settings
    `);
    console.log(`   ✅ 加载了 ${intervalSettings.length} 条工序间隔配置\n`);
    
    // 5️⃣ 手动调用推送到备料计划
    console.log('5️⃣ 调用真工序计划推送到备料计划...');
    const pushResult = await realProcessPlanToMaterialService.pushToMaterialPreparation(
      realPlan,
      intervalSettings
    );
    
    if (pushResult.code === 200) {
      console.log(`   ✅ 推送成功,创建了 ${pushResult.data.count} 条备料计划`);
      console.log(`      推送的备料计划编号:`, pushResult.data.records.map(r => r.planNo).join(', '));
    } else {
      console.log(`   ❌ 推送失败: ${pushResult.message}`);
      return;
    }
    
    // 等待异步推送完成
    console.log('\n⏱️  等待3秒,等待备料计划UPDATE触发推送到真工序计划...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6️⃣ 查询备料计划INSERT后是否触发推送到真工序计划
    console.log('6️⃣ 验证备料计划INSERT是否触发推送到真工序计划...');
    const materialPlanNos = pushResult.data.records.map(r => r.planNo);
    
    for (const materialPlanNo of materialPlanNos) {
      console.log(`\n   检查备料计划: ${materialPlanNo}`);
      
      // 查询备料计划详情
      const [materialPlans] = await pool.execute(`
        SELECT 
          plan_no, material_code, material_name, material_source, 
          replenishment_quantity, source_process
        FROM material_preparation_plans
        WHERE plan_no = ?
      `, [materialPlanNo]);
      
      if (materialPlans.length > 0) {
        const plan = materialPlans[0];
        console.log(`      物料编号: ${plan.material_code}`);
        console.log(`      物料名称: ${plan.material_name}`);
        console.log(`      物料来源: ${plan.material_source}`);
        console.log(`      需补货数量: ${plan.replenishment_quantity}`);
        console.log(`      来源工序: ${plan.source_process}`);
        
        // 查询是否生成了对应的真工序计划
        const [generatedRealPlans] = await pool.execute(`
          SELECT plan_no, product_code, process_name, replenishment_qty
          FROM real_process_plans
          WHERE source_no = ? AND product_code = ?
        `, [materialPlanNo, plan.material_code]);
        
        if (generatedRealPlans.length > 0) {
          console.log(`      ✅ 成功生成真工序计划: ${generatedRealPlans[0].plan_no}`);
          console.log(`         工序名称: ${generatedRealPlans[0].process_name}`);
          console.log(`         需补货数量: ${generatedRealPlans[0].replenishment_qty}`);
        } else {
          console.log(`      ❌ 未生成真工序计划 (来源: ${materialPlanNo}, 产品: ${plan.material_code})`);
        }
      }
    }
    
    // 7️⃣ 统计最终结果
    console.log('\n\n7️⃣ 统计最终结果...');
    
    // 统计本次测试生成的备料计划(根据来源编号)
    const [materialPlanCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM material_preparation_plans
      WHERE source_process_plan_no = ?
    `, [realProcessPlanNo]);
    
    // 统计本次测试生成的真工序计划(根据来源编号以MPP开头)
    const [realPlanCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM real_process_plans
      WHERE source_no LIKE 'MPP%'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
    `);
    
    console.log(`   备料计划总数: ${materialPlanCount[0].count} 条`);
    console.log(`   真工序计划总数(由备料计划生成): ${realPlanCount[0].count} 条`);
    
    if (realPlanCount[0].count > 0 && materialPlanCount[0].count > 0) {
      console.log('\n   ✅✅✅ 数据闭环测试成功! ✅✅✅');
      console.log('   真工序计划 → 备料计划 → 真工序计划 数据流已打通');
      console.log(`   共生成 ${materialPlanCount[0].count} 条备料计划, ${realPlanCount[0].count} 条真工序计划`);
    } else {
      console.log('\n   ❌❌❌ 数据闭环测试失败! ❌❌❌');
      console.log('   备料计划INSERT后未触发推送到真工序计划');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    if (connection) await connection.rollback();
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

runTest();
