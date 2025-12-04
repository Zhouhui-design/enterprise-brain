# 数据库配置说明 - SQLite与MySQL对比

**创建时间:** 2025-12-02  
**状态:** ✅ 已完成

---

## 📋 当前数据库配置

### 当前使用的数据库: **SQLite**

**数据库文件位置:**
```
/home/sardenesy/ai_workspaces/ai_desktop_3/data/enterprise_brain.db
```

**配置文件:**
```
backend/config/database.js
```

**连接代码:**
```javascript
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/enterprise_brain.db');
const db = new Database(dbPath, { 
  verbose: console.log,
  fileMustExist: false
});
```

---

## 🔍 SQLite vs MySQL 对比

### 1. SQLite（当前使用）

#### ✅ 优点
- **零配置** - 无需安装数据库服务器
- **轻量级** - 单个文件存储所有数据
- **易于备份** - 直接复制.db文件即可
- **无需管理** - 无需维护数据库服务
- **适合小团队** - 适合10人以下的工厂使用
- **跨平台** - Windows/Linux/Mac都支持
- **性能优秀** - 对于中小型数据量性能很好

#### ❌ 缺点
- **并发限制** - 写操作会锁定整个数据库
- **网络访问** - 不适合分布式部署
- **数据量限制** - 超过几GB性能会下降
- **多用户同时写入** - 可能产生锁等待

#### 📊 适用场景
- ✅ 单个工厂（1个服务器）
- ✅ 10人以内同时使用
- ✅ 数据量小于1GB
- ✅ 主要是读操作,写操作较少
- ✅ 不需要复杂的数据库管理

---

### 2. MySQL

#### ✅ 优点
- **高并发** - 支持大量用户同时读写
- **网络访问** - 支持多台电脑连接同一数据库
- **数据量大** - 支持TB级别数据
- **高可用** - 主从复制、集群等
- **功能丰富** - 存储过程、触发器等
- **成熟稳定** - 企业级应用广泛使用

#### ❌ 缺点
- **需要安装** - 需要安装MySQL服务器
- **需要配置** - 需要创建数据库、用户、权限
- **需要维护** - 需要定期备份、优化
- **资源消耗** - 需要更多内存和CPU
- **学习成本** - 需要了解MySQL管理

#### 📊 适用场景
- ✅ 多个工厂（多个服务器）
- ✅ 50人以上同时使用
- ✅ 数据量大于10GB
- ✅ 需要高并发读写
- ✅ 需要分布式部署

---

## 🎯 建议

### 当前阶段建议：**继续使用SQLite**

**理由：**

1. **您的场景适合SQLite**
   - 单个工厂使用
   - 人员不多（估计10-30人）
   - 数据量不大（初期）
   - 主要是订单、BOM、物料等数据

2. **SQLite已经满足需求**
   - ✅ 数据持久化
   - ✅ 多终端同步（通过同步服务）
   - ✅ 手机端访问（浏览器访问）
   - ✅ 性能足够

3. **成本低**
   - 无需额外部署MySQL
   - 无需数据库管理员
   - 备份简单（复制文件）

### 何时迁移到MySQL？

**当出现以下情况时，建议迁移到MySQL：**

1. ⚠️ **多个工厂同时使用**
   - 2个以上工厂需要共享数据
   - 需要实时同步数据

2. ⚠️ **用户数超过30人**
   - 同时在线用户超过30人
   - 经常出现写操作等待

3. ⚠️ **数据量超过1GB**
   - 数据库文件超过1GB
   - 查询速度明显变慢

4. ⚠️ **需要高可用**
   - 不能接受短暂的服务中断
   - 需要主从备份

---

## 🔧 如何迁移到MySQL（如果需要）

### 步骤1：安装MySQL

```bash
# Ubuntu/Debian
sudo apt-get install mysql-server

# CentOS/RHEL
sudo yum install mysql-server
```

### 步骤2：创建数据库

```sql
CREATE DATABASE enterprise_brain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'enterprise'@'%' IDENTIFIED BY '您的密码';
GRANT ALL PRIVILEGES ON enterprise_brain.* TO 'enterprise'@'%';
FLUSH PRIVILEGES;
```

### 步骤3：修改后端配置

**修改 `backend/config/database.js`:**

```javascript
// 原SQLite配置
// const Database = require('better-sqlite3');
// const db = new Database(dbPath, { ... });

// 改为MySQL配置
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'enterprise',
  password: '您的密码',
  database: 'enterprise_brain',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### 步骤4：迁移数据

```javascript
// 使用迁移脚本（我可以帮您创建）
node scripts/migrate-sqlite-to-mysql.js
```

### 步骤5：修改API代码

```javascript
// SQLite语法
const result = db.prepare('SELECT * FROM materials').all()

// 改为MySQL语法
const [rows] = await pool.query('SELECT * FROM materials')
```

---

## 📱 手机端同步说明

### 当前方案（SQLite + 同步服务）

**架构:**
```
手机浏览器
    ↓ HTTP请求
前端服务器 (Vite, localhost:3001)
    ↓ API调用
后端服务器 (Express, localhost:3005)
    ↓ 读写
SQLite数据库 (enterprise_brain.db)
    ↑↓
数据同步服务 (dataSyncService.js)
    ↓ 5分钟定时同步
其他终端
```

**支持的手机系统:**
- ✅ 鸿蒙系统浏览器
- ✅ 安卓Chrome/Firefox
- ✅ 苹果Safari
- ✅ 所有支持HTML5的浏览器

**访问方式:**
```
手机浏览器打开: http://服务器IP:3001
```

**同步机制:**
- 自动同步: 每5分钟
- 手动同步: 点击刷新按钮
- 离线缓存: LocalStorage
- 冲突解决: 后写入优先

---

## 💾 数据备份建议

### SQLite备份

**方法1：文件复制（推荐）**
```bash
# 备份
cp data/enterprise_brain.db data/backup/enterprise_brain_$(date +%Y%m%d).db

# 恢复
cp data/backup/enterprise_brain_20251202.db data/enterprise_brain.db
```

**方法2：SQLite命令**
```bash
# 备份
sqlite3 data/enterprise_brain.db ".backup 'backup.db'"

# 导出为SQL
sqlite3 data/enterprise_brain.db ".dump" > backup.sql
```

**自动备份脚本:**
```bash
#!/bin/bash
# 每天自动备份
BACKUP_DIR="/path/to/backup"
DATE=$(date +%Y%m%d)
cp data/enterprise_brain.db "$BACKUP_DIR/enterprise_brain_$DATE.db"

# 保留最近30天的备份
find "$BACKUP_DIR" -name "enterprise_brain_*.db" -mtime +30 -delete
```

---

## 🎊 总结

### 当前配置（推荐保持）

| 项目 | 配置 |
|------|------|
| 数据库类型 | SQLite |
| 数据库文件 | `/data/enterprise_brain.db` |
| 前端服务 | Vite @ localhost:3001 |
| 后端服务 | Express @ localhost:3005 |
| 数据同步 | dataSyncService (5分钟) |
| 手机访问 | 浏览器访问服务器IP:3001 |
| 备份方式 | 文件复制 |

### 何时需要改变？

**只有当以下情况发生时，才考虑迁移到MySQL：**
1. 多个工厂需要共享数据
2. 同时在线用户超过30人
3. 数据量超过1GB
4. 出现明显的性能问题

**否则，SQLite完全够用！** ✅

---

## 📞 技术支持

如有问题，请随时反馈：
- 性能问题
- 同步问题
- 备份问题
- 迁移需求

我会及时协助解决！🚀
