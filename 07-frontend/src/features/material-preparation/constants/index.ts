/**
 * 备料计划模块常量
 */

// 物料来源选项
export const MATERIAL_SOURCE_OPTIONS = [
  { label: '外购', value: '外购' },
  { label: '自制', value: '自制' },
  { label: '委外', value: '委外' }
]

// 工序间隔单位
export const INTERVAL_UNIT_OPTIONS = [
  { label: '小时', value: '小时' },
  { label: '天', value: '天' }
]

// 默认分页设置
export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [20, 50, 100, 200]

// 查询键(用于状态管理)
export const QUERY_KEYS = {
  LIST: 'material-preparation-list',
  DETAIL: 'material-preparation-detail'
} as const

// 事件名称
export const EVENTS = {
  CREATED: 'material-prep:created',
  UPDATED: 'material-prep:updated',
  DELETED: 'material-prep:deleted',
  BATCH_DELETED: 'material-prep:batch-deleted'
} as const
