<template>
  <div class="design-review">
    <div class="page-header">
      <h1>设计评审</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateReview">
          <el-icon><Plus /></el-icon>
          发起评审
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 评审统计卡片 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in reviewStats" :key="index">
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

    <!-- 评审搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="评审标题">
          <el-input v-model="searchForm.title" placeholder="请输入评审标题" clearable />
        </el-form-item>
        <el-form-item label="设计名称">
          <el-input v-model="searchForm.designName" placeholder="请输入设计名称" clearable />
        </el-form-item>
        <el-form-item label="评审状态">
          <el-select v-model="searchForm.status" placeholder="请选择评审状态" clearable>
            <el-option label="待评审" value="pending" />
            <el-option label="评审中" value="in_review" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="searchForm.priority" placeholder="请选择优先级" clearable>
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
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
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 评审列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="table-title">
          <span>评审列表</span>
          <el-tag v-if="selectedReviews.length > 0" type="info">
            已选择 {{ selectedReviews.length }} 项
          </el-tag>
        </div>
        <div class="table-actions" v-if="selectedReviews.length > 0">
          <el-button type="warning" size="small" @click="handleBatchApprove">
            批量通过
          </el-button>
          <el-button type="danger" size="small" @click="handleBatchReject">
            批量驳回
          </el-button>
        </div>
      </div>

      <el-table
        :data="reviewList"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="reviewCode" label="评审编号" width="120" />
        <el-table-column prop="title" label="评审标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="designName" label="设计名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="initiator" label="发起人" width="100" />
        <el-table-column prop="reviewers" label="评审人" width="200">
          <template #default="{ row }">
            <el-tag
              v-for="reviewer in row.reviewers"
              :key="reviewer"
              size="small"
              style="margin-right: 5px; margin-bottom: 5px;"
            >
              {{ reviewer }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="评审进度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" />
          </template>
        </el-table-column>
        <el-table-column prop="createDate" label="创建时间" width="110" />
        <el-table-column prop="deadline" label="截止时间" width="110" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button type="success" size="small" @click="handleReview(row)" v-if="canReview(row)">评审</el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)" v-if="canEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleCancel(row)" v-if="canCancel(row)">取消</el-button>
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

    <!-- 发起评审对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="reviewFormRef"
        :model="reviewForm"
        :rules="reviewRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="评审编号" prop="reviewCode">
              <el-input v-model="reviewForm.reviewCode" placeholder="自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评审标题" prop="title">
              <el-input v-model="reviewForm.title" placeholder="请输入评审标题" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="关联设计" prop="designId">
          <el-select v-model="reviewForm.designId" placeholder="请选择关联设计" filterable style="width: 100%">
            <el-option
              v-for="design in designList"
              :key="design.id"
              :label="design.name"
              :value="design.id"
            >
              <span>{{ design.name }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ design.type }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="reviewForm.priority" placeholder="请选择优先级">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="截止时间" prop="deadline">
              <el-date-picker
                v-model="reviewForm.deadline"
                type="datetime"
                placeholder="请选择截止时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="评审人" prop="reviewers">
          <el-select
            v-model="reviewForm.reviewers"
            multiple
            placeholder="请选择评审人"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="user in reviewerList"
              :key="user.id"
              :label="user.name"
              :value="user.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="评审说明">
          <el-input
            v-model="reviewForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入评审说明"
          />
        </el-form-item>
        <el-form-item label="评审标准">
          <el-input
            v-model="reviewForm.criteria"
            type="textarea"
            :rows="3"
            placeholder="请输入评审标准和要求"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 评审详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      title="评审详情"
      width="90%"
      @close="handleDetailClose"
    >
      <div v-if="currentReview" class="review-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评审编号">{{ currentReview.reviewCode }}</el-descriptions-item>
          <el-descriptions-item label="评审标题">{{ currentReview.title }}</el-descriptions-item>
          <el-descriptions-item label="关联设计">{{ currentReview.designName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentReview.status)">{{ getStatusText(currentReview.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(currentReview.priority)">{{ currentReview.priority }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发起人">{{ currentReview.initiator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentReview.createDate }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ currentReview.deadline }}</el-descriptions-item>
          <el-descriptions-item label="评审进度" span="2">
            <el-progress :percentage="currentReview.progress" :color="getProgressColor(currentReview.progress)" />
          </el-descriptions-item>
          <el-descriptions-item label="评审说明" span="2">{{ currentReview.description }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-tabs">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="评审意见" name="comments">
              <div class="comments-section">
                <div class="comment-input">
                  <el-form inline>
                    <el-form-item style="width: 100%">
                      <el-input
                        v-model="newComment"
                        type="textarea"
                        :rows="3"
                        placeholder="请输入评审意见"
                        style="width: 100%"
                      />
                    </el-form-item>
                    <el-form-item>
                      <el-button type="primary" @click="handleAddComment">提交意见</el-button>
                    </el-form-item>
                  </el-form>
                </div>
                <div class="comment-list">
                  <el-timeline>
                    <el-timeline-item
                      v-for="comment in reviewComments"
                      :key="comment.id"
                      :timestamp="comment.timestamp"
                    >
                      <el-card>
                        <div class="comment-header">
                          <strong>{{ comment.reviewer }}</strong>
                          <el-tag :type="getCommentType(comment.type)" size="small">
                            {{ getCommentTypeText(comment.type) }}
                          </el-tag>
                        </div>
                        <p>{{ comment.content }}</p>
                        <div class="comment-actions" v-if="comment.canModify">
                          <el-button type="text" size="small" @click="handleEditComment(comment)">编辑</el-button>
                          <el-button type="text" size="small" @click="handleDeleteComment(comment)">删除</el-button>
                        </div>
                      </el-card>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="设计文件" name="files">
              <div class="files-section">
                <DesignViewer :design-id="currentReview.designId" mode="review" />
              </div>
            </el-tab-pane>
            <el-tab-pane label="评审记录" name="history">
              <div class="history-section">
                <el-timeline>
                  <el-timeline-item
                    v-for="record in reviewHistory"
                    :key="record.id"
                    :timestamp="record.timestamp"
                    :type="getHistoryType(record.action)"
                  >
                    <el-card>
                      <p><strong>{{ record.user }}</strong> {{ getHistoryText(record.action) }}</p>
                      <p v-if="record.comment">{{ record.comment }}</p>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>

    <!-- 评审表单对话框 -->
    <el-dialog
      v-model="reviewFormVisible"
      title="提交评审意见"
      width="600px"
    >
      <el-form
        ref="reviewSubmitFormRef"
        :model="reviewSubmitForm"
        :rules="reviewSubmitRules"
        label-width="100px"
      >
        <el-form-item label="评审结果" prop="result">
          <el-radio-group v-model="reviewSubmitForm.result">
            <el-radio label="approve">通过</el-radio>
            <el-radio label="reject">驳回</el-radio>
            <el-radio label="conditional">有条件通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="评审意见" prop="comment">
          <el-input
            v-model="reviewSubmitForm.comment"
            type="textarea"
            :rows="5"
            placeholder="请详细说明评审意见"
          />
        </el-form-item>
        <el-form-item label="改进建议">
          <el-input
            v-model="reviewSubmitForm.suggestions"
            type="textarea"
            :rows="3"
            placeholder="请提出改进建议"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewFormVisible = false">取消</el-button>
          <el-button type="primary" @click="handleReviewSubmit">提交评审</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Timer, User, Warning, Check } from '@element-plus/icons-vue'
import DesignViewer from './components/DesignViewer.vue'

// 响应式数据
const loading = ref(false)
const dialogVisible = ref(false)
const detailVisible = ref(false)
const reviewFormVisible = ref(false)
const dialogTitle = ref('发起评审')
const currentReview = ref(null)
const selectedReviews = ref([])
const activeTab = ref('comments')
const newComment = ref('')
const reviewFormRef = ref()
const reviewSubmitFormRef = ref()

// 评审统计数据
const reviewStats = ref([
  {
    label: '总评审数',
    value: '142',
    icon: Timer,
    color: '#409EFF'
  },
  {
    label: '待评审',
    value: '18',
    icon: Warning,
    color: '#E6A23C'
  },
  {
    label: '已通过',
    value: '98',
    icon: Check,
    color: '#67C23A'
  },
  {
    label: '评审人',
    value: '15',
    icon: User,
    color: '#909399'
  }
])

// 搜索表单
const searchForm = reactive({
  title: '',
  designName: '',
  status: '',
  priority: '',
  dateRange: []
})

// 评审表单
const reviewForm = reactive({
  reviewCode: '',
  title: '',
  designId: '',
  priority: 'medium',
  deadline: '',
  reviewers: [],
  description: '',
  criteria: ''
})

// 评审提交表单
const reviewSubmitForm = reactive({
  result: '',
  comment: '',
  suggestions: ''
})

// 表单验证规则
const reviewRules = {
  title: [
    { required: true, message: '请输入评审标题', trigger: 'blur' }
  ],
  designId: [
    { required: true, message: '请选择关联设计', trigger: 'change' }
  ],
  reviewers: [
    { required: true, message: '请选择评审人', trigger: 'change' }
  ]
}

const reviewSubmitRules = {
  result: [
    { required: true, message: '请选择评审结果', trigger: 'change' }
  ],
  comment: [
    { required: true, message: '请输入评审意见', trigger: 'blur' }
  ]
}

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 评审列表数据
const reviewList = ref([
  {
    id: 1,
    reviewCode: 'REV001',
    title: '机械臂结构设计评审',
    designName: '机械臂结构设计',
    status: 'in_review',
    priority: 'high',
    initiator: '张三',
    reviewers: ['李工', '王工', '赵工'],
    progress: 66,
    createDate: '2024-03-10',
    deadline: '2024-03-20'
  },
  {
    id: 2,
    reviewCode: 'REV002',
    title: '控制系统电路图评审',
    designName: '控制系统电路图',
    status: 'pending',
    priority: 'medium',
    initiator: '李四',
    reviewers: ['张工', '刘工'],
    progress: 0,
    createDate: '2024-03-12',
    deadline: '2024-03-22'
  },
  {
    id: 3,
    reviewCode: 'REV003',
    title: '用户界面设计评审',
    designName: '生产管理软件界面',
    status: 'approved',
    priority: 'low',
    initiator: '王五',
    reviewers: ['陈工', '周工'],
    progress: 100,
    createDate: '2024-03-05',
    deadline: '2024-03-15'
  }
])

// 设计列表
const designList = ref([
  { id: 1, name: '机械臂结构设计', type: '机械设计' },
  { id: 2, name: '控制系统电路图', type: '电气设计' },
  { id: 3, name: '生产管理软件界面', type: '软件设计' },
  { id: 4, name: '仓储系统架构图', type: '结构设计' }
])

// 评审人列表
const reviewerList = ref([
  { id: 1, name: '张工' },
  { id: 2, name: '李工' },
  { id: 3, name: '王工' },
  { id: 4, name: '赵工' },
  { id: 5, name: '刘工' },
  { id: 6, name: '陈工' },
  { id: 7, name: '周工' }
])

// 评审意见
const reviewComments = ref([
  {
    id: 1,
    reviewer: '李工',
    type: 'suggestion',
    content: '设计整体合理，但建议加强机械臂的负载能力计算。',
    timestamp: '2024-03-11 10:30:00',
    canModify: false
  },
  {
    id: 2,
    reviewer: '王工',
    type: 'approval',
    content: '结构设计符合要求，通过评审。',
    timestamp: '2024-03-11 14:20:00',
    canModify: false
  }
])

// 评审历史
const reviewHistory = ref([
  {
    id: 1,
    user: '张三',
    action: 'create',
    comment: '发起机械臂结构设计评审',
    timestamp: '2024-03-10 09:00:00'
  },
  {
    id: 2,
    user: '李工',
    action: 'review',
    comment: '提交评审意见',
    timestamp: '2024-03-11 10:30:00'
  },
  {
    id: 3,
    user: '王工',
    action: 'review',
    comment: '完成评审',
    timestamp: '2024-03-11 14:20:00'
  }
])

// 状态类型映射
const getStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    in_review: 'primary',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info'
  }
  return typeMap[status] || 'info'
}

