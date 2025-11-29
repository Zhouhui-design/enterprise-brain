// 工具函数 - 报价相关
import { ElMessage, ElMessageBox } from 'element-plus'
import { Quotation, QuotationItem } from '@/api/quotation'

/**
 * 格式化金额显示
 */
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '¥0.00'
  
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

/**
 * 格式化日期显示
 */
export const formatDate = (date: string | Date, format: 'date' | 'datetime' | 'time' = 'date'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return '-'
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  
  if (format === 'datetime') {
    Object.assign(options, {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (format === 'time') {
    delete options.year
    delete options.month
    delete options.day
    Object.assign(options, {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return dateObj.toLocaleString('zh-CN', options)
}

/**
 * 计算报价有效期状态
 */
export const getQuotationValidityStatus = (validUntil: string): {
  isValid: boolean
  daysLeft: number
  status: 'valid' | 'expiring' | 'expired'
  statusText: string
  statusColor: string
} => {
  const validDate = new Date(validUntil)
  const today = new Date()
  const daysLeft = Math.ceil((validDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  let status: 'valid' | 'expiring' | 'expired' = 'valid'
  let statusText = '有效'
  let statusColor = '#48BB78'
  
  if (daysLeft < 0) {
    status = 'expired'
    statusText = '已过期'
    statusColor = '#F56565'
  } else if (daysLeft <= 7) {
    status = 'expiring'
    statusText = `${daysLeft}天后过期`
    statusColor = '#ED8936'
  }
  
  return {
    isValid: daysLeft >= 0,
    daysLeft,
    status,
    statusText,
    statusColor
  }
}

/**
 * 获取报价状态文本和样式
 */
export const getQuotationStatusInfo = (status: string): {
  text: string
  color: string
  bgColor: string
  icon: string
} => {
  const statusMap = {
    draft: {
      text: '草稿',
      color: '#718096',
      bgColor: '#E2E8F0',
      icon: 'fas fa-edit'
    },
    pending_review: {
      text: '待审核',
      color: '#D69E2F',
      bgColor: '#FEF5E7',
      icon: 'fas fa-clock'
    },
    reviewing: {
      text: '审核中',
      color: '#3182CE',
      bgColor: '#EBF4FF',
      icon: 'fas fa-search'
    },
    reviewed: {
      text: '已审核',
      color: '#38A169',
      bgColor: '#F0F9FF',
      icon: 'fas fa-check-double'
    },
    pending_approval: {
      text: '待审批',
      color: '#D69E2F',
      bgColor: '#FEF5E7',
      icon: 'fas fa-user-clock'
    },
    approved: {
      text: '已审批',
      color: '#38B2AC',
      bgColor: '#E6FFFA',
      icon: 'fas fa-check-circle'
    },
    rejected: {
      text: '已拒绝',
      color: '#F56565',
      bgColor: '#FED7E7',
      icon: 'fas fa-times-circle'
    },
    cancelled: {
      text: '已取消',
      color: '#718096',
      bgColor: '#E2E8F0',
      icon: 'fas fa-ban'
    },
    completed: {
      text: '已完成',
      color: '#48BB78',
      bgColor: '#F0FFF4',
      icon: 'fas fa-check-square'
    }
  }
  
  return statusMap[status] || statusMap.draft
}

/**
 * 获取优先级信息
 */
export const getPriorityInfo = (priority: string): {
  text: string
  color: string
  bgColor: string
  icon: string
  weight: number
} => {
  const priorityMap = {
    low: {
      text: '低',
      color: '#38B2AC',
      bgColor: '#E6FFFA',
      icon: 'fas fa-flag',
      weight: 1
    },
    medium: {
      text: '中',
      color: '#ED8936',
      bgColor: '#FEF5E7',
      icon: 'fas fa-flag',
      weight: 2
    },
    high: {
      text: '高',
      color: '#F56565',
      bgColor: '#FED7E7',
      icon: 'fas fa-flag',
      weight: 3
    }
  }
  
  return priorityMap[priority] || priorityMap.medium
}

/**
 * 计算报价项目总金额
 */
export const calculateQuotationItemTotal = (item: QuotationItem): number => {
  const subtotal = item.quantity * item.unitPrice
  const discount = subtotal * (item.discountRate / 100)
  return subtotal - discount
}

/**
 * 计算报价总金额
 */
export const calculateQuotationTotal = (items: QuotationItem[]): {
  subtotal: number
  totalDiscount: number
  total: number
} => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  const totalDiscount = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice
    return sum + (itemTotal * (item.discountRate / 100))
  }, 0)
  
  return {
    subtotal,
    totalDiscount,
    total: subtotal - totalDiscount
  }
}

/**
 * 生成报价编号
 */
export const generateQuotationNumber = (): string => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const timestamp = now.getTime().toString().slice(-4)
  
  return `QT${year}${month}${day}${timestamp}`
}

/**
 * 验证报价数据完整性
 */
export const validateQuotationData = (quotation: Partial<Quotation>): {
  isValid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (!quotation.customerId) {
    errors.push('请选择客户')
  }
  
  if (!quotation.contactPerson?.trim()) {
    errors.push('请填写联系人')
  }
  
  if (!quotation.contactPhone?.trim()) {
    errors.push('请填写联系电话')
  }
  
  if (!quotation.validDays || quotation.validDays < 1) {
    errors.push('有效期必须大于0天')
  }
  
  if (!quotation.items || quotation.items.length === 0) {
    errors.push('请添加报价项目')
  } else {
    quotation.items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`第${index + 1}行：请选择产品`)
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`第${index + 1}行：数量必须大于0`)
      }
      
      if (!item.unitPrice || item.unitPrice <= 0) {
        errors.push(`第${index + 1}行：单价必须大于0`)
      }
      
      if (item.discountRate < 0 || item.discountRate >= 100) {
        errors.push(`第${index + 1}行：折扣率必须在0-99%之间`)
      }
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 确认对话框
 */
export const confirmAction = async (
  title: string,
  message: string,
  type: 'warning' | 'info' | 'success' | 'error' = 'warning',
  confirmButtonText: string = '确认',
  cancelButtonText: string = '取消'
): Promise<boolean> => {
  try {
    await ElMessageBox.confirm(message, title, {
      confirmButtonText,
      cancelButtonText,
      type,
      confirmButtonClass: 'el-button--primary'
    })
    return true
  } catch {
    return false
  }
}

/**
 * 下载文件
 */
export const downloadFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * 复制到剪贴板
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制到剪贴板')
    return true
  } catch (error) {
    console.error('Failed to copy text: ', error)
    ElMessage.error('复制失败')
    return false
  }
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

/**
 * 深拷贝对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  const clonedObj = {} as T
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }
  
  return clonedObj
}

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成颜色根据状态
 */
export const getStatusColor = (status: string): string => {
  const colorMap = {
    draft: '#718096',
    pending_review: '#D69E2F',
    reviewing: '#3182CE',
    reviewed: '#38A169',
    pending_approval: '#D69E2F',
    approved: '#38B2AC',
    rejected: '#F56565',
    cancelled: '#718096',
    completed: '#48BB78'
  }
  
  return colorMap[status] || '#718096'
}

/**
 * 验证手机号码
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证邮箱地址
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 格式化金额输入
 */
export const formatAmountInput = (value: string): string => {
  // 移除非数字和小数点之外的字符
  let formatted = value.replace(/[^\d.]/g, '')
  
  // 确保只有一个小数点
  const parts = formatted.split('.')
  if (parts.length > 2) {
    formatted = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // 限制小数点后两位
  if (parts.length === 2 && parts[1].length > 2) {
    formatted = parts[0] + '.' + parts[1].substring(0, 2)
  }
  
  return formatted
}