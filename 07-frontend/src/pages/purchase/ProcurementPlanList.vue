<template>
  <div class="procurement-plan-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>采购计划</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button size="small" @click="handleBatchDelete" :disabled="!hasSelection">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button type="warning" size="small" @click="handleBatchTerminate" :disabled="!hasSelection">
          批量终止
        </el-button>
        <el-button type="info" size="small" @click="handleBatchRecall" :disabled="!hasSelection">
          批量撤回
        </el-button>
        <el-button size="small" @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选提示 -->
    <el-alert type="info" :closable="false" style="margin: 0 20px 15px">
      表头筛选模式：每列标题下方有搜索框，支持模糊查询，筛选作用于所有{{ pagination.total }}条数据
    </el-alert>

    <!-- 数据表格 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="filteredTableData"
        border
        stripe
        @selection-change="handleSelectionChange"
        height="calc(100vh - 260px)"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        
        <template v-for="col in visibleColumns" :key="col.prop">
          <el-table-column
            v-if="col && col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :fixed="col.prop === 'procurementPlanNo' ? 'left' : false"
            :align="col.prop.includes('Quantity') || col.prop.includes('Amount') ? 'right' : 'left'"
          >
            <template #header>
              <div class="table-header-cell">
                <div class="header-label">{{ col.label }}</div>
                <el-input
                  v-if="col.filterable"
                  v-model="columnSearchValues[col.prop]"
                  size="small"
                  placeholder="模糊搜索"
                  clearable
                  @input="handleColumnSearch"
                  class="header-search"
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>
            </template>
            <template #default="{ row }">
              <span>{{ getFormattedValue(row, col.prop) }}</span>
            </template>
          </el-table-column>
        </template>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            <el-dropdown @command="(cmd) => handleMoreAction(cmd, row)">
              <el-button link size="small">更多<el-icon><arrow-down /></el-icon></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="terminate">终止</el-dropdown-item>
                  <el-dropdown-item command="cancel">取消</el-dropdown-item>
                  <el-dropdown-item command="recall">撤回</el-dropdown-item>
                  <el-dropdown-item command="urge">催单</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Search, ArrowDown } from '@element-plus/icons-vue'
import { procurementPlanApi } from '@/api/procurementPlan'

// 响应式数据
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const columnSearchValues = ref({})

