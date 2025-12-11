# advanceStorageDays 配置修复报告

## 问题描述

用户反馈 `advanceStorageDays` 这个值在主生产计划页面的"页面设置"按钮中配置，但可能存在配置不一致的问题。

## 问题分析

经过代码检查，发现了以下问题：

### 1. 设置键名不一致问题

**主生产计划页面** (`ProductionPlanList.vue`):
- PageSettings 组件使用的 `settings-key="productionPlanSettings"`
- 但在 `getAdvanceStorageDays()` 和 `calculatePlannedStorageDate()` 方法中使用了错误的键名 `'production-plan-list'`

**销售订单页面** (`SalesOrderListNew.vue`):
- 正确使用统一的键名 `'salesOrderSettings'`

### 2. 配置位置确认

✅ **主生产计划页面** `advanceStorageDays` 配置位置：
- 文件：`/07-frontend/src/pages/production-planning/ProductionPlanList.vue`
- 访问方式：点击页面右上角的"页面设置"按钮 → "业务变量"标签页
- 字段名称："提前入库期"
- 默认值：3天

✅ **销售订单页面** `advanceStorageDays` 配置位置：
- 文件：`/07-frontend/src/pages/sales/sales-order/SalesOrderListNew.vue`
- 访问方式：点击页面右上角的"页面设置"按钮 → "业务变量"标签页
- 字段名称："提前入库期"
- 默认值：3天

## 修复内容

### 1. 修复主生产计划页面的键名不一致

**修复前：**
```javascript
// 错误的键名
const settingsKey = 'production-plan-list';
```

**修复后：**
```javascript
// 正确的键名，与 PageSettings 的 settings-key 保持一致
const settingsKey = 'productionPlanSettings';
```

**影响的方法：**
- `getAdvanceStorageDays()` - 获取提前入库期显示值
- `calculatePlannedStorageDate()` - 计算计划入库日期

### 2. 日期计算逻辑确认

两个页面的日期计算逻辑都正确实现了：

```
计划入库日期 = 真承诺交期 - 提前入库期
真承诺交期 = 订单承诺交期 + 1天
```

## 验证工具

创建了测试页面 `test_advance_storage_days.html` 用于验证：
1. 主生产计划页面设置保存和读取
2. 销售订单页面设置保存和读取
3. 不同提前入库期对日期计算的影响
4. 当前 localStorage 状态查看

## 使用说明

### 主生产计划页面配置步骤：
1. 访问：`http://localhost:3002/production-planning/production-plan-list`
2. 点击右上角的"页面设置"按钮（齿轮图标）
3. 选择"业务变量"标签页
4. 找到"提前入库期"字段
5. 设置所需的天数（0-365天）
6. 点击"保存"按钮

### 配置验证：
- 在主生产计划列表中，"提前入库期"列会显示当前配置值
- "计划入库日期"列会根据配置值和承诺交期自动计算
- 配置会保存在浏览器的 localStorage 中，键名为 `productionPlanSettings`

### 销售订单页面配置步骤：
1. 访问：`http://localhost:3004/sales/sales-order/sales-order-list-new`
2. 点击右上角的"页面设置"按钮（齿轮图标）
3. 选择"业务变量"标签页
4. 找到"提前入库期"字段
5. 设置所需的天数（0-365天）
6. 点击"保存"按钮

## 技术细节

### localStorage 键名对应关系

| 页面 | localStorage 键名 | PageSettings settings-key |
|------|-------------------|--------------------------|
| 主生产计划页面 | `productionPlanSettings` | `productionPlanSettings` |
| 销售订单页面 | `salesOrderSettings` | N/A (自定义实现) |

### 设置数据结构

```javascript
// 主生产计划页面设置
{
  "advanceStorageDays": 3,
  "exportFilePrefix": "主生产计划",
  "codePrefix": "MPS",
  // ... 其他设置
}

// 销售订单页面设置
{
  "advanceStorageDays": 3,
  "defaultCurrency": "CNY",
  "defaultExchangeRate": 1.0,
  // ... 其他设置
}
```

## 修复完成状态

✅ **已完成修复：**
1. 主生产计划页面的键名不一致问题已修复
2. 两个页面的配置功能都正常工作
3. 日期计算逻辑正确
4. 创建了测试工具用于验证功能

✅ **验证方法：**
1. 打开主生产计划页面，在页面设置中修改提前入库期
2. 观察表格中"提前入库期"和"计划入库日期"列的变化
3. 打开测试页面 `test_advance_storage_days.html` 进行详细测试

## 注意事项

1. **设置独立性**：主生产计划页面和销售订单页面的 `advanceStorageDays` 设置是独立的，互不影响
2. **默认值**：如果未设置，两个页面都使用默认值 3 天
3. **持久化**：设置保存在 localStorage 中，清除浏览器数据会重置设置
4. **实时计算**：修改设置后，页面上的日期计算会立即生效

## 相关文件

- `/07-frontend/src/pages/production-planning/ProductionPlanList.vue` - 主生产计划页面
- `/07-frontend/src/pages/sales/sales-order/SalesOrderListNew.vue` - 销售订单页面
- `/07-frontend/src/components/common/PageSettings.vue` - 通用页面设置组件
- `/test_advance_storage_days.html` - 测试验证页面