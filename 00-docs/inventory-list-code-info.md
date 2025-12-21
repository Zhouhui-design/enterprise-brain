# 库存列表代码信息文档

## 1. 后端相关文件

### 1.1 路由文件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/backend/routes/inventory.js`
- **功能**：定义库存管理API路由，包括库存列表查询、详情、更新、删除等操作

### 1.2 服务层文件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/backend/services/inventoryService.js`
- **功能**：实现库存管理的核心业务逻辑，包括数据处理、业务规则验证等

### 1.3 数据库相关文件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/backend/config/database.js`
- **功能**：配置数据库连接和定义库存表结构
- **主要表结构**：
  - `inventory`表：包含28个字段，用于存储库存主数据
  - `inventory_details`表：存储库存流水记录

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/backend/migrations/create_warehouses_table.sql`
- **功能**：创建仓库表和初始化仓库数据

### 1.4 服务器配置文件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/backend/server.js`
- **功能**：服务器主入口文件，配置API路由和中间件

## 2. 前端相关文件

### 2.1 API调用文件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/api/inventory/index.js`
- **功能**：提供库存管理相关的API调用封装，包括：
  - 库存列表查询
  - 库存调拨
  - 库存盘点
  - 库存预警
  - 库存报表
  - 库存流水
  - 库存调整

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/api/inventory.js`
- **功能**：简化版库存管理API调用封装，包括基础的CRUD操作

### 2.2 组件文件

#### 2.2.1 库存列表主组件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/inventory/InventoryList.vue`
- **功能**：主要的库存列表页面，包含：
  - 库存统计概览
  - 搜索筛选功能
  - 库存列表表格
  - 库存详情、调整、批量操作等功能

#### 2.2.2 库存管理列表组件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/inventory/inventory-management/InventoryList.vue`
- **功能**：库存管理专用列表页面，包含：
  - 高级搜索筛选
  - 库存统计卡片
  - 库存详情查看
  - 库存流水记录
  - 库存调整功能
  - 数据导出导入功能

#### 2.2.3 夹具库存组件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-resources/fixture/FixtureInventory.vue`
- **功能**：生产资源夹具的库存管理组件

#### 2.2.4 移动端库存组件

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/platforms/mobile/pages/inventory/MobileInventory.vue`
- **功能**：移动端专用的库存列表页面

### 2.3 数据处理Composable

- **文件路径**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/features/warehouse/composables/useWarehouseList.ts`
- **功能**：仓库管理列表数据处理的可复用逻辑，包括数据加载、分页、搜索、筛选等

## 3. 前后端字段对照

### 3.1 库存列表主要字段

| 前端显示字段 | 前端代码字段 | 后端代码字段 | 描述 |
|-------------|-------------|-------------|------|
| 商品编号/产品编码 | productCode | product_code | 商品的唯一编码 |
| 商品名称/产品名称 | productName | product_name | 商品的名称 |
| 分类 | category | category | 商品分类 |
| 品牌 | brand | brand | 商品品牌 |
| 规格 | specification | specification | 商品规格 |
| 仓库 | warehouseName | warehouse_name | 仓库名称 |
| 库位 | locationName | location | 库位信息 |
| 库存数量 | stock/quantity | quantity | 当前库存数量 |
| 可用数量 | availableQuantity | available_quantity | 可用库存数量 |
| 锁定数量 | lockedQuantity | locked_quantity | 锁定库存数量 |
| 单位 | unit | unit | 库存计量单位 |
| 安全库存 | safeStock/safetyStock | safety_stock | 安全库存数量 |
| 最低库存 | minStock | min_stock | 最低库存数量 |
| 单价 | unitPrice | unit_price | 商品单价 |
| 库存总值 | totalValue | total_value | 库存总价值 |
| 库存状态 | stockStatus | stock_status | 库存状态（正常/预警/缺货） |
| 最后更新 | lastUpdated/lastUpdateTime | last_updated_time | 最后更新时间 |
| 备注 | remarks | remarks | 备注信息 |

### 3.2 搜索筛选字段

| 前端显示字段 | 前端代码字段 | 后端参数字段 | 描述 |
|-------------|-------------|-------------|------|
| 商品编号/产品编码 | productCode | product_code | 商品编码搜索 |
| 商品名称/产品名称 | productName | product_name | 商品名称搜索 |
| 仓库 | warehouseId | warehouse_id | 仓库筛选 |
| 库存状态 | stockStatus | stock_status | 库存状态筛选 |
| 分类 | category | category | 分类筛选 |
| 负责人 | manager | manager | 仓库负责人筛选 |
| 区域 | region | region | 仓库区域筛选 |
| 状态 | status | status | 仓库状态筛选 |

