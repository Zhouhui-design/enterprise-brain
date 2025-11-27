<template>
  <div class="after-sales-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-content">
        <h1>售后工单管理</h1>
        <div class="header-actions">
          <el-button type="primary" @click="showCreateDialog = true">
            <i class="fas fa-plus"></i> 新建工单
          </el-button>
          <el-button @click="exportData">
            <i class="fas fa-download"></i> 导出
          </el-button>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-section">
      <el-card>
        <el-form :model="searchForm" inline>
          <el-form-item label="工单编号">
            <el-input v-model="searchForm.ticketNumber" placeholder="请输入工单编号" clearable />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
          </el-form-item>
          <el-form-item label="工单类型">
            <el-select v-model="searchForm.type" placeholder="请选择工单类型" clearable>
              <el-option label="维修" value="repair" />
              <el-option label="退货" value="return" />
              <el-option label="换货" value="exchange" />
              <el-option label="投诉" value="complaint" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已完成" value="completed" />
              <el-option label="已关闭" value="closed" />
            </el-select>
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
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in statsData" :key="index">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <i :class="stat.icon"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工单列表 -->
    <div class="table-section">
      <el-card>
        <el-table :data="ticketList" v-loading="loading" stripe>
          <el-table-column prop="ticketNumber" label="工单编号" width="150" />
          <el-table-column prop="customerName" label="客户名称" width="120" />
          <el-table-column prop="type" label="工单类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTypeTagType(row.type)">
                {{ getTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="问题描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityTagType(row.priority)" size="small">
                {{ getPriorityLabel(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignedTo" label="负责人" width="100" />
          <el-table-column prop="createTime" label="创建时间" width="140" />
          <el-table-column prop="resolveTime" label="完成时间" width="140" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewTicket(row)">查看</el-button>
              <el-button size="small" type="primary" @click="editTicket(row)">编辑</el-button>
              <el-button size="small" type="success" @click="handleTicket(row)" v-if="row.status === 'pending'">
                处理
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
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
    </div>

    <!-- 新建/编辑工单对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingTicket ? '编辑工单' : '新建工单'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="ticketForm" :rules="ticketRules" ref="ticketFormRef" label-width="100px">
        <el-form-item label="工单编号" prop="ticketNumber" v-if="editingTicket">
          <el-input v-model="ticketForm.ticketNumber" disabled />
        </el-form-item>
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="ticketForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="ticketForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="ticketForm.type" placeholder="请选择工单类型" style="width: 100%">
            <el-option label="维修" value="repair" />
            <el-option label="退货" value="return" />
            <el-option label="换货" value="exchange" />
            <el-option label="投诉" value="complaint" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题标题" prop="title">
          <el-input v-model="ticketForm.title" placeholder="请输入问题标题" />
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="ticketForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述问题"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="ticketForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assignedTo">
          <el-select v-model="ticketForm.assignedTo" placeholder="请选择负责人" style="width: 100%">
            <el-option label="张三" value="zhangsan" />
            <el-option label="李四" value="lisi" />
            <el-option label="王五" value="wangwu" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTicket" :loading="saving">
            {{ editingTicket ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Ticket {
  id: string
  ticketNumber: string
  customerName: string
  phone: string
  type: string
  title: string
  description: string
  status: string
  priority: string
  assignedTo: string
  createTime: string
  resolveTime?: string
}

interface Stats {
  total: number
  pending: number
  processing: number
  completed: number
  closed: number
}

const loading = ref(false)
const saving = ref(false)
const showCreateDialog = ref(false)
const editingTicket = ref<Ticket | null>(null)

const searchForm = reactive({
  ticketNumber: '',
  customerName: '',
  type: '',
  status: '',
  dateRange: null as [string, string] | null
})

const ticketForm = reactive({
  ticketNumber: '',
  customerName: '',
  phone: '',
  type: '',
  title: '',
  description: '',
  priority: 'medium',
  assignedTo: ''
})

const ticketRules = {
  customerName: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择工单类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入问题标题', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请描述问题', trigger: 'blur' }
  ],
  assignedTo: [
    { required: true, message: '请选择负责人', trigger: 'change' }
  ]
}

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const statsData = reactive([
  { label: '总工单', value: '156', icon: 'fas fa-clipboard-list', color: '#409EFF' },
  { label: '待处理', value: '23', icon: 'fas fa-clock', color: '#E6A23C' },
  { label: '处理中', value: '45', icon: 'fas fa-cog', color: '#F56C6C' },
  { label: '已完成', value: '88', icon: 'fas fa-check-circle', color: '#67C23A' }
])

const ticketList = ref<Ticket[]>([])

const getTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    repair: '维修',
    return: '退货',
    exchange: '换货',
    complaint: '投诉'
  }
  return typeMap[type] || type
}

const getTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    repair: '',
    return: 'warning',
    exchange: 'info',
    complaint: 'danger'
  }
  return typeMap[type] || ''
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
  return statusMap[status] || ''
}

const getPriorityLabel = (priority: string) => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return priorityMap[priority] || priority
}

const getPriorityTagType = (priority: string) => {
  const priorityMap: Record<string, string> = {
    low: 'info',
    medium: '',
    high: 'warning',
    urgent: 'danger'
  }
  return priorityMap[priority] || ''
}

const mockTickets: Ticket[] = [
  {
    id: '1',
    ticketNumber: 'AS2024010001',
    customerName: '张先生',
    phone: '13800138001',
    type: 'repair',
    title: '设备无法正常启动',
    description: '设备通电后无法启动，指示灯闪烁',
    status: 'pending',
    priority: 'high',
    assignedTo: '张三',
    createTime: '2024-01-15 09:30:00'
  },
  {
    id: '2',
    ticketNumber: 'AS2024010002',
    customerName: '李女士',
    phone: '13800138002',
    type: 'return',
    title: '产品质量问题',
    description: '收到的产品有明显瑕疵',
    status: 'processing',
    priority: 'medium',
    assignedTo: '李四',
    createTime: '2024-01-14 14:20:00'
  }
]

const loadTickets = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    ticketList.value = mockTickets
    pagination.total = mockTickets.length
  } catch (error) {
    ElMessage.error('加载工单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadTickets()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    ticketNumber: '',
    customerName: '',
    type: '',
    status: '',
    dateRange: null
  })
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  loadTickets()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadTickets()
}

const viewTicket = (ticket: Ticket) => {
  ElMessage.info(`查看工单: ${ticket.ticketNumber}`)
}

const editTicket = (ticket: Ticket) => {
  editingTicket.value = ticket
  Object.assign(ticketForm, {
    ticketNumber: ticket.ticketNumber,
    customerName: ticket.customerName,
    phone: ticket.phone,
    type: ticket.type,
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo
  })
  showCreateDialog.value = true
}

const handleTicket = (ticket: Ticket) => {
  ElMessage.success(`开始处理工单: ${ticket.ticketNumber}`)
}

const saveTicket = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    saving.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(editingTicket.value ? '工单更新成功' : '工单创建成功')
    showCreateDialog.value = false
    loadTickets()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetForm = () => {
  editingTicket.value = null
  Object.assign(ticketForm, {
    ticketNumber: '',
    customerName: '',
    phone: '',
    type: '',
    title: '',
    description: '',
    priority: 'medium',
    assignedTo: ''
  })
}

const exportData = () => {
  ElMessage.success('导出功能开发中')
}

onMounted(() => {
  loadTickets()
})
</script>

<style scoped>
.after-sales-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-section {
  margin-bottom: 20px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.stat-icon i {
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.table-section {
  background: white;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .el-col-6 {
    margin-bottom: 15px;
  }
}
</style>