// 状态文本映射
const getStatusText = (status) => {
  const textMap = {
    pending: '待评审',
    in_review: '评审中',
    approved: '已通过',
    rejected: '已驳回',
    cancelled: '已取消'
  }
  return textMap[status] || status
}

// 优先级类型映射
const getPriorityType = (priority) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[priority] || 'info'
}

// 优先级文本映射
const getPriorityText = (priority) => {
  const textMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || priority
}

// 进度颜色
const getProgressColor = (progress) => {
  if (progress < 30) return '#F56C6C'
  if (progress < 70) return '#E6A23C'
  return '#67C23A'
}

// 意见类型映射
const getCommentType = (type) => {
  const typeMap = {
    approval: 'success',
    suggestion: 'warning',
    issue: 'danger',
    question: 'info'
  }
  return typeMap[type] || 'info'
}

const getCommentTypeText = (type) => {
  const textMap = {
    approval: '同意',
    suggestion: '建议',
    issue: '问题',
    question: '疑问'
  }
  return textMap[type] || type
}

// 历史记录类型
const getHistoryType = (action) => {
  const typeMap = {
    create: 'primary',
    review: 'success',
    approve: 'success',
    reject: 'danger',
    cancel: 'info'
  }
  return typeMap[action] || 'info'
}

