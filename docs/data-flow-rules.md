# 企业大脑系统数据流规则文档

## 1. 系统概述

企业大脑系统是一个复杂的企业级业务管理系统，包含销售订单管理、生产计划、物料需求计划(MRP)、采购管理、工序计划等多个模块。这些模块之间通过严格的数据流规则进行交互，形成完整的业务闭环。

## 2. 核心数据流规则

### 2.1 销售订单到生产计划数据流

1. 在销售订单管理新增销售订单 - 功能正常
2. 在销售订单管理点击"正式下单"按钮 - 功能正常
3. 根据列字段"产出工序"进行分流：
   - 产出工序 = "采购" 的数据自动推送到采购计划
   - 产出工序 != "采购" 的数据自动推送到生产计划列表

### 2.2 生产计划到备料计划数据流

1. 在生产计划列表，自动获取销售订单的产品数据信息
2. 选择数据，点击"执行排程"按钮
3. 系统自动生成备料计划

### 2.3 备料计划自动推送规则

1. 备料计划自动获取生产计划列表的数据
2. 再自动触发推送：
   - 符合采购条件的推送到采购计划
   - 符合工序条件的推送到工序计划，按规则推送到具体工序

### 2.4 工序计划循环推送规则

1. 工序计划中按规则自增行数据
2. 推送回备料计划
3. 备料计划再自动触发推送到工序计划和采购计划
4. 直到不再推送工序计划和采购计划才停止

## 3. 同步删除规则

### 3.1 销售订单删除联动规则

当销售订单被删除时，系统自动触发以下数据的删除：
- 生产计划列表中符合条件的数据
- 备料计划中符合条件的数据
- 采购计划中符合条件的数据
- 各工序计划中符合条件的数据

### 3.2 工序计划删除联动规则

- 各工序计划被动删除或主动删除时，自动触发工序能力负荷表的"重置占用工时"计算
- 各工序计划被动生成或主动生成时，自动触发推送"计划排程工时"到工序能力负荷表

## 4. 各模块代码文件清单

### 4.1 前端页面文件

| 模块 | 页面文件路径 |
|------|-------------|
| 销售订单管理 | [/07-frontend/src/pages/sales/sales-order/SalesOrderListNew.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/sales/sales-order/SalesOrderListNew.vue) |
| 工序能力负荷表 | [/07-frontend/src/pages/production-planning/CapacityPlanning.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/CapacityPlanning.vue) |
| 备料计划 | [/07-frontend/src/pages/production-planning/material-preparation-new/MaterialPreparationList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/materialPreparationList.vue) |
| 生产计划列表 | [/07-frontend/src/pages/production-planning/ProductionPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/ProductionPlanList.vue) |
| 打包工序计划列表 | [/07-frontend/src/pages/production-planning/packing-process-plan/PackingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/packing-process-plan/PackingProcessPlanList.vue) |
| 喷塑工序计划列表 | [/07-frontend/src/pages/production-planning/spray-painting-process-plan/SprayPaintingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/spray-painting-process-plan/SprayPaintingProcessPlanList.vue) |
| 组装工序计划列表 | [/07-frontend/src/pages/production-planning/assembly-process-plan/AssemblyProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/assembly-process-plan/AssemblyProcessPlanList.vue) |
| 缝纫工序计划 | [/07-frontend/src/pages/production-planning/sewing-process-plan/SewingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/sewing-process-plan/SewingProcessPlanList.vue) |
| 抛丸工序计划 | [/07-frontend/src/pages/production-planning/shot-blasting-process-plan/ShotBlastingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/shot-blasting-process-plan/ShotBlastingProcessPlanList.vue) |
| 人工焊接工序计划 | [/07-frontend/src/pages/production-planning/manual-welding-process-plan/ManualWeldingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/manual-welding-process-plan/ManualWeldingProcessPlanList.vue) |
| 弯管工序计划 | [/07-frontend/src/pages/production-planning/tube-bending-process-plan/TubeBendingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/tube-bending-process-plan/TubeBendingProcessPlanList.vue) |
| 激光切管工序计划 | [/07-frontend/src/pages/production-planning/laser-tube-cutting-process-plan/LaserTubeCuttingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/laser-tube-cutting-process-plan/LaserTubeCuttingProcessPlanList.vue) |
| 激光下料工序计划 | [/07-frontend/src/pages/production-planning/laser-cutting-process-plan/LaserCuttingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/laser-cutting-process-plan/LaserCuttingProcessPlanList.vue) |
| 折弯工序计划 | [/07-frontend/src/pages/production-planning/bending-process-plan/BendingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/bending-process-plan/BendingProcessPlanList.vue) |
| 打孔工序计划 | [/07-frontend/src/pages/production-planning/drilling-process-plan/DrillingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/drilling-process-plan/DrillingProcessPlanList.vue) |
| 冲床工序计划 | [/07-frontend/src/pages/production-planning/punching-process-plan/PunchingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/punching-process-plan/PunchingProcessPlanList.vue) |
| 人工下料工序计划 | [/07-frontend/src/pages/production-planning/manual-cutting-process-plan/ManualCuttingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/manual-cutting-process-plan/ManualCuttingProcessPlanList.vue) |
| 机器打磨工序计划 | [/07-frontend/src/pages/production-planning/machine-grinding-process-plan/MachineGrindingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/machine-grinding-process-plan/MachineGrindingProcessPlanList.vue) |
| 裁剪工序计划 | [/07-frontend/src/pages/production-planning/cutting-process-plan/CuttingProcessPlanList.vue](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/production-planning/cutting-process-plan/CuttingProcessPlanList.vue) |

