const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain',
  charset: 'utf8mb4'
};

(async () => {
  const pool = mysql.createPool(dbConfig);
  
  console.log('========================================');
  console.log('🧪 打包工序定时工额Lookup验证');
  console.log('========================================\n');
  
  // 1. 查看现有记录
  console.log('1️⃣  查看现有打包工序计划:');
  const [existing] = await pool.execute(
    'SELECT id, plan_no, product_code, standard_work_quota, created_at FROM packing_process_plans ORDER BY id DESC LIMIT 5'
  );
  existing.forEach(row => {
    console.log(`   ID: ${row.id}, 计划: ${row.plan_no}, 产品: ${row.product_code || '空'}, 定时工额: ${row.standard_work_quota}`);
  });
  
  // 2. 删除测试记录（id=12）
  console.log('\n2️⃣  删除旧测试记录 (id=12):');
  const [deleteResult] = await pool.execute('DELETE FROM packing_process_plans WHERE id = 12');
  console.log(`   已删除 ${deleteResult.affectedRows} 条记录`);
  
  // 3. 模拟后端create逻辑手动创建记录
  console.log('\n3️⃣  模拟后端create流程:');
  const testData = {
    productCode: '6001A0306',
    productName: '6001A0306，铁质方向盘款，嘉博',
    replenishmentQty: 183,
    planNo: 'TEST' + Date.now()
  };
  
  console.log(`   生产产品编号: ${testData.productCode}`);
  
  // 执行lookup
  console.log('\n   🔍 执行定时工额Lookup...');
  const [materialRows] = await pool.execute(
    'SELECT standard_time FROM materials WHERE material_code = ?',
    [testData.productCode]
  );
  
  let standardWorkQuota = 0;
  if (materialRows.length > 0 && materialRows[0].standard_time) {
    standardWorkQuota = parseFloat(materialRows[0].standard_time);
    console.log(`   ✅ 查询成功: standard_time = ${standardWorkQuota}`);
  } else {
    console.log(`   ❌ 未找到物料`);
  }
  
  // 插入数据
  console.log('\n   💾 插入新记录...');
  const [insertResult] = await pool.execute(
    `INSERT INTO packing_process_plans (
      plan_no, product_code, product_name, replenishment_qty, standard_work_quota, 
      process_name, submitted_by, submitted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      testData.planNo,
      testData.productCode,
      testData.productName,
      testData.replenishmentQty,
      standardWorkQuota,  // 这里使用lookup的值
      '打包',
      'admin'
    ]
  );
  
  console.log(`   ✅ 插入成功, 新ID: ${insertResult.insertId}`);
  
  // 4. 验证结果
  console.log('\n4️⃣  验证新插入的记录:');
  const [newRow] = await pool.execute(
    'SELECT id, plan_no, product_code, standard_work_quota FROM packing_process_plans WHERE id = ?',
    [insertResult.insertId]
  );
  
  if (newRow.length > 0) {
    const row = newRow[0];
    console.log(`   ID: ${row.id}`);
    console.log(`   计划编号: ${row.plan_no}`);
    console.log(`   产品编号: ${row.product_code}`);
    console.log(`   定时工额: ${row.standard_work_quota}`);
    
    if (parseFloat(row.standard_work_quota) === 6.00) {
      console.log('\n   ✅ ✅ ✅  验证通过！定时工额 = 6.00');
    } else {
      console.log(`\n   ❌ ❌ ❌  验证失败！期望6.00, 实际${row.standard_work_quota}`);
    }
  }
  
  console.log('\n========================================');
  console.log('✅ 测试完成');
  console.log('========================================');
  
  await pool.end();
})();
