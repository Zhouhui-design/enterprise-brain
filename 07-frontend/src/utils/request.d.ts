import type { AxiosRequestConfig, AxiosResponse } from 'axios'

interface RequestInstance {
  get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | T>
  delete<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | T>
  upload<T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T> | T>
  download(url: string, params?: any, filename?: string): Promise<void>
}

declare const request: RequestInstance

export default request