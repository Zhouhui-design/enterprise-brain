import axios from 'axios';

// 创建一个测试响应拦截器，模拟我们的实际拦截器
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
};

const convertToCamelCase = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => convertToCamelCase(item));
  } else if (data !== null && typeof data === 'object') {
    const camelCaseObj = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const camelKey = snakeToCamel(key);
        camelCaseObj[camelKey] = convertToCamelCase(data[key]);
      }
    }
    return camelCaseObj;
  }
  return data;
};

// 测试数据转换
const testData = {
  "success": true,
  "data": {
    "list": [
      {
        "id": "17d248aa-32b2-4270-b32e-7ab5c5239403",
        "internal_order_no": "SO2025000004",
        "customer_order_no": "给对方",
        "customer_name": "测试客户4",
        "customer_id": "4",
        "salesperson": "admin",
        "quotation_no": null,
        "order_type": null,
        "order_time": "2025-12-24T15:50:45.000Z",
        "promised_delivery": null,
        "customer_delivery": "2026-01-09T08:00:00.000Z",
        "estimated_completion_date": null,
        "sales_department": null,
        "delivery_method": null,
        "return_order_no": null,
        "order_currency": "CNY",
        "current_exchange_rate": "1.0000",
        "tax_rate": "13.00",
        "fees": "0.00",
        "total_amount": "0.00",
        "total_amount_excluding_tax": "0.00",
        "total_tax": "0.00",
        "status": "pending",
        "created_by": "admin",
        "updated_by": null,
        "created_at": "2025-12-24T23:51:30.000Z",
        "updated_at": "2025-12-24T23:51:30.000Z"
      }
    ],
    "total": 4,
    "page": 1,
    "pageSize": 1
  }
};

console.log('原始数据:');
console.log(JSON.stringify(testData.data.list[0], null, 2));

// 转换数据
const convertedData = convertToCamelCase(testData.data);

console.log('\n转换后的数据:');
console.log(JSON.stringify(convertedData.list[0], null, 2));

// 检查关键字段是否转换成功
const originalKeys = Object.keys(testData.data.list[0]);
const convertedKeys = Object.keys(convertedData.list[0]);

console.log('\n字段转换情况:');
originalKeys.forEach((originalKey, index) => {
  const convertedKey = convertedKeys[index];
  console.log(`${originalKey} -> ${convertedKey} (${originalKey === convertedKey ? '未转换' : '已转换'})`);
});

// 测试axios请求
console.log('\n\n测试实际API请求:');
const instance = axios.create({
  baseURL: 'http://localhost:3005',
  timeout: 10000
});

// 添加响应拦截器
instance.interceptors.response.use(response => {
  console.log('\n原始API响应:');
  console.log(JSON.stringify(response.data, null, 2));
  
  const { data } = response;
  if (data.code === 200 || data.success === true) {
    let result = data.data || data;
    result = convertToCamelCase(result);
    console.log('\n转换后的API响应:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  }
  return data;
});

// 发送请求
instance.get('/api/sales-orders?page=1&pageSize=1')
  .then(response => {
    console.log('\nAPI请求成功，最终返回数据:');
    console.log(JSON.stringify(response, null, 2));
    
    // 检查是否包含list字段
    if (response.list) {
      // 检查是否包含customerName字段
      const firstOrder = response.list[0];
      console.log('\n验证关键字段:');
      console.log(`customerName: ${firstOrder.customerName}`);
      console.log(`internalOrderNo: ${firstOrder.internalOrderNo}`);
      console.log(`orderTime: ${firstOrder.orderTime}`);
      console.log(`status: ${firstOrder.status}`);
    } else {
      console.log('\n响应中不包含list字段');
    }
  })
  .catch(error => {
    console.error('API请求失败:', error.message);
  });
