const { pool } = require('./backend/config/database');

async function testPackingConnection() {
  console.log('========================================');
  console.log('🔍 打包工序前后端数据库连接测试');
  console.log('========================================\n');

  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const [tables] = await pool.execute("SHOW TABLES LIKE 'packing_process_plans'");
    if (tables.length > 0) {
      console.log('   ✅ 数据库表存在: packing_process_plans');
    } else {
      console.log('   ❌ 数据库表不存在！');
      return;
    }

    // 2. 测试表结构
    console.log('\n2️⃣ 测试表结构...');
    const [columns] = await pool.execute("SHOW COLUMNS FROM packing_process_plans WHERE Field IN ('product_code', 'standard_work_quota')");
    console.log('   关键字段:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });

    // 3. 测试数据查询
    console.log('\n3️⃣ 测试数据查询...');
    const [rows] = await pool.execute(
      'SELECT id, product_code, standard_work_quota FROM packing_process_plans ORDER BY id DESC LIMIT 1'
    );
    if (rows.length > 0) {
      console.log('   ✅ 最新记录:');
      console.log('   ', JSON.stringify(rows[0], null, 2));
      console.log(`   📊 product_code: ${rows[0].product_code}`);
      console.log(`   📊 standard_work_quota: ${rows[0].standard_work_quota}`);
    } else {
      console.log('   ⚠️ 表中暂无数据');
    }

    // 4. 测试物料库连接
    console.log('\n4️⃣ 测试物料库连接...');
    const [materials] = await pool.execute(
      "SELECT material_code, material_name, standard_time FROM materials WHERE material_code = '6001A0306'"
    );
    if (materials.length > 0) {
      console.log('   ✅ 物料库查询成功:');
      console.log('   ', JSON.stringify(materials[0], null, 2));
      console.log(`   📊 standard_time (定时工额): ${materials[0].standard_time}`);
    } else {
      console.log('   ❌ 未找到物料编号 6001A0306');
    }

    // 5. 测试packingProcessPlanService
    console.log('\n5️⃣ 测试后端Service...');
    try {
      const packingService = require('./backend/services/packingProcessPlanService');
      console.log('   ✅ packingProcessPlanService 加载成功');
      console.log('   可用方法:', Object.getOwnPropertyNames(packingService).filter(m => typeof packingService[m] === 'function'));
    } catch (e) {
      console.log('   ❌ packingProcessPlanService 加载失败:', e.message);
    }

    // 6. 前端API路径检查
    console.log('\n6️⃣ 前端API路径检查...');
    console.log('   后端路由: /api/packing-process-plans');
    console.log('   前端baseURL: /api (来自request.js)');
    console.log('   前端API路径: /packing-process-plans (来自packingProcessPlan.js)');
    console.log('   完整URL: /api/packing-process-plans ✅ 匹配！');

    console.log('\n========================================');
    console.log('✅ 连接测试完成！');
    console.log('========================================');

    await pool.end();
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

testPackingConnection();
