<template>
  <div class="tooling-management">
    <div class="header">
      <h1>工装管理</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAdd">新增工装</el-button>
        <el-button @click="handleBatchDelete" :disabled="selectedRows.length === 0">批量删除</el-button>
        <el-button @click="handleImport">导入工装</el-button>
        <el-button @click="handleExport">导出工装</el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="search-filter">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchForm.code" placeholder="工装编号" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-input v-model="searchForm.name" placeholder="工装名称" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.type" placeholder="工装类型" clearable>
            <el-option v-for="type in toolingTypes" :key="type.value" :label="type.label" :value="type.value"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.status" placeholder="状态" clearable>
            <el-option v-for="stat in statusOptions" :key="stat.value" :label="stat.label" :value="stat.value"></el-option>
          </el-select>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 15px;">
        <el-col :span="6">
          <el-input v-model="searchForm.currentLocation" placeholder="当前位置" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          ></el-date-picker>
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
            <div class="stat-number">{{ totalToolings }}</div>
            <div class="stat-label">工装总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-number">{{ inUseToolings }}</div>
            <div class="stat-label">使用中</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-number">{{ standbyToolings }}</div>
            <div class="stat-label">待命中</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-number">{{ maintenanceToolings }}</div>
            <div class="stat-label">保养中</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 工装类型分布图表 -->
    <div class="chart-section">
      <div class="chart-container">
        <h3>工装类型分布</h3>
        <canvas ref="toolingTypeChart"></canvas>
      </div>
    </div>

    <!-- 视图切换和列表 -->
    <div class="tooling-list-section">
      <div class="list-header">
        <h3>工装列表</h3>
        <div class="view-switch">
          <el-radio-group v-model="viewMode">
            <el-radio-button label="table">表格</el-radio-button>
            <el-radio-button label="card">卡片</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table
        v-if="viewMode === 'table'"
        :data="filteredToolingList"
        style="width: 100%"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="code" label="工装编号" width="120" sortable></el-table-column>
        <el-table-column prop="name" label="工装名称" sortable></el-table-column>
        <el-table-column prop="type" label="工装类型" width="100">
          <template #default="scope">
            {{ getTypeLabel(scope.row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="specification" label="规格型号"></el-table-column>
        <el-table-column prop="manufacturer" label="制造商"></el-table-column>
        <el-table-column prop="purchaseDate" label="采购日期" width="120"></el-table-column>
        <el-table-column prop="currentLocation" label="当前位置"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCheck" label="最后检查" width="120"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="card-view">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="12" :md="8" :lg="6" :xl="4" v-for="tooling in filteredToolingList" :key="tooling.id">
            <el-card class="tooling-card" shadow="hover">
              <div class="card-header">
                <div class="tooling-code">{{ tooling.code }}</div>
                <el-tag :type="getStatusType(tooling.status)">{{ getStatusText(tooling.status) }}</el-tag>
              </div>
              <div class="card-body">
                <h4>{{ tooling.name }}</h4>
                <div class="card-info">
                  <p><span>类型:</span> {{ getTypeLabel(tooling.type) }}</p>
                  <p><span>规格:</span> {{ tooling.specification }}</p>
                  <p><span>位置:</span> {{ tooling.currentLocation }}</p>
                  <p><span>制造商:</span> {{ tooling.manufacturer || '-' }}</p>
                  <p><span>采购日期:</span> {{ tooling.purchaseDate || '-' }}</p>
                  <p><span>最后检查:</span> {{ tooling.lastCheck || '-' }}</p>
                </div>
              </div>
              <div class="card-footer">
                <el-button size="small" @click="handleView(tooling)">查看</el-button>
                <el-button size="small" type="primary" @click="handleEdit(tooling)">编辑</el-button>
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
    <el-dialog v-model="detailVisible" title="工装详情" width="800px">
      <div v-if="selectedTooling" class="tooling-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions border :column="1">
              <el-descriptions-item label="工装编号">{{ selectedTooling.code }}</el-descriptions-item>
              <el-descriptions-item label="工装名称">{{ selectedTooling.name }}</el-descriptions-item>
              <el-descriptions-item label="工装类型">{{ getTypeLabel(selectedTooling.type) }}</el-descriptions-item>
              <el-descriptions-item label="规格型号">{{ selectedTooling.specification }}</el-descriptions-item>
              <el-descriptions-item label="制造商">{{ selectedTooling.manufacturer || '-' }}</el-descriptions-item>
              <el-descriptions-item label="采购日期">{{ selectedTooling.purchaseDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="预计寿命">{{ selectedTooling.expectedLife || '-' }} 次</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <el-descriptions border :column="1">
              <el-descriptions-item label="当前位置">{{ selectedTooling.currentLocation }}</el-descriptions-item>
              <el-descriptions-item label="状态">{{ getStatusText(selectedTooling.status) }}</el-descriptions-item>
              <el-descriptions-item label="使用次数">{{ selectedTooling.usageCount || 0 }} 次</el-descriptions-item>
              <el-descriptions-item label="负责人">{{ selectedTooling.responsiblePerson || '-' }}</el-descriptions-item>
              <el-descriptions-item label="最后检查">{{ selectedTooling.lastCheck || '-' }}</el-descriptions-item>
              <el-descriptions-item label="下次检查">{{ selectedTooling.nextCheck || '-' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ selectedTooling.createTime || '-' }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        <div class="detail-section">
          <h4>技术参数</h4>
          <pre>{{ selectedTooling.technicalParams || '无' }}</pre>
        </div>
        <div class="detail-section">
          <h4>备注</h4>
          <p>{{ selectedTooling.remark || '无' }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加/编辑工装对话框 -->
    <el-dialog v-model="formVisible" :title="isEdit ? '编辑工装' : '新增工装'" width="700px">
      <el-form ref="toolingForm" :model="toolingForm" :rules="toolingRules" label-width="100px">
        <el-form-item label="工装编号" prop="code">
          <el-input v-model="toolingForm.code" placeholder="请输入工装编号" :disabled="isEdit"></el-input>
        </el-form-item>
        <el-form-item label="工装名称" prop="name">
          <el-input v-model="toolingForm.name" placeholder="请输入工装名称"></el-input>
        </el-form-item>
        <el-form-item label="工装类型" prop="type">
          <el-select v-model="toolingForm.type" placeholder="请选择工装类型">
            <el-option v-for="type in toolingTypes" :key="type.value" :label="type.label" :value="type.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规格型号" prop="specification">
          <el-input v-model="toolingForm.specification" placeholder="请输入规格型号"></el-input>
        </el-form-item>
        <el-form-item label="制造商" prop="manufacturer">
          <el-input v-model="toolingForm.manufacturer" placeholder="请输入制造商"></el-input>
        </el-form-item>
        <el-form-item label="采购日期" prop="purchaseDate">
          <el-date-picker v-model="toolingForm.purchaseDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD"></el-date-picker>
        </el-form-item>
        <el-form-item label="当前位置" prop="currentLocation">
          <el-input v-model="toolingForm.currentLocation" placeholder="请输入当前位置"></el-input>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="toolingForm.status" placeholder="请选择状态">
            <el-option v-for="stat in statusOptions" :key="stat.value" :label="stat.label" :value="stat.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="预计寿命" prop="expectedLife">
          <el-input-number v-model="toolingForm.expectedLife" :min="0" placeholder="请输入预计使用次数"></el-input-number>
        </el-form-item>
        <el-form-item label="负责人" prop="responsiblePerson">
          <el-input v-model="toolingForm.responsiblePerson" placeholder="请输入负责人"></el-input>
        </el-form-item>
        <el-form-item label="技术参数" prop="technicalParams">
          <el-input type="textarea" v-model="toolingForm.technicalParams" placeholder="请输入技术参数" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input type="textarea" v-model="toolingForm.remark" placeholder="请输入备注信息" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="formVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmitForm">确定</el-button>
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
const toolingList = ref([])
const viewMode = ref('table')
const detailVisible = ref(false)
const formVisible = ref(false)
const isEdit = ref(false)
const selectedTooling = ref(null)
const selectedRows = ref([])
const toolingTypeChart = ref(null)
let chartInstance = null

const searchForm = reactive({
  code: '',
  name: '',
  type: '',
  status: '',
  currentLocation: ''
})

const dateRange = ref([])
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 表单数据
const toolingForm = reactive({
  id: '',
  code: '',
  name: '',
  type: '',
  specification: '',
  manufacturer: '',
  purchaseDate: '',
  currentLocation: '',
  status: 'standby',
  usageCount: 0,
  expectedLife: 0,
  responsiblePerson: '',
  lastCheck: '',
  nextCheck: '',
  technicalParams: '',
  remark: '',
  createTime: ''
})

// 表单验证规则
const toolingRules = {
  code: [
    { required: true, message: '请输入工装编号', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入工装名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择工装类型', trigger: 'change' }
  ],
  specification: [
    { required: true, message: '请输入规格型号', trigger: 'blur' }
  ],
  currentLocation: [
    { required: true, message: '请输入当前位置', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 常量数据
const toolingTypes = [
  { label: '刀具', value: 'tool' },
  { label: '夹具', value: 'fixture' },
  { label: '模具', value: 'mold' },
  { label: '量具', value: 'gauge' },
  { label: '辅具', value: 'auxiliary' },
  { label: '其他', value: 'other' }
]

const statusOptions = [
  { label: '使用中', value: 'in_use' },
  { label: '待机', value: 'standby' },
  { label: '保养中', value: 'maintenance' },
  { label: '故障', value: 'broken' },
  { label: '报废', value: 'scrapped' }
]

// 计算属性
const filteredToolingList = computed(() => {
  return toolingList.value.filter(tooling => {
    const matchCode = !searchForm.code || tooling.code.toLowerCase().includes(searchForm.code.toLowerCase())
    const matchName = !searchForm.name || tooling.name.toLowerCase().includes(searchForm.name.toLowerCase())
    const matchType = !searchForm.type || tooling.type === searchForm.type
    const matchStatus = !searchForm.status || tooling.status === searchForm.status
    const matchLocation = !searchForm.currentLocation || tooling.currentLocation.toLowerCase().includes(searchForm.currentLocation.toLowerCase())
    
    let dateMatch = true
    if (dateRange.value && dateRange.value.length === 2) {
      const recordDate = tooling.purchaseDate || tooling.lastCheck
      if (recordDate) {
        dateMatch = recordDate >= dateRange.value[0] && recordDate <= dateRange.value[1]
      } else {
        dateMatch = false
      }
    }
    
    return matchCode && matchName && matchType && matchStatus && matchLocation && dateMatch
  })
})

const totalToolings = computed(() => {
  return filteredToolingList.value.length
})

const inUseToolings = computed(() => {
  return filteredToolingList.value.filter(tooling => tooling.status === 'in_use').length
})

const standbyToolings = computed(() => {
  return filteredToolingList.value.filter(tooling => tooling.status === 'standby').length
})

const maintenanceToolings = computed(() => {
  return filteredToolingList.value.filter(tooling => tooling.status === 'maintenance').length
})

// 方法
const getTypeLabel = (value) => {
  const type = toolingTypes.find(t => t.value === value)
  return type ? type.label : value
}

const getStatusType = (status) => {
  const types = {
    in_use: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger',
    scrapped: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    in_use: '使用中',
    standby: '待机',
    maintenance: '保养中',
    broken: '故障',
    scrapped: '报废'
  }
  return texts[status] || '未知'
}

const loadToolingList = () => {
  // 模拟数据
  toolingList.value = [
    {
      id: 1,
      code: 'T001',
      name: 'CNC铣刀',
      type: 'tool',
      specification: 'D-20-4F',
      manufacturer: '刀具公司A',
      purchaseDate: '2023-01-15',
      currentLocation: '生产线1',
      status: 'in_use',
      usageCount: 1250,
      expectedLife: 5000,
      responsiblePerson: '张三',
      lastCheck: '2024-01-08',
      nextCheck: '2024-02-08',
      technicalParams: '直径: 20mm, 刃数: 4, 材质: 高速钢',
      remark: '高精度刀具，用于精密加工',
      createTime: '2023-01-15'
    },
    {
      id: 2,
      code: 'F001',
      name: '通用夹具',
      type: 'fixture',
      specification: 'J-A-001',
      manufacturer: '夹具公司B',
      purchaseDate: '2023-02-20',
      currentLocation: '工具室',
      status: 'standby',
      usageCount: 850,
      expectedLife: 10000,
      responsiblePerson: '李四',
      lastCheck: '2024-01-10',
      nextCheck: '2024-02-10',
      technicalParams: '最大夹持直径: 100mm, 最大承重: 50kg',
      remark: '标准通用夹具，适用于多种工件',
      createTime: '2023-02-20'
    },
    {
      id: 3,
      code: 'M001',
      name: '塑料模具',
      type: 'mold',
      specification: 'M-P-001',
      manufacturer: '模具公司C',
      purchaseDate: '2023-03-10',
      currentLocation: '生产线2',
      status: 'in_use',
      usageCount: 3200,
      expectedLife: 20000,
      responsiblePerson: '王五',
      lastCheck: '2024-01-05',
      nextCheck: '2024-02-05',
      technicalParams: '型腔数量: 4, 材质: P20, 重量: 250kg',
      remark: '用于生产塑料外壳',
      createTime: '2023-03-10'
    },
    {
      id: 4,
      code: 'G001',
      name: '游标卡尺',
      type: 'gauge',
      specification: '0-200mm',
      manufacturer: '量具公司D',
      purchaseDate: '2023-04-15',
      currentLocation: '质检室',
      status: 'in_use',
      usageCount: 5000,
      expectedLife: 50000,
      responsiblePerson: '赵六',
      lastCheck: '2024-01-15',
      nextCheck: '2024-04-15',
      technicalParams: '测量范围: 0-200mm, 精度: 0.02mm',
      remark: '标准量具，定期校准',
      createTime: '2023-04-15'
    },
    {
      id: 5,
      code: 'T002',
      name: '钻头套装',
      type: 'tool',
      specification: 'D-5-13mm',
      manufacturer: '刀具公司A',
      purchaseDate: '2023-05-05',
      currentLocation: '工具室',
      status: 'standby',
      usageCount: 300,
      expectedLife: 3000,
      responsiblePerson: '张三',
      lastCheck: '2024-01-08',
      nextCheck: '2024-02-08',
      technicalParams: '套装包含5-13mm钻头各规格',
      remark: '通用钻头套装',
      createTime: '2023-05-05'
    },
    {
      id: 6,
      code: 'M002',
      name: '冲压模具',
      type: 'mold',
      specification: 'M-S-001',
      manufacturer: '模具公司C',
      purchaseDate: '2023-06-20',
      currentLocation: '维修室',
      status: 'maintenance',
      usageCount: 15000,
      expectedLife: 50000,
      responsiblePerson: '王五',
      lastCheck: '2024-01-20',
      nextCheck: '2024-02-20',
      technicalParams: '冲压力: 500kN, 材质: Cr12MoV',
      remark: '正在维修中，预计3天内完成',
      createTime: '2023-06-20'
    },
    {
      id: 7,
      code: 'F002',
      name: '专用夹具',
      type: 'fixture',
      specification: 'J-S-001',
      manufacturer: '夹具公司B',
      purchaseDate: '2023-07-10',
      currentLocation: '生产线3',
      status: 'in_use',
      usageCount: 2100,
      expectedLife: 15000,
      responsiblePerson: '李四',
      lastCheck: '2024-01-12',
      nextCheck: '2024-02-12',
      technicalParams: '专用夹具，适配产品型号XYZ-123',
      remark: '用于新产品XYZ-123的生产',
      createTime: '2023-07-10'
    },
    {
      id: 8,
      code: 'G002',
      name: '千分尺',
      type: 'gauge',
      specification: '0-25mm',
      manufacturer: '量具公司D',
      purchaseDate: '2023-08-05',
      currentLocation: '质检室',
      status: 'in_use',
      usageCount: 3500,
      expectedLife: 50000,
      responsiblePerson: '赵六',
      lastCheck: '2024-01-15',
      nextCheck: '2024-04-15',
      technicalParams: '测量范围: 0-25mm, 精度: 0.001mm',
      remark: '高精度测量工具',
      createTime: '2023-08-05'
    },
    {
      id: 9,
      code: 'T003',
      name: '丝锥',
      type: 'tool',
      specification: 'M10×1.5',
      manufacturer: '刀具公司A',
      purchaseDate: '2023-09-15',
      currentLocation: '工具室',
      status: 'standby',
      usageCount: 500,
      expectedLife: 2000,
      responsiblePerson: '张三',
      lastCheck: '2024-01-08',
      nextCheck: '2024-02-08',
      technicalParams: '螺纹规格: M10×1.5, 材质: 高速钢',
      remark: '标准丝锥',
      createTime: '2023-09-15'
    },
    {
      id: 10,
      code: 'A001',
      name: '辅助工装',
      type: 'auxiliary',
      specification: 'A-001',
      manufacturer: '辅具公司E',
      purchaseDate: '2023-10-20',
      currentLocation: '工具室',
      status: 'broken',
      usageCount: 1200,
      expectedLife: 8000,
      responsiblePerson: '钱七',
      lastCheck: '2024-01-02',
      nextCheck: '2024-02-02',
      technicalParams: '辅助定位工装',
      remark: '需要维修，暂时不可用',
      createTime: '2023-10-20'
    }
  ]
  
  pagination.total = toolingList.value.length
  initChart()
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
  dateRange.value = []
  pagination.currentPage = 1
  // 在实际应用中，这里应该调用API获取数据
  ElMessage.success('重置成功')
}

const handleView = (tooling) => {
  selectedTooling.value = { ...tooling }
  detailVisible.value = true
}

const handleAdd = () => {
  isEdit.value = false
  // 重置表单
  Object.keys(toolingForm).forEach(key => {
    toolingForm[key] = key === 'usageCount' || key === 'expectedLife' ? 0 : ''
  })
  toolingForm.status = 'standby'
  formVisible.value = true
}

const handleEdit = (tooling) => {
  isEdit.value = true
  Object.assign(toolingForm, { ...tooling })
  formVisible.value = true
}

const handleSubmitForm = () => {
  // 在实际应用中，这里应该调用API保存数据
  if (isEdit.value) {
    const index = toolingList.value.findIndex(item => item.id === toolingForm.id)
    if (index > -1) {
      toolingList.value[index] = { ...toolingForm }
    }
  } else {
    const newTooling = { 
      ...toolingForm, 
      id: Date.now(), 
      createTime: new Date().toISOString().split('T')[0],
      usageCount: 0
    }
    toolingList.value.unshift(newTooling)
    pagination.total = toolingList.value.length
  }
  ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
  formVisible.value = false
  initChart()
}

const handleDelete = (tooling) => {
  ElMessageBox.confirm(
    `确定要删除工装「${tooling.name}」吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 在实际应用中，这里应该调用API删除数据
    const index = toolingList.value.findIndex(item => item.id === tooling.id)
    if (index > -1) {
      toolingList.value.splice(index, 1)
      pagination.total = toolingList.value.length
    }
    ElMessage.success('删除成功')
    initChart()
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleBatchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的工装')
    return
  }
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedRows.value.length} 个工装吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 在实际应用中，这里应该调用API批量删除数据
    const idsToDelete = selectedRows.value.map(row => row.id)
    toolingList.value = toolingList.value.filter(tooling => !idsToDelete.includes(tooling.id))
    pagination.total = toolingList.value.length
    selectedRows.value = []
    ElMessage.success('批量删除成功')
    initChart()
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleImport = () => {
  // 在实际应用中，这里应该实现导入功能
  ElMessage.success('导入功能待实现')
}

const handleExport = () => {
  // 在实际应用中，这里应该实现导出功能
  ElMessage.success('导出功能待实现')
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  // 在实际应用中，这里应该调用API获取数据
}

const handleCurrentChange = (current) => {
  pagination.currentPage = current
  // 在实际应用中，这里应该调用API获取数据
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

const initChart = () => {
  // 销毁现有图表实例
  if (chartInstance) chartInstance.destroy()
  
  if (!toolingTypeChart.value) return
  
  // 统计各类型工装数量
  const typeStats = {} as Record<string, number>
  toolingTypes.forEach(type => {
    typeStats[type.value] = 0
  })
  
  filteredToolingList.value.forEach(tooling => {
    if (typeStats.hasOwnProperty(tooling.type)) {
      typeStats[tooling.type]++
    }
  })
  
  const ctx = toolingTypeChart.value.getContext('2d')
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: toolingTypes.map(type => type.label),
      datasets: [{
        data: toolingTypes.map(type => typeStats[type.value]),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ''
              const value = context.raw as number
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0
              return `${label}: ${value} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// 生命周期
onMounted(() => {
  loadToolingList()
})
</script>

<style scoped>
.tooling-management {
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

.header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.actions {
  display: flex;
  gap: 10px;
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

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
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
  margin-bottom: 20px;
}

.chart-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  height: 400px;
}

.chart-container h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #303133;
  text-align: center;
}

.tooling-list-section {
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

.detail-section pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tooling-management {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .actions {
    flex-wrap: wrap;
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
    height: 300px;
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