#!/bin/bash

##############################################################################
# 企业大脑浏览器数据备份脚本
# 功能：备份LocalStorage和IndexedDB数据
# 作者：AI Assistant
# 日期：2024-12-04
##############################################################################

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
WORKSPACE_ROOT="/home/sardenesy/ai_workspaces/ai_desktop_3"
BACKUP_ROOT="${WORKSPACE_ROOT}/beifenshuju"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"

# 函数：打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 函数：检查浏览器是否运行
check_browser_running() {
    if pgrep -x "chrome" > /dev/null || pgrep -x "chromium" > /dev/null; then
        print_warning "检测到Chrome/Chromium正在运行"
        print_info "建议关闭浏览器以确保数据一致性"
        read -p "是否继续备份？(y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "备份已取消"
            exit 0
        fi
    fi
}

# 函数：创建备份目录
create_backup_dir() {
    print_info "创建备份目录: ${BACKUP_DIR}"
    mkdir -p "${BACKUP_DIR}"/{frontend-data,backend-database,configs,documents,uploads}
}

# 函数：备份配置文件
backup_configs() {
    print_info "备份配置文件..."
    
    # 前端环境配置
    if [ -f "${WORKSPACE_ROOT}/07-frontend/.env.development" ]; then
        cp "${WORKSPACE_ROOT}/07-frontend/.env.development" "${BACKUP_DIR}/configs/"
        print_success "已备份: .env.development"
    fi
    
    if [ -f "${WORKSPACE_ROOT}/07-frontend/.env.production" ]; then
        cp "${WORKSPACE_ROOT}/07-frontend/.env.production" "${BACKUP_DIR}/configs/"
        print_success "已备份: .env.production"
    fi
    
    # 后端数据库配置
    if [ -f "${WORKSPACE_ROOT}/backend/config/database.js" ]; then
        cp "${WORKSPACE_ROOT}/backend/config/database.js" "${BACKUP_DIR}/configs/"
        print_success "已备份: database.js"
    fi
}

# 函数：备份文档
backup_documents() {
    print_info "备份文档文件..."
    
    local doc_count=0
    
    # 备份所有md文档
    find "${WORKSPACE_ROOT}" -maxdepth 1 -name "*.md" -type f | while read -r file; do
        cp "$file" "${BACKUP_DIR}/documents/"
        ((doc_count++))
    done
    
    # 备份docs目录
    if [ -d "${WORKSPACE_ROOT}/docs" ]; then
        cp -r "${WORKSPACE_ROOT}/docs/"* "${BACKUP_DIR}/documents/" 2>/dev/null || true
    fi
    
    doc_count=$(find "${BACKUP_DIR}/documents" -type f | wc -l)
    print_success "已备份 ${doc_count} 个文档文件"
}

# 函数：备份后端数据库
backup_backend_database() {
    print_info "检查后端数据库..."
    
    if [ -f "${WORKSPACE_ROOT}/backend/enterprise_brain.db" ]; then
        cp "${WORKSPACE_ROOT}/backend/enterprise_brain.db" "${BACKUP_DIR}/backend-database/"
        print_success "已备份: enterprise_brain.db"
    else
        print_warning "未找到后端数据库文件"
        touch "${BACKUP_DIR}/backend-database/.no-database"
    fi
}

