#!/bin/bash

# 企业大脑系统 - 完整数据备份脚本
# 创建时间: $(date '+%Y-%m-%d %H:%M:%S')

echo "=========================================="
echo "  企业大脑系统 - 数据备份工具"
echo "=========================================="
echo ""

# 设置备份目录
BACKUP_ROOT="/home/sardenesy/enterprise-brain-backup"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"

echo "📦 创建备份目录: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"

echo ""
echo "🔄 开始备份..."
echo ""

# 1. 备份前端LocalStorage数据（通过浏览器导出）
echo "1️⃣  备份前端LocalStorage数据..."
mkdir -p "${BACKUP_DIR}/frontend-data"
cat > "${BACKUP_DIR}/frontend-data/README.md" << 'EOF'
# 前端数据备份说明

## LocalStorage数据备份

前端数据存储在浏览器的localStorage中，包括：

### 重要数据表
- `processListData` - 工序列表数据
- `capacityLoadData` - 工序能力负荷表数据
- `capacityLoadSettings` - 工序能力负荷表设置
- `customerListData` - 客户台账数据
- `salesOrderData` - 销售订单数据
- `productListData` - 产品手册数据
- `materialListData` - 物料库数据
- `bomData` - BOM数据
- `employeeListData` - 员工台账数据

### 手动备份步骤

1. 打开浏览器（Chrome/Edge）
2. 访问系统: http://localhost:3001
3. 按F12打开开发者工具
4. 切换到 Console（控制台）标签页
5. 复制并执行以下脚本：

```javascript
// 导出所有localStorage数据
const allData = {};
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    allData[key] = localStorage.getItem(key);
}
console.log(JSON.stringify(allData, null, 2));
```

6. 复制控制台输出的JSON数据
7. 保存到文件: `localStorage_backup.json`

### 恢复数据步骤

1. 打开浏览器开发者工具（F12）
2. 切换到 Console 标签页
3. 复制并执行以下脚本（替换DATA为你的备份数据）：

```javascript
// 恢复localStorage数据
const backupData = {
    // 粘贴你的备份数据到这里
};

Object.keys(backupData).forEach(key => {
    localStorage.setItem(key, backupData[key]);
});

console.log('✅ 数据恢复完成！');
location.reload(); // 刷新页面
```

EOF

# 2. 备份后端SQLite数据库
echo "2️⃣  备份后端数据库..."
mkdir -p "${BACKUP_DIR}/backend-database"

if [ -f "/home/sardenesy/ai_workspaces/ai_desktop_3/backend/enterprise_brain.db" ]; then
    cp "/home/sardenesy/ai_workspaces/ai_desktop_3/backend/enterprise_brain.db" "${BACKUP_DIR}/backend-database/"
    echo "   ✅ 已备份: enterprise_brain.db"
else
    echo "   ⚠️  数据库文件不存在"
fi

# 3. 备份配置文件
echo "3️⃣  备份系统配置文件..."
mkdir -p "${BACKUP_DIR}/configs"

# 前端配置
if [ -f "/home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/.env.development" ]; then
    cp "/home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/.env.development" "${BACKUP_DIR}/configs/"
    echo "   ✅ 已备份: .env.development"
fi

if [ -f "/home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/.env.production" ]; then
    cp "/home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/.env.production" "${BACKUP_DIR}/configs/"
    echo "   ✅ 已备份: .env.production"
fi

# 后端配置
if [ -f "/home/sardenesy/ai_workspaces/ai_desktop_3/backend/config/database.js" ]; then
    cp "/home/sardenesy/ai_workspaces/ai_desktop_3/backend/config/database.js" "${BACKUP_DIR}/configs/"
    echo "   ✅ 已备份: database.js"
fi

# 4. 备份用户上传文件
echo "4️⃣  备份用户上传文件..."
mkdir -p "${BACKUP_DIR}/uploads"

if [ -d "/home/sardenesy/ai_workspaces/ai_desktop_3/uploads" ]; then
    cp -r "/home/sardenesy/ai_workspaces/ai_desktop_3/uploads/"* "${BACKUP_DIR}/uploads/" 2>/dev/null || echo "   ℹ️  暂无上传文件"
else
    echo "   ℹ️  uploads目录不存在"
fi

# 5. 备份重要文档
echo "5️⃣  备份文档文件..."
mkdir -p "${BACKUP_DIR}/documents"

