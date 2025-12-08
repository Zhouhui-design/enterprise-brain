# StandardTablePage 组件使用指南 v2.0

> 📌 **核心价值**：一个组件统一所有表格页面，避免重复开发，确保功能一致性

## 🎯 快速开始

### 基础用法（3步搞定）

```vue
<template>
  <StandardTablePage
    page-title="订单列表"
    settings-key="sales-order-list"
    :table-data="tableData"
    :columns="columns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    @page-change="handlePageChange"
    @refresh="loadData"
    @settings-save="handleSettingsSave"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
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
import { ref } from 'vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'

const columns = [
  { prop: 'orderNo', label: '订单编号', width: 160 },
  { prop: 'customerName', label: '客户名称', width: 200 },
  { prop: 'orderTime', label: '下单时间', width: 160 }
]

const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const loadData = () => {
  // 加载数据逻辑
}

const handleSettingsSave = (settings) => {
  console.log('设置已保存:', settings)
  // settings.fields - 字段顺序和可见性
  // settings.businessVars - 业务变量（如提前入库期）
}
</script>
```

---

## 📦 组件功能清单

### ✅ 已集成功能
1. **EnhancedTable** - 增强表格
   - 批量删除、导入、导出、打印
   - 表头筛选、排序
   - 分页
   - 多选框
   
2. **PageSettings** - 页面设置（v2.0 新增）
   - ✨ **列拖拽** - 鼠标拖动调整字段顺序
   - 列隐藏/显示
   - 业务变量设置（如提前入库期）
   - 编码规则设置
   - 打印/导出设置

3. **统一布局**
   - 页面标题栏
   - 搜索区域
   - 工具栏区域
   - 数据表格区域

### ⚙️ 可配置项

| 属性 | 说明 | 默认值 | 备注 |
|------|------|--------|------|
| `pageTitle` | 页面标题 | **必填** | 显示在页面顶部 |
| `settingsKey` | 设置存储键名 | **必填** | LocalStorage键名，如`sales-order-list` |
| `tableData` | 表格数据 | **必填** | 数组格式 |
| `columns` | 列配置 | **必填** | 字段定义数组 |
| `showSearch` | 显示搜索区 | `true` | - |
| `showBatchDelete` | 显示批量删除 | `true` | - |
| `showExport` | 显示导出按钮 | `true` | - |
| `showImport` | 显示导入按钮 | `true` | - |
| `showBusinessVars` | 显示业务变量 | `false` | 主生产计划需设为`true` |
| `showEncodingSettings` | 显示编码设置 | `false` | - |

---

## 🔥 三大页面迁移示例

### 1️⃣ 订单列表迁移

```vue
<template>
  <StandardTablePage
    page-title="销售订单列表"
    settings-key="sales-order-list"
    :table-data="orderList"
    :columns="orderColumns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    :show-business-vars="false"
    @page-change="handlePageChange"
    @size-change="handleSizeChange"
    @refresh="loadOrders"
    @batch-delete="handleBatchDelete"
    @export="handleExport"
    @settings-save="handleSettingsSave"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="输入订单编号" clearable />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="下单日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 自定义列显示 -->
    <template #column-orderTime="{ row }">
      {{ formatDateYMD(row.orderTime) }}
    </template>
    
    <template #column-customerDelivery="{ row }">
      {{ formatDateYMD(row.customerDelivery) }}
    </template>

    <!-- 操作列 -->
    <template #operation="{ row }">
      <el-button size="small" @click="handleEdit(row)">编辑</el-button>
      <el-button size="small" type="primary" @click="handleFormalOrder(row)">
        正式下单
      </el-button>
      <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </StandardTablePage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import axios from 'axios'

// 列定义
const orderColumns = [
  { prop: 'internalOrderNo', label: '内部订单编号', width: 160, filterable: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160, filterable: true },
  { prop: 'customerName', label: '客户名称', width: 180, filterable: true },
  { prop: 'productName', label: '产品名称', width: 180 },
  { prop: 'orderQuantity', label: '订单数量', width: 100, align: 'right' },
  { prop: 'orderTime', label: '下单时间', width: 120, filterable: true, filterType: 'date' },
  { prop: 'customerDelivery', label: '客户交期', width: 120, filterable: true, filterType: 'date' },
  { prop: 'outputProcess', label: '产出工序', width: 140 }
]

// 数据状态
const orderList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchForm = ref({
  orderNo: '',
  customerName: '',
  dateRange: []
})

// 加载订单数据
const loadOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    const { data } = await axios.get('/api/sales/orders', { params })
    orderList.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('加载订单失败:', error)
  } finally {
    loading.value = false
  }
}

// 日期格式化
const formatDateYMD = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 事件处理
const handlePageChange = (page) => {
  currentPage.value = page
  loadOrders()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadOrders()
}

const handleSearch = () => {
  currentPage.value = 1
  loadOrders()
}

const handleReset = () => {
  searchForm.value = { orderNo: '', customerName: '', dateRange: [] }
  handleSearch()
}

const handleSettingsSave = (settings) => {
  console.log('✅ 订单列表设置已保存:', settings)
  // settings.fields - 字段顺序和可见性已自动应用
}

const handleBatchDelete = (rows) => {
  console.log('批量删除:', rows)
}

const handleExport = () => {
  console.log('导出订单')
}

onMounted(() => {
  loadOrders()
})
</script>
```

