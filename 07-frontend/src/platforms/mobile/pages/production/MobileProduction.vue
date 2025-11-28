<template>
  <div class="mobile-production">
    <!-- 顶部导航 -->
    <div class="page-header">
      <div class="header-left">
        <el-button type="text" icon="el-icon-arrow-left" @click="handleBack" />
      </div>
      <h1 class="header-title">生产管理</h1>
      <div class="header-right">
        <el-button type="text" icon="el-icon-search" @click="handleSearch" />
      </div>
    </div>

    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" class="production-tabs">
      <!-- 我的任务 -->
      <el-tab-pane label="我的任务" name="myTasks">
        <div class="task-filter">
          <el-select v-model="taskFilter.status" placeholder="任务状态" class="filter-select">
            <el-option label="全部" value="" />
            <el-option label="待开始" value="pending" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
          <el-select v-model="taskFilter.process" placeholder="工序" class="filter-select">
            <el-option label="全部" value="" />
            <el-option v-for="process in processOptions" :key="process.value" :label="process.label" :value="process.value" />
          </el-select>
        </div>

        <div class="task-list">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="filteredTasks.length === 0" class="empty-state">
            <el-empty description="暂无生产任务" />
          </div>
          <div v-else class="task-items">
            <div 
              v-for="task in filteredTasks" 
              :key="task.id"
              class="task-item"
              :class="getTaskStatusClass(task.status)"
              @click="handleTaskClick(task)"
            >
              <div class="task-header">
                <h3 class="task-title">{{ task.title }}</h3>
                <el-tag :type="getTaskStatusType(task.status)">{{ getTaskStatusText(task.status) }}</el-tag>
              </div>
              <div class="task-info">
                <div class="info-item">
                  <span class="info-label">排程编号：</span>
                  <span class="info-value">{{ task.scheduleCode }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">产品：</span>
                  <span class="info-value">{{ task.productName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">工序：</span>
                  <span class="info-value">{{ task.processName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">设备：</span>
                  <span class="info-value">{{ task.equipmentName }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">计划数量：</span>
                  <span class="info-value">{{ task.planQuantity }} 件</span>
                </div>
                <div class="info-item">
                  <span class="info-label">完成数量：</span>
                  <span class="info-value">{{ task.completedQuantity }} 件</span>
                </div>
              </div>
              <div class="task-progress">
                <el-progress 
                  :percentage="task.progress" 
                  :format="percentageFormat"
                  :status="getProgressStatus(task.progress)"
                />
              </div>
              <div class="task-actions">
                <el-button 
                  v-if="task.status === 'pending'"
                  type="primary" 
                  size="small" 
                  @click.stop="handleStartTask(task)"
                >
                  开始任务
                </el-button>
                <el-button 
                  v-else-if="task.status === 'in_progress'"
                  type="success" 
                  size="small" 
                  @click.stop="handleReportProgress(task)"
                >
                  上报进度
                </el-button>
                <el-button 
                  v-else-if="task.status === 'in_progress'"
                  type="warning" 
                  size="small" 
                  @click.stop="handlePauseTask(task)"
                >
                  暂停任务
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 生产报表 -->
      <el-tab-pane label="生产报表" name="reports">
        <div class="report-filter">
          <el-date-picker
            v-model="reportDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="date-picker"
          />
          <el-button type="primary" size="small" @click="handleGenerateReport">
            生成报表
          </el-button>
        </div>

        <div class="report-summary">
          <el-card shadow="never" class="summary-card">
            <div class="summary-item">
              <div class="summary-label">今日产量</div>
              <div class="summary-value">{{ todayOutput }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">累计产量</div>
              <div class="summary-value">{{ totalOutput }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">良品率</div>
              <div class="summary-value">{{ passRate }}%</div>
            </div>
          </el-card>
        </div>

        <div class="report-chart">
          <el-empty description="产量趋势图表" style="margin: 40px 0;">
            <el-button type="primary" @click="handleViewChart">查看图表</el-button>
          </el-empty>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 任务详情弹窗 -->
    <el-dialog
      v-model="showTaskDetail"
      title="任务详情"
      width="90%"
      :before-close="handleCloseTaskDetail"
    >
      <div v-if="selectedTask.id" class="task-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务编号">{{ selectedTask.code }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ selectedTask.title }}</el-descriptions-item>
          <el-descriptions-item label="排程编号">{{ selectedTask.scheduleCode }}</el-descriptions-item>
          <el-descriptions-item label="产品信息">{{ selectedTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="工序名称">{{ selectedTask.processName }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getTaskStatusType(selectedTask.status)">{{ getTaskStatusText(selectedTask.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ selectedTask.planQuantity }} 件</el-descriptions-item>
          <el-descriptions-item label="完成数量">{{ selectedTask.completedQuantity }} 件</el-descriptions-item>
          <el-descriptions-item label="设备信息">{{ selectedTask.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ selectedTask.startTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="预计完成时间">{{ selectedTask.expectedEndTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际完成时间">{{ selectedTask.actualEndTime || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-actions">
          <el-button 
            v-if="selectedTask.status === 'pending'"
            type="primary" 
            size="small" 
            @click="handleStartTask(selectedTask)"
          >
            开始任务
          </el-button>
          <el-button 
            v-else-if="selectedTask.status === 'in_progress'"
            type="success" 
            size="small" 
            @click="handleReportProgress(selectedTask)"
          >
            上报进度
          </el-button>
          <el-button 
            v-else-if="selectedTask.status === 'in_progress'"
            type="warning" 
            size="small" 
            @click="handlePauseTask(selectedTask)"
          >
            暂停任务
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 进度上报弹窗 -->
    <el-dialog
      v-model="showProgressReport"
      title="上报进度"
      width="90%"
      :before-close="handleCloseProgressReport"
    >
      <el-form
        v-if="reportForm.taskId"
        :model="reportForm"
        label-width="80px"
      >
        <el-form-item label="任务名称" disabled>
          <el-input v-model="reportForm.taskTitle" />
        </el-form-item>
        <el-form-item label="完成数量" prop="completedQuantity">
          <el-input-number 
            v-model="reportForm.completedQuantity" 
            :min="0" 
            :max="reportForm.maxQuantity"
            placeholder="请输入完成数量"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="不良数量" prop="defectQuantity">
          <el-input-number 
            v-model="reportForm.defectQuantity" 
            :min="0" 
            placeholder="请输入不良数量"
            :step="1"
          />
        </el-form-item>
        <el-form-item label="备注信息">
          <el-input 
            v-model="reportForm.remark" 
            type="textarea" 
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="是否完成">
          <el-switch v-model="reportForm.isCompleted" />
        </el-form-item>
      </el-form>

      <div class="dialog-footer">
        <el-button @click="handleCloseProgressReport">取消</el-button>
        <el-button type="primary" @click="handleSubmitProgress">提交</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义任务类型
interface ProductionTask {
  id: string
  code: string
  title: string
  scheduleCode: string
  productName: string
  processName: string
  equipmentName: string
  planQuantity: number
  completedQuantity: number
  progress: number
  status: 'pending' | 'in_progress' | 'completed' | 'paused'
  startTime?: string
  expectedEndTime?: string
  actualEndTime?: string
  priority: number
  operator?: string
}

// 定义进度上报表单类型
interface ProgressReportForm {
  taskId: string
  taskTitle: string
  completedQuantity: number
  defectQuantity: number
  remark: string
  isCompleted: boolean
  maxQuantity: number
}

// 定义筛选条件类型
interface TaskFilter {
  status: string
  process: string
}

// 定义工序选项类型
interface ProcessOption {
  label: string
  value: string
}

// 路由
const router = useRouter()

// 响应式数据
const activeTab = ref('myTasks')
const loading = ref(false)
const showTaskDetail = ref(false)
const showProgressReport = ref(false)
const selectedTask = ref<ProductionTask>({} as ProductionTask)
const tasks = ref<ProductionTask[]>([])
const todayOutput = ref(0)
const totalOutput = ref(0)
const passRate = ref(0)
const reportDateRange = ref<string[]>([])

// 筛选条件
const taskFilter = reactive<TaskFilter>({
  status: '',
  process: ''
})

// 进度上报表单
const reportForm = reactive<ProgressReportForm>({
  taskId: '',
  taskTitle: '',
  completedQuantity: 0,
  defectQuantity: 0,
  remark: '',
  isCompleted: false,
  maxQuantity: 0
})

// 工序选项
const processOptions = ref<ProcessOption[]>([
  { label: '工序1', value: 'process1' },
  { label: '工序2', value: 'process2' },
  { label: '工序3', value: 'process3' },
  { label: '工序4', value: 'process4' }
])

// 计算属性：筛选后的任务列表
const filteredTasks = computed(() => {
  return tasks.value.filter(task => {
    let match = true
    
    if (taskFilter.status) {
      match = match && task.status === taskFilter.status
    }
    
    if (taskFilter.process) {
      match = match && task.processName.includes(taskFilter.process)
    }
    
    return match
  })
})

// 组件挂载时加载数据
onMounted(() => {
  loadTasks()
  loadStatistics()
})

// 加载任务数据
const loadTasks = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    tasks.value = getMockTasks()
  } catch (error) {
    ElMessage.error('加载任务失败')
    console.error('加载任务失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 计算统计数据
    todayOutput.value = tasks.value.reduce((sum, task) => sum + (task.status === 'completed' ? task.completedQuantity : 0), 0)
    totalOutput.value = tasks.value.reduce((sum, task) => sum + task.completedQuantity, 0)
    const totalCompleted = tasks.value.reduce((sum, task) => sum + task.completedQuantity, 0)
    const totalDefects = 10 // 模拟不良数量
    passRate.value = totalCompleted > 0 ? Math.round(((totalCompleted - totalDefects) / totalCompleted) * 100) : 0
  } catch (error) {
    ElMessage.error('加载统计数据失败')
    console.error('加载统计数据失败:', error)
  }
}

// 获取模拟任务数据
const getMockTasks = (): ProductionTask[] => {
  const now = new Date()
  const formatDate = (date: Date) => date.toISOString().slice(0, 10)
  const formatDateTime = (date: Date) => date.toISOString().slice(0, 16).replace('T', ' ')
  
  return [
    {
      id: '1',
      code: 'TASK2023001',
      title: '产品A装配任务',
      scheduleCode: 'SC2023001',
      productName: '产品A',
      processName: '装配',
      equipmentName: '装配线1',
      planQuantity: 100,
      completedQuantity: 60,
      progress: 60,
      status: 'in_progress',
      startTime: formatDateTime(new Date(now.getTime() - 2 * 60 * 60 * 1000)),
      expectedEndTime: formatDateTime(new Date(now.getTime() + 4 * 60 * 60 * 1000)),
      priority: 2,
      operator: '张三'
    },
    {
      id: '2',
      code: 'TASK2023002',
      title: '产品B测试任务',
      scheduleCode: 'SC2023002',
      productName: '产品B',
      processName: '测试',
      equipmentName: '测试设备A',
      planQuantity: 50,
      completedQuantity: 0,
      progress: 0,
      status: 'pending',
      expectedEndTime: formatDateTime(new Date(now.getTime() + 8 * 60 * 60 * 1000)),
      priority: 1
    },
    {
      id: '3',
      code: 'TASK2023003',
      title: '产品C包装任务',
      scheduleCode: 'SC2023003',
      productName: '产品C',
      processName: '包装',
      equipmentName: '包装机2',
      planQuantity: 80,
      completedQuantity: 80,
      progress: 100,
      status: 'completed',
      startTime: formatDateTime(new Date(now.getTime() - 24 * 60 * 60 * 1000)),
      expectedEndTime: formatDateTime(new Date(now.getTime() - 8 * 60 * 60 * 1000)),
      actualEndTime: formatDateTime(new Date(now.getTime() - 9 * 60 * 60 * 1000)),
      priority: 3,
      operator: '李四'
    },
    {
      id: '4',
      code: 'TASK2023004',
      title: '产品D焊接任务',
      scheduleCode: 'SC2023004',
      productName: '产品D',
      processName: '焊接',
      equipmentName: '焊接机1',
      planQuantity: 60,
      completedQuantity: 30,
      progress: 50,
      status: 'paused',
      startTime: formatDateTime(new Date(now.getTime() - 3 * 60 * 60 * 1000)),
      expectedEndTime: formatDateTime(new Date(now.getTime() + 5 * 60 * 60 * 1000)),
      priority: 2,
      operator: '王五'
    }
  ]
}

// 获取任务状态文本
const getTaskStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '待开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }
  return statusMap[status] || status
}

// 获取任务状态类型
const getTaskStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    'pending': 'info',
    'in_progress': 'success',
    'completed': 'primary',
    'paused': 'warning'
  }
  return typeMap[status] || 'default'
}

// 获取任务状态样式类
const getTaskStatusClass = (status: string): string => {
  return `task-${status}`
}

// 获取进度条状态
const getProgressStatus = (progress: number): string => {
  if (progress >= 100) return 'success'
  if (progress >= 50) return ''
  return 'exception'
}

// 百分比格式化
const percentageFormat = (percentage: number): string => {
  return `${percentage}%`
}

// 处理返回
const handleBack = () => {
  router.back()
}

// 处理搜索
const handleSearch = () => {
  ElMessage.info('搜索功能待实现')
}

// 处理任务点击
const handleTaskClick = (task: ProductionTask) => {
  selectedTask.value = { ...task }
  showTaskDetail.value = true
}

// 处理关闭任务详情
const handleCloseTaskDetail = () => {
  showTaskDetail.value = false
}

// 处理开始任务
const handleStartTask = async (task: ProductionTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要开始任务「${task.title}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新任务状态
    const taskIndex = tasks.value.findIndex(t => t.id === task.id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].status = 'in_progress'
      tasks.value[taskIndex].startTime = new Date().toISOString().slice(0, 16).replace('T', ' ')
    }
    
    ElMessage.success('任务已开始')
    
    // 如果在详情弹窗中，关闭弹窗
    if (showTaskDetail.value) {
      showTaskDetail.value = false
    }
  } catch (error) {
    // 取消操作
  }
}

// 处理暂停任务
const handlePauseTask = async (task: ProductionTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要暂停任务「${task.title}」吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 更新任务状态
    const taskIndex = tasks.value.findIndex(t => t.id === task.id)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].status = 'paused'
    }
    
    ElMessage.success('任务已暂停')
    
    // 如果在详情弹窗中，关闭弹窗
    if (showTaskDetail.value) {
      showTaskDetail.value = false
    }
  } catch (error) {
    // 取消操作
  }
}

// 处理上报进度
const handleReportProgress = (task: ProductionTask) => {
  // 重置表单
  reportForm.taskId = task.id
  reportForm.taskTitle = task.title
  reportForm.completedQuantity = task.completedQuantity
  reportForm.defectQuantity = 0
  reportForm.remark = ''
  reportForm.isCompleted = false
  reportForm.maxQuantity = task.planQuantity
  
  showProgressReport.value = true
}

// 处理关闭进度上报
const handleCloseProgressReport = () => {
  showProgressReport.value = false
}

// 处理提交进度
const handleSubmitProgress = async () => {
  try {
    if (reportForm.completedQuantity > reportForm.maxQuantity) {
      ElMessage.warning('完成数量不能超过计划数量')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要提交进度吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    // 更新任务数据
    const taskIndex = tasks.value.findIndex(t => t.id === reportForm.taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].completedQuantity = reportForm.completedQuantity
      tasks.value[taskIndex].progress = Math.round((reportForm.completedQuantity / reportForm.maxQuantity) * 100)
      
      if (reportForm.isCompleted || tasks.value[taskIndex].progress >= 100) {
        tasks.value[taskIndex].status = 'completed'
        tasks.value[taskIndex].actualEndTime = new Date().toISOString().slice(0, 16).replace('T', ' ')
      }
    }
    
    ElMessage.success('进度提交成功')
    showProgressReport.value = false
    
    // 重新加载统计数据
    await loadStatistics()
  } catch (error) {
    // 取消操作
  }
}

// 处理生成报表
const handleGenerateReport = () => {
  ElMessage.success('报表生成成功')
}

// 处理查看图表
const handleViewChart = () => {
  ElMessage.info('图表查看功能待实现')
}
</script>

<style scoped>
.mobile-production {
  padding-bottom: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 头部样式 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

/* 标签页样式 */
.production-tabs {
  background-color: #fff;
}

/* 任务列表样式 */
.task-filter {
  display: flex;
  padding: 15px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  gap: 10px;
}

.filter-select {
  flex: 1;
}

.task-list {
  padding: 15px;
}

.task-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.task-item:active {
  transform: scale(0.98);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.task-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  margin-right: 10px;
}

.task-info {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-label {
  color: #909399;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #606266;
  flex: 1;
}

.task-progress {
  margin-bottom: 15px;
}

.task-actions {
  display: flex;
  gap: 10px;
}

/* 任务状态样式 */
.task-pending {
  border-left: 4px solid #909399;
}

.task-in_progress {
  border-left: 4px solid #67c23a;
}

.task-completed {
  border-left: 4px solid #409eff;
}

.task-paused {
  border-left: 4px solid #e6a23c;
}

/* 报表样式 */
.report-filter {
  display: flex;
  padding: 15px;
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  gap: 10px;
  align-items: center;
}

.date-picker {
  flex: 1;
}

.report-summary {
  padding: 15px;
}

.summary-card {
  margin-bottom: 0;
}

.summary-item {
  text-align: center;
  padding: 10px 0;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

/* 弹窗样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

/* 加载和空状态 */
.loading-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.empty-state {
  background-color: #fff;
  border-radius: 8px;
  padding: 40px 0;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 375px) {
  .task-header {
    flex-direction: column;
  }
  
  .task-title {
    margin-bottom: 8px;
  }
  
  .task-actions {
    flex-direction: column;
  }
  
  .task-actions .el-button {
    width: 100%;
  }
}
</style>