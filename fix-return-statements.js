const fs = require('fs');
const path = require('path');

// 定义需要修复的文件列表
const filesToFix = [
  'backend/routes/assemblyProcessPlans.js',
  'backend/routes/bendingProcessPlans.js',
  'backend/routes/cuttingProcessPlans.js',
  'backend/routes/drillingProcessPlans.js',
  'backend/routes/laserCuttingProcessPlans.js',
  'backend/routes/laserTubeCuttingProcessPlans.js',
  'backend/routes/machineGrindingProcessPlans.js',
  'backend/routes/manualCuttingProcessPlans.js',
  'backend/routes/manualWeldingProcessPlans.js',
  'backend/routes/punchingProcessPlans.js',
  'backend/routes/realProcessPlans.js',
  'backend/routes/sewingProcessPlans.js',
  'backend/routes/shotBlastingProcessPlans.js',
  'backend/routes/sprayPaintingProcessPlans.js',
  'backend/routes/tubeBendingProcessPlans.js',
  'backend/routes/processPlans.js'
];

// 修复有return语句的情况
function fixReturnStatements(filePath) {
  console.log(`正在修复文件中的return语句: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 修复return语句后面的res.send问题
    let newContent = content.replace(
      /return res\.status\((\d+)\);\n\s+res\.setHeader\('Content-Type', 'application/json'\);\n\s+res\.send\(customJsonStringify\(([^)]+)\)\);/g,
      (match, statusCode, jsonObj) => {
        return `res.status(${statusCode});\n    res.setHeader('Content-Type', 'application/json');\n    return res.send(customJsonStringify(${jsonObj}));`;
      }
    );
    
    // 修复缩进问题
    newContent = newContent.replace(/^\s+res\.setHeader/gm, '    res.setHeader');
    newContent = newContent.replace(/^\s+res\.send/gm, '    res.send');
    
    // 保存修改后的文件
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath} 修复成功`);
    } else {
      console.log(`⚠️ ${filePath} 没有需要修复的return语句`);
    }
  } catch (error) {
    console.error(`❌ 处理 ${filePath} 时出错:`, error.message);
  }
}

// 批量修复所有文件
function main() {
  console.log('开始修复return语句问题...');
  console.log('=' .repeat(50));
  
  filesToFix.forEach(filePath => {
    fixReturnStatements(filePath);
  });
  
  console.log('=' .repeat(50));
  console.log('return语句修复完成！');
}

// 执行主函数
main();