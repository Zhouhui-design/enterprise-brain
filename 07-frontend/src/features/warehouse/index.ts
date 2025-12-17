/**
 * 仓库管理模块主入口文件
 * 统一导出所有composables和组件
 */

// Composables
export { usePageSettings } from './composables/usePageSettings'
export { useWarehouseList } from './composables/useWarehouseList'
export { useWarehouseActions } from './composables/useWarehouseActions'

// 组件
export { default as PageSettingsDialog } from './components/PageSettingsDialog.vue'

// 类型定义
export type {
  BusinessVariable,
  WorkflowConfig,
  CodeRule,
  ColumnConfig
} from './composables/usePageSettings'