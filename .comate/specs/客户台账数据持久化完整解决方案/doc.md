# 客户台账数据持久化完整解决方案

## 需求场景具体处理逻辑

客户台账是企业ERP系统的核心主数据，当前面临数据丢失的严重问题：
1. **问题现状**：原本有4个客户信息，经过代码更新和服务器重启后，只剩下1条数据（客户编号=C2025001）
2. **根本原因**：前端页面过度依赖localStorage存储，与数据库同步机制不完善
3. **业务影响**：客户数据作为主数据，其丢失会严重影响销售订单、生产计划等关联业务

## 架构技术方案

### 1. 数据存储策略
- **主存储**：MySQL数据库作为唯一真实数据源
- **缓存层**：localStorage仅作为临时缓存和离线支持
- **同步机制**：实时双向同步，确保数据一致性

### 2. 数据保护机制
- **自动备份**：每日定时备份客户数据到备份表
- **事务保护**：所有数据库操作使用事务确保原子性
- **数据验证**：前后端双重数据校验机制

### 3. 容灾恢复
- **备份恢复**：支持从历史备份快速恢复数据
- **操作日志**：记录所有数据变更操作，支持审计和回滚

## 影响文件

### 后端文件修改
1. **backend/routes/customers.js** - 增强API稳定性和错误处理
2. **backend/config/database.js** - 添加客户数据备份和恢复机制
3. **新增backup脚本** - 客户数据自动备份服务

### 前端文件修改
1. **07-frontend/src/pages/sales/customers/CustomerList.vue** - 重构数据管理逻辑
2. **07-frontend/src/api/customer.js** - 优化API调用和错误处理
3. **新增数据同步服务** - 前端数据同步管理器

### 数据库表结构
1. **customers表** - 现有客户表（已存在）
2. **customers_backup表** - 客户数据备份表（新增）
3. **customers_operation_log表** - 操作日志表（新增）

## 实现细节

### 1. 后端数据保护机制

```javascript
// 自动备份函数
async function backupCustomerData() {
  const connection = await pool.getConnection();
  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const backupTable = `customers_backup_${timestamp}`;
    
    // 创建备份表
    await connection.execute(`
      CREATE TABLE ${backupTable} AS SELECT * FROM customers
    `);
    
    // 记录备份日志
    await connection.execute(`
      INSERT INTO backup_logs (table_name, backup_table, backup_time, record_count)
      VALUES ('customers', ?, ?, (SELECT COUNT(*) FROM customers))
    `, [backupTable, new Date()]);
    
    console.log(`✅ 客户数据备份完成: ${backupTable}`);
  } finally {
    connection.release();
  }
}
```

### 2. 前端数据同步重构

```javascript
// 数据同步管理器
class CustomerDataManager {
  constructor() {
    this.apiData = [];
    this.localData = [];
    this.lastSyncTime = null;
  }
  
  // 智能同步策略
  async syncData() {
    try {
      // 1. 优先从API获取最新数据
      const apiResponse = await customerApi.getCustomers();
      this.apiData = apiResponse.data.data.list;
      
      // 2. 与本地数据对比，检测冲突
      const conflicts = this.detectConflicts();
      
      // 3. 处理冲突和数据合并
      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts);
      }
      
      // 4. 更新本地存储
      this.updateLocalData();
      
      this.lastSyncTime = new Date();
      return true;
    } catch (error) {
      console.error('数据同步失败:', error);
      // 降级到本地数据
      return false;
    }
  }
}
```

### 3. 数据库备份表结构

