/**
 * 供应商操作管理 Composable
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as supplierApi from '../services/supplierApi'
import type { Supplier } from '../types'

export const useSupplierActions = (refreshCallback: () => void) => {
  const processing = ref(false)

  /**
   * 生成供应商编号
   */
  const generateSupplierCode = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const timestamp = now.getTime().toString().slice(-6)
    return `SUP${year}${timestamp}`
  }

  /**
   * 创建供应商
   */
  const create = async (data: Supplier): Promise<boolean> => {
    processing.value = true
    try {
      // 自动生成供应商编号
      if (!data.supplierCode) {
        data.supplierCode = generateSupplierCode()
      }
      
      await supplierApi.create(data)
      ElMessage.success('创建成功')
      refreshCallback()
      return true
    } catch (error) {
      console.error('创建供应商失败:', error)
      ElMessage.error('创建失败')
      return false
    } finally {
      processing.value = false
    }
  }

  /**
   * 更新供应商
   */
  const update = async (id: number, data: Supplier): Promise<boolean> => {
    processing.value = true
    try {
      await supplierApi.update(id, data)
      ElMessage.success('更新成功')
      refreshCallback()
      return true
    } catch (error) {
      console.error('更新供应商失败:', error)
      ElMessage.error('更新失败')
      return false
    } finally {
      processing.value = false
    }
  }

  /**
   * 删除供应商
   */
  const deleteOne = async (row: Supplier): Promise<void> => {
    try {
      await ElMessageBox.confirm(
        `确定要删除供应商"${row.supplierName}"吗？此操作不可恢复！`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      processing.value = true
      await supplierApi.deleteById(row.id!)
      ElMessage.success('删除成功')
      refreshCallback()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除供应商失败:', error)
        ElMessage.error('删除失败')
      }
    } finally {
      processing.value = false
    }
  }

  /**
   * 批量删除供应商
   */
  const batchDelete = async (rows: Supplier[]): Promise<void> => {
    if (rows.length === 0) {
      ElMessage.warning('请先选择要删除的供应商')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${rows.length} 个供应商吗？此操作不可恢复！`,
        '批量删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      processing.value = true
      const ids = rows.map(row => row.id!).filter(id => id !== undefined)
      await supplierApi.batchDelete(ids)
      ElMessage.success(`成功删除 ${ids.length} 个供应商`)
      refreshCallback()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('批量删除供应商失败:', error)
        ElMessage.error('批量删除失败')
      }
    } finally {
      processing.value = false
    }
  }

  /**
   * 导出数据
   */
  const exportData = async (params: any): Promise<void> => {
    processing.value = true
    try {
      const blob = await supplierApi.exportData(params)
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `供应商管理_${new Date().getTime()}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      ElMessage.success('导出成功')
    } catch (error) {
      console.error('导出数据失败:', error)
      ElMessage.error('导出失败')
    } finally {
      processing.value = false
    }
  }

  /**
   * 导入数据
   */
  const importData = async (file: File): Promise<boolean> => {
    processing.value = true
    try {
      const response = await supplierApi.importData(file)
      ElMessage.success(response.message || '导入成功')
      refreshCallback()
      return true
    } catch (error) {
      console.error('导入数据失败:', error)
      ElMessage.error('导入失败')
      return false
    } finally {
      processing.value = false
    }
  }

  return {
    processing,
    generateSupplierCode,
    create,
    update,
    deleteOne,
    batchDelete,
    exportData,
    importData
  }
}
