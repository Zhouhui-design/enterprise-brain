# 企业数字化系统项目笔记

## 1. 项目基本信息

- **项目名称**: 企业数字化系统
- **项目规模**: 支持数千人同时在线
- **适配设备**: PC（Windows、Linux、苹果、鸿蒙）、手机（鸿蒙、安卓、苹果）、平板电脑、工控面板
- **主要功能**: 销售订单管理、主生产计划管理、生产排程执行等

## 2. 技术栈

### 2.1 前端
- **框架**: Vue 3 (Composition API)
- **组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **构建工具**: Vite
- **开发语言**: TypeScript
- **代码规范**: ESLint + Prettier

### 2.2 后端
- **框架**: Express
- **数据库**: MySQL
- **ORM**: 自定义SQL查询
- **API设计**: RESTful

## 3. 项目结构

### 3.1 目录结构
```
/home/sardensy/enterprise-brain/enterpise-brain/
├── 00-docs/              # 文档目录
├── 07-backend/           # 后端代码
│   └── routes/           # 后端路由
├── 07-frontend/          # 前端代码
│   ├── src/              # 前端源码
│   │   ├── api/          # API接口定义
│   │   ├── components/   # Vue组件
│   │   ├── layout/       # 布局组件
│   │   ├── pages/        # 页面组件
│   │   └── router/       # 路由配置
│   ├── .env.development  # 开发环境配置
│   └── vite.config.js    # Vite配置
```

### 3.2 核心文件

#### 前端
- **依赖配置**: `07-frontend/package.json`
- **Vite配置**: `07-frontend/vite.config.js`
- **路由配置**: `07-frontend/src/router/`
- **主生产计划API**: `07-frontend/src/api/masterProductionPlan.js`
- **主生产计划页面**: `07-frontend/src/pages/production-planning/ProductionPlanList.vue`
- **销售订单页面**: `07-frontend/src/pages/sales/sales-order/SalesOrderListNew.vue`

#### 后端
- **服务器配置**: `backend/server.js`
- **数据库配置**: `backend/config/database.js`
- **主生产计划路由**: `backend/routes/masterProductionPlans.js`

## 4. 核心功能

### 4.1 销售订单管理
- 订单创建、编辑、删除
- 订单状态管理（待下单、已下单、生产中、已完成等）
- MRP运算功能
- 订单批量操作

### 4.2 主生产计划管理
- 计划列表展示与搜索
- 计划创建、编辑、删除
- 排程执行功能（生成备料计划和工序计划）
- 进度状态跟踪

### 4.3 响应式设计
- 适配不同屏幕尺寸
- 响应式布局调整
- 移动端优化

## 5. 开发规范

### 5.1 代码风格
- 使用ESLint + Prettier进行代码格式化
- TypeScript类型检查
- 组件命名采用PascalCase
- API命名采用kebab-case

### 5.2 开发流程
- 每次开发或修改代码后，需重启前后端服务器
- 清理缓存，确保用户可直接在浏览器中测试
- 遵循Git版本控制规范

### 5.3 计算方式规范
- **前端计算**：适用于轻量级计算、需要实时反馈的场景
  - 将计算结果映射到后端存储
- **后端计算**：适用于复杂计算、大数据量计算场景
  - 将计算结果映射到前端展示
- **选择原则**：以不卡顿为首要目标（企业数字化系统对性能要求高）
  - 避免在前端进行密集型计算
  - 合理分配前后端计算任务，确保系统流畅运行

## 6. 注意事项

### 6.1 环境配置
- 前端开发服务器端口：3003
- 后端API端口：3005
- 代理配置：前端/api请求代理到http://localhost:3005

### 6.2 数据库
- 数据库名称：enterprise_brain
- 数据库端口：3306
- 注意时区转换问题（前端日期处理）

### 6.3 常见问题
- 响应式断点设置
- 日期格式化处理（避免时区问题）
- API接口返回数据结构（request.js已解包）

## 7. 销售订单模块详细信息

