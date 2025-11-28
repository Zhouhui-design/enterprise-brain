<template>
  <div class="gantt-chart">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Gantt图</span>
          <div class="header-actions">
            <el-select v-model="viewMode" placeholder="视图模式" size="small">
              <el-option label="日视图" value="day" />
              <el-option label="周视图" value="week" />
              <el-option label="月视图" value="month" />
            </el-select>
            <el-button size="small" @click="handleZoomIn">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button size="small" @click="handleZoomOut">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button size="small" @click="handleFitToScreen">
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <div class="gantt-container" ref="ganttContainer">
        <!-- 资源名称列 -->
        <div class="resource-column">
          <div class="resource-header">资源</div>
          <div
            v-for="resource in resources"
            :key="resource.id"
            class="resource-item"
            :class="{ 'selected': selectedResourceId === resource.id }"
            @click="handleResourceClick(resource)"
          >
            <div class="resource-info">
              <div class="resource-name">{{ resource.name }}</div>
              <div class="resource-capacity">产能: {{ resource.capacity }}</div>
            </div>
          </div>
        </div>

        <!-- Gantt图表区域 -->
        <div class="chart-area" ref="chartArea">
          <!-- 时间轴头部 -->
          <div class="time-header">
            <div
              v-for="timeSlot in timeSlots"
              :key="timeSlot.key"
              class="time-slot"
              :style="{ width: `${timeSlotWidth}px` }"
            >
              <div class="time-label">{{ timeSlot.label }}</div>
            </div>
          </div>

          <!-- 任务条形图 -->
          <div class="task-area">
            <div
              v-for="resource in resources"
              :key="resource.id"
              class="resource-task-row"
            >
              <div
                v-for="task in getResourceTasks(resource.id)"
                :key="task.id"
                class="task-bar"
                :class="{ 'selected': selectedTaskId === task.id }"
                :style="{
                  left: `${getTaskPosition(task)}px`,
                  width: `${getTaskWidth(task)}px`,
                  backgroundColor: getTaskColor(task)
                }"
                @click="handleTaskClick(task)"
                @dblclick="handleTaskDoubleClick(task)"
                @mousedown="handleTaskMouseDown(task, $event)"
              >
                <div class="task-content">
                  <div class="task-name">{{ task.name }}</div>
                  <div class="task-info">
                    <span class="task-code">{{ task.code }}</span>
                    <span class="task-duration">{{ task.duration }}h</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 图例 -->
      <div class="legend">
        <h4>图例</h4>
        <div class="legend-items">
          <div v-for="status in taskStatuses" :key="status.value" class="legend-item">
            <div class="legend-color" :style="{ backgroundColor: status.color }"></div>
            <span>{{ status.label }}</span>
          </div>
        </div>
      </div>

      <!-- 任务详情对话框 -->
      <el-dialog
        v-model="showTaskDetail"
        title="任务详情"
        width="500px"
        @close="handleCloseTaskDetail"
      >
        <el-descriptions :column="1" border v-if="selectedTask">
          <el-descriptions-item label="任务编号">{{ selectedTask.code }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ selectedTask.name }}</el-descriptions-item>
          <el-descriptions-item label="所属资源">{{ getResourceName(selectedTask.resourceId) }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDateTime(selectedTask.startTime) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDateTime(selectedTask.endTime) }}</el-descriptions-item>
          <el-descriptions-item label="持续时间">{{ selectedTask.duration }} 小时</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getTaskStatusLabel(selectedTask.status) }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ getPriorityLabel(selectedTask.priority) }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ selectedTask.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ZoomIn, ZoomOut, FullScreen } from '@element-plus/icons-vue'

// 资源数据类型
interface Resource {
  id: string
  name: string
  type: string
  capacity: number
  [key: string]: any
}

// 任务数据类型
interface Task {
  id: string
  code: string
  name: string
  resourceId: string
  startTime: string
  endTime: string
  duration: number
  status: string
  priority: number
  remark?: string
  [key: string]: any
}

// 时间槽数据类型
interface TimeSlot {
  key: string
  label: string
  start: Date
  end: Date
}

