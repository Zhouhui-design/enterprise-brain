<template>
  <div class="task-delegate">
    <!-- 工业风格头部区域 -->
    <header class="delegate-header">
      <div class="header-left">
        <div class="title-section">
          <h1 class="page-title">任务委托</h1>
          <div class="breadcrumb">
            <span class="breadcrumb-item">OA系统</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item">任务管理</span>
            <i class="fas fa-chevron-right breadcrumb-separator"></i>
            <span class="breadcrumb-item active">任务委托</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="action-btn secondary" @click="handleHistory">
          <i class="fas fa-history"></i>
          <span>委托历史</span>
        </button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="delegate-main">
      <!-- 委托表单 -->
      <section class="delegate-form-section">
        <div class="form-container">
          <div class="form-header">
            <h2 class="form-title">新建委托</h2>
            <p class="form-description">将您的任务委托给其他同事处理，确保工作流程不受影响</p>
          </div>
          
          <form @submit.prevent="handleSubmit" class="delegate-form">
            <!-- 任务选择 -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-tasks"></i>
                选择委托任务
              </label>
              <div class="task-selection">
                <select v-model="delegateForm.taskId" class="form-select" required>
                  <option value="">请选择要委托的任务</option>
                  <option v-for="task in availableTasks" :key="task.id" :value="task.id">
                    {{ task.title }} ({{ task.type }} - {{ getPriorityLabel(task.priority) }})
                  </option>
                </select>
                <div v-if="selectedTask" class="task-preview">
                  <div class="preview-header">
                    <h4>任务详情</h4>
                  </div>
                  <div class="preview-content">
                    <div class="preview-item">
                      <label>任务类型:</label>
                      <span>{{ getTaskTypeLabel(selectedTask.type) }}</span>
                    </div>
                    <div class="preview-item">
                      <label>优先级:</label>
                      <span :class="`priority-${selectedTask.priority}`">
                        {{ getPriorityLabel(selectedTask.priority) }}
                      </span>
                    </div>
                    <div class="preview-item">
                      <label>发起人:</label>
                      <span>{{ selectedTask.initiator }}</span>
                    </div>
                    <div class="preview-item">
                      <label>创建时间:</label>
                      <span>{{ formatDate(selectedTask.createTime) }}</span>
                    </div>
                    <div class="preview-item">
                      <label>截止时间:</label>
                      <span :class="{ 'overdue': isOverdue(selectedTask.dueTime) }">
                        {{ formatDate(selectedTask.dueTime) }}
                      </span>
                    </div>
                    <div class="preview-description">
                      <label>任务描述:</label>
                      <p>{{ selectedTask.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 委托对象 -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-user-friends"></i>
                委托给
              </label>
              <div class="delegate-to-section">
                <select v-model="delegateForm.delegateTo" class="form-select" required>
                  <option value="">请选择委托对象</option>
                  <optgroup v-for="dept in departments" :key="dept.id" :label="dept.name">
                    <option v-for="user in dept.users" :key="user.id" :value="user.id">
                      {{ user.name }} - {{ user.position }}
                    </option>
                  </optgroup>
                </select>
                <div v-if="selectedDelegateUser" class="delegate-user-preview">
                  <div class="user-avatar">
                    <img :src="selectedDelegateUser.avatar || '/default-avatar.png'" :alt="selectedDelegateUser.name" />
                  </div>
                  <div class="user-info">
                    <h5>{{ selectedDelegateUser.name }}</h5>
                    <p>{{ selectedDelegateUser.position }} - {{ selectedDelegateUser.department }}</p>
                    <div class="user-status">
                      <span class="status-indicator online"></span>
                      <span class="status-text">当前在线</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 委托时间 -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-calendar-alt"></i>
                委托时间范围
              </label>
              <div class="date-range-section">
                <div class="date-inputs">
                  <div class="date-input-group">
                    <label>开始时间</label>
                    <input 
                      v-model="delegateForm.startTime" 
                      type="datetime-local" 
                      class="form-input"
                      :min="minDateTime"
                      required
                    />
                  </div>
                  <div class="date-input-group">
                    <label>结束时间</label>
                    <input 
                      v-model="delegateForm.endTime" 
                      type="datetime-local" 
                      class="form-input"
                      :min="delegateForm.startTime || minDateTime"
                      required
                    />
                  </div>
                </div>
                <div class="quick-select">
                  <span class="quick-label">快速选择:</span>
                  <button 
                    type="button" 
                    class="quick-btn" 
                    @click="setQuickDate('today')"
                  >
                    今天
                  </button>
                  <button 
                    type="button" 
                    class="quick-btn" 
                    @click="setQuickDate('tomorrow')"
                  >
                    明天
                  </button>
                  <button 
                    type="button" 
                    class="quick-btn" 
                    @click="setQuickDate('week')"
                  >
                    本周
                  </button>
                  <button 
                    type="button" 
                    class="quick-btn" 
                    @click="setQuickDate('month')"
                  >
                    本月
                  </button>
                </div>
              </div>
            </div>

            <!-- 委托原因 -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-comment-alt"></i>
                委托原因
              </label>
              <textarea 
                v-model="delegateForm.reason" 
                class="form-textarea"
                placeholder="请说明委托原因，如：出差、休假、会议等..."
                rows="4"
                required
              ></textarea>
              <div class="char-count">
                {{ delegateForm.reason.length }}/200
              </div>
            </div>

            <!-- 附加说明 -->
            <div class="form-group">
              <label class="form-label">
                <i class="fas fa-info-circle"></i>
                附加说明（选填）
              </label>
              <textarea 
                v-model="delegateForm.additionalInfo" 
                class="form-textarea"
                placeholder="提供额外信息帮助被委托人更好地完成任务..."
                rows="3"
              ></textarea>
            </div>

            <!-- 表单操作 -->
            <div class="form-actions">
              <button type="button" class="action-btn secondary" @click="handleReset">
                <i class="fas fa-undo"></i>
                <span>重置表单</span>
              </button>
              <button type="submit" class="action-btn primary" :disabled="!isFormValid">
                <i class="fas fa-paper-plane"></i>
                <span>提交委托</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- 当前委托状态 -->
      <section class="current-delegates-section">
        <div class="list-container">
          <div class="list-header">
            <h3 class="list-title">当前委托状态</h3>
            <button class="refresh-btn" @click="loadCurrentDelegates">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          
          <div v-if="currentDelegates.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-exchange-alt"></i>
            </div>
            <h4>暂无委托任务</h4>
            <p>您当前没有委托给其他人的任务</p>
          </div>
          
          <div v-else class="delegate-list">
            <div 
              v-for="delegate in currentDelegates" 
              :key="delegate.id"
              class="delegate-item"
              :class="{ 'expiring-soon': isExpiringSoon(delegate.endTime) }"
            >
              <div class="item-header">
                <div class="task-info">
                  <h4>{{ delegate.taskTitle }}</h4>
                  <div class="task-meta">
                    <span class="type-badge">{{ getTaskTypeLabel(delegate.taskType) }}</span>
                    <span class="priority-badge" :class="`priority-${delegate.taskPriority}`">
                      {{ getPriorityLabel(delegate.taskPriority) }}
                    </span>
                  </div>
                </div>
                <div class="delegate-status" :class="`status-${delegate.status}`">
                  {{ getDelegateStatusLabel(delegate.status) }}
                </div>
              </div>
              
              <div class="item-content">
                <div class="delegate-info">
                  <div class="delegate-to">
                    <i class="fas fa-user-friends"></i>
                    <span>委托给: {{ delegate.delegateToName }}</span>
                  </div>
                  <div class="delegate-time">
                    <i class="fas fa-clock"></i>
                    <span>{{ formatDate(delegate.startTime) }} - {{ formatDate(delegate.endTime) }}</span>
                  </div>
                  <div class="delegate-reason">
                    <i class="fas fa-comment-alt"></i>
                    <span>{{ delegate.reason }}</span>
                  </div>
                </div>
              </div>
              
              <div class="item-actions">
                <button 
                  v-if="delegate.status === 'active'" 
                  class="action-btn small warning" 
                  @click="handleCancelDelegate(delegate)"
                >
                  <i class="fas fa-times"></i>
                  <span>取消委托</span>
                </button>
                <button 
                  class="action-btn small info" 
                  @click="handleViewDetail(delegate)"
                >
                  <i class="fas fa-eye"></i>
                  <span>查看详情</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 委托历史弹窗 -->
    <div v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">委托历史记录</h3>
          <button class="modal-close" @click="closeHistoryModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="history-filters">
            <div class="filter-group">
              <label>时间范围</label>
              <select v-model="historyFilter.timeRange" class="filter-select">
                <option value="all">全部</option>
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
                <option value="quarter">最近三月</option>
              </select>
            </div>
            <div class="filter-group">
              <label>状态</label>
              <select v-model="historyFilter.status" class="filter-select">
                <option value="all">全部</option>
                <option value="active">进行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
          </div>
          
          <div class="history-list">
            <div 
              v-for="history in filteredHistory" 
              :key="history.id"
              class="history-item"
            >
              <div class="history-header">
                <div class="history-task">{{ history.taskTitle }}</div>
                <div class="history-status" :class="`status-${history.status}`">
                  {{ getDelegateStatusLabel(history.status) }}
                </div>
              </div>
              <div class="history-details">
                <div class="history-info">
                  <span>委托给: {{ history.delegateToName }}</span>
                  <span>{{ formatDate(history.startTime) }} - {{ formatDate(history.endTime) }}</span>
                </div>
                <div class="history-reason">{{ history.reason }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 响应式数据
const availableTasks = ref([])
const currentDelegates = ref([])
const delegateHistory = ref([])
const departments = ref([])
const showHistoryModal = ref(false)

const delegateForm = ref({
  taskId: '',
  delegateTo: '',
  startTime: '',
  endTime: '',
  reason: '',
  additionalInfo: ''
})

const historyFilter = ref({
  timeRange: 'all',
  status: 'all'
})

// 计算属性
const selectedTask = computed(() => {
  return availableTasks.value.find(task => task.id === delegateForm.value.taskId)
})

const selectedDelegateUser = computed(() => {
  let user = null
  departments.value.forEach(dept => {
    const found = dept.users.find(u => u.id === delegateForm.value.delegateTo)
    if (found) user = found
  })
  return user
})

const isFormValid = computed(() => {
  return delegateForm.value.taskId && 
         delegateForm.value.delegateTo && 
         delegateForm.value.startTime && 
         delegateForm.value.endTime && 
         delegateForm.value.reason.trim().length > 0
})

const minDateTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

const filteredHistory = computed(() => {
  let filtered = delegateHistory.value

  // 时间过滤
  if (historyFilter.value.timeRange !== 'all') {
    const now = new Date()
    let startDate = new Date()

    switch (historyFilter.value.timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
    }

    filtered = filtered.filter(item => new Date(item.startTime) >= startDate)
  }

  // 状态过滤
  if (historyFilter.value.status !== 'all') {
    filtered = filtered.filter(item => item.status === historyFilter.value.status)
  }

  return filtered
})

// 工具函数
const getPriorityLabel = (priority) => {
  const labels = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || '普通'
}

const getTaskTypeLabel = (type) => {
  const labels = {
    approval: '审批任务',
    review: '审核任务',
    assignment: '指派任务',
    notification: '通知任务'
  }
  return labels[type] || '未知任务'
}

const getDelegateStatusLabel = (status) => {
  const labels = {
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    expired: '已过期'
  }
  return labels[status] || '未知'
}

const formatDate = (dateString) => {
  if (!dateString) return '无'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const isOverdue = (dueTime) => {
  return dueTime && new Date(dueTime) < new Date()
}

const isExpiringSoon = (endTime) => {
  if (!endTime) return false
  const end = new Date(endTime)
  const now = new Date()
  const hoursUntilEnd = (end - now) / (1000 * 60 * 60)
  return hoursUntilEnd > 0 && hoursUntilEnd <= 24
}

// 事件处理
const handleSubmit = () => {
  if (!isFormValid.value) return

  const delegateData = {
    id: Date.now(),
    taskId: delegateForm.value.taskId,
    taskTitle: selectedTask.value.title,
    taskType: selectedTask.value.type,
    taskPriority: selectedTask.value.priority,
    delegateTo: delegateForm.value.delegateTo,
    delegateToName: selectedDelegateUser.value.name,
    startTime: delegateForm.value.startTime,
    endTime: delegateForm.value.endTime,
    reason: delegateForm.value.reason,
    additionalInfo: delegateForm.value.additionalInfo,
    status: 'active',
    createTime: new Date().toISOString()
  }

  currentDelegates.value.push(delegateData)
  delegateHistory.value.push(delegateData)

  // 从可用任务中移除已委托的任务
  const taskIndex = availableTasks.value.findIndex(t => t.id === delegateForm.value.taskId)
  if (taskIndex > -1) {
    availableTasks.value.splice(taskIndex, 1)
  }

  alert('任务委托成功！')
  handleReset()
}

const handleReset = () => {
  delegateForm.value = {
    taskId: '',
    delegateTo: '',
    startTime: '',
    endTime: '',
    reason: '',
    additionalInfo: ''
  }
}

const setQuickDate = (type) => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (type) {
    case 'today':
      start.setHours(9, 0, 0, 0)
      end.setHours(18, 0, 0, 0)
      break
    case 'tomorrow':
      start.setDate(now.getDate() + 1)
      start.setHours(9, 0, 0, 0)
      end.setDate(now.getDate() + 1)
      end.setHours(18, 0, 0, 0)
      break
    case 'week':
      start.setDate(now.getDate() - now.getDay() + 1) // 本周一
      start.setHours(9, 0, 0, 0)
      end.setDate(now.getDate() - now.getDay() + 5) // 本周五
      end.setHours(18, 0, 0, 0)
      break
    case 'month':
      start.setDate(1) // 本月1号
      start.setHours(9, 0, 0, 0)
      end.setMonth(now.getMonth() + 1, 0) // 本月最后一天
      end.setHours(18, 0, 0, 0)
      break
  }

  // 转换为datetime-local格式
  start.setMinutes(start.getMinutes() - start.getTimezoneOffset())
  end.setMinutes(end.getMinutes() - end.getTimezoneOffset())

  delegateForm.value.startTime = start.toISOString().slice(0, 16)
  delegateForm.value.endTime = end.toISOString().slice(0, 16)
}

const handleCancelDelegate = (delegate) => {
  if (confirm(`确定要取消委托"${delegate.taskTitle}"吗？`)) {
    delegate.status = 'cancelled'
    
    // 将任务重新加入可用任务列表
    const task = {
      id: delegate.taskId,
      title: delegate.taskTitle,
      type: delegate.taskType,
      priority: delegate.taskPriority,
      initiator: '系统',
      createTime: new Date().toISOString()
    }
    availableTasks.value.push(task)
    
    alert('委托已取消')
  }
}

const handleViewDetail = (delegate) => {
  console.log('查看委托详情:', delegate)
}

const handleHistory = () => {
  showHistoryModal.value = true
}

const closeHistoryModal = () => {
  showHistoryModal.value = false
}

// 数据加载函数
const loadAvailableTasks = () => {
  availableTasks.value = [
    {
      id: 1,
      title: '采购申请审批',
      type: 'approval',
      priority: 'urgent',
      initiator: '张三',
      createTime: '2024-01-15 09:00:00',
      dueTime: '2024-01-16 18:00:00',
      description: '请审批办公用品采购申请，总金额5000元'
    },
    {
      id: 2,
      title: '项目立项审核',
      type: 'review',
      priority: 'high',
      initiator: '李四',
      createTime: '2024-01-14 16:00:00',
      dueTime: '2024-01-17 18:00:00',
      description: '新项目可行性报告审核，请仔细查看相关文档'
    },
    {
      id: 3,
      title: '月度报告提交',
      type: 'assignment',
      priority: 'medium',
      initiator: '王五',
      createTime: '2024-01-10 08:00:00',
      dueTime: '2024-01-20 18:00:00',
      description: '请完成本月工作报告并提交'
    }
  ]
}

const loadDepartments = () => {
  departments.value = [
    {
      id: 1,
      name: '技术部',
      users: [
        { id: 'user1', name: '赵六', position: '高级工程师', department: '技术部', avatar: '' },
        { id: 'user2', name: '钱七', position: '技术经理', department: '技术部', avatar: '' }
      ]
    },
    {
      id: 2,
      name: '财务部',
      users: [
        { id: 'user3', name: '孙八', position: '财务主管', department: '财务部', avatar: '' },
        { id: 'user4', name: '周九', position: '出纳', department: '财务部', avatar: '' }
      ]
    },
    {
      id: 3,
      name: '人事部',
      users: [
        { id: 'user5', name: '吴十', position: '人事经理', department: '人事部', avatar: '' }
      ]
    }
  ]
}

const loadCurrentDelegates = () => {
  currentDelegates.value = [
    {
      id: 101,
      taskId: 4,
      taskTitle: '请假申请审批',
      taskType: 'approval',
      taskPriority: 'medium',
      delegateTo: 'user3',
      delegateToName: '孙八',
      startTime: '2024-01-13 09:00:00',
      endTime: '2024-01-15 18:00:00',
      reason: '出差参加技术会议',
      status: 'active'
    }
  ]
}

const loadDelegateHistory = () => {
  delegateHistory.value = [
    {
      id: 101,
      taskTitle: '请假申请审批',
      delegateToName: '孙八',
      startTime: '2024-01-13 09:00:00',
      endTime: '2024-01-15 18:00:00',
      reason: '出差参加技术会议',
      status: 'active'
    },
    {
      id: 100,
      taskTitle: '季度预算审核',
      delegateToName: '钱七',
      startTime: '2024-01-05 09:00:00',
      endTime: '2024-01-07 18:00:00',
      reason: '参加外部培训',
      status: 'completed'
    }
  ]
}

// 生命周期
onMounted(() => {
  loadAvailableTasks()
  loadDepartments()
  loadCurrentDelegates()
  loadDelegateHistory()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600&display=swap');

/* CSS变量定义 */
:root {
  --primary-color: #2C3E50;
  --secondary-color: #34495E;
  --accent-color: #E67E22;
  --background-color: #ECF0F1;
  --text-color: #2C3E50;
  --border-color: #BDC3C7;
  --success-color: #27AE60;
  --warning-color: #F39C12;
  --danger-color: #E74C3C;
}

/* 基础样式 */
* {
  box-sizing: border-box;
}

.task-delegate {
  font-family: 'Source Sans Pro', sans-serif;
  background: var(--background-color);
  min-height: 100vh;
  color: var(--text-color);
}

/* 头部样式 */
.delegate-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
}

.delegate-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color);
}

.page-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  opacity: 0.9;
}

.breadcrumb-item {
  color: rgba(255, 255, 255, 0.8);
}

.breadcrumb-item.active {
  color: white;
  font-weight: 600;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.action-btn.primary {
  background: var(--accent-color);
  color: white;
}

.action-btn.primary:hover {
  background: #D35400;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.4);
}

.action-btn.primary:disabled {
  background: #BDC3C7;
  cursor: not-allowed;
  transform: none;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.action-btn.warning {
  background: var(--warning-color);
  color: white;
}

.action-btn.info {
  background: #3498DB;
  color: white;
}

/* 主内容区域 */
.delegate-main {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

/* 委托表单 */
.delegate-form-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.form-container {
  padding: 2rem;
}

.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.form-description {
  color: #7F8C8D;
  font-size: 0.875rem;
  margin: 0;
}

.delegate-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.form-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.form-select,
.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.3s ease;
  background: white;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent-color);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #7F8C8D;
}

/* 任务选择 */
.task-selection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.task-preview {
  background: #f8f9fa;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

.preview-header h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 1rem 0;
  font-size: 1rem;
}

.preview-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.75rem;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.preview-item label {
  font-size: 0.75rem;
  color: #7F8C8D;
  font-weight: 600;
}

.preview-item span {
  font-size: 0.875rem;
  color: var(--text-color);
  font-weight: 500;
}

.preview-item .overdue {
  color: var(--danger-color);
  font-weight: 600;
}

.preview-description {
  grid-column: 1 / -1;
}

.preview-description p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color);
  line-height: 1.5;
}

