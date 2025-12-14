<template>
  <div class="sales-order-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>销售订单管理</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button 
          type="success" 
          size="small" 
          @click="handleConfirmOrder"
          :disabled="!hasSelection"
        >
          <el-icon><CircleCheck /></el-icon>
          正式下单
        </el-button>
        <el-button 
          type="success" 
          size="small" 
          @click="handleMRPCalculation"
          :disabled="!canExecuteMRP"
        >
          <el-icon><DataAnalysis /></el-icon>
          执行MRP运算
        </el-button>
        <el-button 
          type="danger" 
          size="small" 
          @click="handleManualTerminate"
          :disabled="!hasSelection"
        >
          手动终止
        </el-button>
        <el-button 
          size="small" 
          @click="handleBatchDelete"
          :disabled="!hasSelection"
        >
          <el-icon><Delete /></el-icon>
          删除
        </el-button>
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button size="small" @click="showSettings = true">
          <el-icon><Setting /></el-icon>
          页面设置
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-bar">
      <el-form :model="searchForm" inline size="small">
        <el-form-item label="搜索">
          <el-input 
            v-model="searchForm.searchText" 
            placeholder="订单编号、客户名称..." 
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select 
            v-model="searchForm.orderStatus" 
            placeholder="全部" 
            clearable
            style="width: 180px"
          >
            <el-option label="全部" value="" />
            <el-option label="待下单" value="待下单" />
            <el-option label="已模拟排程待下单" value="已模拟排程待下单" />
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="生产中" value="production" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="手动终止" value="terminated" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 模拟排程订单提示 -->
      <el-tag v-if="simulatedOrders.length > 0" type="warning" style="margin-left: 10px">
        当前有 {{ simulatedOrders.length }} 个模拟排程订单未下单
      </el-tag>
    </div>

    <!-- 筛选提示 -->
    <el-alert 
      type="info" 
      :closable="false" 
      style="margin: 0 0 15px"
    >
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
        height="calc(100vh - 360px)"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        
        <template v-for="col in visibleColumns" :key="col.prop">
          <el-table-column
            v-if="col.visible"
            :prop="col.prop"
            :width="col.width"
            :fixed="col.prop === 'internalOrderNo' || col.prop === 'orderStatus' ? 'left' : undefined"
            :align="['orderQuantity', 'unitPriceExcludingTax', 'unitPriceIncludingTax', 'amountExcludingTax', 'amountIncludingTax', 'totalAmountExcludingTax', 'totalAmountIncludingTax', 'fees', 'totalReceivable', 'plannedPaymentAmount'].includes(col.prop) ? 'right' : undefined"
            :formatter="formatColumnValue"
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
            
            <!-- 特殊列渲染 -->
            <template #default="{ row }" v-if="['orderStatus', 'productImage'].includes(col.prop)">
              <el-tag v-if="col.prop === 'orderStatus'" :type="getStatusType(row.orderStatus)">
                {{ row.orderStatus || '-' }}
              </el-tag>
              <el-image 
                v-else-if="col.prop === 'productImage' && row.productImage" 
                :src="row.productImage" 
                style="width: 50px; height: 50px;" 
                fit="cover"
                :preview-src-list="[row.productImage]"
              />
              <span v-else-if="col.prop === 'productImage'">-</span>
            </template>
          </el-table-column>
        </template>
        
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDeleteOne(row)">
              删除
            </el-button>
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
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, Delete, Refresh, Setting, Search, CircleCheck, DataAnalysis 
} from '@element-plus/icons-vue'
import { 
  useSalesOrderList,
  useSalesOrderActions,
  usePageSettings,
  STATUS_TYPE_MAP
} from '@/features/sales-order'
import PageSettingsDialog from '@/features/material-preparation/components/PageSettingsDialog.vue'

// ========== 列表逻辑 ==========
const {
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
  handleSelectionChange
} = useSalesOrderList()

