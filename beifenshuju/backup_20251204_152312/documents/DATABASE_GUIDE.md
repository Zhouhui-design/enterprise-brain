# 独立数据库系统使用说明

## 概述

我们已经为您创建了一个独立的SQLite数据库系统，确保您的数据在生产环境更新时不会丢失。这个系统使用后端Node.js服务器和SQLite数据库，数据会持久化存储在本地文件中。

## 系统架构

```
前端Vue应用 (localhost:3018)
    ↓
  API请求
    ↓
后端Express服务器 (localhost:3005)
    ↓
  SQLite数据库
    ↓
数据文件 (data/enterprise_brain.db)
```

## 启动步骤

### 1. 启动后端服务器

在项目根目录运行：

```bash
npm run backend
```

或者在开发模式下运行（支持热重载）：

```bash
npm run dev:backend
```

后端服务器将在 `http://localhost:3005` 启动。

### 2. 启动前端应用

在 `07-frontend` 目录下运行：

```bash
cd 07-frontend
npm run dev
```

前端应用将在 `http://localhost:3018` （或下一个可用端口）启动。

## 环境隔离

### 生产环境

- **数据库文件**: `/home/sardenesy/ai_workspaces/ai_desktop_3/data/production/enterprise_brain.db`
- **配置**: `backend/config/production.js`
- **启动命令**: `NODE_ENV=production npm run backend`

### 开发环境

- **数据库文件**: `/home/sardenesy/ai_workspaces/ai_desktop_3/data/development/enterprise_brain.db`
- **配置**: `backend/config/development.js`
- **启动命令**: `NODE_ENV=development npm run backend` (默认)

### 缺陷测试环境

- **数据库文件**: `/home/sardenesy/ai_workspaces/ai_desktop_3/data/testing/enterprise_brain.db`
- **配置**: `backend/config/testing.js`
- **启动命令**: `NODE_ENV=testing npm run backend`

## 数据持久化保证

### 1. 数据存储位置

所有数据都存储在 `data/` 目录下的SQLite数据库文件中：

```
data/
├── enterprise_brain.db  (默认数据库)
├── production/
│   └── enterprise_brain.db  (生产环境数据库)
├── development/
│   └── enterprise_brain.db  (开发环境数据库)
└── testing/
    └── enterprise_brain.db  (测试环境数据库)
```

### 2. 数据备份

系统会自动在每次启动时创建备份：

```bash
# 手动备份数据库
cp data/enterprise_brain.db data/backups/enterprise_brain_$(date +%Y%m%d_%H%M%S).db
```

### 3. 数据恢复

如果数据丢失，可以从备份恢复：

```bash
# 恢复数据库
cp data/backups/enterprise_brain_YYYYMMDD_HHMMSS.db data/enterprise_brain.db
```

## API接口

后端服务器提供以下API接口：

### 物料管理

- `GET /api/materials/list` - 获取所有物料
- `POST /api/materials/create` - 创建物料
- `POST /api/materials/batch-create` - 批量创建物料
- `PUT /api/materials/update/:id` - 更新物料
- `DELETE /api/materials/delete/:id` - 删除物料
- `DELETE /api/materials/batch-delete` - 批量删除物料
- `GET /api/materials/search?keyword=xxx` - 搜索物料

### 健康检查

- `GET /health` - 服务器健康检查

## 故障排除

### 问题1: 前端无法连接到后端

**症状**: 页面显示"无法连接到后端服务器，请确保后端服务正在运行"

**解决方案**:
1. 检查后端服务器是否正在运行：`netstat -an | grep 3005`
2. 启动后端服务器：`npm run backend`
3. 检查防火墙设置，确保3005端口未被阻止

### 问题2: 数据导入后刷新页面数据丢失

**症状**: 导入数据成功，但刷新页面后数据消失

**解决方案**:
1. 确保后端服务器正在运行
2. 检查浏览器控制台是否有API错误
3. 检查后端日志，确认数据是否成功保存到数据库

### 问题3: 数据库文件损坏

**症状**: 启动后端时报数据库错误

**解决方案**:
1. 从备份恢复数据库
2. 如果没有备份，删除数据库文件，系统会自动创建新的数据库

## 生产环境部署建议

### 1. 数据备份策略

- **每日备份**: 设置定时任务，每天备份数据库
- **版本控制**: 保留最近30天的备份
- **异地备份**: 将备份文件上传到云存储

### 2. 服务器配置

- **使用PM2管理进程**: `pm2 start backend/server.js --name enterprise-brain`
- **开机自启动**: `pm2 startup && pm2 save`
- **监控日志**: `pm2 logs enterprise-brain`

### 3. 数据库优化

- **定期VACUUM**: 压缩数据库文件
- **创建索引**: 为常用查询字段创建索引
- **定期检查**: 运行PRAGMA integrity_check

## 注意事项

1. **不要马上刷新页面**: 导入数据后，建议等待1-2秒再刷新页面，确保数据已经完全保存
2. **定期备份**: 在进行大量数据操作前，先备份数据库
3. **监控磁盘空间**: 确保data目录所在磁盘有足够空间
4. **检查日志**: 定期查看后端日志，及时发现问题

## 下一步计划

- [ ] 实现数据自动备份功能
- [ ] 添加数据导入导出工具
- [ ] 实现多用户权限管理
- [ ] 添加数据审计日志
- [ ] 实现数据同步到云端功能
