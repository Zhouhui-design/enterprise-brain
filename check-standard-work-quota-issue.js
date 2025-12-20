/**
 * 检查定时工额问题
 * 1. 验证数据库中materials表的standard_time字段值
 * 2. 验证packing_process_plans表的standard_work_quota字段值
 * 3. 验证前端是否正确显示
 */

const { pool } = require('./backend/config/database');

async function checkStandardWorkQuotaIssue() {
  try {
    console.log('========================================');
    console.log('🔍 开始检查定时工额问题');
    console.log('========================================\n');

    // 1. 检查产品物料库的定时工额
    console.log('📊 步骤1: 检查产品物料库（materials表）的定时工额');
    console.log('----------------------------------------');
    const [materials] = await pool.execute(`
      SELECT material_code, material_name, standard_time 
      FROM materials 
      LIMIT 10
    `);
    
    console.log(`找到 ${materials.length} 条物料记录：`);
    materials.forEach((m, index) => {
      console.log(`  ${index + 1}. 物料编号: ${m.material_code}, 物料名称: ${m.material_name}, 定时工额: ${m.standard_time}`);
    });
    console.log('');

    // 2. 检查打包工序计划的定时工额
    console.log('📊 步骤2: 检查打包工序计划表（packing_process_plans）的定时工额');
    console.log('----------------------------------------');
    const [packingPlans] = await pool.execute(`
      SELECT id, product_code, product_name, standard_work_quota, created_at 
      FROM packing_process_plans 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log(`找到 ${packingPlans.length} 条打包工序计划：`);
    packingPlans.forEach((p, index) => {
      console.log(`  ${index + 1}. ID: ${p.id}, 产品编号: ${p.product_code}, 产品名称: ${p.product_name}, 定时工额: ${p.standard_work_quota}, 创建时间: ${p.created_at}`);
    });
    console.log('');

    // 3. 测试lookup逻辑
    console.log('📊 步骤3: 测试定时工额lookup逻辑');
    console.log('----------------------------------------');
    
    if (packingPlans.length > 0) {
      const testProductCode = packingPlans[0].product_code;
      console.log(`测试产品编号: ${testProductCode}`);
      
      const [lookupResult] = await pool.execute(
        'SELECT standard_time FROM materials WHERE material_code = ?',
        [testProductCode]
      );
      
      if (lookupResult.length > 0) {
        console.log(`✅ Lookup成功！物料库中找到定时工额: ${lookupResult[0].standard_time}`);
        console.log(`❌ 但工序计划中的定时工额是: ${packingPlans[0].standard_work_quota}`);
        
        if (parseFloat(lookupResult[0].standard_time) !== parseFloat(packingPlans[0].standard_work_quota)) {
          console.log(`⚠️ 发现不一致！应该是 ${lookupResult[0].standard_time}，但实际是 ${packingPlans[0].standard_work_quota}`);
        }
      } else {
        console.log(`❌ Lookup失败！物料库中没有找到物料编号: ${testProductCode}`);
      }
    }
    console.log('');

    // 4. 检查后端服务代码是否有lookup逻辑
    console.log('📊 步骤4: 验证后端服务代码');
    console.log('----------------------------------------');
    const fs = require('fs');
    const serviceFile = './backend/services/packingProcessPlanService.js';
    const serviceCode = fs.readFileSync(serviceFile, 'utf-8');
    
    if (serviceCode.includes('定时工额Lookup') || serviceCode.includes('standard_time FROM materials')) {
      console.log('✅ 后端服务包含定时工额lookup逻辑');
    } else {
      console.log('❌ 后端服务缺少定时工额lookup逻辑！');
    }
    console.log('');

    console.log('========================================');
    console.log('✅ 检查完成');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 检查过程中出错:', error);
  } finally {
    await pool.end();
  }
}

checkStandardWorkQuotaIssue();
