# 问题修复说明 - 产品手册和生产BOM

**修复时间：** 2025-12-02  
**修复内容：** 两个主要问题

---

## 问题1：产品手册删除数据后刷新会恢复

### 问题描述
用户删除产品手册中的数据后，刷新页面数据又恢复了。

### 问题根本原因
`ProductManual.vue` 第345-468行硬编码了3条模拟数据：
```javascript
const tableData = ref([
  {
    id: 1,
    productCode: 'P2025001',
    productName: '高精度传感器A1',
    // ... 大量硬编码数据
  },
  { id: 2, ... },
  { id: 3, ... }
])
```

每次组件`onMounted`时，这些硬编码数据会覆盖localStorage中用户保存的真实数据。

### 修复方案
1. **删除硬编码数据**：将第346-463行的模拟数据全部删除
2. **初始化为空数组**：`const tableData = ref([])`
3. **重置初始ID**：`const nextProductId = ref(1)` （从4改为1）
4. **完全依赖localStorage**：数据仅从localStorage加载

### 修改文件
- `/07-frontend/src/pages/product/ProductManual.vue`

### 测试方法
1. 打开产品手册页面
2. 添加一些产品数据
3. 删除部分产品
4. 刷新页面
5. **验证**：删除的产品不应该恢复

---

## 问题2：生产BOM点击提交后没有保存

### 问题描述
用户在"新增生产BOM"页面：
1. 加载数据
2. 计算人工费用
3. 计算材料费用  
4. 点击"提交"按钮

结果：对话框关闭了，但主表格的数据没有更新（或者报500错误）。

### 问题根本原因

#### 原因1：保存顺序错误
```javascript
// ❌ 错误的做法（旧代码）
if (isEdit.value) {
  const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
  if (index !== -1) {
    // 1. 先更新本地数据
    tableData.value[index] = {
      ...formData.value,
      id: currentBom.value.id,
      updateTime: new Date().toLocaleString('zh-CN')
    }
    // 2. 后调用API保存
    await bomApiService.saveBom(tableData.value[index])
  }
}
```

**问题**：如果API保存失败，本地tableData已经被修改，导致数据不一致！

#### 原因2：包含了前端显示字段
```javascript
// ❌ 错误的做法
tableData.value[index] = {
  ...formData.value,  // ⚠️ 包含了 totalLabor、totalMaterial 等字段
  // ...
}
```

**问题**：
- `formData.value` 包含 `totalLabor`、`totalMaterial` 等前端显示字段
- 这些字段不在数据库表 `production_boms` 中
- 虽然 `convertToBackend` 函数会过滤这些字段，但本地 `tableData` 保存了这些无用字段

### 修复方案

#### 1. 调整保存顺序
```javascript
// ✅ 正确的做法（新代码）
if (isEdit.value) {
  // 1. 先保存到后端
  const savedBom = await bomApiService.saveBom(formData.value)
  
  // 2. 后端保存成功后，再更新本地数据
  const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
  if (index !== -1) {
    tableData.value[index] = {
      id: savedBom.id,
      bomCode: formData.value.bomCode,
      bomName: formData.value.bomName,
      // ... 只保存必要字段
    }
  }
}
```

**优点**：
- 如果后端保存失败，抛出异常，本地数据不会被修改
- 数据一致性得到保证

#### 2. 明确字段列表
不再使用 `...formData.value` 展开操作符，而是明确列出需要保存的字段：

**保存的字段：**
- `id` - BOM ID
- `bomCode` - BOM编号
- `bomName` - BOM名称
- `productCode` - 产品编号
- `productName` - 产品名称
- `version` - 版本号
- `status` - 状态
- `designer` - 设计人员
- `reviewer` - 审核人员
- `itemCount` - 物料数量
- `effectiveDate` - 生效日期
- `remark` - 备注
- `updateTime` / `createTime` - 时间戳

**不保存的字段：**
- ~~`totalLabor`~~ - 总人工费用（前端显示字段）
- ~~`totalMaterial`~~ - 总材料费用（前端显示字段）
- ~~`childItems`~~ - 子件列表（单独保存到 `bom_components` 表）

### 修改文件
- `/07-frontend/src/pages/bom/ProductionBom.vue`
- 修改函数：`handleSubmit`（第1847-1897行）

### 代码对比

**修改前：**
```javascript
if (isEdit.value) {
  const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
  if (index !== -1) {
    tableData.value[index] = {
      ...formData.value,
      id: currentBom.value.id,
      updateTime: new Date().toLocaleString('zh-CN')
    }
    await bomApiService.saveBom(tableData.value[index])
  }
  ElMessage.success('BOM更新成功')
} else {
  const newBom = {
    ...formData.value,
    createTime: new Date().toLocaleString('zh-CN'),
    updateTime: new Date().toLocaleString('zh-CN')
  }
  const savedBom = await bomApiService.saveBom(newBom)
  tableData.value.unshift({ ...newBom, id: savedBom.id })
  nextBomId.value++
  ElMessage.success('BOM创建成功')
}
```

