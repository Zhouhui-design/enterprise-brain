<template>
  <div class="return-processing">
    <div class="page-header">
      <div class="header-left">
        <h1>退货处理</h1>
        <p>客户退货申请审核与处理流程管理</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreateReturn">
          <el-icon><Plus /></el-icon>
          新建退货
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
            <div class="stat-icon blue">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalReturns }}</div>
              <div class="stat-label">总退货数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orange">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingReturns }}</div>
              <div class="stat-label">待审核</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon green">
              <el-icon><Refresh /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.processingReturns }}</div>
              <div class="stat-label">处理中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon purple">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.completedReturns }}</div>
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
            placeholder="搜索退货单号、客户姓名、产品型号"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="退货原因">
          <el-select v-model="filterForm.returnReason" placeholder="选择原因" clearable style="width: 150px">
            <el-option label="产品质量问题" value="quality" />
            <el-option label="产品不符合描述" value="description" />
            <el-option label="客户不满意" value="dissatisfaction" />
            <el-option label="运输损坏" value="damage" />
            <el-option label="其他原因" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="待审核" value="pending" />
            <el-option label="审核通过" value="approved" />
            <el-option label="审核拒绝" value="rejected" />
            <el-option label="处理中" value="processing" />
            <el-option label="已完成" value="completed" />
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

    <!-- 退货列表 -->
    <div class="table-section">
      <el-table
        :data="filteredReturns"
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="returnNo" label="退货单号" width="140" fixed="left">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewReturn(row)">
              {{ row.returnNo }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户姓名" width="100" />
        <el-table-column prop="customerPhone" label="联系电话" width="130" />
        <el-table-column prop="productModel" label="产品型号" width="150" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="amount" label="退货金额" width="120">
          <template #default="{ row }">
            ¥{{ row.amount.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="returnReason" label="退货原因" width="120">
          <template #default="{ row }">
            <el-tag :type="getReturnReasonTagType(row.returnReason)" size="small">
              {{ getReturnReasonLabel(row.returnReason) }}
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
        <el-table-column prop="applicationTime" label="申请时间" width="160" />
        <el-table-column prop="processor" label="处理人" width="100" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewReturn(row)">查看</el-button>
            <el-button link type="primary" @click="handleEditReturn(row)" v-if="row.status === 'pending'">编辑</el-button>
            <el-button link type="success" @click="handleApproveReturn(row)" v-if="row.status === 'pending'">审核</el-button>
            <el-button link type="warning" @click="handleProcessReturn(row)" v-if="row.status === 'approved'">处理</el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button link type="info">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="timeline">处理进度</el-dropdown-item>
                  <el-dropdown-item command="refund" v-if="row.status === 'processing'">退款处理</el-dropdown-item>
                  <el-dropdown-item command="return">收货确认</el-dropdown-item>
                  <el-dropdown-item command="print">打印退货单</el-dropdown-item>
                  <el-dropdown-item command="close" v-if="row.status === 'completed'">关闭</el-dropdown-item>
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

    <!-- 新建/编辑退货对话框 -->
    <el-dialog
      v-model="returnDialog.visible"
      :title="returnDialog.title"
      width="900px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="returnFormRef"
        :model="returnForm"
        :rules="returnRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="退货单号" prop="returnNo">
              <el-input v-model="returnForm.returnNo" placeholder="RT-YYYYMMDD-001" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="退货原因" prop="returnReason">
              <el-select v-model="returnForm.returnReason" placeholder="选择退货原因" style="width: 100%">
                <el-option label="产品质量问题" value="quality" />
                <el-option label="产品不符合描述" value="description" />
                <el-option label="客户不满意" value="dissatisfaction" />
                <el-option label="运输损坏" value="damage" />
                <el-option label="其他原因" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="returnForm.customerName" placeholder="请输入客户姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="customerPhone">
              <el-input v-model="returnForm.customerPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品型号" prop="productModel">
              <el-input v-model="returnForm.productModel" placeholder="请输入产品型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购买单号">
              <el-input v-model="returnForm.orderNo" placeholder="请输入购买单号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="退货数量" prop="quantity">
              <el-input-number v-model="returnForm.quantity" :min="1" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number v-model="returnForm.unitPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总金额">
              <el-input :value="returnForm.quantity * returnForm.unitPrice" disabled style="width: 100%">
                <template #prefix>¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="退货说明" prop="returnDescription">
          <el-input
            v-model="returnForm.returnDescription"
            type="textarea"
            :rows="4"
            placeholder="请详细描述退货原因和具体情况"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收货地址" prop="returnAddress">
              <el-input
                v-model="returnForm.returnAddress"
                type="textarea"
                :rows="2"
                placeholder="请输入退货收货地址"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="处理人">
              <el-select v-model="returnForm.processor" placeholder="分配处理人" style="width: 100%">
                <el-option label="张三" value="张三" />
                <el-option label="李四" value="李四" />
                <el-option label="王五" value="王五" />
                <el-option label="赵六" value="赵六" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="附件资料">
          <el-upload
            v-model:file-list="returnForm.attachments"
            :action="uploadUrl"
            multiple
            :limit="10"
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
          <el-button @click="returnDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveReturn">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      v-model="approveDialog.visible"
      title="退货审核"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="approve-content">
        <h4>退货信息</h4>
        <p><strong>退货单号：</strong>{{ approveData.returnNo }}</p>
        <p><strong>客户姓名：</strong>{{ approveData.customerName }}</p>
        <p><strong>产品型号：</strong>{{ approveData.productModel }}</p>
        <p><strong>退货金额：</strong>¥{{ approveData.amount?.toLocaleString() }}</p>
        <p><strong>退货原因：</strong>{{ getReturnReasonLabel(approveData.returnReason) }}</p>
        
        <el-divider />
        
        <el-form :model="approveForm" label-width="80px">
          <el-form-item label="审核结果">
            <el-radio-group v-model="approveForm.result">
              <el-radio value="approved">通过</el-radio>
              <el-radio value="rejected">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审核意见">
            <el-input
              v-model="approveForm.comment"
              type="textarea"
              :rows="3"
              placeholder="请输入审核意见"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="approveDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveApprove">确认审核</el-button>
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
  Refresh,
  CircleCheck,
  Search,
  ArrowDown
} from '@element-plus/icons-vue'

// 响应式数据
const filterForm = reactive({
  keyword: '',
  returnReason: '',
  status: '',
  dateRange: [],
  page: 1,
  pageSize: 20,
  total: 0
})

const stats = reactive({
  totalReturns: 142,
  pendingReturns: 23,
  processingReturns: 45,
  completedReturns: 74
})

const returns = ref([
  {
    id: 1,
    returnNo: 'RT-20231127-001',
    customerName: '周先生',
    customerPhone: '13800138001',
    productModel: 'EA888-2.0T',
    quantity: 1,
    unitPrice: 45000,
    amount: 45000,
    returnReason: 'quality',
    status: 'pending',
    orderNo: 'PO-20231015-003',
    applicationTime: '2023-11-27 10:30:00',
    processor: '张三',
    returnDescription: '发动机使用一个月后出现异响，要求退货'
  },
  {
    id: 2,
    returnNo: 'RT-20231127-002',
    customerName: '吴女士',
    customerPhone: '13900139002',
    productModel: 'DQ380变速箱',
    quantity: 1,
    unitPrice: 25000,
    amount: 25000,
    returnReason: 'damage',
    status: 'approved',
    orderNo: 'PO-20231020-005',
    applicationTime: '2023-11-27 14:15:00',
    processor: '李四',
    returnDescription: '收货时发现产品外壳有明显划痕，影响使用'
  },
  {
    id: 3,
    returnNo: 'RT-20231126-003',
    customerName: '郑工',
    customerPhone: '13700137003',
    productModel: 'MQB底盘件',
    quantity: 5,
    unitPrice: 3200,
    amount: 16000,
    returnReason: 'dissatisfaction',
    status: 'processing',
    orderNo: 'PO-20231010-002',
    applicationTime: '2023-11-26 16:20:00',
    processor: '王五',
    returnDescription: '产品性能不如预期，无法满足项目要求'
  }
])

const returnDialog = reactive({
  visible: false,
  title: '新建退货',
  mode: 'create' // create | edit
})

const returnForm = reactive({
  id: null,
  returnNo: '',
  customerName: '',
  customerPhone: '',
  productModel: '',
  quantity: 1,
  unitPrice: 0,
  returnReason: '',
  orderNo: '',
  returnDescription: '',
  returnAddress: '',
  processor: '',
  attachments: []
})

const returnRules = {
  customerName: [
    { required: true, message: '请输入客户姓名', trigger: 'blur' }
  ],
  customerPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  productModel: [
    { required: true, message: '请输入产品型号', trigger: 'blur' }
  ],
  quantity: [
    { required: true, message: '请输入退货数量', trigger: 'blur' }
  ],
  unitPrice: [
    { required: true, message: '请输入单价', trigger: 'blur' }
  ],
  returnReason: [
    { required: true, message: '请选择退货原因', trigger: 'change' }
  ],
  returnDescription: [
    { required: true, message: '请输入退货说明', trigger: 'blur' },
    { min: 10, message: '退货说明至少10个字符', trigger: 'blur' }
  ],
  returnAddress: [
    { required: true, message: '请输入收货地址', trigger: 'blur' }
  ]
}

const approveDialog = reactive({
  visible: false
})

const approveData = reactive({
  returnNo: '',
  customerName: '',
  productModel: '',
  amount: 0,
  returnReason: ''
})

const approveForm = reactive({
  result: 'approved',
  comment: ''
})

const timelineDialog = reactive({
  visible: false
})

const timelineData = ref([
  {
    timestamp: '2023-11-27 10:30:00',
    title: '提交退货申请',
    content: '客户提交了退货申请',
    operator: '客户',
    color: '#409EFF'
  },
  {
    timestamp: '2023-11-27 11:00:00',
    title: '申请审核',
    content: '退货申请正在审核中',
    operator: '系统',
    color: '#E6A23C'
  }
])

const uploadUrl = '/api/upload'

// 表单引用
const returnFormRef = ref<FormInstance>()

// 计算属性
const filteredReturns = computed(() => {
  let filtered = returns.value

  if (filterForm.keyword) {
    filtered = filtered.filter(item => 
      item.returnNo.toLowerCase().includes(filterForm.keyword.toLowerCase()) ||
      item.customerName.toLowerCase().includes(filterForm.keyword.toLowerCase()) ||
      item.productModel.toLowerCase().includes(filterForm.keyword.toLowerCase())
    )
  }

  if (filterForm.returnReason) {
    filtered = filtered.filter(item => item.returnReason === filterForm.returnReason)
  }

  if (filterForm.status) {
    filtered = filtered.filter(item => item.status === filterForm.status)
  }

  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [startDate, endDate] = filterForm.dateRange
    filtered = filtered.filter(item => {
      const returnDate = new Date(item.applicationTime)
      return returnDate >= startDate && returnDate <= endDate
    })
  }

  return filtered
})

// 方法
const getReturnReasonLabel = (reason: string) => {
  const reasonMap: Record<string, string> = {
    quality: '产品质量问题',
    description: '产品不符合描述',
    dissatisfaction: '客户不满意',
    damage: '运输损坏',
    other: '其他原因'
  }
  return reasonMap[reason] || reason
}

const getReturnReasonTagType = (reason: string) => {
  const reasonMap: Record<string, string> = {
    quality: 'danger',
    description: 'warning',
    dissatisfaction: 'primary',
    damage: 'info',
    other: ''
  }
  return reasonMap[reason] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审核',
    approved: '审核通过',
    rejected: '审核拒绝',
    processing: '处理中',
    completed: '已完成'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    processing: 'primary',
    completed: 'info'
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
    returnReason: '',
    status: '',
    dateRange: [],
    page: 1,
    pageSize: 20,
    total: 0
  })
  ElMessage.success('重置成功')
}

