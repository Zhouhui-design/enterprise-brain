/**
 * 验证备料计划数据库数据
 */

const { pool } = require('./backend/config/database');

async function verifyMaterialPrepData() {
  console.log('🔍 开始验证备料计划数据...\n');
  
  let connection;
  try {
    connection = await pool.getConnection();
    
    // 1. 查询总数
    console.log('1️⃣ 查询备料计划总数...');
    const [countResult] = await connection.query(
      'SELECT COUNT(*) as total FROM material_preparation_plans'
    );
    const total = countResult[0].total;
    console.log(`   ✅ 总数: ${total} 条\n`);
    
    // 2. 查询最新的10条记录
    console.log('2️⃣ 查询最新的10条备料计划...');
    const [recentPlans] = await connection.query(`
      SELECT 
        id,
        plan_no,
        source_plan_no,
        material_code,
        material_name,
        demand_quantity,
        available_stock,
        replenishment_quantity,
        demand_date,
        created_at
      FROM material_preparation_plans
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`   ✅ 查询到 ${recentPlans.length} 条记录:\n`);
    
    recentPlans.forEach((plan, index) => {
      console.log(`   📋 记录 ${index + 1}:`);
      console.log(`      ID: ${plan.id}`);
      console.log(`      计划编号: ${plan.plan_no}`);
      console.log(`      来源主计划: ${plan.source_plan_no}`);
      console.log(`      物料编号: ${plan.material_code}`);
      console.log(`      物料名称: ${plan.material_name}`);
      console.log(`      需求数量: ${plan.demand_quantity}`);
      console.log(`      有效库存: ${plan.available_stock}`);
      console.log(`      需补货数量: ${plan.replenishment_quantity}`);
      console.log(`      需求日期: ${plan.demand_date}`);
      console.log(`      创建时间: ${plan.created_at}`);
      console.log('');
    });
    
    // 3. 按来源主计划分组统计
    console.log('3️⃣ 按来源主计划分组统计...');
    const [groupResult] = await connection.query(`
      SELECT 
        source_plan_no,
        COUNT(*) as count,
        MAX(created_at) as latest_created
      FROM material_preparation_plans
      WHERE source_plan_no IS NOT NULL
      GROUP BY source_plan_no
      ORDER BY latest_created DESC
      LIMIT 5
    `);
    
    console.log('   ✅ 来源主计划分组统计:\n');
    groupResult.forEach((group, index) => {
      console.log(`   ${index + 1}. 主计划: ${group.source_plan_no}`);
      console.log(`      备料计划数量: ${group.count}`);
      console.log(`      最新创建时间: ${group.latest_created}`);
      console.log('');
    });
    
    // 4. 检查是否有今天创建的数据
    console.log('4️⃣ 检查今天创建的备料计划...');
    const [todayPlans] = await connection.query(`
      SELECT COUNT(*) as count
      FROM material_preparation_plans
      WHERE DATE(created_at) = CURDATE()
    `);
    
    console.log(`   ✅ 今天创建的备料计划: ${todayPlans[0].count} 条\n`);
    
    // 5. 测试API返回格式
    console.log('5️⃣ 测试Service调用...');
    const MaterialPreparationPlanService = require('./backend/services/materialPreparationPlanService');
    
    const result = await MaterialPreparationPlanService.getAll({
      page: 1,
      pageSize: 20
    });
    
    console.log('   ✅ Service返回结构:');
    console.log('      返回字段:', Object.keys(result));
    console.log('      list是否存在:', !!result.list);
    console.log('      list数量:', result.list?.length || 0);
    console.log('      total:', result.total);
    console.log('      page:', result.page);
    console.log('      pageSize:', result.pageSize);
    
    if (result.list && result.list.length > 0) {
      console.log('\n   📋 Service返回的第一条记录字段:');
      console.log('      ', Object.keys(result.list[0]).join(', '));
    }
    
    console.log('\n✅ 验证完成！');
    console.log('\n📊 总结:');
    console.log(`   数据库总数: ${total} 条`);
    console.log(`   今天新增: ${todayPlans[0].count} 条`);
    console.log(`   Service返回: ${result.total} 条`);
    console.log(`   数据一致性: ${total === result.total ? '✅ 正常' : '❌ 不一致'}`);
    
  } catch (error) {
    console.error('\n❌ 验证失败:', error);
    console.error('   错误信息:', error.message);
    console.error('   错误堆栈:', error.stack);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

// 运行验证
verifyMaterialPrepData().catch(console.error);
