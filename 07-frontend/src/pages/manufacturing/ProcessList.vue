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
    
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      updateStats()
      // 保存到localStorage
      localStorage.setItem('processListData', JSON.stringify(tableData.value))
      ElMessage.success('删除成功')
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
    tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
    selectedRows.value = []
    updateStats()
    // 保存到localStorage
    localStorage.setItem('processListData', JSON.stringify(tableData.value))
    ElMessage.success('批量删除成功')
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
    
    if (isEdit.value) {
      // 更新工序
      const index = tableData.value.findIndex(p => p.id === currentProcess.value.id)
      if (index !== -1) {
        tableData.value[index] = {
          ...formData.value,
          id: currentProcess.value.id,
          updateTime: new Date().toLocaleString('zh-CN')
        }
      }
      ElMessage.success('工序更新成功')
    } else {
      // 新增工序
      const newProcess = {
        ...formData.value,
        id: nextProcessId.value,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: new Date().toLocaleString('zh-CN')
      }
      tableData.value.unshift(newProcess)
      nextProcessId.value++
      // 保存下一个ID
      localStorage.setItem('processNextId', nextProcessId.value.toString())
      ElMessage.success('工序创建成功')
    }
    
    // 保存到localStorage
    localStorage.setItem('processListData', JSON.stringify(tableData.value))
    editDialogVisible.value = false
    updateStats()
  } catch (error) {
    console.error('保存工序失败:', error)
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
    
    let addedCount = 0
    let updatedCount = 0
    
    importedData.forEach(item => {
      const existingIndex = tableData.value.findIndex(p => p.processCode === item['工序编号'])
      
      if (existingIndex === -1) {
        // 新增
        const newProcess = {
          id: nextProcessId.value,
          processCode: item['工序编号'] || '',
          processName: item['工序名称'] || '',
          processPrincipal: item['工序负责人'] || '',
          dispatchMethod: item['派工方式'] === '自动派工' ? 'auto' : 'manual',
          isStorage: item['是否入库'] === '是',
          completionWarehouse: item['完工绑定仓库'] || '',
          workshopName: item['所属车间名称'] || '',
          processWage: parseFloat(item['工序工资']) || 0,
          createTime: new Date().toLocaleString('zh-CN'),
          updateTime: new Date().toLocaleString('zh-CN')
        }
        tableData.value.unshift(newProcess)
        nextProcessId.value++
        addedCount++
      } else {
        // 更新
        tableData.value[existingIndex] = {
          ...tableData.value[existingIndex],
          processName: item['工序名称'] || tableData.value[existingIndex].processName,
          processPrincipal: item['工序负责人'] || tableData.value[existingIndex].processPrincipal,
          dispatchMethod: item['派工方式'] === '自动派工' ? 'auto' : 'manual',
          isStorage: item['是否入库'] === '是',
          completionWarehouse: item['完工绑定仓库'] || tableData.value[existingIndex].completionWarehouse,
          workshopName: item['所属车间名称'] || tableData.value[existingIndex].workshopName,
          processWage: parseFloat(item['工序工资']) || tableData.value[existingIndex].processWage,
          updateTime: new Date().toLocaleString('zh-CN')
        }
        updatedCount++
      }
    })
    
    // 保存到localStorage
    localStorage.setItem('processListData', JSON.stringify(tableData.value))
    localStorage.setItem('processNextId', nextProcessId.value.toString())
    
    ElMessage.success(`导入成功！新增 ${addedCount} 条，更新 ${updatedCount} 条`)
    importDialogVisible.value = false
    updateStats()
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
const handleRefresh = () => {
  // 从localStorage重新加载数据
  const storedData = localStorage.getItem('processListData')
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData)
      if (Array.isArray(parsedData)) {
        tableData.value = parsedData
        updateStats()
      }
    } catch (e) {
      console.error('加载数据失败:', e)
    }
  }
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

// 生命周期
onMounted(() => {
  // 从localStorage加载数据
  const storedData = localStorage.getItem('processListData')
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData)
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        tableData.value = parsedData
      }
    } catch (e) {
      console.error('加载工序数据失败:', e)
    }
  }
  
  // 加载下一个ID
  const storedNextId = localStorage.getItem('processNextId')
  if (storedNextId) {
    nextProcessId.value = parseInt(storedNextId, 10)
  }
  
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 520
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
  updateStats()
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
