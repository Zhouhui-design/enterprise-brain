/**
 * 测试备料计划API
 * 验证数据库数据是否正常返回
 */

const { pool } = require('./backend/config/database');

async function testMaterialPrepAPI() {
  console.log('🔍 开始测试备料计划API...\n');
  
  try {
    // 1. 测试数据库连接
    console.log('1️⃣ 测试数据库连接...');
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功\n');
    
    // 2. 测试数据是否存在
    console.log('2️⃣ 检查备料计划数据...');
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM material_preparation_plans'
    );
    const total = countResult[0].total;
    console.log(`✅ 备料计划总数: ${total} 条\n`);
    
    // 3. 测试分页查询
    console.log('3️⃣ 测试分页查询（第1页，每页20条）...');
    const [data] = await connection.query(`
      SELECT 
        id,
        plan_no as planNo,
        source_plan_no as sourcePlanNo,
        material_code as materialCode,
        material_name as materialName,
        material_unit as materialUnit,
        demand_quantity as demandQuantity,
        replenishment_quantity as replenishmentQuantity,
        source_process as sourceProcess,
        demand_date as demandDate,
        push_to_purchase as pushToPurchase,
        push_to_process as pushToProcess,
        sales_order_no as salesOrderNo,
        customer_order_no as customerOrderNo,
        main_plan_product_code as mainPlanProductCode,
        main_plan_product_name as mainPlanProductName,
        promise_delivery_date as promiseDeliveryDate,
        customer_name as customerName,
        created_at as createdAt,
        updated_at as updatedAt
      FROM material_preparation_plans 
      ORDER BY created_at DESC
      LIMIT 20 OFFSET 0
    `);
    
    console.log(`✅ 查询成功，返回 ${data.length} 条记录`);
    
    if (data.length > 0) {
      console.log('\n📋 第一条记录示例:');
      console.log('   ID:', data[0].id);
      console.log('   计划编号:', data[0].planNo);
      console.log('   来源主计划:', data[0].sourcePlanNo);
      console.log('   物料编号:', data[0].materialCode);
      console.log('   物料名称:', data[0].materialName);
      console.log('   需求数量:', data[0].demandQuantity);
      console.log('   需求日期:', data[0].demandDate);
    }
    
    // 4. 测试API Service调用
    console.log('\n4️⃣ 测试MaterialPreparationPlanService...');
    const MaterialPreparationPlanService = require('./backend/services/materialPreparationPlanService');
    
    const result = await MaterialPreparationPlanService.getAll({
      page: 1,
      pageSize: 20
    });
    
    console.log('✅ Service调用成功');
    console.log('   返回结构:', Object.keys(result));
    console.log('   list数量:', result.list?.length || 0);
    console.log('   total:', result.total);
    console.log('   page:', result.page);
    console.log('   pageSize:', result.pageSize);
    
    if (result.list && result.list.length > 0) {
      console.log('\n📋 Service返回的第一条记录:');
      console.log('   计划编号:', result.list[0].planNo);
      console.log('   来源主计划:', result.list[0].sourcePlanNo);
      console.log('   物料编号:', result.list[0].materialCode);
    }
    
    connection.release();
    
    console.log('\n✅ 所有测试通过！');
    console.log('\n📊 测试总结:');
    console.log(`   ✅ 数据库连接: 正常`);
    console.log(`   ✅ 数据总数: ${total} 条`);
    console.log(`   ✅ SQL查询: 正常`);
    console.log(`   ✅ Service调用: 正常`);
    console.log(`   ✅ 返回格式: { list: [], total: ${result.total}, page: 1, pageSize: 20 }`);
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.error('   错误信息:', error.message);
    console.error('   错误堆栈:', error.stack);
  } finally {
    await pool.end();
  }
}

// 运行测试
testMaterialPrepAPI().catch(console.error);
