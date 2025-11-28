<template>
  <div class="resource-calendar">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>资源日历</span>
          <div class="header-actions">
            <el-select v-model="selectedResourceType" placeholder="资源类型" size="small">
              <el-option label="全部" value="" />
              <el-option label="设备" value="machine" />
              <el-option label="生产线" value="line" />
              <el-option label="班组" value="team" />
              <el-option label="人员" value="person" />
            </el-select>
            <el-select v-model="viewType" placeholder="视图" size="small">
              <el-option label="日视图" value="day" />
              <el-option label="周视图" value="week" />
              <el-option label="月视图" value="month" />
            </el-select>
            <el-button size="small" @click="handleToday">
              <el-icon><Today /></el-icon>
              今天
            </el-button>
          </div>
        </div>
      </template>

      <!-- 日历导航 -->
      <div class="calendar-nav">
        <el-button size="small" @click="handlePrev">
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="current-date">{{ currentDateText }}</span>
        <el-button size="small" @click="handleNext">
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          size="small"
          @change="handleDateChange"
        />
      </div>

      <!-- 资源列表和日历网格 -->
      <div class="calendar-container" ref="calendarContainer">
        <!-- 资源列表列 -->
        <div class="resource-column">
          <div class="resource-header-cell">资源名称</div>
          <div
            v-for="resource in filteredResources"
            :key="resource.id"
            class="resource-cell"
            :class="{ 'selected': selectedResourceId === resource.id }"
            @click="handleResourceClick(resource)"
          >
            <div class="resource-name">{{ resource.name }}</div>
            <div class="resource-availability">
              <el-progress
                :percentage="getResourceAvailability(resource)"
                :color="getAvailabilityColor(getResourceAvailability(resource))"
                size="small"
                :show-text="false"
              />
            </div>
          </div>
        </div>

        <!-- 日历网格 -->
        <div class="calendar-grid" ref="calendarGrid">
          <!-- 时间头部 -->
          <div class="time-header">
            <div
              v-for="timeSlot in timeSlots"
              :key="timeSlot.key"
              class="time-header-cell"
              :style="getSlotStyle()"
            >
              <div class="time-label">{{ timeSlot.label }}</div>
              <div class="time-sub-label" v-if="timeSlot.subLabel">{{ timeSlot.subLabel }}</div>
            </div>
          </div>

          <!-- 资源日历行 -->
          <div
            v-for="resource in filteredResources"
            :key="resource.id"
            class="resource-calendar-row"
          >
            <div
              v-for="timeSlot in timeSlots"
              :key="`${resource.id}-${timeSlot.key}`"
              class="calendar-cell"
              :style="getSlotStyle()"
              :class="{
                'available': isSlotAvailable(resource, timeSlot),
                'partially-available': isSlotPartiallyAvailable(resource, timeSlot),
                'unavailable': !isSlotAvailable(resource, timeSlot) && !isSlotPartiallyAvailable(resource, timeSlot),
                'has-event': hasSlotEvent(resource, timeSlot)
              }"
              @click="handleSlotClick(resource, timeSlot)"
              @mouseenter="handleSlotMouseEnter(resource, timeSlot)"
              @mouseleave="handleSlotMouseLeave"
            >
              <!-- 事件指示器 -->
              <div
                v-for="event in getSlotEvents(resource, timeSlot)"
                :key="event.id"
                class="event-indicator"
                :style="{ backgroundColor: getEventColor(event) }"
                :title="getEventTooltip(event)"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 资源详情侧边栏 -->
      <el-drawer
        v-model="showResourceDetail"
        title="资源详情"
        size="400px"
        direction="rtl"
      >
        <div v-if="selectedResource" class="resource-detail">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="资源编号">{{ selectedResource.code }}</el-descriptions-item>
            <el-descriptions-item label="资源名称">{{ selectedResource.name }}</el-descriptions-item>
            <el-descriptions-item label="资源类型">{{ getResourceTypeLabel(selectedResource.type) }}</el-descriptions-item>
            <el-descriptions-item label="容量">{{ selectedResource.capacity }} 小时/天</el-descriptions-item>
            <el-descriptions-item label="可用状态">{{ selectedResource.isActive ? '可用' : '不可用' }}</el-descriptions-item>
            <el-descriptions-item label="维护周期">{{ selectedResource.maintenanceCycle || '-' }} 天</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ selectedResource.manager || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注信息">{{ selectedResource.remark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <!-- 当前选中日期的事件列表 -->
          <div class="resource-events">
            <h4>当日事件</h4>
            <el-timeline v-if="selectedResourceEvents.length > 0">
              <el-timeline-item
                v-for="event in selectedResourceEvents"
                :key="event.id"
                :timestamp="formatTimeRange(event)"
                :type="getEventTimelineType(event)"
              >
                <div class="event-content">
                  <div class="event-title">{{ event.title }}</div>
                  <div class="event-info">
                    <span class="event-type">{{ getEventTypeLabel(event.type) }}</span>
                    <span class="event-status" v-if="event.status">{{ getEventStatusLabel(event.status) }}</span>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <p v-else class="no-events">当日无事件安排</p>
          </div>
        </div>
      </el-drawer>

      <!-- 图例 -->
      <div class="legend">
        <h4>图例说明</h4>
        <div class="legend-items">
          <div class="legend-item">
            <div class="legend-color available"></div>
            <span>完全可用</span>
          </div>
          <div class="legend-item">
            <div class="legend-color partially-available"></div>
            <span>部分可用</span>
          </div>
          <div class="legend-item">
            <div class="legend-color unavailable"></div>
            <span>不可用</span>
          </div>
          <div class="legend-item" v-for="eventType in eventTypes" :key="eventType.value">
            <div class="legend-color" :style="{ backgroundColor: eventType.color }"></div>
            <span>{{ eventType.label }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Today } from '@element-plus/icons-vue'