// Props定义
interface Props {
  resources?: Resource[]
  tasks?: Task[]
  viewMode?: 'day' | 'week' | 'month'
  startDate?: Date
  endDate?: Date
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  resources: () => [],
  tasks: () => [],
  viewMode: 'day',
  startDate: () => new Date(),
  endDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  editable: true
})

// Emits定义
const emit = defineEmits<{
  'task-click': [task: Task]
  'task-double-click': [task: Task]
  'task-drag': [task: Task, newStartTime: string, newEndTime: string]
  'resource-click': [resource: Resource]
}>()

// 响应式数据
const ganttContainer = ref<HTMLElement>()
const chartArea = ref<HTMLElement>()
const selectedResourceId = ref<string>('')
const selectedTaskId = ref<string>('')
const selectedTask = ref<Task | null>(null)
const showTaskDetail = ref(false)
const viewMode = ref<'day' | 'week' | 'month'>(props.viewMode)
const timeSlotWidth = ref(40)
const zoomLevel = ref(1)

// 任务状态配置
const taskStatuses = [
  { value: 'pending', label: '待开始', color: '#909399' },
  { value: 'in_progress', label: '进行中', color: '#1890ff' },
  { value: 'completed', label: '已完成', color: '#67c23a' },
  { value: 'delayed', label: '已延迟', color: '#f56c6c' },
  { value: 'paused', label: '已暂停', color: '#e6a23c' }
]

// 计算属性
const resources = computed(() => {
  return props.resources.length > 0 ? props.resources : generateMockResources()
})

const tasks = computed(() => {
  return props.tasks.length > 0 ? props.tasks : generateMockTasks()
})

// 生成时间槽
const timeSlots = computed(() => {
  return generateTimeSlots()
})

// 生成模拟资源数据
const generateMockResources = (): Resource[] => {
  return [
    { id: 'R001', name: '设备A-001', type: 'machine', capacity: 8 },
    { id: 'R002', name: '设备B-002', type: 'machine', capacity: 8 },
    { id: 'R003', name: '设备C-003', type: 'machine', capacity: 12 },
    { id: 'R004', name: '生产线1', type: 'line', capacity: 24 },
    { id: 'R005', name: '生产线2', type: 'line', capacity: 24 },
    { id: 'R006', name: '装配组1', type: 'team', capacity: 16 },
    { id: 'R007', name: '装配组2', type: 'team', capacity: 16 },
    { id: 'R008', name: '质检组', type: 'team', capacity: 12 }
  ]
}

// 生成模拟任务数据
const generateMockTasks = (): Task[] => {
  const mockTasks: Task[] = []
  const statuses = ['pending', 'in_progress', 'completed', 'delayed', 'paused']
  const now = new Date()
  
  for (let i = 0; i < 20; i++) {
    const resourceIndex = Math.floor(Math.random() * 8)
    const duration = 4 + Math.floor(Math.random() * 20)
    const startOffset = Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000
    const startTime = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + startOffset)
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000)
    
    mockTasks.push({
      id: `T${i + 1001}`,
      code: `TSK${String(i + 100).padStart(4, '0')}`,
      name: `生产任务 ${i + 1}`,
      resourceId: `R${String(resourceIndex + 1).padStart(3, '0')}`,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: duration,
      status: statuses[Math.floor(Math.random() * statuses.length)] as string,
      priority: 1 + Math.floor(Math.random() * 5),
      remark: i % 3 === 0 ? `任务备注信息 ${i + 1}` : undefined
    })
  }
  
  return mockTasks
}

// 生成时间槽
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const start = new Date(props.startDate)
  const end = new Date(props.endDate)
  
  let current = new Date(start)
  
  if (viewMode.value === 'day') {
    // 日视图，每小时一个槽
    while (current < end) {
      slots.push({
        key: current.toISOString(),
        label: `${current.getHours().toString().padStart(2, '0')}:00`,
        start: new Date(current),
        end: new Date(current.getTime() + 60 * 60 * 1000)
      })
      current.setHours(current.getHours() + 1)
    }
  } else if (viewMode.value === 'week') {
    // 周视图，每天一个槽
    while (current < end) {
      slots.push({
        key: current.toISOString(),
        label: `${current.getMonth() + 1}/${current.getDate()}`,
        start: new Date(current),
        end: new Date(current.getTime() + 24 * 60 * 60 * 1000)
      })
      current.setDate(current.getDate() + 1)
    }
  } else if (viewMode.value === 'month') {
    // 月视图，每三天一个槽
    while (current < end) {
      slots.push({
        key: current.toISOString(),
        label: `${current.getMonth() + 1}/${current.getDate()}`,
        start: new Date(current),
        end: new Date(current.getTime() + 3 * 24 * 60 * 60 * 1000)
      }
      current.setDate(current.getDate() + 3)
    }
  }
  
  return slots
}

