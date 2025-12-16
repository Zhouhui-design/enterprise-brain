<template>
  <div class="plan-gantt">
    <el-card shadow="never">
      <div slot="header" class="header">
        <span>计划甘特图</span>
        <div class="header-actions">
          <el-select v-model="timeScale" placeholder="时间刻度" size="small" @change="refreshGantt">
            <el-option label="日" value="day"></el-option>
            <el-option label="周" value="week"></el-option>
            <el-option label="月" value="month"></el-option>
          </el-select>
          <el-button type="text" size="small" @click="zoomIn">
            <i class="el-icon-zoom-in"></i>
          </el-button>
          <el-button type="text" size="small" @click="zoomOut">
            <i class="el-icon-zoom-out"></i>
          </el-button>
          <el-button type="text" size="small" @click="resetView">
            <i class="el-icon-refresh"></i>
          </el-button>
        </div>
      </div>
      
      <!-- 甘特图主体 -->
      <div class="gantt-container">
        <!-- 资源列 -->
        <div class="gantt-resources">
          <div class="resource-header">资源</div>
          <div class="resource-item" v-for="resource in resources" :key="resource.id">
            <div class="resource-info">
              <span class="resource-name">{{ resource.name }}</span>
              <span class="resource-type">{{ resource.type }}</span>
            </div>
          </div>
        </div>
        
        <!-- 时间刻度和任务条 -->
        <div class="gantt-body" ref="ganttBody">
          <!-- 时间刻度 -->
          <div class="time-header">
            <div class="time-scale" v-for="timeUnit in timeUnits" :key="timeUnit.key">
              {{ timeUnit.label }}
            </div>
          </div>
          
          <!-- 任务条区域 -->
          <div class="gantt-tasks">
            <div class="task-row" v-for="resource in resources" :key="resource.id">
              <div class="task-bars">
                <div 
                  v-for="task in getResourceTasks(resource.id)" 
                  :key="task.id"
                  class="task-bar"
                  :class="{ 
                    'task-bar-running': task.status === 'running',
                    'task-bar-pending': task.status === 'pending',
                    'task-bar-completed': task.status === 'completed',
                    'task-bar-delayed': task.status === 'delayed'
                  }"
                  :style="{
                    left: `${task.startPosition}%`,
                    width: `${task.width}%`,
                    background: getTaskColor(task)
                  }"
                  @click="handleTaskClick(task)"
                >
                  <div class="task-tooltip">
                    <div class="tooltip-title">{{ task.name }}</div>
                    <div class="tooltip-info">计划号: {{ task.planCode }}</div>
                    <div class="tooltip-info">开始: {{ formatDate(task.startDate) }}</div>
                    <div class="tooltip-info">结束: {{ formatDate(task.endDate) }}</div>
                    <div class="tooltip-info">状态: {{ getTaskStatusText(task.status) }}</div>
                  </div>
                  <span class="task-name">{{ truncateText(task.name, 10) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图例 -->
      <div class="gantt-legend">
        <div class="legend-item" v-for="status in taskStatuses" :key="status.value">
          <div class="legend-color" :style="{ background: getTaskColorByStatus(status.value) }"></div>
          <span>{{ status.label }}</span>
        </div>
      </div>
    </el-card>
    
    <!-- 任务详情对话框 -->
    <el-dialog
      title="任务详情"
      :visible.sync="taskDetailVisible"
      width="500px"
      @close="handleDialogClose"
    >
      <div class="task-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务名称">{{ selectedTask.name }}</el-descriptions-item>
          <el-descriptions-item label="计划编号">{{ selectedTask.planCode }}</el-descriptions-item>
          <el-descriptions-item label="所属资源">{{ selectedTask.resourceName }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ formatDate(selectedTask.startDate) }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ formatDate(selectedTask.endDate) }}</el-descriptions-item>
          <el-descriptions-item label="持续天数">{{ calculateDuration(selectedTask.startDate, selectedTask.endDate) }}天</el-descriptions-item>
          <el-descriptions-item label="完成进度">{{ selectedTask.progress || 0 }}%</el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag :type="getTaskStatusType(selectedTask.status)">{{ getTaskStatusText(selectedTask.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ selectedTask.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PlanGantt',
  props: {
    planId: {
      type: String,
      default: ''
    },
    dateRange: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      timeScale: 'day', // day, week, month
      zoomLevel: 1,
      timeUnits: [],
      resources: [
        { id: 1, name: '生产线A', type: '设备' },
        { id: 2, name: '生产线B', type: '设备' },
        { id: 3, name: '生产线C', type: '设备' },
        { id: 4, name: '工作组1', type: '人员' },
        { id: 5, name: '工作组2', type: '人员' }
      ],
      tasks: [
        { id: 1, name: '产品A组装', planCode: 'PP2023001', resourceId: 1, resourceName: '生产线A', startDate: '2023-07-15', endDate: '2023-07-20', status: 'completed', progress: 100 },
        { id: 2, name: '产品B加工', planCode: 'PP2023002', resourceId: 1, resourceName: '生产线A', startDate: '2023-07-21', endDate: '2023-07-25', status: 'running', progress: 60 },
        { id: 3, name: '产品C测试', planCode: 'PP2023003', resourceId: 2, resourceName: '生产线B', startDate: '2023-07-18', endDate: '2023-07-24', status: 'running', progress: 50 },
        { id: 4, name: '产品D包装', planCode: 'PP2023004', resourceId: 3, resourceName: '生产线C', startDate: '2023-07-20', endDate: '2023-07-22', status: 'completed', progress: 100 },
        { id: 5, name: '产品E质检', planCode: 'PP2023005', resourceId: 4, resourceName: '工作组1', startDate: '2023-07-16', endDate: '2023-07-23', status: 'delayed', progress: 30 },
        { id: 6, name: '产品F调试', planCode: 'PP2023006', resourceId: 5, resourceName: '工作组2', startDate: '2023-07-22', endDate: '2023-07-28', status: 'pending', progress: 0 }
      ],
      taskStatuses: [
        { label: '进行中', value: 'running' },
        { label: '待开始', value: 'pending' },
        { label: '已完成', value: 'completed' },
        { label: '已延迟', value: 'delayed' }
      ],
      taskDetailVisible: false,
      selectedTask: {}
    }
  },
  created() {
    this.generateTimeUnits()
  },
  mounted() {
    this.refreshGantt()
  },
  methods: {
    // 生成时间单位
    generateTimeUnits() {
      const units = []
      const startDate = this.dateRange[0] ? new Date(this.dateRange[0]) : new Date()
      const endDate = this.dateRange[1] ? new Date(this.dateRange[1]) : new Date()
      
      // 如果没有日期范围，默认显示30天
      if (this.dateRange.length === 0) {
        endDate.setDate(startDate.getDate() + 30)
      }
      
      let current = new Date(startDate)
      let index = 0
      
      while (current <= endDate) {
        let label, key
        
        if (this.timeScale === 'day') {
          label = `${current.getMonth() + 1}/${current.getDate()}`
          key = current.toISOString().split('T')[0]
          current.setDate(current.getDate() + 1)
        } else if (this.timeScale === 'week') {
          const weekStart = new Date(current)
          const weekEnd = new Date(current)
          weekEnd.setDate(weekStart.getDate() + 6)
          label = `第${Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)}周`
          key = `week-${index}`
          current.setDate(current.getDate() + 7)
        } else { // month
          label = `${current.getFullYear()}/${current.getMonth() + 1}`
          key = `month-${current.getFullYear()}-${current.getMonth() + 1}`
          current.setMonth(current.getMonth() + 1)
        }
        
        units.push({ key, label })
        index++
      }
      
      this.timeUnits = units
    },
    
    // 获取资源的任务列表
    getResourceTasks(resourceId) {
      return this.tasks
        .filter(task => task.resourceId === resourceId)
        .map(task => ({
          ...task,
          startPosition: this.calculateTaskPosition(task.startDate),
          width: this.calculateTaskWidth(task.startDate, task.endDate)
        }))
    },
    
    // 计算任务起始位置
    calculateTaskPosition(startDate) {
      if (this.timeUnits.length === 0) return 0
      
      const start = new Date(startDate)
      const firstUnit = new Date(this.dateRange[0] || new Date())
      const lastUnit = new Date(this.dateRange[1] || new Date())
      lastUnit.setDate(lastUnit.getDate() + 30)
      
      const totalDays = (lastUnit - firstUnit) / (1000 * 60 * 60 * 24)
      const daysFromStart = (start - firstUnit) / (1000 * 60 * 60 * 24)
      
      return Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100))
    },
    
    // 计算任务条宽度
    calculateTaskWidth(startDate, endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const firstUnit = new Date(this.dateRange[0] || new Date())
      const lastUnit = new Date(this.dateRange[1] || new Date())
      lastUnit.setDate(lastUnit.getDate() + 30)
      
      const totalDays = (lastUnit - firstUnit) / (1000 * 60 * 60 * 24)
      const taskDays = (end - start) / (1000 * 60 * 60 * 24) + 1 // 包含开始和结束日期
      
      return Math.min(80, (taskDays / totalDays) * 100 * this.zoomLevel)
    },
    
    // 获取任务颜色
    getTaskColor(task) {
      return this.getTaskColorByStatus(task.status)
    },
    
    getTaskColorByStatus(status) {
      const colorMap = {
        running: '#67c23a',
        pending: '#e6a23c',
        completed: '#909399',
        delayed: '#f56c6c'
      }
      return colorMap[status] || '#409eff'
    },
    
    // 获取任务状态文本
    getTaskStatusText(status) {
      const statusMap = {
        running: '进行中',
        pending: '待开始',
        completed: '已完成',
        delayed: '已延迟'
      }
      return statusMap[status] || status
    },
    
    // 获取任务状态标签类型
    getTaskStatusType(status) {
      const typeMap = {
        running: 'success',
        pending: 'warning',
        completed: 'info',
        delayed: 'danger'
      }
      return typeMap[status] || 'default'
    },
    
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },
    
    // 截断文本
    truncateText(text, maxLength) {
      if (!text || text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },
    
    // 计算持续天数
    calculateDuration(startDate, endDate) {
      if (!startDate || !endDate) return 0
      const start = new Date(startDate)
      const end = new Date(endDate)
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
    },
    
    // 处理任务点击
    handleTaskClick(task) {
      this.selectedTask = { ...task }
      this.taskDetailVisible = true
    },
    
    // 处理对话框关闭
    handleDialogClose() {
      this.selectedTask = {}
    },
    
    // 放大
    zoomIn() {
      if (this.zoomLevel < 2) {
        this.zoomLevel += 0.25
        this.refreshGantt()
      }
    },
    
    // 缩小
    zoomOut() {
      if (this.zoomLevel > 0.5) {
        this.zoomLevel -= 0.25
        this.refreshGantt()
      }
    },
    
    // 重置视图
    resetView() {
      this.zoomLevel = 1
      this.generateTimeUnits()
      this.refreshGantt()
    },
    
    // 刷新甘特图
    refreshGantt() {
      this.generateTimeUnits()
      this.$emit('gantt-refreshed')
    },
    
    // 加载任务数据
    loadTasks() {
      // 模拟API调用
      this.$emit('tasks-loading', true)
      setTimeout(() => {
        // 这里可以根据planId过滤数据
        this.$emit('tasks-loading', false)
        this.$emit('tasks-loaded', this.tasks)
        this.refreshGantt()
      }, 500)
    }
  },
  watch: {
    planId: {
      handler() {
        this.loadTasks()
      },
      immediate: false
    },
    dateRange: {
      handler() {
        this.generateTimeUnits()
        this.refreshGantt()
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.plan-gantt {
  padding: 10px 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gantt-container {
  display: flex;
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;
}

/* 资源列 */
.gantt-resources {
  width: 200px;
  border-right: 1px solid #ebeef5;
  background-color: #f5f7fa;
}

.resource-header {
  padding: 12px;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
  background-color: #eef2f7;
}

.resource-item {
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  transition: background-color 0.3s;
}

.resource-item:hover {
  background-color: #ecf5ff;
}

.resource-name {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
}

.resource-type {
  font-size: 12px;
  color: #909399;
}

/* 甘特图主体 */
.gantt-body {
  flex: 1;
  overflow-x: auto;
  position: relative;
}

.time-header {
  display: flex;
  background-color: #eef2f7;
  border-bottom: 1px solid #ebeef5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-scale {
  min-width: 80px;
  padding: 12px 4px;
  text-align: center;
  font-size: 12px;
  border-right: 1px solid #ebeef5;
}

.gantt-tasks {
  position: relative;
}

.task-row {
  position: relative;
  min-height: 60px;
  border-bottom: 1px solid #f0f0f0;
}

.task-bars {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.task-bar {
  position: absolute;
  min-height: 36px;
  padding: 4px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

.task-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.task-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}

.task-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1000;
  white-space: nowrap;
  margin-bottom: 8px;
}

.task-bar:hover .task-tooltip {
  display: block;
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.tooltip-info {
  margin-bottom: 2px;
}

/* 任务状态样式 */
.task-bar-running {}
.task-bar-pending {}
.task-bar-completed {}
.task-bar-delayed {}

/* 图例 */
.gantt-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 任务详情样式 */
.task-detail {
  padding: 10px 0;
}
</style>