<template>
  <div class="material-preparation-plan-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>备料计划</h2>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button size="small" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button size="small" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button size="small" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button size="small" @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button size="small" @click="showColumnControl = true">
          <el-icon><Setting /></el-icon>
          字段管理
        </el-button>
        <el-button size="small" @click="showPageSettings = true">
          <el-icon><Tools /></el-icon>
          页面设置
        </el-button>
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="备料计划编号">
          <el-input v-model="searchForm.planNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="来源主计划编号">
          <el-input v-model="searchForm.sourcePlanNo" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="备料物料编号">
          <el-input v-model="searchForm.materialCode" placeholder="请输入" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item label="需求日期">
          <el-date-picker
            v-model="searchForm.demandDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <EnhancedTable
        ref="tableRef"
        :data="tableData"
        :columns="visibleColumns"
        :show-filter="true"
        :show-pagination="false"
        :loading="loading"
        :stripe="true"
        :border="true"
        height="calc(100vh - 320px)"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <!-- 操作列 -->
        <template #operation="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </EnhancedTable>

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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="80%"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
        size="small"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备料计划编号" prop="planNo">
              <el-input v-model="formData.planNo" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源主计划编号" prop="sourcePlanNo">
              <el-input v-model="formData.sourcePlanNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来源工序计划编号" prop="sourceProcessPlanNo">
              <el-input v-model="formData.sourceProcessPlanNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父件编号" prop="parentCode">
              <el-input v-model="formData.parentCode" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="父件名称" prop="parentName">
              <el-input v-model="formData.parentName" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父件排程数量" prop="parentScheduleQuantity">
              <el-input-number v-model="formData.parentScheduleQuantity" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备料物料编号" prop="materialCode">
              <el-input v-model="formData.materialCode" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备料物料名称" prop="materialName">
              <el-input v-model="formData.materialName" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料来源" prop="materialSource">
              <el-select v-model="formData.materialSource" placeholder="请选择" style="width: 100%">
                <el-option label="外购" value="外购" />
                <el-option label="自制" value="自制" />
                <el-option label="委外" value="委外" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料单位" prop="materialUnit">
              <el-input v-model="formData.materialUnit" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="需求数量" prop="demandQuantity">
              <el-input-number v-model="formData.demandQuantity" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否需要MRP运算" prop="needMrp">
              <el-switch v-model="formData.needMrp" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实时库存" prop="realtimeStock">
              <el-input-number v-model="formData.realtimeStock" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="预计结存" prop="projectedBalance">
              <el-input-number v-model="formData.projectedBalance" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效库存" prop="availableStock">
              <el-input-number v-model="formData.availableStock" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来源工序" prop="sourceProcess">
              <el-input v-model="formData.sourceProcess" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车间名称" prop="workshopName">
              <el-input v-model="formData.workshopName" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="需求日期" prop="demandDate">
              <el-date-picker v-model="formData.demandDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否下推采购计划" prop="pushToPurchase">
              <el-switch v-model="formData.pushToPurchase" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否下推工序计划" prop="pushToProcess">
              <el-switch v-model="formData.pushToProcess" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="销售订单编号" prop="salesOrderNo">
              <el-input v-model="formData.salesOrderNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户订单编号" prop="customerOrderNo">
              <el-input v-model="formData.customerOrderNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主计划产品编号" prop="mainPlanProductCode">
              <el-input v-model="formData.mainPlanProductCode" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="主计划产品名称" prop="mainPlanProductName">
              <el-input v-model="formData.mainPlanProductName" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主计划排程数量" prop="mainPlanQuantity">
              <el-input-number v-model="formData.mainPlanQuantity" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单承诺交期" prop="promiseDeliveryDate">
              <el-date-picker v-model="formData.promiseDeliveryDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 字段管理对话框 -->
    <TableColumnControl
      v-model:visible="showColumnControl"
      :columns="allColumns"
      :visible-columns="visibleColumnProps"
      @update:visible-columns="handleColumnVisibilityChange"
    />

    <!-- 页面设置对话框 -->
    <PageSettings
      v-model:visible="showPageSettings"
      page-name="备料计划"
      settings-key="materialPreparationPlan"
      :settings="pageSettings"
      @save="handleSavePageSettings"
    />

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入备料计划" width="600px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="1"
        accept=".xlsx,.xls"
        drag
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只能上传 xlsx/xls 文件</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Delete, Printer, Setting, Tools, Refresh, UploadFilled } from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import TableColumnControl from '@/components/TableColumnControl/index.vue'
import PageSettings from '@/components/common/PageSettings.vue'
import * as XLSX from 'xlsx'
import api from '@/api/materialPreparationPlan'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  planNo: '',
  sourcePlanNo: '',
  materialCode: '',
  demandDateRange: null
})