---

### 2️⃣ 主生产计划迁移（含业务变量）

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
      <el-button
        type="primary"
        :disabled="selectedRows.length !== 1"
        @click="handleExecuteSchedule"
      >
        <el-icon><Timer /></el-icon>
        执行排程
      </el-button>
    </template>

    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planCode" clearable />
        </el-form-item>
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 日期格式化 -->
    <template #column-promisedDeliveryDate="{ row }">
      {{ formatDateYMD(row.promisedDeliveryDate) }}
    </template>
    
    <template #column-plannedStorageDate="{ row }">
      {{ formatDateYMD(row.plannedStorageDate) }}
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
import { Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 列定义
const planColumns = [
  { prop: 'planCode', label: '主生产计划编号', width: 180, filterable: true },
  { prop: 'productCode', label: '产品编号', width: 140 },
  { prop: 'productName', label: '产品名称', width: 180 },
  { prop: 'planQuantity', label: '计划数量', width: 100, align: 'right' },
  { prop: 'promisedDeliveryDate', label: '订单承诺交期', width: 140, filterable: true, filterType: 'date' },
  { prop: 'plannedStorageDate', label: '计划入库日期', width: 140, filterable: true, filterType: 'date' },
  { prop: 'internalOrderNo', label: '内部销售订单编号', width: 180 },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160 }
]

// 默认设置（含业务变量）
const defaultSettings = {
  businessVars: {
    advanceStorageDays: 7  // 提前入库期默认值
  }
}

// 数据状态
const planList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const selectedRows = ref([])
const searchForm = ref({ planCode: '', orderNo: '' })

// 加载数据
const loadPlans = async () => {
  loading.value = true
  try {
    const { data } = await axios.get('/api/production/plans', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...searchForm.value
      }
    })
    planList.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理设置保存
const handleSettingsSave = (settings) => {
  console.log('✅ 主生产计划设置已保存:', settings)
  
  // 获取业务变量
  const advanceStorageDays = settings.businessVars?.advanceStorageDays
  if (advanceStorageDays) {
    console.log('✅ 提前入库期:', advanceStorageDays, '天')
    // 可以将业务变量保存到其他地方，或触发重新计算
  }
}

