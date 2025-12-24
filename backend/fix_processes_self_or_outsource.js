const { pool } = require('./config/database');

async function fixProcessesSelfOrOutsource() {
  try {
    console.log('🔧 开始修复processes表的self_or_outsource字段值...');
    
    // 1. 先删除重复的测试数据（如果有的话）
    console.log('\n1. 删除重复的测试数据...');
    await pool.execute('DELETE FROM processes WHERE process_code LIKE "P202500%"');
    console.log('   ✅ 已删除重复的测试数据');
    
    // 2. 获取所有工序数据
    console.log('\n2. 获取所有工序数据...');
    const [rows] = await pool.execute('SELECT id, process_name FROM processes ORDER BY id');
    console.log(`   ✅ 查询到 ${rows.length} 条工序数据`);
    
    // 3. 定义自制和外协的工序类型
    const selfMadeProcesses = [
      '套袋（打包）', 'PE封切机流水线', 'POF热缩机流水线', '套袋（装配流水线）',
      '折弯', '激光切管', '刺绣', '包螺丝', '打包', '清洁', '组装',
      '上扣', '枪钉', '胶棉', '塞包', '缝纫', '裁剪', '喷塑', '抛丸',
      '机器打磨', '人工打磨', '人工焊接', '机器人焊接', '木板铆钉',
      '木板打孔', '冲铆钉', '攻丝', '打孔', '弯管', '拉铆', '机器平面打磨',
      '冲床', '激光下料', '人工下料'
    ];
    
    const outsourceProcesses = ['电镀', '复合'];
    
    // 4. 更新自制工序
    console.log('\n3. 更新自制工序...');
    let selfMadeCount = 0;
    for (const process of selfMadeProcesses) {
      const [result] = await pool.execute(
        'UPDATE processes SET self_or_outsource = ? WHERE process_name = ?',
        ['自制', process]
      );
      if (result.affectedRows > 0) {
        selfMadeCount += result.affectedRows;
      }
    }
    console.log(`   ✅ 已更新 ${selfMadeCount} 条自制工序`);
    
    // 5. 更新外协工序
    console.log('\n4. 更新外协工序...');
    let outsourceCount = 0;
    for (const process of outsourceProcesses) {
      const [result] = await pool.execute(
        'UPDATE processes SET self_or_outsource = ? WHERE process_name = ?',
        ['外协', process]
      );
      if (result.affectedRows > 0) {
        outsourceCount += result.affectedRows;
      }
    }
    console.log(`   ✅ 已更新 ${outsourceCount} 条外协工序`);
    
    // 6. 验证修复结果
    console.log('\n5. 验证修复结果...');
    const [fixedRows] = await pool.execute(
      'SELECT self_or_outsource, COUNT(*) as count FROM processes GROUP BY self_or_outsource'
    );
    
    console.log('   📊 修复后统计结果:');
    fixedRows.forEach(row => {
      console.log(`   - ${row.self_or_outsource || '未设置'}: ${row.count} 条`);
    });
    
    // 7. 查询详细数据
    console.log('\n6. 详细数据:');
    const [detailedRows] = await pool.execute(
      'SELECT id, process_name, self_or_outsource FROM processes ORDER BY self_or_outsource, process_name'
    );
    
    detailedRows.forEach(row => {
      console.log(`   - ID: ${row.id}, 工序名称: ${row.process_name}, 自制/外协: '${row.self_or_outsource}'`);
    });
    
    console.log('\n✅ 修复完成！');
    
    // 关闭数据库连接
    await pool.end();
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    process.exit(1);
  }
}

// 执行修复
fixProcessesSelfOrOutsource();
