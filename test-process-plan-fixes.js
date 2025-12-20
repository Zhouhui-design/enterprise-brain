/**
 * 测试工序计划的定时工额和计划结束日期修复
 */

const PackingProcessPlanService = require('./backend/services/packingProcessPlanService');
const { pool } = require('./backend/config/database');

async function testProcessPlanFixes() {
  console.log('🧪 开始测试工序计划修复...\n');
  
  try {
    // 1. 准备测试数据：确保产品物料库中有测试物料
    console.log('📝 步骤1: 准备测试数据...');
    
    // 检查是否已有测试物料
    const testMaterialCode = 'TEST-MATERIAL-001';
    const [existingMaterials] = await pool.execute(
      'SELECT * FROM materials WHERE material_code = ?',
      [testMaterialCode]
    );
    
    if (existingMaterials.length === 0) {
      // 创建测试物料
      await pool.execute(`
        INSERT INTO materials (
          material_code, material_name, standard_time, base_unit
        ) VALUES (?, ?, ?, ?)
      `, [testMaterialCode, '测试物料', 6.00, '个']);
      console.log(`   ✅ 创建测试物料: ${testMaterialCode}, 定时工额=6.00`);
    } else {
      console.log(`   ✅ 测试物料已存在: ${testMaterialCode}, 定时工额=${existingMaterials[0].standard_time}`);
    }
    
    // 2. 测试创建打包工序计划
    console.log('\n📝 步骤2: 测试创建打包工序计划...');
    
    const testPlanData = {
      planNo: `TEST-PACK-${Date.now()}`,
      scheduleDate: new Date(),
      productCode: testMaterialCode,  // ✅ 关键：使用测试物料编号
      productName: '测试产品',
      processName: '打包',
      scheduleQuantity: 100,
      replenishmentQty: 100,
      productUnit: '个',
      sourcePageName: '测试',
      submittedBy: 'test-user'
    };
    
    console.log('   测试数据:', {
      productCode: testPlanData.productCode,
      scheduleQuantity: testPlanData.scheduleQuantity,
      replenishmentQty: testPlanData.replenishmentQty,
      processName: testPlanData.processName
    });
    
    const createResult = await PackingProcessPlanService.create(testPlanData);
    console.log(`\n   ✅ 打包工序计划创建成功, ID: ${createResult.id}`);
    
    // 3. 查询创建的记录，验证定时工额和计划结束日期
    console.log('\n📝 步骤3: 验证创建的记录...');
    
    const createdPlan = await PackingProcessPlanService.getById(createResult.id);
    
    console.log('\n   创建的工序计划详情:');
    console.log(`   - ID: ${createdPlan.id}`);
    console.log(`   - 计划编号: ${createdPlan.planNo}`);
    console.log(`   - 生产产品编号: ${createdPlan.productCode}`);
    console.log(`   - 定时工额: ${createdPlan.standardWorkQuota} (期望: 6.00)`);
    console.log(`   - 需补货数量: ${createdPlan.replenishmentQty || createdPlan.scheduleQuantity}`);
    console.log(`   - 需求工时: ${createdPlan.requiredWorkHours || '未设置'}`);
    console.log(`   - 排程日期: ${createdPlan.scheduleDate}`);
    console.log(`   - 计划开始日期: ${createdPlan.planStartDate || '未设置'}`);
    console.log(`   - 计划结束日期: ${createdPlan.planEndDate || '未设置'}`);
    
    // 4. 验证结果
    console.log('\n📊 验证结果:');
    
    const expectedQuota = 6.00;
    const actualQuota = parseFloat(createdPlan.standardWorkQuota || 0);
    
    if (Math.abs(actualQuota - expectedQuota) < 0.01) {
      console.log(`   ✅ 定时工额验证通过: ${actualQuota} ≈ ${expectedQuota}`);
    } else {
      console.log(`   ❌ 定时工额验证失败: ${actualQuota} ≠ ${expectedQuota}`);
    }
    
    if (createdPlan.planEndDate) {
      console.log(`   ✅ 计划结束日期已设置: ${createdPlan.planEndDate}`);
    } else {
      console.log(`   ⚠️ 计划结束日期未设置 (可能是工序能力负荷表未配置)`);
    }
    
    // 5. 清理测试数据
    console.log('\n📝 步骤4: 清理测试数据...');
    
    await pool.execute('DELETE FROM packing_process_plans WHERE id = ?', [createResult.id]);
    console.log(`   ✅ 已删除测试工序计划: ${createResult.id}`);
    
    console.log('\n✅ 测试完成！\n');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// 运行测试
testProcessPlanFixes();
