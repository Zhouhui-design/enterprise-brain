const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'zH754277289hUi~197547',
  database: 'enterprise_brain',
  connectionLimit: 10
});

async function checkFields() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n========================================');
    console.log('📊 检查工序计划表字段');
    console.log('========================================\n');

    // 要检查的表
    const tables = [
      'real_process_plans',      // 打包工序计划（原真工序计划）
      'packing_process_plans',   // 喷塑工序计划（原打包工序计划）
      'assembly_process_plans',  // 组装工序计划
      'sewing_process_plans'     // 缝纫工序计划
    ];

    // 要查找的字段
    const targetFields = [
      'master_plan_product_code',  // 主计划产品编号
      'master_plan_product_name'   // 主计划产品名称
    ];

    for (const tableName of tables) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📋 表名: ${tableName}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // 查询表结构
      const [columns] = await connection.execute(
        `SHOW COLUMNS FROM ${tableName}`
      );

      // 检查目标字段
      const foundFields = [];
      const missingFields = [];

      for (const field of targetFields) {
        const exists = columns.find(col => col.Field === field);
        if (exists) {
          foundFields.push({
            field: field,
            type: exists.Type,
            null: exists.Null,
            default: exists.Default
          });
        } else {
          missingFields.push(field);
        }
      }

      // 输出结果
      if (foundFields.length > 0) {
        console.log('✅ 已存在的字段：');
        foundFields.forEach(f => {
          console.log(`   • ${f.field}`);
          console.log(`     类型: ${f.type}`);
          console.log(`     允许NULL: ${f.null}`);
          console.log(`     默认值: ${f.default || '无'}`);
          console.log('');
        });
      }

      if (missingFields.length > 0) {
        console.log('❌ 缺失的字段：');
        missingFields.forEach(f => {
          console.log(`   • ${f}`);
        });
        console.log('');
      }

      // 查询表中是否有数据
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM ${tableName}`
      );
      console.log(`📊 数据记录数: ${countResult[0].total}`);
    }

    console.log('\n========================================');
    console.log('🎯 检查完成');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

checkFields();
