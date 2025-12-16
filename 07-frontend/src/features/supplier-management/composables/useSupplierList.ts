/**
 * 供应商列表管理 Composable
 */
import { ref, reactive, computed } from 'vue'
import * as supplierApi from '../services/supplierApi'
import type { Supplier, SearchForm } from '../types'

export const useSupplierList = () => {
  // 状态
  const loading = ref(false)
  const tableData = ref<Supplier[]>([])
  const selectedRows = ref<Supplier[]>([])
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })
  
  // 搜索表单
  const searchForm = reactive<SearchForm>({
    supplierCode: '',
    supplierName: '',
    supplierType: '',
    status: '',
    creditRating: ''
  })

  // 计算属性
  const hasSelection = computed(() => selectedRows.value.length > 0)

  /**
   * 加载数据
   */
  const loadData = async () => {
    loading.value = true
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...searchForm
      }
      
      const response = await supplierApi.getList(params)
      tableData.value = response.records || []
      pagination.total = response.total || 0
    } catch (error) {
      console.error('加载供应商列表失败:', error)
      tableData.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索
   */
  const handleSearch = () => {
    pagination.page = 1
    loadData()
  }

  /**
   * 重置搜索
   */
  const handleResetSearch = () => {
    searchForm.supplierCode = ''
    searchForm.supplierName = ''
    searchForm.supplierType = ''
    searchForm.status = ''
    searchForm.creditRating = ''
    handleSearch()
  }

  /**
   * 刷新
   */
  const handleRefresh = () => {
    loadData()
  }

  /**
   * 分页变化
   */
  const handlePageChange = (page: number) => {
    pagination.page = page
    loadData()
  }

  /**
   * 每页大小变化
   */
  const handlePageSizeChange = (size: number) => {
    pagination.pageSize = size
    pagination.page = 1
    loadData()
  }

  /**
   * 选择变化
   */
  const handleSelectionChange = (selection: Supplier[]) => {
    selectedRows.value = selection
  }

  return {
    // 状态
    loading,
    tableData,
    selectedRows,
    pagination,
    searchForm,
    
    // 计算属性
    hasSelection,
    
    // 方法
    loadData,
    handleSearch,
    handleResetSearch,
    handleRefresh,
    handlePageChange,
    handlePageSizeChange,
    handleSelectionChange
  }
}
