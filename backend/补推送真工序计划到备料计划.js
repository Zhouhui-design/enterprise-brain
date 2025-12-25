/**
 * 补推送已存在的真工序计划到备料计划
 */
const { pool } = require('./config/database');
const realProcessPlanToMaterialService = require('./services/realProcessPlanToMaterialService');

async function backfillPushToMaterial() {
  try {
    // 查询所有满足条件的真工序计划（格式化日期字段）
    const [plans] = await pool.execute(`
      SELECT 
        id, plan_no, schedule_date, DATE_FORMAT(schedule_date, '%Y-%m-%d') as schedule_date_formatted,
        sales_order_no, customer_order_no, master_plan_no, main_plan_product_code,
        main_plan_product_name, shipping_plan_no, product_code, product_name,
        product_image, process_manager, process_name, schedule_quantity,
        product_unit, level0_demand, completion_date, promise_delivery_date,
        DATE_FORMAT(plan_start_date, '%Y-%m-%d') as plan_start_date,
        DATE_FORMAT(real_plan_start_date, '%Y-%m-%d') as real_plan_start_date,
        DATE_FORMAT(plan_end_date, '%Y-%m-%d') as plan_end_date,
        workshop_name, daily_available_hours, remaining_required_hours, schedule_count,
        standard_work_hours, standard_work_quota, cumulative_schedule_qty,
        unscheduled_qty, source_page_name, source_no, previous_schedule_no,
        customer_name, level0_product_name, level0_product_code,
        level0_production_qty, product_source, bom_no, submitted_by,
        submitted_at, replenishment_qty, required_work_hours,
        daily_total_hours, daily_scheduled_hours, scheduled_work_hours,
        DATE_FORMAT(next_schedule_date, '%Y-%m-%d') as next_schedule_date,
        created_at, updated_at
      FROM real_process_plans
      WHERE schedule_quantity > 0
      ORDER BY created_at ASC
    `);

    console.log(`\n📊 找到 ${plans.length} 条满足推送条件的真工序计划\n`);

    let successCount = 0;
    let failCount = 0;

    for (const plan of plans) {
      try {
        // ✅ 使用格式化后的日期
        const planData = {
          ...plan,
          schedule_date: plan.schedule_date_formatted, // 使用YYYY-MM-DD格式
        };

        console.log(`\n处理: ${plan.plan_no} (${plan.product_name}), 排程数量: ${plan.schedule_quantity}`);

        // 检查是否已推送过（避免重复）
        const [existing] = await pool.execute(
          `
          SELECT COUNT(*) as count
          FROM material_preparation_plans
          WHERE source_process_plan_no = ?
        `,
          [plan.plan_no],
        );

        if (existing[0].count > 0) {
          console.log(`  ⏭️  已推送过，跳过 (已有${existing[0].count}条备料计划)`);
          continue;
        }

        // 加载工序间隔设置（从localStorage，这里返回空数组）
        const processIntervalSettings = [];

        // 执行推送（✅ 使用格式化后的数据）
        const result = await realProcessPlanToMaterialService.pushToMaterialPreparation(
          planData,
          processIntervalSettings,
        );

        if (result.code === 200) {
          console.log(`  ✅ 推送成功: 生成${result.data.count}条备料计划`);
          successCount++;
        } else {
          console.log(`  ⚠️  推送失败: ${result.message}`);
          failCount++;
        }
      } catch (error) {
        console.error(`  ❌ 推送失败: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n\n=== 补推送完成 ===`);
    console.log(`✅ 成功: ${successCount} 条`);
    console.log(`❌ 失败: ${failCount} 条`);
    console.log(`⏭️  跳过: ${plans.length - successCount - failCount} 条`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 补推送失败:', error);
    await pool.end();
    process.exit(1);
  }
}

backfillPushToMaterial();
