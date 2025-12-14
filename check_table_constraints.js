const mysql = require('mysql2/promise');

async function checkTableConstraints() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'zH754277289hUi~197547',
    database: 'enterprise_brain'
  });

  try {
    console.log('检查表约束...');
    
    // 检查表结构详细信息
    const [rows] = await connection.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'enterprise_brain' 
      AND TABLE_NAME = 'material_preparation_plans'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('列详细信息:');
    rows.forEach((row, index) => {
      console.log(`${index + 1}: ${row.COLUMN_NAME} - ${row.DATA_TYPE} - NULL: ${row.IS_NULLABLE} - KEY: ${row.COLUMN_KEY}`);
    });
    
    // 检查约束
    const [constraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        CONSTRAINT_TYPE
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = 'enterprise_brain' 
      AND TABLE_NAME = 'material_preparation_plans'
    `);
    
    console.log('\n表约束:');
    constraints.forEach(constraint => {
      console.log(`${constraint.CONSTRAINT_NAME}: ${constraint.CONSTRAINT_TYPE}`);
    });
    
    // 尝试最简单的插入，只插入必需字段
    console.log('\n尝试最简单的插入...');
    const simpleSQL = `
      INSERT INTO material_preparation_plans (
        plan_no, material_code, material_name
      ) VALUES (?, ?, ?)
    `;
    
    const [result] = await connection.execute(simpleSQL, ['TEST005', 'MAT001', 'Test Material']);
    console.log('简单插入成功:', result.insertId);
    
  } catch (error) {
    console.error('错误:', error.message);
    console.error('SQL状态:', error.sqlState);
  } finally {
    await connection.end();
  }
}

checkTableConstraints();