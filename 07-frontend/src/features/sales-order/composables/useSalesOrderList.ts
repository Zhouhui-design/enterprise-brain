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
  

  // ✅ 字段映射函数：将后端下划线命名转换为前端驼峰命名
  const mapOrderFields = (order: any) => {
    return {
      // 基础字段 - 根据实际数据库字段映射
      id: order.id,
      internalOrderNo: order.order_number, // 数据库字段是order_number
      customerOrderNo: order.customer_order_no || '', // 暂时为空，数据库中没有这个字段
      customerName: order.customer_name || '未知客户', // 从LEFT JOIN customers表获取
      customerId: order.customer_id,
      salesperson: order.sales_person_name || '未知销售员', // 从LEFT JOIN users表获取
      salespersonId: order.sales_person_id,
      quotationNo: '', // 暂时为空
      orderType: order.order_type || '标准订单',
      
      // 时间字段
      orderTime: order.order_date || order.created_at,
      promisedDelivery: order.promised_delivery || null,
      customerDelivery: order.customer_delivery || null,
      estimatedCompletionDate: order.estimated_completion_date || null,
      
      // 状态字段
      orderStatus: order.status || 'pending',
      status: order.status,
      
      // 优先级
      priority: order.priority || 'normal',
      
      // 部门和配送信息
      salesDepartment: '', // 暂时为空
      deliveryMethod: order.delivery_method || '',
      returnOrderNo: order.return_order_no || '',
      
      // 金额和货币
      orderCurrency: 'CNY', // 默认人民币
      currentExchangeRate: 1.0, // 默认汇率
      taxRate: 13, // 默认税率
      fees: 0,
      totalAmount: order.total_amount || 0,
      totalAmountExcludingTax: order.total_amount_excluding_tax || 0,
      totalTax: order.total_tax || 0,
      
      // 附件和备注
      orderAttachment: '',
      packagingAttachment: '',
      orderNotes: order.customer_notes || order.internal_notes || '',
      
      // 包装信息
      packagingMethod: '',
      packagingRequirements: order.special_requirements || '',
      
      // 收货和账单信息
      consignee: '',
      deliveryAddress: '',
      billRecipient: '',
      billAddress: '',
      
      // 付款信息
      paymentMethod: '',
      advancePaymentRatio: 0,
      advancePaymentAmount: 0,
      plannedPaymentAccount: '',
      totalReceivable: order.total_amount || 0,
      
      // 售后信息
      hasAfterSales: false,
      afterSalesOrderNo: '',
      afterSalesDetails: '',
      
      // 客户联系方式（从customers表获取）
      customerContact: order.customer_contact || '',
      customerPhone: order.customer_phone || '',
      
      // 产品信息字段（暂时为空，数据库中没有这些字段）
      productCode: '',
      productName: '',
      productSpec: '',
      productColor: '',
      productUnit: '',
      orderQuantity: 0,
      unitPriceExcludingTax: 0,
      productTaxRate: 13,
      accessories: '',
      outputProcess: '',
      productSource: '',
      
      // 系统字段
      createdBy: order.created_by || 'admin',
      updatedBy: order.updated_by || '',
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      createTime: order.created_at,
      
      // 提交人
      submitter: order.created_by || order.sales_person_name || 'admin'
    }
  }

  // 加载数据
  const loadData = async () => {
    loading.value = true
    try {
      // 从API获取数据 - 只传递后端支持的参数
      const data = await salesOrderApi.getSalesOrders({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize
        // 暂时不传递搜索条件，因为后端不支持
        // searchForm.value中的dateRange数组会导致500错误
      })
      
      console.log('📥 销售订单API响应:', data)
      
      // 获取原始数据列表
      const rawList = Array.isArray(data.list) ? data.list : Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []
      
      console.log('📋 原始订单数据条数:', rawList.length)
      
      // ✅ 简化处理：产品信息已在主表中，直接映射即可
      // 🔴 关键修复：不再需要额外查询产品明细表，因为产品字段已合并到主表
      const mappedOrders = rawList.map(order => {
        const mappedOrder = mapOrderFields(order)
        console.log('🔄 映射订单:', {
          id: mappedOrder.id,
          productCode: mappedOrder.productCode,
          productName: mappedOrder.productName,
          customerName: mappedOrder.customerName
        })
        return mappedOrder
      })
      
      console.log('✅ 映射后订单数据条数:', mappedOrders.length)
      
      // ✅ 更新表格数据
      tableData.value = mappedOrders
      pagination.value.total = data.total || data.data?.total || mappedOrders.length
      
      console.log('📊 最终表格数据条数:', tableData.value.length)
      console.log('📊 最终总条数:', pagination.value.total)
      
      if (tableData.value.length > 0) {
        console.log('📋 第一条数据示例:', tableData.value[0])
      }
    } catch (error) {
      console.error('❌ 加载销售订单数据失败:', error)
      // 如果API请求失败，显示错误信息
      tableData.value = []
      pagination.value.total = 0
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
      throw new Error('请选择要删除的订单')
    }
    
    // 获取要删除的ID列表
    const idsToDelete = rows.map(row => row.id)
    
    console.log('🔄 开始批量删除操作，删除ID列表:', idsToDelete)
    
    try {
      // 调用后端API进行批量删除
      const response = await salesOrderApi.batchDeleteSalesOrders(idsToDelete)
      
      console.log('✅ 批量删除API响应:', response)
      
      // 重新加载数据以确保数据一致性
      await loadData()
      
      // 清空选中行
      selectedRows.value = []
      
      console.log('🔄 批量删除完成，已重新加载数据')
      
      return response
    } catch (error) {
      console.error('❌ 批量删除失败:', error)
      console.error('📋 错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      throw error
    }
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
