
/**
 * 供应商评价API服务
 * 职责：封装所有与供应商评价相关的API调用
 */
import request from '@/utils/request'
import type { SupplierEvaluation, EvaluationListParams, EvaluationListResponse } from '../types'

class SupplierEvaluationApi {
  private readonly basePath = '/supplier-evaluations'

  /**
   * 获取列表
   */
  async getList(params: EvaluationListParams): Promise<EvaluationListResponse> {
    const response = await request.get(this.basePath, params)
    console.log('🔍 供应商评价API原始响应:', response)
    
    // 处理后端返回格式
    if (response.data && response.data.records) {
      return response.data
    } else if (response.records) {
      return response
    } else {
      return response.data || response
    }
  }

  /**
   * 获取详情
   */
  async getById(id: number): Promise<SupplierEvaluation> {
    const response = await request.get(`${this.basePath}/${id}`)
    return response.data || response
  }

  /**
   * 创建
   */
  async create(data: SupplierEvaluation): Promise<SupplierEvaluation> {
    const response = await request.post(this.basePath, data)
    return response.data || response
  }

  /**
   * 更新
   */
  async update(id: number, data: SupplierEvaluation): Promise<void> {
    const response = await request.put(`${this.basePath}/${id}`, data)
    return response.data || response
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
  async batchDelete(ids: number[]): Promise<void> {
    return request.post(`${this.basePath}/batch-delete`, { ids })
  }

  /**
   * 导出
   */
  async export(params: any): Promise<void> {
    return request.get(`${this.basePath}/export`, params, {
      responseType: 'blob'
    })
  }
}

// 导出单例
export const supplierEvaluationApi = new SupplierEvaluationApi()
