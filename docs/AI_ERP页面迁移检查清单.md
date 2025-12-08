# AI 开发 ERP 页面迁移检查清单

> 🎯 **目标**：确保所有表格页面使用 `StandardTablePage` 统一组件，避免重复功能和代码不一致

---

## 📋 迁移前检查（AI 必查）

### ✅ 第一步：识别页面类型

```
问题：这是一个表格类页面吗？
- [ ] 是 → 继续下一步
- [ ] 否 → 无需使用 StandardTablePage
```

**表格类页面特征**：
- 有列表数据展示
- 有搜索/筛选功能
- 有分页
- 有增删改查操作

### ✅ 第二步：确认必填参数

**必填项（3个）**：
1. `page-title` - 页面标题（如"销售订单列表"）
2. `settings-key` - 设置存储键名（如`sales-order-list`）
3. `columns` - 列定义数组

**示例**：
```vue
<StandardTablePage
  page-title="订单列表"
  settings-key="sales-order-list"
  :columns="orderColumns"
/>
```

### ✅ 第三步：检查功能需求

| 功能 | 配置项 | 默认值 | 何时启用 |
|------|--------|--------|----------|
| 批量删除 | `:show-batch-delete` | `true` | 默认启用 |
| 导入 | `:show-import` | `true` | 默认启用 |
| 导出 | `:show-export` | `true` | 默认启用 |
| 打印 | `:show-print` | `false` | 需要时设为`true` |
| 业务变量 | `:show-business-vars` | `false` | 主生产计划等需要 |
| 表头筛选 | `:show-filter` | `true` | 默认启用 |

---

## 🚫 禁止的错误（AI 强制规避）

### ❌ 错误1：手动添加重复按钮

```vue
<!-- ❌ 错误示例 -->
<StandardTablePage ...>
  <template #toolbar-left>
    <el-button @click="handleBatchDelete">批量删除</el-button>  <!-- 重复！ -->
  </template>
</StandardTablePage>
```

**正确做法**：
```vue
<!-- ✅ 正确示例 -->
<StandardTablePage
  :show-batch-delete="true"
  @batch-delete="handleBatchDelete"
/>
```

### ❌ 错误2：操作列插槽名称错误

```vue
<!-- ❌ 错误：使用 #action -->
<template #action="{ row }">
  <el-button @click="handleEdit(row)">编辑</el-button>
</template>

<!-- ✅ 正确：使用 #operation -->
<template #operation="{ row }">
  <el-button @click="handleEdit(row)">编辑</el-button>
</template>
```

### ❌ 错误3：缺少 settingsKey

```vue
<!-- ❌ 错误：没有 settings-key -->
<StandardTablePage
  page-title="订单列表"
  :columns="columns"
/>

<!-- ✅ 正确：必须提供唯一的 settings-key -->
<StandardTablePage
  page-title="订单列表"
  settings-key="sales-order-list"
  :columns="columns"
/>
```

### ❌ 错误4：列定义缺少必要属性

```vue
// ❌ 错误：没有 filterable
const columns = [
  { prop: 'orderNo', label: '订单编号' }
]

// ✅ 正确：需要筛选的列添加 filterable
const columns = [
  { prop: 'orderNo', label: '订单编号', width: 160, filterable: true },
  { prop: 'orderTime', label: '下单时间', width: 120, filterable: true, filterType: 'date' }
]
```

---

## 📝 标准模板（AI 直接使用）

### 模板 1：基础列表页

```vue
<template>
  <StandardTablePage
    page-title="【页面标题】"
    settings-key="【唯一键名】"
    :table-data="tableData"
    :columns="columns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @refresh="loadData"
    @batch-delete="handleBatchDelete"
    @export="handleExport"
    @settings-save="handleSettingsSave"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true">
        <el-form-item label="【字段名】">
          <el-input v-model="searchForm.【字段】" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 操作列 -->
    <template #operation="{ row }">
      <el-button size="small" @click="handleEdit(row)">编辑</el-button>
      <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </StandardTablePage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'

const columns = [
  { prop: '字段1', label: '标签1', width: 160, filterable: true },
  { prop: '字段2', label: '标签2', width: 180 }
]

const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchForm = ref({})

const loadData = async () => {
  loading.value = true
  // 加载数据逻辑
  loading.value = false
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadData()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadData()
}

const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

const handleReset = () => {
  searchForm.value = {}
  handleSearch()
}

const handleSettingsSave = (settings) => {
  console.log('设置已保存:', settings)
}

const handleBatchDelete = (rows) => {
  console.log('批量删除:', rows)
}

const handleExport = () => {
  console.log('导出数据')
}

onMounted(() => {
  loadData()
})
</script>
```

### 模板 2：带业务变量的页面（主生产计划）

