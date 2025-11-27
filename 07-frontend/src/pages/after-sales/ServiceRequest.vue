<template>
  <div class="service-request">
    <div class="page-header">
      <div class="header-left">
        <h1>服务请求</h1>
        <p>客户服务请求管理与跟踪</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreateRequest">
          <el-icon><Plus /></el-icon>
          新建请求
        </el-button>
        <el-button @click="handleExportRequests">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon blue">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalRequests }}</div>
              <div class="stat-label">总请求数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orange">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingRequests }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon green">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.processingRequests }}</div>
              <div class="stat-label">处理中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon purple">
              <el-icon><Finished /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.completedRequests }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索客户姓名、电话、产品型号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="filterForm.priority" placeholder="选择优先级" clearable style="width: 120px">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务类型">
          <el-select v-model="filterForm.serviceType" placeholder="选择服务类型" clearable style="width: 150px">
            <el-option label="维修服务" value="repair" />
            <el-option label="安装调试" value="installation" />
            <el-option label="技术咨询" value="consultation" />
            <el-option label="产品培训" value="training" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 请求列表 -->
    <div class="table-section">
      <el-table
        :data="filteredRequests"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="requestNo" label="请求编号" width="140" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewRequest(row)">
              {{ row.requestNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户姓名" width="100" />
        <el-table-column prop="customerPhone" label="联系电话" width="130" />
        <el-table-column prop="productModel" label="产品型号" width="150" show-overflow-tooltip />
        <el-table-column prop="serviceType" label="服务类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getServiceTypeTagType(row.serviceType)">
              {{ getServiceTypeLabel(row.serviceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="problemDesc" label="问题描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedTo" label="负责人" width="100" />
        <el-table-column prop="requestTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewRequest(row)">查看</el-button>
            <el-button link type="primary" @click="handleEditRequest(row)">编辑</el-button>
            <el-button link type="success" @click="handleProcessRequest(row)" v-if="row.status !== 'completed'">处理</el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="timeline">处理进度</el-dropdown-item>
                  <el-dropdown-item command="feedback">客户反馈</el-dropdown-item>
                  <el-dropdown-item command="document">相关文档</el-dropdown-item>
                  <el-dropdown-item command="print">打印</el-dropdown-item>
                  <el-dropdown-item command="close" v-if="row.status !== 'closed'">关闭</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="filterForm.page"
          v-model:page-size="filterForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filterForm.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新建/编辑请求对话框 -->
    <el-dialog
      v-model="requestDialog.visible"
      :title="requestDialog.title"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="requestFormRef"
        :model="requestForm"
        :rules="requestRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="请求编号" prop="requestNo">
              <el-input v-model="requestForm.requestNo" placeholder="SR-YYYYMMDD-001" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="requestForm.priority" placeholder="选择优先级" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="requestForm.customerName" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="customerPhone">
              <el-input v-model="requestForm.customerPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="服务类型" prop="serviceType">
              <el-select v-model="requestForm.serviceType" placeholder="选择服务类型" style="width: 100%">
                <el-option label="维修服务" value="repair" />
                <el-option label="安装调试" value="installation" />
                <el-option label="技术咨询" value="consultation" />
                <el-option label="产品培训" value="training" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品型号" prop="productModel">
              <el-input v-model="requestForm.productModel" placeholder="请输入产品型号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="问题描述" prop="problemDesc">
          <el-input
            v-model="requestForm.problemDesc"
            type="textarea"
            :rows="4"
            placeholder="请详细描述客户遇到的问题"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="requestForm.assignedTo" placeholder="分配负责人" style="width: 100%">
                <el-option label="张三" value="张三" />
                <el-option label="李四" value="李四" />
                <el-option label="王五" value="王五" />
                <el-option label="赵六" value="赵六" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="期望完成时间">
              <el-date-picker
                v-model="requestForm.expectedTime"
                type="datetime"
                placeholder="选择期望完成时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="附件">
          <el-upload
            v-model:file-list="requestForm.attachments"
            :action="uploadUrl"
            multiple
            :limit="5"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemoveFile"
          >
            <el-button>上传附件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持jpg/png/pdf格式，单个文件不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="requestDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveRequest">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 处理进度对话框 -->
    <el-dialog
      v-model="timelineDialog.visible"
      title="处理进度"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in timelineData"
          :key="index"
          :timestamp="activity.timestamp"
          :color="activity.color"
        >
          <h4>{{ activity.title }}</h4>
          <p>{{ activity.content }}</p>
          <small>操作人：{{ activity.operator }}</small>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  Download,
  Document,
  Clock,
  CircleCheck,
  Finished,
  Search,
  ArrowDown
} from '@element-plus/icons-vue'

// 响应式数据
const filterForm = reactive({
  keyword: '',
  status: '',
  priority: '',
  serviceType: '',
  dateRange: [],
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive({
  totalRequests: 256,
  pendingRequests: 45,
  processingRequests: 68,
  completedRequests: 143
})

const requests = ref([
  {
    id: 1,
    requestNo: 'SR-20231127-001',
    customerName: '张先生',
    customerPhone: '13800138001',
    productModel: 'EA888-3.0T',
    serviceType: 'repair',
    problemDesc: '发动机异响，怠速时有明显的金属撞击声',
    priority: 'high',
    status: 'processing',
    assignedTo: '张三',
    requestTime: '2023-11-27 09:15:00',
    expectedTime: '2023-11-30 18:00:00'
  },
  {
    id: 2,
    requestNo: 'SR-20231127-002',
    customerName: '李女士',
    customerPhone: '13900139002',
    productModel: 'DQ380-7DSG',
    serviceType: 'consultation',
    problemDesc: '变速箱换挡顿挫问题咨询，希望了解解决方案',
    priority: 'medium',
    status: 'pending',
    assignedTo: '李四',
    requestTime: '2023-11-27 10:30:00',
    expectedTime: '2023-11-28 12:00:00'
  },
  {
    id: 3,
    requestNo: 'SR-20231126-003',
    customerName: '王工',
    customerPhone: '13700137003',
    productModel: 'MQB-EVO',
    serviceType: 'installation',
    problemDesc: '需要技术支持进行新设备安装调试',
    priority: 'high',
    status: 'completed',
    assignedTo: '王五',
    requestTime: '2023-11-26 14:20:00',
    expectedTime: '2023-11-27 16:00:00'
  }
])

const requestDialog = reactive({
  visible: false,
  title: '新建服务请求',
  mode: 'create' // create | edit
})

const requestForm = reactive({
  id: null,
  requestNo: '',
  customerName: '',
  customerPhone: '',
  serviceType: '',
  productModel: '',
  problemDesc: '',
  priority: '',
  assignedTo: '',
  expectedTime: '',
  attachments: []
})

const requestRules = {
  customerName: [
    { required: true, message: '请输入客户姓名', trigger: 'blur' }
  ],
  customerPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  serviceType: [
    { required: true, message: '请选择服务类型', trigger: 'change' }
  ],
  productModel: [
    { required: true, message: '请输入产品型号', trigger: 'blur' }
  ],
  problemDesc: [
    { required: true, message: '请输入问题描述', trigger: 'blur' },
    { min: 10, message: '问题描述至少10个字符', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

const timelineDialog = reactive({
  visible: false
})

const timelineData = ref([
  {
    timestamp: '2023-11-27 09:15:00',
    title: '创建服务请求',
    content: '客户提交了发动机异响问题的维修请求',
    operator: '系统',
    color: '#409EFF'
  },
  {
    timestamp: '2023-11-27 09:30:00',
    title: '分配负责人',
    content: '请求已分配给技术工程师张三处理',
    operator: '管理员',
    color: '#67C23A'
  },
  {
    timestamp: '2023-11-27 10:00:00',
    title: '开始处理',
    content: '技术工程师已联系客户，了解详细情况',
    operator: '张三',
    color: '#E6A23C'
  }
])

const uploadUrl = '/api/upload'

// 表单引用
const requestFormRef = ref<FormInstance>()

// 计算属性
const filteredRequests = computed(() => {
  let filtered = requests.value

  if (filterForm.keyword) {
    filtered = filtered.filter(item => 
      item.customerName.toLowerCase().includes(filterForm.keyword.toLowerCase()) ||
      item.customerPhone.includes(filterForm.keyword) ||
      item.productModel.toLowerCase().includes(filterForm.keyword.toLowerCase())
    )
  }

  if (filterForm.status) {
    filtered = filtered.filter(item => item.status === filterForm.status)
  }

  if (filterForm.priority) {
    filtered = filtered.filter(item => item.priority === filterForm.priority)
  }

  if (filterForm.serviceType) {
    filtered = filtered.filter(item => item.serviceType === filterForm.serviceType)
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.dateRange
    filtered = filtered.filter(item => {
      const requestDate = new Date(item.requestTime)
      return requestDate >= startDate && requestDate <= endDate
    })
  }

  return filtered
})

// 方法
const getServiceTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    repair: '维修服务',
    installation: '安装调试',
    consultation: '技术咨询',
    training: '产品培训'
  }
  return typeMap[type] || type
}

const getServiceTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    repair: 'danger',
    installation: 'success',
    consultation: 'primary',
    training: 'warning'
  }
  return typeMap[type] || 'info'
}

const getPriorityLabel = (priority: string) => {
  const priorityMap: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return priorityMap[priority] || priority
}

const getPriorityTagType = (priority: string) => {
  const priorityMap: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return priorityMap[priority] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    closed: '已关闭'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    closed: 'info'
  }
  return statusMap[status] || 'info'
}

const handleSearch = () => {
  filterForm.page = 1
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  Object.assign(filterForm, {
    keyword: '',
    status: '',
    priority: '',
    serviceType: '',
    dateRange: [],
    page: 1,
    pageSize: 20,
    total: 0
  })
  ElMessage.success('重置成功')
}

const handleSelectionChange = (selection: any[]) => {
  console.log('选择的请求：', selection)
}

const handleCreateRequest = () => {
  requestDialog.title = '新建服务请求'
  requestDialog.mode = 'create'
  requestDialog.visible = true
  resetRequestForm()
  
  // 生成请求编号
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  requestForm.requestNo = `SR-${date}-${random}`
}

const handleEditRequest = (row: any) => {
  requestDialog.title = '编辑服务请求'
  requestDialog.mode = 'edit'
  requestDialog.visible = true
  Object.assign(requestForm, row)
}

const handleViewRequest = (row: any) => {
  ElMessage.info(`查看请求：${row.requestNo}`)
}

const handleProcessRequest = (row: any) => {
  ElMessage.info(`处理请求：${row.requestNo}`)
}

const handleSaveRequest = async () => {
  if (!requestFormRef.value) return

  await requestFormRef.value.validate((valid) => {
    if (valid) {
      // 这里添加保存逻辑
      ElMessage.success('服务请求保存成功')
      requestDialog.visible = false
      resetRequestForm()
    }
  })
}

const handleCommand = (command: string, row: any) => {
  switch (command) {
    case 'timeline':
      Object.assign(timelineData.value, getTimelineData(row.requestNo))
      timelineDialog.visible = true
      break
    case 'feedback':
      ElMessage.info(`查看${row.requestNo}的客户反馈`)
      break
    case 'document':
      ElMessage.info(`查看${row.requestNo}的相关文档`)
      break
    case 'print':
      ElMessage.info(`打印请求单：${row.requestNo}`)
      break
    case 'close':
      handleCloseRequest(row)
      break
    case 'delete':
      handleDeleteRequest(row)
      break
  }
}

const handleCloseRequest = (row: any) => {
  ElMessageBox.confirm(
    `确定要关闭服务请求"${row.requestNo}"吗？`,
    '关闭确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里添加关闭逻辑
    ElMessage.success('请求已关闭')
  })
}

const handleDeleteRequest = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除服务请求"${row.requestNo}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里添加删除逻辑
    ElMessage.success('删除成功')
  })
}