const getHistoryText = (action) => {
  const textMap = {
    create: '发起了评审',
    review: '提交了评审意见',
    approve: '通过了评审',
    reject: '驳回了评审',
    cancel: '取消了评审'
  }
  return textMap[action] || action
}

// 权限判断
const canReview = (row) => {
  return ['pending', 'in_review'].includes(row.status)
}

const canEdit = (row) => {
  return row.status === 'pending'
}

const canCancel = (row) => {
  return ['pending', 'in_review'].includes(row.status)
}

// 事件处理函数
const handleCreateReview = () => {
  dialogTitle.value = '发起评审'
  reviewForm.reviewCode = 'REV' + String(Date.now()).slice(-3)
  dialogVisible.value = true
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
  selectedReviews.value = selection
}

const handleView = (row) => {
  currentReview.value = row
  detailVisible.value = true
}

const handleReview = (row) => {
  currentReview.value = row
  reviewFormVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑评审'
  Object.keys(reviewForm).forEach(key => {
    reviewForm[key] = row[key] || ''
  })
  dialogVisible.value = true
}

const handleCancel = (row) => {
  ElMessageBox.confirm(`确定取消评审"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('取消成功')
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleBatchApprove = () => {
  ElMessageBox.confirm(`确定通过选中的 ${selectedReviews.value.length} 个评审吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量通过成功')
    selectedReviews.value = []
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleBatchReject = () => {
  ElMessageBox.confirm(`确定驳回选中的 ${selectedReviews.value.length} 个评审吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量驳回成功')
    selectedReviews.value = []
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

const handleSubmit = () => {
  reviewFormRef.value.validate((valid) => {
    if (valid) {
      dialogVisible.value = false
      ElMessage.success('评审发起成功')
      // 重置表单
      Object.keys(reviewForm).forEach(key => {
        if (Array.isArray(reviewForm[key])) {
          reviewForm[key] = []
        } else {
          reviewForm[key] = ''
        }
      })
    }
  })
}

const handleDialogClose = () => {
  reviewFormRef.value?.resetFields()
  // 重置表单
  Object.keys(reviewForm).forEach(key => {
    if (Array.isArray(reviewForm[key])) {
      reviewForm[key] = []
    } else {
      reviewForm[key] = ''
    }
  })
}

const handleDetailClose = () => {
  currentReview.value = null
  activeTab.value = 'comments'
}

const handleAddComment = () => {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评审意见')
    return
  }
  
  reviewComments.value.push({
    id: Date.now(),
    reviewer: '当前用户',
    type: 'suggestion',
    content: newComment.value,
    timestamp: new Date().toLocaleString(),
    canModify: true
  })
  
  newComment.value = ''
  ElMessage.success('意见提交成功')
}

const handleEditComment = (comment) => {
  ElMessage.info('编辑功能开发中...')
}

const handleDeleteComment = (comment) => {
  ElMessageBox.confirm('确定删除这条评审意见吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = reviewComments.value.findIndex(c => c.id === comment.id)
    if (index > -1) {
      reviewComments.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleReviewSubmit = () => {
  reviewSubmitFormRef.value.validate((valid) => {
    if (valid) {
      reviewFormVisible.value = false
      ElMessage.success('评审意见提交成功')
      // 重置表单
      Object.keys(reviewSubmitForm).forEach(key => {
        reviewSubmitForm[key] = ''
      })
    }
  })
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
}

const handleCurrentChange = (page) => {
  pagination.currentPage = page
}

onMounted(() => {
  pagination.total = reviewList.value.length
})
</script>

<style scoped>
.design-review {
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

.review-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-tabs {
  margin-top: 30px;
}

.comments-section {
  padding: 20px 0;
}

.comment-input {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.comment-list {
  max-height: 400px;
  overflow-y: auto;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.comment-actions {
  margin-top: 10px;
  text-align: right;
}

.files-section,
.history-section {
  min-height: 300px;
  padding: 20px 0;
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