// 资源数据类型
interface Resource {
  id: string
  code: string
  name: string
  type: string
  capacity: number
  isActive: boolean
  maintenanceCycle?: number
  manager?: string
  remark?: string
  [key: string]: any
}

// 事件数据类型
interface ResourceEvent {
  id: string
  resourceId: string
  title: string
  type: string
  startTime: string
  endTime: string
  status?: string
  priority?: number
  [key: string]: any
}

// 时间槽数据类型
interface TimeSlot {
  key: string
  label: string
  subLabel?: string
  start: Date
  end: Date
}

// Props定义
interface Props {
  resources?: Resource[]
  events?: ResourceEvent[]
  selectedDate?: Date
  viewType?: 'day' | 'week' | 'month'
}

const props = withDefaults(defineProps<Props>(), {
  resources: () => [],
  events: () => [],
  selectedDate: () => new Date(),
  viewType: 'week'
})

// Emits定义
const emit = defineEmits<{
  'resource-click': [resource: Resource]
  'slot-click': [resource: Resource, timeSlot: TimeSlot]
  'date-change': [date: Date]
}>()

// 响应式数据
const selectedDate = ref(new Date(props.selectedDate))
const viewType = ref<'day' | 'week' | 'month'>(props.viewType)
const selectedResourceType = ref('')
const selectedResourceId = ref('')
const selectedResource = ref<Resource | null>(null)
const showResourceDetail = ref(false)
const hoveredSlot = ref<{ resource: Resource; slot: TimeSlot } | null>(null)

// DOM引用
const calendarContainer = ref<HTMLElement>()
const calendarGrid = ref<HTMLElement>()

// 事件类型配置
const eventTypes = [
  { value: 'production', label: '生产任务', color: '#1890ff' },
  { value: 'maintenance', label: '设备维护', color: '#f56c6c' },
  { value: 'setup', label: '设备调试', color: '#e6a23c' },
  { value: 'break', label: '休息时间', color: '#909399' },
  { value: 'other', label: '其他', color: '#67c23a' }
]

