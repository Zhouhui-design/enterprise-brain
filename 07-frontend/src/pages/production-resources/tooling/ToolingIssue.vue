<template>
  <div class="tooling-issue">
    <div class="header">
      <h1>工装领用</h1>
      <div class="actions">
        <el-button type="primary" @click="handleCreateIssue">新建领用申请</el-button>
        <el-button @click="handleBatchExport">批量导出</el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="申请编号/工装名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入编号或名称" 
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已领用" value="issued" />
            <el-option label="已归还" value="returned" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input 
            v-model="searchForm.applicant" 
            placeholder="请输入申请人姓名" 
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="申请日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon primary">
          <ClipboardCheck />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalIssues }}</div>
          <div class="stat-label">申请总数</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <Clock />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingIssues }}</div>
          <div class="stat-label">待审批</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info">
          <Box />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ issuedIssues }}</div>
          <div class="stat-label">已领用</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <CheckCircle />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ returnedIssues }}</div>
          <div class="stat-label">已归还</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
    </div>

    <!-- 数据列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>领用申请列表</h3>
        <div class="table-actions">
          <el-select v-model="viewMode" placeholder="显示模式">
            <el-option label="表格视图" value="table" />
            <el-option label="卡片视图" value="card" />
          </el-select>
        </div>
      </div>

      <!-- 表格视图 -->
      <el-table 
        v-if="viewMode === 'table'"
        :data="paginatedIssues" 
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSort"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="issueCode" label="申请编号" width="150" sortable />
        <el-table-column prop="toolingName" label="工装名称" width="150" />
        <el-table-column prop="applicant" label="申请人" width="100" sortable />
        <el-table-column prop="department" label="所属部门" width="120" />
        <el-table-column prop="applyDate" label="申请日期" width="120" sortable />
        <el-table-column prop="expectedReturnDate" label="预计归还日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approver" label="审批人" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleViewIssue(scope.row)">查看</el-button>
            <template v-if="scope.row.status === 'pending'">
              <el-button link @click="handleEditIssue(scope.row)">编辑</el-button>
              <el-button link type="danger" @click="handleDeleteIssue(scope.row)">删除</el-button>
            </template>
            <el-button link type="success" @click="handleApproveIssue(scope.row)" v-if="scope.row.status === 'pending' && canApprove">审批</el-button>
            <el-button link type="primary" @click="handleIssueTooling(scope.row)" v-if="scope.row.status === 'approved'">发放</el-button>
            <el-button link type="success" @click="handleConfirmReturn(scope.row)" v-if="scope.row.status === 'issued'">确认归还</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="issue-list">
        <el-card 
          v-for="issue in paginatedIssues" 
          :key="issue.id"
          class="issue-item"
          shadow="hover"
          :class="`status-${issue.status}`"
        >
          <div class="issue-item-header">
            <div class="item-info">
              <h4>{{ issue.toolingName }}</h4>
              <span class="issue-code">{{ issue.issueCode }}</span>
            </div>
            <el-tag :type="getStatusType(issue.status)">{{ getStatusText(issue.status) }}</el-tag>
          </div>
          <div class="issue-item-content">
            <div class="info-row">
              <span class="label">申请人:</span>
              <span class="value">{{ issue.applicant }}</span>
            </div>
            <div class="info-row">
              <span class="label">所属部门:</span>
              <span class="value">{{ issue.department }}</span>
            </div>
            <div class="info-row">
              <span class="label">申请日期:</span>
              <span class="value">{{ issue.applyDate }}</span>
            </div>
            <div class="info-row">
              <span class="label">预计归还:</span>
              <span class="value">{{ issue.expectedReturnDate }}</span>
            </div>
            <div v-if="issue.purpose" class="info-row">
              <span class="label">用途说明:</span>
              <span class="value">{{ issue.purpose }}</span>
            </div>
          </div>
          <div class="issue-item-actions">
            <el-button size="small" @click="handleViewIssue(issue)">详情</el-button>
            <template v-if="issue.status === 'pending'">
              <el-button size="small" @click="handleEditIssue(issue)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteIssue(issue)">删除</el-button>
              <el-button size="small" type="success" @click="handleApproveIssue(issue)" v-if="canApprove">审批</el-button>
            </template>
            <el-button size="small" type="primary" @click="handleIssueTooling(issue)" v-if="issue.status === 'approved'">发放</el-button>
            <el-button size="small" type="success" @click="handleConfirmReturn(issue)" v-if="issue.status === 'issued'">确认归还</el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredIssues.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新建/编辑申请对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新建领用申请' : '编辑领用申请'"
      width="700px"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="申请编号" prop="issueCode">
              <el-input v-model="formData.issueCode" placeholder="自动生成" disabled />
            </el-form-item>
            <el-form-item label="工装信息" prop="toolingId">
              <el-select v-model="formData.toolingId" placeholder="请选择工装" filterable>
                <el-option 
                  v-for="tooling in availableToolings" 
                  :key="tooling.id" 
                  :label="`${tooling.code} - ${tooling.name}`" 
                  :value="tooling.id" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="申请人" prop="applicant">
              <el-input v-model="formData.applicant" placeholder="请输入申请人姓名" />
            </el-form-item>
            <el-form-item label="所属部门" prop="department">
              <el-input v-model="formData.department" placeholder="请输入所属部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="申请日期" prop="applyDate">
              <el-date-picker 
                v-model="formData.applyDate" 
                type="date" 
                placeholder="选择申请日期" 
                style="width: 100%;" 
              />
            </el-form-item>
            <el-form-item label="预计归还日期" prop="expectedReturnDate">
              <el-date-picker 
                v-model="formData.expectedReturnDate" 
                type="date" 
                placeholder="选择预计归还日期" 
                style="width: 100%;" 
              />
            </el-form-item>
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item label="申请数量" prop="quantity">
              <el-input v-model.number="formData.quantity" placeholder="请输入申请数量" min="1" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="用途说明" prop="purpose">
          <el-input v-model="formData.purpose" type="textarea" :rows="3" placeholder="请输入用途说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看申请详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`领用申请详情 - ${selectedIssue?.toolingName || ''}`"
      width="700px"
    >
      <div v-if="selectedIssue" class="issue-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请编号">{{ selectedIssue.issueCode }}</el-descriptions-item>
          <el-descriptions-item label="工装名称">{{ selectedIssue.toolingName }}</el-descriptions-item>
          <el-descriptions-item label="工装编号">{{ selectedIssue.toolingCode }}</el-descriptions-item>
          <el-descriptions-item label="申请人">{{ selectedIssue.applicant }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ selectedIssue.department }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedIssue.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="申请数量">{{ selectedIssue.quantity }}</el-descriptions-item>
          <el-descriptions-item label="申请日期">{{ selectedIssue.applyDate }}</el-descriptions-item>
          <el-descriptions-item label="预计归还日期">{{ selectedIssue.expectedReturnDate }}</el-descriptions-item>
          <el-descriptions-item label="实际归还日期">{{ selectedIssue.actualReturnDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedIssue.status)">{{ getStatusText(selectedIssue.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审批人">{{ selectedIssue.approver || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批日期">{{ selectedIssue.approveDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发放人">{{ selectedIssue.issuer || '-' }}</el-descriptions-item>
          <el-descriptions-item label="发放日期">{{ selectedIssue.issueDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="归还确认人">{{ selectedIssue.returnConfirmBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="用途说明" :span="2">{{ selectedIssue.purpose || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批意见" :span="2">{{ selectedIssue.approvalComments || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 操作记录 -->
        <div v-if="selectedIssue.operationRecords && selectedIssue.operationRecords.length > 0" class="operation-records">
          <h3>操作记录</h3>
          <el-timeline>
            <el-timeline-item 
              v-for="(record, index) in selectedIssue.operationRecords" 
              :key="index"
              :timestamp="record.time"
              :type="record.type"
              :icon="getTimelineIcon(record.event)"
            >
              <div class="timeline-content">
                <h4>{{ record.event }}</h4>
                <p v-if="record.operator">操作人: {{ record.operator }}</p>
                <p v-if="record.details">{{ record.details }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalDialogVisible"
      title="审批申请"
      width="600px"
    >
      <div v-if="selectedIssue" class="approval-form">
        <div class="approval-info">
          <p><strong>申请编号:</strong> {{ selectedIssue.issueCode }}</p>
          <p><strong>工装名称:</strong> {{ selectedIssue.toolingName }}</p>
          <p><strong>申请人:</strong> {{ selectedIssue.applicant }}</p>
          <p><strong>申请数量:</strong> {{ selectedIssue.quantity }}</p>
          <p><strong>用途说明:</strong> {{ selectedIssue.purpose || '-' }}</p>
        </div>
        <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef" label-width="80px" style="margin-top: 20px;">
          <el-form-item label="审批结果" prop="result">
            <el-radio-group v-model="approvalForm.result">
              <el-radio label="approved">批准</el-radio>
              <el-radio label="rejected">驳回</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审批意见" prop="comments">
            <el-input v-model="approvalForm.comments" type="textarea" :rows="3" placeholder="请输入审批意见" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitApproval">提交审批</el-button>
      </template>
    </el-dialog>

    <!-- 发放对话框 -->
    <el-dialog
      v-model="issueDialogVisible"
      title="发放工装"
      width="600px"
    >
      <div v-if="selectedIssue" class="issue-form">
        <div class="issue-info">
          <p><strong>申请编号:</strong> {{ selectedIssue.issueCode }}</p>
          <p><strong>工装名称:</strong> {{ selectedIssue.toolingName }}</p>
          <p><strong>申请人:</strong> {{ selectedIssue.applicant }}</p>
          <p><strong>申请数量:</strong> {{ selectedIssue.quantity }}</p>
        </div>
        <el-form :model="issueForm" :rules="issueRules" ref="issueFormRef" label-width="80px" style="margin-top: 20px;">
          <el-form-item label="发放数量" prop="issuedQuantity">
            <el-input v-model.number="issueForm.issuedQuantity" placeholder="请输入实际发放数量" min="1" :max="selectedIssue.quantity" />
          </el-form-item>
          <el-form-item label="发放人" prop="issuer">
            <el-input v-model="issueForm.issuer" placeholder="请输入发放人姓名" />
          </el-form-item>
          <el-form-item label="发放备注" prop="issueNotes">
            <el-input v-model="issueForm.issueNotes" type="textarea" :rows="3" placeholder="请输入发放备注" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="issueDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitIssue">确认发放</el-button>
      </template>
    </el-dialog>

    <!-- 确认归还对话框 -->
    <el-dialog
      v-model="returnDialogVisible"
      title="确认归还"
      width="600px"
    >
      <div v-if="selectedIssue" class="return-form">
        <div class="return-info">
          <p><strong>申请编号:</strong> {{ selectedIssue.issueCode }}</p>
          <p><strong>工装名称:</strong> {{ selectedIssue.toolingName }}</p>
          <p><strong>申请人:</strong> {{ selectedIssue.applicant }}</p>
          <p><strong>发放数量:</strong> {{ selectedIssue.issuedQuantity }}</p>
        </div>
        <el-form :model="returnForm" :rules="returnRules" ref="returnFormRef" label-width="80px" style="margin-top: 20px;">
          <el-form-item label="归还数量" prop="returnedQuantity">
            <el-input v-model.number="returnForm.returnedQuantity" placeholder="请输入实际归还数量" min="1" :max="selectedIssue.issuedQuantity" />
          </el-form-item>
          <el-form-item label="归还日期" prop="returnDate">
            <el-date-picker 
              v-model="returnForm.returnDate" 
              type="date" 
              placeholder="选择归还日期" 
              style="width: 100%;" 
            />
          </el-form-item>
          <el-form-item label="归还状态" prop="condition">
            <el-select v-model="returnForm.condition" placeholder="请选择归还状态">
              <el-option label="完好" value="good" />
              <el-option label="轻微损坏" value="slight_damage" />
              <el-option label="严重损坏" value="serious_damage" />
            </el-select>
          </el-form-item>
          <el-form-item label="归还备注" prop="returnNotes">
            <el-input v-model="returnForm.returnNotes" type="textarea" :rows="3" placeholder="请输入归还备注" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="returnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitReturn">确认归还</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ClipboardCheck, Clock, Box, CheckCircle, Refresh, Edit, Delete, Check, Close, InfoFilled, WarningFilled, SuccessFilled, CircleCheck, No } from '@element-plus/icons-vue'

// 响应式数据
const issues = ref([])
const loading = ref(false)
const searchForm = reactive({
  keyword: '',
  status: '',
  applicant: '',
  dateRange: []
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const viewMode = ref('table')
const selectedRows = ref([])

// 当前用户权限
const canApprove = ref(true) // 模拟当前用户有审批权限

// 对话框相关
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const approvalDialogVisible = ref(false)
const issueDialogVisible = ref(false)
const returnDialogVisible = ref(false)
const dialogType = ref('add')
const selectedIssue = ref(null)
const formRef = ref(null)
const approvalFormRef = ref(null)
const issueFormRef = ref(null)
const returnFormRef = ref(null)

// 表单数据
const formData = reactive({
  issueCode: '',
  toolingId: '',
  toolingName: '',
  toolingCode: '',
  applicant: '',
  department: '',
  contactPhone: '',
  quantity: 1,
  applyDate: '',
  expectedReturnDate: '',
  purpose: ''
})

// 审批表单
const approvalForm = reactive({
  result: 'approved',
  comments: ''
})

// 发放表单
const issueForm = reactive({
  issuedQuantity: 0,
  issuer: '',
  issueNotes: ''
})

// 归还表单
const returnForm = reactive({
  returnedQuantity: 0,
  returnDate: '',
  condition: 'good',
  returnNotes: ''
})

// 表单验证规则
const formRules = reactive({
  toolingId: [{ required: true, message: '请选择工装', trigger: 'change' }],
  applicant: [{ required: true, message: '请输入申请人姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请输入所属部门', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入申请数量', trigger: 'blur' }],
  applyDate: [{ required: true, message: '请选择申请日期', trigger: 'change' }],
  expectedReturnDate: [{ required: true, message: '请选择预计归还日期', trigger: 'change' }]
})

const approvalRules = reactive({
  result: [{ required: true, message: '请选择审批结果', trigger: 'change' }],
  comments: [{ required: true, message: '请输入审批意见', trigger: 'blur' }]
})

const issueRules = reactive({
  issuedQuantity: [{ required: true, message: '请输入发放数量', trigger: 'blur' }],
  issuer: [{ required: true, message: '请输入发放人姓名', trigger: 'blur' }]
})

const returnRules = reactive({
  returnedQuantity: [{ required: true, message: '请输入归还数量', trigger: 'blur' }],
  returnDate: [{ required: true, message: '请选择归还日期', trigger: 'change' }],
  condition: [{ required: true, message: '请选择归还状态', trigger: 'change' }]
})

// 可用工装（模拟数据）
const availableToolings = ref([
  { id: 1, code: 'T001', name: '数控车床夹具', quantity: 10 },
  { id: 2, code: 'T002', name: '铣床刀具套装', quantity: 5 },
  { id: 3, code: 'T003', name: '液压虎钳', quantity: 8 },
  { id: 4, code: 'T004', name: '测量卡尺', quantity: 20 },
  { id: 5, code: 'T005', name: '扭矩扳手', quantity: 15 },
  { id: 6, code: 'T006', name: '抛光工具套装', quantity: 7 },
  { id: 7, code: 'T007', name: '焊接工装', quantity: 4 },
  { id: 8, code: 'T008', name: '组装治具', quantity: 12 },
  { id: 9, code: 'T009', name: '喷涂夹具', quantity: 6 },
  { id: 10, code: 'T010', name: '检测平台', quantity: 3 }
])

// 计算属性
const filteredIssues = computed(() => {
  return issues.value.filter(issue => {
    // 关键词搜索
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      if (!issue.toolingName.toLowerCase().includes(keyword) && 
          !issue.issueCode.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 状态筛选
    if (searchForm.status && issue.status !== searchForm.status) {
      return false
    }
    
    // 申请人筛选
    if (searchForm.applicant && !issue.applicant.toLowerCase().includes(searchForm.applicant.toLowerCase())) {
      return false
    }
    
    // 日期范围筛选
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const startDate = new Date(searchForm.dateRange[0])
      const endDate = new Date(searchForm.dateRange[1])
      const applyDate = new Date(issue.applyDate)
      
      if (applyDate < startDate || applyDate > endDate) {
        return false
      }
    }
    
    return true
  })
})

const paginatedIssues = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredIssues.value.slice(startIndex, endIndex)
})

// 统计数据
const totalIssues = computed(() => issues.value.length)
const pendingIssues = computed(() => 
  issues.value.filter(issue => issue.status === 'pending').length
)
const issuedIssues = computed(() => 
  issues.value.filter(issue => issue.status === 'issued').length
)
const returnedIssues = computed(() => 
  issues.value.filter(issue => issue.status === 'returned').length
)

// 生命周期钩子
onMounted(() => {
  loadIssues()
})

// 辅助函数
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const generateIssueCode = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `ISS${year}${month}${day}${random}`
}

// 状态映射
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'primary',
    rejected: 'danger',
    issued: 'info',
    returned: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已驳回',
    issued: '已领用',
    returned: '已归还'
  }
  return texts[status] || '未知'
}

const getTimelineIcon = (event) => {
  const icons = {
    '提交申请': InfoFilled,
    '审批通过': SuccessFilled,
    '审批驳回': WarningFilled,
    '发放工装': CircleCheck,
    '确认归还': CheckCircle
  }
  return icons[event] || InfoFilled
}

// 搜索和重置
const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    applicant: '',
    dateRange: []
  })
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 排序处理
const handleSort = (sort) => {
  // 排序逻辑可以在这里实现
  console.log('Sort:', sort)
}

// 多选处理
const handleSelectionChange = (val) => {
  selectedRows.value = val
}

// 加载数据
const loadIssues = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    issues.value = [
      {
        id: 1,
        issueCode: 'ISS240115001',
        toolingId: 1,
        toolingCode: 'T001',
        toolingName: '数控车床夹具',
        applicant: '张三',
        department: '机械加工车间',
        contactPhone: '13800138001',
        quantity: 2,
        issuedQuantity: 2,
        applyDate: '2024-01-15',
        expectedReturnDate: '2024-01-20',
        actualReturnDate: '2024-01-19',
        status: 'returned',
        approver: '李四',
        approveDate: '2024-01-15',
        issuer: '王五',
        issueDate: '2024-01-15',
        returnConfirmBy: '赵六',
        purpose: '用于新产品加工测试',
        approvalComments: '同意领用',
        createdAt: '2024-01-15T09:00:00',
        operationRecords: [
          {
            time: '2024-01-15T09:00:00',
            event: '提交申请',
            type: 'primary',
            operator: '张三',
            details: '申请数控车床夹具2个'
          },
          {
            time: '2024-01-15T10:30:00',
            event: '审批通过',
            type: 'success',
            operator: '李四',
            details: '审批意见: 同意领用'
          },
          {
            time: '2024-01-15T14:00:00',
            event: '发放工装',
            type: 'info',
            operator: '王五',
            details: '发放数控车床夹具2个'
          },
          {
            time: '2024-01-19T16:30:00',
            event: '确认归还',
            type: 'success',
            operator: '赵六',
            details: '归还状态: 完好'
          }
        ]
      },
      {
        id: 2,
        issueCode: 'ISS240116002',
        toolingId: 2,
        toolingCode: 'T002',
        toolingName: '铣床刀具套装',
        applicant: '李四',
        department: '精密加工车间',
        contactPhone: '13800138002',
        quantity: 1,
        issuedQuantity: 1,
        applyDate: '2024-01-16',
        expectedReturnDate: '2024-01-25',
        actualReturnDate: null,
        status: 'issued',
        approver: '王五',
        approveDate: '2024-01-16',
        issuer: '赵六',
        issueDate: '2024-01-16',
        returnConfirmBy: null,
        purpose: '精密零件加工',
        approvalComments: '同意领用',
        createdAt: '2024-01-16T11:20:00',
        operationRecords: [
          {
            time: '2024-01-16T11:20:00',
            event: '提交申请',
            type: 'primary',
            operator: '李四',
            details: '申请铣床刀具套装1套'
          },
          {
            time: '2024-01-16T13:45:00',
            event: '审批通过',
            type: 'success',
            operator: '王五',
            details: '审批意见: 同意领用'
          },
          {
            time: '2024-01-16T15:30:00',
            event: '发放工装',
            type: 'info',
            operator: '赵六',
            details: '发放铣床刀具套装1套'
          }
        ]
      },
      {
        id: 3,
        issueCode: 'ISS240117003',
        toolingId: 3,
        toolingCode: 'T003',
        toolingName: '液压虎钳',
        applicant: '王五',
        department: '模具车间',
        contactPhone: '13800138003',
        quantity: 3,
        issuedQuantity: 0,
        applyDate: '2024-01-17',
        expectedReturnDate: '2024-01-22',
        actualReturnDate: null,
        status: 'approved',
        approver: '赵六',
        approveDate: '2024-01-17',
        issuer: null,
        issueDate: null,
        returnConfirmBy: null,
        purpose: '模具加工固定',
        approvalComments: '同意领用',
        createdAt: '2024-01-17T08:30:00',
        operationRecords: [
          {
            time: '2024-01-17T08:30:00',
            event: '提交申请',
            type: 'primary',
            operator: '王五',
            details: '申请液压虎钳3个'
          },
          {
            time: '2024-01-17T09:15:00',
            event: '审批通过',
            type: 'success',
            operator: '赵六',
            details: '审批意见: 同意领用'
          }
        ]
      },
      {
        id: 4,
        issueCode: 'ISS240118004',
        toolingId: 4,
        toolingCode: 'T004',
        toolingName: '测量卡尺',
        applicant: '赵六',
        department: '质量检测部',
        contactPhone: '13800138004',
        quantity: 5,
        issuedQuantity: 0,
        applyDate: '2024-01-18',
        expectedReturnDate: '2024-01-23',
        actualReturnDate: null,
        status: 'pending',
        approver: null,
        approveDate: null,
        issuer: null,
        issueDate: null,
        returnConfirmBy: null,
        purpose: '新产品质检',
        approvalComments: null,
        createdAt: '2024-01-18T14:20:00',
        operationRecords: [
          {
            time: '2024-01-18T14:20:00',
            event: '提交申请',
            type: 'primary',
            operator: '赵六',
            details: '申请测量卡尺5个'
          }
        ]
      },
      {
        id: 5,
        issueCode: 'ISS240119005',
        toolingId: 5,
        toolingCode: 'T005',
        toolingName: '扭矩扳手',
        applicant: '孙七',
        department: '装配车间',
        contactPhone: '13800138005',
        quantity: 4,
        issuedQuantity: 0,
        applyDate: '2024-01-19',
        expectedReturnDate: '2024-01-26',
        actualReturnDate: null,
        status: 'rejected',
        approver: '周八',
        approveDate: '2024-01-19',
        issuer: null,
        issueDate: null,
        returnConfirmBy: null,
        purpose: '设备装配',
        approvalComments: '申请数量过多，建议减少至2个',
        createdAt: '2024-01-19T10:15:00',
        operationRecords: [
          {
            time: '2024-01-19T10:15:00',
            event: '提交申请',
            type: 'primary',
            operator: '孙七',
            details: '申请扭矩扳手4个'
          },
          {
            time: '2024-01-19T11:30:00',
            event: '审批驳回',
            type: 'warning',
            operator: '周八',
            details: '审批意见: 申请数量过多，建议减少至2个'
          }
        ]
      }
    ]
    loading.value = false
  }, 500)
}

// 刷新数据
const handleRefresh = () => {
  loadIssues()
}

// 查看申请
const handleViewIssue = (issue) => {
  selectedIssue.value = { ...issue }
  detailDialogVisible.value = true
}

// 新建申请
const handleCreateIssue = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    issueCode: generateIssueCode(),
    toolingId: '',
    toolingName: '',
    toolingCode: '',
    applicant: '',
    department: '',
    contactPhone: '',
    quantity: 1,
    applyDate: formatDate(new Date()),
    expectedReturnDate: '',
    purpose: ''
  })
  dialogVisible.value = true
}