// 获取资源的任务列表
const getResourceTasks = (resourceId: string): Task[] => {
  return tasks.value
    .filter(task => task.resourceId === resourceId)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
}

// 获取任务位置
const getTaskPosition = (task: Task): number => {
  const taskStart = new Date(task.startTime)
  const slotStart = new Date(timeSlots.value[0].start)
  const diffMs = taskStart.getTime() - slotStart.getTime()
  
  if (viewMode.value === 'day') {
    // 日视图：毫秒转小时
    const diffHours = diffMs / (1000 * 60 * 60)
    return diffHours * timeSlotWidth.value
  } else if (viewMode.value === 'week') {
    // 周视图：毫秒转天
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return diffDays * timeSlotWidth.value
  } else {
    // 月视图：毫秒转天
    const diffDays = diffMs / (1000 * 60 * 60 * 24)
    return (diffDays / 3) * timeSlotWidth.value
  }
}

// 获取任务宽度
const getTaskWidth = (task: Task): number => {
  if (viewMode.value === 'day') {
    // 日视图：小时为单位
    return task.duration * timeSlotWidth.value
  } else if (viewMode.value === 'week') {
    // 周视图：小时转天
    const days = task.duration / 24
    return days * timeSlotWidth.value
  } else {
    // 月视图：小时转天，再除以3
    const days = task.duration / 24
    return (days / 3) * timeSlotWidth.value
  }
}

// 获取任务颜色
const getTaskColor = (task: Task): string => {
  const status = taskStatuses.find(s => s.value === task.status)
  return status ? status.color : '#909399'
}

// 获取任务状态标签
const getTaskStatusLabel = (status: string): string => {
  const statusInfo = taskStatuses.find(s => s.value === status)
  return statusInfo ? statusInfo.label : status
}

// 获取优先级标签
const getPriorityLabel = (priority: number): string => {
  const priorityMap = {
    1: '最高',
    2: '高',
    3: '中',
    4: '低',
    5: '最低'
  }
  return priorityMap[priority as keyof typeof priorityMap] || `${priority}`
}

// 获取资源名称
const getResourceName = (resourceId: string): string => {
  const resource = resources.value.find(r => r.id === resourceId)
  return resource ? resource.name : resourceId
}

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 资源点击处理
const handleResourceClick = (resource: Resource) => {
  selectedResourceId.value = selectedResourceId.value === resource.id ? '' : resource.id
  emit('resource-click', resource)
}

// 任务点击处理
const handleTaskClick = (task: Task) => {
  selectedTaskId.value = selectedTaskId.value === task.id ? '' : task.id
  selectedTask.value = task
  showTaskDetail.value = true
  emit('task-click', task)
}

// 任务双击处理
const handleTaskDoubleClick = (task: Task) => {
  emit('task-double-click', task)
}

