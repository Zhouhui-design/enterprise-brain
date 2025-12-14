const fs = require('fs');

// 读取当前文件内容
const content = fs.readFileSync('/home/sardenesy/ai_desktop_3/backend/services/materialPreparationPlanService.js', 'utf8');

// 提取列名部分
const columnsMatch = content.match(/INSERT INTO material_preparation_plans \((.*?)\)/s);
const columnsStr = columnsMatch ? columnsMatch[1] : '';
const columns = columnsStr.split(',').map(col => col.trim().replace(/\n/g, '')).
  filter(col => col && !col.startsWith('--'));

// 提取VALUES部分
const valuesMatch = content.match(/VALUES \((.*?)\)/s);
const valuesStr = valuesMatch ? valuesMatch[1] : '';
const values = valuesStr.split(',').map(val => val.trim()).filter(val => val);

// 计算占位符数量（排除NOW()）
const placeholders = values.filter(val => val === '?').length;

console.log('列数:', columns.length);
console.log('占位符数量:', placeholders);
console.log('列名:');
columns.forEach((col, index) => {
  console.log(`${index + 1}: ${col}`);
});

console.log('\nVALUES:');
console.log(valuesStr);