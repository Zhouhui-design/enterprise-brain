# 客户管理API请求路径修复

## 需求背景
用户在客户台账页面点击"新增客户"时，页面提示"数据同步失败，使用本地缓存数据，请求地址不存在"。控制台显示大量API请求失败和WebSocket连接未授权错误。

## 问题场景具体处理逻辑
1. **前端页面访问**：用户访问 `http://localhost:3006/sales/orders/customers`
2. **新增客户操作**：点击"新增客户"按钮，打开新增客户页面
3. **数据提交失败**：录入信息后点击"提交"，显示"数据同步失败，使用本地缓存数据"
4. **API请求重试**：控制台显示多次重试失败，最终使用本地缓存

## 架构技术方案
### 核心问题识别
1. **端口不匹配**：前端运行在3006端口，但Vite代理配置指向3005端口
2. **数据库权限问题**：MySQL数据库连接配置存在权限验证失败
3. **WebSocket认证问题**：WebSocket连接返回4001未授权错误

### 修复策略
1. **修复前端代理配置**：更新Vite配置，确保API请求正确转发到后端
2. **修复数据库连接**：检查并修复MySQL用户权限配置
3. **优化错误处理**：改进前端API请求的错误处理和用户提示

## 影响文件
### 配置文件修改
- **07-frontend/vite.config.js**：修改代理配置，确保正确的API转发
- **backend/config/database.js**：检查数据库连接配置和权限

### 代码优化
- **07-frontend/src/utils/request.js**：优化错误处理逻辑
- **07-frontend/src/utils/CustomerDataManager.js**：改进重试机制和离线处理

## 实现细节

### 1. 前端代理配置修复
```javascript
// 07-frontend/vite.config.js
export default defineConfig({
  server: {
    port: 3006, // 确保与实际运行端口一致
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  }
})
```

### 2. 数据库连接修复
```javascript
// backend/config/database.js
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'zH754277289hUi~197547', // 确保密码正确
  database: 'enterprise_brain',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 添加连接超时配置
  acquireTimeout: 60000,
  timeout: 60000,
};
```

### 3. 前端错误处理优化
```javascript
// 07-frontend/src/utils/request.js
// 响应拦截器优化
service.interceptors.response.use(
  response => {
    const { data } = response;
    
    // 优化成功响应处理
    if (response.status === 200) {
      return { success: true, data: data.data || data };
    }
    
    return data;
  },
  error => {
    // 优化错误处理，提供更详细的错误信息
    if (error.code === 'ECONNREFUSED') {
      ElMessage.error('无法连接到服务器，请检查后端服务是否启动');
    } else if (error.code === 'ENOTFOUND') {
      ElMessage.error('网络连接失败，请检查网络设置');
    } else if (error.response?.status === 401) {
      ElMessage.error('认证失败，请重新登录');
    } else if (error.response?.status === 404) {
      ElMessage.error('请求的资源不存在');
    } else {
      ElMessage.error(`请求失败: ${error.message || '未知错误'}`);
    }
    
    return Promise.reject(error);
  }
);
```

### 4. CustomerDataManager优化
```javascript
// 07-frontend/src/utils/CustomerDataManager.js
class CustomerDataManager {
  async fetchWithRetry(apiCall, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await apiCall();
        console.log(`✅ API请求成功，尝试次数: ${i + 1}`);
        return result;
      } catch (error) {
        console.warn(`⚠️ API请求失败，第 ${i + 1} 次重试:`, error.message);
        
        // 网络错误时延长重试间隔
        const delay = error.code === 'ECONNREFUSED' ? 5000 : Math.pow(2, i) * 1000;
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          // 最后一次重试失败时，提供更详细的错误信息
          throw new Error(`API请求失败，已重试 ${maxRetries} 次: ${error.message}`);
        }
      }
    }
  }
}
```

## 边界条件与异常处理
1. **网络连接失败**：前端能够正确检测网络问题并提供友好的错误提示
2. **数据库连接失败**：后端能够优雅处理数据库连接问题，不影响其他功能
3. **API服务不可用**：前端能够降级到本地缓存模式，并明确告知用户
4. **WebSocket连接失败**：不影响主要的API请求功能，可以独立重试

## 数据流动路径
1. **正常流程**：
   - 前端(3006) → Vite代理 → 后端API(3005) → MySQL数据库
   - WebSocket连接：前端 → 后端WebSocket服务

2. **降级流程**：
   - API请求失败 → CustomerDataManager本地缓存 → 用户界面显示"使用本地缓存数据"

3. **错误恢复**：
   - 网络恢复 → 自动重试API请求 → 数据同步成功

## 预期成果
1. **新增客户功能正常**：用户可以成功创建新客户，不再出现"数据同步失败"错误
2. **API请求稳定**：所有客户管理相关的API请求都能正常工作
3. **错误提示友好**：当出现问题时，用户能收到清晰的错误信息和解决建议
4. **离线模式完善**：在网络不可用时，系统能够优雅降级到离线模式
5. **WebSocket连接正常**：实时功能能够正常工作，不再出现未授权错误

## 验证标准
1. **功能验证**：
   - 能够正常打开客户台账页面
   - 能够成功创建新客户
   - 能够正常查看、编辑、删除客户
   - 数据能够正确保存到数据库

2. **性能验证**：
   - API请求响应时间 < 2秒
   - 页面加载时间 < 3秒
   - 错误恢复时间 < 5秒

3. **用户体验验证**：
   - 错误提示清晰易懂
   - 操作流程顺畅无卡顿
   - 离线模式切换自然