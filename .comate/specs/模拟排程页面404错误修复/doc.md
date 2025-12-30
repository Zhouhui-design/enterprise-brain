# 模拟排程页面404错误修复

## 需求背景

用户在点击左侧菜单栏"模拟排程列表"按钮时，页面显示404错误，控制台输出"页面未找到"。经分析，这是由于数据库中缺少`simulation_scheduling_list`表导致的。

## 问题分析

1. **前端路由配置正确**：`/sales/simulation-scheduling/list` 路由已正确配置在`router/modules/sales.js`中
2. **后端路由已注册**：`/api/simulation-scheduling` 路由已正确注册
3. **数据库表缺失**：`simulation_scheduling_list`表不存在，导致API调用失败
4. **服务文件存在**：`simulationSchedulingService.js`和`simulationScheduling.js`路由文件都存在

## 解决方案

### 架构技术方案
1. 创建缺失的数据库表`simulation_scheduling_list`
2. 修复后端服务中的错误处理逻辑
3. 测试API接口是否正常工作
4. 验证前端页面能否正常访问

### 影响文件
- **数据库表**：创建`simulation_scheduling_list`表（新增）
- **后端服务**：`backend/services/simulationSchedulingService.js`（错误处理修复）

### 实现细节

#### 数据库表结构
```sql
CREATE TABLE simulation_scheduling_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequence_number INT NOT NULL COMMENT '序号',
  simulation_no VARCHAR(50) NOT NULL UNIQUE COMMENT '模拟排程号',
  order_status VARCHAR(50) DEFAULT NULL COMMENT '订单状态',
  internal_sales_order_no VARCHAR(100) DEFAULT NULL COMMENT '内部销售订单编号',
  customer_delivery_date DATE DEFAULT NULL COMMENT '客户交期',
  estimated_completion_date DATE DEFAULT NULL COMMENT '预计完成日期',
  product_code VARCHAR(100) DEFAULT NULL COMMENT '产品编号',
  product_name VARCHAR(255) DEFAULT NULL COMMENT '产品名称',
  order_quantity DECIMAL(15,2) DEFAULT 0 COMMENT '订单数量',
  realtime_inventory DECIMAL(15,2) DEFAULT 0 COMMENT '实时库存',
  effective_inventory DECIMAL(15,2) DEFAULT 0 COMMENT '有效库存',
  suggested_replenishment_qty DECIMAL(15,2) DEFAULT 0 COMMENT '建议补货数量',
  product_source VARCHAR(50) DEFAULT NULL COMMENT '产品来源',
  output_process VARCHAR(100) DEFAULT NULL COMMENT '产出工序',
  simulation_status ENUM('待开发', '进行中', '已完成') DEFAULT '待开发' COMMENT '模拟排程状态',
  waiting_number INT DEFAULT 1 COMMENT '等待序数',
  submitter VARCHAR(100) DEFAULT '待开发（缺少账号管理）' COMMENT '提交人',
  submit_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_simulation_no (simulation_no),
  INDEX idx_internal_sales_order_no (internal_sales_order_no),
  INDEX idx_product_code (product_code),
  INDEX idx_simulation_status (simulation_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='模拟排程列表';
```

#### 错误处理修复
在`getSimulationSchedulingList`函数中添加空结果检查：
```javascript
// 修复前
const total = countResult[0].total;

// 修复后
const total = countResult && countResult[0] ? countResult[0].total : 0;
```

### 边界条件与异常处理
1. **空结果处理**：当查询结果为空时，确保不会访问undefined属性
2. **数据库连接失败**：添加数据库连接失败的错误处理
3. **字段类型验证**：确保传入参数类型正确
4. **分页参数验证**：确保page和pageSize为有效数字

### 数据流动路径
1. 前端点击菜单 → 路由跳转
2. 前端页面加载 → 调用API `/api/simulation-scheduling`
3. 后端路由接收 → 调用服务层
4. 服务层查询数据库 → 返回结果
5. 前端渲染数据 → 显示列表

### 预期成果
1. ✅ 数据库表`simulation_scheduling_list`创建成功
2. ✅ API接口`/api/simulation-scheduling`正常返回数据
3. ✅ 前端页面能正常访问，不再显示404错误
4. ✅ 模拟排程列表页面能正常显示数据
5. ✅ 搜索、筛选、分页功能正常工作
6. ✅ 增删改查操作都能正常执行

## 测试验证
1. 访问`http://localhost:3008/sales/simulation-scheduling/list`页面不再显示404
2. API调用`http://localhost:3005/api/simulation-scheduling`返回正常数据
3. 页面功能（搜索、筛选、分页）正常工作
4. 创建测试数据验证完整功能流程