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
    return request.get(this.basePath, params)
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
    return request.post(this.basePath, data)
  }

  /**
   * 更新
   */
  async update(id: number, data: MaterialPreparationPlan): Promise<void> {
    return request.put(`${this.basePath}/${id}`, data)
  }

  /**
   * 删除单个
   */
  async deleteById(id: number): Promise<void> {
    return request.delete(`${this.basePath}/${id}`)
  }

  /**
   * 批量删除
   */
  async batchDelete(ids: number[]): Promise<{ successCount: number; totalCount: number }> {
    return request.delete(`${this.basePath}/batch/delete`, { ids })
  }

  /**
   * 推送到工序计划
   */
  async pushToProcess(id: number): Promise<any> {
    return request.post(`${this.basePath}/${id}/push-to-process`)
  }
}

// 导出单例
export const materialPrepApi = new MaterialPreparationApi()
