<template>
  <div class="process-list-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>工序列表</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增工序
        </el-button>
        <el-button type="danger" size="small" :disabled="!hasSelection" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="success" size="small" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="warning" size="small" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button size="small" @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button size="small" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="工序编号">
          <el-input v-model="searchForm.processCode" placeholder="请输入工序编号" clearable size="small" />
        </el-form-item>
        <el-form-item label="工序名称">
          <el-input v-model="searchForm.processName" placeholder="请输入工序名称" clearable size="small" />
        </el-form-item>
        <el-form-item label="所属车间">
          <el-input v-model="searchForm.workshopName" placeholder="请输入车间名称" clearable size="small" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button size="small" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon :size="24"><Operation /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">工序总数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inStorage }}</div>
            <div class="stat-label">需入库工序</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon :size="24"><OfficeBuilding /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.workshops }}</div>
            <div class="stat-label">关联车间数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 按钮工具栏 -->
    <div class="toolbar" style="margin: 20px 0; display: flex; gap: 10px;">
      <el-button type="primary" @click="handleCreate">新增工序</el-button>
      <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">批量删除</el-button>
      <el-button type="success" :disabled="selectedRows.length === 0" @click="handleLoadToCapacityTable">加载到工序能力负荷表</el-button>
      <el-button @click="handleImport">导入</el-button>
      <el-button @click="handleExport">导出</el-button>
      <el-button @click="handlePrint">打印</el-button>
    </div>

    <!-- 主表格 -->
    <el-table 
      ref="tableRef"
      :data="paginatedTableData" 
      stripe 
      border
      :height="tableHeight"
      @selection-change="handleSelectionChange"
      highlight-current-row
    >
      <el-table-column type="selection" width="55" fixed="left" />
      <el-table-column type="index" label="序号" width="70" align="center" fixed="left" />
      <el-table-column prop="processCode" label="工序编号" width="140" fixed="left" />
      <el-table-column prop="processName" label="工序名称" width="180" fixed="left">
        <template #default="{ row }">
          <el-link type="primary" @click="handleView(row)">{{ row.processName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="processPrincipal" label="工序负责人" width="120" />
      <el-table-column prop="dispatchMethod" label="派工方式" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.dispatchMethod === 'auto'" type="success">自动派工</el-tag>
          <el-tag v-else-if="row.dispatchMethod === 'manual'" type="warning">手动派工</el-tag>
          <el-tag v-else>{{ row.dispatchMethod }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="selfOrOutsource" label="自制/外协" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.selfOrOutsource === '自制'" type="primary">自制</el-tag>
          <el-tag v-else-if="row.selfOrOutsource === '外协'" type="warning">外协</el-tag>
          <el-tag v-else type="info">{{ row.selfOrOutsource || '未设置' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="availableWorkstations" label="可用工位数量" width="130" align="center" />
      <el-table-column prop="isStorage" label="是否入库" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isStorage" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="completionWarehouse" label="完工绑定仓库" width="150" />
      <el-table-column prop="workshopName" label="所属车间名称" width="150" />
      <el-table-column prop="processWage" label="工序工资" width="120" align="right">
        <template #default="{ row }">
          ¥{{ row.processWage?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="success" size="small" @click="handleView(row)">查看</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100, 200]"
        :total="totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="dialogTitle" 
      width="800px" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="formData" label-width="140px" :rules="formRules" ref="formRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序编号" prop="processCode">
              <el-input v-model="formData.processCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序名称" prop="processName">
              <el-input v-model="formData.processName" placeholder="请输入工序名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工序负责人" prop="processPrincipal">
              <el-input v-model="formData.processPrincipal" placeholder="请输入负责人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="派工方式" prop="dispatchMethod">
              <el-select v-model="formData.dispatchMethod" placeholder="请选择派工方式" style="width: 100%;">
                <el-option label="自动派工" value="auto" />
                <el-option label="手动派工" value="manual" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自制/外协" prop="selfOrOutsource">
              <el-select v-model="formData.selfOrOutsource" placeholder="请选择自制或外协" style="width: 100%;">
                <el-option label="自制" value="自制" />
                <el-option label="外协" value="外协" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可用工位数量" prop="availableWorkstations">
              <el-input-number v-model="formData.availableWorkstations" :min="0" :precision="0" placeholder="请输入工位数量" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="是否入库" prop="isStorage">
              <el-switch v-model="formData.isStorage" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="完工绑定仓库" prop="completionWarehouse">
              <el-input v-model="formData.completionWarehouse" placeholder="请输入仓库名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属车间名称" prop="workshopName">
              <el-input v-model="formData.workshopName" placeholder="请输入车间名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序工资" prop="processWage">
              <el-input-number v-model="formData.processWage" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="工序详情" 
      width="700px" 
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border v-if="currentProcess">
        <el-descriptions-item label="工序编号">{{ currentProcess.processCode }}</el-descriptions-item>
        <el-descriptions-item label="工序名称">{{ currentProcess.processName }}</el-descriptions-item>
        <el-descriptions-item label="工序负责人">{{ currentProcess.processPrincipal }}</el-descriptions-item>
        <el-descriptions-item label="派工方式">
          <el-tag v-if="currentProcess.dispatchMethod === 'auto'" type="success">自动派工</el-tag>
          <el-tag v-else-if="currentProcess.dispatchMethod === 'manual'" type="warning">手动派工</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="自制/外协">
          <el-tag v-if="currentProcess.selfOrOutsource === '自制'" type="primary">自制</el-tag>
          <el-tag v-else-if="currentProcess.selfOrOutsource === '外协'" type="warning">外协</el-tag>
          <el-tag v-else type="info">未设置</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="可用工位数量">{{ currentProcess.availableWorkstations || 0 }}</el-descriptions-item>
        <el-descriptions-item label="是否入库">
          <el-tag v-if="currentProcess.isStorage" type="success">是</el-tag>
          <el-tag v-else type="info">否</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="完工绑定仓库">{{ currentProcess.completionWarehouse }}</el-descriptions-item>
        <el-descriptions-item label="所属车间名称">{{ currentProcess.workshopName }}</el-descriptions-item>
        <el-descriptions-item label="工序工资">¥{{ currentProcess.processWage?.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentProcess.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入工序" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".xlsx,.xls"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            仅支持 xlsx/xls 格式文件，大小不超过 10MB
          </div>
        </template>
      </el-upload>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImportConfirm">确定导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, Plus, Upload, Download, Printer, Refresh, 
  Operation, CircleCheck, OfficeBuilding, UploadFilled 
} from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import axios from 'axios'

// 使用环境变量或默认使用本机IP，支持局域网访问
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.2.229:3005/api'

// 创建axios实例，添加超时配置
const axiosInstance = axios.create({
  timeout: 5000, // 5秒超时
  baseURL: API_BASE_URL
})

// 数据
const tableRef = ref(null)
const formRef = ref(null)
const searchForm = ref({
  processCode: '',
  processName: '',
  workshopName: ''
})

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentProcess = ref(null)
const isEdit = ref(false)
const uploadFile = ref(null)

// 表单数据
const formData = ref({
  processCode: '',
  processName: '',
  processPrincipal: '',
  dispatchMethod: '',
  selfOrOutsource: '',
  availableWorkstations: 0,
  isStorage: false,
  completionWarehouse: '',
  workshopName: '',
  processWage: 0
})

// 表单验证规则
const formRules = {
  processName: [
    { required: true, message: '请输入工序名称', trigger: 'blur' }
  ],
  processPrincipal: [
    { required: true, message: '请输入工序负责人', trigger: 'blur' }
  ],
  dispatchMethod: [
    { required: true, message: '请选择派工方式', trigger: 'change' }
  ],
  workshopName: [
    { required: true, message: '请输入所属车间名称', trigger: 'blur' }
  ]
}

// 统计数据
const stats = ref({
  total: 0,
  inStorage: 0,
  workshops: 0
})

// 表格数据
const tableData = ref([])

// 下一个工序ID
const nextProcessId = ref(1)

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.value.processCode) {
    data = data.filter(item => 
      item.processCode.toLowerCase().includes(searchForm.value.processCode.toLowerCase())
    )
  }
  if (searchForm.value.processName) {
    data = data.filter(item => 
      item.processName.toLowerCase().includes(searchForm.value.processName.toLowerCase())
    )
  }
  if (searchForm.value.workshopName) {
    data = data.filter(item => 
      item.workshopName.toLowerCase().includes(searchForm.value.workshopName.toLowerCase())
    )
  }
  
  totalCount.value = data.length
  return data
})

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTableData.value.slice(start, end)
})

const dialogTitle = computed(() => isEdit.value ? '编辑工序' : '新增工序')

// 更新统计数据
const updateStats = () => {
  stats.value.total = tableData.value.length
  stats.value.inStorage = tableData.value.filter(p => p.isStorage).length
  const workshops = new Set(tableData.value.map(p => p.workshopName).filter(w => w))
  stats.value.workshops = workshops.size
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    processCode: '',
    processName: '',
    workshopName: ''
  }
  handleSearch()
}

// 新增工序
const handleCreate = () => {
  isEdit.value = false
  formData.value = {
    processCode: `P${new Date().getFullYear()}${String(nextProcessId.value).padStart(4, '0')}`,
    processName: '',
    processPrincipal: '',
    dispatchMethod: 'manual',
    selfOrOutsource: '',
    availableWorkstations: 0,
    isStorage: false,
    completionWarehouse: '',
    workshopName: '',
    processWage: 0
  }
  editDialogVisible.value = true
}

// 编辑工序
const handleEdit = (row) => {
  isEdit.value = true
  currentProcess.value = { ...row }
  formData.value = { ...row }
  editDialogVisible.value = true
}

// 查看工序
const handleView = (row) => {
  currentProcess.value = { ...row }
  viewDialogVisible.value = true
}

// 删除工序
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除工序"${row.processName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    try {
      // 调用后端API删除
      const response = await axiosInstance.delete(`/processes/delete/${row.id}`)
      const result = response.data
      
      if (result.code === 200) {
        // 添加到已删除ID列表
        deletedProcessIds.value.push(row.id)
        saveDeletedProcessIds(deletedProcessIds.value)
        // 删除成功后重新加载数据
        await loadData()
        ElMessage.success('删除成功')
      } else {
        ElMessage.error(result.message || '删除失败')
      }
    } catch (apiError) {
      console.error('API删除失败，使用本地存储:', apiError)
      // API失败，使用本地存储删除
      const index = tableData.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        tableData.value.splice(index, 1)
        // 添加到已删除ID列表
        deletedProcessIds.value.push(row.id)
        saveDeletedProcessIds(deletedProcessIds.value)
        updateStats()
        saveProcessesToLocal(tableData.value)
        ElMessage.success('删除成功（本地操作）')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除工序失败:', error)
      ElMessage.error('删除工序失败')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个工序吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const deleteIds = selectedRows.value.map(row => row.id)
    
    try {
      // 调用后端API批量删除
      const response = await axiosInstance.post('/processes/batch-delete', { ids: deleteIds })
      const result = response.data
      
      if (result.code === 200) {
        // 添加到已删除ID列表
        deletedProcessIds.value = [...deletedProcessIds.value, ...deleteIds]
        saveDeletedProcessIds(deletedProcessIds.value)
        selectedRows.value = []
        await loadData()
        ElMessage.success('批量删除成功')
      } else {
        ElMessage.error(result.message || '批量删除失败')
      }
    } catch (apiError) {
      console.error('API批量删除失败，使用本地存储:', apiError)
      // API失败，使用本地存储批量删除
      tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
      // 添加到已删除ID列表
      deletedProcessIds.value = [...deletedProcessIds.value, ...deleteIds]
      saveDeletedProcessIds(deletedProcessIds.value)
      selectedRows.value = []
      updateStats()
      saveProcessesToLocal(tableData.value)
      ElMessage.success('批量删除成功（本地操作）')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除工序失败:', error)
      ElMessage.error('批量删除工序失败')
    }
  }
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate()
    
    // 转换字段名为后端格式
    const requestData = {
      process_code: formData.value.processCode,
      process_name: formData.value.processName,
      responsible_person: formData.value.processPrincipal,
      dispatch_method: formData.value.dispatchMethod,
      self_or_outsource: formData.value.selfOrOutsource || null,
      available_workstations: formData.value.availableWorkstations || null,
      is_warehousing: formData.value.isStorage ? 1 : 0,
      completion_warehouse: formData.value.completionWarehouse || '',
      workshop_name: formData.value.workshopName,
      process_wage: formData.value.processWage || 0
    }
    
    let response
    let result
    
    try {
      if (isEdit.value) {
        // 更新工序
        response = await axiosInstance.put(`/processes/update/${currentProcess.value.id}`, requestData)
      } else {
        // 新增工序
        response = await axiosInstance.post('/processes/create', requestData)
      }
      result = response.data
      
      if (result.code === 200) {
        ElMessage.success(isEdit.value ? '工序更新成功' : '工序创建成功')
        editDialogVisible.value = false
        await loadData()
        return
      }
    } catch (apiError) {
      console.error('API保存失败，使用本地存储:', apiError)
      // API失败，使用本地存储
      if (isEdit.value) {
        // 更新本地记录
        const index = tableData.value.findIndex(item => item.id === currentProcess.value.id)
        if (index !== -1) {
          tableData.value[index] = {
            ...tableData.value[index],
            processCode: formData.value.processCode,
            processName: formData.value.processName,
            processPrincipal: formData.value.processPrincipal,
            dispatchMethod: formData.value.dispatchMethod,
            selfOrOutsource: formData.value.selfOrOutsource || '',
            availableWorkstations: formData.value.availableWorkstations || 0,
            isStorage: formData.value.isStorage,
            completionWarehouse: formData.value.completionWarehouse || '',
            workshopName: formData.value.workshopName,
            processWage: parseFloat(formData.value.processWage) || 0,
            updateTime: new Date().toLocaleString('zh-CN')
          }
        }
      } else {
        // 添加本地记录
        const newProcess = {
          id: Date.now() + Math.random(), // 生成临时ID
          processCode: formData.value.processCode,
          processName: formData.value.processName,
          processPrincipal: formData.value.processPrincipal,
          dispatchMethod: formData.value.dispatchMethod,
          selfOrOutsource: formData.value.selfOrOutsource || '',
          availableWorkstations: formData.value.availableWorkstations || 0,
          isStorage: formData.value.isStorage,
          completionWarehouse: formData.value.completionWarehouse || '',
          workshopName: formData.value.workshopName,
          processWage: parseFloat(formData.value.processWage) || 0,
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        tableData.value.push(newProcess)
      }
      
      updateStats()
      saveProcessesToLocal(tableData.value)
      ElMessage.success(isEdit.value ? '工序更新成功（本地操作）' : '工序创建成功（本地操作）')
      editDialogVisible.value = false
      return
    }
    
    ElMessage.error(result?.message || '保存失败')
  } catch (error) {
    console.error('保存工序失败:', error)
    ElMessage.error('保存工序失败')
  }
}