// ========== 操作逻辑 ==========
const {
  handleCreate,
  handleEdit,
  handleView,
  handleDeleteOne: deleteOne,
  handleBatchDelete: batchDelete,
  handleConfirmOrder: confirmOrder,
  handleMRPCalculation: mrpCalculation,
  handleManualTerminate: manualTerminate
} = useSalesOrderActions()

// ========== 页面设置 ==========
const showSettings = ref(false)

// 默认列配置
const defaultColumns = [
  { prop: 'orderStatus', label: '订单状态', width: 120, filterable: true },
  { prop: 'internalOrderNo', label: '内部销售订单编号', width: 180, filterable: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160, filterable: true },
  { prop: 'customerName', label: '客户名称', width: 160, filterable: true },
  { prop: 'salesperson', label: '销售员', width: 100, filterable: true },
  { prop: 'submitter', label: '提交人', width: 100, filterable: true },
  { prop: 'quotationNo', label: '报价单号', width: 140, filterable: true },
  { prop: 'orderTime', label: '下单时间', width: 120, filterable: true },
  { prop: 'promisedDelivery', label: '承诺交期', width: 120, filterable: true },
  { prop: 'customerDelivery', label: '客户交期', width: 120, filterable: true },
  { prop: 'productCode', label: '产品编号', width: 140, filterable: true },
  { prop: 'productName', label: '产品名称', width: 180, filterable: true },
  { prop: 'productImage', label: '产品图片', width: 100, filterable: false },
  { prop: 'salesBomSelection', label: '销售BOM选择', width: 140, filterable: true },
  { prop: 'majorCategory', label: '大类', width: 100, filterable: true },
  { prop: 'middleCategory', label: '中类', width: 100, filterable: true },
  { prop: 'minorCategory', label: '小类', width: 100, filterable: true },
  { prop: 'productSource', label: '产品来源', width: 100, filterable: true },
  { prop: 'productSpec', label: '产品规格', width: 150, filterable: true },
  { prop: 'productColor', label: '产品颜色', width: 100, filterable: true },
  { prop: 'productMaterial', label: '产品材质', width: 120, filterable: true },
  { prop: 'productDescription', label: '产品详述', width: 200, filterable: true },
  { prop: 'outputProcess', label: '产出工序', width: 120, filterable: true },
  { prop: 'realtimeInventory', label: '实时库存', width: 100, filterable: false },
  { prop: 'availableInventory', label: '可销售库存', width: 120, filterable: false },
  { prop: 'effectiveInventory', label: '有效库存', width: 100, filterable: false },
  { prop: 'estimatedBalance', label: '预计结存', width: 100, filterable: false },
  { prop: 'productUnit', label: '产品单位', width: 100, filterable: true },
  { prop: 'orderQuantity', label: '订单数量', width: 100, filterable: false },
  { prop: 'unitPriceExcludingTax', label: '销售单价（未税）', width: 150, filterable: false },
  { prop: 'productTaxRate', label: '税率', width: 80, filterable: false },
  { prop: 'unitPriceIncludingTax', label: '含税单价', width: 120, filterable: false },
  { prop: 'amountExcludingTax', label: '金额（未税）', width: 120, filterable: false },
  { prop: 'amountIncludingTax', label: '金额（含税）', width: 120, filterable: false },
  { prop: 'returnOrderNo', label: '销售退货单号', width: 140, filterable: true },
  { prop: 'deliveryMethod', label: '送货方式', width: 120, filterable: true },
  { prop: 'consignee', label: '收货人', width: 100, filterable: true },
  { prop: 'deliveryAddress', label: '收货地址', width: 200, filterable: true },
  { prop: 'billRecipient', label: '账单收件人', width: 120, filterable: true },
  { prop: 'billAddress', label: '账单收件地址', width: 200, filterable: true },
  { prop: 'salesDepartment', label: '销售部门', width: 120, filterable: true },
  { prop: 'orderCurrency', label: '订单币种', width: 100, filterable: true },
  { prop: 'currentExchangeRate', label: '当前汇率', width: 100, filterable: false },
  { prop: 'taxRate', label: '税率', width: 80, filterable: false },
  { prop: 'totalAmountExcludingTax', label: '订单总金额（未税）', width: 160, filterable: false },
  { prop: 'totalAmountIncludingTax', label: '订单总金额（含税）', width: 160, filterable: false },
  { prop: 'paymentMethod', label: '收款方式', width: 120, filterable: true },
  { prop: 'advancePaymentRatio', label: '预收占比', width: 100, filterable: false },
  { prop: 'fees', label: '手续费或其他费用', width: 140, filterable: false },
  { prop: 'paymentPlan', label: '回款计划', width: 120, filterable: true },
  { prop: 'totalReceivable', label: '应回款总额', width: 140, filterable: false },
  { prop: 'plannedPaymentDate', label: '计划回款日期', width: 140, filterable: true },
  { prop: 'plannedPaymentAmount', label: '计划回款金额', width: 140, filterable: false },
  { prop: 'packagingMethod', label: '包装方式', width: 120, filterable: true },
  { prop: 'packagingRequirements', label: '包装需求描述', width: 150, filterable: true },
  { prop: 'estimatedCompletionDate', label: '预计完成日期', width: 140, filterable: true },
  { prop: 'orderNotes', label: '订单说明', width: 150, filterable: true },
  { prop: 'createTime', label: '创建时间', width: 160, filterable: true },
  { prop: 'orderType', label: '订单类型', width: 100, filterable: true }
]