// 默认列配置（采购计划50个字段）
const defaultColumns = [
  { prop: 'procurementPlanNo', label: '采购计划编号', width: 150, filterable: true, visible: true },
  { prop: 'purchaseOrderNo', label: '采购订单编号', width: 150, filterable: true, visible: true },
  { prop: 'sourceFormName', label: '来源表单', width: 120, filterable: true, visible: true },
  { prop: 'sourceNo', label: '来源编号', width: 150, filterable: true, visible: true },
  { prop: 'materialCode', label: '采购物料编号', width: 140, filterable: true, visible: true },
  { prop: 'materialName', label: '采购物料名称', width: 180, filterable: true, visible: true },
  { prop: 'materialImage', label: '图片', width: 80, filterable: false, visible: true },
  { prop: 'requiredQuantity', label: '需补货数量', width: 120, filterable: false, visible: true },
  { prop: 'baseUnit', label: '基本单位', width: 100, filterable: true, visible: true },
  { prop: 'salesOrderNo', label: '销售订单编号', width: 150, filterable: true, visible: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 150, filterable: true, visible: true },
  { prop: 'masterPlanNo', label: '主生产计划编号', width: 160, filterable: true, visible: true },
  { prop: 'processPlanNo', label: '工序计划编号', width: 150, filterable: true, visible: true },
  { prop: 'materialPlanNo', label: '备料计划编号', width: 150, filterable: true, visible: true },
  { prop: 'procurementLeadTime', label: '采购提前期', width: 120, filterable: false, visible: true },
  { prop: 'planArrivalDate', label: '计划到货日期', width: 140, filterable: true, visible: true },
  { prop: 'procurementStatus', label: '采购状态', width: 120, filterable: true, visible: true },
  { prop: 'supplierName', label: '供应商名称', width: 150, filterable: true, visible: true },
  { prop: 'purchaser', label: '采购员', width: 100, filterable: true, visible: true },
  { prop: 'purchaserContact', label: '采购员联系方式', width: 140, filterable: true, visible: true },
  { prop: 'inquiryPrice', label: '询价', width: 100, filterable: false, visible: true },
  { prop: 'inquiryDate', label: '询价日期', width: 120, filterable: true, visible: true },
  { prop: 'quotedPrice', label: '报价', width: 100, filterable: false, visible: true },
  { prop: 'quotationDate', label: '报价日期', width: 120, filterable: true, visible: true },
  { prop: 'transactionPrice', label: '成交价', width: 100, filterable: false, visible: true },
  { prop: 'transactionAmount', label: '成交金额', width: 120, filterable: false, visible: true },
  { prop: 'currency', label: '币种', width: 80, filterable: true, visible: true },
  { prop: 'exchangeRate', label: '汇率', width: 100, filterable: false, visible: true },
  { prop: 'orderDate', label: '下单日期', width: 120, filterable: true, visible: true },
  { prop: 'orderQuantity', label: '下单数量', width: 120, filterable: false, visible: true },
  { prop: 'arrivalDate', label: '到货日期', width: 120, filterable: true, visible: true },
  { prop: 'arrivalQuantity', label: '到货数量', width: 120, filterable: false, visible: true },
  { prop: 'qualifiedQuantity', label: '合格数量', width: 120, filterable: false, visible: true },
  { prop: 'warehouseNo', label: '入库单号', width: 150, filterable: true, visible: true },
  { prop: 'warehouseDate', label: '入库日期', width: 120, filterable: true, visible: true },
  { prop: 'warehouseQuantity', label: '入库数量', width: 120, filterable: false, visible: true },
  { prop: 'isPaid', label: '是否已付款', width: 100, filterable: true, visible: true },
  { prop: 'paymentDate', label: '付款日期', width: 120, filterable: true, visible: true },
  { prop: 'paymentAmount', label: '付款金额', width: 120, filterable: false, visible: true },
  { prop: 'paymentMethod', label: '结算方式', width: 100, filterable: true, visible: true },
  { prop: 'deliveryNoteNo', label: '送货单号', width: 150, filterable: true, visible: true },
  { prop: 'deliveryNoteImage', label: '送货单图片', width: 100, filterable: false, visible: true },
  { prop: 'productionBatchNo', label: '生产批次号', width: 140, filterable: true, visible: true },
  { prop: 'remarks', label: '备注', width: 200, filterable: true, visible: true },
  { prop: 'creator', label: '创建人', width: 100, filterable: true, visible: true },
  { prop: 'createdAt', label: '创建时间', width: 160, filterable: true, visible: true },
  { prop: 'updatedAt', label: '更新时间', width: 160, filterable: true, visible: true }
]

const visibleColumns = computed(() => defaultColumns.filter(col => col.visible))
const hasSelection = computed(() => selectedRows.value.length > 0)

