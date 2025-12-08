# 📋 ERP 标准页面模板 - 强制使用规范

> **适用范围**: 所有ERP表格类页面（约5000+页面）  
> **目标**: 统一风格、避免重复功能、确保功能有效性

---

## 🎯 核心原则

### 原则1：一个页面只有一套功能按钮
**❌ 禁止**: 同一个功能在页面上出现多次（如2个批量删除按钮）  
**✅ 标准**: 所有功能按钮统一由 `StandardTablePage` 或 `EnhancedTable` 管理

### 原则2：默认使用标准模板
**❌ 禁止**: 手动编写页面结构（标题、搜索栏、表格、工具栏）  
**✅ 标准**: 使用 `StandardTablePage` 组件

### 原则3：功能必须经过测试验证
**❌ 禁止**: 添加未测试的功能（删除、筛选、排序等）  
**✅ 标准**: 所有功能必须在标准模板中验证通过

---

## 📦 StandardTablePage 组件

### 组件位置
```
07-frontend/src/components/common/layout/StandardTablePage.vue
```

### 组件特点
- ✅ 统一的页面布局（标题栏、搜索栏、表格区）
- ✅ 集成 EnhancedTable 组件
- ✅ 避免重复按钮和功能
- ✅ 所有功能经过验证（删除、筛选、分页）
- ✅ 标准化的样式和交互

---

## 🔧 基础用法

### 最简单的表格页面

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
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @batch-delete="handleBatchDelete"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planNo" clearable />
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
  planNo: ''
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
  // 加载数据
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
  // 加载数据
}

const handleBatchDelete = () => {
  // 批量删除逻辑
}
</script>
```

---

## ⚙️ 配置选项

### 1. 页面基础配置

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `page-title` | String | **必填** | 页面标题 |
| `page-subtitle` | String | '' | 页面副标题 |
| `show-search` | Boolean | true | 是否显示搜索区域 |
| `show-page-settings` | Boolean | true | 是否显示页面设置按钮 |

### 2. EnhancedTable 配置

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `table-data` | Array | **必填** | 表格数据 |
| `columns` | Array | **必填** | 列配置 |
| `loading` | Boolean | false | 加载状态 |
| `show-selection` | Boolean | true | 显示多选框 |
| `show-filter` | Boolean | true | 显示表头筛选 |
| `show-pagination` | Boolean | true | 显示分页 |

### 3. 工具栏按钮配置

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `show-enhanced-toolbar` | Boolean | true | 显示EnhancedTable工具栏 |
| `show-add` | Boolean | false | 显示新增按钮 |
| `show-batch-delete` | Boolean | true | 显示批量删除按钮 |
| `show-export` | Boolean | true | 显示导出按钮 |
| `show-import` | Boolean | true | 显示导入按钮 |
| `show-print` | Boolean | false | 显示打印按钮 |

### 4. 分页配置

| 属性 | 类型 | 默认值 | 说明 |
|-----|------|-------|------|
| `total` | Number | 0 | 总记录数 |
| `current-page` | Number | 1 | 当前页码 |
| `page-size` | Number | 20 | 每页条数 |

---

## 🎨 高级用法

### 示例1：带自定义工具栏按钮

```vue
<StandardTablePage
  page-title="主生产计划"
  :table-data="tableData"
  :columns="columns"
  :show-toolbar="true"
>
  <!-- 搜索表单 -->
  <template #search-form>
    <!-- ... -->
  </template>

  <!-- 自定义工具栏左侧按钮 -->
  <template #toolbar-left>
    <el-button type="success" @click="handleExecuteSchedule">
      <el-icon><Operation /></el-icon>
      执行排程
    </el-button>
  </template>

  <!-- 操作列 -->
  <template #operation="{ row }">
    <el-button link @click="handleEdit(row)">编辑</el-button>
  </template>
</StandardTablePage>
```

### 示例2：不显示搜索栏

```vue
<StandardTablePage
  page-title="简单列表"
  :show-search="false"
  :table-data="tableData"
  :columns="columns"
>
  <template #operation="{ row }">
    <el-button link @click="handleEdit(row)">编辑</el-button>
  </template>
</StandardTablePage>
```

### 示例3：页面右上角新增按钮

```vue
<StandardTablePage
  page-title="物料管理"
  :show-create="true"
  :table-data="tableData"
  :columns="columns"
  @create="handleCreate"
>
  <template #search-form>
    <!-- ... -->
  </template>
</StandardTablePage>
```

---

## 📤 可用插槽

| 插槽名 | 作用域参数 | 说明 |
|-------|-----------|------|
| `header-actions` | - | 页面标题栏右侧自定义按钮 |
| `search-form` | - | 搜索表单内容 |
| `toolbar-left` | - | 工具栏左侧自定义按钮 |
| `toolbar-right` | - | 工具栏右侧自定义按钮 |
| `operation` | `{ row }` | 操作列内容（EnhancedTable） |
| 其他列插槽 | `{ row }` | 自定义列内容（如 `#status`） |

