<template>
  <div class="mrp-plan-approve-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>MRP计划审核</h2>
        <p class="subtitle">审核MRP运算结果，调整物料需求计划</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleBatchApprove" :disabled="!hasSelection">
          <el-icon><Select /></el-icon>
          批量审核通过
        </el-button>
        <el-button type="danger" @click="handleBatchReject" :disabled="!hasSelection">
          <el-icon><Close /></el-icon>
          批量驳回
        </el-button>
        <el-button type="danger" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="pageSettingsVisible = true">
          <el-icon><Setting /></el-icon>
          页面设置
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-panel">
      <el-form :inline="true" :model="filterForm" size="default">
        <el-form-item label="运算批次">
          <el-select v-model="filterForm.batchNo" placeholder="请选择运算批次" clearable style="width: 200px;">
            <el-option 
              v-for="batch in batchList" 
              :key="batch.batchNo" 
              :label="batch.batchNo"
              :value="batch.batchNo"
            >
              <span style="float: left">{{ batch.batchNo }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ batch.runTime }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 150px;">
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料编号">
          <el-input v-model="filterForm.materialCode" placeholder="输入物料编号" clearable style="width: 200px;" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计信息 -->
    <div class="statistics-panel">
      <div class="stat-item">
        <div class="stat-label">待审核</div>
        <div class="stat-value pending">{{ statistics.pending }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">已通过</div>
        <div class="stat-value approved">{{ statistics.approved }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">已驳回</div>
        <div class="stat-value rejected">{{ statistics.rejected }}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">总计划数</div>
        <div class="stat-value">{{ statistics.total }}</div>
      </div>
    </div>

    <!-- 主表格 -->
    <div class="table-container">
      <EnhancedTable
        ref="tableRef"
        :data="filteredTableData"
        :columns="tableColumns"
        :loading="loading"
        :height="tableHeight"
        :show-toolbar="true"
        :show-add="false"
        :show-batch-delete="true"
        :show-export="true"
        :show-import="false"
        :show-print="true"
        :show-selection="true"
        :show-operation="true"
        :operation-width="280"
        :show-summary="true"
        :summary-columns="summaryColumns"
        :summary-data="summaryData"
        :row-class-name="tableRowClassName"
        @selection-change="handleSelectionChange"
        @export="handleExport"
        @refresh="handleRefresh"
        @delete="handleBatchDelete"
        @delete-single="handleSingleDelete"
      >
        <!-- 自定义列 -->
        <template #column-demandType="{ row }">
          <el-tag :type="getDemandTypeColor(row.demandType)" size="small">
            {{ getDemandTypeText(row.demandType) }}
          </el-tag>
        </template>
        
        <template #column-status="{ row }">
          <el-tag :type="getStatusColor(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
        
        <template #column-priority="{ row }">
          <el-tag :type="getPriorityColor(row.priority)" size="small">
            {{ row.priority === 'urgent' ? '紧急' : row.priority === 'normal' ? '普通' : '低' }}
          </el-tag>
        </template>
        
        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button 
            type="success" 
            size="small" 
            @click="handleApprove(row)" 
            :disabled="row.status !== 'pending'"
          >
            审核通过
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            @click="handleReject(row)" 
            :disabled="row.status !== 'pending'"
          >
            驳回
          </el-button>
          <el-button 
            type="primary" 
            size="small" 
            @click="handleAdjust(row)"
            :disabled="row.status !== 'pending'"
          >
            调整数量
          </el-button>
          <el-button 
            type="info" 
            size="small" 
            @click="handleViewDetail(row)"
          >
            查看详情
          </el-button>
        </template>
      </EnhancedTable>
    </div>

    <!-- 页面设置对话框 -->
    <PageSettings
      v-model:visible="pageSettingsVisible"
      :settings="pageSettings"
      :available-fields="tableColumns"
      :show-workflow="false"
      :show-menu="false"
      :show-color="true"
      :show-encoding="false"
      :show-fields="true"
      :show-print="true"
      @save="handleSaveSettings"
    />

    <!-- 详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="MRP计划详情" width="900px">
      <el-descriptions :column="2" border v-if="currentPlan">
        <el-descriptions-item label="运算批次">{{ currentPlan.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="运算时间">{{ currentPlan.runTime }}</el-descriptions-item>
        <el-descriptions-item label="物料编号">{{ currentPlan.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ currentPlan.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格型号">{{ currentPlan.materialSpec }}</el-descriptions-item>
        <el-descriptions-item label="需求类型">{{ getDemandTypeText(currentPlan.demandType) }}</el-descriptions-item>
        <el-descriptions-item label="需求数量">{{ currentPlan.demandQty }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ currentPlan.currentStock }}</el-descriptions-item>
        <el-descriptions-item label="在途数量">{{ currentPlan.onOrderQty }}</el-descriptions-item>
        <el-descriptions-item label="建议数量">{{ currentPlan.suggestedQty }}</el-descriptions-item>
        <el-descriptions-item label="调整数量">{{ currentPlan.adjustedQty }}</el-descriptions-item>
        <el-descriptions-item label="需求日期">{{ currentPlan.requiredDate }}</el-descriptions-item>
        <el-descriptions-item label="计划日期">{{ currentPlan.planDate }}</el-descriptions-item>
        <el-descriptions-item label="审核状态">{{ getStatusText(currentPlan.status) }}</el-descriptions-item>
        <el-descriptions-item label="审核人">{{ currentPlan.approver || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ currentPlan.approveTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentPlan.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Select, Close, Refresh, Setting, Delete } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import PageSettings from '@/components/common/PageSettings.vue'

// ========== 数据定义 ==========
const tableRef = ref(null)
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const selectedRows = ref([])
const detailDialogVisible = ref(false)
const currentPlan = ref(null)
const loading = ref(false)
const pageSettingsVisible = ref(false)

// 筛选表单
const filterForm = ref({
  batchNo: '',
  status: '',
  materialCode: ''
})

// 表格列配置
const tableColumns = ref([
  { prop: 'batchNo', label: '运算批次', width: 150, fixed: 'left', sortable: true },
  { prop: 'materialCode', label: '物料编号', width: 140, sortable: true },
  { prop: 'materialName', label: '物料名称', width: 180, sortable: true },
  { prop: 'materialSpec', label: '规格型号', width: 150 },
  { prop: 'demandType', label: '需求类型', width: 120 },
  { prop: 'demandQty', label: '需求数量', width: 120, align: 'right', sortable: true },
  { prop: 'currentStock', label: '当前库存', width: 120, align: 'right', sortable: true },
  { prop: 'onOrderQty', label: '在途数量', width: 120, align: 'right' },
  { prop: 'suggestedQty', label: '建议数量', width: 120, align: 'right', sortable: true },
  { prop: 'adjustedQty', label: '调整数量', width: 120, align: 'right' },
  { prop: 'requiredDate', label: '需求日期', width: 120, sortable: true },
  { prop: 'planDate', label: '计划日期', width: 120, sortable: true },
  { prop: 'priority', label: '优先级', width: 100 },
  { prop: 'status', label: '审核状态', width: 120, fixed: 'right' },
  { prop: 'approver', label: '审核人', width: 100 },
  { prop: 'approveTime', label: '审核时间', width: 160 }
])

// 统计列配置
const summaryColumns = ref([
  { prop: 'demandQty', label: '总需求数量', format: 'number' },
  { prop: 'currentStock', label: '总库存', format: 'number' },
  { prop: 'suggestedQty', label: '总建议数量', format: 'number' }
])

// 统计数据
const summaryData = computed(() => {
  const data = filteredTableData.value
  return {
    demandQty: data.reduce((sum, item) => sum + item.demandQty, 0),
    currentStock: data.reduce((sum, item) => sum + item.currentStock, 0),
    suggestedQty: data.reduce((sum, item) => sum + item.suggestedQty, 0)
  }
})

// 页面设置
const pageSettings = ref({
  themeColor: '#409EFF',
  backgroundColor: '#f5f7fa',
  tableRowColor: '#ffffff',
  tableHeaderColor: '#f5f7fa',
  visibleFields: tableColumns.value.map(col => col.prop),
  printOrientation: 'landscape'
})

// 批次列表（动态加载）
const batchList = ref([])

// 加载批次列表
const loadBatchList = () => {
  // 从表格数据中提取唯一的批次
  const batches = new Map()
  tableData.value.forEach(item => {
    if (item.batchNo && !batches.has(item.batchNo)) {
      batches.set(item.batchNo, {
        batchNo: item.batchNo,
        runTime: item.runTime || ''
      })
    }
  })
  
  // 转换为数组并按批次号降序排序（最新的在前）
  batchList.value = Array.from(batches.values()).sort((a, b) => {
    return b.batchNo.localeCompare(a.batchNo)
  })
}

// 表格数据（从localStorage加载或使用默认空数组）
const tableData = ref([])

// 统计数据
const statistics = computed(() => {
  return {
    pending: tableData.value.filter(item => item.status === 'pending').length,
    approved: tableData.value.filter(item => item.status === 'approved').length,
    rejected: tableData.value.filter(item => item.status === 'rejected').length,
    total: tableData.value.length
  }
})

// 过滤后的表格数据
const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (filterForm.value.batchNo) {
    data = data.filter(item => item.batchNo === filterForm.value.batchNo)
  }
  
  if (filterForm.value.status) {
    data = data.filter(item => item.status === filterForm.value.status)
  }
  
  if (filterForm.value.materialCode) {
    data = data.filter(item => item.materialCode.includes(filterForm.value.materialCode))
  }
  
  totalCount.value = data.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

// 是否有选中行
const hasSelection = computed(() => selectedRows.value.length > 0)

// ========== 方法定义 ==========

// 需求类型文本
const getDemandTypeText = (type) => {
  const map = {
    production: '生产需求',
    purchase: '采购需求',
    transfer: '调拨需求'
  }
  return map[type] || type
}

// 需求类型颜色
const getDemandTypeColor = (type) => {
  const map = {
    production: 'primary',
    purchase: 'success',
    transfer: 'warning'
  }
  return map[type] || ''
}

// 状态文本
const getStatusText = (status) => {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回'
  }
  return map[status] || status
}

// 状态类型
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return map[status] || ''
}

// 状态颜色（用于EnhancedTable）
const getStatusColor = (status) => {
  return getStatusType(status)
}

// 优先级颜色
const getPriorityColor = (priority) => {
  const map = {
    urgent: 'danger',
    normal: 'primary',
    low: 'info'
  }
  return map[priority] || ''
}

// 表格行class
const tableRowClassName = ({ row }) => {
  if (row.status === 'approved') return 'row-approved'
  if (row.status === 'rejected') return 'row-rejected'
  return ''
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 审核通过
const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm(`确定审核通过物料【${row.materialName}】的需求计划吗？`, '审核确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    row.status = 'approved'
    row.approver = '当前用户'
    row.approveTime = new Date().toLocaleString('zh-CN')
    
    // 保存到localStorage
    saveMRPPlans()
    
    ElMessage.success('审核通过')
  } catch {
    // 取消
  }
}

// 驳回
const handleReject = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入驳回原因'
    })
    
    row.status = 'rejected'
    row.approver = '当前用户'
    row.approveTime = new Date().toLocaleString('zh-CN')
    row.remark = value
    
    // 保存到localStorage
    saveMRPPlans()
    
    ElMessage.success('已驳回')
  } catch {
    // 取消
  }
}

