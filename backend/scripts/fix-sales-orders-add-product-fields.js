const { pool } = require('../config/database');

console.log('=== 修复销售订单表：添加产品字段 ===\n');

async function addProductFieldsToSalesOrders() {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('✅ 数据库连接成功\n');
    
    // 定义要添加的产品字段
    const fieldsToAdd = [
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
    
    console.log('📋 检查并添加产品字段到 sales_orders 表...\n');
    
    let addedCount = 0;
    let existingCount = 0;
    
    for (const field of fieldsToAdd) {
      try {
        // 检查字段是否存在
        const [columns] = await connection.execute(`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE()
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
          
          await connection.execute(alterSQL);
          console.log(`  ✅ 添加字段: ${field.name} (${field.comment})`);
          addedCount++;
        } else {
          console.log(`  ℹ️  字段已存在: ${field.name}`);
          existingCount++;
        }
      } catch (error) {
        console.error(`  ❌ 处理字段 ${field.name} 失败:`, error.message);
      }
    }
    
    console.log(`\n📊 处理结果:`);
    console.log(`   - 新增字段: ${addedCount} 个`);
    console.log(`   - 已存在字段: ${existingCount} 个`);
    console.log(`   - 总计: ${fieldsToAdd.length} 个字段\n`);
    
    // 验证表结构
    console.log('🔍 验证表结构...');
    const [tableInfo] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'sales_orders'
        AND COLUMN_NAME IN ('product_code', 'product_name', 'output_process', 'product_source')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n✅ 关键产品字段验证:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${col.COLUMN_COMMENT ? '(' + col.COLUMN_COMMENT + ')' : ''}`);
    });
    
    console.log('\n✨ 销售订单表修复完成！');
    console.log('📝 说明:');
    console.log('   - 销售订单表现在支持将产品信息直接合并到主表');
    console.log('   - 每个产品会独占一行，同时包含所有基本信息、部门信息、时间信息等');
    console.log('   - 前端提交订单时，后端会为每个产品创建一条独立记录\n');
    
  } catch (error) {
    console.error('\n❌ 修复失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('🔌 数据库连接已释放');
    }
    process.exit(0);
  }
}

// 执行修复
addProductFieldsToSalesOrders();
