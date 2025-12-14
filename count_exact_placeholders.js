const valuesStr = '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, ?, ?, NOW()';

const items = valuesStr.split(',').map(item => item.trim());
const placeholders = items.filter(item => item === '?').length;
const nowCount = items.filter(item => item === 'NOW()').length;

console.log('总项目数:', items.length);
console.log('占位符数量:', placeholders);
console.log('NOW()数量:', nowCount);
console.log('需要参数数量:', placeholders);

items.forEach((item, index) => {
  console.log(`${index + 1}: ${item}`);
});