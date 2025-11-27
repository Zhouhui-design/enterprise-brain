cat > mold/MoldManagement.vue <<'EOF'
<template>
  <div class="mold-management">
    <div class="header">
      <h1>模具管理</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAdd">新增模具</el-button>
        <el-button @click="handleImport">导入模具</el-button>
        <el-button @click="handleExport">导出模具</el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="模具编号/名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入编号或名称" 
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="使用中" value="in_use" />
            <el-option label="待机" value="standby" />
            <el-option label="保养中" value="maintenance" />
            <el-option label="故障" value="broken" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="searchForm.product" placeholder="全部产品" clearable>
            <el-option v-for="product in productList" :key="product" :label="product" :value="product" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <template #header>
          <span>模具总数</span>
        </template>
        <div class="card-content">
          <el-statistic :value="totalMolds" suffix="套" />
        </div>
      </el-card>
      <el-card class="stat-card">
        <template #header>
          <span>使用中</span>
        </template>
        <div class="card-content">
          <el-statistic :value="inUseMolds" suffix="套" :value-style="{ color: '#67c23a' }" />
        </div>
      </el-card>
      <el-card class="stat-card">
        <template #header>
          <span>待保养</span>
        </template>
        <div class="card-content">
          <el-statistic :value="maintenanceMolds" suffix="套" :value-style="{ color: '#e6a23c' }" />
        </div>
      </el-card>
      <el-card class="stat-card">
        <template #header>
          <span>故障</span>
        </template>
        <div class="card-content">
          <el-statistic :value="brokenMolds" suffix="套" :value-style="{ color: '#f56c6c' }" />
        </div>
      </el-card>
    </div>

    <!-- 模具列表 -->
    <el-card class="table-card">
      <el-table 
        :data="paginatedMolds" 
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSort"
      >
        <el-table-column prop="code" label="模具编号" width="120" sortable />
        <el-table-column prop="name" label="模具名称" width="180" sortable />
        <el-table-column prop="model" label="模具型号" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentProduct" label="当前产品" />
        <el-table-column prop="totalShots" label="总模次" width="100" sortable />
        <el-table-column prop="nextMaintenanceShots" label="下次保养模次" width="120" sortable>
          <template #default="scope">
            <div :class="{ 'warning-text': scope.row.totalShots >= scope.row.nextMaintenanceShots - 1000 }">
              {{ scope.row.nextMaintenanceShots }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="lastMaintenance" label="最后保养" width="120" />
        <el-table-column prop="location" label="存放位置" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">查看</el-button>
            <el-button link type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredMolds.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增模具' : '编辑模具'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="模具编号" prop="code">
          <el-input v-model="formData.code" placeholder="请输入模具编号" />
        </el-form-item>
        <el-form-item label="模具名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入模具名称" />
        </el-form-item>
        <el-form-item label="模具型号" prop="model">
          <el-input v-model="formData.model" placeholder="请输入模具型号" />
        </el-form-item>
        <el-form-item label="模具状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择模具状态">
            <el-option label="使用中" value="in_use" />
            <el-option label="待机" value="standby" />
            <el-option label="保养中" value="maintenance" />
            <el-option label="故障" value="broken" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前产品" prop="currentProduct">
          <el-select v-model="formData.currentProduct" placeholder="请选择当前产品">
            <el-option v-for="product in productList" :key="product" :label="product" :value="product" />
          </el-select>
        </el-form-item>
        <el-form-item label="总模次" prop="totalShots">
          <el-input-number v-model="formData.totalShots" :min="0" placeholder="请输入总模次" />
        </el-form-item>
        <el-form-item label="保养周期(模次)" prop="maintenanceCycle">
          <el-input-number v-model="formData.maintenanceCycle" :min="1" placeholder="请输入保养周期" />
        </el-form-item>
        <el-form-item label="存放位置" prop="location">
          <el-input v-model="formData.location" placeholder="请输入存放位置" />
        </el-form-item>
        <el-form-item label="备注信息" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`模具详情 - ${selectedMold?.name || ''}`"
      width="600px"
    >
      <div v-if="selectedMold" class="mold-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="模具编号">{{ selectedMold.code }}</el-descriptions-item>
          <el-descriptions-item label="模具名称">{{ selectedMold.name }}</el-descriptions-item>
          <el-descriptions-item label="模具型号">{{ selectedMold.model }}</el-descriptions-item>
          <el-descriptions-item label="模具状态">
            <el-tag :type="getStatusType(selectedMold.status)">{{ getStatusText(selectedMold.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前产品">{{ selectedMold.currentProduct }}</el-descriptions-item>
          <el-descriptions-item label="总模次">{{ selectedMold.totalShots }}</el-descriptions-item>
          <el-descriptions-item label="最后保养日期">{{ selectedMold.lastMaintenance || '未保养' }}</el-descriptions-item>
          <el-descriptions-item label="下次保养模次">{{ selectedMold.nextMaintenanceShots }}</el-descriptions-item>
          <el-descriptions-item label="保养周期">{{ selectedMold.maintenanceCycle }}模次</el-descriptions-item>
          <el-descriptions-item label="存放位置">{{ selectedMold.location }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedMold.responsiblePerson || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="备注信息">{{ selectedMold.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 模次进度条 -->
        <div class="shots-progress" v-if="selectedMold.totalShots && selectedMold.nextMaintenanceShots">
          <h3>保养进度</h3>
          <el-progress 
            :percentage="Math.min(100, (selectedMold.totalShots / selectedMold.nextMaintenanceShots * 100).toFixed(1))" 
            :status="selectedMold.totalShots >= selectedMold.nextMaintenanceShots - 1000 ? 'exception' : ''"
          />
          <div class="progress-info">
            <span>当前: {{ selectedMold.totalShots }} 模次</span>
            <span>下次保养: {{ selectedMold.nextMaintenanceShots }} 模次</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEdit(selectedMold)">编辑</el-button>
      </template>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmVisible"
      title="确认删除"
      width="30%"
    >
      <span>确定要删除模具 <strong>{{ confirmMold?.code }} - {{ confirmMold?.name }}</strong> 吗？</span>
      <template #footer>
        <el-button @click="confirmVisible = false">取消</el-button>
        <el-button type="danger" @click="handleConfirmDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const moldList = ref([])
const loading = ref(false)
const searchForm = reactive({
  keyword: '',
  status: '',
  product: ''
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)

// 对话框相关
const dialogVisible = ref(false)
const detailVisible = ref(false)
const confirmVisible = ref(false)
const dialogMode = ref('add') // 'add' 或 'edit'
const formRef = ref(null)
const selectedMold = ref(null)
const confirmMold = ref(null)

// 产品列表
const productList = ref([
  '产品A', '产品B', '产品C', '产品D', '产品E', '产品F'
])

// 表单数据
const formData = reactive({
  id: '',
  code: '',
  name: '',
  model: '',
  status: 'standby',
  currentProduct: '',
  totalShots: 0,
  maintenanceCycle: 5000,
  lastMaintenance: '',
  nextMaintenanceShots: 5000,
  location: '',
  responsiblePerson: '',
  remark: ''
})

// 表单验证规则
const formRules = {
  code: [
    { required: true, message: '请输入模具编号', trigger: 'blur' },
    { min: 3, max: 20, message: '模具编号长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入模具名称', trigger: 'blur' },
    { min: 2, max: 50, message: '模具名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入模具型号', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择模具状态', trigger: 'change' }
  ],
  maintenanceCycle: [
    { required: true, message: '请输入保养周期', trigger: 'blur' },
    { type: 'number', min: 1, message: '保养周期必须大于0', trigger: 'blur' }
  ]
}

// 计算属性
const filteredMolds = computed(() => {
  return moldList.value.filter(mold => {
    // 关键词搜索
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      if (!mold.code.toLowerCase().includes(keyword) && 
          !mold.name.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 状态筛选
    if (searchForm.status && mold.status !== searchForm.status) {
      return false
    }
    
    // 产品筛选
    if (searchForm.product && mold.currentProduct !== searchForm.product) {
      return false
    }
    
    return true
  })
})

const paginatedMolds = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredMolds.value.slice(startIndex, endIndex)
})

// 统计数据
const totalMolds = computed(() => moldList.value.length)
const inUseMolds = computed(() => 
  moldList.value.filter(mold => mold.status === 'in_use').length
)
const maintenanceMolds = computed(() => 
  moldList.value.filter(mold => 
    mold.status === 'maintenance' || 
    (mold.nextMaintenanceShots && mold.totalShots >= mold.nextMaintenanceShots - 1000)
  ).length
)
const brokenMolds = computed(() => 
  moldList.value.filter(mold => mold.status === 'broken').length
)

// 生命周期钩子
onMounted(() => {
  loadMoldList()
})

// 方法
const loadMoldList = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    moldList.value = [
      {
        id: 1,
        code: 'M001',
        name: '产品A上模',
        model: 'M-A-001',
        status: 'in_use',
        currentProduct: '产品A',
        totalShots: 15000,
        maintenanceCycle: 5000,
        lastMaintenance: '2024-01-10',
        nextMaintenanceShots: 20000,
        location: '模房A区',
        responsiblePerson: '张师傅',
        remark: '主生产模具'
      },
      {
        id: 2,
        code: 'M002',
        name: '产品B下模',
        model: 'M-B-001',
        status: 'maintenance',
        currentProduct: '产品B',
        totalShots: 12000,
        maintenanceCycle: 6000,
        lastMaintenance: '2024-01-12',
        nextMaintenanceShots: 18000,
        location: '模房B区',
        responsiblePerson: '李师傅',
        remark: '备用模具'
      },
      {
        id: 3,
        code: 'M003',
        name: '产品C侧模',
        model: 'M-C-001',
        status: 'standby',
        currentProduct: '产品C',
        totalShots: 8000,
        maintenanceCycle: 4000,
        lastMaintenance: '2024-01-05',
        nextMaintenanceShots: 12000,
        location: '模房C区',
        responsiblePerson: '王师傅',
        remark: '新产品模具'
      },
      {
        id: 4,
        code: 'M004',
        name: '产品A下模',
        model: 'M-A-002',
        status: 'broken',
        currentProduct: '产品A',
        totalShots: 25000,
        maintenanceCycle: 5000,
        lastMaintenance: '2023-12-25',
        nextMaintenanceShots: 30000,
        location: '维修区',
        responsiblePerson: '张师傅',
        remark: '需更换零件'
      },
      {
        id: 5,
        code: 'M005',
        name: '产品D前模',
        model: 'M-D-001',
        status: 'in_use',
        currentProduct: '产品D',
        totalShots: 5000,
        maintenanceCycle: 8000,
        lastMaintenance: '2024-01-15',
        nextMaintenanceShots: 13000,
        location: '模房A区',
        responsiblePerson: '刘师傅',
        remark: '高精度模具'
      }
    ]
    loading.value = false
  }, 500)
}

const getStatusType = (status) => {
  const types = {
    in_use: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    in_use: '使用中',
    standby: '待机',
    maintenance: '保养中',
    broken: '故障'
  }
  return texts[status] || '未知'
}

const resetForm = () => {
  Object.assign(formData, {
    id: '',
    code: '',
    name: '',
    model: '',
    status: 'standby',
    currentProduct: '',
    totalShots: 0,
    maintenanceCycle: 5000,
    lastMaintenance: '',
    nextMaintenanceShots: 5000,
    location: '',
    responsiblePerson: '',
    remark: ''
  })
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleAdd = () => {
  dialogMode.value = 'add'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (mold) => {
  dialogMode.value = 'edit'
  Object.assign(formData, { ...mold })
  dialogVisible.value = true
}

const handleView = (mold) => {
  selectedMold.value = { ...mold }
  detailVisible.value = true
}

const handleDelete = (mold) => {
  confirmMold.value = { ...mold }
  confirmVisible.value = true
}

const handleConfirmDelete = () => {
  // 模拟删除操作
  loading.value = true
  setTimeout(() => {
    const index = moldList.value.findIndex(m => m.id === confirmMold.value.id)
    if (index > -1) {
      moldList.value.splice(index, 1)
    }
    confirmVisible.value = false
    loading.value = false
    ElMessage.success('删除成功')
  }, 500)
}

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) return
    
    loading.value = true
    
    // 计算下次保养模次
    if (formData.maintenanceCycle) {
      formData.nextMaintenanceShots = formData.totalShots + formData.maintenanceCycle
    }
    
    // 模拟保存操作
    setTimeout(() => {
      if (dialogMode.value === 'add') {
        // 新增
        const newMold = { ...formData, id: Date.now() }
        moldList.value.unshift(newMold)
        ElMessage.success('新增成功')
      } else {
        // 编辑
        const index = moldList.value.findIndex(m => m.id === formData.id)
        if (index > -1) {
          moldList.value[index] = { ...formData }
          ElMessage.success('更新成功')
        }
      }
      
      dialogVisible.value = false
      loading.value = false
    }, 500)
  })
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    product: ''
  })
  currentPage.value = 1
}

const handleSort = (column) => {
  const { prop, order } = column
  filteredMolds.value.sort((a, b) => {
    if (order === 'ascending') {
      return a[prop] > b[prop] ? 1 : -1
    } else {
      return a[prop] < b[prop] ? 1 : -1
    }
  })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

const handleImport = () => {
  ElMessageBox.confirm(
    '即将打开文件选择对话框，请选择Excel或CSV格式的模具数据文件。导入前请确保数据格式正确。',
    '确认导入',
    {
      confirmButtonText: '继续',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 这里应该是文件上传逻辑
    ElMessage.success('文件上传功能开发中...')
    // 实际项目中可以使用 el-upload 组件实现文件上传
  }).catch(() => {
    // 取消导入
  })
}

const handleExport = () => {
  if (moldList.value.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }
  
  ElMessage.success('数据导出功能开发中...')
  // 实际项目中可以使用如 xlsx 等库实现Excel导出
}
</script>

<style scoped>
.mold-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  text-align: center;
  padding: 10px 0;
}

.table-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.warning-text {
  color: #f56c6c;
  font-weight: bold;
}

.mold-detail {
  padding: 10px 0;
}

.shots-progress {
  margin-top: 30px;
}

.shots-progress h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .filter-bar .el-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    justify-content: center;
  }
}
</style>
EOF