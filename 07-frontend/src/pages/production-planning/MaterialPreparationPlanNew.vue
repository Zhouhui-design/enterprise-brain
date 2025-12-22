<template>
  <div class="material-prep-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>备料计划</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button 
          size="small" 
          @click="handleBatchDelete" 
          :disabled="!hasSelection"
        >
          <el-icon><Delete /></el-icon>
          批量删除
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

    <!-- 筛选提示（表头筛选模式）-->
    <el-alert 
      type="info" 
      :closable="false" 
      style="margin: 0 20px 15px"
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
        height="calc(100vh - 280px)"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        
        <template v-for="col in visibleColumns" :key="col.prop">
          <el-table-column
            v-if="col && col.prop"
            :prop="col.prop"
            :width="col.width"
            :fixed="col.prop === 'planNo' ? 'left' : false"
            :align="col.prop.includes('Quantity') ? 'right' : 'left'"
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
            <template #default="{ row, column, $index }">
              <span>{{ getFormattedValue(row, col.prop) }}</span>
            </template>
          </el-table-column>
        </template>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑备料计划' : '新增备料计划'"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        label-width="140px"
        size="small"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备料计划编号">
              <el-input v-model="formData.planNo" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源主计划编号">
              <el-input v-model="formData.sourcePlanNo" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来源工序计划编号">
              <el-input v-model="formData.sourceProcessPlanNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父件编号">
              <el-input v-model="formData.parentCode" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="父件名称">
              <el-input v-model="formData.parentName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父件排程数量">
              <el-input-number 
                v-model="formData.parentScheduleQuantity" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备料物料编号" required>
              <el-input v-model="formData.materialCode" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备料物料名称" required>
              <el-input v-model="formData.materialName" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料来源">
              <el-select v-model="formData.materialSource" style="width: 100%">
<el-option label="外购" value="外购" />
                <el-option label="自制" value="自制" />
                <el-option label="委外" value="委外" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料单位">
              <el-input v-model="formData.materialUnit" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="需求数量" required>
              <el-input-number 
                v-model="formData.demandQuantity" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否需要MRP运算">
              <el-switch v-model="formData.needMrp" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="实时库存">
              <el-input-number 
                v-model="formData.realtimeStock" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计结存">
              <el-input-number 
                v-model="formData.projectedBalance" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="有效库存">
              <el-input-number 
                v-model="formData.availableStock" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源工序">
              <el-input v-model="formData.sourceProcess" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车间名称">
              <el-input v-model="formData.workshopName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父件工序名称">
              <el-input v-model="formData.parentProcessName" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序间隔工时">
              <el-input-number 
                v-model="formData.processIntervalHours" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序间隔单位">
              <el-select v-model="formData.processIntervalUnit" style="width: 100%">
                <el-option label="小时" value="小时" />
                <el-option label="天" value="天" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序计划排程日期">
              <el-date-picker 
                v-model="formData.processScheduleDate" 
                type="date"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="需求日期">
              <el-date-picker 
                v-model="formData.demandDate" 
                type="date"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否下推采购计划">
              <el-switch v-model="formData.pushToPurchase" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否下推工序计划">
              <el-switch v-model="formData.pushToProcess" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售订单编号">
              <el-input v-model="formData.salesOrderNo" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户订单编号">
              <el-input v-model="formData.customerOrderNo" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="主计划产品编号">
              <el-input v-model="formData.mainPlanProductCode" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主计划产品名称">
              <el-input v-model="formData.mainPlanProductName" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="主计划排程数量">
              <el-input-number 
                v-model="formData.mainPlanQuantity" 
                :min="0" 
                :precision="2"
                style="width: 100%"
              />
</el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单承诺交期">
              <el-date-picker 
                v-model="formData.promiseDeliveryDate" 
                type="date"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="processing">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Plus, Delete, Refresh, Setting, Search } from '@element-plus/icons-vue'
// 使用新架构的Composables
import { 
  useMaterialPrepList,
  useMaterialPrepActions 
} from '@/features/material-preparation'
import { usePageSettings } from '@/features/material-preparation/composables/usePageSettings'
import PageSettingsDialog from '@/features/material-preparation/components/PageSettingsDialog.vue'

// ========== 列表逻辑（独立） ==========
const {
  loading,
  tableData,
  selectedRows,
  pagination,
  searchForm,
  hasSelection,
  loadData,
  handleSearch,
  handleResetSearch,
  handleRefresh,
  handlePageChange,
  handlePageSizeChange,
  handleSelectionChange
} = useMaterialPrepList()

