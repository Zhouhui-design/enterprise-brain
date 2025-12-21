# 备料计划 数据来源规则与推送规则

## 一、数据来源规则

### 1. 数据来源类型
备料计划的数据来源主要有两种：
- **主生产计划** (`DataSourceType.MAIN_PLAN`)：由主生产计划生成的备料计划
- **真工序计划** (`DataSourceType.REAL_PROCESS_PLAN`)：由真工序计划生成的备料计划

### 2. 数据流向
```
销售订单 → 主生产计划 → 备料计划 → 真工序计划 → 备料计划
```

### 3. 字段映射规则

#### 3.1 从主生产计划获取的字段
| 备料计划字段 | 主生产计划对应字段 | 说明 |
|-------------|------------------|------|
| `sourcePlanNo` | 主生产计划编号 | 来源计划编号 |
| `salesOrderNo` | 销售订单编号 | 关联的销售订单 |
| `customerOrderNo` | 客户订单编号 | 关联的客户订单 |
| `mainPlanProductCode` | 产品编号 | 主生产计划的产品编号 |
| `mainPlanProductName` | 产品名称 | 主生产计划的产品名称 |
| `mainPlanQuantity` | 计划数量 | 主生产计划的数量 |
| `promiseDeliveryDate` | 承诺交货日期 | 主生产计划的交货日期 |

#### 3.2 从真工序计划获取的字段
| 备料计划字段 | 真工序计划对应字段 | 说明 |
|-------------|------------------|------|
| `sourceProcessPlanNo` | 真工序计划编号 | 来源工序计划编号 |
| `parentCode` | 父件编号 | 父件产品编号 |
| `parentName` | 父件名称 | 父件产品名称 |
| `parentScheduleQuantity` | 排程数量 | 父件排程数量 |
| `sourceProcess` | 来源工序 | 来源工序名称 |
| `workshopName` | 车间名称 | 来源车间名称 |
| `parentProcessName` | 父工序名称 | 父工序名称 |
| `processIntervalHours` | - | 工序间隔时间（小时） |
| `processIntervalUnit` | - | 工序间隔单位（小时/天） |
| `processScheduleDate` | 排程日期 | 工序排程日期 |

### 4. 关键业务逻辑

#### 4.1 需求日期计算规则
```
需求日期 (demandDate) = 工序计划日期 (processScheduleDate) - 工序间隔时间 (processIntervalHours)
```

- 间隔单位可配置为小时或天
- 用于确定物料需要准备的最晚日期

#### 4.2 库存计算规则
- **实时库存** (`realtimeStock`)：当前实际库存数量
- **预计结存** (`projectedBalance`)：考虑在途和待出库后的预计库存
- **可用库存** (`availableStock`)：实际可用于生产的库存数量

#### 4.3 MRP需求判断
```
needMrp = demandQuantity > availableStock
```

- 当需求数量大于可用库存时，需要进行MRP计算
- 用于决定是否需要采购或生产更多物料

## 二、推送规则

### 1. 推送到工序计划

#### 1.1 推送实现
- **API路径**：`/material-preparation-plans/${id}/push-to-process`
- **实现方法**：`useMaterialPrepActions.pushToProcess(row)`
- **功能说明**：将备料计划推送到工序计划系统

#### 1.2 推送合并规则
备料计划推送到工序计划时，支持以下合并规则：

| 合并规则 | 说明 | 默认值 |
|---------|------|--------|
| 按销售订单合并 | 相同"销售订单编号"且相同"计划物料编号"合并排程 | ❌ |
| 按来源主计划编号合并 | 相同"来源主计划编号"且相同"计划物料编号"合并排程 | ✅ |
| 按备料计划编号合并 | 相同"备料计划编号"且相同"计划物料编号"合并排程 | ❌ |
| 按需求日期合并 | 相同"需求日期"且相同"计划物料编号"合并排程 | ❌ |
| 按计划物料编号合并 | 相同"计划物料编号"合并排程 | ❌ |

### 2. 从真工序计划推送

#### 2.1 推送实现
- **API路径**：`/real-process-plans/${id}/push-to-material`
- **实现方法**：`pushToMaterialPreparation(id, processIntervalSettings)`
- **功能说明**：将真工序计划的物料需求推送到备料计划系统

#### 2.2 推送参数
- `id`：真工序计划ID
- `processIntervalSettings`：工序间隔设置，用于计算需求日期

### 3. 推送到采购计划

#### 3.1 功能概述
- 备料计划包含 `pushToPurchase` 字段，用于标记是否需要推送到采购计划
- 当前前端已标记该功能，但具体实现尚未完成

### 4. 推送状态管理

#### 4.1 状态字段
- `pushToProcess`：标记是否已推送到工序计划
- `pushToPurchase`：标记是否已推送到采购计划

#### 4.2 状态更新
- 推送成功后，对应状态字段会更新为 `true`
- 可通过API查询当前推送状态

## 三、技术实现

### 1. 前端实现

#### 1.1 核心文件
- **类型定义**：`src/features/material-preparation/types/index.ts`
- **API服务**：`src/features/material-preparation/services/materialPrepApi.ts`
- **业务逻辑**：`src/features/material-preparation/composables/useMaterialPrepActions.ts`
- **页面组件**：`src/pages/production-planning/MaterialPreparationPlanNew.vue`

#### 1.2 关键API
```typescript
// 推送到工序计划
async pushToProcess(id: number): Promise<any> {
  const response = await request.post(`${this.basePath}/${id}/push-to-process`)
  return response.data || response
}
```

### 2. 后端实现

#### 2.1 API路径
- 备料计划管理：`/material-preparation-plans`
- 推送工序计划：`/material-preparation-plans/:id/push-to-process`
- 真工序计划推送：`/real-process-plans/:id/push-to-material`

## 四、注意事项

### 1. 数据一致性
- 推送过程中需要确保数据一致性，避免重复推送或数据丢失
- 建议实现幂等性检查

### 2. 权限控制
- 推送操作需要适当的权限控制，避免误操作

### 3. 日志记录
- 重要的推送操作需要记录日志，便于追踪和排查问题

### 4. 异常处理
- 推送失败时需要有合理的异常处理机制，提供清晰的错误信息

---

**文档创建时间**：2023-11-01
**文档版本**：v1.0
**最后更新**：2023-11-01