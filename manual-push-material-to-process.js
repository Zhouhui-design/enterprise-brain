/**
 * 手动推送备料计划到真工序计划
 * 为满足条件的备料计划手动触发推送
 */

const mysql = require('mysql2/promise');
const path = require('path');

async function manualPushMaterialToProcess() {
  let connection;
  
  try {
    console.log('🔍 开始查询满足推送条件的备料计划...\n');

    // 连接数据库
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'enterprise_brain',
      charset: 'utf8mb4'
    });

    // 查询满足推送条件的备料计划
    const [plans] = await connection.execute(`
      SELECT 
        id, plan_no, material_code, material_name, material_source,
        demand_quantity, available_stock, replenishment_quantity,
        source_process, demand_date
      FROM material_preparation_plans 
      WHERE material_source = '自制' 
        AND (CAST(demand_quantity AS DECIMAL(15,4)) - CAST(available_stock AS DECIMAL(15,4))) > 0
        AND plan_no NOT IN (
          SELECT DISTINCT source_process_plan_no 
          FROM real_process_plans 
          WHERE source_process_plan_no IS NOT NULL
        )
      ORDER BY created_at DESC
    `);

    console.log(`📊 找到 ${plans.length} 条满足推送条件的备料计划:\n`);

    if (plans.length === 0) {
      console.log('✅ 没有需要推送的备料计划');
      return;
    }

    // 显示满足条件的计划
    plans.forEach((plan, index) => {
      const demandQty = parseFloat(plan.demand_quantity || 0);
      const availableQty = parseFloat(plan.available_stock || 0);
      const replenishmentQty = demandQty - availableQty;
      
      console.log(`${index + 1}. 计划编号: ${plan.plan_no}`);
      console.log(`   物料编号: ${plan.material_code}`);
      console.log(`   物料名称: ${plan.material_name}`);
      console.log(`   物料来源: ${plan.material_source}`);
      console.log(`   需求数量: ${demandQty}`);
      console.log(`   有效库存: ${availableQty}`);
      console.log(`   需补货数量: ${replenishmentQty.toFixed(2)}`);
      console.log(`   来源工序: ${plan.source_process}`);
      console.log(`   需求日期: ${plan.demand_date}`);
      console.log('');
    });

    // 逐个推送
    for (const plan of plans) {
      console.log(`🚀 开始推送计划: ${plan.plan_no}`);
      
      try {
        const response = await fetch(`http://localhost:3005/api/material-preparation-plans/${plan.id}/push-to-process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();
        
        if (response.ok && result.code === 200) {
          console.log(`✅ 推送成功: ${plan.plan_no}`);
          if (result.data && result.data.realProcessPlanNo) {
            console.log(`   生成真工序计划: ${result.data.realProcessPlanNo}`);
          }
        } else {
          console.log(`❌ 推送失败: ${plan.plan_no}`);
          console.log(`   错误信息: ${result.message || '未知错误'}`);
        }
      } catch (error) {
        console.log(`❌ 推送异常: ${plan.plan_no}`);
        console.log(`   异常信息: ${error.message}`);
      }
      
      console.log('');
    }

    // 验证推送结果
    console.log('🔍 验证推送结果...');
    const [realPlans] = await connection.execute(`
      SELECT plan_no, material_code, material_name, source_process_plan_no, schedule_quantity
      FROM real_process_plans 
      WHERE source_process_plan_no IN (
        SELECT plan_no FROM material_preparation_plans WHERE material_source = '自制'
      )
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`📋 当前真工序计划中的推送记录 (${realPlans.length} 条):`);
    realPlans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.plan_no} - ${plan.material_code} - ${plan.material_name} (来源: ${plan.source_process_plan_no})`);
    });

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 检查是否直接运行此文件
if (require.main === module) {
  manualPushMaterialToProcess();
}

module.exports = { manualPushMaterialToProcess };