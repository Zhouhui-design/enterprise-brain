<template>
  <div class="work-assignment-container">
    <div class="page-header">
      <h1>工作任务分配管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="success" @click="exportAssignmentData">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" label-width="100px" inline>
        <el-form-item label="任务状态">
          <el-select v-model="filterForm.status" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="待分配" value="pending" />
            <el-option label="已分配" value="assigned" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="车间">
          <el-select v-model="filterForm.workshop" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="装配车间" value="assembly" />
            <el-option label="机加工车间" value="machining" />
            <el-option label="焊接车间" value="welding" />
            <el-option label="涂装车间" value="painting" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="工人">
          <el-input v-model="filterForm.workerName" placeholder="请输入工人姓名" clearable />
        </el-form-item>
        
        <el-form-item label="产品">
          <el-input v-model="filterForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        
        <el-form-item label="任务日期">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 240px;"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleFilter">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 任务分配看板 -->
    <div class="assignment-tabs">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="任务看板" name="kanban">
          <div class="kanban-container">
            <div 
              v-for="status in taskStatuses" 
              :key="status.value"
              class="kanban-column"
              :class="`status-${status.value}`"
            >
              <div class="column-header">
                <h3>{{ status.label }}</h3>
                <span class="task-count">{{ getTasksByStatus(status.value).length }}</span>
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
                  <div class="task-info">
                    <span class="workshop">{{ getWorkshopLabel(task.workshop) }}</span>
                    <span class="deadline" :class="{ 'urgent': isUrgent(task.deadline) }">
                      截止: {{ formatDate(task.deadline) }}
                    </span>
                  </div>
                  <div v-if="task.assignedTo" class="assigned-worker">
                    <el-avatar :size="24" :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo.id}`" />
                    <span>{{ task.assignedTo.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="工人分配" name="workers">
          <div class="workers-container">
            <el-card v-for="worker in workers" :key="worker.id" class="worker-card">
              <div class="worker-header">
                <el-avatar :size="48" :src="`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.id}`" />
                <div class="worker-info">
                  <h3>{{ worker.name }}</h3>
                  <p>{{ getWorkshopLabel(worker.workshop) }} | {{ getSkillLevelLabel(worker.skillLevel) }}</p>
                </div>
                <div class="worker-status">
                  <el-tag :type="worker.available ? 'success' : 'danger'">
                    {{ worker.available ? '可用' : '忙碌' }}
                  </el-tag>
                </div>
              </div>
              
              <div class="worker-tasks">
                <h4>当前任务</h4>
                <div v-if="getWorkerTasks(worker.id).length > 0" class="task-list">
                  <div 
                    v-for="task in getWorkerTasks(worker.id)" 
                    :key="task.id"
                    class="worker-task-item"
                    @click="viewTaskDetail(task)"
                  >
                    <div class="task-item-header">
                      <span class="task-id">{{ task.taskId }}</span>
                      <span class="task-status">{{ getStatusLabel(task.status) }}</span>
                    </div>
                    <p class="task-product">{{ task.productName }}</p>
                    <div class="task-progress">
                      <el-progress 
                        :percentage="task.progress" 
                        :stroke-width="6"
                        :color="getProgressColor(task.progress)"
                      />
                      <span class="progress-text">{{ task.progress }}%</span>
                    </div>
                    <div class="task-time-info">
                      <span>计划工时: {{ task.plannedHours }}h</span>
                      <span>实际工时: {{ task.actualHours }}h</span>
                    </div>
                  </div>
                </div>
                <div v-else class="no-tasks">
                  <p>暂无分配任务</p>
                </div>
              </div>
              
              <div class="worker-actions">
                <el-button type="primary" size="small" @click="assignTaskToWorker(worker)">
                  分配任务
                </el-button>
                <el-button size="small" @click="viewWorkerSchedule(worker)">
                  查看排班
                </el-button>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
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
          <el-descriptions-item label="产品名称">{{ selectedTask.productName }}</el-descriptions-item>
          <el-descriptions-item label="任务描述">{{ selectedTask.description }}</el-descriptions-item>
          <el-descriptions-item label="任务状态">{{ getStatusLabel(selectedTask.status) }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityTagType(selectedTask.priority)">
              {{ getPriorityLabel(selectedTask.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="所属车间">{{ getWorkshopLabel(selectedTask.workshop) }}</el-descriptions-item>
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
          <el-descriptions-item label="备注">{{ selectedTask.notes || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeTaskDetail">关闭</el-button>
          <el-button 
            v-if="selectedTask && ['pending', 'assigned'].includes(selectedTask.status)" 
            type="primary" 
            @click="editTaskAssignment"
          >
            编辑分配
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 任务分配对话框 -->
    <el-dialog
      v-model="assignTaskVisible"
      title="分配任务"
      width="600px"
    >
      <el-form :model="assignmentForm" :rules="assignmentRules" ref="assignmentFormRef" label-width="100px">
        <el-form-item label="选择工人" prop="workerId">
          <el-select v-model="assignmentForm.workerId" placeholder="请选择工人" filterable>
            <el-option 
              v-for="worker in availableWorkers" 
              :key="worker.id" 
              :label="worker.name" 
              :value="worker.id"
              :disabled="!worker.available"
            >
              <div class="option-content">
                <span>{{ worker.name }}</span>
                <span class="worker-info">{{ getWorkshopLabel(worker.workshop) }} | {{ getSkillLevelLabel(worker.skillLevel) }}</span>
                <el-tag :type="worker.available ? 'success' : 'danger'" size="small">
                  {{ worker.available ? '可用' : '忙碌' }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="计划工时" prop="plannedHours">
          <el-input-number 
            v-model="assignmentForm.plannedHours" 
            :min="0.5" 
            :step="0.5" 
            :precision="1"
            placeholder="请输入计划工时"
          />
        </el-form-item>
        
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="assignmentForm.startDate"
            type="datetime"
            placeholder="选择开始日期"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="assignmentForm.deadline"
            type="datetime"
            placeholder="选择截止日期"
            style="width: 100%;"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input 
            v-model="assignmentForm.notes" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="assignTaskVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignment">确定分配</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'

export default {
  name: 'WorkAssignment',
  components: {
    Search,
    Refresh,
    Download
  },
  setup() {
    // 筛选表单
    const filterForm = reactive({
      status: '',
      workshop: '',
      workerName: '',
      productName: '',
      dateRange: null
    })

    // 标签页
    const activeTab = ref('kanban')

    // 任务状态配置
    const taskStatuses = [
      { label: '待分配', value: 'pending' },
      { label: '已分配', value: 'assigned' },
      { label: '进行中', value: 'in_progress' },
      { label: '已完成', value: 'completed' },
      { label: '已取消', value: 'cancelled' }
    ]

    // 模拟工人数据
    const workers = ref([
      { id: 1, name: '张三', workshop: 'assembly', skillLevel: 'senior', available: true, workload: 60 },
      { id: 2, name: '李四', workshop: 'machining', skillLevel: 'intermediate', available: true, workload: 40 },
      { id: 3, name: '王五', workshop: 'welding', skillLevel: 'senior', available: false, workload: 90 },
      { id: 4, name: '赵六', workshop: 'painting', skillLevel: 'junior', available: true, workload: 30 },
      { id: 5, name: '钱七', workshop: 'assembly', skillLevel: 'intermediate', available: false, workload: 85 },
      { id: 6, name: '孙八', workshop: 'machining', skillLevel: 'senior', available: true, workload: 50 },
      { id: 7, name: '周九', workshop: 'welding', skillLevel: 'junior', available: true, workload: 25 },
      { id: 8, name: '吴十', workshop: 'painting', skillLevel: 'intermediate', available: false, workload: 95 }
    ])

    // 模拟任务数据
    const tasks = ref([
      {
        id: 1,
        taskId: 'TASK-2023-0001',
        productName: '精密轴承组件',
        description: '完成轴承组件的装配与调试',
        status: 'pending',
        priority: 'high',
        workshop: 'assembly',
        startDate: '2023-10-15 08:00:00',
        deadline: '2023-10-20 18:00:00',
        plannedHours: 20,
        actualHours: 0,
        progress: 0,
        assignedTo: null,
        notes: '需要特别注意装配精度'
      },
      {
        id: 2,
        taskId: 'TASK-2023-0002',
        productName: '铝合金外壳',
        description: 'CNC加工铝合金外壳',
        status: 'assigned',
        priority: 'medium',
        workshop: 'machining',
        startDate: '2023-10-14 09:00:00',
        deadline: '2023-10-18 17:00:00',
        plannedHours: 30,
        actualHours: 12,
        progress: 40,
        assignedTo: workers.value[1],
        notes: '按照最新图纸加工'
      },
      {
        id: 3,
        taskId: 'TASK-2023-0003',
        productName: '结构框架',
        description: '焊接主体结构框架',
        status: 'in_progress',
        priority: 'high',
        workshop: 'welding',
        startDate: '2023-10-13 08:30:00',
        deadline: '2023-10-17 16:00:00',
        plannedHours: 25,
        actualHours: 18,
        progress: 72,
        assignedTo: workers.value[2],
        notes: '确保焊接强度符合标准'
      },
      {
        id: 4,
        taskId: 'TASK-2023-0004',
        productName: '控制面板',
        description: '控制面板表面喷漆处理',
        status: 'completed',
        priority: 'low',
        workshop: 'painting',
        startDate: '2023-10-10 10:00:00',
        deadline: '2023-10-12 15:00:00',
        plannedHours: 15,
        actualHours: 14,
        progress: 100,
        assignedTo: workers.value[3],
        notes: '颜色代码：RAL 9005'
      },
      {
        id: 5,
        taskId: 'TASK-2023-0005',
        productName: '液压系统组件',
        description: '液压系统管路连接与测试',
        status: 'pending',
        priority: 'medium',
        workshop: 'assembly',
        startDate: '2023-10-16 08:00:00',
        deadline: '2023-10-21 18:00:00',
        plannedHours: 24,
        actualHours: 0,
        progress: 0,
        assignedTo: null,
        notes: '需使用专用密封件'
      },
      {
        id: 6,
        taskId: 'TASK-2023-0006',
        productName: '齿轮箱零件',
        description: '齿轮箱关键零件精加工',
        status: 'assigned',
        priority: 'high',
        workshop: 'machining',
        startDate: '2023-10-15 09:00:00',
        deadline: '2023-10-19 17:00:00',
        plannedHours: 28,
        actualHours: 8,
        progress: 28,
        assignedTo: workers.value[5],
        notes: '精度要求±0.005mm'
      },
      {
        id: 7,
        taskId: 'TASK-2023-0007',
        productName: '防护栏',
        description: '安全防护栏焊接与打磨',
        status: 'pending',
        priority: 'low',
        workshop: 'welding',
        startDate: '2023-10-17 08:30:00',
        deadline: '2023-10-22 16:00:00',
        plannedHours: 16,
        actualHours: 0,
        progress: 0,
        assignedTo: null,
        notes: '需严格按照安全规范'
      },
      {
        id: 8,
        taskId: 'TASK-2023-0008',
        productName: '外罩组件',
        description: '外罩组件静电喷涂',
        status: 'in_progress',
        priority: 'medium',
        workshop: 'painting',
        startDate: '2023-10-14 10:00:00',
        deadline: '2023-10-18 15:00:00',
        plannedHours: 22,
        actualHours: 15,
        progress: 68,
        assignedTo: workers.value[7],
        notes: '颜色代码：RAL 5010'
      }
    ])

    // 任务详情相关
    const taskDetailVisible = ref(false)
    const selectedTask = ref(null)

    // 任务分配相关
    const assignTaskVisible = ref(false)
    const assignmentForm = reactive({
      workerId: '',
      plannedHours: 0,
      startDate: '',
      deadline: '',
      notes: ''
    })
    const assignmentFormRef = ref(null)
    const assignmentRules = {
      workerId: [{ required: true, message: '请选择工人', trigger: 'change' }],
      plannedHours: [{ required: true, message: '请输入计划工时', trigger: 'blur' }],
      startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
      deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
    }
    const draggedTask = ref(null)

    // 计算属性 - 可用工人
    const availableWorkers = computed(() => {
      return workers.value.filter(worker => 
        (filterForm.workshop ? worker.workshop === filterForm.workshop : true) &&
        (filterForm.workerName ? worker.name.includes(filterForm.workerName) : true)
      )
    })

    // 计算属性 - 筛选后的任务
    const filteredTasks = computed(() => {
      return tasks.value.filter(task => {
        // 状态筛选
        if (filterForm.status && task.status !== filterForm.status) {
          return false
        }
        // 车间筛选
        if (filterForm.workshop && task.workshop !== filterForm.workshop) {
          return false
        }
        // 工人筛选
        if (filterForm.workerName && (!task.assignedTo || !task.assignedTo.name.includes(filterForm.workerName))) {
          return false
        }
        // 产品筛选
        if (filterForm.productName && !task.productName.includes(filterForm.productName)) {
          return false
        }
        // 日期范围筛选
        if (filterForm.dateRange) {
          const taskDate = new Date(task.startDate)
          const startDate = new Date(filterForm.dateRange[0])
          const endDate = new Date(filterForm.dateRange[1])
          endDate.setHours(23, 59, 59)
          
          if (taskDate < startDate || taskDate > endDate) {
            return false
          }
        }
        return true
      })
    })

    // 根据状态获取任务
    const getTasksByStatus = (status) => {
      return filteredTasks.value.filter(task => task.status === status)
    }

    // 获取工人的任务
    const getWorkerTasks = (workerId) => {
      return tasks.value.filter(task => 
        task.assignedTo && task.assignedTo.id === workerId && 
        ['assigned', 'in_progress'].includes(task.status)
      )
    }

    // 获取状态标签
    const getStatusLabel = (status) => {
      const statusMap = taskStatuses.reduce((map, item) => {
        map[item.value] = item.label
        return map
      }, {})
      return statusMap[status] || status
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

    // 获取技能等级标签
    const getSkillLevelLabel = (level) => {
      const levelMap = {
        senior: '高级',
        intermediate: '中级',
        junior: '初级'
      }
      return levelMap[level] || level
    }

    // 获取进度条颜色
    const getProgressColor = (progress) => {
      if (progress < 30) return '#ff4d4f'
      if (progress < 70) return '#faad14'
      return '#52c41a'
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

    // 判断是否紧急
    const isUrgent = (deadline) => {
      if (!deadline) return false
      const now = new Date()
      const deadDate = new Date(deadline)
      const diffDays = (deadDate - now) / (1000 * 60 * 60 * 24)
      return diffDays < 2 && diffDays >= 0
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
          
          // 如果状态变为已完成，更新进度
          if (newStatus === 'completed') {
            tasks.value[taskIndex].progress = 100
          } else if (newStatus === 'in_progress' && tasks.value[taskIndex].progress === 0) {
            // 如果从未开始变为进行中，设置初始进度
            tasks.value[taskIndex].progress = 10
          }
          
          ElMessage.success(`任务 ${draggedTask.value.taskId} 状态已更新为 ${getStatusLabel(newStatus)}`)
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

    // 分配任务给工人
    const assignTaskToWorker = (worker) => {
      assignmentForm.workerId = worker.id
      assignmentForm.plannedHours = 0
      assignmentForm.startDate = ''
      assignmentForm.deadline = ''
      assignmentForm.notes = ''
      assignTaskVisible.value = true
    }

    // 编辑任务分配
    const editTaskAssignment = () => {
      if (selectedTask.value) {
        assignmentForm.workerId = selectedTask.value.assignedTo?.id || ''
        assignmentForm.plannedHours = selectedTask.value.plannedHours
        assignmentForm.startDate = selectedTask.value.startDate
        assignmentForm.deadline = selectedTask.value.deadline
        assignmentForm.notes = selectedTask.value.notes || ''
        assignTaskVisible.value = true
      }
    }

    // 提交任务分配
    const submitAssignment = () => {
      assignmentFormRef.value.validate((valid) => {
        if (valid) {
          const worker = workers.value.find(w => w.id === assignmentForm.workerId)
          if (worker) {
            // 更新任务分配信息
            const taskIndex = tasks.value.findIndex(t => t.id === selectedTask.value.id)
            if (taskIndex !== -1) {
              tasks.value[taskIndex].assignedTo = worker
              tasks.value[taskIndex].plannedHours = assignmentForm.plannedHours
              tasks.value[taskIndex].startDate = assignmentForm.startDate
              tasks.value[taskIndex].deadline = assignmentForm.deadline
              tasks.value[taskIndex].notes = assignmentForm.notes
              tasks.value[taskIndex].status = 'assigned'
              
              // 更新工人可用状态
              worker.available = false
              
              ElMessage.success('任务分配成功')
              assignTaskVisible.value = false
              closeTaskDetail()
            }
          }
        }
      })
    }

    // 查看工人排班
    const viewWorkerSchedule = (worker) => {
      ElMessage.info(`查看 ${worker.name} 的排班信息`)
      // 这里可以打开排班对话框或跳转到排班页面
    }

    // 搜索筛选
    const handleFilter = () => {
      // 筛选逻辑已通过计算属性实现
      ElMessage.success('筛选完成')
    }

    // 重置筛选
    const resetFilter = () => {
      filterForm.status = ''
      filterForm.workshop = ''
      filterForm.workerName = ''
      filterForm.productName = ''
      filterForm.dateRange = null
    }

    // 刷新数据
    const refreshData = () => {
      // 模拟数据刷新
      ElMessage.success('数据已刷新')
    }

    // 导出数据
    const exportAssignmentData = () => {
      ElMessage.success('数据导出成功')
      // 这里可以实现实际的数据导出逻辑
    }

    // 组件挂载时初始化
    onMounted(() => {
      // 初始化逻辑
    })

    return {
      filterForm,
      activeTab,
      taskStatuses,
      workers,
      tasks,
      filteredTasks,
      taskDetailVisible,
      selectedTask,
      assignTaskVisible,
      assignmentForm,
      assignmentFormRef,
      assignmentRules,
      availableWorkers,
      getTasksByStatus,
      getWorkerTasks,
      getStatusLabel,
      getPriorityLabel,
      getPriorityTagType,
      getWorkshopLabel,
      getSkillLevelLabel,
      getProgressColor,
      formatDate,
      isUrgent,
      handleDragStart,
      handleDrop,
      viewTaskDetail,
      closeTaskDetail,
      assignTaskToWorker,
      editTaskAssignment,
      submitAssignment,
      viewWorkerSchedule,
      handleFilter,
      resetFilter,
      refreshData,
      exportAssignmentData
    }
  }
}
</script>

<style scoped>
.work-assignment-container {
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
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.assignment-tabs {
  margin-bottom: 20px;
}

/* 看板样式 */
.kanban-container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 10px 0;
}

.kanban-column {
  flex: 0 0 320px;
  background-color: #f0f2f5;
  border-radius: 8px;
  padding: 15px;
  min-height: 500px;
}

.kanban-column.status-pending {
  border-top: 4px solid #909399;
}

.kanban-column.status-assigned {
  border-top: 4px solid #1890ff;
}

.kanban-column.status-in_progress {
  border-top: 4px solid #faad14;
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
}

.kanban-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-id {
  font-size: 12px;
  color: #909399;
  font-weight: 500;
}

.card-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.task-desc {
  margin: 0 0 10px 0;
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.deadline.urgent {
  color: #ff4d4f;
  font-weight: 500;
}

.assigned-worker {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;
}

/* 工人分配样式 */
.workers-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.worker-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.worker-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.worker-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.worker-info p {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.worker-status {
  margin-left: auto;
}

.worker-tasks h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 250px;
  overflow-y: auto;
}

.worker-task-item {
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.worker-task-item:hover {
  background-color: #ecf5ff;
}

.task-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-product {
  margin: 0 0 10px 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.task-progress {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  text-align: right;
}

.task-time-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.no-tasks {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.worker-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  justify-content: flex-end;
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

/* 选项样式 */
.option-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.worker-info {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .workers-container {
    grid-template-columns: 1fr;
  }
  
  .kanban-container {
    flex-direction: column;
  }
  
  .kanban-column {
    flex: 1;
    min-height: 300px;
  }
}
</style>