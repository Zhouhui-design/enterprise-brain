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
        
        <!-- ✅ 新增：采购流程操作按钮 -->
        <el-button 
          type="primary" 
          size="small" 
          @click="handlePrePurchaseInquiry"
          :disabled="!hasSelection"
        >
          <el-icon><ChatDotRound /></el-icon>
          采购前询问
        </el-button>
        <el-button 
          type="success" 
          size="small" 
          @click="handlePlaceOrder"
          :disabled="!hasSelection"
        >
          <el-icon><ShoppingCart /></el-icon>
          立即下单
        </el-button>
        <el-button 
          type="danger" 
          size="small" 
          @click="handleWithdrawOrder"
          :disabled="!hasSelection"
        >
          <el-icon><RefreshLeft /></el-icon>
          撤回下单
        </el-button>
        
        <!-- ✅ 新增：采购订单合并规则下拉 + 一键合并按钮 -->
        <el-select 
          v-model="mergeRuleValue" 
          placeholder="采购订单合并规则"
          size="small"
          style="width: 260px; margin-left: 10px"
        >
          <el-option 
            label="相同供应商，相同承诺回厂日期合并" 
            value="sameSupplierSameDate" 
          />
          <el-option 
            label="其他规则（需要其他规则，请联系周辉18627407019添加）" 
            value="customRule" 
            disabled
          />
        </el-select>
        <el-button 
          type="success" 
          size="small" 
          @click="handleMergeOrders"
          :disabled="!hasSelection || !mergeRuleValue"
        >
          <el-icon><Connection /></el-icon>
          一键合并
        </el-button>
        
        <el-button size="small" @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        
        <!-- ✅ 新增：页面设置按钮 -->
        <el-button size="small" @click="pageSettingsVisible = true">
          <el-icon><Setting /></el-icon>
          页面设置
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
              <!-- 供应商名称字段特殊处理：可编辑 -->
              <template v-if="col.prop === 'supplierName'">
                <el-select
                  v-model="row.supplierName"
                  filterable
                  allow-create
                  default-first-option
                  size="small"
                  style="width: 100%"
                  placeholder="请输入或选择供应商"
                  @change="(value) => handleSupplierChange(row, value)"
                >
                  <el-option
                    v-for="supplier in supplierList"
                    :key="supplier.id"
                    :label="supplier.supplierName"
                    :value="supplier.supplierName"
                  />
                </el-select>
              </template>
              <template v-else>
                <span>{{ getFormattedValue(row, col.prop) }}</span>
              </template>
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

    <!-- ✅ 新增：页面设置对话框 -->
    <el-dialog 
      v-model="pageSettingsVisible" 
      title="页面设置" 
      width="600px"
      @close="handlePageSettingsClose"
    >
      <el-tabs v-model="activeSettingsTab" type="border-card">
        <!-- 业务变量标签页 -->
        <el-tab-pane label="业务变量" name="businessVars">
          <el-form label-width="180px" style="max-width: 500px">
            <el-form-item label="采购订单合并规则">
              <el-select 
                v-model="businessVars.mergeRule" 
                placeholder="请选择合并规则"
                style="width: 100%"
              >
                <el-option 
                  label="相同供应商，相同承诺回厂日期合并" 
                  value="sameSupplierSameDate" 
                />
                <el-option 
                  label="其他规则（需要其他规则，请联系周辉18627407019添加）" 
                  value="customRule" 
                  disabled
                />
              </el-select>
              <div style="margin-top: 8px; color: #909399; font-size: 12px">
                📝 说明：设置默认的采购订单合并规则，用于一键合并功能<br/>
                • 相同供应商，相同承诺回厂日期合并：将相同供应商且承诺回厂日期相同的采购计划合并为一个采购订单<br/>
                • 如需其他合并规则，请联系周辉18627407019
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 列字段控制标签页 -->
        <el-tab-pane label="列字段控制" name="columnControl">
          <div style="max-height: 400px; overflow-y: auto">
            <el-checkbox-group v-model="selectedColumns" style="display: flex; flex-direction: column; gap: 8px">
              <el-checkbox 
                v-for="col in defaultColumns" 
                :key="col.prop" 
                :label="col.prop"
              >
                {{ col.label }}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="pageSettingsVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePageSettings">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Refresh, Search, ArrowDown, Connection, Setting, ChatDotRound, ShoppingCart, RefreshLeft } from '@element-plus/icons-vue'
