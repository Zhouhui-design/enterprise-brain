# 生产BOM新功能开发说明

**开发时间：** 2025-12-02  
**版本：** V1.1.0

---

## 功能概述

本次开发为生产BOM系统添加了以下功能：

1. **主表格新增字段**：总人工、总材料、产品图片、是否推送到产品手册
2. **新增/编辑页面**：总人工和总材料字段（已存在，已添加到保存逻辑）
3. **查看页面**：显示总人工和总材料
4. **产品图片自动获取**：从物料库lookup产品图片
5. **推送到产品手册功能**：一键推送BOM数据到产品手册

---

## 一、数据库变更

### 1. production_boms表新增字段

```sql
ALTER TABLE production_boms ADD COLUMN total_labor REAL DEFAULT 0;
ALTER TABLE production_boms ADD COLUMN total_material REAL DEFAULT 0;
ALTER TABLE production_boms ADD COLUMN product_image TEXT;
ALTER TABLE production_boms ADD COLUMN is_pushed_to_manual INTEGER DEFAULT 0;
```

**字段说明：**
- `total_labor` - 总人工费用（从前端计算并保存）
- `total_material` - 总材料费用（从前端计算并保存）
- `product_image` - 产品图片URL（从物料库自动获取）
- `is_pushed_to_manual` - 是否推送到产品手册（0=未推送, 1=已推送）

### 2. 迁移脚本

**文件：** `/backend/scripts/add-bom-fields.js`

**执行方式：**
```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3/backend
node scripts/add-bom-fields.js
```

**执行结果：**
- ✅ 总人工字段已添加
- ✅ 总材料字段已添加
- ✅ 产品图片字段已添加
- ✅ 推送状态字段已添加

---

## 二、后端变更

### 1. 数据库配置（database.js）

**修改文件：** `/backend/config/database.js`

**新增字段到CREATE TABLE：**
```javascript
CREATE TABLE IF NOT EXISTS production_boms (
  // ... 其他字段
  total_labor REAL DEFAULT 0,
  total_material REAL DEFAULT 0,
  product_image TEXT,
  is_pushed_to_manual INTEGER DEFAULT 0,
  // ...
)
```

### 2. BOM服务（bomService.js）

**修改文件：** `/backend/services/bomService.js`

**createProductionBOM - 添加新字段到INSERT：**
```javascript
INSERT INTO production_boms (
  bom_code, bom_name, product_code, product_name, version, 
  status, designer, material_count, remark, auditor, effective_date,
  total_labor, total_material, product_image  // 新增
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

**传递参数：**
```javascript
stmt.run(
  // ... 其他参数
  parseFloat(bomInfo.totalLabor) || 0,
  parseFloat(bomInfo.totalMaterial) || 0,
  bomInfo.productImage || null
);
```

**updateProductionBOM - 添加新字段到UPDATE：**
```javascript
UPDATE production_boms SET
  // ... 其他字段
  total_labor = ?, total_material = ?, product_image = ?,  // 新增
  updated_at = CURRENT_TIMESTAMP
WHERE id = ?
```

---

## 三、前端API服务变更

### 文件：`/07-frontend/src/services/api/bomApiService.js`

### 1. convertFromBackend（后端→前端转换）

**新增字段映射：**
```javascript
convertFromBackend(bomData, includeChildren = false) {
  const converted = {
    // ... 其他字段
    totalLabor: bomData.total_labor,          // 新增
    totalMaterial: bomData.total_material,    // 新增
    productImage: bomData.product_image,      // 新增
    isPushedToManual: bomData.is_pushed_to_manual, // 新增
    // ...
  }
  return converted
}
```

### 2. convertToBackend（前端→后端转换）

**新增字段传递：**
```javascript
convertToBackend(bomData) {
  return {
    // ... 其他字段
    totalLabor: bomData.totalLabor,        // 新增
    totalMaterial: bomData.totalMaterial,  // 新增
    productImage: bomData.productImage,    // 新增
    // ...
  }
}
```

---

## 四、前端页面变更

### 文件：`/07-frontend/src/pages/bom/ProductionBom.vue`

### 1. 主表格新增列

#### （1）产品图片列

```vue
<el-table-column prop="productImage" label="产品图片" width="100">
  <template #default="{ row }">
    <el-image 
      v-if="row.productImage"
      :src="row.productImage" 
      :preview-src-list="[row.productImage]"
      :preview-teleported="true"
      style="width: 50px; height: 50px; cursor: pointer;"
      fit="cover"
    />
    <span v-else style="color: #909399;">无图片</span>
  </template>
