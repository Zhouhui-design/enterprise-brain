# 生产BOM数据共享功能实施指南

## ✅ 已完成的工作

### 1. 后端API（已完成）

- ✅ `backend/services/bomService.js` - BOM业务逻辑
- ✅ `backend/routes/productionBoms.js` - BOM API路由
- ✅ `backend/server.js` - 注册BOM路由
- ✅ 后端服务运行正常，API可访问

**测试结果**：
```bash
curl http://localhost:3005/api/production-boms/list
# 返回: {"code":200,"data":[],"message":"获取生产BOM列表成功"}
```

### 2. 前端API Service（已完成）

- ✅ `07-frontend/src/api/productionBom.js` - BOM API客户端
- ✅ `07-frontend/src/services/api/bomApiService.js` - BOM API服务（包含格式转换）

### 3. Vite代理配置（已完成）

- ✅ Vite已配置代理`/api` →  `http://localhost:3005`
- ✅ 前端使用相对路径`/api`，自动通过代理访问后端

---

## 🔧 还需要完成的工作

### 关键修改：ProductionBom.vue

需要修改以下函数使用`bomApiService`而不是`databaseService`：

#### 1. 保存BOM（第1092行附近）
```javascript
// 原代码
await databaseService.saveBom(bomToSave, 'productionBoms')

// 改为
await bomApiService.saveBom(bomToSave)
```

#### 2. 保存草稿（第1121行附近）
```javascript
// 原代码
await databaseService.saveBom(draftToSave, 'productionBomDrafts')

// 改为
// 草稿暂时仍使用本地存储，或者也改用后端
await databaseService.saveBom(draftToSave, 'productionBomDrafts')
```

#### 3. 删除BOM（第1225行附近）
```javascript
// 原代码
await databaseService.deleteBom(row.id, 'productionBoms')

// 改为
await bomApiService.deleteBom(row.id)
```

#### 4. 批量删除（第1249行附近）
```javascript
// 原代码
await databaseService.deleteBoms(ids, 'productionBoms')

// 改为
await bomApiService.deleteBoms(ids)
```

#### 5. 加载数据（第1717行附近）
```javascript
// 原代码
const boms = await databaseService.getAllBoms('productionBoms')

// 改为
const boms = await bomApiService.getAllBoms()
```

---

## 📝 完整修改步骤（供参考）

### 步骤1: 修改保存函数

在`handleSave`函数中：

```javascript
// 第1092行附近
if (isDraftMode.value) {
  // 保存草稿
  await databaseService.saveBom(draftToSave, 'productionBomDrafts')  // 保持不变或改用后端
} else {
  // 保存正式BOM
  await bomApiService.saveBom(bomToSave)  // ← 改这里
}
```

### 步骤2: 修改删除函数

在`handleDelete`函数中：

```javascript
// 第1225行附近
await bomApiService.deleteBom(row.id)  // ← 改这里
```

### 步骤3: 修改加载函数

在`onMounted`中：

```javascript
// 第1717行附近
const boms = await bomApiService.getAllBoms()  // ← 改这里
```

---

## 🎯 实施效果

修改完成后：

- ✅ **笔记本电脑**保存的BOM → 存储在服务器数据库
- ✅ **服务器本机**保存的BOM → 存储在服务器数据库
- ✅ **所有电脑**都能看到相同的BOM数据
- ✅ 真正的数据共享！

---

## 📊 数据流对比

### 修改前（数据不共享）：
```
笔记本电脑浏览器 → IndexedDB（笔记本本地） ❌ 数据孤立
服务器浏览器 → IndexedDB（服务器本地） ❌ 数据孤立
```

### 修改后（数据共享）：
```
笔记本电脑浏览器 → Vite代理 → 后端API → SQLite数据库 ✅ 共享
服务器浏览器 → Vite代理 → 后端API → SQLite数据库 ✅ 共享
```

---

## ⚠️ 重要提示

1. **备份数据**：修改前请导出现有BOM数据
2. **测试环境**：建议先在测试环境验证
3. **逐步迁移**：可以先迁移一部分功能，确认无误后再全部迁移

---

## 🚀 快速实施命令

如果需要我继续完成修改，请告诉我，我会立即修改`ProductionBom.vue`文件。

**预计所需Credits**: 约5000 tokens（修改5个函数）

---

**文档创建时间**: 2025-11-30  
**状态**: 后端API已完成，前端需要修改5个函数
