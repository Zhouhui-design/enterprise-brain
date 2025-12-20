const { pool } = require('./backend/config/database');

async function debugCreate() {
  try {
    console.log('========================================');
    console.log('🔍 测试创建工序计划时的字段映射');
    console.log('========================================\n');

    // 模拟前端传递的数据（驼峰命名）
    const frontendData = {
      planNo: 'TEST001',
      productCode: '6001A0306',
      productName: '测试产品',
      replenishmentQty: 100,
      standardWorkQuota: undefined,  // 前端未传递
      processName: '打包'
    };

    console.log('📤 前端传递的数据(驼峰命名):');
    console.log(JSON.stringify(frontendData, null, 2));
    console.log('\n');

    // 后端接收时的处理
    console.log('🔍 后端接收后:');
    console.log('data.productCode:', frontendData.productCode);
    console.log('data.standardWorkQuota:', frontendData.standardWorkQuota);
    console.log('data.standardWorkQuota || 0:', frontendData.standardWorkQuota || 0);
    console.log('\n');

    // 查询物料库
    console.log('🔍 查询物料库:');
    const [materialRows] = await pool.execute(
      'SELECT standard_time FROM materials WHERE material_code = ?',
      [frontendData.productCode]
    );
    
    if (materialRows.length > 0) {
      console.log('✅ 查询结果:', materialRows[0]);
      console.log('✅ standard_time:', materialRows[0].standard_time);
      console.log('✅ parseFloat:', parseFloat(materialRows[0].standard_time));
    } else {
      console.log('❌ 未找到物料');
    }

    console.log('\n========================================');
    await pool.end();
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

debugCreate();