// 计算属性
const resources = computed(() => {
  return props.resources.length > 0 ? props.resources : generateMockResources()
})

const events = computed(() => {
  return props.events.length > 0 ? props.events : generateMockEvents()
})

const filteredResources = computed(() => {
  if (!selectedResourceType.value) {
    return resources.value
  }
  return resources.value.filter(resource => resource.type === selectedResourceType.value)
})

const timeSlots = computed(() => {
  return generateTimeSlots()
})

const currentDateText = computed(() => {
  if (viewType.value === 'day') {
    return selectedDate.value.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  } else if (viewType.value === 'week') {
    const weekStart = getWeekStart(selectedDate.value)
    const weekEnd = getWeekEnd(selectedDate.value)
    return `${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`
  } else {
    return selectedDate.value.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long'
    })
  }
})

const selectedResourceEvents = computed(() => {
  if (!selectedResource.value) return []
  
  // 获取当前选中日期的所有事件
  const startOfDay = new Date(selectedDate.value)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(selectedDate.value)
  endOfDay.setHours(23, 59, 59, 999)
  
  return events.value.filter(event => 
    event.resourceId === selectedResource.value?.id &&
    new Date(event.startTime) <= endOfDay &&
    new Date(event.endTime) >= startOfDay
  ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
})

// 生成模拟资源数据
const generateMockResources = (): Resource[] => {
  return [
    { id: 'R001', code: 'MAC001', name: '设备A-001', type: 'machine', capacity: 8, isActive: true, manager: '张三' },
    { id: 'R002', code: 'MAC002', name: '设备B-002', type: 'machine', capacity: 8, isActive: true, manager: '李四' },
    { id: 'R003', code: 'MAC003', name: '设备C-003', type: 'machine', capacity: 12, isActive: true, maintenanceCycle: 30 },
    { id: 'R004', code: 'LIN001', name: '生产线1', type: 'line', capacity: 24, isActive: true },
    { id: 'R005', code: 'LIN002', name: '生产线2', type: 'line', capacity: 24, isActive: true },
    { id: 'R006', code: 'TEA001', name: '装配组1', type: 'team', capacity: 16, isActive: true, manager: '王五' },
    { id: 'R007', code: 'TEA002', name: '装配组2', type: 'team', capacity: 16, isActive: true, manager: '赵六' },
    { id: 'R008', code: 'TEA003', name: '质检组', type: 'team', capacity: 12, isActive: true },
    { id: 'R009', code: 'PER001', name: '技术员-张三', type: 'person', capacity: 8, isActive: true },
    { id: 'R010', code: 'PER002', name: '操作员-李四', type: 'person', capacity: 8, isActive: true }
  ]
}

// 生成模拟事件数据
const generateMockEvents = (): ResourceEvent[] => {
  const mockEvents: ResourceEvent[] = []
  const now = new Date()
  const eventTypes = ['production', 'maintenance', 'setup', 'break', 'other']
  
  // 为每个资源生成未来7天的事件
  for (let i = 0; i < 50; i++) {
    const resourceIndex = Math.floor(Math.random() * 10)
    const dayOffset = Math.floor(Math.random() * 7) - 3 // 过去3天到未来3天
    const hourStart = 8 + Math.floor(Math.random() * 8) // 8-16点之间
    const duration = 2 + Math.floor(Math.random() * 4) // 2-6小时
    
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() + dayOffset)
    startDate.setHours(hourStart, 0, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setHours(startDate.getHours() + duration, 0, 0, 0)
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    
    mockEvents.push({
      id: `EV${i + 1001}`,
      resourceId: `R${String(resourceIndex + 1).padStart(3, '0')}`,
      title: `${getEventTypeLabel(eventType)}事件 ${i + 1}`,
      type: eventType,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      status: i % 5 === 0 ? 'completed' : i % 5 === 1 ? 'scheduled' : 'in_progress',
      priority: 1 + Math.floor(Math.random() * 3)
    })
  }
  
  return mockEvents
}

// 生成时间槽
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = []
  
  if (viewType.value === 'day') {
    // 日视图：每小时一个槽
    for (let hour = 0; hour < 24; hour++) {
      const slotStart = new Date(selectedDate.value)
      slotStart.setHours(hour, 0, 0, 0)
      const slotEnd = new Date(slotStart)
      slotEnd.setHours(hour + 1, 0, 0, 0)
      
      slots.push({
        key: `hour-${hour}`,
        label: `${hour.toString().padStart(2, '0')}:00`,
        start: slotStart,
        end: slotEnd
      })
    }
  } else if (viewType.value === 'week') {
    // 周视图：每天一个槽
    const weekStart = getWeekStart(selectedDate.value)
    for (let day = 0; day < 7; day++) {
      const slotStart = new Date(weekStart)
      slotStart.setDate(weekStart.getDate() + day)
      slotStart.setHours(0, 0, 0, 0)
      const slotEnd = new Date(slotStart)
      slotEnd.setHours(23, 59, 59, 999)
      
      const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][slotStart.getDay()]
      
      slots.push({
        key: `day-${day}`,
        label: weekday,
        subLabel: `${slotStart.getMonth() + 1}/${slotStart.getDate()}`,
        start: slotStart,
        end: slotEnd
      })
    }
  } else {
    // 月视图：每天一个槽
    const daysInMonth = getDaysInMonth(selectedDate.value)
    const monthStart = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), 1)
    
    // 添加上个月的尾部几天
    const startDayOfWeek = monthStart.getDay()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const slotStart = new Date(monthStart)
      slotStart.setDate(monthStart.getDate() - i - 1)
      slotStart.setHours(0, 0, 0, 0)
      const slotEnd = new Date(slotStart)
      slotEnd.setHours(23, 59, 59, 999)
      
      slots.push({
        key: `prev-${i}`,
        label: `${slotStart.getDate()}`,
        start: slotStart,
        end: slotEnd
      })
    }
    
    // 添加当月的所有天
    for (let day = 1; day <= daysInMonth; day++) {
      const slotStart = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), day)
      slotStart.setHours(0, 0, 0, 0)
      const slotEnd = new Date(slotStart)
      slotEnd.setHours(23, 59, 59, 999)
      
      slots.push({
        key: `month-${day}`,
        label: `${day}`,
        start: slotStart,
        end: slotEnd
      })
    }
    
    // 添加下个月的头部几天，补齐到6行
    const totalSlots = slots.length
    const remainingSlots = 42 - totalSlots // 6行7列=42个槽
    for (let i = 1; i <= remainingSlots; i++) {
      const slotStart = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, i)
      slotStart.setHours(0, 0, 0, 0)
      const slotEnd = new Date(slotStart)
      slotEnd.setHours(23, 59, 59, 999)
      
      slots.push({
        key: `next-${i}`,
        label: `${i}`,
        start: slotStart,
        end: slotEnd
      })
    }
  }
  
  return slots
}

