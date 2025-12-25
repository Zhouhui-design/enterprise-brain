const { pool } = require('../config/database');

console.log('=== 开始向 sales_orders 表添加产品字段 ===');

async function addProductFields() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    console.log('📋 检查并添加产品字段...');
    
    // 定义要添加的产品字段
    const productFields = [
      { name: 'product_code', type: 'VARCHAR(100)', comment: '产品编码' },
      { name: 'product_name', type: 'VARCHAR(200)', comment: '产品名称' },
      { name: 'product_spec', type: 'VARCHAR(200)', comment: '产品规格' },
      { name: 'product_color', type: 'VARCHAR(100)', comment: '产品颜色' },
      { name: 'product_unit', type: 'VARCHAR(50)', comment: '产品单位', default: "'个'" },
      { name: 'order_quantity', type: 'DECIMAL(10,2)', comment: '订单数量', default: '0' },
      { name: 'unit_price_excluding_tax', type: 'DECIMAL(10,2)', comment: '不含税单价', default: '0' },
      { name: 'product_tax_rate', type: 'DECIMAL(5,2)', comment: '产品税率', default: '13' },
      { name: 'accessories', type: 'TEXT', comment: '配件信息' },
      { name: 'output_process', type: 'VARCHAR(200)', comment: '产出工序' },
      { name: 'product_source', type: 'VARCHAR(100)', comment: '产品来源' }
    ];
    
    for (const field of productFields) {
      try {
        // 检查字段是否存在
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'enterpise_brain' 
            AND TABLE_NAME = 'sales_orders' 
            AND COLUMN_NAME = ?
        `, [field.name]);
        
        if (columns.length === 0) {
          // 字段不存在，添加它
          const defaultClause = field.default ? `DEFAULT ${field.default}` : '';
          const alterSQL = `
            ALTER TABLE sales_orders 
            ADD COLUMN ${field.name} ${field.type} ${defaultClause} COMMENT '${field.comment}'
          `;
          
          console.log(`  ✅ 添加字段: ${field.name} (${field.comment})`);
          await connection.execute(alterSQL);
        } else {
          console.log(`  ℹ️  字段已存在: ${field.name}`);
        }
      } catch (error) {
        console.error(`  ❌ 处理字段 ${field.name} 失败:`, error.message);
      }
    }
    
    console.log('\n✅ 产品字段添加完成！');
    console.log('📊 销售订单表现在支持产品信息直接合并到主表');
    
  } catch (error) {
    console.error('❌ 添加产品字段失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

// 执行
addProductFields();
