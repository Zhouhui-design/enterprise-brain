const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain',
  charset: 'utf8mb4'
};

async function testExecuteSchedule() {
  console.log('🧪 开始测试主生产计划执行排程功能...\n');
  
  let connection;
  try {
    // 1. 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');

    // 2. 查询现有主生产计划
    const [planRows] = await connection.execute(
      'SELECT id, plan_code, product_code, product_name, plan_quantity FROM master_production_plans LIMIT 3'
    );
    
    if (planRows.length === 0) {
      console.log('❌ 未找到主生产计划，请先创建一些主生产计划');
      return;
    }
    
    console.log('📋 找到以下主生产计划:');
    planRows.forEach((plan, index) => {
      console.log(`   ${index + 1}. ID: ${plan.id}, 编号: ${plan.plan_code}, 产品: ${plan.product_code} - ${plan.product_name}, 数量: ${plan.plan_quantity}`);
    });
    
    // 3. 选择第一个计划进行测试
    const testPlan = planRows[0];
    console.log(`\n🎯 选择计划进行测试: ${testPlan.plan_code}`);
    
    // 4. 清理之前的测试数据（避免重复）
    console.log('🧹 清理之前的测试数据...');
    await connection.execute('DELETE FROM material_preparation_plans WHERE source_plan_no = ?', [testPlan.plan_code]);
    await connection.execute('DELETE FROM real_process_plans WHERE master_plan_no = ?', [testPlan.plan_code]);
    
    // 5. 模拟执行排程API调用
    console.log('\n🚀 模拟执行排程API调用...');
    
    try {
      // 直接调用后端服务逻辑
      const MaterialPreparationPlanService = require('./backend/services/materialPreparationPlanService');
      
      // 模拟API数据
      const materialPlanNo = `MPP${new Date().getFullYear()}${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      // 推断物料来源
      let materialSource = testPlan.product_source;
      if (!materialSource || materialSource === '/') {
        materialSource = (testPlan.output_process === '采购') ? '外购' : '自制';
      }
      
      const materialPlanData = {
        planNo: materialPlanNo,
        sourcePlanNo: testPlan.plan_code,
        sourceProcessPlanNo: '/',
        sourceProcess: testPlan.output_process,
        materialCode: testPlan.product_code,
        materialName: testPlan.product_name,
        materialSource: materialSource,
        materialUnit: testPlan.sales_unit || '个',
        demandQuantity: testPlan.plan_quantity,
        demandDate: testPlan.planned_storage_date,
        salesOrderNo: testPlan.internal_order_no,
        customerOrderNo: testPlan.customer_order_no,
        mainPlanProductCode: testPlan.product_code,
        mainPlanProductName: testPlan.product_name,
        mainPlanQuantity: testPlan.plan_quantity,
        promiseDeliveryDate: testPlan.promised_delivery_date,
        customerName: testPlan.customer_name,
        submitter: testPlan.submitter || 'admin'
      };
      
      // 数据验证
      if (!materialPlanData.materialCode || !materialPlanData.materialName) {
        throw new Error(`产品信息不完整: materialCode=${materialPlanData.materialCode}, materialName=${materialPlanData.materialName}`);
      }
      
      console.log('✅ 开始创建备料计划，数据验证通过');
      const result = await MaterialPreparationPlanService.create(materialPlanData);
      
      console.log('✅ 执行排程成功');
      console.log('备料计划ID:', result.id);
      console.log('工序计划编号:', result.processPlanNo);
      
      // 6. 验证数据库中的结果
      console.log('\n🔍 验证数据库结果...');
      
      const [materialPlans] = await connection.execute(
        'SELECT * FROM material_preparation_plans WHERE source_plan_no = ?',
        [testPlan.plan_code]
      );
      
      console.log(`✅ 生成备料计划: ${materialPlans.length} 条`);
      materialPlans.forEach(plan => {
        console.log(`   - 编号: ${plan.plan_no}, 物料: ${plan.material_code}, 数量: ${plan.demand_quantity}`);
      });
      
      const [processPlans] = await connection.execute(
        'SELECT * FROM real_process_plans WHERE master_plan_no = ?',
        [testPlan.plan_code]
      );
      
      console.log(`✅ 生成真工序计划: ${processPlans.length} 条`);
      processPlans.forEach(plan => {
        console.log(`   - 编号: ${plan.plan_no}, 工序: ${plan.process_name}, 数量: ${plan.schedule_quantity}`);
      });
      
      console.log('\n🎉 测试完成！功能正常工作');
      
    } catch (apiError) {
      console.error('❌ API调用失败:', apiError.message);
      if (apiError.response) {
        console.error('响应状态:', apiError.response.status);
        console.error('响应数据:', apiError.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行测试
testExecuteSchedule();