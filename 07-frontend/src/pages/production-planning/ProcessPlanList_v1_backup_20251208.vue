<template>
  <div class="process-plan-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>工序计划列表</h2>
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
        <el-button size="small" @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button size="small" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button size="small" @click="settingsVisible = true">
          <el-icon><Setting /></el-icon>
          页面设置
        </el-button>
        <el-button size="small" @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="工序计划编号">
          <el-input v-model="searchForm.planNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="主生产计划编号">
          <el-input v-model="searchForm.masterPlanNo" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="工序名称">
          <el-input v-model="searchForm.processName" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="计划排程日期">
          <el-date-picker
            v-model="searchForm.scheduleDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
        <el-form-item>
          <TableColumnControl v-model:columns="allColumns" @change="handleColumnChange" />
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
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <!-- 产品图片列 -->
        <template #productImage="{ row }">
          <el-image
            v-if="row.productImage"
            :src="row.productImage"
            :preview-src-list="[row.productImage]"
            fit="cover"
            style="width: 50px; height: 50px; border-radius: 4px;"
          />
          <span v-else style="color: #999;">无图片</span>
        </template>

        <!-- 操作列 -->
        <template #actions="{ row }">
          <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </EnhancedTable>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑工序计划' : '新增工序计划'"
      width="80%"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="工序计划编号" prop="planNo">
              <el-input v-model="formData.planNo" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="主生产计划编号" prop="masterPlanNo">
              <el-input v-model="formData.masterPlanNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工序名称" prop="processName">
              <el-input v-model="formData.processName" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="计划排程日期" prop="scheduleDate">
              <el-date-picker v-model="formData.scheduleDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计划排程数量" prop="scheduleQuantity">
              <el-input-number v-model="formData.scheduleQuantity" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计划完工日期" prop="completionDate">
              <el-date-picker v-model="formData.completionDate" type="date" placeholder="选择日期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="生产产品编号" prop="productCode">
              <el-input v-model="formData.productCode" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="生产产品名称" prop="productName">
              <el-input v-model="formData.productName" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工序负责人" prop="processManager">
              <el-input v-model="formData.processManager" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="车间名称" prop="workshopName">
              <el-input v-model="formData.workshopName" placeholder="请输入" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="定额工时" prop="standardWorkHours">
              <el-input-number v-model="formData.standardWorkHours" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="本次占用工时" prop="usedWorkHours">
              <el-input-number v-model="formData.usedWorkHours" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 字段管理对话框 - 已移除,改用TableColumnControl内联 -->

    <!-- 页面设置对话框 -->
    <PageSettings
      v-model:visible="settingsVisible"
      page-name="工序计划列表"
      settings-key="processPlanList"
      :settings="pageSettings"
      @save="handleSavePageSettings"
    />

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入工序计划" width="500px">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">只支持 xlsx/xls 格式文件</div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确定导入</el-button>
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
import api from '@/api/processPlan'

