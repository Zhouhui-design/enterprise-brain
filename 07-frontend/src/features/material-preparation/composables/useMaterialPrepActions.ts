/**
 * 备料计划操作业务逻辑
 * 职责：增删改操作
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { materialPrepApi } from '../services/materialPrepApi'
import type { MaterialPreparationPlan } from '../types'

export function useMaterialPrepActions(refreshCallback?: () => void) {
  const processing = ref(false)

  /**
   * 生成备料计划编号
   */
  const generatePlanNo = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `MPP${year}${month}${day}${random}`
  }

  /**
   * 创建
   */
  const create = async (data: MaterialPreparationPlan) => {
    processing.value = true
    try {
      await materialPrepApi.create(data)
      ElMessage.success('创建成功')
      refreshCallback?.()
      return true
    } catch (error) {
      console.error('创建失败:', error)
      ElMessage.error('创建失败')
      return false
    } finally {
      processing.value = false
    }
  }

  /**
   * 更新
   */
  const update = async (id: number, data: MaterialPreparationPlan) => {
    processing.value = true
    try {
      await materialPrepApi.update(id, data)
      ElMessage.success('更新成功')
      refreshCallback?.()
      return true
    } catch (error) {
      console.error('更新失败:', error)
      ElMessage.error('更新失败')
      return false
    } finally {
      processing.value = false
    }
  }

  /**
   * 删除单个
   */
  const deleteOne = async (row: MaterialPreparationPlan) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除备料计划 "${row.planNo}" 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      processing.value = true
      await materialPrepApi.deleteById(row.id!)
      ElMessage.success('删除成功')
      refreshCallback?.()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    } finally {
      processing.value = false
    }
  }

  /**
   * 批量删除
   */
  const batchDelete = async (rows: MaterialPreparationPlan[]) => {
    if (rows.length === 0) {
      ElMessage.warning('请先选择要删除的记录')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除选中的 ${rows.length} 条记录吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      processing.value = true
      const ids = rows.map(row => row.id!)
      await materialPrepApi.batchDelete(ids)
      ElMessage.success('批量删除成功')
      refreshCallback?.()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
        ElMessage.error('批量删除失败')
      }
    } finally {
      processing.value = false
    }
  }

  /**
   * 推送到工序计划
   */
  const pushToProcess = async (row: MaterialPreparationPlan) => {
    processing.value = true
    try {
      await materialPrepApi.pushToProcess(row.id!)
      ElMessage.success('推送成功')
      refreshCallback?.()
    } catch (error) {
      console.error('推送失败:', error)
      ElMessage.error('推送失败')
    } finally {
      processing.value = false
    }
  }

  return {
    processing,
    generatePlanNo,
    create,
    update,
    deleteOne,
    batchDelete,
    pushToProcess
  }
}