const handleExportRequests = () => {
  ElMessage.info('导出服务请求数据')
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success('上传成功')
}

const handleRemoveFile = (file: any) => {
  ElMessage.info('移除文件')
}

const resetRequestForm = () => {
  Object.assign(requestForm, {
    id: null,
    requestNo: '',
    customerName: '',
    customerPhone: '',
    serviceType: '',
    productModel: '',
    problemDesc: '',
    priority: '',
    assignedTo: '',
    expectedTime: '',
    attachments: []
  })
}

const getTimelineData = (requestNo: string) => {
  // 这里应该根据requestNo获取对应的进度数据
  return [
    {
      timestamp: '2023-11-27 09:15:00',
      title: '创建服务请求',
      content: '客户提交了服务请求',
      operator: '系统',
      color: '#409EFF'
    }
  ]
}

const handleSizeChange = (val: number) => {
  filterForm.pageSize = val
  // 这里添加分页逻辑
}

const handleCurrentChange = (val: number) => {
  filterForm.page = val
  // 这里添加分页逻辑
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.service-request {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.header-left p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: white;
}

.stat-icon.blue { background: #409EFF; }
.stat-icon.green { background: #67C23A; }
.stat-icon.orange { background: #E6A23C; }
.stat-icon.purple { background: #909399; }

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.table-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>