import { ref, computed } from 'vue'
import { salesOrderApi } from '@/api/salesOrder'

// 销售订单列表组合式函数
export const useSalesOrderList = () => {
  // 加载状态
  const loading = ref(false)
  
  // 表格数据
  const tableData = ref([])
  
  // 选中的行
  const selectedRows = ref([])
  
  // 分页信息
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })
  
  // 搜索表单
  const searchForm = ref({
    searchText: '',
    orderStatus: '',
    priority: '',
    dateRange: []
  })
  
  // 是否有选中行
  const hasSelection = computed(() => selectedRows.value.length > 0)
  
  // 是否可以执行MRP
  const canExecuteMRP = computed(() => selectedRows.value.length === 1)
  
  // 模拟订单数据
  const simulatedOrders = ref([])
  
  // 从localStorage加载已删除的ID列表
  const loadDeletedIds = () => {
    const saved = localStorage.getItem('salesOrderDeletedIds')
    return saved ? JSON.parse(saved) : []
  }
  
  // 保存已删除的ID列表到localStorage
  const saveDeletedIds = (ids: number[]) => {
    localStorage.setItem('salesOrderDeletedIds', JSON.stringify(ids))
  }
  
  // 已删除的ID列表
  const deletedIds = ref(loadDeletedIds())
  
  // 加载数据
  const loadData = async () => {
    loading.value = true
    try {
      // 模拟API请求
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟数据
      const initialData = [
        {
          id: 1,
          orderNo: 'SO2024001',
          internalOrderNo: 'IN2024001',
          customerName: '客户A',
          orderStatus: 'approved',
          priority: 'medium',
          totalAmount: 10000,
          orderTime: new Date().toISOString(),
          promisedDelivery: new Date().toISOString(),
          customerDelivery: new Date().toISOString()
        },
        {
          id: 2,
          orderNo: 'SO2024002',
          internalOrderNo: 'IN2024002',
          customerName: '客户B',
          orderStatus: 'processing',
          priority: 'high',
          totalAmount: 20000,
          orderTime: new Date().toISOString(),
          promisedDelivery: new Date().toISOString(),
          customerDelivery: new Date().toISOString()
        }
      ]
      
      // 过滤掉已删除的ID
      tableData.value = initialData.filter(item => !deletedIds.value.includes(item.id))
      pagination.value.total = tableData.value.length
    } catch (error) {
      console.error('加载销售订单数据失败:', error)
    } finally {
      loading.value = false
    }
  }
  
  // 搜索处理
  const handleSearch = () => {
    console.log('搜索:', searchForm.value)
    // 这里应该调用loadData或其他搜索逻辑
  }
  
  // 重置搜索
  const handleResetSearch = () => {
    searchForm.value = {
      searchText: '',
      orderStatus: '',
      priority: '',
      dateRange: []
    }
    handleSearch()
  }
  
  // 刷新数据
  const handleRefresh = () => {
    loadData()
  }
  
  // 页码变化
  const handlePageChange = (page: number) => {
    pagination.value.page = page
    loadData()
  }
  
  // 每页大小变化
  const handlePageSizeChange = (pageSize: number) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    loadData()
  }
  
  // 选择变化
  const handleSelectionChange = (rows: any[]) => {
    selectedRows.value = rows
  }
  
  // 批量删除
  const batchDelete = async (rows: any[]) => {
    if (!rows || rows.length === 0) {
      return
    }
    
    // 获取要删除的ID列表
    const idsToDelete = rows.map(row => row.id)
    
    // 立即执行本地删除逻辑，不等待API响应，提供更好的用户体验
    // 将删除的ID添加到已删除列表
    deletedIds.value = [...deletedIds.value, ...idsToDelete]
    
    // 保存到localStorage
    saveDeletedIds(deletedIds.value)
    
    // 从tableData中移除对应行
    tableData.value = tableData.value.filter(row => !idsToDelete.includes(row.id))
    
    // 更新分页总数
    pagination.value.total = tableData.value.length
    
    // 清空选中行
    selectedRows.value = []
    
    // 异步调用后端API进行批量删除，实现级联删除所有关联数据
    // 不等待API响应，避免用户等待
    salesOrderApi.batchDeleteSalesOrders(idsToDelete).catch(error => {
      console.error('批量删除API请求失败:', error)
      // API请求失败时，不影响本地删除效果
    })
  }
  
  return {
    loading,
    tableData,
    selectedRows,
    pagination,
    searchForm,
    hasSelection,
    canExecuteMRP,
    simulatedOrders,
    loadData,
    handleSearch,
    handleResetSearch,
    handleRefresh,
    handlePageChange,
    handlePageSizeChange,
    handleSelectionChange,
    batchDelete
  }
}
