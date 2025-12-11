const http = require('http');

// 测试工序能力负荷表的下一个排程日期API，并查看后端日志
function testNextScheduleDateWithDebug() {
  return new Promise((resolve) => {
    console.log('=== 测试下一个排程日期API（带调试信息） ===');
    
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
    
    console.log('发送请求到:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('请求体:', postData);
    
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
          if (jsonData.data && jsonData.data.nextScheduleDate) {
            if (jsonData.data.nextScheduleDate === '2026-01-03') {
              console.log('❌ 错误：API返回了2026-01-03，但应该返回2026-01-04');
              console.log('   2026-01-03的剩余工时是0，不符合>0.5的条件');
              console.log('   2026-01-04的剩余工时是16，符合>0.5的条件');
            } else if (jsonData.data.nextScheduleDate === '2026-01-04') {
              console.log('✅ 正确：API返回了正确的日期2026-01-04');
            } else {
              console.log('⚠️ 未知结果：API返回了', jsonData.data.nextScheduleDate);
            }
          } else {
            console.log('⚠️ API没有返回有效数据');
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
testNextScheduleDateWithDebug();