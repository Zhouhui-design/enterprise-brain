const fs = require('fs');
const content = fs.readFileSync('./backend/services/materialPreparationPlanService.js', 'utf8');

// 提取VALUES语句
const valuesMatch = content.match(/VALUES\s*\(\s*([^)]+)\s*\)/s);
if (valuesMatch) {
  const valuesString = valuesMatch[1];
  const placeholders = valuesString.match(/\?/g);
  console.log('当前VALUES占位符数量:', placeholders ? placeholders.length : 0);
  console.log('VALUES字符串:', valuesString);
} else {
  console.log('未找到VALUES语句');
}