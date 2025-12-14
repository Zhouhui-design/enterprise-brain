/**
 * 备料计划自动触发推送演示脚本
 * 演示完整的数据流闭环：主生产计划 → 真工序计划 → 备料计划 → 自动触发推送
 */

const http = require('http');

// API基础URL
const BASE_URL = 'http://localhost:3008';

/**
 * 调用API的通用方法
 */
async function callAPI(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${BASE_URL}${url}`);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    let postData = '';
    if (data) {
      postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    console.log(`📡 ${method.toUpperCase()} ${url}`);
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || responseData}`));
          }
        } catch (parseError) {
          reject(new Error(`解析响应失败: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

/**
 * 1. 查询当前满足条件的备料计划
 */
async function queryQualifyingPlans() {
  console.log('\n🔍 1. 查询满足条件的备料计划...');
  
  const result = await callAPI('GET', '/api/material-preparation-plans', {
    pageSize: 100
  });
  
  const qualifyingPlans = result.data.records.filter(plan => 
    plan.materialSource === '自制' && 
    plan.replenishmentQuantity > 0
  );
  
  console.log(`📊 找到 ${qualifyingPlans.length} 条满足条件的备料计划:`);
  qualifyingPlans.forEach(plan => {
    console.log(`   ✅ ${plan.planNo} (${plan.materialCode}, ${plan.materialSource}, ${plan.replenishmentQuantity})`);
  });
  
  return qualifyingPlans;
}

/**
 * 2. 查询当前的真工序计划
 */
async function queryRealProcessPlans() {
  console.log('\n🔍 2. 查询当前的真工序计划...');
  
  const result = await callAPI('GET', '/api/real-process-plans', {
    pageSize: 100
  });
  
  console.log(`📊 当前有 ${result.data.records.length} 条真工序计划:`);
  result.data.records.forEach(plan => {
    console.log(`   📝 ${plan.planNo} (${plan.productCode}, 来源: ${plan.sourceNo})`);
  });
  
  return result.data.records;
}

/**
 * 3. 触发自动推送
 */
async function triggerAutoPush() {
  console.log('\n🚀 3. 触发自动推送...');
  
  const result = await callAPI('POST', '/api/material-preparation-plans/auto-trigger-push');
  
  console.log(`📈 推送结果:`);
  console.log(`   总满足条件数: ${result.data.totalPlans}`);
  console.log(`   成功推送数: ${result.data.pushedPlans}`);
  
  return result.data;
}

/**
 * 4. 验证推送结果
 */
async function verifyPushResults(beforeCount) {
  console.log('\n🔍 4. 验证推送结果...');
  
  const result = await callAPI('GET', '/api/real-process-plans', {
    pageSize: 100
  });
  
  const newPlansCount = result.data.records.length - beforeCount;
  console.log(`📊 推送后真工序计划数量: ${result.data.records.length} (新增 ${newPlansCount} 条)`);
  
  if (newPlansCount > 0) {
    console.log('🆕 新增的真工序计划:');
    result.data.records.slice(-newPlansCount).forEach(plan => {
      console.log(`   ✅ ${plan.planNo} (${plan.productCode}, 来源: ${plan.sourceNo})`);
    });
  }
  
  return { newCount: newPlansCount, plans: result.data.records };
}

/**
 * 主演示流程
 */
async function main() {
  console.log('🎯 备料计划自动触发推送演示');
  console.log('=' .repeat(60));
  
  try {
    // 1. 查询满足条件的备料计划
    const qualifyingPlans = await queryQualifyingPlans();
    
    // 2. 查询推送前的真工序计划
    const beforePlans = await queryRealProcessPlans();
    const beforeCount = beforePlans.length;
    
    // 3. 触发自动推送
    const pushResult = await triggerAutoPush();
    
    // 4. 验证推送结果
    const { newCount, plans } = await verifyPushResults(beforeCount);
    
    // 5. 总结
    console.log('\n📋 演示总结:');
    console.log('=' .repeat(40));
    console.log(`满足条件的备料计划: ${qualifyingPlans.length} 条`);
    console.log(`系统检测到满足条件: ${pushResult.totalPlans} 条`);
    console.log(`实际成功推送: ${pushResult.pushedPlans} 条`);
    console.log(`新增真工序计划: ${newCount} 条`);
    
    if (pushResult.pushedPlans > 0) {
      console.log('\n✅ 自动触发推送功能正常工作！');
      console.log('💡 这样就能实现:');
      console.log('   主生产计划 → 真工序计划 → 备料计划 → 自动触发推送');
    } else {
      console.log('\n⚠️ 没有新的推送记录，可能都已经推送过了');
    }
    
  } catch (error) {
    console.error('\n❌ 演示过程中发生错误:', error.message);
    process.exit(1);
  }
}

// 运行演示
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, queryQualifyingPlans, triggerAutoPush, verifyPushResults };