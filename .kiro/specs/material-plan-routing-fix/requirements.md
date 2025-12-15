# Requirements Document

## Introduction

修复备料计划推送到工序计划的数据路由逻辑。当前系统错误地使用产品物料库的"产出工序"字段来决定推送目标，应该改为使用备料计划的"来源工序"字段来路由，以符合业务规则文档的要求。

## Glossary

- **备料计划**: 系统中的material_preparation_plans表，包含物料需求和来源工序信息
- **来源工序**: 备料计划中的source_process字段，表示该物料应该由哪个工序生产
- **产出工序**: 产品物料库materials表中的process_name字段，表示该物料的生产工序
- **工序计划**: 包括打包工序计划(packing_process_plans)、组装工序计划(assembly_process_plans)等
- **数据路由**: 根据条件判断将数据推送到不同目标表的逻辑

## Requirements

### Requirement 1

**User Story:** 作为系统管理员，我希望备料计划能够根据正确的业务规则推送到对应的工序计划，以确保数据流的准确性。

#### Acceptance Criteria

1. WHEN 备料计划的来源工序为"打包" THEN 系统SHALL推送到打包工序计划表(packing_process_plans)
2. WHEN 备料计划的来源工序为"组装" THEN 系统SHALL推送到组装工序计划表(assembly_process_plans)  
3. WHEN 备料计划的来源工序为"喷塑" THEN 系统SHALL推送到喷塑工序计划表(packing_process_plans)
4. WHEN 备料计划的来源工序不在支持范围内 THEN 系统SHALL跳过推送并记录日志
5. WHEN 系统进行路由判断 THEN 系统SHALL使用备料计划的source_process字段而非产品物料库的process_name字段

### Requirement 2

**User Story:** 作为开发人员，我希望系统能够正确验证推送条件，以确保只有符合条件的备料计划才会触发推送。

#### Acceptance Criteria

1. WHEN 备料计划编号不为空且需补货数量大于0且物料来源为"自制" THEN 系统SHALL检查来源工序进行路由
2. WHEN 备料计划不满足推送条件 THEN 系统SHALL跳过推送并记录原因
3. WHEN 系统检查推送条件 THEN 系统SHALL记录详细的判断过程日志
4. WHEN 推送成功完成 THEN 系统SHALL返回成功状态和目标工序计划信息
5. WHEN 推送失败 THEN 系统SHALL返回失败状态和具体错误原因

### Requirement 3

**User Story:** 作为质量保证人员，我希望系统能够防止重复推送，以避免数据冗余和业务逻辑错误。

#### Acceptance Criteria

1. WHEN 系统检测到相同备料计划编号和物料编号的工序计划已存在 THEN 系统SHALL跳过推送
2. WHEN 进行重复检查 THEN 系统SHALL在正确的目标表中查询现有记录
3. WHEN 检测到重复推送 THEN 系统SHALL记录防重检查的详细信息
4. WHEN 防重检查通过 THEN 系统SHALL继续执行推送逻辑
5. WHEN 防重检查失败 THEN 系统SHALL返回重复推送的状态信息

### Requirement 4

**User Story:** 作为系统维护人员，我希望能够通过日志追踪数据路由的完整过程，以便于问题诊断和系统优化。

#### Acceptance Criteria

1. WHEN 系统执行路由判断 THEN 系统SHALL记录备料计划的来源工序和路由决策
2. WHEN 系统查询产品物料库 THEN 系统SHALL记录查询结果但明确标注仅用于获取定时工额等信息
3. WHEN 系统执行推送操作 THEN 系统SHALL记录目标表名、服务名称和推送结果
4. WHEN 推送过程中发生错误 THEN 系统SHALL记录详细的错误信息和堆栈跟踪
5. WHEN 推送完成 THEN 系统SHALL记录推送摘要信息包括处理的记录数和成功率