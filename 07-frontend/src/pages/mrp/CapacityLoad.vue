<template>
  <div class="capacity-load-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2>工序能力负荷表</h2>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" size="small" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          新增
        </el-button>
        <el-button type="danger" size="small" :disabled="!hasSelection" @click="handleBatchDelete">
          批量删除
        </el-button>
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
        <el-button type="primary" size="small" @click="settingsVisible = true" circle>
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="工序名称">
          <el-input v-model="searchForm.processName" placeholder="请输入工序名称" clearable size="small" />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
          />
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
            <div class="stat-value">{{ stats.totalProcesses }}</div>
            <div class="stat-label">工序数量</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon :size="24"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalAvailableHours }}</div>
            <div class="stat-label">可用总工时(h)</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.utilizationRate }}%</div>
            <div class="stat-label">平均利用率</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="stat-card">
        <div class="stat-content">
          <div class="stat-icon" style="background: #F56C6C;">
            <el-icon :size="24"><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalOccupiedHours }}</div>
            <div class="stat-label">已占用工时(h)</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 使用通用表格组件 -->
    <EnhancedTable
      ref="tableRef"
      :data="filteredTableData"
      :columns="tableColumns"
      :height="tableHeight"
      :show-selection="true"
      :show-index="true"
      :show-summary="true"
      :summary-method="getSummaries"
      @selection-change="handleSelectionChange"
    />

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
      width="700px" 
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="formData" label-width="140px" :rules="formRules" ref="formRef">
        <el-form-item label="工序名称" prop="processName">
          <el-select 
            v-model="formData.processName" 
            placeholder="请选择工序" 
            style="width: 100%;"
            filterable
          >
            <el-option 
              v-for="process in processOptions" 
              :key="process.processCode" 
              :label="process.processName" 
              :value="process.processName"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="日期" prop="date">
          <el-date-picker
            v-model="formData.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="可用工位数量" prop="availableWorkstations">
          <el-input-number v-model="formData.availableWorkstations" :min="1" style="width: 100%;" />
        </el-form-item>
        
        <el-form-item label="上班总时段(h)" prop="totalWorkHours">
          <el-input-number v-model="formData.totalWorkHours" :min="0" :step="0.5" style="width: 100%;" />
        </el-form-item>
        
        <el-form-item label="已占用工时(h)" prop="occupiedHours">
          <el-input-number v-model="formData.occupiedHours" :min="0" :step="0.5" style="width: 100%;" />
        </el-form-item>
        
        <el-form-item label="加班时段(h)" prop="overtimeHours">
          <el-input-number v-model="formData.overtimeHours" :min="0" :step="0.5" style="width: 100%;" />
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 页面设置组件 -->
    <PageSettings
      v-model="settingsVisible"
      settings-key="capacityLoadSettings"
      :available-fields="allFields"
      :default-settings="{
        codePrefix: 'CL',
        codeRule: 'CL{YYYY}{MM}{DD}{####}',
        exportFilePrefix: '工序能力负荷表',
        displayDays: 30
      }"
      :show-business-vars="true"
      @save="handleSettingsSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Upload, Download, Printer, Refresh, Setting, Search, 
  Operation, Clock, Loading, Timer 
} from '@element-plus/icons-vue'
import EnhancedTable from '@/components/common/EnhancedTable.vue'
import PageSettings from '@/components/common/PageSettings.vue'

// 数据
const tableRef = ref(null)
const formRef = ref(null)
const searchForm = reactive({
  processName: '',
  dateRange: null
})

const currentPage = ref(1)
const pageSize = ref(20)
const totalCount = ref(0)
const tableHeight = ref(600)
const editDialogVisible = ref(false)
const settingsVisible = ref(false)
const isEdit = ref(false)
const selectedRows = ref([])

// 工序选项（从工序列表加载）
const processOptions = ref([])

// 表格数据
const tableData = ref([])

// 表单数据
const formData = reactive({
  id: '',
  processName: '',
  date: '',
  availableWorkstations: 1,
  totalWorkHours: 8,
  occupiedHours: 0,
  overtimeHours: 0,
  remark: ''
})

