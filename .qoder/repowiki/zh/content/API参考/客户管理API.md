# 客户管理API

<cite>
**本文档引用的文件**   
- [customers.js](file://07-backend/routes/customers.js)
- [orderApi.js](file://07-frontend/src/api/sales/orderApi.js)
- [DataEncryptor.java](file://08-backend/src/main/java/com/enterprise/brain/common/security/DataEncryptor.java)
- [sales-api.js](file://07-frontend/src/services/api/sales-api.js)
</cite>

## 目录
1. [简介](#简介)
2. [Node.js客户管理API](#nodejs客户管理api)
3. [客户与销售订单关联关系](#客户与销售订单关联关系)
4. [数据验证与安全处理](#数据验证与安全处理)
5. [接口对比分析](#接口对比分析)

## 简介
本文档详细记录了基于Node.js和Spring Boot双实现的客户管理接口。文档涵盖了客户信息的增删改查、客户列表分页查询、客户等级管理等功能，对比分析了轻量级路由实现与完整控制器的RESTful设计差异。同时，文档解释了客户与销售订单的关联关系，以及在订单API中如何通过客户ID关联订单数据，并提供了客户数据验证规则和敏感信息加密处理说明。

## Node.js客户管理API

### 客户管理接口
Node.js实现的客户管理API提供了完整的客户生命周期管理功能，包括客户信息的增删改查、客户等级管理、联系人管理等。API基于Express框架实现，采用RESTful设计风格。

#### 客户增删改查接口
客户管理API提供了标准的CRUD操作接口：

- **获取客户列表**：`GET /sales/customers` 支持分页、筛选和排序功能
- **获取客户详情**：`GET /sales/customers/:id` 获取指定客户的所有信息
- **创建客户**：`POST /sales/customers` 创建新客户记录
- **更新客户**：`PUT /sales/customers/:id` 更新客户信息
- **删除客户**：`DELETE /sales/customers/:id` 删除客户记录

```mermaid
flowchart TD
A[客户端] --> B[获取客户列表]
B --> C{是否有筛选条件?}
C --> |是| D[应用筛选条件]
C --> |否| E[获取所有客户]
D --> F[分页处理]
E --> F
F --> G[返回客户列表]
G --> H[前端展示]
```

**接口来源**
- [customers.js](file://07-backend/routes/customers.js#L13-L104)

#### 客户列表分页查询
客户列表接口支持分页查询，通过查询参数控制返回结果：

```mermaid
classDiagram
class CustomerQueryParams {
+page : number
+pageSize : number
+type : string
+level : string
+region : string
+status : string
+search : string
+sortBy : string
+sortOrder : string
}
class CustomerResponse {
+success : boolean
+data : CustomerData
}
class CustomerData {
+customers : Customer[]
+pagination : Pagination
}
class Pagination {
+total : number
+page : number
+pageSize : number
+totalPages : number
}
CustomerQueryParams --> CustomerResponse : "查询"
CustomerResponse --> Pagination : "包含"
```

**接口来源**
- [customers.js](file://07-backend/routes/customers.js#L15-L25)

#### 客户等级管理
客户管理API支持客户等级管理功能，通过level字段标识客户等级：

```mermaid
stateDiagram-v2
[*] --> 潜在客户
潜在客户 --> 普通客户 : 首次交易
普通客户 --> 优质客户 : 年消费额>10万
优质客户 --> VIP客户 : 年消费额>50万
VIP客户 --> 黄金客户 : 年消费额>100万
黄金客户 --> 钻石客户 : 年消费额>500万
```

**接口来源**
- [customers.js](file://07-backend/routes/customers.js#L41-L44)

## 客户与销售订单关联关系

### 订单API中的客户关联
在订单API中，通过客户ID关联订单数据，实现了客户与订单的关联查询功能。

#### 订单列表查询
订单列表接口支持通过客户名称筛选订单：

```mermaid
sequenceDiagram
participant Frontend as 前端
participant OrderAPI as 订单API
participant Database as 数据库
Frontend->>OrderAPI : GET /sales/orders?customerName=客户A
OrderAPI->>Database : 查询订单数据
Database-->>OrderAPI : 返回订单列表
OrderAPI-->>Frontend : 返回订单数据
```

**接口来源**
- [orderApi.js](file://07-frontend/src/api/sales/orderApi.js#L18-L19)

#### 客户订单历史
客户管理API提供了客户订单历史查询功能，可以获取指定客户的订单历史记录：

```mermaid
classDiagram
class Customer {
+id : string
+name : string
+level : string
+orderHistory : OrderHistory[]
}
class OrderHistory {
+id : string
+orderCode : string
+orderDate : Date
+totalAmount : number
+status : string
}
Customer --> OrderHistory : "拥有"
```

**接口来源**
- [customers.js](file://07-backend/routes/customers.js#L464-L502)

## 数据验证与安全处理

### 客户数据验证规则
客户管理API实现了严格的数据验证规则，确保客户数据的完整性和准确性。

#### 前端验证规则
前端通过验证服务对客户数据进行验证：

```mermaid
flowchart TD
A[输入客户数据] --> B{验证规则检查}
B --> C[必填字段检查]
B --> D[邮箱格式检查]
B --> E[手机号格式检查]
B --> F[数值范围检查]
C --> G{通过?}
D --> G
E --> G
F --> G
G --> |是| H[提交数据]
G --> |否| I[显示错误信息]
```

**接口来源**
- [input-validator.js](file://07-frontend/src/utils/validation/input-validator.js)
- [business-rules.js](file://07-frontend/src/utils/validation/business-rules.js)

#### 敏感信息加密处理
系统对客户敏感信息进行加密处理，确保数据安全：

```mermaid
classDiagram
class DataEncryptor {
+encryptAES(content : string) : string
+decryptAES(encryptedContent : string) : string
+encryptSensitiveData(sensitiveData : string) : string
+decryptSensitiveData(encryptedData : string) : string
+encryptPassword(password : string, salt : string) : string
}
class Customer {
+id : string
+name : string
+phone : string
+email : string
}
DataEncryptor --> Customer : "加密/解密"
```

**接口来源**
- [DataEncryptor.java](file://08-backend/src/main/java/com/enterprise/brain/common/security/DataEncryptor.java#L42-L203)

## 接口对比分析

### Node.js与Spring Boot实现对比
对比分析了Node.js轻量级路由实现与Spring Boot完整控制器的RESTful设计差异。

#### 设计模式对比
两种实现方式在设计模式上存在显著差异：

```mermaid
graph TD
A[Node.js实现] --> B[轻量级路由]
A --> C[函数式编程]
A --> D[中间件链]
A --> E[动态类型]
F[Spring Boot实现] --> G[注解驱动]
F --> H[面向对象]
F --> I[AOP切面]
F --> J[静态类型]
B --> K[灵活快速]
C --> K
D --> K
E --> K
G --> L[类型安全]
H --> L
I --> L
J --> L
```

**接口来源**
- [customers.js](file://07-backend/routes/customers.js)
- [DataEncryptor.java](file://08-backend/src/main/java/com/enterprise/brain/common/security/DataEncryptor.java)

#### 性能与可维护性
两种实现方式在性能和可维护性方面各有优劣：

```mermaid
erDiagram
PERFORMANCE ||--o{ COMPARISON : "对比"
MAINTAINABILITY ||--o{ COMPARISON : "对比"
PERFORMANCE {
string aspect PK
string nodejs
string springboot
}
MAINTAINABILITY {
string aspect PK
string nodejs
string springboot
}
COMPARISON {
string id PK
string category
string description
}
PERFORMANCE ||--o{ COMPARISON : "性能对比"
MAINTAINABILITY ||--o{ COMPARISON : "可维护性对比"
```

**接口来源**
- [customers.js](file://07-backend/routes/customers.js)
- [DataEncryptor.java](file://08-backend/src/main/java/com/enterprise/brain/common/security/DataEncryptor.java)