// 批量审核通过
const handleBatchApprove = async () => {
  const pendingRows = selectedRows.value.filter(row => row.status === 'pending')
  
  if (pendingRows.length === 0) {
    ElMessage.warning('请选择待审核的计划')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确定批量审核通过 ${pendingRows.length} 条计划吗？`, '批量审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    
    const currentTime = new Date().toLocaleString('zh-CN')
    pendingRows.forEach(row => {
      row.status = 'approved'
      row.approver = '当前用户'
      row.approveTime = currentTime
    })
    
    // 保存到localStorage
    saveMRPPlans()
    
    ElMessage.success(`批量审核通过 ${pendingRows.length} 条计划`)
  } catch {
    // 取消
  }
}

// 批量驳回
const handleBatchReject = async () => {
  const pendingRows = selectedRows.value.filter(row => row.status === 'pending')
  
  if (pendingRows.length === 0) {
    ElMessage.warning('请选择待审核的计划')
    return
  }
  
  try {
    const { value } = await ElMessageBox.prompt('请输入驳回原因', '批量驳回', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入驳回原因'
    })
    
    const currentTime = new Date().toLocaleString('zh-CN')
    pendingRows.forEach(row => {
      row.status = 'rejected'
      row.approver = '当前用户'
      row.approveTime = currentTime
      row.remark = value
    })
    
    // 保存到localStorage
    saveMRPPlans()
    
    ElMessage.success(`批量驳回 ${pendingRows.length} 条计划`)
  } catch {
    // 取消
  }
}

// 批量删除
const handleBatchDelete = async (rowsToDelete) => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${rowsToDelete.length} 条计划吗？`, '批量删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 从表格数据中移除选中的行
    const selectedIds = rowsToDelete.map(row => row.id)
    const originalLength = tableData.value.length;
    tableData.value = tableData.value.filter(row => !selectedIds.includes(row.id))
    const deletedCount = originalLength - tableData.value.length;
    
    // 清空选中项
    selectedRows.value = []
    
    // 强制更新统计数据
    await nextTick();
    
    // 保存到localStorage
    saveMRPPlans()
    
    ElMessage.success(`成功删除 ${deletedCount} 条计划`)
  } catch (error) {
    // 取消删除
  }
}

