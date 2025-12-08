import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'

// 创建axios实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 添加token
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }

    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const { data } = response

    // 如果是文件下载等二进制数据
    if (response.config.responseType === 'blob') {
      return response
    }

    // API返回格式统一处理
    if (data.code === 200) {
      return data.data || data
    } else if (data.code === 401) {
      // token过期，跳转登录页
      ElMessageBox.confirm(
        '登录状态已过期，请重新登录',
        '系统提示',
        {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        removeToken()
        window.location.href = '/login'
      })
      return Promise.reject(new Error('登录状态已过期'))
    } else {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  error => {
    let message = '网络错误'

    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          message = data.message || '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          removeToken()
          window.location.href = '/login'
          break
        case 403:
          message = '拒绝访问'
          break
        case 404:
          message = '请求地址不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        default:
          message = `请求失败: ${status}`
      }
    } else if (error.code === 'ECONNABORTED') {
      message = '请求超时'
    } else if (error.message) {
      message = error.message
    }

    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 请求方法封装
const request = {
  get(url, params = {}, config = {}) {
    return service({
      url,
      method: 'get',
      params,
      ...config
    })
  },

  post(url, data = {}, config = {}) {
    return service({
      url,
      method: 'post',
      data,
      ...config
    })
  },

  put(url, data = {}, config = {}) {
    return service({
      url,
      method: 'put',
      data,
      ...config
    })
  },

  delete(url, params = {}, config = {}) {
    return service({
      url,
      method: 'delete',
      params,
      ...config
    })
  },

  patch(url, data = {}, config = {}) {
    return service({
      url,
      method: 'patch',
      data,
      ...config
    })
  },

  // 文件上传
  upload(url, formData, config = {}) {
    return service({
      url,
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      ...config
    })
  },

  // 文件下载
  download(url, params = {}, filename = '') {
    return service({
      url,
      method: 'get',
      params,
      responseType: 'blob'
    }).then(response => {
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || `download-${Date.now()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  }
}

export default request