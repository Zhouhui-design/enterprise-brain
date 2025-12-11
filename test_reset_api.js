const http = require('http');

function testResetOccupiedHoursAPI() {
  return new Promise((resolve) => {
    console.log('=== 测试重置占用工时API ===');
    
    const postData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 3005,
      path: '/api/capacity-load/reset-all-occupied-hours',
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
          
          // 验证结果
          if (jsonData.code === 200) {
            console.log('✅ API调用成功!');
            console.log(`   总记录数: ${jsonData.data.totalRecords}`);
            console.log(`   更新记录数: ${jsonData.data.updatedCount}`);
            console.log(`   释放总工时: ${jsonData.data.totalReleasedHours}小时`);
          } else {
            console.log('❌ API调用失败:', jsonData.message);
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
    
    req.write(postData);
    req.end();
  });
}

// 运行测试
testResetOccupiedHoursAPI();