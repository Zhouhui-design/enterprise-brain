/**
 * 产品服务模块
 * 
 * 提供产品相关的API接口调用，包括：
 * - 产品列表查询
 * - 产品搜索和筛选
 * - 产品详情获取
 * - 产品分类获取
 * - 产品库存查询
 * 
 * @author AI Assistant
 * @since 2024-01-01
 */

import request from '@/utils/request'

// API 接口定义
const API_PREFIX = '/api/products'

export const productApi = {
  /**
   * 获取产品列表
   * @param {Object} params 查询参数
   * @param {number} params.page 页码
   * @param {number} params.pageSize 每页数量
   * @param {string} params.keyword 关键词搜索
   * @param {number} params.categoryId 分类ID
   * @param {number} params.minPrice 最低价格
   * @param {number} params.maxPrice 最高价格
   * @param {string} params.sortBy 排序字段
   * @param {string} params.sortOrder 排序方向
   * @param {string} params.quickFilter 快速筛选
   * @returns {Promise} 产品列表数据
   */
  getProducts(params) {
    return request({
      url: API_PREFIX,
      method: 'GET',
      params
    })
  },

  /**
   * 获取产品详情
   * @param {number} id 产品ID
   * @returns {Promise} 产品详情数据
   */
  getProductDetail(id) {
    return request({
      url: `${API_PREFIX}/${id}`,
      method: 'GET'
    })
  },

  /**
   * 获取产品分类列表
   * @returns {Promise} 分类列表
   */
  getCategories() {
    return request({
      url: `${API_PREFIX}/categories`,
      method: 'GET'
    })
  },

  /**
   * 搜索产品
   * @param {Object} params 搜索参数
   * @returns {Promise} 搜索结果
   */
  searchProducts(params) {
    return request({
      url: `${API_PREFIX}/search`,
      method: 'GET',
      params
    })
  },

  /**
   * 获取产品库存信息
   * @param {number} id 产品ID
   * @returns {Promise} 库存信息
   */
  getProductStock(id) {
    return request({
      url: `${API_PREFIX}/${id}/stock`,
      method: 'GET'
    })
  },

  /**
   * 批量获取产品库存
   * @param {Array} ids 产品ID列表
   * @returns {Promise} 批量库存信息
   */
  getBatchStock(ids) {
    return request({
      url: `${API_PREFIX}/batch-stock`,
      method: 'POST',
      data: { ids }
    })
  }
}

/**
 * 产品工具类
 */
