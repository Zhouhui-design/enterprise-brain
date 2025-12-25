const { pool } = require('./config/database');

async function checkProcessesData() {
  try {
    console.log('🔧 开始检查processes表数据...');

    // 查询processes表中的数据
    const [rows] = await pool.execute('SELECT * FROM processes');

    console.log(`✅ 查询到 ${rows.length} 条工序数据:`);
    rows.forEach(row => {
      console.log(`  - ID: ${row.id}, 工序名称: ${row.process_name}, 自制/外协: ${row.self_or_outsource}`);
    });

    // 关闭数据库连接
    await pool.end();
  } catch (error) {
    console.error('❌ 检查processes表数据失败:', error.message);
    process.exit(1);
  }
}

// 执行检查
checkProcessesData();
