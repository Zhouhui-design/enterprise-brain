/**
 * 供应商评价类型定义
 */

/**
 * 供应商评价记录
 */
export interface SupplierEvaluation {
  id?: number
  evaluationNo: string // 评价编号
  supplierCode: string // 供应商编码
  supplierName: string // 供应商名称
  contactPerson?: string // 联系人
  contactPhone?: string // 联系电话
  evaluationDate: string // 评价日期
  evaluator: string // 评价人
  qualityScore: number // 质量得分 (0-100)
  deliveryScore: number // 交期得分 (0-100)
  priceScore: number // 价格得分 (0-100)
  serviceScore: number // 服务得分 (0-100)
  totalScore: number // 总得分 (0-100)
  evaluationLevel: string // 评价等级 (A/B/C/D)
  remarks?: string // 备注
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
}

/**
 * 搜索表单
 */
export interface SearchForm {
  evaluationNo: string
  supplierName: string
  evaluationDateRange: [string, string] | null
  evaluationLevel: string
}

/**
 * 列表请求参数
 */
export interface EvaluationListParams {
  page: number
  pageSize: number
  evaluationNo?: string
  supplierName?: string
  evaluationDateStart?: string
  evaluationDateEnd?: string
  evaluationLevel?: string
}

/**
 * 列表响应数据
 */
export interface EvaluationListResponse {
  records: SupplierEvaluation[]
  total: number
  page: number
  pageSize: number
}
