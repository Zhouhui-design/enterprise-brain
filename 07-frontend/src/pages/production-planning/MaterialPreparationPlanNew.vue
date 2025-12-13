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
      表头筛选模式：点击列标题右侧的筛选图标进行筛选，筛选作用于所有分页数据
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
            v-if="col.visible"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :fixed="col.prop === 'planNo' ? 'left' : undefined"
            :align="col.prop.includes('Quantity') ? 'right' : undefined"
            :filter-method="col.filterable ? handleColumnFilter : undefined"
            :filters="col.filterable ? getColumnFilters(col.prop) : undefined"
            :formatter="col.prop === 'demandDate' ? formatDate : undefined"
          />
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
      width="60%"
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
            <el-form-item label="备料物料编号" required>
              <el-input v-model="formData.materialCode" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备料物料名称" required>
              <el-input v-model="formData.materialName" />
            </el-form-item>
          </el-col>
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
            <el-form-item label="需求日期">
              <el-date-picker 
                v-model="formData.demandDate" 
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
import { ref, computed, onMounted } from 'vue'
import { Plus, Delete, Refresh, Setting } from '@element-plus/icons-vue'
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
  batchDelete
} = useMaterialPrepActions(loadData) // 传入刷新回调

// ========== 页面设置 ==========
const showSettings = ref(false)

// 默认列配置
const defaultColumns = [
  { prop: 'planNo', label: '备料计划编号', width: 160, filterable: true },
  { prop: 'sourcePlanNo', label: '来源主计划编号', width: 160, filterable: true },
  { prop: 'parentCode', label: '父件编号', width: 140, filterable: true },
  { prop: 'parentName', label: '父件名称', width: 180, filterable: true },
  { prop: 'parentScheduleQuantity', label: '父件排程数量', width: 140, filterable: false },
  { prop: 'materialCode', label: '备料物料编号', width: 140, filterable: true },
  { prop: 'materialName', label: '备料物料名称', width: 180, filterable: true },
  { prop: 'materialSource', label: '物料来源', width: 100, filterable: true },
  { prop: 'demandQuantity', label: '需求数量', width: 120, filterable: false },
  { prop: 'demandDate', label: '需求日期', width: 120, filterable: true }
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

// 可见列（按顺序排列）
const visibleColumns = computed(() => {
  return [...columnConfigs.value]
    .sort((a, b) => a.order - b.order)
})

// 表头筛选
const columnFilters = ref({})

const getColumnFilters = (prop) => {
  if (!tableData.value.length) return []
  
  const uniqueValues = [...new Set(
    tableData.value
      .map(row => row[prop])
      .filter(val => val !== null && val !== undefined && val !== '')
  )]
  
  return uniqueValues.map(val => ({ text: val, value: val }))
}

const handleColumnFilter = (value, row, column) => {
  const property = column.property
  return row[property] === value
}

// 筛选后的表格数据（注意：el-table的filter自带机制会处理）
const filteredTableData = computed(() => tableData.value)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const formData = ref({
  planNo: '',
  materialCode: '',
  materialName: '',
  demandQuantity: 0,
  materialSource: '外购',
  demandDate: null
})

// ========== 事件处理（只负责UI交互） ==========
const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    planNo: generatePlanNo(),
    materialCode: '',
    materialName: '',
    demandQuantity: 0,
    materialSource: '外购',
    demandDate: null
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

// ========== 初始化 ==========
onMounted(() => {
  initSettings(defaultColumns)  // 初始化页面设置
  loadData()
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
</style>
