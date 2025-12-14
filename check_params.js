const fs = require('fs');
const content = fs.readFileSync('./backend/services/materialPreparationPlanService.js', 'utf8');

// 提取参数数组
const paramsMatch = content.match(/connection\.execute\(sql, \[\s*([\s\S]*?)\s*\]\)/);
if (paramsMatch) {
  const paramsString = paramsMatch[1];
  const lines = paramsString.split(',').filter(line => line.trim().length > 0);
  console.log('参数数组长度:', lines.length);
  console.log('参数列表:');
  lines.forEach((line, index) => {
    console.log(`${index + 1}: ${line.trim()}`);
  });
} else {
  console.log('未找到参数数组');
}