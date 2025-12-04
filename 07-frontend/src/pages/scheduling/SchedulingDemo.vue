<template>
  <div class="scheduling-demo">
    <div class="page-header">
      <h1>有限产能排程演示</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleSchedule" :loading="scheduling">
          <el-icon><Operation /></el-icon> 执行排程
        </el-button>
        <el-button @click="handleOptimize" :disabled="!scheduleResult">
          <el-icon><Promotion /></el-icon> 负载均衡
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon> 重置
        </el-button>
      </div>
    </div>

    <!-- 排程参数配置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>排程参数配置</span>
        </div>
      </template>
      
      <el-form :model="scheduleConfig" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排程算法">
              <el-select v-model="scheduleConfig.algorithm" placeholder="请选择算法">
                <el-option label="优先级排程" value="priority" />
                <el-option label="最短处理时间" value="spt" />
                <el-option label="最早交期优先" value="edd" />
                <el-option label="先进先出" value="fifo" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作时间">
              <el-time-picker
                v-model="scheduleConfig.workingHours"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="HH:mm"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 输入数据 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>生产任务（{{ tasks.length }}个）</span>
              <el-button type="primary" size="small" @click="handleAddTask">
                <el-icon><Plus /></el-icon> 添加任务
              </el-button>
            </div>
          </template>
          
          <el-table :data="tasks" style="width: 100%" max-height="400">
            <el-table-column prop="productName" label="产品名称" width="150" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="priority" label="优先级" width="80" />
            <el-table-column prop="dueDate" label="交期" width="120" />
            <el-table-column label="工序数" width="80">
              <template #default="scope">
                {{ scope.row.processSequence.length }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>设备资源（{{ resources.length }}台）</span>
            </div>
          </template>
          
          <el-table :data="resources" style="width: 100%" max-height="400">
            <el-table-column prop="name" label="设备名称" width="150" />
            <el-table-column prop="type" label="设备类型" width="120" />
            <el-table-column prop="capacity" label="产能系数" width="90" />
            <el-table-column prop="currentLoad" label="当前负载" width="100">
              <template #default="scope">
                <el-progress :percentage="scope.row.currentLoad" :format="format" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 排程结果 -->
    <el-card v-if="scheduleResult" class="result-card">
      <template #header>
        <div class="card-header">
          <span>排程结果</span>
          <el-tag :type="scheduleResult.success ? 'success' : 'danger'">
            {{ scheduleResult.success ? '排程成功' : '排程失败' }}
          </el-tag>
        </div>
      </template>

      <!-- 排程指标 -->
      <div class="metrics-row">
        <div class="metric-item">
          <div class="metric-label">排程任务数</div>
          <div class="metric-value">{{ scheduleResult.metrics.scheduledTasks }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">完工时间(小时)</div>
          <div class="metric-value">{{ scheduleResult.metrics.makespanHours }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">平均利用率</div>
          <div class="metric-value">{{ scheduleResult.metrics.avgResourceUtilization }}%</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">完成率</div>
          <div class="metric-value">{{ scheduleResult.metrics.completionRate }}%</div>
        </div>
      </div>

      <!-- 甘特图 -->
      <div class="gantt-section">
        <h3>甘特图</h3>
        <div class="gantt-chart">
          <div 
            v-for="machine in scheduleResult.ganttData" 
            :key="machine.machineId"
            class="gantt-row"
          >
            <div class="gantt-label">{{ machine.machineName }}</div>
            <div class="gantt-timeline">
              <div 
                v-for="(task, index) in machine.tasks" 
                :key="index"
                class="gantt-task"
                :style="getTaskStyle(task, machine.tasks)"
                :title="`${task.processName}\n开始: ${task.startTimeFormatted}\n结束: ${task.endTimeFormatted}`"
              >
                <span class="task-label">{{ task.processName }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 警告信息 -->
      <div v-if="scheduleResult.warnings && scheduleResult.warnings.length > 0" class="warnings-section">
        <h3>预警信息</h3>
        <el-alert
          v-for="(warning, index) in scheduleResult.warnings"
          :key="index"
          :title="warning.message"
          :type="warning.severity"
          :description="warning.detail"
          :closable="false"
          style="margin-bottom: 10px"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Operation, Promotion, Refresh, Plus, ArrowLeft, Edit, Play, Pause } from '@element-plus/icons-vue'
import { FiniteCapacityScheduler, SchedulingOptimizer } from '@/utils/schedulingEngine.js'

// 排程配置
const scheduleConfig = reactive({
  algorithm: 'priority',
  workingHours: [new Date(2024, 0, 1, 8, 0), new Date(2024, 0, 1, 20, 0)]
})

// 示例任务数据
const tasks = ref([
  {
    id: 1,
    orderId: 'SO001',
    productCode: 'P001',
    productName: '产品A',
    quantity: 100,
    priority: 8,
    dueDate: '2024-12-31',
    processSequence: [
      { id: 1, processName: '下料', sequence: 1, standardTime: 2, requiredMachine: ['CNC-01', 'CNC-02'] },
      { id: 2, processName: '铣削', sequence: 2, standardTime: 5, requiredMachine: ['CNC-01'] },
      { id: 3, processName: '检验', sequence: 3, standardTime: 1, requiredMachine: ['QC-01'] }
    ]
  },
  {
    id: 2,
    orderId: 'SO002',
    productCode: 'P002',
    productName: '产品B',
    quantity: 80,
    priority: 6,
    dueDate: '2024-12-25',
    processSequence: [
      { id: 4, processName: '冲压', sequence: 1, standardTime: 3, requiredMachine: ['PRESS-01'] },
      { id: 5, processName: '焊接', sequence: 2, standardTime: 4, requiredMachine: ['WELD-01'] },
      { id: 6, processName: '喷涂', sequence: 3, standardTime: 2, requiredMachine: ['PAINT-01'] }
    ]
  },
  {
    id: 3,
    orderId: 'SO003',
    productCode: 'P003',
    productName: '产品C',
    quantity: 50,
    priority: 9,
    dueDate: '2024-12-20',
    processSequence: [
      { id: 7, processName: '车削', sequence: 1, standardTime: 4, requiredMachine: ['LATHE-01'] },
      { id: 8, processName: '磨削', sequence: 2, standardTime: 3, requiredMachine: ['GRIND-01'] }
    ]
  }
])

// 示例设备资源
const resources = ref([
  { id: 'CNC-01', code: 'CNC-01', name: 'CNC加工中心1', type: 'CNC', capacity: 1.0, currentLoad: 0 },
  { id: 'CNC-02', code: 'CNC-02', name: 'CNC加工中心2', type: 'CNC', capacity: 0.9, currentLoad: 0 },
  { id: 'PRESS-01', code: 'PRESS-01', name: '冲床1', type: 'PRESS', capacity: 1.0, currentLoad: 0 },
  { id: 'WELD-01', code: 'WELD-01', name: '焊机1', type: 'WELD', capacity: 1.0, currentLoad: 0 },
  { id: 'PAINT-01', code: 'PAINT-01', name: '喷涂线1', type: 'PAINT', capacity: 1.0, currentLoad: 0 },
  { id: 'LATHE-01', code: 'LATHE-01', name: '车床1', type: 'LATHE', capacity: 1.0, currentLoad: 0 },
  { id: 'GRIND-01', code: 'GRIND-01', name: '磨床1', type: 'GRIND', capacity: 1.0, currentLoad: 0 },
  { id: 'QC-01', code: 'QC-01', name: '质检台1', type: 'QC', capacity: 1.0, currentLoad: 0 }
])

const scheduling = ref(false)
const scheduleResult = ref(null)
let scheduler = null
let optimizer = null

// 进度条格式化
const format = (percentage) => `${percentage}%`

// 执行排程
const handleSchedule = async () => {
  scheduling.value = true
  
  try {
    // 创建排程引擎实例
    scheduler = new FiniteCapacityScheduler({
      workingHours: { start: 8, end: 20 }
    })
    
    // 添加任务
    tasks.value.forEach(task => {
      scheduler.addTask(task)
      
      // 添加工序
      task.processSequence.forEach(process => {
        scheduler.addProcess({
          ...process,
          taskId: task.id
        })
      })
    })
    
    // 添加资源
    resources.value.forEach(resource => {
      scheduler.addResource(resource)
    })
    
    // 执行排程
    const result = await scheduler.schedule(scheduleConfig.algorithm)
    
    scheduleResult.value = result
    
    // 更新资源负载显示
    resources.value = scheduler.resources.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type,
      capacity: r.capacity,
      currentLoad: parseFloat(r.currentLoad)
    }))
    
    ElMessage.success('排程执行成功')
    
  } catch (error) {
    console.error('排程失败:', error)
    ElMessage.error('排程失败: ' + error.message)
  } finally {
    scheduling.value = false
  }
}

