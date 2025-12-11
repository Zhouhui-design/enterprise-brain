import axios from 'axios'

// 后端API地址 - 使用Vite代理
const API_BASE_URL = '/api'

// 创建axios实例
const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器
request.interceptors.response.use(
  response => response.data,
  error => {
    console.error('草稿箱 API请求失败:', error)
    return Promise.reject(error)
  }
)

// 生产BOM草稿 API
export default {
  // 获取所有草稿
  getAllDrafts() {
    return request.get('/production-bom-drafts/list')
  },

  // 获取单个草稿详情
  getDraftDetail(id) {
    return request.get(`/production-bom-drafts/detail/${id}`)
  },

  // 创建草稿
  createDraft(draftData) {
    return request.post('/production-bom-drafts/create', draftData)
  },

  // 更新草稿
  updateDraft(id, draftData) {
    return request.put(`/production-bom-drafts/update/${id}`, draftData)
  },

  // 删除草稿
  deleteDraft(id) {
    return request.delete(`/production-bom-drafts/delete/${id}`)
  },

  // 批量删除草稿
  batchDeleteDrafts(ids) {
    return request.delete('/production-bom-drafts/batch-delete', { ids })
  }
}
