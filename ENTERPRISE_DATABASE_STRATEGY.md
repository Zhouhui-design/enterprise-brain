# 大型企业ERP数据库升级方案

## 📋 目录

1. [当前方案分析](#当前方案分析)
2. [企业级方案推荐](#企业级方案推荐)
3. [迁移路径](#迁移路径)
4. [数据安全保障](#数据安全保障)
5. [实施计划](#实施计划)

---

## 当前方案分析

### 现状

**技术栈**：Node.js + Express + SQLite
**优点**：
- ✅ 部署简单，无需单独的数据库服务器
- ✅ 文件级备份，易于理解
- ✅ 适合快速开发和原型验证

**缺点**：
- ❌ **并发性能差**：写操作会锁定整个数据库
- ❌ **扩展性有限**：无法支持多服务器部署
- ❌ **数据量限制**：不适合超过1TB的数据
- ❌ **无版本控制**：数据库结构变更难以追踪
- ❌ **备份恢复复杂**：大文件备份恢复时间长

### 风险评估

| 风险项 | 严重程度 | 影响 |
|--------|---------|------|
| 数据丢失 | 🔴 高 | 文件损坏无法恢复 |
| 并发冲突 | 🔴 高 | 多用户同时写入导致数据不一致 |
| 性能瓶颈 | 🟡 中 | 数据量增长后查询变慢 |
| 扩展困难 | 🔴 高 | 无法支持集群部署 |

---

## 企业级方案推荐

### 方案架构

```
┌─────────────────────────────────────────────────────────────┐
│                         应用层                              │
│  Vue 3 前端 + Node.js API + Java Spring Boot 后端          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      连接池层                               │
│              HikariCP (Java) / pg-pool (Node.js)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    读写分离中间件                           │
│                  PgBouncer / ProxySQL                      │
└─────────────────────────────────────────────────────────────┘
         ↓                                    ↓
┌──────────────────┐              ┌──────────────────────────┐
│   主数据库 (写)   │  ═══同步═══>│   从数据库 (读)          │
│  PostgreSQL 14+  │              │  PostgreSQL 14+ (多个)   │
└──────────────────┘              └──────────────────────────┘
         ↓                                    ↓
┌──────────────────┐              ┌──────────────────────────┐
│  数据库迁移管理   │              │    定时备份             │
│  Flyway / SQL    │              │  pg_dump + 增量备份     │
└──────────────────┘              └──────────────────────────┘
```

### 技术选型

#### 1. 数据库：PostgreSQL 14+

**选择理由**：
- ✅ **MVCC并发控制**：读写互不阻塞，支持高并发
- ✅ **丰富的数据类型**：JSON/JSONB、数组、全文搜索
- ✅ **强大的索引**：B-tree、GiST、GIN、BRIN等
- ✅ **分区表支持**：轻松管理TB级数据
- ✅ **扩展生态**：PostGIS、TimescaleDB等
- ✅ **企业级特性**：物化视图、触发器、存储过程

#### 2. 迁移工具：Flyway

**选择理由**：
- ✅ **版本控制**：每个SQL脚本都有版本号
- ✅ **增量迁移**：只执行未执行的脚本
- ✅ **回滚支持**：可以撤销变更
- ✅ **团队协作**：避免数据库结构冲突
- ✅ **CI/CD集成**：自动化部署

#### 3. 备份方案：pg_dump + WAL归档

**策略**：
- 📅 **每日全量备份**：pg_dump导出整个数据库
- 🔄 **实时WAL归档**：增量备份，RPO < 1分钟
- 🌍 **异地备份**：上传到云存储（阿里云OSS/腾讯云COS）
- 📦 **备份保留策略**：7天内每日，4周内每周，12个月内每月

---

## 迁移路径

### 阶段1：准备阶段 (1-2周)

#### 1.1 环境搭建

```bash
# 安装PostgreSQL 14
sudo apt install postgresql-14 postgresql-contrib-14

# 启动PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE enterprise_brain;
CREATE USER app_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE enterprise_brain TO app_user;
```

#### 1.2 配置Flyway

**pom.xml添加依赖**：
```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
```

**application.yml配置**：
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/enterprise_brain
    username: app_user
    password: your_secure_password
    driver-class-name: org.postgresql.Driver
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration
    encoding: UTF-8
```

### 阶段2：数据迁移 (2-3周)

#### 2.1 数据导出

```javascript
// backend/scripts/export-sqlite-data.js
const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('./data/enterprise_brain.db');

// 导出物料数据
const materials = db.prepare('SELECT * FROM materials').all();
fs.writeFileSync(
  './migration/materials.json',
  JSON.stringify(materials, null, 2)
);

// 导出BOM数据
const boms = db.prepare('SELECT * FROM production_boms').all();
fs.writeFileSync(
  './migration/boms.json',
  JSON.stringify(boms, null, 2)
);

console.log('数据导出完成');
```

#### 2.2 创建迁移脚本

**V1.0.0__create_base_tables.sql**：
```sql
-- 创建物料表
CREATE TABLE materials (
    id BIGSERIAL PRIMARY KEY,
    material_code VARCHAR(50) UNIQUE NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    -- ... 其他字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    version INTEGER DEFAULT 0,  -- 乐观锁版本号
    deleted BOOLEAN DEFAULT FALSE  -- 软删除标记
);

-- 创建索引
CREATE INDEX idx_materials_code ON materials(material_code);
CREATE INDEX idx_materials_name ON materials(material_name);
CREATE INDEX idx_materials_created_at ON materials(created_at);

-- 创建BOM表
CREATE TABLE production_boms (
    id BIGSERIAL PRIMARY KEY,
    bom_code VARCHAR(50) UNIQUE NOT NULL,
    product_code VARCHAR(50) NOT NULL,
    -- ... 其他字段
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建分区表（按年份分区，适合大数据量）
CREATE TABLE sales_orders (
    id BIGSERIAL NOT NULL,
    order_code VARCHAR(50) NOT NULL,
    order_date DATE NOT NULL,
    -- ... 其他字段
    PRIMARY KEY (id, order_date)
) PARTITION BY RANGE (order_date);

-- 创建分区
CREATE TABLE sales_orders_2024 PARTITION OF sales_orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE sales_orders_2025 PARTITION OF sales_orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

#### 2.3 数据导入

```javascript
// backend/scripts/import-to-postgres.js
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'app_user',
  host: 'localhost',
  database: 'enterprise_brain',
  password: 'your_secure_password',
  port: 5432,
});

async function importData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 导入物料数据
    const materials = JSON.parse(fs.readFileSync('./migration/materials.json'));
    for (const material of materials) {
      await client.query(
        `INSERT INTO materials 
         (material_code, material_name, ...) 
         VALUES ($1, $2, ...)`,
        [material.material_code, material.material_name, ...]
      );
    }
    
    await client.query('COMMIT');
    console.log('数据导入成功');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('数据导入失败:', error);
  } finally {
    client.release();
  }
}

importData();
```

### 阶段3：并行运行 (1个月)

**双写策略**：
```javascript
// 同时写入SQLite和PostgreSQL
async function saveMaterial(material) {
  // 写入SQLite（保底）
  await sqliteService.saveMaterial(material);
  
  // 写入PostgreSQL（新系统）
  try {
    await postgresService.saveMaterial(material);
  } catch (error) {
    console.error('PostgreSQL写入失败，已记录到日志');
    // 记录失败，后续补偿
  }
}
```

### 阶段4：切换上线 (1周)

1. **停止应用**
2. **最后一次数据同步**
3. **修改应用配置**：指向PostgreSQL
4. **启动应用**
5. **监控运行**

---

## 数据安全保障

### 1. 备份策略

#### 1.1 自动备份脚本

```bash
#!/bin/bash
# /home/sardenesy/scripts/backup-postgres.sh

# 配置
DB_NAME="enterprise_brain"
DB_USER="app_user"
BACKUP_DIR="/data/backups/postgres"
RETENTION_DAYS=30

# 创建备份目录
mkdir -p $BACKUP_DIR

# 全量备份
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump -U $DB_USER -d $DB_NAME | gzip > $BACKUP_FILE

# 上传到云存储（可选）
# aliyun oss cp $BACKUP_FILE oss://your-bucket/backups/

# 清理旧备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "备份完成: $BACKUP_FILE"
```

#### 1.2 定时任务

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点执行备份
0 2 * * * /home/sardenesy/scripts/backup-postgres.sh >> /var/log/pg-backup.log 2>&1

# 每小时归档WAL
0 * * * * /usr/lib/postgresql/14/bin/pg_receivewal -D /data/wal_archive -d enterprise_brain
```

### 2. 数据恢复

#### 2.1 从备份恢复

```bash
# 恢复完整备份
gunzip -c /data/backups/postgres/backup_20250130_020000.sql.gz | psql -U app_user -d enterprise_brain

# 恢复到指定时间点（PITR）
pg_restore -U app_user -d enterprise_brain -t 2025-01-30 12:00:00 /data/backups/postgres/backup_20250130_020000.sql.gz
```

#### 2.2 灾难恢复计划

| 场景 | RTO (恢复时间) | RPO (数据丢失) | 恢复步骤 |
|------|---------------|---------------|---------|
| 数据误删 | 10分钟 | 0 | 从备份恢复特定表 |
| 数据库损坏 | 1小时 | < 1分钟 | WAL归档+最新备份 |
| 服务器故障 | 2小时 | < 5分钟 | 主从切换 |
| 机房灾难 | 4小时 | < 1小时 | 异地备份恢复 |

### 3. 版本管理

#### 3.1 Flyway脚本规范

```
db/migration/
├── V1.0.0__create_base_tables.sql
├── V1.0.1__add_material_indexes.sql
├── V1.1.0__create_sales_module.sql
├── V1.1.1__alter_sales_orders.sql
├── V1.2.0__create_purchase_module.sql
└── R__refresh_materialized_views.sql  # 可重复执行的脚本
```

**命名规范**：
- `V` 开头：版本迁移脚本（只执行一次）
- `R` 开头：可重复脚本（每次都执行）
- 格式：`V{版本号}__{描述}.sql`
- 版本号：`主版本.次版本.修订版本`

#### 3.2 变更审核流程

```mermaid
graph LR
    A[开发人员创建SQL脚本] --> B[本地测试]
    B --> C[提交到Git]
    C --> D[代码审查]
    D --> E[测试环境验证]
    E --> F[生产环境部署]
    F --> G[回滚脚本准备]
```

### 4. 监控告警

#### 4.1 关键指标监控

```yaml
# Prometheus监控配置
scrape_configs:
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    metrics_path: /metrics
    
# 告警规则
groups:
  - name: postgres
    rules:
      - alert: PostgreSQLDown
        expr: pg_up == 0
        for: 1m
        annotations:
          summary: "PostgreSQL数据库宕机"
      
      - alert: HighConnectionUsage
        expr: pg_stat_database_numbackends / pg_settings_max_connections > 0.8
        for: 5m
        annotations:
          summary: "数据库连接使用率超过80%"
      
      - alert: SlowQuery
        expr: pg_stat_statements_mean_time_ms > 1000
        for: 5m
        annotations:
          summary: "存在慢查询，平均执行时间超过1秒"
```

---

## 实施计划

### 时间线

```
Week 1-2:  环境搭建 + Flyway配置
Week 3-4:  数据迁移脚本开发
Week 5-6:  数据迁移测试
Week 7-10: 双写并行运行
Week 11:   切换上线
Week 12:   监控优化
```

### 里程碑

- [ ] **M1**: PostgreSQL环境搭建完成
- [ ] **M2**: 所有迁移脚本编写完成
- [ ] **M3**: 测试环境数据迁移成功
- [ ] **M4**: 双写机制运行稳定
- [ ] **M5**: 生产环境切换完成
- [ ] **M6**: 性能优化完成，SQLite下线

### 成功标准

1. ✅ 数据完整性：100%数据迁移成功，无丢失
2. ✅ 性能提升：查询响应时间 < 100ms（90分位）
3. ✅ 高可用性：99.9%可用性（月故障时间 < 43分钟）
4. ✅ 备份恢复：RTO < 2小时，RPO < 5分钟
5. ✅ 扩展性：支持10倍数据增长无需架构调整

---

## 成本估算

### 硬件成本

| 项目 | 配置 | 月成本 (云服务器) |
|------|------|-----------------|
| 主数据库服务器 | 8核16G + 500G SSD | ¥800 |
| 从数据库服务器(2台) | 4核8G + 200G SSD | ¥500×2 |
| 对象存储(备份) | 1TB | ¥100 |
| **总计** | | **¥1,900/月** |

### 人力成本

- 数据库工程师：1人×2个月 = ¥40,000
- 后端开发工程师：2人×3个月 = ¥90,000
- 测试工程师：1人×1个月 = ¥15,000
- **总计**：¥145,000

### ROI分析

**投入**：¥145,000（一次性） + ¥1,900/月（运营）

**收益**：
- 数据安全性提升：避免数据丢失损失（无法估量）
- 系统性能提升：50%运营效率提升 ≈ ¥50,000/月
- 扩展能力：支持3-5年业务增长，延迟重构成本 ≈ ¥500,000

**回收期**：约3个月

---

## 附录

### A. PostgreSQL优化清单

```sql
-- 连接池配置
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 16MB
maintenance_work_mem = 1GB

-- 写入优化
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

-- 查询优化
random_page_cost = 1.1  -- SSD
effective_io_concurrency = 200
```

### B. 常用运维命令

```bash
# 查看数据库大小
SELECT pg_size_pretty(pg_database_size('enterprise_brain'));

# 查看表大小
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# 查看慢查询
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

# 分析查询计划
EXPLAIN ANALYZE SELECT * FROM materials WHERE material_code = 'M2024001';

# 重建索引
REINDEX TABLE materials;

# 清理死元组
VACUUM ANALYZE materials;
```

### C. 参考资料

- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [Flyway官方文档](https://flywaydb.org/documentation/)
- [数据库可靠性工程](https://landing.google.com/sre/book.html)
- [高性能MySQL](https://www.oreilly.com/library/view/high-performance-mysql/9781449332471/)

---

## 联系方式

**技术支持**：database-team@enterprise-brain.com  
**紧急热线**：7×24小时数据库值班电话

---

**文档版本**：v1.0  
**最后更新**：2025-01-30  
**维护团队**：Enterprise Brain 数据库团队