// 编辑申请
const handleEditIssue = (issue) => {
  dialogType.value = 'edit'
  selectedIssue.value = { ...issue }
  Object.assign(formData, {
    issueCode: issue.issueCode,
    toolingId: issue.toolingId,
    toolingName: issue.toolingName,
    toolingCode: issue.toolingCode,
    applicant: issue.applicant,
    department: issue.department,
    contactPhone: issue.contactPhone,
    quantity: issue.quantity,
    applyDate: issue.applyDate,
    expectedReturnDate: issue.expectedReturnDate,
    purpose: issue.purpose
  })
  dialogVisible.value = true
}

// 删除申请
const handleDeleteIssue = (issue) => {
  ElMessageBox.confirm(
    `确定要删除申请 ${issue.issueCode} 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(() => {
    const index = issues.value.findIndex(i => i.id === issue.id)
    if (index !== -1) {
      issues.value.splice(index, 1)
      ElMessage.success('申请已删除')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    // 查找工装信息
    const selectedTooling = availableToolings.value.find(t => t.id === formData.toolingId)
    if (selectedTooling) {
      formData.toolingName = selectedTooling.name
      formData.toolingCode = selectedTooling.code
    }
    
    if (dialogType.value === 'add') {
      // 新增记录
      const newIssue = {
        id: Date.now(),
        ...formData,
        status: 'pending',
        issuedQuantity: 0,
        actualReturnDate: null,
        approver: null,
        approveDate: null,
        issuer: null,
        issueDate: null,
        returnConfirmBy: null,
        approvalComments: null,
        createdAt: new Date().toISOString(),
        operationRecords: [
          {
            time: new Date().toISOString(),
            event: '提交申请',
            type: 'primary',
            operator: formData.applicant,
            details: `申请${formData.toolingName}${formData.quantity}个`
          }
        ]
      }
      issues.value.unshift(newIssue)
      ElMessage.success('申请创建成功')
    } else {
      // 更新记录
      const index = issues.value.findIndex(i => i.id === selectedIssue.value.id)
      if (index !== -1) {
        issues.value[index] = {
          ...issues.value[index],
          ...formData
        }
        ElMessage.success('申请更新成功')
      }
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 审批申请
const handleApproveIssue = (issue) => {
  selectedIssue.value = { ...issue }
  Object.assign(approvalForm, {
    result: 'approved',
    comments: ''
  })
  approvalDialogVisible.value = true
}

// 提交审批
const handleSubmitApproval = async () => {
  try {
    await approvalFormRef.value.validate()
    
    const index = issues.value.findIndex(i => i.id === selectedIssue.value.id)
    if (index !== -1) {
      // 更新状态和审批信息
      issues.value[index].status = approvalForm.result
      issues.value[index].approver = '当前用户' // 模拟当前用户
      issues.value[index].approveDate = formatDate(new Date())
      issues.value[index].approvalComments = approvalForm.comments
      
      // 添加操作记录
      issues.value[index].operationRecords.push({
        time: new Date().toISOString(),
        event: approvalForm.result === 'approved' ? '审批通过' : '审批驳回',
        type: approvalForm.result === 'approved' ? 'success' : 'warning',
        operator: '当前用户', // 模拟当前用户
        details: `审批意见: ${approvalForm.comments}`
      })
      
      ElMessage.success(`申请已${approvalForm.result === 'approved' ? '批准' : '驳回'}`)
    }
    
    approvalDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 发放工装
const handleIssueTooling = (issue) => {
  selectedIssue.value = { ...issue }
  Object.assign(issueForm, {
    issuedQuantity: issue.quantity,
    issuer: '',
    issueNotes: ''
  })
  issueDialogVisible.value = true
}

// 提交发放
const handleSubmitIssue = async () => {
  try {
    await issueFormRef.value.validate()
    
    const index = issues.value.findIndex(i => i.id === selectedIssue.value.id)
    if (index !== -1) {
      // 更新状态和发放信息
      issues.value[index].status = 'issued'
      issues.value[index].issuedQuantity = issueForm.issuedQuantity
      issues.value[index].issuer = issueForm.issuer
      issues.value[index].issueDate = formatDate(new Date())
      
      // 添加操作记录
      issues.value[index].operationRecords.push({
        time: new Date().toISOString(),
        event: '发放工装',
        type: 'info',
        operator: issueForm.issuer,
        details: `发放${selectedIssue.value.toolingName}${issueForm.issuedQuantity}个${issueForm.issueNotes ? '，' + issueForm.issueNotes : ''}`
      })
      
      ElMessage.success('工装发放成功')
    }
    
    issueDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 确认归还
const handleConfirmReturn = (issue) => {
  selectedIssue.value = { ...issue }
  Object.assign(returnForm, {
    returnedQuantity: issue.issuedQuantity,
    returnDate: formatDate(new Date()),
    condition: 'good',
    returnNotes: ''
  })
  returnDialogVisible.value = true
}

// 提交归还
const handleSubmitReturn = async () => {
  try {
    await returnFormRef.value.validate()
    
    const index = issues.value.findIndex(i => i.id === selectedIssue.value.id)
    if (index !== -1) {
      // 更新状态和归还信息
      issues.value[index].status = 'returned'
      issues.value[index].actualReturnDate = returnForm.returnDate
      issues.value[index].returnConfirmBy = '当前用户' // 模拟当前用户
      
      // 添加操作记录
      issues.value[index].operationRecords.push({
        time: new Date().toISOString(),
        event: '确认归还',
        type: 'success',
        operator: '当前用户', // 模拟当前用户
        details: `归还状态: ${returnForm.condition === 'good' ? '完好' : returnForm.condition === 'slight_damage' ? '轻微损坏' : '严重损坏'}${returnForm.returnNotes ? '，' + returnForm.returnNotes : ''}`
      })
      
      ElMessage.success('归还确认成功')
    }
    
    returnDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 批量导出
const handleBatchExport = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的记录')
    return
  }
  ElMessage.success('批量导出功能已触发')
}
</script>

<style scoped>
.tooling-issue {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28px;
  margin-right: 20px;
  color: white;
}

.stat-icon.primary {
  background-color: #409EFF;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.info {
  background-color: #909399;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-unit {
  font-size: 16px;
  color: #909399;
  margin-left: 5px;
  font-weight: normal;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  margin: 0;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 卡片视图样式 */
.issue-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.issue-item {
  height: 100%;
  transition: all 0.3s;
}

.issue-item.status-pending:hover {
  border-color: #E6A23C;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
}

.issue-item.status-approved:hover {
  border-color: #409EFF;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.issue-item.status-rejected:hover {
  border-color: #F56C6C;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
}

.issue-item.status-issued:hover {
  border-color: #909399;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.2);
}

.issue-item.status-returned:hover {
  border-color: #67C23A;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
}

.issue-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.item-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.issue-code {
  color: #909399;
  font-size: 14px;
}

.issue-item-content {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row .label {
  width: 80px;
  color: #909399;
}

.info-row .value {
  flex: 1;
  color: #303133;
}

.issue-item-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 详情页样式 */
.issue-detail {
  padding: 10px 0;
}

.operation-records {
  margin-top: 30px;
}

.operation-records h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.timeline-content h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.timeline-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 审批、发放、归还表单样式 */
.approval-info,
.issue-info,
.return-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.approval-info p,
.issue-info p,
.return-info p {
  margin: 5px 0;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .issue-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .info-row {
    flex-direction: column;
  }
  
  .info-row .label {
    width: auto;
  }
}
</style>