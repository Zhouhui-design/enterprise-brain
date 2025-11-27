# 表格组件系统文档

## 📚 组件列表

### 基础组件
1. **BaseTable.vue** - 基础表格组件
2. **EditableTable.vue** - 可编辑表格
3. **TreeTable.vue** - 树形表格
4. **VirtualTable.vue** - 虚拟滚动表格
5. **SearchTable.vue** - 带搜索的表格
6. **PaginationTable.vue** - 分页表格
7. **ExportTable.vue** - 可导出表格

### Hooks
1. **useTableDrag.js** - 拖拽功能Hook
2. **useColumnConfig.js** - 列配置Hook
3. **useTableSort.js** - 排序功能Hook

## 📖 使用文档

### 1. BaseTable - 基础表格

**功能特点：**
- ✅ 基于Element Plus Table封装
- ✅ 支持选择、序号、操作列
- ✅ 支持自定义列插槽
- ✅ 支持分页
- ✅ 支持排序
- ✅ 支持树形数据

**使用示例：**
\`\`\`vue
<template>
  <BaseTable
    :data="tableData"
    :columns="columns"
    :show-selection="true"
    :show-index="true"
    :show-action="true"
    :action-buttons="actionButtons"
    :show-pagination="true"
    :total="total"
    @selection-change="handleSelectionChange"
    @action="handleAction"
  >
    <!-- 自定义列插槽 -->
    <template #status="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'danger'">
        {{ row.status === 1 ? '启用' : '禁用' }}
      </el-tag>
    </template>
  </BaseTable>
</template>

<script setup>
import { ref } from 'vue'
import BaseTable from '@/components/common/tables/BaseTable.vue'

const tableData = ref([])
const total = ref(0)

const columns = ref([
  { prop: 'name', label: '姓名', width: 120 },
  { prop: 'age', label: '年龄', width: 80 },
  { prop: 'address', label: '地址', minWidth: 200 },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
])

const actionButtons = (row) => [
  { key: 'edit', label: '编辑', type: 'primary' },
  { key: 'delete', label: '删除', type: 'danger' }
]

const handleSelectionChange = (selection) => {
  console.log('选中行', selection)
}

const handleAction = ({ action, row }) => {
  if (action === 'edit') {
    // 编辑逻辑
  } else if (action === 'delete') {
    // 删除逻辑
  }
}
</script>
\`\`\`

### 2. EditableTable - 可编辑表格

**功能特点：**
- ✅ 支持单元格编辑
- ✅ 支持多种编辑类型（input、number、select、date等）
- ✅ 支持添加/删除行
- ✅ 支持双击编辑或点击编辑

**使用示例：**
\`\`\`vue
<template>
  <EditableTable
    v-model:data="tableData"
    :columns="editableColumns"
    :show-add-btn="true"
    :show-delete-btn="true"
    @cell-change="handleCellChange"
    @add="handleAdd"
    @delete="handleDelete"
  />
</template>

<script setup>
import { ref } from 'vue'
import EditableTable from '@/components/common/tables/EditableTable.vue'

const tableData = ref([
  { id: 1, name: '张三', age: 25, city: 'beijing' }
])

const editableColumns = ref([
  { prop: 'name', label: '姓名', editable: true, editType: 'input' },
  { prop: 'age', label: '年龄', editable: true, editType: 'number', min: 0, max: 150 },
  {
    prop: 'city',
    label: '城市',
    editable: true,
    editType: 'select',
    options: [
      { label: '北京', value: 'beijing' },
      { label: '上海', value: 'shanghai' }
    ]
  }
])

const handleCellChange = ({ row, prop, value }) => {
  console.log('单元格变更', row, prop, value)
}
</script>
\`\`\`

### 3. TreeTable - 树形表格

**功能特点：**
- ✅ 支持树形数据展示
- ✅ 支持添加子节点
- ✅ 支持删除节点（包括子节点）
- ✅ 支持展开/收起
- ✅ 提供节点查找、路径获取等方法

**使用示例：**
\`\`\`vue
<template>
  <TreeTable
    :data="treeData"
    :columns="columns"
    :show-add-child-btn="true"
    :show-delete-btn="true"
    row-key="id"
    @add-child="handleAddChild"
  />
</template>

<script setup>
import { ref } from 'vue'
import TreeTable from '@/components/common/tables/TreeTable.vue'

const treeData = ref([
  {
    id: 1,
    name: '一级节点',
    children: [
      { id: 2, name: '二级节点-1' },
      { id: 3, name: '二级节点-2' }
    ]
  }
])

const columns = ref([
  { prop: 'name', label: '名称', width: 300 },
  { prop: 'desc', label: '描述' }
])
</script>
\`\`\`

### 4. VirtualTable - 虚拟滚动表格

**功能特点：**
- ✅ 支持大数据量渲染
- ✅ 只渲染可见区域
- ✅ 性能优秀

**使用示例：**
\`\`\`vue
<template>
  <VirtualTable
    :data="bigData"
    :columns="columns"
    :height="500"
    :row-height="48"
  />
</template>

<script setup>
import { ref } from 'vue'
import VirtualTable from '@/components/common/tables/VirtualTable.vue'

// 生成10万条数据
const bigData = ref(
  Array.from({ length: 100000 }, (_, i) => ({
    id: i,
    name: `用户${i}`,
    value: Math.random() * 1000
  }))
)
</script>
\`\`\`

### 5. SearchTable - 带搜索的表格

**功能特点：**
- ✅ 集成搜索表单
- ✅ 集成工具栏
- ✅ 支持展开/收起搜索
- ✅ 支持列设置
- ✅ 完整的CRUD功能

**使用示例：**
\`\`\`vue
<template>
  <SearchTable
    :data="tableData"
    :columns="columns"
    :search-fields="searchFields"
    :total="total"
    :page-num="pageNum"
    :page-size="pageSize"
    @search="handleSearch"
    @reset="handleReset"
    @add="handleAdd"
    @page-change="handlePageChange"
  >
    <template #toolbar-left>
      <el-button type="success">自定义按钮</el-button>
    </template>
  </SearchTable>
</template>

<script setup>
import { ref } from 'vue'
import SearchTable from '@/components/common/tables/SearchTable.vue'

const searchFields = ref([
  { prop: 'name', label: '姓名', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [...] },
  { prop: 'dateRange', label: '日期', type: 'daterange' }
])

const handleSearch = (formData) => {
  console.log('搜索', formData)
  // 调用API查询
}
</script>
\`\`\`

## 🎨 列配置说明

### 基础列配置
\`\`\`javascript
{
  prop: 'name',           // 字段名
  label: '姓名',          // 列标题
  width: 120,            // 固定宽度
  minWidth: 100,         // 最小宽度
  fixed: 'left',         // 固定列 left/right
  sortable: true,        // 是否可排序
  align: 'center',       // 对齐方式
  showOverflowTooltip: true, // 超出显示tooltip
  hidden: false,         // 是否隐藏
}
\`\`\`

### 自定义渲染
\`\`\`javascript
// 方式1: 使用formatter
{
  prop: 'status',
  label: '状态',
  formatter: (row, column, cellValue) => {
    return cellValue === 1 ? '启用' : '禁用'
  }
}

// 方式2: 使用插槽
{
  prop: 'status',
  label: '状态',
  slot: 'status'  // 对应 <template #status="{ row }">
}

// 方式3: 使用render函数
{
  prop: 'status',
  label: '状态',
  render: StatusComponent  // 自定义组件
}
\`\`\`

### 可编辑列配置
\`\`\`javascript
{
  prop: 'name',
  label: '姓名',
  editable: true,        // 可编辑
  editType: 'input',     // 编辑类型: input/number/select/date/datetime/switch
  placeholder: '请输入姓名',
  // select类型需要options
  options: [
    { label: '选项1', value: '1' }
  ],
  // number类型可配置
  min: 0,
  max: 100,
  precision: 2,
  step: 1
}
\`\`\`

## 🔧 依赖说明

### 必需依赖
\`\`\`json
{
  "vue": "^3.3.0",
  "element-plus": "^2.4.0",
  "@element-plus/icons-vue": "^2.1.0"
}
\`\`\`

### 可选依赖
\`\`\`json
{
  "xlsx": "^0.18.5",      // 用于ExportTable导出Excel
  "sortablejs": "^1.15.0" // 用于拖拽功能
}
\`\`\`

## 📦 安装

\`\`\`bash
npm install xlsx sortablejs
\`\`\`

## ✨ 最佳实践

1. **大数据量使用VirtualTable**
2. **表单页面使用EditableTable**
3. **列表页面使用SearchTable**
4. **层级数据使用TreeTable**
5. **简单展示使用BaseTable**

## 🚀 性能优化建议

1. 使用虚拟滚动处理大数据
2. 合理使用分页
3. 避免在formatter中进行复杂计算
4. 使用v-memo优化列表渲染
5. 合理设置列宽，避免频繁计算

## 📝 注意事项

1. 所有表格组件都基于Element Plus Table
2. 需要安装Element Plus并全局注册
3. 导出功能需要安装xlsx
4. 拖拽功能需要安装sortablejs
5. 所有组件都支持Element Plus Table的原生属性和事件

## 🎯 未来规划

- [ ] 列配置可视化
- [ ] 表格数据导入
- [ ] 更多图表集成
- [ ] 移动端适配
- [ ] TypeScript类型定义
