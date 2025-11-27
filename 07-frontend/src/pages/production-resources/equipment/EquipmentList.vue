<template>
  <div class="equipment-list">
    <div class="header">
      <h1>设备列表</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAdd">新增设备</el-button>
        <el-button @click="handleImport">导入设备</el-button>
        <el-button @click="handleExport">导出设备</el-button>
        <template v-if="selectedRows.length > 0">
          <el-button type="danger" @click="handleBatchDelete">批量删除</el-button>
          <el-button @click="handleBatchExport">批量导出</el-button>
        </template>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <div class="stat-card">
            <div class="stat-icon primary">
              <el-icon><Briefcase /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ equipmentList.length }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <div class="stat-card">
            <div class="stat-icon success">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ runningCount }}</div>
              <div class="stat-label">运行中</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <div class="stat-card">
            <div class="stat-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ maintenanceCount }}</div>
              <div class="stat-label">维修中</div>
            </div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6">
          <div class="stat-card">
            <div class="stat-icon danger">
              <el-icon><CircleClose /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ brokenCount }}</div>
              <div class="stat-label">故障设备</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="toolbar">
      <el-input v-model="searchKeyword" placeholder="搜索设备名称/编号/型号..." style="width: 300px">
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
      
      <el-select v-model="filterType" placeholder="设备类型" @change="handleFilter">
        <el-option label="全部" value="" />
        <el-option label="注塑机" value="注塑机" />
        <el-option label="CNC机床" value="CNC机床" />
        <el-option label="机器人" value="机器人" />
        <el-option label="测量设备" value="测量设备" />
        <el-option label="切割设备" value="切割设备" />
      </el-select>
      
      <el-select v-model="filterStatus" placeholder="设备状态" @change="handleFilter">
        <el-option label="全部" value="" />
        <el-option label="运行中" value="running" />
        <el-option label="待机" value="standby" />
        <el-option label="维修中" value="maintenance" />
        <el-option label="故障" value="broken" />
      </el-select>

      <el-select v-model="filterDepartment" placeholder="所属部门" @change="handleFilter">
        <el-option label="全部" value="" />
        <el-option label="生产一部" value="生产一部" />
        <el-option label="生产二部" value="生产二部" />
        <el-option label="质检部" value="质检部" />
        <el-option label="研发部" value="研发部" />
      </el-select>
      
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handleFilter"
      />
    </div>

    <el-table :data="filteredEquipmentList" style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="code" label="设备编号" width="120" sortable />
      <el-table-column prop="name" label="设备名称" sortable />
      <el-table-column prop="model" label="设备型号" />
      <el-table-column prop="department" label="所属部门" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)" effect="light">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="purchaseDate" label="购买日期" width="120" />
      <el-table-column prop="lastMaintenance" label="最后保养" width="120" />
      <el-table-column prop="utilization" label="利用率" width="120">
        <template #default="scope">
          <div class="utilization-container">
            <el-progress 
              :percentage="scope.row.utilization" 
              :show-text="false" 
              :color="getUtilizationColor(scope.row.utilization)"
            />
            <span style="font-size: 12px; margin-left: 5px">{{ scope.row.utilization }}%</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="location" label="存放位置" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button link type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
          <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDeleteConfirm(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="paginatedData.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 设备表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设备' : '新增设备'"
      width="600px"
      @close="resetForm"
      destroy-on-close
    >
      <el-form
        ref="equipmentFormRef"
        :model="equipmentForm"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="设备编号" prop="code">
          <el-input v-model="equipmentForm.code" placeholder="请输入设备编号" />
        </el-form-item>
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="equipmentForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备型号" prop="model">
          <el-input v-model="equipmentForm.model" placeholder="请输入设备型号" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="equipmentForm.type" placeholder="请选择设备类型">
            <el-option label="注塑机" value="注塑机" />
            <el-option label="CNC机床" value="CNC机床" />
            <el-option label="机器人" value="机器人" />
            <el-option label="测量设备" value="测量设备" />
            <el-option label="切割设备" value="切割设备" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门" prop="department">
          <el-select v-model="equipmentForm.department" placeholder="请选择所属部门">
            <el-option label="生产一部" value="生产一部" />
            <el-option label="生产二部" value="生产二部" />
            <el-option label="质检部" value="质检部" />
            <el-option label="研发部" value="研发部" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
          <el-select v-model="equipmentForm.status" placeholder="请选择设备状态">
            <el-option label="运行中" value="running" />
            <el-option label="待机" value="standby" />
            <el-option label="维修中" value="maintenance" />
            <el-option label="故障" value="broken" />
          </el-select>
        </el-form-item>
        <el-form-item label="购买日期" prop="purchaseDate">
          <el-date-picker v-model="equipmentForm.purchaseDate" type="date" placeholder="请选择购买日期" />
        </el-form-item>
        <el-form-item label="存放位置" prop="location">
          <el-input v-model="equipmentForm.location" placeholder="请输入存放位置" />
        </el-form-item>
        <el-form-item label="设备描述">
          <el-input v-model="equipmentForm.description" type="textarea" placeholder="请输入设备描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="viewDialogVisible" title="设备详情" width="700px">
      <div class="equipment-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions border :column="1" title="基本信息">
              <el-descriptions-item label="设备编号">{{ viewEquipment.code }}</el-descriptions-item>
              <el-descriptions-item label="设备名称">{{ viewEquipment.name }}</el-descriptions-item>
              <el-descriptions-item label="设备型号">{{ viewEquipment.model }}</el-descriptions-item>
              <el-descriptions-item label="所属部门">{{ viewEquipment.department }}</el-descriptions-item>
              <el-descriptions-item label="设备状态">
                <el-tag :type="getStatusType(viewEquipment.status)">
                  {{ getStatusText(viewEquipment.status) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <el-descriptions border :column="1" title="详细信息">
              <el-descriptions-item label="购买日期">{{ viewEquipment.purchaseDate }}</el-descriptions-item>
              <el-descriptions-item label="最后保养">{{ viewEquipment.lastMaintenance }}</el-descriptions-item>
              <el-descriptions-item label="利用率">{{ viewEquipment.utilization }}%</el-descriptions-item>
              <el-descriptions-item label="存放位置">{{ viewEquipment.location }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        <el-divider />
        <el-descriptions border :column="1" title="备注信息">
          <el-descriptions-item label="设备描述">{{ viewEquipment.description || '暂无描述' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 批量操作确认对话框 -->
    <el-dialog v-model="confirmDialogVisible" title="确认操作" width="400px">
      <p>{{ confirmMessage }}</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="handleConfirmAction">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Search, Briefcase, CircleCheck, Warning, CircleClose } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const searchKeyword = ref('')
const filterStatus = ref('')
const filterDepartment = ref('')
const filterType = ref('')
const dateRange = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const selectedRows = ref([])

// 对话框状态
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const confirmMessage = ref('')
const confirmAction = ref('')
const confirmData = ref(null)
const isEdit = ref(false)

// 设备数据
const equipmentList = ref([])
const equipmentForm = ref({
  id: '',
  code: '',
  name: '',
  model: '',
  type: '',
  department: '',
  status: 'standby',
  purchaseDate: '',
  lastMaintenance: '',
  utilization: 0,
  location: '',
  description: ''
})
const viewEquipment = ref({})
const equipmentFormRef = ref(null)

// 表单验证规则
const formRules = {
  code: [
    { required: true, message: '请输入设备编号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入设备型号', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  department: [
    { required: true, message: '请选择所属部门', trigger: 'change' }
  ],
  status: [
    { required: true, message: '请选择设备状态', trigger: 'change' }
  ],
  purchaseDate: [
    { required: true, message: '请选择购买日期', trigger: 'change' }
  ],
  location: [
    { required: true, message: '请输入存放位置', trigger: 'blur' }
  ]
}

// 计算属性 - 筛选后的设备列表
const filteredEquipmentList = computed(() => {
  let filtered = [...equipmentList.value]
  
  // 搜索关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.code.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.model.toLowerCase().includes(keyword) ||
      item.location.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (filterStatus.value) {
    filtered = filtered.filter(item => item.status === filterStatus.value)
  }
  
  // 部门筛选
  if (filterDepartment.value) {
    filtered = filtered.filter(item => item.department === filterDepartment.value)
  }
  
  // 设备类型筛选
  if (filterType.value) {
    filtered = filtered.filter(item => item.name.includes(filterType.value))
  }
  
  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])
    filtered = filtered.filter(item => {
      const purchaseDate = new Date(item.purchaseDate)
      return purchaseDate >= startDate && purchaseDate <= endDate
    })
  }
  
  return filtered
})

// 计算属性 - 统计数据
const runningCount = computed(() => {
  return equipmentList.value.filter(item => item.status === 'running').length
})

const maintenanceCount = computed(() => {
  return equipmentList.value.filter(item => item.status === 'maintenance').length
})

const brokenCount = computed(() => {
  return equipmentList.value.filter(item => item.status === 'broken').length
})

// 计算属性 - 分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return {
    data: filteredEquipmentList.value.slice(start, end),
    total: filteredEquipmentList.value.length
  }
})

// 生命周期钩子
onMounted(() => {
  loadEquipmentList()
})

// 加载设备数据
const loadEquipmentList = () => {
  loading.value = true
  // 模拟数据加载
  setTimeout(() => {
    equipmentList.value = [
      {
        id: 1,
        code: 'EQ001',
        name: '注塑机',
        model: 'ZS-2000',
        type: '注塑机',
        department: '生产一部',
        status: 'running',
        purchaseDate: '2022-03-15',
        lastMaintenance: '2024-01-10',
        utilization: 85,
        location: '车间A-01',
        description: '主要用于塑料部件生产'
      },
      {
        id: 2,
        code: 'EQ002',
        name: 'CNC机床',
        model: 'CNC-850',
        type: 'CNC机床',
        department: '生产二部',
        status: 'maintenance',
        purchaseDate: '2021-08-20',
        lastMaintenance: '2024-01-05',
        utilization: 92,
        location: '车间B-05',
        description: '高精度数控加工中心'
      },
      {
        id: 3,
        code: 'EQ003',
        name: '装配机器人',
        model: 'ABB-6700',
        type: '机器人',
        department: '生产一部',
        status: 'standby',
        purchaseDate: '2022-11-10',
        lastMaintenance: '2024-01-12',
        utilization: 78,
        location: '装配线-03',
        description: '自动化装配机器人'
      },
      {
        id: 4,
        code: 'EQ004',
        name: '激光切割机',
        model: 'LC-3015',
        type: '切割设备',
        department: '研发部',
        status: 'running',
        purchaseDate: '2023-01-25',
        lastMaintenance: '2024-01-08',
        utilization: 65,
        location: '研发车间',
        description: '高精度激光切割设备'
      },
      {
        id: 5,
        code: 'EQ005',
        name: '三坐标测量机',
        model: 'CMM-500',
        type: '测量设备',
        department: '质检部',
        status: 'running',
        purchaseDate: '2021-05-18',
        lastMaintenance: '2023-12-28',
        utilization: 88,
        location: '质检室',
        description: '精密测量设备'
      },
      {
        id: 6,
        code: 'EQ006',
        name: '数控车床',
        model: 'SK-6140',
        type: 'CNC机床',
        department: '生产二部',
        status: 'standby',
        purchaseDate: '2022-06-30',
        lastMaintenance: '2024-01-03',
        utilization: 72,
        location: '车间B-03',
        description: '精密数控车床'
      },
      {
        id: 7,
        code: 'EQ007',
        name: '焊接机器人',
        model: 'OTC-DR2000',
        type: '机器人',
        department: '生产一部',
        status: 'broken',
        purchaseDate: '2022-02-15',
        lastMaintenance: '2023-12-20',
        utilization: 0,
        location: '焊接车间',
        description: '自动化焊接机器人'
      },
      {
        id: 8,
        code: 'EQ008',
        name: '冲床',
        model: 'JH21-100',
        type: '其他设备',
        department: '生产二部',
        status: 'maintenance',
        purchaseDate: '2021-12-10',
        lastMaintenance: '2023-12-15',
        utilization: 0,
        location: '冲压车间',
        description: '机械冲床设备'
      }
    ]
    loading.value = false
  }, 500)
}

// 获取状态样式
const getStatusType = (status) => {
  const types = {
    running: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    standby: '待机',
    maintenance: '维修中',
    broken: '故障'
  }
  return texts[status] || '未知'
}

// 获取利用率颜色
const getUtilizationColor = (value) => {
  if (value >= 80) return '#67C23A'
  if (value >= 60) return '#E6A23C'
  return '#F56C6C'
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
}

// 筛选处理
const handleFilter = () => {
  currentPage.value = 1
}

// 分页大小变化
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

// 当前页变化
const handleCurrentChange = (newCurrent) => {
  currentPage.value = newCurrent
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 重置表单
const resetForm = () => {
  equipmentFormRef.value?.resetFields()
  equipmentForm.value = {
    id: '',
    code: '',
    name: '',
    model: '',
    type: '',
    department: '',
    status: 'standby',
    purchaseDate: '',
    lastMaintenance: '',
    utilization: 0,
    location: '',
    description: ''
  }
}

// 新增设备
const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑设备
const handleEdit = (equipment) => {
  isEdit.value = true
  equipmentForm.value = { ...equipment }
  dialogVisible.value = true
}

// 查看设备详情
const handleView = (equipment) => {
  viewEquipment.value = { ...equipment }
  viewDialogVisible.value = true
}

// 删除确认
const handleDeleteConfirm = (equipment) => {
  confirmMessage.value = `确定要删除设备「${equipment.name}」吗？`
  confirmAction.value = 'delete'
  confirmData.value = equipment
  confirmDialogVisible.value = true
}

// 提交表单
const handleSubmit = () => {
  equipmentFormRef.value.validate((valid) => {
    if (valid) {
      if (isEdit.value) {
        // 编辑操作
        const index = equipmentList.value.findIndex(item => item.id === equipmentForm.value.id)
        if (index !== -1) {
          // 保留不修改的字段
          const original = equipmentList.value[index]
          equipmentList.value[index] = {
            ...equipmentForm.value,
            lastMaintenance: original.lastMaintenance,
            utilization: original.utilization
          }
          ElMessage.success('设备信息更新成功')
        }
      } else {
        // 新增操作
        const newEquipment = {
          ...equipmentForm.value,
          id: Date.now(),
          lastMaintenance: '',
          utilization: 0
        }
        equipmentList.value.unshift(newEquipment)
        ElMessage.success('设备添加成功')
      }
      dialogVisible.value = false
    }
  })
}

// 确认操作
const handleConfirmAction = () => {
  if (confirmAction.value === 'delete') {
    const index = equipmentList.value.findIndex(item => item.id === confirmData.value.id)
    if (index !== -1) {
      equipmentList.value.splice(index, 1)
      ElMessage.success('设备删除成功')
    }
  } else if (confirmAction.value === 'batchDelete') {
    // 批量删除
    const idsToDelete = confirmData.value.map(item => item.id)
    equipmentList.value = equipmentList.value.filter(item => !idsToDelete.includes(item.id))
    ElMessage.success(`成功删除 ${confirmData.value.length} 台设备`)
    selectedRows.value = []
  }
  confirmDialogVisible.value = false
}

// 批量删除
const handleBatchDelete = () => {
  confirmMessage.value = `确定要删除选中的 ${selectedRows.value.length} 台设备吗？此操作不可恢复。`
  confirmAction.value = 'batchDelete'
  confirmData.value = [...selectedRows.value]
  confirmDialogVisible.value = true
}

// 导入设备
const handleImport = () => {
  ElMessageBox.alert('导入功能开发中...', '提示')
}

// 导出设备
const handleExport = () => {
  if (filteredEquipmentList.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  // 模拟导出功能
  ElMessage.success(`成功导出 ${filteredEquipmentList.value.length} 条设备数据`)
}

// 批量导出
const handleBatchExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的设备')
    return
  }
  
  ElMessage.success(`成功导出 ${selectedRows.value.length} 条设备数据`)
}
</script>

<style scoped>
.equipment-list {
  padding: 20px;
  background-color: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.utilization-container {
  display: flex;
  align-items: center;
}

.equipment-detail {
  padding: 10px;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-table) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

:deep(.el-table__header) {
  background-color: #fafafa;
}
  /* 统计卡片样式 */
  .stats-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    height: 100%;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 24px;
  }

  .stat-icon.primary {
    background-color: #ecf5ff;
    color: #409eff;
  }

  .stat-icon.success {
    background-color: #f0f9eb;
    color: #67c23a;
  }

  .stat-icon.warning {
    background-color: #fdf6ec;
    color: #e6a23c;
  }

  .stat-icon.danger {
    background-color: #fef0f0;
    color: #f56c6c;
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
    color: #606266;
  }
</style>