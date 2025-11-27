<template>
  <div class="customer-feedback">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>客户反馈管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <i class="fas fa-plus"></i> 新建反馈
        </el-button>
        <el-button @click="exportData">
          <i class="fas fa-download"></i> 导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
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
                <div class="stat-trend" :class="stat.trend">
                  <i :class="stat.trend === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-section">
      <el-card>
        <el-form :model="searchForm" inline>
          <el-form-item label="反馈编号">
            <el-input v-model="searchForm.feedbackId" placeholder="请输入反馈编号" clearable />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
          </el-form-item>
          <el-form-item label="反馈类型">
            <el-select v-model="searchForm.feedbackType" placeholder="请选择反馈类型" clearable>
              <el-option label="产品建议" value="suggestion" />
              <el-option label="服务投诉" value="complaint" />
              <el-option label="功能问题" value="issue" />
              <el-option label="使用体验" value="experience" />
            </el-select>
          </el-form-item>
          <el-form-item label="满意度">
            <el-select v-model="searchForm.satisfaction" placeholder="请选择满意度" clearable>
              <el-option label="非常满意" value="very_satisfied" />
              <el-option label="满意" value="satisfied" />
              <el-option label="一般" value="neutral" />
              <el-option label="不满意" value="unsatisfied" />
              <el-option label="非常不满意" value="very_unsatisfied" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理状态">
            <el-select v-model="searchForm.status" placeholder="请选择处理状态" clearable>
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已回复" value="replied" />
              <el-option label="已解决" value="resolved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </el-form-item>
          <el-form-item label="反馈时间">
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

    <!-- 反馈列表 -->
    <div class="feedback-list">
      <el-card>
        <el-table :data="feedbackList" v-loading="loading" stripe>
          <el-table-column prop="feedbackId" label="反馈编号" width="140" />
          <el-table-column prop="customerName" label="客户名称" width="120" />
          <el-table-column prop="feedbackType" label="反馈类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getFeedbackTypeTag(row.feedbackType)">
                {{ getFeedbackTypeLabel(row.feedbackType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="反馈主题" min-width="200" show-overflow-tooltip />
          <el-table-column prop="satisfaction" label="满意度" width="120">
            <template #default="{ row }">
              <el-rate
                v-model="row.satisfactionScore"
                :max="5"
                disabled
                show-score
                text-color="#ff9900"
                score-template="{value}"
              />
            </template>
          </el-table-column>
          <el-table-column prop="status" label="处理状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="getPriorityTagType(row.priority)" size="small">
                {{ getPriorityLabel(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="反馈时间" width="140" />
          <el-table-column prop="assignedTo" label="负责人" width="100" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewFeedback(row)">查看</el-button>
              <el-button size="small" type="primary" @click="replyFeedback(row)" v-if="row.status === 'pending'">
                回复
              </el-button>
              <el-button size="small" type="success" @click="resolveFeedback(row)" v-if="row.status !== 'closed'">
                解决
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

    <!-- 新建反馈对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建客户反馈"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="feedbackForm" :rules="feedbackRules" ref="feedbackFormRef" label-width="100px">
        <el-form-item label="客户名称" prop="customerName">
          <el-input v-model="feedbackForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="feedbackForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱地址" prop="email">
          <el-input v-model="feedbackForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="反馈类型" prop="feedbackType">
          <el-select v-model="feedbackForm.feedbackType" placeholder="请选择反馈类型" style="width: 100%">
            <el-option label="产品建议" value="suggestion" />
            <el-option label="服务投诉" value="complaint" />
            <el-option label="功能问题" value="issue" />
            <el-option label="使用体验" value="experience" />
          </el-select>
        </el-form-item>
        <el-form-item label="反馈主题" prop="title">
          <el-input v-model="feedbackForm.title" placeholder="请输入反馈主题" />
        </el-form-item>
        <el-form-item label="满意度" prop="satisfactionScore">
          <el-rate
            v-model="feedbackForm.satisfactionScore"
            :max="5"
            show-text
            :texts="['非常不满意', '不满意', '一般', '满意', '非常满意']"
          />
        </el-form-item>
        <el-form-item label="详细内容" prop="content">
          <el-input
            v-model="feedbackForm.content"
            type="textarea"
            :rows="6"
            placeholder="请详细描述您的反馈内容"
          />
        </el-form-item>
        <el-form-item label="相关附件">
          <el-upload
            drag
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            action="#"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持jpg/png/pdf文件，且不超过10MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="saveFeedback" :loading="saving">
            提交反馈
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="反馈详情" width="800px">
      <div class="feedback-detail" v-if="currentFeedback">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="反馈编号">{{ currentFeedback.feedbackId }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ currentFeedback.customerName }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentFeedback.phone }}</el-descriptions-item>
          <el-descriptions-item label="反馈类型">
            <el-tag :type="getFeedbackTypeTag(currentFeedback.feedbackType)">
              {{ getFeedbackTypeLabel(currentFeedback.feedbackType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="满意度">
            <el-rate
              v-model="currentFeedback.satisfactionScore"
              :max="5"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
            />
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTagType(currentFeedback.status)">
              {{ getStatusLabel(currentFeedback.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentFeedback.assignedTo }}</el-descriptions-item>
          <el-descriptions-item label="反馈时间">{{ currentFeedback.createTime }}</el-descriptions-item>
          <el-descriptions-item label="反馈主题" :span="2">{{ currentFeedback.title }}</el-descriptions-item>
          <el-descriptions-item label="详细内容" :span="2">
            <div class="content-text">{{ currentFeedback.content }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="reply-section" v-if="currentFeedback.replies && currentFeedback.replies.length > 0">
          <h4>回复记录</h4>
          <div class="reply-list">
            <div v-for="(reply, index) in currentFeedback.replies" :key="index" class="reply-item">
              <div class="reply-header">
                <span class="reply-person">{{ reply.person }}</span>
                <span class="reply-time">{{ reply.time }}</span>
              </div>
              <div class="reply-content">{{ reply.content }}</div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button type="primary" @click="addReply" v-if="currentFeedback">
            添加回复
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 回复对话框 -->
    <el-dialog v-model="showReplyDialog" title="添加回复" width="500px">
      <el-form :model="replyForm" :rules="replyRules" ref="replyFormRef" label-width="80px">
        <el-form-item label="回复内容" prop="content">
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入回复内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showReplyDialog = false">取消</el-button>
          <el-button type="primary" @click="submitReply" :loading="replying">
            提交回复
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Feedback {
  id: string
  feedbackId: string
  customerName: string
  phone: string
  email: string
  feedbackType: string
  title: string
  content: string
  satisfactionScore: number
  status: string
  priority: string
  assignedTo: string
  createTime: string
  replies?: Array<{
    person: string
    content: string
    time: string
  }>
}

const loading = ref(false)
const saving = ref(false)
const replying = ref(false)
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showReplyDialog = ref(false)
const currentFeedback = ref<Feedback | null>(null)
const fileList = ref([])

const searchForm = reactive({
  feedbackId: '',
  customerName: '',
  feedbackType: '',
  satisfaction: '',
  status: '',
  dateRange: null as [string, string] | null
})

const feedbackForm = reactive({
  customerName: '',
  phone: '',
  email: '',
  feedbackType: '',
  title: '',
  content: '',
  satisfactionScore: 3
})

const replyForm = reactive({
  content: ''
})

const feedbackRules = {
  customerName: [
    { required: true, message: '请输入客户名称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  feedbackType: [
    { required: true, message: '请选择反馈类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入反馈主题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入反馈内容', trigger: 'blur' }
  ]
}

const replyRules = {
  content: [
    { required: true, message: '请输入回复内容', trigger: 'blur' }
  ]
}

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const statsData = reactive([
  { label: '总反馈', value: '328', icon: 'fas fa-comments', color: '#409EFF', trend: 'up', change: '12%' },
  { label: '待处理', value: '45', icon: 'fas fa-clock', color: '#E6A23C', trend: 'down', change: '8%' },
  { label: '已回复', value: '234', icon: 'fas fa-reply', color: '#67C23A', trend: 'up', change: '15%' },
  { label: '满意度', value: '4.2', icon: 'fas fa-smile', color: '#F56C6C', trend: 'up', change: '5%' }
])

const feedbackList = ref<Feedback[]>([])

const getFeedbackTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    suggestion: '产品建议',
    complaint: '服务投诉',
    issue: '功能问题',
    experience: '使用体验'
  }
  return typeMap[type] || type
}

const getFeedbackTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    suggestion: 'primary',
    complaint: 'danger',
    issue: 'warning',
    experience: 'info'
  }
  return typeMap[type] || ''
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    replied: '已回复',
    resolved: '已解决',
    closed: '已关闭'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    replied: 'info',
    resolved: 'success',
    closed: ''
  }
  return statusMap[status] || ''
}

const getPriorityLabel = (priority: string) => {
  const priorityMap: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return priorityMap[priority] || priority
}

const getPriorityTagType = (priority: string) => {
  const priorityMap: Record<string, string> = {
    low: 'info',
    medium: '',
    high: 'danger'
  }
  return priorityMap[priority] || ''
}

const mockFeedbacks: Feedback[] = [
  {
    id: '1',
    feedbackId: 'FB2024010001',
    customerName: '张先生',
    phone: '13800138001',
    email: 'zhang@example.com',
    feedbackType: 'suggestion',
    title: '建议增加导出功能',
    content: '希望系统可以增加数据导出功能，方便数据分析和报表制作。',
    satisfactionScore: 4,
    status: 'pending',
    priority: 'medium',
    assignedTo: '客服A',
    createTime: '2024-01-15 09:30:00',
    replies: []
  }
]

const loadFeedbacks = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    feedbackList.value = mockFeedbacks
    pagination.total = mockFeedbacks.length
  } catch (error) {
    ElMessage.error('加载反馈列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.currentPage = 1
  loadFeedbacks()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    feedbackId: '',
    customerName: '',
    feedbackType: '',
    satisfaction: '',
    status: '',
    dateRange: null
  })
  handleSearch()
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
  loadFeedbacks()
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
  loadFeedbacks()
}

const viewFeedback = (feedback: Feedback) => {
  currentFeedback.value = feedback
  showDetailDialog.value = true
}

const replyFeedback = (feedback: Feedback) => {
  currentFeedback.value = feedback
  showDetailDialog.value = true
  setTimeout(() => {
    addReply()
  }, 100)
}

const resolveFeedback = (feedback: Feedback) => {
  ElMessageBox.confirm('确认将该反馈标记为已解决？', '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('反馈已标记为已解决')
    loadFeedbacks()
  })
}

const saveFeedback = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    saving.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('反馈提交成功')
    showCreateDialog.value = false
    loadFeedbacks()
  } catch (error) {
    ElMessage.error('提交失败')
  } finally {
    saving.value = false
  }
}

