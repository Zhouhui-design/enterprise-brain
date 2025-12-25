const { pool } = require('./config/database');

async function createTestProcesses() {
  try {
    console.log('🔧 开始创建测试工序数据...');

    // 插入测试工序数据
    await pool.execute(`
      INSERT INTO processes (process_code, process_name, responsible_person, dispatch_method, self_or_outsource, available_workstations, workshop_name, process_wage)
      VALUES 
        ('P20250001', '切割', '张三', '自动', '自制', 5, '生产车间', 100),
        ('P20250002', '焊接', '李四', '手动', '自制', 3, '生产车间', 150),
        ('P20250003', '喷漆', '王五', '自动', '外协', 2, '涂装车间', 120)
    `);

    console.log('✅ 测试工序数据创建成功！');

    // 关闭数据库连接
    await pool.end();
  } catch (error) {
    console.error('❌ 创建测试工序数据失败:', error.message);
    process.exit(1);
  }
}

// 执行创建操作
createTestProcesses();