// ========== 操作逻辑（独立） ==========
const {
  processing,
  generatePlanNo,
  create,
  update,
  deleteOne,
  batchDelete,
  pushToProcess
} = useMaterialPrepActions(loadData) // 传入刷新回调

// ========== 页面设置 ==========
const showSettings = ref(false)

// 默认列配置（按改造前页面的完整字段）
const defaultColumns = [
  { prop: 'planNo', label: '备料计划编号', width: 160, filterable: true, visible: true },
  { prop: 'sourcePlanNo', label: '来源主计划编号', width: 160, filterable: true, visible: true },
  { prop: 'sourceProcessPlanNo', label: '来源工序计划编号', width: 160, filterable: true, visible: true },
  { prop: 'parentCode', label: '父件编号', width: 140, filterable: true, visible: true },
  { prop: 'parentName', label: '父件名称', width: 180, filterable: true, visible: true },
  { prop: 'parentScheduleQuantity', label: '父件排程数量', width: 140, filterable: false, visible: true },
  { prop: 'materialCode', label: '备料物料编号', width: 140, filterable: true, visible: true },
  { prop: 'materialName', label: '备料物料名称', width: 180, filterable: true, visible: true },
  { prop: 'materialSource', label: '物料来源', width: 100, filterable: true, visible: true },
  { prop: 'materialUnit', label: '物料单位', width: 100, filterable: true, visible: true },
  { prop: 'demandQuantity', label: '需求数量', width: 120, filterable: false, visible: true },
  { prop: 'needMrp', label: '是否需要MRP运算', width: 150, filterable: true, visible: true },
  { prop: 'realtimeStock', label: '实时库存', width: 120, filterable: false, visible: true },
  { prop: 'projectedBalance', label: '预计结存', width: 120, filterable: false, visible: true },
  { prop: 'availableStock', label: '有效库存', width: 120, filterable: false, visible: true },
  { prop: 'replenishmentQuantity', label: '需补货数量', width: 120, filterable: false, visible: true },
  { prop: 'sourceProcess', label: '来源工序', width: 120, filterable: true, visible: true },
  { prop: 'workshopName', label: '车间名称', width: 120, filterable: true, visible: true },
  { prop: 'parentProcessName', label: '父件工序名称', width: 140, filterable: true, visible: true },
  { prop: 'processIntervalHours', label: '工序间隔工时', width: 140, filterable: false, visible: true },
  { prop: 'processIntervalUnit', label: '工序间隔单位', width: 140, filterable: true, visible: true },
  { prop: 'processScheduleDate', label: '工序计划排程日期', width: 160, filterable: true, visible: true },
  { prop: 'realProcessScheduleDate', label: '真工序计划排程日期', width: 180, filterable: true, visible: true },
  { prop: 'demandDate', label: '需求日期', width: 120, filterable: true, visible: true },
  { prop: 'pushToPurchase', label: '是否下推采购计划', width: 150, filterable: true, visible: true },
  { prop: 'pushToProcess', label: '是否下推工序计划', width: 150, filterable: true, visible: true },
  { prop: 'salesOrderNo', label: '销售订单编号', width: 160, filterable: true, visible: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160, filterable: true, visible: true },
  { prop: 'mainPlanProductCode', label: '主计划产品编号', width: 160, filterable: true, visible: true },
  { prop: 'mainPlanProductName', label: '主计划产品名称', width: 180, filterable: true, visible: true },
  { prop: 'mainPlanScheduleQuantity', label: '主计划排程数量', width: 140, filterable: false, visible: true },
  { prop: 'promiseDeliveryDate', label: '订单承诺交期', width: 120, filterable: true, visible: true }
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
} = usePageSettings('material-preparation')

// 可见列（按顺序排列） - 增强错误处理
const visibleColumns = computed(() => {
  try {
    // 如果columnConfigs还没有初始化，先使用defaultColumns
    if (!columnConfigs.value || columnConfigs.value.length === 0) {
      console.log('🔧 使用默认列配置:', defaultColumns.length, '个列')
      return defaultColumns
    }
    
    const visible = [...columnConfigs.value]
      .sort((a, b) => (a?.order || 0) - (b?.order || 0))
      .filter(col => col && col.visible)  // 添加null检查和过滤条件
    
    console.log('🔧 使用保存的列配置:', {
      总数: columnConfigs.value.length,
      可见: visible.length,
      隐藏: columnConfigs.value.length - visible.length
    })
    
    return visible
  } catch (error) {
    console.error('❌ visibleColumns计算属性出错:', error)
    return defaultColumns
  }
})

