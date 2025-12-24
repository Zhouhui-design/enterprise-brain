const { pool } = require('./config/database');

async function checkProcessesSelfOrOutsource() {
  try {
    console.log('🔧 开始检查processes表的self_or_outsource字段值...');
    
    // 查询processes表中的数据，重点检查self_or_outsource字段
    const [rows] = await pool.execute('SELECT id, process_name, self_or_outsource FROM processes ORDER BY id');
    
    console.log(`✅ 查询到 ${rows.length} 条工序数据:`);
    
    // 统计自制和外协的数量
    let selfMadeCount = 0;
    let outsourceCount = 0;
    let otherCount = 0;
    
    rows.forEach(row => {
      console.log(`  - ID: ${row.id}, 工序名称: ${row.process_name}, 自制/外协: '${row.self_or_outsource}'`);
      
      if (row.self_or_outsource === '自制') {
        selfMadeCount++;
      } else if (row.self_or_outsource === '外协') {
        outsourceCount++;
      } else {
        otherCount++;
      }
    });
    
    console.log(`\n📊 统计结果:`);
    console.log(`  - 自制工序: ${selfMadeCount} 条`);
    console.log(`  - 外协工序: ${outsourceCount} 条`);
    console.log(`  - 其他: ${otherCount} 条`);
    
    // 关闭数据库连接
    await pool.end();
  } catch (error) {
    console.error('❌ 检查processes表数据失败:', error.message);
    process.exit(1);
  }
}

// 执行检查
checkProcessesSelfOrOutsource();