// 所有列定义
const allColumns = ref([
  { prop: 'selection', label: '选择', type: 'selection', width: 55, fixed: 'left', visible: true },
  { prop: 'planNo', label: '备料计划编号', width: 160, sortable: true, filterable: true, fixed: 'left', visible: true },
  { prop: 'sourcePlanNo', label: '来源主计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'sourceProcessPlanNo', label: '来源工序计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'parentCode', label: '父件编号', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'parentName', label: '父件名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'parentScheduleQuantity', label: '父件排程数量', width: 140, sortable: true, align: 'right', visible: true },
  { prop: 'materialCode', label: '备料物料编号', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'materialName', label: '备料物料名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'materialSource', label: '物料来源', width: 100, sortable: true, filterable: true, visible: true },
  { prop: 'materialUnit', label: '物料单位', width: 100, sortable: true, filterable: true, visible: true },
  { prop: 'demandQuantity', label: '需求数量', width: 120, sortable: true, align: 'right', visible: true },
  { prop: 'needMrp', label: '是否需要MRP运算', width: 150, sortable: true, filterable: true, visible: true, 
    formatter: (row) => row.needMrp ? '是' : '否' },
  { prop: 'realtimeStock', label: '实时库存', width: 120, sortable: true, align: 'right', visible: true },
  { prop: 'projectedBalance', label: '预计结存', width: 120, sortable: true, align: 'right', visible: true },
  { prop: 'availableStock', label: '有效库存', width: 120, sortable: true, align: 'right', visible: true },
  { prop: 'replenishmentQuantity', label: '需补货数量', width: 120, sortable: true, align: 'right', visible: true,
    formatter: (row) => {
      const demandQty = parseFloat(row.demandQuantity || 0);
      const availableQty = parseFloat(row.availableStock || 0);
      const replenishment = demandQty - availableQty;
      return replenishment > 0 ? replenishment.toFixed(2) : '0.00';
    }
  },
  { prop: 'sourceProcess', label: '来源工序', width: 120, sortable: true, filterable: true, visible: true },
  { prop: 'workshopName', label: '车间名称', width: 120, sortable: true, filterable: true, visible: true },
  { prop: 'demandDate', label: '需求日期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.demandDate) },
  { prop: 'pushToPurchase', label: '是否下推采购计划', width: 150, sortable: true, filterable: true, visible: true,
    formatter: (row) => row.pushToPurchase ? '是' : '否' },
  { prop: 'pushToProcess', label: '是否下推工序计划', width: 150, sortable: true, filterable: true, visible: true,
    formatter: (row) => row.pushToProcess ? '是' : '否' },
  { prop: 'salesOrderNo', label: '销售订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'customerOrderNo', label: '客户订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'mainPlanProductCode', label: '主计划产品编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'mainPlanProductName', label: '主计划产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'mainPlanQuantity', label: '主计划排程数量', width: 140, sortable: true, align: 'right', visible: true },
  { prop: 'promiseDeliveryDate', label: '订单承诺交期', width: 120, sortable: true, filterable: true, visible: true,
    formatter: (row) => formatDateYMD(row.promiseDeliveryDate) },
  { prop: 'action', label: '操作', width: 150, fixed: 'right', visible: true }  // 注意:EnhancedTable使用operation插槽
])

// 可见列
const visibleColumnProps = ref(allColumns.value.filter(col => col.visible).map(col => col.prop))
const visibleColumns = computed(() => allColumns.value.filter(col => visibleColumnProps.value.includes(col.prop)))

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const formData = ref({})
const isEdit = ref(false)

// 表单验证规则
const formRules = {
  materialCode: [{ required: true, message: '请输入备料物料编号', trigger: 'blur' }],
  materialName: [{ required: true, message: '请输入备料物料名称', trigger: 'blur' }],
  demandQuantity: [{ required: true, message: '请输入需求数量', trigger: 'blur' }]
}

// 字段管理
const showColumnControl = ref(false)

// 页面设置
const showPageSettings = ref(false)
const pageSettings = ref({})

// 导入对话框
const importDialogVisible = ref(false)
const uploadRef = ref(null)
const importFile = ref(null)

// 生成备料计划编号
const generatePlanNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `MPP${year}${month}${day}${random}`
}

// 格式化日期为年-月-日
const formatDateYMD = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch (e) {
    return '-'
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    planNo: generatePlanNo(),
    sourcePlanNo: '',
    sourceProcessPlanNo: '',
    parentCode: '',
    parentName: '',
    parentScheduleQuantity: 0,
    materialCode: '',
    materialName: '',
    materialSource: '',
    materialUnit: '',
    demandQuantity: 0,
    needMrp: false,
    realtimeStock: 0,
    projectedBalance: 0,
    availableStock: 0,
    sourceProcess: '',
    workshopName: '',
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
}

// 加载数据
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
    
    // response已经是解包后的data，不需要再检查code
    const data = await api.getList(params)
    
    tableData.value = data.records || []
    pagination.total = data.total || 0
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  dialogTitle.value = '新增备料计划'
  resetForm()
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑备料计划'
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除备料计划"${row.planNo}"吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await api.deleteById(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗?`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    await api.batchDelete(ids)
    
    ElMessage.success('批量删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      await api.update(formData.value.id, formData.value)
    } else {
      await api.create(formData.value)
    }
    
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('保存失败:', error)
    if (error !== false) {
      ElMessage.error('保存失败')
    }
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 文件变化
const handleFileChange = (file) => {
  importFile.value = file.raw
}

// 确认导入
const handleConfirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  try {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // TODO: 调用后端API导入数据
      console.log('导入数据:', jsonData)
      
      ElMessage.success('导入成功')
      importDialogVisible.value = false
      loadData()
    }
    reader.readAsArrayBuffer(importFile.value)
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  }
}

// 导出
const handleExport = () => {
  try {
    const exportData = tableData.value.map(row => ({
      '备料计划编号': row.planNo,
      '来源主计划编号': row.sourcePlanNo,
      '来源工序计划编号': row.sourceProcessPlanNo,
      '计划物料编号': row.materialCode,
      '计划物料名称': row.materialName,
      '物料来源': row.materialSource,
      '物料单位': row.materialUnit,
      '需求数量': row.demandQuantity,
      '是否需要MRP运算': row.needMrp ? '是' : '否',
      '实时库存': row.realtimeStock,
      '预计结存': row.projectedBalance,
      '有效库存': row.availableStock,
      '来源工序': row.sourceProcess,
      '车间名称': row.workshopName,
      '需求日期': row.demandDate,
      '是否下推采购计划': row.pushToPurchase ? '是' : '否',
      '是否下推工序计划': row.pushToProcess ? '是' : '否',
      '销售订单编号': row.salesOrderNo,
      '客户订单编号': row.customerOrderNo,
      '主计划产品编号': row.mainPlanProductCode,
      '主计划产品名称': row.mainPlanProductName,
      '主计划排程数量': row.mainPlanQuantity,
      '订单承诺交期': row.promiseDeliveryDate
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '备料计划')
    XLSX.writeFile(workbook, `备料计划_${new Date().getTime()}.xlsx`)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 打印
const handlePrint = () => {
  window.print()
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置搜索
const handleResetSearch = () => {
  searchForm.planNo = ''
  searchForm.sourcePlanNo = ''
  searchForm.materialCode = ''
  searchForm.demandDateRange = null
  handleSearch()
}

// 刷新
const handleRefresh = () => {
  loadData()
}

// 选择变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 排序变化
const handleSortChange = ({ prop, order }) => {
  console.log('排序变化:', prop, order)
  // TODO: 实现排序
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
}

// 字段可见性变化
const handleColumnVisibilityChange = (visibleProps) => {
  visibleColumnProps.value = visibleProps
  // TODO: 保存到后端或localStorage
}

// 保存页面设置
const handleSavePageSettings = (settings) => {
  pageSettings.value = settings
  // TODO: 保存到后端或localStorage
  ElMessage.success('页面设置保存成功')
}

// 页面加载
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.material-preparation-plan-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    background: white;
    padding: 16px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .search-bar {
    background: white;
    padding: 16px 20px;
    border-radius: 4px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .table-container {
    background: white;
    padding: 16px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .pagination-container {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

@media print {
  .page-header .header-actions,
  .search-bar,
  .pagination-container {
    display: none !important;
  }
}
</style>
