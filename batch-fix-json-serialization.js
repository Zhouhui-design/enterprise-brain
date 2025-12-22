const fs = require('fs');
const path = require('path');

// 定义需要修改的文件列表
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

// 处理单个文件
function fixFile(filePath) {
  console.log(`正在处理文件: ${filePath}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 检查是否已经导入了customJsonStringify
    if (!content.includes('customJsonStringify')) {
      // 1. 添加customJsonStringify导入
      let newContent = content.replace(
        /const express = require\('express'\);/,
        `const express = require('express');\nconst customJsonStringify = require('../utils/custom-json-stringify');`
      );
      
      // 2. 替换所有res.json调用
      newContent = newContent.replace(
        /res\.json\(([^)]+)\);/g,
        (match, jsonObj) => {
          return `res.setHeader('Content-Type', 'application/json');\n          res.send(customJsonStringify(${jsonObj}));`;
        }
      );
      
      // 保存修改后的文件
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath} 修复成功`);
    } else {
      console.log(`⚠️ ${filePath} 已经包含customJsonStringify导入，跳过处理`);
    }
  } catch (error) {
    console.error(`❌ 处理 ${filePath} 时出错:`, error.message);
  }
}

// 批量处理所有文件
function main() {
  console.log('开始批量修复JSON序列化问题...');
  console.log('=' .repeat(50));
  
  filesToFix.forEach(filePath => {
    fixFile(filePath);
  });
  
  console.log('=' .repeat(50));
  console.log('批量修复完成！');
}

// 执行主函数
main();