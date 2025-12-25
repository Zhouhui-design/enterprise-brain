const { pool } = require('./config/database');

async function generateProcessData() {
  try {
    console.log('🔧 开始生成测试工序数据...');

    // 清除现有的测试数据
    await pool.execute('DELETE FROM processes');
    console.log('✅ 已清除现有的工序数据');

    // 生成测试数据
    const processData = [
      // 切割类工序
      {
        process_code: 'P20250001',
        process_name: '激光切割',
        self_or_outsource: '自制',
        available_workstations: 5,
        workshop_name: '切割车间',
        process_wage: 120,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250002',
        process_name: '等离子切割',
        self_or_outsource: '自制',
        available_workstations: 3,
        workshop_name: '切割车间',
        process_wage: 100,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250003',
        process_name: '火焰切割',
        self_or_outsource: '自制',
        available_workstations: 2,
        workshop_name: '切割车间',
        process_wage: 90,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250004',
        process_name: '水切割',
        self_or_outsource: '外协',
        available_workstations: 0,
        workshop_name: '',
        process_wage: 150,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250005',
        process_name: '剪板',
        self_or_outsource: '自制',
        available_workstations: 4,
        workshop_name: '切割车间',
        process_wage: 80,
        dispatch_method: '手动',
      },

      // 成型类工序
      {
        process_code: 'P20250006',
        process_name: '折弯',
        self_or_outsource: '自制',
        available_workstations: 6,
        workshop_name: '成型车间',
        process_wage: 110,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250007',
        process_name: '拉伸',
        self_or_outsource: '自制',
        available_workstations: 2,
        workshop_name: '成型车间',
        process_wage: 130,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250008',
        process_name: '冲压',
        self_or_outsource: '自制',
        available_workstations: 8,
        workshop_name: '成型车间',
        process_wage: 100,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250009',
        process_name: '旋压',
        self_or_outsource: '外协',
        available_workstations: 0,
        workshop_name: '',
        process_wage: 180,
        dispatch_method: '手动',
      },

      // 焊接类工序
      {
        process_code: 'P20250010',
        process_name: '氩弧焊',
        self_or_outsource: '自制',
        available_workstations: 5,
        workshop_name: '焊接车间',
        process_wage: 140,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250011',
        process_name: '二氧化碳焊',
        self_or_outsource: '自制',
        available_workstations: 7,
        workshop_name: '焊接车间',
        process_wage: 120,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250012',
        process_name: '点焊',
        self_or_outsource: '自制',
        available_workstations: 4,
        workshop_name: '焊接车间',
        process_wage: 90,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250013',
        process_name: '激光焊',
        self_or_outsource: '自制',
        available_workstations: 2,
        workshop_name: '焊接车间',
        process_wage: 160,
        dispatch_method: '自动',
      },

      // 机加工类工序
      {
        process_code: 'P20250014',
        process_name: '车削',
        self_or_outsource: '自制',
        available_workstations: 10,
        workshop_name: '机加工车间',
        process_wage: 130,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250015',
        process_name: '铣削',
        self_or_outsource: '自制',
        available_workstations: 8,
        workshop_name: '机加工车间',
        process_wage: 140,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250016',
        process_name: '钻削',
        self_or_outsource: '自制',
        available_workstations: 6,
        workshop_name: '机加工车间',
        process_wage: 100,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250017',
        process_name: '磨削',
        self_or_outsource: '自制',
        available_workstations: 4,
        workshop_name: '机加工车间',
        process_wage: 150,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250018',
        process_name: '镗削',
        self_or_outsource: '自制',
        available_workstations: 3,
        workshop_name: '机加工车间',
        process_wage: 160,
        dispatch_method: '自动',
      },

      // 表面处理类工序
      {
        process_code: 'P20250019',
        process_name: '喷塑',
        self_or_outsource: '自制',
        available_workstations: 3,
        workshop_name: '表面处理车间',
        process_wage: 110,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250020',
        process_name: '喷漆',
        self_or_outsource: '自制',
        available_workstations: 2,
        workshop_name: '表面处理车间',
        process_wage: 120,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250021',
        process_name: '镀锌',
        self_or_outsource: '外协',
        available_workstations: 0,
        workshop_name: '',
        process_wage: 90,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250022',
        process_name: '镀铬',
        self_or_outsource: '外协',
        available_workstations: 0,
        workshop_name: '',
        process_wage: 130,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250023',
        process_name: '磷化',
        self_or_outsource: '自制',
        available_workstations: 4,
        workshop_name: '表面处理车间',
        process_wage: 80,
        dispatch_method: '自动',
      },

      // 组装类工序
      {
        process_code: 'P20250024',
        process_name: '机械组装',
        self_or_outsource: '自制',
        available_workstations: 12,
        workshop_name: '组装车间',
        process_wage: 100,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250025',
        process_name: '电气组装',
        self_or_outsource: '自制',
        available_workstations: 8,
        workshop_name: '组装车间',
        process_wage: 120,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250026',
        process_name: '调试',
        self_or_outsource: '自制',
        available_workstations: 6,
        workshop_name: '组装车间',
        process_wage: 150,
        dispatch_method: '手动',
      },

      // 其他工序
      {
        process_code: 'P20250027',
        process_name: '包装',
        self_or_outsource: '自制',
        available_workstations: 10,
        workshop_name: '包装车间',
        process_wage: 80,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250028',
        process_name: '检验',
        self_or_outsource: '自制',
        available_workstations: 5,
        workshop_name: '质检车间',
        process_wage: 90,
        dispatch_method: '手动',
      },
      {
        process_code: 'P20250029',
        process_name: '探伤',
        self_or_outsource: '自制',
        available_workstations: 2,
        workshop_name: '质检车间',
        process_wage: 140,
        dispatch_method: '自动',
      },
      {
        process_code: 'P20250030',
        process_name: '热处理',
        self_or_outsource: '外协',
        available_workstations: 0,
        workshop_name: '',
        process_wage: 160,
        dispatch_method: '自动',
      },
    ];

    // 插入数据
    const insertSql = `
      INSERT INTO processes (process_code, process_name, responsible_person, dispatch_method, self_or_outsource, available_workstations, workshop_name, process_wage)
      VALUES (?, ?, '默认负责人', ?, ?, ?, ?, ?)
    `;

    for (const process of processData) {
      await pool.execute(insertSql, [
        process.process_code,
        process.process_name,
        process.dispatch_method,
        process.self_or_outsource,
        process.available_workstations,
        process.workshop_name,
        process.process_wage,
      ]);
    }

    console.log(`✅ 成功生成 ${processData.length} 条测试工序数据`);

    // 查询生成的数据
    const [rows] = await pool.execute('SELECT * FROM processes');
    console.log(`📊 数据库中现在有 ${rows.length} 条工序数据`);

    // 关闭数据库连接
    await pool.end();
  } catch (error) {
    console.error('❌ 生成测试工序数据失败:', error.message);
    process.exit(1);
  }
}

// 执行生成操作
generateProcessData();
