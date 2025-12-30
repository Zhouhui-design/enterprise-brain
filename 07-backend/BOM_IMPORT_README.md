# BOM导入导出功能说明

## 功能概述

企业大脑系统现已支持完整的BOM（物料清单）导入导出功能，提供Excel格式的数据交换能力。

## 🚀 新增功能

### 1. BOM数据导入
- **支持格式**: Excel (.xlsx, .xls)
- **文件大小**: 最大10MB
- **功能特性**:
  - ✅ 数据预览和验证
  - ✅ 错误检测和报告
  - ✅ 重复项处理
  - ✅ 批量数据处理
  - ✅ 导入进度显示
  - ✅ 完整的错误日志

### 2. BOM数据导出
- **支持格式**: Excel (.xlsx)、CSV、JSON
- **导出选项**:
  - ✅ 全部导出
  - ✅ 筛选导出
  - ✅ 选中项导出
  - ✅ 包含子件数据
  - ✅ 自定义字段选择

### 3. 导入模板
- **动态生成**: 基于当前数据结构
- **字段说明**: 详细的字段描述和示例
- **数据验证**: 内置验证规则

## 📋 API接口

### 导入相关

#### 1. 导入预览
```http
POST /api/bom-import/preview
Content-Type: multipart/form-data
```

#### 2. 确认导入
```http
POST /api/bom-import/import
Content-Type: multipart/form-data
```

#### 3. 数据验证
```http
POST /api/bom-import/validate
Content-Type: application/json
```

### 导出相关

#### 1. 数据导出
```http
GET /api/bom-import/export?bomIds=1,2,3&format=excel
```

#### 2. 模板下载
```http
GET /api/bom-import/template
```

#### 3. 导入历史
```http
GET /api/bom-import/history?limit=50&offset=0
```

## 🗃 数据结构

### BOM主表字段
| 字段名 | 类型 | 必需 | 说明 |
|--------|------|--------|------|
| bomCode | string | ✅ | BOM编号，格式：PBOM-年-时间戳-随机数 |
| bomName | string | ✅ | BOM名称 |
| productCode | string | ✅ | 产品编号 |
| productName | string | ✅ | 产品名称 |
| version | string | ❌ | 版本号，格式：V1.0 |
| status | enum | ❌ | 状态：draft/reviewing/approved/obsolete |
| designer | string | ❌ | 设计人员 |
| reviewer | string | ❌ | 审核人员 |
| itemCount | number | ❌ | 物料数量 |
| effectiveDate | date | ❌ | 生效日期 |
| remark | text | ❌ | 备注 |
| totalLabor | decimal | ❌ | 总人工费用 |
| totalMaterial | decimal | ❌ | 总材料费用 |

### 子件表字段
| 字段名 | 类型 | 必需 | 说明 |
|--------|------|--------|------|
| childCode | string | ✅ | 子件编码 |
| childName | string | ✅ | 子件名称 |
| level | number | ❌ | 层阶 |
| levelPath | string | ❌ | 层阶地址 |
| standardQty | number | ✅ | 标准用量 |
| outputProcess | string | ❌ | 产出工序 |
| source | string | ❌ | 子件来源 |
| processWage | decimal | ❌ | 工序工资 |
| materialLoss | decimal | ❌ | 材料损耗率(%) |
| materialPrice | decimal | ❌ | 材料单价 |
| nextProductSource | string | ❌ | 后道产品来源 |
| nextProcessName | string | ❌ | 后道工序名称 |
| nextProductCode | string | ❌ | 后道工序产品编号 |
| nextProductName | string | ❌ | 后道工序产品名称 |
| nextStandardQty | number | ❌ | 后道0阶标准用量 |
| nextLevelAddress | string | ❌ | 后道产品层阶地址 |

## 🛠️ 安装和使用

### 1. 安装依赖
```bash
cd 07-backend
npm install
```

### 2. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 3. 访问服务
- **服务地址**: http://localhost:3001
- **健康检查**: http://localhost:3001/health
- **API文档**: http://localhost:3001/

## 📊 前端集成

### Vue组件集成
```vue
<template>
  <BOMImportExport 
    :table-data="tableData" 
    :selected-rows="selectedRows"
    @refresh="handleRefresh"
  />
</template>

<script>
import BOMImportExport from '@/components/BOMImportExport.vue'

export default {
  components: {
    BOMImportExport
  }
}
</script>
```

### 前端API调用示例
```javascript
// 导入数据
const importBOM = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('skipDuplicates', 'true')
  
  const response = await fetch('/api/bom-import/import', {
    method: 'POST',
    body: formData
  })
  
  return response.json()
}

// 导出数据
const exportBOM = async (bomIds) => {
  const response = await fetch(`/api/bom-import/export?bomIds=${bomIds.join(',')}&format=excel`)
  const blob = await response.blob()
  
  // 下载文件
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'BOM导出.xlsx'
  a.click()
}
```

## 🔧 配置选项

### 环境变量
```bash
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
```

### 导入配置
- **最大文件大小**: 10MB
- **允许的文件类型**: .xlsx, .xls
- **批量处理大小**: 100条/批
- **自动清理**: 30天前的日志

## 📈 性能优化

### 1. 数据库优化
- 使用索引加速查询
- 批量插入减少数据库连接
- 事务保证数据一致性

### 2. 内存管理
- 流式处理大文件
- 及时释放临时变量
- 使用连接池管理数据库连接

### 3. 错误处理
- 完整的错误日志记录
- 用户友好的错误消息
- 优雅的失败处理

## 🐛 故障排除

### 常见问题

#### 1. 文件上传失败
- **检查**: 文件大小是否超过10MB
- **检查**: 文件格式是否为Excel
- **解决**: 压缩文件或分批上传

#### 2. 数据导入失败
- **检查**: 必需字段是否为空
- **检查**: 数据格式是否正确
- **解决**: 下载模板参考格式

#### 3. 导出文件为空
- **检查**: 是否有符合条件的数据
- **检查**: 筛选条件是否正确
- **解决**: 调整筛选条件

### 日志查看
```bash
# 查看导入错误日志
tail -f logs/import.log

# 查看服务器日志
tail -f logs/server.log
```

## 📞 技术支持

### 联系方式
- **开发团队**: Enterprise Brain Team
- **技术文档**: 参考本README
- **问题反馈**: 通过系统反馈功能

### 版本信息
- **当前版本**: v1.0.0
- **更新日期**: 2024-12-30
- **兼容性**: Node.js 14+, MySQL 5.7+

## 🔄 更新日志

### v1.0.0 (2024-12-30)
- ✨ 新增BOM数据导入功能
- ✨ 新增BOM数据导出功能
- ✨ 新增导入模板下载
- ✨ 新增数据预览和验证
- ✨ 新增完整的错误处理
- ✨ 新增导入历史记录
- ✨ 新增性能优化措施

---

**注意**: 本功能需要配合前端组件使用，请确保前端已正确集成相关组件。
