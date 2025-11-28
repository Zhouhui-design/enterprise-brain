<template>
  <div class="drag-scheduler">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>拖拽排程</span>
          <div class="header-actions">
            <el-button size="small" type="primary" @click="handleAutoSchedule">
              <el-icon><Refresh /></el-icon>
              自动排程
            </el-button>
            <el-button size="small" @click="handleReset">
              <el-icon><CloseBold /></el-icon>
              重置视图
            </el-button>
            <el-select v-model="timeUnit" placeholder="时间单位" size="small">
              <el-option label="小时" value="hour" />
              <el-option label="半天" value="half-day" />
              <el-option label="天" value="day" />
            </el-select>
          </div>
        </div>
      </template>

      <!-- 时间轴头部 -->
      <div class="timeline-header" ref="timelineHeader">
        <div class="resource-column-header">资源</div>
        <div
          v-for="timeSlot in timeSlots"
          :key="timeSlot.key"
          class="time-slot-header"
          :style="getSlotWidthStyle"
        >
          <div class="time-label">{{ timeSlot.label }}</div>
          <div class="date-label" v-if="timeSlot.dateLabel">{{ timeSlot.dateLabel }}</div>
        </div>
      </div>

      <!-- 排程主区域 -->
      <div class="scheduler-container" ref="schedulerContainer">
        <!-- 资源列表 -->
        <div class="resource-list" ref="resourceList">
          <div
            v-for="resource in resources"
            :key="resource.id"
            class="resource-item"
            :class="{ 'selected': selectedResourceId === resource.id }"
            @click="handleResourceClick(resource)"
          >
            <div class="resource-info">
              <div class="resource-name">{{ resource.name }}</div>
              <div class="resource-type">{{ getResourceTypeLabel(resource.type) }}</div>
            </div>
            <div class="resource-status">
              <el-tag
                :type="resource.isActive ? 'success' : 'danger'"
                size="small"
                effect="plain"
              >
                {{ resource.isActive ? '运行中' : '停机' }}
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 排程网格 -->
        <div class="scheduler-grid" ref="schedulerGrid">
          <div
            v-for="resource in resources"
            :key="resource.id"
            class="resource-row"
          >
            <!-- 网格背景 -->
            <div class="grid-background">
              <div
                v-for="timeSlot in timeSlots"
                :key="timeSlot.key"
                class="grid-cell"
                :style="getSlotWidthStyle"
                :class="{ 'weekend': timeSlot.isWeekend }"
              ></div>
            </div>

            <!-- 已排任务 -->
            <div
              v-for="task in getResourceTasks(resource.id)"
              :key="task.id"
              class="schedule-task"
              :class="{ 
                'dragging': draggedTaskId === task.id,
                'selected': selectedTaskId === task.id,
                'conflict': hasTaskConflict(task)
              }"
              :style="getTaskStyle(task)"
              @mousedown="handleTaskMouseDown(task, $event)"
              @click="handleTaskClick(task)"
              :title="getTaskTooltip(task)"
            >
              <div class="task-content">
                <div class="task-title">{{ task.title }}</div>
                <div class="task-info">
                  <span class="task-id">{{ task.code }}</span>
                  <span class="task-duration">{{ formatDuration(task.duration) }}</span>
                </div>
                <div class="task-progress">
                  <el-progress
                    :percentage="task.progress || 0"
                    :color="getProgressColor(task.progress || 0)"
                    :show-text="false"
                    height="4px"
                  />
                </div>
                <div class="task-status" v-if="task.status">
                  <el-tag :type="getStatusType(task.status)" size="small" effect="dark">
                    {{ getStatusLabel(task.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 未排任务区域 -->
      <div class="unscheduled-tasks" v-if="unscheduledTasks.length > 0">
        <div class="unscheduled-header">
          <h4>待排任务 ({{ unscheduledTasks.length }})</h4>
          <el-button size="small" type="primary" @click="handleAutoScheduleAll">
            <el-icon><Plus /></el-icon>
            全部排程
          </el-button>
        </div>
        <div class="unscheduled-task-list">
          <div
            v-for="task in unscheduledTasks"
            :key="task.id"
            class="unscheduled-task-item"
            :class="{ 'draggable': !task.locked }"
            :draggable="!task.locked"
            @dragstart="handleUnscheduledTaskDragStart(task, $event)"
            @click="handleUnscheduledTaskClick(task)"
          >
            <div class="task-basic-info">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-id">{{ task.code }}</div>
            </div>
            <div class="task-meta-info">
              <div class="meta-item">
                <el-icon><Time /></el-icon>
                {{ formatDuration(task.duration) }}
              </div>
              <div class="meta-item">
                <el-icon><WarningFilled /></el-icon>
                {{ task.priority || 3 }}级
              </div>
              <div class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(task.dueDate) }}
              </div>
            </div>
            <div class="task-actions">
              <el-button
                size="small"
                type="primary"
                circle
                @click.stop="handleQuickSchedule(task)"
                :disabled="task.locked"
                title="快速排程"
              >
                <el-icon><ArrowUpRight /></el-icon>
              </el-button>
              <el-button
                size="small"
                circle
                @click.stop="handleTaskDetails(task)"
                title="任务详情"
              >
                <el-icon><View /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 任务编辑弹窗 -->
      <el-dialog
        v-model="showTaskDialog"
        title="任务详情"
        width="600px"
        destroy-on-close
      >
        <el-form
          v-if="editingTask"
          :model="editingTask"
          label-width="100px"
        >
          <el-form-item label="任务编号">
            <el-input v-model="editingTask.code" disabled />
          </el-form-item>
          <el-form-item label="任务名称">
            <el-input v-model="editingTask.title" />
          </el-form-item>
          <el-form-item label="分配资源">
            <el-select
              v-model="editingTask.resourceId"
              placeholder="选择资源"
              filterable
              clearable
            >
              <el-option
                v-for="resource in resources"
                :key="resource.id"
                :label="resource.name"
                :value="resource.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="editingTask.startTime"
              type="datetime"
              placeholder="选择开始时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="结束时间">
            <el-date-picker
              v-model="editingTask.endTime"
              type="datetime"
              placeholder="选择结束时间"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="优先级">
            <el-rate
              v-model="editingTask.priority"
              :max="5"
              :colors="['#909399', '#909399', '#e6a23c', '#f56c6c', '#f56c6c']"
            />
          </el-form-item>
          <el-form-item label="完成进度">
            <el-slider
              v-model="editingTask.progress"
              :min="0"
              :max="100"
              show-input
            />
          </el-form-item>
          <el-form-item label="任务状态">
            <el-select v-model="editingTask.status" placeholder="选择状态">
              <el-option label="未开始" value="not_started" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已暂停" value="paused" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="canceled" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注信息">
            <el-input
              v-model="editingTask.description"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showTaskDialog = false">关闭</el-button>
          <el-button type="primary" @click="handleSaveTask">保存</el-button>
        </template>
      </el-dialog>

      <!-- 排程统计信息 -->
      <div class="schedule-stats">
        <div class="stat-item">
          <span class="stat-label">总任务数</span>
          <span class="stat-value">{{ tasks.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已排任务</span>
          <span class="stat-value scheduled">{{ scheduledTasks.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">待排任务</span>
          <span class="stat-value unscheduled">{{ unscheduledTasks.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">冲突任务</span>
          <span class="stat-value conflict" v-if="conflictingTasks.length > 0">
            {{ conflictingTasks.length }}
          </span>
          <span class="stat-value no-conflict" v-else>
            0
          </span>
        </div>
        <div class="stat-item">
          <span class="stat-label">资源利用率</span>
          <span class="stat-value">{{ resourceUtilization }}%</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import { 
  Refresh, CloseBold, Plus, Time, WarningFilled, 
  Calendar, ArrowUpRight, View 
} from '@element-plus/icons-vue'

// 资源数据类型
interface Resource {
  id: string
  name: string
  type: string
  capacity: number
  isActive: boolean
  code?: string
  [key: string]: any
}

// 任务数据类型
interface Task {
  id: string
  code: string
  title: string
  resourceId?: string
  startTime?: string
  endTime?: string
  duration: number // 小时数
  priority: number
  progress: number
  status: string
  dueDate?: string
  locked?: boolean
  description?: string
  [key: string]: any
}

// 时间槽数据类型
interface TimeSlot {
  key: string
  label: string
  dateLabel?: string
  start: Date
  end: Date
  isWeekend: boolean
}

// Props定义
interface Props {
  resources?: Resource[]
  tasks?: Task[]
  startDate?: Date
  endDate?: Date
  timeUnit?: 'hour' | 'half-day' | 'day'
}

const props = withDefaults(defineProps<Props>(), {
  resources: () => [],
  tasks: () => [],
  startDate: () => new Date(),
  endDate: () => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    return date
  },
  timeUnit: 'hour'
})

// Emits定义
const emit = defineEmits<{
  'task-updated': [task: Task]
  'task-assigned': [task: Task]
  'resource-selected': [resource: Resource]
  'schedule-changed': [tasks: Task[]]
}>()

// 响应式数据
const selectedResourceId = ref('')
const selectedTaskId = ref('')
const draggedTaskId = ref('')
const dragStartX = ref(0)
const dragStartLeft = ref(0)
const dragStartTop = ref(0)
const draggedTask = ref<Task | null>(null)
const draggedTaskOriginal = ref<Task | null>(null)
const timeUnit = ref<'hour' | 'half-day' | 'day'>(props.timeUnit)
const showTaskDialog = ref(false)
const editingTask = ref<Task | null>(null)

// DOM引用
const timelineHeader = ref<HTMLElement>()
const schedulerContainer = ref<HTMLElement>()
const resourceList = ref<HTMLElement>()
const schedulerGrid = ref<HTMLElement>()

// 计算属性
const resources = computed(() => {
  return props.resources.length > 0 ? props.resources : generateMockResources()
})

const tasks = computed(() => {
  return props.tasks.length > 0 ? props.tasks : generateMockTasks()
})

const scheduledTasks = computed(() => {
  return tasks.value.filter(task => task.resourceId && task.startTime && task.endTime)
})

const unscheduledTasks = computed(() => {
  return tasks.value.filter(task => !task.resourceId || !task.startTime || !task.endTime)
})

const conflictingTasks = computed(() => {
  const conflicts: Task[] = []
  const resourceTasksMap = new Map<string, Task[]>()
  
  // 按资源分组任务
  scheduledTasks.value.forEach(task => {
    if (!task.resourceId) return
    
    if (!resourceTasksMap.has(task.resourceId)) {
      resourceTasksMap.set(task.resourceId, [])
    }
    resourceTasksMap.get(task.resourceId)!.push(task)
  })
  
  // 检查每个资源的任务是否有冲突
  resourceTasksMap.forEach(resourceTasks => {
    // 按开始时间排序
    const sortedTasks = [...resourceTasks].sort((a, b) => 
      new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime()
    )
    
    // 检查相邻任务是否重叠
    for (let i = 1; i < sortedTasks.length; i++) {
      const prevTask = sortedTasks[i - 1]
      const currentTask = sortedTasks[i]
      
      if (new Date(currentTask.startTime!).getTime() < new Date(prevTask.endTime!).getTime()) {
        if (!conflicts.includes(prevTask)) conflicts.push(prevTask)
        if (!conflicts.includes(currentTask)) conflicts.push(currentTask)
      }
    }
  })
  
  return conflicts
})

const timeSlots = computed(() => {
  return generateTimeSlots()
})

const slotWidth = computed(() => {
  switch (timeUnit.value) {
    case 'hour': return 60
    case 'half-day': return 120
    case 'day': return 180
    default: return 60
  }
})

const getSlotWidthStyle = computed(() => {
  return { width: `${slotWidth.value}px` }
})

const resourceUtilization = computed(() => {
  if (resources.value.length === 0) return 0
  
  let totalUtilization = 0
  const totalDuration = getTotalDuration() // 小时数
  
  resources.value.forEach(resource => {
    const resourceTasks = getResourceTasks(resource.id)
    let taskHours = 0
    
    resourceTasks.forEach(task => {
      if (task.startTime && task.endTime) {
        const start = new Date(task.startTime)
        const end = new Date(task.endTime)
        taskHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }
    })
    
    // 计算单个资源的利用率
    const utilization = totalDuration > 0 ? (taskHours / totalDuration) * 100 : 0
    totalUtilization += utilization
  })
  
  return Math.round(totalUtilization / resources.value.length)
})

// 生成模拟资源数据
const generateMockResources = (): Resource[] => {
  return [
    { id: 'R001', name: '设备A', type: 'machine', capacity: 8, isActive: true, code: 'MAC001' },
    { id: 'R002', name: '设备B', type: 'machine', capacity: 8, isActive: true, code: 'MAC002' },
    { id: 'R003', name: '设备C', type: 'machine', capacity: 12, isActive: true, code: 'MAC003' },
    { id: 'R004', name: '生产线1', type: 'line', capacity: 24, isActive: true, code: 'LIN001' },
    { id: 'R005', name: '生产线2', type: 'line', capacity: 24, isActive: true, code: 'LIN002' },
    { id: 'R006', name: '装配组', type: 'team', capacity: 16, isActive: true, code: 'TEA001' },
    { id: 'R007', name: '质检组', type: 'team', capacity: 12, isActive: true, code: 'TEA002' }
  ]
}

// 生成模拟任务数据
const generateMockTasks = (): Task[] => {
  const tasks: Task[] = []
  const now = new Date()
  const statuses = ['not_started', 'in_progress', 'paused', 'completed', 'canceled']
  
  // 已排任务
  for (let i = 1; i <= 15; i++) {
    const resourceIndex = Math.floor(Math.random() * 7)
    const dayOffset = Math.floor(Math.random() * 7)
    const hourStart = 8 + Math.floor(Math.random() * 8)
    const duration = 2 + Math.floor(Math.random() * 6)
    
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() + dayOffset)
    startDate.setHours(hourStart, 0, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setHours(startDate.getHours() + duration, 0, 0, 0)
    
    const dueDate = new Date(endDate)
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 3))
    
    tasks.push({
      id: `T${i.toString().padStart(4, '0')}`,
      code: `JOB${i.toString().padStart(4, '0')}`,
      title: `生产任务 ${i}`,
      resourceId: `R${String(resourceIndex + 1).padStart(3, '0')}`,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: duration,
      priority: 1 + Math.floor(Math.random() * 5),
      progress: Math.floor(Math.random() * 101),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      dueDate: dueDate.toISOString(),
      locked: i % 10 === 0
    })
  }
  
  // 未排任务
  for (let i = 16; i <= 25; i++) {
    const duration = 2 + Math.floor(Math.random() * 8)
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + 3 + Math.floor(Math.random() * 10))
    
    tasks.push({
      id: `T${i.toString().padStart(4, '0')}`,
      code: `JOB${i.toString().padStart(4, '0')}`,
      title: `待排任务 ${i - 15}`,
      duration: duration,
      priority: 1 + Math.floor(Math.random() * 5),
      progress: 0,
      status: 'not_started',
      dueDate: dueDate.toISOString(),
      locked: i % 15 === 0
    })
  }
  
  return tasks
}

// 生成时间槽
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  const startDate = new Date(props.startDate)
  const endDate = new Date(props.endDate)
  
  // 设置开始时间为当天0点
  startDate.setHours(0, 0, 0, 0)
  
  let current = new Date(startDate)
  let slotIndex = 0
  
  while (current < endDate) {
    const slotEnd = new Date(current)
    const dayOfWeek = current.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    
    // 根据时间单位设置时间槽长度
    switch (timeUnit.value) {
      case 'hour':
        slotEnd.setHours(current.getHours() + 1)
        slots.push({
          key: `slot-${slotIndex}`,
          label: `${current.getHours().toString().padStart(2, '0')}:00`,
          dateLabel: isWeekend ? '周末' : '',
          start: new Date(current),
          end: slotEnd,
          isWeekend
        })
        break
      case 'half-day':
        // 上午
        slotEnd.setHours(12)
        slots.push({
          key: `slot-${slotIndex}`,
          label: '上午',
          dateLabel: formatDate(current),
          start: new Date(current),
          end: slotEnd,
          isWeekend
        })
        slotIndex++
        
        // 下午
        current.setHours(12)
        slotEnd.setHours(24)
        slots.push({
          key: `slot-${slotIndex}`,
          label: '下午',
          dateLabel: isWeekend ? '周末' : '',
          start: new Date(current),
          end: slotEnd,
          isWeekend
        })
        break
      case 'day':
        slotEnd.setDate(current.getDate() + 1)
        slots.push({
          key: `slot-${slotIndex}`,
          label: formatDate(current, 'MM/dd'),
          dateLabel: getWeekdayLabel(current),
          start: new Date(current),
          end: slotEnd,
          isWeekend
        })
        break
    }
    
    current = slotEnd
    slotIndex++
  }
  
  return slots
}

// 获取资源的任务列表
const getResourceTasks = (resourceId: string): Task[] => {
  return scheduledTasks.value
    .filter(task => task.resourceId === resourceId)
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())
}

// 获取任务样式
const getTaskStyle = (task: Task) => {
  if (!task.startTime || !task.endTime || !task.resourceId) {
    return {}
  }
  
  const start = new Date(task.startTime)
  const end = new Date(task.endTime)
  const startTimeSlot = getTimeSlotForDate(start)
  const endTimeSlot = getTimeSlotForDate(end)
  
  if (!startTimeSlot || !endTimeSlot) {
    return {}
  }
  
  // 计算任务宽度
  const startSlotIndex = timeSlots.value.indexOf(startTimeSlot)
  const endSlotIndex = timeSlots.value.indexOf(endTimeSlot)
  const width = ((endSlotIndex - startSlotIndex + 1) * slotWidth.value) - 2
  
  // 计算任务左侧偏移
  const slotDuration = getSlotDuration(timeUnit.value)
  const slotStart = new Date(startTimeSlot.start)
  const offsetHours = (start.getTime() - slotStart.getTime()) / (1000 * 60 * 60)
  const left = (offsetHours / slotDuration) * slotWidth.value
  
  // 动态高度（根据任务状态和优先级）
  let height = '85%'
  if (task.priority <= 2) {
    height = '90%'
  } else if (task.priority >= 4) {
    height = '75%'
  }
  
  return {
    position: 'absolute',
    left: `${left}px`,
    width: `${width}px`,
    height: height,
    backgroundColor: getTaskColor(task),
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: task.locked ? 'not-allowed' : 'move',
    opacity: task.locked ? 0.7 : 1
  }
}

// 获取任务颜色
const getTaskColor = (task: Task): string => {
  // 根据状态和优先级确定颜色
  switch (task.status) {
    case 'completed':
      return '#67c23a'
    case 'in_progress':
      return task.priority <= 2 ? '#f56c6c' : '#1890ff'
    case 'paused':
      return '#909399'
    case 'canceled':
      return '#c0c4cc'
    default:
      // 未开始的任务根据优先级
      if (task.priority <= 2) return '#f56c6c'
      if (task.priority <= 3) return '#e6a23c'
      return '#1890ff'
  }
}

// 获取任务提示文本
const getTaskTooltip = (task: Task): string => {
  let tooltip = `${task.title}\n`
  tooltip += `编号: ${task.code}\n`
  tooltip += `优先级: ${task.priority}级\n`
  tooltip += `状态: ${getStatusLabel(task.status)}\n`
  tooltip += `进度: ${task.progress}%\n`
  
  if (task.startTime && task.endTime) {
    const start = new Date(task.startTime)
    const end = new Date(task.endTime)
    tooltip += `时间: ${start.toLocaleString('zh-CN')} - ${end.toLocaleString('zh-CN')}\n`
    tooltip += `时长: ${formatDuration(task.duration)}`
  }
  
  return tooltip
}

// 检查任务是否有冲突
const hasTaskConflict = (task: Task): boolean => {
  return conflictingTasks.value.some(t => t.id === task.id)
}

// 获取资源类型标签
const getResourceTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'machine': '设备',
    'line': '生产线',
    'team': '班组',
    'person': '人员'
  }
  return typeMap[type] || type
}

