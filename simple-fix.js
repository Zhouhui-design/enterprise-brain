const fs = require('fs');

// 修复单个文件中的return语句
function fixFile(filePath) {
  console.log(`正在修复文件: ${filePath}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复模式1: return res.status(404); 后面跟res.send
    const pattern1 = `return res.status(404);
      res.setHeader('Content-Type', 'application/json');
      res.send(customJsonStringify({ message: '记录不存在' }));`;
    const fix1 = `res.status(404);
    res.setHeader('Content-Type', 'application/json');
    return res.send(customJsonStringify({ message: '记录不存在' }));`;
    content = content.replace(pattern1, fix1);
    
    const pattern2 = `return res.status(500);
      res.setHeader('Content-Type', 'application/json');
      res.send(customJsonStringify({ message: '获取记录失败: ' + error.message }));`;
    const fix2 = `res.status(500);
    res.setHeader('Content-Type', 'application/json');
    return res.send(customJsonStringify({ message: '获取记录失败: ' + error.message }));`;
    content = content.replace(pattern2, fix2);
    
    // 修复模式2: 修复缩进问题
    content = content.replace(/\n      res\.setHeader/g, '\n    res\.setHeader');
    content = content.replace(/\n      res\.send/g, '\n    res\.send');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${filePath} 修复成功`);
  } catch (error) {
    console.error(`❌ 修复 ${filePath} 失败:`, error.message);
  }
}

// 手动修复每个文件
const files = [
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

console.log('开始修复return语句和缩进问题...');
console.log('=' .repeat(60));

files.forEach(file => {
  fixFile(file);
});

console.log('=' .repeat(60));
console.log('所有文件修复完成！');