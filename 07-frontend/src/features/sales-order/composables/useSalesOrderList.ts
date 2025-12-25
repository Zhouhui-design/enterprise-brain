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
      // 基础字段
      id: order.id,
      internalOrderNo: order.internal_order_no || order.internalOrderNo,
      customerOrderNo: order.customer_order_no || order.customerOrderNo,
      customerName: order.customer_name || order.customerName,
      customerId: order.customer_id || order.customerId,
      salesperson: order.salesperson,
      quotationNo: order.quotation_no || order.quotationNo,
      orderType: order.order_type || order.orderType,
      
      // 时间字段
      orderTime: order.order_time || order.orderTime,
      promisedDelivery: order.promised_delivery || order.promisedDelivery,
      customerDelivery: order.customer_delivery || order.customerDelivery,
      estimatedCompletionDate: order.estimated_completion_date || order.estimatedCompletionDate,
      
      // 状态字段
      orderStatus: order.status || order.orderStatus,
      status: order.status,
      
      // 部门和配送信息
      salesDepartment: order.sales_department || order.salesDepartment,
      deliveryMethod: order.delivery_method || order.deliveryMethod,
      returnOrderNo: order.return_order_no || order.returnOrderNo,
      
      // 金额和货币
      orderCurrency: order.order_currency || order.orderCurrency,
      currentExchangeRate: order.current_exchange_rate || order.currentExchangeRate,
      taxRate: order.tax_rate || order.taxRate,
      fees: order.fees,
      totalAmount: order.total_amount || order.totalAmount,
      totalAmountExcludingTax: order.total_amount_excluding_tax || order.totalAmountExcludingTax,
      totalTax: order.total_tax || order.totalTax,
      
      // 附件和备注
      orderAttachment: order.order_attachment || order.orderAttachment,
      packagingAttachment: order.packaging_attachment || order.packagingAttachment,
      orderNotes: order.order_notes || order.orderNotes,
      
      // 包装信息
      packagingMethod: order.packaging_method || order.packagingMethod,
      packagingRequirements: order.packaging_requirements || order.packagingRequirements,
      
      // 收货和账单信息
      consignee: order.consignee,
      deliveryAddress: order.delivery_address || order.deliveryAddress,
      billRecipient: order.bill_recipient || order.billRecipient,
      billAddress: order.bill_address || order.billAddress,
      
      // 付款信息
      paymentMethod: order.payment_method || order.paymentMethod,
      advancePaymentRatio: order.advance_payment_ratio || order.advancePaymentRatio,
      advancePaymentAmount: order.advance_payment_amount || order.advancePaymentAmount,
      plannedPaymentAccount: order.planned_payment_account || order.plannedPaymentAccount,
      totalReceivable: order.total_receivable || order.totalReceivable,
      
      // 售后信息
      hasAfterSales: order.has_after_sales || order.hasAfterSales,
      afterSalesOrderNo: order.after_sales_order_no || order.afterSalesOrderNo,
      afterSalesDetails: order.after_sales_details || order.afterSalesDetails,
      
      // 🆕 产品信息字段（直接从主表读取，无需再查询产品明细表）
      productCode: order.product_code || order.productCode,
      productName: order.product_name || order.productName,
      productSpec: order.product_spec || order.productSpec,
      productColor: order.product_color || order.productColor,
      productUnit: order.product_unit || order.productUnit,
      orderQuantity: order.order_quantity || order.orderQuantity,
      unitPriceExcludingTax: order.unit_price_excluding_tax || order.unitPriceExcludingTax,
      productTaxRate: order.product_tax_rate || order.productTaxRate,
      accessories: order.accessories,
      outputProcess: order.output_process || order.outputProcess,
      productSource: order.product_source || order.productSource,
      
      // 系统字段
      createdBy: order.created_by || order.createdBy,
      updatedBy: order.updated_by || order.updatedBy,
      createdAt: order.created_at || order.createdAt,
      updatedAt: order.updated_at || order.updatedAt,
      createTime: order.created_at || order.createdAt || order.createTime,
      
      // 提交人
      submitter: order.created_by || order.submitter || order.createdBy
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
      return
    }
    
    // 获取要删除的ID列表
    const idsToDelete = rows.map(row => row.id)
    
    try {
      // 调用后端API进行批量删除
      await salesOrderApi.batchDeleteSalesOrders(idsToDelete)
      
      // 从tableData中移除对应行
      tableData.value = tableData.value.filter(row => !idsToDelete.includes(row.id))
      
      // 更新分页总数
      pagination.value.total = tableData.value.length
      
      // 清空选中行
      selectedRows.value = []
    } catch (error) {
      console.error('批量删除失败:', error)
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