```vue
<template>
  <StandardTablePage
    page-title="主生产计划"
    settings-key="production-plan-list"
    :table-data="planList"
    :columns="planColumns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-business-vars="true"
    :default-settings="defaultSettings"
    @page-change="handlePageChange"
    @refresh="loadPlans"
    @settings-save="handleSettingsSave"
  >
    <!-- 自定义工具栏 -->
    <template #toolbar-left>
      <el-button type="primary" @click="handleCustomAction">
        自定义操作
      </el-button>
    </template>

    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planCode" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 日期格式化 -->
    <template #column-plannedDate="{ row }">
      {{ formatDateYMD(row.plannedDate) }}
    </template>

    <!-- 操作列 -->
    <template #operation="{ row }">
      <el-button size="small" @click="handleEdit(row)">编辑</el-button>
    </template>
  </StandardTablePage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'

const planColumns = [
  { prop: 'planCode', label: '计划编号', width: 180, filterable: true },
  { prop: 'plannedDate', label: '计划日期', width: 140, filterable: true, filterType: 'date' }
]

const defaultSettings = {
  businessVars: {
    advanceStorageDays: 7  // 提前入库期
  }
}

const planList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchForm = ref({ planCode: '' })

const loadPlans = async () => {
  loading.value = true
  // 加载数据
  loading.value = false
}

const handleSettingsSave = (settings) => {
  console.log('业务变量:', settings.businessVars)
}

const formatDateYMD = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadPlans()
}

const handleSearch = () => {
  currentPage.value = 1
  loadPlans()
}

onMounted(() => {
  loadPlans()
})
</script>
```

---

## 🔍 迁移后验证清单

### 功能验证
- [ ] 页面正常加载数据
- [ ] 点击"设置"按钮，弹窗正常打开
- [ ] 在"字段管理"Tab中，可以拖动字段调整顺序
- [ ] 拖动时鼠标显示"移动"图标（不是"+"）
- [ ] 勾选/取消勾选字段，点击保存，表格列正常显示/隐藏
- [ ] 刷新页面，字段顺序和可见性保持不变
- [ ] 表头筛选正常工作
- [ ] 分页正常工作
- [ ] 批量删除功能正常
- [ ] 导出功能正常（如启用）
- [ ] 业务变量保存正常（如启用）

### 代码验证
- [ ] 没有重复的功能按钮
- [ ] `settingsKey` 唯一且符合规范
- [ ] 操作列使用 `#operation` 插槽
- [ ] 列定义完整（包括 `filterable`、`filterType` 等）
- [ ] 日期字段使用自定义格式化插槽

---

## 📊 迁移进度跟踪

### 待迁移页面列表

| 页面名称 | 路径 | 优先级 | 状态 | 备注 |
|----------|------|--------|------|------|
| 订单列表 | `/sales/orders/list` | 高 | ⏳ 待迁移 | - |
| 主生产计划 | `/production-planning/plan-list` | 高 | ⏳ 待迁移 | 需启用业务变量 |
| 备料计划 | `/production-planning/material-preparation` | 高 | ⏳ 待迁移 | - |
| 客户台账 | `/sales/orders/customers` | 中 | ⏳ 待迁移 | - |
| 销售BOM | `/sales/bom` | 中 | ⏳ 待迁移 | - |
| 产品手册 | `/product/manual` | 中 | ⏳ 待迁移 | - |
| 产品物料库 | `/material/list` | 中 | ⏳ 待迁移 | - |
| 设计BOM | `/design/bom` | 低 | ⏳ 待迁移 | - |
| 生产BOM | `/production/bom` | 低 | ⏳ 待迁移 | - |
| 工序列表 | `/process/list` | 低 | ⏳ 待迁移 | - |
| 预计结存 | `/inventory/forecast` | 低 | ⏳ 待迁移 | - |

**状态说明**：
- ⏳ 待迁移
- 🔄 迁移中
- ✅ 已完成
- ⚠️ 有问题

---

## 💡 AI 开发提示

### 使用此清单的步骤

1. **识别页面类型** → 是否为表格类页面
2. **复制对应模板** → 基础列表 or 带业务变量
3. **填充模板变量** → 替换【页面标题】、【唯一键名】等
4. **配置列定义** → 设置 `columns` 数组
5. **实现数据加载** → 完成 `loadData` 函数
6. **配置事件处理** → 实现 `handleSearch`、`handlePageChange` 等
7. **验证功能** → 按照验证清单逐项检查

### 常见问题速查

**Q1：settingsKey 应该怎么命名？**
- 格式：`模块-页面` 或 `一级菜单-二级菜单`
- 示例：`sales-order-list`、`production-plan-list`、`material-preparation-plan`

**Q2：日期字段如何格式化？**
```vue
<template #column-orderTime="{ row }">
  {{ formatDateYMD(row.orderTime) }}
</template>
```

**Q3：如何启用业务变量？**
```vue
<StandardTablePage
  :show-business-vars="true"
  :default-settings="{ businessVars: { advanceStorageDays: 7 } }"
  @settings-save="handleSettingsSave"
/>
```

**Q4：如何添加自定义工具栏按钮？**
```vue
<template #toolbar-left>
  <el-button type="primary" @click="handleCustomAction">
    自定义操作
  </el-button>
</template>
```

---

## 🎯 迁移目标

- ✅ **统一性**：所有表格页面使用相同组件和结构
- ✅ **功能完整**：列拖拽、筛选、排序、分页、批量操作
- ✅ **可维护性**：一次修改组件，所有页面受益
- ✅ **零重复**：避免功能重复实现

---

📅 **文档版本**: v1.0  
📝 **最后更新**: 2025-12-08  
🎯 **适用对象**: AI 开发助手

