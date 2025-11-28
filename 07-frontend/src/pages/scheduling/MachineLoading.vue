<template>
  <div class="machine-loading">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h1>设备负载管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleLoadBalance">负载均衡</el-button>
        <el-button @click="handleExportReport">导出报表</el-button>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" class="search-form" :model="searchForm">
        <el-form-item label="车间">
          <el-select v-model="searchForm.workshop" placeholder="请选择车间">
            <el-option v-for="workshop in workshops" :key="workshop.value" :label="workshop.label" :value="workshop.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="searchForm.machineType" placeholder="请选择设备类型">
            <el-option v-for="type in machineTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 负载概览卡片 -->
    <el-card class="overview-card">
      <div class="card-header">
        <h3>负载概览</h3>
      </div>
      <div class="overview-stats">
        <div class="stat-item">
          <div class="stat-label">平均负载率</div>
          <div class="stat-value">{{ loadStats.avgLoadRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">高负载设备</div>
          <div class="stat-value high-load">{{ loadStats.highLoadCount }} 台</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">低负载设备</div>
          <div class="stat-value low-load">{{ loadStats.lowLoadCount }} 台</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">设备总数</div>
          <div class="stat-value">{{ loadStats.totalCount }} 台</div>
        </div>
      </div>
      <div class="load-distribution">
        <h4>负载分布</h4>
        <div class="distribution-bar">
          <div 
            class="distribution-segment high" 
            :style="{ width: loadDistribution.high + '%' }"
          ></div>
          <div 
            class="distribution-segment medium" 
            :style="{ width: loadDistribution.medium + '%' }"
          ></div>
          <div 
            class="distribution-segment low" 
            :style="{ width: loadDistribution.low + '%' }"
          ></div>
        </div>
        <div class="distribution-legend">
          <div class="legend-item">
            <div class="legend-color high"></div>
            <span>高负载(>70%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color medium"></div>
            <span>中负载(30%-70%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-color low"></div>
            <span>低负载(<30%)</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 设备状态卡片 -->
    <el-card class="status-card">
      <div class="card-header">
        <h3>设备状态</h3>
      </div>
      <div class="status-stats">
        <div class="status-item" v-for="status in statusStats" :key="status.type">
          <div :class="['status-circle', status.type]"></div>
          <div class="status-info">
            <span class="status-label">{{ status.label }}</span>
            <span class="status-count">{{ status.count }} 台</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 负载详情区域 -->
    <el-card class="load-detail-card">
      <div class="card-header">
        <h3>设备负载详情</h3>
        <div>
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="list">列表视图</el-radio-button>
            <el-radio-button label="chart">图表视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="list-view">
        <el-table :data="machineData" style="width: 100%">
          <el-table-column prop="machineCode" label="设备编号" width="120" />
          <el-table-column prop="machineName" label="设备名称" width="180" />
          <el-table-column prop="machineType" label="设备类型" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="loadRate" label="负载率" width="180">
            <template #default="scope">
              <div>
                <el-progress 
                  :percentage="scope.row.loadRate" 
                  :status="getLoadStatus(scope.row.loadRate)"
                  :text-inside="true"
                  :stroke-width="20"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="taskCount" label="当前任务数" width="120" />
          <el-table-column prop="workshop" label="所属车间" width="120" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="handleMachineDetail(scope.row)">详情</el-button>
              <el-button size="small" @click="handleTaskAssign(scope.row)">任务分配</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 图表视图 -->
      <div v-else-if="viewMode === 'chart'" class="chart-view">
        <div class="chart-placeholder">
          <p>设备负载分布图（此处为图表占位）</p>
        </div>
      </div>
    </el-card>

    <!-- 负载预警区域 -->
    <el-card class="warning-card" v-if="loadWarnings.length > 0">
      <div class="card-header">
        <h3>负载预警</h3>
      </div>
      <el-alert
        v-for="warning in loadWarnings"
        :key="warning.id"
        :title="warning.message"
        :type="warning.type === 'high' ? 'warning' : 'info'"
        :description="warning.detail"
        show-icon
        :closable="false"
      />
    </el-card>

    <!-- 任务分配对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="任务分配"
      width="800px"
      :before-close="handleAssignDialogClose"
    >
      <div class="dialog-section">
        <h4>设备信息</h4>
        <div class="machine-detail">
          <el-descriptions :column="1" :border="true">
            <el-descriptions-item label="设备编号">{{ selectedMachine?.machineCode }}</el-descriptions-item>
            <el-descriptions-item label="设备名称">{{ selectedMachine?.machineName }}</el-descriptions-item>
            <el-descriptions-item label="当前负载率">{{ selectedMachine?.loadRate }}%</el-descriptions-item>
            <el-descriptions-item label="当前任务数">{{ selectedMachine?.taskCount }}个</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <div class="dialog-section">
        <h4>待分配任务</h4>
        <el-table :data="availableTasks" style="width: 100%" @selection-change="handleTaskSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column prop="taskCode" label="任务编号" width="120" />
          <el-table-column prop="taskName" label="任务名称" width="180" />
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="scope">
              <el-tag :type="getPriorityType(scope.row.priority)">
                {{ getPriorityText(scope.row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="estimatedHours" label="预计工时(h)" width="120" />
        </el-table>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleAssignDialogClose">取消</el-button>
          <el-button type="primary" @click="handleConfirmAssign">确认分配</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="设备详情"
      width="800px"
      :before-close="handleDetailDialogClose"
    >
      <el-tabs v-model="activeDetailTab">
        <el-tab-pane label="基本信息" name="basic">
          <div class="dialog-section">
            <el-descriptions :column="1" :border="true">
              <el-descriptions-item label="设备编号">{{ selectedMachine?.machineCode }}</el-descriptions-item>
              <el-descriptions-item label="设备名称">{{ selectedMachine?.machineName }}</el-descriptions-item>
              <el-descriptions-item label="设备类型">{{ selectedMachine?.machineType }}</el-descriptions-item>
              <el-descriptions-item label="所属车间">{{ selectedMachine?.workshop }}</el-descriptions-item>
              <el-descriptions-item label="设备状态">{{ getStatusText(selectedMachine?.status) }}</el-descriptions-item>
              <el-descriptions-item label="当前负载率">{{ selectedMachine?.loadRate }}%</el-descriptions-item>
              <el-descriptions-item label="当前任务数">{{ selectedMachine?.taskCount }}个</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>
        <el-tab-pane label="当前任务" name="tasks">
          <div class="dialog-section">
            <el-table :data="selectedMachineTasks" style="width: 100%">
              <el-table-column prop="taskCode" label="任务编号" width="120" />
              <el-table-column prop="taskName" label="任务名称" width="180" />
              <el-table-column prop="priority" label="优先级" width="100">
                <template #default="scope">
                  <el-tag :type="getPriorityType(scope.row.priority)">
                    {{ getPriorityText(scope.row.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="180" />
              <el-table-column prop="endTime" label="结束时间" width="180" />
              <el-table-column prop="progress" label="进度" width="180">
                <template #default="scope">
                  <el-progress 
                    :percentage="scope.row.progress" 
                    :text-inside="true"
                    :stroke-width="20"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        <el-tab-pane label="负载趋势" name="trend">
          <div class="dialog-section">
            <div class="chart-placeholder">
              <p>负载趋势图（此处为图表占位）</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDetailDialogClose">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElConfirm } from 'element-plus'

// 类型定义
interface SearchForm {
  workshop: string
  machineType: string
  dateRange: [string, string] | null
}

interface Workshop {
  value: string
  label: string
}

interface MachineType {
  value: string
  label: string
}

interface Machine {
  id: string
  machineCode: string
  machineName: string
  machineType: string
  status: 'running' | 'idle' | 'maintenance' | 'fault'
  loadRate: number
  taskCount: number
  workshop: string
}

interface Task {
  id: string
  taskCode: string
  taskName: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedHours: number
}

interface MachineTask {
  taskCode: string
  taskName: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startTime: string
  endTime: string
  progress: number
}

interface LoadStat {
  avgLoadRate: number
  highLoadCount: number
  lowLoadCount: number
  totalCount: number
}

interface LoadDistribution {
  high: number
  medium: number
  low: number
}

interface StatusStat {
  type: string
  label: string
  count: number
}

interface LoadWarning {
  id: string
  message: string
  detail: string
  type: 'high' | 'low'
}

// 响应式数据
const searchForm = reactive<SearchForm>({
  workshop: '',
  machineType: '',
  dateRange: null
})

const workshops = ref<Workshop[]>([])
const machineTypes = ref<MachineType[]>([])
const machineData = ref<Machine[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const viewMode = ref<'list' | 'chart'>('list')

// 负载统计
const loadStats = reactive<LoadStat>({
  avgLoadRate: 0,
  highLoadCount: 0,
  lowLoadCount: 0,
  totalCount: 0
})

// 负载分布
const loadDistribution = reactive<LoadDistribution>({
  high: 0,
  medium: 0,
  low: 0
})

// 状态统计
const statusStats = ref<StatusStat[]>([])

// 负载预警
const loadWarnings = ref<LoadWarning[]>([])

// 对话框状态
const assignDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedMachine = ref<Machine | null>(null)
const availableTasks = ref<Task[]>([])
const selectedTasks = ref<Task[]>([])
const selectedMachineTasks = ref<MachineTask[]>([])
const activeDetailTab = ref('basic')

// 获取模拟设备数据
const getMockMachineData = (): Machine[] => {
  return [
    {
      id: '1',
      machineCode: 'M001',
      machineName: 'CNC加工中心A',
      machineType: '加工中心',
      status: 'running',
      loadRate: 85,
      taskCount: 6,
      workshop: '第一车间'
    },
    {
      id: '2',
      machineCode: 'M002',
      machineName: 'CNC加工中心B',
      machineType: '加工中心',
      status: 'running',
      loadRate: 65,
      taskCount: 4,
      workshop: '第一车间'
    },
    {
      id: '3',
      machineCode: 'M003',
      machineName: '车床C',
      machineType: '车床',
      status: 'idle',
      loadRate: 25,
      taskCount: 1,
      workshop: '第二车间'
    },
    {
      id: '4',
      machineCode: 'M004',
      machineName: '铣床D',
      machineType: '铣床',
      status: 'maintenance',
      loadRate: 0,
      taskCount: 0,
      workshop: '第二车间'
    },
    {
      id: '5',
      machineCode: 'M005',
      machineName: '磨床E',
      machineType: '磨床',
      status: 'fault',
      loadRate: 0,
      taskCount: 0,
      workshop: '第三车间'
    }
  ]
}

// 加载数据
const loadData = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 使用模拟数据
    const data = getMockMachineData()
    
    // 计算分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    machineData.value = data.slice(start, end)
    total.value = data.length
    
    // 更新统计数据
    updateStats(data)
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error('加载设备数据失败:', error)
  }
}

// 更新统计数据
const updateStats = (data: Machine[]) => {
  // 计算负载统计
  const totalMachines = data.length
  let totalLoadRate = 0
  let highLoadCount = 0
  let lowLoadCount = 0
  
  data.forEach(machine => {
    totalLoadRate += machine.loadRate
    if (machine.loadRate >= 70) {
      highLoadCount++
    } else if (machine.loadRate < 30) {
      lowLoadCount++
    }
  })
  
  loadStats.avgLoadRate = totalMachines > 0 ? Math.round(totalLoadRate / totalMachines) : 0
  loadStats.highLoadCount = highLoadCount
  loadStats.lowLoadCount = lowLoadCount
  loadStats.totalCount = totalMachines
  
  // 计算负载分布
  const mediumLoadCount = totalMachines - highLoadCount - lowLoadCount
  loadDistribution.high = totalMachines > 0 ? Math.round((highLoadCount / totalMachines) * 100) : 0
  loadDistribution.medium = totalMachines > 0 ? Math.round((mediumLoadCount / totalMachines) * 100) : 0
  loadDistribution.low = totalMachines > 0 ? Math.round((lowLoadCount / totalMachines) * 100) : 0
  
  // 计算状态统计
  const statusMap: Record<string, number> = {
    'running': 0,
    'idle': 0,
    'maintenance': 0,
    'fault': 0
  }
  
  data.forEach(machine => {
    if (statusMap.hasOwnProperty(machine.status)) {
      statusMap[machine.status]++
    }
  })
  
  statusStats.value = [
    { type: 'running', label: '运行中', count: statusMap.running },
    { type: 'idle', label: '空闲', count: statusMap.idle },
    { type: 'maintenance', label: '维护中', count: statusMap.maintenance },
    { type: 'fault', label: '故障', count: statusMap.fault }
  ]
  
  // 生成负载预警
  loadWarnings.value = data
    .filter(machine => machine.loadRate >= 90 || machine.loadRate <= 10)
    .map((machine, index) => ({
      id: `warning-${index}`,
      message: machine.loadRate >= 90 ? `设备${machine.machineName}负载过高` : `设备${machine.machineName}负载过低`,
      detail: `当前负载率: ${machine.loadRate}%`,
      type: machine.loadRate >= 90 ? 'high' : 'low'
    }))
}

// 加载可用任务
const loadAvailableTasks = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 使用模拟数据
    availableTasks.value = [
      {
        id: 'T001',
        taskCode: 'Task-001',
        taskName: '零件加工任务A',
        priority: 'high',
        estimatedHours: 4
      },
      {
        id: 'T002',
        taskCode: 'Task-002',
        taskName: '零件加工任务B',
        priority: 'medium',
        estimatedHours: 6
      },
      {
        id: 'T003',
        taskCode: 'Task-003',
        taskName: '零件加工任务C',
        priority: 'urgent',
        estimatedHours: 3
      },
      {
        id: 'T004',
        taskCode: 'Task-004',
        taskName: '零件加工任务D',
        priority: 'low',
        estimatedHours: 8
      }
    ]
  } catch (error) {
    ElMessage.error('加载任务数据失败')
    console.error('加载可用任务失败:', error)
  }
}

// 查询
const handleQuery = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.workshop = ''
  searchForm.machineType = ''
  searchForm.dateRange = null
  currentPage.value = 1
  loadData()
}

// 负载均衡
const handleLoadBalance = async () => {
  try {
    await ElConfirm('确认执行负载均衡操作吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('负载均衡操作已执行')
    // 重新加载数据
    loadData()
  } catch (error) {
    // 用户取消操作
    console.log('用户取消负载均衡操作')
  }
}

// 导出报表
const handleExportReport = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('报表导出成功')
  } catch (error) {
    ElMessage.error('报表导出失败')
    console.error('导出报表失败:', error)
  }
}

// 设备详情
const handleMachineDetail = (machine: Machine) => {
  selectedMachine.value = { ...machine }
  
  // 模拟获取设备任务数据
  selectedMachineTasks.value = [
    {
      taskCode: 'Task-001',
      taskName: '零件加工任务A',
      priority: 'high',
      startTime: '2023-07-01 08:00',
      endTime: '2023-07-01 12:00',
      progress: 75
    },
    {
      taskCode: 'Task-002',
      taskName: '零件加工任务B',
      priority: 'medium',
      startTime: '2023-07-01 14:00',
      endTime: '2023-07-01 17:00',
      progress: 25
    }
  ]
  
  detailDialogVisible.value = true
}

// 任务分配
const handleTaskAssign = (machine: Machine) => {
  selectedMachine.value = { ...machine }
  loadAvailableTasks()
  selectedTasks.value = []
  assignDialogVisible.value = true
}

// 确认分配
const handleConfirmAssign = async () => {
  if (selectedTasks.value.length === 0) {
    ElMessage.warning('请选择要分配的任务')
    return
  }
  
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('任务分配成功')
    handleAssignDialogClose()
    // 重新加载数据
    loadData()
  } catch (error) {
    ElMessage.error('任务分配失败')
    console.error('分配任务失败:', error)
  }
}

// 处理任务选择变化
const handleTaskSelectionChange = (selection: Task[]) => {
  selectedTasks.value = selection
}

// 处理页码变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadData()
}

// 处理每页条数变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  loadData()
}

// 关闭分配对话框
const handleAssignDialogClose = () => {
  assignDialogVisible.value = false
}

// 关闭详情对话框
const handleDetailDialogClose = () => {
  detailDialogVisible.value = false
}

// 获取状态文本
const getStatusText = (status?: string): string => {
  if (!status) return ''
  const statusMap: Record<string, string> = {
    'running': '运行中',
    'idle': '空闲',
    'maintenance': '维护中',
    'fault': '故障'
  }
  return statusMap[status] || status
}

// 获取状态类型
const getStatusType = (status?: string): string => {
  if (!status) return 'default'
  const typeMap: Record<string, string> = {
    'running': 'success',
    'idle': 'info',
    'maintenance': 'warning',
    'fault': 'danger'
  }
  return typeMap[status] || 'default'
}

// 获取负载状态
const getLoadStatus = (loadRate?: number): string => {
  if (loadRate === undefined) return ''
  if (loadRate >= 90) return 'exception'
  if (loadRate >= 70) return 'warning'
  return ''
}

// 获取优先级文本
const getPriorityText = (priority?: string): string => {
  if (!priority) return ''
  const priorityMap: Record<string, string> = {
    'low': '低',
    'medium': '中',
    'high': '高',
    'urgent': '紧急'
  }
  return priorityMap[priority] || priority
}

// 获取优先级类型
const getPriorityType = (priority?: string): string => {
  if (!priority) return 'default'
  const typeMap: Record<string, string> = {
    'low': 'info',
    'medium': 'primary',
    'high': 'warning',
    'urgent': 'danger'
  }
  return typeMap[priority] || 'default'
}

// 组件挂载时加载数据
onMounted(() => {
  // 初始化车间和设备类型选项
  workshops.value = [
    { value: 'workshop1', label: '第一车间' },
    { value: 'workshop2', label: '第二车间' },
    { value: 'workshop3', label: '第三车间' }
  ]
  
  machineTypes.value = [
    { value: 'cnc', label: '加工中心' },
    { value: 'lathe', label: '车床' },
    { value: 'miller', label: '铣床' },
    { value: 'grinder', label: '磨床' }
  ]
  
  loadData()
})
</script>

<style scoped>
.machine-loading {
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

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 概览卡片样式 */
.overview-card {
  margin-bottom: 20px;
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
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
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-value.high-load {
  color: #f56c6c;
}

.stat-value.low-load {
  color: #67c23a;
}

/* 负载分布样式 */
.load-distribution {
  margin-top: 20px;
}

.load-distribution h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}

.distribution-bar {
  height: 20px;
  background-color: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 10px;
}

.distribution-segment {
  height: 100%;
  float: left;
}

.distribution-segment.high {
  background-color: #f56c6c;
}

.distribution-segment.medium {
  background-color: #e6a23c;
}

.distribution-segment.low {
  background-color: #67c23a;
}

.distribution-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 5px;
}

.legend-color.high {
  background-color: #f56c6c;
}

.legend-color.medium {
  background-color: #e6a23c;
}

.legend-color.low {
  background-color: #67c23a;
}

/* 状态卡片样式 */
.status-card {
  margin-bottom: 20px;
}

.status-stats {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-circle.running {
  background-color: #67c23a;
}

.status-circle.idle {
  background-color: #409eff;
}

.status-circle.maintenance {
  background-color: #e6a23c;
}

.status-circle.fault {
  background-color: #f56c6c;
}

.status-info {
  display: flex;
  justify-content: space-between;
  flex: 1;
}

.status-label {
  font-size: 14px;
  color: #303133;
}

.status-count {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

/* 负载详情卡片样式 */
.load-detail-card {
  margin-bottom: 20px;
}

.list-view {
  margin-top: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.chart-view {
  padding: 20px;
}

.chart-placeholder {
  height: 300px;
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 预警卡片样式 */
.warning-card {
  margin-bottom: 20px;
}

/* 对话框样式 */
.dialog-section {
  margin-bottom: 20px;
}

.dialog-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
  border-left: 3px solid #409eff;
  padding-left: 10px;
}

.machine-detail {
  padding: 10px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>