const addReply = () => {
  if (currentFeedback.value) {
    showDetailDialog.value = false
    showReplyDialog.value = true
  }
}

const submitReply = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    replying.value = true
    
    await new Promise(resolve => setTimeout(resolve, 500))
    
    ElMessage.success('回复提交成功')
    showReplyDialog.value = false
    loadFeedbacks()
  } catch (error) {
    ElMessage.error('回复失败')
  } finally {
    replying.value = false
  }
}

const handleFileChange = (file: any, fileList: any) => {
  console.log('文件选择:', file, fileList)
}

const resetForm = () => {
  Object.assign(feedbackForm, {
    customerName: '',
    phone: '',
    email: '',
    feedbackType: '',
    title: '',
    content: '',
    satisfactionScore: 3
  })
  fileList.value = []
}

const exportData = () => {
  ElMessage.success('导出功能开发中')
}

onMounted(() => {
  loadFeedbacks()
})
</script>

<style scoped>
.customer-feedback {
  padding: 20px;
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

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 15px 0;
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

.stat-trend {
  font-size: 12px;
  margin-top: 3px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.filter-section {
  margin-bottom: 20px;
}

.feedback-list {
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

.feedback-detail {
  margin-bottom: 20px;
}

.content-text {
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

.reply-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.reply-section h4 {
  margin-bottom: 15px;
  color: #303133;
}

.reply-item {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reply-person {
  font-weight: 500;
  color: #409EFF;
}

.reply-time {
  color: #909399;
  font-size: 12px;
}

.reply-content {
  color: #606266;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .el-col-6 {
    margin-bottom: 15px;
  }
}
</style>