const handleSelectionChange = (selection: any[]) => {
  console.log('选择的退货：', selection)
}

const handleCreateReturn = () => {
  returnDialog.title = '新建退货'
  returnDialog.mode = 'create'
  returnDialog.visible = true
  resetReturnForm()
  
  // 生成退货单号
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  returnForm.returnNo = `RT-${date}-${random}`
}

const handleEditReturn = (row: any) => {
  returnDialog.title = '编辑退货'
  returnDialog.mode = 'edit'
  returnDialog.visible = true
  Object.assign(returnForm, row)
}

const handleViewReturn = (row: any) => {
  ElMessage.info(`查看退货：${row.returnNo}`)
}

const handleApproveReturn = (row: any) => {
  Object.assign(approveData, row)
  approveForm.result = 'approved'
  approveForm.comment = ''
  approveDialog.visible = true
}

const handleProcessReturn = (row: any) => {
  ElMessage.info(`处理退货：${row.returnNo}`)
}

const handleSaveReturn = async () => {
  if (!returnFormRef.value) return

  await returnFormRef.value.validate((valid) => {
    if (valid) {
      // 这里添加保存逻辑
      ElMessage.success('退货保存成功')
      returnDialog.visible = false
      resetReturnForm()
    }
  })
}

const handleSaveApprove = () => {
  if (!approveForm.comment) {
    ElMessage.warning('请输入审核意见')
    return
  }
  
  // 这里添加审核逻辑
  ElMessage.success('审核完成')
  approveDialog.visible = false
}

