# 销售订单模拟排程功能需求文档

## 需求概述
基于现有的销售订单管理系统，开发完整的模拟排程功能，包括数据库设计、后端API、前端页面，以及销售订单到模拟排程的数据推送规则。

## 需求分析

### 需求1：数据库质量检查与数据安全保障
**目标**：检查http://localhost:3008/sales/orders/list销售订单管理的数据库是否存在代码质量问题，确保数据安全存储在MySQL数据库中，防止因代码更新、重装系统等导致数据丢失或损毁。

**现状分析**：
- 当前系统使用MySQL数据库，数据库连接配置在backend/config/database.js
- 销售订单表sales_orders已有完整的数据结构
- 需要检查数据备份机制、事务处理、错误处理等代码质量

**解决方案**：
1. 检查数据库连接池配置和事务处理
2. 完善错误处理和数据验证
3. 实现数据备份和恢复机制
4. 添加数据完整性约束

### 需求2：销售订单页面增加"模拟排程"按钮
**目标**：在销售订单管理页面添加"模拟排程"按钮，用于触发数据推送到模拟排程列表。

**实现方案**：
- 在销售订单列表页面的工具栏添加"模拟排程"按钮
- 按钮仅在选中销售订单时启用
- 点击后调用模拟排程API接口

### 需求3：创建完整的"模拟排程列表"功能页面
**目标**：开发一整套模拟排程列表功能，包含前端页面、后端API、数据库设计、服务等。

**功能模块**：
1. 数据库表设计：simulation_scheduling_list
2. 后端API：CRUD接口、数据推送接口
3. 前端页面：使用通用页面组件和表格组件
4. 菜单集成：左侧菜单栏销售管理→销售订单→模拟排程列表

**表格字段设计**：
- 序号：系统自动生成，类似Excel行号
- 模拟排程编号：系统自动生成
- 订单状态：映射自销售订单
- 内部销售订单编号：映射自销售订单
- 客户交期：映射自销售订单
- 预计完成日期：模拟排程工序表推送的最大日期
- 产品编号：映射自销售订单
- 产品名称：映射自销售订单
- 订单数量：映射自销售订单
- 实时库存：映射自销售订单
- 有效库存：映射自销售订单
- 建议补货数量：映射自销售订单
- 产品来源：映射自销售订单
- 产出工序：映射自销售订单
- 模拟排程状态：默认"待开发"
- 等待号：默认1
- 提交人：默认"待开发（缺少账号管理）"
- 提交时间：系统当前时间

### 需求4：销售订单推送到模拟排程列表的数据流规则
**目标**：实现销售订单到模拟排程列表的数据推送功能。

**触发条件**：
- 触发页面：销售订单
- 来源页面：销售订单
- 目标页面：模拟排程列表
- 触发时机：选择至少1条销售订单，点击"模拟排程"按钮

**数据流映射规则**：
1. 序号：系统自动生成，类似Excel行号，不受排序影响
2. 模拟排程编号：系统自动生成
3. 订单状态 = 销售订单.订单状态
4. 内部销售订单编号 = 销售订单.内部销售订单编号
5. 客户交期 = 销售订单.客户交期
6. 预计完成日期 = 模拟排程工序表推送的最大日期
7. 产品编号 = 销售订单.产品编号
8. 产品名称 = 销售订单.产品名称
9. 订单数量 = 销售订单.订单数量
10. 实时库存 = 销售订单.实时库存
11. 有效库存 = 销售订单.有效库存
12. 建议补货数量 = 销售订单.建议补货数量
13. 产品来源 = 销售订单.产品来源
14. 产出工序 = 销售订单.产出工序
15. 模拟排程状态 = "待开发"
16. 等待号 = 1
17. 提交人 = "待开发（缺少账号管理）"
18. 提交时间 = 本行序号生成的系统时间（中国时区：年月日小时分钟秒）

## 技术架构方案

### 后端架构
- **数据库**：MySQL，使用现有的enterprise_brain数据库
- **API框架**：Express.js，复用现有架构
- **服务层**：创建simulationSchedulingService.js
- **路由层**：创建simulationScheduling.js路由文件

### 前端架构
- **框架**：Vue 3 + Element Plus
- **组件**：复用StandardTablePage和通用表格组件
- **API调用**：使用现有的API配置
- **路由**：添加到前端路由系统

### 数据库设计