// 表头模糊搜索
const columnSearchValues = ref({})

const handleColumnSearch = () => {
  // 触发筛选，使用computed自动更新
}

// 筛选后的表格数据（模糊搜索） - 严格数据过滤
const filteredTableData = computed(() => {
  try {
    if (!tableData.value || !Array.isArray(tableData.value)) {
      console.log('🔧 tableData不是有效数组:', tableData.value)
      return []
    }
    
    // 严格过滤：只保留有效的对象
    let data = tableData.value.filter(row => {
      return row && typeof row === 'object' && !Array.isArray(row) && row.planNo !== undefined
    })
    
    console.log('🔧 过滤后的有效数据:', data.length, '条 (原始:', tableData.value.length, '条)')
    
    // 对每个有搜索值的列进行筛选
    if (columnSearchValues.value) {
      Object.keys(columnSearchValues.value).forEach(prop => {
        const searchValue = columnSearchValues.value[prop]
        if (searchValue && searchValue.trim()) {
          data = data.filter(row => {
            if (!row) return false
            
            const cellValue = row[prop]
            if (cellValue === null || cellValue === undefined) return false
            
            // 转为字符串进行模糊匹配（不区分大小写）
            return String(cellValue)
              .toLowerCase()
              .includes(searchValue.toLowerCase().trim())
          })
        }
      })
    }
    
    return data
  } catch (error) {
    console.error('❌ filteredTableData计算属性出错:', error)
    return []
  }
})
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const formData = ref({
  planNo: '',
  sourcePlanNo: '',
  sourceProcessPlanNo: '',
  parentCode: '',
  parentName: '',
  parentScheduleQuantity: 0,
  materialCode: '',
  materialName: '',
  materialSource: '外购',
  materialUnit: '',
  demandQuantity: 0,
  needMrp: false,
  realtimeStock: 0,
  projectedBalance: 0,
  availableStock: 0,
  sourceProcess: '',
  workshopName: '',
  parentProcessName: '',
  processIntervalHours: 0,
  processIntervalUnit: '小时',
  processScheduleDate: null,
  demandDate: null,
  pushToPurchase: false,
  pushToProcess: false,
  salesOrderNo: '',
  customerOrderNo: '',
  mainPlanProductCode: '',
  mainPlanProductName: '',
  mainPlanQuantity: 0,
  promiseDeliveryDate: null
})

// ========== 事件处理（只负责UI交互） ==========
const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    planNo: generatePlanNo(),
    sourcePlanNo: '',
    sourceProcessPlanNo: '',
    parentCode: '',
    parentName: '',
    parentScheduleQuantity: 0,
    materialCode: '',
    materialName: '',
    materialSource: '外购',
    materialUnit: '',
    demandQuantity: 0,
    needMrp: false,
    realtimeStock: 0,
    projectedBalance: 0,
    availableStock: 0,
    sourceProcess: '',
    workshopName: '',
    parentProcessName: '',
    processIntervalHours: 0,
    processIntervalUnit: '小时',
    processScheduleDate: null,
    demandDate: null,
    pushToPurchase: false,
    pushToProcess: false,
    salesOrderNo: '',
    customerOrderNo: '',
    mainPlanProductCode: '',
    mainPlanProductName: '',
    mainPlanQuantity: 0,
    promiseDeliveryDate: null
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  await deleteOne(row)
}

const handleBatchDelete = async () => {
  await batchDelete(selectedRows.value)
}

const handleSave = async () => {
  const success = isEdit.value
    ? await update(formData.value.id, formData.value)
    : await create(formData.value)
  
  if (success) {
    // 重新加载数据以获取最新的plan信息
    await loadData()
    
    // 检查最后保存的记录是否需要推送
    const lastPlan = tableData.value.find(plan => 
      plan.planNo === formData.value.planNo
    )
    
    if (lastPlan && lastPlan.pushToProcess) {
      // 自动推送到工序计划
      try {
        await pushToProcess(lastPlan)
      } catch (error) {
        console.error('自动推送失败:', error)
        ElMessage.warning('自动推送工序计划失败，请手动推送')
      }
    }
    
    dialogVisible.value = false
  }
}

