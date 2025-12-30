# 模拟排程工序表功能开发需求文档

## 项目概述
开发"模拟排程工序表"功能，这是一个企业级的生产排程管理系统，基于"模拟物料需求明细"的数据进行复杂的工序排程计算和自动化处理。

## 核心业务场景
1. **被动数据接收**: 模拟排程工序表的数据是被动获取"模拟物料需求明细"表格的数据，不是主动获取
2. **复杂业务规则**: 包含更新规则和新增规则，支持离散型排程，多个子件排向相同的后道工序产品编号
3. **跨表数据流**: 涉及多个数据表的关联查询和数据计算
4. **自动化排程**: 支持自增行规则，当一天排不完时自动延续到下一天

## 数据库设计

### 主表：simulation_scheduling_process_table
包含50个字段的复杂排程表结构：

#### 基础信息字段 (1-7)
1. 序号 (sequence_number) - INT AUTO_INCREMENT
2. 订单状态 (order_status) - VARCHAR(50)
3. 内部销售订单编号 (internal_sales_order_no) - VARCHAR(100)
4. 客户交期 (customer_delivery_date) - DATE
5. 产品编号 (product_code) - VARCHAR(100)
6. 产品名称 (product_name) - VARCHAR(255)
7. 建议补货数量 (suggested_replenishment_qty) - DECIMAL(15,2)

#### BOM和工序字段 (8-17)
8. 层阶地址 (level_address) - VARCHAR(200)
9. 当前工序 (current_process) - VARCHAR(100)
10. 当前物料编号 (current_material_code) - VARCHAR(100)
11. 当前物料名称 (current_material_name) - VARCHAR(200)
12. 当前需求数量 (current_required_qty) - DECIMAL(15,2)
13. 可用库存 (available_inventory) - DECIMAL(15,2)
14. 还需数量 (still_needed_qty) - DECIMAL(15,2)
15. 需求天数 (requirement_days) - INT
16. 后道工序名称 (downstream_process_name) - VARCHAR(200)
17. 后道工序产品编号 (downstream_product_code) - VARCHAR(100)

#### 后道产品信息字段 (18-22)
18. 后道工序产品名称 (downstream_product_name) - VARCHAR(200)
19. 按顺序总需 (total_required_by_order) - DECIMAL(15,2)
20. 提交时间 (submit_time) - DATETIME
21. 是否继续排程 (continue_scheduling) - TINYINT(1)
22. 当前层阶地址 (current_level_address) - VARCHAR(200)

#### BOM编号和用量字段 (23-29)
23. 后道产品层阶地址 (downstream_level_address) - VARCHAR(200)
24. 0阶BOM编号 (level0_bom_code) - VARCHAR(100)
25. 0阶BOM编号数量 (level0_bom_quantity) - DECIMAL(15,2)
26. 层阶-0阶标准用量 (level_standard_qty) - DECIMAL(10,4)
27. 当前0阶标准用量 (current_level0_standard_qty) - DECIMAL(10,4)
28. 后道0阶标准用量 (downstream_level0_standard_qty) - DECIMAL(10,4)
29. 后道需求数量 (downstream_required_qty) - DECIMAL(15,2)

#### 工时和排程字段 (30-40)
30. 后道可用库存 (downstream_available_inventory) - DECIMAL(15,2)
31. 需求总工时 (required_total_hours) - DECIMAL(10,2)
32. 定时工额 (hourly_quota) - DECIMAL(10,2)
33. 计划排程日期 (planned_schedule_date) - DATE
34. 有效计划排程日期 (effective_planned_date) - DATE
35. 当天剩余工时 (daily_remaining_hours) - DECIMAL(10,2)
36. 当天模拟累计工时 (daily_cumulative_hours) - DECIMAL(10,2)
37. 当前计划排程工时 (current_planned_hours) - DECIMAL(10,2)
38. 当前可用排程工时 (current_available_hours) - DECIMAL(10,2)
39. 当前计划排程数量 (current_planned_quantity) - DECIMAL(15,2)
40. 剩余未排数量 (remaining_unscheduled_qty) - DECIMAL(15,2)

#### 统计和来源字段 (41-50)
41. 当前累计排程数量 (current_cumulative_quantity) - DECIMAL(15,2)
42. 后道产品来源 (downstream_product_source) - VARCHAR(50)
43. 模拟排程工序编号 (simulation_process_no) - VARCHAR(50)
44. 来源编号 (source_no) - VARCHAR(100)
45. 来源表单 (source_form) - VARCHAR(50)
46-50. 预留字段 (reserved_fields)

## 核心业务规则

### 规则1：模拟物料需求明细 → 模拟排程工序表（更新规则）
**触发页面**: 模拟物料需求明细
**目标页面**: 模拟排程工序表
**触发条件**: 
- "是否继续排程"=是 
- "后道需求数量">0
- 所有相关字段不为空

**查询条件**:
1. 内部销售订单编号=内部销售订单编号
2. 产品编号=产品编号
3. 后道产品层阶地址=当前层阶地址
4. 预计回厂日期<有效计划排程日期

