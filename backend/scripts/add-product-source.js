const { pool } = require('../config/database');

async function addProductSourceColumn() {
  let connection;
  try {
    connection = await pool.getConnection();

    console.log('开始执行SQL语句，为sales_order_products表添加product_source字段...');

    // 执行ALTER TABLE语句 - 直接添加，如果已存在会报错，但我们会捕获处理
    await connection.execute(`
      ALTER TABLE sales_order_products 
      ADD COLUMN product_source VARCHAR(100) 
      COMMENT '产品来源' 
      AFTER output_process
    `);

    console.log('✅ product_source字段添加成功！');
  } catch (error) {
    console.error('❌ 执行SQL语句失败:', error.message);

    // 如果错误是字段已存在，不报错
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ product_source字段已存在，无需添加');
    }
  } finally {
    if (connection) {
      await connection.release();
    }
    // 关闭连接池
    await pool.end();
  }
}

// 执行脚本
addProductSourceColumn();
