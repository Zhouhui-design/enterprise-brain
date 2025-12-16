/**
 * 供应商管理模块 - TypeScript 类型定义
 */

/**
 * 供应商信息
 */
export interface Supplier {
  id?: number
  supplierCode: string // 供应商编码
  supplierName: string // 供应商名称
  supplierType: string // 供应商类型
  contactPerson: string // 联系人
  contactPhone: string // 联系电话
  contactEmail?: string // 联系邮箱
  address?: string // 地址
  taxNo?: string // 税号
  bankName?: string // 开户银行
  bankAccount?: string // 银行账号
  paymentTerms?: string // 付款条款
  creditRating?: string // 信用等级 (A/B/C/D)
  evaluationScore?: number // 评分 (0-100)
  status: string // 状态 (active/inactive/pending)
  supplierCategory?: string // 供应商类别
  cooperationStartDate?: string // 合作开始日期
  businessLicense?: string // 营业执照附件
  qualificationCert?: string // 资质证书附件
  remarks?: string // 备注
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
  creator?: string // 创建人
}

/**
 * 搜索表单
 */
export interface SearchForm {
  supplierCode?: string
  supplierName?: string
  supplierType?: string
  status?: string
  creditRating?: string
}

/**
 * 列表查询参数
 */
export interface SupplierListParams {
  page: number
  pageSize: number
  supplierCode?: string
  supplierName?: string
  supplierType?: string
  status?: string
  creditRating?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 列表响应数据
 */
export interface SupplierListResponse {
  records: Supplier[]
  total: number
  page: number
  pageSize: number
}
