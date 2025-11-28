<template>
  <div class="fixture-setup-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>夹具安装调试管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateTask">
          <el-icon><Plus /></el-icon>
          新增任务
        </el-button>
        <el-button @click="handleImportTasks">
          <el-icon><Upload /></el-icon>
          导入任务
        </el-button>
        <el-button @click="handleExportTasks">
          <el-icon><Download /></el-icon>
          导出任务
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 任务统计概览 -->
    <div class="task-overview">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card">
            <div class="card-content">
              <div class="card-value">{{ statistics.totalTasks }}</div>
              <div class="card-label">总任务数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card info">
            <div class="card-content">
              <div class="card-value">{{ statistics.pendingTasks }}</div>
              <div class="card-label">待开始任务</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card warning">
            <div class="card-content">
              <div class="card-value">{{ statistics.inProgressTasks }}</div>
              <div class="card-label">进行中任务</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="overview-card success">
            <div class="card-content">
              <div class="card-value">{{ statistics.completedTasks }}</div>
              <div class="card-label">已完成任务</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="任务编号">
          <el-input v-model="searchForm.taskCode" placeholder="请输入任务编号" clearable />
        </el-form-item>
        <el-form-item label="夹具编号">
          <el-input v-model="searchForm.fixtureCode" placeholder="请输入夹具编号" clearable />
        </el-form-item>
        <el-form-item label="生产线">
          <el-select v-model="searchForm.productionLine" placeholder="请选择生产线" clearable>
            <el-option label="生产线A" value="line_a" />
            <el-option label="生产线B" value="line_b" />
            <el-option label="生产线C" value="line_c" />
            <el-option label="生产线D" value="line_d" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="searchForm.status" placeholder="请选择任务状态" clearable>
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开始时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="data-table-card">
      <el-table
        v-loading="loading"
        :data="taskList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="taskCode" label="任务编号" min-width="120" />
        <el-table-column prop="fixtureCode" label="夹具编号" min-width="120" />
        <el-table-column prop="fixtureName" label="夹具名称" min-width="180" />
        <el-table-column prop="productionLine" label="生产线" min-width="120">
          <template #default="scope">
            {{ getProductionLineText(scope.row.productionLine) }}
          </template>
        </el-table-column>
        <el-table-column prop="workstation" label="工位" min-width="100" />
        <el-table-column prop="setupType" label="调试类型" min-width="120">
          <template #default="scope">
            {{ getSetupTypeText(scope.row.setupType) }}
          </template>
        </el-table-column>
        <el-table-column prop="plannedStartTime" label="计划开始时间" min-width="140" />
        <el-table-column prop="plannedEndTime" label="计划完成时间" min-width="140" />
        <el-table-column prop="actualStartTime" label="实际开始时间" min-width="140" />
        <el-table-column prop="actualEndTime" label="实际完成时间" min-width="140" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="scope">
            <el-tag
              :type="getStatusType(scope.row.status)"
              effect="light"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="technician" label="调试人员" min-width="120" />
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleViewTask(scope.row)"
            >
              详情
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="success"
              size="small"
              @click="handleStartTask(scope.row)"
            >
              开始
            </el-button>
            <el-button
              v-if="scope.row.status === 'in_progress'"
              type="info"
              size="small"
              @click="handleCompleteTask(scope.row)"
            >
              完成
            </el-button>
            <el-button
              v-if="['pending', 'in_progress'].includes(scope.row.status)"
              type="danger"
              size="small"
              @click="handleCancelTask(scope.row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 任务详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="安装调试任务详情"
      size="60%"
      direction="rtl"
    >
      <div v-if="selectedTask" class="task-details">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务编号">{{ selectedTask.taskCode }}</el-descriptions-item>
          <el-descriptions-item label="夹具编号">{{ selectedTask.fixtureCode }}</el-descriptions-item>
          <el-descriptions-item label="夹具名称">{{ selectedTask.fixtureName }}</el-descriptions-item>
          <el-descriptions-item label="生产线">{{ getProductionLineText(selectedTask.productionLine) }}</el-descriptions-item>
          <el-descriptions-item label="工位">{{ selectedTask.workstation }}</el-descriptions-item>
          <el-descriptions-item label="调试类型">{{ getSetupTypeText(selectedTask.setupType) }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">{{ getStatusText(selectedTask.status) }}</el-descriptions-item>
          <el-descriptions-item label="计划开始时间">{{ selectedTask.plannedStartTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划完成时间">{{ selectedTask.plannedEndTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际开始时间">{{ selectedTask.actualStartTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际完成时间">{{ selectedTask.actualEndTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="调试人员">{{ selectedTask.technician || '-' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedTask.responsiblePerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计工时（小时）">{{ selectedTask.estimatedHours || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际工时（小时）">{{ selectedTask.actualHours || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ selectedTask.creator || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedTask.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedTask.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 调试记录 -->
        <div class="setup-records" style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px;">安装调试记录</h3>
          <el-timeline>
            <el-timeline-item
              v-for="record in setupRecords"
              :key="record.id"
              :timestamp="record.recordTime"
              :type="getRecordType(record.actionType)"
            >
              <div>
                <div class="record-title">{{ getActionText(record.actionType) }}</div>
                <div class="record-content">
                  操作人：{{ record.operator }}
                </div>
                <div class="record-note">{{ record.note || '-' }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- 调试问题记录 -->
        <div class="setup-issues" style="margin-top: 30px;">
          <h3 style="margin-bottom: 15px;">调试问题记录</h3>
          <el-table v-if="setupIssues.length > 0" :data="setupIssues" size="small">
            <el-table-column prop="issueDescription" label="问题描述" min-width="200" />
            <el-table-column prop="solution" label="解决方案" min-width="200" />
            <el-table-column prop="reportedBy" label="报告人" min-width="120" />
            <el-table-column prop="reportTime" label="报告时间" min-width="140" />
            <el-table-column prop="status" label="状态" min-width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status === 'resolved' ? '已解决' : '未解决' }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="no-data">暂无调试问题记录</div>
        </div>
      </div>
    </el-drawer>

    <!-- 新增任务对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新增安装调试任务"
      width="800px"
      @close="handleCreateDialogClose"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="任务编号" prop="taskCode">
              <el-input v-model="createForm.taskCode" placeholder="请输入任务编号" />
            </el-form-item>
            <el-form-item label="夹具编号" prop="fixtureCode">
              <el-input v-model="createForm.fixtureCode" placeholder="请输入夹具编号" />
            </el-form-item>
            <el-form-item label="夹具名称" prop="fixtureName">
              <el-input v-model="createForm.fixtureName" placeholder="请输入夹具名称" />
            </el-form-item>
            <el-form-item label="生产线" prop="productionLine">
              <el-select v-model="createForm.productionLine" placeholder="请选择生产线">
                <el-option label="生产线A" value="line_a" />
                <el-option label="生产线B" value="line_b" />
                <el-option label="生产线C" value="line_c" />
                <el-option label="生产线D" value="line_d" />
              </el-select>
            </el-form-item>
            <el-form-item label="工位" prop="workstation">
              <el-input v-model="createForm.workstation" placeholder="请输入工位" />
            </el-form-item>
            <el-form-item label="调试类型" prop="setupType">
              <el-select v-model="createForm.setupType" placeholder="请选择调试类型">
                <el-option label="首次安装" value="first_install" />
                <el-option label="换线调试" value="line_change" />
                <el-option label="故障修复" value="repair" />
                <el-option label="定期维护" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划开始时间" prop="plannedStartTime">
              <el-date-picker
                v-model="createForm.plannedStartTime"
                type="datetime"
                placeholder="选择计划开始时间"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="计划完成时间" prop="plannedEndTime">
              <el-date-picker
                v-model="createForm.plannedEndTime"
                type="datetime"
                placeholder="选择计划完成时间"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="调试人员" prop="technician">
              <el-input v-model="createForm.technician" placeholder="请输入调试人员" />
            </el-form-item>
            <el-form-item label="负责人" prop="responsiblePerson">
              <el-input v-model="createForm.responsiblePerson" placeholder="请输入负责人" />
            </el-form-item>
            <el-form-item label="预计工时（小时）" prop="estimatedHours">
              <el-input v-model.number="createForm.estimatedHours" type="number" min="0.5" step="0.5" placeholder="请输入预计工时" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="createForm.remark" type="textarea" placeholder="请输入备注" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCreateDialogClose">取消</el-button>
          <el-button type="primary" @click="handleConfirmCreate">确认创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 完成任务对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="完成安装调试任务"
      width="600px"
      @close="handleCompleteDialogClose"
    >
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        :rules="completeFormRules"
        label-width="120px"
      >
        <el-form-item label="任务编号">
          <el-input v-model="completeForm.taskCode" disabled />
        </el-form-item>
        <el-form-item label="夹具编号">
          <el-input v-model="completeForm.fixtureCode" disabled />
        </el-form-item>
        <el-form-item label="实际开始时间" prop="actualStartTime">
          <el-date-picker
            v-model="completeForm.actualStartTime"
            type="datetime"
            placeholder="选择实际开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="实际完成时间" prop="actualEndTime">
          <el-date-picker
            v-model="completeForm.actualEndTime"
            type="datetime"
            placeholder="选择实际完成时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="实际工时（小时）" prop="actualHours">
          <el-input v-model.number="completeForm.actualHours" type="number" min="0.5" step="0.5" placeholder="请输入实际工时" />
        </el-form-item>
        <el-form-item label="调试结果" prop="setupResult">
          <el-radio-group v-model="completeForm.setupResult">
            <el-radio label="success">调试成功</el-radio>
            <el-radio label="partial">部分成功</el-radio>
            <el-radio label="failure">调试失败</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调试总结" prop="setupSummary">
          <el-input v-model="completeForm.setupSummary" type="textarea" placeholder="请输入调试总结" rows="3" />
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="completeForm.operator" placeholder="请输入操作人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCompleteDialogClose">取消</el-button>
          <el-button type="primary" @click="handleConfirmComplete">确认完成</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, Refresh } from '@element-plus/icons-vue'

// 响应式数据
const loading = ref(false)
const taskList = ref([])
const searchForm = reactive({
  taskCode: '',
  fixtureCode: '',
  productionLine: '',
  status: ''
})
const dateRange = ref([])
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const drawerVisible = ref(false)
const createDialogVisible = ref(false)
const completeDialogVisible = ref(false)
const selectedTask = ref(null)
const createFormRef = ref(null)
const completeFormRef = ref(null)
const createForm = reactive({
  taskCode: '',
  fixtureCode: '',
  fixtureName: '',
  productionLine: '',
  workstation: '',
  setupType: 'first_install',
  plannedStartTime: '',
  plannedEndTime: '',
  technician: '',
  responsiblePerson: '',
  estimatedHours: 1,
  remark: ''
})
const completeForm = reactive({
  taskCode: '',
  fixtureCode: '',
  actualStartTime: '',
  actualEndTime: '',
  actualHours: 0,
  setupResult: 'success',
  setupSummary: '',
  operator: ''
})
const setupRecords = ref([])
const setupIssues = ref([])
const statistics = reactive({
  totalTasks: 0,
  pendingTasks: 0,
  inProgressTasks: 0,
  completedTasks: 0
})

// 表单验证规则
const createFormRules = {
  taskCode: [
    { required: true, message: '请输入任务编号', trigger: 'blur' }
  ],
  fixtureCode: [
    { required: true, message: '请输入夹具编号', trigger: 'blur' }
  ],
  fixtureName: [
    { required: true, message: '请输入夹具名称', trigger: 'blur' }
  ],
  productionLine: [
    { required: true, message: '请选择生产线', trigger: 'change' }
  ],
  workstation: [
    { required: true, message: '请输入工位', trigger: 'blur' }
  ],
  setupType: [
    { required: true, message: '请选择调试类型', trigger: 'change' }
  ],
  plannedStartTime: [
    { required: true, message: '请选择计划开始时间', trigger: 'change' }
  ],
  plannedEndTime: [
    { required: true, message: '请选择计划完成时间', trigger: 'change' }
  ],
  technician: [
    { required: true, message: '请输入调试人员', trigger: 'blur' }
  ],
  estimatedHours: [
    { required: true, message: '请输入预计工时', trigger: 'blur' },
    { type: 'number', min: 0.5, message: '预计工时不能小于0.5小时', trigger: 'blur' }
  ]
}

const completeFormRules = {
  actualStartTime: [
    { required: true, message: '请选择实际开始时间', trigger: 'change' }
  ],
  actualEndTime: [
    { required: true, message: '请选择实际完成时间', trigger: 'change' }
  ],
  actualHours: [
    { required: true, message: '请输入实际工时', trigger: 'blur' },
    { type: 'number', min: 0.5, message: '实际工时不能小于0.5小时', trigger: 'blur' }
  ],
  setupResult: [
    { required: true, message: '请选择调试结果', trigger: 'change' }
  ],
  setupSummary: [
    { required: true, message: '请输入调试总结', trigger: 'blur' }
  ],
  operator: [
    { required: true, message: '请输入操作人', trigger: 'blur' }
  ]
}

// 获取生产线文本
const getProductionLineText = (line) => {
  const lineMap = {
    'line_a': '生产线A',
    'line_b': '生产线B',
    'line_c': '生产线C',
    'line_d': '生产线D'
  }
  return lineMap[line] || line
}

// 获取调试类型文本
const getSetupTypeText = (type) => {
  const typeMap = {
    'first_install': '首次安装',
    'line_change': '换线调试',
    'repair': '故障修复',
    'maintenance': '定期维护'
  }
  return typeMap[type] || type
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    'pending': 'info',
    'in_progress': 'warning',
    'completed': 'success',
    'cancelled': 'danger',
    'resolved': 'success'
  }
  return statusMap[status] || 'default'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'pending': '待开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'cancelled': '已取消'
  }
  return statusMap[status] || status
}

// 获取记录类型
const getRecordType = (actionType) => {
  const typeMap = {
    'create': 'primary',
    'start': 'warning',
    'complete': 'success',
    'cancel': 'danger'
  }
  return typeMap[actionType] || 'primary'
}

// 获取操作文本
const getActionText = (actionType) => {
  const actionMap = {
    'create': '创建任务',
    'start': '开始任务',
    'complete': '完成任务',
    'cancel': '取消任务'
  }
  return actionMap[actionType] || actionType
}

// 加载任务列表
const loadTaskList = async () => {
  loading.value = true
  try {
    // 模拟API请求
    // const response = await fixtureSetupService.getTaskList({
    //   ...searchForm,
    //   startDate: dateRange.value[0],
    //   endDate: dateRange.value[1],
    //   page: pagination.currentPage,
    //   pageSize: pagination.pageSize
    // })
    // 模拟数据
    taskList.value = generateMockData()
    pagination.total = 50
    calculateStatistics()
  } catch (error) {
    ElMessage.error('获取任务列表失败')
    console.error('获取任务列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 生成模拟数据
const generateMockData = () => {
  const data = []
  const startIndex = (pagination.currentPage - 1) * pagination.pageSize
  for (let i = 0; i < pagination.pageSize; i++) {
    const index = startIndex + i
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled']
    const productionLines = ['line_a', 'line_b', 'line_c', 'line_d']
    const setupTypes = ['first_install', 'line_change', 'repair', 'maintenance']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const now = new Date()
    const plannedStartTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
    const plannedEndTime = new Date(plannedStartTime.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000)
    
    data.push({
      id: index + 1,
      taskCode: `SET-${String(index + 1).padStart(4, '0')}`,
      fixtureCode: `FIX-${String(Math.floor(index / 2) + 1).padStart(4, '0')}`,
      fixtureName: `安装调试夹具${index + 1}`,
      productionLine: productionLines[Math.floor(Math.random() * productionLines.length)],
      workstation: `工位${Math.floor(Math.random() * 10) + 1}`,
      setupType: setupTypes[Math.floor(Math.random() * setupTypes.length)],
      plannedStartTime: plannedStartTime.toLocaleString(),
      plannedEndTime: plannedEndTime.toLocaleString(),
      actualStartTime: status !== 'pending' ? new Date(plannedStartTime.getTime() + Math.random() * 24 * 60 * 60 * 1000).toLocaleString() : null,
      actualEndTime: status === 'completed' ? new Date(plannedEndTime.getTime() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString() : null,
      status: status,
      technician: `技术员${Math.floor(index % 5) + 1}`,
      responsiblePerson: `负责人${Math.floor(index % 3) + 1}`,
      estimatedHours: Math.floor(Math.random() * 20) + 1,
      actualHours: status === 'completed' ? Math.floor(Math.random() * 20) + 1 : null,
      creator: `创建人${Math.floor(index % 5) + 1}`,
      createTime: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleString(),
      remark: `任务备注信息${index + 1}`
    })
  }
  return data
}

// 计算统计数据
const calculateStatistics = () => {
  statistics.totalTasks = taskList.value.length
  statistics.pendingTasks = taskList.value.filter(item => item.status === 'pending').length
  statistics.inProgressTasks = taskList.value.filter(item => item.status === 'in_progress').length
  statistics.completedTasks = taskList.value.filter(item => item.status === 'completed').length
}

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1
  loadTaskList()
}

// 重置搜索条件
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  dateRange.value = []
  pagination.currentPage = 1
  loadTaskList()
}

// 刷新
const handleRefresh = () => {
  loadTaskList()
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadTaskList()
}

// 当前页改变
const handleCurrentChange = (current) => {
  pagination.currentPage = current
  loadTaskList()
}

// 选择行变化
const handleSelectionChange = (selection) => {
  // 处理选中的行
}

// 查看任务详情
const handleViewTask = (row) => {
  selectedTask.value = { ...row }
  loadSetupRecords(row.id)
  loadSetupIssues(row.id)
  drawerVisible.value = true
}

// 新增任务
const handleCreateTask = () => {
  resetCreateForm()
  // 生成默认任务编号
  createForm.taskCode = `SET-${Date.now().toString().slice(-8)}`
  createDialogVisible.value = true
}

// 导入任务
const handleImportTasks = async () => {
  try {
    // 这里可以实现文件上传逻辑
    ElMessage.success('导入任务成功')
    loadTaskList()
  } catch (error) {
    ElMessage.error('导入任务失败')
    console.error('导入任务失败:', error)
  }
}

// 导出任务
const handleExportTasks = async () => {
  try {
    // 这里可以实现文件导出逻辑
    ElMessage.success('导出任务成功')
  } catch (error) {
    ElMessage.error('导出任务失败')
    console.error('导出任务失败:', error)
  }
}

// 开始任务
const handleStartTask = (row) => {
  ElMessageBox.confirm(
    `确定要开始任务「${row.taskCode}」吗？`,
    '开始任务确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      ElMessage.success('任务开始成功')
      loadTaskList()
    } catch (error) {
      ElMessage.error('任务开始失败')
      console.error('任务开始失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 完成任务
const handleCompleteTask = (row) => {
  Object.assign(completeForm, {
    taskCode: row.taskCode,
    fixtureCode: row.fixtureCode,
    actualStartTime: row.actualStartTime || '',
    actualEndTime: new Date().toLocaleString(),
    actualHours: row.estimatedHours || 1,
    setupResult: 'success',
    setupSummary: '',
    operator: ''
  })
  completeDialogVisible.value = true
}

// 取消任务
const handleCancelTask = (row) => {
  ElMessageBox.confirm(
    `确定要取消任务「${row.taskCode}」吗？`,
    '取消任务确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    }
  ).then(async () => {
    try {
      // 模拟API请求
      ElMessage.success('任务取消成功')
      loadTaskList()
    } catch (error) {
      ElMessage.error('任务取消失败')
      console.error('任务取消失败:', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 确认创建任务
const handleConfirmCreate = async () => {
  const valid = await createFormRef.value.validate()
  if (!valid) return

  // 检查日期范围
  if (new Date(createForm.plannedEndTime) <= new Date(createForm.plannedStartTime)) {
    ElMessage.warning('计划完成时间必须大于计划开始时间')
    return
  }

  try {
    // 模拟API请求
    ElMessage.success('任务创建成功')
    createDialogVisible.value = false
    loadTaskList()
  } catch (error) {
    ElMessage.error('任务创建失败')
    console.error('任务创建失败:', error)
  }
}

// 确认完成任务
const handleConfirmComplete = async () => {
  const valid = await completeFormRef.value.validate()
  if (!valid) return

  // 检查日期范围
  if (new Date(completeForm.actualEndTime) <= new Date(completeForm.actualStartTime)) {
    ElMessage.warning('实际完成时间必须大于实际开始时间')
    return
  }

  try {
    // 模拟API请求
    ElMessage.success('任务完成成功')
    completeDialogVisible.value = false
    loadTaskList()
  } catch (error) {
    ElMessage.error('任务完成失败')
    console.error('任务完成失败:', error)
  }
}

// 加载安装调试记录
const loadSetupRecords = async (taskId) => {
  try {
    // 模拟API请求
    // const response = await fixtureSetupService.getSetupRecords(taskId)
    // setupRecords.value = response.data
    
    // 模拟数据
    setupRecords.value = [
      {
        id: 1,
        actionType: 'create',
        operator: '创建人1',
        note: '创建安装调试任务',
        recordTime: new Date(Date.now() - 10000000000).toLocaleString()
      },
      {
        id: 2,
        actionType: 'start',
        operator: '技术员1',
        note: '开始进行安装调试',
        recordTime: new Date(Date.now() - 8000000000).toLocaleString()
      },
      {
        id: 3,
        actionType: 'complete',
        operator: '技术员1',
        note: '完成安装调试，测试通过',
        recordTime: new Date(Date.now() - 5000000000).toLocaleString()
      }
    ]
  } catch (error) {
    console.error('获取安装调试记录失败:', error)
  }
}

// 加载调试问题记录
const loadSetupIssues = async (taskId) => {
  try {
    // 模拟API请求
    // const response = await fixtureSetupService.getSetupIssues(taskId)
    // setupIssues.value = response.data
    
    // 模拟数据
    setupIssues.value = [
      {
        id: 1,
        issueDescription: '夹具定位不准，需要微调',
        solution: '调整定位销位置，重新校准',
        reportedBy: '技术员1',
        reportTime: new Date(Date.now() - 7000000000).toLocaleString(),
        status: 'resolved'
      },
      {
        id: 2,
        issueDescription: '压紧机构力度不足',
        solution: '更换弹簧，增加预紧力',
        reportedBy: '技术员1',
        reportTime: new Date(Date.now() - 6000000000).toLocaleString(),
        status: 'resolved'
      }
    ]
  } catch (error) {
    console.error('获取调试问题记录失败:', error)
  }
}

// 关闭创建对话框
const handleCreateDialogClose = () => {
  createDialogVisible.value = false
  resetCreateForm()
}

// 关闭完成对话框
const handleCompleteDialogClose = () => {
  completeDialogVisible.value = false
  resetCompleteForm()
}

// 重置创建表单
const resetCreateForm = () => {
  Object.keys(createForm).forEach(key => {
    if (key === 'setupType') {
      createForm[key] = 'first_install'
    } else if (key === 'estimatedHours') {
      createForm[key] = 1
    } else if (typeof createForm[key] === 'number') {
      createForm[key] = 0
    } else {
      createForm[key] = ''
    }
  })
}

// 重置完成表单
const resetCompleteForm = () => {
  Object.keys(completeForm).forEach(key => {
    if (key === 'setupResult') {
      completeForm[key] = 'success'
    } else if (typeof completeForm[key] === 'number') {
      completeForm[key] = 0
    } else {
      completeForm[key] = ''
    }
  })
}

// 组件挂载时加载数据
onMounted(() => {
  loadTaskList()
})
</script>

<style scoped>
.fixture-setup-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.task-overview {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.overview-card.info {
  border-left: 4px solid #909399;
}

.overview-card.warning {
  border-left: 4px solid #e6a23c;
}

.overview-card.success {
  border-left: 4px solid #67c23a;
}

.card-content {
  text-align: center;
}

.card-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.card-label {
  font-size: 14px;
  color: #606266;
}

.filter-card {
  margin-bottom: 20px;
  border-radius: 4px;
}

.data-table-card {
  border-radius: 4px;
  overflow: hidden;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.task-details {
  padding: 20px 0;
}

.setup-records,
.setup-issues {
  margin-top: 30px;
}

.record-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.record-content {
  color: #606266;
  margin-bottom: 5px;
}

.record-note {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.no-data {
  text-align: center;
  padding: 20px;
  color: #909399;
}

@media (max-width: 768px) {
  .fixture-setup-container {
    padding: 10px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  
  .overview-card {
    height: 100px;
  }
  
  .card-value {
    font-size: 24px;
  }
}
</style>