// 执行排程
const handleExecuteSchedule = async () => {
  if (selectedRows.value.length !== 1) {
    ElMessage.warning('请选择且仅选择一条主计划')
    return
  }
  
  const plan = selectedRows.value[0]
  try {
    await axios.post('/api/production/execute-schedule', { planCode: plan.planCode })
    ElMessage.success('排程已执行')
    loadPlans()
  } catch (error) {
    ElMessage.error('执行排程失败')
  }
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

### 3️⃣ 备料计划迁移

```vue
<template>
  <StandardTablePage
    page-title="备料计划"
    settings-key="material-preparation-plan"
    :table-data="materialList"
    :columns="materialColumns"
    :loading="loading"
    :total="total"
    :current-page="currentPage"
    :page-size="pageSize"
    @page-change="handlePageChange"
    @refresh="loadMaterials"
    @settings-save="handleSettingsSave"
  >
    <!-- 搜索表单 -->
    <template #search-form>
      <el-form :inline="true">
        <el-form-item label="备料计划编号">
          <el-input v-model="searchForm.planCode" clearable />
        </el-form-item>
        <el-form-item label="来源主计划编号">
          <el-input v-model="searchForm.sourcePlanCode" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </template>

    <!-- 日期格式化 -->
    <template #column-demandDate="{ row }">
      {{ formatDateYMD(row.demandDate) }}
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
import axios from 'axios'

// 列定义
const materialColumns = [
  { prop: 'planCode', label: '备料计划编号', width: 180, filterable: true },
  { prop: 'sourcePlanCode', label: '来源主计划编号', width: 180 },
  { prop: 'materialCode', label: '计划物料编号', width: 140 },
  { prop: 'materialName', label: '计划物料名称', width: 180 },
  { prop: 'demandQuantity', label: '需求数量', width: 100, align: 'right' },
  { prop: 'demandDate', label: '需求日期', width: 120, filterable: true, filterType: 'date' },
  { prop: 'internalOrderNo', label: '销售订单编号', width: 180 },
  { prop: 'sourceProcess', label: '来源工序', width: 140 }
]

// 数据状态
const materialList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchForm = ref({ planCode: '', sourcePlanCode: '' })

// 加载数据
const loadMaterials = async () => {
  loading.value = true
  try {
    const { data } = await axios.get('/api/material/preparation', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value,
        ...searchForm.value
      }
    })
    materialList.value = data.list
    total.value = data.total
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

const formatDateYMD = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadMaterials()
}

const handleSearch = () => {
  currentPage.value = 1
  loadMaterials()
}

const handleSettingsSave = (settings) => {
  console.log('✅ 备料计划设置已保存:', settings)
}

onMounted(() => {
  loadMaterials()
})
</script>
```

---

## 🎨 插槽说明

| 插槽名 | 说明 | 示例 |
|--------|------|------|
| `#search-form` | 搜索表单区域 | 输入框、下拉框、日期选择器 |
| `#toolbar-left` | 工具栏左侧 | 自定义按钮（如"执行排程"） |
| `#toolbar-right` | 工具栏右侧 | 自定义按钮 |
| `#column-{prop}` | 自定义列显示 | `#column-orderTime="{ row }"` |
| `#operation` | 操作列内容 | 编辑、删除按钮 |

---

## 🔑 关键事件

| 事件名 | 说明 | 参数 |
|--------|------|------|
| `@refresh` | 刷新按钮点击 | - |
| `@page-change` | 页码改变 | `(page)` |
| `@size-change` | 每页条数改变 | `(size)` |
| `@settings-save` | 设置保存 | `(settings)` |
| `@batch-delete` | 批量删除 | `(rows)` |
| `@export` | 导出数据 | - |

---

## ✨ v2.0 新特性

### 1. 集成列拖拽功能
- 点击右上角"设置"按钮 → "字段管理"Tab
- 使用鼠标拖动字段调整顺序
- 勾选/取消勾选控制字段显示/隐藏

### 2. 业务变量支持
```vue
<StandardTablePage
  :show-business-vars="true"
  :default-settings="{ businessVars: { advanceStorageDays: 7 } }"
  @settings-save="handleSettingsSave"
/>
```

### 3. 自动持久化
- 字段顺序和可见性自动保存到 LocalStorage
- 下次打开页面自动恢复设置

---

## 🚀 迁移清单

### 迁移前检查
- [ ] 确认当前页面是表格类页面
- [ ] 整理列定义（`columns`数组）
- [ ] 整理搜索表单字段
- [ ] 整理操作按钮

### 迁移步骤
1. 导入 `StandardTablePage` 组件
2. 替换页面模板结构
3. 配置属性（`pageTitle`、`settingsKey`、`columns` 等）
4. 实现事件处理（`@refresh`、`@page-change` 等）
5. 测试功能（列拖拽、筛选、排序、分页）

### 迁移后验证
- [ ] 列拖拽功能正常
- [ ] 表头筛选正常
- [ ] 分页正常
- [ ] 批量删除正常
- [ ] 导入导出正常
- [ ] 业务变量保存正常（如有）

---

## ⚠️ 注意事项

1. **settingsKey 唯一性**：每个页面必须使用唯一的 `settingsKey`，避免设置冲突
2. **columns 定义完整性**：确保所有字段都在 `columns` 中定义，否则无法在设置中管理
3. **插槽命名规范**：操作列必须使用 `#operation`（不是 `#action`）
4. **日期格式化**：使用 `#column-{prop}` 插槽自定义日期显示格式
5. **业务变量**：仅在需要时启用 `:show-business-vars="true"`

---

## 📚 相关文档

- [EnhancedTable 组件文档](../07-frontend/src/components/common/EnhancedTable.README.md)
- [PageSettings 组件文档](../07-frontend/src/components/common/PageSettings.README.md)
- [FilterTable 组件文档](../07-frontend/src/components/common/tables/FilterTable.README.md)

---

## 💡 最佳实践

1. **统一使用 StandardTablePage**：所有新页面直接使用此组件，避免重复开发
2. **列定义规范化**：统一列宽、对齐方式、筛选类型
3. **日期格式统一**：使用统一的 `formatDateYMD` 函数
4. **业务变量命名**：使用语义化命名（如 `advanceStorageDays`）
5. **settingsKey 规范**：使用 `模块-页面` 格式（如 `sales-order-list`）

---

📅 **文档版本**: v2.0  
📝 **最后更新**: 2025-12-08  
✍️ **更新内容**: 集成 PageSettings 组件，支持列拖拽和业务变量设置

