const http = require('http');

// 测试主生产计划执行排程功能
function testExecuteSchedule() {
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/master-production-plans/1/execute-schedule',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📋 执行排程响应状态:', res.statusCode);
      console.log('📋 响应数据:');
      try {
        const result = JSON.parse(data);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.log(data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ 请求失败:', error.message);
  });
  
  req.write(postData);
  req.end();
}

// 先查看可用的主生产计划
function listPlans() {
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: '/api/master-production-plans',
    method: 'GET'
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('📋 主生产计划列表:');
      try {
        const result = JSON.parse(data);
        console.log(JSON.stringify(result, null, 2));
        
        // 如果有计划，测试第一个计划的执行排程
        if (result.data && result.data.list && result.data.list.length > 0) {
          const firstPlan = result.data.list[0];
          console.log(`\n🧪 测试执行排程，计划ID: ${firstPlan.id}`);
          testExecuteScheduleWithId(firstPlan.id);
        } else {
          console.log('❌ 没有找到可用的主生产计划');
        }
      } catch (e) {
        console.log(data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ 请求失败:', error.message);
  });
  
  req.end();
}

// 使用指定ID测试执行排程
function testExecuteScheduleWithId(id) {
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 3005,
    path: `/api/master-production-plans/${id}/execute-schedule`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📋 执行排程响应状态 (${id}):`, res.statusCode);
      console.log('📋 响应数据:');
      try {
        const result = JSON.parse(data);
        console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        console.log(data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ 请求失败:', error.message);
  });
  
  req.write(postData);
  req.end();
}

console.log('🧪 开始测试主生产计划执行排程功能...');
listPlans();