// 单条删除
const handleSingleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除这条计划吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 从表格数据中移除行
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      
      // 保存到localStorage
      saveMRPPlans()
      
      ElMessage.success('删除成功')
    }
  } catch (error) {
    // 取消删除
  }
}

// 查看详情
const handleViewDetail = (row) => {
  currentPlan.value = { ...row }
  detailDialogVisible.value = true
}

// 调整数量
const handleAdjust = async (row) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入调整后的数量', '调整数量', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^[0-9]+$/,
      inputErrorMessage: '请输入有效数字',
      inputValue: row.suggestedQty
    })
    
    row.adjustedQty = parseInt(value)
    saveMRPPlans()
    ElMessage.success('数量调整成功')
  } catch {
    // 取消
  }
}

// 查询
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  filterForm.value = {
    batchNo: '',
    status: '',
    materialCode: ''
  }
  currentPage.value = 1
}

// 刷新
const handleRefresh = () => {
  loadMRPPlans()
  ElMessage.success('刷新成功')
}

// 导出
const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

// 保存页面设置
const handleSaveSettings = (settings) => {
  pageSettings.value = { ...settings }
  localStorage.setItem('mrpPlanApproveSettings', JSON.stringify(settings))
  ElMessage.success('设置已保存')
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 保存到localStorage
const saveMRPPlans = () => {
  localStorage.setItem('mrpPlanApproveData', JSON.stringify(tableData.value))
}

// 从 localStorage 加载
const loadMRPPlans = () => {
  const data = localStorage.getItem('mrpPlanApproveData')
  if (data) {
    tableData.value = JSON.parse(data)
  } else {
    // 如果 localStorage 中没有数据，则使用默认的模拟数据
    tableData.value = [
      {
        id: '1',
        batchNo: 'MRP-20251205-001',
        runTime: '2025-12-05 10:00:00',
        materialCode: 'M001',
        materialName: '铝合金板材',
        materialSpec: '6061-T6 2mm',
        demandType: 'production',
        demandQty: 500,
        currentStock: 200,
        onOrderQty: 100,
        suggestedQty: 200,
        adjustedQty: 200,
        requiredDate: '2025-12-15',
        planDate: '2025-12-10',
        status: 'pending',
        approver: '',
        approveTime: '',
        remark: ''
      },
      {
        id: '2',
        batchNo: 'MRP-20251205-001',
        runTime: '2025-12-05 10:00:00',
        materialCode: 'M002',
        materialName: '不锈钢管',
        materialSpec: '304 Φ50×3',
        demandType: 'purchase',
        demandQty: 1000,
        currentStock: 50,
        onOrderQty: 0,
        suggestedQty: 950,
        adjustedQty: 950,
        requiredDate: '2025-12-20',
        planDate: '2025-12-12',
        status: 'pending',
        approver: '',
        approveTime: '',
        remark: ''
      },
      {
        id: '3',
        batchNo: 'MRP-20251204-001',
        runTime: '2025-12-04 15:30:00',
        materialCode: 'M003',
        materialName: '电机',
        materialSpec: 'AC220V 1.5KW',
        demandType: 'production',
        demandQty: 50,
        currentStock: 30,
        onOrderQty: 20,
        suggestedQty: 0,
        adjustedQty: 0,
        requiredDate: '2025-12-18',
        planDate: '2025-12-13',
        status: 'approved',
        approver: '张三',
        approveTime: '2025-12-04 16:00:00',
        remark: '库存充足'
      }
    ]
  }
  
  // 加载批次列表
  loadBatchList()
}

// ========== 生命周期 ==========
onMounted(() => {
  loadMRPPlans()
  
  // 计算表格高度
  const updateTableHeight = () => {
    tableHeight.value = window.innerHeight - 420
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})
</script>

<style scoped lang="scss">
.mrp-plan-approve-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  .header-left {
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #303133;
    }
    
    .subtitle {
      margin: 0;
      font-size: 14px;
      color: #909399;
    }
  }
  
  .header-right {
    display: flex;
    gap: 12px;
  }
}

.filter-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.statistics-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  
  .stat-item {
    flex: 1;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    text-align: center;
    
    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-bottom: 12px;
    }
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #303133;
      
      &.pending {
        color: #E6A23C;
      }
      
      &.approved {
        color: #67C23A;
      }
      
      &.rejected {
        color: #F56C6C;
      }
    }
  }
}

.table-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.qty-highlight {
  color: #409EFF;
  font-weight: 600;
}

.qty-suggested {
  color: #67C23A;
  font-weight: 600;
}

:deep(.row-approved) {
  background-color: #f0f9ff !important;
}

:deep(.row-rejected) {
  background-color: #fef0f0 !important;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>