# 备料计划（Material Preparation Plan）信息文档

## 1. 备料计划字段列表

| 字段名 | 类型 | 描述 | 是否必填 |
|-------|------|------|--------|
| id | number | 主键ID | 否 |
| planNo | string | 计划编号 | 是 |
| sourcePlanNo | string | 源计划编号 | 否 |
| sourceProcessPlanNo | string | 源工序计划编号 | 否 |
| parentCode | string | 父件代码 | 否 |
| parentName | string | 父件名称 | 否 |
| parentScheduleQuantity | number | 父件计划数量 | 否 |
| materialCode | string | 物料代码 | 是 |
| materialName | string | 物料名称 | 是 |
| materialSource | string | 物料来源 | 否 |
| materialUnit | string | 物料单位 | 否 |
| demandQuantity | number | 需求数量 | 是 |
| needMrp | boolean | 是否需要MRP | 否 |
| realtimeStock | number | 实时库存 | 否 |
| projectedBalance | number | 预计余额 | 否 |
| availableStock | number | 可用库存 | 否 |
| sourceProcess | string | 来源工序 | 否 |
| workshopName | string | 车间名称 | 否 |
| parentProcessName | string | 父工序名称 | 否 |
| processIntervalHours | number | 工序间隔小时 | 否 |
| processIntervalUnit | string | 工序间隔单位 | 否 |
| processScheduleDate | string | 工序计划日期 | 否 |
| demandDate | string | 需求日期 | 否 |
| pushToPurchase | boolean | 是否推送到采购 | 否 |
| pushToProcess | boolean | 是否推送到工序 | 否 |
| salesOrderNo | string | 销售订单号 | 否 |
| customerOrderNo | string | 客户订单号 | 否 |
| mainPlanProductCode | string | 主计划产品代码 | 否 |
| mainPlanProductName | string | 主计划产品名称 | 否 |
| mainPlanQuantity | number | 主计划数量 | 否 |
| promiseDeliveryDate | string | 承诺交货日期 | 否 |
| remark | string | 备注 | 否 |
| createdAt | string | 创建时间 | 否 |
| updatedAt | string | 更新时间 | 否 |
| createdBy | string | 创建人 | 否 |
| updatedBy | string | 更新人 | 否 |

## 2. 前端代码文件

### 2.1 类型定义
- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/features/material-preparation/types/index.ts`
- **功能**: 定义备料计划的所有类型接口

### 2.2 API服务层
- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/features/material-preparation/services/materialPrepApi.ts`
- **功能**: 封装与后端的HTTP通信

### 2.3 业务逻辑层
- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/features/material-preparation/composables/useMaterialPrepActions.ts`
- **功能**: 提供备料计划的增删改查操作逻辑

- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/features/material-preparation/composables/useMaterialPrepList.ts`
- **功能**: 处理备料计划列表的数据加载和管理

### 2.4 页面组件
- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/MaterialPreparationPlan.vue`
- **功能**: 备料计划列表页面

- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/MaterialPreparationPlanNew.vue`
- **功能**: 新增备料计划页面

### 2.5 API接口定义
- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/api/materialPreparationPlan.js`
- **功能**: 定义所有备料计划相关的API接口

### 2.6 路由配置
- **文件路径**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/router/modules/production-planning.js`
- **功能**: 配置备料计划相关的路由

## 3. 后端API接口

### 3.1 基础CRUD接口
| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/material-preparation-plans` | 获取备料计划列表 |
| GET | `/material-preparation-plans/:id` | 获取单个备料计划详情 |
| POST | `/material-preparation-plans` | 创建备料计划 |
| PUT | `/material-preparation-plans/:id` | 更新备料计划 |
| DELETE | `/material-preparation-plans/:id` | 删除备料计划 |

### 3.2 批量操作接口
| 方法 | 路径 | 功能 |
|------|------|------|
| DELETE | `/material-preparation-plans/batch/delete` | 批量删除备料计划 |

### 3.3 业务操作接口
| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/material-preparation-plans/:id/push-to-process` | 推送到工序计划 |

## 4. 后端代码（待实现）

目前后端尚未实现备料计划的相关代码，需要在以下目录中创建：

- `/home/sardensy/enterprise-brain/enterpise-brain/07-backend/routes/material-preparation-plans.js` - 路由定义
- `/home/sardensy/enterprise-brain/enterpise-brain/07-backend/services/materialPreparationService.js` - 服务层
- `/home/sardensy/enterprise-brain/enterpise-brain/07-backend/models/MaterialPreparationPlan.js` - 数据模型

## 5. 数据流向

1. **前端页面** → **业务逻辑层** (useMaterialPrepList/useMaterialPrepActions)
2. **业务逻辑层** → **API服务层** (materialPrepApi.ts)
3. **API服务层** → **后端API** (HTTP请求)
4. **后端API** → **服务层** (MaterialPreparationService)
5. **服务层** → **数据模型** (MaterialPreparationPlan)
6. **数据模型** → **数据库**

## 6. 技术栈

- **前端框架**: Vue 3 + TypeScript
- **状态管理**: Composition API
- **UI组件**: Element Plus
- **API通信**: Axios
- **后端框架**: Express (待实现)
- **数据库**: 待定 (待实现)

## 7. 注意事项

1. 备料计划与主生产计划、工序计划存在关联关系
2. 推送到工序功能需要与工序计划模块协作
3. 库存信息需要与库存管理模块实时同步
4. 后端API需要支持分页、过滤和排序功能