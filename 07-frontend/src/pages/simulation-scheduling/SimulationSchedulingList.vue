<template>
  <div class="simulation-scheduling-container">
    <!-- 使用标准表格页面组件 -->
    <StandardTablePage
      page-title="模拟排程列表"
      settings-key="simulation-scheduling-list"
      
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
      :show-batch-delete="true"
      :show-export="false"
      
      @page-change="handlePageChange"
      @size-change="handlePageSizeChange"
      @selection-change="handleSelectionChange"
      @refresh="handleRefresh"
      @batch-delete="handleBatchDelete"
    >
      <!-- 搜索表单插槽 -->
      <template #search-form>
        <div class="search-bar">
          <el-form :model="searchForm" inline size="small">
            <el-form-item label="搜索">
              <el-input 
                v-model="searchForm.search" 
                placeholder="模拟排程号、内部销售订单编号..." 
                clearable
                style="width: 280px"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="模拟排程状态">
              <el-select 
                v-model="searchForm.simulationStatus" 
                placeholder="全部" 
                clearable
                style="width: 150px"
              >
                <el-option label="全部" value="" />
                <el-option label="待开发" value="待开发" />
                <el-option label="进行中" value="进行中" />
                <el-option label="已完成" value="已完成" />
              </el-select>
            </el-form-item>
            <el-form-item label="产品编号">
              <el-input 
                v-model="searchForm.productCode" 
                placeholder="请输入产品编号" 
                clearable
                style="width: 160px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="内部销售订单编号">
              <el-input 
                v-model="searchForm.internalSalesOrderNo" 
                placeholder="请输入订单编号" 
                clearable
                style="width: 180px"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleResetSearch">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>
      
      <!-- 自定义工具栏插槽 -->
      <template #toolbar-right>
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button 
          type="success" 
          size="small" 
          @click="handleBatchEdit"
          :disabled="!hasSelection"
        >
          <el-icon><Edit /></el-icon>
          批量编辑
        </el-button>
        <el-button 
          type="warning" 
          size="small" 
          @click="handleStatusUpdate"
          :disabled="!hasSelection"
        >
          <el-icon><Refresh /></el-icon>
          更新状态
        </el-button>
        <el-button size="small" @click="showSettings = true">
          <el-icon><Setting /></el-icon>
          页面设置
        </el-button>
      </template>
      
      <!-- 筛选提示插槽 -->
      <template #filter-tip>
        <el-alert 
          type="info" 
          :closable="false" 
          style="margin: 0 0 15px"
        >
          表头筛选模式：每列标题下方有搜索框，支持模糊查询，筛选作用于所有{{ pagination.total }}条数据
        </el-alert>
      </template>
      
      <!-- 模拟排程状态列插槽 -->
      <template #simulationStatus="{ row }">
        <el-tag :type="getStatusType(row.simulationStatus)">
          {{ row.simulationStatus || '-' }}
        </el-tag>
      </template>
      
      <!-- 序号列插槽 -->
      <template #sequenceNumber="{ row }">
        {{ row.sequenceNumber || '-' }}
      </template>
      
      <!-- 操作列插槽 -->
      <template #operation="{ row }">
        <el-button link type="primary" size="small" @click="handleView(row)">
          查看
        </el-button>
        <el-button link type="primary" size="small" @click="handleEdit(row)">
          编辑
        </el-button>
        <el-button link type="danger" size="small" @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </StandardTablePage>

    <!-- 页面设置对话框 -->
    <PageSettingsDialog
      v-model="showSettings"
      :business-variables="businessVariables"
      :workflow-configs="workflowConfigs"
      :code-rules="codeRules"
      :column-configs="columnConfigs"
      @add-var="addBusinessVariable"
      @remove-var="removeBusinessVariable"
      @save-vars="saveBusinessVariables"
      @add-workflow="addWorkflowConfig"
      @remove-workflow="removeWorkflowConfig"
      @save-workflows="saveWorkflowConfigs"
      @add-code-rule="addCodeRule"
      @remove-code-rule="removeCodeRule"
      @save-code-rules="saveCodeRules"
      @update-code-example="updateCodeExample"
      @reorder-columns="reorderColumns"
      @save-columns="saveColumnConfigs"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { 
  Plus, Edit, Refresh, Setting, Search
} from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import StandardTablePage from '@/components/common/layout/StandardTablePage.vue'
import PageSettingsDialog from '@/features/material-preparation/components/PageSettingsDialog.vue'