**修改后：**
```javascript
if (isEdit.value) {
  // 先保存到后端
  const savedBom = await bomApiService.saveBom(formData.value)
  
  // 后端保存成功后，再更新本地数据
  const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
  if (index !== -1) {
    // 只保存必要的字段，过滤掉前端显示字段
    tableData.value[index] = {
      id: savedBom.id,
      bomCode: formData.value.bomCode,
      bomName: formData.value.bomName,
      productCode: formData.value.productCode,
      productName: formData.value.productName,
      version: formData.value.version,
      status: formData.value.status,
      designer: formData.value.designer,
      reviewer: formData.value.reviewer,
      itemCount: formData.value.itemCount,
      effectiveDate: formData.value.effectiveDate,
      remark: formData.value.remark,
      updateTime: new Date().toLocaleString('zh-CN')
    }
  }
  ElMessage.success('BOM更新成功')
} else {
  // 先保存到后端
  const savedBom = await bomApiService.saveBom(formData.value)
  
  // 后端保存成功后，再更新本地数据
  const newBom = {
    id: savedBom.id,
    bomCode: formData.value.bomCode,
    bomName: formData.value.bomName,
    productCode: formData.value.productCode,
    productName: formData.value.productName,
    version: formData.value.version,
    status: formData.value.status,
    designer: formData.value.designer,
    reviewer: formData.value.reviewer,
    itemCount: formData.value.itemCount,
    effectiveDate: formData.value.effectiveDate,
    remark: formData.value.remark,
    createTime: new Date().toLocaleString('zh-CN'),
    updateTime: new Date().toLocaleString('zh-CN')
  }
  tableData.value.unshift(newBom)
  nextBomId.value++
  ElMessage.success('BOM创建成功')
}
```

### 测试方法
1. 打开"生产BOM"页面
2. 点击"新增生产BOM"
3. 填写基本信息
4. 添加子件数据
5. 点击"加载数据"按钮
6. 点击"计算人工费用"按钮
7. 点击"计算材料费用"按钮
8. 点击"提交"按钮
9. **验证1**：对话框关闭
10. **验证2**：主表格出现新的BOM记录
11. **验证3**：刷新页面，BOM记录仍然存在

---

## 技术细节

### ProductManual.vue 数据流
```
用户操作 → 前端tableData → localStorage
            ↑                      ↓
         onMounted加载 ← localStorage
```

### ProductionBom.vue 数据流（修复前）
```
用户提交 → 前端tableData → 后端API
            ↑（先更新）       ↓
          （后保存）
```
**问题**：如果后端API失败，前端数据已被修改！

### ProductionBom.vue 数据流（修复后）
```
用户提交 → 后端API → 保存成功 → 前端tableData
                      ↓
                   保存失败 → 抛出异常
                              ↓
                          前端数据不变
```
**优点**：数据一致性得到保证！

---

## 后端数据库表结构

### production_boms 表
```sql
CREATE TABLE production_boms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bom_code TEXT UNIQUE NOT NULL,
  bom_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  version TEXT,
  status TEXT DEFAULT 'draft',
  designer TEXT,
  material_count INTEGER DEFAULT 0,
  remark TEXT,
  auditor TEXT,
  effective_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**注意**：表中**没有** `total_labor` 和 `total_material` 字段！

### bom_components 表（子件表）
```sql
CREATE TABLE bom_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bom_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  level INTEGER DEFAULT 1,
  component_code TEXT NOT NULL,
  component_name TEXT NOT NULL,
  standard_quantity REAL DEFAULT 1,
  output_process TEXT,
  component_source TEXT,
  process_wage REAL DEFAULT 0,
  material_loss REAL DEFAULT 0,
  material_price REAL DEFAULT 0,
  material_cost REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bom_id) REFERENCES production_boms(id) ON DELETE CASCADE
)
```

---

## 修复成果

### 问题1修复验证 ✅
- [x] 删除硬编码数据
- [x] 初始化为空数组
- [x] 数据完全从localStorage加载
- [x] 删除后刷新不会恢复

### 问题2修复验证 ✅
- [x] 先保存后端，再更新前端
- [x] 过滤前端显示字段
- [x] 明确保存字段列表
- [x] 提交后主表格正确更新
- [x] 数据持久化到数据库

---

## 注意事项

1. **ProductManual.vue**：所有数据都存储在localStorage中，没有后端API
2. **ProductionBom.vue**：所有数据都存储在后端SQLite数据库中
3. **字段过滤**：前端显示字段（如 totalLabor、totalMaterial）不应该保存到后端
4. **保存顺序**：务必先保存后端，成功后再更新前端，保证数据一致性

---

## 相关文件

- `/07-frontend/src/pages/product/ProductManual.vue`
- `/07-frontend/src/pages/bom/ProductionBom.vue`
- `/07-frontend/src/services/api/bomApiService.js`
- `/backend/services/bomService.js`
- `/backend/routes/productionBoms.js`
- `/backend/config/database.js`
