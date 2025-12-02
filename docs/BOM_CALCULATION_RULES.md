# 生产BOM计算规则与逻辑保护文档

## 📋 文档说明

本文档记录生产BOM系统中所有的字段生成规则和计算逻辑。
**重要：此文档中的规则不得随意更改，除非用户明确提出修改需求。**

---

## 🔢 字段计算规则

### 1. BOM编号（bomCode）生成规则

**规则：** 自动生成，格式为 `PBOM-年份-时间戳-随机数`

**代码逻辑：**
```javascript
const timestamp = Date.now()
const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
const bomCode = `PBOM-${new Date().getFullYear()}-${timestamp}-${randomNum}`
```

**示例：** `PBOM-2025-1764577312048-221`

**用途：** 确保每个BOM编号唯一，便于追溯和管理

---

### 2. 0层阶标准用量（level0Qty）计算规则

**公式：**
- 层阶=1：`标准用量 × (1 + 材料损耗% / 100)`
- 层阶>1：`标准用量 × (1 + 材料损耗% / 100) × 父级的0层阶用量`

**代码逻辑：**
```javascript
const level = parseInt(row.level) || 1
const standardQty = row.standardQty || 0
const materialLoss = row.materialLoss || 0

// 当前行的用量（含损耗）
const qtyWithLoss = standardQty * (1 + materialLoss / 100)

if (level === 1) {
  row.level0Qty = qtyWithLoss
} else {
  // 层阶>1，乘以父级的0层阶用量
  if (row.parentIndex !== undefined && row.parentIndex !== null) {
    const parentRow = formData.value.childItems[row.parentIndex]
    if (parentRow && parentRow.level0Qty !== undefined) {
      row.level0Qty = qtyWithLoss * parentRow.level0Qty
    }
  }
}
```

**精度：** 保留4位小数

**依赖字段：**
- `level`（层阶）
- `standardQty`（标准用量）
- `materialLoss`（材料损耗%）
- `parentIndex`（父级索引，仅多层级时）

---

### 3. 材料费用（materialCost）计算规则

**公式：** `0层阶标准用量 × 材料单价`

**代码逻辑：**
```javascript
const level0Qty = row.level0Qty || 0
const materialPrice = row.materialPrice || 0
row.materialCost = level0Qty * materialPrice
```

**精度：** 保留2位小数

**依赖字段：**
- `level0Qty`（0层阶标准用量）
- `materialPrice`（材料单价）

---

### 4. 工序工资（processWage）加载规则

**来源：** 从物料库的`processPrice`（工序单价）字段加载

**代码逻辑：**
```javascript
const material = materialList.value.find(m => m.materialCode === row.childCode)
if (material && material.processPrice) {
  row.processWage = material.processPrice
}
```

**触发时机：**
- 选择子件编码时自动填充（自动模式）
- 点击"加载工序工资"按钮（手动模式）

---

### 5. 材料单价（materialPrice）加载规则

**来源：** 从物料库的`purchasePrice`（采购单价）字段加载

**代码逻辑：**
```javascript
const material = materialList.value.find(m => m.materialCode === row.childCode)
if (material && material.purchasePrice) {
  row.materialPrice = material.purchasePrice
}
```

**触发时机：**
- 选择子件编码时自动填充（自动模式）
- 点击"加载材料单价"按钮（手动模式）

---

### 6. 0阶人工（level0Labor）计算规则

**公式：** `0层阶标准用量 × 工序工资`

**代码逻辑：**
```javascript
const level0Qty = row.level0Qty || 0
const processWage = row.processWage || 0
row.level0Labor = level0Qty * processWage
```

**精度：** 保留2位小数

**依赖字段：**
- `level0Qty`（0层阶标准用量）
- `processWage`（工序工资）

---

## 🔄 数据流水线规则

### 选择子件编码时的自动填充规则

**触发：** 用户选择子件编码（childCode）时

**自动填充字段：**
1. **子件名称（childName）** = 物料库的`materialName`
2. **产出工序（outputProcess）** = 物料库的`processName`
3. **子件来源（source）** = 物料库的`source[0]`（取来源数组的第一个值）
4. **工序工资（processWage）** = 物料库的`processPrice`
5. **材料单价（materialPrice）** = 物料库的`purchasePrice`

**代码逻辑：**
```javascript
const handleChildCodeChange = (value, row) => {
  if (!value) return
  
  const material = materialList.value.find(m => m.materialCode === value)
  if (material) {
    row.childName = material.materialName
    if (material.processName) row.outputProcess = material.processName
    if (material.source && Array.isArray(material.source) && material.source.length > 0) {
      row.source = material.source[0]
    }
    if (material.processPrice) row.processWage = material.processPrice
    if (material.purchasePrice) row.materialPrice = material.purchasePrice
  }
}
```

---

### 选择子件名称时的自动填充规则

**触发：** 用户选择子件名称（childName）时

