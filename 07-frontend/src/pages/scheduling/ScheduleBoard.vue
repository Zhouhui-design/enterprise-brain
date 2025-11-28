<template>
  <div class="schedule-board">
    <div class="page-header">
      <h1>生产排程看板</h1>
      <div class="header-actions">
        <el-button @click="handleBack">
          <el-icon><ArrowLeft /></el-icon> 返回列表
        </el-button>
        <el-button type="primary" @click="handleEdit">
          <el-icon><Edit /></el-icon> 编辑排程
        </el-button>
        <el-button type="success" @click="handleStartSchedule" :disabled="!canStartSchedule">
          <el-icon><Play /></el-icon> 开始排程
        </el-button>
        <el-button type="warning" @click="handlePauseSchedule" :disabled="!canPauseSchedule">
          <el-icon><Pause /></el-icon> 暂停排程
        </el-button>
      </div>
    </div>
    
    <!-- 排程概览 -->
    <el-card shadow="never" class="overview-card">
      <el-row :gutter="20">
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-label">排程编号</div>
            <div class="overview-value">{{ scheduleInfo.scheduleCode }}</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-label">产品名称</div>
            <div class="overview-value">{{ scheduleInfo.productName }}</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="overview-item">
            <div class="overview-label">计划数量</div>
            <div class="overview-value">{{ scheduleInfo.quantity }}</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="overview-item">
            <div class="overview-label">已完成数量</div>
            <div class="overview-value">{{ scheduleInfo.completedQuantity }}</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="overview-item">
            <div class="overview-label">完成进度</div>
            <div class="overview-value progress">
              <el-progress 
                :percentage="scheduleInfo.progress" 
                :format="percentageFormat" 
                :status="getProgressStatus(scheduleInfo.progress)"
              />
            </div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="overview-item">
            <div class="overview-label">当前状态</div>
            <div class="overview-value">
              <el-tag :type="getStatusType(scheduleInfo.status)">{{ getStatusText(scheduleInfo.status) }}</el-tag>
            </div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="overview-item">
            <div class="overview-label">负责人</div>
            <div class="overview-value">{{ scheduleInfo.manager }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
    
    <el-row :gutter="20">
      <!-- 左侧：工序进度 -->
      <el-col :span="8">
        <el-card shadow="never" class="process-card">
          <template #header>
            <div class="card-header">
              <span>工序进度</span>
              <el-button type="text" size="small" @click="handleRefreshProcesses" :loading="refreshing">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </div>
          </template>
          <div class="process-list" v-loading="loading">
            <div 
              v-for="(process, index) in scheduleInfo.processes" 
              :key="process.id"
              class="process-item"
              :class="{
                'process-active': process.status === 'in_progress',
                'process-completed': process.status === 'completed',
                'process-pending': process.status === 'pending',
                'process-paused': process.status === 'paused'
              }"
              @click="handleProcessClick(process)"
            >
              <div class="process-header">
                <span class="process-number">{{ process.processSequence }}</span>
                <span class="process-name">{{ process.processName }}</span>
                <el-tag :type="getProcessStatusType(process.status)">{{ getProcessStatusText(process.status) }}</el-tag>
              </div>
              <div class="process-info">
                <div class="info-item">
                  <span class="info-label">设备：</span>
                  <span class="info-value">{{ process.equipment }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">工时：</span>
                  <span class="info-value">{{ process.estimatedTime }}小时</span>
                </div>
                <div class="info-item">
                  <span class="info-label">进度：</span>
                  <span class="info-value">{{ process.progress }}%</span>
                </div>
              </div>
              <div class="process-progress">
                <el-progress 
                  :percentage="process.progress" 
                  :format="percentageFormat" 
                  :status="getProcessProgressStatus(process.progress)"
                />
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 资源使用情况 -->
        <el-card shadow="never" class="resources-card">
          <template #header>
            <div class="card-header">
              <span>资源使用情况</span>
            </div>
          </template>
          <div class="resource-item" v-for="resource in scheduleInfo.resources" :key="resource.id">
            <div class="resource-header">
              <span class="resource-name">{{ resource.name }}</span>
              <span class="resource-type">{{ resource.type }}</span>
            </div>
            <el-progress 
              :percentage="resource.usageRate" 
              :format="percentageFormat" 
              :status="getResourceUsageStatus(resource.usageRate)"
            />
            <div class="resource-details">
              <span>已使用: {{ resource.usedQuantity }}</span>
              <span>总量: {{ resource.totalQuantity }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 右侧：甘特图和进度 -->
      <el-col :span="16">
        <el-card shadow="never" class="gantt-card">
          <template #header>
            <div class="card-header">
              <span>排程甘特图</span>
              <div class="gantt-actions">
                <el-select v-model="ganttView" placeholder="视图" size="small" @change="handleGanttViewChange">
                  <el-option label="日视图" value="day" />
                  <el-option label="周视图" value="week" />
                  <el-option label="月视图" value="month" />
                </el-select>
                <el-button type="text" size="small" @click="handleZoomIn">
                  <el-icon><ZoomIn /></el-icon>
                </el-button>
                <el-button type="text" size="small" @click="handleZoomOut">
                  <el-icon><ZoomOut /></el-icon>
                </el-button>
              </div>
            </div>
          </template>
          
          <!-- 简化的甘特图展示 -->
          <div class="gantt-container">
            <!-- 时间轴 -->
            <div class="gantt-timeline">
              <div 
                v-for="date in ganttDates" 
                :key="date.key"
                class="timeline-item"
              >
                {{ date.label }}
              </div>
            </div>
            
            <!-- 甘特图主体 -->
            <div class="gantt-body">
              <!-- 产品行 -->
              <div class="gantt-row">
                <div class="row-label">{{ scheduleInfo.productName }}</div>
                <div class="row-tasks">
                  <div 
                    class="task-bar main-task"
                    :style="{
                      left: '10%',
                      width: '80%'
                    }"
                    @click="handleTaskClick(null, 'total')"
                  >
                    <span>总排程</span>
                  </div>
                </div>
              </div>
              
              <!-- 工序行 -->
              <div 
                v-for="process in scheduleInfo.processes" 
                :key="process.id"
                class="gantt-row"
              >
                <div class="row-label">{{ process.processName }}</div>
                <div class="row-tasks">
                  <div 
                    class="task-bar"
                    :class="{
                      'task-completed': process.status === 'completed',
                      'task-active': process.status === 'in_progress',
                      'task-pending': process.status === 'pending',
                      'task-paused': process.status === 'paused'
                    }"
                    :style="{
                      left: `${10 + process.processSequence * 15}%`,
                      width: '12%'
                    }"
                    @click="handleTaskClick(process)"
                  >
                    <span>{{ process.progress }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
        
        <!-- 生产数据 -->
        <el-card shadow="never" class="production-data-card">
          <template #header>
            <div class="card-header">
              <span>生产数据统计</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                @change="handleDateRangeChange"
                value-format="YYYY-MM-DD"
              />
            </div>
          </template>
          
          <div class="chart-placeholder">
            <el-empty description="产量趋势图表" style="margin: 40px 0;"></el-empty>
          </div>
          
          <div class="data-stats">
            <el-row :gutter="20">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">今日产量</div>
                  <div class="stat-value">{{ productionStats.todayOutput }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">累计产量</div>
                  <div class="stat-value">{{ productionStats.totalOutput }}</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">良品率</div>
                  <div class="stat-value">{{ productionStats.passRate }}%</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-label">计划达成率</div>
                  <div class="stat-value">{{ productionStats.achievementRate }}%</div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 工序详情对话框 -->
    <el-dialog
      title="工序详情"
      v-model="processDetailVisible"
      width="600px"
      @close="handleProcessDetailClose"
    >
      <div class="process-detail" v-if="selectedProcess.id">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工序名称">{{ selectedProcess.processName }}</el-descriptions-item>
          <el-descriptions-item label="工序顺序">{{ selectedProcess.processSequence }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getProcessStatusType(selectedProcess.status)">{{ getProcessStatusText(selectedProcess.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完成进度">{{ selectedProcess.progress }}%</el-descriptions-item>
          <el-descriptions-item label="设备">{{ selectedProcess.equipment }}</el-descriptions-item>
          <el-descriptions-item label="操作员">{{ selectedProcess.operator }}</el-descriptions-item>
          <el-descriptions-item label="预计工时">{{ selectedProcess.estimatedTime }}小时</el-descriptions-item>
          <el-descriptions-item label="实际工时">{{ selectedProcess.actualTime || '-' }}小时</el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">{{ selectedProcess.startTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间" :span="2">{{ selectedProcess.endTime || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="process-operations">
          <h4>工序操作</h4>
          <el-form :inline="true" class="operation-form">
            <el-form-item label="实际产量">
              <el-input-number 
                v-model="processOperationForm.actualOutput" 
                :min="0" 
                placeholder="请输入实际产量" 
                :step="1"
              />
            </el-form-item>
            <el-form-item label="完成状态">
              <el-select v-model="processOperationForm.status" placeholder="请选择状态">
                <el-option label="待开始" value="pending" />
                <el-option label="进行中" value="in_progress" />
                <el-option label="已完成" value="completed" />
                <el-option label="已暂停" value="paused" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                @click="handleUpdateProcess" 
                :loading="updatingProcess"
              >
                更新状态
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Edit,
  Play,
  Pause,
  Refresh,
  ZoomIn,
  ZoomOut
} from '@element-plus/icons-vue'

// 定义类型
interface Process {
  id: number
  processName: string
  processSequence: number
  equipment: string
  operator: string
  estimatedTime: number
  actualTime?: string | number
  progress: number
  status: 'not_started' | 'in_progress' | 'completed' | 'paused'
  startTime?: string
  endTime?: string
}

interface Resource {
  id: number
  name: string
  type: string
  usedQuantity: number
  totalQuantity: number
  usageRate: number
}

interface ScheduleInfo {
  id: number
  scheduleCode: string
  productName: string
  quantity: number
  completedQuantity: number
  progress: number
  status: 'not_started' | 'in_progress' | 'completed' | 'paused'
  manager: string
  processes: Process[]
  resources: Resource[]
}

interface GanttDate {
  key: string
  label: string
}

interface ProductionStats {
  todayOutput: number
  totalOutput: number
  passRate: number
  achievementRate: number
}

interface ProcessOperationForm {
  actualOutput: number
  status: string
}

// 响应式数据
const scheduleId = ref('')
const loading = ref(false)
const refreshing = ref(false)
const updatingProcess = ref(false)
const processDetailVisible = ref(false)
const ganttView = ref('day')
const ganttDates = ref<GanttDate[]>([])
const dateRange = ref<string[]>([])

const scheduleInfo = reactive<ScheduleInfo>({
  id: 1,
  scheduleCode: 'SC2023001',
  productName: '产品A',
  quantity: 500,
  completedQuantity: 300,
  progress: 60,
  status: 'in_progress',
  manager: '张三',
  processes: [
    {
      id: 1,
      processName: '车削加工',
      processSequence: 1,
      equipment: '数控车床A',
      operator: '李四',
      estimatedTime: 8,
      actualTime: 8,
      progress: 100,
      status: 'completed',
      startTime: '2023-07-15 08:00:00',
      endTime: '2023-07-15 16:00:00'
    },
    {
      id: 2,
      processName: '铣削加工',
      processSequence: 2,
      equipment: '铣床A',
      operator: '王五',
      estimatedTime: 6,
      actualTime: 4,
      progress: 60,
      status: 'in_progress',
      startTime: '2023-07-16 08:00:00',
      endTime: ''
    },
    {
      id: 3,
      processName: '钻孔加工',
      processSequence: 3,
      equipment: '钻床A',
      operator: '赵六',
      estimatedTime: 4,
      actualTime: '',
      progress: 0,
      status: 'pending',
      startTime: '',
      endTime: ''
    }
  ],
  resources: [
    {
      id: 1,
      name: '数控车床A',
      type: '设备',
      usedQuantity: 8,
      totalQuantity: 8,
      usageRate: 100
    },
    {
      id: 2,
      name: '铣床A',
      type: '设备',
      usedQuantity: 4,
      totalQuantity: 6,
      usageRate: 66.7
    },
    {
      id: 3,
      name: '钢材A',
      type: '物料',
      usedQuantity: 300,
      totalQuantity: 500,
      usageRate: 60
    }
  ]
})

const productionStats = reactive<ProductionStats>({
  todayOutput: 50,
  totalOutput: 300,
  passRate: 98,
  achievementRate: 95
})

const selectedProcess = reactive<Process>({ 
  id: 0,
  processName: '',
  processSequence: 0,
  equipment: '',
  operator: '',
  estimatedTime: 0,
  progress: 0,
  status: 'not_started'
})

const processOperationForm = reactive<ProcessOperationForm>({
  actualOutput: 0,
  status: ''
})

// 路由
const route = useRoute()
const router = useRouter()

// 计算属性
const canStartSchedule = computed(() => {
  return scheduleInfo.status === 'paused' || scheduleInfo.status === 'not_started'
})

const canPauseSchedule = computed(() => {
  return scheduleInfo.status === 'in_progress'
})

// 组件挂载时初始化
onMounted(() => {
  scheduleId.value = (route.query.id as string) || '1'
  loadScheduleData()
  generateGanttDates()
})

// 加载排程数据
const loadScheduleData = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    // 数据已在reactive中初始化
  } catch (error) {
    ElMessage.error('加载排程数据失败')
    console.error('加载排程数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 生成甘特图日期
const generateGanttDates = () => {
  const dates: GanttDate[] = []
  const startDate = new Date('2023-07-15')
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const key = date.toISOString().split('T')[0]
    const label = `${date.getMonth() + 1}/${date.getDate()}`
    dates.push({ key, label })
  }
  
  ganttDates.value = dates
}

// 处理甘特图视图切换
const handleGanttViewChange = () => {
  generateGanttDates()
  ElMessage.success(`已切换至${getGanttViewText()}视图`)
}

// 获取甘特图视图文本
const getGanttViewText = (): string => {
  const viewMap = {
    'day': '日',
    'week': '周',
    'month': '月'
  }
  return viewMap[ganttView.value] || '日'
}

// 返回列表
const handleBack = () => {
  router.push('/scheduling/list')
}

// 编辑排程
const handleEdit = () => {
  router.push(`/scheduling/create?id=${scheduleId.value}`)
}

// 开始排程
const handleStartSchedule = async () => {
  if (!canStartSchedule.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要开始此排程吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    scheduleInfo.status = 'in_progress'
    ElMessage.success('排程已开始')
  } catch (error) {
    // 取消操作
  }
}

// 暂停排程
const handlePauseSchedule = async () => {
  if (!canPauseSchedule.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要暂停此排程吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    scheduleInfo.status = 'paused'
    ElMessage.success('排程已暂停')
  } catch (error) {
    // 取消操作
  }
}

// 刷新工序
const handleRefreshProcesses = async () => {
  refreshing.value = true
  try {
    await loadScheduleData()
    ElMessage.success('刷新成功')
  } finally {
    refreshing.value = false
  }
}

// 点击工序
const handleProcessClick = (process: Process) => {
  Object.assign(selectedProcess, { ...process })
  processOperationForm.actualOutput = 0
  processOperationForm.status = process.status
  processDetailVisible.value = true
}

// 点击任务条
const handleTaskClick = (process: Process | null, type: string = 'process') => {
  if (type === 'total') {
    ElMessage.info('点击了总排程任务')
  } else if (process) {
    handleProcessClick(process)
  }
}

// 关闭工序详情
const handleProcessDetailClose = () => {
  processDetailVisible.value = false
  // 重置表单
  Object.assign(selectedProcess, { 
    id: 0,
    processName: '',
    processSequence: 0,
    equipment: '',
    operator: '',
    estimatedTime: 0,
    progress: 0,
    status: 'not_started'
  })
  processOperationForm.actualOutput = 0
  processOperationForm.status = ''
}

// 更新工序状态
const handleUpdateProcess = async () => {
  updatingProcess.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 更新本地数据
    const processIndex = scheduleInfo.processes.findIndex(p => p.id === selectedProcess.id)
    if (processIndex !== -1) {
      scheduleInfo.processes[processIndex].status = processOperationForm.status as Process['status']
      if (processOperationForm.status === 'completed') {
        scheduleInfo.processes[processIndex].progress = 100
        scheduleInfo.processes[processIndex].endTime = new Date().toLocaleString('zh-CN')
      }
      
      // 同步到选中的工序
      selectedProcess.status = processOperationForm.status as Process['status']
      if (processOperationForm.status === 'completed') {
        selectedProcess.progress = 100
        selectedProcess.endTime = scheduleInfo.processes[processIndex].endTime
      }
    }
    
    ElMessage.success('工序状态已更新')
  } catch (error) {
    ElMessage.error('更新工序状态失败')
  } finally {
    updatingProcess.value = false
  }
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  if (!dateRange.value || dateRange.value.length !== 2) return
  
  // 模拟更新统计数据
  ElMessage.success('数据已更新')
}

// 甘特图放大
const handleZoomIn = () => {
  ElMessage.info('放大功能')
}

// 甘特图缩小
const handleZoomOut = () => {
  ElMessage.info('缩小功能')
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': '未开始',
    'in_progress': '进行中',
    'completed': '已完成',
    'paused': '已暂停'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    'not_started': 'info',
    'in_progress': 'success',
    'completed': 'primary',
    'paused': 'warning'
  }
  return typeMap[status] || 'default'
}

// 获取进度状态
const getProgressStatus = (progress: number): string => {
  if (progress >= 100) return 'success'
  if (progress >= 70) return 'warning'
  return ''
}

// 获取工序状态文本
const getProcessStatusText = (status: string): string => {
  return getStatusText(status)
}

// 获取工序状态标签类型
const getProcessStatusType = (status: string): string => {
  return getStatusType(status)
}

// 获取工序进度状态
const getProcessProgressStatus = (progress: number): string => {
  if (progress >= 100) return 'success'
  if (progress >= 70) return 'warning'
  if (progress > 0) return ''
  return 'info'
}

// 获取资源使用状态
const getResourceUsageStatus = (usageRate: number): string => {
  if (usageRate >= 90) return 'exception'
  if (usageRate >= 70) return 'warning'
  return ''
}

// 百分比格式化
const percentageFormat = (percentage: number): string => {
  return `${percentage}%`
}
</script>

<style scoped>
.schedule-board {
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
  font-size: 20px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 概览卡片样式 */
.overview-card {
  margin-bottom: 20px;
}

.overview-item {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}

.overview-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.overview-value.progress {
  padding-top: 5px;
}

/* 卡片头部样式 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 工序卡片样式 */
.process-card {
  margin-bottom: 20px;
}

.process-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.process-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.process-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.process-active {
  border-left: 4px solid #67c23a;
}

.process-completed {
  border-left: 4px solid #909399;
}

.process-pending {
  border-left: 4px solid #e6a23c;
}

.process-paused {
  border-left: 4px solid #f56c6c;
}

.process-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.process-number {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-color: #409eff;
  color: white;
  border-radius: 50%;
  text-align: center;
  line-height: 24px;
  font-size: 12px;
  font-weight: bold;
}

.process-name {
  font-weight: 500;
  flex: 1;
}

.process-info {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-label {
  color: #606266;
}

.info-value {
  color: #303133;
  font-weight: 500;
}

.process-progress {
  margin-top: 10px;
}

/* 资源卡片样式 */
.resources-card {
  margin-bottom: 20px;
}

.resource-item {
  margin-bottom: 20px;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.resource-name {
  font-weight: 500;
}

.resource-type {
  color: #606266;
  font-size: 12px;
}

.resource-details {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}

/* 甘特图卡片样式 */
.gantt-card {
  margin-bottom: 20px;
}

.gantt-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gantt-container {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.gantt-timeline {
  display: flex;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
  padding: 10px 0;
}

.timeline-item {
  min-width: 60px;
  text-align: center;
  font-size: 12px;
  color: #606266;
  border-right: 1px solid #ebeef5;
}

.gantt-body {
  max-height: 400px;
  overflow-y: auto;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  height: 40px;
  align-items: center;
}

.row-label {
  width: 100px;
  padding: 0 10px;
  background-color: #fafafa;
  font-size: 12px;
  border-right: 1px solid #ebeef5;
}

.row-tasks {
  flex: 1;
  position: relative;
  height: 100%;
  padding: 0 10px;
}

.task-bar {
  position: absolute;
  height: 24px;
  background-color: #409eff;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.task-bar.main-task {
  background-color: #67c23a;
}

.task-bar.task-completed {
  background-color: #909399;
}

.task-bar.task-active {
  background-color: #67c23a;
}

.task-bar.task-pending {
  background-color: #e6a23c;
}

.task-bar.task-paused {
  background-color: #f56c6c;
}

/* 生产数据卡片样式 */
.production-data-card {
  margin-bottom: 20px;
}

.chart-placeholder {
  height: 200px;
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin: 20px 0;
}

.data-stats {
  margin-top: 20px;
}

.stat-item {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

/* 工序详情样式 */
.process-detail {
  padding: 10px 0;
}

.process-operations {
  margin-top: 20px;
}

.process-operations h4 {
  margin-bottom: 15px;
  color: #303133;
}

.operation-form {
  margin-bottom: 0;
}
</style>