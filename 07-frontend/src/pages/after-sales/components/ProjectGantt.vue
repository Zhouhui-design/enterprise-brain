<template>
  <div class="project-gantt">
    <div class="gantt-header">
      <div class="gantt-title">
        <h3>项目甘特图</h3>
        <el-tag v-if="projectName" type="primary">{{ projectName }}</el-tag>
      </div>
      <div class="gantt-controls">
        <el-button-group>
          <el-button size="small" @click="handleZoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button size="small" @click="handleZoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button size="small" @click="handleResetZoom">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </el-button-group>
        <el-select v-model="viewMode" size="small" style="width: 100px; margin-left: 10px;">
          <el-option label="日" value="day" />
          <el-option label="周" value="week" />
          <el-option label="月" value="month" />
        </el-select>
        <el-button type="primary" size="small" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 甘特图主体 -->
    <div class="gantt-container" ref="ganttContainer">
      <div class="gantt-sidebar">
        <div class="gantt-header-cell">任务名称</div>
        <div
          v-for="task in tasks"
          :key="task.id"
          class="gantt-task-row"
          :class="{ 'parent-task': task.children && task.children.length > 0 }"
          @click="handleTaskClick(task)"
        >
          <div class="task-info">
            <el-icon v-if="task.children && task.children.length > 0" class="expand-icon" @click.stop="toggleExpand(task)">
              <component :is="task.expanded ? ArrowDown : ArrowRight" />
            </el-icon>
            <div class="task-name" :style="{ paddingLeft: task.level * 20 + 'px' }">
              <el-icon :color="getTaskColor(task.status)" class="task-icon">
                <component :is="getTaskIcon(task.status)" />
              </el-icon>
              <span>{{ task.name }}</span>
            </div>
            <div class="task-assignee" v-if="task.assignee">
              <el-avatar size="small">{{ task.assignee.charAt(0) }}</el-avatar>
              <span>{{ task.assignee }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="gantt-main" ref="ganttMain">
        <div class="gantt-timeline">
          <div class="timeline-header">
            <div
              v-for="period in timelinePeriods"
              :key="period.value"
              class="timeline-cell"
              :style="{ width: period.width + 'px' }"
            >
              {{ period.label }}
            </div>
          </div>
          <div class="timeline-grid">
            <div
              v-for="(row, rowIndex) in tasks"
              :key="row.id"
              class="timeline-row"
              :class="{ 'parent-task-row': row.children && row.children.length > 0 }"
            >
              <!-- 任务条 -->
              <div
                v-for="task in getVisibleTasks(row)"
                :key="task.id"
                class="gantt-task-bar"
                :class="{
                  'task-completed': task.progress === 100,
                  'task-delayed': isTaskDelayed(task),
                  'task-critical': task.priority === 'high'
                }"
                :style="{
                  left: getTaskPosition(task).left + 'px',
                  width: getTaskPosition(task).width + 'px',
                  top: '4px',
                  height: '24px'
                }"
                @click.stop="handleTaskBarClick(task)"
                @mouseenter="handleTaskHover(task, $event)"
                @mouseleave="handleTaskLeave"
              >
                <div class="task-progress" :style="{ width: task.progress + '%' }"></div>
                <div class="task-bar-content">
                  <span class="task-bar-name">{{ task.name }}</span>
                  <span class="task-bar-progress">{{ task.progress }}%</span>
                </div>
              </div>

              <!-- 连接线 -->
              <svg class="task-connections" v-if="showConnections">
                <path
                  v-for="connection in getTaskConnections(row.id)"
                  :key="`${connection.from}-${connection.to}`"
                  :d="connection.path"
                  stroke="#409EFF"
                  stroke-width="2"
                  fill="none"
                  marker-end="url(#arrowhead)"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 任务详情弹窗 -->
    <div
      v-if="hoveredTask && showTooltip"
      class="task-tooltip"
      :style="tooltipStyle"
    >
      <div class="tooltip-header">
        <strong>{{ hoveredTask.name }}</strong>
        <el-tag :type="getStatusType(hoveredTask.status)" size="small">
          {{ getStatusText(hoveredTask.status) }}
        </el-tag>
      </div>
      <div class="tooltip-content">
        <p><strong>负责人:</strong> {{ hoveredTask.assignee || '未分配' }}</p>
        <p><strong>开始时间:</strong> {{ formatDate(hoveredTask.startDate) }}</p>
        <p><strong>结束时间:</strong> {{ formatDate(hoveredTask.endDate) }}</p>
        <p><strong>进度:</strong> {{ hoveredTask.progress }}%</p>
        <p v-if="hoveredTask.description"><strong>描述:</strong> {{ hoveredTask.description }}</p>
      </div>
    </div>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="taskDialogVisible"
      title="任务详情"
      width="600px"
    >
      <el-descriptions v-if="selectedTask" :column="2" border>
        <el-descriptions-item label="任务名称">{{ selectedTask.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(selectedTask.status)">
            {{ getStatusText(selectedTask.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(selectedTask.priority)">
            {{ selectedTask.priority }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ selectedTask.assignee || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatDate(selectedTask.startDate) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatDate(selectedTask.endDate) }}</el-descriptions-item>
        <el-descriptions-item label="工作量">{{ selectedTask.workload || 0 }} 人天</el-descriptions-item>
        <el-descriptions-item label="进度">{{ selectedTask.progress }}%</el-descriptions-item>
        <el-descriptions-item label="描述" span="2">
          {{ selectedTask.description || '暂无描述' }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="taskDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleEditTask">编辑任务</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- SVG箭头定义 -->
    <svg width="0" height="0">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 10 3, 0 6" fill="#409EFF" />
        </marker>
      </defs>
    </svg>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ZoomIn,
  ZoomOut,
  Refresh,
  Download,
  ArrowDown,
  ArrowRight,
  Timer,
  Check,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'

const props = defineProps({
  projectId: {
    type: [String, Number],
    required: true
  },
  projectName: {
    type: String,
    default: ''
  }
})

// 响应式数据
const ganttContainer = ref(null)
const ganttMain = ref(null)
const viewMode = ref('day')
const zoomLevel = ref(1)
const showConnections = ref(true)
const showTooltip = ref(false)
const hoveredTask = ref(null)
const selectedTask = ref(null)
const taskDialogVisible = ref(false)
const tooltipStyle = reactive({ left: '0px', top: '0px' })

// 模拟任务数据
const tasks = ref([
  {
    id: 1,
    name: '项目规划',
    level: 0,
    expanded: true,
    status: 'completed',
    priority: 'high',
    startDate: '2024-01-01',
    endDate: '2024-01-07',
    progress: 100,
    assignee: '张三',
    workload: 5,
    description: '项目整体规划和需求分析',
    children: [
      {
        id: 2,
        name: '需求调研',
        level: 1,
        status: 'completed',
        priority: 'high',
        startDate: '2024-01-01',
        endDate: '2024-01-03',
        progress: 100,
        assignee: '张三',
        workload: 3,
        parentId: 1
      },
      {
        id: 3,
        name: '方案设计',
        level: 1,
        status: 'completed',
        priority: 'high',
        startDate: '2024-01-04',
        endDate: '2024-01-07',
        progress: 100,
        assignee: '李四',
        workload: 4,
        parentId: 1
      }
    ]
  },
  {
    id: 4,
    name: '开发阶段',
    level: 0,
    expanded: true,
    status: 'in_progress',
    priority: 'high',
    startDate: '2024-01-08',
    endDate: '2024-02-28',
    progress: 65,
    assignee: '王五',
    workload: 30,
    description: '系统开发和实现',
    children: [
      {
        id: 5,
        name: '前端开发',
        level: 1,
        status: 'in_progress',
        priority: 'medium',
        startDate: '2024-01-08',
        endDate: '2024-02-15',
        progress: 70,
        assignee: '赵六',
        workload: 20,
        parentId: 4
      },
      {
        id: 6,
        name: '后端开发',
        level: 1,
        status: 'in_progress',
        priority: 'medium',
        startDate: '2024-01-10',
        endDate: '2024-02-20',
        progress: 60,
        assignee: '钱七',
        workload: 25,
        parentId: 4
      },
      {
        id: 7,
        name: '数据库设计',
        level: 1,
        status: 'completed',
        priority: 'high',
        startDate: '2024-01-08',
        endDate: '2024-01-12',
        progress: 100,
        assignee: '孙八',
        workload: 5,
        parentId: 4
      }
    ]
  },
  {
    id: 8,
    name: '测试阶段',
    level: 0,
    expanded: true,
    status: 'pending',
    priority: 'medium',
    startDate: '2024-03-01',
    endDate: '2024-03-20',
    progress: 0,
    assignee: '周九',
    workload: 15,
    description: '系统测试和bug修复',
    children: [
      {
        id: 9,
        name: '单元测试',
        level: 1,
        status: 'pending',
        priority: 'medium',
        startDate: '2024-03-01',
        endDate: '2024-03-10',
        progress: 0,
        assignee: '吴十',
        workload: 8,
        parentId: 8
      },
      {
        id: 10,
        name: '集成测试',
        level: 1,
        status: 'pending',
        priority: 'medium',
        startDate: '2024-03-11',
        endDate: '2024-03-20',
        progress: 0,
        assignee: '郑十一',
        workload: 7,
        parentId: 8
      }
    ]
  }
])

// 任务连接关系
const taskConnections = ref([
  { from: 1, to: 4 },
  { from: 3, to: 5 },
  { from: 7, to: 9 },
  { from: 5, to: 9 }
])

// 计算时间轴周期
const timelinePeriods = computed(() => {
  const periods = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-03-31')
  
  if (viewMode.value === 'day') {
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      periods.push({
        value: currentDate.toISOString().split('T')[0],
        label: `${currentDate.getMonth() + 1}/${currentDate.getDate()}`,
        width: 30 * zoomLevel.value
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
  } else if (viewMode.value === 'week') {
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate)
      const weekEnd = new Date(currentDate)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      periods.push({
        value: `week-${periods.length + 1}`,
        label: `第${Math.ceil((currentDate - startDate) / (7 * 24 * 60 * 60 * 1000)) + 1}周`,
        width: 210 * zoomLevel.value
      })
      currentDate.setDate(currentDate.getDate() + 7)
    }
  } else if (viewMode.value === 'month') {
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      periods.push({
        value: currentDate.toISOString().slice(0, 7),
        label: `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`,
        width: 900 * zoomLevel.value
      })
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  }
  
  return periods
})

// 获取可见任务
const getVisibleTasks = (parentTask) => {
  if (!parentTask.children || parentTask.children.length === 0) {
    return [parentTask]
  }
  
  const visibleTasks = [parentTask]
  if (parentTask.expanded) {
    parentTask.children.forEach(child => {
      visibleTasks.push(...getVisibleTasks(child))
    })
  }
  
  return visibleTasks
}

// 获取任务位置
const getTaskPosition = (task) => {
  const startDate = new Date('2024-01-01')
  const taskStart = new Date(task.startDate)
  const taskEnd = new Date(task.endDate)
  
  const dayWidth = 30 * zoomLevel.value
  const daysFromStart = Math.floor((taskStart - startDate) / (24 * 60 * 60 * 1000))
  const taskDuration = Math.floor((taskEnd - taskStart) / (24 * 60 * 60 * 1000)) + 1
  
  let left = daysFromStart * dayWidth
  let width = taskDuration * dayWidth
  
  if (viewMode.value === 'week') {
    left = Math.floor(daysFromStart / 7) * 210 * zoomLevel.value
    width = Math.ceil(taskDuration / 7) * 210 * zoomLevel.value
  } else if (viewMode.value === 'month') {
    left = (taskStart.getMonth() + taskStart.getFullYear() * 12) * 900 * zoomLevel.value
    width = ((taskEnd.getMonth() + taskEnd.getFullYear() * 12) - (taskStart.getMonth() + taskStart.getFullYear() * 12) + 1) * 900 * zoomLevel.value
  }
  
  return { left, width }
}

// 获取任务连接
const getTaskConnections = (taskId) => {
  const connections = []
  taskConnections.value.forEach(conn => {
    if (conn.from === taskId || conn.to === taskId) {
      // 计算连接线路径
      const fromTask = tasks.value.find(t => t.id === conn.from)
      const toTask = tasks.value.find(t => t.id === conn.to)
      
      if (fromTask && toTask) {
        const fromPos = getTaskPosition(fromTask)
        const toPos = getTaskPosition(toTask)
        
        const path = `M ${fromPos.left + fromPos.width} 16 L ${toPos.left - 10} 16`
        connections.push({ ...conn, path })
      }
    }
  })
  return connections
}

// 获取任务颜色
const getTaskColor = (status) => {
  const colorMap = {
    pending: '#909399',
    in_progress: '#409EFF',
    completed: '#67C23A',
    delayed: '#F56C6C'
  }
  return colorMap[status] || '#909399'
}

// 获取任务图标
const getTaskIcon = (status) => {
  const iconMap = {
    pending: InfoFilled,
    in_progress: Timer,
    completed: Check,
    delayed: Warning
  }
  return iconMap[status] || InfoFilled
}

// 判断任务是否延期
const isTaskDelayed = (task) => {
  const endDate = new Date(task.endDate)
  const today = new Date()
  return endDate < today && task.progress < 100
}

// 状态类型映射
const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    in_progress: 'primary',
    completed: 'success',
    delayed: 'danger'
  }
  return typeMap[status] || 'info'
}

// 状态文本映射
const getStatusText = (status) => {
  const textMap = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    delayed: '已延期'
  }
  return textMap[status] || status
}

// 优先级类型映射
const getPriorityType = (priority) => {
  const typeMap = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[priority] || 'info'
}

// 日期格式化
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 事件处理函数
const handleZoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
}

const handleZoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.5)
}

