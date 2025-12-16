/**
 * 供应商评价列表业务逻辑
 * 职责：管理列表数据的获取、分页、搜索、刷新
 */
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { supplierEvaluationApi } from '../services/supplierEvaluationApi'
import { DEFAULT_PAGE_SIZE } from '../constants'
import type { SupplierEvaluation, SearchForm } from '../types'

export function useSupplierEvaluationList() {
  // 状态
  const loading = ref(false)
  const tableData = ref<SupplierEvaluation[]>([])
  const selectedRows = ref<SupplierEvaluation[]>([])

  // 分页
  const pagination = reactive({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  })

  // 搜索表单
  const searchForm = reactive<SearchForm>({
    evaluationNo: '',
    supplierName: '',
    evaluationDateRange: null,
    evaluationLevel: ''
  })

  // 计算属性：是否有选中行
  const hasSelection = computed(() => selectedRows.value.length > 0)

  /**
   * 加载数据
   */
  const loadData = async () => {
    loading.value = true
    try {
      const params: any = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        evaluationNo: searchForm.evaluationNo,
        supplierName: searchForm.supplierName,
        evaluationLevel: searchForm.evaluationLevel
      }

      // 处理日期范围
      if (searchForm.evaluationDateRange && searchForm.evaluationDateRange.length === 2) {
        params.evaluationDateStart = searchForm.evaluationDateRange[0]
        params.evaluationDateEnd = searchForm.evaluationDateRange[1]
      }

      const data = await supplierEvaluationApi.getList(params)
      
      console.log('📋 供应商评价API响应:', data)
      tableData.value = data.records || []
      pagination.total = data.total || 0
      
      ElMessage.success(`数据加载成功，共${data.records?.length || 0}条记录`)
    } catch (error) {
      console.error('加载数据失败:', error)
      ElMessage.error('加载数据失败')
      tableData.value = []
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
    searchForm.evaluationNo = ''
    searchForm.supplierName = ''
    searchForm.evaluationDateRange = null
    searchForm.evaluationLevel = ''
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

  const handlePageSizeChange = (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    loadData()
  }

  /**
   * 选择变化
   */
  const handleSelectionChange = (rows: SupplierEvaluation[]) => {
    selectedRows.value = rows
  }

  return {
    // 状态
    loading,
    tableData,
    selectedRows,
    pagination,
    searchForm,
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
