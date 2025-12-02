import axios from 'axios'

// 后端API地址 - 支持局域网访问
// 使用Vite代理，所有API请求都通过前端服务器代理到后端
// 这样笔记本电脑只需要访问前端服务器（3001端口），无需直接访问后端（3005端口）
const API_BASE_URL = '/api'

// 调试日志
console.log('使用Vite代理模式')
console.log('API_BASE_URL:', API_BASE_URL)

// 创建axios实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API请求失败:', error)
    return Promise.reject(error)
  }
)

// 物料API
export default {
  // 获取所有物料
  getAllMaterials() {
    return request.get('/materials/list')
  },

  // 创建物料
  createMaterial(materialData) {
    return request.post('/materials/create', materialData)
  },

  // 批量创建物料
  batchCreateMaterials(materialsData) {
    return request.post('/materials/batch-create', materialsData)
  },

  // 更新物料
  updateMaterial(id, materialData) {
    return request.put(`/materials/update/${id}`, materialData)
  },

  // 删除物料
  deleteMaterial(id) {
    return request.delete(`/materials/delete/${id}`)
  },

  // 批量删除物料
  batchDeleteMaterials(ids) {
    return request.delete('/materials/batch-delete', { data: { ids } })
  },

  // 搜索物料
  searchMaterials(keyword) {
    return request.get('/materials/search', { params: { keyword } })
  }
}