**更新规则**:
1. 计划排程日期=预计回厂日期
2. 有效计划排程日期=工序能力负荷表MINIFS查询结果
3. 当天剩余工时=工序能力负荷表LOOKUP查询
4. 当天模拟累计工时=SUMIFS页面内计算
5. 当前可用排程工时=当天剩余工时-当天模拟累计工时
6. 当前计划排程工时=MIN(当前可用排程工时, 需求总工时)
7. 当前计划排程数量=ROUND(当前计划排程工时*定时工额, 0)
8. 当前累计排程数量=SUMIFS页面内计算
9. 剩余未排数量=还需数量-当前累计排程数量

### 规则2：模拟物料需求明细 → 模拟排程工序表（新增规则）
**触发条件**: 更新查询条件任意一条不满足时触发新增

**新增规则**:
1-18: 基础字段映射复制
19: 按顺序总需=SUMIFS页面内计算
20: 还需数量=按顺序总需-可用库存
21: 定时工额=产品物料库LOOKUP查询
22: 需求总工时=还需数量/定时工额
23: 计划排程日期=预计回厂日期+1天
24: 有效计划排程日期=工序能力负荷表MINIFS查询
25-31: 工时相关计算（同更新规则）
32: 后道产品层阶地址=生产BOM多字段LOOKUP查询
33: 后道需求数量=0阶BOM编号数量*后道0阶标准用量
34: 后道可用库存=预计结存多条件LOOKUP查询
35: 是否继续排程=IF(当前物料编号=产品编号, 否, 是)

### 规则3：模拟排程工序表自更新规则
**触发**: 当前工序完成，生成后道工序数据
**条件**: 是否继续排程=是 且 后道需求数量>0

### 规则4：模拟排程工序表自增行规则
**触发**: 剩余未排数量>0时自动新增下一天排程
**逻辑**: 当天排不完时自动延续到下一天，直到排完为止

### 规则5：销售订单回填规则
**触发**: 是否继续排程=否 且 剩余未排数量<=0
**目标**: 更新销售订单的预计完成日期=有效计划排程日期

## 跨表查询依赖

### 1. 工序能力负荷表 (mrp_capacity_load)
- URL: http://localhost:3003/mrp/capacity-load
- 用途: 查询工序剩余工时和有效排程日期
- 关键字段: 日期、工序名称、剩余工时

### 2. 产品物料库 (material_list)
- URL: http://localhost:3003/material/list
- 用途: 查询定时工额
- 关键字段: 物料编号、定时工额

### 3. 生产BOM (production_bom)
- URL: http://localhost:3003/bom/production
- 用途: 查询后道工序相关信息
- 关键字段: 层阶地址、后道工序名称、后道工序产品编号等

### 4. 预计结存 (projected_balance)
- URL: http://localhost:3003/inventory/projected-balance
- 用途: 查询后道可用库存
- 关键字段: 产品物料编码、预计发生日期、预计结存、序号

## 技术架构

### 后端架构
1. **数据库层**: MySQL表结构设计和索引优化
2. **服务层**: 复杂业务逻辑计算服务
3. **路由层**: RESTful API接口
4. **跨表查询服务**: 统一的跨表数据查询引擎
5. **事件驱动**: 数据变更的自动化处理

### 前端架构
1. **页面组件**: Vue3 + Element Plus企业级表格
2. **数据接收**: 被动数据接收机制，不主动获取
3. **实时计算**: 复杂的页面内字段计算逻辑
4. **数据流**: 事件驱动的数据更新和同步

### 计算引擎
1. **页面内计算**: SUMIFS、MINIFS、MAXIFS、LOOKUP等Excel公式实现
2. **依赖管理**: 字段计算时机的精确控制
3. **数据一致性**: 跨表数据的一致性保证
4. **性能优化**: 大数据量下的计算性能优化

## 数据流程

### 主数据流
1. 模拟排程列表 → 模拟物料需求明细 → 模拟排程工序表
2. 模拟排程工序表自更新 → 自增行 → 销售订单回填

### 事件驱动
1. 数据推送事件：模拟物料需求明细数据推送
2. 计算触发事件：字段值变更触发相关计算
3. 自增行事件：剩余数量>0时自动新增下一天
4. 完成事件：排程完成时更新销售订单

## 预期成果

### 功能完整性
1. ✅ 完整的50个字段数据表设计
2. ✅ 复杂的4大业务规则实现
3. ✅ 跨表查询和计算引擎
4. ✅ 自动化排程和自增行功能
5. ✅ 销售订单回填机制

### 技术指标
1. ✅ 支持10万+数据量的高性能查询
2. ✅ 复杂计算的毫秒级响应
3. ✅ 数据一致性和准确性保证
4. ✅ 企业级的错误处理和日志
5. ✅ 完整的前后端集成测试

### 用户体验
1. ✅ 被动数据接收，无需手动操作
2. ✅ 实时数据计算和更新
3. ✅ 友好的错误提示和状态显示
4. ✅ 高效的数据筛选和搜索
5. ✅ 完整的数据导出功能
