const http = require('http');

function testProcessesAPI() {
  return new Promise((resolve) => {
    console.log('=== 测试工序API ===');
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/processes/list',
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
          console.log('响应数据:', JSON.stringify(jsonData, null, 2));
          
          if (jsonData.code === 200 && jsonData.records) {
            console.log(`✅ 获取工序列表成功，共 ${jsonData.records.length} 条数据`);
            jsonData.records.forEach((process, index) => {
              console.log(`  ${index + 1}. ${process.process_name}`);
            });
          } else {
            console.log('❌ 获取工序列表失败');
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
testProcessesAPI();