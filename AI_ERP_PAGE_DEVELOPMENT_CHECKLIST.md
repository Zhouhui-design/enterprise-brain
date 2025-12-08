# 🤖 AI开发强制检查清单 - ERP表格页面

> **强制执行**: 所有AI在生成ERP表格页面代码前必须执行此检查清单  
> **违规成本**: 5000个页面 × 修复时间 = 项目失败

---

## ⚡ 3秒决策树

```
开始 → 是表格页面? 
         ↓ 是
      使用 StandardTablePage 组件
         ↓
      执行下面检查清单
         ↓
      生成代码
```

---

## 📋 强制检查清单

### 第1步：确认页面类型 ✅

**问题**: 这是什么类型的页面？

- [ ] **表格类页面**（列表、管理、查询页面）→ **必须使用** `StandardTablePage`
- [ ] **表单类页面**（新增、编辑）→ 不使用
- [ ] **仪表板页面**（图表、统计）→ 不使用
- [ ] **特殊页面**（需要与用户确认）

**如果是表格类页面，继续第2步**

---

### 第2步：配置功能按钮 ✅

**问题**: 需要哪些功能按钮？

- [ ] 批量删除 → 设置 `:show-batch-delete="true"` (默认)
- [ ] 导出 → 设置 `:show-export="true"` (默认)
- [ ] 导入 → 设置 `:show-import="true"` (默认)
- [ ] 打印 → 设置 `:show-print="true"`
- [ ] 新增（工具栏）→ 设置 `:show-add="true"`
- [ ] 新增（页面右上角）→ 设置 `:show-create="true"`

**⚠️ 关键检查**: 
- ❌ 不要同时在多处添加相同功能按钮
- ❌ 不要手动添加 `<el-button>批量删除</el-button>`（由组件管理）

---

### 第3步：配置搜索栏 ✅

**问题**: 需要搜索功能吗？

- [ ] **需要搜索** → 使用 `#search-form` 插槽
- [ ] **不需要搜索** → 设置 `:show-search="false"`

**代码模板**:
```vue
<StandardTablePage ...>
  <template #search-form>
    <el-form :inline="true" :model="searchForm">
      <el-form-item label="编号">
        <el-input v-model="searchForm.code" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </template>
</StandardTablePage>
```

---

### 第4步：配置表格列 ✅

**问题**: 表格需要哪些列？

必须检查：
- [ ] 列配置数组已定义
- [ ] 需要筛选的列设置 `filterable: true`
- [ ] 操作列使用 `#operation` 插槽（不是 `#action`）

**代码模板**:
```javascript
const columns = [
  { prop: 'code', label: '编号', width: 140, filterable: true },
  { prop: 'name', label: '名称', width: 180, filterable: true },
  { prop: 'status', label: '状态', width: 100, filterable: true },
  { prop: 'action', label: '操作', width: 150, fixed: 'right' }
]
```

```vue
<template #operation="{ row }">
  <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
  <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
</template>
```

---

### 第5步：配置分页 ✅

**问题**: 需要分页吗？

- [ ] **需要分页** → `:show-pagination="true"` (默认)
- [ ] **不需要分页** → `:show-pagination="false"`

**必须配置**:
```vue
<StandardTablePage
  :total="total"
  :current-page="currentPage"
  :page-size="pageSize"
  @page-change="handlePageChange"
  @size-change="handleSizeChange"
/>
```

---

### 第6步：事件处理 ✅

**问题**: 需要处理哪些事件？

常用事件：
- [ ] `@page-change` → 翻页
- [ ] `@size-change` → 改变每页条数
- [ ] `@batch-delete` → 批量删除
- [ ] `@export` → 导出
- [ ] `@import` → 导入
- [ ] `@refresh` → 刷新

**代码模板**:
```javascript
const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  loadData()
}

const handleBatchDelete = () => {
  // 批量删除逻辑
}
```

---

## 🚫 禁止的错误模式

### 错误1：重复的批量删除按钮

```vue
<!-- ❌ 严重错误 -->
<StandardTablePage :show-batch-delete="true">
  <template #toolbar-left>
    <el-button @click="handleBatchDelete">批量删除</el-button> <!-- 重复！ -->
  </template>
</StandardTablePage>
```

**修复**:
```vue
<!-- ✅ 正确 -->
<StandardTablePage :show-batch-delete="true">
  <!-- 不需要手动添加批量删除按钮 -->
</StandardTablePage>
```

---

### 错误2：手动编写页面结构

