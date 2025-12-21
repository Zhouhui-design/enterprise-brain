# 库存管理系统 /clear-all 路由匹配问题记录

## 问题描述
当调用 `DELETE /api/inventory/clear-all?warehouse_code=test` 接口时，请求被错误地匹配到 `/:id` 路由处理函数，导致出现 "Truncated incorrect DOUBLE value: 'clear-all'" 错误。

## 已尝试的解决方案

### 1. 调整路由顺序
- 将 `/clear-all` 路由定义放在 `/:id` 路由之前
- 理论上 Express 应该优先匹配更具体的路由，但问题仍然存在

### 2. 修改 /:id 路由处理函数
- 在 DELETE /:id 路由中添加 ID 格式检查
- 当 ID 不是数字时，调用 `next()` 而非直接返回错误
- 期望请求能传递到 /clear-all 路由，但问题仍然存在

### 3. 尝试使用正则表达式约束
- 尝试将 `/:id` 改为 `/:id(\d+)` 以仅匹配数字 ID
- 但遇到 Express 版本不支持该语法的问题，导致服务器启动失败

## 错误信息
```
Truncated incorrect DOUBLE value: 'clear-all'
```

## 观察结果
- 尽管已将 `/clear-all` 路由放在 `/:id` 之前，但请求仍被 `/:id` 路由捕获
- 数据库错误表明 'clear-all' 被当作数字类型处理，说明请求确实到达了 `/:id` 路由的数据库操作部分

## 可能的后续解决方向

1. **检查 Express 版本和路由匹配机制**
   - 确认当前 Express 版本的路由匹配规则
   - 查看是否有其他中间件影响路由匹配顺序

2. **重新设计路由结构**
   - 考虑将 `/clear-all` 路由改为 `/clear` 或其他不会与 ID 路径冲突的名称
   - 或者将 ID 路由改为更明确的路径，如 `/items/:id`

3. **深入调试路由匹配过程**
   - 在服务器端添加详细的路由匹配日志
   - 跟踪请求如何在不同路由间传递

4. **检查数据库查询逻辑**
   - 确保在 `/:id` 路由中，只有当 ID 确实是数字时才执行数据库操作
   - 添加更严格的参数验证

## 相关文件
- `/backend/routes/inventory.js` - 库存管理路由定义
- `/backend/server.js` - 服务器主文件，路由挂载点

## 记录时间