#### 模拟排程列表表（simulation_scheduling_list）
```sql
CREATE TABLE IF NOT EXISTS simulation_scheduling_list (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  sequence_number INT NOT NULL COMMENT '序号（自动生成）',
  simulation_no VARCHAR(100) UNIQUE NOT NULL COMMENT '模拟排程编号',
  order_status VARCHAR(50) COMMENT '订单状态',
  internal_sales_order_no VARCHAR(100) COMMENT '内部销售订单编号',
  customer_delivery_date DATETIME COMMENT '客户交期',
  estimated_completion_date DATETIME COMMENT '预计完成日期',
  product_code VARCHAR(100) COMMENT '产品编号',
  product_name VARCHAR(200) COMMENT '产品名称',
  order_quantity DECIMAL(15,4) COMMENT '订单数量',
  realtime_inventory DECIMAL(15,4) DEFAULT 0 COMMENT '实时库存',
  effective_inventory DECIMAL(15,4) DEFAULT 0 COMMENT '有效库存',
  suggested_replenishment_qty DECIMAL(15,4) DEFAULT 0 COMMENT '建议补货数量',
  product_source VARCHAR(50) COMMENT '产品来源',
  output_process VARCHAR(100) COMMENT '产出工序',
  simulation_status VARCHAR(50) DEFAULT '待开发' COMMENT '模拟排程状态',
  waiting_number INT DEFAULT 1 COMMENT '等待号',
  submitter VARCHAR(100) DEFAULT '待开发（缺少账号管理）' COMMENT '提交人',
  submit_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_simulation_no (simulation_no),
  INDEX idx_internal_sales_order_no (internal_sales_order_no),
  INDEX idx_product_code (product_code),
  INDEX idx_simulation_status (simulation_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模拟排程列表表'
```

## 实现细节

### 1. 数据库质量检查
- 检查连接池配置和事务处理
- 完善错误处理机制
- 实现数据备份策略
- 添加数据完整性约束

### 2. 后端服务实现
- 创建simulationSchedulingService.js服务
- 实现CRUD操作接口
- 实现数据推送规则接口
- 集成到现有路由系统

### 3. 前端页面实现
- 创建SimulationSchedulingList.vue页面
- 集成StandardTablePage组件
- 实现搜索、筛选、分页功能
- 添加操作按钮（查看、编辑、删除等）

### 4. 菜单集成
- 在左侧菜单添加模拟排程列表入口
- 配置路由和权限
- 确保与现有导航系统一致

### 5. 数据推送规则实现
- 在销售订单页面添加"模拟排程"按钮
- 实现选中数据的推送逻辑
- 确保数据映射的准确性
- 添加推送结果反馈

## 边界条件与异常处理

### 异常处理
1. 数据库连接失败时的降级处理
2. 数据推送失败时的回滚机制
3. 前端网络异常的用户提示
4. 数据验证失败的错误信息

### 边界条件
1. 选中多行数据时的批量处理
2. 数据重复冲突的处理
3. 大数据量时的性能优化
4. 权限验证和安全控制

## 数据流动路径

### 销售订单 → 模拟排程列表
1. 用户在销售订单页面选择数据
2. 点击"模拟排程"按钮
3. 前端调用后端推送接口
4. 后端验证数据完整性
5. 根据映射规则转换数据
6. 插入模拟排程列表表
7. 返回操作结果给前端
8. 前端更新状态和提示

### 模拟排程列表 CRUD操作
1. 列表查询：分页、搜索、筛选
2. 新增记录：表单验证、数据插入
3. 编辑记录：数据更新、版本控制
4. 删除记录：级联删除、数据清理

## 预期成果

### 功能成果
1. ✅ 数据库质量提升，数据安全保障完善
2. ✅ 销售订单页面新增"模拟排程"按钮
3. ✅ 完整的模拟排程列表功能页面
4. ✅ 销售订单到模拟排程的数据推送功能
5. ✅ 菜单集成和路由配置完成

### 技术成果
1. ✅ 数据库表结构优化和性能提升
2. ✅ 后端API服务完整实现
3. ✅ 前端页面组件化开发
4. ✅ 数据流规则引擎实现
5. ✅ 用户体验优化和交互完善

### 质量保障
1. ✅ 代码质量符合企业级标准
2. ✅ 数据安全和完整性保障
3. ✅ 异常处理和错误恢复机制
4. ✅ 性能优化和响应速度提升
5. ✅ 用户体验和界面友好性

## 测试验证
1. 数据库连接和事务测试
2. 数据推送规则准确性测试
3. 前端页面功能完整性测试
4. 异常情况处理测试
5. 性能压力测试
6. 用户体验测试

## 部署和上线
1. 开发环境验证
2. 测试环境部署
3. 生产环境部署计划
4. 数据迁移和备份策略
5. 监控和维护方案
