# 审计日志API

<cite>
**本文档引用文件**  
- [AuditLogController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java)
- [AuditQueryRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/AuditQueryRequest.java)
- [AuditLogResponse.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response/AuditLogResponse.java)
- [AuditLogServiceImpl.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/impl/AuditLogServiceImpl.java)
- [audit.js](file://07-frontend/src/api/system/audit.js)
- [AuditLogList.vue](file://07-frontend/src/pages/system/audit-management/AuditLogList.vue)
- [SecurityConfig.java](file://08-backend/src/main/java/com/enterprise/brain/common/config/SecurityConfig.java)
- [SwaggerConfig.java](file://08-backend/src/main/java/com/enterprise/brain/common/config/SwaggerConfig.java)
</cite>

## 目录
1. [简介](#简介)
2. [核心接口概述](#核心接口概述)
3. [GET /api/audit/logs 接口详解](#get-apiauditlogs-接口详解)
4. [POST /api/audit/logs 接口详解](#post-apiauditlogs-接口详解)
5. [请求示例](#请求示例)
6. [Swagger文档说明](#swagger文档说明)
7. [错误码处理](#错误码处理)
8. [前端实现参考](#前端实现参考)

## 简介
审计日志API提供系统操作行为的记录与查询功能，用于追踪用户操作、保障系统安全和满足合规要求。本API包含两个核心接口：分页查询审计日志和写入审计日志。所有接口均需通过JWT认证，确保只有授权用户才能访问。

## 核心接口概述
审计日志API提供以下两个核心功能：

- **GET /api/audit/logs**: 分页查询审计日志记录，支持多种过滤条件
- **POST /api/audit/logs**: 写入新的审计日志记录

这些接口由`AuditLogController`类实现，位于后端系统的`08-backend`模块中，采用Spring Boot框架和MyBatis-Plus分页组件。

**Section sources**
- [AuditLogController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java)

## GET /api/audit/logs 接口详解

### 分页查询机制
该接口使用MyBatis-Plus的Page对象实现分页功能，支持标准的分页参数：

- `pageNum`: 当前页码，默认为1
- `pageSize`: 每页记录数，默认为10

分页结果包含总记录数、当前页码、每页大小等信息，便于前端实现分页控件。

### 过滤参数说明
查询接口通过`AuditQueryRequest`对象接收过滤条件，支持以下参数：

- **操作人 (userName)**: 模糊匹配操作人姓名
- **操作模块 (module)**: 精确匹配操作所属模块
- **开始时间 (startTime)**: 查询操作时间大于等于该时间的记录
- **结束时间 (endTime)**: 查询操作时间小于等于该时间的记录

这些参数可组合使用，实现多维度的审计日志过滤。

```mermaid
flowchart TD
Start([开始查询]) --> ValidateParams["验证请求参数"]
ValidateParams --> HasUserName{"包含用户名?"}
HasUserName --> |是| AddUserNameFilter["添加用户名模糊查询条件"]
HasUserName --> |否| HasModule{"包含模块?"}
HasModule --> |是| AddModuleFilter["添加模块精确查询条件"]
HasModule --> |否| HasStartTime{"包含开始时间?"}
HasStartTime --> |是| AddStartTimeFilter["添加时间范围起始条件"]
HasStartTime --> |否| HasEndTime{"包含结束时间?"}
HasEndTime --> |是| AddEndTimeFilter["添加时间范围结束条件"]
HasEndTime --> |否| ExecuteQuery["执行分页查询"]
AddUserNameFilter --> HasModule
AddModuleFilter --> HasStartTime
AddStartTimeFilter --> HasEndTime
AddEndTimeFilter --> ExecuteQuery
ExecuteQuery --> TransformResult["转换实体到响应对象"]
TransformResult --> ReturnResult["返回分页结果"]
ReturnResult --> End([结束])
```

**Diagram sources**
- [AuditLogServiceImpl.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/impl/AuditLogServiceImpl.java)
- [AuditQueryRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/AuditQueryRequest.java)

### 响应数据结构
接口返回`Page<AuditLogResponse>`类型的分页结果，包含以下信息：

- **总记录数 (total)**: 符合查询条件的总记录数量
- **当前页码 (current)**: 当前请求的页码
- **每页大小 (size)**: 每页显示的记录数量
- **记录列表 (records)**: 当前页的审计日志条目

每条审计日志条目（AuditLogResponse）包含以下字段：

- `id`: 日志唯一标识
- `userId`: 用户ID
- `userName`: 用户名
- `operation`: 操作内容描述
- `module`: 操作所属模块
- `ipAddress`: 操作来源IP地址
- `operationTime`: 操作时间
- `details`: 操作详情（JSON格式）

**Section sources**
- [AuditLogResponse.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response/AuditLogResponse.java)
- [AuditLogServiceImpl.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/impl/AuditLogServiceImpl.java)

## POST /api/audit/logs 接口详解

### 请求体结构
写入接口接收`AuditLogResponse`对象作为请求体，包含以下必填字段：

- `userId`: 执行操作的用户ID
- `userName`: 用户名
- `operation`: 操作内容描述
- `module`: 操作所属模块
- `ipAddress`: 操作来源IP地址
- `operationTime`: 操作时间
- `details`: 操作详情，建议使用JSON格式存储详细信息

### 响应说明
接口成功执行后返回`ResponseEntity<Boolean>`类型的响应，其中布尔值表示操作结果：

- `true`: 审计日志成功写入数据库
- `false`: 写入操作失败

该布尔值反映了数据库插入操作的影响行数是否大于0，是简单的成功/失败指示器。

```mermaid
sequenceDiagram
participant Client as "客户端"
participant Controller as "AuditLogController"
participant Service as "AuditLogService"
participant Repository as "AuditLogRepository"
Client->>Controller : POST /api/audit/logs
Controller->>Service : saveAuditLog(log)
Service->>Service : 将AuditLogResponse转换为AuditLog实体
Service->>Repository : insert(auditLog)
Repository-->>Service : 返回影响行数
Service-->>Controller : 返回true/false
Controller-->>Client : 200 OK + 布尔值
```

**Diagram sources**
- [AuditLogController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java)
- [AuditLogServiceImpl.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/impl/AuditLogServiceImpl.java)

## 请求示例

### GET请求示例
```http
GET /api/audit/logs?userName=admin&module=用户管理&startTime=2023-01-01T00:00:00&endTime=2023-12-31T23:59:59&pageNum=1&pageSize=10 HTTP/1.1
Host: api.enterprise-brain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### POST请求示例
```http
POST /api/audit/logs HTTP/1.1
Host: api.enterprise-brain.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "userId": "U001",
  "userName": "张三",
  "operation": "创建用户",
  "module": "用户管理",
  "ipAddress": "192.168.1.100",
  "operationTime": "2023-06-15T10:30:00",
  "details": {
    "targetUser": "李四",
    "role": "管理员",
    "department": "IT部"
  }
}
```

**Section sources**
- [audit.js](file://07-frontend/src/api/system/audit.js)

## Swagger文档说明
系统使用Swagger（OpenAPI）生成API文档，通过`@ApiModel`和`@ApiModelProperty`注解提供详细的接口描述：

- **@ApiModel**: 用于类级别，描述数据模型的整体信息
- **@ApiModelProperty**: 用于字段级别，描述字段的含义、是否必填等属性

这些注解在`AuditQueryRequest`和`AuditLogResponse`等DTO类中使用，为自动生成的API文档提供丰富的元数据，帮助开发者理解接口的使用方法。

```mermaid
classDiagram
class AuditQueryRequest {
+String userName
+String module
+LocalDateTime startTime
+LocalDateTime endTime
+Integer pageNum
+Integer pageSize
}
class AuditLogResponse {
+Long id
+String userId
+String userName
+String operation
+String module
+String ipAddress
+LocalDateTime operationTime
+String details
}
class Page~T~ {
+long total
+long current
+long size
+T[] records
}
Page~AuditLogResponse~ --> AuditLogResponse : "包含"
AuditLogController --> AuditQueryRequest : "接收"
AuditLogController --> Page~AuditLogResponse~ : "返回"
```

**Diagram sources**
- [AuditQueryRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/AuditQueryRequest.java)
- [AuditLogResponse.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response/AuditLogResponse.java)
- [AuditLogController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java)

## 错误码处理
系统实现了标准的HTTP错误码处理机制：

- **401 未授权 (Unauthorized)**: 当请求缺少有效的JWT令牌或令牌已过期时返回。客户端需要重新登录获取新令牌。
- **403 权限不足 (Forbidden)**: 当用户身份验证通过但没有访问特定资源的权限时返回。需要检查用户角色和权限配置。

这些错误码由Spring Security框架和全局异常处理器统一管理，确保API响应的一致性和可预测性。

**Section sources**
- [SecurityConfig.java](file://08-backend/src/main/java/com/enterprise/brain/common/config/SecurityConfig.java)

## 前端实现参考
前端系统在`07-frontend`模块中实现了审计日志的用户界面，主要包含：

- **AuditLogList.vue**: 审计日志列表页面，提供查询表单和分页表格
- **AuditLogDetail.vue**: 审计日志详情弹窗，展示完整的日志信息

前端通过`audit.js`中的API服务调用后端接口，实现了完整的审计日志管理功能，包括条件查询、分页浏览和详情查看。

**Section sources**
- [AuditLogList.vue](file://07-frontend/src/pages/system/audit-management/AuditLogList.vue)
- [AuditLogDetail.vue](file://07-frontend/src/pages/system/audit-management/AuditLogDetail.vue)
- [audit.js](file://07-frontend/src/api/system/audit.js)