// 获取状态类型
const getStatusType = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': 'info',
    'in_progress': 'primary',
    'paused': 'warning',
    'completed': 'success',
    'canceled': 'danger'
  }
  return statusMap[status] || 'default'
}

// 获取状态标签
const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'not_started': '未开始',
    'in_progress': '进行中',
    'paused': '已暂停',
    'completed': '已完成',
    'canceled': '已取消'
  }
  return statusMap[status] || status
}

// 获取进度颜色
const getProgressColor = (progress: number): string => {
  if (progress >= 100) return '#67c23a'
  if (progress >= 75) return '#1890ff'
  if (progress >= 50) return '#e6a23c'
  return '#f56c6c'
}

// 格式化时长
const formatDuration = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}分钟`
  }
  if (hours % 1 === 0) {
    return `${hours}小时`
  }
  return `${hours}小时`
}

// 格式化日期
const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('dd', day)
}

// 获取星期标签
const getWeekdayLabel = (date: Date): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[date.getDay()]
}

// 获取时间槽对应的日期
const getTimeSlotForDate = (date: Date): TimeSlot | undefined => {
  return timeSlots.value.find(slot => date >= slot.start && date < slot.end)
}

// 获取时间槽持续时间（小时）
const getSlotDuration = (unit: string): number => {
  switch (unit) {
    case 'hour': return 1
    case 'half-day': return 12
    case 'day': return 24
    default: return 1
  }
}

// 获取总持续时间（小时）
const getTotalDuration = (): number => {
  const start = new Date(props.startDate)
  const end = new Date(props.endDate)
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
}

// 资源点击处理
const handleResourceClick = (resource: Resource) => {
  selectedResourceId.value = selectedResourceId.value === resource.id ? '' : resource.id
  emit('resource-selected', resource)
}

// 任务点击处理
const handleTaskClick = (task: Task) => {
  selectedTaskId.value = selectedTaskId.value === task.id ? '' : task.id
}

// 任务鼠标按下处理（开始拖拽）
const handleTaskMouseDown = (task: Task, event: MouseEvent) => {
  if (task.locked) return
  
  // 记录拖拽起始位置
  dragStartX.value = event.clientX
  const taskElement = event.currentTarget as HTMLElement
  const style = window.getComputedStyle(taskElement)
  dragStartLeft.value = parseInt(style.left || '0')
  dragStartTop.value = parseInt(style.top || '0')
  
  // 存储正在拖拽的任务
  draggedTaskId.value = task.id
  draggedTask.value = { ...task }
  draggedTaskOriginal.value = { ...task }
  
  // 添加鼠标移动和释放事件监听器
  document.addEventListener('mousemove', handleTaskMouseMove)
  document.addEventListener('mouseup', handleTaskMouseUp)
  
  // 阻止默认行为
  event.preventDefault()
}

// 任务鼠标移动处理（拖拽中）
const handleTaskMouseMove = (event: MouseEvent) => {
  if (!draggedTask.value || !schedulerGrid.value) return
  
  // 计算拖拽偏移
  const deltaX = event.clientX - dragStartX.value
  const newLeft = dragStartLeft.value + deltaX
  
  // 找到当前鼠标位置对应的资源行和时间槽
  const gridRect = schedulerGrid.value.getBoundingClientRect()
  const rowIndex = Math.floor((event.clientY - gridRect.top) / 60) // 假设每行高度60px
  const slotIndex = Math.floor((event.clientX - gridRect.left) / slotWidth.value)
  
  // 更新任务位置和分配
  if (rowIndex >= 0 && rowIndex < resources.value.length && slotIndex >= 0 && slotIndex < timeSlots.value.length) {
    const newResource = resources.value[rowIndex]
    const newTimeSlot = timeSlots.value[slotIndex]
    
    // 更新任务信息
    draggedTask.value.resourceId = newResource.id
    
    // 计算新的开始和结束时间
    const slotDuration = getSlotDuration(timeUnit.value)
    const slotStartTime = new Date(newTimeSlot.start)
    const newStartTime = new Date(slotStartTime)
    
    // 根据鼠标位置调整开始时间在时间槽内的偏移
    const slotOffset = (newLeft - (slotIndex * slotWidth.value)) / slotWidth.value
    newStartTime.setHours(slotStartTime.getHours() + (slotOffset * slotDuration))
    
    const newEndTime = new Date(newStartTime)
    newEndTime.setHours(newStartTime.getHours() + draggedTask.value.duration)
    
    draggedTask.value.startTime = newStartTime.toISOString()
    draggedTask.value.endTime = newEndTime.toISOString()
  }
}

// 任务鼠标释放处理（拖拽结束）
const handleTaskMouseUp = () => {
  // 移除事件监听器
  document.removeEventListener('mousemove', handleTaskMouseMove)
  document.removeEventListener('mouseup', handleTaskMouseUp)
  
  if (draggedTask.value) {
    // 检查是否有有效的资源和时间分配
    if (draggedTask.value.resourceId && draggedTask.value.startTime && draggedTask.value.endTime) {
      // 更新任务
      emit('task-updated', draggedTask.value)
      
      // 检查是否有冲突
      if (hasTaskConflict(draggedTask.value)) {
        ElNotification.warning({
          title: '任务冲突',
          message: `任务 ${draggedTask.value.title} 与其他任务存在时间冲突`
        })
      } else {
        ElMessage.success('任务调整成功')
      }
    } else {
      // 恢复原始状态
      draggedTask.value = draggedTaskOriginal.value
    }
  }
  
  // 重置拖拽状态
  draggedTaskId.value = ''
  draggedTask.value = null
  draggedTaskOriginal.value = null
}

// 未排任务拖拽开始
const handleUnscheduledTaskDragStart = (task: Task, event: DragEvent) => {
  if (task.locked) return
  
  // 设置拖拽数据
  if (event.dataTransfer) {
    event.dataTransfer.setData('taskId', task.id)
    event.dataTransfer.effectAllowed = 'move'
  }
  
  draggedTaskId.value = task.id
  draggedTask.value = { ...task }
}

// 未排任务点击处理
const handleUnscheduledTaskClick = (task: Task) => {
  selectedTaskId.value = selectedTaskId.value === task.id ? '' : task.id
}

// 快速排程
const handleQuickSchedule = (task: Task) => {
  if (task.locked) {
    ElMessage.warning('锁定的任务不能快速排程')
    return
  }
  
  // 查找第一个可用的资源和时间段
  for (const resource of resources.value) {
    if (!resource.isActive) continue
    
    // 获取资源的现有任务
    const existingTasks = getResourceTasks(resource.id)
    
    // 找到第一个可用的开始时间（从当前时间开始）
    let startTime = new Date()
    startTime.setMinutes(0, 0, 0)
    
    // 如果有现有任务，从最后一个任务结束时间开始
    if (existingTasks.length > 0) {
      const lastTask = existingTasks[existingTasks.length - 1]
      if (lastTask.endTime) {
        startTime = new Date(lastTask.endTime)
      }
    }
    
    // 计算结束时间
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + task.duration)
    
    // 更新任务
    const updatedTask = {
      ...task,
      resourceId: resource.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }
    
    emit('task-assigned', updatedTask)
    ElMessage.success(`任务已分配给 ${resource.name}`)
    return
  }
  
  ElMessage.warning('没有可用资源进行快速排程')
}

// 任务详情
const handleTaskDetails = (task: Task) => {
  editingTask.value = { ...task }
  showTaskDialog.value = true
}

// 保存任务
const handleSaveTask = () => {
  if (!editingTask.value) return
  
  // 验证必填字段
  if (!editingTask.value.title) {
    ElMessage.warning('请输入任务名称')
    return
  }
  
  if (editingTask.value.resourceId && (!editingTask.value.startTime || !editingTask.value.endTime)) {
    ElMessage.warning('已分配资源的任务必须设置开始和结束时间')
    return
  }
  
  // 如果设置了开始和结束时间，重新计算持续时间
  if (editingTask.value.startTime && editingTask.value.endTime) {
    const start = new Date(editingTask.value.startTime)
    const end = new Date(editingTask.value.endTime)
    editingTask.value.duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }
  
  emit('task-updated', editingTask.value)
  showTaskDialog.value = false
  ElMessage.success('任务保存成功')
}

// 自动排程
const handleAutoSchedule = () => {
  ElMessage.info('开始自动排程...')
  
  // 模拟自动排程逻辑
  setTimeout(() => {
    const scheduledCount = Math.min(3, unscheduledTasks.value.length)
    
    if (scheduledCount > 0) {
      ElMessage.success(`成功排程 ${scheduledCount} 个任务`)
      // 实际应用中应该调用API或进行本地计算来更新任务分配
    } else {
      ElMessage.warning('没有可排程的任务')
    }
  }, 1500)
}

// 全部排程
const handleAutoScheduleAll = () => {
  if (unscheduledTasks.value.length === 0) {
    ElMessage.info('没有待排任务')
    return
  }
  
  ElMessage.info(`开始为 ${unscheduledTasks.value.length} 个任务进行自动排程...`)
  
  // 模拟自动排程逻辑
  setTimeout(() => {
    ElMessage.success('所有任务排程完成')
    // 实际应用中应该调用API或进行本地计算来更新任务分配
  }, 2000)
}

// 重置视图
const handleReset = () => {
  selectedResourceId.value = ''
  selectedTaskId.value = ''
  
  // 滚动到顶部
  if (schedulerContainer.value) {
    schedulerContainer.value.scrollTop = 0
    schedulerContainer.value.scrollLeft = 0
  }
}

// 监听时间单位变化
const watchTimeUnitChange = () => {
  nextTick(() => {
    // 时间单位变化时重新计算布局
  })
}

// 组件挂载后初始化
onMounted(() => {
  // 添加拖拽事件监听
  if (schedulerGrid.value) {
    schedulerGrid.value.addEventListener('dragover', (e) => e.preventDefault())
    schedulerGrid.value.addEventListener('drop', handleDrop)
  }
  
  // 监听时间单位变化
  watchTimeUnitChange()
})

// 处理拖拽放置
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  if (!schedulerGrid.value || !event.dataTransfer) return
  
  const taskId = event.dataTransfer.getData('taskId')
  const task = tasks.value.find(t => t.id === taskId)
  
  if (!task || task.locked) return
  
  // 计算放置位置对应的资源和时间槽
  const gridRect = schedulerGrid.value.getBoundingClientRect()
  const rowIndex = Math.floor((event.clientY - gridRect.top) / 60) // 假设每行高度60px
  const slotIndex = Math.floor((event.clientX - gridRect.left) / slotWidth.value)
  
  if (rowIndex >= 0 && rowIndex < resources.value.length && slotIndex >= 0 && slotIndex < timeSlots.value.length) {
    const resource = resources.value[rowIndex]
    const timeSlot = timeSlots.value[slotIndex]
    
    // 计算开始和结束时间
    const startTime = new Date(timeSlot.start)
    const endTime = new Date(startTime)
    endTime.setHours(startTime.getHours() + task.duration)
    
    // 更新任务
    const updatedTask = {
      ...task,
      resourceId: resource.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    }
    
    emit('task-assigned', updatedTask)
    ElMessage.success(`任务已分配给 ${resource.name}`)
  }
  
  draggedTaskId.value = ''
}
</script>

<style scoped>
.drag-scheduler {
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

/* 时间轴头部样式 */
.timeline-header {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f5f7fa;
  position: sticky;
  top: 0;
  z-index: 100;
}

.resource-column-header {
  width: 200px;
  padding: 10px;
  font-weight: 600;
  color: #606266;
  border-right: 1px solid #e4e7ed;
  text-align: center;
}

.time-slot-header {
  border-right: 1px solid #f0f0f0;
  padding: 5px;
  text-align: center;
  min-width: 60px;
}

.time-label {
  font-weight: 600;
  color: #303133;
  font-size: 12px;
}

.date-label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

/* 排程容器样式 */
.scheduler-container {
  display: flex;
  height: 600px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 10px;
}

/* 资源列表样式 */
.resource-list {
  width: 200px;
  border-right: 1px solid #e4e7ed;
  background-color: #f5f7fa;
  overflow-y: auto;
  flex-shrink: 0;
}

.resource-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.resource-type {
  font-size: 12px;
  color: #909399;
}

/* 排程网格样式 */
.scheduler-grid {
  flex: 1;
  overflow: auto;
  position: relative;
  background-color: #fff;
}

.resource-row {
  height: 60px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.grid-background {
  display: flex;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.grid-cell {
  border-right: 1px solid #f0f0f0;
  min-width: 60px;
}

.grid-cell.weekend {
  background-color: #fafafa;
}

/* 任务样式 */
.schedule-task {
  border-radius: 4px;
  padding: 6px;
  color: white;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  user-select: none;
}

.schedule-task:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.schedule-task.dragging {
  opacity: 0.8;
  transform: scale(1.02);
  z-index: 1000;
}

.schedule-task.selected {
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 2px #1890ff;
}

.schedule-task.conflict {
  border: 2px dashed #f56c6c;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.task-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  opacity: 0.9;
}

.task-progress {
  margin-top: 2px;
}

.task-status {
  position: absolute;
  top: 2px;
  right: 2px;
}

/* 未排任务区域样式 */
.unscheduled-tasks {
  margin-top: 20px;
}

.unscheduled-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.unscheduled-header h4 {
  margin: 0;
  color: #303133;
}

.unscheduled-task-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.unscheduled-task-item {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  width: calc(25% - 9px);
  min-width: 280px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unscheduled-task-item:hover {
  background-color: #ecf5ff;
  border-color: #91d5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.unscheduled-task-item.draggable:hover {
  cursor: grab;
}

.unscheduled-task-item.draggable:active {
  cursor: grabbing;
}

.task-basic-info {
  flex: 1;
}

.task-meta-info {
  display: flex;
  gap: 12px;
  margin: 8px 0;
  font-size: 12px;
  color: #606266;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-actions {
  display: flex;
  gap: 6px;
}

/* 统计信息样式 */
.schedule-stats {
  margin-top: 20px;
  display: flex;
  gap: 30px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-value.scheduled {
  color: #1890ff;
}

.stat-value.unscheduled {
  color: #e6a23c;
}

.stat-value.conflict {
  color: #f56c6c;
}

.stat-value.no-conflict {
  color: #67c23a;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .unscheduled-task-item {
    width: calc(33.333% - 8px);
  }
}

@media (max-width: 992px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  
  .resource-list {
    width: 160px;
  }
  
  .resource-column-header {
    width: 160px;
  }
  
  .unscheduled-task-item {
    width: calc(50% - 6px);
  }
  
  .schedule-stats {
    flex-wrap: wrap;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .scheduler-container {
    height: 400px;
  }
  
  .resource-item {
    padding: 8px 10px;
  }
  
  .unscheduled-task-item {
    width: 100%;
    min-width: unset;
  }
  
  .task-meta-info {
    flex-direction: column;
    gap: 4px;
    margin: 6px 0;
  }
  
  .schedule-stats {
    gap: 15px;
  }
}
</style>