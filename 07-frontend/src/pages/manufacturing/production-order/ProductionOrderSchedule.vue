<template>
  <div class="production-order-schedule">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>生产订单排程</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产订单</el-breadcrumb-item>
          <el-breadcrumb-item>订单排程</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAutoSchedule" :icon="Magic">
          自动排程
        </el-button>
        <el-button @click="handleBack" :icon="ArrowLeft">
          返回
        </el-button>
      </div>
    </div>

    <!-- 排程工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-form :inline="true" size="small">
            <el-form-item label="工作中心">
              <el-select
                v-model="scheduleFilter.workCenterId"
                placeholder="请选择工作中心"
                clearable
                style="width: 150px"
                @change="filterSchedule"
              >
                <el-option
                  v-for="center in workCenterOptions"
                  :key="center.id"
                  :label="center.name"
                  :value="center.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="scheduleFilter.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 220px"
                @change="filterSchedule"
              />
            </el-form-item>
            <el-form-item label="排程模式">
              <el-radio-group v-model="scheduleMode" @change="changeScheduleMode">
                <el-radio-button label="gantt">甘特图</el-radio-button>
                <el-radio-button label="timeline">时间轴</el-radio-button>
                <el-radio-button label="calendar">日历</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
        <div class="toolbar-right">
          <el-button-group>
            <el-button @click="handleZoomIn" :icon="ZoomIn">放大</el-button>
            <el-button @click="handleZoomOut" :icon="ZoomOut">缩小</el-button>
            <el-button @click="handleFitToScreen" :icon="FullScreen">适应屏幕</el-button>
          </el-button-group>
        </div>
      </div>
    </el-card>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="content-left">
        <!-- 订单列表 -->
        <el-card class="orders-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>待排程订单</span>
              <el-tag type="info">{{ unScheduledOrders.length }} 个</el-tag>
            </div>
          </template>
          
          <el-table
            :data="unScheduledOrders"
            size="small"
            height="400"
            @row-click="handleOrderSelect"
            highlight-current-row
          >
            <el-table-column type="index" width="50" />
            <el-table-column prop="orderNumber" label="订单号" width="120" />
            <el-table-column prop="productName" label="产品名称" min-width="150" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag :type="getPriorityTagType(row.priority)" size="small">
                  {{ getPriorityLabel(row.priority) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="planEndDate" label="计划完成" width="110">
              <template #default="{ row }">
                {{ formatDate(row.planEndDate) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 资源利用率 -->
        <el-card class="utilization-card" shadow="never">
          <template #header>
            <span>资源利用率</span>
          </template>
          <div class="utilization-content">
            <div
              v-for="center in workCenterUtilization"
              :key="center.id"
              class="utilization-item"
            >
              <div class="utilization-info">
                <span class="center-name">{{ center.name }}</span>
                <span class="utilization-rate">{{ center.utilization }}%</span>
              </div>
              <el-progress
                :percentage="center.utilization"
                :color="getUtilizationColor(center.utilization)"
                :show-text="false"
                :stroke-width="8"
              />
            </div>
          </div>
        </el-card>
      </div>

      <div class="content-right">
        <!-- 排程图表 -->
        <el-card class="schedule-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>排程甘特图</span>
              <div class="header-actions">
                <el-button size="small" @click="handleRefresh" :icon="Refresh">刷新</el-button>
                <el-button size="small" @click="handleSaveSchedule" type="primary" :icon="Check">保存排程</el-button>
              </div>
            </div>
          </template>

          <!-- 甘特图容器 -->
          <div ref="ganttChartRef" class="gantt-chart"></div>
        </el-card>
      </div>
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="orderDetailVisible"
      title="订单详情"
      width="800px"
    >
      <div v-if="selectedOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ selectedOrder.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ selectedOrder.productName }}</el-descriptions-item>
          <el-descriptions-item label="生产数量">{{ selectedOrder.quantity }}</el-descriptions-item>
          <el-descriptions-item label="单位">{{ selectedOrder.unit }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityTagType(selectedOrder.priority)">
              {{ getPriorityLabel(selectedOrder.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工作中心">{{ selectedOrder.workCenter }}</el-descriptions-item>
          <el-descriptions-item label="计划开始">{{ formatDate(selectedOrder.planStartDate) }}</el-descriptions-item>
          <el-descriptions-item label="计划完成">{{ formatDate(selectedOrder.planEndDate) }}</el-descriptions-item>
          <el-descriptions-item label="标准工时">{{ selectedOrder.standardHours }}h</el-descriptions-item>
          <el-descriptions-item label="备注">{{ selectedOrder.remarks || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="orderDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAddToSchedule">添加到排程</el-button>
      </template>
    </el-dialog>

    <!-- 自动排程对话框 -->
    <el-dialog
      v-model="autoScheduleVisible"
      title="自动排程设置"
      width="600px"
    >
      <el-form :model="autoScheduleForm" label-width="120px">
        <el-form-item label="排程策略">
          <el-radio-group v-model="autoScheduleForm.strategy">
            <el-radio label="priority">优先级优先</el-radio>
            <el-radio label="delivery">交期优先</el-radio>
            <el-radio label="efficiency">效率优先</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="autoScheduleForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="工作日历">
          <el-select v-model="autoScheduleForm.workCalendar" style="width: 100%">
            <el-option label="标准工作日历" value="standard" />
            <el-option label="24小时工作日历" value="full" />
            <el-option label="自定义日历" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="考虑因素">
          <el-checkbox-group v-model="autoScheduleForm.factors">
            <el-checkbox label="capacity">产能约束</el-checkbox>
            <el-checkbox label="material">物料约束</el-checkbox>
            <el-checkbox label="tool">模具约束</el-checkbox>
            <el-checkbox label="skill">技能约束</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="autoScheduleVisible = false">取消</el-button>
        <el-button type="primary" @click="executeAutoSchedule" :loading="autoScheduling">
          开始排程
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, Magic, ZoomIn, ZoomOut, FullScreen, Refresh, Check
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 响应式数据
const scheduleMode = ref('gantt')
const ganttChartRef = ref()
const orderDetailVisible = ref(false)
const autoScheduleVisible = ref(false)
const autoScheduling = ref(false)
const selectedOrder = ref(null)

// 筛选条件
const scheduleFilter = reactive({
  workCenterId: '',
  dateRange: []
})

// 自动排程表单
const autoScheduleForm = reactive({
  strategy: 'priority',
  startTime: '',
  workCalendar: 'standard',
  factors: ['capacity', 'material']
})

// 数据
const unScheduledOrders = ref([])
const scheduledOrders = ref([])
const workCenterOptions = ref([])
const workCenterUtilization = ref([])
const ganttInstance = ref(null)

// 方法
const handleBack = () => {
  router.push('/manufacturing/production-order/list')
}

const handleAutoSchedule = () => {
  autoScheduleVisible.value = true
}

const executeAutoSchedule = async () => {
  autoScheduling.value = true
  try {
    // 这里调用自动排程API
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    ElMessage.success('自动排程完成')
    autoScheduleVisible.value = false
    loadScheduleData()
  } catch (error) {
    ElMessage.error('自动排程失败')
  } finally {
    autoScheduling.value = false
  }
}

const handleOrderSelect = (row) => {
  selectedOrder.value = row
  orderDetailVisible.value = true
}

const handleAddToSchedule = () => {
  if (!selectedOrder.value) return
  
  // 添加到排程
  scheduledOrders.value.push({
    ...selectedOrder.value,
    id: Date.now(),
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
  })
  
  // 从待排程列表中移除
  const index = unScheduledOrders.value.findIndex(order => order.id === selectedOrder.value.id)
  if (index > -1) {
    unScheduledOrders.value.splice(index, 1)
  }
  
  orderDetailVisible.value = false
  updateGanttChart()
  ElMessage.success('已添加到排程')
}

const changeScheduleMode = (mode) => {
  scheduleMode.value = mode
  updateGanttChart()
}

const filterSchedule = () => {
  updateGanttChart()
}

const handleZoomIn = () => {
  if (ganttInstance.value) {
    ganttInstance.value.zoom.in()
  }
}

const handleZoomOut = () => {
  if (ganttInstance.value) {
    ganttInstance.value.zoom.out()
  }
}

const handleFitToScreen = () => {
  if (ganttInstance.value) {
    ganttInstance.value.fitToScreen()
  }
}

const handleRefresh = () => {
  loadScheduleData()
}

const handleSaveSchedule = async () => {
  try {
    // 这里调用保存排程API
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('排程保存成功')
  } catch (error) {
    ElMessage.error('保存排程失败')
  }
}

// 工具方法
const getPriorityTagType = (priority) => {
  const map = {
    urgent: 'danger',
    high: 'warning',
    medium: 'primary',
    low: 'info'
  }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

const getUtilizationColor = (utilization) => {
  if (utilization >= 90) return '#f56c6c'
  if (utilization >= 70) return '#e6a23c'
  if (utilization >= 50) return '#409eff'
  return '#67c23a'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载数据
const loadUnScheduledOrders = async () => {
  try {
    // 这里调用API获取待排程订单
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    unScheduledOrders.value = [
      {
        id: 1,
        orderNumber: 'PO000001',
        productName: '产品A',
        quantity: 100,
        unit: '件',
        priority: 'high',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        workCenter: '装配车间',
        standardHours: 8,
        remarks: '紧急订单'
      },
      {
        id: 2,
        orderNumber: 'PO000002',
        productName: '产品B',
        quantity: 200,
        unit: '件',
        priority: 'medium',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        workCenter: '机加工车间',
        standardHours: 12,
        remarks: ''
      }
    ]
  } catch (error) {
    ElMessage.error('获取待排程订单失败')
  }
}

const loadWorkCenters = async () => {
  try {
    // 这里调用API获取工作中心
    await new Promise(resolve => setTimeout(resolve, 500))
    
    workCenterOptions.value = [
      { id: 1, name: '装配车间', capacity: 80 },
      { id: 2, name: '机加工车间', capacity: 120 },
      { id: 3, name: '焊接车间', capacity: 60 }
    ]
    
    // 计算利用率
    workCenterUtilization.value = workCenterOptions.value.map(center => ({
      ...center,
      utilization: Math.floor(Math.random() * 60) + 30
    }))
  } catch (error) {
    ElMessage.error('获取工作中心失败')
  }
}

const loadScheduleData = () => {
  loadUnScheduledOrders()
  loadWorkCenters()
}

// 初始化甘特图
const initGanttChart = () => {
  if (!ganttChartRef.value) return
  
  // 这里应该使用甘特图库，比如dhtmlx-gantt或类似的库
  // 为了示例，我们创建一个简单的甘特图容器
  ganttChartRef.value.innerHTML = `
    <div class="gantt-container">
      <div class="gantt-header">
        <div class="gantt-header-left">任务</div>
        <div class="gantt-header-right">
          <div class="gantt-time-grid">
            ${generateTimeGrid()}
          </div>
        </div>
      </div>
      <div class="gantt-content">
        ${generateGanttContent()}
      </div>
    </div>
  `
}

const generateTimeGrid = () => {
  const days = 7
  let grid = ''
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    grid += `<div class="time-cell">${date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</div>`
  }
  return grid
}

const generateGanttContent = () => {
  const orders = scheduledOrders.value.length > 0 ? scheduledOrders.value : unScheduledOrders.value.slice(0, 3)
  return orders.map((order, index) => `
    <div class="gantt-row">
      <div class="gantt-row-left">
        <div class="task-name">${order.orderNumber}</div>
      </div>
      <div class="gantt-row-right">
        <div class="gantt-bar" style="left: ${index * 50}px; width: 120px; background: ${getTaskColor(index)}">
          ${order.productName}
        </div>
      </div>
    </div>
  `).join('')
}

const getTaskColor = (index) => {
  const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399']
  return colors[index % colors.length]
}

const updateGanttChart = () => {
  if (scheduleMode.value === 'gantt') {
    nextTick(() => {
      initGanttChart()
    })
  }
}

onMounted(() => {
  loadScheduleData()
  nextTick(() => {
    initGanttChart()
  })
})
</script>

<style scoped lang="scss">
.production-order-schedule {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }
    }
    
    .header-right {
      display: flex;
      gap: 12px;
    }
  }
  
  .toolbar-card {
    margin-bottom: 20px;
    
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .main-content {
    flex: 1;
    display: flex;
    gap: 20px;
    min-height: 0;
    
    .content-left {
      width: 400px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      
      .orders-card {
        flex: 1;
        min-height: 0;
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
      }
      
      .utilization-card {
        .utilization-content {
          .utilization-item {
            margin-bottom: 16px;
            
            .utilization-info {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              
              .center-name {
                font-size: 14px;
                color: #303133;
              }
              
              .utilization-rate {
                font-size: 14px;
                font-weight: bold;
                color: #409eff;
              }
            }
          }
        }
      }
    }
    
    .content-right {
      flex: 1;
      
      .schedule-card {
        height: 100%;
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .header-actions {
            display: flex;
            gap: 8px;
          }
        }
        
        .gantt-chart {
          height: 600px;
          overflow: auto;
          
          .gantt-container {
            min-width: 800px;
            font-size: 12px;
            
            .gantt-header {
              display: flex;
              position: sticky;
              top: 0;
              background: #f5f7fa;
              z-index: 10;
              
              .gantt-header-left {
                width: 150px;
                border-right: 1px solid #e4e7ed;
                padding: 8px;
                font-weight: bold;
              }
              
              .gantt-header-right {
                flex: 1;
                
                .gantt-time-grid {
                  display: flex;
                  
                  .time-cell {
                    flex: 1;
                    padding: 8px;
                    text-align: center;
                    border-right: 1px solid #e4e7ed;
                    min-width: 100px;
                  }
                }
              }
            }
            
            .gantt-content {
              .gantt-row {
                display: flex;
                border-bottom: 1px solid #e4e7ed;
                min-height: 40px;
                
                .gantt-row-left {
                  width: 150px;
                  border-right: 1px solid #e4e7ed;
                  padding: 8px;
                  display: flex;
                  align-items: center;
                }
                
                .gantt-row-right {
                  flex: 1;
                  position: relative;
                  
                  .gantt-bar {
                    position: absolute;
                    top: 8px;
                    height: 24px;
                    border-radius: 4px;
                    color: white;
                    padding: 0 8px;
                    display: flex;
                    align-items: center;
                    font-size: 12px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  .order-detail {
    :deep(.el-descriptions__label) {
      font-weight: bold;
    }
  }
}
</style>