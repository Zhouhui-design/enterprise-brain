/**
 * 为所有工序计划服务添加计划结束日期自动计算功能
 * 
 * 计算规则：
 * 1. 需求工时 = 需补货数量 / 定时工额
 * 2. 基于计划开始日期（或排程日期）、企业日历、工序能力负荷表计算计划结束日期
 */

const fs = require('fs');
const path = require('path');

// 所有需要修复的工序计划服务文件
const serviceFiles = [
  'packingProcessPlanService.js',        // 打包
  'assemblyProcessPlanService.js',       // 组装
  'sewingProcessPlanService.js',         // 缝纫
  'shotBlastingProcessPlanService.js',   // 抛丸
  'manualWeldingProcessPlanService.js',  // 人工焊接
  'tubeBendingProcessPlanService.js',    // 弯管
  'laserTubeCuttingProcessPlanService.js', // 激光切管
  'laserCuttingProcessPlanService.js',   // 激光下料
  'bendingProcessPlanService.js',        // 折弯
  'drillingProcessPlanService.js',       // 打孔
  'punchingProcessPlanService.js',       // 冲床
  'manualCuttingProcessPlanService.js',  // 人工下料
  'machineGrindingProcessPlanService.js', // 机器打磨
  'cuttingProcessPlanService.js',        // 裁剪
  'sprayPaintingProcessPlanService.js',  // 喷塑
  'realProcessPlanService.js'            // 真工序计划
];

const servicesDir = path.join(__dirname, 'backend', 'services');

console.log('🚀 开始为所有工序计划服务添加计划结束日期计算功能...\n');

let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const fileName of serviceFiles) {
  const filePath = path.join(servicesDir, fileName);
  
  try {
    console.log(`📝 处理文件: ${fileName}`);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️ 文件不存在，跳过: ${filePath}\n`);
      skipCount++;
      continue;
    }
    
    // 读取文件内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. 添加import (如果还没有)
    if (!content.includes('PlanEndDateCalculator')) {
      // 在文件开头添加import
      const importStatement = "const PlanEndDateCalculator = require('../utils/planEndDateCalculator');\n";
      
      // 找到第一个require语句的位置
      const firstRequireMatch = content.match(/const.*require\(/);
      if (firstRequireMatch) {
        const insertPos = firstRequireMatch.index;
        content = content.substring(0, insertPos) + importStatement + content.substring(insertPos);
        console.log(`   ✅ 已添加 PlanEndDateCalculator import`);
      }
    } else {
      console.log(`   ✅ 已包含 PlanEndDateCalculator import`);
    }
    
    // 2. 在create方法中，lookup定时工额之后添加计划结束日期计算
    // 查找插入位置：在standardWorkQuota lookup之后
    const lookupEndPattern = /}\s*}\s*\n\s*\/\/ 正确的SQL/;
    const match = content.match(lookupEndPattern);
    
    if (!match) {
      console.log(`   ⚠️ 未找到lookup结束位置，跳过\n`);
      skipCount++;
      continue;
    }
    
    // 检查是否已经添加了计划结束日期计算
    if (content.includes('[计划结束日期计算]')) {
      console.log(`   ✅ 已包含计划结束日期计算逻辑，跳过\n`);
      skipCount++;
      continue;
    }
    
    const planEndDateCode = `      }
      
      // ✅ 计算计划结束日期
      // 规则：基于需补货数量、定时工额、计划开始日期、工序能力负荷表计算
      // 前置条件：需补货数量 > 0 && 定时工额 > 0
      let planEndDate = data.planEndDate || null;
      
      const replenishment = parseFloat(data.replenishmentQty || data.scheduleQuantity || 0);
      if (replenishment > 0 && standardWorkQuota > 0) {
        try {
          console.log(\`🔍 [计划结束日期计算] 开始计算...\`);
          const calculatedEndDate = await PlanEndDateCalculator.calculate({
            replenishmentQty: replenishment,
            standardWorkQuota: standardWorkQuota,
            planStartDate: data.planStartDate,
            scheduleDate: data.scheduleDate,
            processName: data.processName
          });
          
          if (calculatedEndDate) {
            planEndDate = calculatedEndDate;
            console.log(\`✅ [计划结束日期计算] 计算成功: \${planEndDate.toISOString().split('T')[0]}\`);
          } else {
            console.log(\`⚠️ [计划结束日期计算] 计算失败，使用传入值或null\`);
          }
        } catch (calcError) {
          console.error(\`❌ [计划结束日期计算] 计算异常:\`, calcError);
          // 计算失败时使用传入的值或null
        }
      } else {
        console.log(\`⚠️ [计划结束日期计算] 不满足计算条件 (需补货数量=\${replenishment}, 定时工额=\${standardWorkQuota})\`);
      }
      
      // 正确的SQL`;
    
    // 替换
    content = content.replace(lookupEndPattern, planEndDateCode);
    
    // 3. 修改INSERT语句中的plan_end_date使用计算的值
    content = content.replace(
      /(data\.planEndDate \|\| null,\s*\/\/\s*\d+\.\s*plan_end_date)/g,
      'planEndDate,                                  // 21. plan_end_date (✅ 使用计算的值)'
    );
    
    // 写回文件
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`   ✅ 修复成功\n`);
    successCount++;
    
  } catch (error) {
    console.error(`   ❌ 处理失败: ${error.message}\n`);
    errorCount++;
  }
}

console.log('📊 批量修复完成统计:');
console.log(`   ✅ 成功: ${successCount} 个文件`);
console.log(`   ⏭️  跳过: ${skipCount} 个文件`);
console.log(`   ❌ 失败: ${errorCount} 个文件`);
console.log(`   📁 总计: ${serviceFiles.length} 个文件\n`);

if (successCount > 0) {
  console.log('✅ 计划结束日期自动计算逻辑已成功添加！');
  console.log('\n修复总结:');
  console.log('1. ✅ 定时工额 - 已完成 (从产品物料库lookup)');
  console.log('2. ✅ 计划结束日期 - 已完成 (基于需求工时和工序能力负荷表计算)');
  console.log('\n所有工序计划服务已更新完成！');
}
