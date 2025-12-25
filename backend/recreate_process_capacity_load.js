const { pool } = require('./config/database');

async function recreateProcessCapacityLoadTable() {
  try {
    console.log('🔧 开始重新创建process_capacity_load表...');

    // 先删除现有表
    await pool.execute('DROP TABLE IF EXISTS process_capacity_load');
    console.log('✅ 已删除现有process_capacity_load表');

    // 重新创建表，使用database.js中定义的结构
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS process_capacity_load (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        process_name VARCHAR(100) NOT NULL COMMENT '工序名称',
        date DATE NOT NULL COMMENT '日期',
        available_workstations INT DEFAULT 0 COMMENT '可用工位数量',
        work_shift DECIMAL(10,2) COMMENT '上班时段（小时）',
        occupied_hours DECIMAL(10,2) DEFAULT 0 COMMENT '已占用工时',
        remaining_shift DECIMAL(10,2) COMMENT '剩余时段（小时）',
        remaining_hours DECIMAL(10,2) DEFAULT 0 COMMENT '剩余工时',
        overtime_shift DECIMAL(10,2) COMMENT '加班时段（小时）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY uk_process_date (process_name, date),
        INDEX idx_process_name (process_name),
        INDEX idx_date (date),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工序能力负荷表'
    `);

    console.log('✅ process_capacity_load表重新创建成功！');

    // 关闭数据库连接
    await pool.end();
  } catch (error) {
    console.error('❌ 重新创建表失败:', error.message);
    process.exit(1);
  }
}

// 执行修复操作
recreateProcessCapacityLoadTable();
