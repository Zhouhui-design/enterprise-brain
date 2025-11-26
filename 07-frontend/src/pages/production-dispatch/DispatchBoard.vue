<template>
  <div class="dispatch-board-container">
    <div class="page-header">
      <h1>生产调度看板</h1>
      <div class="header-actions">
        <el-select v-model="timeRange" @change="changeTimeRange" style="margin-right: 15px;">
          <el-option label="今日" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="success" @click="exportBoardData">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
        <el-dropdown @command="handleViewMode">
          <el-button>
            <el-icon><Setting /></el-icon>
            视图设置
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="kanban">看板视图</el-dropdown-item>
              <el-dropdown-item command="gantt">甘特图视图</el-dropdown-item>
              <el-dropdown-item command="calendar">日历视图</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 数据概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="overview-card total-tasks">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ stats.totalTasks }}</div>
                <div class="card-label">总任务数</div>
              </div>
              <div class="card-trend" :class="getTrendClass(stats.taskTrend)">
                {{ stats.taskTrend > 0 ? '+' : '' }}{{ stats.taskTrend }}%
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="overview-card pending-tasks">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ stats.pendingTasks }}</div>
                <div class="card-label">待处理任务</div>
              </div>
              <div class="card-trend" :class="getTrendClass(stats.pendingTrend)">
                {{ stats.pendingTrend > 0 ? '+' : '' }}{{ stats.pendingTrend }}%
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="overview-card in-progress">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><RefreshLeft /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ stats.inProgressTasks }}</div>
                <div class="card-label">进行中任务</div>
              </div>
              <div class="card-trend" :class="getTrendClass(stats.progressTrend)">
                {{ stats.progressTrend > 0 ? '+' : '' }}{{ stats.progressTrend }}%
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="6">
          <el-card class="overview-card completed-tasks">
            <div class="card-content">
              <div class="card-icon">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ stats.completedTasks }}</div>
                <div class="card-label">已完成任务</div>
              </div>
              <div class="card-trend" :class="getTrendClass(stats.completedTrend)">
                {{ stats.completedTrend > 0 ? '+' : '' }}{{ stats.completedTrend }}%
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>任务状态分布</span>
                <el-select v-model="chartTimeRange" size="small" @change="refreshCharts" style="width: 120px;">
                  <el-option label="本周" value="week" />
                  <el-option label="本月" value="month" />
                  <el-option label="近三月" value="quarter" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <canvas ref="statusChart" width="400" height="300"></canvas>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>车间产能利用率</span>
                <el-select v-model="chartTimeRange" size="small" @change="refreshCharts" style="width: 120px;">
                  <el-option label="本周" value="week" />
                  <el-option label="本月" value="month" />
                  <el-option label="近三月" value="quarter" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <canvas ref="workshopChart" width="400" height="300"></canvas>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 任务看板 -->
    <div class="board-section">
      <el-card class="board-card">
        <template #header>
          <div class="card-header">
            <span>实时任务监控</span>
            <div class="header-controls">
              <el-input 
                v-model="searchKeyword" 
                placeholder="搜索任务编号/产品名称" 
                prefix-icon="Search" 
                clearable 
                style="width: 240px; margin-right: 10px;"
                @input="handleSearch"
              />
              <el-select v-model="filterWorkshop" placeholder="选择车间" clearable style="width: 150px; margin-right: 10px;">
                <el-option label="全部车间" value="" />
                <el-option label="装配车间" value="assembly" />
                <el-option label="机加工车间" value="machining" />
                <el-option label="焊接车间" value="welding" />
                <el-option label="涂装车间" value="painting" />
              </el-select>
              <el-select v-model="filterPriority" placeholder="优先级" clearable style="width: 100px;">
                <el-option label="全部" value="" />
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </div>
          </div>
        </template>
        
        <div class="board-tabs">
          <el-tabs v-model="activeView" type="card">
            <el-tab-pane label="任务状态看板" name="status-board">
              <div class="kanban-container">
                <div 
                  v-for="status in taskStatuses" 
                  :key="status.value"
                  class="kanban-column"
                  :class="`status-${status.value}`"
                >
                  <div class="column-header">
                    <h3>{{ status.label }}</h3>
                    <div class="column-stats">
                      <span class="task-count">{{ getTasksByStatus(status.value).length }}</span>
                      <el-button size="small" @click="addTaskByStatus(status.value)">
                        <el-icon><Plus /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  
                  <div 
                    v-for="task in getTasksByStatus(status.value)" 
                    :key="task.id"
                    class="kanban-card"
                    draggable="true"
                    @dragstart="handleDragStart($event, task)"
                    @dragover.prevent
                    @drop="handleDrop($event, status.value)"
                    @click="viewTaskDetail(task)"
                  >
                    <div class="card-header">
                      <span class="task-id">{{ task.taskId }}</span>
                      <el-tag :type="getPriorityTagType(task.priority)">
                        {{ getPriorityLabel(task.priority) }}
                      </el-tag>
                    </div>
                    
                    <div class="card-content">
                      <h4>{{ task.productName }}</h4>
                      <p class="task-desc">{{ task.description }}</p>
                      
                      <div class="task-progress">
                        <el-progress 
                          :percentage="task.progress" 
                          :stroke-width="4"
                          :color="getProgressColor(task.progress)"
                          class="mini-progress"
                        />
                      </div>
                      
                      <div class="task-info">
                        <span class="workshop">{{ getWorkshopLabel(task.workshop) }}</span>
                        <span class="deadline" :class="{ 'urgent': isUrgent(task.deadline) }">
                          {{ formatDeadline(task.deadline) }}
                        </span>
                      </div>
                      
                      <div v-if="task.assignedTo" class="assigned-worker">
                        <el-avatar :size="20" :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo.id}`" />
                        <span>{{ task.assignedTo.name }}</span>
                      </div>
                       
                      <div class="task-tags">
                        <el-tag v-if="task.delayRisk" type="danger" size="small">延迟风险</el-tag>
                        <el-tag v-if="task.qualityIssues" type="warning" size="small">质量问题</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="生产工单跟踪" name="work-order">
              <div class="work-order-container">
                <el-table :data="workOrders" stripe style="width: 100%">
                  <el-table-column prop="orderId" label="工单编号" width="150" />
                  <el-table-column prop="productName" label="产品名称" />
                  <el-table-column prop="workshop" label="生产车间" width="120">
                    <template #default="scope">
                      {{ getWorkshopLabel(scope.row.workshop) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="plannedQuantity" label="计划数量" width="100" />
                  <el-table-column prop="completedQuantity" label="已完成" width="100" />
                  <el-table-column prop="progress" label="完成率" width="120">
                    <template #default="scope">
                      <div class="table-progress">
                        <el-progress 
                          :percentage="scope.row.progress" 
                          :stroke-width="8"
                          :color="getProgressColor(scope.row.progress)"
                        />
                        <span class="progress-text">{{ scope.row.progress }}%</span>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column prop="startDate" label="开始日期" width="150" format="YYYY-MM-DD HH:mm" />
                  <el-table-column prop="deadline" label="截止日期" width="150" format="YYYY-MM-DD HH:mm" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="scope">
                      <el-tag :type="getStatusTagType(scope.row.status)">
                        {{ getStatusLabel(scope.row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="action" label="操作" width="120" fixed="right">
                    <template #default="scope">
                      <el-button type="primary" size="small" @click="viewWorkOrderDetail(scope.row)">详情</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="资源分配" name="resource-allocation">
              <div class="resource-container">
                <el-tabs type="border-card" v-model="resourceTab">
                  <el-tab-pane label="工人负荷" name="worker">
                    <div class="resource-chart-container">
                      <canvas ref="workerLoadChart" width="800" height="400"></canvas>
                    </div>
                  </el-tab-pane>
                  
                  <el-tab-pane label="设备利用率" name="equipment">
                    <div class="resource-chart-container">
                      <canvas ref="equipmentChart" width="800" height="400"></canvas>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-card>
    </div>

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="taskDetailVisible"
      title="任务详情"
      width="700px"
      @close="closeTaskDetail"
    >
      <div v-if="selectedTask" class="task-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务编号">{{ selectedTask.taskId }}</el-descriptions-item>
          <el-descriptions-item label="所属工单">{{ selectedTask.workOrderId }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ selectedTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="任务描述">{{ selectedTask.description }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">{{ getStatusLabel(selectedTask.status) }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityTagType(selectedTask.priority)">
              {{ getPriorityLabel(selectedTask.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属车间">{{ getWorkshopLabel(selectedTask.workshop) }}</el-descriptions-item>
          <el-descriptions-item label="工序名称">{{ selectedTask.processName }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ formatDate(selectedTask.startDate) }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ formatDate(selectedTask.deadline) }}</el-descriptions-item>
          <el-descriptions-item label="计划工时">{{ selectedTask.plannedHours }}小时</el-descriptions-item>
          <el-descriptions-item label="实际工时">{{ selectedTask.actualHours }}小时</el-descriptions-item>
          <el-descriptions-item label="完成进度">
            <div class="progress-with-text">
              <el-progress 
                :percentage="selectedTask.progress" 
                :stroke-width="8"
                :color="getProgressColor(selectedTask.progress)"
              />
              <span class="progress-value">{{ selectedTask.progress }}%</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="分配给">
            <div v-if="selectedTask.assignedTo" class="assigned-to">
              <el-avatar :size="32" :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedTask.assignedTo.id}`" />
              <span>{{ selectedTask.assignedTo.name }}</span>
            </div>
            <span v-else class="no-assignee">未分配</span>
          </el-descriptions-item>
          <el-descriptions-item label="使用设备">{{ selectedTask.equipment || '无' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ selectedTask.notes || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeTaskDetail">关闭</el-button>
          <el-button 
            v-if="selectedTask && ['pending', 'assigned'].includes(selectedTask.status)" 
            type="primary" 
            @click="editTask"
          >
            编辑任务
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 自定义时间范围对话框 -->
    <el-dialog
      v-model="customTimeRangeVisible"
      title="选择时间范围"
      width="500px"
    >
      <el-form :model="customDateRange">
        <el-form-item label="开始日期" required>
          <el-date-picker
            v-model="customDateRange.startDate"
            type="datetime"
            placeholder="选择开始日期"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="结束日期" required>
          <el-date-picker
            v-model="customDateRange.endDate"
            type="datetime"
            placeholder="选择结束日期"
            style="width: 100%;"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="customTimeRangeVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCustomTimeRange">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Refresh, Download, Search, Setting, ArrowDown, Document, Timer, 
  RefreshLeft, CircleCheck, Plus
} from '@element-plus/icons-vue'

export default {
  name: 'DispatchBoard',
  components: {
    Refresh,
    Download,
    Search,
    Setting,
    ArrowDown,
    Document,
    Timer,
    RefreshLeft,
    CircleCheck,
    Plus
  },
  setup() {
    // 时间范围选择
    const timeRange = ref('today')
    const chartTimeRange = ref('week')
    const customTimeRangeVisible = ref(false)
    const customDateRange = reactive({
      startDate: null,
      endDate: null
    })

    // 视图设置
    const activeView = ref('status-board')
    const resourceTab = ref('worker')

    // 搜索和筛选
    const searchKeyword = ref('')
    const filterWorkshop = ref('')
    const filterPriority = ref('')

    // 任务状态配置
    const taskStatuses = [
      { label: '待处理', value: 'pending', color: '#909399' },
      { label: '处理中', value: 'processing', color: '#1890ff' },
      { label: '进行中', value: 'in_progress', color: '#faad14' },
      { label: '待验收', value: 'to_check', color: '#722ed1' },
      { label: '已完成', value: 'completed', color: '#52c41a' },
      { label: '已取消', value: 'cancelled', color: '#ff4d4f' }
    ]

    // 统计数据
    const stats = reactive({
      totalTasks: 128,
      pendingTasks: 24,
      inProgressTasks: 65,
      completedTasks: 39,
      taskTrend: 8.2,
      pendingTrend: -3.5,
      progressTrend: 5.7,
      completedTrend: 12.3
    })

    // 模拟任务数据
    const tasks = ref([
      {
        id: 1,
        taskId: 'TASK-2023-0011',
        workOrderId: 'WO-2023-1001',
        productName: '高精度轴承组',
        description: '完成轴承组件的精磨和装配',
        status: 'pending',
        priority: 'high',
        workshop: 'assembly',
        processName: '装配工序',
        startDate: '2023-10-15 08:00:00',
        deadline: '2023-10-18 18:00:00',
        plannedHours: 16,
        actualHours: 0,
        progress: 0,
        assignedTo: null,
        equipment: '装配线A',
        notes: '注意配合精度要求',
        delayRisk: false,
        qualityIssues: false
      },
      {
        id: 2,
        taskId: 'TASK-2023-0012',
        workOrderId: 'WO-2023-1002',
        productName: '铝合金外壳',
        description: 'CNC加工铝合金外壳关键部位',
        status: 'processing',
        priority: 'medium',
        workshop: 'machining',
        processName: '机加工序',
        startDate: '2023-10-14 09:00:00',
        deadline: '2023-10-17 17:00:00',
        plannedHours: 24,
        actualHours: 12,
        progress: 50,
        assignedTo: {
          id: 2,
          name: '李四',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
        },
        equipment: 'CNC机床#3',
        notes: '使用新刀具',
        delayRisk: false,
        qualityIssues: false
      },
      {
        id: 3,
        taskId: 'TASK-2023-0013',
        workOrderId: 'WO-2023-1003',
        productName: '结构框架',
        description: '主框架焊接和打磨',
        status: 'in_progress',
        priority: 'high',
        workshop: 'welding',
        processName: '焊接工序',
        startDate: '2023-10-13 08:30:00',
        deadline: '2023-10-16 16:00:00',
        plannedHours: 20,
        actualHours: 15,
        progress: 75,
        assignedTo: {
          id: 3,
          name: '王五',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
        },
        equipment: '焊接机器人#1',
        notes: '加强焊缝检查',
        delayRisk: true,
        qualityIssues: false
      },
      {
        id: 4,
        taskId: 'TASK-2023-0014',
        workOrderId: 'WO-2023-1004',
        productName: '控制面板',
        description: '控制面板表面处理和测试',
        status: 'to_check',
        priority: 'medium',
        workshop: 'painting',
        processName: '表面处理',
        startDate: '2023-10-12 10:00:00',
        deadline: '2023-10-15 15:00:00',
        plannedHours: 18,
        actualHours: 16,
        progress: 90,
        assignedTo: {
          id: 4,
          name: '赵六',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
        },
        equipment: '涂装线B',
        notes: '颜色代码：RAL 9005',
        delayRisk: false,
        qualityIssues: true
      },
      {
        id: 5,
        taskId: 'TASK-2023-0015',
        workOrderId: 'WO-2023-1005',
        productName: '液压系统',
        description: '液压管路装配和压力测试',
        status: 'completed',
        priority: 'high',
        workshop: 'assembly',
        processName: '装配测试',
        startDate: '2023-10-10 08:00:00',
        deadline: '2023-10-14 18:00:00',
        plannedHours: 32,
        actualHours: 30,
        progress: 100,
        assignedTo: {
          id: 5,
          name: '钱七',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
        },
        equipment: '测试台#2',
        notes: '测试压力：25MPa',
        delayRisk: false,
        qualityIssues: false
      },
      {
        id: 6,
        taskId: 'TASK-2023-0016',
        workOrderId: 'WO-2023-1006',
        productName: '齿轮箱组件',
        description: '齿轮精磨和装配',
        status: 'pending',
        priority: 'medium',
        workshop: 'machining',
        processName: '精磨工序',
        startDate: '2023-10-16 09:00:00',
        deadline: '2023-10-19 17:00:00',
        plannedHours: 28,
        actualHours: 0,
        progress: 0,
        assignedTo: null,
        equipment: '磨床#2',
        notes: '精度要求：IT5级',
        delayRisk: false,
        qualityIssues: false
      },
      {
        id: 7,
        taskId: 'TASK-2023-0017',
        workOrderId: 'WO-2023-1007',
        productName: '防护栏',
        description: '防护栏焊接和表面处理',
        status: 'processing',
        priority: 'low',
        workshop: 'welding',
        processName: '焊接工序',
        startDate: '2023-10-15 08:30:00',
        deadline: '2023-10-20 16:00:00',
        plannedHours: 16,
        actualHours: 8,
        progress: 50,
        assignedTo: {
          id: 7,
          name: '周九',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7'
        },
        equipment: '手动焊接站#3',
        notes: '按安全规范施工',
        delayRisk: false,
        qualityIssues: false
      },
      {
        id: 8,
        taskId: 'TASK-2023-0018',
        workOrderId: 'WO-2023-1008',
        productName: '外罩组件',
        description: '外罩静电喷涂和装配',
        status: 'in_progress',
        priority: 'medium',
        workshop: 'painting',
        processName: '涂装工序',
        startDate: '2023-10-14 10:00:00',
        deadline: '2023-10-18 15:00:00',
        plannedHours: 22,
        actualHours: 14,
        progress: 65,
        assignedTo: {
          id: 8,
          name: '吴十',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8'
        },
        equipment: '静电喷涂线',
        notes: '颜色：RAL 5010',
        delayRisk: true,
        qualityIssues: false
      },
      {
        id: 9,
        taskId: 'TASK-2023-0019',
        workOrderId: 'WO-2023-1009',
        productName: '电控柜',
        description: '电控柜接线和功能测试',
        status: 'to_check',
        priority: 'high',
        workshop: 'assembly',
        processName: '电气装配',
        startDate: '2023-10-13 08:00:00',
        deadline: '2023-10-17 18:00:00',
        plannedHours: 24,
        actualHours: 22,
        progress: 92,
        assignedTo: {
          id: 1,
          name: '张三',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
        },
        equipment: '测试台#1',
        notes: '严格按照电路图施工',
        delayRisk: false,
        qualityIssues: false
      },
      {
        id: 10,
        taskId: 'TASK-2023-0020',
        workOrderId: 'WO-2023-1010',
        productName: '转轴组件',
        description: '转轴热处理和精加工',
        status: 'cancelled',
        priority: 'medium',
        workshop: 'machining',
        processName: '热处理',
        startDate: '2023-10-12 09:00:00',
        deadline: '2023-10-16 17:00:00',
        plannedHours: 16,
        actualHours: 4,
        progress: 25,
        assignedTo: {
          id: 6,
          name: '孙八',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6'
        },
        equipment: '热处理炉#2',
        notes: '材质：42CrMo',
        delayRisk: true,
        qualityIssues: true
      }
    ])

    // 模拟工单数据
    const workOrders = ref([
      {
        id: 1,
        orderId: 'WO-2023-1001',
        productName: '高精度轴承组',
        workshop: 'assembly',
        plannedQuantity: 100,
        completedQuantity: 65,
        progress: 65,
        startDate: '2023-10-10 08:00:00',
        deadline: '2023-10-20 18:00:00',
        status: 'in_progress'
      },
      {
        id: 2,
        orderId: 'WO-2023-1002',
        productName: '铝合金外壳',
        workshop: 'machining',
        plannedQuantity: 80,
        completedQuantity: 40,
        progress: 50,
        startDate: '2023-10-12 09:00:00',
        deadline: '2023-10-22 17:00:00',
        status: 'processing'
      },
      {
        id: 3,
        orderId: 'WO-2023-1003',
        productName: '结构框架',
        workshop: 'welding',
        plannedQuantity: 50,
        completedQuantity: 35,
        progress: 70,
        startDate: '2023-10-11 08:30:00',
        deadline: '2023-10-19 16:00:00',
        status: 'in_progress'
      },
      {
        id: 4,
        orderId: 'WO-2023-1004',
        productName: '控制面板',
        workshop: 'painting',
        plannedQuantity: 120,
        completedQuantity: 108,
        progress: 90,
        startDate: '2023-10-10 10:00:00',
        deadline: '2023-10-18 15:00:00',
        status: 'to_check'
      },
      {
        id: 5,
        orderId: 'WO-2023-1005',
        productName: '液压系统',
        workshop: 'assembly',
        plannedQuantity: 30,
        completedQuantity: 30,
        progress: 100,
        startDate: '2023-10-08 08:00:00',
        deadline: '2023-10-15 18:00:00',
        status: 'completed'
      }
    ])

    // 任务详情相关
    const taskDetailVisible = ref(false)
    const selectedTask = ref(null)

    // 图表引用
    const statusChart = ref(null)
    const workshopChart = ref(null)
    const workerLoadChart = ref(null)
    const equipmentChart = ref(null)
    let statusChartInstance = null
    let workshopChartInstance = null
    let workerLoadChartInstance = null
    let equipmentChartInstance = null

    // 拖拽相关
    const draggedTask = ref(null)

    // 计算属性 - 筛选后的任务
    const filteredTasks = computed(() => {
      return tasks.value.filter(task => {
        // 搜索关键词
        if (searchKeyword.value && 
            !task.taskId.toLowerCase().includes(searchKeyword.value.toLowerCase()) && 
            !task.productName.toLowerCase().includes(searchKeyword.value.toLowerCase())) {
          return false
        }
        // 车间筛选
        if (filterWorkshop.value && task.workshop !== filterWorkshop.value) {
          return false
        }
        // 优先级筛选
        if (filterPriority.value && task.priority !== filterPriority.value) {
          return false
        }
        return true
      })
    })

    // 根据状态获取任务
    const getTasksByStatus = (status) => {
      return filteredTasks.value.filter(task => task.status === status)
    }

    // 获取状态标签
    const getStatusLabel = (status) => {
      const statusMap = taskStatuses.reduce((map, item) => {
        map[item.value] = item.label
        return map
      }, {})
      return statusMap[status] || status
    }

    // 获取状态标签类型
    const getStatusTagType = (status) => {
      const typeMap = {
        pending: 'info',
        processing: 'primary',
        in_progress: 'warning',
        to_check: 'success',
        completed: 'success',
        cancelled: 'danger'
      }
      return typeMap[status] || 'info'
    }

    // 获取优先级标签
    const getPriorityLabel = (priority) => {
      const priorityMap = {
        high: '高',
        medium: '中',
        low: '低'
      }
      return priorityMap[priority] || priority
    }

    // 获取优先级标签类型
    const getPriorityTagType = (priority) => {
      const typeMap = {
        high: 'danger',
        medium: 'warning',
        low: 'info'
      }
      return typeMap[priority] || 'info'
    }

    // 获取车间标签
    const getWorkshopLabel = (workshop) => {
      const workshopMap = {
        assembly: '装配车间',
        machining: '机加工车间',
        welding: '焊接车间',
        painting: '涂装车间'
      }
      return workshopMap[workshop] || workshop
    }

    // 获取进度条颜色
    const getProgressColor = (progress) => {
      if (progress < 30) return '#ff4d4f'
      if (progress < 70) return '#faad14'
      return '#52c41a'
    }

    // 获取趋势样式类
    const getTrendClass = (trend) => {
      if (trend > 0) return 'trend-up'
      if (trend < 0) return 'trend-down'
      return ''
    }

    // 格式化日期
    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // 格式化截止日期显示
    const formatDeadline = (deadline) => {
      if (!deadline) return ''
      const now = new Date()
      const deadDate = new Date(deadline)
      const diffDays = Math.ceil((deadDate - now) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return '已逾期'
      if (diffDays === 0) return '今天到期'
      if (diffDays === 1) return '明天到期'
      if (diffDays <= 3) return `${diffDays}天后到期`
      
      return `截止: ${deadDate.toLocaleDateString('zh-CN')}`
    }

    // 判断是否紧急
    const isUrgent = (deadline) => {
      if (!deadline) return false
      const now = new Date()
      const deadDate = new Date(deadline)
      const diffDays = Math.ceil((deadDate - now) / (1000 * 60 * 60 * 24))
      return diffDays <= 1 && diffDays >= 0
    }

    // 拖拽开始
    const handleDragStart = (event, task) => {
      draggedTask.value = task
    }

    // 拖拽放下
    const handleDrop = (event, newStatus) => {
      event.preventDefault()
      if (draggedTask.value && draggedTask.value.status !== newStatus) {
        // 更新任务状态
        const taskIndex = tasks.value.findIndex(t => t.id === draggedTask.value.id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex].status = newStatus
          
          // 更新进度
          if (newStatus === 'completed') {
            tasks.value[taskIndex].progress = 100
          } else if (newStatus === 'in_progress' && tasks.value[taskIndex].progress === 0) {
            tasks.value[taskIndex].progress = 10
          } else if (newStatus === 'to_check' && tasks.value[taskIndex].progress < 80) {
            tasks.value[taskIndex].progress = 80
          }
          
          ElMessage.success(`任务 ${draggedTask.value.taskId} 状态已更新为 ${getStatusLabel(newStatus)}`)
          // 更新统计数据
          updateStats()
        }
      }
      draggedTask.value = null
    }

    // 查看任务详情
    const viewTaskDetail = (task) => {
      selectedTask.value = { ...task }
      taskDetailVisible.value = true
    }

    // 关闭任务详情
    const closeTaskDetail = () => {
      taskDetailVisible.value = false
      selectedTask.value = null
    }

    // 编辑任务
    const editTask = () => {
      // 可以跳转到编辑页面或打开编辑对话框
      ElMessage.info('编辑任务功能待实现')
    }

    // 查看工单详情
    const viewWorkOrderDetail = (workOrder) => {
      ElMessage.info(`查看工单 ${workOrder.orderId} 的详情`)
    }

    // 添加任务
    const addTaskByStatus = (status) => {
      ElMessage.info(`添加 ${getStatusLabel(status)} 任务`)
    }

    // 搜索处理
    const handleSearch = () => {
      // 搜索逻辑已通过计算属性实现
    }

    // 改变时间范围
    const changeTimeRange = () => {
      if (timeRange.value === 'custom') {
        customTimeRangeVisible.value = true
      } else {
        // 更新数据
        updateStats()
        refreshCharts()
      }
    }

    // 确认自定义时间范围
    const confirmCustomTimeRange = () => {
      if (!customDateRange.startDate || !customDateRange.endDate) {
        ElMessage.warning('请选择完整的时间范围')
        return
      }
      
      if (customDateRange.startDate > customDateRange.endDate) {
        ElMessage.warning('开始日期不能晚于结束日期')
        return
      }
      
      customTimeRangeVisible.value = false
      // 更新数据
      updateStats()
      refreshCharts()
      ElMessage.success('时间范围已设置')
    }

    // 处理视图模式
    const handleViewMode = (mode) => {
      ElMessage.info(`切换到${mode === 'kanban' ? '看板' : mode === 'gantt' ? '甘特图' : '日历'}视图`)
      // 实际项目中可以切换不同的视图组件
    }

    // 刷新数据
    const refreshData = () => {
      // 模拟数据刷新
      updateStats()
      refreshCharts()
      ElMessage.success('数据已刷新')
    }

    // 导出报表
    const exportBoardData = () => {
      ElMessage.success('报表导出成功')
    }

    // 更新统计数据
    const updateStats = () => {
      // 模拟根据时间范围更新统计数据
      const baseStats = {
        totalTasks: 128,
        pendingTasks: 24,
        inProgressTasks: 65,
        completedTasks: 39
      }
      
      // 根据不同时间范围调整数据
      switch (timeRange.value) {
        case 'today':
          Object.assign(stats, baseStats)
          break
        case 'week':
          Object.assign(stats, {
            totalTasks: baseStats.totalTasks * 1.5,
            pendingTasks: baseStats.pendingTasks * 1.2,
            inProgressTasks: baseStats.inProgressTasks * 1.5,
            completedTasks: baseStats.completedTasks * 1.6
          })
          break
        case 'month':
          Object.assign(stats, {
            totalTasks: baseStats.totalTasks * 3,
            pendingTasks: baseStats.pendingTasks * 2.5,
            inProgressTasks: baseStats.inProgressTasks * 3,
            completedTasks: baseStats.completedTasks * 3.2
          })
          break
        case 'custom':
          // 使用自定义日期范围的数据
          Object.assign(stats, baseStats)
          break
      }
    }

    // 刷新图表
    const refreshCharts = () => {
      nextTick(() => {
        initStatusChart()
        initWorkshopChart()
        if (activeView.value === 'resource-allocation') {
          if (resourceTab.value === 'worker') {
            initWorkerLoadChart()
          } else {
            initEquipmentChart()
          }
        }
      })
    }

    // 初始化状态分布图表
    const initStatusChart = () => {
      if (!statusChart.value) return
      
      // 销毁之前的图表实例
      if (statusChartInstance) {
        statusChartInstance.destroy()
      }
      
      const ctx = statusChart.value.getContext('2d')
      statusChartInstance = new (window.Chart)(ctx, {
        type: 'doughnut',
        data: {
          labels: taskStatuses.map(s => s.label),
          datasets: [{
            data: taskStatuses.map(s => getTasksByStatus(s.value).length),
            backgroundColor: taskStatuses.map(s => s.color),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || ''
                  const value = context.parsed || 0
                  const total = context.dataset.data.reduce((a, b) => a + b, 0)
                  const percentage = ((value / total) * 100).toFixed(1)
                  return `${label}: ${value} (${percentage}%)`
                }
              }
            }
          }
        }
      })
    }

    // 初始化车间产能图表
    const initWorkshopChart = () => {
      if (!workshopChart.value) return
      
      // 销毁之前的图表实例
      if (workshopChartInstance) {
        workshopChartInstance.destroy()
      }
      
      const ctx = workshopChart.value.getContext('2d')
      const workshops = ['装配车间', '机加工车间', '焊接车间', '涂装车间']
      const utilization = [78, 92, 65, 85]
      
      workshopChartInstance = new (window.Chart)(ctx, {
        type: 'bar',
        data: {
          labels: workshops,
          datasets: [{
            label: '产能利用率 (%)',
            data: utilization,
            backgroundColor: [
              'rgba(24, 144, 255, 0.6)',
              'rgba(250, 173, 20, 0.6)',
              'rgba(114, 46, 209, 0.6)',
              'rgba(82, 196, 26, 0.6)'
            ],
            borderColor: [
              'rgba(24, 144, 255, 1)',
              'rgba(250, 173, 20, 1)',
              'rgba(114, 46, 209, 1)',
              'rgba(82, 196, 26, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%'
                }
              }
            }
          }
        }
      })
    }

    // 初始化工人负荷图表
    const initWorkerLoadChart = () => {
      if (!workerLoadChart.value) return
      
      // 销毁之前的图表实例
      if (workerLoadChartInstance) {
        workerLoadChartInstance.destroy()
      }
      
      const ctx = workerLoadChart.value.getContext('2d')
      const workers = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
      const workload = [85, 92, 78, 65, 88, 72]
      
      workerLoadChartInstance = new (window.Chart)(ctx, {
        type: 'bar',
        data: {
          labels: workers,
          datasets: [{
            label: '工作负荷 (%)',
            data: workload,
            backgroundColor: workload.map(w => 
              w > 90 ? 'rgba(255, 77, 79, 0.6)' :
              w > 70 ? 'rgba(250, 173, 20, 0.6)' : 'rgba(82, 196, 26, 0.6)'
            ),
            borderColor: workload.map(w => 
              w > 90 ? 'rgba(255, 77, 79, 1)' :
              w > 70 ? 'rgba(250, 173, 20, 1)' : 'rgba(82, 196, 26, 1)'
            ),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%'
                }
              }
            }
          }
        }
      })
    }

    // 初始化设备利用率图表
    const initEquipmentChart = () => {
      if (!equipmentChart.value) return
      
      // 销毁之前的图表实例
      if (equipmentChartInstance) {
        equipmentChartInstance.destroy()
      }
      
      const ctx = equipmentChart.value.getContext('2d')
      const equipment = ['CNC机床', '焊接机器人', '装配线', '涂装线', '测试台']
      const utilization = [88, 75, 92, 80, 65]
      
      equipmentChartInstance = new (window.Chart)(ctx, {
        type: 'line',
        data: {
          labels: equipment,
          datasets: [{
            label: '设备利用率 (%)',
            data: utilization,
            borderColor: 'rgba(24, 144, 255, 1)',
            backgroundColor: 'rgba(24, 144, 255, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%'
                }
              }
            }
          }
        }
      })
    }

    // 监听资源标签页变化
    watch(resourceTab, (newTab) => {
      if (activeView.value === 'resource-allocation') {
        nextTick(() => {
          if (newTab === 'worker') {
            initWorkerLoadChart()
          } else {
            initEquipmentChart()
          }
        })
      }
    })

    // 监听活动视图变化
    watch(activeView, (newView) => {
      if (newView === 'resource-allocation') {
        nextTick(() => {
          if (resourceTab.value === 'worker') {
            initWorkerLoadChart()
          } else {
            initEquipmentChart()
          }
        })
      }
    })

    // 组件挂载时初始化
    onMounted(() => {
      // 确保Chart.js已经加载
      if (window.Chart) {
        nextTick(() => {
          initStatusChart()
          initWorkshopChart()
        })
      } else {
        ElMessage.warning('Chart.js未加载，图表功能将不可用')
      }
    })

    return {
      timeRange,
      chartTimeRange,
      customTimeRangeVisible,
      customDateRange,
      activeView,
      resourceTab,
      searchKeyword,
      filterWorkshop,
      filterPriority,
      taskStatuses,
      stats,
      tasks,
      workOrders,
      filteredTasks,
      taskDetailVisible,
      selectedTask,
      statusChart,
      workshopChart,
      workerLoadChart,
      equipmentChart,
      getTasksByStatus,
      getStatusLabel,
      getStatusTagType,
      getPriorityLabel,
      getPriorityTagType,
      getWorkshopLabel,
      getProgressColor,
      getTrendClass,
      formatDate,
      formatDeadline,
      isUrgent,
      handleDragStart,
      handleDrop,
      viewTaskDetail,
      closeTaskDetail,
      editTask,
      viewWorkOrderDetail,
      addTaskByStatus,
      handleSearch,
      changeTimeRange,
      confirmCustomTimeRange,
      handleViewMode,
      refreshData,
      exportBoardData,
      refreshCharts
    }
  }
}
</script>

