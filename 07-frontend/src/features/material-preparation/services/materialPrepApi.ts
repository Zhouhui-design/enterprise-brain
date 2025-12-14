/**
 * 备料计划API服务
 * 职责：封装所有与后端的HTTP通信
 */
import request from '@/utils/request'
import type {
  MaterialPreparationPlan,
  MaterialPrepListParams,
  MaterialPrepListResponse
} from '../types'

class MaterialPreparationApi {
  private readonly basePath = '/material-preparation-plans'

  /**
   * 获取列表
   */
  async getList(params: MaterialPrepListParams): Promise<MaterialPrepListResponse> {
    const response = await request.get(this.basePath, params)
    console.log('🔍 API原始响应:', response)
    
    // 处理后端返回格式：{ code: 200, data: { records: [...], total: 7 }, message: '...' }
    if (response.data && response.data.records) {
      return response.data
    }
    // 如果响应直接包含records，直接返回
    else if (response.records) {
      return response
    }
    // 否则包装成标准格式
    else {
      return response.data || response
    }
  }

  /**
   * 获取详情
   */
  async getById(id: number): Promise<MaterialPreparationPlan> {
    return request.get(`${this.basePath}/${id}`)
  }

  /**
   * 创建
   */
  async create(data: MaterialPreparationPlan): Promise<MaterialPreparationPlan> {
    const response = await request.post(this.basePath, data)
    return response.data || response
  }

  /**
   * 更新
   */
  async update(id: number, data: MaterialPreparationPlan): Promise<void> {
    const response = await request.put(`${this.basePath}/${id}`, data)
    return response.data || response
  }

  /**
   * 删除单个
   */
  async deleteById(id: number): Promise<void> {
    const response = await request.delete(`${this.basePath}/${id}`)
    return response.data || response
  }

  /**
   * 批量删除
   */
  async batchDelete(ids: number[]): Promise<{ successCount: number; totalCount: number }> {
    const response = await request.delete(`${this.basePath}/batch/delete`, { ids })
    return response.data || response
  }

  /**
   * 推送到工序计划
   */
  async pushToProcess(id: number): Promise<any> {
    const response = await request.post(`${this.basePath}/${id}/push-to-process`)
    return response.data || response
  }
}

// 导出单例
export const materialPrepApi = new MaterialPreparationApi()
