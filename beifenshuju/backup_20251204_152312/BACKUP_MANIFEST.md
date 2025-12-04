# 企业大脑系统 - 数据备份清单

## 备份信息
- 备份时间: 2025-12-04 15:23:12
- 备份目录: /home/sardenesy/enterprise-brain-backup/backup_20251204_152312
- 操作系统: Linux sardenesy-Rack-Server 6.14.0-36-generic #36~24.04.1-Ubuntu SMP PREEMPT_DYNAMIC Wed Oct 15 15:45:17 UTC 2 x86_64 x86_64 x86_64 GNU/Linux

## 备份内容

### 1. 前端数据 (frontend-data/)
- LocalStorage数据（需手动备份）
- 详见目录下的README.md

### 2. 后端数据库 (backend-database/)
- ❌ enterprise_brain.db (未找到)

### 3. 配置文件 (configs/)
- ✅  ()
- ✅ database.js (16K)

### 4. 上传文件 (uploads/)
- ℹ️  无上传文件

### 5. 文档文件 (documents/)
85 个文档文件

## 恢复步骤

### 恢复前端数据
1. 打开浏览器访问系统
2. 按F12打开开发者工具
3. 参考 frontend-data/README.md 中的恢复步骤

### 恢复后端数据库
```bash
# 复制数据库文件到新系统
cp /home/sardenesy/enterprise-brain-backup/backup_20251204_152312/backend-database/enterprise_brain.db /path/to/new/backend/
```

### 恢复配置文件
```bash
# 复制配置文件到对应目录
cp /home/sardenesy/enterprise-brain-backup/backup_20251204_152312/configs/.env.* /path/to/new/07-frontend/
cp /home/sardenesy/enterprise-brain-backup/backup_20251204_152312/configs/database.js /path/to/new/backend/config/
```

### 恢复上传文件
```bash
# 复制上传文件到新系统
cp -r /home/sardenesy/enterprise-brain-backup/backup_20251204_152312/uploads/* /path/to/new/uploads/
```

## 验证清单
- [ ] 前端LocalStorage数据已恢复
- [ ] 后端数据库已恢复
- [ ] 配置文件已恢复
- [ ] 上传文件已恢复
- [ ] 系统可正常访问
- [ ] 数据完整性检查通过