// 加载到工序能力负荷表
const handleLoadToCapacityTable = async () => {
  try {
    // 筛选出自制/外协 = "自制" 的工序
    const selfMadeProcesses = selectedRows.value.filter(row => row.selfOrOutsource === '自制')
    
    if (selfMadeProcesses.length === 0) {
      ElMessage.warning('请选择至少一个"自制/外协" 为 "自制" 的工序')
      return
    }
    
    // 确认对话框
    await ElMessageBox.confirm(
      `共选择了 ${selectedRows.value.length} 个工序，其中 ${selfMadeProcesses.length} 个为"自制"工序。确定加载到工序能力负荷表吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 准备数据
    const processes = selfMadeProcesses.map(row => ({
      processName: row.processName,
      availableWorkstations: row.availableWorkstations || 0
    }))
    
    // 调用后端API
    const response = await fetch('/api/capacity-load/load-from-processes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processes })
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      ElMessage.success(result.message)
      selectedRows.value = []
    } else {
      ElMessage.error(result.message || '加载失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('加载到能力负荷表失败:', error)
      ElMessage.error('加载失败')
    }
  }
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 文件选择
const handleFileChange = (file) => {
  uploadFile.value = file
}

// 确认导入
const handleImportConfirm = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  try {
    const file = uploadFile.value.raw
    const reader = new FileReader()
    
    const arrayBuffer = await new Promise((resolve, reject) => {
      reader.onload = (e) => resolve(e.target.result)
      reader.onerror = (e) => reject(e)
      reader.readAsArrayBuffer(file)
    })
    
    const data = new Uint8Array(arrayBuffer)
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const importedData = XLSX.utils.sheet_to_json(worksheet)
    
    if (importedData.length === 0) {
      ElMessage.warning('导入文件为空')
      return
    }
    
    // 批量创建/更新
    const importRequests = importedData.map(item => ({
      process_code: item['工序编号'] || '',
      process_name: item['工序名称'] || '',
      responsible_person: item['工序负责人'] || '',
      dispatch_method: item['派工方式'] === '自动派工' ? 'auto' : 'manual',
      is_warehousing: item['是否入库'] === '是' ? 1 : 0,
      completion_warehouse: item['完工绑定仓库'] || '',
      workshop_name: item['所属车间名称'] || '',
      process_wage: parseFloat(item['工序工资']) || 0
    }))
    
    try {
      // 调用后端API批量创建
      const response = await axiosInstance.post('/processes/batch-create', importRequests)
      const result = response.data
      
      if (result.code === 200) {
        ElMessage.success(`导入成功！成功 ${result.data.successCount} 条，失败 ${result.data.errorCount} 条`)
        importDialogVisible.value = false
        await loadData()
      } else {
        ElMessage.error(result.message || '导入失败')
      }
    } catch (apiError) {
      console.error('API导入失败，使用本地存储:', apiError)
      
      // API失败，使用本地存储
      let successCount = 0
      const newProcesses = importedData.map(item => {
        const process = {
          id: Date.now() + Math.random(), // 生成临时ID
          processCode: item['工序编号'] || `P${Date.now() + Math.random().toString(36).substr(2, 5)}`,
          processName: item['工序名称'] || '',
          processPrincipal: item['工序负责人'] || '',
          dispatchMethod: item['派工方式'] === '自动派工' ? 'auto' : 'manual',
          selfOrOutsource: '',
          availableWorkstations: 0,
          isStorage: item['是否入库'] === '是',
          completionWarehouse: item['完工绑定仓库'] || '',
          workshopName: item['所属车间名称'] || '',
          processWage: parseFloat(item['工序工资']) || 0,
          createTime: new Date().toLocaleString('zh-CN')
        }
        
        // 检查是否已存在
        const existingIndex = tableData.value.findIndex(p => p.processCode === process.processCode)
        if (existingIndex !== -1) {
          // 更新现有记录
          tableData.value[existingIndex] = process
        } else {
          // 添加新记录
          tableData.value.push(process)
        }
        successCount++
        return process
      })
      
      updateStats()
      saveProcessesToLocal(tableData.value)
      importDialogVisible.value = false
      ElMessage.success(`本地导入成功！成功处理 ${successCount} 条记录`)
    }
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败：' + (error.message || '未知错误'))
  }
}

// 导出
const handleExport = () => {
  try {
    const dataToExport = filteredTableData.value
    
    if (dataToExport.length === 0) {
      ElMessage.warning('没有数据可以导出')
      return
    }
    
    const exportData = dataToExport.map(row => ({
      '工序编号': row.processCode,
      '工序名称': row.processName,
      '工序负责人': row.processPrincipal,
      '派工方式': row.dispatchMethod === 'auto' ? '自动派工' : '手动派工',
      '是否入库': row.isStorage ? '是' : '否',
      '完工绑定仓库': row.completionWarehouse,
      '所属车间名称': row.workshopName,
      '工序工资': row.processWage,
      '创建时间': row.createTime
    }))
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '工序列表')
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `工序列表_${timestamp}.xlsx`
    XLSX.writeFile(wb, fileName)
    
    ElMessage.success(`导出成功，共 ${dataToExport.length} 条记录`)
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败：' + (error.message || '未知错误'))
  }
}

// 打印
const handlePrint = () => {
  window.print()
}

// 刷新
const handleRefresh = async () => {
  await loadData()
  ElMessage.success('刷新成功')
}

// 分页
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 本地存储键名
const PROCESS_LIST_KEY = 'processListData'
const DELETED_PROCESSES_KEY = 'deletedProcessIds'

// 从本地存储加载已删除的工序ID列表
const loadDeletedProcessIds = () => {
  try {
    const cached = localStorage.getItem(DELETED_PROCESSES_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('❌ 从本地存储加载已删除ID列表失败:', error)
  }
  return []
}

// 保存已删除的工序ID列表到本地存储
const saveDeletedProcessIds = (ids) => {
  try {
    localStorage.setItem(DELETED_PROCESSES_KEY, JSON.stringify(ids))
    console.log('✅ 已删除ID列表已保存到本地存储')
  } catch (error) {
    console.error('❌ 保存已删除ID列表到本地存储失败:', error)
  }
}

// 从本地存储加载工序数据
const loadProcessesFromLocal = () => {
  try {
    const cached = localStorage.getItem(PROCESS_LIST_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('❌ 从本地存储加载数据失败:', error)
  }
  return []
}

// 保存工序数据到本地存储
const saveProcessesToLocal = (data) => {
  try {
    localStorage.setItem(PROCESS_LIST_KEY, JSON.stringify(data))
    console.log('✅ 工序数据已保存到本地存储')
  } catch (error) {
    console.error('❌ 保存数据到本地存储失败:', error)
  }
}

// 已删除的ID列表
const deletedProcessIds = ref(loadDeletedProcessIds())

// 加载数据
const loadData = async () => {
  try {
    const response = await axiosInstance.get('/processes/list')
    const result = response.data
    
    if (result.code === 200) {
      // 转换后端数据格式为前端格式
      let processes = result.data.map(item => ({
        id: item.id,
        processCode: item.process_code,
        processName: item.process_name,
        processPrincipal: item.responsible_person,
        dispatchMethod: item.dispatch_method,
        selfOrOutsource: item.self_or_outsource || '',
        availableWorkstations: item.available_workstations || 0,
        isStorage: item.is_warehousing === 1,
        completionWarehouse: item.completion_warehouse || '',
        workshopName: item.workshop_name,
        processWage: parseFloat(item.process_wage) || 0,
        createTime: new Date(item.created_at).toLocaleString('zh-CN'),
        updateTime: new Date(item.updated_at).toLocaleString('zh-CN')
      }))
      
      // 过滤掉已删除的数据
      processes = processes.filter(process => !deletedProcessIds.value.includes(process.id))
      
      tableData.value = processes
      updateStats()
      // 保存到本地存储作为备份
      saveProcessesToLocal(processes)
    } else {
      console.error('加载工序数据失败:', result.message)
      // 尝试从本地存储加载
      const cachedProcesses = loadProcessesFromLocal()
      // 过滤掉已删除的数据
      const filteredProcesses = cachedProcesses.filter(process => !deletedProcessIds.value.includes(process.id))
      if (filteredProcesses.length > 0) {
        tableData.value = filteredProcesses
        updateStats()
        ElMessage.success('从本地存储加载数据成功')
      }
    }
  } catch (error) {
    console.error('加载工序数据失败:', error)
    // 尝试从本地存储加载
    const cachedProcesses = loadProcessesFromLocal()
    // 过滤掉已删除的数据
    const filteredProcesses = cachedProcesses.filter(process => !deletedProcessIds.value.includes(process.id))
    if (filteredProcesses.length > 0) {
      tableData.value = filteredProcesses
      updateStats()
      ElMessage.success('从本地存储加载数据成功')
    } else {
      // 初始化一些模拟数据
      const mockData = [
        {
          id: 1,
          processCode: 'P20250001',
          processName: '切割',
          processPrincipal: '张三',
          dispatchMethod: 'auto',
          selfOrOutsource: '自制',
          availableWorkstations: 5,
          isStorage: true,
          completionWarehouse: '成品仓',
          workshopName: '生产车间',
          processWage: 100,
          createTime: new Date().toLocaleString('zh-CN')
        },
        {
          id: 2,
          processCode: 'P20250002',
          processName: '焊接',
          processPrincipal: '李四',
          dispatchMethod: 'manual',
          selfOrOutsource: '自制',
          availableWorkstations: 3,
          isStorage: false,
          completionWarehouse: '',
          workshopName: '生产车间',
          processWage: 150,
          createTime: new Date().toLocaleString('zh-CN')
        }
      ]
      // 过滤掉已删除的数据
      const filteredMockData = mockData.filter(process => !deletedProcessIds.value.includes(process.id))
      tableData.value = filteredMockData
      updateStats()
      saveProcessesToLocal(filteredMockData)
      ElMessage.success('已初始化模拟数据')
    }
  }
}

// 生命周期
onMounted(() => {
  // 从MySQL数据库加载数据
  loadData()
  
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 520
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})
</script>

<style scoped>
.process-list-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-left h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.toolbar-right {
  display: flex;
  gap: 10px;
}

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-form {
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 打印样式 */
@media print {
  .toolbar,
  .search-section,
  .stats-cards,
  .pagination-container {
    display: none;
  }
}
</style>