// 任务鼠标按下处理（拖拽开始）
const handleTaskMouseDown = (task: Task, event: MouseEvent) => {
  if (!props.editable) return
  
  event.preventDefault()
  const startX = event.clientX
  const taskEl = event.currentTarget as HTMLElement
  const originalLeft = parseFloat(taskEl.style.left)
  
  const handleMouseMove = (e: MouseEvent) => {
    const deltaX = e.clientX - startX
    let newLeft = originalLeft + deltaX
    
    // 限制在图表区域内
    if (chartArea.value) {
      const maxLeft = chartArea.value.clientWidth - taskEl.clientWidth
      newLeft = Math.max(0, Math.min(newLeft, maxLeft))
    }
    
    taskEl.style.left = `${newLeft}px`
  }
  
  const handleMouseUp = async () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    
    const newLeft = parseFloat(taskEl.style.left)
    if (Math.abs(newLeft - originalLeft) > 5) {
      // 计算新的开始时间
      const slotStart = new Date(timeSlots.value[0].start)
      let timePerPixel: number
      
      if (viewMode.value === 'day') {
        timePerPixel = (1000 * 60 * 60) / timeSlotWidth.value
      } else if (viewMode.value === 'week') {
        timePerPixel = (1000 * 60 * 60 * 24) / timeSlotWidth.value
      } else {
        timePerPixel = (1000 * 60 * 60 * 24 * 3) / timeSlotWidth.value
      }
      
      const newStartTime = new Date(slotStart.getTime() + newLeft * timePerPixel)
      const newEndTime = new Date(newStartTime.getTime() + task.duration * 60 * 60 * 1000)
      
      emit('task-drag', task, newStartTime.toISOString(), newEndTime.toISOString())
    } else {
      // 移动距离过小，恢复原位
      taskEl.style.left = `${originalLeft}px`
    }
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 关闭任务详情
const handleCloseTaskDetail = () => {
  showTaskDetail.value = false
  selectedTask.value = null
}

// 放大
const handleZoomIn = () => {
  if (zoomLevel.value < 2) {
    zoomLevel.value += 0.1
    timeSlotWidth.value = 40 * zoomLevel.value
  }
}

// 缩小
const handleZoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value -= 0.1
    timeSlotWidth.value = 40 * zoomLevel.value
  }
}

// 适应屏幕
const handleFitToScreen = () => {
  if (ganttContainer.value && chartArea.value) {
    const availableWidth = ganttContainer.value.clientWidth - 200 // 减去资源列宽度
    const requiredWidth = timeSlots.value.length * timeSlotWidth.value
    
    if (requiredWidth > availableWidth) {
      zoomLevel.value = availableWidth / (timeSlots.value.length * 40)
      timeSlotWidth.value = 40 * zoomLevel.value
    } else {
      zoomLevel.value = 1
      timeSlotWidth.value = 40
    }
  }
}

// 监听视图模式变化
const watchViewMode = () => {
  nextTick(() => {
    handleFitToScreen()
  })
}

// 组件挂载后初始化
onMounted(() => {
  nextTick(() => {
    handleFitToScreen()
  })
})
</script>

<style scoped>
.gantt-chart {
  width: 100%;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.gantt-container {
  display: flex;
  height: 500px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

/* 资源列样式 */
.resource-column {
  width: 200px;
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  flex-shrink: 0;
}

.resource-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
  background-color: #ecf5ff;
  color: #606266;
}

.resource-item {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.resource-item:hover {
  background-color: #f0f2f5;
}

.resource-item.selected {
  background-color: #e6f7ff;
  border-right: 3px solid #1890ff;
}

.resource-info {
  flex: 1;
}

.resource-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.resource-capacity {
  font-size: 12px;
  color: #909399;
}

/* 图表区域样式 */
.chart-area {
  flex: 1;
  overflow: auto;
  position: relative;
}

.time-header {
  height: 50px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-slot {
  flex-shrink: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #606266;
  border-right: 1px solid #f0f0f0;
  min-width: 20px;
}

.task-area {
  position: relative;
}

.resource-task-row {
  height: 60px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.resource-task-row:hover {
  background-color: #fafafa;
}

.task-bar {
  position: absolute;
  top: 8px;
  height: 44px;
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  min-width: 80px;
}

.task-bar:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.task-bar.selected {
  box-shadow: 0 0 0 2px white, 0 0 0 4px #1890ff;
}

.task-content {
  width: 100%;
  overflow: hidden;
}

.task-name {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 2px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.task-info {
  font-size: 11px;
  opacity: 0.9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 图例样式 */
.legend {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.legend h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #303133;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .resource-column {
    width: 150px;
  }
  
  .resource-item {
    height: 50px;
    padding: 0 8px;
  }
  
  .resource-task-row {
    height: 50px;
  }
  
  .task-bar {
    height: 34px;
    padding: 0 6px;
    min-width: 60px;
  }
  
  .task-name {
    font-size: 11px;
  }
  
  .task-info {
    font-size: 10px;
  }
  
  .legend-items {
    flex-direction: column;
    gap: 10px;
  }
}
</style>