// 获取资源可用性百分比
const getResourceAvailability = (resource: Resource): number => {
  if (!resource.isActive) return 0
  
  // 模拟计算当天的可用性
  const dayOfWeek = selectedDate.value.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return Math.random() > 0.7 ? 0 : 20 + Math.floor(Math.random() * 30)
  }
  
  return 50 + Math.floor(Math.random() * 51)
}

// 获取可用性颜色
const getAvailabilityColor = (percentage: number): string => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  if (percentage > 0) return '#f56c6c'
  return '#909399'
}

// 判断时间槽是否可用
const isSlotAvailable = (resource: Resource, timeSlot: TimeSlot): boolean => {
  if (!resource.isActive) return false
  
  // 检查是否有冲突事件
  const conflictingEvents = getSlotEvents(resource, timeSlot)
  if (conflictingEvents.length === 0) {
    return true
  }
  
  // 如果所有事件都是低优先级的休息事件，则视为可用
  const hasHighPriorityEvent = conflictingEvents.some(event => 
    event.type !== 'break' || (event.priority && event.priority <= 2)
  )
  
  return !hasHighPriorityEvent
}

// 判断时间槽是否部分可用
const isSlotPartiallyAvailable = (resource: Resource, timeSlot: TimeSlot): boolean => {
  if (!resource.isActive) return false
  
  const events = getSlotEvents(resource, timeSlot)
  if (events.length === 0) return false
  
  // 如果有休息事件或低优先级事件，则视为部分可用
  return events.some(event => event.type === 'break' || (event.priority && event.priority >= 3))
}

