<template>
  <div class="sales-bom-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>销售BOM</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增BOM
        </el-button>
        <el-button type="danger" :disabled="!hasSelection" @click="handleBatchDelete">批量删除</el-button>
        <el-button type="success" @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入
        </el-button>
        <el-button type="warning" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
        <el-button @click="handlePrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="BOM编号">
          <el-input v-model="searchForm.bomCode" placeholder="请输入BOM编号" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="已废弃" value="obsolete" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">BOM总数</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.approved }}</div>
            <div class="stat-label">已批准</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon :size="24"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.reviewing }}</div>
            <div class="stat-label">审核中</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主表格 -->
    <el-table 
      ref="tableRef"
      :data="filteredTableData" 
      stripe 
      border
      :height="tableHeight"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" fixed="left" />
      <el-table-column prop="bomCode" label="BOM编号" width="140" fixed="left" />
      <el-table-column prop="bomName" label="BOM名称" width="200" fixed="left">
        <template #default="{ row }">
          <el-link type="primary" @click="handleView(row)">{{ row.bomName }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="productCode" label="产品编号" width="140" />
      <el-table-column prop="productName" label="产品名称" width="180" />
      <el-table-column prop="version" label="版本号" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'draft'" type="info">草稿</el-tag>
          <el-tag v-else-if="row.status === 'reviewing'" type="warning">审核中</el-tag>
          <el-tag v-else-if="row.status === 'approved'" type="success">已批准</el-tag>
          <el-tag v-else-if="row.status === 'obsolete'" type="danger">已废弃</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="designer" label="设计人员" width="120" />
      <el-table-column prop="reviewer" label="审核人员" width="120" />
      <el-table-column prop="itemCount" label="物料数量" width="100" align="right" />
      <el-table-column prop="effectiveDate" label="生效日期" width="120" />
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="updateTime" label="更新时间" width="180" />
      <el-table-column prop="remark" label="备注" width="200" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="success" @click="handleView(row)">查看</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
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
      width="80%" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="formData" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="BOM编号">
              <el-input v-model="formData.bomCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="BOM名称">
              <el-input v-model="formData.bomName" placeholder="请输入BOM名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品编号">
              <el-input v-model="formData.productCode" placeholder="请输入产品编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称">
              <el-input v-model="formData.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="版本号">
              <el-input v-model="formData.version" placeholder="如：V1.0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="formData.status" placeholder="请选择状态">
                <el-option label="草稿" value="draft" />
                <el-option label="审核中" value="reviewing" />
                <el-option label="已批准" value="approved" />
                <el-option label="已废弃" value="obsolete" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设计人员">
              <el-input v-model="formData.designer" placeholder="请输入设计人员" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="审核人员">
              <el-input v-model="formData.reviewer" placeholder="请输入审核人员" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料数量">
              <el-input-number v-model="formData.itemCount" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效日期">
              <el-date-picker v-model="formData.effectiveDate" type="date" placeholder="选择日期" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog 
      v-model="viewDialogVisible" 
      title="BOM详情" 
      width="70%" 
      :close-on-click-modal="false"
    >
      <el-descriptions :column="2" border v-if="currentBom">
        <el-descriptions-item label="BOM编号">{{ currentBom.bomCode }}</el-descriptions-item>
        <el-descriptions-item label="BOM名称">{{ currentBom.bomName }}</el-descriptions-item>
        <el-descriptions-item label="产品编号">{{ currentBom.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentBom.productName }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{ currentBom.version }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag v-if="currentBom.status === 'draft'" type="info">草稿</el-tag>
          <el-tag v-else-if="currentBom.status === 'reviewing'" type="warning">审核中</el-tag>
          <el-tag v-else-if="currentBom.status === 'approved'" type="success">已批准</el-tag>
          <el-tag v-else-if="currentBom.status === 'obsolete'" type="danger">已废弃</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="设计人员">{{ currentBom.designer }}</el-descriptions-item>
        <el-descriptions-item label="审核人员">{{ currentBom.reviewer }}</el-descriptions-item>
        <el-descriptions-item label="物料数量">{{ currentBom.itemCount }}</el-descriptions-item>
        <el-descriptions-item label="生效日期">{{ currentBom.effectiveDate }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentBom.createTime }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ currentBom.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentBom.remark }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入销售BOM" width="500px">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        :auto-upload="false"
        :on-change="handleFileChange"
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
  Document, CircleCheck, Warning, UploadFilled 
} from '@element-plus/icons-vue'

// 数据
const tableRef = ref(null)
const searchForm = ref({
  bomCode: '',
  productName: '',
  status: ''
})

const selectedRows = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const editDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentBom = ref(null)
const isEdit = ref(false)

// 表单数据
const formData = ref({
  bomCode: '',
  bomName: '',
  productCode: '',
  productName: '',
  version: '',
  status: 'draft',
  designer: '',
  reviewer: '',
  itemCount: 0,
  effectiveDate: '',
  remark: ''
})

// 统计数据
const stats = ref({
  total: 0,
  approved: 0,
  reviewing: 0
})

// 表格数据（模拟数据）
const tableData = ref([
  {
    id: 1,
    bomCode: 'SBOM-2025-001',
    bomName: '智能传感器销售BOM',
    productCode: 'P2025001',
    productName: '高精度传感器A1',
    version: 'V1.0',
    status: 'approved',
    designer: '张三',
    reviewer: '李四',
    itemCount: 25,
    effectiveDate: '2025-01-15',
    createTime: '2025-01-10 09:00:00',
    updateTime: '2025-01-15 14:30:00',
    remark: '第一版设计BOM，已通过审核'
  },
  {
    id: 2,
    bomCode: 'SBOM-2025-002',
    bomName: '工业控制器销售BOM',
    productCode: 'P2025002',
    productName: '工业控制器B2',
    version: 'V2.0',
    status: 'reviewing',
    designer: '王五',
    reviewer: '赵六',
    itemCount: 42,
    effectiveDate: '2025-02-01',
    createTime: '2025-01-20 10:15:00',
    updateTime: '2025-01-25 16:00:00',
    remark: '第二版设计BOM，待审核'
  }
])

