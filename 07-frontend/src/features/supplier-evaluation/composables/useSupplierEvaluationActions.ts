/**
 * 供应商评价操作业务逻辑
 * 职责：增删改操作、评分计算
 */
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supplierEvaluationApi } from '../services/supplierEvaluationApi'
import { SCORE_WEIGHTS, LEVEL_RULES } from '../constants'
import type { SupplierEvaluation } from '../types'

export function useSupplierEvaluationActions(refreshCallback?: () => void) {
  const processing = ref(false)

  /**
   * 生成评价编号
   */
  const generateEvaluationNo = (): string => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `EVAL${year}${month}${day}${random}`
  }

  /**
   * 计算总得分（根据权重）
   */
  const calculateTotalScore = (data: SupplierEvaluation): number => {
    const { quality, delivery, price, service } = SCORE_WEIGHTS
    return (
      data.qualityScore * quality +
      data.deliveryScore * delivery +
      data.priceScore * price +
      data.serviceScore * service
    )
  }

  /**
   * 计算评价等级
   */
  const calculateEvaluationLevel = (totalScore: number): string => {
    if (totalScore >= LEVEL_RULES.A.min) return 'A'
    if (totalScore >= LEVEL_RULES.B.min) return 'B'
    if (totalScore >= LEVEL_RULES.C.min) return 'C'
    return 'D'
  }

  /**
   * 创建
   */
  const create = async (data: SupplierEvaluation) => {
    processing.value = true
    try {
      // 自动计算总分和等级
      data.totalScore = calculateTotalScore(data)
      data.evaluationLevel = calculateEvaluationLevel(data.totalScore)
      
      await supplierEvaluationApi.create(data)
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
  const update = async (id: number, data: SupplierEvaluation) => {
    processing.value = true
    try {
      // 重新计算总分和等级
      data.totalScore = calculateTotalScore(data)
      data.evaluationLevel = calculateEvaluationLevel(data.totalScore)
      
      await supplierEvaluationApi.update(id, data)
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
  const deleteOne = async (row: SupplierEvaluation) => {
    try {
      await ElMessageBox.confirm(
        `确定要删除评价编号 "${row.evaluationNo}" 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      processing.value = true
      await supplierEvaluationApi.deleteById(row.id!)
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
  const batchDelete = async (rows: SupplierEvaluation[]) => {
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
      const ids = rows.map(row => row.id!).filter(id => id !== undefined)
      await supplierEvaluationApi.batchDelete(ids)
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

  return {
    processing,
    generateEvaluationNo,
    calculateTotalScore,
    calculateEvaluationLevel,
    create,
    update,
    deleteOne,
    batchDelete
  }
}
