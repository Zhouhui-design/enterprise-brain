# 打包工序计划详细文档

## 1. 主表格字段

### 基础信息字段
| 字段名 | 显示名 | 宽度 | 说明 |
|-------|-------|------|------|
| rowIndex | 序号 | 80 | 自动生成 |
| planNo | 打包工序计划编号 | 160 | 唯一标识 |
| salesOrderNo | 销售订单编号 | 160 | 关联销售订单 |
| customerOrderNo | 客户订单编号 | 160 | 客户原始订单号 |
| masterPlanNo | 主生产计划编号 | 160 | 关联主生产计划 |
| materialPlanNo | 备料计划编号 | 160 | 关联备料计划 |
| productCode | 生产产品编号 | 140 | 产品编码 |
| productName | 生产产品名称 | 180 | 产品名称 |
| productImage | 产品图片 | 100 | 产品可视化 |

### 计划与排程字段
| 字段名 | 显示名 | 说明 |
|-------|-------|------|
| processName | 工序名称 | 打包工序名称 |
| scheduleDate | 计划排程日期 | 排程执行日期 |
| scheduleQuantity | 计划排程数量 | 当天计划排程数量 |
| completionDate | 计划完工日期 | 计划完成时间 |
| planStartDate | 计划开始日期 | 计划开始时间 |
| realPlanStartDate | 真计划开始日期 | 实际计划开始时间 |
| planEndDate | 计划结束日期 | 计划结束时间 |

### 工时与产能字段
| 字段名 | 显示名 | 说明 |
|-------|-------|------|
| replenishmentQty | 需补货数量 | 需要补充的数量 |
| standardWorkQuota | 定时工额 | 单位时间产量 |
| requiredWorkHours | 需求工时 | 所需总工时（自动计算） |
| dailyTotalWorkHours | 当天总工时 | 工序当天总产能 |
| dailyScheduledHours | 当天已排程工时 | 当天已安排的工时 |
| dailyAvailableHours | 工序当天可用工时 | 当天可用产能 |
| scheduledWorkHours | 计划排程工时 | 当天计划排程的工时 |

### 负责人与状态字段
| 字段名 | 显示名 | 说明 |
|-------|-------|------|
| processManager | 工序负责人 | 负责该工序的人员 |
| status | 状态 | 计划执行状态 |
| createdBy | 创建人 | 记录创建者 |
| createdTime | 创建时间 | 记录创建时间 |
| updatedBy | 更新人 | 记录更新者 |
| updatedTime | 更新时间 | 记录更新时间 |

## 2. 关联代码文件

### 核心文件
- **主页面组件**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/PackingProcessPlanList.vue`
  - 包含完整的表格配置、表单定义、业务逻辑和API调用
  - 实现了字段计算、排程逻辑和合并规则

- **API接口定义**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/api/packingProcessPlan.js`
  - 定义了与后端交互的RESTful接口
  - 包含getList、getById、create、update、deleteById等CRUD操作
  - 提供了queryDailyScheduledHours和fixFieldCalculations等特殊功能接口

### 辅助文件
- **路由配置**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/router/modules/production-planning.js`
  - 定义了打包工序计划的路由路径和权限

- **排程引擎**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/utils/schedulingEngine.js`
  - 提供了排程算法和逻辑支持
  - 包含ProcessStep等核心排程类

