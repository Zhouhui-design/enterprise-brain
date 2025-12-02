# 剪贴板复制功能使用指南

## 概述
系统提供了统一的剪贴板复制工具函数，可以在任何页面中使用。

## 导入方法
```javascript
import { copyToClipboard, getCopyableColumnProps } from '@/utils/clipboard'
```

## 使用方法

### 1. 按钮触发复制
在表单输入框旁边添加复制按钮：

```vue
<template>
  <div style="display: flex; gap: 8px;">
    <el-input v-model="formData.bomCode" readonly style="flex: 1;" />
    <el-button 
      type="primary" 
      :icon="DocumentCopy" 
      @click="copyToClipboard(formData.bomCode, 'BOM编号')"
    >
      复制
    </el-button>
  </div>
</template>

<script setup>
import { DocumentCopy } from '@element-plus/icons-vue'
import { copyToClipboard } from '@/utils/clipboard'
</script>
```

### 2. 表格列双击复制
在表格列中添加双击复制功能：

#### 方法1：使用 v-bind（推荐）
```vue
<el-table-column label="BOM编号" width="140">
  <template #default="{ row }">
    <span v-bind="getCopyableColumnProps(row.bomCode, 'BOM编号')">
      {{ row.bomCode }}
    </span>
  </template>
</el-table-column>
```

#### 方法2：手动配置
```vue
<el-table-column label="产品编号" width="140">
  <template #default="{ row }">
    <span 
      style="cursor: pointer;" 
      @dblclick="copyToClipboard(row.productCode, '产品编号')"
      :title="'双击复制：' + row.productCode"
    >
      {{ row.productCode }}
    </span>
  </template>
</el-table-column>
```

### 3. 批量复制
复制多行数据：

```javascript
import { copyMultipleLines } from '@/utils/clipboard'

// 复制选中的BOM编号
const bomCodes = selectedRows.value.map(row => row.bomCode)
await copyMultipleLines(bomCodes, '\n')
```

### 4. 复制为JSON
复制对象为JSON格式：

```javascript
import { copyAsJson } from '@/utils/clipboard'

// 复制整个表单数据
await copyAsJson(formData.value, '表单数据')
```

## API参考

### copyToClipboard(text, fieldName)
复制文本到剪贴板

**参数：**
- `text` (string): 要复制的文本
- `fieldName` (string, 可选): 字段名称，用于提示消息，默认为"内容"

**返回：**
- `Promise<boolean>`: 是否成功

### getCopyableColumnProps(value, fieldName)
获取表格列双击复制的配置对象

**参数：**
- `value` (string): 字段值
- `fieldName` (string): 字段名称

**返回：**
- `Object`: 包含 style、title、onDblclick 的配置对象

### copyMultipleLines(data, separator)
批量复制多行数据

**参数：**
- `data` (Array): 数据数组
- `separator` (string, 可选): 分隔符，默认为 '\n'

**返回：**
- `Promise<boolean>`: 是否成功

### copyAsJson(obj, fieldName)
复制对象为JSON格式

**参数：**
- `obj` (Object): 要复制的对象
- `fieldName` (string, 可选): 字段名称，默认为 'JSON'

**返回：**
- `Promise<boolean>`: 是否成功

## 浏览器兼容性
- 优先使用现代 Clipboard API (`navigator.clipboard`)
- 自动降级到传统 `document.execCommand('copy')` 方法
- 支持所有主流浏览器

## 已应用的页面
- ✅ 生产BOM管理 (`/bom/production`)
  - 主表格：BOM编号、产品编号（双击复制）
  - 草稿箱表格：BOM编号、产品编号（双击复制）
  - 编辑表单：BOM编号（按钮复制）

## 待应用的页面
可以在以下页面中添加复制功能：
- [ ] 产品物料管理
- [ ] 售后服务管理
- [ ] 客户反馈管理
- [ ] 项目管理
- [ ] 文档管理
- [ ] 其他所有包含编码/编号字段的页面

## 最佳实践
1. **只读字段优先添加复制按钮**：如自动生成的编号
2. **重要编码字段添加双击复制**：如BOM编号、产品编号
3. **统一提示信息**：使用准确的字段名称作为第二个参数
4. **保持一致的用户体验**：同类字段使用相同的复制方式