```sql
-- 客户数据备份表
CREATE TABLE IF NOT EXISTS customers_backup_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  backup_id VARCHAR(50) NOT NULL,
  customer_id INT NOT NULL,
  customer_code VARCHAR(100) NOT NULL,
  customer_name VARCHAR(200) NOT NULL,
  customer_type VARCHAR(50) DEFAULT 'regular',
  status VARCHAR(50) DEFAULT 'active',
  contact_person VARCHAR(100),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(100),
  company VARCHAR(200),
  industry VARCHAR(100),
  region VARCHAR(100),
  contact_address VARCHAR(500),
  credit_limit DECIMAL(15,2) DEFAULT 0.00,
  sales_person VARCHAR(100),
  tax_number VARCHAR(100),
  remark TEXT,
  created_by VARCHAR(100) DEFAULT 'admin',
  updated_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  backup_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  operation_type VARCHAR(20) COMMENT 'backup/restore/sync',
  INDEX idx_backup_id (backup_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_backup_time (backup_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户数据备份历史表';
```

### 4. 操作日志表

```sql
-- 客户操作日志表
CREATE TABLE IF NOT EXISTS customers_operation_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  customer_code VARCHAR(100),
  operation_type VARCHAR(20) NOT NULL COMMENT 'CREATE/UPDATE/DELETE/RESTORE',
  operation_data JSON COMMENT '操作前后的数据对比',
  operator VARCHAR(100) DEFAULT 'admin',
  operation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50),
  user_agent TEXT,
  INDEX idx_customer_id (customer_id),
  INDEX idx_operation_type (operation_type),
  INDEX idx_operation_time (operation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='客户操作日志表';
```

## 边界条件与异常处理

### 1. 网络异常处理
- **断网情况**：优先使用localStorage缓存数据，标记为离线模式
- **网络恢复**：自动触发数据同步，处理冲突
- **API超时**：实现重试机制，最多3次重试

### 2. 数据冲突处理
- **时间戳优先**：以最新修改时间为准
- **人工干预**：严重冲突时提示用户手动选择
- **版本控制**：保留多个版本，支持回滚

### 3. 数据完整性检查
- **必填字段验证**：customer_name等核心字段不能为空
- **数据格式检查**：电话、邮箱等字段格式验证
- **重复数据检测**：customer_code唯一性检查

## 数据流动路径

### 1. 正常数据流程
```
用户操作 → 前端验证 → API调用 → 数据库事务 → 备份记录 → 返回结果 → 前端更新 → 本地缓存
```

### 2. 数据同步流程
```
页面加载 → 检查网络 → API获取数据 → 对比本地数据 → 处理冲突 → 更新显示 → 记录日志
```

### 3. 备份恢复流程
```
触发恢复 → 选择备份点 → 验证数据 → 执行恢复 → 更新缓存 → 通知前端 → 记录操作
```

## 预期成果

### 1. 数据安全性
- **零数据丢失**：确保客户数据在任何情况下都不会丢失
- **多重备份**：自动备份+手动备份+操作日志
- **快速恢复**：支持分钟级数据恢复

### 2. 系统稳定性
- **容错能力**：网络异常时不影响基本功能
- **性能优化**：智能缓存减少API调用
- **用户体验**：离线也可查看和编辑数据

### 3. 可维护性
- **操作审计**：完整的操作日志记录
- **数据追踪**：每次变更都有完整记录
- **监控告警**：异常情况及时通知

### 4. 业务连续性
- **主数据保护**：客户数据作为核心主数据得到重点保护
- **关联数据一致**：确保与销售订单等关联数据的一致性
- **扩展性**：架构设计支持未来功能扩展

## 技术指标

- **数据可用性**：99.9%以上
- **备份频率**：每日自动备份 + 重要操作即时备份
- **恢复时间**：5分钟内完成数据恢复
- **数据同步延迟**：正常情况下<3秒
- **并发支持**：支持100+用户同时操作

## 风险控制

### 1. 技术风险
- **数据库性能**：通过索引优化和分页查询控制
- **存储空间**：定期清理过期备份数据
- **并发冲突**：使用乐观锁和事务控制

### 2. 操作风险
- **误删除保护**：软删除+回收站机制
- **权限控制**：不同角色有不同的操作权限
- **操作确认**：重要操作需要二次确认

### 3. 业务风险
- **数据准确性**：多重校验确保数据质量
- **合规要求**：满足数据安全和隐私保护要求
- **审计支持**：提供完整的审计追踪功能