/* 委托对象 */
.delegate-to-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.delegate-user-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f8f9fa;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info h5 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.25rem 0;
}

.user-info p {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
  color: #7F8C8D;
}

.user-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-indicator.online {
  background: var(--success-color);
}

.status-text {
  font-size: 0.75rem;
  color: var(--success-color);
  font-weight: 600;
}

/* 时间范围 */
.date-range-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input-group label {
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.quick-select {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.quick-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.quick-btn:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
}

/* 表单操作 */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
}

/* 当前委托状态 */
.current-delegates-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 800px;
}

.list-container {
  padding: 1.5rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.list-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--secondary-color);
}

.refresh-btn:hover {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--border-color);
  margin-bottom: 1rem;
}

.empty-state h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #7F8C8D;
  margin: 0;
  font-size: 0.875rem;
}

.delegate-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.delegate-item {
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.delegate-item:hover {
  border-color: var(--accent-color);
  box-shadow: 0 4px 12px rgba(230, 126, 34, 0.15);
}

.delegate-item.expiring-soon {
  border-left-color: var(--warning-color);
  border-left-width: 4px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.task-info h4 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.task-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.type-badge,
.priority-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.priority-badge.priority-urgent {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.priority-badge.priority-high {
  background: rgba(243, 156, 18, 0.1);
  color: var(--warning-color);
}

.priority-badge.priority-medium {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.delegate-status {
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.delegate-status.status-active {
  background: rgba(39, 174, 96, 0.1);
  color: var(--success-color);
}

.delegate-status.status-completed {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.delegate-status.status-cancelled {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.item-content {
  margin-bottom: 1rem;
}

.delegate-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.delegate-info > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #7F8C8D;
}

.delegate-info i {
  width: 16px;
  text-align: center;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* 历史弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 2px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: #f8f9fa;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--danger-color);
  color: white;
}

.modal-body {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.history-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.875rem;
  color: var(--secondary-color);
  font-weight: 600;
}

.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.history-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
}

.history-item:hover {
  border-color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(230, 126, 34, 0.1);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.history-task {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  color: var(--primary-color);
}

.history-status {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.history-status.status-active {
  background: rgba(39, 174, 96, 0.1);
  color: var(--success-color);
}

.history-status.status-completed {
  background: rgba(52, 152, 219, 0.1);
  color: #3498DB;
}

.history-status.status-cancelled {
  background: rgba(231, 76, 60, 0.1);
  color: var(--danger-color);
}

.history-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #7F8C8D;
}

.history-reason {
  font-size: 0.875rem;
  color: var(--text-color);
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid var(--accent-color);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .delegate-main {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .current-delegates-section {
    max-height: none;
  }
}

@media (max-width: 768px) {
  .delegate-header {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }
  
  .delegate-main {
    padding: 1rem;
  }
  
  .form-container {
    padding: 1.5rem;
  }
  
  .date-inputs {
    grid-template-columns: 1fr;
  }
  
  .preview-content {
    grid-template-columns: 1fr;
  }
  
  .quick-select {
    flex-wrap: wrap;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>