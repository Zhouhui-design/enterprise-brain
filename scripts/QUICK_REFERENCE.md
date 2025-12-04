# 🔄 企业大脑数据备份恢复 - 快速参考卡

## 📱 立即恢复数据（刚更新IDE后）

```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3
./scripts/quick-restore.sh
```

然后在浏览器中：
1. 访问 http://localhost:8888/scripts/browser-data-restore.html
2. 选择文件：`/home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/localStorage_backup_*.json`
3. 点击"恢复数据"
4. 刷新页面

---

## 💾 日常备份操作

### 方法1：一键备份（推荐）⭐

```bash
# 访问备份工具
http://localhost:8888/scripts/browser-data-restore.html

# 点击"💾 备份当前数据"按钮
# 文件会自动下载
```

### 方法2：完整备份

```bash
# 备份系统文件
./scripts/backup-browser-data.sh

# 然后打开浏览器备份浏览器数据
http://localhost:8888/scripts/browser-data-restore.html
```

---

## 🔍 查看备份

```bash
# 列出所有备份
./scripts/restore-browser-data.sh --list

# 或直接查看目录
ls -lh /home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/
```

---

## 🚀 恢复选项

### 选项1：Web工具恢复（最简单）
```bash
./scripts/restore-browser-data.sh --tool
```

### 选项2：快速恢复最新备份
```bash
./scripts/restore-browser-data.sh --quick
```

### 选项3：从指定文件恢复
```bash
./scripts/restore-browser-data.sh --file /path/to/backup.json
```

### 选项4：交互式恢复向导
```bash
./scripts/restore-browser-data.sh
```

---

## 📂 重要路径

| 项目 | 路径 |
|------|------|
| 备份目录 | `/home/sardenesy/ai_workspaces/ai_desktop_3/beifenshuju/` |
| 恢复工具 | `http://localhost:8888/scripts/browser-data-restore.html` |
| 导航页面 | `http://localhost:8888/scripts/index.html` |
| 使用文档 | `/home/sardenesy/ai_workspaces/ai_desktop_3/scripts/README.md` |

---

## ⚡ 一键命令速查

```bash
# 1. 快速恢复（推荐）
./scripts/quick-restore.sh

# 2. 完整备份
./scripts/backup-browser-data.sh

# 3. 启动恢复工具
./scripts/restore-browser-data.sh --tool

# 4. 查看备份列表
./scripts/restore-browser-data.sh --list
```

---

## 🔧 故障排除

### 问题1：服务器端口被占用
```bash
# 查看占用情况
lsof -i :8888

# 使用其他端口
python3 -m http.server 9999
# 然后访问 http://localhost:9999/scripts/browser-data-restore.html
```

### 问题2：找不到备份文件
```bash
# 查找备份文件
find /home/sardenesy/ai_workspaces/ai_desktop_3 -name "localStorage_backup_*.json"
```

### 问题3：恢复后数据不完整
- 检查备份文件大小（应该 > 100KB）
- 确保恢复完成后刷新了页面
- 查看恢复工具的日志输出

---

## 📊 备份数据说明

### LocalStorage数据（约20-50KB）
- 工序列表、客户台账、销售订单
- 产品手册、员工台账等

### IndexedDB数据（约100-200KB）
- 物料库、BOM数据、草稿箱等

### 总大小：通常 150-250KB

---

## ⏰ 建议备份频率

- **日常使用**：每天备份一次
- **重要操作前**：立即备份
- **系统升级前**：必须备份
- **自动备份**：设置定时任务（每天凌晨2点）

---

## 💡 最佳实践

1. ✅ 每天下班前备份一次
2. ✅ 保留最近5-10个备份
3. ✅ 重要数据额外保存到云盘
4. ✅ 定期测试恢复流程
5. ✅ 记录备份时间和内容

---

## 🆘 紧急恢复

如果所有工具都失效，使用浏览器控制台手动恢复：

```javascript
// 1. 访问系统页面 http://localhost:3001
// 2. 按 F12 打开控制台
// 3. 粘贴并执行恢复代码（见 README.md）
```

---

**更新时间：** 2024-12-04  
**工具版本：** 1.0.0  

**保存此文件以便随时查阅！** 📌
