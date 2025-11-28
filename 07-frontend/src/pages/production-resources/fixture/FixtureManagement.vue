<template>
  <div class="fixture-management-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>夹具管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增夹具
        </el-button>
        <el-button @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入夹具
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出夹具
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 夹具统计概览 -->
    <div class="fixture-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ statistics.totalFixtures }}</div>
              <div class="card-label">总夹具数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card success">
            <div class="card-content">
              <div class="card-value">{{ statistics.inUseFixtures }}</div>
              <div class="card-label">使用中夹具</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card warning">
            <div class="card-content">
              <div class="card-value">{{ statistics.maintenanceFixtures }}</div>
              <div class="card-label">保养中夹具</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card danger">
            <div class="card-content">
              <div class="card-value">{{ statistics.brokenFixtures }}</div>
              <div class="card-label">故障夹具</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryForm" @submit.prevent="handleSearch">
        <el-form-item label="夹具编号">
          <el-input v-model="queryForm.code" placeholder="请输入夹具编号" clearable />
        </el-form-item>
        <el-form-item label="夹具名称">
          <el-input v-model="queryForm.name" placeholder="请输入夹具名称" clearable />
        </el-form-item>
        <el-form-item label="夹具类型">
          <el-select v-model="queryForm.type" placeholder="请选择夹具类型" clearable>
            <el-option label="CNC夹具" value="CNC夹具" />
            <el-option label="检测夹具" value="检测夹具" />
            <el-option label="装配夹具" value="装配夹具" />
            <el-option label="焊接夹具" value="焊接夹具" />
          </el-select>
        </el-form-item>
        <el-form-item label="夹具状态">
          <el-select v-model="queryForm.status" placeholder="请选择夹具状态" clearable>
            <el-option label="使用中" value="in_use" />
            <el-option label="待机" value="standby" />
            <el-option label="保养中" value="maintenance" />
            <el-option label="故障" value="broken" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用产品">
          <el-input v-model="queryForm.applicableProduct" placeholder="请输入适用产品" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="data-table-card">
      <el-table
        v-loading="loading"
        :data="fixtureList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="code" label="夹具编号" min-width="120" sortable />
        <el-table-column prop="name" label="夹具名称" min-width="150" />
        <el-table-column prop="type" label="夹具类型" min-width="120" />
        <el-table-column prop="specification" label="规格型号" min-width="150" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicableProduct" label="适用产品" min-width="120" />
        <el-table-column prop="currentLocation" label="当前位置" min-width="150" />
        <el-table-column prop="useCount" label="使用次数" min-width="100" />
        <el-table-column prop="lastMaintenanceDate" label="最近保养日期" min-width="140" />
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleView(scope.row)">详情</el-button>
            <el-button type="info" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="success" size="small" @click="handleMaintenance(scope.row)">保养</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="夹具详情"
      size="60%"
      direction="rtl"
    >
      <div v-if="currentFixture" class="fixture-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="夹具编号">{{ currentFixture.code }}</el-descriptions-item>
          <el-descriptions-item label="夹具名称">{{ currentFixture.name }}</el-descriptions-item>
          <el-descriptions-item label="夹具类型">{{ currentFixture.type }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ currentFixture.specification || '-' }}</el-descriptions-item>
          <el-descriptions-item label="夹具状态">{{ getStatusText(currentFixture.status) }}</el-descriptions-item>
          <el-descriptions-item label="当前位置">{{ currentFixture.currentLocation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="适用产品">{{ currentFixture.applicableProduct || '-' }}</el-descriptions-item>
          <el-descriptions-item label="使用次数">{{ currentFixture.useCount || 0 }}</el-descriptions-item>
          <el-descriptions-item label="责任人">{{ currentFixture.responsiblePerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentFixture.supplier || '-' }}</el-descriptions-item>
          <el-descriptions-item label="采购日期">{{ currentFixture.purchaseDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计使用寿命">{{ currentFixture.expectedLife || '-' }} 次</el-descriptions-item>
          <el-descriptions-item label="最近保养日期">{{ currentFixture.lastMaintenanceDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="下次保养日期">{{ currentFixture.nextMaintenanceDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ currentFixture.createDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentFixture.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 夹具图片 -->
        <div class="fixture-images" style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px;">夹具图片</h3>
          <div class="image-list">
            <div v-for="(image, index) in fixtureImages" :key="index" class="image-item">
              <el-image
                :src="image"
                fit="cover"
                style="width: 200px; height: 150px"
                :preview-src-list="fixtureImages"
              ></el-image>
            </div>
            <div v-if="fixtureImages.length === 0" class="no-data">暂无图片</div>
          </div>
        </div>

        <!-- 保养记录 -->
        <div class="maintenance-records" style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px;">最近保养记录</h3>
          <el-table v-if="maintenanceRecords.length > 0" :data="maintenanceRecords" size="small">
            <el-table-column prop="maintenanceDate" label="保养日期" min-width="140" />
            <el-table-column prop="maintenancePerson" label="保养人" min-width="120" />
            <el-table-column prop="maintenanceContent" label="保养内容" min-width="200" />
            <el-table-column prop="status" label="保养状态" min-width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'completed' ? 'success' : 'info'">
                  {{ scope.row.status === 'completed' ? '已完成' : '进行中' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="no-data">暂无保养记录</div>
        </div>
      </div>
    </el-drawer>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isAdd ? '新增夹具' : '编辑夹具'"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="夹具编号" prop="code">
              <el-input v-model="form.code" :disabled="!isAdd" placeholder="请输入夹具编号" />
            </el-form-item>
            <el-form-item label="夹具名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入夹具名称" />
            </el-form-item>
            <el-form-item label="夹具类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择夹具类型">
                <el-option label="CNC夹具" value="CNC夹具" />
                <el-option label="检测夹具" value="检测夹具" />
                <el-option label="装配夹具" value="装配夹具" />
                <el-option label="焊接夹具" value="焊接夹具" />
              </el-select>
            </el-form-item>
            <el-form-item label="规格型号" prop="specification">
              <el-input v-model="form.specification" placeholder="请输入规格型号" />
            </el-form-item>
            <el-form-item label="当前位置" prop="currentLocation">
              <el-input v-model="form.currentLocation" placeholder="请输入当前位置" />
            </el-form-item>
            <el-form-item label="适用产品" prop="applicableProduct">
              <el-input v-model="form.applicableProduct" placeholder="请输入适用产品" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="责任人" prop="responsiblePerson">
              <el-input v-model="form.responsiblePerson" placeholder="请输入责任人" />
            </el-form-item>
            <el-form-item label="供应商">
              <el-input v-model="form.supplier" placeholder="请输入供应商" />
            </el-form-item>
            <el-form-item label="采购日期">
              <el-date-picker
                v-model="form.purchaseDate"
                type="date"
                placeholder="选择采购日期"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="预计使用寿命">
              <el-input v-model.number="form.expectedLife" type="number" placeholder="请输入预计使用寿命（次）" />
            </el-form-item>
            <el-form-item label="下次保养日期">
              <el-date-picker
                v-model="form.nextMaintenanceDate"
                type="date"
                placeholder="选择下次保养日期"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="form.status" placeholder="请选择状态">
                <el-option label="使用中" value="in_use" />
                <el-option label="待机" value="standby" />
                <el-option label="保养中" value="maintenance" />
                <el-option label="故障" value="broken" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 保养对话框 -->
    <el-dialog
      v-model="maintenanceDialogVisible"
      title="夹具保养"
      width="600px"
      @close="handleMaintenanceDialogClose"
    >
      <el-form
        ref="maintenanceFormRef"
        :model="maintenanceForm"
        :rules="maintenanceFormRules"
        label-width="100px"
      >
        <el-form-item label="保养日期" prop="maintenanceDate">
          <el-date-picker
            v-model="maintenanceForm.maintenanceDate"
            type="datetime"
            placeholder="选择保养日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="保养人" prop="maintenancePerson">
          <el-input v-model="maintenanceForm.maintenancePerson" placeholder="请输入保养人" />
        </el-form-item>
        <el-form-item label="保养内容" prop="maintenanceContent">
          <el-input v-model="maintenanceForm.maintenanceContent" type="textarea" placeholder="请输入保养内容" rows="4" />
        </el-form-item>
        <el-form-item label="下次保养日期" prop="nextMaintenanceDate">
          <el-date-picker
            v-model="maintenanceForm.nextMaintenanceDate"
            type="date"
            placeholder="选择下次保养日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleMaintenanceDialogClose">取消</el-button>
          <el-button type="primary" @click="handleMaintenanceSubmit">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Upload, Download, Refresh } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const maintenanceDialogVisible = ref(false)
const isAdd = ref(true)
const currentFixture = ref(null)
const formRef = ref(null)
const maintenanceFormRef = ref(null)
const selectedRows = ref([])
const queryForm = reactive({
  code: '',
  name: '',
  type: '',
  status: '',
  applicableProduct: ''
})
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const fixtureList = ref([])
const statistics = reactive({
  totalFixtures: 0,
  inUseFixtures: 0,
  maintenanceFixtures: 0,
  brokenFixtures: 0
})
const fixtureImages = ref([])
const maintenanceRecords = ref([])

const form = reactive({
  code: '',
  name: '',
  type: '',
  specification: '',
  status: 'standby',
  applicableProduct: '',
  currentLocation: '',
  useCount: 0,
  responsiblePerson: '',
  supplier: '',
  purchaseDate: null,
  expectedLife: null,
  lastMaintenanceDate: null,
  nextMaintenanceDate: null,
  createDate: null,
  remark: ''
})

const maintenanceForm = reactive({
  maintenanceDate: new Date(),
  maintenancePerson: '',
  maintenanceContent: '',
  nextMaintenanceDate: null
})

// 表单验证规则
const formRules = {
  code: [
    { required: true, message: '请输入夹具编号', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入夹具名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择夹具类型', trigger: 'change' }
  ],
  specification: [
    { required: true, message: '请输入规格型号', trigger: 'blur' }
  ],
  currentLocation: [
    { required: true, message: '请输入当前位置', trigger: 'blur' }
  ],
  responsiblePerson: [
    { required: true, message: '请输入责任人', trigger: 'blur' }
  ]
}

const maintenanceFormRules = {
  maintenanceDate: [
    { required: true, message: '请选择保养日期', trigger: 'change' }
  ],
  maintenancePerson: [
    { required: true, message: '请输入保养人', trigger: 'blur' }
  ],
  maintenanceContent: [
    { required: true, message: '请输入保养内容', trigger: 'blur' }
  ],
  nextMaintenanceDate: [
    { required: true, message: '请选择下次保养日期', trigger: 'change' }
  ]
}

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    in_use: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    in_use: '使用中',
    standby: '待机',
    maintenance: '保养中',
    broken: '故障'
  }
  return texts[status] || '未知'
}

// 加载夹具列表
const loadFixtureList = async () => {
  loading.value = true
  try {
    // 模拟API请求
    // const response = await fixtureService.getFixtureList({
    //   ...queryForm,
    //   page: pagination.currentPage,
    //   pageSize: pagination.pageSize
    // })
    // fixtureList.value = response.data
    
    // 模拟数据
    fixtureList.value = generateMockData()
    pagination.total = 50
    calculateStatistics()
  } catch (error) {
    ElMessage.error('获取夹具列表失败')
    console.error('获取夹具列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 生成模拟数据
const generateMockData = () => {
  const data = []
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  const types = ['CNC夹具', '检测夹具', '装配夹具', '焊接夹具']
  const statuses = ['in_use', 'standby', 'maintenance', 'broken']
  
  for (let i = 0; i < pagination.pageSize; i++) {
    const index = startIndex + i
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    
    data.push({
      id: index + 1,
      code: `F${String(index + 1).padStart(3, '0')}`,
      name: `${type}${index + 1}`,
      type: type,
      specification: `${type.substring(0, 2)}-${String(index + 1).padStart(3, '0')}`,
      status: status,
      applicableProduct: `产品${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
      currentLocation: `${getLocationByStatus(status)}`,
      useCount: Math.floor(Math.random() * 1000),
      responsiblePerson: `责任人${Math.floor(index % 5) + 1}`,
      supplier: `供应商${Math.floor(index % 3) + 1}`,
      purchaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      expectedLife: Math.floor(Math.random() * 5000) + 1000,
      lastMaintenanceDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      nextMaintenanceDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      createDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      remark: `夹具备注信息${index + 1}`
    })
  }
  return data
}

// 根据状态获取位置
const getLocationByStatus = (status) => {
  const locationMap = {
    in_use: '生产现场',
    standby: '仓库',
    maintenance: '维修车间',
    broken: '故障区'
  }
  return locationMap[status] || '未知位置'
}

// 计算统计数据
const calculateStatistics = () => {
  statistics.totalFixtures = fixtureList.value.length
  statistics.inUseFixtures = fixtureList.value.filter(item => item.status === 'in_use').length
  statistics.maintenanceFixtures = fixtureList.value.filter(item => item.status === 'maintenance').length
  statistics.brokenFixtures = fixtureList.value.filter(item => item.status === 'broken').length
}

// 新增夹具
const handleAdd = () => {
  isAdd.value = true
  resetForm()
  // 生成默认夹具编号
  form.code = `F${Date.now().toString().slice(-3)}`
  form.createDate = new Date().toLocaleDateString()
  dialogVisible.value = true
}

// 编辑夹具
const handleEdit = (row) => {
  isAdd.value = false
  currentFixture.value = { ...row }
  Object.assign(form, row)
  dialogVisible.value = true
}

// 查看夹具详情
const handleView = (row) => {
  currentFixture.value = { ...row }
  loadFixtureImages(row.id)
  loadMaintenanceRecords(row.id)
  drawerVisible.value = true
}

// 删除夹具
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除夹具「${row.name}」吗？`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      const index = fixtureList.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        fixtureList.value.splice(index, 1)
        ElMessage.success('删除成功')
        calculateStatistics()
      }
    } catch (error) {
      ElMessage.error('删除失败')
      console.error('删除失败:', error)
    }
  }).catch(() => {
    // 取消删除
  })
}

// 批量删除
const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择需要删除的夹具')
    return
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 个夹具吗？`,
    '批量删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      const ids = selectedRows.value.map(row => row.id)
      fixtureList.value = fixtureList.value.filter(item => !ids.includes(item.id))
      ElMessage.success(`成功删除 ${selectedRows.value.length} 个夹具`)
      selectedRows.value = []
      calculateStatistics()
    } catch (error) {
      ElMessage.error('批量删除失败')
      console.error('批量删除失败:', error)
    }
  }).catch(() => {
    // 取消删除
  })
}

// 夹具保养
const handleMaintenance = (row) => {
  currentFixture.value = { ...row }
  resetMaintenanceForm()
  maintenanceDialogVisible.value = true
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadFixtureList()
}

// 重置搜索条件
const resetQuery = () => {
  Object.keys(queryForm).forEach(key => {
    queryForm[key] = ''
  })
  pagination.currentPage = 1
  loadFixtureList()
}

// 刷新
const handleRefresh = () => {
  loadFixtureList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadFixtureList()
}

// 当前页改变
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  loadFixtureList()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value.validate()
  if (!valid) return

  try {
    if (isAdd.value) {
      // 模拟添加操作
      const newFixture = {
        id: fixtureList.value.length + 1,
        ...form,
        useCount: 0,
        createDate: new Date().toLocaleDateString()
      }
      fixtureList.value.push(newFixture)
      ElMessage.success('添加成功')
    } else {
      // 模拟更新操作
      const index = fixtureList.value.findIndex(item => item.id === currentFixture.value.id)
      if (index !== -1) {
        fixtureList.value[index] = {
          ...form
        }
        ElMessage.success('更新成功')
      }
    }
    dialogVisible.value = false
    calculateStatistics()
  } catch (error) {
    ElMessage.error(isAdd.value ? '添加失败' : '更新失败')
    console.error(isAdd.value ? '添加失败:' : '更新失败:', error)
  }
}

// 提交保养表单
const handleMaintenanceSubmit = async () => {
  const valid = await maintenanceFormRef.value.validate()
  if (!valid) return

  try {
    // 模拟保养操作
    const index = fixtureList.value.findIndex(item => item.id === currentFixture.value.id)
    if (index !== -1) {
      fixtureList.value[index].status = 'standby'
      fixtureList.value[index].lastMaintenanceDate = maintenanceForm.maintenanceDate.toLocaleDateString()
      fixtureList.value[index].nextMaintenanceDate = maintenanceForm.nextMaintenanceDate.toLocaleDateString()
      ElMessage.success('保养记录提交成功')
      maintenanceDialogVisible.value = false
    }
  } catch (error) {
    ElMessage.error('保养记录提交失败')
    console.error('保养记录提交失败:', error)
  }
}

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false
  resetForm()
}

// 关闭保养对话框
const handleMaintenanceDialogClose = () => {
  maintenanceDialogVisible.value = false
  resetMaintenanceForm()
}

// 重置表单
const resetForm = () => {
  Object.keys(form).forEach(key => {
    if (key === 'status') {
      form[key] = 'standby'
    } else if (typeof form[key] === 'number') {
      form[key] = 0
    } else if (typeof form[key] === 'object') {
      form[key] = null
    } else {
      form[key] = ''
    }
  })
}

// 重置保养表单
const resetMaintenanceForm = () => {
  maintenanceForm.maintenanceDate = new Date()
  maintenanceForm.maintenancePerson = ''
  maintenanceForm.maintenanceContent = ''
  maintenanceForm.nextMaintenanceDate = null
}

// 加载夹具图片
const loadFixtureImages = async (fixtureId) => {
  try {
    // 模拟API请求
    // fixtureImages.value = await fixtureService.getFixtureImages(fixtureId)
    
    // 模拟数据
    fixtureImages.value = [
      'https://picsum.photos/id/1/800/600',
      'https://picsum.photos/id/20/800/600',
      'https://picsum.photos/id/30/800/600'
    ]
  } catch (error) {
    console.error('获取夹具图片失败:', error)
  }
}

// 加载保养记录
const loadMaintenanceRecords = async (fixtureId) => {
  try {
    // 模拟API请求
    // maintenanceRecords.value = await fixtureService.getMaintenanceRecords(fixtureId)
    
    // 模拟数据
    maintenanceRecords.value = [
      {
        id: 1,
        maintenanceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        maintenancePerson: '保养员A',
        maintenanceContent: '常规清洁、润滑、检查',
        status: 'completed'
      },
      {
        id: 2,
        maintenanceDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        maintenancePerson: '保养员B',
        maintenanceContent: '更换磨损部件，调整参数',
        status: 'completed'
      }
    ]
  } catch (error) {
    console.error('获取保养记录失败:', error)
  }
}

// 导入夹具
const handleImport = async () => {
  try {
    // 模拟导入操作
    ElMessage.success('导入成功')
    loadFixtureList()
  } catch (error) {
    ElMessage.error('导入失败')
    console.error('导入失败:', error)
  }
}

// 导出夹具
const handleExport = async () => {
  try {
    // 模拟导出操作
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error('导出失败:', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadFixtureList()
})
</script>

<style scoped>
.fixture-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.fixture-overview {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

.overview-card.success {
  border-left: 4px solid #67c23a;
}

.overview-card.warning {
  border-left: 4px solid #e6a23c;
}

.overview-card.danger {
  border-left: 4px solid #f56c6c;
}

.card-content {
  text-align: center;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #606266;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 4px;
}

.data-table-card {
  border-radius: 4px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.fixture-detail {
  padding: 20px 0;
}

.fixture-images,
.maintenance-records {
  margin-top: 30px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.image-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #909399;
}

@media (max-width: 768px) {
  .fixture-management-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .overview-card {
    height: 100px;
  }
  
  .card-value {
    font-size: 24px;
  }
}
</style>