const {
  businessVariables,
  addBusinessVariable,
  removeBusinessVariable,
  saveBusinessVariables,
  workflowConfigs,
  addWorkflowConfig,
  removeWorkflowConfig,
  saveWorkflowConfigs,
  codeRules,
  addCodeRule,
  removeCodeRule,
  saveCodeRules,
  updateCodeExample,
  columnConfigs,
  reorderColumns,
  saveColumnConfigs,
  initSettings
} = usePageSettings('sales-order')

// 可见列（按顺序排列）
const visibleColumns = computed(() => {
  return [...columnConfigs.value].sort((a, b) => a.order - b.order)
})

// ========== 表头模糊搜索 ==========
const columnSearchValues = ref({})

const handleColumnSearch = () => {
  // 触发筛选，使用computed自动更新
}

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

// ========== 事件处理 ==========
const handleDeleteOne = async (row) => {
  await deleteOne(row, loadData)
}

const handleBatchDelete = async () => {
  await batchDelete(selectedRows.value, loadData)
}

const handleConfirmOrder = async () => {
  await confirmOrder(selectedRows.value, loadData)
}

const handleMRPCalculation = async () => {
  await mrpCalculation(selectedRows.value, loadData)
}

const handleManualTerminate = async () => {
  await manualTerminate(selectedRows.value, loadData)
}

// ========== 工具函数 ==========
const getStatusType = (status) => {
  return STATUS_TYPE_MAP[status] || 'info'
}

const formatColumnValue = ({ column, cellValue }) => {
  if (!cellValue) return '-'
  
  // 日期格式化
  if (['orderTime', 'promisedDelivery', 'customerDelivery', 'plannedPaymentDate', 'estimatedCompletionDate', 'createTime'].includes(column.property)) {
    try {
      const date = new Date(cellValue)
      if (isNaN(date.getTime())) return '-'
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch {
      return '-'
    }
  }
  
  // 金额格式化
  if (['unitPriceExcludingTax', 'unitPriceIncludingTax', 'amountExcludingTax', 'amountIncludingTax', 'totalAmountExcludingTax', 'totalAmountIncludingTax', 'fees', 'totalReceivable', 'plannedPaymentAmount'].includes(column.property)) {
    return `¥${Number(cellValue).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  return cellValue
}

// ========== 初始化 ==========
onMounted(() => {
  initSettings(defaultColumns)
  loadData()
})
</script>

<style scoped lang="scss">
.sales-order-container {
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

.search-bar {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 4px;
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