// 检查时间槽是否有事件
const hasSlotEvent = (resource: Resource, timeSlot: TimeSlot): boolean => {
  return getSlotEvents(resource, timeSlot).length > 0
}

// 获取时间槽的事件列表
const getSlotEvents = (resource: Resource, timeSlot: TimeSlot): ResourceEvent[] => {
  return events.value.filter(event => 
    event.resourceId === resource.id &&
    new Date(event.startTime) < timeSlot.end &&
    new Date(event.endTime) > timeSlot.start
  )
}

// 获取事件颜色
const getEventColor = (event: ResourceEvent): string => {
  const eventType = eventTypes.find(et => et.value === event.type)
  return eventType ? eventType.color : '#909399'
}

// 获取事件提示文本
const getEventTooltip = (event: ResourceEvent): string => {
  return `${event.title}\n${formatTimeRange(event)}\n类型: ${getEventTypeLabel(event.type)}`
}

// 获取事件时间线类型
const getEventTimelineType = (event: ResourceEvent): string => {
  switch (event.type) {
    case 'production': return 'primary'
    case 'maintenance': return 'danger'
    case 'setup': return 'warning'
    case 'break': return 'info'
    default: return 'success'
  }
}

// 格式化时间范围
const formatTimeRange = (event: ResourceEvent): string => {
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  
  const startStr = start.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  const endStr = end.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  
  // 如果是同一天，只显示时间
  if (start.toDateString() === end.toDateString()) {
    return `${startStr} - ${endStr}`
  }
  
  // 不同天，显示日期和时间
  const startDateStr = start.toLocaleDateString('zh-CN')
  const endDateStr = end.toLocaleDateString('zh-CN')
  return `${startDateStr} ${startStr} - ${endDateStr} ${endStr}`
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

// 获取事件类型标签
const getEventTypeLabel = (type: string): string => {
  const eventType = eventTypes.find(et => et.value === type)
  return eventType ? eventType.label : type
}

// 获取事件状态标签
const getEventStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'scheduled': '已计划',
    'in_progress': '进行中',
    'completed': '已完成',
    'canceled': '已取消'
  }
  return statusMap[status] || status
}

// 获取时间槽样式
const getSlotStyle = () => {
  if (viewType.value === 'day') {
    return { height: '40px', width: '80px' }
  } else if (viewType.value === 'week') {
    return { height: '60px', width: '120px' }
  } else {
    return { height: '80px', width: '100px' }
  }
}

// 资源点击处理
const handleResourceClick = (resource: Resource) => {
  selectedResourceId.value = selectedResourceId.value === resource.id ? '' : resource.id
  selectedResource.value = resource
  showResourceDetail.value = true
  emit('resource-click', resource)
}

// 时间槽点击处理
const handleSlotClick = (resource: Resource, timeSlot: TimeSlot) => {
  emit('slot-click', resource, timeSlot)
}

// 时间槽鼠标悬停处理
const handleSlotMouseEnter = (resource: Resource, timeSlot: TimeSlot) => {
  hoveredSlot.value = { resource, timeSlot }
}

// 时间槽鼠标离开处理
const handleSlotMouseLeave = () => {
  hoveredSlot.value = null
}

