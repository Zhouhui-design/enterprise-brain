// 检查参数数量
const fs = require('fs');

const content = fs.readFileSync('/home/sardenesy/ai_workspaces/ai_desktop_3/backend/services/materialPreparationPlanService.js', 'utf8');

// 找到参数数组的开始和结束
const paramsStart = content.indexOf('[');
const paramsEnd = content.indexOf(']);', paramsStart);
const paramsContent = content.substring(paramsStart, paramsEnd + 2);

// 提取参数行（排除注释）
const paramLines = paramsContent.split('\n').filter(line => {
  return line.trim().startsWith('data.') || 
         line.trim().startsWith('new Date()') ||
         line.trim().match(/^\s*\d+\|/); // 行号
});

console.log('参数行数:', paramLines.length);
console.log('参数内容:');
paramLines.forEach((line, index) => {
  if (line.trim().startsWith('data.') || line.trim().startsWith('new Date()')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});