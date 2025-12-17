/**
 * 仓库管理列表数据处理Composable
 * 负责数据加载、分页、搜索、筛选等逻辑
 */
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { warehouseApi } from '@/api/warehouse'

// 真实API接口
const api = warehouseApi



export function useWarehouseList() {
  // ========== 响应式数据 ==========
  const loading = ref(false)
  const tableData = ref([])
  const selectedRows = ref([])
  
  // 分页数据
  const pagination = reactive({
    page: 1,
    pageSize: 20,
    total: 0
  })
  
  // 搜索表单
  const searchForm = reactive({
    name: '',
    code: '',
    status: '',
    type: '',
    manager: '',
    region: ''
  })
  
  // ========== 计算属性 ==========
  const hasSelection = computed(() => selectedRows.value.length > 0)
  
  // ========== 数据加载方法 ==========
  const loadData = async () => {
    loading.value = true
    try {
      const params = {
        ...searchForm,
        page: pagination.page,
        pageSize: pagination.pageSize
      }
      
      const response = await api.getWarehouseList(params)
      
      tableData.value = response.data || []
      pagination.total = response.total || 0
      
      console.log('✅ 仓库数据加载成功:', {
        当前页: response.page,
        每页条数: response.pageSize,
        总数: response.total,
        实际数据: tableData.value.length
      })
    } catch (error) {
      console.error('❌ 仓库数据加载失败:', error)
      ElMessage.error('加载数据失败，请重试')
      tableData.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }
  
  // ========== 搜索和筛选方法 ==========
  const handleSearch = () => {
    pagination.page = 1
    loadData()
  }
  
  const handleResetSearch = () => {
    Object.assign(searchForm, {
      name: '',
      code: '',
      status: '',
      type: '',
      manager: '',
      region: ''
    })
    pagination.page = 1
    loadData()
  }
  
  const handleRefresh = () => {
    loadData()
  }
  
  // ========== 分页方法 ==========
  const handlePageChange = (page) => {
    pagination.page = page
    loadData()
  }
  
  const handlePageSizeChange = (pageSize) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    loadData()
  }
  
  // ========== 选择方法 ==========
  const handleSelectionChange = (selection) => {
    selectedRows.value = selection
  }
  
  // ========== 删除方法 ==========
  const deleteWarehouse = async (id) => {
    try {
      const response = await api.deleteWarehouse(id)
      if (response.success) {
        ElMessage.success('删除成功')
        await loadData() // 重新加载数据
        return true
      }
      return false
    } catch (error) {
      console.error('❌ 删除仓库失败:', error)
      ElMessage.error('删除失败，请重试')
      return false
    }
  }
  
  const batchDeleteWarehouses = async (ids) => {
    try {
      const response = await api.batchDeleteWarehouses(ids)
      if (response.success) {
        ElMessage.success(`成功删除 ${response.deleted} 个仓库`)
        await loadData() // 重新加载数据
        selectedRows.value = [] // 清空选择
        return true
      }
      return false
    } catch (error) {
      console.error('❌ 批量删除仓库失败:', error)
      ElMessage.error('批量删除失败，请重试')
      return false
    }
  }
  
  return {
    // 响应式数据
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
    handleSelectionChange,
    deleteWarehouse,
    batchDeleteWarehouses
  }
}