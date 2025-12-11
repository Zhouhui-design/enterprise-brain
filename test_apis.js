const http = require('http');

// 测试工序能力负荷表的下一个排程日期API
function testNextScheduleDate() {
  return new Promise((resolve) => {
    console.log('=== 测试下一个排程日期API ===');
    
    const postData = JSON.stringify({
      processName: '组装',
      scheduleDate: '2026-01-02',  // 计划排程日期
      minRemainingHours: 0.5        // 最小剩余工时门槛
    });
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/capacity-load/query-next-schedule-date',
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
        console.log('响应状态:', res.statusCode);
        try {
          const jsonData = JSON.parse(data);
          console.log('响应数据:', JSON.stringify(jsonData, null, 2));
        } catch (error) {
          console.log('原始响应:', data);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('API调用失败:', error.message);
      resolve();
    });
    
    req.write(postData);
    req.end();
  });
}

// 测试查询指定工序和日期范围内的能力负荷数据
function testCapacityByDateRange() {
  return new Promise((resolve) => {
    console.log('\n=== 测试指定日期范围内的能力负荷数据 ===');
    
    const params = new URLSearchParams({
      processName: '组装',
      processNameOperator: 'equals',
      startDate: '2026-01-01',
      endDate: '2026-01-10',
      page: '1',
      pageSize: '20'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/capacity-load/list?' + params.toString(),
      method: 'GET'
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('响应状态:', res.statusCode);
        try {
          const jsonData = JSON.parse(data);
          console.log('响应数据总数:', jsonData.total);
          
          if (jsonData.records && jsonData.records.length > 0) {
            console.log('能力负落数据:');
            jsonData.records.forEach((row, index) => {
              console.log(`${index + 1}. 日期: ${row.date}, 工序: ${row.process_name}, 剩余工时: ${row.remaining_hours}`);
            });
          }
        } catch (error) {
          console.log('原始响应:', data);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('API调用失败:', error.message);
      resolve();
    });
    
    req.end();
  });
}

// 运行测试
async function runTests() {
  await testNextScheduleDate();
  await testCapacityByDateRange();
}

runTests();