</el-table-column>
```

#### （2）总人工列

```vue
<el-table-column prop="totalLabor" label="总人工" width="120" align="right">
  <template #default="{ row }">
    <span v-if="row.totalLabor">￥{{ parseFloat(row.totalLabor).toFixed(2) }}</span>
    <span v-else style="color: #909399;">-</span>
  </template>
</el-table-column>
```

#### （3）总材料列

```vue
<el-table-column prop="totalMaterial" label="总材料" width="120" align="right">
  <template #default="{ row }">
    <span v-if="row.totalMaterial">￥{{ parseFloat(row.totalMaterial).toFixed(2) }}</span>
    <span v-else style="color: #909399;">-</span>
  </template>
</el-table-column>
```

#### （4）是否推送列

```vue
<el-table-column prop="isPushedToManual" label="是否推送" width="100" align="center">
  <template #default="{ row }">
    <el-tag v-if="row.isPushedToManual" type="success">已推送</el-tag>
    <el-tag v-else type="info">未推送</el-tag>
  </template>
</el-table-column>
```

#### （5）操作列添加推送按钮

```vue
<el-table-column label="操作" width="280" fixed="right">
  <template #default="{ row }">
    <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
    <el-button link type="success" @click="handleView(row)">查看</el-button>
    <el-button link type="warning" @click="handlePushToManual(row)">推送</el-button>
    <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
  </template>
</el-table-column>
```

### 2. handleSubmit函数 - 添加产品图片自动获取逻辑

**位置：** 第1879-1895行

```javascript
// 保存前，从物料库获取产品图片
if (formData.value.productCode && !formData.value.productImage) {
  const material = materialList.value.find(m => m.materialCode === formData.value.productCode)
  if (material && material.materialImage) {
    formData.value.productImage = material.materialImage
  }
}
```

**说明：**
- 当产品编号存在且产品图片为空时
- 从物料库中查找对应的物料
- 如果物料有图片，则自动赋值给BOM的产品图片

### 3. handleSubmit函数 - 保存新字段到本地tableData

**更新模式（第1906-1918行）：**
```javascript
tableData.value[index] = {
  id: savedBom.id,
  // ... 其他字段
  totalLabor: formData.value.totalLabor,        // 新增
  totalMaterial: formData.value.totalMaterial,  // 新增
  productImage: formData.value.productImage,    // 新增
  updateTime: new Date().toLocaleString('zh-CN')
}
```

**创建模式（第1931-1944行）：**
```javascript
const newBom = {
  id: savedBom.id,
  // ... 其他字段
  totalLabor: formData.value.totalLabor,        // 新增
  totalMaterial: formData.value.totalMaterial,  // 新增
  productImage: formData.value.productImage,    // 新增
  createTime: new Date().toLocaleString('zh-CN'),
  updateTime: new Date().toLocaleString('zh-CN')
}
```

### 4. 推送到产品手册函数

**新增函数：** `handlePushToManual`

**位置：** 第2254-2389行

**功能流程：**

```
1. 检查产品编号
   ↓
2. 确认推送（显示BOM信息）
   ↓
3. 构建产品手册数据
   - 产品编号 = BOM产品编号
   - 产品名称 = BOM产品名称
   - 产品图片 = BOM产品图片
   - 来源 = ['自制']
   - 其他字段 = 默认值
   ↓
4. 检查localStorage中是否已存在相同产品编号
   ├─ 存在 → 询问是否覆盖
   │   ├─ 是 → 更新现有记录
   │   └─ 否 → 取消推送
   └─ 不存在 → 添加新记录
   ↓
5. 保存到localStorage
   - productManualData
   - productManualNextId
   ↓
6. 更新BOM推送状态
   - isPushedToManual = 1
   ↓
7. 显示成功消息
```

**关键代码：**
```javascript
// 构建产品手册数据
const productManualData = {
  productCode: row.productCode,
  productName: row.productName,
  productImage: row.productImage || '',
  source: ['自制'], // 默认来源为自制，用户可以后期更改
  category: '', // 用户后期填写
  specification: row.version || '',
  unit: '个',
  status: '在售',
  productStatus: '正常',
  version: row.version || 'V1.0',
  isEnabled: true,
  designer: row.designer || '',
  bomMaintainer: row.designer || '',
  createTime: new Date().toLocaleString('zh-CN'),
  updateTime: new Date().toLocaleString('zh-CN'),
  remark: `由生产BOM ${row.bomCode} 推送生成`
}

