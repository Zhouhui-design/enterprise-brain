# Design Document

## Overview

本设计文档描述了修复备料计划推送到工序计划的数据路由逻辑的技术方案。当前系统错误地使用产品物料库的"产出工序"字段进行路由决策，需要修改为使用备料计划的"来源工序"字段，以符合业务规则要求。

## Architecture

### 当前架构问题

```
备料计划 (source_process="组装")
    ↓
查询产品物料库 (materials.process_name="组装") ❌ 错误路由依据
    ↓
路由到组装工序计划 (assembly_process_plans)
```

### 修复后架构

```
备料计划 (source_process="组装")
    ↓
直接使用source_process字段 ✅ 正确路由依据
    ↓
路由到组装工序计划 (assembly_process_plans)
```

## Components and Interfaces

### 核心组件

1. **MaterialPreparationPlanService.pushToRealProcessPlan()**
   - 负责备料计划推送到工序计划的主要逻辑
   - 需要修改路由判断逻辑

2. **路由映射表**
   ```javascript
   const ROUTE_MAPPING = {
     '打包': {
       table: 'packing_process_plans',
       service: 'PackingProcessPlanService',
       prefix: 'PKPP'
     },
     '组装': {
       table: 'assembly_process_plans', 
       service: 'AssemblyProcessPlanService',
       prefix: 'ASPP'
     },
     '喷塑': {
       table: 'packing_process_plans',
       service: 'PackingProcessPlanService', 
       prefix: 'PKPP'
     }
   };
   ```

3. **防重复检查机制**
   - 根据路由结果在正确的目标表中检查重复记录
   - 使用source_no和product_code作为唯一性标识

### 接口设计

```javascript
// 推送方法接口
static async pushToRealProcessPlan(data) {
  // 输入: 备料计划数据对象
  // 输出: { success: boolean, planNo?: string, targetTable?: string, reason?: string }
}

// 路由决策方法
static getRouteBySourceProcess(sourceProcess) {
  // 输入: 来源工序字符串
  // 输出: { table: string, service: string, prefix: string } | null
}
```

## Data Models

### 备料计划数据模型
```javascript
{
  planNo: string,           // 备料计划编号
  materialCode: string,     // 物料编号
  materialName: string,     // 物料名称
  sourceProcess: string,    // 来源工序 (路由关键字段)
  materialSource: string,   // 物料来源 ("自制"/"采购")
  replenishmentQuantity: number, // 需补货数量
  demandQuantity: number,   // 需求数量
  availableStock: number,   // 可用库存
  // ... 其他字段
}
```

### 路由配置模型
```javascript
{
  sourceProcess: string,    // 来源工序
  targetTable: string,      // 目标数据表
  serviceName: string,      // 目标服务类名
  planPrefix: string        // 计划编号前缀
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

经过分析，以下属性可以合并以减少冗余：
- Properties 1-3 (不同来源工序的路由) 可以合并为一个综合路由属性
- Properties 2.1和2.4 (推送条件和成功返回) 可以合并为推送流程属性
- Properties 3.1和3.4 (防重检查) 可以合并为防重机制属性

### 核心属性

**Property 1: 来源工序路由正确性**
*For any* 备料计划数据，当来源工序为支持的工序类型时，系统应该路由到对应的正确目标表
**Validates: Requirements 1.1, 1.2, 1.3**

**Property 2: 路由字段使用正确性** 
*For any* 备料计划推送操作，系统应该使用备料计划的source_process字段而非产品物料库的process_name字段进行路由决策
**Validates: Requirements 1.5**

**Property 3: 推送条件验证**
*For any* 备料计划数据，当满足推送条件(编号非空、需补货数量>0、物料来源="自制")时，系统应该执行路由检查并返回正确的结果状态
**Validates: Requirements 2.1, 2.4**

**Property 4: 不支持工序处理**
*For any* 备料计划数据，当来源工序不在支持范围内时，系统应该跳过推送并返回相应的状态信息
**Validates: Requirements 1.4, 2.2**

**Property 5: 防重复推送机制**
*For any* 已存在的工序计划记录，当尝试推送相同备料计划编号和物料编号的数据时，系统应该检测到重复并跳过推送
**Validates: Requirements 3.1, 3.2, 3.4**

**Property 6: 错误处理一致性**
*For any* 推送失败场景，系统应该返回包含失败状态和具体错误原因的结构化响应
**Validates: Requirements 2.5, 3.5**

## Error Handling

### 错误分类

1. **路由错误**
   - 不支持的来源工序
   - 路由配置缺失
   - 目标服务不可用

2. **数据验证错误**
   - 必填字段缺失
   - 数据格式不正确
   - 业务规则不满足

3. **重复推送错误**
   - 相同记录已存在
   - 防重检查失败

4. **系统错误**
   - 数据库连接失败
   - 服务调用异常
   - 事务回滚

### 错误处理策略

```javascript
try {
  // 推送逻辑
} catch (error) {
  console.error(`❌ 推送失败: ${error.message}`);
  return {
    success: false,
    reason: error.code || 'unknown_error',
    message: error.message,
    details: error.details
  };
}
```

## Testing Strategy

### 单元测试

- 路由映射函数测试
- 推送条件验证测试
- 防重复检查逻辑测试
- 错误处理分支测试

### 属性测试

使用Jest和fast-check库进行属性测试：

```javascript
// 示例属性测试
describe('Material Plan Routing Properties', () => {
  test('Property 1: 来源工序路由正确性', () => {
    fc.assert(fc.property(
      fc.record({
        sourceProcess: fc.constantFrom('打包', '组装', '喷塑'),
        materialCode: fc.string(),
        planNo: fc.string(),
        // ... 其他字段生成器
      }),
      async (materialPlan) => {
        const result = await MaterialPreparationPlanService.pushToRealProcessPlan(materialPlan);
        const expectedTable = getExpectedTableBySourceProcess(materialPlan.sourceProcess);
        expect(result.targetTable).toBe(expectedTable);
      }
    ));
  });
});
```

### 集成测试

- 端到端数据流测试
- 数据库事务测试
- 多服务协作测试

### 测试配置

- 最小迭代次数：100次
- 测试数据生成器：智能约束生成
- 测试环境：独立测试数据库