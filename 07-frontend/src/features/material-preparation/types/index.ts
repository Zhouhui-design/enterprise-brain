/**
 * 备料计划模块类型定义
 */

// 备料计划实体
export interface MaterialPreparationPlan {
  id?: number
  planNo: string
  sourcePlanNo?: string
  sourceProcessPlanNo?: string
  
  // 父件信息（来自真工序计划）
  parentCode?: string
  parentName?: string
  parentScheduleQuantity?: number
  
  // 物料信息
  materialCode: string
  materialName: string
  materialSource?: string
  materialUnit?: string
  demandQuantity: number
  
  // 库存信息
  needMrp?: boolean
  realtimeStock?: number
  projectedBalance?: number
  availableStock?: number
  
  // 工序信息
  sourceProcess?: string
  workshopName?: string
  parentProcessName?: string
  processIntervalHours?: number
  processIntervalUnit?: string
  processScheduleDate?: string
  demandDate?: string
  
  // 推送标记
  pushToPurchase?: boolean
  pushToProcess?: boolean
  
  // 主计划关联信息
  salesOrderNo?: string
  customerOrderNo?: string
  mainPlanProductCode?: string
  mainPlanProductName?: string
  mainPlanQuantity?: number
  promiseDeliveryDate?: string
  
  // 备注
  remark?: string
  
  // 系统字段
  createdAt?: string
  updatedAt?: string
  createdBy?: string
  updatedBy?: string
}

// 列表查询参数
export interface MaterialPrepListParams {
  page: number
  pageSize: number
  planNo?: string
  sourcePlanNo?: string
  materialCode?: string
  demandDateStart?: string
  demandDateEnd?: string
}

// 列表响应
export interface MaterialPrepListResponse {
  records: MaterialPreparationPlan[]
  total: number
  page: number
  pageSize: number
}

// 表格列配置
export interface TableColumn {
  prop: string
  label: string
  width?: number
  sortable?: boolean
  filterable?: boolean
  fixed?: 'left' | 'right'
  visible?: boolean
  align?: 'left' | 'center' | 'right'
  type?: 'selection'
  formatter?: (row: MaterialPreparationPlan) => string
}

// 搜索表单
export interface SearchForm {
  planNo: string
  sourcePlanNo: string
  materialCode: string
  demandDateRange: [Date, Date] | null
}

// 数据源类型
export enum DataSourceType {
  MAIN_PLAN = 'main_plan',           // 主生产计划
  REAL_PROCESS_PLAN = 'real_process_plan'  // 真工序计划
}