### 7.1 文件结构

#### 7.1.1 前端文件
- **页面组件**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/pages/sales/sales-order/SalesOrderListNew.vue` - 销售订单列表页面
- **API 接口**: `/home/sardensy/enterprise-brain/enterpise-brain/07-frontend/src/api/salesOrder.js` - 销售订单相关API接口

#### 7.1.2 后端文件
- **路由**: `/home/sardensy/enterprise-brain/enterpise-brain/backend/routes/salesOrders.js` - 销售订单路由及控制器
- **服务**: `/home/sardensy/enterprise-brain/enterpise-brain/backend/services/salesService.js` - 销售相关服务

#### 7.1.3 数据库文件
- **迁移脚本**: `/home/sardensy/enterprise-brain/enterpise-brain/backend/migrations/add_output_process_to_sales_order_products.sql` - 为销售订单产品添加产出工序字段

### 7.2 系统特点分析

#### 7.2.1 字段命名规范
系统严格遵守命名规范：
- 数据库使用蛇形命名法(snake_case)，如 `output_process`
- 前端使用驼峰命名法(camelCase)，如 `outputProcess`
- 后端在查询数据库后进行自动转换

#### 7.2.2 日期处理规范
系统统一使用中国时区处理日期时间：
- 数据库中存储标准日期时间格式
- 查询时使用DATE_FORMAT函数格式化为中国时区标准日期
- 前端接收转换后的日期字段

#### 7.2.3 核心业务逻辑
销售订单模块具有以下核心功能：
- 订单创建、编辑、删除
- 订单状态管理（草稿、待审核、已审核等）
- 批量操作支持
- MRP运算功能
- 确认下单后自动分流到主生产计划或采购计划
- 根据产品的`output_process`字段决定分流方向

#### 7.2.4 数据流转过程
- **订单创建**：前端创建订单时，将产品信息（包括产出工序）保存到数据库
- **订单确认**：当用户确认销售订单时（调用`/api/sales-orders/confirm-order`接口），后端会执行以下操作：
  1. 将订单状态更新为"已确认"
  2. 获取订单中的所有产品
  3. 根据每个产品的`output_process`字段决定分流方向：
     - 如果`output_process`为"采购"，则推送到采购计划
     - 否则推送到主生产计划

#### 主生产计划推送逻辑（详细）
- **主生产计划编号生成**：采用`MPS${年份}${随机码}`格式
- **计划数量计算**：`if(可用库存>=订单数量，0，订单数量-可用库存)`
- **数据保存**：将以下信息保存到`master_production_plans`表：
  - 计划基本信息：计划编号、产品代码、产品名称、订单数量
  - 库存信息：可用库存、当前库存、计划数量
  - 交期信息：承诺交期、计划入库日期（承诺交期 - 提前入库期）
  - 订单关联信息：内部订单号、客户订单号、客户名称
  - 其他信息：产出工序、产品来源、销售员、状态等

#### 采购计划推送逻辑（详细）
- **采购计划编号生成**：采用`CG${年份}${序号}`格式
- **数据保存**：将以下信息保存到`procurement_plans`表：
  - 计划基本信息：采购计划编号、物料代码、物料名称、需求数量
  - 来源信息：来源表单名称（"销售订单"）、来源单号（销售订单内部编号）
  - 交期信息：计划到货日期（使用客户交期）
  - 订单关联信息：销售订单号、客户订单号
  - 其他信息：基础单位、采购状态（默认"PENDING_INQUIRY"）


#### 7.2.5 性能优化措施
- 前端使用虚拟滚动和分页减少渲染压力
- 后端使用数据库事务确保数据一致性
- 使用连接池管理数据库连接
- 对大量数据操作使用批量处理

## 8. 后续优化方向

- 性能优化（支持数千人同时在线）
- 多设备适配完善
- 代码模块化与组件化优化
- 错误处理与日志系统

## 9. 联系方式

- 项目负责人：用户
- 开发人员：AI助手