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

