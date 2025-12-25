/**
 * 添加采购提前期相关字段
 * 1. materials表增加 default_procurement_lead_time 字段
 * 2. procurement_plans表增加 procurement_lead_time 字段
 * 3. 批量更新所有采购来源物料的默认采购提前期为3天
 */

const { pool } = require('../config/database');

async function addProcurementLeadTimeFields() {
  const connection = await pool.getConnection();

  try {
    console.log('🔧 开始添加采购提前期相关字段...\n');

    // 1. 给materials表增加 default_procurement_lead_time 字段
    console.log('📝 步骤1: 给materials表添加"默认采购提前期"字段');
    try {
      await connection.execute(`
        ALTER TABLE materials 
        ADD COLUMN default_procurement_lead_time INT DEFAULT 3 COMMENT '默认采购提前期(天数)'
        AFTER purchase_cycle
      `);
      console.log('✅ materials表字段添加成功');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  字段已存在，跳过');
      } else {
        throw err;
      }
    }

    // 2. 给procurement_plans表增加 procurement_lead_time 字段
    console.log('\n📝 步骤2: 给procurement_plans表添加"采购提前期"字段');
    try {
      await connection.execute(`
        ALTER TABLE procurement_plans 
        ADD COLUMN procurement_lead_time INT DEFAULT NULL COMMENT '采购提前期(天数)'
        AFTER material_plan_no
      `);
      console.log('✅ procurement_plans表字段添加成功');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  字段已存在，跳过');
      } else {
        throw err;
      }
    }

    // 3. 批量更新所有采购来源物料的默认采购提前期为3天
    console.log('\n📝 步骤3: 批量更新采购来源物料的默认采购提前期');
    const [result] = await connection.execute(`
      UPDATE materials 
      SET default_procurement_lead_time = 3 
      WHERE source = '采购' OR source LIKE '%采购%'
    `);
    console.log(`✅ 已更新 ${result.affectedRows} 条采购来源物料的默认采购提前期为3天`);

    // 4. 验证更新结果
    console.log('\n📝 步骤4: 验证更新结果');
    const [materials] = await connection.execute(`
      SELECT 
        material_code, 
        material_name, 
        source, 
        default_procurement_lead_time
      FROM materials 
      WHERE source = '采购' OR source LIKE '%采购%'
      LIMIT 10
    `);
    console.log('✅ 前10条采购物料记录:');
    console.table(materials);

    console.log('\n🎉 所有字段添加完成！');
    console.log('\n📋 修改汇总:');
    console.log('  - materials表: 新增 default_procurement_lead_time 字段(INT, 默认3天)');
    console.log('  - procurement_plans表: 新增 procurement_lead_time 字段(INT)');
    console.log(`  - 已更新 ${result.affectedRows} 条采购物料的默认提前期`);
  } catch (error) {
    console.error('❌ 添加字段失败:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行脚本
addProcurementLeadTimeFields()
  .then(() => {
    console.log('\n✅ 脚本执行成功');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ 脚本执行失败:', err);
    process.exit(1);
  });
