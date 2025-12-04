# 局域网访问配置指南

## 📋 概述

本指南说明如何在局域网内的其他设备(如笔记本电脑)访问开发服务器。

## 🖥️ 服务器信息

### 开发服务器IP地址
- **局域网IP**: `192.168.2.229`
- **主机名**: `sardenesy-Rack-Server`

### 运行的服务

| 服务 | 端口 | 局域网访问地址 | 说明 |
|------|------|----------------|------|
| 前端开发服务器 | 3002 | http://192.168.2.229:3002 | Vue前端应用 |
| 后端API服务器 | 3005 | http://192.168.2.229:3005 | Node.js后端服务 |
| Spring Boot后端 | 8080 | http://192.168.2.229:8080 | Java后端服务(如启动) |

---

## 🔧 配置步骤

### 1. 后端服务器配置

后端服务器已配置为监听所有网络接口(`0.0.0.0`)，允许局域网访问。

**已修改的文件**: `backend/server.js`

```javascript
// 监听所有网络接口
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Enterprise Brain Backend Server is running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.2.229:${PORT}`);
});
```

**CORS配置** (允许跨域访问):
```javascript
app.use(cors({
  origin: '*', // 开发环境允许所有来源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. 前端开发服务器配置

前端服务器已配置为监听所有网络接口。

**文件**: `07-frontend/vite.config.js`

```javascript
server: {
  port: 3001,
  host: '0.0.0.0',  // 允许局域网访问
  // ...
}
```

### 3. 防火墙配置

Ubuntu防火墙状态: **未启用**

如果防火墙启用,需要开放以下端口:
```bash
sudo ufw allow 3001  # 前端开发服务器
sudo ufw allow 3002  # 前端开发服务器(备用端口)
sudo ufw allow 3005  # 后端API服务器
sudo ufw allow 8080  # Spring Boot后端
```

---

## 💻 笔记本电脑访问指南

### 前提条件

1. **网络连接**: 笔记本电脑和开发服务器在同一局域网内
2. **服务运行**: 开发服务器上的前后端服务正在运行

### 访问方式

#### 方式1: 直接访问前端应用

在笔记本电脑浏览器中访问:

```
http://192.168.2.229:3002
```

前端会自动连接到后端API服务器。

#### 方式2: 访问后端API

测试后端健康检查:

```bash
curl http://192.168.2.229:3005/health
```

预期响应:
```json
{"status":"ok","timestamp":"2025-11-30T..."}
```

---

## 🚀 启动服务

### 在开发服务器上执行

#### 1. 启动后端服务

```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3
node backend/server.js
```

**成功提示**:
```
Enterprise Brain Backend Server is running on port 3005
Health check: http://localhost:3005/health
Local access: http://localhost:3005
Network access: http://192.168.2.229:3005
Server is accessible from other devices on the network
```

#### 2. 启动前端服务

```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend
npm run dev
```

**成功提示**:
```
VITE v4.5.14  ready in 354 ms
➜  Local:   http://localhost:3002/
➜  Network: http://192.168.2.229:3002/
```

---

## 🔍 故障排查

### 问题1: 笔记本无法连接到后端

**症状**: 前端显示"无法连接到后端服务器"

**排查步骤**:

1. **检查服务是否运行**
   ```bash
   # 在开发服务器上执行
   netstat -tuln | grep 3005
   ```
   
   应该看到:
   ```
   tcp        0      0 0.0.0.0:3005            0.0.0.0:*               LISTEN
   ```

2. **检查网络连通性**
   ```bash
   # 在笔记本电脑上执行
   ping 192.168.2.229
   ```

3. **测试端口访问**
   ```bash
   # 在笔记本电脑上执行
   curl http://192.168.2.229:3005/health
   ```

4. **检查防火墙**
   ```bash
   # 在开发服务器上执行
   sudo ufw status
   ```

### 问题2: CORS错误

**症状**: 浏览器控制台显示跨域错误

**解决方案**: 
- 后端已配置CORS允许所有来源
- 确保后端服务正常运行
- 检查`backend/server.js`中的CORS配置

### 问题3: 性能较慢

**可能原因**:
- 局域网带宽限制
- WiFi信号弱

**建议**:
- 使用有线网络连接
- 确保笔记本和服务器在同一交换机下

---

## 📊 网络架构

```
┌─────────────────┐         局域网          ┌──────────────────┐
│  笔记本电脑      │    192.168.2.x/24      │  开发服务器       │
│  (任意IP)        │◄─────────────────────►│  192.168.2.229   │
│                 │                        │                  │
│  浏览器访问:     │                        │  运行服务:        │
│  192.168.2.229  │                        │  - 前端:3002      │
│                 │                        │  - 后端:3005      │
└─────────────────┘                        └──────────────────┘
```

---

## ⚠️ 安全注意事项

### 开发环境

当前配置适用于**开发环境**,为了方便开发:
- CORS允许所有来源(`origin: '*'`)
- 监听所有网络接口(`0.0.0.0`)
- 无需身份验证

### 生产环境建议

在生产环境中应该:
1. **限制CORS来源**
   ```javascript
   origin: 'https://your-domain.com'
   ```

2. **启用HTTPS**
   ```javascript
   https: {
     key: fs.readFileSync('key.pem'),
     cert: fs.readFileSync('cert.pem')
   }
   ```

3. **配置防火墙**
   - 只开放必要端口
   - 限制IP访问范围

4. **启用身份验证**
   - JWT令牌
   - OAuth 2.0
   - API密钥

---

## 📞 获取帮助

如果遇到问题:

1. 检查日志
   - 前端: 浏览器开发者工具控制台
   - 后端: 终端输出

2. 验证网络连接
   ```bash
   ping 192.168.2.229
   curl http://192.168.2.229:3005/health
   ```

3. 查看完整配置
   - 后端: `backend/server.js`
   - 前端: `07-frontend/vite.config.js`

---

## ✅ 快速验证清单

- [ ] 开发服务器IP: `192.168.2.229`
- [ ] 后端服务运行在: `http://192.168.2.229:3005`
- [ ] 前端服务运行在: `http://192.168.2.229:3002`
- [ ] 后端监听地址: `0.0.0.0:3005`
- [ ] CORS已配置允许所有来源
- [ ] 防火墙未启用或已开放端口
- [ ] 笔记本可以ping通开发服务器
- [ ] 笔记本可以访问后端健康检查接口

---

最后更新: 2025-11-30