const handleResetZoom = () => {
  zoomLevel.value = 1
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const toggleExpand = (task) => {
  task.expanded = !task.expanded
}

const handleTaskClick = (task) => {
  selectedTask.value = task
  taskDialogVisible.value = true
}

const handleTaskBarClick = (task) => {
  selectedTask.value = task
  taskDialogVisible.value = true
}

const handleTaskHover = (task, event) => {
  hoveredTask.value = task
  showTooltip.value = true
  
  nextTick(() => {
    const rect = event.target.getBoundingClientRect()
    tooltipStyle.left = rect.left + 'px'
    tooltipStyle.top = (rect.bottom + 5) + 'px'
  })
}

const handleTaskLeave = () => {
  showTooltip.value = false
  hoveredTask.value = null
}

const handleEditTask = () => {
  ElMessage.info('编辑任务功能开发中...')
}

onMounted(() => {
  // 初始化甘特图
})
</script>

<style scoped>
.project-gantt {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.gantt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.gantt-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gantt-title h3 {
  margin: 0;
  color: #1d2129;
}

.gantt-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gantt-container {
  flex: 1;
  display: flex;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.gantt-sidebar {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid #dcdfe6;
  background-color: #fafafa;
}

.gantt-header-cell {
  height: 40px;
  line-height: 40px;
  padding: 0 10px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  font-weight: bold;
  color: #1d2129;
}

.gantt-task-row {
  min-height: 32px;
  border-bottom: 1px solid #ebeef5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.gantt-task-row:hover {
  background-color: #f0f9ff;
}

.gantt-task-row.parent-task {
  background-color: #fafafa;
  font-weight: bold;
}

.task-info {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  height: 32px;
}

.expand-icon {
  margin-right: 5px;
  cursor: pointer;
  color: #909399;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  font-size: 13px;
  color: #1d2129;
}

.task-icon {
  font-size: 14px;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #606266;
}

.gantt-main {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
}

.gantt-timeline {
  position: relative;
}

.timeline-header {
  display: flex;
  height: 40px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.timeline-cell {
  min-width: 30px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-right: 1px solid #ebeef5;
  font-size: 12px;
  color: #606266;
  background-color: #f5f7fa;
}

.timeline-grid {
  position: relative;
}

.timeline-row {
  height: 32px;
  border-bottom: 1px solid #ebeef5;
  position: relative;
  background-image: linear-gradient(to right, transparent 0%, transparent 29.5px, #ebeef5 29.5px, #ebeef5 30px);
  background-size: 30px 32px;
}

.timeline-row.parent-task-row {
  background-color: #fafafa;
}

.gantt-task-bar {
  position: absolute;
  border-radius: 4px;
  background-color: #409EFF;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  z-index: 5;
}

.gantt-task-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.task-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(103, 194, 58, 0.3);
  transition: width 0.3s;
}

.task-bar-content {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  font-size: 12px;
  color: white;
  z-index: 1;
}

.task-bar-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-bar-progress {
  margin-left: 5px;
}

.task-completed {
  background-color: #67C23A;
}

.task-delayed {
  background-color: #F56C6C;
}

.task-critical {
  border: 2px solid #E6A23C;
}

.task-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.task-tooltip {
  position: fixed;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 300px;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.tooltip-content {
  font-size: 12px;
  color: #606266;
}

.tooltip-content p {
  margin: 4px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 滚动条样式 */
.gantt-main::-webkit-scrollbar {
  height: 8px;
}

.gantt-main::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.gantt-main::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.gantt-main::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>