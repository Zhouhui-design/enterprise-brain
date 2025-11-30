# 数据持久化方案

## 概述

为了解决您提到的数据丢失问题，我们实现了一个基于 IndexedDB 的数据持久化方案，以确保在生产环境中数据的可靠性和一致性。

## 为什么选择 IndexedDB

### 1. 持久性
- IndexedDB 是浏览器提供的本地数据库，数据不会因页面刷新或浏览器关闭而丢失
- 相比 localStorage，IndexedDB 提供了更好的持久性保证

### 2. 容量
- IndexedDB 提供更大的存储容量（通常为几百MB到几GB）
- localStorage 通常限制在 5-10MB

### 3. 性能
- 对于大量数据，IndexedDB 的查询性能优于 localStorage
- 支持索引查询，提高检索效率

### 4. 事务支持
- 支持事务操作，确保数据一致性
- 提供错误处理和回滚机制

## 实现方案

### 1. 数据库服务类
我们创建了 [DatabaseService.js](file:///home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/src/services/DatabaseService.js) 类来封装所有 IndexedDB 操作：

```javascript
class DatabaseService {
  constructor() {
    this.dbName = 'EnterpriseBrainDB';
    this.version = 1;
    this.db = null;
  }
}
```

### 2. 数据库结构
当前版本包含以下对象存储：
- `materials` - 物料库数据
- `boms` - BOM数据
- `productionBoms` - 生产BOM数据
- `salesBoms` - 销售BOM数据
- `designBoms` - 设计BOM数据

### 3. 降级机制
为了确保兼容性，我们实现了降级机制：
- 首先尝试使用 IndexedDB
- 如果失败，则降级到 localStorage
- 提供错误提示和日志记录

## 使用方法

### 1. 初始化
```javascript
await databaseService.init()
```

### 2. 数据操作
```javascript
// 保存物料
await databaseService.saveMaterial(material)

// 获取所有物料
const materials = await databaseService.getAllMaterials()

// 删除物料
await databaseService.deleteMaterial(id)

// 批量操作
await databaseService.saveMaterials(materials)
await databaseService.deleteMaterials(ids)
```

## 数据一致性保证

### 1. 实时同步
- 每次数据变更都会立即同步到 IndexedDB
- 不再依赖页面刷新来保存数据

### 2. 错误处理
- 所有数据库操作都有完整的错误处理
- 失败时会显示错误信息并记录日志

### 3. 事务支持
- 批量操作使用事务确保原子性
- 部分失败时提供详细的状态报告

## 生产环境优势

### 1. 数据安全
- 数据持久化存储，不会因意外关闭浏览器而丢失
- 支持浏览器升级和系统重启

### 2. 性能优化
- 大量数据查询性能更好
- 支持索引查询，提高检索速度

### 3. 扩展性
- 易于添加新的数据表和字段
- 支持数据库版本升级

## 迁移现有数据

系统会自动处理从 localStorage 到 IndexedDB 的数据迁移：
1. 首次加载时检查 IndexedDB 中是否有数据
2. 如果没有数据但 localStorage 中有数据，则自动迁移
3. 迁移完成后清除 localStorage 中的旧数据

## 未来扩展

### 1. 数据同步
可以扩展实现与后端服务器的数据同步功能：
- 支持离线操作
- 网络恢复后自动同步

### 2. 数据备份
- 导出数据库为文件
- 从文件恢复数据库

### 3. 多用户支持
- 支持多用户数据隔离
- 用户切换时自动加载对应数据

## 注意事项

### 1. 浏览器兼容性
- 现代浏览器都支持 IndexedDB
- 对于不支持的浏览器会自动降级

### 2. 存储空间
- 浏览器会限制存储空间
- 超出限制时会提示用户清理数据

### 3. 调试工具
- 可以使用浏览器开发者工具查看 IndexedDB 数据
- 提供数据库重置功能用于开发调试

## 总结

通过实现基于 IndexedDB 的数据持久化方案，我们解决了数据丢失的问题，确保了生产环境中数据的可靠性和一致性。该方案具有良好的扩展性和兼容性，为未来的功能扩展奠定了基础。