// ========== 状态管理 ==========
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  search: '',
  simulationStatus: '',
  productCode: '',
  internalSalesOrderNo: ''
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
  { prop: 'sequenceNumber', label: '序号', width: 80, filterable: false },
  { prop: 'simulationNo', label: '模拟排程号', width: 160, filterable: true },
  { prop: 'simulationStatus', label: '模拟排程状态', width: 120, filterable: true },
  { prop: 'orderStatus', label: '订单状态', width: 100, filterable: true },
  { prop: 'internalSalesOrderNo', label: '内部销售订单编号', width: 180, filterable: true },
  { prop: 'customerDeliveryDate', label: '客户交期', width: 120, filterable: true },
  { prop: 'estimatedCompletionDate', label: '预计完成日期', width: 140, filterable: true },
  { prop: 'productCode', label: '产品编号', width: 140, filterable: true },
  { prop: 'productName', label: '产品名称', width: 180, filterable: true },
  { prop: 'orderQuantity', label: '订单数量', width: 100, filterable: false },
  { prop: 'realtimeInventory', label: '实时库存', width: 100, filterable: false },
  { prop: 'effectiveInventory', label: '有效库存', width: 100, filterable: false },
  { prop: 'suggestedReplenishmentQty', label: '建议补货数量', width: 120, filterable: false },
  { prop: 'productSource', label: '产品来源', width: 100, filterable: true },
  { prop: 'outputProcess', label: '产出工序', width: 120, filterable: true },
  { prop: 'waitingNumber', label: '等待序数', width: 100, filterable: false },
  { prop: 'submitter', label: '提交人', width: 100, filterable: true },
  { prop: 'submitTime', label: '提交时间', width: 160, filterable: true },
  { prop: 'createdAt', label: '创建时间', width: 160, filterable: true },
  { prop: 'updatedAt', label: '更新时间', width: 160, filterable: true }
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
    // 基础配置
    const columnConfig = {
      prop: col.prop,
      label: col.label,
      width: col.width,
      fixed: ['sequenceNumber', 'simulationNo', 'simulationStatus'].includes(col.prop) ? 'left' : undefined,
      align: ['orderQuantity', 'realtimeInventory', 'effectiveInventory', 'suggestedReplenishmentQty', 'waitingNumber'].includes(col.prop) ? 'right' : undefined,
      formatter: formatColumnValue,
      filterable: col.filterable,
      sortable: false
    }
    
    // 添加特殊列的插槽配置
    if (['simulationStatus', 'sequenceNumber'].includes(col.prop)) {
      columnConfig.slot = col.prop
    }
    
    return columnConfig
  })
})

// ========== 页面设置 ==========
const showSettings = ref(false)

// 页面设置相关数据和方法
const businessVariables = ref([])
const workflowConfigs = ref([])
const codeRules = ref([])

// 业务变量操作
const addBusinessVariable = () => {
  businessVariables.value.push({
    name: '',
    value: '',
    description: ''
  })
}

const removeBusinessVariable = (index) => {
  businessVariables.value.splice(index, 1)
}

const saveBusinessVariables = () => {
  // TODO: 保存业务变量到后端
  ElMessage.success('业务变量保存成功')
}

// 流程配置操作
const addWorkflowConfig = () => {
  workflowConfigs.value.push({
    buttonName: '',
    approvers: [],
    description: ''
  })
}

const removeWorkflowConfig = (index) => {
  workflowConfigs.value.splice(index, 1)
}

const saveWorkflowConfigs = () => {
  // TODO: 保存流程配置到后端
  ElMessage.success('流程配置保存成功')
}

// 编码规则操作
const addCodeRule = () => {
  codeRules.value.push({
    fieldName: '',
    prefix: '',
    dateFormat: 'YYYYMMDD',
    serialLength: 4,
    example: ''
  })
}

const removeCodeRule = (index) => {
  codeRules.value.splice(index, 1)
}

const saveCodeRules = () => {
  // TODO: 保存编码规则到后端
  ElMessage.success('编码规则保存成功')
}

const updateCodeExample = (rule) => {
  // 生成示例编码
  const now = new Date()
  let dateStr = ''
  switch (rule.dateFormat) {
    case 'YYYYMMDD':
      dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0')
      break
    case 'YYYYMM':
      dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0')
      break
    case 'YYYY':
      dateStr = now.getFullYear().toString()
      break
    default:
      dateStr = 'YYYYMMDD'
  }
  
  const serial = '1'.padStart(rule.serialLength, '0')
  rule.example = `${rule.prefix}${dateStr}${serial}`
}

// 列配置操作
const reorderColumns = (newColumns) => {
  columnConfigs.value = newColumns.map((col, index) => ({
    ...col,
    order: index
  }))
}

