# 通用智能下拉组件使用指南

## 概述

为了提高开发效率和代码复用性，我们创建了一个通用的智能下拉组件 [SmartSelect.vue](file:///home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/src/components/SmartSelect.vue)，可以替代现有页面中所有重复的下拉框实现。

## 组件特性

1. **实时筛选**：支持本地和远程筛选
2. **多字段显示**：可同时显示标签和描述信息
3. **灵活配置**：支持多种属性配置
4. **事件通知**：提供完整的事件回调
5. **性能优化**：支持虚拟滚动和懒加载

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|-------|------|--------|------|
| modelValue | [String, Number, Boolean, Object, Array] | '' | 绑定值 |
| options | Array | [] | 选项数据源 |
| labelField | String | 'label' | 选项标签字段名 |
| valueField | String | 'value' | 选项值字段名 |
| descriptionField | String | 'description' | 描述字段名 |
| placeholder | String | '请选择' | 占位符 |
| filterable | Boolean | true | 是否可过滤 |
| remote | Boolean | false | 是否远程搜索 |
| clearable | Boolean | true | 是否可清空 |
| multiple | Boolean | false | 是否多选 |
| disabled | Boolean | false | 是否禁用 |
| size | String | 'default' | 尺寸 |
| showDescription | Boolean | false | 是否显示描述信息 |
| customFilter | Function | null | 自定义过滤方法 |
| remoteMethod | Function | null | 远程搜索方法 |

## 事件说明

| 事件名 | 说明 | 回调参数 |
|-------|------|---------|
| update:modelValue | 值改变时触发 | 新的值 |
| change | 值改变时触发 | 新的值 |
| focus | 获得焦点时触发 | Event对象 |
| blur | 失去焦点时触发 | Event对象 |
| clear | 清空时触发 | - |
| search | 搜索时触发 | 搜索关键词 |

## 使用示例

### 1. 基础使用

```vue
<template>
  <SmartSelect
    v-model="selectedValue"
    :options="options"
    label-field="name"
    value-field="id"
    placeholder="请选择产品"
  />
</template>

<script setup>
import SmartSelect from '@/components/SmartSelect.vue'
import { ref } from 'vue'

const selectedValue = ref('')
const options = ref([
  { id: 1, name: '产品A' },
  { id: 2, name: '产品B' },
  { id: 3, name: '产品C' }
])
</script>
```

### 2. 带描述信息的下拉框

```vue
<template>
  <SmartSelect
    v-model="selectedValue"
    :options="options"
    label-field="name"
    value-field="id"
    description-field="code"
    :show-description="true"
    placeholder="请选择物料"
  />
</template>

<script setup>
import SmartSelect from '@/components/SmartSelect.vue'
import { ref } from 'vue'

const selectedValue = ref('')
const options = ref([
  { id: 'M001', name: '不锈钢螺丝', code: 'M6x20mm' },
  { id: 'M002', name: '铜螺母', code: 'M6' },
  { id: 'M003', name: '垫片', code: '6mm' }
])
</script>
```

### 3. 实时筛选（本地）

```vue
<template>
  <SmartSelect
    v-model="selectedValue"
    :options="largeOptions"
    label-field="name"
    value-field="id"
    filterable
    placeholder="输入关键词筛选"
  />
</template>

<script setup>
import SmartSelect from '@/components/SmartSelect.vue'
import { ref } from 'vue'

const selectedValue = ref('')
// 模拟大量数据
const largeOptions = ref(
  Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `产品${i + 1}`
  }))
)
</script>
```

### 4. 远程搜索

```vue
<template>
  <SmartSelect
    v-model="selectedValue"
    :options="remoteOptions"
    label-field="name"
    value-field="id"
    :remote="true"
    :remote-method="fetchRemoteData"
    :loading="loading"
    placeholder="输入关键词搜索"
  />
</template>

<script setup>
import SmartSelect from '@/components/SmartSelect.vue'
import { ref } from 'vue'

const selectedValue = ref('')
const remoteOptions = ref([])
const loading = ref(false)

const fetchRemoteData = async (query) => {
  loading.value = true
  try {
    // 模拟API调用
    const response = await fetch(`/api/search?q=${query}`)
    const data = await response.json()
    remoteOptions.value = data
  } finally {
    loading.value = false
  }
}
</script>
```

## 在生产BOM页面中的应用

### 替换产品编码下拉框

原来的实现：
```vue
<el-select 
  v-model="formData.productCode" 
  filterable 
  remote
  :remote-method="(query) => { productCodeFilter.value = query }"
  :loading="false"
  placeholder="请选择或输入产品编码" 
  @change="handleProductCodeChange"
  style="width: 100%;"
>
  <el-option 
    v-for="material in filteredProductCodeList" 
    :key="material.materialCode" 
    :label="material.materialCode" 
    :value="material.materialCode"
  >
    <span>{{ material.materialCode }}</span>
    <span style="color: #909399; margin-left: 10px;">{{ material.materialName }}</span>
  </el-option>
</el-select>
```

使用通用组件替换：
```vue
<SmartSelect
  v-model="formData.productCode"
  :options="materialList"
  label-field="materialCode"
  value-field="materialCode"
  :description-field="'materialName'"
  :show-description="true"
  filterable
  placeholder="请选择或输入产品编码"
  @change="handleProductCodeChange"
/>
```

### 替换产品名称下拉框

原来的实现：
```vue
<el-select 
  v-model="formData.productName" 
  filterable 
  remote
  :remote-method="(query) => { productNameFilter.value = query }"
  :loading="false"
  placeholder="请选择或输入产品名称" 
  @change="handleProductNameChange"
  style="width: 100%;"
>
  <el-option 
    v-for="material in filteredProductNameList" 
    :key="material.materialName" 
    :label="material.materialName" 
    :value="material.materialName"
  >
    <span>{{ material.materialName }}</span>
    <span style="color: #909399; margin-left: 10px;">{{ material.materialCode }}</span>
  </el-option>
</el-select>
```

使用通用组件替换：
```vue
<SmartSelect
  v-model="formData.productName"
  :options="materialList"
  label-field="materialName"
  value-field="materialName"
  :description-field="'materialCode'"
  :show-description="true"
  filterable
  placeholder="请选择或输入产品名称"
  @change="handleProductNameChange"
/>
```

### 替换子件编码下拉框

原来的实现：
```vue
<el-select 
  v-model="row.childCode" 
  filterable 
  remote
  :remote-method="(query) => { handleChildCodeFilter(query, row) }"
  :loading="false"
  placeholder="选择子件编码"
  @change="(val) => handleChildCodeChange(val, row)"
  style="width: 100%;"
>
  <el-option 
    v-for="material in getFilteredChildMaterialList(row.childCodeFilter)" 
    :key="material.materialCode" 
    :label="material.materialCode" 
    :value="material.materialCode"
  >
    <span>{{ material.materialCode }}</span>
    <span style="color: #909399; margin-left: 10px;">{{ material.materialName }}</span>
  </el-option>
</el-select>
```

使用通用组件替换：
```vue
<SmartSelect
  v-model="row.childCode"
  :options="filteredChildMaterialList"
  label-field="materialCode"
  value-field="materialCode"
  :description-field="'materialName'"
  :show-description="true"
  filterable
  placeholder="选择子件编码"
  @change="(val) => handleChildCodeChange(val, row)"
/>
```

## 优势

1. **减少重复代码**：统一的实现减少了各个页面中重复的下拉框逻辑
2. **提高维护性**：所有下拉框的行为一致，便于维护和修改
3. **增强功能**：提供了更多配置选项和事件回调
4. **提升性能**：内置了性能优化机制
5. **易于扩展**：可以根据需要轻松添加新功能

## 注意事项

1. 使用前需要确保已正确导入组件
2. 注意属性名的映射关系（labelField、valueField等）
3. 远程搜索需要配合remoteMethod属性使用
4. 大量数据时建议启用虚拟滚动功能