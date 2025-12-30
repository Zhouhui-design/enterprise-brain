<template>
  <div class="simulation-material-requirements-container">
    <!-- 使用标准表格页面组件 -->
    <StandardTablePage
      page-title="模拟物料需求明细"
      settings-key="simulation-material-requirements"
      
      :table-data="filteredTableData"
      :columns="tableColumns"
      :loading="loading"
      :total="pagination.total"
      :current-page="pagination.page"
      :page-size="pagination.pageSize"
      
      :show-search="true"
      :show-selection="true"
      :show-filter="true"
      :show-pagination="true"
      :show-export="true"
      
      @page-change="handlePageChange"
      @size-change="handlePageSizeChange"
      @selection-change="handleSelectionChange"
      @refresh="handleRefresh"
      @export="handleExport"
    >
      <!-- 空状态显示 -->
      <template #empty>
        <el-empty
          v-if="!hasSimulationData"
          description="暂无模拟排程数据"
        >
          <template #description>
            <p>暂无模拟排程数据，请先在模拟排程列表中推送销售订单</p>
            <p style="font-size: 12px; color: #909399; margin-top: 8px;">
              注意：只有满足以下条件的模拟排程才会生成物料需求明细：
            </p>
            <ul style="font-size: 12px; color: #909399; text-align: left; margin-top: 8px; padding-left: 20px;">
              <li>客户交期不为空</li>
              <li>产品编号不为空</li>
              <li>建议补货数量不为空且大于0</li>
            </ul>
          </template>
          <el-button type="primary" @click="goToSimulationScheduling">
            前往模拟排程
          </el-button>
        </el-empty>
        <el-empty
          v-else
          description="暂无物料需求数据"
        >
          <el-button type="primary" @click="handleRefresh">
            重新计算
          </el-button>
        </el-empty>
      </template>
      
      <!-- 订单状态列插槽 -->
      <template #orderStatus="{ row }">
        <el-tag :type="getStatusType(row.orderStatus)">
          {{ row.orderStatus || '-' }}
        </el-tag>
      </template>
      
      <!-- 当前工序列插槽 -->
      <template #currentProcess="{ row }">
        <el-tag 
          :type="row.currentProcess === '采购' ? 'warning' : 'info'"
          size="small"
        >
          {{ row.currentProcess || '-' }}
        </el-tag>
      </template>
      
      <!-- 操作列插槽 -->
      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleView(row)">
          查看
        </el-button>
      </template>
      
      <!-- 自定义工具栏插槽 -->
      <template #toolbar-right>
        <el-button 
          type="success" 
          size="small" 
          @click="handleRefresh"
          :loading="refreshing"
        >
          <el-icon><Refresh /></el-icon>
          重新计算
        </el-button>
        <el-button 
          type="warning" 
          size="small" 
          @click="handleExport"
        >
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </template>
    </StandardTablePage>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="物料需求明细详情"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="selectedRow" class="detail-content">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="物料需求明细编号">
            {{ selectedRow.requirement_detail_no }}
          </el-descriptions-item>
          <el-descriptions-item label="序号">
            {{ selectedRow.sequence_number }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(selectedRow.orderStatus)">
              {{ selectedRow.orderStatus }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="内部销售订单编号">
            {{ selectedRow.internal_sales_order_no }}
          </el-descriptions-item>
          <el-descriptions-item label="客户交期">
            {{ formatDate(selectedRow.customer_delivery_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="产品编号">
            {{ selectedRow.product_code }}
          </el-descriptions-item>
          <el-descriptions-item label="产品名称">
            {{ selectedRow.product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="建议补货数量">
            {{ formatNumber(selectedRow.suggested_replenishment_qty) }}
          </el-descriptions-item>
          <el-descriptions-item label="层阶地址">
            <el-tag v-if="selectedRow.level_address === '9999999'" type="danger">
              无生产BOM
            </el-tag>
            <span v-else>{{ selectedRow.level_address }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="0阶BOM编号">
            {{ selectedRow.level0_bom_code }}
          </el-descriptions-item>
          <el-descriptions-item label="层阶-0阶标准用量">
            {{ formatNumber(selectedRow.level_standard_qty) }}
          </el-descriptions-item>
          <el-descriptions-item label="0阶BOM编号数量">
            {{ formatNumber(selectedRow.level0_bom_quantity) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前工序">
            <el-tag 
              :type="selectedRow.current_process === '采购' ? 'warning' : 'info'"
              size="small"
            >
              {{ selectedRow.current_process }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前物料编号">
            {{ selectedRow.current_material_code }}
          </el-descriptions-item>
          <el-descriptions-item label="当前物料名称">
            {{ selectedRow.current_material_name }}
          </el-descriptions-item>
          <el-descriptions-item label="当前0阶标准用量">
            {{ formatNumber(selectedRow.current_level0_standard_qty) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前需求数量">
            {{ formatNumber(selectedRow.current_required_qty) }}
          </el-descriptions-item>
          <el-descriptions-item label="可用库存">
            {{ formatNumber(selectedRow.available_inventory) }}
          </el-descriptions-item>
          <el-descriptions-item label="按顺序总需">
            {{ formatNumber(selectedRow.total_required_by_order) }}
          </el-descriptions-item>
          <el-descriptions-item label="还需数量">
            <el-tag 
              :type="selectedRow.still_needed_qty > 0 ? 'danger' : 'success'"
              size="small"
            >
              {{ formatNumber(selectedRow.still_needed_qty) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计划采购日期">
            {{ formatDate(selectedRow.planned_purchase_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="需求天数">
            {{ selectedRow.requirement_days || 0 }} 天
          </el-descriptions-item>
          <el-descriptions-item label="预计回厂日期">
            {{ formatDate(selectedRow.estimated_return_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="后道产品层阶地址">
            {{ selectedRow.downstream_level_address }}
          </el-descriptions-item>
          <el-descriptions-item label="后道工序名称">
            {{ selectedRow.downstream_process_name }}
          </el-descriptions-item>
          <el-descriptions-item label="后道工序产品编号">
            {{ selectedRow.downstream_product_code }}
          </el-descriptions-item>
          <el-descriptions-item label="后道工序产品名称">
            {{ selectedRow.downstream_product_name }}
          </el-descriptions-item>
          <el-descriptions-item label="后道0阶标准用量">
            {{ formatNumber(selectedRow.downstream_level0_standard_qty) }}
          </el-descriptions-item>
          <el-descriptions-item label="后道需求数量">
            {{ formatNumber(selectedRow.downstream_required_qty) }}
          </el-descriptions-item>
          <el-descriptions-item label="后道可用库存">
            {{ formatNumber(selectedRow.downstream_available_inventory) }}
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ formatDateTime(selectedRow.submit_time) }}
          </el-descriptions-item>
          <el-descriptions-item label="是否继续排程">
            <el-tag :type="selectedRow.continue_scheduling ? 'success' : 'info'" size="small">
              {{ selectedRow.continue_scheduling ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="后道产品来源">
            {{ selectedRow.downstream_product_source }}
          </el-descriptions-item>
          <el-descriptions-item label="来源编号">
            {{ selectedRow.source_no }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'

// 路由管理
const router = useRouter()

// 状态管理
const loading = ref(false)
const refreshing = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const hasSimulationData = ref(false)
const showDetailDialog = ref(false)
const selectedRow = ref(null)

// 分页参数
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = ref({
  search: '',
  internalSalesOrderNo: '',
  productCode: '',
  currentMaterialCode: ''
})

// ========== 计算属性 ==========
const hasSelection = computed(() => selectedRows.value && selectedRows.value.length > 0)

// ========== 表头模糊搜索 ==========
const columnSearchValues = ref({})

// 筛选后的表格数据
const filteredTableData = computed(() => {
  let data = [...tableData.value]
  
  Object.keys(columnSearchValues.value).forEach(prop => {
    const searchValue = columnSearchValues.value[prop]
    if (searchValue && searchValue.trim()) {
      data = data.filter(row => {
        const cellValue = row[prop]
        if (cellValue === null || cellValue === undefined) return false
        return String(cellValue)
          .toLowerCase()
          .includes(searchValue.toLowerCase().trim())
      })
    }
  })
  
  return data
})

// ========== 表格列配置 ==========
const defaultColumns = [
  { prop: 'sequence_number', label: '序号', width: 80, filterable: false },
  { prop: 'requirement_detail_no', label: '物料需求明细编号', width: 150, filterable: true },
  { prop: 'order_status', label: '订单状态', width: 100, filterable: true },
  { prop: 'internal_sales_order_no', label: '内部销售订单编号', width: 150, filterable: true },
  { prop: 'customer_delivery_date', label: '客户交期', width: 120, filterable: true },
  { prop: 'product_code', label: '产品编号', width: 120, filterable: true },
  { prop: 'product_name', label: '产品名称', width: 180, filterable: true },
  { prop: 'suggested_replenishment_qty', label: '建议补货数量', width: 120, filterable: false },
  { prop: 'level_address', label: '层阶地址', width: 120, filterable: true },
  { prop: 'level0_bom_code', label: '0阶BOM编号', width: 120, filterable: true },
  { prop: 'level_standard_qty', label: '层阶-0阶标准用量', width: 140, filterable: false },
  { prop: 'level0_bom_quantity', label: '0阶BOM编号数量', width: 140, filterable: false },
  { prop: 'current_process', label: '当前工序', width: 100, filterable: true },
  { prop: 'current_level_address', label: '当前层阶地址', width: 140, filterable: true },
  { prop: 'current_material_code', label: '当前物料编号', width: 130, filterable: true },
  { prop: 'current_material_name', label: '当前物料名称', width: 180, filterable: true },
  { prop: 'current_level0_standard_qty', label: '当前0阶标准用量', width: 140, filterable: false },
  { prop: 'current_required_qty', label: '当前需求数量', width: 120, filterable: false },
  { prop: 'available_inventory', label: '可用库存', width: 100, filterable: false },
  { prop: 'total_required_by_order', label: '按顺序总需', width: 120, filterable: false },
  { prop: 'still_needed_qty', label: '还需数量', width: 100, filterable: false },
  { prop: 'planned_purchase_date', label: '计划采购日期', width: 120, filterable: true },
  { prop: 'requirement_days', label: '需求天数', width: 80, filterable: false },
  { prop: 'estimated_return_date', label: '预计回厂日期', width: 120, filterable: true },
  { prop: 'downstream_level_address', label: '后道产品层阶地址', width: 150, filterable: true },
  { prop: 'downstream_process_name', label: '后道工序名称', width: 120, filterable: true },
  { prop: 'downstream_product_code', label: '后道工序产品编号', width: 150, filterable: true },
  { prop: 'downstream_product_name', label: '后道工序产品名称', width: 180, filterable: true },
  { prop: 'downstream_level0_standard_qty', label: '后道0阶标准用量', width: 140, filterable: false },
  { prop: 'downstream_required_qty', label: '后道需求数量', width: 120, filterable: false },
  { prop: 'downstream_available_inventory', label: '后道可用库存', width: 120, filterable: false },
  { prop: 'submit_time', label: '提交时间', width: 160, filterable: true },
  { prop: 'continue_scheduling', label: '是否继续排程', width: 100, filterable: true },
  { prop: 'downstream_product_source', label: '后道产品来源', width: 120, filterable: true },
  { prop: 'source_no', label: '来源编号', width: 120, filterable: true }
]

const columnConfigs = ref(defaultColumns.map((col, index) => ({
  ...col,
  visible: true,
  order: index
})))

const visibleColumns = computed(() => {
  return [...columnConfigs.value].sort((a, b) => a.order - b.order)
})

const tableColumns = computed(() => {
  return visibleColumns.value.map(col => {
    const columnConfig = {
      prop: col.prop,
      label: col.label,
      width: col.width,
      fixed: ['sequence_number', 'requirement_detail_no', 'current_material_code'].includes(col.prop) ? 'left' : undefined,
      align: ['suggested_replenishment_qty', 'level_standard_qty', 'level0_bom_quantity', 'current_level0_standard_qty', 'current_required_qty', 'available_inventory', 'total_required_by_order', 'still_needed_qty', 'downstream_level0_standard_qty', 'downstream_required_qty', 'downstream_available_inventory', 'requirement_days'].includes(col.prop) ? 'right' : undefined,
      formatter: formatColumnValue,
      filterable: col.filterable,
      sortable: false
    }
    
    // 添加特殊列的插槽配置
    if (['order_status', 'current_process'].includes(col.prop)) {
      columnConfig.slot = col.prop
    }
    
    return columnConfig
  })
})

// ========== 数据获取逻辑 ==========
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...searchForm.value
    }

    const response = await fetch('/api/simulation-material-requirements?' + new URLSearchParams(params))
    const result = await response.json()
    
    if (result.success) {
      tableData.value = result.data.list || []
      pagination.value.total = result.data.total || 0
      hasSimulationData.value = result.data.hasSimulationData || false
    } else {
      // 被动数据接收类型，不显示"获取数据失败"错误
      console.warn('物料需求数据获取失败:', result.message)
      tableData.value = []
      pagination.value.total = 0
      hasSimulationData.value = false
    }
  } catch (error) {
    // 被动数据接收类型，不显示"获取数据失败"错误
    console.warn('物料需求数据获取异常:', error)
    tableData.value = []
    pagination.value.total = 0
    hasSimulationData.value = false
  } finally {
    loading.value = false
  }
}

// ========== 事件监听 ==========
const handleSimulationSchedulingUpdate = async (event) => {
  console.log('📥 接收到模拟排程更新事件，重新计算物料需求:', event.detail)
  
  // 延迟执行，确保模拟排程数据已保存
  setTimeout(() => {
    loadData()
  }, 1000)
}

// ========== 页面生命周期 ==========
onMounted(() => {
  // 页面加载时不自动获取数据，等待事件触发
  console.log('📋 模拟物料需求明细页面已加载，等待模拟排程数据推送...')
  
  // 监听模拟排程数据推送事件
  window.addEventListener('simulation-scheduling-data-pushed', handleSimulationSchedulingUpdate)
})

onUnmounted(() => {
  window.removeEventListener('simulation-scheduling-data-pushed', handleSimulationSchedulingUpdate)
})

// ========== 事件处理 ==========
const handleSearch = () => {
  pagination.value.page = 1
  loadData()
}

const handleRefresh = async () => {
  try {
    refreshing.value = true
    const response = await fetch('/api/simulation-material-requirements/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    const result = await response.json()
    
    if (result.success) {
      ElMessage.success(`重新计算完成，生成 ${result.data.calculatedCount || 0} 条物料需求明细`)
      await loadData()
    } else {
      ElMessage.error(result.message || '重新计算失败')
    }
  } catch (error) {
    console.error('重新计算失败:', error)
    ElMessage.error('重新计算失败')
  } finally {
    refreshing.value = false
  }
}

const handlePageChange = (page) => {
  pagination.value.page = page
  loadData()
}

const handlePageSizeChange = (pageSize) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleView = (row) => {
  selectedRow.value = row
  showDetailDialog.value = true
}

const handleExport = () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  // 导出逻辑
  ElMessage.success('导出功能开发中...')
}

const goToSimulationScheduling = () => {
  router.push('/sales/simulation-scheduling/list')
}

// ========== 工具函数 ==========
const getStatusType = (status) => {
  const statusMap = {
    '待下单': 'warning',
    '已模拟排程待下单': 'info',
    '草稿': 'info',
    '待审核': 'primary',
    '已审核': 'success',
    '生产中': 'primary',
    '已发货': 'success',
    '已完成': 'success',
    '已取消': 'danger',
    '手动终止': 'danger'
  }
  return statusMap[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return '-'
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch {
    return '-'
  }
}

const formatNumber = (num) => {
  if (num === null || num === undefined) return '-'
  const parsed = parseFloat(num)
  if (isNaN(parsed)) return '-'
  return parsed.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatColumnValue = (row, column, cellValue, index) => {
  // 只有null和undefined才显示'-'，0和''等falsy值应该正常显示
  if (cellValue === null || cellValue === undefined) return '-'
  
  // 检查column是否存在，避免undefined错误
  if (!column || !column.property) {
    return String(cellValue)
  }
  
  // 日期格式化
  if (['customer_delivery_date', 'planned_purchase_date', 'estimated_return_date', 'submit_time', 'created_at', 'updated_at'].includes(column.property)) {
    try {
      const date = new Date(cellValue)
      if (isNaN(date.getTime())) return '-'
      if (['submit_time'].includes(column.property)) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day} ${hours}:${minutes}`
      } else {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
    } catch {
      return '-'
    }
  }
  
  // 数字列格式化
  if (['suggested_replenishment_qty', 'level_standard_qty', 'level0_bom_quantity', 'current_level0_standard_qty', 'current_required_qty', 'available_inventory', 'total_required_by_order', 'still_needed_qty', 'downstream_level0_standard_qty', 'downstream_required_qty', 'downstream_available_inventory', 'requirement_days'].includes(column.property)) {
    const num = parseFloat(cellValue)
    if (isNaN(num)) return '-'
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  
  // 特殊层阶地址处理
  if (column.property === 'level_address' && cellValue === '9999999') {
    return '无生产BOM'
  }
  
  // 默认处理：转换为字符串
  return String(cellValue)
}
</script>

<style scoped lang="scss">
.simulation-material-requirements-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.detail-content {
  max-height: 60vh;
  overflow-y: auto;
}
</style>