export const productUtils = {
  /**
   * 格式化价格显示
   * @param {number} price 价格
   * @param {number} digits 小数位数
   * @returns {string} 格式化后的价格
   */
  formatPrice(price, digits = 2) {
    if (price === null || price === undefined) return '0.00'
    return Number(price).toFixed(digits)
  },

  /**
   * 获取库存状态类型
   * @param {number} stock 库存数量
   * @returns {string} 状态类型
   */
  getStockStatusType(stock) {
    if (stock === 0) return 'danger'
    if (stock < 10) return 'warning'
    return 'success'
  },

  /**
   * 获取库存状态文本
   * @param {number} stock 库存数量
   * @returns {string} 状态文本
   */
  getStockStatusText(stock) {
    if (stock === 0) return '缺货'
    if (stock < 10) return '库存紧张'
    return '库存充足'
  },

  /**
   * 检查产品是否可用
   * @param {Object} product 产品信息
   * @returns {boolean} 是否可用
   */
  isProductAvailable(product) {
    return product?.isActive && product?.stock > 0
  },

  /**
   * 生成产品图片URL
   * @param {string} imagePath 图片路径
   * @returns {string} 完整图片URL
   */
  generateImageUrl(imagePath) {
    if (!imagePath) return '/images/default-product.png'
    if (imagePath.startsWith('http')) return imagePath
    return `${process.env.VUE_APP_BASE_API}/images/products/${imagePath}`
  },

  /**
   * 生成产品搜索关键词
   * @param {Object} searchForm 搜索表单
   * @returns {string} 搜索关键词
   */
  generateSearchKeyword(searchForm) {
    const keywords = []
    
    if (searchForm.productName) {
      keywords.push(searchForm.productName.trim())
    }
    
    return keywords.join(' ')
  },

  /**
   * 验证产品数据
   * @param {Object} product 产品数据
   * @returns {Object} 验证结果
   */
  validateProduct(product) {
    const errors = []
    
    if (!product.name || product.name.trim().length === 0) {
      errors.push('产品名称不能为空')
    }
    
    if (!product.price || product.price < 0) {
      errors.push('产品价格必须大于等于0')
    }
    
    if (!product.stock || product.stock < 0) {
      errors.push('产品库存必须大于等于0')
    }
    
    if (!product.categoryId) {
      errors.push('请选择产品分类')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },

  /**
   * 产品排序函数
   * @param {Array} products 产品列表
   * @param {string} sortBy 排序字段
   * @param {string} sortOrder 排序方向
   * @returns {Array} 排序后的产品列表
   */
  sortProducts(products, sortBy, sortOrder) {
    return [...products].sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      // 处理字符串比较
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      // 处理空值
      if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1
      if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1
      
      // 比较
      let result = 0
      if (aValue > bValue) result = 1
      else if (aValue < bValue) result = -1
      
      return sortOrder === 'asc' ? result : -result
    })
  },

  /**
   * 筛选产品
   * @param {Array} products 产品列表
   * @param {Object} filters 筛选条件
   * @returns {Array} 筛选后的产品列表
   */
  filterProducts(products, filters) {
    return products.filter(product => {
      // 关键词筛选
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        if (!product.name.toLowerCase().includes(keyword) &&
            !product.code?.toLowerCase().includes(keyword) &&
            !product.description?.toLowerCase().includes(keyword)) {
          return false
        }
      }
      
      // 分类筛选
      if (filters.categoryId && product.categoryId !== filters.categoryId) {
        return false
      }
      
      // 价格区间筛选
      if (filters.minPrice !== null && product.price < filters.minPrice) {
        return false
      }
      if (filters.maxPrice !== null && product.price > filters.maxPrice) {
        return false
      }
      
      // 库存筛选
      if (filters.stockFilter) {
        switch (filters.stockFilter) {
          case 'inStock':
            if (product.stock <= 0) return false
            break
          case 'lowStock':
            if (product.stock >= 10) return false
            break
          case 'outOfStock':
            if (product.stock > 0) return false
            break
        }
      }
      
      // 状态筛选
      if (filters.statusFilter && product.isActive !== (filters.statusFilter === 'active')) {
        return false
      }
      
      // 标签筛选
      if (filters.tagFilter) {
        switch (filters.tagFilter) {
          case 'hot':
            if (!product.isHot) return false
            break
          case 'new':
            if (!product.isNew) return false
            break
        }
      }
      
      return true
    })
  }
}

/**
 * 产品缓存管理
 */
export const productCache = {
  // 缓存存储
  cache: new Map(),
  
  // 缓存过期时间（毫秒）
  expireTime: 5 * 60 * 1000, // 5分钟
  
  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {any} data 缓存数据
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  },
  
  /**
   * 获取缓存
   * @param {string} key 缓存键
   * @returns {any} 缓存数据
   */
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.expireTime) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  },
  
  /**
   * 清除缓存
   * @param {string} key 缓存键，不传则清除所有缓存
   */
  clear(key) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  },
  
  /**
   * 清除过期缓存
   */
  clearExpired() {
    const now = Date.now()
    for (const [key, item] of this.cache) {
      if (now - item.timestamp > this.expireTime) {
        this.cache.delete(key)
      }
    }
  }
}

// 定期清理过期缓存
setInterval(() => {
  productCache.clearExpired()
}, 60000) // 每分钟清理一次