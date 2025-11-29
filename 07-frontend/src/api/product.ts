// API服务 - 产品管理相关接口
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
export interface Product {
  id: string
  name: string
  code: string
  description: string
  category: string
  unit: string
  unitPrice: number
  discount?: number
  marketPrice?: number
  costPrice?: number
  image: string
  images: string[]
  specifications?: ProductSpecification[]
  stock: ProductStock
  supplier: ProductSupplier
  deliveryTime: number
  minOrderQuantity: number
  maxOrderQuantity?: number
  tags?: string[]
  status: 'active' | 'inactive' | 'discontinued'
  isNew?: boolean
  isHot?: boolean
  isRecommended?: boolean
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  warranty?: string
  createdAt: string
  updatedAt: string
}

export interface ProductSpecification {
  name: string
  value: string
  unit?: string
}

export interface ProductStock {
  quantity: number
  allocated: number
  available: number
  reorderLevel: number
  location?: string
  warehouseId: string
  warehouseName: string
}

export interface ProductSupplier {
  id: string
  name: string
  code: string
  contactPerson: string
  contactPhone: string
  contactEmail?: string
  leadTime: number
  unitPrice: number
  minOrderQuantity: number
}

export interface ProductCategory {
  id: string
  name: string
  code: string
  parentId?: string
  level: number
  icon?: string
  description?: string
  sortOrder: number
  status: 'active' | 'inactive'
  children?: ProductCategory[]
}

export interface SearchProductParams {
  query?: string
  categoryId?: string
  supplierId?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  tags?: string[]
  isNew?: boolean
  isHot?: boolean
  isRecommended?: boolean
  page?: number
  pageSize?: number
  sortBy?: 'name' | 'code' | 'unitPrice' | 'createdAt' | 'stock'
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
export class ProductApi {
  /**
   * 获取产品列表
   */
  static async getProducts(params: SearchProductParams = {}): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get('/products', { params })
    return response
  }

  /**
   * 获取产品详情
   */
  static async getProductById(id: string): Promise<ApiResponse<Product>> {
    const response = await apiClient.get(`/products/${id}`)
    return response
  }

  /**
   * 获取产品分类树
   */
  static async getProductCategories(): Promise<ApiResponse<ProductCategory[]>> {
    const response = await apiClient.get('/products/categories')
    return response
  }

  /**
   * 根据分类获取产品
   */
  static async getProductsByCategory(
    categoryId: string, 
    params: Omit<SearchProductParams, 'categoryId'> = {}
  ): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get(`/products/category/${categoryId}`, { params })
    return response
  }

  /**
   * 获取推荐产品
   */
  static async getRecommendedProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get('/products/recommended', {
      params: { limit }
    })
    return response
  }

  /**
   * 获取热销产品
   */
  static async getHotProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get('/products/hot', {
      params: { limit }
    })
    return response
  }

  /**
   * 获取新品
   */
  static async getNewProducts(limit: number = 10): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get('/products/new', {
      params: { limit }
    })
    return response
  }

  /**
   * 获取相关产品
   */
  static async getRelatedProducts(
    productId: string, 
    limit: number = 6
  ): Promise<ApiResponse<Product[]>> {
    const response = await apiClient.get(`/products/${productId}/related`, {
      params: { limit }
    })
    return response
  }

  /**
   * 产品搜索建议
   */
  static async getProductSuggestions(
    query: string, 
    limit: number = 10
  ): Promise<ApiResponse<{ id: string; name: string; code: string }[]>> {
    const response = await apiClient.get('/products/suggestions', {
      params: { query, limit }
    })
    return response
  }

  /**
   * 检查产品库存
   */
  static async checkProductStock(productId: string): Promise<ApiResponse<{
    quantity: number
    allocated: number
    available: number
    reorderLevel: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
  }>> {
    const response = await apiClient.get(`/products/${productId}/stock`)
    return response
  }

  /**
   * 批量检查库存
   */
  static async checkBatchStock(
    productIds: string[]
  ): Promise<ApiResponse<Array<{
    productId: string
    quantity: number
    allocated: number
    available: number
    status: string
  }>>> {
    const response = await apiClient.post('/products/batch-stock', { productIds })
    return response
  }

  /**
   * 获取产品价格历史
   */
  static async getProductPriceHistory(
    productId: string,
    params: {
      startDate?: string
      endDate?: string
      limit?: number
    } = {}
  ): Promise<ApiResponse<Array<{
    date: string
    unitPrice: number
    discountRate: number
    effectivePrice: number
  }>>> {
    const response = await apiClient.get(`/products/${productId}/price-history`, { params })
    return response
  }

  /**
   * 更新产品
   */
  static async updateProduct(
    id: string, 
    data: Partial<Product>
  ): Promise<ApiResponse<Product>> {
    const response = await apiClient.put(`/products/${id}`, data)
    return response
  }

  /**
   * 更新产品库存
   */
  static async updateProductStock(
    productId: string, 
    data: {
      quantity: number
      location?: string
      reason?: string
    }
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.post(`/products/${productId}/stock`, data)
    return response
  }

  /**
   * 更新产品价格
   */
  static async updateProductPrice(
    productId: string, 
    data: {
      unitPrice: number
      discount?: number
      effectiveDate?: string
      reason?: string
    }
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.post(`/products/${productId}/price`, data)
    return response
  }

  /**
   * 删除产品
   */
  static async deleteProduct(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/products/${id}`)
    return response
  }

  /**
   * 上传产品图片
   */
  static async uploadProductImage(
    productId: string, 
    file: File
  ): Promise<ApiResponse<{ url: string; id: string }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('productId', productId)

    const response = await apiClient.post(`/products/${productId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response
  }

  /**
   * 删除产品图片
   */
  static async deleteProductImage(
    productId: string, 
    imageId: string
  ): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/products/${productId}/images/${imageId}`)
    return response
  }

  /**
   * 获取产品统计
   */
  static async getProductStats(params: {
    categoryId?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<ApiResponse<{
    total: number
    active: number
    inactive: number
    lowStock: number
    outOfStock: number
    totalValue: number
    averagePrice: number
    topCategories: Array<{
      categoryId: string
      categoryName: string
      count: number
      value: number
    }>
    topSuppliers: Array<{
      supplierId: string
      supplierName: string
      count: number
      value: number
    }>
  }>> {
    const response = await apiClient.get('/products/stats', { params })
    return response
  }

  /**
   * 导出产品
   */
  static async exportProducts(
    params: SearchProductParams = {}, 
    format: 'excel' | 'csv' = 'excel'
  ): Promise<Blob> {
    const response = await apiClient.get('/products/export', {
      params: { ...params, format },
      responseType: 'blob'
    })
    return response
  }
}

export default ProductApi