# 函数：生成浏览器数据备份说明
generate_browser_backup_guide() {
    cat > "${BACKUP_DIR}/frontend-data/README.md" << 'EOF'
# 浏览器数据备份说明

## 自动备份方式（推荐）

### 方法1：使用数据恢复工具页面

1. 打开备份工具页面：
   ```bash
   # 在项目根目录执行
   cd /home/sardenesy/ai_workspaces/ai_desktop_3
   python3 -m http.server 8888
   ```

2. 浏览器访问：http://localhost:8888/scripts/browser-data-restore.html

3. 点击"💾 备份当前数据"按钮

4. 备份文件会自动下载到浏览器下载目录

### 方法2：使用浏览器控制台

1. 打开系统页面：http://localhost:3001
2. 按F12打开开发者工具
3. 切换到Console标签页
4. 复制并执行以下脚本：

```javascript
// 自动备份脚本
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
    
    console.log('✅ 备份完成！文件已下载');
})();
```

## 数据恢复

### 使用恢复工具（推荐）

1. 打开恢复工具：http://localhost:8888/scripts/browser-data-restore.html
2. 点击"📁 选择备份文件"
3. 选择备份的JSON文件
4. 点击"🔄 恢复数据"
5. 等待恢复完成后刷新页面

### 手动恢复

在浏览器控制台执行（需要先读取备份文件内容）：

```javascript
// 将备份数据粘贴到这里
const backupData = { /* 你的备份数据 */ };

// 恢复LocalStorage
Object.keys(backupData).forEach(key => {
    if (key !== 'enterpriseBrain_backup') {
        localStorage.setItem(key, backupData[key]);
    }
});

// 恢复IndexedDB（如果有）
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
    
    console.log('✅ 数据恢复完成！');
}

location.reload();
```

## 注意事项

1. 备份文件包含所有业务数据，请妥善保管
2. 建议定期备份（每天或每周）
3. 重要操作前务必先备份
4. 恢复数据会覆盖当前数据，请谨慎操作
EOF
}

