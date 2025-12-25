/**
 * 修复工序计划中定时工额为0的问题
 * 批量更新已有工序计划的定时工额和定额工时
 */

const { pool } = require('../config/database');

async function fixProcessPlanStandardWorkQuota() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log('🔧 开始修复工序计划中的定时工额问题...');

    // 1. 查询所有定时工额为0的工序计划
    const [processPlans] = await connection.execute(`
      SELECT id, plan_no, product_code, product_name 
      FROM process_plans 
      WHERE (standard_work_quota = 0 OR standard_work_quota IS NULL) 
      AND product_code IS NOT NULL 
      AND product_code != ''
      ORDER BY created_at DESC
      LIMIT 100
    `);

    console.log(`📊 找到 ${processPlans.length} 条需要修复的工序计划`);

    if (processPlans.length === 0) {
      console.log('✅ 没有需要修复的工序计划');
      await connection.commit();
      return;
    }

    let fixedCount = 0;
    let skippedCount = 0;

    // 2. 逐条修复
    for (const plan of processPlans) {
      console.log(`\n🔄 处理工序计划: ${plan.plan_no} (物料: ${plan.product_code})`);

      // 查询对应的物料数据
      const [materials] = await connection.execute(
        `
        SELECT material_code, standard_time, quota_time 
        FROM materials 
        WHERE material_code = ? 
        LIMIT 1
      `,
        [plan.product_code],
      );

      if (materials.length > 0) {
        const material = materials[0];
        const standardWorkQuota = parseFloat(material.standard_time || 0); // 定时工额
        const standardWorkHours = parseFloat(material.quota_time || 0); // 定额工时

        console.log(`   🔍 物料数据: standard_time=${material.standard_time}, quota_time=${material.quota_time}`);
        console.log(`   ✅ 修复值: 定时工额=${standardWorkQuota}, 定额工时=${standardWorkHours}`);

        // 更新工序计划
        await connection.execute(
          `
          UPDATE process_plans 
          SET standard_work_quota = ?, standard_work_hours = ?, updated_at = NOW()
          WHERE id = ?
        `,
          [standardWorkQuota, standardWorkHours, plan.id],
        );

        console.log(`   ✅ 已修复工序计划: ${plan.plan_no}`);
        fixedCount++;
      } else {
        console.log(`   ⚠️ 未找到物料编号 ${plan.product_code} 对应的物料数据`);
        skippedCount++;
      }
    }

    await connection.commit();

    console.log(`\n🎉 修复完成！`);
    console.log(`   ✅ 成功修复: ${fixedCount} 条`);
    console.log(`   ⚠️ 跳过修复: ${skippedCount} 条`);
    console.log(`   📊 总处理: ${processPlans.length} 条`);
  } catch (error) {
    await connection.rollback();
    console.error('❌ 修复过程中出错:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('🚀 开始执行工序计划定时工额修复脚本...');
  fixProcessPlanStandardWorkQuota()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { fixProcessPlanStandardWorkQuota };
