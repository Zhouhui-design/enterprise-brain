# 端口配置修复需求文档

## 问题场景

用户访问 `http://localhost:3008/sales/orders/list` 页面时，出现连接被拒绝的错误：
- 错误信息：`ERR_CONNECTION_REFUSED`
- 控制台输出：`crbug/1173575, non-JS module files deprecated`

## 问题根因分析

### 1. 端口配置不匹配
- **实际配置**：
  - 后端服务：3005端口 ✅ 正常运行
  - 前端服务：3003端口 ✅ 正常运行
- **用户访问**：3008端口 ❌ 无服务运行

### 2. 历史配置文件问题
发现项目中存在使用3008端口配置的文件：
- `test-anti-duplicate-push.js`
- `trigger-auto-push-material-preparation.js`

这些文件包含过时的API基础URL配置，导致混淆。

## 解决方案

### 1. 端口访问修复
指导用户访问正确的端口：
- **销售订单页面正确地址**：`http://localhost:3003/sales/orders/list`
- **后端API地址**：`http://localhost:3005/api/*`

### 2. 配置文件修复
已修复以下文件中的端口配置：
- `test-anti-duplicate-push.js`：`BASE_URL` 从 `http://localhost:3008` 改为 `http://localhost:3005`
- `trigger-auto-push-material-preparation.js`：`BASE_URL` 从 `http://localhost:3008` 改为 `http://localhost:3005`

### 3. 服务状态验证
- ✅ 后端服务：运行在3005端口，健康检查正常
- ✅ 前端服务：运行在3003端口，可正常访问
- ❌ 3008端口：无服务运行（预期行为）

## 技术架构

### 端口分配
- **3005端口**：Express.js后端API服务
- **3003端口**：Vite前端开发服务器
- **3008端口**：已废弃，无服务

### 代理配置
前端通过Vite代理将`/api`请求转发到后端：
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3005',
    changeOrigin: true,
  }
}
```

## 修复验证

### 1. 后端服务验证
```bash
curl http://localhost:3005/health
# 返回：{"status":"ok","timestamp":"2025-12-30T04:56:04.405Z"}
```

### 2. 前端服务验证
访问 `http://localhost:3003` 确认前端页面正常加载

### 3. 脚本配置验证
修复后的脚本文件现在使用正确的3005端口

## 预防措施

1. **统一端口配置管理**：建议在项目中创建统一的配置文件管理所有端口设置
2. **文档更新**：更新相关文档中的端口引用
3. **环境变量**：使用环境变量来管理不同环境的端口配置

## 用户操作指南

### 访问销售订单页面
1. 确保后端服务在3005端口运行
2. 确保前端服务在3003端口运行  
3. 访问：`http://localhost:3003/sales/orders/list`

### 服务启动命令
```bash
# 启动后端服务（3005端口）
cd backend
npm start

# 启动前端服务（3003端口）
cd 07-frontend  
npm run dev
```

## 影响范围

### 修复的文件
- `test-anti-duplicate-push.js`
- `trigger-auto-push-material-preparation.js`

### 无影响的文件
- 后端配置文件（端口3005配置正确）
- 前端配置文件（端口3003配置正确）
- 路由配置文件（使用相对路径）

## 总结

问题主要是用户访问了错误的端口（3008）导致的连接拒绝。实际服务运行在3005（后端）和3003（前端）端口。通过修复脚本文件中的过时配置和提供正确的访问地址，问题已得到解决。
