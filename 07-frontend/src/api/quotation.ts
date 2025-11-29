// API服务 - 报价管理相关接口
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 基础配置
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || '/api'
const REQUEST_TIMEOUT = 30000

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('Response error:', error)
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('未授权，请重新登录')
          localStorage.removeItem('authToken')
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('无权限访问此资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '网络请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 接口定义
export interface Quotation {
  id: string
  quotationNo: string
  customerId: string
  customerName: string
  contactPerson: string
  contactPhone: string
  contactEmail?: string
  quotationDate: string
  validUntil: string
  remark?: string
  creator: string
  createTime: string
  updateTime?: string
  reviewerId?: string
  reviewerName?: string
  reviewTime?: string
  reviewResult?: string
  reviewComment?: string
  approverId?: string
  approverName?: string
  approveTime?: string
  approveResult?: string
  approveComment?: string
  items: QuotationItem[]
  subtotal: number
  discountAmount: number
  taxAmount: number
  shippingFee: number
  totalAmount: number
  status: 'draft' | 'pending_review' | 'reviewing' | 'reviewed' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled' | 'completed'
  priority: 'low' | 'medium' | 'high'
  attachments?: Attachment[]
}

export interface QuotationItem {
  id: string
  productId: string
  productName: string
  productCode: string
  description?: string
  quantity: number
  unit: string
  unitPrice: number
  discountRate: number
  amount: number
  specifications?: string
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadTime: string
}

export interface CreateQuotationRequest {
  customerId: string
  contactPerson: string
  contactPhone: string
  contactEmail?: string
  validDays: number
  remark?: string
  items: Omit<QuotationItem, 'id' | 'amount'>[]
  shippingFee?: number
  discountAmount?: number
}

export interface SearchQuotationParams {
  query?: string
  customerId?: string
  status?: string
  priority?: string
  startDate?: string
  endDate?: string
  creatorId?: string
  page?: number
  pageSize?: number
  sortBy?: 'createTime' | 'totalAmount' | 'validUntil'
  sortOrder?: 'asc' | 'desc'
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  code?: number
  total?: number
  page?: number
  pageSize?: number
}

// API方法实现
export class QuotationApi {
  /**
   * 获取报价列表
   */
  static async getQuotations(params: SearchQuotationParams = {}): Promise<ApiResponse<Quotation[]>> {
    const response = await apiClient.get('/quotations', { params })
    return response
  }

  /**
   * 获取报价详情
   */
  static async getQuotationById(id: string): Promise<ApiResponse<Quotation>> {
    const response = await apiClient.get(`/quotations/${id}`)
    return response
  }

  /**
   * 创建报价
   */
  static async createQuotation(data: CreateQuotationRequest): Promise<ApiResponse<Quotation>> {
    const response = await apiClient.post('/quotations', data)
    return response
  }

  /**
   * 更新报价
   */
  static async updateQuotation(id: string, data: Partial<Quotation>): Promise<ApiResponse<Quotation>> {
    const response = await apiClient.put(`/quotations/${id}`, data)
    return response
  }

  /**
   * 删除报价
   */
  static async deleteQuotation(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/quotations/${id}`)
    return response
  }

  /**
   * 提交审核
   */
  static async submitForReview(id: string, comment?: string): Promise<ApiResponse<Quotation>> {
    const response = await apiClient.post(`/quotations/${id}/submit-review`, { comment })
    return response
  }

  /**
   * 审核报价
   */
  static async reviewQuotation(
    id: string, 
    result: 'approved' | 'rejected', 
    comment?: string
  ): Promise<ApiResponse<Quotation>> {
    const response = await apiClient.post(`/quotations/${id}/review`, { result, comment })
    return response
  }

  /**
   * 审批报价
   */
  static async approveQuotation(
    id: string, 
    result: 'approved' | 'rejected', 
    comment?: string
  ): Promise<ApiResponse<Quotation>> {
    const response = await apiClient.post(`/quotations/${id}/approve`, { result, comment })
    return response
  }

  /**
   * 转换为订单
   */
  static async convertToOrder(id: string, orderData?: any): Promise<ApiResponse<any>> {
    const response = await apiClient.post(`/quotations/${id}/convert-to-order`, orderData)
    return response
  }

  /**
   * 取消报价
   */
  static async cancelQuotation(id: string, reason?: string): Promise<ApiResponse<Quotation>> {
    const response = await apiClient.post(`/quotations/${id}/cancel`, { reason })
    return response
  }

  /**
   * 上传附件
   */
  static async uploadAttachment(quotationId: string, file: File): Promise<ApiResponse<Attachment>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('quotationId', quotationId)

    const response = await apiClient.post(`/quotations/${quotationId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  }

  /**
   * 删除附件
   */
  static async deleteAttachment(quotationId: string, attachmentId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/quotations/${quotationId}/attachments/${attachmentId}`)
    return response
  }

  /**
   * 导出报价
   */
  static async exportQuotation(id: string, format: 'pdf' | 'excel' = 'pdf'): Promise<Blob> {
    const response = await apiClient.get(`/quotations/${id}/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response
  }

  /**
   * 批量操作
   */
  static async batchUpdateStatus(
    ids: string[], 
    status: Quotation['status'], 
    comment?: string
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.post('/quotations/batch-update-status', {
      ids,
      status,
      comment
    })
    return response
  }

  /**
   * 获取报价统计
   */
  static async getQuotationStats(params: {
    startDate?: string
    endDate?: string
    customerId?: string
  } = {}): Promise<ApiResponse<{
    total: number
    draft: number
    pendingReview: number
    approved: number
    rejected: number
    completed: number
    totalAmount: number
    averageAmount: number
  }>> {
    const response = await apiClient.get('/quotations/stats', { params })
    return response
  }
}

export default QuotationApi