// 表单验证规则
const formRules = {
  processName: [{ required: true, message: '请选择工序', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  availableWorkstations: [{ required: true, message: '请输入可用工位数量', trigger: 'blur' }],
  totalWorkHours: [{ required: true, message: '请输入上班总时段', trigger: 'blur' }]
}

// 所有字段配置
const allFields = [
  { prop: 'sequence', label: '序号' },
  { prop: 'processName', label: '工序名称' },
  { prop: 'date', label: '日期' },
  { prop: 'availableWorkstations', label: '可用工位数量' },
  { prop: 'totalWorkHours', label: '上班总时段' },
  { prop: 'occupiedHours', label: '已占用工时' },
  { prop: 'occupiedPeriod', label: '已占用时段' },
  { prop: 'remainingPeriod', label: '剩余时段' },
  { prop: 'remainingHours', label: '剩余工时' },
  { prop: 'overtimeHours', label: '加班时段' }
]

// 表格列配置
const tableColumns = ref([
  { prop: 'processName', label: '工序名称', width: 150, fixed: 'left' },
  { prop: 'date', label: '日期', width: 120 },
  { 
    prop: 'availableWorkstations', 
    label: '可用工位数量', 
    width: 130, 
    align: 'right'
  },
  { 
    prop: 'totalWorkHours', 
    label: '上班总时段(h)', 
    width: 130, 
    align: 'right',
    formatter: (row) => row.totalWorkHours?.toFixed(1)
  },
  { 
    prop: 'occupiedHours', 
    label: '已占用工时(h)', 
    width: 140, 
    align: 'right',
    formatter: (row) => row.occupiedHours?.toFixed(1)
  },
  { 
    prop: 'occupiedPeriod', 
    label: '已占用时段(%)', 
    width: 140, 
    align: 'right',
    formatter: (row) => `${row.occupiedPeriod?.toFixed(1)}%`
  },
  { 
    prop: 'remainingPeriod', 
    label: '剩余时段(%)', 
    width: 130, 
    align: 'right',
    formatter: (row) => `${row.remainingPeriod?.toFixed(1)}%`
  },
  { 
    prop: 'remainingHours', 
    label: '剩余工时(h)', 
    width: 130, 
    align: 'right',
    formatter: (row) => row.remainingHours?.toFixed(1),
    cellStyle: (row) => {
      if (row.remainingHours < 2) {
        return { color: '#F56C6C', fontWeight: 'bold' }
      }
      return {}
    }
  },
  { 
    prop: 'overtimeHours', 
    label: '加班时段(h)', 
    width: 130, 
    align: 'right',
    formatter: (row) => row.overtimeHours?.toFixed(1)
  },
  {
    prop: 'actions',
    label: '操作',
    width: 150,
    fixed: 'right',
    slot: 'actions'
  }
])

// 统计数据
const stats = computed(() => {
  const total = tableData.value.length
  const totalAvailable = tableData.value.reduce((sum, row) => sum + (row.totalWorkHours || 0), 0)
  const totalOccupied = tableData.value.reduce((sum, row) => sum + (row.occupiedHours || 0), 0)
  const avgUtilization = totalAvailable > 0 ? (totalOccupied / totalAvailable * 100) : 0
  
  return {
    totalProcesses: total,
    totalAvailableHours: totalAvailable.toFixed(1),
    totalOccupiedHours: totalOccupied.toFixed(1),
    utilizationRate: avgUtilization.toFixed(1)
  }
})

// 计算属性
const hasSelection = computed(() => selectedRows.value.length > 0)

const dialogTitle = computed(() => isEdit.value ? '编辑工序能力负荷' : '新增工序能力负荷')

const filteredTableData = computed(() => {
  let data = tableData.value
  
  // 搜索过滤
  if (searchForm.processName) {
    data = data.filter(row => 
      row.processName.includes(searchForm.processName)
    )
  }
  
  // 日期范围过滤
  if (searchForm.dateRange && searchForm.dateRange.length === 2) {
    const [start, end] = searchForm.dateRange
    data = data.filter(row => {
      const rowDate = new Date(row.date)
      return rowDate >= start && rowDate <= end
    })
  }
  
  totalCount.value = data.length
  return data.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
})

// 方法
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 加载工序列表
const loadProcessList = () => {
  try {
    const storedProcesses = localStorage.getItem('processListData')
    if (storedProcesses) {
      const processes = JSON.parse(storedProcesses)
      // 只加载工序编号不为空的工序
      processOptions.value = processes.filter(p => p.processCode && p.processCode.trim() !== '')
      console.log('✅ 加载工序列表:', processOptions.value.length, '个')
    }
  } catch (error) {
    console.error('❌ 加载工序列表失败:', error)
  }
}

// 初始化数据
const initializeData = () => {
  try {
    const stored = localStorage.getItem('capacityLoadData')
    if (stored) {
      tableData.value = JSON.parse(stored)
      console.log('✅ 加载工序能力负荷数据:', tableData.value.length, '条')
    } else {
      // 生成初始数据
      generateInitialData()
    }
  } catch (error) {
    console.error('❌ 加载数据失败:', error)
    generateInitialData()
  }
}

// 根据工序列表生成初始数据
const generateInitialData = () => {
  if (processOptions.value.length === 0) {
    return
  }
  
  // 从设置中获取显示天数，默认30天
  const settings = JSON.parse(localStorage.getItem('capacityLoadSettings') || '{}')
  const displayDays = settings.displayDays || 30
  
  const today = new Date()
  const initialData = []
  
  // 为每个工序生成未来N天的数据
  processOptions.value.forEach((process, index) => {
    for (let i = 0; i < displayDays; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      
      const totalHours = 8 // 8小时工作制
      const occupied = Math.random() * totalHours // 随机占用工时
      const remaining = totalHours - occupied
      
      initialData.push({
        id: `CL${Date.now()}${index}${i}`,
        sequence: initialData.length + 1,
        processName: process.processName,
        date: date.toISOString().split('T')[0],
        availableWorkstations: Math.floor(Math.random() * 5) + 1, // 1-5个工位
        totalWorkHours: totalHours,
        occupiedHours: occupied,
        occupiedPeriod: (occupied / totalHours) * 100,
        remainingPeriod: (remaining / totalHours) * 100,
        remainingHours: remaining,
        overtimeHours: 0,
        createTime: new Date().toLocaleString('zh-CN')
      })
    }
  })
  
  tableData.value = initialData
  saveData()
  ElMessage.success(`已生成 ${initialData.length} 条数据（显示未来${displayDays}天）`)
}

// 保存数据到localStorage
const saveData = () => {
  try {
    localStorage.setItem('capacityLoadData', JSON.stringify(tableData.value))
  } catch (error) {
    console.error('❌ 保存数据失败:', error)
  }
}

// 工具栏操作
const handleCreate = () => {
  isEdit.value = false
  Object.assign(formData, {
    id: '',
    processName: '',
    date: '',
    availableWorkstations: 1,
    totalWorkHours: 8,
    occupiedHours: 0,
    overtimeHours: 0,
    remark: ''
  })
  editDialogVisible.value = true
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    
    const totalHours = formData.totalWorkHours
    const occupiedHours = formData.occupiedHours
    const remainingHours = totalHours - occupiedHours
    
    const newData = {
      ...formData,
      id: formData.id || `CL${Date.now()}`,
      sequence: tableData.value.length + 1,
      occupiedPeriod: (occupiedHours / totalHours) * 100,
      remainingPeriod: (remainingHours / totalHours) * 100,
      remainingHours: remainingHours,
      date: formData.date ? new Date(formData.date).toISOString().split('T')[0] : '',
      createTime: new Date().toLocaleString('zh-CN')
    }
    
    if (isEdit.value) {
      const index = tableData.value.findIndex(item => item.id === formData.id)
      if (index !== -1) {
        tableData.value[index] = newData
        ElMessage.success('更新成功')
      }
    } else {
      tableData.value.unshift(newData)
      ElMessage.success('新增成功')
    }
    
    // 重新计算序号
    tableData.value.forEach((item, index) => {
      item.sequence = index + 1
    })
    
    saveData()
    editDialogVisible.value = false
  } catch (error) {
    console.error('保存失败:', error)
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    tableData.value = tableData.value.filter(item => !ids.includes(item.id))
    
    // 重新计算序号
    tableData.value.forEach((item, index) => {
      item.sequence = index + 1
    })
    
    saveData()
    selectedRows.value = []
    ElMessage.success('删除成功')
  } catch {}
}

const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const handlePrint = () => {
  window.print()
}

const handleRefresh = () => {
  initializeData()
  ElMessage.success('刷新成功')
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  searchForm.processName = ''
  searchForm.dateRange = null
  currentPage.value = 1
}

const handleSettingsSave = (settings) => {
  console.log('保存页面设置:', settings)
  // 应用设置
}

// 合计行
const getSummaries = ({ columns, data }) => {
  const sums = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    const values = data.map(item => Number(item[column.property]))
    if (column.property === 'availableWorkstations' ||
        column.property === 'totalWorkHours' ||
        column.property === 'occupiedHours' ||
        column.property === 'remainingHours' ||
        column.property === 'overtimeHours') {
      const sum = values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!isNaN(value)) {
          return prev + value
        } else {
          return prev
        }
      }, 0)
      sums[index] = sum.toFixed(1)
    } else if (column.property === 'occupiedPeriod' || column.property === 'remainingPeriod') {
      const sum = values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!isNaN(value)) {
          return prev + value
        } else {
          return prev
        }
      }, 0)
      const avg = sum / data.length
      sums[index] = `${avg.toFixed(1)}%`
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

// 生命周期
onMounted(() => {
  // 加载工序列表
  loadProcessList()
  
  // 初始化数据
  initializeData()
  
  // 计算表格高度
  const updateTableHeight = () => {
    const windowHeight = window.innerHeight
    tableHeight.value = windowHeight - 450
  }
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)
})
</script>

<style scoped>
.capacity-load-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  padding: 15px 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-form {
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 4px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
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
  font-size: 24px;
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 打印样式 */
@media print {
  .toolbar,
  .search-section,
  .pagination-container {
    display: none;
  }
}
</style>