# 函数：生成备份清单
generate_manifest() {
    print_info "生成备份清单..."
    
    local materials_count=0
    local boms_count=0
    local docs_count=0
    
    docs_count=$(find "${BACKUP_DIR}/documents" -type f 2>/dev/null | wc -l)
    
    cat > "${BACKUP_DIR}/BACKUP_MANIFEST.md" << EOF
# 企业大脑系统 - 数据备份清单

## 备份信息
- 备份时间: $(date '+%Y-%m-%d %H:%M:%S')
- 备份目录: ${BACKUP_DIR}
- 操作系统: $(uname -a)

## 备份内容

### 1. 前端浏览器数据 (frontend-data/)
- ⚠️ 需要手动备份（使用浏览器工具）
- 详见目录下的README.md

### 2. 后端数据库 (backend-database/)
EOF

    if [ -f "${BACKUP_DIR}/backend-database/enterprise_brain.db" ]; then
        local db_size=$(du -h "${BACKUP_DIR}/backend-database/enterprise_brain.db" | cut -f1)
        echo "- ✅ enterprise_brain.db (${db_size})" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"
    else
        echo "- ❌ enterprise_brain.db (未找到)" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"
    fi

    cat >> "${BACKUP_DIR}/BACKUP_MANIFEST.md" << EOF

### 3. 配置文件 (configs/)
EOF

    find "${BACKUP_DIR}/configs" -type f | while read -r file; do
        local filename=$(basename "$file")
        local filesize=$(du -h "$file" | cut -f1)
        echo "- ✅ ${filename} (${filesize})" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"
    done

    cat >> "${BACKUP_DIR}/BACKUP_MANIFEST.md" << EOF

### 4. 文档文件 (documents/)
${docs_count} 个文档文件

## 恢复步骤

### 1. 恢复浏览器数据
使用恢复工具页面：
\`\`\`bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3
python3 -m http.server 8888
# 然后访问: http://localhost:8888/scripts/browser-data-restore.html
\`\`\`

或参考 frontend-data/README.md 中的手动恢复步骤

### 2. 恢复后端数据库（如果需要）
\`\`\`bash
cp ${BACKUP_DIR}/backend-database/enterprise_brain.db ${WORKSPACE_ROOT}/backend/
\`\`\`

### 3. 恢复配置文件（如果需要）
\`\`\`bash
cp ${BACKUP_DIR}/configs/.env.* ${WORKSPACE_ROOT}/07-frontend/
cp ${BACKUP_DIR}/configs/database.js ${WORKSPACE_ROOT}/backend/config/
\`\`\`

## 快速恢复命令

\`\`\`bash
# 使用恢复脚本
cd /home/sardenesy/ai_workspaces/ai_desktop_3
./scripts/restore-browser-data.sh ${BACKUP_DIR}
\`\`\`

## 验证清单
- [ ] 浏览器数据已恢复（LocalStorage + IndexedDB）
- [ ] 后端数据库已恢复（如果需要）
- [ ] 配置文件已恢复（如果需要）
- [ ] 系统可正常访问
- [ ] 数据完整性检查通过

## 备份文件位置
- 完整备份: ${BACKUP_DIR}.tar.gz
- 浏览器数据备份: 需要手动从浏览器下载

EOF

    print_success "备份清单已生成"
}

# 函数：压缩备份
compress_backup() {
    print_info "压缩备份文件..."
    
    cd "${BACKUP_ROOT}"
    tar -czf "backup_${TIMESTAMP}.tar.gz" "backup_${TIMESTAMP}/"
    
    local archive_size=$(du -h "backup_${TIMESTAMP}.tar.gz" | cut -f1)
    print_success "备份压缩完成: backup_${TIMESTAMP}.tar.gz (${archive_size})"
}

# 函数：清理旧备份
cleanup_old_backups() {
    print_info "清理旧备份（保留最近5个）..."
    
    cd "${BACKUP_ROOT}"
    
    # 保留最近的5个备份目录
    ls -t | grep "^backup_" | grep -v ".tar.gz" | tail -n +6 | while read -r dir; do
        rm -rf "$dir"
        print_info "已删除旧备份目录: $dir"
    done
    
    # 保留最近的5个压缩包
    ls -t | grep "^backup_.*\.tar\.gz$" | tail -n +6 | while read -r file; do
        rm -f "$file"
        print_info "已删除旧备份压缩包: $file"
    done
    
    print_success "旧备份清理完成"
}

# 函数：显示备份摘要
show_summary() {
    echo ""
    echo "======================================"
    echo -e "${GREEN}备份完成摘要${NC}"
    echo "======================================"
    echo "备份目录: ${BACKUP_DIR}"
    echo "压缩文件: ${BACKUP_ROOT}/backup_${TIMESTAMP}.tar.gz"
    echo ""
    echo "备份内容："
    echo "- 配置文件: $(find "${BACKUP_DIR}/configs" -type f 2>/dev/null | wc -l) 个"
    echo "- 文档文件: $(find "${BACKUP_DIR}/documents" -type f 2>/dev/null | wc -l) 个"
    echo "- 数据库: $([ -f "${BACKUP_DIR}/backend-database/enterprise_brain.db" ] && echo "✅" || echo "❌")"
    echo ""
    echo "⚠️  重要提示："
    echo "1. 浏览器数据需要手动备份"
    echo "2. 打开恢复工具页面: http://localhost:8888/scripts/browser-data-restore.html"
    echo "3. 点击'💾 备份当前数据'按钮"
    echo "4. 将下载的文件保存到: ${BACKUP_DIR}/frontend-data/"
    echo ""
    echo "详细信息请查看: ${BACKUP_DIR}/BACKUP_MANIFEST.md"
    echo "======================================"
}

# 主流程
main() {
    echo ""
    echo "======================================"
    echo "  企业大脑系统 - 数据备份工具"
    echo "======================================"
    echo ""
    
    # 检查浏览器状态
    check_browser_running
    
    # 创建备份目录
    create_backup_dir
    
    # 备份各类数据
    backup_configs
    backup_documents
    backup_backend_database
    
    # 生成说明文档
    generate_browser_backup_guide
    generate_manifest
    
    # 压缩备份
    compress_backup
    
    # 清理旧备份
    cleanup_old_backups
    
    # 显示摘要
    show_summary
    
    echo ""
    print_success "备份脚本执行完成！"
    echo ""
}

# 执行主流程
main