<style scoped>
.dispatch-board-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
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
  align-items: center;
  gap: 10px;
}

/* 概览卡片样式 */
.overview-section {
  margin-bottom: 20px;
}

.overview-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.total-tasks .card-icon {
  background-color: #ecf5ff;
  color: #1890ff;
}

.pending-tasks .card-icon {
  background-color: #f6ffed;
  color: #52c41a;
}

.in-progress .card-icon {
  background-color: #fff7e6;
  color: #faad14;
}

.completed-tasks .card-icon {
  background-color: #f0f2f5;
  color: #909399;
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.card-label {
  font-size: 14px;
  color: #909399;
}

.card-trend {
  font-size: 14px;
  font-weight: 500;
}

.trend-up {
  color: #52c41a;
}

.trend-down {
  color: #ff4d4f;
}

/* 图表区域样式 */
.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  position: relative;
}

/* 看板样式 */
.board-section {
  margin-bottom: 20px;
}

.board-card {
  height: 100%;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kanban-container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 10px 0;
  height: 600px;
}

.kanban-column {
  flex: 0 0 300px;
  background-color: #f0f2f5;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.kanban-column.status-pending {
  border-top: 4px solid #909399;
}

.kanban-column.status-processing {
  border-top: 4px solid #1890ff;
}

