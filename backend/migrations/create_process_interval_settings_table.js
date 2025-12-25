/**
 * 创建工序间隔设置表
 * 用于存储工序间间隔时间配置
 */

const { pool } = require('../config/database');

async function createProcessIntervalSettingsTable() {
  const connection = await pool.getConnection();

  try {
    console.log('🔧 开始创建工序间隔设置表...');

    // 创建工序间隔设置表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS process_interval_settings (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        previous_process VARCHAR(100) NOT NULL COMMENT '上道工序名称',
        next_process VARCHAR(100) NOT NULL COMMENT '下道工序名称',
        interval_value DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '间隔数值',
        interval_unit VARCHAR(20) NOT NULL DEFAULT '小时' COMMENT '间隔单位（小时/天）',
        remark TEXT COMMENT '备注',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        UNIQUE KEY unique_process_interval (previous_process, next_process),
        INDEX idx_previous_process (previous_process),
        INDEX idx_next_process (next_process)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工序间隔设置表'
    `);

    console.log('✅ 工序间隔设置表创建成功');

    // 插入初始数据（常见工序间隔）
    const initialData = [
      { previous: '组装', next: '打包', value: 1, unit: '天', remark: '组装完成后到打包的间隔时间' },
      { previous: '激光下料', next: '冲床', value: 2, unit: '小时', remark: '下料后冲压间隔' },
      { previous: '冲床', next: '折弯', value: 1, unit: '小时', remark: '冲压后折弯间隔' },
      { previous: '折弯', next: '焊接', value: 3, unit: '小时', remark: '折弯后焊接间隔' },
      { previous: '人工焊接', next: '机器打磨', value: 4, unit: '小时', remark: '焊接后打磨间隔' },
      { previous: '机器打磨', next: '喷塑', value: 2, unit: '小时', remark: '打磨后喷塑间隔' },
    ];

    for (const data of initialData) {
      try {
        await connection.execute(
          `
          INSERT INTO process_interval_settings 
          (previous_process, next_process, interval_value, interval_unit, remark)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            interval_value = VALUES(interval_value),
            interval_unit = VALUES(interval_unit),
            remark = VALUES(remark)
        `,
          [data.previous, data.next, data.value, data.unit, data.remark],
        );

        console.log(`✅ 初始化工序间隔: ${data.previous} → ${data.next} (${data.value}${data.unit})`);
      } catch (err) {
        console.log(`⚠️  跳过已存在的工序间隔: ${data.previous} → ${data.next}`);
      }
    }

    console.log('✅ 初始数据插入完成');
  } catch (error) {
    console.error('❌ 创建工序间隔设置表失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// 执行创建
createProcessIntervalSettingsTable()
  .then(() => {
    console.log('🎉 工序间隔设置表创建完成');
    process.exit(0);
  })
  .catch(err => {
    console.error('数据库操作失败:', err);
    process.exit(1);
  });

module.exports = { createProcessIntervalSettingsTable };
