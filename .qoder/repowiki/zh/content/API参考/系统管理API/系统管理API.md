# 系统管理API

<cite>
**本文档引用文件**   
- [AuditLogController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java)
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java)
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java)
- [AuditQueryRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/AuditQueryRequest.java)
- [AuditLogResponse.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response/AuditLogResponse.java)
- [MenuCreateRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/dto/request/MenuCreateRequest.java)
- [MenuTreeResponse.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/dto/response/MenuTreeResponse.java)
- [ApiResponse.java](file://08-backend/src/main/java/com/enterprise/brain/common/response/ApiResponse.java)
- [ErrorCode.java](file://08-backend/src/main/java/com/enterprise/brain/common/constants/ErrorCode.java)
- [SwaggerConfig.java](file://08-backend/src/main/java/com/enterprise/brain/common/config/SwaggerConfig.java)
- [audit.js](file://07-frontend/src/api/system/audit.js)
- [auditService.ts](file://07-frontend/src/services/api/auditService.ts)
- [DynamicMenu.vue](file://07-frontend/src/pages/system/components/DynamicMenu.vue)
- [auth.js](file://07-frontend/src/services/utils/auth.js)
</cite>

## 目录
1. [引言](#引言)
2. [审计日志API](#审计日志api)
3. [系统初始化API](#系统初始化api)
4. [动态菜单API](#动态菜单api)
5. [认证与安全](#认证与安全)
6. [错误处理](#错误处理)
7. [响应格式](#响应格式)
8. [Swagger文档](#swagger文档)

## 引言
本文档详细描述了系统管理模块的三大核心功能：审计日志、系统初始化和动态菜单管理。涵盖了所有相关API的HTTP方法、URL路径、请求参数和响应格式。文档还说明了JWT认证头的使用方法、错误码处理机制以及分页响应的标准格式。

## 审计日志API

审计日志API提供了对系统操作的全面追踪功能，支持多种过滤条件和分页查询。

### 获取审计日志列表
获取审计日志列表的API允许通过多种条件进行过滤和分页查询。

**HTTP方法**: GET  
**URL路径**: `/api/audit/logs`  

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| userName | String | 否 | 操作用户名称 |
| module | String | 否 | 操作模块 |
| startTime | LocalDateTime | 否 | 开始时间 |
| endTime | LocalDateTime | 否 | 结束时间 |
| pageNum | Integer | 否 | 页码，默认为1 |
| pageSize | Integer | 否 | 每页大小，默认为10 |

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "records": [
      {
        "id": 1,
        "userId": "user001",
        "userName": "张三",
        "operation": "创建用户",
        "module": "用户管理",
        "ipAddress": "192.168.1.100",
        "operationTime": "2024-01-01T10:00:00",
        "details": "创建了新用户李四"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [AuditLogController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java#L19-L23)
- [AuditQueryRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/AuditQueryRequest.java#L6-L14)
- [AuditLogResponse.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response/AuditLogResponse.java#L6-L16)
- [audit.js](file://07-frontend/src/api/system/audit.js#L5-L9)

### 保存审计日志
保存审计日志的API用于记录新的审计条目。

**HTTP方法**: POST  
**URL路径**: `/api/audit/logs`  

**请求体**:
```json
{
  "userId": "user001",
  "userName": "张三",
  "operation": "更新配置",
  "module": "系统设置",
  "ipAddress": "192.168.1.100",
  "details": "更新了系统参数"
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": true,
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [AuditLogController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java#L25-L29)

## 系统初始化API

系统初始化API提供了系统部署、重置和维护的核心功能，包括安全机制和初始化流程。

### 获取系统初始化状态
获取系统当前的初始化状态。

**HTTP方法**: GET  
**URL路径**: `/api/v1/system/initialization/status`  

**权限要求**: `system:initialization:view`  

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "id": 1,
    "systemName": "企业智能系统",
    "version": "1.0.0",
    "initialized": true,
    "initTime": "2024-01-01T08:00:00",
    "config": {
      "database": "configured",
      "cache": "connected",
      "security": "enabled"
    }
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java#L48-L55)

### 执行系统初始化
执行系统初始化流程。

**HTTP方法**: POST  
**URL路径**: `/api/v1/system/initialization/initialize`  

**权限要求**: `system:initialization:execute`  

**请求体**:
```json
{
  "templateId": "default",
  "databaseConfig": {
    "host": "localhost",
    "port": 3306,
    "username": "admin",
    "password": "admin123"
  },
  "adminUser": {
    "username": "admin",
    "password": "admin123",
    "email": "admin@company.com"
  }
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "status": "SUCCESS",
    "message": "系统初始化完成",
    "steps": [
      {"step": "数据库配置", "status": "COMPLETED"},
      {"step": "基础数据导入", "status": "COMPLETED"},
      {"step": "管理员创建", "status": "COMPLETED"}
    ],
    "duration": 120
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java#L60-L74)

### 重置系统数据
重置系统数据到初始状态。

**HTTP方法**: POST  
**URL路径**: `/api/v1/system/initialization/data/reset`  

**权限要求**: `system:initialization:reset`  

**请求体**:
```json
{
  "confirm": true,
  "backupBeforeReset": true,
  "resetType": "FULL"
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "status": "SUCCESS",
    "message": "系统数据重置完成",
    "backupId": "bkp_20240101_001",
    "clearedTables": ["user", "role", "permission"]
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java#L79-L93)

### 备份系统数据
创建系统数据备份。

**HTTP方法**: POST  
**URL路径**: `/api/v1/system/initialization/data/backup`  

**权限要求**: `system:initialization:backup`  

**请求体**:
```json
{
  "backupName": "系统备份_20240101",
  "includeDatabase": true,
  "includeConfig": true,
  "includeAttachments": false
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "backupId": "bkp_20240101_002",
    "status": "SUCCESS",
    "message": "备份创建成功",
    "size": 1048576,
    "path": "/backups/bkp_20240101_002.zip"
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java#L98-L112)

### 恢复系统数据
从备份恢复系统数据。

**HTTP方法**: POST  
**URL路径**: `/api/v1/system/initialization/data/restore`  

**权限要求**: `system:initialization:restore`  

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| backupId | String | 是 | 备份文件ID |

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "status": "SUCCESS",
    "message": "数据恢复完成",
    "restoredItems": 1000,
    "duration": 300
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java#L117-L131)

### 获取初始化日志
获取系统初始化过程的日志记录。

**HTTP方法**: GET  
**URL路径**: `/api/v1/system/initialization/logs`  

**权限要求**: `system:initialization:view`  

**请求参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| page | Integer | 否 | 页码，默认为1 |
| size | Integer | 否 | 每页大小，默认为20 |
| operationType | String | 否 | 操作类型过滤 |

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": [
    "2024-01-01 10:00:00 INFO 开始系统初始化",
    "2024-01-01 10:01:00 INFO 数据库连接成功",
    "2024-01-01 10:02:00 INFO 基础数据导入完成"
  ],
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java#L136-L147)

## 动态菜单API

动态菜单API提供了菜单的创建、更新、删除和查询功能，支持基于用户权限的菜单配置。

### 创建菜单
创建新的菜单项。

**HTTP方法**: POST  
**URL路径**: `/api/system/menu/create`  

**权限要求**: `SYSTEM:MENU:CREATE`  

**请求体**:
```json
{
  "menuName": "用户管理",
  "menuKey": "user-management",
  "menuIcon": "user",
  "menuPath": "/system/users",
  "componentPath": "views/system/user/UserList.vue",
  "menuLevel": 1,
  "sortOrder": 1,
  "isEnabled": true,
  "isShow": true,
  "permissionCode": "system:user:view",
  "parentId": null,
  "menuItems": [
    {
      "itemName": "用户列表",
      "itemKey": "user-list",
      "itemIcon": "list",
      "itemType": "MENU",
      "actionUrl": "/system/users",
      "permissionCode": "system:user:view",
      "sortOrder": 1
    }
  ]
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": 1,
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L22-L25)
- [MenuCreateRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/dto/request/MenuCreateRequest.java#L6-L31)

### 更新菜单
更新现有菜单项。

**HTTP方法**: PUT  
**URL路径**: `/api/system/menu/{menuId}`  

**权限要求**: `SYSTEM:MENU:UPDATE`  

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| menuId | Long | 是 | 菜单ID |

**请求体**:
```json
{
  "menuName": "用户管理",
  "menuKey": "user-management",
  "menuIcon": "user",
  "menuPath": "/system/users",
  "componentPath": "views/system/user/UserList.vue",
  "menuLevel": 1,
  "sortOrder": 1,
  "isEnabled": true,
  "isShow": true,
  "permissionCode": "system:user:view",
  "parentId": null,
  "menuItems": [
    {
      "itemName": "用户列表",
      "itemKey": "user-list",
      "itemIcon": "list",
      "itemType": "MENU",
      "actionUrl": "/system/users",
      "permissionCode": "system:user:view",
      "sortOrder": 1
    }
  ]
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": null,
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L29-L32)

### 删除菜单
删除指定的菜单项。

**HTTP方法**: DELETE  
**URL路径**: `/api/system/menu/{menuId}`  

**权限要求**: `SYSTEM:MENU:DELETE`  

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| menuId | Long | 是 | 菜单ID |

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": null,
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L36-L39)

### 获取菜单详情
获取指定菜单的详细信息。

**HTTP方法**: GET  
**URL路径**: `/api/system/menu/{menuId}`  

**权限要求**: `SYSTEM:MENU:VIEW`  

**路径参数**:
| 参数名 | 类型 | 必填 | 描述 |
|-------|------|------|------|
| menuId | Long | 是 | 菜单ID |

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "id": 1,
    "menuName": "用户管理",
    "menuKey": "user-management",
    "menuIcon": "user",
    "menuPath": "/system/users",
    "componentPath": "views/system/user/UserList.vue",
    "menuLevel": 1,
    "sortOrder": 1,
    "isEnabled": true,
    "isShow": true,
    "permissionCode": "system:user:view",
    "children": [],
    "menuItems": [
      {
        "id": 1,
        "itemName": "用户列表",
        "itemKey": "user-list",
        "itemIcon": "list",
        "itemType": "MENU",
        "actionUrl": "/system/users",
        "permissionCode": "system:user:view",
        "sortOrder": 1
      }
    ]
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L43-L46)
- [MenuTreeResponse.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/dto/response/MenuTreeResponse.java#L6-L33)

### 获取完整菜单树
获取系统的完整菜单树结构。

**HTTP方法**: GET  
**URL路径**: `/api/system/menu/tree/full`  

**权限要求**: `SYSTEM:MENU:VIEW`  

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "menuName": "系统管理",
      "menuKey": "system",
      "menuIcon": "setting",
      "menuPath": "/system",
      "componentPath": "views/system/index.vue",
      "menuLevel": 0,
      "sortOrder": 1,
      "isEnabled": true,
      "isShow": true,
      "permissionCode": "system:menu:view",
      "children": [
        {
          "id": 2,
          "menuName": "用户管理",
          "menuKey": "user-management",
          "menuIcon": "user",
          "menuPath": "/system/users",
          "componentPath": "views/system/user/UserList.vue",
          "menuLevel": 1,
          "sortOrder": 1,
          "isEnabled": true,
          "isShow": true,
          "permissionCode": "system:user:view",
          "children": [],
          "menuItems": []
        }
      ],
      "menuItems": []
    }
  ],
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L50-L53)

### 获取用户菜单树
获取当前登录用户的菜单树，根据用户权限过滤可见菜单。

**HTTP方法**: GET  
**URL路径**: `/api/system/menu/tree/user`  

**权限要求**: 已认证用户  

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "menuName": "系统管理",
      "menuKey": "system",
      "menuIcon": "setting",
      "menuPath": "/system",
      "componentPath": "views/system/index.vue",
      "menuLevel": 0,
      "sortOrder": 1,
      "isEnabled": true,
      "isShow": true,
      "permissionCode": "system:menu:view",
      "children": [
        {
          "id": 2,
          "menuName": "用户管理",
          "menuKey": "user-management",
          "menuIcon": "user",
          "menuPath": "/system/users",
          "componentPath": "views/system/user/UserList.vue",
          "menuLevel": 1,
          "sortOrder": 1,
          "isEnabled": true,
          "isShow": true,
          "permissionCode": "system:user:view",
          "children": [],
          "menuItems": []
        }
      ],
      "menuItems": []
    }
  ],
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L57-L62)
- [DynamicMenu.vue](file://07-frontend/src/pages/system/components/DynamicMenu.vue#L47-L48)

### 排序菜单
对菜单项进行排序。

**HTTP方法**: POST  
**URL路径**: `/api/system/menu/sort`  

**权限要求**: `SYSTEM:MENU:SORT`  

**请求体**:
```json
{
  "parentId": 1,
  "sortedMenuIds": [2, 3, 4]
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": null,
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L67-L70)

### 更新菜单可见性
更新用户对菜单项的可见性设置。

**HTTP方法**: POST  
**URL路径**: `/api/system/menu/visibility/update`  

**权限要求**: 已认证用户  

**请求体**:
```json
{
  "userId": 1,
  "menuId": 2,
  "isVisible": true
}
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": null,
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L75-L83)

### 获取用户菜单配置
获取当前用户的菜单配置。

**HTTP方法**: GET  
**URL路径**: `/api/system/menu/user/config`  

**权限要求**: 已认证用户  

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "userId": 1,
    "menuConfig": [
      {
        "menuId": 1,
        "isVisible": true,
        "customName": null,
        "customIcon": null
      },
      {
        "menuId": 2,
        "isVisible": true,
        "customName": null,
        "customIcon": null
      }
    ]
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L86-L89)

### 批量更新菜单可见性
批量更新用户对多个菜单项的可见性设置。

**HTTP方法**: POST  
**URL路径**: `/api/system/menu/visibility/batch-update`  

**权限要求**: 已认证用户  

**请求体**:
```json
[
  {
    "userId": 1,
    "menuId": 1,
    "isVisible": true
  },
  {
    "userId": 1,
    "menuId": 2,
    "isVisible": false
  }
]
```

**响应格式**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": null,
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L94-L98)

## 认证与安全

### JWT认证头使用
所有需要认证的API请求都需要在HTTP头中包含JWT令牌。

**请求头**:
```
Authorization: Bearer <access_token>
```

**示例**:
```bash
curl -X GET "http://localhost:8080/api/audit/logs" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

前端代码示例:
```javascript
import axios from 'axios';

// 设置默认请求头
axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

// 或在单个请求中设置
axios.get('/api/audit/logs', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Section sources**
- [auth.js](file://07-frontend/src/services/utils/auth.js#L695-L711)
- [rule.md](file://rules/auth-web/rule.md#L566-L573)

### 权限控制
系统使用基于角色的访问控制（RBAC）机制，通过权限码控制API访问。

**权限码格式**:
```
模块:功能:操作
```

**示例权限码**:
- `system:menu:create` - 系统管理模块，菜单功能，创建操作
- `system:menu:update` - 系统管理模块，菜单功能，更新操作
- `system:menu:delete` - 系统管理模块，菜单功能，删除操作
- `system:menu:view` - 系统管理模块，菜单功能，查看操作

**权限注解**:
```java
@PreAuthorize("hasAuthority('SYSTEM:MENU:CREATE')")
@PostMapping("/create")
public Long createMenu(@RequestBody MenuCreateRequest request) {
    return dynamicMenuService.createMenu(request);
}
```

**Section sources**
- [DynamicMenuController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/menu/controller/DynamicMenuController.java#L21-L22)

## 错误处理

### 错误码标准
系统使用统一的错误码标准，所有错误响应都遵循相同的格式。

**错误响应格式**:
```json
{
  "code": "500",
  "message": "系统初始化失败: 数据库连接失败",
  "data": null,
  "timestamp": 1704084000000,
  "success": false
}
```

### 常见错误码
| 错误码 | 类型 | 描述 |
|-------|------|------|
| 10000 | 通用 | 成功 |
| 10001 | 通用 | 系统错误 |
| 10002 | 通用 | 服务不可用 |
| 20000 | 参数 | 参数错误 |
| 20001 | 参数 | 参数缺失 |
| 20002 | 参数 | 参数无效 |
| 30000 | 认证 | 未授权 |
| 30001 | 认证 | 令牌缺失 |
| 30002 | 认证 | 令牌无效 |
| 30003 | 认证 | 令牌过期 |
| 30004 | 认证 | 访问被拒绝 |
| 30005 | 认证 | 权限不足 |
| 40000 | 数据 | 数据未找到 |
| 40001 | 数据 | 数据已存在 |
| 40002 | 数据 | 数据冲突 |
| 40003 | 数据 | 数据完整性违反 |
| 40004 | 数据 | 数据库错误 |

**Section sources**
- [ErrorCode.java](file://08-backend/src/main/java/com/enterprise/brain/common/constants/ErrorCode.java#L9-L104)
- [ApiResponse.java](file://08-backend/src/main/java/com/enterprise/brain/common/response/ApiResponse.java#L49-L92)

## 响应格式

### 统一响应格式
所有API响应都遵循统一的响应格式，确保前端处理的一致性。

**成功响应**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": { /* 响应数据 */ },
  "timestamp": 1704084000000,
  "success": true
}
```

**失败响应**:
```json
{
  "code": "500",
  "message": "操作失败: 详细错误信息",
  "data": null,
  "timestamp": 1704084000000,
  "success": false
}
```

### 分页响应格式
分页查询的响应包含分页信息和数据列表。

**分页响应**:
```json
{
  "code": "200",
  "message": "操作成功",
  "data": {
    "records": [ /* 数据列表 */ ],
    "total": 100,
    "size": 10,
    "current": 1,
    "pages": 10
  },
  "timestamp": 1704084000000,
  "success": true
}
```

**Section sources**
- [ApiResponse.java](file://08-backend/src/main/java/com/enterprise/brain/common/response/ApiResponse.java#L15-L46)

## Swagger文档

### Swagger配置
系统使用SpringDoc OpenAPI生成Swagger文档，提供交互式的API文档界面。

**Swagger UI访问路径**:
```
http://localhost:8080/swagger-ui.html
```

**OpenAPI文档路径**:
```
http://localhost:8080/v3/api-docs
```

### 注解说明
Swagger文档通过注解自动生成，主要使用以下注解：

**@Api**: 用于类上，描述控制器的标签和描述
```java
@Api(tags = "系统初始化管理")
@RestController
@RequestMapping("/api/v1/system/initialization")
public class SystemInitializeController {
    // ...
}
```

**@ApiOperation**: 用于方法上，描述接口的操作和功能
```java
@ApiOperation("获取系统初始化状态")
@GetMapping("/status")
public ApiResult<SystemConfig> getInitializationStatus() {
    // ...
}
```

**@ApiParam**: 用于参数上，描述参数的详细信息
```java
@ApiParam(value = "页码") @RequestParam(defaultValue = "1") int page,
@ApiParam(value = "每页大小") @RequestParam(defaultValue = "20") int size
```

**@ApiModel和@ApiModelProperty**: 用于DTO类上，描述数据模型和字段
```java
@ApiModel("审计查询请求")
@Data
public class AuditQueryRequest {
    
    @ApiModelProperty("用户名称")
    private String userName;
    
    @ApiModelProperty("操作模块")
    private String module;
    
    @ApiModelProperty("开始时间")
    private LocalDateTime startTime;
    
    @ApiModelProperty("结束时间")
    private LocalDateTime endTime;
}
```

**Section sources**
- [SwaggerConfig.java](file://08-backend/src/main/java/com/enterprise/brain/common/config/SwaggerConfig.java#L17-L38)
- [SystemInitializeController.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/initialization/controller/SystemInitializeController.java#L38-L40)
- [AuditQueryRequest.java](file://08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/AuditQueryRequest.java#L6-L14)