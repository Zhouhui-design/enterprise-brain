<template>
  <div class="tooling-inventory">
    <div class="page-header">
      <h1>工装库存管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddTooling">新增工装</el-button>
        <el-button @click="handleExport">导出库存</el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="search-filter">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchForm.toolingCode" placeholder="工装编号" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-input v-model="searchForm.toolingName" placeholder="工装名称" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.category" placeholder="工装类别" clearable>
            <el-option v-for="cat in categories" :key="cat.value" :label="cat.label" :value="cat.value"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.status" placeholder="库存状态" clearable>
            <el-option v-for="stat in statusOptions" :key="stat.value" :label="stat.label" :value="stat.value"></el-option>
          </el-select>
        </el-col>
      </el-row>
      <div class="search-actions">
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ totalQuantity }}</div>
            <div class="stat-label">总库存</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-number">{{ lowStockQuantity }}</div>
            <div class="stat-label">低库存</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-number">{{ availableQuantity }}</div>
            <div class="stat-label">可使用</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-number">{{ totalTypes }}</div>
            <div class="stat-label">工装种类</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 库存趋势图 -->
    <div class="chart-section">
      <h3>库存趋势</h3>
      <div class="chart-container">
        <canvas ref="inventoryChart"></canvas>
      </div>
    </div>

    <!-- 库存列表 -->
    <div class="inventory-list">
      <div class="list-header">
        <h3>工装库存列表</h3>
        <div class="view-switch">
          <el-radio-group v-model="viewMode">
            <el-radio-button label="table">表格</el-radio-button>
            <el-radio-button label="card">卡片</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table v-if="viewMode === 'table'" :data="toolingInventory" style="width: 100%" border>
        <el-table-column prop="toolingCode" label="工装编号" width="120"></el-table-column>
        <el-table-column prop="toolingName" label="工装名称"></el-table-column>
        <el-table-column prop="category" label="类别" width="100">
          <template #default="scope">
            {{ getCategoryLabel(scope.row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="currentQuantity" label="当前库存" width="100"></el-table-column>
        <el-table-column prop="minQuantity" label="最低库存" width="100"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="存储位置"></el-table-column>
        <el-table-column prop="lastCheckDate" label="最后盘点日期" width="140"></el-table-column>
        <el-table-column prop="supplier" label="供应商" width="120"></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleViewDetail(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEditTooling(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteTooling(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="card-view">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4" v-for="tooling in toolingInventory" :key="tooling.id">
            <el-card class="tooling-card" shadow="hover">
              <div class="card-header">
                <div class="tooling-code">{{ tooling.toolingCode }}</div>
                <el-tag :type="getStatusType(tooling.status)">{{ getStatusLabel(tooling.status) }}</el-tag>
              </div>
              <div class="card-body">
                <h4>{{ tooling.toolingName }}</h4>
                <div class="card-info">
                  <p><span>类别:</span> {{ getCategoryLabel(tooling.category) }}</p>
                  <p><span>当前库存:</span> <strong :class="{ 'warning-text': tooling.currentQuantity <= tooling.minQuantity }">
                    {{ tooling.currentQuantity }}
                  </strong></p>
                  <p><span>最低库存:</span> {{ tooling.minQuantity }}</p>
                  <p><span>位置:</span> {{ tooling.location }}</p>
                </div>
              </div>
              <div class="card-footer">
                <el-button size="small" @click="handleViewDetail(tooling)">查看详情</el-button>
                <el-button size="small" type="primary" @click="handleEditTooling(tooling)">编辑</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>

    <!-- 工装详情对话框 -->
    <el-dialog v-model="detailVisible" title="工装详情" width="700px">
      <div v-if="selectedTooling" class="tooling-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions border :column="1">
              <el-descriptions-item label="工装编号">{{ selectedTooling.toolingCode }}</el-descriptions-item>
              <el-descriptions-item label="工装名称">{{ selectedTooling.toolingName }}</el-descriptions-item>
              <el-descriptions-item label="类别">{{ getCategoryLabel(selectedTooling.category) }}</el-descriptions-item>
              <el-descriptions-item label="规格型号">{{ selectedTooling.specification }}</el-descriptions-item>
              <el-descriptions-item label="计量单位">{{ selectedTooling.unit }}</el-descriptions-item>
              <el-descriptions-item label="供应商">{{ selectedTooling.supplier }}</el-descriptions-item>
              <el-descriptions-item label="采购单价">{{ selectedTooling.unitPrice }} 元</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <el-descriptions border :column="1">
              <el-descriptions-item label="当前库存">{{ selectedTooling.currentQuantity }}</el-descriptions-item>
              <el-descriptions-item label="最低库存">{{ selectedTooling.minQuantity }}</el-descriptions-item>
              <el-descriptions-item label="最高库存">{{ selectedTooling.maxQuantity }}</el-descriptions-item>
              <el-descriptions-item label="存储位置">{{ selectedTooling.location }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ getStatusLabel(selectedTooling.status) }}</el-descriptions-item>
              <el-descriptions-item label="最后盘点日期">{{ selectedTooling.lastCheckDate }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ selectedTooling.createTime }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        <div class="detail-section">
          <h4>描述信息</h4>
          <p>{{ selectedTooling.description || '无' }}</p>
        </div>
        <div class="detail-section">
          <h4>使用记录</h4>
          <el-table :data="selectedTooling.usageRecords" border style="width: 100%">
            <el-table-column prop="recordTime" label="时间" width="180"></el-table-column>
            <el-table-column prop="operationType" label="操作类型"></el-table-column>
            <el-table-column prop="quantity" label="数量"></el-table-column>
            <el-table-column prop="operator" label="操作人"></el-table-column>
            <el-table-column prop="remark" label="备注"></el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/编辑工装对话框 -->
    <el-dialog v-model="formVisible" :title="isEdit ? '编辑工装' : '新增工装'" width="600px">
      <el-form ref="toolingForm" :model="toolingForm" :rules="toolingRules" label-width="100px">
        <el-form-item label="工装编号" prop="toolingCode">
          <el-input v-model="toolingForm.toolingCode" placeholder="请输入工装编号"></el-input>
        </el-form-item>
        <el-form-item label="工装名称" prop="toolingName">
          <el-input v-model="toolingForm.toolingName" placeholder="请输入工装名称"></el-input>
        </el-form-item>
        <el-form-item label="工装类别" prop="category">
          <el-select v-model="toolingForm.category" placeholder="请选择工装类别">
            <el-option v-for="cat in categories" :key="cat.value" :label="cat.label" :value="cat.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号" prop="specification">
          <el-input v-model="toolingForm.specification" placeholder="请输入规格型号"></el-input>
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="toolingForm.unit" placeholder="请输入计量单位"></el-input>
        </el-form-item>
        <el-form-item label="当前库存" prop="currentQuantity">
          <el-input-number v-model="toolingForm.currentQuantity" :min="0" placeholder="请输入当前库存"></el-input-number>
        </el-form-item>
        <el-form-item label="最低库存" prop="minQuantity">
          <el-input-number v-model="toolingForm.minQuantity" :min="0" placeholder="请输入最低库存"></el-input-number>
        </el-form-item>
        <el-form-item label="最高库存" prop="maxQuantity">
          <el-input-number v-model="toolingForm.maxQuantity" :min="0" placeholder="请输入最高库存"></el-input-number>
        </el-form-item>
        <el-form-item label="存储位置" prop="location">
          <el-input v-model="toolingForm.location" placeholder="请输入存储位置"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="toolingForm.status" placeholder="请选择状态">
            <el-option v-for="stat in statusOptions" :key="stat.value" :label="stat.label" :value="stat.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-input v-model="toolingForm.supplier" placeholder="请输入供应商"></el-input>
        </el-form-item>
        <el-form-item label="采购单价" prop="unitPrice">
          <el-input-number v-model="toolingForm.unitPrice" :min="0" :step="0.01" placeholder="请输入采购单价"></el-input-number>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="toolingForm.description" placeholder="请输入描述信息" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Chart from 'chart.js/auto'

// 响应式数据
const viewMode = ref('table')
const searchForm = reactive({
  toolingCode: '',
  toolingName: '',
  category: '',
  status: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const detailVisible = ref(false)
const formVisible = ref(false)
const isEdit = ref(false)
const selectedTooling = ref(null)
const inventoryChart = ref(null)
let chartInstance = null

// 表单数据
const toolingForm = reactive({
  id: '',
  toolingCode: '',
  toolingName: '',
  category: '',
  specification: '',
  unit: '',
  currentQuantity: 0,
  minQuantity: 0,
  maxQuantity: 100,
  location: '',
  status: 'available',
  supplier: '',
  unitPrice: 0,
  description: '',
  createTime: '',
  lastCheckDate: ''
})

// 表单验证规则
const toolingRules = {
  toolingCode: [
    { required: true, message: '请输入工装编号', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  toolingName: [
    { required: true, message: '请输入工装名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择工装类别', trigger: 'change' }
  ],
  currentQuantity: [
    { required: true, message: '请输入当前库存', trigger: 'blur' }
  ],
  minQuantity: [
    { required: true, message: '请输入最低库存', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入存储位置', trigger: 'blur' }
  ]
}

// 常量数据
const categories = [
  { label: '刀具', value: 'tool' },
  { label: '夹具', value: 'fixture' },
  { label: '模具', value: 'mold' },
  { label: '检具', value: 'gauge' },
  { label: '其他', value: 'other' }
]

const statusOptions = [
  { label: '可用', value: 'available' },
  { label: '使用中', value: 'in_use' },
  { label: '维修中', value: 'repairing' },
  { label: '报废', value: 'scrapped' },
  { label: '低库存', value: 'low_stock' }
]

// 模拟数据
const toolingInventory = ref([
  {
    id: '1',
    toolingCode: 'TOOL-001',
    toolingName: 'CNC铣刀',
    category: 'tool',
    specification: 'D10',
    unit: '把',
    currentQuantity: 15,
    minQuantity: 10,
    maxQuantity: 50,
    location: '仓库A-1-05',
    status: 'available',
    supplier: '刀具供应商A',
    unitPrice: 250,
    description: '高速钢材质，适用于铝合金加工',
    createTime: '2023-01-15',
    lastCheckDate: '2023-11-20',
    usageRecords: [
      { recordTime: '2023-11-15 10:30', operationType: '领用', quantity: 2, operator: '张三', remark: '生产线A使用' },
      { recordTime: '2023-11-20 14:20', operationType: '归还', quantity: 2, operator: '张三', remark: '使用完毕归还' }
    ]
  },
  {
    id: '2',
    toolingCode: 'FIXT-001',
    toolingName: '通用夹具',
    category: 'fixture',
    specification: 'F-200',
    unit: '套',
    currentQuantity: 5,
    minQuantity: 3,
    maxQuantity: 20,
    location: '仓库B-2-12',
    status: 'available',
    supplier: '夹具供应商B',
    unitPrice: 1200,
    description: '适用于多种工件的通用夹具',
    createTime: '2023-02-10',
    lastCheckDate: '2023-11-20',
    usageRecords: []
  },
  {
    id: '3',
    toolingCode: 'MOLD-001',
    toolingName: '塑料模具',
    category: 'mold',
    specification: 'MD-1000',
    unit: '副',
    currentQuantity: 2,
    minQuantity: 1,
    maxQuantity: 5,
    location: '仓库C-3-08',
    status: 'in_use',
    supplier: '模具供应商C',
    unitPrice: 50000,
    description: '用于生产外壳的塑料模具',
    createTime: '2023-03-05',
    lastCheckDate: '2023-11-20',
    usageRecords: [
      { recordTime: '2023-11-18 09:00', operationType: '领用', quantity: 1, operator: '李四', remark: '生产订单PO-12345' }
    ]
  },
  {
    id: '4',
    toolingCode: 'GAUGE-001',
    toolingName: '游标卡尺',
    category: 'gauge',
    specification: '0-150mm',
    unit: '把',
    currentQuantity: 8,
    minQuantity: 5,
    maxQuantity: 20,
    location: '质量部-检测室',
    status: 'available',
    supplier: '计量器具供应商D',
    unitPrice: 150,
    description: '高精度游标卡尺',
    createTime: '2023-01-20',
    lastCheckDate: '2023-11-20',
    usageRecords: []
  },
  {
    id: '5',
    toolingCode: 'TOOL-002',
    toolingName: '钻头套装',
    category: 'tool',
    specification: 'D1-D10',
    unit: '套',
    currentQuantity: 3,
    minQuantity: 2,
    maxQuantity: 10,
    location: '仓库A-1-06',
    status: 'low_stock',
    supplier: '刀具供应商A',
    unitPrice: 350,
    description: '包含多种规格的钻头套装',
    createTime: '2023-04-10',
    lastCheckDate: '2023-11-20',
    usageRecords: []
  },
  {
    id: '6',
    toolingCode: 'FIXT-002',
    toolingName: '专用夹具',
    category: 'fixture',
    specification: 'SP-500',
    unit: '套',
    currentQuantity: 1,
    minQuantity: 1,
    maxQuantity: 5,
    location: '仓库B-2-13',
    status: 'available',
    supplier: '夹具供应商B',
    unitPrice: 2500,
    description: '产品X专用夹具',
    createTime: '2023-05-15',
    lastCheckDate: '2023-11-20',
    usageRecords: []
  },
  {
    id: '7',
    toolingCode: 'TOOL-003',
    toolingName: '丝锥套装',
    category: 'tool',
    specification: 'M3-M12',
    unit: '套',
    currentQuantity: 4,
    minQuantity: 2,
    maxQuantity: 10,
    location: '仓库A-1-07',
    status: 'available',
    supplier: '刀具供应商A',
    unitPrice: 450,
    description: '高速钢丝锥套装',
    createTime: '2023-06-20',
    lastCheckDate: '2023-11-20',
    usageRecords: []
  },
  {
    id: '8',
    toolingCode: 'MOLD-002',
    toolingName: '冲压模具',
    category: 'mold',
    specification: 'ST-2000',
    unit: '副',
    currentQuantity: 1,
    minQuantity: 1,
    maxQuantity: 3,
    location: '仓库C-3-09',
    status: 'repairing',
    supplier: '模具供应商C',
    unitPrice: 80000,
    description: '用于金属冲压的模具',
    createTime: '2023-07-10',
    lastCheckDate: '2023-11-20',
    usageRecords: [
      { recordTime: '2023-11-10 16:00', operationType: '维修', quantity: 1, operator: '王五', remark: '模具磨损维修' }
    ]
  }
])

// 计算属性
const filteredInventory = computed(() => {
  return toolingInventory.value.filter(item => {
    const matchCode = !searchForm.toolingCode || item.toolingCode.toLowerCase().includes(searchForm.toolingCode.toLowerCase())
    const matchName = !searchForm.toolingName || item.toolingName.toLowerCase().includes(searchForm.toolingName.toLowerCase())
    const matchCategory = !searchForm.category || item.category === searchForm.category
    const matchStatus = !searchForm.status || item.status === searchForm.status
    return matchCode && matchName && matchCategory && matchStatus
  })
})

const totalQuantity = computed(() => {
  return filteredInventory.value.reduce((sum, item) => sum + item.currentQuantity, 0)
})

const lowStockQuantity = computed(() => {
  return filteredInventory.value.filter(item => item.currentQuantity <= item.minQuantity).length
})

const availableQuantity = computed(() => {
  return filteredInventory.value.filter(item => item.status === 'available').length
})

const totalTypes = computed(() => {
  return filteredInventory.value.length
})

// 方法
const getCategoryLabel = (value) => {
  const category = categories.find(cat => cat.value === value)
  return category ? category.label : value
}

const getStatusLabel = (value) => {
  const status = statusOptions.find(stat => stat.value === value)
  return status ? status.label : value
}

const getStatusType = (value) => {
  const typeMap = {
    'available': 'success',
    'in_use': 'info',
    'repairing': 'warning',
    'scrapped': 'danger',
    'low_stock': 'warning'
  }
  return typeMap[value] || 'info'
}

const handleSearch = () => {
  pagination.currentPage = 1
  // 在实际应用中，这里应该调用API获取数据
  ElMessage.success('查询成功')
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.currentPage = 1
  // 在实际应用中，这里应该调用API获取数据
  ElMessage.success('重置成功')
}

const handleViewDetail = (tooling) => {
  selectedTooling.value = { ...tooling }
  detailVisible.value = true
}

const handleAddTooling = () => {
  isEdit.value = false
  // 重置表单
  Object.keys(toolingForm).forEach(key => {
    toolingForm[key] = key === 'currentQuantity' || key === 'minQuantity' || key === 'maxQuantity' || key === 'unitPrice' ? 0 : ''
  })
  toolingForm.status = 'available'
  toolingForm.maxQuantity = 100
  formVisible.value = true
}

const handleEditTooling = (tooling) => {
  isEdit.value = true
  Object.assign(toolingForm, tooling)
  formVisible.value = true
}

const handleDeleteTooling = (tooling) => {
  ElMessageBox.confirm(
    `确定要删除工装「${tooling.toolingName}」吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 在实际应用中，这里应该调用API删除数据
    const index = toolingInventory.value.findIndex(item => item.id === tooling.id)
    if (index > -1) {
      toolingInventory.value.splice(index, 1)
    }
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleSubmit = () => {
  // 在实际应用中，这里应该调用API保存数据
  if (isEdit.value) {
    const index = toolingInventory.value.findIndex(item => item.id === toolingForm.id)
    if (index > -1) {
      toolingInventory.value[index] = { ...toolingForm }
    }
    ElMessage.success('编辑成功')
  } else {
    const newTooling = { ...toolingForm, id: Date.now().toString(), createTime: new Date().toISOString().split('T')[0], usageRecords: [] }
    toolingInventory.value.unshift(newTooling)
    ElMessage.success('新增成功')
  }
  formVisible.value = false
}

const handleExport = () => {
  // 在实际应用中，这里应该调用API导出数据
  ElMessage.success('导出成功')
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  // 在实际应用中，这里应该调用API获取数据
}

const handleCurrentChange = (current) => {
  pagination.currentPage = current
  // 在实际应用中，这里应该调用API获取数据
}

const initChart = () => {
  if (chartInstance) {
    chartInstance.destroy()
  }
  
  const ctx = inventoryChart.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      datasets: [
        {
          label: '刀具库存',
          data: [35, 38, 30, 32, 35, 40, 38, 35, 32, 30, 28, 30],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: '夹具库存',
          data: [15, 18, 20, 22, 25, 22, 20, 18, 15, 15, 12, 10],
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.1
        },
        {
          label: '模具库存',
          data: [5, 5, 6, 6, 7, 7, 6, 5, 5, 5, 4, 4],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  })
}

// 生命周期
onMounted(() => {
  pagination.total = toolingInventory.value.length
  nextTick(() => {
    if (inventoryChart.value) {
      initChart()
    }
  })
})
</script>

<style scoped>
.tooling-inventory {
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

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.search-filter {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 16px;
  color: #606266;
}

.chart-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-section h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
}

.chart-container {
  height: 300px;
}

.inventory-list {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.card-view {
  margin-top: 20px;
}

.tooling-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tooling-code {
  font-weight: bold;
  color: #303133;
}

.card-body {
  flex: 1;
}

.card-body h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
}

.card-info p {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
}

.card-info p span {
  color: #909399;
  margin-right: 8px;
}

.warning-text {
  color: #e6a23c;
}

.card-footer {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.tooling-detail {
  padding: 10px;
}

.detail-section {
  margin-top: 20px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tooling-inventory {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .search-filter {
    padding: 15px;
  }
  
  .search-actions {
    flex-direction: column;
  }
  
  .stat-card {
    margin-bottom: 15px;
  }
  
  .chart-container {
    height: 200px;
  }
  
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 10px;
  }
  
  .pagination {
    justify-content: center;
  }
}
</style>