// 保存到localStorage
localStorage.setItem('productManualData', JSON.stringify(productList))
localStorage.setItem('productManualNextId', String(productList.length + 1))

// 更新BOM推送状态
const bomIndex = tableData.value.findIndex(b => b.id === row.id)
if (bomIndex !== -1) {
  tableData.value[bomIndex].isPushedToManual = 1
}
```

### 5. 查看详情对话框 - 添加总人工和总材料显示

**位置：** 第598-609行

```vue
<el-descriptions-item label="总人工">
  <span v-if="currentBom.totalLabor">￥{{ parseFloat(currentBom.totalLabor).toFixed(2) }}</span>
  <span v-else style="color: #909399;">-</span>
</el-descriptions-item>
<el-descriptions-item label="总材料">
  <span v-if="currentBom.totalMaterial">￥{{ parseFloat(currentBom.totalMaterial).toFixed(2) }}</span>
  <span v-else style="color: #909399;">-</span>
</el-descriptions-item>
```

---

## 五、数据流说明

### 1. 产品图片获取流程

```
用户选择产品编号
  ↓
handleProductCodeChange触发
  ↓
自动填充产品名称
  ↓
handleSubmit保存时
  ↓
检查：productCode存在 且 productImage为空
  ↓
从materialList中查找对应物料
  ↓
如果物料有materialImage
  ↓
赋值：formData.productImage = material.materialImage
  ↓
保存到数据库
```

### 2. 推送到产品手册流程

```
用户点击"推送"按钮
  ↓
handlePushToManual函数
  ↓
检查产品编号是否为空
  ↓
显示确认对话框
  ↓
构建产品手册数据
  ↓
从localStorage读取现有产品列表
  ↓
检查是否已存在相同产品编号
  ├─ 已存在 → 询问是否覆盖
  │   ├─ 覆盖 → 更新记录
  │   └─ 取消 → 终止推送
  └─ 不存在 → 添加新记录
  ↓
保存到localStorage
  ↓
更新BOM的isPushedToManual状态
  ↓
显示成功消息
```

### 3. 总人工和总材料计算流程

```
用户在新增/编辑页面
  ↓
点击"计算人工费用"按钮
  ↓
handleCalculateLabor函数
  ↓
遍历所有子件
  ↓
计算：level0Qty * processWage
  ↓
累加总和
  ↓
formData.totalLabor = total.toFixed(2)
  ↓
点击"提交"保存
  ↓
