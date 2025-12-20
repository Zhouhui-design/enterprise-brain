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
  
  console.log('🔍 检查打包工序计划数据:\n');
  
  const [rows] = await pool.execute(
    'SELECT id, plan_no, product_code, product_name, standard_work_quota, replenishment_qty FROM packing_process_plans'
  );
  
  console.log('打包工序计划记录:');
  rows.forEach(row => {
    console.log(`  ID: ${row.id}`);
    console.log(`  计划编号: ${row.plan_no}`);
    console.log(`  产品编号: ${row.product_code || '空'}`);
    console.log(`  产品名称: ${row.product_name || '空'}`);
    console.log(`  定时工额: ${row.standard_work_quota}`);
    console.log(`  需补货数量: ${row.replenishment_qty}`);
    console.log('---');
  });
  
  console.log('\n🔍 检查物料库中的定时工额:');
  const [materials] = await pool.execute(
    "SELECT material_code, material_name, standard_time FROM materials WHERE material_code = '6001A0306'"
  );
  
  if (materials.length > 0) {
    console.log('物料库记录:');
    materials.forEach(mat => {
      console.log(`  物料编号: ${mat.material_code}`);
      console.log(`  物料名称: ${mat.material_name}`);
      console.log(`  定时工额(standard_time): ${mat.standard_time}`);
    });
  } else {
    console.log('❌ 未找到物料编号 6001A0306');
  }
  
  await pool.end();
})();