import { procurementPlanApi } from '@/api/procurementPlan'
import request from '@/utils/request'

// 响应式数据
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const columnSearchValues = ref({})

// ✅ 新增：供应商列表状态
const supplierList = ref([])
const supplierLoading = ref(false)

// ✅ 新增：页面设置相关状态
const pageSettingsVisible = ref(false)
const activeSettingsTab = ref('businessVars')
const businessVars = ref({
  mergeRule: 'sameSupplierSameDate' // 默认规则
})
const selectedColumns = ref([])

// ✅ 新增：合并规则下拉选中值
const mergeRuleValue = ref('sameSupplierSameDate')

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

const visibleColumns = computed(() => {
  // 如果没有设置，显示所有列
  if (selectedColumns.value.length === 0) {
    return defaultColumns.filter(col => col.visible)
  }
  // 根据用户选择显示列
  return defaultColumns.filter(col => selectedColumns.value.includes(col.prop))
})
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
      console.log('🔄 开始加载采购计划数据，页码:', pagination.value.page, '每页数量:', pagination.value.pageSize)
      const response = await procurementPlanApi.getList({
        page: pagination.value.page,
        pageSize: pagination.value.pageSize
      })
      
      console.log('📥 采购计划API响应:', response)
      
      // response已经是data（经过request.js响应拦截器处理）
      tableData.value = response.records || response.list || []
      pagination.value.total = response.total || 0
      
      console.log('✅ 采购计划数据加载成功，数量:', tableData.value.length, '总条数:', pagination.value.total)
    } catch (error) {
      console.error('❌ 加载数据失败:', error)
      console.error('❌ 错误详情:', error.response)
      ElMessage.error('加载数据失败: ' + (error.response?.data?.message || error.message || '服务器内部错误'))
      // 提供模拟数据，避免页面空白
      tableData.value = []
      pagination.value.total = 0
    } finally {
      loading.value = false
    }
  }

// ✅ 新增：加载供应商列表
const loadSuppliers = async () => {
  supplierLoading.value = true
  try {
    const response = await request.get('/supplier-management', {
      params: { page: 1, pageSize: 1000 }
    })
    supplierList.value = response.data?.records || []
  } catch (error) {
    console.error('加载供应商列表失败:', error)
    ElMessage.error('加载供应商列表失败: ' + (error.message || '未知错误'))
  } finally {
    supplierLoading.value = false
  }
}

