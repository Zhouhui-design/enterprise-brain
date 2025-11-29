import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response?.status === 401) {
      // Token过期，跳转到登录页
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 销售订单API
export const salesOrderAPI = {
  // 获取订单列表
  getOrders: (params) => {
    return api.get('/salesOrders', { params })
  },

  // 获取订单详情
  getOrderById: (id) => {
    return api.get(`/salesOrders/${id}`)
  },

  // 创建订单
  createOrder: (data) => {
    return api.post('/salesOrders', data)
  },

  // 更新订单
  updateOrder: (id, data) => {
    return api.put(`/salesOrders/${id}`, data)
  },

  // 删除订单
  deleteOrder: (id) => {
    return api.delete(`/salesOrders/${id}`)
  },

  // 审批订单
  approveOrder: (id, data) => {
    return api.post(`/salesOrders/${id}/approve`, data)
  },

  // 批量审批订单
  batchApproveOrders: (data) => {
    return api.post('/salesOrders/batch-approve', data)
  },

  // 导出订单
  exportOrders: (params) => {
    return api.get('/salesOrders/export', { 
      params,
      responseType: params.format === 'excel' ? 'blob' : 'json'
    })
  },

  // 获取订单统计
  getOrderStats: (params) => {
    return api.get('/salesOrders/stats', { params })
  }
}

// 产品API
export const productAPI = {
  // 获取产品列表
  getProducts: (params) => {
    return api.get('/products', { params })
  },

  // 获取产品详情
  getProductById: (id) => {
    return api.get(`/products/${id}`)
  },

  // 创建产品
  createProduct: (data) => {
    return api.post('/products', data)
  },

  // 更新产品
  updateProduct: (id, data) => {
    return api.put(`/products/${id}`, data)
  },

  // 删除产品
  deleteProduct: (id) => {
    return api.delete(`/products/${id}`)
  },

  // 获取产品分类
  getCategories: () => {
    return api.get('/products/categories')
  },

  // 创建产品分类
  createCategory: (data) => {
    return api.post('/products/categories', data)
  },

  // 获取库存信息
  getStockInfo: (params) => {
    return api.get('/products/stock/info', { params })
  },

  // 更新库存
  updateStock: (productId, data) => {
    return api.put(`/products/stock/${productId}`, data)
  },

  // 获取价格历史
  getPriceHistory: (productId, params) => {
    return api.get(`/products/${productId}/price-history`, { params })
  },

  // 导出产品
  exportProducts: (params) => {
    return api.get('/products/export', { 
      params,
      responseType: params.format === 'excel' ? 'blob' : 'json'
    })
  }
}

// 客户API
export const customerAPI = {
  // 获取客户列表
  getCustomers: (params) => {
    return api.get('/customers', { params })
  },

  // 获取客户详情
  getCustomerById: (id) => {
    return api.get(`/customers/${id}`)
  },

  // 创建客户
  createCustomer: (data) => {
    return api.post('/customers', data)
  },

  // 更新客户
  updateCustomer: (id, data) => {
    return api.put(`/customers/${id}`, data)
  },

  // 删除客户
  deleteCustomer: (id) => {
    return api.delete(`/customers/${id}`)
  },

  // 获取客户统计
  getCustomerStats: (params) => {
    return api.get('/customers/stats', { params })
  },

  // 获取客户订单历史
  getCustomerOrderHistory: (customerId, params) => {
    return api.get(`/customers/${customerId}/order-history`, { params })
  },

  // 添加联系人
  addContact: (customerId, data) => {
    return api.post(`/customers/${customerId}/contacts`, data)
  },

  // 更新联系人
  updateContact: (customerId, contactId, data) => {
    return api.put(`/customers/${customerId}/contacts/${contactId}`, data)
  },

  // 删除联系人
  deleteContact: (customerId, contactId) => {
    return api.delete(`/customers/${customerId}/contacts/${contactId}`)
  },

  // 导出客户
  exportCustomers: (params) => {
    return api.get('/customers/export', { 
      params,
      responseType: params.format === 'excel' ? 'blob' : 'json'
    })
  }
}

// 文件上传API
export const uploadAPI = {
  // 上传文件
  uploadFile: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      }
    })
  },

  // 批量上传文件
  uploadFiles: (files, onProgress) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    return api.post('/upload/batch', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(progress)
        }
      }
    })
  }
}

// 模板API
export const templateAPI = {
  // 获取交付计划模板
  getDeliveryTemplates: () => {
    return api.get('/templates/delivery')
  },

  // 保存交付计划模板
  saveDeliveryTemplate: (data) => {
    return api.post('/templates/delivery', data)
  },

  // 获取付款条款模板
  getPaymentTemplates: () => {
    return api.get('/templates/payment')
  },

  // 保存付款条款模板
  savePaymentTemplate: (data) => {
    return api.post('/templates/payment', data)
  }
}

// 通用API
export const commonAPI = {
  // 获取系统配置
  getConfig: () => {
    return api.get('/config')
  },

  // 获取用户信息
  getUserInfo: () => {
    return api.get('/user/info')
  },

  // 获取权限列表
  getPermissions: () => {
    return api.get('/permissions')
  },

  // 获取部门列表
  getDepartments: () => {
    return api.get('/departments')
  },

  // 获取员工列表
  getEmployees: () => {
    return api.get('/employees')
  }
}

// 数据处理工具
export const dataUtils = {
  // 处理导出数据
  handleExportResponse: (response, filename) => {
    const blob = new Blob([response])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `export_${new Date().getTime()}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },

  // 格式化金额
  formatAmount: (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  },

  // 格式化日期
  formatDate: (date, format = 'YYYY-MM-DD') => {
    if (!date) return ''
    const d = new Date(date)
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`
      case 'YYYY-MM-DD HH:mm':
        return `${year}-${month}-${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      default:
        return `${year}-${month}-${day}`
    }
  },

  // 生成订单编号
  generateOrderNumber: () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `SO${year}${month}${day}${random}`
  }
}

export default {
  salesOrderAPI,
  productAPI,
  customerAPI,
  uploadAPI,
  templateAPI,
  commonAPI,
  dataUtils
}