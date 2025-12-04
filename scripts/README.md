# 企业大脑数据备份和恢复脚本使用指南

## 📋 目录

1. [快速开始](#快速开始)
2. [数据恢复](#数据恢复)
3. [数据备份](#数据备份)
4. [常见问题](#常见问题)

---

## 🚀 快速开始

### 立即恢复数据（推荐）

```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3

# 方式1：使用Web恢复工具（最简单）
./scripts/restore-browser-data.sh --tool

# 方式2：快速恢复最新备份
./scripts/restore-browser-data.sh --quick
```

### 备份当前数据

```bash
# 完整备份（配置、文档、数据库）
./scripts/backup-browser-data.sh

# 然后在浏览器中备份浏览器数据
# 访问: http://localhost:8888/scripts/browser-data-restore.html
# 点击"💾 备份当前数据"
```

---

## 🔄 数据恢复

### 方式1：Web恢复工具（推荐）⭐

**步骤：**

1. **启动恢复工具服务器**
   ```bash
   cd /home/sardenesy/ai_workspaces/ai_desktop_3
   ./scripts/restore-browser-data.sh --tool
   ```

2. **在浏览器中打开**
   ```
   http://localhost:8888/scripts/browser-data-restore.html
   ```

3. **选择备份文件**
   - 点击"📁 选择备份文件"
   - 选择备份文件：`/home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/localStorage_backup_*.json`
   - 最新备份通常是文件名时间戳最大的

4. **恢复数据**
   - 点击"🔄 恢复数据"
   - 等待进度条完成
   - 查看日志确认恢复成功
   - 刷新页面

**特点：**
- ✅ 可视化界面，操作简单
- ✅ 实时进度显示
- ✅ 详细日志输出
- ✅ 数据统计展示
- ✅ 支持备份和恢复

---

### 方式2：命令行快速恢复

```bash
# 列出所有可用备份
./scripts/restore-browser-data.sh --list

# 从最新备份恢复
./scripts/restore-browser-data.sh --quick

# 从指定JSON文件恢复
./scripts/restore-browser-data.sh --file /path/to/backup.json

# 从指定备份目录恢复（包括配置和数据库）
./scripts/restore-browser-data.sh /home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/backup_20241204_152312
```

---

### 方式3：浏览器控制台手动恢复

**适用场景：** Web工具无法使用时

1. **打开系统页面**
   ```
   http://localhost:3001
   ```

2. **打开开发者工具**
   - 按 `F12` 或 `Ctrl+Shift+I`
   - 切换到 `Console` 标签页

3. **执行恢复脚本**
   ```javascript
   // 步骤1：读取备份文件（需要手动复制备份文件内容）
   const backupData = {
       // 将备份文件内容粘贴到这里
       // 或使用 fetch 从文件读取
   };
   
   // 步骤2：恢复LocalStorage
   Object.keys(backupData).forEach(key => {
       if (key !== 'enterpriseBrain_backup') {
           localStorage.setItem(key, backupData[key]);
       }
   });
   
   // 步骤3：恢复IndexedDB
   if (backupData.enterpriseBrain_backup) {
       const dbData = JSON.parse(backupData.enterpriseBrain_backup);
       
       const db = await new Promise((resolve) => {
           const request = indexedDB.open('EnterpriseBrainDB', 3);
           request.onsuccess = (e) => resolve(e.target.result);
       });
       
       const saveAll = async (storeName, data) => {
           if (!data || data.length === 0) return;
           const tx = db.transaction([storeName], 'readwrite');
           const store = tx.objectStore(storeName);
           for (const item of data) {
               store.put(item);
           }
       };
       
       await saveAll('materials', dbData.materials);
       await saveAll('boms', dbData.boms);
       await saveAll('productionBoms', dbData.productionBoms);
       await saveAll('salesBoms', dbData.salesBoms);
       await saveAll('designBoms', dbData.designBoms);
       await saveAll('productionBomDrafts', dbData.productionBomDrafts);
       await saveAll('salesBomDrafts', dbData.salesBomDrafts);
       await saveAll('designBomDrafts', dbData.designBomDrafts);
   }
   
   console.log('✅ 恢复完成！');
   location.reload();
   ```

---

## 💾 数据备份

### 方式1：使用Web备份工具（推荐）⭐

1. **访问备份工具**
   ```
   http://localhost:8888/scripts/browser-data-restore.html
   ```

2. **点击"💾 备份当前数据"**
   - 自动导出所有数据
   - 文件自动下载
   - 保存到安全位置

3. **移动到备份目录**
   ```bash
   mv ~/Downloads/localStorage_backup_*.json /home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/
   ```

---

### 方式2：使用备份脚本

```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3

# 执行备份脚本（会备份配置、文档、数据库）
./scripts/backup-browser-data.sh

# 然后访问Web工具备份浏览器数据
# http://localhost:8888/scripts/browser-data-restore.html
```

**备份内容：**
- ✅ 配置文件（.env.development、.env.production、database.js）
- ✅ 文档文件（所有.md文件）
- ✅ 后端数据库（enterprise_brain.db）
- ⚠️ 浏览器数据（需手动使用Web工具）

**备份位置：**
```
/home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/
├── backup_YYYYMMDD_HHMMSS/          # 备份目录
├── backup_YYYYMMDD_HHMMSS.tar.gz    # 压缩包
└── localStorage_backup_*.json        # 浏览器数据备份
```

---

### 方式3：浏览器控制台手动备份

```javascript
// 在浏览器控制台执行
(async function() {
    const backupData = {};
    
    // 备份LocalStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        backupData[key] = localStorage.getItem(key);
    }
    
    // 备份IndexedDB
    const db = await new Promise((resolve) => {
        const request = indexedDB.open('EnterpriseBrainDB', 3);
        request.onsuccess = (e) => resolve(e.target.result);
    });
    
    const dbBackup = { exportTime: new Date().toISOString(), version: 3 };
    
    const getAll = (storeName) => new Promise((resolve) => {
        if (!db.objectStoreNames.contains(storeName)) {
            resolve([]);
            return;
        }
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
    });
    
    dbBackup.materials = await getAll('materials');
    dbBackup.boms = await getAll('boms');
    dbBackup.productionBoms = await getAll('productionBoms');
    dbBackup.salesBoms = await getAll('salesBoms');
    dbBackup.designBoms = await getAll('designBoms');
    dbBackup.productionBomDrafts = await getAll('productionBomDrafts');
    dbBackup.salesBomDrafts = await getAll('salesBomDrafts');
    dbBackup.designBomDrafts = await getAll('designBomDrafts');
    
    backupData.enterpriseBrain_backup = JSON.stringify(dbBackup);
    
    // 下载备份文件
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localStorage_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ 备份完成！');
})();
```

---

## 🔧 常见问题

### Q1: 恢复工具页面无法访问？

**解决方案：**
```bash
# 检查服务是否运行
lsof -i :8888

# 如果没有运行，启动服务
cd /home/sardenesy/ai_workspaces/ai_desktop_3
python3 -m http.server 8888
```

---

### Q2: 找不到备份文件？

**检查备份位置：**
```bash
ls -lh /home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/
```

**查看最新备份：**
```bash
./scripts/restore-browser-data.sh --list
```

---

### Q3: 恢复后数据不完整？

**可能原因：**
1. 备份文件不完整
2. 只恢复了LocalStorage，没有恢复IndexedDB
3. 恢复后没有刷新页面

**解决方案：**
1. 检查备份文件大小（应该 > 100KB）
2. 使用Web恢复工具确保完整恢复
3. 恢复后刷新页面（F5或Ctrl+R）

---

### Q4: 如何验证数据已恢复？

**在Web恢复工具中查看：**
- 统计卡片会显示数据量
- 日志会显示恢复的记录数

**在浏览器控制台验证：**
```javascript
// 检查LocalStorage
console.log('LocalStorage条目:', localStorage.length);

// 检查IndexedDB
const db = await new Promise(r => {
    const req = indexedDB.open('EnterpriseBrainDB', 3);
    req.onsuccess = e => r(e.target.result);
});

// 检查物料数量
const tx = db.transaction(['materials'], 'readonly');
const store = tx.objectStore('materials');
const count = await new Promise(r => {
    const req = store.count();
    req.onsuccess = () => r(req.result);
});
console.log('物料数量:', count);
```

---

### Q5: 备份文件太大怎么办？

**正常大小：**
- 100KB - 500KB：正常范围
- > 1MB：数据量较大，正常
- < 50KB：可能数据不完整

**压缩备份：**
```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju
gzip localStorage_backup_*.json
```

---

### Q6: 定期自动备份

**设置定时任务：**
```bash
# 编辑crontab
crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * /home/sardenesy/ai_workspaces/ai_desktop_3/scripts/backup-browser-data.sh
```

**注意：** 浏览器数据仍需手动备份

---

## 📊 数据说明

### LocalStorage存储的数据
- `processListData` - 工序列表
- `capacityLoadData` - 工序能力负荷表
- `customerListData` - 客户台账
- `salesOrderData` - 销售订单
- `productListData` - 产品手册
- `employeeListData` - 员工台账

### IndexedDB存储的数据
- `materials` - 物料库
- `boms` - BOM数据
- `productionBoms` - 生产BOM
- `salesBoms` - 销售BOM
- `designBoms` - 设计BOM
- `productionBomDrafts` - 生产BOM草稿
- `salesBomDrafts` - 销售BOM草稿
- `designBomDrafts` - 设计BOM草稿

---

## 🎯 最佳实践

1. **定期备份**
   - 每天或每周备份一次
   - 重要操作前先备份
   - 保留最近5-10个备份

2. **多地备份**
   - 本地备份
   - 云盘备份
   - 移动硬盘备份

3. **测试恢复**
   - 定期测试恢复流程
   - 确保备份可用

4. **备份命名**
   - 使用时间戳命名
   - 添加版本标识
   - 记录备份内容

---

## 📞 技术支持

如有问题，请：
1. 查看日志文件
2. 检查备份清单
3. 参考本文档

---

**更新时间：** 2024-12-04  
**版本：** 1.0.0
