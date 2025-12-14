/**
 * 测试防重复推送功能
 * 验证同一条备料计划只能推送一次
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
 * 测试自动触发推送的防重复功能
 */
async function testAntiDuplicatePush() {
  console.log('🧪 测试防重复推送功能');
  console.log('=' .repeat(50));
  
  try {
    // 第一次触发推送
    console.log('\n🔄 第一次触发自动推送...');
    const result1 = await callAPI('POST', '/api/material-preparation-plans/auto-trigger-push');
    console.log('第一次结果:', result1.data);
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 第二次触发推送
    console.log('\n🔄 第二次触发自动推送...');
    const result2 = await callAPI('POST', '/api/material-preparation-plans/auto-trigger-push');
    console.log('第二次结果:', result2.data);
    
    // 比较结果
    console.log('\n📊 结果比较:');
    console.log(`第一次 - 总数: ${result1.data.totalPlans}, 推送: ${result1.data.pushedPlans}, 跳过: ${result1.data.skippedPlans || 0}`);
    console.log(`第二次 - 总数: ${result2.data.totalPlans}, 推送: ${result2.data.pushedPlans}, 跳过: ${result2.data.skippedPlans || 0}`);
    
    if (result2.data.pushedPlans === 0 && (result2.data.skippedPlans > 0)) {
      console.log('\n✅ 防重复推送功能正常工作！');
      console.log('第二次调用时，所有满足条件的计划都被跳过了');
    } else {
      console.log('\n⚠️ 防重复推送功能可能存在问题');
    }
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error.message);
  }
}

/**
 * 查询当前的推送状态
 */
async function queryPushStatus() {
  console.log('\n📊 查询当前推送状态...');
  
  try {
    // 查询备料计划
    const materialResult = await callAPI('GET', '/api/material-preparation-plans', {
      pageSize: 20
    });
    
    const qualifyingPlans = materialResult.data.records.filter(plan => 
      plan.materialSource === '自制' && 
      plan.replenishmentQuantity > 0
    );
    
    console.log(`满足条件的备料计划: ${qualifyingPlans.length} 条`);
    qualifyingPlans.forEach(plan => {
      console.log(`   📦 ${plan.planNo} (${plan.materialCode}, ${plan.replenishmentQuantity})`);
    });
    
    // 查询真工序计划
    const processResult = await callAPI('GET', '/api/real-process-plans', {
      pageSize: 50
    });
    
    console.log(`真工序计划总数: ${processResult.data.records.length} 条`);
    const plansWithSource = processResult.data.records.filter(plan => plan.sourceNo);
    console.log(`有来源编号的真工序计划: ${plansWithSource.length} 条`);
    plansWithSource.forEach(plan => {
      console.log(`   🔧 ${plan.planNo} ← ${plan.sourceNo} (${plan.productCode})`);
    });
    
  } catch (error) {
    console.error('❌ 查询状态失败:', error.message);
  }
}

// 主演示流程
async function main() {
  console.log('🎯 防重复推送功能测试');
  console.log('=' .repeat(60));
  
  // 1. 查询当前状态
  await queryPushStatus();
  
  // 2. 测试防重复推送
  await testAntiDuplicatePush();
  
  // 3. 再次查询状态
  await queryPushStatus();
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testAntiDuplicatePush, queryPushStatus };