- **真工序计划组件**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/RealProcessPlanList.vue`
  - 与打包工序计划共享部分逻辑和配置

- **工序计划备份**：`/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/ProcessPlanList.vue.backup`
  - 包含历史版本的排程逻辑和字段计算

## 3. 数据来源规则

### 数据来源
1. **销售订单系统**：销售订单编号、客户订单编号等订单信息
2. **主生产计划**：主生产计划编号、产品信息等
3. **备料计划**：备料计划编号、需补货数量等
4. **产品物料库**：产品编号、产品名称、定时工额等产品信息
5. **工序能力负荷表**：当天总工时、剩余工时等产能信息

### 字段计算规则
1. **需求工时计算**：
   - 公式：`需求工时 = 需补货数量 / 定时工额`
   - 触发条件：需补货数量或定时工额变化时

2. **当天可用工时计算**：
   - 公式：`工序当天可用工时 = 当天总工时 - 当天已排程工时`
   - 触发条件：当天总工时或当天已排程工时变化时

3. **计划排程工时计算**：
   - 公式：`计划排程工时 = MIN(工序当天可用工时, 需求工时)`
   - 触发条件：工序当天可用工时或需求工时变化时

4. **计划排程数量计算**：
   - 公式：`计划排程数量 = 计划排程工时 * 定时工额`
   - 触发条件：计划排程工时或定时工额变化时

### 合并规则
1. **按销售订单合并**：相同销售订单编号且相同计划物料编号合并排程
2. **按来源主计划编号合并**：相同来源主计划编号且相同计划物料编号合并排程
3. **按备料计划编号合并**：相同备料计划编号且相同计划物料编号合并排程
4. **按需求日期合并**：相同需求日期且相同计划物料编号合并排程
5. **按计划物料编号合并**：相同计划物料编号合并排程

## 4. 触发规则

### 自动计算触发
1. **需求工时计算**：
   ```javascript
   watch(
     () => [formData.value.replenishmentQty, formData.value.standardWorkQuota],
     ([qty, quota]) => {
       if (qty > 0 && quota > 0) {
         formData.value.requiredWorkHours = parseFloat((qty / quota).toFixed(2))
       } else {
         formData.value.requiredWorkHours = 0
       }
     },
     { deep: true }
   )
   ```

2. **计划结束日期查询**：
   - 前置条件：需求工时 > 0，且工序名称和计划完工日期已填写
   - 调用capacityLoadApi.queryPlanEndDate获取计划结束日期
   - 触发后自动调用计划开始日期查询

3. **计划开始日期查询**：
   - 前置条件：计划结束日期已确定
   - 调用capacityLoadApi.queryPlanStartDate获取计划开始日期
   - 同时计算真计划开始日期和计划排程日期

4. **当天总工时查询**：
   - 当计划排程日期变化时触发
   - 查询工序能力负荷表获取当天总工时

5. **当天已排程工时查询**：
   - 当计划排程日期或工序名称变化时触发
   - 调用packingProcessPlanApi.queryDailyScheduledHours获取已排程工时

### 业务操作触发
1. **修复字段计算**：
   - 通过按钮手动触发
   - 调用packingProcessPlanApi.fixFieldCalculations修复所有记录的自动计算字段

2. **工序间隔设置**：
   - 通过弹窗设置工序间的间隔时间
   - 影响排程日期计算

### 条件触发
1. **计划开始/结束日期清空**：
   - 当需求工时 <= 0时
   - 当缺少工序名称或计划完工日期时

2. **字段计算前置条件**：
   - 需求工时计算：需补货数量 > 0 且 定时工额 > 0
   - 计划排程工时计算：工序当天可用工时 > 0 且 需求工时 > 0
   - 计划排程数量计算：计划排程工时 > 0 且 定时工额 > 0

## 5. 技术实现细节

### API接口
```javascript
// 获取打包工序计划列表
export function getList(params)
// 根据ID获取打包工序计划
export function getById(id)
// 创建打包工序计划
export function create(data)
// 更新打包工序计划
export function update(id, data)
// 删除打包工序计划
export function deleteById(id)
// 批量删除打包工序计划
export function batchDelete(ids)
// 查询当天已排程工时
export function queryDailyScheduledHours(params)
// 修复字段计算
export function fixFieldCalculations()
```

### 核心业务变量
- `minRemainingHours`：剩余工时门槛值（默认0.5小时）
- `exportFilePrefix`：导出文件前缀
- `defaultMergeRule`：默认合并规则（按来源主计划编号）

### 关键函数
- `calculateDailyAvailableHours()`：计算工序当天可用工时
- `calculateScheduledWorkHours()`：计算计划排程工时
- `calculateScheduleQuantity()`：计算计划排程数量
- `queryPlanEndDate()`：查询计划结束日期
- `queryPlanStartDate()`：查询计划开始日期

## 6. 注意事项

1. **数据一致性**：
   - 打包工序计划与销售订单、主生产计划、备料计划保持数据同步
   - 定时工额从产品物料库获取，确保准确性

2. **排程逻辑**：
   - 计划排程工时不超过工序当天可用工时
   - 计划开始日期和结束日期基于工序能力负荷表计算

3. **合并规则**：
   - 合并规则影响排程的集中程度
   - 可根据业务需求选择不同的合并维度

4. **字段修复**：
   - 当自动计算字段出现异常时，可使用修复功能重新计算
   - 修复操作会影响所有记录，需谨慎使用

5. **权限控制**：
   - 不同用户角色可能有不同的操作权限
   - 需遵循最小权限原则