# 复制所有.md文档
find "/home/sardenesy/ai_workspaces/ai_desktop_3" -maxdepth 1 -name "*.md" -exec cp {} "${BACKUP_DIR}/documents/" \; 2>/dev/null

echo "   ✅ 已备份所有文档"

# 6. 创建备份清单
echo "6️⃣  生成备份清单..."
cat > "${BACKUP_DIR}/BACKUP_MANIFEST.md" << EOF
# 企业大脑系统 - 数据备份清单

## 备份信息
- 备份时间: $(date '+%Y-%m-%d %H:%M:%S')
- 备份目录: ${BACKUP_DIR}
- 操作系统: $(uname -a)

## 备份内容

### 1. 前端数据 (frontend-data/)
- LocalStorage数据（需手动备份）
- 详见目录下的README.md

### 2. 后端数据库 (backend-database/)
$(if [ -f "${BACKUP_DIR}/backend-database/enterprise_brain.db" ]; then
    echo "- ✅ enterprise_brain.db ($(du -h "${BACKUP_DIR}/backend-database/enterprise_brain.db" | cut -f1))"
else
    echo "- ❌ enterprise_brain.db (未找到)"
fi)

### 3. 配置文件 (configs/)
$(ls -lh "${BACKUP_DIR}/configs/" 2>/dev/null | grep -v "^total" | awk '{print "- ✅ " $9 " (" $5 ")"}' || echo "- ❌ 无配置文件")

### 4. 上传文件 (uploads/)
$(if [ -d "${BACKUP_DIR}/uploads" ] && [ "$(ls -A "${BACKUP_DIR}/uploads" 2>/dev/null)" ]; then
    echo "- ✅ 用户上传文件 ($(du -sh "${BACKUP_DIR}/uploads" | cut -f1))"
else
    echo "- ℹ️  无上传文件"
fi)

### 5. 文档文件 (documents/)
$(ls "${BACKUP_DIR}/documents/" 2>/dev/null | wc -l) 个文档文件

## 恢复步骤

### 恢复前端数据
1. 打开浏览器访问系统
2. 按F12打开开发者工具
3. 参考 frontend-data/README.md 中的恢复步骤

### 恢复后端数据库
\`\`\`bash
# 复制数据库文件到新系统
cp ${BACKUP_DIR}/backend-database/enterprise_brain.db /path/to/new/backend/
\`\`\`

### 恢复配置文件
\`\`\`bash
# 复制配置文件到对应目录
cp ${BACKUP_DIR}/configs/.env.* /path/to/new/07-frontend/
cp ${BACKUP_DIR}/configs/database.js /path/to/new/backend/config/
\`\`\`

### 恢复上传文件
\`\`\`bash
# 复制上传文件到新系统
cp -r ${BACKUP_DIR}/uploads/* /path/to/new/uploads/
\`\`\`

## 验证清单
- [ ] 前端LocalStorage数据已恢复
- [ ] 后端数据库已恢复
- [ ] 配置文件已恢复
- [ ] 上传文件已恢复
- [ ] 系统可正常访问
- [ ] 数据完整性检查通过

EOF

# 7. 打包备份
echo ""
echo "7️⃣  打包备份文件..."
cd "${BACKUP_ROOT}"
tar -czf "backup_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "backup_${TIMESTAMP}.tar.gz" | cut -f1)
    echo "   ✅ 备份包创建成功: backup_${TIMESTAMP}.tar.gz (${BACKUP_SIZE})"
else
    echo "   ❌ 打包失败"
fi

echo ""
echo "=========================================="
echo "  ✅ 备份完成！"
echo "=========================================="
echo ""
echo "📁 备份位置:"
echo "   目录: ${BACKUP_DIR}"
echo "   压缩包: ${BACKUP_ROOT}/backup_${TIMESTAMP}.tar.gz"
echo ""
echo "📋 下一步操作:"
echo "   1. 查看备份清单: cat ${BACKUP_DIR}/BACKUP_MANIFEST.md"
echo "   2. 手动备份LocalStorage数据（重要！）"
echo "   3. 妥善保存备份文件"
echo ""
echo "⚠️  重要提醒:"
echo "   - LocalStorage数据需要手动导出（详见 frontend-data/README.md）"
echo "   - 请在浏览器中访问 http://localhost:3001 执行备份脚本"
echo "   - 建议将备份文件复制到安全位置"
echo ""