// 表格数据
const tableData = ref([])
const selectedRows = ref([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  planNo: '',
  masterPlanNo: '',
  processName: '',
  scheduleDateRange: []
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const importDialogVisible = ref(false)
const settingsVisible = ref(false)
const isEdit = ref(false)

// 表单数据
const formData = ref({})
const formRef = ref(null)

// 表单验证规则
const formRules = {
  processName: [{ required: true, message: '请输入工序名称', trigger: 'blur' }],
  scheduleQuantity: [{ required: true, message: '请输入计划排程数量', trigger: 'blur' }]
}

// 页面设置
const pageSettings = ref({})

// 所有列定义
const allColumns = ref([
  { prop: 'selection', label: '选择', type: 'selection', width: 55, fixed: 'left', visible: true },
  { prop: 'scheduleDate', label: '计划排程日期', width: 120, sortable: true, filterable: true, visible: true },
  { prop: 'salesOrderNo', label: '销售订单编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'masterPlanNo', label: '主生产计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'shippingPlanNo', label: '发货计划编号', width: 160, sortable: true, filterable: true, visible: true },
  { prop: 'productCode', label: '生产产品编号', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'productName', label: '生产产品名称', width: 180, sortable: true, filterable: true, visible: true },
  { prop: 'productImage', label: '产品图片', width: 100, slot: 'productImage', visible: true },
  { prop: 'processManager', label: '工序负责人', width: 120, filterable: true, visible: true },
  { prop: 'processName', label: '工序名称', width: 140, sortable: true, filterable: true, visible: true },
  { prop: 'planNo', label: '工序计划编号', width: 160, sortable: true, filterable: true, fixed: 'left', visible: true },
  { prop: 'scheduleQuantity', label: '计划排程数量', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'usedWorkHours', label: '本次占用工时', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'productUnit', label: '产品单位', width: 100, visible: true },
  { prop: 'level0Demand', label: '0阶需求数量', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'completionDate', label: '计划完工日期', width: 120, sortable: true, visible: true },
  { prop: 'workshopName', label: '车间名称', width: 120, filterable: true, visible: true },
  { prop: 'dailyAvailableHours', label: '工序当天可用工时', width: 150, sortable: true, align: 'right', visible: true },
  { prop: 'remainingScheduleHours', label: '还需排程工时', width: 130, sortable: true, align: 'right', visible: true },
  { prop: 'scheduleCount', label: '排程次数', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'standardWorkHours', label: '定额工时', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'standardWorkQuota', label: '定时工额', width: 100, sortable: true, align: 'right', visible: false },
  { prop: 'scheduledHours', label: '已排工时', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'unscheduledHours', label: '未排工时', width: 100, sortable: true, align: 'right', visible: true },
  { prop: 'sourcePageName', label: '来源页面名称', width: 130, filterable: true, visible: false },
  { prop: 'sourceNo', label: '来源编号', width: 160, filterable: true, visible: false },
  { prop: 'previousScheduleNo', label: '上一个排程单号', width: 160, filterable: true, visible: false },
  { prop: 'customerName', label: '客户名称', width: 150, filterable: true, visible: true },
  { prop: 'level0ProductName', label: '0阶产品名称', width: 150, filterable: true, visible: false },
  { prop: 'level0ProductCode', label: '0阶产品编号', width: 140, filterable: true, visible: false },
  { prop: 'level0ProductionQty', label: '0阶主计划生产数量', width: 160, sortable: true, align: 'right', visible: false },
  { prop: 'productSource', label: '产品来源', width: 120, filterable: true, visible: false },
  { prop: 'bomNo', label: 'BOM编号', width: 160, filterable: true, visible: false },
  { prop: 'submittedBy', label: '提交人', width: 100, filterable: true, visible: true },
  { prop: 'submittedAt', label: '提交时间', width: 160, sortable: true, visible: true },
  { prop: 'actions', label: '操作', width: 180, fixed: 'right', slot: 'actions', visible: true }
])

// 可见列
const visibleColumns = computed(() => allColumns.value.filter(col => col.visible))

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      planNo: searchForm.planNo,
      masterPlanNo: searchForm.masterPlanNo,
      processName: searchForm.processName
    }
    
    // 添加日期范围
    if (searchForm.scheduleDateRange && searchForm.scheduleDateRange.length === 2) {
      params.scheduleDateStart = searchForm.scheduleDateRange[0]
      params.scheduleDateEnd = searchForm.scheduleDateRange[1]
    }
    
    const data = await api.getList(params)
    tableData.value = data.records || []
    pagination.total = data.total || 0
    
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 排序变化
const handleSortChange = ({ column, prop, order }) => {
  console.log('排序变化:', prop, order)
}

// 搜索
const handleSearch = () => {
  loadData()
}

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = Array.isArray(searchForm[key]) ? [] : ''
  })
  loadData()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  formData.value = {
    planNo: generatePlanNo(),
    scheduleDate: new Date(),
    scheduleQuantity: 0,
    usedWorkHours: 0,
    standardWorkHours: 0
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除工序计划"${row.planNo}"吗?`, '提示', {
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
      ElMessage.error('删除失败: ' + (error.message || '未知错误'))
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
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('批量删除失败: ' + (error.message || '未知错误'))
    }
  }
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      await api.update(formData.value.id, formData.value)
      ElMessage.success('更新成功')
    } else {
      await api.create(formData.value)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('保存失败:', error)
    if (error !== false) {
      ElMessage.error('保存失败: ' + (error.message || '未知错误'))
    }
  }
}

// 生成计划编号
const generatePlanNo = () => {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `PP${year}${timestamp}${random}`
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

let importFile = null

const handleFileChange = (file) => {
  importFile = file.raw
}

const confirmImport = () => {
  if (!importFile) {
    ElMessage.warning('请选择文件')
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'binary' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      // TODO: 数据映射和导入逻辑
      ElMessage.success(`成功导入 ${jsonData.length} 条数据`)
      importDialogVisible.value = false
      loadData()
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败')
    }
  }
  reader.readAsBinaryString(importFile)
}

// 导出
const handleExport = () => {
  const exportData = tableData.value.map(row => ({
    '工序计划编号': row.planNo,
    '计划排程日期': row.scheduleDate,
    '主生产计划编号': row.masterPlanNo,
    '工序名称': row.processName,
    '计划排程数量': row.scheduleQuantity,
    '工序负责人': row.processManager,
    '车间名称': row.workshopName,
    '计划完工日期': row.completionDate
  }))
  
  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '工序计划')
  XLSX.writeFile(workbook, `工序计划_${new Date().getTime()}.xlsx`)
  
  ElMessage.success('导出成功')
}

// 打印
const handlePrint = () => {
  window.print()
  ElMessage.success('打印预览已打开')
}

// 分页变化
const handlePageChange = (page) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

// 列管理更新
const handleColumnChange = (newColumns) => {
  // 列已经通过v-model自动更新
  console.log('列配置已更新:', newColumns)
  // 强制触发视图更新
  if (tableRef.value) {
    tableRef.value.$forceUpdate && tableRef.value.$forceUpdate()
  }
}

// 页面设置保存
const handleSavePageSettings = (settings) => {
  pageSettings.value = settings
  ElMessage.success('页面设置已保存')
}

// 初始化
onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.process-plan-list-container {
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
    padding: 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    background: white;
    padding: 16px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

@media print {
  .page-header,
  .search-bar,
  .pagination-container {
    display: none;
  }
}
</style>