// 事件处理
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// ✅ 新增：处理供应商名称变更
const handleSupplierChange = async (row, value) => {
  try {
    // 更新采购计划的供应商名称
    await procurementPlanApi.update(row.id, { supplierName: value })
    ElMessage.success('供应商名称更新成功')
  } catch (error) {
    console.error('更新供应商名称失败:', error)
    ElMessage.error('更新供应商名称失败: ' + (error.message || '未知错误'))
  }
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
      'INQUIRING': '询问中，待回复', // ✅ 新增状态
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

// ✅ 新增：页面设置处理
const handlePageSettingsClose = () => {
  // 关闭时同步业务变量到主界面的下拉框
  mergeRuleValue.value = businessVars.value.mergeRule
}

const handleSavePageSettings = () => {
  // 保存业务变量
mergeRuleValue.value = businessVars.value.mergeRule
  
  // 保存列字段设置到localStorage
  if (selectedColumns.value.length > 0) {
    localStorage.setItem('procurementPlan_selectedColumns', JSON.stringify(selectedColumns.value))
  }
  
  // 保存业务变量到localStorage
  localStorage.setItem('procurementPlan_businessVars', JSON.stringify(businessVars.value))
  
  ElMessage.success('页面设置保存成功')
  pageSettingsVisible.value = false
}

// ✅ 新增：一键合并处理
const handleMergeOrders = async () => {
  if (!mergeRuleValue.value) {
    ElMessage.warning('请先选择合并规则')
    return
  }
  
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要合并的采购计划')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `将选中的 ${selectedRows.value.length} 条采购计划按“${mergeRuleValue.value === 'sameSupplierSameDate' ? '相同供应商，相同承诺回厂日期' : '其他规则'}”合并为采购订单，是否继续？`,
      '采购订单合并确认',
      {
        confirmButtonText: '确定合并',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 调用后端API进行合并
    const mergeData = {
      planIds: selectedRows.value.map(row => row.id),
      mergeRule: mergeRuleValue.value
    }
    
    const result = await procurementPlanApi.mergeToOrder(mergeData)
    
    ElMessage.success(`合并成功！生成了 ${result.orderCount || 1} 个采购订单`)
    
    // 清空选中行
    selectedRows.value = []
    
    // 重新加载数据
    await loadData()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('合并失败:', error)
      ElMessage.error('合并失败: ' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

// ✅ 新增：采购前询问
const handlePrePurchaseInquiry = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要询问的采购计划')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `将选中的 ${selectedRows.value.length} 条采购计划状态更新为“询问中，待回复”，是否继续？`,
      '采购前询问确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    loading.value = true
    
    const ids = selectedRows.value.map(row => row.id)
    await procurementPlanApi.prePurchaseInquiry(ids)
    
    ElMessage.success(`成功将 ${selectedRows.value.length} 条采购计划更新为询问中状态`)
    
    selectedRows.value = []
    await loadData()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('采购前询问失败:', error)
      ElMessage.error('采购前询问失败: ' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

// ✅ 新增：立即下单
const handlePlaceOrder = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要下单的采购计划')
    return
  }
  
  // 验证：只能选择采购订单编号不为空，且状态为待下单或询问中
  const invalidRows = selectedRows.value.filter(row => {
    if (!row.purchaseOrderNo) return true
    if (row.procurementStatus !== 'PENDING_ORDER' && row.procurementStatus !== 'INQUIRING') {
      return true
    }
    return false
  })
  
  if (invalidRows.length > 0) {
    ElMessage.error('只能选择采购订单编号不为空，且采购状态为“待下单”或“询问中，待回复”的计划')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `将选中的 ${selectedRows.value.length} 条采购计划状态更新为“已下单”，是否继续？`,
      '立即下单确认',
      {
        confirmButtonText: '确定下单',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    const ids = selectedRows.value.map(row => row.id)
    await procurementPlanApi.placeOrder(ids)
    
    ElMessage.success(`成功下单 ${selectedRows.value.length} 条采购计划`)
    
    selectedRows.value = []
    await loadData()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('下单失败:', error)
      ElMessage.error('下单失败: ' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

// ✅ 新增：撤回下单
const handleWithdrawOrder = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要撤回的采购计划')
    return
  }
  
  // 验证：只能选择已下单状态
  const invalidRows = selectedRows.value.filter(row => row.procurementStatus !== 'ORDERED')
  
  if (invalidRows.length > 0) {
    ElMessage.error('只能选择采购状态为“已下单”的计划')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确认撤回选中的 ${selectedRows.value.length} 条采购计划？

注意：
• 按采购订单编号选择：所有相同订单编号的计划都将撤回
• 按采购计划选择：仅撤回选中的计划，订单编号将清空`,
      '撤回下单确认',
      {
        confirmButtonText: '确定撤回',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    const ids = selectedRows.value.map(row => row.id)
    await procurementPlanApi.withdrawOrder(ids)
    
    ElMessage.success(`成功撤回 ${selectedRows.value.length} 条采购计划`)
    
    selectedRows.value = []
    await loadData()
    
  } catch (error) {
    if (error !== 'cancel') {
      console.error('撤回下单失败:', error)
      ElMessage.error('撤回下单失败: ' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
  }
}

// ✅ 新增：初始化加载设置
const loadPageSettings = () => {
  // 加载列字段设置
  const savedColumns = localStorage.getItem('procurementPlan_selectedColumns')
  if (savedColumns) {
    try {
      selectedColumns.value = JSON.parse(savedColumns)
    } catch (e) {
      console.error('加载列字段设置失败:', e)
    }
  } else {
    // 默认显示所有列
    selectedColumns.value = defaultColumns.map(col => col.prop)
  }
  
  // 加载业务变量
  const savedBusinessVars = localStorage.getItem('procurementPlan_businessVars')
  if (savedBusinessVars) {
    try {
      const parsed = JSON.parse(savedBusinessVars)
      businessVars.value = { ...businessVars.value, ...parsed }
      mergeRuleValue.value = parsed.mergeRule || 'sameSupplierSameDate'
    } catch (e) {
      console.error('加载业务变量失败:', e)
    }
  }
}

onMounted(() => {
  loadPageSettings() // 加载页面设置
  loadData()
  loadSuppliers() // ✅ 新增：加载供应商列表
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
