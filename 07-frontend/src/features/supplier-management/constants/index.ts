/**
 * 供应商管理模块 - 常量配置
 */

/**
 * 供应商类型选项
 */
export const SUPPLIER_TYPES = [
  { label: '原材料供应商', value: 'raw_material' },
  { label: '设备供应商', value: 'equipment' },
  { label: '服务供应商', value: 'service' },
  { label: '办公用品供应商', value: 'office' },
  { label: '物流供应商', value: 'logistics' },
  { label: '其他', value: 'other' }
]

/**
 * 供应商状态选项
 */
export const SUPPLIER_STATUS = [
  { label: '启用', value: 'active', type: 'success' },
  { label: '禁用', value: 'inactive', type: 'danger' },
  { label: '待审核', value: 'pending', type: 'warning' }
]

/**
 * 信用等级选项
 */
export const CREDIT_RATINGS = [
  { label: 'A级（优秀）', value: 'A', color: '#67C23A' },
  { label: 'B级（良好）', value: 'B', color: '#409EFF' },
  { label: 'C级（一般）', value: 'C', color: '#E6A23C' },
  { label: 'D级（较差）', value: 'D', color: '#F56C6C' }
]

/**
 * 状态标签颜色映射
 */
export const STATUS_TAG_COLORS: Record<string, string> = {
  active: 'success',
  inactive: 'danger',
  pending: 'warning'
}

/**
 * 供应商类型标签颜色映射
 */
export const TYPE_TAG_COLORS: Record<string, string> = {
  raw_material: 'primary',
  equipment: 'success',
  service: 'warning',
  office: 'info',
  logistics: 'primary',
  other: 'info'
}

/**
 * 付款条款选项
 */
export const PAYMENT_TERMS = [
  { label: '货到付款', value: 'COD' },
  { label: '月结30天', value: 'NET30' },
  { label: '月结60天', value: 'NET60' },
  { label: '月结90天', value: 'NET90' },
  { label: '预付款', value: 'PREPAID' },
  { label: '其他', value: 'OTHER' }
]
