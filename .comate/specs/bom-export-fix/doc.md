# 生产BOM导出功能修复需求文档

## 需求场景具体处理逻辑

在生产BOM页面，用户点击"导出"按钮时，系统应能够将BOM数据导出为Excel文件并下载到本地。导出的Excel文件应包含父件属性和子件属性的所有信息，特别是多层阶子件需要全部显示。

当前问题是在浏览器环境中使用`require('xlsx')`导致"require is not defined"错误。

## 架构技术方案

### 问题分析
1. **核心问题**: `excelUtils.js`中使用了Node.js的`require`语法，在浏览器环境中不可用
2. **技术栈**: Vue 3 + Vite + Element Plus + xlsx库
3. **环境**: 浏览器前端环境，不支持CommonJS的`require`

### 解决方案
1. **ES模块导入**: 将`require('xlsx')`改为ES6的`import XLSX from 'xlsx'`
2. **依赖确认**: 确保xlsx库正确安装且版本兼容
3. **错误处理**: 添加更完善的错误处理机制
4. **文件下载**: 使用浏览器兼容的文件下载方式

## 影响文件

### 修改文件列表
1. **`07-frontend/src/utils/excelUtils.js`** - 核心导出逻辑文件
   - 修改: 将`require`改为`import`语句
   - 影响: `exportBOMToExcel`, `importBOMFromExcel`, `createBOMTemplate`函数

2. **`07-frontend/src/components/BOMImportExport.vue`** - 导入导出组件
   - 影响: `handleDownloadTemplate`函数中的`require`语句
   - 修改: 统一使用ES模块导入

### 相关调用点
1. **`07-frontend/src/pages/bom/ProductionBom.vue`** - 生产BOM页面
   - 影响: BOMImportExport组件的使用
   - 修改: 无需修改，仅是组件使用方

## 实现细节

### 1. excelUtils.js 修改方案

#### 当前问题代码
```javascript
// 第17行 - 导出函数中的require使用
const XLSX = require('xlsx')

// 第76行 - 导入函数中的require使用  
const XLSX = require('xlsx')

// 第317行 - 模板下载中的require使用
const XLSX = require('xlsx')
```

#### 修复后代码
```javascript
// 文件顶部添加ES6导入
import * as XLSX from 'xlsx'

// 移除所有函数内的require语句
export function exportBOMToExcel(bomList, options = {}) {
  // 直接使用XLSX，无需require
  const workbook = XLSX.utils.book_new()
  // ... 其他代码保持不变
}
```

### 2. BOMImportExport.vue 修改方案

#### 当前问题代码
```javascript
// handleDownloadTemplate函数中
const XLSX = require('xlsx')
```

#### 修复后代码
```javascript
// 文件顶部添加导入
import * as XLSX from 'xlsx'

// handleDownloadTemplate函数中移除require
const handleDownloadTemplate = () => {
  try {
    const templateData = createBOMTemplate()
    const worksheet = XLSX.utils.json_to_sheet(templateData)
    // ... 其他代码保持不变
  }
}
```

### 3. 导出功能增强

#### 多层阶子件数据处理
```javascript
// 递归处理子件数据，确保多层阶结构完整导出
const processChildItems = (bom, level = 1, parentPath = '') => {
  const processedItems = []
  
  if (bom.childItems && bom.childItems.length > 0) {
    bom.childItems.forEach((child, index) => {
      const currentPath = parentPath ? `${parentPath}.${index + 1}` : `${index + 1}`
      
      processedItems.push({
        // 基础信息
        'BOM编号': bom.bomCode || '',
        'BOM名称': bom.bomName || '',
        '序号': child.sequence || index + 1,
        '层阶': child.level || level,
        '层阶地址': currentPath,
        
        // 子件信息
        '子件编码': child.childCode || '',
        '子件名称': child.childName || '',
        '标准用量': child.standardQty || 0,
        '0层阶标准用量': child.level0Qty || 0,
        
        // 扩展信息
        '产出工序': child.outputProcess || '',
        '子件来源': child.source || '',
        '工序工资': child.processWage || 0,
        '材料损耗(%)': child.materialLoss || 0,
        '材料单价': child.materialPrice || 0,
        '材料费用': child.materialCost || 0,
        
        // 后道工序信息
        '后道产品来源': child.nextProductSource || '',
        '后道工序名称': child.nextProcessName || '',
        '后道工序产品编号': child.nextProductCode || '',
        '后道工序产品名称': child.nextProductName || '',
        '后道0阶标准用量': child.nextStandardQty || 1,
        '后道产品层阶地址': child.nextLevelAddress || ''
      })
      
      // 递归处理子件的子件
      if (child.childItems && child.childItems.length > 0) {
        const subItems = processChildItems(child, level + 1, currentPath)
        processedItems.push(...subItems)
      }
    })
  }
  
  return processedItems
}
```

