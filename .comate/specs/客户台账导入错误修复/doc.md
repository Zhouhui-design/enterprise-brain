# 客户台账导入错误修复需求文档

## 需求背景
用户反映在点击左侧菜单栏的"客户台账"按钮时，页面无法正常打开，控制台报错：
```
SyntaxError: The requested module '/src/api/customer.js' does not provide an export named 'customerApi'
```

## 问题分析
通过代码分析发现，问题出现在模块导入语句上：

1. **导出方式**：`/src/api/customer.js` 文件使用默认导出 `export default customerApi`
2. **导入方式**：多个文件使用命名导入 `import { customerApi } from '@/api/customer'`
3. **不匹配**：默认导出与命名导入不匹配，导致模块解析失败

## 影响文件
需要修复以下文件中的导入语句：
- `07-frontend/src/pages/sales/customers/CustomerList.vue`
- `07-frontend/src/pages/sales/sales-order/SalesOrderCreate.vue`
- `07-frontend/src/utils/CustomerDataManager.js`

## 架构技术方案
### 修复策略
将所有使用命名导入 `{ customerApi }` 的地方改为默认导入 `customerApi`，保持与导出方式一致。

### 技术细节
1. **导出方式**：保持 `customer.js` 的默认导出不变
2. **导入方式**：统一改为默认导入语法
3. **向后兼容**：确保修复后不影响现有功能

## 实现细节

### 文件1：CustomerList.vue
**当前导入**：
```javascript
import { customerApi } from '@/api/customer'
```
**修复后导入**：
```javascript
import customerApi from '@/api/customer'
```

### 文件2：SalesOrderCreate.vue  
**当前导入**：
```javascript
import { customerApi } from '@/api/customer'
```
**修复后导入**：
```javascript
import customerApi from '@/api/customer'
```

### 文件3：CustomerDataManager.js
**当前导入**：
```javascript
import { customerApi } from '@/api/customer'
```
**修复后导入**：
```javascript
import customerApi from '@/api/customer'
```

## 边界条件与异常处理
1. **语法检查**：确保修改后的导入语句语法正确
2. **功能验证**：修复后验证客户台账页面能正常加载
3. **依赖检查**：确保没有其他文件受到影响

## 数据流动路径
1. 用户点击"客户台账"菜单
2. 路由导航到 `/sales/orders/customers`
3. 组件加载 `CustomerList.vue`
4. 导入 `customerApi` 成功
5. 页面正常渲染显示

## 预期成果
1. **错误消除**：控制台不再出现导入错误
2. **功能恢复**：客户台账页面能正常打开和显示
3. **数据加载**：客户数据能正常从API获取和显示
4. **操作正常**：增删改查功能都能正常使用

## 测试验证
1. 访问 `http://localhost:3007/sales/orders/customers` 能正常显示页面
2. 客户列表数据能正常加载
3. 新增、编辑、删除功能正常工作
4. 控制台无错误信息