.kanban-column.status-in_progress {
  border-top: 4px solid #faad14;
}

.kanban-column.status-to_check {
  border-top: 4px solid #722ed1;
}

.kanban-column.status-completed {
  border-top: 4px solid #52c41a;
}

.kanban-column.status-cancelled {
  border-top: 4px solid #ff4d4f;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.column-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.column-stats {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-count {
  background-color: #dcdfe6;
  color: #606266;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.kanban-card {
  background-color: #ffffff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.kanban-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.mini-progress {
  margin: 8px 0;
}

.task-tags {
  margin-top: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 表格进度样式 */
.table-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
}

/* 资源分配图表容器 */
.resource-chart-container {
  height: 400px;
  position: relative;
}

/* 任务详情样式 */
.task-detail {
  max-height: 500px;
  overflow-y: auto;
}

.progress-with-text {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-value {
  font-weight: 500;
  color: #606266;
  min-width: 40px;
}

.assigned-to {
  display: flex;
  align-items: center;
  gap: 10px;
}

.no-assignee {
  color: #909399;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-section .el-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
  
  .overview-section .el-col {
    flex: 0 0 100%;
    max-width: 100%;
  }
  
  .kanban-container {
    flex-direction: column;
    height: auto;
  }
  
  .kanban-column {
    flex: 1;
    min-height: 300px;
  }
  
  .header-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-controls .el-input,
  .header-controls .el-select {
    width: 100%;
  }
}
</style>