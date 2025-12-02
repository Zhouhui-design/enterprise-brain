# FilterTable 通用表头筛选组件

## 功能介绍

FilterTable 是一个通用的表格组件，支持类似 WPS/Excel 的表头筛选功能。

### 主要特性

1. **表头筛选** - 点击列头筛选图标进行筛选
2. **多种筛选类型** - 支持文本、选择、数字、日期筛选
3. **多条件组合** - 支持多列同时筛选
4. **实时筛选** - 筛选结果实时显示
5. **筛选状态保存** - 筛选配置可导出/导入

## 使用方法

### 基础用法

```vue
<template>
  <FilterTable
    :data="tableData"
    :columns="columns"
    show-selection
    show-index
    @filter-change="handleFilterChange"
  >
    <!-- 自定义列插槽 -->
    <template #status="{ row }">
      <el-tag :type="row.status === 'active' ? 'success' : 'info'">
        {{ row.status }}
      </el-tag>
    </template>
  </FilterTable>
</template>

<script setup>
import { ref } from 'vue'
import FilterTable from '@/components/common/tables/FilterTable.vue'

const tableData = ref([
  { id: 1, name: '张三', age: 25, department: '研发部', status: 'active' },
  { id: 2, name: '李四', age: 30, department: '销售部', status: 'inactive' }
])

const columns = [
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'age', label: '年龄', width: 100 },
  { prop: 'department', label: '部门', width: 150 },
  { prop: 'status', label: '状态', width: 100 }
]

const handleFilterChange = (filters) => {
  console.log('当前筛选条件:', filters)
}
</script>
```

## Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| data | 表格数据 | Array | [] |
| columns | 列配置 | Array | 必填 |
| showSelection | 是否显示选择列 | Boolean | false |
| showIndex | 是否显示序号列 | Boolean | false |
| showPagination | 是否显示分页 | Boolean | true |
| total | 总数 | Number | 0 |
| pageNum | 当前页 | Number | 1 |
| pageSize | 每页数量 | Number | 20 |
| pageSizes | 分页大小选项 | Array | [10, 20, 50, 100, 200] |

## Columns 配置

```javascript
const columns = [
  {
    prop: 'name',           // 字段名（必填）
    label: '姓名',          // 列标题（必填）
    width: 120,             // 列宽度
    minWidth: 100,          // 最小宽度
    fixed: 'left',          // 固定列：left, right
    align: 'center',        // 对齐方式：left, center, right
    sortable: true,         // 是否可排序
    showOverflowTooltip: true  // 是否显示溢出提示
  }
]
```

## Events

| 事件名 | 说明 | 参数 |
|--------|------|------|
| selection-change | 选择改变 | selection |
| page-change | 页码改变 | { page, pageSize } |
| size-change | 每页数量改变 | { page, pageSize } |
| filter-change | 筛选改变 | filters |

## 筛选类型

### 1. 文本筛选（input）

支持的操作符：
- **包含** - 包含指定文本
- **等于** - 完全等于
- **不等于** - 不等于
- **开头是** - 以指定文本开头
- **结尾是** - 以指定文本结尾

### 2. 选择筛选（select）

- 自动从数据中提取所有唯一值
- 支持多选
- 适合枚举类型字段

### 3. 数字筛选（number）

支持的操作符：
- **等于** - 等于指定数字
- **不等于** - 不等于
- **大于** - 大于
- **小于** - 小于
- **大于等于** - 大于或等于
- **小于等于** - 小于或等于
- **区间** - 在指定区间内

### 4. 日期筛选（date）

- 选择日期范围
- 自动筛选在范围内的数据

## 方法

通过 ref 调用：

```vue
<script setup>
import { ref } from 'vue'

const filterTableRef = ref(null)

// 清除所有筛选
const clearAll = () => {
  filterTableRef.value.clearAllFilters()
}

// 清除单个筛选
const clearOne = (prop) => {
  filterTableRef.value.clearFilter(prop)
}

// 获取当前筛选条件
const getFilters = () => {
  const filters = filterTableRef.value.getActiveFilters()
  console.log(filters)
}
</script>

<template>
  <FilterTable ref="filterTableRef" :data="data" :columns="columns" />
  <el-button @click="clearAll">清除所有筛选</el-button>
</template>
```

### 可用方法

| 方法名 | 说明 | 参数 |
|--------|------|------|
| clearAllFilters | 清除所有筛选 | - |
| clearFilter | 清除指定列筛选 | prop |
| getActiveFilters | 获取激活的筛选 | - |

## 插槽

### 列插槽

使用列的 `prop` 作为插槽名，自定义单元格内容：

```vue
<FilterTable :data="data" :columns="columns">
  <!-- 自定义状态列 -->
  <template #status="{ row }">
    <el-tag :type="row.status === 'active' ? 'success' : 'info'">
      {{ row.status === 'active' ? '启用' : '禁用' }}
    </el-tag>
  </template>
  
  <!-- 自定义操作列 -->
  <template #actions="{ row }">
    <el-button size="small" @click="handleEdit(row)">编辑</el-button>
    <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
  </template>
</FilterTable>
```

## 应用到物料列表

### 修改前（MaterialList.vue）

```vue
<el-table :data="tableData">
  <el-table-column prop="materialCode" label="物料编号" />
  <el-table-column prop="materialName" label="物料名称" />
</el-table>
```

### 修改后

```vue
<script setup>
import FilterTable from '@/components/common/tables/FilterTable.vue'

const columns = [
  { prop: 'materialCode', label: '物料编号', width: 140, fixed: 'left' },
  { prop: 'materialName', label: '物料名称', width: 180, fixed: 'left' },
  { prop: 'majorCategory', label: '大类', width: 100 },
  { prop: 'middleCategory', label: '中类', width: 100 },
  { prop: 'minorCategory', label: '小类', width: 100 },
  // ... 其他列
]
</script>

<template>
  <FilterTable
    :data="tableData"
    :columns="columns"
    show-selection
    show-index
    @filter-change="handleFilterChange"
  >
    <!-- 自定义列 -->
    <template #materialName="{ row }">
      <el-link type="primary" @click="handleView(row)">
        {{ row.materialName }}
      </el-link>
    </template>
  </FilterTable>
</template>
```

## 高级用法

### 1. 保存筛选配置

```javascript
// 保存筛选条件
const saveFilters = () => {
  const filters = filterTableRef.value.getActiveFilters()
  localStorage.setItem('materialFilters', JSON.stringify(filters))
}

// 恢复筛选条件
const loadFilters = () => {
  const saved = localStorage.getItem('materialFilters')
  if (saved) {
    const filters = JSON.parse(saved)
    // 应用筛选...
  }
}
```

### 2. 导出筛选后的数据

```javascript
const handleExport = () => {
  // filteredData 已经是筛选后的数据
  const dataToExport = filterTableRef.value.filteredData
  // 导出逻辑...
}
```

## 注意事项

1. **性能优化** - 数据量大时建议使用服务端筛选
2. **筛选类型** - 根据字段类型选择合适的筛选方式
3. **自定义筛选** - 可以通过 filter-change 事件实现自定义筛选逻辑
4. **打印支持** - 打印时会自动隐藏筛选图标

## 完整示例

查看 `07-frontend/src/pages/material/MaterialList.vue` 中的完整应用示例。
