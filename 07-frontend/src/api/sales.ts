// API服务 - 销售数据统计相关接口
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
export interface SalesMetrics {
  revenue: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  orders: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  customers: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  conversion: {
    value: number
    compareValue: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  averageOrderValue: number
  averageCustomerValue: number
}

export interface TopProduct {
  id: string
  name: string
  code: string
  salesAmount: number
  quantity: number
  profitMargin: number
  trend: 'up' | 'down' | 'stable'
  category: string
  imageUrl?: string
}

export interface SalesTarget {
  id: string
  name: string
  type: 'revenue' | 'orders' | 'customers' | 'profit'
  period: 'monthly' | 'quarterly' | 'yearly'
  target: number
  current: number
  progress: number
  year: number
  month?: number
  quarter?: number
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  type: 'order' | 'quotation' | 'customer' | 'payment' | 'refund' | 'shipment'
  title: string
  description: string
  amount?: number
  user: string
  userId: string
  customerId?: string
  customerName?: string
  orderId?: string
  quotationId?: string
  createdAt: string
  metadata?: Record<string, any>
}

export interface CustomerAnalysis {
  type: {
    newCustomers: number
    existingCustomers: number
    vipCustomers: number
    potentialCustomers: number
  }
  region: {
    eastChina: number
    southChina: number
    northChina: number
    westChina: number
    centralChina: number
    other: number
  }
  industry: {
    manufacturing: number
    technology: number
    service: number
    trade: number
    other: number
  }
  size: {
    large: number
    medium: number
    small: number
    individual: number
  }
}

export interface SalesTrend {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate: string
  revenue: Array<{
    date: string
    value: number
  }>
  orders: Array<{
    date: string
    value: number
  }>
  customers: Array<{
    date: string
    value: number
  }>
}

export interface SearchSalesParams {
  period?: 'today' | 'week' | 'month' | 'quarter' | 'year'
  startDate?: string
  endDate?: string
  userId?: string
  customerId?: string
  regionId?: string
  categoryId?: string
  productIds?: string[]
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
export class SalesApi {
  /**
   * 获取销售关键指标
   */
  static async getSalesMetrics(params: SearchSalesParams = {}): Promise<ApiResponse<SalesMetrics>> {
    const response = await apiClient.get('/sales/metrics', { params })
    return response
  }

  /**
   * 获取销售趋势数据
   */
  static async getSalesTrend(
    params: {
      period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
      startDate?: string
      endDate?: string
      type?: 'revenue' | 'orders' | 'customers'
    }
  ): Promise<ApiResponse<SalesTrend>> {
    const response = await apiClient.get('/sales/trend', { params })
    return response
  }

  /**
   * 获取热销产品排行
   */
  static async getTopProducts(params: {
    limit?: number
    period?: string
    startDate?: string
    endDate?: string
    categoryId?: string
    sortBy?: 'salesAmount' | 'quantity' | 'profitMargin'
    sortOrder?: 'asc' | 'desc'
  } = {}): Promise<ApiResponse<TopProduct[]>> {
    const response = await apiClient.get('/sales/top-products', { params })
    return response
  }

  /**
   * 获取客户分析数据
   */
  static async getCustomerAnalysis(
    params: {
      type?: 'type' | 'region' | 'industry' | 'size'
      period?: string
      startDate?: string
      endDate?: string
    } = {}
  ): Promise<ApiResponse<CustomerAnalysis>> {
    const response = await apiClient.get('/sales/customer-analysis', { params })
    return response
  }

  /**
   * 获取销售目标
   */
  static async getSalesTargets(
    params: {
      period?: 'monthly' | 'quarterly' | 'yearly'
      year?: number
      month?: number
      quarter?: number
      userId?: string
    } = {}
  ): Promise<ApiResponse<SalesTarget[]>> {
    const response = await apiClient.get('/sales/targets', { params })
    return response
  }

  /**
   * 创建销售目标
   */
  static async createSalesTarget(data: {
    name: string
    type: 'revenue' | 'orders' | 'customers' | 'profit'
    period: 'monthly' | 'quarterly' | 'yearly'
    target: number
    year: number
    month?: number
    quarter?: number
    description?: string
  }): Promise<ApiResponse<SalesTarget>> {
    const response = await apiClient.post('/sales/targets', data)
    return response
  }

  /**
   * 更新销售目标
   */
  static async updateSalesTarget(
    id: string,
    data: Partial<SalesTarget>
  ): Promise<ApiResponse<SalesTarget>> {
    const response = await apiClient.put(`/sales/targets/${id}`, data)
    return response
  }

