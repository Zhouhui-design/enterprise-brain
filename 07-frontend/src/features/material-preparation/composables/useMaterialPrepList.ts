/**
 * 备料计划列表业务逻辑
 * 职责：管理列表数据的获取、分页、搜索、刷新
 */
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { materialPrepApi } from '../services/materialPrepApi'
import { DEFAULT_PAGE_SIZE } from '../constants'
import type { MaterialPreparationPlan, SearchForm } from '../types'

export function useMaterialPrepList() {
  // 状态
  const loading = ref(false)
  const tableData = ref<MaterialPreparationPlan[]>([])
  const selectedRows = ref<MaterialPreparationPlan[]>([])

  // 分页
  const pagination = reactive({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0
  })

  // 搜索表单
  const searchForm = reactive<SearchForm>({
    planNo: '',
    sourcePlanNo: '',
    materialCode: '',
    demandDateRange: null
  })

  // 计算属性：是否有选中行
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
        planNo: searchForm.planNo,
        sourcePlanNo: searchForm.sourcePlanNo,
        materialCode: searchForm.materialCode
      }

      // 处理日期范围
      if (searchForm.demandDateRange && searchForm.demandDateRange.length === 2) {
        params.demandDateStart = searchForm.demandDateRange[0]
        params.demandDateEnd = searchForm.demandDateRange[1]
      }

      const data = await materialPrepApi.getList(params)
      
      tableData.value = data.records || []
      pagination.total = data.total || 0
      
      ElMessage.success('数据加载成功')
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
    searchForm.planNo = ''
    searchForm.sourcePlanNo = ''
    searchForm.materialCode = ''
    searchForm.demandDateRange = null
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
  const handleSelectionChange = (rows: MaterialPreparationPlan[]) => {
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
