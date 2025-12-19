const fetch = require('node-fetch');

(async () => {
  try {
    console.log('🧪 测试API返回的数据格式\n');
    
    const response = await fetch('http://localhost:3005/api/capacity-load/list?page=1&pageSize=5&processNameOperator=equals&processName=人工焊接');
    const result = await response.json();
    
    console.log('API响应码:', result.code);
    console.log('返回记录数:', result.data.records.length);
    console.log('\n前3条记录的关键字段:');
    
    result.data.records.slice(0, 3).forEach((record, index) => {
      console.log(`\n记录${index + 1}:`);
      console.log(`  processName: ${record.processName}`);
      console.log(`  date: ${record.date}`);
      console.log(`  workShift: ${record.workShift} (类型: ${typeof record.workShift})`);
      console.log(`  availableWorkstations: ${record.availableWorkstations}`);
      console.log(`  occupiedHours: ${record.occupiedHours}`);
      console.log(`  remainingHours: ${record.remainingHours}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
})();