---

## 🎯 事件说明

| 事件名 | 参数 | 说明 |
|-------|------|------|
| `create` | - | 点击新增按钮（页面右上角） |
| `open-settings` | - | 点击页面设置按钮 |
| `selection-change` | `selection` | 表格多选变化 |
| `page-change` | `page` | 页码变化 |
| `size-change` | `size` | 每页条数变化 |
| `add` | - | 点击新增按钮（工具栏） |
| `batch-delete` | - | 点击批量删除按钮 |
| `export` | - | 点击导出按钮 |
| `import` | - | 点击导入按钮 |
| `refresh` | - | 点击刷新按钮 |

---

## ⚠️ 重要注意事项

### 1. 避免重复功能按钮

**❌ 错误示例**：同时启用多处的批量删除

```vue
<!-- 错误：2个批量删除按钮 -->
<StandardTablePage
  :show-batch-delete="true"
  :show-toolbar="true"
>
  <template #toolbar-left>
    <el-button @click="handleBatchDelete">批量删除</el-button> <!-- ❌ 重复 -->
  </template>
</StandardTablePage>
```

**✅ 正确示例**：只在一处启用批量删除

```vue
<!-- 正确：只有EnhancedTable的批量删除 -->
<StandardTablePage
  :show-batch-delete="true"
  :show-toolbar="false"
>
</StandardTablePage>
```

### 2. 操作列插槽名称

**必须使用** `#operation` 插槽（不是 `#action`）

```vue
<!-- ✅ 正确 -->
<template #operation="{ row }">
  <el-button @click="handleEdit(row)">编辑</el-button>
</template>

<!-- ❌ 错误 -->
<template #action="{ row }">
  <el-button @click="handleEdit(row)">编辑</el-button>
</template>
```

### 3. 表头筛选配置

列配置中需要筛选的字段必须设置 `filterable: true`

```javascript
const columns = [
  { 
    prop: 'planNo', 
    label: '计划编号', 
    width: 160,
    filterable: true  // ✅ 启用筛选
  }
]
```

---

## 🚀 迁移指南

### 从现有页面迁移到标准模板

**步骤1**: 导入组件

```javascript
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
```

**步骤2**: 替换页面结构

```vue
<!-- 删除原有的 -->
<!-- <div class="page-header">...</div> -->
<!-- <el-card class="search-card">...</el-card> -->
<!-- <el-card class="data-card">...</el-card> -->

<!-- 使用标准模板 -->
<StandardTablePage
  page-title="页面标题"
  :table-data="tableData"
  :columns="columns"
>
  <template #search-form>
    <!-- 保留原搜索表单 -->
  </template>
  
  <template #operation="{ row }">
    <!-- 保留原操作列 -->
  </template>
</StandardTablePage>
```

**步骤3**: 删除重复的工具栏代码

移除手动添加的批量删除、导出等按钮，由标准模板统一管理。

**步骤4**: 测试功能

- [ ] 搜索功能正常
- [ ] 分页功能正常
- [ ] 批量删除正常
- [ ] 导出功能正常
- [ ] 表头筛选正常
- [ ] 操作列按钮可点击

---

## 📊 标准模板 vs 手动编写

| 对比项 | 手动编写 | 标准模板 |
|-------|---------|---------|
| 开发时间 | 30-60分钟 | 5-10分钟 |
| 重复功能风险 | 高 | 无 |
| 风格一致性 | 低 | 高 |
| 功能可靠性 | 需要测试 | 已验证 |
| 维护成本 | 高 | 低 |
| 代码量 | 200-300行 | 50-100行 |

---

## 🎓 强制执行规则

### 规则1：所有新页面必须使用标准模板

**适用场景**: 所有表格类页面（列表页、管理页）

**违规后果**: 可能出现重复功能、风格不一致、功能失效

### 规则2：已有页面逐步迁移

**迁移原则**: 经用户提醒后，统一迁移到标准模板

**迁移优先级**: 
1. 有重复功能的页面（高优先级）
2. 功能失效的页面（高优先级）
3. 其他页面（正常优先级）

### 规则3：特殊页面需要评审

**特殊场景**: 非标准表格页面（如仪表板、可编辑表格）

**处理方式**: 讨论确认后决定是否使用标准模板

---

## 📖 相关文档

- EnhancedTable 使用指南: `07-frontend/src/components/common/ENHANCED_TABLE_USAGE_GUIDE.md`
- EnhancedTable 快速参考: `ENHANCED_TABLE_QUICK_REFERENCE.md`
- AI 开发规范: `07-frontend/src/components/common/AI_DEVELOPMENT_CHECKLIST.md`

---

**版本**: 1.0  
**更新日期**: 2025-12-07  
**强制执行**: 是  
**适用范围**: 5000+ ERP表格页面
