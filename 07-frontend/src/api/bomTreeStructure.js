import axios from 'axios'

const BASE_URL = 'http://localhost:3005/api/bom-tree-structures'

export const bomTreeStructureApi = {
  // 生成BOM树结构
  generateTreeStructure(bomData) {
    return axios.post(`${BASE_URL}/generate`, { bomData })
  },
  
  // 获取BOM树结构
  getTreeStructure(bomCode) {
    return axios.get(`${BASE_URL}/${bomCode}`)
  },
  
  // 获取所有BOM树结构列表
  getAllTreeStructures() {
    return axios.get(BASE_URL)
  },
  
  // 删除BOM树结构
  deleteTreeStructure(bomCode) {
    return axios.delete(`${BASE_URL}/${bomCode}`)
  }
}

export default bomTreeStructureApi
