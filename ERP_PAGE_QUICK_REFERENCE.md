# ⚡ ERP 页面开发 - 5秒快速参考

> **保护5000+页面**，避免重复错误！

---

## 🎯 一句话规则

**所有表格页面 = `StandardTablePage` 组件**

---

## 🔴 三大禁止

### 1️⃣ 禁止手动编写页面结构

```vue
<!-- ❌ 严重错误 -->
<div class="page-container">
  <div class="header">...</div>
  <el-card class="search">...</el-card>
  <el-card class="data">
    <EnhancedTable />
  </el-card>
</div>
```

```vue
<!-- ✅ 正确 -->
<StandardTablePage
  page-title="备料计划"
  :table-data="data"
  :columns="columns"
>
  <template #search-form>...</template>
</StandardTablePage>
```

---

### 2️⃣ 禁止重复功能按钮

```vue
<!-- ❌ 严重错误：2个批量删除 -->
<el-button @click="handleBatchDelete">批量删除</el-button>
<EnhancedTable :show-batch-delete="true" />
```

```vue
<!-- ✅ 正确：只在EnhancedTable启用 -->
<StandardTablePage
  :show-batch-delete="true"
  @batch-delete="handleBatchDelete"
/>
```

---

### 3️⃣ 禁止错误的插槽名

```vue
<!-- ❌ 错误 -->
<template #action="{ row }">

<!-- ✅ 正确 -->
<template #operation="{ row }">
```

---

## 📋 5秒开发流程

```
1. 导入组件
   import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'

2. 使用模板
   <StandardTablePage
     page-title="页面标题"
     :table-data="tableData"
     :columns="columns"
   >

3. 添加搜索
   <template #search-form>
     <el-form>...</el-form>
   </template>

4. 添加操作列
   <template #operation="{ row }">
     <el-button>编辑</el-button>
   </template>

   </StandardTablePage>

完成！✨
```

---

## 🎨 常用配置

```vue
<StandardTablePage
  page-title="标题"
  :table-data="data"
  :columns="columns"
  :loading="loading"
  :total="total"
  :current-page="page"
  :page-size="pageSize"
  :show-batch-delete="true"    <!-- 批量删除 -->
  :show-export="true"           <!-- 导出 -->
  :show-import="true"           <!-- 导入 -->
  @page-change="handlePageChange"
  @batch-delete="handleBatchDelete"
/>
```

---

## 🚨 错误速查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| 2个批量删除按钮 | 手动添加+组件自带 | 删除手动按钮，只用组件 |
| 操作列不能点击 | 用了`#action` | 改为`#operation` |
| 筛选不工作 | 未设置`filterable` | 列配置添加`filterable: true` |
| 页面结构混乱 | 手动编写 | 使用`StandardTablePage` |

---

## 📖 详细文档

- 完整规范: `ERP_STANDARD_PAGE_TEMPLATE.md`
- AI检查清单: `AI_ERP_PAGE_DEVELOPMENT_CHECKLIST.md`
- EnhancedTable: `ENHANCED_TABLE_QUICK_REFERENCE.md`

---

**记住**: 5000个页面，用StandardTablePage，一次正确！💪