// 上一个周期
const handlePrev = () => {
  const newDate = new Date(selectedDate.value)
  
  if (viewType.value === 'day') {
    newDate.setDate(newDate.getDate() - 1)
  } else if (viewType.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setMonth(newDate.getMonth() - 1)
  }
  
  selectedDate.value = newDate
  emit('date-change', newDate)
}

// 下一个周期
const handleNext = () => {
  const newDate = new Date(selectedDate.value)
  
  if (viewType.value === 'day') {
    newDate.setDate(newDate.getDate() + 1)
  } else if (viewType.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setMonth(newDate.getMonth() + 1)
  }
  
  selectedDate.value = newDate
  emit('date-change', newDate)
}

// 回到今天
const handleToday = () => {
  selectedDate.value = new Date()
  emit('date-change', new Date())
}

// 日期选择变化
const handleDateChange = () => {
  emit('date-change', selectedDate.value)
}

// 工具函数：获取一周的开始日期（周一）
const getWeekStart = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay() || 7
  const diff = d.getDate() - day + 1
  return new Date(d.setDate(diff))
}

// 工具函数：获取一周的结束日期（周日）
const getWeekEnd = (date: Date): Date => {
  const d = new Date(date)
  const day = d.getDay() || 7
  const diff = d.getDate() + (7 - day)
  return new Date(d.setDate(diff))
}

// 工具函数：获取月份的天数
const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

// 监听视图类型变化
const watchViewType = () => {
  nextTick(() => {
    // 视图类型变化时重新计算布局
  })
}

// 组件挂载后初始化
onMounted(() => {
  watchViewType()
})
</script>

<style scoped>
.resource-calendar {
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

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 15px 0;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.current-date {
  font-weight: 600;
  color: #303133;
  min-width: 150px;
}

.calendar-container {
  display: flex;
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

.resource-header-cell {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
  background-color: #ecf5ff;
  color: #606266;
  position: sticky;
  top: 0;
  z-index: 10;
}

.resource-cell {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.resource-cell:hover {
  background-color: #f0f2f5;
}

.resource-cell.selected {
  background-color: #e6f7ff;
  border-right: 3px solid #1890ff;
}

.resource-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resource-availability {
  width: 100%;
}

/* 日历网格样式 */
.calendar-grid {
  flex: 1;
  overflow: auto;
  position: relative;
}

.time-header {
  display: flex;
  background-color: #f5f7fa;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #e4e7ed;
}

.time-header-cell {
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5px;
  min-width: 60px;
}

.time-label {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.time-sub-label {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.resource-calendar-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.calendar-cell {
  border-right: 1px solid #f0f0f0;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 60px;
}

.calendar-cell:hover {
  background-color: #fafafa;
}

.calendar-cell.available {
  background-color: #f0f9ff;
}

.calendar-cell.partially-available {
  background-color: #fdf6ec;
}

.calendar-cell.unavailable {
  background-color: #fef0f0;
  opacity: 0.6;
}

.event-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  height: 4px;
  margin-bottom: 2px;
  border-radius: 2px;
}

/* 资源详情样式 */
.resource-detail {
  padding: 10px;
}

.resource-events {
  margin-top: 20px;
}

.resource-events h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
}

.event-content {
  padding: 5px 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.event-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.event-info {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #606266;
}

.no-events {
  text-align: center;
  color: #909399;
  padding: 20px;
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

.legend-color.available {
  background-color: #f0f9ff;
  border: 1px solid #91d5ff;
}

.legend-color.partially-available {
  background-color: #fdf6ec;
  border: 1px solid #faad14;
}

.legend-color.unavailable {
  background-color: #fef0f0;
  border: 1px solid #f5222d;
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
    flex-wrap: wrap;
  }
  
  .calendar-nav {
    flex-wrap: wrap;
  }
  
  .resource-column {
    width: 150px;
  }
  
  .calendar-container {
    flex-direction: column;
  }
  
  .legend-items {
    flex-direction: column;
    gap: 10px;
  }
}
</style>