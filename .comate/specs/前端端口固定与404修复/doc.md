# 前端端口固定与404修复需求文档

## 需求背景
用户在使用企业大脑系统时遇到两个问题：
1. 前端端口不固定，导致用户不知道应该访问哪个端口
2. 点击"模拟排程列表"菜单时，访问 `http://localhost:3003/simulation-scheduling/list` 显示404页面未找到

## 问题分析

### 问题1：端口配置分析
- 当前前端端口配置在 `vite.config.js` 中设置为 `port: 3003`
- 这是固定配置，不存在端口随机变化的问题
- 用户可能是因为缓存或重启导致的端口混淆

### 问题2：404页面分析
- 用户访问路径：`/simulation-scheduling/list`
- 实际路由配置路径：`/sales/simulation-scheduling/list`
- 问题原因：路径不匹配，缺少 `/sales` 前缀
- Vue组件文件存在：`07-frontend/src/pages/simulation-scheduling/SimulationSchedulingList.vue`

## 架构技术方案

### 端口固定方案
1. 在 `vite.config.js` 中确保端口配置明确且固定
2. 添加端口启动检查机制，避免端口冲突
3. 在启动脚本中添加端口信息提示

### 路由修复方案
1. 修正菜单跳转路径，从 `/simulation-scheduling/list` 改为 `/sales/simulation-scheduling/list`
2. 或者添加路由别名，支持 `/simulation-scheduling/list` 直接访问
3. 确保404页面正确显示友好的错误信息

## 影响文件

### 修改类型的文件
1. **配置文件修改**：
   - `07-frontend/vite.config.js` - 端口配置优化
   
2. **路由配置修改**：
   - `07-frontend/src/router/index.js` - 添加路由别名支持
   
3. **菜单配置修改**：
   - 需要找到左侧菜单配置文件，修正跳转路径

### 影响的函数
1. **Vite配置函数**：
   - `defineConfig` - 服务器配置
   
2. **路由配置函数**：
   - `createRouter` - 路由实例创建
   - `beforeEach` - 路由守卫

## 实现细节

### 1. 端口配置优化
```javascript
// vite.config.js 修改
server: {
  port: 3003,
  host: '0.0.0.0',
  strictPort: true, // 严格使用指定端口，如果被占用则失败
  open: '/auth/login',
  // 添加端口信息显示
  onListening: function({ port }) {
    console.log(`🚀 前端服务已启动: http://localhost:${port}`)
    console.log(`📱 API代理地址: http://localhost:${port}/api -> http://localhost:3005`)
  }
}
```

### 2. 路由别名添加
```javascript
// 在主路由文件中添加别名路由
{
  path: '/simulation-scheduling',
  redirect: '/sales/simulation-scheduling/list',
  hidden: true
}
```

### 3. 启动脚本优化
```json
// package.json scripts 修改
"dev": "echo '🔧 启动前端服务，端口: 3003' && vite",
"start": "echo '🚀 启动前端服务，端口: 3003' && vite --port 3003 --host 0.0.0.0"
```

## 边界条件与异常处理

### 端口冲突处理
- 如果端口3003被占用，提供明确的错误提示
- 建议备用端口方案（如3004、3005）

### 路由跳转异常处理
- 确保所有菜单项都有正确的路径配置
- 添加路由跳转失败的容错机制

### 404页面优化
- 提供返回首页的便捷操作
- 显示访问的URL路径，便于调试

## 数据流动路径

### 正常访问流程
1. 用户访问 `http://localhost:3003`
2. 自动重定向到 `/auth/login`
3. 登录成功后跳转到 `/dashboard/home`
4. 点击"模拟排程列表"菜单
5. 路由跳转到 `/sales/simulation-scheduling/list`
6. 加载 `SimulationSchedulingList.vue` 组件

### 错误访问流程
1. 用户访问错误路径 `/simulation-scheduling/list`
2. 路由别名重定向到 `/sales/simulation-scheduling/list`
3. 正常显示页面内容

## 预期成果

### 端口固定成果
1. 前端服务始终运行在固定端口3003
2. 启动时显示清晰的端口信息
3. 端口冲突时有明确错误提示

### 路由修复成果
1. "模拟排程列表"菜单点击正常跳转
2. 支持直接访问 `/simulation-scheduling/list` 路径
3. 404页面提供友好的错误信息和返回选项

### 用户体验改进
1. 用户不再混淆端口问题
2. 菜单导航功能正常
3. 系统稳定性提升

## 验证标准

### 功能验证
1. ✅ 前端服务启动端口始终为3003
2. ✅ 点击"模拟排程列表"菜单正常显示页面
3. ✅ 直接访问 `/simulation-scheduling/list` 能够正常跳转
4. ✅ 404页面显示友好的错误信息

### 性能验证
1. ✅ 路由跳转响应时间 < 100ms
2. ✅ 页面加载时间 < 2s
3. ✅ 端口启动时间 < 3s

### 兼容性验证
1. ✅ 支持Chrome、Firefox、Safari等主流浏览器
2. ✅ 支持Windows、macOS、Linux操作系统
3. ✅ 支持移动端访问