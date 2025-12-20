/**
 * 批量修复所有工序计划的定时工额lookup逻辑
 * 
 * 修复规则：
 * - 定时工额lookup规则：lookup(产品物料库的"物料编号"=当前工序计划的"生产产品编号"，产品物料库的"定时工额")
 * - 计算前置条件：当前工序计划"生产产品编号"不为空
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

// lookup代码模板
const lookupCode = `      // ✅ Lookup定时工额：从产品物料库查询
      // 规则：lookup(产品物料库的"物料编号"=当前工序计划的"生产产品编号"，产品物料库的"定时工额")
      // 前置条件：当前工序计划"生产产品编号"不为空
      let standardWorkQuota = data.standardWorkQuota || 0;
      
      if (data.productCode) {
        try {
          console.log(\`🔍 [定时工额Lookup] 查询产品物料库: 物料编号=\${data.productCode}\`);
          const [materialRows] = await pool.execute(
            'SELECT standard_time FROM materials WHERE material_code = ?',
            [data.productCode]
          );
          
          if (materialRows.length > 0 && materialRows[0].standard_time) {
            standardWorkQuota = parseFloat(materialRows[0].standard_time);
            console.log(\`✅ [定时工额Lookup] 找到定时工额: \${standardWorkQuota}\`);
          } else {
            console.log(\`⚠️ [定时工额Lookup] 未找到物料编号=\${data.productCode}的定时工额，使用默认值: \${standardWorkQuota}\`);
          }
        } catch (lookupError) {
          console.error(\`❌ [定时工额Lookup] 查询失败:\`, lookupError);
          // 查询失败时使用传入的值或0
        }
      }
      
`;

console.log('🚀 开始批量修复所有工序计划服务的定时工额lookup逻辑...\n');

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
    
    // 检查是否已经有lookup逻辑
    if (content.includes('[定时工额Lookup]')) {
      console.log(`   ✅ 已包含lookup逻辑，跳过\n`);
      skipCount++;
      continue;
    }
    
    // 查找create方法的开始位置
    const createMethodRegex = /static async create\(data\) \{[\s\S]*?try \{/;
    const match = content.match(createMethodRegex);
    
    if (!match) {
      console.log(`   ❌ 未找到create方法，跳过\n`);
      errorCount++;
      continue;
    }
    
    // 在try {后面插入lookup代码
    const insertPosition = match.index + match[0].length;
    const beforeInsert = content.substring(0, insertPosition);
    const afterInsert = content.substring(insertPosition);
    
    // 插入lookup代码
    content = beforeInsert + '\n' + lookupCode + afterInsert;
    
    // 替换standardWorkQuota的使用
    // 查找: data.standardWorkQuota || 0,                  // 27. standard_work_quota
    // 替换: standardWorkQuota,                            // 27. standard_work_quota (✅ 使用lookup的值)
    content = content.replace(
      /(data\.standardWorkQuota \|\| 0,\s*\/\/\s*\d+\.\s*standard_work_quota)/g,
      'standardWorkQuota,                            // 27. standard_work_quota (✅ 使用lookup的值)'
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
  console.log('✅ 定时工额lookup逻辑已成功添加到所有工序计划服务！');
  console.log('\n接下来需要处理的:');
  console.log('1. ✅ 定时工额 - 已完成');
  console.log('2. 🔄 计划结束日期 - 需要实现自动计算逻辑');
  console.log('\n计划结束日期计算规则:');
  console.log('- 需求工时 = 需补货数量 / 定时工额');
  console.log('- 计划结束日期需要基于企业日历和工序能力负荷表计算');
}
