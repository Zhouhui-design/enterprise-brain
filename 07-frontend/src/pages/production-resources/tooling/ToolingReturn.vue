<template>
  <div class="tooling-return">
    <div class="header">
      <h1>工装归还</h1>
      <div class="actions">
        <el-button type="primary" @click="handleManualReturn">手动归还</el-button>
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
        <el-form-item label="归还编号/工装名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入编号或名称" 
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="归还状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待归还" value="pending" />
            <el-option label="已归还" value="returned" />
            <el-option label="逾期归还" value="overdue" />
            <el-option label="异常" value="abnormal" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用人">
          <el-input 
            v-model="searchForm.user" 
            placeholder="请输入使用人姓名" 
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="归还日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item label="归还状态">
          <el-select v-model="searchForm.condition" placeholder="全部状态" clearable>
            <el-option label="完好" value="good" />
            <el-option label="轻微损坏" value="slight_damage" />
            <el-option label="严重损坏" value="serious_damage" />
            <el-option label="丢失" value="lost" />
          </el-select>
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
          <div class="stat-value">{{ totalReturns }}</div>
          <div class="stat-label">归还总数</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <Clock />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingReturns }}</div>
          <div class="stat-label">待归还</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">
          <Warning />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ overdueReturns }}</div>
          <div class="stat-label">逾期归还</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <CheckCircle />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ normalReturns }}</div>
          <div class="stat-label">正常归还</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info">
          <AlertCircle />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ abnormalReturns }}</div>
          <div class="stat-label">异常归还</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
    </div>

    <!-- 数据列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>归还记录列表</h3>
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
        :data="paginatedReturns" 
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSort"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="returnCode" label="归还编号" width="150" sortable />
        <el-table-column prop="issueCode" label="申请编号" width="150" />
        <el-table-column prop="toolingName" label="工装名称" width="150" />
        <el-table-column prop="toolingCode" label="工装编号" width="120" />
        <el-table-column prop="userName" label="使用人" width="100" sortable />
        <el-table-column prop="department" label="所属部门" width="120" />
        <el-table-column prop="returnDate" label="归还日期" width="120" sortable />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="condition" label="归还状态" width="120">
          <template #default="scope">
            <el-tag :type="getConditionType(scope.row.condition)">
              {{ getConditionText(scope.row.condition) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleViewReturn(scope.row)">查看</el-button>
            <template v-if="scope.row.status === 'pending'">
              <el-button link type="success" @click="handleProcessReturn(scope.row)">处理归还</el-button>
            </template>
            <template v-else-if="scope.row.status === 'abnormal'">
              <el-button link type="warning" @click="handleResolveAbnormal(scope.row)">处理异常</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="return-list">
        <el-card 
          v-for="item in paginatedReturns" 
          :key="item.id"
          class="return-item"
          shadow="hover"
          :class="`status-${item.status}`"
        >
          <div class="return-item-header">
            <div class="item-info">
              <h4>{{ item.toolingName }}</h4>
              <span class="return-code">{{ item.returnCode }}</span>
            </div>
            <el-tag :type="getStatusType(item.status)">{{ getStatusText(item.status) }}</el-tag>
          </div>
          <div class="return-item-content">
            <div class="info-row">
              <span class="label">使用人:</span>
              <span class="value">{{ item.userName }}</span>
            </div>
            <div class="info-row">
              <span class="label">所属部门:</span>
              <span class="value">{{ item.department }}</span>
            </div>
            <div class="info-row">
              <span class="label">借出日期:</span>
              <span class="value">{{ item.issueDate }}</span>
            </div>
            <div class="info-row">
              <span class="label">预计归还:</span>
              <span class="value">{{ item.expectedReturnDate }}</span>
            </div>
            <div class="info-row" v-if="item.returnDate">
              <span class="label">实际归还:</span>
              <span class="value">{{ item.returnDate }}</span>
            </div>
            <div class="info-row" v-if="item.condition">
              <span class="label">归还状态:</span>
              <span class="value" :class="`condition-${item.condition}`">
                {{ getConditionText(item.condition) }}
              </span>
            </div>
          </div>
          <div class="return-item-actions">
            <el-button size="small" @click="handleViewReturn(item)">详情</el-button>
            <el-button size="small" type="success" @click="handleProcessReturn(item)" v-if="item.status === 'pending'">处理归还</el-button>
            <el-button size="small" type="warning" @click="handleResolveAbnormal(item)" v-if="item.status === 'abnormal'">处理异常</el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredReturns.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 手动归还对话框 -->
    <el-dialog
      v-model="manualReturnDialogVisible"
      title="手动归还"
      width="700px"
    >
      <el-form :model="manualReturnForm" :rules="manualReturnRules" ref="manualReturnFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="归还编号" prop="returnCode">
              <el-input v-model="manualReturnForm.returnCode" placeholder="自动生成" disabled />
            </el-form-item>
            <el-form-item label="工装信息" prop="toolingId">
              <el-select v-model="manualReturnForm.toolingId" placeholder="请选择工装" filterable>
                <el-option 
                  v-for="tooling in borrowedToolings" 
                  :key="tooling.id" 
                  :label="`${tooling.code} - ${tooling.name} (${tooling.userName})`" 
                  :value="tooling.id" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="使用人" prop="userName">
              <el-input v-model="manualReturnForm.userName" placeholder="请输入使用人姓名" />
            </el-form-item>
            <el-form-item label="所属部门" prop="department">
              <el-input v-model="manualReturnForm.department" placeholder="请输入所属部门" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="归还日期" prop="returnDate">
              <el-date-picker 
                v-model="manualReturnForm.returnDate" 
                type="date" 
                placeholder="选择归还日期" 
                style="width: 100%;" 
              />
            </el-form-item>
            <el-form-item label="归还数量" prop="quantity">
              <el-input v-model.number="manualReturnForm.quantity" placeholder="请输入归还数量" min="1" />
            </el-form-item>
            <el-form-item label="归还状态" prop="condition">
              <el-select v-model="manualReturnForm.condition" placeholder="请选择归还状态">
                <el-option label="完好" value="good" />
                <el-option label="轻微损坏" value="slight_damage" />
                <el-option label="严重损坏" value="serious_damage" />
                <el-option label="丢失" value="lost" />
              </el-select>
            </el-form-item>
            <el-form-item label="确认人" prop="confirmedBy">
              <el-input v-model="manualReturnForm.confirmedBy" placeholder="请输入确认人姓名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="归还备注" prop="notes">
          <el-input v-model="manualReturnForm.notes" type="textarea" :rows="3" placeholder="请输入归还备注" />
        </el-form-item>
        <el-form-item v-if="manualReturnForm.condition !== 'good'" label="异常说明" prop="abnormalDescription">
          <el-input v-model="manualReturnForm.abnormalDescription" type="textarea" :rows="3" placeholder="请详细描述异常情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualReturnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitManualReturn">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看归还详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`归还详情 - ${selectedReturn?.toolingName || ''}`"
      width="700px"
    >
      <div v-if="selectedReturn" class="return-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="归还编号">{{ selectedReturn.returnCode }}</el-descriptions-item>
          <el-descriptions-item label="申请编号">{{ selectedReturn.issueCode }}</el-descriptions-item>
          <el-descriptions-item label="工装名称">{{ selectedReturn.toolingName }}</el-descriptions-item>
          <el-descriptions-item label="工装编号">{{ selectedReturn.toolingCode }}</el-descriptions-item>
          <el-descriptions-item label="使用人">{{ selectedReturn.userName }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ selectedReturn.department }}</el-descriptions-item>
          <el-descriptions-item label="借出日期">{{ selectedReturn.issueDate }}</el-descriptions-item>
          <el-descriptions-item label="预计归还日期">{{ selectedReturn.expectedReturnDate }}</el-descriptions-item>
          <el-descriptions-item label="实际归还日期">{{ selectedReturn.returnDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="归还数量">{{ selectedReturn.quantity }}</el-descriptions-item>
          <el-descriptions-item label="归还状态">
            <el-tag :type="getConditionType(selectedReturn.condition)">
              {{ getConditionText(selectedReturn.condition) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="确认人">{{ selectedReturn.confirmedBy || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedReturn.notes || '-' }}</el-descriptions-item>
          <el-descriptions-item label="异常说明" :span="2" v-if="selectedReturn.abnormalDescription">
            {{ selectedReturn.abnormalDescription }}
          </el-descriptions-item>
          <el-descriptions-item label="异常处理状态" :span="2" v-if="selectedReturn.abnormalStatus">
            <el-tag :type="getAbnormalStatusType(selectedReturn.abnormalStatus)">
              {{ getAbnormalStatusText(selectedReturn.abnormalStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常处理人" :span="2" v-if="selectedReturn.abnormalHandler">
            {{ selectedReturn.abnormalHandler }}
          </el-descriptions-item>
          <el-descriptions-item label="异常处理意见" :span="2" v-if="selectedReturn.abnormalHandlerComments">
            {{ selectedReturn.abnormalHandlerComments }}
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 操作记录 -->
        <div v-if="selectedReturn.operationRecords && selectedReturn.operationRecords.length > 0" class="operation-records">
          <h3>操作记录</h3>
          <el-timeline>
            <el-timeline-item 
              v-for="(record, index) in selectedReturn.operationRecords" 
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

    <!-- 处理归还对话框 -->
    <el-dialog
      v-model="processReturnDialogVisible"
      title="处理归还"
      width="600px"
    >
      <div v-if="selectedReturn" class="process-return-form">
        <div class="process-return-info">
          <p><strong>工装名称:</strong> {{ selectedReturn.toolingName }}</p>
          <p><strong>使用人:</strong> {{ selectedReturn.userName }}</p>
          <p><strong>所属部门:</strong> {{ selectedReturn.department }}</p>
          <p><strong>借出日期:</strong> {{ selectedReturn.issueDate }}</p>
        </div>
        <el-form :model="processReturnForm" :rules="processReturnRules" ref="processReturnFormRef" label-width="80px" style="margin-top: 20px;">
          <el-form-item label="归还日期" prop="returnDate">
            <el-date-picker 
              v-model="processReturnForm.returnDate" 
              type="date" 
              placeholder="选择归还日期" 
              style="width: 100%;" 
            />
          </el-form-item>
          <el-form-item label="归还数量" prop="quantity">
            <el-input v-model.number="processReturnForm.quantity" placeholder="请输入归还数量" min="1" :max="selectedReturn.quantity" />
          </el-form-item>
          <el-form-item label="归还状态" prop="condition">
            <el-select v-model="processReturnForm.condition" placeholder="请选择归还状态">
              <el-option label="完好" value="good" />
              <el-option label="轻微损坏" value="slight_damage" />
              <el-option label="严重损坏" value="serious_damage" />
              <el-option label="丢失" value="lost" />
            </el-select>
          </el-form-item>
          <el-form-item label="确认人" prop="confirmedBy">
            <el-input v-model="processReturnForm.confirmedBy" placeholder="请输入确认人姓名" />
          </el-form-item>
          <el-form-item label="归还备注" prop="notes">
            <el-input v-model="processReturnForm.notes" type="textarea" :rows="3" placeholder="请输入归还备注" />
          </el-form-item>
          <el-form-item v-if="processReturnForm.condition !== 'good'" label="异常说明" prop="abnormalDescription">
            <el-input v-model="processReturnForm.abnormalDescription" type="textarea" :rows="3" placeholder="请详细描述异常情况" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="processReturnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitProcessReturn">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 处理异常对话框 -->
    <el-dialog
      v-model="resolveAbnormalDialogVisible"
      title="处理异常"
      width="600px"
    >
      <div v-if="selectedReturn" class="resolve-abnormal-form">
        <div class="resolve-abnormal-info">
          <p><strong>工装名称:</strong> {{ selectedReturn.toolingName }}</p>
          <p><strong>异常类型:</strong> {{ getConditionText(selectedReturn.condition) }}</p>
          <p><strong>异常说明:</strong> {{ selectedReturn.abnormalDescription || '-' }}</p>
          <p><strong>归还日期:</strong> {{ selectedReturn.returnDate }}</p>
        </div>
        <el-form :model="resolveAbnormalForm" :rules="resolveAbnormalRules" ref="resolveAbnormalFormRef" label-width="80px" style="margin-top: 20px;">
          <el-form-item label="处理状态" prop="abnormalStatus">
            <el-select v-model="resolveAbnormalForm.abnormalStatus" placeholder="请选择处理状态">
              <el-option label="已修复" value="repaired" />
              <el-option label="已报废" value="scrapped" />
              <el-option label="已赔偿" value="compensated" />
              <el-option label="其他处理" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理人" prop="abnormalHandler">
            <el-input v-model="resolveAbnormalForm.abnormalHandler" placeholder="请输入处理人姓名" />
          </el-form-item>
          <el-form-item label="处理意见" prop="abnormalHandlerComments">
            <el-input v-model="resolveAbnormalForm.abnormalHandlerComments" type="textarea" :rows="4" placeholder="请输入处理意见" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="resolveAbnormalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitResolveAbnormal">提交处理</el-button>
      </template>
    </el-dialog>

    <!-- 逾期预警弹窗 -->
    <el-dialog
      v-model="overdueWarningVisible"
      title="逾期预警"
      width="500px"
    >
      <div class="overdue-warning">
        <div class="warning-icon">
          <WarningFilled size="48" color="#E6A23C" />
        </div>
        <h3>{{ overdueWarningData?.toolingName }} 已逾期</h3>
        <p><strong>使用人:</strong> {{ overdueWarningData?.userName }}</p>
        <p><strong>所属部门:</strong> {{ overdueWarningData?.department }}</p>
        <p><strong>预计归还日期:</strong> {{ overdueWarningData?.expectedReturnDate }}</p>
        <p><strong>已逾期:</strong> {{ overdueWarningData?.overdueDays }} 天</p>
        <el-form :model="overdueActionForm" :rules="overdueActionRules" ref="overdueActionFormRef" style="margin-top: 20px;">
          <el-form-item label="处理方式" prop="action">
            <el-select v-model="overdueActionForm.action" placeholder="请选择处理方式">
              <el-option label="发送提醒" value="remind" />
              <el-option label="标记异常" value="abnormal" />
              <el-option label="忽略" value="ignore" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="overdueWarningVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitOverdueAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { ClipboardCheck, Clock, CheckCircle, Refresh, AlertCircle, Warning, InfoFilled, WarningFilled, SuccessFilled, CircleCheck, Check } from '@element-plus/icons-vue'

// 响应式数据
const returns = ref([])
const loading = ref(false)
const searchForm = reactive({
  keyword: '',
  status: '',
  user: '',
  dateRange: [],
  condition: ''
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const viewMode = ref('table')
const selectedRows = ref([])

// 对话框相关
const manualReturnDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const processReturnDialogVisible = ref(false)
const resolveAbnormalDialogVisible = ref(false)
const overdueWarningVisible = ref(false)
const selectedReturn = ref(null)
const manualReturnFormRef = ref(null)
const processReturnFormRef = ref(null)
const resolveAbnormalFormRef = ref(null)
const overdueActionFormRef = ref(null)

// 表单数据
const manualReturnForm = reactive({
  returnCode: '',
  toolingId: '',
  toolingName: '',
  toolingCode: '',
  userName: '',
  department: '',
  returnDate: '',
  quantity: 1,
  condition: 'good',
  confirmedBy: '',
  notes: '',
  abnormalDescription: ''
})

const processReturnForm = reactive({
  returnDate: '',
  quantity: 0,
  condition: 'good',
  confirmedBy: '',
  notes: '',
  abnormalDescription: ''
})

const resolveAbnormalForm = reactive({
  abnormalStatus: '',
  abnormalHandler: '',
  abnormalHandlerComments: ''
})

const overdueActionForm = reactive({
  action: ''
})

const overdueWarningData = reactive({
  toolingName: '',
  userName: '',
  department: '',
  expectedReturnDate: '',
  overdueDays: 0
})

// 表单验证规则
const manualReturnRules = reactive({
  toolingId: [{ required: true, message: '请选择工装', trigger: 'change' }],
  userName: [{ required: true, message: '请输入使用人姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请输入所属部门', trigger: 'blur' }],
  returnDate: [{ required: true, message: '请选择归还日期', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入归还数量', trigger: 'blur' }],
  condition: [{ required: true, message: '请选择归还状态', trigger: 'change' }],
  confirmedBy: [{ required: true, message: '请输入确认人姓名', trigger: 'blur' }],
  abnormalDescription: [
    { 
      required: (rule, value, callback) => {
        if (manualReturnForm.condition !== 'good' && !value) {
          callback(new Error('请详细描述异常情况'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
})

const processReturnRules = reactive({
  returnDate: [{ required: true, message: '请选择归还日期', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入归还数量', trigger: 'blur' }],
  condition: [{ required: true, message: '请选择归还状态', trigger: 'change' }],
  confirmedBy: [{ required: true, message: '请输入确认人姓名', trigger: 'blur' }],
  abnormalDescription: [
    { 
      required: (rule, value, callback) => {
        if (processReturnForm.condition !== 'good' && !value) {
          callback(new Error('请详细描述异常情况'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
})

const resolveAbnormalRules = reactive({
  abnormalStatus: [{ required: true, message: '请选择处理状态', trigger: 'change' }],
  abnormalHandler: [{ required: true, message: '请输入处理人姓名', trigger: 'blur' }],
  abnormalHandlerComments: [{ required: true, message: '请输入处理意见', trigger: 'blur' }]
})

const overdueActionRules = reactive({
  action: [{ required: true, message: '请选择处理方式', trigger: 'change' }]
})

// 借用中的工装（模拟数据）
const borrowedToolings = ref([
  { id: 1, code: 'T001', name: '数控车床夹具', userName: '张三', department: '机械加工车间' },
  { id: 2, code: 'T002', name: '铣床刀具套装', userName: '李四', department: '精密加工车间' },
  { id: 3, code: 'T003', name: '液压虎钳', userName: '王五', department: '模具车间' },
  { id: 4, code: 'T004', name: '测量卡尺', userName: '赵六', department: '质量检测部' },
  { id: 5, code: 'T005', name: '扭矩扳手', userName: '孙七', department: '装配车间' }
])

// 计算属性
const filteredReturns = computed(() => {
  return returns.value.filter(item => {
    // 关键词搜索
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      if (!item.toolingName.toLowerCase().includes(keyword) && 
          !item.returnCode.toLowerCase().includes(keyword) &&
          !item.issueCode.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 状态筛选
    if (searchForm.status && item.status !== searchForm.status) {
      return false
    }
    
    // 使用人筛选
    if (searchForm.user && !item.userName.toLowerCase().includes(searchForm.user.toLowerCase())) {
      return false
    }
    
    // 日期范围筛选
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const startDate = new Date(searchForm.dateRange[0])
      const endDate = new Date(searchForm.dateRange[1])
      const returnDate = item.returnDate ? new Date(item.returnDate) : null
      
      if (returnDate && (returnDate < startDate || returnDate > endDate)) {
        return false
      }
    }
    
    // 归还状态筛选
    if (searchForm.condition && item.condition !== searchForm.condition) {
      return false
    }
    
    return true
  })
})

const paginatedReturns = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredReturns.value.slice(startIndex, endIndex)
})

// 统计数据
const totalReturns = computed(() => returns.value.length)
const pendingReturns = computed(() => 
  returns.value.filter(item => item.status === 'pending').length
)
const overdueReturns = computed(() => 
  returns.value.filter(item => item.status === 'overdue').length
)
const normalReturns = computed(() => 
  returns.value.filter(item => item.status === 'returned' && item.condition === 'good').length
)
const abnormalReturns = computed(() => 
  returns.value.filter(item => item.status === 'abnormal').length
)

// 生命周期钩子
onMounted(() => {
  loadReturns()
})

// 辅助函数
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const generateReturnCode = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `RET${year}${month}${day}${random}`
}

const calculateOverdueDays = (expectedDate) => {
  const today = new Date()
  const expected = new Date(expectedDate)
  const diffTime = Math.abs(today - expected)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// 状态映射
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    returned: 'success',
    overdue: 'danger',
    abnormal: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待归还',
    returned: '已归还',
    overdue: '逾期归还',
    abnormal: '异常'
  }
  return texts[status] || '未知'
}

const getConditionType = (condition) => {
  const types = {
    good: 'success',
    slight_damage: 'warning',
    serious_damage: 'danger',
    lost: 'danger'
  }
  return types[condition] || 'info'
}

const getConditionText = (condition) => {
  const texts = {
    good: '完好',
    slight_damage: '轻微损坏',
    serious_damage: '严重损坏',
    lost: '丢失'
  }
  return texts[condition] || '未知'
}

const getAbnormalStatusType = (status) => {
  const types = {
    repaired: 'success',
    scrapped: 'danger',
    compensated: 'info',
    other: 'warning'
  }
  return types[status] || 'info'
}

const getAbnormalStatusText = (status) => {
  const texts = {
    repaired: '已修复',
    scrapped: '已报废',
    compensated: '已赔偿',
    other: '其他处理'
  }
  return texts[status] || '未知'
}

const getTimelineIcon = (event) => {
  const icons = {
    '发起归还': InfoFilled,
    '确认归还': SuccessFilled,
    '标记异常': WarningFilled,
    '处理异常': CheckCircle,
    '发送提醒': CircleCheck
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
    user: '',
    dateRange: [],
    condition: ''
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
const loadReturns = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    returns.value = [
      {
        id: 1,
        returnCode: 'RET240115001',
        issueCode: 'ISS240110001',
        toolingId: 1,
        toolingCode: 'T001',
        toolingName: '数控车床夹具',
        userName: '张三',
        department: '机械加工车间',
        issueDate: '2024-01-10',
        expectedReturnDate: '2024-01-15',
        returnDate: '2024-01-15',
        quantity: 2,
        status: 'returned',
        condition: 'good',
        confirmedBy: '李四',
        notes: '正常归还',
        abnormalDescription: null,
        abnormalStatus: null,
        abnormalHandler: null,
        abnormalHandlerComments: null,
        createdAt: '2024-01-15T16:30:00',
        operationRecords: [
          {
            time: '2024-01-15T16:30:00',
            event: '确认归还',
            type: 'success',
            operator: '李四',
            details: '归还数控车床夹具2个，状态完好'
          }
        ]
      },
      {
        id: 2,
        returnCode: 'RET240116002',
        issueCode: 'ISS240111002',
        toolingId: 2,
        toolingCode: 'T002',
        toolingName: '铣床刀具套装',
        userName: '李四',
        department: '精密加工车间',
        issueDate: '2024-01-11',
        expectedReturnDate: '2024-01-16',
        returnDate: '2024-01-16',
        quantity: 1,
        status: 'abnormal',
        condition: 'slight_damage',
        confirmedBy: '王五',
        notes: '有轻微损坏',
        abnormalDescription: '刀具轻微磨损，需要刃磨',
        abnormalStatus: null,
        abnormalHandler: null,
        abnormalHandlerComments: null,
        createdAt: '2024-01-16T14:20:00',
        operationRecords: [
          {
            time: '2024-01-16T14:20:00',
            event: '确认归还',
            type: 'warning',
            operator: '王五',
            details: '归还铣床刀具套装1套，状态轻微损坏'
          },
          {
            time: '2024-01-16T14:25:00',
            event: '标记异常',
            type: 'warning',
            operator: '王五',
            details: '异常描述：刀具轻微磨损，需要刃磨'
          }
        ]
      },
      {
        id: 3,
        returnCode: 'RET240117003',
        issueCode: 'ISS240112003',
        toolingId: 3,
        toolingCode: 'T003',
        toolingName: '液压虎钳',
        userName: '王五',
        department: '模具车间',
        issueDate: '2024-01-12',
        expectedReturnDate: '2024-01-17',
        returnDate: null,
        quantity: 3,
        status: 'pending',
        condition: null,
        confirmedBy: null,
        notes: null,
        abnormalDescription: null,
        abnormalStatus: null,
        abnormalHandler: null,
        abnormalHandlerComments: null,
        createdAt: '2024-01-17T09:00:00',
        operationRecords: [
          {
            time: '2024-01-17T09:00:00',
            event: '发起归还',
            type: 'primary',
            operator: '王五',
            details: '申请归还液压虎钳3个'
          }
        ]
      },
      {
        id: 4,
        returnCode: 'RET240114004',
        issueCode: 'ISS240107004',
        toolingId: 4,
        toolingCode: 'T004',
        toolingName: '测量卡尺',
        userName: '赵六',
        department: '质量检测部',
        issueDate: '2024-01-07',
        expectedReturnDate: '2024-01-14',
        returnDate: null,
        quantity: 5,
        status: 'overdue',
        condition: null,
        confirmedBy: null,
        notes: null,
        abnormalDescription: null,
        abnormalStatus: null,
        abnormalHandler: null,
        abnormalHandlerComments: null,
        createdAt: '2024-01-14T10:00:00',
        operationRecords: [
          {
            time: '2024-01-14T10:00:00',
            event: '发起归还',
            type: 'primary',
            operator: '赵六',
            details: '申请归还测量卡尺5个'
          },
          {
            time: '2024-01-16T09:00:00',
            event: '发送提醒',
            type: 'warning',
            operator: '系统',
            details: '已逾期2天，请及时归还'
          }
        ]
      },
      {
        id: 5,
        returnCode: 'RET240118005',
        issueCode: 'ISS240113005',
        toolingId: 5,
        toolingCode: 'T005',
        toolingName: '扭矩扳手',
        userName: '孙七',
        department: '装配车间',
        issueDate: '2024-01-13',
        expectedReturnDate: '2024-01-18',
        returnDate: '2024-01-18',
        quantity: 4,
        status: 'abnormal',
        condition: 'lost',
        confirmedBy: '周八',
        notes: '部分丢失',
        abnormalDescription: '4个扭矩扳手全部丢失',
        abnormalStatus: 'compensated',
        abnormalHandler: '周八',
        abnormalHandlerComments: '已按规定赔偿原价的80%',
        createdAt: '2024-01-18T15:40:00',
        operationRecords: [
          {
            time: '2024-01-18T15:40:00',
            event: '确认归还',
            type: 'danger',
            operator: '周八',
            details: '报告扭矩扳手4个全部丢失'
          },
          {
            time: '2024-01-18T15:45:00',
            event: '标记异常',
            type: 'danger',
            operator: '周八',
            details: '异常描述：4个扭矩扳手全部丢失'
          },
          {
            time: '2024-01-19T10:00:00',
            event: '处理异常',
            type: 'info',
            operator: '周八',
            details: '处理方式：已按规定赔偿原价的80%'
          }
        ]
      },
      {
        id: 6,
        returnCode: 'RET240119006',
        issueCode: 'ISS240114006',
        toolingId: 6,
        toolingCode: 'T006',
        toolingName: '抛光工具套装',
        userName: '周八',
        department: '表面处理车间',
        issueDate: '2024-01-14',
        expectedReturnDate: '2024-01-19',
        returnDate: '2024-01-19',
        quantity: 2,
        status: 'abnormal',
        condition: 'serious_damage',
        confirmedBy: '吴九',
        notes: '严重损坏',
        abnormalDescription: '抛光轮严重磨损，无法继续使用',
        abnormalStatus: 'scrapped',
        abnormalHandler: '吴九',
        abnormalHandlerComments: '已报废处理，准备采购新的',
        createdAt: '2024-01-19T16:00:00',
        operationRecords: [
          {
            time: '2024-01-19T16:00:00',
            event: '确认归还',
            type: 'danger',
            operator: '吴九',
            details: '归还抛光工具套装2套，状态严重损坏'
          },
          {
            time: '2024-01-19T16:05:00',
            event: '标记异常',
            type: 'danger',
            operator: '吴九',
            details: '异常描述：抛光轮严重磨损，无法继续使用'
          },
          {
            time: '2024-01-20T09:00:00',
            event: '处理异常',
            type: 'danger',
            operator: '吴九',
            details: '处理方式：已报废处理，准备采购新的'
          }
        ]
      }
    ]
    loading.value = false
    
    // 检查是否有逾期的工装并显示预警
    checkOverdueReturns()
  }, 500)
}

// 检查逾期归还
const checkOverdueReturns = () => {
  const overdueItem = returns.value.find(item => item.status === 'overdue')
  if (overdueItem) {
    const overdueDays = calculateOverdueDays(overdueItem.expectedReturnDate)
    Object.assign(overdueWarningData, {
      toolingName: overdueItem.toolingName,
      userName: overdueItem.userName,
      department: overdueItem.department,
      expectedReturnDate: overdueItem.expectedReturnDate,
      overdueDays: overdueDays
    })
    overdueWarningVisible.value = true
  }
}

// 刷新数据
const handleRefresh = () => {
  loadReturns()
}

// 手动归还
const handleManualReturn = () => {
  Object.assign(manualReturnForm, {
    returnCode: generateReturnCode(),
    toolingId: '',
    toolingName: '',
    toolingCode: '',
    userName: '',
    department: '',
    returnDate: formatDate(new Date()),
    quantity: 1,
    condition: 'good',
    confirmedBy: '',
    notes: '',
    abnormalDescription: ''
  })
  manualReturnDialogVisible.value = true
}

// 查看归还详情
const handleViewReturn = (item) => {
  selectedReturn.value = { ...item }
  detailDialogVisible.value = true
}

// 处理归还
const handleProcessReturn = (item) => {
  selectedReturn.value = { ...item }
  Object.assign(processReturnForm, {
    returnDate: formatDate(new Date()),
    quantity: item.quantity,
    condition: 'good',
    confirmedBy: '',
    notes: '',
    abnormalDescription: ''
  })
  processReturnDialogVisible.value = true
}

// 处理异常
const handleResolveAbnormal = (item) => {
  selectedReturn.value = { ...item }
  Object.assign(resolveAbnormalForm, {
    abnormalStatus: '',
    abnormalHandler: '',
    abnormalHandlerComments: ''
  })
  resolveAbnormalDialogVisible.value = true
}

// 提交手动归还
const handleSubmitManualReturn = async () => {
  try {
    await manualReturnFormRef.value.validate()
    
    // 查找工装信息
    const selectedTooling = borrowedToolings.value.find(t => t.id === manualReturnForm.toolingId)
    if (selectedTooling) {
      manualReturnForm.toolingName = selectedTooling.name
      manualReturnForm.toolingCode = selectedTooling.code
    }
    
    // 新增记录
    const newReturn = {
      id: Date.now(),
      ...manualReturnForm,
      status: manualReturnForm.condition === 'good' ? 'returned' : 'abnormal',
      issueCode: 'ISS' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
      issueDate: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
      expectedReturnDate: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      abnormalStatus: null,
      abnormalHandler: null,
      abnormalHandlerComments: null,
      createdAt: new Date().toISOString(),
      operationRecords: [
        {
          time: new Date().toISOString(),
          event: '确认归还',
          type: manualReturnForm.condition === 'good' ? 'success' : 'warning',
          operator: manualReturnForm.confirmedBy,
          details: `归还${manualReturnForm.toolingName}${manualReturnForm.quantity}个，状态${getConditionText(manualReturnForm.condition)}${manualReturnForm.abnormalDescription ? '，' + manualReturnForm.abnormalDescription : ''}`
        }
      ]
    }
    
    // 如果是异常状态，添加异常记录
    if (manualReturnForm.condition !== 'good') {
      newReturn.operationRecords.push({
        time: new Date().toISOString(),
        event: '标记异常',
        type: 'warning',
        operator: manualReturnForm.confirmedBy,
        details: `异常描述：${manualReturnForm.abnormalDescription}`
      })
    }
    
    returns.value.unshift(newReturn)
    ElMessage.success('手动归还成功')
    manualReturnDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 提交处理归还
const handleSubmitProcessReturn = async () => {
  try {
    await processReturnFormRef.value.validate()
    
    const index = returns.value.findIndex(i => i.id === selectedReturn.value.id)
    if (index !== -1) {
      // 更新状态和归还信息
      returns.value[index].returnDate = processReturnForm.returnDate
      returns.value[index].quantity = processReturnForm.quantity
      returns.value[index].condition = processReturnForm.condition
      returns.value[index].confirmedBy = processReturnForm.confirmedBy
      returns.value[index].notes = processReturnForm.notes
      returns.value[index].abnormalDescription = processReturnForm.abnormalDescription
      returns.value[index].status = processReturnForm.condition === 'good' ? 'returned' : 'abnormal'
      
      // 添加操作记录
      returns.value[index].operationRecords.push({
        time: new Date().toISOString(),
        event: '确认归还',
        type: processReturnForm.condition === 'good' ? 'success' : 'warning',
        operator: processReturnForm.confirmedBy,
        details: `归还${selectedReturn.value.toolingName}${processReturnForm.quantity}个，状态${getConditionText(processReturnForm.condition)}${processReturnForm.abnormalDescription ? '，' + processReturnForm.abnormalDescription : ''}`
      })
      
      // 如果是异常状态，添加异常记录
      if (processReturnForm.condition !== 'good') {
        returns.value[index].operationRecords.push({
          time: new Date().toISOString(),
          event: '标记异常',
          type: 'warning',
          operator: processReturnForm.confirmedBy,
          details: `异常描述：${processReturnForm.abnormalDescription}`
        })
      }
      
      ElMessage.success('归还处理成功')
    }
    
    processReturnDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 提交异常处理
const handleSubmitResolveAbnormal = async () => {
  try {
    await resolveAbnormalFormRef.value.validate()
    
    const index = returns.value.findIndex(i => i.id === selectedReturn.value.id)
    if (index !== -1) {
      // 更新异常处理信息
      returns.value[index].abnormalStatus = resolveAbnormalForm.abnormalStatus
      returns.value[index].abnormalHandler = resolveAbnormalForm.abnormalHandler
      returns.value[index].abnormalHandlerComments = resolveAbnormalForm.abnormalHandlerComments
      
      // 如果修复成功，更新状态
      if (resolveAbnormalForm.abnormalStatus === 'repaired') {
        returns.value[index].status = 'returned'
        returns.value[index].condition = 'good'
      }
      
      // 添加操作记录
      returns.value[index].operationRecords.push({
        time: new Date().toISOString(),
        event: '处理异常',
        type: resolveAbnormalForm.abnormalStatus === 'repaired' ? 'success' : 'info',
        operator: resolveAbnormalForm.abnormalHandler,
        details: `处理方式：${getAbnormalStatusText(resolveAbnormalForm.abnormalStatus)}，${resolveAbnormalForm.abnormalHandlerComments}`
      })
      
      ElMessage.success('异常处理成功')
    }
    
    resolveAbnormalDialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 提交逾期处理
const handleSubmitOverdueAction = async () => {
  try {
    await overdueActionFormRef.value.validate()
    
    const action = overdueActionForm.action
    
    if (action === 'remind') {
      ElMessage.success('已发送提醒通知')
    } else if (action === 'abnormal') {
      // 查找对应的记录并标记为异常
      const index = returns.value.findIndex(i => 
        i.toolingName === overdueWarningData.toolingName && 
        i.userName === overdueWarningData.userName
      )
      if (index !== -1) {
        returns.value[index].status = 'abnormal'
        returns.value[index].operationRecords.push({
          time: new Date().toISOString(),
          event: '标记异常',
          type: 'warning',
          operator: '系统',
          details: `逾期未归还，已标记为异常状态`
        })
        ElMessage.success('已标记为异常')
      }
    } else if (action === 'ignore') {
      ElMessage.info('已忽略')
    }
    
    overdueWarningVisible.value = false
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
.tooling-return {
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 24px;
  margin-right: 15px;
  color: white;
}

.stat-icon.primary {
  background-color: #409EFF;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.danger {
  background-color: #F56C6C;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-icon.info {
  background-color: #909399;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 3px;
}

.stat-unit {
  font-size: 14px;
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
.return-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.return-item {
  height: 100%;
  transition: all 0.3s;
}

.return-item.status-pending:hover {
  border-color: #E6A23C;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
}

.return-item.status-returned:hover {
  border-color: #67C23A;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
}

.return-item.status-overdue:hover {
  border-color: #F56C6C;
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.2);
}

.return-item.status-abnormal:hover {
  border-color: #909399;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.2);
}

.return-item-header {
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

.return-code {
  color: #909399;
  font-size: 14px;
}

.return-item-content {
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

.info-row .value.condition-good {
  color: #67C23A;
}

.info-row .value.condition-slight_damage {
  color: #E6A23C;
}

.info-row .value.condition-serious_damage,
.info-row .value.condition-lost {
  color: #F56C6C;
}

.return-item-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 详情页样式 */
.return-detail {
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

/* 处理表单样式 */
.process-return-info,
.resolve-abnormal-info {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.process-return-info p,
.resolve-abnormal-info p {
  margin: 5px 0;
  font-size: 14px;
}

/* 逾期预警样式 */
.overdue-warning {
  text-align: center;
  padding: 20px;
}

.warning-icon {
  margin-bottom: 20px;
}

.overdue-warning h3 {
  margin: 0 0 15px 0;
  color: #E6A23C;
}

.overdue-warning p {
  margin: 8px 0;
  text-align: left;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
  
  .return-list {
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
    flex-wrap: wrap;
  }
}