/**
 * 测试真工序计划推送到备料计划的日期格式
 */

const { pool } = require('./config/database');

async function testDateFormat() {
  const connection = await pool.getConnection();

  try {
    console.log('\n=== 测试日期格式 ===\n');

    // 1. 清理测试数据
    await connection.execute(`DELETE FROM real_process_plans WHERE master_plan_no LIKE 'TEST-DATE%'`);
    await connection.execute(`DELETE FROM material_preparation_plans WHERE source_plan_no LIKE 'TEST-DATE%'`);
    await connection.execute(`DELETE FROM master_production_plans WHERE plan_code LIKE 'TEST-DATE%'`);

    // 2. 创建主生产计划
    const masterPlanNo = `TEST-DATE-${Date.now()}`;
    await connection.execute(
      `
      INSERT INTO master_production_plans (
        plan_code, product_code, product_name, order_quantity,
        plan_quantity, output_process, promised_delivery_date,
        planned_storage_date, internal_order_no, customer_order_no,
        customer_name, salesperson, submitter, submit_time, status
      ) VALUES (?, ?, ?, ?, ?, ?, '2026-01-10', '2026-01-08', 'TEST-SO-001', 'TEST-CUS-001', '测试客户', 'admin', 'admin', NOW(), '已下单')
    `,
      [masterPlanNo, '6001A0306', '6001A0306，铁质方向盘款，嘉博', 50, 50, '打包'],
    );
    console.log(`✅ 创建主生产计划: ${masterPlanNo}\n`);

    // 3. 创建备料计划（物料来源=自制，触发推送到真工序计划）
    const MaterialPreparationPlanService = require('./services/materialPreparationPlanService');
    const materialPlanNo = `TEST-DATE-MPP-${Date.now()}`;

    const materialPlanData = {
      planNo: materialPlanNo,
      sourcePlanNo: masterPlanNo,
      sourceProcessPlanNo: '/',
      sourceProcess: '打包',
      materialCode: '6001A0306',
      materialName: '6001A0306，铁质方向盘款，嘉博',
      materialSource: '自制',
      materialUnit: '台',
      demandQuantity: 50,
      demandDate: '2026-01-08',
      salesOrderNo: 'TEST-SO-001',
      customerOrderNo: 'TEST-CUS-001',
      mainPlanProductCode: '6001A0306',
      mainPlanProductName: '6001A0306，铁质方向盘款，嘉博',
      mainPlanQuantity: 50,
      promiseDeliveryDate: '2026-01-10',
      customerName: '测试客户',
      submitter: 'admin',
    };

    await MaterialPreparationPlanService.create(materialPlanData);
    console.log(`✅ 创建备料计划: ${materialPlanNo}\n`);

    // 等待自动推送完成
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. 查询真工序计划的计划排程日期
    const [realPlans] = await connection.execute(
      `
      SELECT id, plan_no, schedule_date, product_code
      FROM real_process_plans 
      WHERE master_plan_no = ?
      LIMIT 1
    `,
      [masterPlanNo],
    );

    if (realPlans.length > 0) {
      const realPlan = realPlans[0];
      console.log('📊 真工序计划数据:');
      console.log(`   ID: ${realPlan.id}`);
      console.log(`   编号: ${realPlan.plan_no}`);
      console.log(`   产品编号: ${realPlan.product_code}`);
      console.log(`   计划排程日期 (schedule_date): ${realPlan.schedule_date}`);

      // 格式化为 YYYY-MM-DD
      let formattedDate = null;
      if (realPlan.schedule_date) {
        const dateObj =
          realPlan.schedule_date instanceof Date ? realPlan.schedule_date : new Date(realPlan.schedule_date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }
      console.log(`   格式化后: ${formattedDate}\n`);

      // 5. 查询推送到备料计划的工序计划排程日期
      const [materialPlans] = await connection.execute(
        `
        SELECT id, plan_no, material_code, material_name, 
               process_schedule_date, parent_code
        FROM material_preparation_plans
        WHERE source_process_plan_no = ?
        ORDER BY created_at DESC
      `,
        [realPlan.plan_no],
      );

      console.log(`📊 从真工序计划推送的备料计划数量: ${materialPlans.length}`);

      if (materialPlans.length > 0) {
        console.log('\n备料计划详情:');
        materialPlans.forEach((plan, index) => {
          console.log(`\n  ${index + 1}. ${plan.plan_no}`);
          console.log(`     物料: ${plan.material_code} - ${plan.material_name}`);
          console.log(`     父件: ${plan.parent_code}`);
          console.log(`     工序计划排程日期 (process_schedule_date): ${plan.process_schedule_date}`);

          // 格式化为 YYYY-MM-DD
          let materialFormattedDate = null;
          if (plan.process_schedule_date) {
            const dateObj =
              plan.process_schedule_date instanceof Date
                ? plan.process_schedule_date
                : new Date(plan.process_schedule_date);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            materialFormattedDate = `${year}-${month}-${day}`;
          }
          console.log(`     格式化后: ${materialFormattedDate}`);

          // 对比日期
          if (formattedDate === materialFormattedDate) {
            console.log(`     ✅ 日期匹配！`);
          } else {
            console.log(`     ❌ 日期不匹配！真工序计划=${formattedDate}, 备料计划=${materialFormattedDate}`);
          }
        });
      } else {
        console.log('❌ 未找到从真工序计划推送的备料计划');
      }
    } else {
      console.log('❌ 未找到真工序计划');
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

testDateFormat();
