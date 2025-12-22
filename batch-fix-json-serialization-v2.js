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
    
    let newContent = content;
    
    // 1. 修复导入语句（如果需要）
    if (!newContent.includes('customJsonStringify = require')) {
      newContent = newContent.replace(
        /const express = require\('express'\);/,
        `const express = require('express');\nconst customJsonStringify = require('../utils/custom-json-stringify');`
      );
    }
    
    // 2. 修复所有res.json调用，包括带状态码的
    newContent = newContent.replace(
      /(res\.(status\([^)]+\)\.)?json\(([^)]+)\);)/g,
      (match, fullMatch, statusPart, jsonObj) => {
        let statusCode = '';
        if (statusPart) {
          // 提取状态码
          const statusMatch = statusPart.match(/status\((\d+)\)/);
          if (statusMatch) {
            statusCode = `res.status(${statusMatch[1]});\n`;
          }
        }
        return `${statusCode}      res.setHeader('Content-Type', 'application/json');\n      res.send(customJsonStringify(${jsonObj}));`;
      }
    );
    
    // 3. 修复缩进问题（将错误的缩进替换为正确的4个空格）
    newContent = newContent.replace(/^\s{10}res\./gm, '      res.');
    
    // 保存修改后的文件
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ ${filePath} 修复成功`);
    } else {
      console.log(`⚠️ ${filePath} 没有需要修复的内容`);
    }
  } catch (error) {
    console.error(`❌ 处理 ${filePath} 时出错:`, error.message);
  }
}

// 批量处理所有文件
function main() {
  console.log('开始批量修复JSON序列化问题（v2）...');
  console.log('=' .repeat(50));
  
  filesToFix.forEach(filePath => {
    fixFile(filePath);
  });
  
  console.log('=' .repeat(50));
  console.log('批量修复完成！');
}

// 执行主函数
main();