  /**
   * 获取销售活动日志
   */
  static async getActivities(
    params: {
      type?: 'order' | 'quotation' | 'customer' | 'payment' | 'refund' | 'shipment'
      userId?: string
      customerId?: string
      startDate?: string
      endDate?: string
      limit?: number
      before?: string // 获取指定时间之前的记录
    } = {}
  ): Promise<ApiResponse<Activity[]>> {
    const response = await apiClient.get('/sales/activities', { params })
    return response
  }

  /**
   * 获取销售报表
   */
  static async getSalesReport(
    params: {
      type: 'summary' | 'detailed' | 'comparison' | 'forecast'
      period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
      startDate?: string
      endDate?: string
      format?: 'json' | 'excel' | 'pdf'
      includeCharts?: boolean
    }
  ): Promise<ApiResponse<any> | Blob> {
    const response = await apiClient.get('/sales/report', { 
      params,
      responseType: params.format === 'excel' || params.format === 'pdf' ? 'blob' : 'json'
    })
    return response
  }

  /**
   * 获取销售预测
   */
  static async getSalesForecast(
    params: {
      period: 'monthly' | 'quarterly' | 'yearly'
      forecastMonths?: number
      basis: 'historical' | 'seasonal' | 'ml'
      confidence?: number // 置信度 0-100
    } = {}
  ): Promise<ApiResponse<{
    forecast: Array<{
      period: string
      predictedValue: number
      confidence: number
      range: {
        min: number
        max: number
      }
    }>
    accuracy: number
    model: string
  }>>> {
    const response = await apiClient.get('/sales/forecast', { params })
    return response
  }

  /**
   * 获取销售排行数据
   */
  static async getSalesRanking(
    params: {
      type: 'salesperson' | 'region' | 'product' | 'customer'
      period?: string
      startDate?: string
      endDate?: string
      limit?: number
    } = {}
  ): Promise<ApiResponse<Array<{
    rank: number
    name: string
    value: number
    growth: number
    details?: any
  }>>> {
    const response = await apiClient.get('/sales/ranking', { params })
    return response
  }

  /**
   * 获取销售转化漏斗
   */
  static async getSalesFunnel(
    params: {
      period?: string
      startDate?: string
      endDate?: string
    } = {}
  ): Promise<ApiResponse<{
    leads: number
    quotations: number
      orders: number
      payments: number
      conversionRates: {
        leadToQuotation: number
        quotationToOrder: number
        orderToPayment: number
        overall: number
      }
    }>> {
    const response = await apiClient.get('/sales/funnel', { params })
    return response
  }

  /**
   * 获取销售效率分析
   */
  static async getSalesEfficiency(
    params: {
      userId?: string
      period?: string
      startDate?: string
      endDate?: string
    } = {}
  ): Promise<ApiResponse<{
    responseTime: number
    conversionRate: number
    averageOrderValue: number
    callsPerDay: number
    meetingsPerDay: number
    followUps: number
    customerRetention: number
  }>> {
    const response = await apiClient.get('/sales/efficiency', { params })
    return response
  }

  /**
   * 导出销售数据
   */
  static async exportSalesData(
    params: {
      type: 'orders' | 'customers' | 'products' | 'activities'
      period?: string
      startDate?: string
      endDate?: string
      format: 'excel' | 'csv' = 'excel'
      columns?: string[]
    } = {}
  ): Promise<Blob> {
    const response = await apiClient.get('/sales/export', {
      params,
      responseType: 'blob'
    })
    return response
  }

  /**
   * 获取实时销售数据
   */
  static async getRealTimeSales(
    params: {
      timeRange?: number // 分钟数，默认60分钟
      refreshRate?: number // 秒数，默认30秒
    } = {}
  ): Promise<ApiResponse<{
    currentRevenue: number
    todayRevenue: number
    todayOrders: number
    todayCustomers: number
    hourlyRevenue: Array<{
      hour: number
      revenue: number
      orders: number
    }>
    activeUsers: number
    lastUpdated: string
  }>> {
    const response = await apiClient.get('/sales/realtime', { params })
    return response
  }

  /**
   * 获取销售业绩对比
   */
  static async getSalesComparison(
    params: {
      currentPeriod: {
        start: string
        end: string
      }
      comparePeriod: {
        start: string
        end: string
      }
      metrics?: string[] // ['revenue', 'orders', 'customers']
      userIds?: string[]
    }
  ): Promise<ApiResponse<{
    current: Record<string, number>
    compare: Record<string, number>
    growth: Record<string, number>
    percentage: Record<string, number>
  }>> {
    const response = await apiClient.post('/sales/comparison', params)
    return response
  }
}

export default SalesApi