### 4.2 后端路由文件

| 模块 | 路由文件路径 |
|------|-------------|
| 销售订单 | [/backend/routes/salesOrders.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/salesOrders.js) |
| 主生产计划 | [/backend/routes/masterProductionPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/masterProductionPlans.js) |
| 工序能力负荷表 | [/backend/routes/capacityLoad.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/capacityLoad.js) |
| 备料计划 | [/backend/routes/materialPreparationPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/materialPreparationPlans.js) |
| 采购计划 | [/backend/routes/procurementPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/procurementPlans.js) |
| 打包工序计划 | [/backend/routes/packingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/packingProcessPlans.js) |
| 组装工序计划 | [/backend/routes/assemblyProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/assemblyProcessPlans.js) |
| 喷塑工序计划 | [/backend/routes/sprayPaintingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/sprayPaintingProcessPlans.js) |
| 缝纫工序计划 | [/backend/routes/sewingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/sewingProcessPlans.js) |
| 抛丸工序计划 | [/backend/routes/shotBlastingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/shotBlastingProcessPlans.js) |
| 人工焊接工序计划 | [/backend/routes/manualWeldingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/manualWeldingProcessPlans.js) |
| 弯管工序计划 | [/backend/routes/tubeBendingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/tubeBendingProcessPlans.js) |
| 激光切管工序计划 | [/backend/routes/laserTubeCuttingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/laserTubeCuttingProcessPlans.js) |
| 激光下料工序计划 | [/backend/routes/laserCuttingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/laserCuttingProcessPlans.js) |
| 折弯工序计划 | [/backend/routes/bendingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/bendingProcessPlans.js) |
| 打孔工序计划 | [/backend/routes/drillingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/drillingProcessPlans.js) |
| 冲床工序计划 | [/backend/routes/punchingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/punchingProcessPlans.js) |
| 人工下料工序计划 | [/backend/routes/manualCuttingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/manualCuttingProcessPlans.js) |
| 机器打磨工序计划 | [/backend/routes/machineGrindingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/machineGrindingProcessPlans.js) |
| 裁剪工序计划 | [/backend/routes/cuttingProcessPlans.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/routes/cuttingProcessPlans.js) |

### 4.3 后端服务文件