const saveColumnConfigs = () => {
  // TODO: 保存列配置到后端
  ElMessage.success('列配置保存成功')
}

// ========== API调用 ==========
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }

    const response = await fetch(`/api/simulation-scheduling?${new URLSearchParams(params)}`)
    const result = await response.json()
    
    if (result.success) {
      tableData.value = result.data.list
      pagination.total = result.data.total
    } else {
      ElMessage.error(result.message || '加载数据失败')
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// ========== 事件处理 ==========
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: '',
    simulationStatus: '',
    productCode: '',
    internalSalesOrderNo: ''
  })
  Object.assign(columnSearchValues.value, {})
  pagination.page = 1
  loadData()
}

const handleRefresh = () => {
  loadData()
}

const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleCreate = () => {
  // TODO: 实现新增模拟排程功能
  ElMessage.info('新增功能开发中...')
}

const handleView = (row) => {
  // TODO: 实现查看详情功能
  ElMessage.info('查看详情功能开发中...')
}

const handleEdit = (row) => {
  // TODO: 实现编辑功能
  ElMessage.info('编辑功能开发中...')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模拟排程号 ${row.simulationNo} 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await fetch(`/api/simulation-scheduling/${row.id}`, {
      method: 'DELETE'
    })

    const result = await response.json()
    
    if (result.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleBatchDelete = async () => {
  if (!selectedRows.value || selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedRows.value.map(row => row.id)
    const response = await fetch('/api/simulation-scheduling/batch', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    })

    const result = await response.json()
    
    if (result.success) {
      ElMessage.success(`成功删除 ${result.data.deletedCount} 条记录`)
      loadData()
    } else {
      ElMessage.error(result.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

const handleBatchEdit = () => {
  // TODO: 实现批量编辑功能
  ElMessage.info('批量编辑功能开发中...')
}

const handleStatusUpdate = () => {
  // TODO: 实现状态更新功能
  ElMessage.info('状态更新功能开发中...')
}

// ========== 工具函数 ==========
const getStatusType = (status) => {
  const statusMap = {
    '待开发': 'warning',
    '进行中': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

const formatColumnValue = (row, column, cellValue, index) => {
  // 只有null和undefined才显示'-'，0和''等falsy值应该正常显示
  if (cellValue === null || cellValue === undefined) return '-'
  
  // 检查column是否存在，避免undefined错误
  if (!column || !column.property) {
    return String(cellValue)
  }
  
  // 日期格式化
  if (['customerDeliveryDate', 'estimatedCompletionDate', 'submitTime', 'createdAt', 'updatedAt'].includes(column.property)) {
    try {
      const date = new Date(cellValue)
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
  
  // 数字列格式化
  if (['sequenceNumber', 'orderQuantity', 'realtimeInventory', 'effectiveInventory', 'suggestedReplenishmentQty', 'waitingNumber'].includes(column.property)) {
    const num = Number(cellValue)
    if (isNaN(num)) return '-'
    return num.toLocaleString('zh-CN')
  }
  
  // 默认处理：转换为字符串
  return String(cellValue)
}

// ========== 数据推送事件处理 ==========
const handleDataPushed = (event) => {
  console.log('?? 接收到模拟排程数据推送:', event.detail)
  loadData()
}

// ========== 初始化 ==========
onMounted(() => {
  // 页面加载时不自动获取数据，等待用户从销售订单页面推送数据
  console.log('📋 模拟排程列表页面已加载，等待数据推送...')
  
  // 添加数据推送监听器
  window.addEventListener('simulation-scheduling-data-pushed', handleDataPushed)
})

// ========== 清理工作 ==========
onUnmounted(() => {
  // 移除事件监听器，防止内存泄漏
  window.removeEventListener('simulation-scheduling-data-pushed', handleDataPushed)
  console.log('🧹 模拟排程列表页面事件监听器已清理')
})
</script>

<style scoped lang="scss">
.simulation-scheduling-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.search-bar {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 4px;
}

// 表头搜索样式
.table-header-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 0;
  
  .header-label {
    font-weight: 600;
    color: #303133;
    font-size: 13px;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .header-search {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #dcdfe6 inset;
      
      &:hover {
        box-shadow: 0 0 0 1px #c0c4cc inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 1px #409eff inset !important;
      }
    }
    
    :deep(.el-input__inner) {
      font-size: 12px;
      height: 26px;
      line-height: 26px;
    }
    
    :deep(.el-input__prefix) {
      font-size: 12px;
    }
  }
}
</style>