#### 文件下载优化
```javascript
// 优化的文件下载函数
const downloadExcelFile = (workbook, filename) => {
  // 使用XLSX的write方法生成文件
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  
  // 创建Blob对象
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  // 创建下载链接
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  
  // 触发下载
  document.body.appendChild(link)
  link.click()
  
  // 清理资源
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
```

## 边界条件与异常处理

### 1. 数据验证
```javascript
// 导出前的数据验证
const validateExportData = (bomList) => {
  if (!bomList || !Array.isArray(bomList)) {
    throw new Error('导出数据必须是数组格式')
  }
  
  if (bomList.length === 0) {
    throw new Error('没有数据可导出')
  }
  
  // 验证必需字段
  bomList.forEach((bom, index) => {
    if (!bom.bomCode) {
      throw new Error(`第${index + 1}行BOM编号不能为空`)
    }
  })
}
```

### 2. 错误处理
```javascript
// 统一错误处理机制
const handleExportError = (error, context) => {
  console.error(`导出失败 - ${context}:`, error)
  
  let errorMessage = '导出失败'
  
  if (error.message.includes('require is not defined')) {
    errorMessage = '模块导入错误，请检查依赖安装'
  } else if (error.message.includes('no data')) {
    errorMessage = '没有数据可导出'
  } else if (error.message.includes('validation')) {
    errorMessage = '数据验证失败：' + error.message
  } else {
    errorMessage = '导出失败: ' + error.message
  }
  
  ElMessage.error(errorMessage)
}
```

### 3. 浏览器兼容性
```javascript
// 浏览器兼容性检查
const checkBrowserCompatibility = () => {
  // 检查是否支持Blob
  if (typeof Blob === 'undefined') {
    throw new Error('当前浏览器不支持文件下载功能')
  }
  
  // 检查是否支持URL.createObjectURL
  if (typeof URL === 'undefined' || typeof URL.createObjectURL === 'undefined') {
    throw new Error('当前浏览器不支持文件生成功能')
  }
  
  return true
}
```

## 数据流动路径

### 1. 导出流程
```
用户点击导出按钮 
→ handleExport() 被调用
→ 数据验证 (validateExportData)
→ 浏览器兼容性检查 (checkBrowserCompatibility)
→ 递归处理子件数据 (processChildItems)
→ 创建Excel工作簿 (XLSX.utils.book_new)
→ 生成工作表数据 (XLSX.utils.json_to_sheet)
→ 文件下载 (downloadExcelFile)
→ 成功提示
```

### 2. 数据结构
```
BOM数据结构:
{
  bomCode: string,        // BOM编号
  bomName: string,        // BOM名称  
  productCode: string,    // 产品编码
  productName: string,    // 产品名称
  childItems: Array[      // 子件数组
    {
      sequence: number,           // 序号
      level: number,            // 层阶
      levelPath: string,        // 层阶地址
      childCode: string,        // 子件编码
      childName: string,        // 子件名称
      standardQty: number,      // 标准用量
      level0Qty: number,        // 0层阶标准用量
      outputProcess: string,    // 产出工序
      source: string,           // 子件来源
      processWage: number,     // 工序工资
      materialLoss: number,     // 材料损耗
      materialPrice: number,    // 材料单价
      materialCost: number,     // 材料费用
      nextProductSource: string, // 后道产品来源
      nextProcessName: string,   // 后道工序名称
      nextProductCode: string,   // 后道工序产品编号
      nextProductName: string,   // 后道工序产品名称
      nextStandardQty: number,  // 后道0阶标准用量
      nextLevelAddress: string,  // 后道产品层阶地址
      childItems: Array         // 嵌套子件
    }
  ]
}
```

## 预期成果

### 1. 功能修复
- ✅ 修复"require is not defined"错误
- ✅ 导出功能正常工作
- ✅ 支持多层阶子件完整导出
- ✅ 包含所有父件和子件属性信息

### 2. 用户体验
- ✅ 导出按钮点击后无错误
- ✅ Excel文件自动下载到本地
- ✅ 导出过程有进度提示
- ✅ 错误信息友好提示

### 3. 技术指标
- ✅ 代码使用ES6模块规范
- ✅ 浏览器兼容性良好
- ✅ 错误处理机制完善
- ✅ 支持大数据量导出（1000+条记录）

### 4. 导出文件格式
- ✅ Excel文件包含多个工作表
  - "BOM主表": 父件基本信息
  - "BOM子件": 详细子件信息（多层阶）
  - "导入模板": 标准导入格式模板
- ✅ 文件名包含时间戳: `生产BOM导出_2025-12-30T10-41-52.xlsx`
- ✅ 数据完整，格式正确