// 下一个BOM ID
const nextBomId = ref(3)

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const filteredTableData = computed(() => {
  let data = tableData.value
  
  if (searchForm.value.bomCode) {
    data = data.filter(item => 
      item.bomCode.toLowerCase().includes(searchForm.value.bomCode.toLowerCase())
    )
  }
  if (searchForm.value.productName) {
    data = data.filter(item => 
      item.productName.toLowerCase().includes(searchForm.value.productName.toLowerCase())
    )
  }
  if (searchForm.value.status) {
    data = data.filter(item => item.status === searchForm.value.status)
  }
  
  totalCount.value = data.length
  return data
})

const dialogTitle = computed(() => isEdit.value ? '编辑销售BOM' : '新增销售BOM')

// 更新统计数据
const updateStats = () => {
  stats.value.total = tableData.value.length
  stats.value.approved = tableData.value.filter(p => p.status === 'approved').length
  stats.value.reviewing = tableData.value.filter(p => p.status === 'reviewing').length
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
    bomCode: '',
    productName: '',
    status: ''
  }
  handleSearch()
}

// 新增BOM
const handleCreate = () => {
  isEdit.value = false
  formData.value = {
    bomCode: `SBOM-${new Date().getFullYear()}-${String(nextBomId.value).padStart(3, '0')}`,
    bomName: '',
    productCode: '',
    productName: '',
    version: 'V1.0',
    status: 'draft',
    designer: '',
    reviewer: '',
    itemCount: 0,
    effectiveDate: '',
    remark: ''
  }
  editDialogVisible.value = true
}

// 编辑BOM
const handleEdit = (row) => {
  isEdit.value = true
  currentBom.value = { ...row }
  formData.value = { ...row }
  editDialogVisible.value = true
}

// 查看BOM
const handleView = (row) => {
  currentBom.value = { ...row }
  viewDialogVisible.value = true
}

// 删除BOM
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除BOM"${row.bomName}"吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      // 保存到localStorage
      localStorage.setItem('salesBomData', JSON.stringify(tableData.value))
      updateStats()
      ElMessage.success('删除成功')
    }
  } catch {}
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个BOM吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const deleteIds = selectedRows.value.map(row => row.id)
    tableData.value = tableData.value.filter(row => !deleteIds.includes(row.id))
    selectedRows.value = []
    // 保存到localStorage
    localStorage.setItem('salesBomData', JSON.stringify(tableData.value))
    updateStats()
    ElMessage.success('批量删除成功')
  } catch {}
}

// 保存
const handleSave = () => {
  if (isEdit.value) {
    // 更新BOM
    const index = tableData.value.findIndex(p => p.id === currentBom.value.id)
    if (index !== -1) {
      tableData.value[index] = {
        ...formData.value,
        id: currentBom.value.id,
        updateTime: new Date().toLocaleString('zh-CN')
      }
    }
    ElMessage.success('BOM更新成功')
  } else {
    // 新增BOM
    const newBom = {
      ...formData.value,
      id: nextBomId.value,
      createTime: new Date().toLocaleString('zh-CN'),
      updateTime: new Date().toLocaleString('zh-CN')
    }
    tableData.value.unshift(newBom)
    nextBomId.value++
    ElMessage.success('BOM创建成功')
  }
  
  // 保存到localStorage
  localStorage.setItem('salesBomData', JSON.stringify(tableData.value))
  localStorage.setItem('salesBomNextId', nextBomId.value.toString())
  
  editDialogVisible.value = false
  updateStats()
}

// 导入
const handleImport = () => {
  importDialogVisible.value = true
}

// 文件选择
const handleFileChange = (file) => {
  console.log('选择文件:', file)
}

// 确认导入
const handleImportConfirm = () => {
  ElMessage.success('导入成功')
  importDialogVisible.value = false
}

// 导出
const handleExport = () => {
  const dataToExport = filteredTableData.value
  let csvContent = 'BOM编号,BOM名称,产品编号,产品名称,版本号,状态,设计人员,审核人员,物料数量,生效日期,备注\n'
  dataToExport.forEach(row => {
    const statusText = row.status === 'draft' ? '草稿' : row.status === 'reviewing' ? '审核中' : row.status === 'approved' ? '已批准' : '已废弃'
    csvContent += `${row.bomCode},${row.bomName},${row.productCode},${row.productName},${row.version},${statusText},${row.designer},${row.reviewer},${row.itemCount},${row.effectiveDate},${row.remark}\n`
  })
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `销售BOM_${new Date().getTime()}.csv`
  link.click()
  
  ElMessage.success(`导出成功，共 ${dataToExport.length} 条记录`)
}

// 打印
const handlePrint = () => {
  window.print()
}

// 刷新
const handleRefresh = () => {
  ElMessage.success('刷新成功')
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 生命周期
onMounted(() => {
  // 从localStorage加载数据
  const storedData = localStorage.getItem('salesBomData')
  if (storedData) {
    try {
      const parsedData = JSON.parse(storedData)
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        tableData.value = parsedData
      }
    } catch (e) {
      console.error('加载销售BOM数据失败:', e)
    }
  }
  
  // 加载下一个BOM ID
  const storedNextId = localStorage.getItem('salesBomNextId')
  if (storedNextId) {
    nextBomId.value = parseInt(storedNextId, 10)
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
.sales-bom-container {
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
