# 企业ERP数据库保护方案

## 🛡️ 数据安全措施总览

### 1. 自动备份系统

#### 备份策略
- ✅ **定时备份**：每天早上8点自动备份
- ✅ **增量备份**：每4小时自动备份一次
- ✅ **启动备份**：服务启动时立即执行备份
- ✅ **版本管理**：保留最近30个备份文件
- ✅ **压缩存储**：使用SQLite VACUUM压缩备份

#### 备份位置
```
/home/sardenesy/ai_workspaces/ai_desktop_3/data/backups/
```

#### 备份文件命名规则
```
enterprise_brain_YYYYMMDD_HHMMSS.db
示例: enterprise_brain_20251201_080000.db
```

### 2. 手动备份操作

#### 执行手动备份
```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3
node backend/scripts/backup-database.js backup
```

#### 列出所有备份
```bash
node backend/scripts/backup-database.js list
```

#### 恢复备份
```bash
node backend/scripts/backup-database.js restore <备份文件名>

# 示例
node backend/scripts/backup-database.js restore enterprise_brain_20251201_080000.db
```

### 3. 数据保护机制

#### 数据完整性保护
- ✅ **外键约束**：确保数据关联完整性
- ✅ **事务处理**：确保数据一致性
- ✅ **唯一约束**：防止重复数据
- ✅ **级联删除**：自动清理关联数据

#### 数据库表结构
```sql
-- 生产BOM主表
production_boms
  - id (主键)
  - bom_code (唯一索引)
  - ... 其他字段

-- BOM子件表
bom_components
  - id (主键)
  - bom_id (外键 -> production_boms.id)
  - ... 其他字段

-- 草稿表
production_bom_drafts
bom_draft_components
```

### 4. 数据恢复流程

#### 紧急恢复步骤
1. **停止服务**
   ```bash
   pkill -f "node backend/server.js"
   ```

2. **列出可用备份**
   ```bash
   node backend/scripts/backup-database.js list
   ```

3. **恢复指定备份**
   ```bash
   node backend/scripts/backup-database.js restore <备份文件名>
   ```

4. **重启服务**
   ```bash
   bash start-services.sh
   ```

### 5. 数据验证

#### 检查数据完整性
```bash
# 连接数据库查看数据量
cd /home/sardenesy/ai_workspaces/ai_desktop_3
node -e "const db = require('better-sqlite3')('data/enterprise_brain.db'); \
  console.log('生产BOM:', db.prepare('SELECT COUNT(*) as count FROM production_boms').get().count); \
  console.log('BOM子件:', db.prepare('SELECT COUNT(*) as count FROM bom_components').get().count); \
  console.log('物料数据:', db.prepare('SELECT COUNT(*) as count FROM materials').get().count);"
```

### 6. 性能优化措施

#### 前端优化
- ✅ **虚拟滚动**：子件数量>50时自动启用
- ✅ **唯一标识**：每个子件都有唯一ID
- ✅ **按需加载**：只渲染可见区域

#### 后端优化
- ✅ **事务优化**：批量操作使用事务
- ✅ **索引优化**：关键字段添加索引
- ✅ **查询优化**：使用prepared statements

### 7. 监控与告警

#### 备份监控
服务启动时自动输出：
```
✅ 启动备份完成，监控任务已激活
   - 每天 08:00 自动备份
   - 每隔 4小时 自动备份
```

#### 数据统计
每次备份都会显示：
```
📊 备份数据统计:
   生产BOM: XX 条
   BOM子件: XX 条
   物料数据: XX 条
```

### 8. 最佳实践

#### 日常运维
1. **定期检查备份**：每周检查备份文件是否正常
2. **验证恢复流程**：每月测试一次数据恢复
3. **监控磁盘空间**：确保有足够的备份空间
4. **导出重要数据**：定期导出Excel备份

#### 紧急情况处理
1. **数据丢失**：立即恢复最近的备份
2. **数据错误**：恢复到错误发生前的备份
3. **系统故障**：使用备份文件重建数据库

### 9. 安全建议

#### 数据保密
- 🔒 数据库文件权限：仅所有者可读写
- 🔒 备份文件加密：可选使用加密工具
- 🔒 访问控制：限制数据库访问权限
- 🔒 网络隔离：内网访问，防止外部攻击

#### 备份存储
- 💾 本地备份：`/data/backups/`
- 💾 远程备份：建议定期同步到其他服务器
- 💾 云备份：可选上传到云存储
- 💾 离线备份：定期刻录到光盘或移动硬盘

### 10. 常见问题

#### Q: 备份文件太大怎么办？
A: 使用压缩备份（已自动启用VACUUM），定期清理旧备份

#### Q: 如何查看备份文件内容？
A: 使用SQLite工具直接打开备份文件查看

#### Q: 备份会影响性能吗？
A: 备份使用只读模式，不影响正常业务

#### Q: 可以自定义备份频率吗？
A: 可以修改 `backend/scripts/auto-backup.js` 中的cron表达式

## 📞 技术支持

如有数据安全问题，请立即：
1. 停止所有操作
2. 保留当前数据库文件
3. 使用最近的备份恢复
4. 联系技术支持团队
