cat > fixture/FixtureInventory.vue <<'EOF'
<template>
  <div class="fixture-inventory-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>夹具库存管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddInventory">
          <el-icon><Plus /></el-icon>
          新增库存
        </el-button>
        <el-button @click="handleImportInventory">
          <el-icon><Upload /></el-icon>
          导入库存
        </el-button>
        <el-button @click="handleExportInventory">
          <el-icon><Download /></el-icon>
          导出库存
        </el-button>
        <el-button @click="handleStocktaking">
          <el-icon><DataAnalysis /></el-icon>
          库存盘点
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 库存统计概览 -->
    <div class="inventory-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ statistics.totalCount }}</div>
              <div class="card-label">夹具总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ statistics.inStockCount }}</div>
              <div class="card-label">在库数量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ statistics.inUseCount }}</div>
              <div class="card-label">使用中数量</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card warning">
            <div class="card-content">
              <div class="card-value">{{ statistics.lowStockCount }}</div>
              <div class="card-label">低库存数量</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="夹具编号">
          <el-input v-model="searchForm.fixtureCode" placeholder="请输入夹具编号" clearable />
        </el-form-item>
        <el-form-item label="夹具名称">
          <el-input v-model="searchForm.fixtureName" placeholder="请输入夹具名称" clearable />
        </el-form-item>
        <el-form-item label="夹具类型">
          <el-select v-model="searchForm.fixtureType" placeholder="请选择夹具类型" clearable>
            <el-option label="CNC夹具" value="cnc" />
            <el-option label="检测夹具" value="test" />
            <el-option label="焊接夹具" value="weld" />
            <el-option label="装配夹具" value="assembly" />
          </el-select>
        </el-form-item>
        <el-form-item label="存储位置">
          <el-input v-model="searchForm.location" placeholder="请输入存储位置" clearable />
        </el-form-item>
        <el-form-item label="库存状态">
          <el-select v-model="searchForm.status" placeholder="请选择库存状态" clearable>
            <el-option label="在库" value="in_stock" />
            <el-option label="使用中" value="in_use" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="data-table-card">
      <el-table
        v-loading="loading"
        :data="inventoryList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="fixtureCode" label="夹具编号" min-width="120" />
        <el-table-column prop="fixtureName" label="夹具名称" min-width="180" />
        <el-table-column prop="fixtureType" label="夹具类型" min-width="120">
          <template #default="scope">
            {{ getFixtureTypeText(scope.row.fixtureType) }}
          </template>
        </el-table-column>
        <el-table-column prop="specification" label="规格型号" min-width="150" />
        <el-table-column prop="totalQuantity" label="总数量" min-width="100" />
        <el-table-column prop="availableQuantity" label="可用数量" min-width="100" />
        <el-table-column prop="inUseQuantity" label="使用中" min-width="100" />
        <el-table-column prop="location" label="存储位置" min-width="120" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              effect="light"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="最低库存" min-width="100">
          <template #default="scope">
            <span :class="{ 'low-stock': scope.row.availableQuantity <= scope.row.minStock }">
              {{ scope.row.minStock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="lastStocktakingDate" label="最近盘点日期" min-width="140" />
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleViewInventory(scope.row)"
            >
              详情
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handleUpdateInventory(scope.row)"
            >
              更新库存
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleStocktakingSingle(scope.row)"
            >
              盘点
            </el-button>
            <el-button
              v-if="scope.row.status !== 'scrapped'"
              type="danger"
              size="small"
              @click="handleScrap(scope.row)"
            >
              报废
            </el-button>
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

    <!-- 库存详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="库存详情"
      size="50%"
      direction="rtl"
    >
      <div v-if="selectedInventory" class="inventory-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="夹具编号">{{ selectedInventory.fixtureCode }}</el-descriptions-item>
          <el-descriptions-item label="夹具名称">{{ selectedInventory.fixtureName }}</el-descriptions-item>
          <el-descriptions-item label="夹具类型">{{ getFixtureTypeText(selectedInventory.fixtureType) }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ selectedInventory.specification }}</el-descriptions-item>
          <el-descriptions-item label="总数量">{{ selectedInventory.totalQuantity }}</el-descriptions-item>
          <el-descriptions-item label="可用数量">{{ selectedInventory.availableQuantity }}</el-descriptions-item>
          <el-descriptions-item label="使用中数量">{{ selectedInventory.inUseQuantity }}</el-descriptions-item>
          <el-descriptions-item label="维修中数量">{{ selectedInventory.maintenanceQuantity }}</el-descriptions-item>
          <el-descriptions-item label="存储位置">{{ selectedInventory.location }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(selectedInventory.status) }}</el-descriptions-item>
          <el-descriptions-item label="最低库存">{{ selectedInventory.minStock }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ selectedInventory.unit }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ selectedInventory.supplier || '-' }}</el-descriptions-item>
          <el-descriptions-item label="采购价格">{{ selectedInventory.purchasePrice || '-' }}{{ selectedInventory.currency || '元' }}</el-descriptions-item>
          <el-descriptions-item label="最近盘点日期">{{ selectedInventory.lastStocktakingDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最近盘点人">{{ selectedInventory.lastStocktakingPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedInventory.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 库存变动记录 -->
        <div class="inventory-history" style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px;">库存变动记录</h3>
          <el-timeline>
            <el-timeline-item
              v-for="record in inventoryHistory"
              :key="record.id"
              :timestamp="record.recordTime"
              :type="getRecordType(record.actionType)"
            >
              <div>
                <div class="record-title">{{ getActionText(record.actionType) }}</div>
                <div class="record-content">
                  变动数量：{{ record.changeQuantity }}，操作人员：{{ record.operator }}
                </div>
                <div class="record-note">{{ record.note || '-' }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-drawer>

    <!-- 更新库存对话框 -->
    <el-dialog
      v-model="updateDialogVisible"
      title="更新库存"
      width="600px"
      @close="handleUpdateDialogClose"
    >
      <el-form
        ref="updateFormRef"
        :model="updateForm"
        :rules="updateFormRules"
        label-width="120px"
      >
        <el-form-item label="夹具编号">
          <el-input v-model="updateForm.fixtureCode" disabled />
        </el-form-item>
        <el-form-item label="夹具名称">
          <el-input v-model="updateForm.fixtureName" disabled />
        </el-form-item>
        <el-form-item label="当前可用数量">
          <el-input v-model="updateForm.currentAvailableQuantity" disabled />
        </el-form-item>
        <el-form-item label="变动类型" prop="changeType">
          <el-radio-group v-model="updateForm.changeType">
            <el-radio label="in">入库</el-radio>
            <el-radio label="out">出库</el-radio>
            <el-radio label="adjust">调整</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="变动数量" prop="changeQuantity">
          <el-input v-model.number="updateForm.changeQuantity" type="number" min="1" placeholder="请输入变动数量" />
        </el-form-item>
        <el-form-item label="变动原因" prop="reason">
          <el-input v-model="updateForm.reason" type="textarea" placeholder="请输入变动原因" rows="2" />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="updateForm.operator" placeholder="请输入操作人" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="updateForm.remark" type="textarea" placeholder="请输入备注" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleUpdateDialogClose">取消</el-button>
          <el-button type="primary" @click="handleConfirmUpdate">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 盘点对话框 -->
    <el-dialog
      v-model="stocktakingDialogVisible"
      title="库存盘点"
      width="600px"
      @close="handleStocktakingDialogClose"
    >
      <el-form
        ref="stocktakingFormRef"
        :model="stocktakingForm"
        :rules="stocktakingFormRules"
        label-width="120px"
      >
        <el-form-item label="夹具编号">
          <el-input v-model="stocktakingForm.fixtureCode" disabled />
        </el-form-item>
        <el-form-item label="夹具名称">
          <el-input v-model="stocktakingForm.fixtureName" disabled />
        </el-form-item>
        <el-form-item label="账面数量">
          <el-input v-model="stocktakingForm.bookQuantity" disabled />
        </el-form-item>
        <el-form-item label="实际数量" prop="actualQuantity">
          <el-input v-model.number="stocktakingForm.actualQuantity" type="number" min="0" placeholder="请输入实际盘点数量" />
        </el-form-item>
        <el-form-item label="盘点差异" prop="difference" v-if="stocktakingForm.actualQuantity !== null">
          <el-input v-model.number="stocktakingForm.difference" disabled :class="{ 'difference-negative': stocktakingForm.difference < 0 }" />
        </el-form-item>
        <el-form-item label="盘点人" prop="stocktakingPerson">
          <el-input v-model="stocktakingForm.stocktakingPerson" placeholder="请输入盘点人" />
        </el-form-item>
        <el-form-item label="盘点日期" prop="stocktakingDate">
          <el-date-picker
            v-model="stocktakingForm.stocktakingDate"
            type="date"
            placeholder="选择盘点日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="盘点说明" prop="description">
          <el-input v-model="stocktakingForm.description" type="textarea" placeholder="请输入盘点说明" rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleStocktakingDialogClose">取消</el-button>
          <el-button type="primary" @click="handleConfirmStocktaking">确认盘点</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, DataAnalysis, Refresh } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const inventoryList = ref([])
const searchForm = reactive({
  fixtureCode: '',
  fixtureName: '',
  fixtureType: '',
  location: '',
  status: ''
})
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const drawerVisible = ref(false)
const updateDialogVisible = ref(false)
const stocktakingDialogVisible = ref(false)
const selectedInventory = ref(null)
const updateFormRef = ref(null)
const stocktakingFormRef = ref(null)
const updateForm = reactive({
  fixtureCode: '',
  fixtureName: '',
  currentAvailableQuantity: 0,
  changeType: 'in',
  changeQuantity: 0,
  reason: '',
  operator: '',
  remark: ''
})
const stocktakingForm = reactive({
  fixtureCode: '',
  fixtureName: '',
  bookQuantity: 0,
  actualQuantity: null,
  difference: 0,
  stocktakingPerson: '',
  stocktakingDate: new Date(),
  description: ''
})
const inventoryHistory = ref([])
const statistics = reactive({
  totalCount: 0,
  inStockCount: 0,
  inUseCount: 0,
  lowStockCount: 0
})

// 表单验证规则
const updateFormRules = {
  changeType: [
    { required: true, message: '请选择变动类型', trigger: 'change' }
  ],
  changeQuantity: [
    { required: true, message: '请输入变动数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '变动数量必须大于0', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入变动原因', trigger: 'blur' }
  ],
  operator: [
    { required: true, message: '请输入操作人', trigger: 'blur' }
  ]
}

const stocktakingFormRules = {
  actualQuantity: [
    { required: true, message: '请输入实际数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '实际数量不能小于0', trigger: 'blur' }
  ],
  stocktakingPerson: [
    { required: true, message: '请输入盘点人', trigger: 'blur' }
  ],
  stocktakingDate: [
    { required: true, message: '请选择盘点日期', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入盘点说明', trigger: 'blur' }
  ]
}

// 监听实际数量变化，计算差异
watch(() => stocktakingForm.actualQuantity, (newValue) => {
  if (newValue !== null && stocktakingForm.bookQuantity !== null) {
    stocktakingForm.difference = newValue - stocktakingForm.bookQuantity
  }
})

// 获取夹具类型文本
const getFixtureTypeText = (type) => {
  const typeMap = {
    'cnc': 'CNC夹具',
    'test': '检测夹具',
    'weld': '焊接夹具',
    'assembly': '装配夹具'
  }
  return typeMap[type] || type
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    'in_stock': 'success',
    'in_use': 'info',
    'maintenance': 'warning',
    'scrapped': 'danger'
  }
  return statusMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'in_stock': '在库',
    'in_use': '使用中',
    'maintenance': '维护中',
    'scrapped': '报废'
  }
  return statusMap[status] || status
}

// 获取记录类型
const getRecordType = (actionType) => {
  const typeMap = {
    'in': 'success',
    'out': 'warning',
    'adjust': 'info',
    'stocktaking': 'primary'
  }
  return typeMap[actionType] || 'primary'
}

// 获取操作文本
const getActionText = (actionType) => {
  const actionMap = {
    'in': '入库',
    'out': '出库',
    'adjust': '调整',
    'stocktaking': '盘点'
  }
  return actionMap[actionType] || actionType
}

// 加载库存列表
const loadInventoryList = async () => {
  loading.value = true
  try {
    // 模拟API请求
    // const response = await fixtureInventoryService.getInventoryList({
    //   ...searchForm,
    //   page: pagination.currentPage,
    //   pageSize: pagination.pageSize
    // })
    // 模拟数据
    inventoryList.value = generateMockData()
    pagination.total = 50
    calculateStatistics()
  } catch (error) {
    ElMessage.error('获取库存列表失败')
    console.error('获取库存列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 生成模拟数据
const generateMockData = () => {
  const data = []
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  for (let i = 0; i < pagination.pageSize; i++) {
    const index = startIndex + i
    const statuses = ['in_stock', 'in_use', 'maintenance', 'scrapped']
    const fixtureTypes = ['cnc', 'test', 'weld', 'assembly']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const totalQuantity = Math.floor(Math.random() * 50) + 1
    const inUseQuantity = Math.floor(Math.random() * Math.min(totalQuantity, 20))
    const maintenanceQuantity = Math.floor(Math.random() * Math.min(totalQuantity - inUseQuantity, 10))
    const availableQuantity = totalQuantity - inUseQuantity - maintenanceQuantity
    const minStock = Math.floor(Math.random() * 10) + 1
    
    data.push({
      id: index + 1,
      fixtureCode: `FIX-${String(index + 1).padStart(4, '0')}`,
      fixtureName: `库存夹具${index + 1}`,
      fixtureType: fixtureTypes[Math.floor(Math.random() * fixtureTypes.length)],
      specification: `SPEC-${index + 1}`,
      totalQuantity: totalQuantity,
      availableQuantity: availableQuantity,
      inUseQuantity: inUseQuantity,
      maintenanceQuantity: maintenanceQuantity,
      location: `仓库${Math.floor(index / 5) + 1}`,
      status: status,
      minStock: minStock,
      unit: '个',
      supplier: `供应商${index % 3 + 1}`,
      purchasePrice: (Math.random() * 1000).toFixed(2),
      currency: '元',
      lastStocktakingDate: new Date(Date.now() - Math.random() * 10000000000).toLocaleDateString(),
      lastStocktakingPerson: `盘点员${index % 5 + 1}`,
      remark: `备注信息${index + 1}`
    })
  }
  return data
}

// 计算统计数据
const calculateStatistics = () => {
  statistics.totalCount = inventoryList.value.reduce((sum, item) => sum + item.totalQuantity, 0)
  statistics.inStockCount = inventoryList.value.reduce((sum, item) => sum + item.availableQuantity, 0)
  statistics.inUseCount = inventoryList.value.reduce((sum, item) => sum + item.inUseQuantity, 0)
  statistics.lowStockCount = inventoryList.value.filter(item => item.availableQuantity <= item.minStock).length
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadInventoryList()
}

// 重置搜索条件
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.currentPage = 1
  loadInventoryList()
}

// 刷新
const handleRefresh = () => {
  loadInventoryList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadInventoryList()
}

// 当前页改变
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  loadInventoryList()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  // 处理选中的行
}

// 查看库存详情
const handleViewInventory = (row) => {
  selectedInventory.value = { ...row }
  loadInventoryHistory(row.id)
  drawerVisible.value = true
}

// 新增库存
const handleAddInventory = () => {
  ElMessage.info('新增库存功能待实现')
  // 实际项目中可以打开新增库存的对话框
}

// 导入库存
const handleImportInventory = async () => {
  try {
    // 这里可以实现文件上传逻辑
    ElMessage.success('导入库存成功')
    loadInventoryList()
  } catch (error) {
    ElMessage.error('导入库存失败')
    console.error('导入库存失败:', error)
  }
}

// 导出库存
const handleExportInventory = async () => {
  try {
    // 这里可以实现文件导出逻辑
    ElMessage.success('导出库存成功')
  } catch (error) {
    ElMessage.error('导出库存失败')
    console.error('导出库存失败:', error)
  }
}

// 库存盘点（批量）
const handleStocktaking = () => {
  ElMessageBox.confirm(
    '确定要开始库存盘点吗？',
    '库存盘点',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      ElMessage.success('库存盘点成功')
      loadInventoryList()
    } catch (error) {
      ElMessage.error('库存盘点失败')
      console.error('库存盘点失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 单个库存盘点
const handleStocktakingSingle = (row) => {
  Object.assign(stocktakingForm, {
    fixtureCode: row.fixtureCode,
    fixtureName: row.fixtureName,
    bookQuantity: row.availableQuantity,
    actualQuantity: null,
    difference: 0,
    stocktakingPerson: '',
    stocktakingDate: new Date(),
    description: ''
  })
  stocktakingDialogVisible.value = true
}

// 更新库存
const handleUpdateInventory = (row) => {
  Object.assign(updateForm, {
    fixtureCode: row.fixtureCode,
    fixtureName: row.fixtureName,
    currentAvailableQuantity: row.availableQuantity,
    changeType: 'in',
    changeQuantity: 0,
    reason: '',
    operator: '',
    remark: ''
  })
  updateDialogVisible.value = true
}

// 报废
const handleScrap = (row) => {
  ElMessageBox.confirm(
    `确定要将「${row.fixtureName}」标记为报废吗？`,
    '报废确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      ElMessage.success('报废成功')
      loadInventoryList()
    } catch (error) {
      ElMessage.error('报废失败')
      console.error('报废失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 确认更新库存
const handleConfirmUpdate = async () => {
  const valid = await updateFormRef.value.validate()
  if (!valid) return

  // 检查出库数量是否超过可用数量
  if (updateForm.changeType === 'out' && updateForm.changeQuantity > updateForm.currentAvailableQuantity) {
    ElMessage.warning('出库数量不能超过可用数量')
    return
  }

  try {
    // 模拟API请求
    ElMessage.success('库存更新成功')
    updateDialogVisible.value = false
    loadInventoryList()
  } catch (error) {
    ElMessage.error('库存更新失败')
    console.error('库存更新失败:', error)
  }
}

// 确认盘点
const handleConfirmStocktaking = async () => {
  const valid = await stocktakingFormRef.value.validate()
  if (!valid) return

  try {
    // 模拟API请求
    ElMessage.success('盘点成功')
    stocktakingDialogVisible.value = false
    loadInventoryList()
  } catch (error) {
    ElMessage.error('盘点失败')
    console.error('盘点失败:', error)
  }
}

// 加载库存变动历史
const loadInventoryHistory = async (inventoryId) => {
  try {
    // 模拟API请求
    // const response = await fixtureInventoryService.getInventoryHistory(inventoryId)
    // inventoryHistory.value = response.data
    
    // 模拟数据
    inventoryHistory.value = [
      {
        id: 1,
        actionType: 'in',
        changeQuantity: 10,
        operator: '仓库管理员1',
        note: '采购入库',
        recordTime: new Date(Date.now() - 10000000000).toLocaleString()
      },
      {
        id: 2,
        actionType: 'out',
        changeQuantity: 5,
        operator: '生产线管理员',
        note: '生产领用',
        recordTime: new Date(Date.now() - 8000000000).toLocaleString()
      },
      {
        id: 3,
        actionType: 'in',
        changeQuantity: 5,
        operator: '仓库管理员1',
        note: '退货入库',
        recordTime: new Date(Date.now() - 5000000000).toLocaleString()
      },
      {
        id: 4,
        actionType: 'stocktaking',
        changeQuantity: 0,
        operator: '盘点员1',
        note: '月度盘点',
        recordTime: new Date(Date.now() - 2000000000).toLocaleString()
      }
    ]
  } catch (error) {
    console.error('获取库存历史失败:', error)
  }
}

// 关闭更新对话框
const handleUpdateDialogClose = () => {
  updateDialogVisible.value = false
  resetUpdateForm()
}

// 关闭盘点对话框
const handleStocktakingDialogClose = () => {
  stocktakingDialogVisible.value = false
  resetStocktakingForm()
}

// 重置更新表单
const resetUpdateForm = () => {
  Object.keys(updateForm).forEach(key => {
    if (key === 'changeType') {
      updateForm[key] = 'in'
    } else if (typeof updateForm[key] === 'number') {
      updateForm[key] = 0
    } else {
      updateForm[key] = ''
    }
  })
}

// 重置盘点表单
const resetStocktakingForm = () => {
  Object.keys(stocktakingForm).forEach(key => {
    if (key === 'stocktakingDate') {
      stocktakingForm[key] = new Date()
    } else if (typeof stocktakingForm[key] === 'number') {
      stocktakingForm[key] = 0
    } else {
      stocktakingForm[key] = ''
    }
  })
  stocktakingForm.actualQuantity = null
}

// 组件挂载时加载数据
onMounted(() => {
  loadInventoryList()
})
</script>

<style scoped>
.fixture-inventory-container {
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

.inventory-overview {
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

.overview-card.warning {
  border-left: 4px solid #e6a23c;
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

.low-stock {
  color: #f56c6c;
  font-weight: bold;
}

.inventory-details {
  padding: 20px 0;
}

.inventory-history {
  margin-top: 30px;
}

.record-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.record-content {
  color: #606266;
  margin-bottom: 5px;
}

.record-note {
  color: #909399;
  font-size: 12px;
}

.difference-negative {
  color: #f56c6c;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .fixture-inventory-container {
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