// ========== 工具函数 ==========
const formatDate = ({ row, column, cellValue }) => {
  if (!cellValue) return '-'
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

// 格式化布尔值
const formatBoolean = ({ row, column, cellValue }) => {
  if (cellValue === null || cellValue === undefined) return '-'
  return cellValue ? '是' : '否'
}

// 格式化数值
const formatNumber = ({ row, column, cellValue }) => {
  if (cellValue === null || cellValue === undefined) return '0.00'
  const value = parseFloat(cellValue)
  return isNaN(value) ? '0.00' : value.toFixed(2)
}

// 获取格式化值 - 直接返回格式化后的值
const getFormattedValue = (row, prop) => {
  try {
    if (!row || typeof row !== 'object') {
      console.warn('⚠️ getFormattedValue: row is not an object', { row, prop })
      return '-'
    }

    const cellValue = row[prop]
    
    // 日期字段
    if (['demandDate', 'processScheduleDate', 'promiseDeliveryDate'].includes(prop)) {
      if (!cellValue) return '-'
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
    
    // 真工序计划排程日期（计算字段）
    if (prop === 'realProcessScheduleDate') {
      if (!row.processScheduleDate) return '-'
      try {
        const date = new Date(row.processScheduleDate)
        if (isNaN(date.getTime())) return '-'
        date.setDate(date.getDate() + 1)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch {
        return '-'
      }
    }
    
    // 布尔字段
    if (['needMrp', 'pushToPurchase', 'pushToProcess'].includes(prop)) {
      return cellValue ? '是' : '否'
    }
    
    // 数值字段（保留两位小数）
    if (['processIntervalHours', 'realtimeStock', 'projectedBalance', 'availableStock', 'parentScheduleQuantity', 'mainPlanScheduleQuantity', 'demandQuantity'].includes(prop)) {
      if (cellValue === null || cellValue === undefined) return '0.00'
      const value = parseFloat(cellValue)
      return isNaN(value) ? '0.00' : value.toFixed(2)
    }
    
    // 需补货数量（直接使用数据库字段）
    if (prop === 'replenishmentQuantity') {
      // 直接使用数据库字段，如果没有则计算
      let replenishment = parseFloat(cellValue || 0)
      
      // 如果数据库字段为空或0，则实时计算
      if (!replenishment || replenishment === 0) {
        const demandQty = parseFloat(row.demandQuantity || 0)
        const availableQty = parseFloat(row.availableStock || 0)
        replenishment = demandQty - availableQty
      }
      
      return replenishment > 0 ? replenishment.toFixed(2) : '0.00'
    }
    
    // 默认处理
    if (cellValue === null || cellValue === undefined) return '-'
    return String(cellValue)
    
  } catch (error) {
    console.error('❌ getFormattedValue错误:', error, { prop, row })
    return '-'
  }
}

// 保留原有的 getFormatter 函数以防其他地方使用
const getFormatter = (prop) => {
  return ({ row, column, cellValue }) => getFormattedValue(row, prop)
}

// ========== 初始化 ==========
onMounted(async () => {
  try {
    console.log('🔧 备料计划页面开始初始化')
    
    // 先初始化页面设置
    initSettings(defaultColumns)
    
    // 等待下一个tick确保响应式更新完成
    await nextTick()
    
    // 然后加载数据
    loadData()
    
    console.log('✅ 备料计划页面初始化完成')
  } catch (error) {
    console.error('❌ 备料计划页面初始化失败:', error)
  }
})

// ========== 组件清理 ==========
onUnmounted(() => {
  console.log('🧹 备料计划页面开始清理')
  
  try {
    // 清理搜索值，防止内存泄漏
    columnSearchValues.value = {}
    
    // 清理选中行
    selectedRows.value = []
    
    // 清理表格数据引用
    tableData.value = []
    
    console.log('✅ 备料计划页面清理完成')
  } catch (error) {
    console.error('❌ 页面清理时出错:', error)
  }
})
</script>

<style scoped lang="scss">
.material-prep-container {
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
}

.table-header-cell .header-label {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.table-header-cell .header-search :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

.table-header-cell .header-search :deep(.el-input__wrapper):hover {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

.table-header-cell .header-search :deep(.el-input__wrapper).is-focus {
  box-shadow: 0 0 0 1px #409eff inset !important;
}

.table-header-cell .header-search :deep(.el-input__inner) {
  font-size: 12px;
  height: 26px;
  line-height: 26px;
}

.table-header-cell .header-search :deep(.el-input__prefix) {
  font-size: 12px;
}
</style>