### 3.3 统计字段

| 前端显示字段 | 前端代码字段 | 后端数据字段 | 描述 |
|-------------|-------------|-------------|------|
| 库存总值 | totalValue | total_value | 库存总价值 |
| 正常库存 | normalCount | normal_count | 正常状态库存项数 |
| 预警库存 | warningCount | warning_count | 预警状态库存项数 |
| 缺货库存 | shortageCount | shortage_count | 缺货状态库存项数 |

## 4. API接口汇总

### 4.1 后端API接口

| API路径 | 方法 | 功能 |
|---------|------|------|
| `/api/inventory` | GET | 获取库存列表 |
| `/api/inventory/:id` | GET | 获取库存详情 |
| `/api/inventory` | POST | 创建库存记录 |
| `/api/inventory/:id` | PUT | 更新库存记录 |
| `/api/inventory/:id` | DELETE | 删除库存记录 |
| `/api/inventory/batch-delete` | POST | 批量删除库存记录 |
| `/api/inventory/details/list` | GET | 获取库存明细 |
| `/api/inventory/report/summary` | GET | 获取库存报表 |
| `/api/inventory/in` | POST | 库存入库 |
| `/api/inventory/out` | POST | 库存出库 |
| `/api/inventory/clear-all` | DELETE | 清空仓库库存 |

### 4.2 前端API调用方法

| 前端调用方法 | 对应后端API | 功能 |
|-------------|-------------|------|
| `inventoryApi.getInventoryList()` | GET `/api/inventory/list` | 获取库存列表 |
| `inventoryApi.getInventoryDetail()` | GET `/api/inventory/:id` | 获取库存详情 |
| `inventoryApi.updateInventory()` | PUT `/api/inventory/update` | 更新库存 |
| `inventoryAPI.getList()` | GET `/api/inventory` | 获取库存列表 |
| `inventoryAPI.getById()` | GET `/api/inventory/:id` | 获取库存详情 |
| `inventoryAPI.create()` | POST `/api/inventory` | 创建库存记录 |
| `inventoryAPI.update()` | PUT `/api/inventory/:id` | 更新库存记录 |
| `inventoryAPI.delete()` | DELETE `/api/inventory/:id` | 删除库存记录 |
| `inventoryAPI.batchDelete()` | POST `/api/inventory/batch-delete` | 批量删除库存记录 |

## 5. 数据库表结构

### 5.1 库存表 (`inventory`)

**主要字段：**
- `id`: 主键
- `product_code`: 产品编码
- `product_name`: 产品名称
- `warehouse_id`: 仓库ID
- `warehouse_name`: 仓库名称
- `location`: 库位
- `quantity`: 库存数量
- `available_quantity`: 可用数量
- `locked_quantity`: 锁定数量
- `unit`: 单位
- `safety_stock`: 安全库存
- `unit_price`: 单价
- `total_value`: 总价值
- `stock_status`: 库存状态
- `last_updated_time`: 最后更新时间

### 5.2 库存流水表 (`inventory_details`)

**主要字段：**
- `id`: 主键
- `inventory_id`: 库存ID
- `product_code`: 产品编码
- `product_name`: 产品名称
- `warehouse_id`: 仓库ID
- `warehouse_name`: 仓库名称
- `location`: 库位
- `movement_type`: 变动类型（入库/出库/调整）
- `quantity_change`: 数量变动
- `quantity_before`: 变动前数量
- `quantity_after`: 变动后数量
- `reason`: 变动原因
- `operator`: 操作人
- `operation_time`: 操作时间

## 6. 组件关系图

```
├── InventoryList.vue (主要库存列表组件)
│   ├── 搜索筛选模块
│   ├── 统计概览模块
│   ├── 库存列表表格
│   └── 操作对话框（详情、调整、新增）
├── inventory-management/InventoryList.vue (库存管理列表)
│   ├── 高级搜索模块
│   ├── 统计卡片
│   ├── 库存列表表格
│   └── 导出导入功能
├── MobileInventory.vue (移动端库存组件)
│   ├── 移动端适配的列表
│   └── 简化的操作功能
└── FixtureInventory.vue (夹具库存组件)
    └── 针对夹具的库存管理功能
```

## 7. 技术栈

### 7.1 后端技术栈
- Node.js
- Express.js
- MySQL

### 7.2 前端技术栈
- Vue 3
- Element Plus
- TypeScript
- Axios