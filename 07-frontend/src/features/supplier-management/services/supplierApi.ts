/**
 * 供应商管理 API 服务
 */
import request from '@/utils/request'
import type { SupplierListParams, SupplierListResponse, Supplier } from '../types'

const BASE_URL = '/supplier-management'

/**
 * 获取供应商列表
 */
export const getList = (params: SupplierListParams): Promise<SupplierListResponse> => {
  return request.get(BASE_URL, { params })
}

/**
 * 根据ID获取供应商详情
 */
export const getById = (id: number): Promise<Supplier> => {
  return request.get(`${BASE_URL}/${id}`)
}

/**
 * 创建供应商
 */
export const create = (data: Supplier): Promise<Supplier> => {
  return request.post(BASE_URL, data)
}

/**
 * 更新供应商
 */
export const update = (id: number, data: Supplier): Promise<Supplier> => {
  return request.put(`${BASE_URL}/${id}`, data)
}

/**
 * 删除供应商
 */
export const deleteById = (id: number): Promise<void> => {
  return request.delete(`${BASE_URL}/${id}`)
}

/**
 * 批量删除供应商
 */
export const batchDelete = (ids: number[]): Promise<void> => {
  return request.post(`${BASE_URL}/batch-delete`, { ids })
}

/**
 * 导出供应商数据
 */
export const exportData = (params: SupplierListParams): Promise<Blob> => {
  return request.get(`${BASE_URL}/export`, { 
    params, 
    responseType: 'blob' 
  })
}

/**
 * 导入供应商数据
 */
export const importData = (file: File): Promise<any> => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`${BASE_URL}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/**
 * 获取供应商统计数据
 */
export const getStatistics = (): Promise<any> => {
  return request.get(`${BASE_URL}/statistics`)
}
