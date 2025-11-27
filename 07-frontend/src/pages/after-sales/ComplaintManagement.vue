<template>
  <div class="complaint-management">
    <div class="page-header">
      <div class="header-left">
        <h1>投诉管理</h1>
        <p>客户投诉处理与跟踪管理</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreateComplaint">
          <el-icon><Plus /></el-icon>
          新建投诉
        </el-button>
        <el-button @click="handleExportData">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon red">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalComplaints }}</div>
              <div class="stat-label">总投诉数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orange">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingComplaints }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon blue">
              <el-icon><Refresh /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.processingComplaints }}</div>
              <div class="stat-label">处理中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon green">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.resolvedComplaints }}</div>
              <div class="stat-label">已解决</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 投诉趋势图表 -->
    <div class="chart-section">
      <el-card title="投诉趋势分析">
        <div class="chart-controls">
          <el-radio-group v-model="chartTimeRange" @change="updateChart">
            <el-radio-button label="7">最近7天</el-radio-button>
            <el-radio-button label="30">最近30天</el-radio-button>
            <el-radio-button label="90">最近90天</el-radio-button>
          </el-radio-group>
        </div>
        <div ref="complaintChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索投诉编号、客户姓名、产品"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="投诉类型">
          <el-select v-model="filterForm.complaintType" placeholder="选择类型" clearable style="width: 150px">
            <el-option label="产品质量" value="quality" />
            <el-option label="服务态度" value="service" />
            <el-option label="售后服务" value="after-sales" />
            <el-option label="价格争议" value="price" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="filterForm.severity" placeholder="选择程度" clearable style="width: 120px">
            <el-option label="严重" value="critical" />
            <el-option label="重要" value="major" />
            <el-option label="一般" value="minor" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="投诉时间">
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

    <!-- 投诉列表 -->
    <div class="table-section">
      <el-table
        :data="filteredComplaints"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="complaintNo" label="投诉编号" width="140" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewComplaint(row)">
              {{ row.complaintNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="投诉人" width="100" />
        <el-table-column prop="customerPhone" label="联系电话" width="130" />
        <el-table-column prop="complaintType" label="投诉类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getComplaintTypeTagType(row.complaintType)">
              {{ getComplaintTypeLabel(row.complaintType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productInfo" label="涉及产品" width="150" show-overflow-tooltip />
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="getSeverityTagType(row.severity)" size="small">
              {{ getSeverityLabel(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="complaintContent" label="投诉内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="assignedTo" label="处理人" width="100" />
        <el-table-column prop="complaintTime" label="投诉时间" width="160" />
        <el-table-column prop="responseDeadline" label="响应时限" width="120" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewComplaint(row)">查看</el-button>
            <el-button link type="primary" @click="handleEditComplaint(row)">编辑</el-button>
            <el-button link type="success" @click="handleProcessComplaint(row)" v-if="row.status !== 'resolved'">处理</el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="timeline">处理进度</el-dropdown-item>
                  <el-dropdown-item command="escalate" v-if="row.status === 'processing'">升级</el-dropdown-item>
                  <el-dropdown-item command="compensate">补偿方案</el-dropdown-item>
                  <el-dropdown-item command="report">生成报告</el-dropdown-item>
                  <el-dropdown-item command="close" v-if="row.status === 'resolved'">关闭</el-dropdown-item>
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

    <!-- 新建/编辑投诉对话框 -->
    <el-dialog
      v-model="complaintDialog.visible"
      :title="complaintDialog.title"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="complaintFormRef"
        :model="complaintForm"
        :rules="complaintRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="投诉编号" prop="complaintNo">
              <el-input v-model="complaintForm.complaintNo" placeholder="CM-YYYYMMDD-001" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="投诉类型" prop="complaintType">
              <el-select v-model="complaintForm.complaintType" placeholder="选择类型" style="width: 100%">
                <el-option label="产品质量" value="quality" />
                <el-option label="服务态度" value="service" />
                <el-option label="售后服务" value="after-sales" />
                <el-option label="价格争议" value="price" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="投诉人" prop="customerName">
              <el-input v-model="complaintForm.customerName" placeholder="请输入投诉人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="customerPhone">
              <el-input v-model="complaintForm.customerPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="严重程度" prop="severity">
              <el-select v-model="complaintForm.severity" placeholder="选择严重程度" style="width: 100%">
                <el-option label="严重" value="critical" />
                <el-option label="重要" value="major" />
                <el-option label="一般" value="minor" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="涉及产品" prop="productInfo">
              <el-input v-model="complaintForm.productInfo" placeholder="请输入涉及的产品信息" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="投诉内容" prop="complaintContent">
          <el-input
            v-model="complaintForm.complaintContent"
            type="textarea"
            :rows="4"
            placeholder="请详细描述投诉内容"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="处理人">
              <el-select v-model="complaintForm.assignedTo" placeholder="分配处理人" style="width: 100%">
                <el-option label="张三" value="张三" />
                <el-option label="李四" value="李四" />
                <el-option label="王五" value="王五" />
                <el-option label="赵六" value="赵六" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="响应时限">
              <el-date-picker
                v-model="complaintForm.responseDeadline"
                type="datetime"
                placeholder="选择响应时限"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="证据附件">
          <el-upload
            v-model:file-list="complaintForm.attachments"
            :action="uploadUrl"
            multiple
            :limit="10"
            :on-success="handleUploadSuccess"
            :on-remove="handleRemoveFile"
          >
            <el-button>上传证据</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持jpg/png/pdf/mp4格式，单个文件不超过20MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="complaintDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveComplaint">保存</el-button>
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
  Warning,
  Clock,
  Refresh,
  CircleCheck,
  Search,
  ArrowDown
} from '@element-plus/icons-vue'

// 响应式数据
const filterForm = reactive({
  keyword: '',
  complaintType: '',
  severity: '',
  status: '',
  dateRange: [],
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive({
  totalComplaints: 186,
  pendingComplaints: 32,
  processingComplaints: 78,
  resolvedComplaints: 76
})

const chartTimeRange = ref('7')

const complaints = ref([
  {
    id: 1,
    complaintNo: 'CM-20231127-001',
    customerName: '刘先生',
    customerPhone: '13800138001',
    complaintType: 'quality',
    productInfo: 'EA888发动机总成',
    severity: 'critical',
    complaintContent: '发动机在使用3个月后出现严重漏油，要求更换新产品',
    status: 'processing',
    assignedTo: '张三',
    complaintTime: '2023-11-27 09:30:00',
    responseDeadline: '2023-11-29 18:00:00'
  },
  {
    id: 2,
    complaintNo: 'CM-20231127-002',
    customerName: '陈女士',
    customerPhone: '13900139002',
    complaintType: 'service',
    productInfo: '售后服务',
    severity: 'major',
    complaintContent: '客服态度恶劣，对问题推诿扯皮，要求道歉和处理',
    status: 'pending',
    assignedTo: '李四',
    complaintTime: '2023-11-27 11:15:00',
    responseDeadline: '2023-11-28 12:00:00'
  },
  {
    id: 3,
    complaintNo: 'CM-20231126-003',
    customerName: '赵工',
    customerPhone: '13700137003',
    complaintType: 'after-sales',
    productInfo: 'DQ380变速箱',
    severity: 'minor',
    complaintContent: '保修期内维修费用过高，与承诺不符',
    status: 'resolved',
    assignedTo: '王五',
    complaintTime: '2023-11-26 15:20:00',
    responseDeadline: '2023-11-27 16:00:00'
  }
])

const complaintDialog = reactive({
  visible: false,
  title: '新建投诉',
  mode: 'create' // create | edit
})

const complaintForm = reactive({
  id: null,
  complaintNo: '',
  customerName: '',
  customerPhone: '',
  complaintType: '',
  severity: '',
  productInfo: '',
  complaintContent: '',
  assignedTo: '',
  responseDeadline: '',
  attachments: []
})

const complaintRules = {
  customerName: [
    { required: true, message: '请输入投诉人姓名', trigger: 'blur' }
  ],
  customerPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  complaintType: [
    { required: true, message: '请选择投诉类型', trigger: 'change' }
  ],
  severity: [
    { required: true, message: '请选择严重程度', trigger: 'change' }
  ],
  productInfo: [
    { required: true, message: '请输入涉及产品信息', trigger: 'blur' }
  ],
  complaintContent: [
    { required: true, message: '请输入投诉内容', trigger: 'blur' },
    { min: 10, message: '投诉内容至少10个字符', trigger: 'blur' }
  ]
}

const timelineDialog = reactive({
  visible: false
})

const timelineData = ref([
  {
    timestamp: '2023-11-27 09:30:00',
    title: '创建投诉',
    content: '客户提交了产品质量投诉',
    operator: '系统',
    color: '#F56C6C'
  },
  {
    timestamp: '2023-11-27 09:45:00',
    title: '分配处理人',
    content: '投诉已分配给客服专员张三处理',
    operator: '管理员',
    color: '#409EFF'
  },
  {
    timestamp: '2023-11-27 10:30:00',
    title: '开始处理',
    content: '已联系客户了解详细情况，正在调查中',
    operator: '张三',
    color: '#E6A23C'
  }
])

const uploadUrl = '/api/upload'

// 表单引用
const complaintFormRef = ref<FormInstance>()

// 计算属性
const filteredComplaints = computed(() => {
  let filtered = complaints.value

  if (filterForm.keyword) {
    filtered = filtered.filter(item => 
      item.complaintNo.toLowerCase().includes(filterForm.keyword.toLowerCase()) ||
      item.customerName.toLowerCase().includes(filterForm.keyword.toLowerCase()) ||
      item.productInfo.toLowerCase().includes(filterForm.keyword.toLowerCase())
    )
  }

  if (filterForm.complaintType) {
    filtered = filtered.filter(item => item.complaintType === filterForm.complaintType)
  }

  if (filterForm.severity) {
    filtered = filtered.filter(item => item.severity === filterForm.severity)
  }

  if (filterForm.status) {
    filtered = filtered.filter(item => item.status === filterForm.status)
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.dateRange
    filtered = filtered.filter(item => {
      const complaintDate = new Date(item.complaintTime)
      return complaintDate >= startDate && complaintDate <= endDate
    })
  }

  return filtered
})

// 方法
const getComplaintTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    quality: '产品质量',
    service: '服务态度',
    'after-sales': '售后服务',
    price: '价格争议',
    other: '其他'
  }
  return typeMap[type] || type
}

const getComplaintTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    quality: 'danger',
    service: 'warning',
    'after-sales': 'primary',
    price: 'info',
    other: ''
  }
  return typeMap[type] || 'info'
}

const getSeverityLabel = (severity: string) => {
  const severityMap: Record<string, string> = {
    critical: '严重',
    major: '重要',
    minor: '一般'
  }
  return severityMap[severity] || severity
}

const getSeverityTagType = (severity: string) => {
  const severityMap: Record<string, string> = {
    critical: 'danger',
    major: 'warning',
    minor: 'success'
  }
  return severityMap[severity] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    resolved: 'success',
    closed: 'info'
  }
  return statusMap[status] || 'info'
}

const updateChart = () => {
  // 更新图表数据
  ElMessage.info(`切换到最近${chartTimeRange.value}天数据`)
}

const handleSearch = () => {
  filterForm.page = 1
  ElMessage.success('搜索完成')
}

const handleReset = () => {
  Object.assign(filterForm, {
    keyword: '',
    complaintType: '',
    severity: '',
    status: '',
    dateRange: [],
    page: 1,
    pageSize: 20,
    total: 0
  })
  ElMessage.success('重置成功')
}

const handleSelectionChange = (selection: any[]) => {
  console.log('选择的投诉：', selection)
}

const handleCreateComplaint = () => {
  complaintDialog.title = '新建投诉'
  complaintDialog.mode = 'create'
  complaintDialog.visible = true
  resetComplaintForm()
  
  // 生成投诉编号
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  complaintForm.complaintNo = `CM-${date}-${random}`
}

const handleEditComplaint = (row: any) => {
  complaintDialog.title = '编辑投诉'
  complaintDialog.mode = 'edit'
  complaintDialog.visible = true
  Object.assign(complaintForm, row)
}

const handleViewComplaint = (row: any) => {
  ElMessage.info(`查看投诉：${row.complaintNo}`)
}

const handleProcessComplaint = (row: any) => {
  ElMessage.info(`处理投诉：${row.complaintNo}`)
}

const handleSaveComplaint = async () => {
  if (!complaintFormRef.value) return

  await complaintFormRef.value.validate((valid) => {
    if (valid) {
      // 这里添加保存逻辑
      ElMessage.success('投诉保存成功')
      complaintDialog.visible = false
      resetComplaintForm()
    }
  })
}

const handleCommand = (command: string, row: any) => {
  switch (command) {
    case 'timeline':
      Object.assign(timelineData.value, getTimelineData(row.complaintNo))
      timelineDialog.visible = true
      break
    case 'escalate':
      ElMessage.info(`升级投诉：${row.complaintNo}`)
      break
    case 'compensate':
      ElMessage.info(`制定补偿方案：${row.complaintNo}`)
      break
    case 'report':
      ElMessage.info(`生成报告：${row.complaintNo}`)
      break
    case 'close':
      handleCloseComplaint(row)
      break
    case 'delete':
      handleDeleteComplaint(row)
      break
  }
}

const handleCloseComplaint = (row: any) => {
  ElMessageBox.confirm(
    `确定要关闭投诉"${row.complaintNo}"吗？`,
    '关闭确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里添加关闭逻辑
    ElMessage.success('投诉已关闭')
  })
}

const handleDeleteComplaint = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除投诉"${row.complaintNo}"吗？此操作不可恢复。`,
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

const handleExportData = () => {
  ElMessage.info('导出投诉报表数据')
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success('上传成功')
}

const handleRemoveFile = (file: any) => {
  ElMessage.info('移除文件')
}

const resetComplaintForm = () => {
  Object.assign(complaintForm, {
    id: null,
    complaintNo: '',
    customerName: '',
    customerPhone: '',
    complaintType: '',
    severity: '',
    productInfo: '',
    complaintContent: '',
    assignedTo: '',
    responseDeadline: '',
    attachments: []
  })
}

const getTimelineData = (complaintNo: string) => {
  // 这里应该根据complaintNo获取对应的进度数据
  return [
    {
      timestamp: '2023-11-27 09:30:00',
      title: '创建投诉',
      content: '客户提交了投诉',
      operator: '系统',
      color: '#F56C6C'
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
.complaint-management {
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

.stat-icon.red { background: #F56C6C; }
.stat-icon.green { background: #67C23A; }
.stat-icon.orange { background: #E6A23C; }
.stat-icon.blue { background: #409EFF; }

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

.chart-section {
  margin-bottom: 20px;
}

.chart-controls {
  margin-bottom: 15px;
  text-align: right;
}

.chart-container {
  height: 300px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
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