// 筛选后的表格数据
const filteredTableData = computed(() => {
  let data = [...tableData.value]
  
  Object.keys(columnSearchValues.value).forEach(prop => {
    const searchValue = columnSearchValues.value[prop]
    if (searchValue && searchValue.trim()) {
      data = data.filter(row => {
        const cellValue = row[prop]
        if (cellValue === null || cellValue === undefined) return false
        return String(cellValue).toLowerCase().includes(searchValue.toLowerCase().trim())
      })
    }
  })
  
  return data
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const response = await procurementPlanApi.getList({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    
    // response已经是data（经过request.js响应拦截器处理）
    tableData.value = response.records || []
    pagination.value.total = response.total || 0
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 事件处理
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const handleColumnSearch = () => {
  // 触发筛选
}

const handlePageChange = () => {
  loadData()
}

const handlePageSizeChange = () => {
  pagination.value.page = 1
  loadData()
}

const handleAdd = () => {
  ElMessage.info('新增功能开发中')
}

const handleEdit = (row) => {
  ElMessage.info('编辑功能开发中')
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除采购计划 ${row.procurementPlanNo} 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await procurementPlanApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
    }
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条采购计划吗？`, '批量删除确认')
    
    const ids = selectedRows.value.map(row => row.id)
    await procurementPlanApi.batchDelete(ids)
    ElMessage.success(`成功删除 ${selectedRows.value.length} 条数据`)
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    }
  }
}

const handleBatchTerminate = async () => {
  try {
    await ElMessageBox.confirm(`确定终止选中的 ${selectedRows.value.length} 条采购计划吗？`, '批量终止确认')
    
    const ids = selectedRows.value.map(row => row.id)
    await procurementPlanApi.batchTerminate(ids)
    ElMessage.success('批量终止成功')
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量终止失败: ' + (error.message || '未知错误'))
    }
  }
}

const handleBatchRecall = async () => {
  try {
    await ElMessageBox.confirm(`确定撤回选中的 ${selectedRows.value.length} 条采购计划吗？`, '批量撤回确认')
    
    const ids = selectedRows.value.map(row => row.id)
    await procurementPlanApi.batchRecall(ids)
    ElMessage.success('批量撤回成功')
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量撤回失败: ' + (error.message || '未知错误'))
    }
  }
}

const handleMoreAction = async (command, row) => {
  switch (command) {
    case 'terminate':
      await handleBatchTerminate()
      break
    case 'cancel':
      ElMessage.info('取消功能开发中')
      break
    case 'recall':
      await handleBatchRecall()
      break
    case 'urge':
      ElMessage.info('催单功能开发中')
      break
  }
}

// 格式化值
const getFormattedValue = (row, prop) => {
  const cellValue = row[prop]
  
  // 日期字段
  if (['planArrivalDate', 'inquiryDate', 'quotationDate', 'orderDate', 'arrivalDate', 'warehouseDate', 'paymentDate', 'createdAt', 'updatedAt'].includes(prop)) {
    if (!cellValue) return '-'
    try {
      const date = new Date(cellValue)
      if (isNaN(date.getTime())) return '-'
      return date.toISOString().split('T')[0]
    } catch {
      return '-'
    }
  }
  
  // 布尔字段
  if (prop === 'isPaid') {
    return cellValue ? '是' : '否'
  }
  
  // 数值字段
  if (['requiredQuantity', 'inquiryPrice', 'quotedPrice', 'transactionPrice', 'transactionAmount', 'exchangeRate', 'orderQuantity', 'arrivalQuantity', 'qualifiedQuantity', 'warehouseQuantity', 'paymentAmount', 'procurementLeadTime'].includes(prop)) {
    if (cellValue === null || cellValue === undefined) return '0.00'
    const value = parseFloat(cellValue)
    return isNaN(value) ? '0.00' : value.toFixed(2)
  }
  
  // 状态字段
  if (prop === 'procurementStatus') {
    const statusMap = {
      'PENDING_INQUIRY': '待询价',
      'INQUIRED': '已询价',
      'PENDING_ORDER': '待下单',
      'ORDERED': '已下单',
      'PENDING_ARRIVAL': '待回厂',
      'PARTIAL_ARRIVAL': '部分回厂',
      'ARRIVED': '已回厂',
      'WAREHOUSED': '已入库',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消',
      'TERMINATED': '已终止'
    }
    return statusMap[cellValue] || cellValue || '-'
  }
  
  if (cellValue === null || cellValue === undefined) return '-'
  return String(cellValue)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.procurement-plan-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 4px;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #303133;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.table-container {
  background: white;
  padding: 16px;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.table-header-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 0;
}

.table-header-cell .header-label {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-header-cell .header-search :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.table-header-cell .header-search :deep(.el-input__inner) {
  font-size: 12px;
  height: 26px;
}
</style>
