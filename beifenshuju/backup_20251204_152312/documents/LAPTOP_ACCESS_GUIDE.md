# 笔记本电脑访问开发服务器 - 快速配置指南

## 🎯 问题现象

- ✅ 在服务器本机访问正常
- ❌ 笔记本电脑访问时提示"加载物料数据失败"
- ❌ 产品编码和产品名称无法下拉筛选

## 🔍 问题原因

前端代码中的API地址硬编码为`localhost`,导致笔记本电脑访问时无法连接到后端服务器。

## ✅ 解决方案(自动切换)

我已经修改了代码,现在会自动根据访问方式选择正确的API地址:

- **本地访问**: `http://localhost:3005/api`
- **局域网访问**: `http://192.168.2.229:3005/api` (自动使用当前访问的IP)

### 代码修改

**文件**: `07-frontend/src/api/material.js`

```javascript
// 后端API地址 - 支持局域网访问
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.hostname === 'localhost' 
  ? 'http://localhost:3005/api'
  : `http://${window.location.hostname}:3005/api`
```

## 🚀 使用步骤

### 方式1: 自动切换(推荐)

无需配置,代码会自动检测:

1. **在服务器本机访问**:
   ```
   http://localhost:3002/bom/production
   ```
   自动使用 `http://localhost:3005/api`

2. **在笔记本电脑访问**:
   ```
   http://192.168.2.229:3002/bom/production
   ```
   自动使用 `http://192.168.2.229:3005/api`

### 方式2: 环境变量配置(可选)

如果需要固定指定API地址,可以使用环境变量:

**文件**: `07-frontend/.env.development`

```bash
# 使用服务器IP(适合局域网访问)
VITE_API_BASE_URL=http://192.168.2.229:3005/api
```

修改后重启前端服务:
```bash
cd 07-frontend
npm run dev
```

## ⚡ 重启前端服务

修改后需要重启前端服务才能生效:

### 步骤1: 停止当前服务
按 `Ctrl + C` 停止正在运行的前端服务

### 步骤2: 重新启动
```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend
npm run dev
```

## ✅ 验证配置

### 1. 检查前端服务日志

启动后应该看到:
```
VITE v4.5.14  ready in 354 ms
➜  Local:   http://localhost:3002/
➜  Network: http://192.168.2.229:3002/
```

### 2. 在笔记本电脑浏览器打开

```
http://192.168.2.229:3002/bom/production
```

### 3. 打开浏览器开发者工具(F12)

**Console标签页**应该看到:
```
从后端获取到 X 条物料数据
加载物料数据成功: X 条
```

**Network标签页**应该看到:
```
Request URL: http://192.168.2.229:3005/api/materials/list
Status: 200 OK
```

## 🔧 故障排查

### 问题1: 仍然提示加载物料数据失败

**检查清单**:

1. **后端服务是否运行**
   ```bash
   # 在服务器上执行
   netstat -tuln | grep 3005
   ```
   应该看到: `0.0.0.0:3005`

2. **测试后端API**
   ```bash
   # 在笔记本电脑上执行
   curl http://192.168.2.229:3005/api/materials/list
   ```

3. **检查浏览器控制台**
   - 按F12打开开发者工具
   - 查看Console标签的错误信息
   - 查看Network标签的请求详情

4. **清除浏览器缓存**
   - 按 `Ctrl + Shift + Del`
   - 选择"缓存的图像和文件"
   - 点击"清除数据"

### 问题2: 产品编码和名称无法筛选

这是因为没有物料数据导致的。解决加载失败问题后,筛选功能会自动正常工作。

### 问题3: CORS跨域错误

**症状**: 浏览器控制台显示:
```
Access to XMLHttpRequest at 'http://192.168.2.229:3005/api/materials/list' 
from origin 'http://192.168.2.229:3002' has been blocked by CORS policy
```

**解决**: 后端已经配置允许跨域,但如果仍然出现,检查`backend/server.js`:

```javascript
app.use(cors({
  origin: '*',  // 允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 📊 网络请求流程

```
笔记本电脑浏览器
  ↓ 访问页面
http://192.168.2.229:3002
  ↓ 前端加载
检测到hostname = 192.168.2.229
  ↓ 自动构建API地址
http://192.168.2.229:3005/api
  ↓ 发送请求
GET /api/materials/list
  ↓ 后端响应
{ code: 200, data: [...], message: "获取物料列表成功" }
  ↓ 数据渲染
产品编码、产品名称下拉列表正常显示
```

## 🎯 快速测试

### 在笔记本电脑上执行

#### 1. 测试前端服务
```bash
curl http://192.168.2.229:3002
```
应该返回HTML内容

#### 2. 测试后端服务
```bash
curl http://192.168.2.229:3005/health
```
应该返回: `{"status":"ok","timestamp":"..."}`

#### 3. 测试物料API
```bash
curl http://192.168.2.229:3005/api/materials/list
```
应该返回物料列表JSON数据

## 📝 配置文件位置

| 文件 | 作用 | 路径 |
|------|------|------|
| API配置 | 定义后端API地址 | `07-frontend/src/api/material.js` |
| 环境变量(开发) | 开发环境配置 | `07-frontend/.env.development` |
| 环境变量(生产) | 生产环境配置 | `07-frontend/.env.production` |
| 后端服务 | Node.js后端 | `backend/server.js` |

## ⚠️ 注意事项

1. **重启服务**: 修改配置文件后必须重启前端服务
2. **清除缓存**: 如果修改不生效,清除浏览器缓存
3. **检查IP**: 确保使用正确的服务器IP地址(`192.168.2.229`)
4. **网络连接**: 确保笔记本和服务器在同一局域网

## 🎉 成功标志

当配置成功后,您应该能够:

- ✅ 在笔记本电脑浏览器打开生产BOM页面
- ✅ 看到"加载物料数据成功"的提示
- ✅ 产品编码下拉框可以正常筛选和选择
- ✅ 产品名称下拉框可以正常筛选和选择
- ✅ SmartSelect组件正常工作
- ✅ 所有功能与服务器本机访问一致

---

**最后更新**: 2025-11-30

如有问题,请查看详细配置指南: `NETWORK_ACCESS_GUIDE.md`