// 负载均衡优化
const handleOptimize = async () => {
  if (!scheduler) {
    ElMessage.warning('请先执行排程')
    return
  }
  
  try {
    optimizer = new SchedulingOptimizer(scheduler)
    const result = await optimizer.balanceLoad()
    
    if (result.success) {
      ElMessage.success(result.message)
      // 重新执行排程以更新结果
      await handleSchedule()
    } else {
      ElMessage.info(result.message)
    }
  } catch (error) {
    console.error('优化失败:', error)
    ElMessage.error('优化失败')
  }
}

// 重置
const handleReset = () => {
  scheduleResult.value = null
  scheduler = null
  optimizer = null
  resources.value.forEach(r => r.currentLoad = 0)
  ElMessage.info('已重置')
}

// 添加任务
const handleAddTask = () => {
  ElMessage.info('添加任务功能开发中')
}

// 计算甘特图任务样式
const getTaskStyle = (task, allTasks) => {
  // 计算任务的开始位置和宽度
  const minStart = Math.min(...allTasks.map(t => t.startTime))
  const maxEnd = Math.max(...allTasks.map(t => t.endTime))
  const totalDuration = maxEnd - minStart
  
  const left = ((task.startTime - minStart) / totalDuration) * 100
  const width = (task.duration / totalDuration) * 100
  
  return {
    left: `${left}%`,
    width: `${width}%`,
    backgroundColor: getRandomColor(task.taskId)
  }
}

// 获取随机颜色
const getRandomColor = (seed) => {
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
    '#909399', '#00d2ff', '#ff6b6b', '#4ecdc4'
  ]
  return colors[seed % colors.length]
}
</script>

<style scoped>
.scheduling-demo {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.config-card, .data-card, .result-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metrics-row {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

.metric-item {
  flex: 1;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
}

.gantt-section {
  margin-top: 30px;
}

.gantt-section h3 {
  margin-bottom: 20px;
  color: #303133;
}

.gantt-chart {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  overflow: hidden;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #EBEEF5;
  min-height: 50px;
}

.gantt-row:last-child {
  border-bottom: none;
}

.gantt-label {
  width: 150px;
  padding: 15px;
  background: #f5f7fa;
  border-right: 1px solid #EBEEF5;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.gantt-timeline {
  flex: 1;
  position: relative;
  padding: 10px 0;
}

.gantt-task {
  position: absolute;
  height: 30px;
  top: 10px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.gantt-task:hover {
  opacity: 0.8;
}

.task-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.warnings-section {
  margin-top: 30px;
}

.warnings-section h3 {
  margin-bottom: 15px;
  color: #303133;
}
</style>
