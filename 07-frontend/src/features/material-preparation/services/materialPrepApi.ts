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
    
    // ✅ 修复：request.js已经解包，返回的直接是 { list: [], total: 0 }
    // 需要转换为前端期望的 { records: [], total: 0 }
    if (response.list) {
      console.log('✅ 转换数据格式: list → records')
      return {
        records: response.list,
        total: response.total || 0
      }
    }
    // 如果响应直接包含records，直接返回
    else if (response.records) {
      console.log('✅ 已是records格式，直接返回')
      return response
    }
    // 兼容旧格式：{ data: { list: [] } }
    else if (response.data && response.data.list) {
      console.log('✅ 转换旧格式: data.list → records')
      return {
        records: response.data.list,
        total: response.data.total || 0
      }
    }
    // 否则包装成标准格式
    else {
      console.warn('⚠️  未知响应格式，使用默认转换')
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
