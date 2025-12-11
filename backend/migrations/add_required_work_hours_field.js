const { pool } = require('../config/database');

/**
 * 添加 required_work_hours 字段到工序计划表
 * 需求工时 = 需补货数量 / 定时工额
 */
async function addRequiredWorkHoursField() {
  const connection = await pool.getConnection();
  
  try {
    console.log('开始添加 required_work_hours 字段到工序计划表...');
    
    // 检查字段是否已存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'process_plans' 
      AND COLUMN_NAME = 'required_work_hours'
    `);
    
    if (columns.length === 0) {
      // 添加 required_work_hours 字段
      await connection.execute(`
        ALTER TABLE process_plans 
        ADD COLUMN required_work_hours DECIMAL(18, 4) DEFAULT 0 COMMENT '需求工时'
      `);
      
      console.log('✅ 成功添加 required_work_hours 字段');
      
      // 为现有记录计算需求工时（如果有需补货数量和定时工额的数据）
      const [updateResult] = await connection.execute(`
        UPDATE process_plans 
        SET required_work_hours = ROUND(CASE 
          WHEN replenishment_qty > 0 AND standard_work_quota > 0 
          THEN replenishment_qty / standard_work_quota 
          ELSE 0 
        END, 2)
        WHERE replenishment_qty > 0 AND standard_work_quota > 0
      `);
      
      console.log(`✅ 成功更新 ${updateResult.affectedRows} 条现有记录的需求工时`);
    } else {
      console.log('⚠️ required_work_hours 字段已存在，跳过添加');
    }
    
    console.log('✅ 字段添加完成');
    
  } catch (error) {
    console.error('❌ 添加 required_work_hours 字段失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行添加
addRequiredWorkHoursField()
  .then(() => {
    console.log('字段添加完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('添加失败:', error);
    process.exit(1);
  });