```vue
<!-- ❌ 严重错误：手动编写 -->
<div class="page-container">
  <div class="page-header">
    <h2>标题</h2>
  </div>
  <el-card class="search-card">
    <!-- 搜索表单 -->
  </el-card>
  <el-card class="data-card">
    <EnhancedTable ... />
  </el-card>
</div>
```

**修复**:
```vue
<!-- ✅ 正确：使用标准模板 -->
<StandardTablePage
  page-title="标题"
  :table-data="tableData"
  :columns="columns"
>
  <template #search-form>
    <!-- 搜索表单 -->
  </template>
</StandardTablePage>
```

---

### 错误3：错误的操作列插槽名

```vue
<!-- ❌ 严重错误 -->
<StandardTablePage ...>
  <template #action="{ row }">  <!-- 错误的插槽名 -->
    <el-button>编辑</el-button>
  </template>
</StandardTablePage>
```

**修复**:
```vue
<!-- ✅ 正确 -->
<StandardTablePage ...>
  <template #operation="{ row }">  <!-- 正确的插槽名 -->
    <el-button>编辑</el-button>
  </template>
</StandardTablePage>
```

---

## 📝 标准代码模板

### 模板1：完整的表格页面

```vue
<template>
  <StandardTablePage
    page-title="备料计划"
    page-subtitle="备料计划列表"
    :table-data="tableData"
    :columns="columns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-batch-delete="true"
    :show-export="true"
    :show-import="true"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @batch-delete="handleBatchDelete"
    @export="handleExport"
    @import="handleImport"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planNo" clearable />
        </el-form-item>
        <el-form-item label="物料编号">
          <el-input v-model="searchForm.materialCode" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 操作列 -->
    <template #operation="{ row }">
      <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
      <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </StandardTablePage>
</template>

<script setup>
import { ref, reactive } from 'vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'

const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const searchForm = reactive({
  planNo: '',
  materialCode: ''
})

const columns = [
  { prop: 'planNo', label: '计划编号', width: 160, filterable: true },
  { prop: 'materialCode', label: '物料编号', width: 140, filterable: true },
  { prop: 'materialName', label: '物料名称', width: 180, filterable: true },
  { prop: 'demandQuantity', label: '需求数量', width: 120, align: 'right' },
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

const handleBatchDelete = () => {
  // 批量删除逻辑
}

const handleExport = () => {
  // 导出逻辑
}

const handleImport = () => {
  // 导入逻辑
}
</script>
```

---

### 模板2：带自定义工具栏按钮

```vue
<template>
  <StandardTablePage
    page-title="主生产计划"
    :table-data="tableData"
    :columns="columns"
    :show-toolbar="true"
    :show-batch-delete="true"
  >
    <template #search-form>
      <!-- 搜索表单 -->
    </template>

    <!-- 自定义工具栏按钮 -->
    <template #toolbar-left>
      <el-button 
        type="success" 
        :disabled="selectedRows.length !== 1" 
        @click="handleExecuteSchedule"
      >
        <el-icon><Operation /></el-icon>
        执行排程
      </el-button>
    </template>

    <template #operation="{ row }">
      <el-button link @click="handleEdit(row)">编辑</el-button>
    </template>
  </StandardTablePage>
</template>
```

---

## 🎯 AI自我检查

**生成代码后，AI必须自问**:

1. ✅ 我使用了 `StandardTablePage` 组件吗？
2. ✅ 我有没有手动添加重复的功能按钮？
3. ✅ 操作列插槽名是 `#operation` 而不是 `#action` 吗？
4. ✅ 需要筛选的列都设置了 `filterable: true` 吗？
5. ✅ 分页事件处理正确吗？

**如果任何一个答案是"否"，必须修改代码！**

---

## 📊 使用决策表

| 场景 | 使用StandardTablePage? | 配置 |
|------|---------------------|------|
| 列表页 | ✅ 是 | 基础配置 |
| 管理页 | ✅ 是 | + 批量删除、导出 |
| 查询页 | ✅ 是 | + 搜索表单 |
| 新增页 | ❌ 否 | 使用表单组件 |
| 编辑页 | ❌ 否 | 使用表单组件 |
| 仪表板 | ❌ 否 | 自定义布局 |

---

## 📞 遇到问题？

1. 先查看 `ERP_STANDARD_PAGE_TEMPLATE.md`
2. 参考标准代码模板
3. 检查 `StandardTablePage.vue` 组件源码

---

**版本**: 1.0  
**更新日期**: 2025-12-07  
**强制执行**: 是  
**适用AI**: 所有参与项目的AI助手
