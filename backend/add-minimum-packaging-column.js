const { pool } = require('./config/database');

async function addMinimumPackagingColumn() {
  try {
    console.log('🔍 检查materials表中是否存在minimum_packaging_quantity列...');

    // 检查列是否存在
    const [columns] = await pool.execute(`
      SHOW COLUMNS FROM materials LIKE 'minimum_packaging_quantity'
    `);

    if (columns.length === 0) {
      console.log('❌ minimum_packaging_quantity列不存在，准备添加...');

      // 添加列
      await pool.execute(`
        ALTER TABLE materials
        ADD COLUMN minimum_packaging_quantity DECIMAL(10,4) DEFAULT 1 COMMENT '最小包装量'
      `);

      console.log('✅ 成功添加minimum_packaging_quantity列');
    } else {
      console.log('✅ minimum_packaging_quantity列已存在');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 添加列失败:', error.message);
    process.exit(1);
  }
}

addMinimumPackagingColumn();
