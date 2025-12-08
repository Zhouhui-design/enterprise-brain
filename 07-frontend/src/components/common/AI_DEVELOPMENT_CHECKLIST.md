# AI 开发规范 - EnhancedTable 组件使用检查清单

## 📌 强制执行规则

**适用对象**: 所有AI助手在生成使用 EnhancedTable 组件的代码时

**执行时机**: 在生成任何包含 EnhancedTable 的代码前

---

## ✅ 必须执行的检查项

### 第1步：确定分页方案

**问题**: 这个页面使用内置分页还是外部分页？

- [ ] **方案A - 内置分页**（推荐）
  ```vue
  <EnhancedTable
    :show-pagination="true"  <!-- 默认值，可省略 -->
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    @page-change="handlePageChange"
  />
  ```
  ✅ 不需要外部 `<el-pagination>`

- [ ] **方案B - 外部分页**
  ```vue
  <EnhancedTable
    :show-pagination="false"  <!-- 🔴 必须添加！ -->
  />
  <el-pagination ... />
  ```
  ⚠️ **关键**: 必须添加 `:show-pagination="false"`

**检查点**: 
- ❌ 如果选择方案B但忘记添加 `:show-pagination="false"` → **严重错误**
- ❌ 如果既启用内置分页又添加外部分页 → **严重错误**

---

### 第2步：配置操作列

**问题**: 需要操作列（编辑/删除按钮）吗？

- [ ] **需要操作列**
  ```vue
  <EnhancedTable ...>
    <template #operation="{ row }">  <!-- 🔴 必须是 operation，不是 action -->
      <el-button @click="handleEdit(row)">编辑</el-button>
      <el-button @click="handleDelete(row)">删除</el-button>
    </template>
  </EnhancedTable>
  ```

**检查点**:
- ❌ 使用 `#action` 而不是 `#operation` → **严重错误**（按钮无法点击）
- ❌ 在 columns 中添加 `slot: 'operation'` → **不需要**

---

### 第3步：配置表头筛选

**问题**: 需要表头筛选功能吗？

- [ ] **需要表头筛选**
  ```vue
  <EnhancedTable
    :show-filter="true"  <!-- 🔴 必须添加！ -->
    :columns="columns"
  />
  ```
  
  ```javascript
  const columns = [
    { 
      prop: 'name', 
      label: '名称',
      filterable: true  // 🔴 需要筛选的列必须设置
    }
  ]
  ```

**检查点**:
- ❌ 列设置了 `filterable: true` 但组件未设置 `:show-filter="true"` → **功能失效**

---

## 🎯 完整检查流程

**在生成代码前，按以下步骤思考**:

1. **分页** → 内置还是外部？如果外部，必须 `:show-pagination="false"`
2. **操作列** → 需要吗？如果需要，必须用 `#operation` 插槽
3. **筛选** → 需要吗？如果需要，必须 `:show-filter="true"`

---

## 🚫 禁止的错误模式

### 错误模式1：重复分页

```vue
<!-- 🚫 严重错误 -->
<EnhancedTable :data="tableData" :columns="columns" />
<el-pagination ... />
```

**修复**:
```vue
<EnhancedTable :show-pagination="false" ... />  <!-- 添加这行 -->
<el-pagination ... />
```

---

### 错误模式2：错误的操作列插槽

```vue
<!-- 🚫 严重错误 -->
<EnhancedTable>
  <template #action="{ row }">  <!-- ❌ 错误 -->
    <el-button>编辑</el-button>
  </template>
</EnhancedTable>
```

**修复**:
```vue
<EnhancedTable>
  <template #operation="{ row }">  <!-- ✅ 正确 -->
    <el-button>编辑</el-button>
  </template>
</EnhancedTable>
```

---

### 错误模式3：筛选功能未启用

```vue
<!-- 🚫 功能失效 -->
<EnhancedTable :columns="columns" />
```

```javascript
const columns = [
  { prop: 'name', label: '名称', filterable: true }  // 不会生效
]
```

**修复**:
```vue
<EnhancedTable :show-filter="true" :columns="columns" />  <!-- 添加这行 -->
```

---

## 📋 标准代码模板

### 模板1：内置分页 + 操作列 + 筛选

```vue
<template>
  <div class="page-container">
    <EnhancedTable
      ref="tableRef"
      :data="tableData"
      :columns="columns"
      :show-filter="true"
      :show-pagination="true"
      :loading="loading"
      :total="total"
      :current-page="currentPage"
      :page-size="pageSize"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #operation="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </EnhancedTable>
  </div>
</template>
```

---

### 模板2：外部分页 + 操作列 + 筛选

```vue
<template>
  <div class="page-container">
    <EnhancedTable
      ref="tableRef"
      :data="tableData"
      :columns="columns"
      :show-filter="true"
      :show-pagination="false"  <!-- 🔴 关键：禁用内置分页 -->
      :loading="loading"
    >
      <template #operation="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
      </template>
    </EnhancedTable>

    <!-- 外部分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>
```

---

## 🎓 AI 自我检查问题

**在生成代码后，AI必须自问**:

1. ✅ 我是否在使用外部分页的同时添加了 `:show-pagination="false"`？
2. ✅ 我是否使用了 `#operation` 而不是 `#action`？
3. ✅ 我是否同时配置了 `:show-filter="true"` 和列的 `filterable: true`？
4. ✅ 我是否避免了重复配置（既有内置又有外部）？

**如果任何一个答案是"否"，必须修改代码！**

---

## 📊 影响范围

- **受影响页面数量**: 约5000个
- **错误成本**: 每个页面如果犯同样的错误，需要修复5000次
- **节约成本**: 遵循本规范，一次正确，永久正确

---

**版本**: 1.0  
**更新日期**: 2025-12-07  
**强制执行**: 是
