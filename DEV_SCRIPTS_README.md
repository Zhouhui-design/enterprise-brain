# 企业大脑系统 - 开发环境管理脚本

## 📋 脚本列表

| 脚本名称 | 功能说明 | 用途 |
|---------|---------|------|
| `start-dev.sh` | 启动开发环境 | 一键启动前后端服务 |
| `stop-dev.sh` | 停止开发环境 | 优雅停止所有服务 |
| `view-logs.sh` | 查看日志 | 交互式日志查看工具 |

## 🚀 快速开始

### 1. 启动开发环境

```bash
./start-dev.sh
```

**执行流程**:
1. ✅ 检查并停止旧服务（端口3003、3005）
2. ✅ 检查MySQL数据库连接
3. ✅ 启动后端服务（端口3005）+ 健康检查
4. ✅ 启动前端服务（端口3003）+ 健康检查
5. ✅ 显示服务状态和访问地址

**服务地址**:
- 后端API: http://localhost:3005
- 后端健康检查: http://localhost:3005/health
- 前端页面: http://localhost:3003
- 采购计划页面: http://localhost:3003/purchase/procurement-plan

### 2. 停止开发环境

```bash
./stop-dev.sh
```

**执行流程**:
1. ✅ 从PID文件读取进程ID并停止
2. ✅ 如果PID文件不存在，从端口反查进程
3. ✅ 验证所有进程已停止
4. ✅ 清理PID文件

### 3. 查看日志

```bash
./view-logs.sh
```

**交互式菜单**:
```
请选择要查看的日志:
  1) 后端日志 (实时)
  2) 前端日志 (实时)
  3) 后端日志 (最后100行)
  4) 前端日志 (最后100行)
  5) 服务状态
  6) 查看所有日志文件
  0) 退出
```

## 📁 文件结构

```
/home/sardenesy/ai_workspaces/ai_desktop_3/
├── start-dev.sh          # 启动脚本
├── stop-dev.sh           # 停止脚本
├── view-logs.sh          # 日志查看脚本
├── logs/                 # 日志目录（自动创建）
│   ├── backend.log       # 后端日志
│   ├── backend.pid       # 后端进程ID
│   ├── frontend.log      # 前端日志
│   └── frontend.pid      # 前端进程ID
├── backend/              # 后端代码
│   └── server.js
└── 07-frontend/          # 前端代码
    └── ...
```

## 🔧 脚本优化点

### ✅ 已修复的问题

1. **健康检查** - 不仅检查进程存在，还验证服务实际可用
   - 后端: 调用`/health`端点
   - 前端: 检查HTTP响应

2. **统一日志管理** - 所有日志集中在`logs/`目录
   - 原来: `backend-dev.log`、`../frontend-dev.log`（路径混乱）
   - 现在: `logs/backend.log`、`logs/frontend.log`（统一管理）

3. **PID文件管理** - 保存进程ID到文件，方便后续管理
   - `logs/backend.pid`
   - `logs/frontend.pid`

4. **MySQL检查** - 启动前检查数据库连接
   - 使用`mysql`命令测试连接
   - 失败时给出警告而非中止

5. **前端启动时间** - 增加健康检查等待时间
   - 原来: 5秒固定等待
   - 现在: 20秒循环检查（Vite编译需要时间）

6. **优雅停止** - 先尝试正常终止，失败后强制kill
   ```bash
   kill $pid         # 尝试正常终止
   sleep 1
   kill -9 $pid      # 强制终止
   ```

7. **双重查找机制** - PID文件 + 端口反查
   - 方法1: 从PID文件读取进程ID
   - 方法2: 如果PID文件不存在，从端口反查进程

## 📊 服务状态检查

### 手动检查命令

```bash
# 查看后端进程
ps aux | grep "node backend/server.js"

# 查看前端进程
ps aux | grep "npm.*dev"

# 查看端口占用
lsof -i :3005  # 后端
lsof -i :3003  # 前端

# 健康检查
curl http://localhost:3005/health  # 后端
curl http://localhost:3003         # 前端
```

### 使用view-logs.sh

```bash
./view-logs.sh
# 选择 5) 服务状态
```

输出示例:
```
📊 服务状态
=====================================

✅ 后端服务运行中
   PID: 12345
   地址: http://localhost:3005
   健康检查: ✅ 正常

✅ 前端服务运行中
   PID: 67890
   地址: http://localhost:3003
   健康检查: ✅ 正常

端口占用情况:
  3005端口: 已占用
  3003端口: 已占用
```

## 🐛 常见问题

### 问题1: 端口被占用

**症状**: 启动失败，提示端口已被占用

**解决方案**:
```bash
# 查看占用端口的进程
lsof -i :3005
lsof -i :3003

# 手动杀掉进程
kill -9 <PID>

# 或直接运行停止脚本
./stop-dev.sh
```

### 问题2: 健康检查超时

**症状**: 前端服务进程已启动，但健康检查超时

**原因**: Vite编译需要时间，尤其是首次启动

**解决方案**:
1. 等待1-2分钟后手动访问 http://localhost:3003
2. 查看前端日志: `tail -f logs/frontend.log`
3. 如果编译错误，修复后重启

### 问题3: MySQL连接失败

**症状**: 启动时提示MySQL连接失败

**解决方案**:
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 启动MySQL服务
sudo systemctl start mysql

# 测试连接
mysql -h localhost -u root -p enterprise_brain
```

### 问题4: 日志文件过大

**解决方案**:
```bash
# 清空日志文件
> logs/backend.log
> logs/frontend.log

# 或删除后重新启动
rm logs/*.log
./start-dev.sh
```

## 💡 开发建议

### 日常开发流程

1. **启动服务**
   ```bash
   ./start-dev.sh
   ```

2. **修改代码**
   - 前端代码修改会自动热重载（Vite HMR）
   - 后端代码修改需要重启服务

3. **重启服务**（后端代码修改后）
   ```bash
   ./stop-dev.sh && ./start-dev.sh
   # 或直接运行（会自动停止旧服务）
   ./start-dev.sh
   ```

4. **查看日志**
   ```bash
   # 实时查看
   ./view-logs.sh  # 选择1或2

   # 或直接使用tail
   tail -f logs/backend.log
   tail -f logs/frontend.log
   ```

### 调试技巧

1. **后端调试**
   ```bash
   # 查看最近的错误
   tail -n 100 logs/backend.log | grep -i error

   # 实时监控API请求
   tail -f logs/backend.log | grep "Request"
   ```

2. **前端调试**
   - 使用浏览器开发者工具（F12）
   - 查看Network标签页的API请求
   - 查看Console标签页的错误信息

3. **数据库调试**
   ```bash
   # 连接MySQL
   mysql -h localhost -u root -p enterprise_brain

   # 查看采购计划数据
   SELECT * FROM procurement_plans LIMIT 10;
   ```

## 🔐 安全提醒

⚠️ **注意**: 脚本中包含MySQL密码（`zH754277289hUi~197547`）

**生产环境建议**:
1. 使用环境变量存储密码
   ```bash
   export MYSQL_PASSWORD="your_password"
   ```

2. 或使用`.my.cnf`配置文件
   ```ini
   [client]
   user=root
   password=your_password
   ```

3. 修改脚本使用环境变量
   ```bash
   mysql -h localhost -u root -p"$MYSQL_PASSWORD" -e "USE enterprise_brain;"
   ```

## 📚 相关文档

- [后端API文档](backend/README.md)
- [前端开发文档](07-frontend/README.md)
- [数据库设计文档](db/README.md)

---

**最后更新**: 2025-12-16  
**维护者**: 企业大脑开发团队
