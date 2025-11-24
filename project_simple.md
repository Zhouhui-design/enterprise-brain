```
.
├── ./00-docs
│   ├── ./00-docs/task-assignments
│   │   ├── ./00-docs/task-assignments/current-tasks
│   │   └── ./00-docs/task-assignments/task-templates
│   └── ./00-docs/task-management
│       ├── ./00-docs/task-management/developer-profiles
│       └── ./00-docs/task-management/task-templates
├── ./07-frontend
│   ├── ./07-frontend/index.html
│   ├── ./07-frontend/package.json
│   ├── ./07-frontend/package-lock.json
│   ├── ./07-frontend/pnpm-lock.yaml
│   ├── ./07-frontend/src
│   │   ├── ./07-frontend/src/App.vue
│   │   ├── ./07-frontend/src/assets
│   │   │   └── ./07-frontend/src/assets/styles
│   │   │       ├── ./07-frontend/src/assets/styles/components
│   │   │       ├── ./07-frontend/src/assets/styles/layout
│   │   │       └── ./07-frontend/src/assets/styles/themes
│   │   ├── ./07-frontend/src/components
│   │   │   ├── ./07-frontend/src/components/common
│   │   │   │   ├── ./07-frontend/src/components/common/Breadcrumb.vue
│   │   │   │   ├── ./07-frontend/src/components/common/business
│   │   │   │   │   ├── ./07-frontend/src/components/common/business/BOMCopy.vue
│   │   │   │   │   └── ./07-frontend/src/components/common/business/SalesOrderCopy.vue
│   │   │   │   ├── ./07-frontend/src/components/common/copy-paste
│   │   │   │   │   ├── ./07-frontend/src/components/common/copy-paste/CopyButton.vue
│   │   │   │   │   ├── ./07-frontend/src/components/common/copy-paste/CopyTemplateManager.vue
│   │   │   │   │   ├── ./07-frontend/src/components/common/copy-paste/hooks
│   │   │   │   │   │   ├── ./07-frontend/src/components/common/copy-paste/hooks/useCopyPaste.js
│   │   │   │   │   │   └── ./07-frontend/src/components/common/copy-paste/hooks/useTemplate.js
│   │   │   │   │   └── ./07-frontend/src/components/common/copy-paste/PasteButton.vue
│   │   │   │   ├── ./07-frontend/src/components/common/Footer.vue
│   │   │   │   ├── ./07-frontend/src/components/common/Navbar.vue
│   │   │   │   ├── ./07-frontend/src/components/common/Pagination.vue
│   │   │   │   ├── ./07-frontend/src/components/common/SearchInput.vue
│   │   │   │   └── ./07-frontend/src/components/common/Sidebar.vue
│   │   │   ├── ./07-frontend/src/components/guide
│   │   │   ├── ./07-frontend/src/components/smart-table
│   │   │   └── ./07-frontend/src/components/theme
│   │   ├── ./07-frontend/src/main.js
│   │   ├── ./07-frontend/src/pages
│   │   │   ├── ./07-frontend/src/pages/404.vue
│   │   │   ├── ./07-frontend/src/pages/after-sales
│   │   │   │   └── ./07-frontend/src/pages/after-sales/AfterSalesList.vue
│   │   │   ├── ./07-frontend/src/pages/ai
│   │   │   │   └── ./07-frontend/src/pages/ai/AIDashboard.vue
│   │   │   ├── ./07-frontend/src/pages/analytics
│   │   │   │   └── ./07-frontend/src/pages/analytics/AnalyticsReport.vue
│   │   │   ├── ./07-frontend/src/pages/cost
│   │   │   │   └── ./07-frontend/src/pages/cost/CostControl.vue
│   │   │   ├── ./07-frontend/src/pages/finance
│   │   │   │   └── ./07-frontend/src/pages/finance/FinanceOverview.vue
│   │   │   ├── ./07-frontend/src/pages/human-resources
│   │   │   │   └── ./07-frontend/src/pages/human-resources/HRDashboard.vue
│   │   │   ├── ./07-frontend/src/pages/inventory
│   │   │   │   └── ./07-frontend/src/pages/inventory/InventoryList.vue
│   │   │   ├── ./07-frontend/src/pages/manufacturing
│   │   │   │   └── ./07-frontend/src/pages/manufacturing/ProductionPlan.vue
│   │   │   ├── ./07-frontend/src/pages/material-management
│   │   │   │   └── ./07-frontend/src/pages/material-management/MaterialList.vue
│   │   │   ├── ./07-frontend/src/pages/mrp
│   │   │   │   └── ./07-frontend/src/pages/mrp/MRPPlan.vue
│   │   │   ├── ./07-frontend/src/pages/oa
│   │   │   │   ├── ./07-frontend/src/pages/oa/document
│   │   │   │   │   ├── ./07-frontend/src/pages/oa/document/CollaborativeEdit.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/oa/document/DocumentCenter.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/oa/document/DocumentShare.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/oa/document/TemplateLibrary.vue
│   │   │   │   │   └── ./07-frontend/src/pages/oa/document/VersionHistory.vue
│   │   │   │   ├── ./07-frontend/src/pages/oa/notification
│   │   │   │   │   ├── ./07-frontend/src/pages/oa/notification/AlertSetting.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/oa/notification/Broadcast.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/oa/notification/MessageInbox.vue
│   │   │   │   │   └── ./07-frontend/src/pages/oa/notification/NotificationCenter.vue
│   │   │   │   └── ./07-frontend/src/pages/oa/workflow
│   │   │   │       ├── ./07-frontend/src/pages/oa/workflow/ApprovalChain.vue
│   │   │   │       ├── ./07-frontend/src/pages/oa/workflow/MyTask.vue
│   │   │   │       ├── ./07-frontend/src/pages/oa/workflow/TaskDelegate.vue
│   │   │   │       ├── ./07-frontend/src/pages/oa/workflow/WorkflowDesigner.vue
│   │   │   │       └── ./07-frontend/src/pages/oa/workflow/WorkflowInstance.vue
│   │   │   ├── ./07-frontend/src/pages/process-engineering
│   │   │   │   └── ./07-frontend/src/pages/process-engineering/ProcessDesign.vue
│   │   │   ├── ./07-frontend/src/pages/process-planning
│   │   │   │   └── ./07-frontend/src/pages/process-planning/ProcessPlan.vue
│   │   │   ├── ./07-frontend/src/pages/production-dispatch
│   │   │   │   └── ./07-frontend/src/pages/production-dispatch/DispatchList.vue
│   │   │   ├── ./07-frontend/src/pages/production-planning
│   │   │   │   └── ./07-frontend/src/pages/production-planning/PlanManage.vue
│   │   │   ├── ./07-frontend/src/pages/production-reporting
│   │   │   │   └── ./07-frontend/src/pages/production-reporting/ReportList.vue
│   │   │   ├── ./07-frontend/src/pages/production-resources
│   │   │   │   ├── ./07-frontend/src/pages/production-resources/equipment
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/equipment/EquipmentList.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/equipment/EquipmentMaintenance.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/equipment/EquipmentStatus.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/equipment/RepairManagement.vue
│   │   │   │   │   └── ./07-frontend/src/pages/production-resources/equipment/UtilizationReport.vue
│   │   │   │   ├── ./07-frontend/src/pages/production-resources/fixture
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/fixture/FixtureDesign.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/fixture/FixtureInventory.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/fixture/FixtureMaintenance.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/fixture/FixtureManagement.vue
│   │   │   │   │   └── ./07-frontend/src/pages/production-resources/fixture/FixtureSetup.vue
│   │   │   │   ├── ./07-frontend/src/pages/production-resources/mold
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/mold/MoldLifecycle.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/mold/MoldMaintenance.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/mold/MoldManagement.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/production-resources/mold/MoldSchedule.vue
│   │   │   │   │   └── ./07-frontend/src/pages/production-resources/mold/MoldStorage.vue
│   │   │   │   └── ./07-frontend/src/pages/production-resources/tooling
│   │   │   │       ├── ./07-frontend/src/pages/production-resources/tooling/ToolingInventory.vue
│   │   │   │       ├── ./07-frontend/src/pages/production-resources/tooling/ToolingIssue.vue
│   │   │   │       ├── ./07-frontend/src/pages/production-resources/tooling/ToolingMaintenance.vue
│   │   │   │       ├── ./07-frontend/src/pages/production-resources/tooling/ToolingManagement.vue
│   │   │   │       └── ./07-frontend/src/pages/production-resources/tooling/ToolingReturn.vue
│   │   │   ├── ./07-frontend/src/pages/purchase
│   │   │   │   └── ./07-frontend/src/pages/purchase/PurchaseOrder.vue
│   │   │   ├── ./07-frontend/src/pages/quality-management
│   │   │   │   └── ./07-frontend/src/pages/quality-management/QualityCheck.vue
│   │   │   ├── ./07-frontend/src/pages/quotation
│   │   │   │   └── ./07-frontend/src/pages/quotation/QuotationList.vue
│   │   │   ├── ./07-frontend/src/pages/receipt
│   │   │   │   └── ./07-frontend/src/pages/receipt/ReceiptList.vue
│   │   │   ├── ./07-frontend/src/pages/research-development
│   │   │   │   └── ./07-frontend/src/pages/research-development/RDDashboard.vue
│   │   │   ├── ./07-frontend/src/pages/sales
│   │   │   │   └── ./07-frontend/src/pages/sales/SalesOverview.vue
│   │   │   ├── ./07-frontend/src/pages/sales-order
│   │   │   │   └── ./07-frontend/src/pages/sales-order/SalesOrderList.vue
│   │   │   ├── ./07-frontend/src/pages/scheduling
│   │   │   │   └── ./07-frontend/src/pages/scheduling/SchedulingPlan.vue
│   │   │   ├── ./07-frontend/src/pages/shipping
│   │   │   │   └── ./07-frontend/src/pages/shipping/ShippingOrder.vue
│   │   │   ├── ./07-frontend/src/pages/system
│   │   │   │   ├── ./07-frontend/src/pages/system/audit-management
│   │   │   │   │   ├── ./07-frontend/src/pages/system/audit-management/AuditLogDetail.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/system/audit-management/AuditLogList.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/system/audit-management/DataChangeList.vue
│   │   │   │   │   └── ./07-frontend/src/pages/system/audit-management/OperationTrace.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/auth
│   │   │   │   │   ├── ./07-frontend/src/pages/system/auth/ForgotPassword.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/system/auth/Login.vue
│   │   │   │   │   └── ./07-frontend/src/pages/system/auth/Register.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/company
│   │   │   │   │   ├── ./07-frontend/src/pages/system/company/CompanyIntro.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/system/company/ContactUs.vue
│   │   │   │   │   └── ./07-frontend/src/pages/system/company/PrivacyPolicy.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/components
│   │   │   │   │   ├── ./07-frontend/src/pages/system/components/AuditInfo.vue
│   │   │   │   │   └── ./07-frontend/src/pages/system/components/ChangeHistory.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/Dashboard.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/PermissionManage.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/Profile.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/RoleManage.vue
│   │   │   │   ├── ./07-frontend/src/pages/system/user-management
│   │   │   │   │   ├── ./07-frontend/src/pages/system/user-management/components
│   │   │   │   │   │   ├── ./07-frontend/src/pages/system/user-management/components/PermissionManager.vue
│   │   │   │   │   │   └── ./07-frontend/src/pages/system/user-management/components/RoleSelector.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/system/user-management/UserCreate.vue
│   │   │   │   │   ├── ./07-frontend/src/pages/system/user-management/UserList.vue
│   │   │   │   │   └── ./07-frontend/src/pages/system/user-management/UserRole.vue
│   │   │   │   └── ./07-frontend/src/pages/system/UserManage.vue
│   │   │   └── ./07-frontend/src/pages/warehouse
│   │   │       └── ./07-frontend/src/pages/warehouse/WarehouseManage.vue
│   │   ├── ./07-frontend/src/platforms
│   │   │   └── ./07-frontend/src/platforms/mobile
│   │   │       └── ./07-frontend/src/platforms/mobile/pages
│   │   │           ├── ./07-frontend/src/platforms/mobile/pages/attendance
│   │   │           │   └── ./07-frontend/src/platforms/mobile/pages/attendance/Attendance.vue
│   │   │           ├── ./07-frontend/src/platforms/mobile/pages/inventory
│   │   │           │   └── ./07-frontend/src/platforms/mobile/pages/inventory/MobileInventory.vue
│   │   │           ├── ./07-frontend/src/platforms/mobile/pages/payroll
│   │   │           │   └── ./07-frontend/src/platforms/mobile/pages/payroll/MobilePayroll.vue
│   │   │           └── ./07-frontend/src/platforms/mobile/pages/production
│   │   │               └── ./07-frontend/src/platforms/mobile/pages/production/MobileProduction.vue
│   │   ├── ./07-frontend/src/router
│   │   │   └── ./07-frontend/src/router/index.ts
│   │   ├── ./07-frontend/src/services
│   │   │   ├── ./07-frontend/src/services/api
│   │   │   │   └── ./07-frontend/src/services/api/auditService.ts
│   │   │   ├── ./07-frontend/src/services/store
│   │   │   └── ./07-frontend/src/services/utils
│   │   ├── ./07-frontend/src/utils
│   │   │   ├── ./07-frontend/src/utils/business
│   │   │   ├── ./07-frontend/src/utils/calculation
│   │   │   ├── ./07-frontend/src/utils/data
│   │   │   ├── ./07-frontend/src/utils/error-handling
│   │   │   ├── ./07-frontend/src/utils/guide
│   │   │   ├── ./07-frontend/src/utils/integration
│   │   │   ├── ./07-frontend/src/utils/menu.ts
│   │   │   └── ./07-frontend/src/utils/validation
│   │   └── ./07-frontend/src/views
│   │       └── ./07-frontend/src/views/HomePage.vue
│   └── ./07-frontend/vite.config.js
├── ./08-backend
│   ├── ./08-backend/pom.xml
│   └── ./08-backend/src
│       └── ./08-backend/src/main
│           ├── ./08-backend/src/main/java
│           │   └── ./08-backend/src/main/java/com
│           │       └── ./08-backend/src/main/java/com/enterprise
│           │           └── ./08-backend/src/main/java/com/enterprise/brain
│           │               ├── ./08-backend/src/main/java/com/enterprise/brain/common
│           │               │   └── ./08-backend/src/main/java/com/enterprise/brain/common/base
│           │               │       └── ./08-backend/src/main/java/com/enterprise/brain/common/base/BaseEntity.java
│           │               ├── ./08-backend/src/main/java/com/enterprise/brain/config
│           │               │   └── ./08-backend/src/main/java/com/enterprise/brain/config/AuditAutoConfiguration.java
│           │               ├── ./08-backend/src/main/java/com/enterprise/brain/EnterpriseBrainApplication.java
│           │               └── ./08-backend/src/main/java/com/enterprise/brain/modules
│           │                   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common
│           │                   │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy
│           │                   │       ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/controller
│           │                   │       │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/controller/CopyPasteController.java
│           │                   │       ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/dto
│           │                   │       │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/dto/request
│           │                   │       │   │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/dto/request/CopyRequest.java
│           │                   │       │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/dto/response
│           │                   │       │       ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/dto/response/CopyResponse.java
│           │                   │       │       └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/dto/response/PasteResponse.java
│           │                   │       ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/entity
│           │                   │       │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/entity/CopyTemplate.java
│           │                   │       │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/entity/PasteHistory.java
│           │                   │       └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/service
│           │                   │           ├── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/service/CopyPasteService.java
│           │                   │           └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/service/impl
│           │                   │               └── ./08-backend/src/main/java/com/enterprise/brain/modules/common/copy/service/impl/CopyPasteServiceImpl.java
│           │                   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system
│           │                       ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/annotation
│           │                       │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/annotation/AuditLog.java
│           │                       │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/annotation/DataChangeTrack.java
│           │                       │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/annotation/SensitiveData.java
│           │                       └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit
│           │                           ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller
│           │                           │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/AuditLogController.java
│           │                           │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/controller/DataChangeController.java
│           │                           ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto
│           │                           │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request
│           │                           │   │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/AuditQueryRequest.java
│           │                           │   │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/request/DataChangeQueryRequest.java
│           │                           │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response
│           │                           │       ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response/AuditLogResponse.java
│           │                           │       └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/dto/response/DataChangeResponse.java
│           │                           ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/entity
│           │                           │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/entity/AuditLog.java
│           │                           │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/entity/DataChangeRecord.java
│           │                           │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/entity/OperationTrace.java
│           │                           ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/mapper
│           │                           │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/mapper/AuditLogMapper.java
│           │                           │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/mapper/DataChangeMapper.java
│           │                           ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/repository
│           │                           │   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/repository/AuditLogRepository.java
│           │                           │   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/repository/DataChangeRepository.java
│           │                           └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service
│           │                               ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/AuditLogService.java
│           │                               ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/DataChangeService.java
│           │                               └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/impl
│           │                                   ├── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/impl/AuditLogServiceImpl.java
│           │                                   └── ./08-backend/src/main/java/com/enterprise/brain/modules/system/audit/service/impl/DataChangeServiceImpl.java
│           └── ./08-backend/src/main/resources
│               ├── ./08-backend/src/main/resources/application.yml
│               └── ./08-backend/src/main/resources/db
│                   ├── ./08-backend/src/main/resources/db/data
│                   ├── ./08-backend/src/main/resources/db/migration
│                   │   ├── ./08-backend/src/main/resources/db/migration/V1_0_0__init_schema.sql
│                   │   └── ./08-backend/src/main/resources/db/migration/V1_0_1__add_audit_tables.sql
│                   └── ./08-backend/src/main/resources/db/procedures
├── ./12-config
│   ├── ./12-config/environments
│   │   ├── ./12-config/environments/development
│   │   ├── ./12-config/environments/production
│   │   ├── ./12-config/environments/staging
│   │   └── ./12-config/environments/testing
│   └── ./12-config/feature-flags
├── ./backend
├── ./databases
├── ./deploy
├── ./docker
│   ├── ./docker/docker-compose.yml
│   └── ./docker/nginx.conf
├── ./frontend
├── ./jenkins
├── ./logs
│   ├── ./logs/app
│   ├── ./logs/jenkins
│   ├── ./logs/mysql
│   ├── ./logs/nginx
│   └── ./logs/redis
├── ./project_simple.md
├── ./verify_structure.sh
└── ./workspace-locks
```
