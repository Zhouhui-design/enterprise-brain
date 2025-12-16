const { query } = require('./config/database');

(async () => {
  try {
    console.log('Testing list query like service...');
    
    const page = 1;
    const pageSize = 20;
    const offset = (page - 1) * pageSize;
    
    let conditions = [];
    let queryParams = [];

    // 构建搜索条件
    // if (procurementPlanNo) {
    //   conditions.push('procurement_plan_no LIKE ?');
    //   queryParams.push(`%${procurementPlanNo}%`);
    // }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // 查询总数
    let countSql = `SELECT COUNT(*) as total FROM procurement_plans`;
    let countParams = [];
    
    if (conditions.length > 0) {
      countSql += ' WHERE ' + conditions.join(' AND ');
      countParams = [...queryParams];
    }
    
    console.log('Count SQL:', countSql);
    console.log('Count params:', countParams);
    
    const countResult = await query(countSql, countParams);
    console.log('Count result:', countResult);

    // 查询数据
    const dataSql = `
      SELECT * FROM procurement_plans 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${parseInt(offset)}
    `;
    
    console.log('Data SQL:', dataSql);
    console.log('Data params:', queryParams);
    
    const records = await query(dataSql, queryParams);
    console.log('Records length:', records.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();