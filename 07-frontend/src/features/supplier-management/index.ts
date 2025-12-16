/**
 * 供应商管理模块 - 统一导出
 */

// 类型定义
export type { Supplier, SearchForm, SupplierListParams, SupplierListResponse } from './types'

// 常量
export { 
  SUPPLIER_TYPES, 
  SUPPLIER_STATUS, 
  CREDIT_RATINGS,
  STATUS_TAG_COLORS,
  TYPE_TAG_COLORS,
  PAYMENT_TERMS
} from './constants'

// API服务
export * as supplierApi from './services/supplierApi'

// Composables
export { useSupplierList } from './composables/useSupplierList'
export { useSupplierActions } from './composables/useSupplierActions'