| 模块 | 服务文件路径 |
|------|-------------|
| 备料计划服务 | [/backend/services/materialPreparationPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/materialPreparationPlanService.js) |
| 采购计划服务 | [/backend/services/procurementPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/procurementPlanService.js) |
| 打包工序计划服务 | [/backend/services/packingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/packingProcessPlanService.js) |
| 组装工序计划服务 | [/backend/services/assemblyProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/assemblyProcessPlanService.js) |
| 喷塑工序计划服务 | [/backend/services/sprayPaintingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/sprayPaintingProcessPlanService.js) |
| 缝纫工序计划服务 | [/backend/services/sewingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/sewingProcessPlanService.js) |
| 抛丸工序计划服务 | [/backend/services/shotBlastingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/shotBlastingProcessPlanService.js) |
| 人工焊接工序计划服务 | [/backend/services/manualWeldingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/manualWeldingProcessPlanService.js) |
| 弯管工序计划服务 | [/backend/services/tubeBendingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/tubeBendingProcessPlanService.js) |
| 激光切管工序计划服务 | [/backend/services/laserTubeCuttingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/laserTubeCuttingProcessPlanService.js) |
| 激光下料工序计划服务 | [/backend/services/laserCuttingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/laserCuttingProcessPlanService.js) |
| 折弯工序计划服务 | [/backend/services/bendingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/bendingProcessPlanService.js) |
| 打孔工序计划服务 | [/backend/services/drillingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/drillingProcessPlanService.js) |
| 冲床工序计划服务 | [/backend/services/punchingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/punchingProcessPlanService.js) |
| 人工下料工序计划服务 | [/backend/services/manualCuttingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/manualCuttingProcessPlanService.js) |
| 机器打磨工序计划服务 | [/backend/services/machineGrindingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/machineGrindingProcessPlanService.js) |
| 裁剪工序计划服务 | [/backend/services/cuttingProcessPlanService.js](file:///home/sardensy/enterprise-brain/enterpise-brain/backend/services/cuttingProcessPlanService.js) |

### 4.4 前端API文件

| 模块 | API文件路径 |
|------|-------------|
| 主生产计划API | [/07-frontend/src/api/masterProductionPlan.js](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/api/masterProductionPlan.js) |
| 工序能力负荷表API | [/07-frontend/src/api/capacityLoad.js](file:///home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/api/capacityLoad.js) |

## 5. 重要字段清单

### 5.1 主生产计划关键字段

- plan_code (主生产计划编号)
- product_code (产品编号)
- product_name (产品名称)
- order_quantity (订单数量)
- salesperson (销售员)
- sales_unit (销售单位)
- available_stock (可用库存)
- current_stock (实时库存)
- plan_quantity (计划数量)
- product_image (产品图片)
- output_process (产出工序)
- promised_delivery_date (订单承诺交期)
- status (进度状态)
- planned_storage_date (计划入库日期)
- product_source (产品来源)
- internal_order_no (内部销售订单编号)
- customer_order_no (客户订单编号)
- customer_name (客户名称)
- submitter (提交人)

### 5.2 备料计划关键字段

- plan_no (备料计划编号)
- source_plan_no (来源计划编号)
- material_code (物料编号)
- material_name (物料名称)
- material_source (物料来源)
- material_unit (物料单位)
- demand_quantity (需求数量)
- available_stock (可用库存)
- replenishment_quantity (补货数量)
- source_process (来源工序)
- demand_date (需求日期)
- sales_order_no (销售订单编号)
- customer_order_no (客户订单编号)
- main_plan_product_code (主计划产品编号)
- main_plan_product_name (主计划产品名称)
- promise_delivery_date (承诺交期)
- customer_name (客户名称)
- product_image (产品图片)
- submitter (提交人)

## 6. 系统环境依赖

### 6.1 前端依赖

```json
{
  "dependencies": {
    "vue": "3.4.21",
    "@dcloudio/uni-app": "3.0.0-4060620250520001",
    "@cloudbase/js-sdk": "latest (~1.x)",
    "@cloudbase/adapter-uni-app": "^1.0.0-beta.1",
    "typescript": "^4.9.4",
    "vite": "5.2.8",
    "xlsx": "^0.18.5"
  }
}
```

### 6.2 后端依赖

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "node-cron": "^4.2.1"
  }
}
```

### 6.3 Java依赖

```xml
<properties>
  <maven.compiler.source>21</maven.compiler.source>
  <maven.compiler.target>21</maven.compiler.target>
  <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
</properties>

<build>
  <plugins>
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-compiler-plugin</artifactId>
      <version>3.11.0</version>
    </plugin>
  </plugins>
</build>
```

## 7. 注意事项

1. 系统重装或迁移后，务必验证核心数据流的完整性
2. 在修改代码时，严禁删除现有字段，只能新增字段以保证向后兼容性
3. 所有接口和表结构变更必须保持向后兼容，确保历史数据正常流转
4. 跨服务数据推送机制需要端到端验证，确保数据传递正确性和触发可靠性
5. 在事务成功提交后才触发数据推送，确保事务完整性