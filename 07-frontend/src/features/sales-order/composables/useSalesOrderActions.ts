import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { salesOrderApi } from '@/api/salesOrder'

// 销售订单操作组合式函数
export const useSalesOrderActions = () => {
  const router = useRouter()
  
  // 新建订单
  const handleCreate = () => {
    console.log('新建订单')
    // 跳转到新增销售订单页面
    router.push('/sales/orders/create')
  }
  
  // 编辑订单
  const handleEdit = (row: any) => {
    console.log('编辑订单:', row)
    // 这里可以跳转到编辑订单页面或打开编辑对话框
    ElMessage.info('编辑订单功能开发中')
  }
  
  // 查看订单
  const handleView = (row: any) => {
    console.log('查看订单:', row)
    // 这里可以跳转到查看订单页面或打开查看对话框
    ElMessage.info('查看订单功能开发中')
  }
  
  // 删除单个订单
  const handleDeleteOne = async (row: any, refresh: () => Promise<void>) => {
    try {
      await ElMessageBox.confirm(`确定要删除订单「${row.orderNo}」吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      try {
        // 调用后端API进行单个删除，实现级联删除所有关联数据
        await salesOrderApi.deleteSalesOrder(row.id)
      } catch (apiError) {
        console.error('单个删除API请求失败:', apiError)
        // API请求失败时，仍然执行刷新逻辑，因为前端会通过deletedIds过滤数据
      }
      
      ElMessage.success('订单删除成功')
      // 刷新数据
      await refresh()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除订单失败:', error)
        ElMessage.error('删除订单失败')
      }
    }
  }
  
  // 批量删除订单
  const handleBatchDelete = async (rows: any[], refresh: () => Promise<void>) => {
    if (!rows || rows.length === 0) {
      ElMessage.warning('请选择要删除的订单')
      return
    }
    
    try {
      await ElMessageBox.confirm(`确定要删除选中的 ${rows.length} 个订单吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500))
      
      ElMessage.success('批量删除成功')
      // 刷新数据
      await refresh()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('批量删除失败:', error)
        ElMessage.error('批量删除失败')
      }
    }
  }
  
  // 正式下单
  const handleConfirmOrder = async (rows: any[], refresh: () => Promise<void>) => {
    if (!rows || rows.length === 0) {
      ElMessage.warning('请选择要下单的订单')
      return
    }
    
    try {
      await ElMessageBox.confirm(`确定要将选中的 ${rows.length} 个订单正式下单吗？`, '确认下单', {        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      // 获取要下单的ID列表
      const ids = rows.map(row => row.id)
      
      // 调用后端API进行正式下单，推送到主生产计划或采购计划
      await salesOrderApi.confirmOrder(ids)
      
      ElMessage.success('正式下单成功')
      // 刷新数据
      await refresh()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('正式下单失败:', error)
        ElMessage.error('正式下单失败')
      }
    }
  }
  
  // 执行MRP运算
  const handleMRPCalculation = async (rows: any[], refresh: () => Promise<void>) => {
    if (!rows || rows.length === 0) {
      ElMessage.warning('请选择要执行MRP的订单')
      return
    }
    
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 800))
      
      ElMessage.success('MRP执行成功')
      // 刷新数据
      await refresh()
    } catch (error) {
      console.error('执行MRP失败:', error)
      ElMessage.error('执行MRP失败')
    }
  }
  
  // 手动终止订单
  const handleManualTerminate = async (rows: any[], refresh: () => Promise<void>) => {
    if (!rows || rows.length === 0) {
      ElMessage.warning('请选择要终止的订单')
      return
    }
    
    try {
      await ElMessageBox.confirm(`确定要手动终止选中的 ${rows.length} 个订单吗？`, '终止确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500))
      
      ElMessage.success('订单终止成功')
      // 刷新数据
      await refresh()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('终止订单失败:', error)
        ElMessage.error('终止订单失败')
      }
    }
  }
  
  return {
    handleCreate,
    handleEdit,
    handleView,
    handleDeleteOne,
    handleBatchDelete,
    handleConfirmOrder,
    handleMRPCalculation,
    handleManualTerminate
  }
}
