/**
 * 为所有工序计划页面添加productCode监听器
 * 功能：当生产产品编号不为空时，自动从产品物料库lookup定时工额
 */

const fs = require('fs');
const path = require('path');

const processPages = [
  'PackingProcessPlanList.vue',
  'AssemblyProcessPlanList.vue',
  'SewingProcessPlanList.vue',
  'ShotBlastingProcessPlanList.vue',
  'ManualWeldingProcessPlanList.vue',
  'BendingProcessPlanList.vue',
  'LaserTubeCuttingProcessPlanList.vue',
  'LaserCuttingProcessPlanList.vue',
  'DrillProcessPlanList.vue',
  'PunchProcessPlanList.vue',
  'ManualCuttingProcessPlanList.vue',
  'MachineGrindingProcessPlanList.vue',
  'CuttingProcessPlanList.vue',
  'SprayPaintingProcessPlanList.vue',
  'RealProcessPlanList.vue'
];

const frontendDir = './07-frontend/src/pages/production-planning';

// 要添加的代码片段
const watchProductCodeSnippet = `
// ✅ 监听生产产品编号变化，自动lookup定时工额
// 规则：lookup(产品物料库的"物料编号"=当前工序计划的"生产产品编号"，产品物料库的"定时工额")
// 前置条件：生产产品编号不为空
watch(
  () => formData.value.productCode,
  async (newProductCode) => {
    if (!newProductCode) {
      console.log('⚠️ [定时工额Lookup] 生产产品编号为空，跳过查询')
      formData.value.standardWorkQuota = 0
      return
    }
    
    try {
      console.log(\`🔍 [定时工额Lookup] 查询产品物料库: 物料编号=\${newProductCode}\`)
      const response = await materialApiService.getMaterialByCode(newProductCode)
      
      if (response?.data?.standardTime) {
        formData.value.standardWorkQuota = parseFloat(response.data.standardTime)
        console.log(\`✅ [定时工额Lookup] 找到定时工额: \${formData.value.standardWorkQuota}\`)
      } else {
        console.log(\`⚠️ [定时工额Lookup] 未找到物料编号=\${newProductCode}的定时工额，使用默认值0\`)
        formData.value.standardWorkQuota = 0
      }
    } catch (error) {
      console.error(\`❌ [定时工额Lookup] 查询失败:\`, error)
      formData.value.standardWorkQuota = 0
    }
  },
  { immediate: false }
)
`;

const importMaterialApi = `import materialApiService from '@/services/api/materialApiService'  // ✅ 导入产品物料库API`;

function addProductCodeWatcher(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // 检查是否已经有materialApiService导入
    if (!content.includes('materialApiService')) {
      // 在<script setup>之后添加import
      const scriptSetupIndex = content.indexOf('<script setup>');
      if (scriptSetupIndex !== -1) {
        const importIndex = content.indexOf('\nimport', scriptSetupIndex + 14);
        if (importIndex !== -1) {
          content = content.slice(0, importIndex) + '\n' + importMaterialApi + content.slice(importIndex);
          console.log(`✅ 已添加materialApiService导入`);
        }
      }
    }
    
    // 检查是否已经有productCode监听器
    if (content.includes('watch') && content.includes('formData.value.productCode')) {
      console.log(`⚠️ 已存在productCode监听器，跳过添加`);
      return false;
    }
    
    // 查找现有的watch(replenishmentQty, standardWorkQuota)监听器位置
    const watchPattern = /watch\(\s*\(\)\s*=>\s*\[formData\.value\.replenishmentQty,\s*formData\.value\.standardWorkQuota\]/;
    const match = content.match(watchPattern);
    
    if (match) {
      // 找到结尾的闭合括号
      let startIndex = match.index;
      let bracketCount = 0;
      let endIndex = startIndex;
      
      for (let i = startIndex; i < content.length; i++) {
        if (content[i] === '(') bracketCount++;
        if (content[i] === ')') bracketCount--;
        if (bracketCount === 0 && i > startIndex) {
          endIndex = i + 1;
          break;
        }
      }
      
      // 在watch之后添加新的productCode监听器
      content = content.slice(0, endIndex) + '\n' + watchProductCodeSnippet + content.slice(endIndex);
      
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ 已添加productCode监听器`);
      return true;
    } else {
      console.log(`⚠️ 未找到现有的watch监听器，无法添加`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ 处理文件失败:`, error);
    return false;
  }
}

console.log('========================================');
console.log('🔧 开始为所有工序计划页面添加productCode监听器');
console.log('========================================\n');

let successCount = 0;
let failCount = 0;

processPages.forEach((pageName) => {
  console.log(`\n处理文件: ${pageName}`);
  console.log('----------------------------------------');
  
  const filePath = path.join(frontendDir, pageName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ 文件不存在，跳过: ${filePath}`);
    failCount++;
    return;
  }
  
  const success = addProductCodeWatcher(filePath);
  
  if (success) {
    successCount++;
  } else {
    failCount++;
  }
});

console.log('\n========================================');
console.log(`✅ 处理完成！成功: ${successCount}, 失败/跳过: ${failCount}`);
console.log('========================================');
