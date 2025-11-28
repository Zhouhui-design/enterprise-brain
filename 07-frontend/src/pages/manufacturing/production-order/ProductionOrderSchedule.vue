<template>
  <div class="production-order-schedule">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>生产订单排程</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAutoSchedule">
          <el-icon><Setting /></el-icon>
          自动排程
        </el-button>
        <el-button @click="handleManualAdjust">
          <el-icon><EditPen /></el-icon>
          手动调整
        </el-button>
        <el-button @click="handleSaveSchedule">
          <el-icon><Save /></el-icon>
          保存排程
        </el-button>
      </div>
    </div>

    <!-- 订单选择和搜索 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderCode" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择订单状态">
            <el-option label="全部" value="" />
            <el-option label="未排程" value="not_scheduled" />
            <el-option label="已排程" value="scheduled" />
            <el-option label="执行中" value="executing" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 排程主区域 -->
    <div class="schedule-main">
      <!-- 待排订单列表 -->
      <div class="pending-orders">
        <div class="section-header">
          <h3>待排订单</h3>
          <el-button type="text" @click="selectAllOrders">全选</el-button>
        </div>
        <el-table
          v-loading="loading"
          :data="pendingOrderList"
          @selection-change="handleOrderSelectionChange"
          stripe
          size="small"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="orderCode" label="订单编号" width="150" />
          <el-table-column prop="productName" label="产品名称" width="150" />
          <el-table-column prop="quantity" label="数量" width="80" align="right" />
          <el-table-column prop="unit" label="单位" width="60" />
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="getPriorityTagType(row.priority)">{{ getPriorityText(row.priority) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="customerDemandDate" label="需求日期" width="120" />
        </el-table>
      </div>

      <!-- 资源甘特图区域 -->
      <div class="gantt-container">
        <div class="section-header">
          <h3>资源排程甘特图</h3>
          <div class="gantt-controls">
            <el-select v-model="viewMode" placeholder="视图模式" @change="handleViewModeChange">
              <el-option label="日视图" value="day" />
              <el-option label="周视图" value="week" />
              <el-option label="月视图" value="month" />
            </el-select>
            <el-button @click="handleZoomIn">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button @click="handleZoomOut">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
          </div>
        </div>
        
        <!-- 甘特图头部时间轴 -->
        <div class="gantt-header">
          <div class="resource-header">资源</div>
          <div class="time-header" v-for="time in timeHeaders" :key="time.id">
            {{ time.label }}
          </div>
        </div>
        
        <!-- 甘特图主体 -->
        <div class="gantt-body">
          <div v-for="resource in resourceList" :key="resource.id" class="resource-row">
            <div class="resource-name">
              <div class="resource-info">
                <div class="resource-title">{{ resource.name }}</div>
                <div class="resource-desc">{{ resource.type }} | 可用: {{ resource.availability }}%</div>
              </div>
            </div>
            <div class="gantt-tasks">
              <div
                v-for="task in resource.tasks"
                :key="task.id"
                class="gantt-task"
                :class="{ 'critical-task': task.isCritical }"
                :style="{
                  left: `${task.startPosition}%`,
                  width: `${task.width}%`,
                  backgroundColor: getTaskColor(task)
                }"
                @click="handleTaskClick(task)"
              >
                <div class="task-content">
                  <div class="task-order-code">{{ task.orderCode }}</div>
                  <div class="task-name">{{ task.productName }}</div>
                  <div class="task-quantity">{{ task.quantity }} {{ task.unit }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 排程统计 -->
    <el-card class="stats-card">
      <h3>排程统计</h3>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">已排订单数</div>
          <div class="stat-value">{{ stats.scheduledOrders }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">待排订单数</div>
          <div class="stat-value">{{ stats.pendingOrders }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">资源利用率</div>
          <div class="stat-value">{{ stats.resourceUtilization }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">订单准时率</div>
          <div class="stat-value">{{ stats.onTimeRate }}%</div>
        </div>
      </div>
    </el-card>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      title="任务详情"
      width="600px"
      @close="handleTaskDialogClose"
    >
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">{{ currentTask.orderCode }}</el-descriptions-item>
          <el-descriptions-item label="产品信息">{{ currentTask.productName }} ({{ currentTask.productCode }})</el-descriptions-item>
          <el-descriptions-item label="任务数量">{{ currentTask.quantity }} {{ currentTask.unit }}</el-descriptions-item>
          <el-descriptions-item label="分配资源">{{ currentTask.resourceName }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(currentTask.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(currentTask.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="持续时间">{{ currentTask.duration }} 小时</el-descriptions-item>
          <el-descriptions-item label="优先级"><el-tag :type="getPriorityTagType(currentTask.priority)">{{ getPriorityText(currentTask.priority) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="关键任务"><el-switch v-model="currentTask.isCritical" /></el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentTask.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="taskDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleUpdateTask">更新</el-button>
      </template>
    </el-dialog>

      <!-- 工作中心选择对话框 -->
      <el-dialog
        v-model="workCenterVisible"
        title="选择工作中心"
        width="80%"
        height="80vh"
        @close="handleWorkCenterClose"
      >
        <WorkCenter
          ref="workCenterRef"
          v-model:visible="workCenterVisible"
          :multiple="true"
          @confirm="handleWorkCenterConfirm"
        />
      </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Setting, EditPen, Save, ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import WorkCenter from './components/WorkCenter.vue'

// 订单类型定义
interface ProductionOrder {
  id: string
  orderCode: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  priority: number
  status: string
  customerDemandDate: string
}

// 资源类型定义
interface Resource {
  id: string
  name: string
  type: string
  availability: number
  tasks: Task[]
}

// 任务类型定义
interface Task {
  id: string
  orderCode: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  resourceId: string
  resourceName: string
  startTime: string
  endTime: string
  duration: number
  priority: number
  isCritical: boolean
  remark?: string
  startPosition: number
  width: number
}

// 时间轴头部类型定义
interface TimeHeader {
  id: string
  label: string
}

// 工作中心类型定义
interface WorkCenterType {
  id: string
  code: string
  name: string
  type: string
  status: string
}

// 响应式数据
// 工作中心选择相关
const workCenterVisible = ref(false)
const selectedWorkCenters = ref<WorkCenterType[]>([])
const workCenterRef = ref()
const loading = ref(false)
const pendingOrderList = ref<ProductionOrder[]>([])
const resourceList = ref<Resource[]>([])
const selectedOrderIds = ref<string[]>([])
const viewMode = ref('day')
const taskDialogVisible = ref(false)
const currentTask = ref<Task | null>(null)

// 搜索表单
const searchForm = reactive({
  orderCode: '',
  productName: '',
  status: ''
})

// 统计数据
const stats = reactive({
  scheduledOrders: 0,
  pendingOrders: 0,
  resourceUtilization: 0,
  onTimeRate: 0
})

// 时间轴头部
const timeHeaders = ref<TimeHeader[]>([])

// 获取待排订单列表
const getPendingOrderList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: ProductionOrder[] = [
      {
        id: '1',
        orderCode: 'PO2024001',
        productCode: 'PROD001',
        productName: '智能控制器',
        quantity: 1000,
        unit: '台',
        priority: 3,
        status: 'not_scheduled',
        customerDemandDate: '2024-01-15'
      },
      {
        id: '2',
        orderCode: 'PO2024002',
        productCode: 'PROD002',
        productName: '传感器模组',
        quantity: 500,
        unit: '套',
        priority: 2,
        status: 'not_scheduled',
        customerDemandDate: '2024-01-20'
      },
      {
        id: '3',
        orderCode: 'PO2024003',
        productCode: 'PROD003',
        productName: '电源模块',
        quantity: 800,
        unit: '个',
        priority: 4,
        status: 'not_scheduled',
        customerDemandDate: '2024-01-10'
      }
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (searchForm.orderCode) {
      filteredData = filteredData.filter(order => 
        order.orderCode.includes(searchForm.orderCode)
      )
    }
    if (searchForm.productName) {
      filteredData = filteredData.filter(order => 
        order.productName.includes(searchForm.productName)
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(order => 
        order.status === searchForm.status
      )
    }
    
    pendingOrderList.value = filteredData
    stats.pendingOrders = filteredData.length
  } catch (error) {
    console.error('获取待排订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取资源和任务数据
const getResourceData = async () => {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // 模拟数据
    resourceList.value = [
      {
        id: '1',
        name: '生产线A',
        type: '装配线',
        availability: 85,
        tasks: [
          {
            id: 'task1',
            orderCode: 'PO2024004',
            productCode: 'PROD004',
            productName: '控制面板',
            quantity: 1200,
            unit: '件',
            resourceId: '1',
            resourceName: '生产线A',
            startTime: '2024-01-01 08:00:00',
            endTime: '2024-01-05 18:00:00',
            duration: 120,
            priority: 2,
            isCritical: false,
            startPosition: 10,
            width: 40
          },
          {
            id: 'task2',
            orderCode: 'PO2024005',
            productCode: 'PROD005',
            productName: '连接线束',
            quantity: 2000,
            unit: '条',
            resourceId: '1',
            resourceName: '生产线A',
            startTime: '2024-01-06 08:00:00',
            endTime: '2024-01-10 18:00:00',
            duration: 120,
            priority: 3,
            isCritical: true,
            startPosition: 55,
            width: 40
          }
        ]
      },
      {
        id: '2',
        name: '生产线B',
        type: '测试线',
        availability: 70,
        tasks: [
          {
            id: 'task3',
            orderCode: 'PO2024006',
            productCode: 'PROD001',
            productName: '智能控制器',
            quantity: 600,
            unit: '台',
            resourceId: '2',
            resourceName: '生产线B',
            startTime: '2024-01-02 08:00:00',
            endTime: '2024-01-08 18:00:00',
            duration: 168,
            priority: 2,
            isCritical: false,
            startPosition: 20,
            width: 60
          }
        ]
      },
      {
        id: '3',
        name: '生产线C',
        type: '包装线',
        availability: 90,
        tasks: []
      }
    ]
    
    // 更新统计数据
    stats.scheduledOrders = new Set(resourceList.value.flatMap(r => r.tasks.map(t => t.orderCode))).size
    stats.resourceUtilization = Math.round(
      resourceList.value.reduce((acc, resource) => acc + resource.availability, 0) / resourceList.value.length
    )
    stats.onTimeRate = 85
  } catch (error) {
    console.error('获取资源数据失败:', error)
  }
}

// 生成时间轴头部
const generateTimeHeaders = () => {
  const headers: TimeHeader[] = []
  const today = new Date()
  
  if (viewMode.value === 'day') {
    // 生成7天的时间轴
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      headers.push({
        id: `day-${i}`,
        label: `${date.getMonth() + 1}/${date.getDate()}`
      })
    }
  } else if (viewMode.value === 'week') {
    // 生成4周的时间轴
    for (let i = 0; i < 4; i++) {
      headers.push({
        id: `week-${i}`,
        label: `第${i + 1}周`
      })
    }
  } else {
    // 生成3个月的时间轴
    for (let i = 0; i < 3; i++) {
      const date = new Date(today)
      date.setMonth(date.getMonth() + i)
      headers.push({
        id: `month-${i}`,
        label: `${date.getFullYear()}年${date.getMonth() + 1}月`
      })
    }
  }
  
  timeHeaders.value = headers
}

// 获取优先级文本
const getPriorityText = (priority: number): string => {
  const priorityMap: Record<number, string> = {
    1: '低',
    2: '中',
    3: '高',
    4: '紧急'
  }
  return priorityMap[priority] || '未知'
}

// 获取优先级标签类型
const getPriorityTagType = (priority: number): string => {
  const typeMap: Record<number, string> = {
    1: 'info',
    2: 'primary',
    3: 'warning',
    4: 'danger'
  }
  return typeMap[priority] || 'info'
}

// 获取任务颜色
const getTaskColor = (task: Task): string => {
  if (task.isCritical) return '#f56c6c'
  const priorityColors: Record<number, string> = {
    1: '#409eff',
    2: '#67c23a',
    3: '#e6a23c',
    4: '#f56c6c'
  }
  return priorityColors[task.priority] || '#409eff'
}

// 格式化日期时间
const formatDateTime = (dateTime: string): string => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 处理搜索
const handleSearch = () => {
  getPendingOrderList()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    orderCode: '',
    productName: '',
    status: ''
  })
  getPendingOrderList()
}

// 处理订单选择变化
const handleOrderSelectionChange = (selection: ProductionOrder[]) => {
  selectedOrderIds.value = selection.map(order => order.id)
}

// 全选订单
const selectAllOrders = () => {
  // 这里可以实现全选逻辑
}

// 处理自动排程
const handleAutoSchedule = () => {
  if (selectedOrderIds.value.length === 0) {
    ElMessage.warning('请选择要排程的订单')
    return
  }
  
  ElMessageBox.confirm('确定要对选中的订单进行自动排程吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    loading.value = true
    try {
      // 模拟自动排程
      await new Promise(resolve => setTimeout(resolve, 1000))
      ElMessage.success('自动排程成功')
      getPendingOrderList()
      getResourceData()
    } catch (error) {
      ElMessage.error('自动排程失败')
    } finally {
      loading.value = false
    }
  })
}

// 处理手动调整
const handleManualAdjust = () => {
  ElMessage.info('进入手动调整模式')
  // 这里可以实现手动调整的交互逻辑
}

// 处理保存排程
const handleSaveSchedule = async () => {
  loading.value = true
  try {
    // 模拟保存排程
    await new Promise(resolve => setTimeout(resolve, 500))
    ElMessage.success('排程保存成功')
  } catch (error) {
    ElMessage.error('排程保存失败')
  } finally {
    loading.value = false
  }
}

// 处理视图模式变化
const handleViewModeChange = () => {
  generateTimeHeaders()
}

// 处理缩放
const handleZoomIn = () => {
  // 实现缩放逻辑
}

const handleZoomOut = () => {
  // 实现缩放逻辑
}

// 处理任务点击
const handleTaskClick = (task: Task) => {
  currentTask.value = { ...task }
  taskDialogVisible.value = true
}

// 处理任务更新
const handleUpdateTask = () => {
  if (!currentTask.value) return
  
  // 更新任务数据
  const resource = resourceList.value.find(r => r.id === currentTask.value?.resourceId)
  if (resource) {
    const taskIndex = resource.tasks.findIndex(t => t.id === currentTask.value?.id)
    if (taskIndex !== -1) {
      resource.tasks[taskIndex] = { ...currentTask.value }
    }
  }
  
  ElMessage.success('任务更新成功')
  taskDialogVisible.value = false
}

// 处理任务对话框关闭
const handleTaskDialogClose = () => {
  currentTask.value = null
}

// 处理返回
const handleBack = () => {
  window.location.href = '/#/manufacturing/production-order/list'
}

// 刷新排程数据
const refreshScheduleData = async () => {
  loading.value = true
  try {
    await Promise.all([
      getPendingOrderList(),
      getResourceData()
    ])
  } finally {
    loading.value = false
  }
}

// 处理工作中心关闭
const handleWorkCenterClose = () => {
  workCenterVisible.value = false
}

// 处理工作中心确认
const handleWorkCenterConfirm = (workCenters: WorkCenterType[]) => {
  if (workCenters && workCenters.length > 0) {
    selectedWorkCenters.value = workCenters
    
    // 刷新排程数据
    refreshScheduleData()
    
    workCenterVisible.value = false
  }
}

// 组件挂载
onMounted(async () => {
  generateTimeHeaders()
  await getPendingOrderList()
  await getResourceData()
})
</script>

<style scoped>
.production-order-schedule {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.schedule-main {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.pending-orders {
  width: 350px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.gantt-container {
  flex: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.gantt-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gantt-header {
  display: flex;
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.resource-header {
  width: 200px;
  padding: 10px;
  text-align: center;
  font-weight: 500;
  border-right: 1px solid #ebeef5;
}

.time-header {
  flex: 1;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  border-right: 1px solid #ebeef5;
  min-width: 60px;
}

.gantt-body {
  max-height: 600px;
  overflow-y: auto;
}

.resource-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
}

.resource-name {
  width: 200px;
  padding: 10px;
  border-right: 1px solid #ebeef5;
  background-color: #fafafa;
  position: sticky;
  left: 0;
  z-index: 5;
}

.resource-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-title {
  font-weight: 500;
}

.resource-desc {
  font-size: 12px;
  color: #606266;
}

.gantt-tasks {
  flex: 1;
  padding: 10px 0;
  position: relative;
  height: 80px;
}

.gantt-task {
  position: absolute;
  top: 10px;
  height: 60px;
  border-radius: 4px;
  padding: 4px;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
  overflow: hidden;
}

.gantt-task:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.critical-task {
  border: 2px solid #f56c6c;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
}

.task-order-code {
  font-size: 12px;
  font-weight: 500;
}

.task-name {
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-quantity {
  font-size: 10px;
  opacity: 0.9;
}

.stats-card {
  margin-bottom: 20px;
}

.stats-card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1989fa;
}

.task-detail {
  padding: 10px;
}
</style>