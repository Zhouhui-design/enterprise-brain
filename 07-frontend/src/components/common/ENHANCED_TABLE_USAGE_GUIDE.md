# EnhancedTable 组件使用规范（必读）

## ⚠️ 重要提醒

**本文档是强制性规范，所有开发人员（包括AI助手）在使用 EnhancedTable 组件前必须阅读！**

违反本规范将导致：
- ❌ 重复分页组件
- ❌ 重复工具栏按钮
- ❌ 操作列无法点击
- ❌ 表头筛选失效

---

## 📋 目录

1. [基础用法](#基础用法)
2. [分页配置（必读）](#分页配置必读)
3. [操作列配置（必读）](#操作列配置必读)
4. [表头筛选配置](#表头筛选配置)
5. [常见错误及解决方案](#常见错误及解决方案)
6. [完整示例](#完整示例)

---

## 基础用法

```vue
<EnhancedTable
  :data="tableData"
  :columns="columns"
  :loading="loading"
/>
```

---

## 分页配置（必读）

### ⚠️ 关键原则：二选一，不能同时使用！

EnhancedTable **内置了分页组件**，默认启用（`showPagination: true`）。

### 方案一：使用内置分页（推荐）

```vue
<EnhancedTable
  :data="tableData"
  :columns="columns"
  :show-pagination="true"  <!-- 默认值，可省略 -->
  :total="total"
  :current-page="currentPage"
  :page-size="pageSize"
  @page-change="handlePageChange"
  @size-change="handleSizeChange"
/>

<!-- ❌ 不要再添加外部分页！ -->
```

### 方案二：使用外部分页

```vue
<EnhancedTable
  :data="tableData"
  :columns="columns"
  :show-pagination="false"  <!-- 🔴 必须禁用内置分页！ -->
/>

<!-- ✅ 使用外部分页 -->
<el-pagination
  v-model:current-page="pagination.page"
  v-model:page-size="pagination.pageSize"
  :total="pagination.total"
  @size-change="handleSizeChange"
  @current-change="handlePageChange"
/>
```

### ❌ 错误示例（导致重复分页）

```vue
<!-- 🚫 错误：未禁用内置分页，又添加了外部分页 -->
<EnhancedTable
  :data="tableData"
  :columns="columns"
  <!-- 缺少 :show-pagination="false" -->
/>
<el-pagination ... />  <!-- 导致页面出现2个分页组件！ -->
```

---

## 操作列配置（必读）

### ⚠️ 关键原则：插槽名称必须是 `operation`，不是 `action`！

EnhancedTable 的操作列使用 **`#operation`** 插槽。

### ✅ 正确用法

```vue
<EnhancedTable :data="tableData" :columns="columns">
  <template #operation="{ row }">
    <el-button @click="handleEdit(row)">编辑</el-button>
    <el-button @click="handleDelete(row)">删除</el-button>
  </template>
</EnhancedTable>
```

### ❌ 错误用法

```vue
<!-- 🚫 错误：使用了 #action，应该是 #operation -->
<EnhancedTable :data="tableData" :columns="columns">
  <template #action="{ row }">  <!-- ❌ 错误的插槽名 -->
    <el-button @click="handleEdit(row)">编辑</el-button>
  </template>
</EnhancedTable>
<!-- 结果：按钮显示但无法点击 -->
```

### 列配置中的操作列

```javascript
// columns 配置中不需要 slot 属性
const columns = [
  { prop: 'name', label: '名称', width: 120 },
  { prop: 'action', label: '操作', width: 150, fixed: 'right' }
  // ✅ 不需要 slot: 'operation'
]
```

---

## 表头筛选配置

### ⚠️ 关键原则：必须同时配置组件属性和列属性

```vue
<EnhancedTable
  :data="tableData"
  :columns="columns"
  :show-filter="true"  <!-- 🔴 必须启用 -->
/>
```

```javascript
const columns = [
  { 
    prop: 'name', 
    label: '名称', 
    width: 120,
    filterable: true  // 🔴 需要筛选的列必须设置
  }
]
```

### ❌ 错误示例

```vue
<!-- 🚫 错误：只设置了列属性，未启用组件属性 -->
<EnhancedTable :data="tableData" :columns="columns" />
<!-- 缺少 :show-filter="true"，导致筛选功能无效 -->
```

---

## 常见错误及解决方案

### 错误1：重复分页组件

**症状**：页面底部出现2个分页组件

**原因**：未禁用 EnhancedTable 内置分页，又添加了外部分页

**解决方案**：
```vue
<EnhancedTable :show-pagination="false" />  <!-- 添加这行 -->
<el-pagination ... />
```

---

### 错误2：操作列按钮无法点击

**症状**：编辑、删除按钮显示正常，但点击没反应

**原因**：使用了错误的插槽名称 `#action`

**解决方案**：
```vue
<template #operation="{ row }">  <!-- 改为 operation -->
  <el-button @click="handleEdit(row)">编辑</el-button>
</template>
```

---

### 错误3：表头筛选图标无反应

**症状**：筛选图标显示，但点击无反应

**原因**：未在组件上启用 `:show-filter="true"`

**解决方案**：
```vue
<EnhancedTable :show-filter="true" />  <!-- 添加这行 -->
```

---

### 错误4：控制台CSS警告

**症状**：浏览器控制台出现 "解析 'left' 的值时出错"

**原因**：通常与表头筛选相关，但不影响功能

**解决方案**：忽略此警告（已知问题，不影响使用）

---

## 完整示例

### 示例1：使用内置分页（推荐）

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
      @selection-change="handleSelectionChange"
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

<script setup>
import { ref } from 'vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'

const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', width: 120, filterable: true },
  { prop: 'status', label: '状态', width: 100, filterable: true },
  { prop: 'action', label: '操作', width: 150, fixed: 'right' }
]

const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}
</script>
```

---

### 示例2：使用外部分页

```vue
<template>
  <div class="page-container">
    <EnhancedTable
      ref="tableRef"
      :data="tableData"
      :columns="columns"
      :show-filter="true"
      :show-pagination="false"  <!-- 🔴 禁用内置分页 -->
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
        :page-sizes="[20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'

const tableData = ref([])
const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const columns = [
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'name', label: '名称', width: 120, filterable: true },
  { prop: 'action', label: '操作', width: 150, fixed: 'right' }
]

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}
</script>
```

---

## 🎯 快速检查清单

在使用 EnhancedTable 前，请确认：

- [ ] **分页配置**：使用内置分页？还是外部分页？
  - 使用内置：`:show-pagination="true"` （默认）
  - 使用外部：`:show-pagination="false"` + `<el-pagination>`
- [ ] **操作列**：使用 `#operation` 插槽（不是 `#action`）
- [ ] **表头筛选**：需要？添加 `:show-filter="true"`
- [ ] **列配置**：需要筛选的列添加 `filterable: true`

---

## 📞 遇到问题？

1. 先查看本文档的 [常见错误及解决方案](#常见错误及解决方案)
2. 参考 [完整示例](#完整示例)
3. 检查 EnhancedTable 组件源码：`src/components/common/EnhancedTable.vue`

---

**版本**: 1.0  
**更新日期**: 2025-12-07  
**适用范围**: 所有使用 EnhancedTable 组件的页面（约5000+页面）