const handleCommand = (command: string, row: any) => {
  switch (command) {
    case 'timeline':
      Object.assign(timelineData.value, getTimelineData(row.returnNo))
      timelineDialog.visible = true
      break
    case 'refund':
      ElMessage.info(`处理退款：${row.returnNo}`)
      break
    case 'return':
      ElMessage.info(`确认收货：${row.returnNo}`)
      break
    case 'print':
      ElMessage.info(`打印退货单：${row.returnNo}`)
      break
    case 'close':
      handleCloseReturn(row)
      break
    case 'delete':
      handleDeleteReturn(row)
      break
  }
}

const handleCloseReturn = (row: any) => {
  ElMessageBox.confirm(
    `确定要关闭退货"${row.returnNo}"吗？`,
    '关闭确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 这里添加关闭逻辑
    ElMessage.success('退货已关闭')
  })
}

const handleDeleteReturn = (row: any) => {
  ElMessageBox.confirm(
    `确定要删除退货"${row.returnNo}"吗？此操作不可恢复。`,
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
  ElMessage.info('导出退货报表数据')
}

const handleUploadSuccess = (response: any, file: any) => {
  ElMessage.success('上传成功')
}

const handleRemoveFile = (file: any) => {
  ElMessage.info('移除文件')
}

const resetReturnForm = () => {
  Object.assign(returnForm, {
    id: null,
    returnNo: '',
    customerName: '',
    customerPhone: '',
    productModel: '',
    quantity: 1,
    unitPrice: 0,
    returnReason: '',
    orderNo: '',
    returnDescription: '',
    returnAddress: '',
    processor: '',
    attachments: []
  })
}

const getTimelineData = (returnNo: string) => {
  // 这里应该根据returnNo获取对应的进度数据
  return [
    {
      timestamp: '2023-11-27 10:30:00',
      title: '提交退货申请',
      content: '客户提交了退货申请',
      operator: '客户',
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
.return-processing {
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

.approve-content h4 {
  margin-bottom: 15px;
  color: #303133;
}

.approve-content p {
  margin: 8px 0;
  color: #606266;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  margin-top: 5px;
}
</style>