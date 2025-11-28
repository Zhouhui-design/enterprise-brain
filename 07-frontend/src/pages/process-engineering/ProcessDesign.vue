<template>
  <div class="process-design">
    <div class="page-header">
      <h1>工艺设计</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateDesign">
          <el-icon><Plus /></el-icon>
          新建工艺
        </el-button>
        <el-button type="success" @click="handleImportDesign">
          <el-icon><Upload /></el-icon>
          导入工艺
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 工艺统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in processStats" :key="index">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <component :is="stat.icon" />
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工艺搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="工艺编号">
          <el-input v-model="searchForm.processCode" placeholder="请输入工艺编号" clearable />
        </el-form-item>
        <el-form-item label="工艺名称">
          <el-input v-model="searchForm.processName" placeholder="请输入工艺名称" clearable />
        </el-form-item>
        <el-form-item label="产品类型">
          <el-select v-model="searchForm.productType" placeholder="请选择产品类型" clearable>
            <el-option label="机械零件" value="mechanical" />
            <el-option label="电子元件" value="electronic" />
            <el-option label="塑料件" value="plastic" />
            <el-option label="金属件" value="metal" />
          </el-select>
        </el-form-item>
        <el-form-item label="工艺状态">
          <el-select v-model="searchForm.status" placeholder="请选择工艺状态" clearable>
            <el-option label="设计中" value="designing" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已批准" value="approved" />
            <el-option label="生产中" value="in_production" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="设计人">
          <el-input v-model="searchForm.designer" placeholder="请输入设计人" clearable />
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 工艺列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <span>工艺列表</span>
          <el-tag v-if="selectedProcesses.length > 0" type="info">
            已选择 {{ selectedProcesses.length }} 项
          </el-tag>
        </div>
        <div class="table-actions" v-if="selectedProcesses.length > 0">
          <el-button type="success" size="small" @click="handleBatchApprove">
            批量批准
          </el-button>
          <el-button type="danger" size="small" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </div>

      <el-table
        :data="processList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="processCode" label="工艺编号" width="120" />
        <el-table-column prop="processName" label="工艺名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="productType" label="产品类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getProductTypeColor(row.productType)">
              {{ getProductTypeText(row.productType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="工艺状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="designer" label="设计人" width="100" />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="cycleTime" label="周期时间" width="100">
          <template #default="{ row }">
            {{ row.cycleTime }} 秒
          </template>
        </el-table-column>
        <el-table-column prop="efficiency" label="良品率" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.efficiency" :color="getEfficiencyColor(row.efficiency)" />
          </template>
        </el-table-column>
        <el-table-column prop="createDate" label="创建时间" width="110" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" size="small" @click="handleFlowChart(row)">流程图</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="info" size="small" @click="handleCopy(row)">复制</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑工艺对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1000px"
      @close="handleDialogClose"
    >
      <el-form
        ref="processFormRef"
        :model="processForm"
        :rules="processRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工艺编号" prop="processCode">
              <el-input v-model="processForm.processCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工艺名称" prop="processName">
              <el-input v-model="processForm.processName" placeholder="请输入工艺名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品类型" prop="productType">
              <el-select v-model="processForm.productType" placeholder="请选择产品类型">
                <el-option label="机械零件" value="mechanical" />
                <el-option label="电子元件" value="electronic" />
                <el-option label="塑料件" value="plastic" />
                <el-option label="金属件" value="metal" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工艺状态" prop="status">
              <el-select v-model="processForm.status" placeholder="请选择工艺状态">
                <el-option label="设计中" value="designing" />
                <el-option label="审核中" value="reviewing" />
                <el-option label="已批准" value="approved" />
                <el-option label="生产中" value="in_production" />
                <el-option label="已归档" value="archived" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="工艺描述">
          <el-input
            v-model="processForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工艺描述"
          />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="周期时间" prop="cycleTime">
              <el-input-number
                v-model="processForm.cycleTime"
                :min="0"
                :precision="2"
                placeholder="请输入周期时间"
                style="width: 100%"
              >
                <template #append>秒</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预期良品率" prop="efficiency">
              <el-input-number
                v-model="processForm.efficiency"
                :min="0"
                :max="100"
                placeholder="请输入预期良品率"
                style="width: 100%"
              >
                <template #append>%</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="设计人" prop="designer">
              <el-select v-model="processForm.designer" placeholder="请选择设计人" filterable>
                <el-option
                  v-for="user in designerList"
                  :key="user.id"
                  :label="user.name"
                  :value="user.name"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="工艺步骤">
          <div class="process-steps">
            <el-button type="primary" size="small" @click="handleAddStep">
              <el-icon><Plus /></el-icon>
              添加步骤
            </el-button>
            <el-table :data="processForm.steps" size="small" style="margin-top: 10px;">
              <el-table-column type="index" label="序号" width="80" />
              <el-table-column prop="stepName" label="步骤名称" width="200">
                <template #default="{ row, $index }">
                  <el-input v-model="row.stepName" placeholder="请输入步骤名称" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="description" label="步骤描述" min-width="200">
                <template #default="{ row, $index }">
                  <el-input v-model="row.description" placeholder="请输入步骤描述" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="duration" label="预计时间" width="120">
                <template #default="{ row, $index }">
                  <el-input-number v-model="row.duration" :min="0" size="small" style="width: 100%">
                    <template #append>秒</template>
                  </el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100">
                <template #default="{ row, $index }">
                  <el-button type="danger" size="small" @click="handleDeleteStep($index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
        <el-form-item label="所需工装">
          <el-select
            v-model="processForm.requiredTooling"
            multiple
            placeholder="请选择所需工装"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="tooling in toolingList"
              :key="tooling.id"
              :label="tooling.name"
              :value="tooling.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="相关文档">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 doc, docx, pdf, dwg 等格式，单个文件不超过 50MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 工艺详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="工艺详情" size="60%">
      <div v-if="currentProcess" class="process-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工艺编号">{{ currentProcess.processCode }}</el-descriptions-item>
          <el-descriptions-item label="工艺名称">{{ currentProcess.processName }}</el-descriptions-item>
          <el-descriptions-item label="产品类型">
            <el-tag :type="getProductTypeColor(currentProcess.productType)">
              {{ getProductTypeText(currentProcess.productType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工艺状态">
            <el-tag :type="getStatusType(currentProcess.status)">
              {{ getStatusText(currentProcess.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设计人">{{ currentProcess.designer }}</el-descriptions-item>
          <el-descriptions-item label="版本">v{{ currentProcess.version }}</el-descriptions-item>
          <el-descriptions-item label="周期时间">{{ currentProcess.cycleTime }} 秒</el-descriptions-item>
          <el-descriptions-item label="预期良品率">
            <el-progress :percentage="currentProcess.efficiency" :color="getEfficiencyColor(currentProcess.efficiency)" />
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentProcess.createDate }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentProcess.updateDate }}</el-descriptions-item>
          <el-descriptions-item label="工艺描述" span="2">{{ currentProcess.description }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="工艺步骤" name="steps">
              <div class="steps-content">
                <el-timeline>
                  <el-timeline-item
                    v-for="(step, index) in currentProcess.steps"
                    :key="index"
                    :timestamp="`预计时间: ${step.duration}秒`"
                  >
                    <el-card>
                      <h4>步骤 {{ index + 1 }}: {{ step.stepName }}</h4>
                      <p>{{ step.description }}</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>
            <el-tab-pane label="工艺流程图" name="flowchart">
              <ProcessFlowChart :process-id="currentProcess.id" />
            </el-tab-pane>
            <el-tab-pane label="工装清单" name="tooling">
              <div class="tooling-list">
                <el-table :data="currentProcess.requiredToolingList" stripe>
                  <el-table-column prop="name" label="工装名称" />
                  <el-table-column prop="type" label="工装类型" />
                  <el-table-column prop="specification" label="规格型号" />
                  <el-table-column prop="quantity" label="数量" />
                  <el-table-column prop="status" label="状态">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 'available' ? 'success' : 'danger'">
                        {{ row.status === 'available' ? '可用' : '不可用' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
            <el-tab-pane label="相关文档" name="documents">
              <div class="documents-content">
                <el-table :data="currentProcess.documents" stripe>
                  <el-table-column prop="name" label="文档名称" />
                  <el-table-column prop="type" label="文档类型" />
                  <el-table-column prop="size" label="文件大小" />
                  <el-table-column prop="uploadTime" label="上传时间" />
                  <el-table-column label="操作" width="150">
                    <template #default="{ row }">
                      <el-button type="text" size="small" @click="handleDownloadDocument(row)">
                        下载
                      </el-button>
                      <el-button type="text" size="small" @click="handlePreviewDocument(row)">
                        预览
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload, UploadFilled } from '@element-plus/icons-vue'
import ProcessFlowChart from './components/ProcessFlowChart.vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const drawerVisible = ref(false)
const dialogTitle = ref('新建设计工艺')
const currentProcess = ref(null)
const selectedProcesses = ref([])
const activeTab = ref('steps')
const processFormRef = ref()
const fileList = ref([])

// 工艺统计数据
const processStats = ref([
  {
    label: '总工艺数',
    value: '156',
    icon: Timer,
    color: '#409EFF'
  },
  {
    label: '设计中',
    value: '23',
    icon: Edit,
    color: '#E6A23C'
  },
  {
    label: '生产中',
    value: '89',
    icon: Check,
    color: '#67C23A'
  },
  {
    label: '平均良品率',
    value: '94.5%',
    icon: DataLine,
    color: '#909399'
  }
])

// 搜索表单
const searchForm = reactive({
  processCode: '',
  processName: '',
  productType: '',
  status: '',
  designer: '',
  dateRange: []
})

// 工艺表单
const processForm = reactive({
  processCode: '',
  processName: '',
  productType: '',
  description: '',
  status: 'designing',
  designer: '',
  cycleTime: 0,
  efficiency: 95,
  steps: [],
  requiredTooling: []
})

// 表单验证规则
const processRules = {
  processName: [
    { required: true, message: '请输入工艺名称', trigger: 'blur' }
  ],
  productType: [
    { required: true, message: '请选择产品类型', trigger: 'change' }
  ],
  designer: [
    { required: true, message: '请选择设计人', trigger: 'change' }
  ],
  cycleTime: [
    { required: true, message: '请输入周期时间', trigger: 'blur' }
  ],
  efficiency: [
    { required: true, message: '请输入预期良品率', trigger: 'blur' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 工艺列表数据
const processList = ref([
  {
    id: 1,
    processCode: 'P001',
    processName: '机械臂装配工艺',
    productType: 'mechanical',
    status: 'in_production',
    designer: '张工',
    version: '2.1',
    cycleTime: 120,
    efficiency: 96,
    createDate: '2024-01-15',
    updateDate: '2024-03-15',
    description: '工业机器人机械臂的装配工艺流程，包括零部件检查、组装、调试等步骤',
    steps: [
      {
        stepName: '零部件检查',
        description: '检查所有零部件的规格和数量',
        duration: 15
      },
      {
        stepName: '机械组装',
        description: '按照装配图进行机械部件组装',
        duration: 60
      },
      {
        stepName: '电气连接',
        description: '连接电机、传感器等电气元件',
        duration: 30
      },
      {
        stepName: '功能调试',
        description: '测试机械臂的各项功能指标',
        duration: 15
      }
    ],
    requiredToolingList: [
      {
        id: 1,
        name: '装配夹具A',
        type: '夹具',
        specification: 'JH-001',
        quantity: 1,
        status: 'available'
      },
      {
        id: 2,
        name: '扭矩扳手',
        type: '工具',
        specification: '10-100Nm',
        quantity: 2,
        status: 'available'
      }
    ],
    documents: [
      {
        name: '装配工艺说明书.pdf',
        type: 'PDF',
        size: '2.5MB',
        uploadTime: '2024-01-15'
      },
      {
        name: '装配图纸.dwg',
        type: 'DWG',
        size: '5.8MB',
        uploadTime: '2024-01-15'
      }
    ]
  },
  {
    id: 2,
    processCode: 'P002',
    processName: 'PCB焊接工艺',
    productType: 'electronic',
    status: 'approved',
    designer: '李工',
    version: '1.5',
    cycleTime: 45,
    efficiency: 92,
    createDate: '2024-02-01',
    updateDate: '2024-03-10',
    description: '印刷电路板的回流焊接工艺，包括锡膏印刷、贴片、回流焊接等步骤'
  },
  {
    id: 3,
    processCode: 'P003',
    processName: '塑料注塑工艺',
    productType: 'plastic',
    status: 'designing',
    designer: '王工',
    version: '1.0',
    cycleTime: 30,
    efficiency: 98,
    createDate: '2024-03-01',
    updateDate: '2024-03-20',
    description: '塑料零件的注塑成型工艺，适用于ABS、PP等材料'
  }
])

// 设计人列表
const designerList = ref([
  { id: 1, name: '张工' },
  { id: 2, name: '李工' },
  { id: 3, name: '王工' },
  { id: 4, name: '赵工' },
  { id: 5, name: '刘工' }
])

// 工装列表
const toolingList = ref([
  { id: 1, name: '装配夹具A', type: '夹具' },
  { id: 2, name: '检测夹具B', type: '夹具' },
  { id: 3, name: '扭矩扳手', type: '工具' },
  { id: 4, name: '压力机', type: '设备' },
  { id: 5, name: '回流焊炉', type: '设备' }
])

// 类型映射函数
const getProductTypeColor = (type) => {
  const colorMap = {
    mechanical: 'primary',
    electronic: 'success',
    plastic: 'warning',
    metal: 'info'
  }
  return colorMap[type] || 'info'
}

const getProductTypeText = (type) => {
  const textMap = {
    mechanical: '机械零件',
    electronic: '电子元件',
    plastic: '塑料件',
    metal: '金属件'
  }
  return textMap[type] || type
}

const getStatusType = (status) => {
  const typeMap = {
    designing: 'warning',
    reviewing: 'primary',
    approved: 'success',
    in_production: 'primary',
    archived: 'info'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    designing: '设计中',
    reviewing: '审核中',
    approved: '已批准',
    in_production: '生产中',
    archived: '已归档'
  }
  return textMap[status] || status
}

const getEfficiencyColor = (efficiency) => {
  if (efficiency >= 95) return '#67C23A'
  if (efficiency >= 90) return '#E6A23C'
  return '#F56C6C'
}

// 事件处理函数
const handleCreateDesign = () => {
  dialogTitle.value = '新建设计工艺'
  processForm.processCode = 'P' + String(Date.now()).slice(-3)
  processForm.steps = []
  dialogVisible.value = true
}

const handleImportDesign = () => {
  ElMessage.info('导入工艺功能开发中...')
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('刷新成功')
  }, 1000)
}

const handleSearch = () => {
  console.log('搜索条件:', searchForm)
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    if (key === 'dateRange') {
      searchForm[key] = []
    } else {
      searchForm[key] = ''
    }
  })
  ElMessage.success('重置成功')
}

const handleSelectionChange = (selection) => {
  selectedProcesses.value = selection
}

const handleView = (row) => {
  currentProcess.value = row
  drawerVisible.value = true
}

const handleFlowChart = (row) => {
  currentProcess.value = row
  activeTab.value = 'flowchart'
  drawerVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑工艺'
  Object.keys(processForm).forEach(key => {
    processForm[key] = row[key] || []
  })
  dialogVisible.value = true
}

const handleCopy = (row) => {
  dialogTitle.value = '复制工艺'
  Object.keys(processForm).forEach(key => {
    processForm[key] = row[key] || []
  })
  processForm.processCode = 'P' + String(Date.now()).slice(-3)
  processForm.processName = row.processName + ' (副本)'
  dialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定删除工艺"${row.processName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleBatchApprove = () => {
  ElMessageBox.confirm(`确定批准选中的 ${selectedProcesses.value.length} 个工艺吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量批准成功')
    selectedProcesses.value = []
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedProcesses.value.length} 个工艺吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量删除成功')
    selectedProcesses.value = []
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleAddStep = () => {
  processForm.steps.push({
    stepName: '',
    description: '',
    duration: 0
  })
}

const handleDeleteStep = (index) => {
  processForm.steps.splice(index, 1)
}

const handleSubmit = () => {
  processFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('保存成功')
      // 重置表单
      Object.keys(processForm).forEach(key => {
        if (Array.isArray(processForm[key])) {
          processForm[key] = []
        } else {
          processForm[key] = ''
        }
      })
      processForm.efficiency = 95
      processForm.status = 'designing'
    }
  })
}

const handleDialogClose = () => {
  processFormRef.value?.resetFields()
  // 重置表单
  Object.keys(processForm).forEach(key => {
    if (Array.isArray(processForm[key])) {
      processForm[key] = []
    } else {
      processForm[key] = ''
    }
  })
  processForm.efficiency = 95
  processForm.status = 'designing'
  fileList.value = []
}

const handleFileChange = (file, fileList) => {
  console.log('文件变化:', file, fileList)
}

const handleDownloadDocument = (document) => {
  ElMessage.success(`开始下载: ${document.name}`)
}

const handlePreviewDocument = (document) => {
  ElMessage.success(`开始预览: ${document.name}`)
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

onMounted(() => {
  pagination.total = processList.value.length
})
</script>

<style scoped>
.process-design {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #1d2129;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 15px;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #1d2129;
  line-height: 1;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #86909c;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: bold;
  color: #1d2129;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.process-steps {
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
}

.process-detail {
  padding: 20px;
}

.detail-tabs {
  margin-top: 30px;
}

.steps-content {
  padding: 20px 0;
}

.tooling-list,
.documents-content {
  padding: 20px 0;
}

.upload-demo {
  width: 100%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .stats-container .el-col {
    margin-bottom: 15px;
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>