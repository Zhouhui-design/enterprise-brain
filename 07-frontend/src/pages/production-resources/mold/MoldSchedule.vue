<template>
  <div class="mold-schedule">
    <div class="header">
      <h1>模具排程</h1>
      <div class="actions">
        <el-button type="primary" @click="handleAddSchedule">新增排程</el-button>
        <el-button @click="handleBatchExport">批量导出</el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="模具编号/名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入编号或名称" 
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="排程状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待执行" value="pending" />
            <el-option label="执行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="排程日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon primary">
          <Calendar />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalSchedules }}</div>
          <div class="stat-label">排程总数</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <Clock />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pendingSchedules }}</div>
          <div class="stat-label">待执行</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon info">
          <PlayCircle />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ inProgressSchedules }}</div>
          <div class="stat-label">执行中</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <CheckCircle />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ completedSchedules }}</div>
          <div class="stat-label">已完成</div>
          <div class="stat-unit">项</div>
        </div>
      </div>
    </div>

    <!-- 排程视图切换 -->
    <div class="view-tabs">
      <el-tabs v-model="activeView" @tab-click="handleViewChange">
        <el-tab-pane label="日历视图" name="calendar">
          <div class="calendar-view">
            <div class="calendar-header">
              <el-button @click="prevMonth">
                <el-icon><ArrowLeft /></el-icon>
              </el-button>
              <h3>{{ currentYearMonth }}</h3>
              <el-button @click="nextMonth">
                <el-icon><ArrowRight /></el-icon>
              </el-button>
              <el-button @click="today">今天</el-button>
            </div>
            
            <!-- 日历网格 -->
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
              </div>
              <div class="calendar-days">
                <div 
                  v-for="(day, index) in calendarDays" 
                  :key="index"
                  class="calendar-day"
                  :class="{
                    'other-month': !day.isCurrentMonth,
                    'today': day.isToday,
                    'has-schedule': day.schedules && day.schedules.length > 0
                  }"
                  @click="selectDate(day)"
                >
                  <div class="day-number">{{ day.date }}</div>
                  <div class="day-schedules">
                    <div 
                      v-for="schedule in day.schedules.slice(0, 3)" 
                      :key="schedule.id"
                      class="schedule-dot"
                      :class="`status-${schedule.status}`"
                      :title="`${schedule.moldName} - ${schedule.productName}`"
                    ></div>
                    <div 
                      v-if="day.schedules && day.schedules.length > 3"
                      class="more-schedules"
                      :title="`还有${day.schedules.length - 3}个排程`"
                    >
                      +{{ day.schedules.length - 3 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="列表视图" name="list">
          <el-card class="table-card">
            <div class="table-header">
              <h3>排程列表</h3>
              <div class="table-actions">
                <el-select v-model="viewMode" placeholder="显示模式">
                  <el-option label="表格视图" value="table" />
                  <el-option label="卡片视图" value="card" />
                </el-select>
              </div>
            </div>

            <!-- 表格视图 -->
            <el-table 
              v-if="viewMode === 'table'"
              :data="paginatedSchedules" 
              style="width: 100%"
              v-loading="loading"
              @sort-change="handleSort"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="scheduleCode" label="排程编号" width="120" sortable />
              <el-table-column prop="moldName" label="模具名称" width="150" sortable />
              <el-table-column prop="productName" label="产品名称" width="150" />
              <el-table-column prop="startDate" label="开始日期" width="120" sortable />
              <el-table-column prop="endDate" label="结束日期" width="120" sortable />
              <el-table-column prop="priority" label="优先级" width="80">
                <template #default="scope">
                  <el-tag :type="getPriorityType(scope.row.priority)">
                    {{ getPriorityText(scope.row.priority) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="operator" label="操作人" width="100" />
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="scope">
                  <el-button link type="primary" @click="handleViewSchedule(scope.row)">查看</el-button>
                  <el-button link @click="handleEditSchedule(scope.row)" v-if="scope.row.status === 'pending'">编辑</el-button>
                  <el-button link type="success" @click="handleStartSchedule(scope.row)" v-if="scope.row.status === 'pending'">开始</el-button>
                  <el-button link type="success" @click="handleCompleteSchedule(scope.row)" v-if="scope.row.status === 'in_progress'">完成</el-button>
                  <el-button link type="danger" @click="handleCancelSchedule(scope.row)" v-if="['pending', 'in_progress'].includes(scope.row.status)">取消</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 卡片视图 -->
            <div v-else-if="viewMode === 'card'" class="schedule-list">
              <el-card 
                v-for="schedule in paginatedSchedules" 
                :key="schedule.id"
                class="schedule-item"
                shadow="hover"
                :class="`status-${schedule.status}`"
              >
                <div class="schedule-item-header">
                  <div class="item-info">
                    <h4>{{ schedule.moldName }}</h4>
                    <span class="schedule-code">{{ schedule.scheduleCode }}</span>
                  </div>
                  <el-tag :type="getStatusType(schedule.status)">{{ getStatusText(schedule.status) }}</el-tag>
                </div>
                <div class="schedule-item-content">
                  <div class="info-row">
                    <span class="label">产品名称:</span>
                    <span class="value">{{ schedule.productName }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">时间安排:</span>
                    <span class="value">
                      {{ schedule.startDate }} 至 {{ schedule.endDate }}
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="label">优先级:</span>
                    <span class="value">
                      <el-tag size="small" :type="getPriorityType(schedule.priority)">{{ getPriorityText(schedule.priority) }}</el-tag>
                    </span>
                  </div>
                  <div v-if="schedule.note" class="info-row">
                    <span class="label">备注:</span>
                    <span class="value">{{ schedule.note }}</span>
                  </div>
                </div>
                <div class="schedule-item-actions">
                  <el-button size="small" @click="handleViewSchedule(schedule)">详情</el-button>
                  <template v-if="schedule.status === 'pending'">
                    <el-button size="small" type="primary" @click="handleStartSchedule(schedule)">开始</el-button>
                    <el-button size="small" type="info" @click="handleEditSchedule(schedule)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleCancelSchedule(schedule)">取消</el-button>
                  </template>
                  <template v-else-if="schedule.status === 'in_progress'">
                    <el-button size="small" type="success" @click="handleCompleteSchedule(schedule)">完成</el-button>
                    <el-button size="small" type="danger" @click="handleCancelSchedule(schedule)">取消</el-button>
                  </template>
                </div>
              </el-card>
            </div>

            <!-- 分页 -->
            <div class="pagination">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[10, 20, 50, 100]"
                :total="filteredSchedules.length"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 新增/编辑排程对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增排程' : '编辑排程'"
      width="700px"
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排程编号" prop="scheduleCode">
              <el-input v-model="formData.scheduleCode" placeholder="自动生成" disabled />
            </el-form-item>
            <el-form-item label="模具信息" prop="moldId">
              <el-select v-model="formData.moldId" placeholder="请选择模具" filterable>
                <el-option 
                  v-for="mold in availableMolds" 
                  :key="mold.id" 
                  :label="`${mold.code} - ${mold.name}`" 
                  :value="mold.id" 
                />
              </el-select>
            </el-form-item>
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="formData.productName" placeholder="请输入产品名称" />
            </el-form-item>
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker 
                v-model="formData.startDate" 
                type="datetime" 
                placeholder="选择开始时间" 
                style="width: 100%;" 
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker 
                v-model="formData.endDate" 
                type="datetime" 
                placeholder="选择结束时间" 
                style="width: 100%;" 
              />
            </el-form-item>
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="formData.priority" placeholder="请选择优先级">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作人" prop="operator">
              <el-input v-model="formData.operator" placeholder="请输入操作人" />
            </el-form-item>
            <el-form-item label="班次" prop="shift">
              <el-select v-model="formData.shift" placeholder="请选择班次">
                <el-option label="白班" value="day" />
                <el-option label="夜班" value="night" />
                <el-option label="全天" value="all_day" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="note">
          <el-input v-model="formData.note" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看排程详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`排程详情 - ${selectedSchedule?.moldName || ''}`"
      width="700px"
    >
      <div v-if="selectedSchedule" class="schedule-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="排程编号">{{ selectedSchedule.scheduleCode }}</el-descriptions-item>
          <el-descriptions-item label="模具名称">{{ selectedSchedule.moldName }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ selectedSchedule.productName }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(selectedSchedule.priority)">{{ getPriorityText(selectedSchedule.priority) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ selectedSchedule.startDate }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ selectedSchedule.endDate }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedSchedule.status)">{{ getStatusText(selectedSchedule.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">{{ selectedSchedule.operator }}</el-descriptions-item>
          <el-descriptions-item label="班次">{{ getShiftText(selectedSchedule.shift) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedSchedule.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedSchedule.note || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 执行记录 -->
        <div v-if="selectedSchedule.executionRecords && selectedSchedule.executionRecords.length > 0" class="execution-records">
          <h3>执行记录</h3>
          <el-timeline>
            <el-timeline-item 
              v-for="(record, index) in selectedSchedule.executionRecords" 
              :key="index"
              :timestamp="record.time"
              :type="record.type"
              :icon="getTimelineIcon(record.event)"
            >
              <div class="timeline-content">
                <h4>{{ record.event }}</h4>
                <p v-if="record.details">{{ record.details }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>

    <!-- 日期详情抽屉 -->
    <el-drawer
      v-model="dateDrawerVisible"
      title="日期排程详情"
      direction="right"
      size="600px"
    >
      <div v-if="selectedDate" class="date-details">
        <h3>{{ selectedDate.fullDate }} 排程详情</h3>
        <div v-if="selectedDate.schedules && selectedDate.schedules.length > 0" class="daily-schedules">
          <el-card 
            v-for="schedule in selectedDate.schedules" 
            :key="schedule.id"
            class="daily-schedule-item"
            shadow="hover"
          >
            <div class="schedule-time">{{ formatTime(schedule.startDate) }} - {{ formatTime(schedule.endDate) }}</div>
            <div class="schedule-info">
              <h4>{{ schedule.moldName }}</h4>
              <p>{{ schedule.productName }}</p>
            </div>
            <div class="schedule-meta">
              <el-tag :type="getStatusType(schedule.status)">{{ getStatusText(schedule.status) }}</el-tag>
              <el-tag size="small" :type="getPriorityType(schedule.priority)">{{ getPriorityText(schedule.priority) }}</el-tag>
            </div>
            <div class="schedule-actions">
              <el-button size="small" @click="handleViewSchedule(schedule)">查看</el-button>
            </div>
          </el-card>
        </div>
        <div v-else class="empty-state">
          当天没有排程
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Clock, PlayCircle, CheckCircle, ArrowLeft, ArrowRight, Refresh, Edit, Play, Check, Close, InfoFilled, WarningFilled, SuccessFilled } from '@element-plus/icons-vue'

// 响应式数据
const schedules = ref([])
const loading = ref(false)
const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: []
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const viewMode = ref('table')
const activeView = ref('calendar')

// 对话框相关
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dateDrawerVisible = ref(false)
const dialogType = ref('add')
const selectedSchedule = ref(null)
const selectedDate = ref(null)
const formRef = ref(null)

// 日历相关
const currentDate = ref(new Date())
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 表单数据
const formData = reactive({
  scheduleCode: '',
  moldId: '',
  moldName: '',
  productName: '',
  startDate: '',
  endDate: '',
  priority: 'medium',
  status: 'pending',
  operator: '',
  shift: 'day',
  note: ''
})

// 表单验证规则
const formRules = reactive({
  moldId: [{ required: true, message: '请选择模具', trigger: 'change' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  operator: [{ required: true, message: '请输入操作人', trigger: 'blur' }],
  shift: [{ required: true, message: '请选择班次', trigger: 'change' }]
})

// 可用模具（模拟数据）
const availableMolds = ref([
  { id: 1, code: 'M001', name: '产品A上模' },
  { id: 2, code: 'M002', name: '产品B下模' },
  { id: 3, code: 'M003', name: '产品C侧模' },
  { id: 4, code: 'M004', name: '产品A下模' },
  { id: 5, code: 'M005', name: '产品D前模' },
  { id: 6, code: 'M006', name: '产品E后模' },
  { id: 7, code: 'M007', name: '产品F上模' },
  { id: 8, code: 'M008', name: '产品G下模' },
  { id: 9, code: 'M009', name: '产品H前模' },
  { id: 10, code: 'M010', name: '产品I后模' }
])

// 计算属性
const filteredSchedules = computed(() => {
  return schedules.value.filter(schedule => {
    // 关键词搜索
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      if (!schedule.moldName.toLowerCase().includes(keyword) && 
          !schedule.scheduleCode.toLowerCase().includes(keyword) &&
          !schedule.productName.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 状态筛选
    if (searchForm.status && schedule.status !== searchForm.status) {
      return false
    }
    
    // 日期范围筛选
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const startDate = new Date(searchForm.dateRange[0])
      const endDate = new Date(searchForm.dateRange[1])
      const scheduleStartDate = new Date(schedule.startDate)
      const scheduleEndDate = new Date(schedule.endDate)
      
      if (scheduleEndDate < startDate || scheduleStartDate > endDate) {
        return false
      }
    }
    
    return true
  })
})

const paginatedSchedules = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredSchedules.value.slice(startIndex, endIndex)
})

// 统计数据
const totalSchedules = computed(() => schedules.value.length)
const pendingSchedules = computed(() => 
  schedules.value.filter(schedule => schedule.status === 'pending').length
)
const inProgressSchedules = computed(() => 
  schedules.value.filter(schedule => schedule.status === 'in_progress').length
)
const completedSchedules = computed(() => 
  schedules.value.filter(schedule => schedule.status === 'completed').length
)

// 当前年月显示
const currentYearMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

// 日历天数
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // 获取当月第一天
  const firstDay = new Date(year, month, 1)
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0)
  // 获取当月第一天是星期几
  const firstDayWeek = firstDay.getDay()
  // 获取当月天数
  const daysInMonth = lastDay.getDate()
  
  const days = []
  
  // 添加上个月的尾部天数
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i)
    days.push({
      date: date.getDate(),
      isCurrentMonth: false,
      isToday: isToday(date),
      fullDate: formatDate(date),
      schedules: []
    })
  }
  
  // 添加当月天数
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    const dateStr = formatDate(date)
    const daySchedules = schedules.value.filter(schedule => {
      const startDate = formatDate(new Date(schedule.startDate))
      const endDate = formatDate(new Date(schedule.endDate))
      return isDateInRange(dateStr, startDate, endDate)
    })
    
    days.push({
      date: i,
      isCurrentMonth: true,
      isToday: isToday(date),
      fullDate: dateStr,
      schedules: daySchedules
    })
  }
  
  // 添加下个月的头部天数，使总天数为42（6行7列）
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: isToday(date),
      fullDate: formatDate(date),
      schedules: []
    })
  }
  
  return days
})

// 生命周期钩子
onMounted(() => {
  loadSchedules()
})

// 辅助函数
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTime = (dateStr) => {
  const date = new Date(dateStr)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const isToday = (date) => {
  const today = new Date()
  return date.getFullYear() === today.getFullYear() &&
         date.getMonth() === today.getMonth() &&
         date.getDate() === today.getDate()
}

const isDateInRange = (date, startDate, endDate) => {
  return date >= startDate && date <= endDate
}

const generateScheduleCode = () => {
  const now = new Date()
  const year = now.getFullYear().toString().slice(2)
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SCH${year}${month}${day}${random}`
}

// 状态和优先级映射
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待执行',
    in_progress: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || '未知'
}

const getPriorityType = (priority) => {
  const types = {
    low: 'info',
    medium: 'primary',
    high: 'warning',
    urgent: 'danger'
  }
  return types[priority] || 'info'
}

const getPriorityText = (priority) => {
  const texts = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  }
  return texts[priority] || '未知'
}

const getShiftText = (shift) => {
  const texts = {
    day: '白班',
    night: '夜班',
    all_day: '全天'
  }
  return texts[shift] || '未知'
}

const getTimelineIcon = (event) => {
  const icons = {
    '创建排程': InfoFilled,
    '开始执行': PlayCircle,
    '完成排程': CheckCircle,
    '取消排程': Close
  }
  return icons[event] || InfoFilled
}

// 日历操作
const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

const today = () => {
  currentDate.value = new Date()
}

const selectDate = (day) => {
  if (day.schedules && day.schedules.length > 0) {
    selectedDate.value = day
    dateDrawerVisible.value = true
  }
}

// 搜索和重置
const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    dateRange: []
  })
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 视图切换
const handleViewChange = (tab) => {
  activeView.value = tab.paneName
}

// 排序处理
const handleSort = (sort) => {
  // 排序逻辑可以在这里实现
  console.log('Sort:', sort)
}

// 加载数据
const loadSchedules = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    schedules.value = [
      {
        id: 1,
        scheduleCode: 'SCH240115001',
        moldId: 1,
        moldName: '产品A上模',
        productName: '智能手表外壳',
        startDate: '2024-01-15T08:00:00',
        endDate: '2024-01-15T16:00:00',
        priority: 'high',
        status: 'completed',
        operator: '张师傅',
        shift: 'day',
        note: '按计划生产',
        createdAt: '2024-01-10T10:30:00',
        executionRecords: [
          {
            time: '2024-01-10T10:30:00',
            event: '创建排程',
            type: 'primary',
            details: '计划于1月15日白班生产'
          },
          {
            time: '2024-01-15T08:05:00',
            event: '开始执行',
            type: 'info',
            details: '张师傅开始生产'
          },
          {
            time: '2024-01-15T15:50:00',
            event: '完成排程',
            type: 'success',
            details: '生产完成，共生产200件'
          }
        ]
      },
      {
        id: 2,
        scheduleCode: 'SCH240116002',
        moldId: 2,
        moldName: '产品B下模',
        productName: '手机中框',
        startDate: '2024-01-16T20:00:00',
        endDate: '2024-01-17T04:00:00',
        priority: 'medium',
        status: 'pending',
        operator: '李师傅',
        shift: 'night',
        note: '',
        createdAt: '2024-01-14T16:20:00',
        executionRecords: [
          {
            time: '2024-01-14T16:20:00',
            event: '创建排程',
            type: 'primary',
            details: '计划于1月16日夜班生产'
          }
        ]
      },
      {
        id: 3,
        scheduleCode: 'SCH240117003',
        moldId: 3,
        moldName: '产品C侧模',
        productName: '平板电脑边框',
        startDate: '2024-01-17T08:00:00',
        endDate: '2024-01-17T20:00:00',
        priority: 'urgent',
        status: 'pending',
        operator: '王师傅',
        shift: 'all_day',
        note: '加急订单，请优先安排',
        createdAt: '2024-01-15T14:10:00',
        executionRecords: [
          {
            time: '2024-01-15T14:10:00',
            event: '创建排程',
            type: 'primary',
            details: '加急订单，需全天生产'
          }
        ]
      },
      {
        id: 4,
        scheduleCode: 'SCH240118004',
        moldId: 4,
        moldName: '产品A下模',
        productName: '智能手表外壳',
        startDate: '2024-01-18T08:00:00',
        endDate: '2024-01-18T16:00:00',
        priority: 'medium',
        status: 'pending',
        operator: '赵师傅',
        shift: 'day',
        note: '与SCH240115001相同产品',
        createdAt: '2024-01-16T09:30:00',
        executionRecords: [
          {
            time: '2024-01-16T09:30:00',
            event: '创建排程',
            type: 'primary',
            details: '追加订单'
          }
        ]
      },
      {
        id: 5,
        scheduleCode: 'SCH240119005',
        moldId: 5,
        moldName: '产品D前模',
        productName: '笔记本电脑外壳',
        startDate: '2024-01-19T20:00:00',
        endDate: '2024-01-20T04:00:00',
        priority: 'low',
        status: 'pending',
        operator: '刘师傅',
        shift: 'night',
        note: '',
        createdAt: '2024-01-17T15:45:00',
        executionRecords: [
          {
            time: '2024-01-17T15:45:00',
            event: '创建排程',
            type: 'primary',
            details: '计划于1月19日夜班生产'
          }
        ]
      }
    ]
    loading.value = false
  }, 500)
}

// 刷新数据
const handleRefresh = () => {
  loadSchedules()
}

// 查看排程
const handleViewSchedule = (schedule) => {
  selectedSchedule.value = { ...schedule }
  detailDialogVisible.value = true
}

// 新增排程
const handleAddSchedule = () => {
  dialogType.value = 'add'
  Object.assign(formData, {
    scheduleCode: generateScheduleCode(),
    moldId: '',
    moldName: '',
    productName: '',
    startDate: '',
    endDate: '',
    priority: 'medium',
    status: 'pending',
    operator: '',
    shift: 'day',
    note: ''
  })
  dialogVisible.value = true
}

// 编辑排程
const handleEditSchedule = (schedule) => {
  dialogType.value = 'edit'
  selectedSchedule.value = { ...schedule }
  Object.assign(formData, {
    scheduleCode: schedule.scheduleCode,
    moldId: schedule.moldId,
    moldName: schedule.moldName,
    productName: schedule.productName,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    priority: schedule.priority,
    status: schedule.status,
    operator: schedule.operator,
    shift: schedule.shift,
    note: schedule.note
  })
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    // 查找模具信息
    const selectedMold = availableMolds.value.find(m => m.id === formData.moldId)
    if (selectedMold) {
      formData.moldName = selectedMold.name
    }
    
    if (dialogType.value === 'add') {
      // 新增记录
      const newSchedule = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        executionRecords: [
          {
            time: new Date().toISOString(),
            event: '创建排程',
            type: 'primary',
            details: formData.note || '新建排程'
          }
        ]
      }
      schedules.value.unshift(newSchedule)
      ElMessage.success('排程创建成功')
    } else {
      // 更新记录
      const index = schedules.value.findIndex(s => s.id === selectedSchedule.value.id)
      if (index !== -1) {
        schedules.value[index] = {
          ...schedules.value[index],
          ...formData
        }
        ElMessage.success('排程更新成功')
      }
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 开始排程
const handleStartSchedule = (schedule) => {
  ElMessageBox.confirm(
    `确定要开始执行排程 ${schedule.scheduleCode} 吗？`,
    '开始确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    const index = schedules.value.findIndex(s => s.id === schedule.id)
    if (index !== -1) {
      // 更新状态
      schedules.value[index].status = 'in_progress'
      // 添加执行记录
      schedules.value[index].executionRecords.push({
        time: new Date().toISOString(),
        event: '开始执行',
        type: 'info',
        details: `${schedule.operator}开始执行排程`
      })
      ElMessage.success('排程已开始执行')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 完成排程
const handleCompleteSchedule = (schedule) => {
  ElMessageBox.confirm(
    `确定要完成排程 ${schedule.scheduleCode} 吗？`,
    '完成确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    const index = schedules.value.findIndex(s => s.id === schedule.id)
    if (index !== -1) {
      // 更新状态
      schedules.value[index].status = 'completed'
      // 添加执行记录
      schedules.value[index].executionRecords.push({
        time: new Date().toISOString(),
        event: '完成排程',
        type: 'success',
        details: `${schedule.operator}完成排程`
      })
      ElMessage.success('排程已完成')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 取消排程
const handleCancelSchedule = (schedule) => {
  ElMessageBox.confirm(
    `确定要取消排程 ${schedule.scheduleCode} 吗？`,
    '取消确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = schedules.value.findIndex(s => s.id === schedule.id)
    if (index !== -1) {
      // 更新状态
      schedules.value[index].status = 'cancelled'
      // 添加执行记录
      schedules.value[index].executionRecords.push({
        time: new Date().toISOString(),
        event: '取消排程',
        type: 'danger',
        details: `排程已取消`
      })
      ElMessage.success('排程已取消')
    }
  }).catch(() => {
    // 取消操作
  })
}

// 批量导出
const handleBatchExport = () => {
  ElMessage.success('批量导出功能已触发')
}
</script>

<style scoped>
.mold-schedule {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28px;
  margin-right: 20px;
  color: white;
}

.stat-icon.primary {
  background-color: #409EFF;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.info {
  background-color: #909399;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-unit {
  font-size: 16px;
  color: #909399;
  margin-left: 5px;
  font-weight: normal;
}

.view-tabs {
  margin-bottom: 20px;
}

/* 日历视图样式 */
.calendar-view {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.calendar-header h3 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.calendar-grid {
  width: 100%;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  margin-bottom: 10px;
}

.weekday {
  text-align: center;
  padding: 10px;
  font-weight: bold;
  color: #606266;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.calendar-day {
  aspect-ratio: 1;
  min-height: 100px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.calendar-day:hover {
  border-color: #409EFF;
  background: #ecf5ff;
}

.calendar-day.other-month {
  background: #f5f7fa;
  color: #c0c4cc;
}

.calendar-day.today {
  border-color: #409EFF;
  background: #ecf5ff;
}

.calendar-day.today .day-number {
  color: #409EFF;
  font-weight: bold;
}

.day-number {
  font-size: 16px;
  margin-bottom: 8px;
}

.day-schedules {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  align-content: flex-start;
}

.schedule-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.schedule-dot.status-pending {
  background: #E6A23C;
}

.schedule-dot.status-in_progress {
  background: #909399;
}

.schedule-dot.status-completed {
  background: #67C23A;
}

.schedule-dot.status-cancelled {
  background: #F56C6C;
}

.more-schedules {
  font-size: 10px;
  color: #909399;
  margin-left: 2px;
}

/* 表格视图样式 */
.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  margin: 0;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 卡片视图样式 */
.schedule-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.schedule-item {
  height: 100%;
  transition: all 0.3s;
}

.schedule-item.status-pending:hover {
  border-color: #E6A23C;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.2);
}

.schedule-item.status-in_progress:hover {
  border-color: #909399;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.2);
}

.schedule-item.status-completed:hover {
  border-color: #67C23A;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.2);
}

.schedule-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.item-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.schedule-code {
  color: #909399;
  font-size: 14px;
}

.schedule-item-content {
  margin-bottom: 15px;
}

.info-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-row .label {
  width: 80px;
  color: #909399;
}

.info-row .value {
  flex: 1;
  color: #303133;
}

.schedule-item-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 详情页样式 */
.schedule-detail {
  padding: 10px 0;
}

.execution-records {
  margin-top: 30px;
}

.execution-records h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.timeline-content h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #303133;
}

.timeline-content p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 日期详情抽屉样式 */
.date-details h3 {
  margin: 0 0 20px 0;
  color: #303133;
}

.daily-schedule-item {
  margin-bottom: 15px;
}

.schedule-time {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 10px;
}

.schedule-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.schedule-info p {
  margin: 0 0 10px 0;
  color: #909399;
  font-size: 14px;
}

.schedule-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.schedule-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .schedule-list {
    grid-template-columns: 1fr;
  }
  
  .calendar-day {
    min-height: 80px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .calendar-days {
    font-size: 14px;
  }
  
  .calendar-day {
    min-height: 60px;
    padding: 4px;
  }
  
  .day-number {
    font-size: 14px;
  }
  
  .schedule-dot {
    width: 6px;
    height: 6px;
  }
  
  .info-row {
    flex-direction: column;
  }
  
  .info-row .label {
    width: auto;
  }
}
</style>