**自动填充字段：** 同上（先填充子件编码，然后触发上述规则）

---

## 🎛️ 计算模式

### 自动生成模式（auto）

**特点：**
- 所有计算字段实时生成
- 页面负载高，可能卡顿
- 适合子件数量少的情况（<50条）

**计算字段：**
- `level0Qty`（0层阶标准用量）
- `materialCost`（材料费用）
- `level0Labor`（0阶人工）

---

### 手动加载模式（manual，默认）

**特点：**
- 计算字段不实时生成，只显示已存储的值
- 页面负载低，流畅
- 适合子件数量多的情况（>50条）
- **离散性BOM多层级建议使用此模式**

**手动触发按钮：**
1. **计算0层阶标准用量** - 计算所有子件的`level0Qty`
2. **加载材料单价** - 从物料库加载所有子件的`materialPrice`
3. **加载工序工资** - 从物料库加载所有子件的`processWage`
4. **加载材料费用** - 计算所有子件的`materialCost`
5. **加载0阶人工** - 计算所有子件的`level0Labor`

---

## 🛡️ 规则保护说明

### ⚠️ 禁止修改的规则

以下规则**不得随意修改**，除非用户明确提出需求：

1. ✅ BOM编号生成规则（格式、算法）
2. ✅ 0层阶标准用量计算公式
3. ✅ 材料费用计算公式
4. ✅ 0阶人工计算公式
5. ✅ 数据流水线的字段映射关系
6. ✅ 物料库字段与BOM字段的对应关系
7. ✅ 计算模式的默认值（手动加载）

### 🚫 禁止手动录入的字段（重要！）

以下字段**禁止手动录入**，只能通过预设规则自动生成：

1. ❗ **产出工序** - 只能从物料库自动加载，禁止手动输入
2. ❗ **子件来源** - 只能从物料库自动加载，禁止手动选择
3. ❗ **工序工资** - 只能从物料库自动加载或手动触发，禁止直接输入
4. ❗ **材料损耗** - 只能从物料库自动加载，禁止手动输入
5. ❗ **材料单价** - 只能从物料库自动加载或手动触发，禁止直接输入

**原因：**
- 保证数据一致性，避免人工错误
- 确保数据来源可追溯
- 统一数据管理，从源头控制数据质量

**UI表现：**
- 这些字段在表格中显示为**只读文本**，不提供输入框
- 空值显示为 `'-'`
- 数值字段保留相应精度（工资、2位小数；损肗2位小数+%）

### ✅ 可以优化的方面

以下方面可以在不改变规则的前提下优化：

1. ✅ 性能优化（虚拟滚动、缓存等）
2. ✅ UI交互优化（提示信息、按钮位置等）
3. ✅ 错误处理（异常捕获、友好提示等）
4. ✅ 代码重构（不改变业务逻辑）

---

## 📊 字段映射表

### 物料库 → 生产BOM

| 物料库字段 | BOM字段 | 映射时机 | 说明 |
|----------|--------|---------|------|
| `materialCode` | `childCode` | 用户选择 | 子件编码 |
| `materialName` | `childName` | 自动填充 | 子件名称 |
| `processName` | `outputProcess` | 自动填充 | 产出工序 |
| `source[0]` | `source` | 自动填充 | 子件来源（取数组第一个值） |
| `processPrice` | `processWage` | 自动填充/手动加载 | 工序工资 |
| `purchasePrice` | `materialPrice` | 自动填充/手动加载 | 材料单价 |

---

## 🔍 规则验证

### 验证方法

1. **0层阶标准用量验证**
   ```javascript
   // 层阶=1
   level0Qty === standardQty * (1 + materialLoss / 100)
   
   // 层阶>1
   level0Qty === standardQty * (1 + materialLoss / 100) * parentRow.level0Qty
   ```

2. **材料费用验证**
   ```javascript
   materialCost === level0Qty * materialPrice
   ```

3. **0阶人工验证**
   ```javascript
   level0Labor === level0Qty * processWage
   ```

---

## 📝 修改记录

| 日期 | 修改内容 | 修改人 | 原因 |
|-----|---------|-------|------|
| 2025-12-02 | 禁止手动录入：产出工序/子件来源/工序工资/材料损耗/材料单价 | System | 用户要求：杜绝手动录入，只能通过预设规则生成 |
| 2025-12-02 | 添加手动加载模式 | System | 性能优化，支持大量子件 |
| 2025-12-02 | 创建规则保护文档 | System | 保护业务规则不被误改 |

---

## ⚠️ 重要提示

1. **任何对计算规则的修改都必须记录在本文档中**
2. **修改前必须确认用户需求，不得自行更改业务规则**
3. **性能优化不得改变计算结果**
4. **新增字段必须明确计算规则和数据来源**

---

## 📞 联系方式

如需修改业务规则，请联系：
- 项目负责人
- 业务需求方
- 技术负责人

**未经许可，禁止修改业务规则！**