totalLabor保存到数据库
```

**总材料同理**，使用`handleCalculateMaterial`函数。

---

## 六、字段映射关系

### 前端 ⇔ 后端 ⇔ 数据库

| 前端字段 | 后端参数 | 数据库字段 | 类型 | 说明 |
|---------|---------|-----------|------|------|
| totalLabor | totalLabor | total_labor | REAL | 总人工费用 |
| totalMaterial | totalMaterial | total_material | REAL | 总材料费用 |
| productImage | productImage | product_image | TEXT | 产品图片URL |
| isPushedToManual | - | is_pushed_to_manual | INTEGER | 是否推送（0/1） |

### BOM → 产品手册字段映射

| BOM字段 | 产品手册字段 | 转换逻辑 |
|--------|------------|---------|
| productCode | productCode | 直接映射 |
| productName | productName | 直接映射 |
| productImage | productImage | 直接映射 |
| - | source | 默认：['自制'] |
| version | specification | 映射 |
| version | version | 映射 |
| designer | designer | 映射 |
| designer | bomMaintainer | 映射 |
| - | unit | 默认：'个' |
| - | status | 默认：'在售' |
| - | productStatus | 默认：'正常' |
| - | isEnabled | 默认：true |
| bomCode | remark | "由生产BOM XXX 推送生成" |

---

## 七、使用说明

### 1. 查看总人工和总材料

**步骤：**
1. 打开"生产BOM"页面
2. 点击任意BOM记录的"编辑"按钮
3. 在"父件属性"区域，可以看到"总人工"和"总材料"字段
4. 点击"计算人工费用"按钮，系统自动计算并显示总人工费用
5. 点击"计算材料费用"按钮，系统自动计算并显示总材料费用
6. 点击"提交"保存后，主表格会显示这两个字段

### 2. 产品图片自动获取

**前提条件：**
- 物料库中存在对应的物料记录
- 物料记录中已上传产品图片

**步骤：**
1. 在"新增/编辑BOM"页面
2. 选择"产品编号"（从下拉框选择）
3. 系统自动从物料库获取产品图片
4. 点击"提交"保存
5. 主表格会显示产品图片（缩略图）
6. 点击图片可以放大查看

### 3. 推送到产品手册

**步骤：**
1. 在"生产BOM"主表格中找到要推送的BOM
2. 点击操作列的"推送"按钮
3. 系统显示确认对话框，确认BOM信息
4. 点击"确定推送"
5. 如果产品手册中已存在相同产品编号，系统会询问是否覆盖
6. 推送成功后，"是否推送"列显示"已推送"标签
7. 打开"产品手册"页面，可以看到推送的产品

**注意事项：**
- 只有产品编号不为空的BOM才能推送
- 推送时会自动映射产品图片
- 默认来源为"自制"，可在产品手册中修改
- 推送后可以在产品手册中继续完善其他信息

### 4. 查看BOM详情

**步骤：**
1. 点击BOM记录的"查看"按钮
2. 在详情对话框中可以看到：
   - 所有基本信息
   - **总人工费用**（新增）
   - **总材料费用**（新增）
   - 所有子件列表

---

## 八、测试验证

### 1. 数据库字段验证

**验证脚本：**
```bash
cd /home/sardenesy/ai_workspaces/ai_desktop_3/backend
node scripts/add-bom-fields.js
```

**预期结果：**
```
✅ 已添加字段: total_labor
✅ 已添加字段: total_material
✅ 已添加字段: product_image
✅ 已添加字段: is_pushed_to_manual
```

### 2. 功能测试

#### （1）总人工和总材料计算
- [ ] 点击"计算人工费用"按钮，正确显示总和
- [ ] 点击"计算材料费用"按钮，正确显示总和
- [ ] 提交后，主表格显示计算结果
- [ ] 查看详情时显示计算结果

#### （2）产品图片自动获取
- [ ] 选择产品编号后，自动获取物料库中的图片
- [ ] 主表格正确显示产品图片
- [ ] 点击图片可以放大预览

#### （3）推送到产品手册
- [ ] 点击"推送"按钮，显示确认对话框
- [ ] 推送成功后，"是否推送"列显示"已推送"
- [ ] 产品手册中出现推送的产品
- [ ] 推送的数据字段映射正确

#### （4）覆盖推送
- [ ] 推送已存在的产品编号时，询问是否覆盖
- [ ] 选择"覆盖"，更新产品手册中的记录
- [ ] 选择"取消"，不修改产品手册

---

## 九、注意事项

1. **数据一致性**
   - 总人工和总材料需要手动点击计算按钮
   - 修改子件后需要重新计算
   - 计算结果会在提交时保存到数据库

2. **产品图片**
   - 图片URL存储在`product_image`字段
   - 从物料库的`material_image`字段获取
   - 如果物料库没有图片，则不会自动填充

3. **推送状态**
   - `is_pushed_to_manual`字段只记录是否推送过
   - 不影响实际推送操作
   - 可以重复推送（会覆盖）

4. **localStorage存储**
   - 产品手册数据存储在`productManualData`
   - 推送时会检查是否已存在相同产品编号
   - 清除浏览器缓存会丢失产品手册数据

---

## 十、文件清单

### 后端文件

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `/backend/config/database.js` | 修改 | 添加新字段到CREATE TABLE |
| `/backend/services/bomService.js` | 修改 | 添加新字段到INSERT和UPDATE |
| `/backend/scripts/add-bom-fields.js` | 新增 | 数据库迁移脚本 |

### 前端文件

| 文件路径 | 修改类型 | 说明 |
|---------|---------|------|
| `/07-frontend/src/services/api/bomApiService.js` | 修改 | 添加字段映射 |
| `/07-frontend/src/pages/bom/ProductionBom.vue` | 修改 | 主要功能实现 |

---

## 十一、版本历史

| 版本 | 日期 | 修改内容 |
|-----|------|---------|
| V1.0.0 | 2025-11-XX | 初始版本 |
| V1.1.0 | 2025-12-02 | 添加总人工、总材料、产品图片、推送功能 |

---

## 十二、后续优化建议

1. **推送状态同步**
   - 考虑在产品手册删除产品时，同步更新BOM的推送状态

2. **批量推送**
   - 添加批量选择BOM推送到产品手册的功能

3. **推送历史**
   - 记录推送时间和操作人员

4. **产品图片上传**
   - 允许在BOM页面直接上传产品图片，不依赖物料库

5. **推送规则配置**
   - 允许用户自定义推送时的字段映射规则

---

**开发人员：** AI Assistant  
**文档版本：** 1.0  
**最后更新：** 2025-12-02 11:50
