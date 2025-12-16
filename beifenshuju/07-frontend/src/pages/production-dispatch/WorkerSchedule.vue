<template>
  <div class="worker-schedule-container">
    <div class="page-header">
      <h2>工人排班管理</h2>
      <el-button type="primary" @click="handleImportSchedule" icon="Upload">
        导入排班
      </el-button>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-filter">
      <el-form :inline="true" :model="searchForm" class="mb-4">
        <el-form-item label="工人姓名">
          <el-input v-model="searchForm.workerName" placeholder="请输入工人姓名" clearable />
        </el-form-item>
        <el-form-item label="工作中心">
          <el-select v-model="searchForm.workCenter" placeholder="请选择工作中心" clearable>
            <el-option label="生产车间A" value="A" />
            <el-option label="生产车间B" value="B" />
            <el-option label="质检车间" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="排班日期">
          <el-date-picker
            v-model="searchForm.scheduleDate"
            type="date"
            placeholder="选择日期"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="Search">
            搜索
          </el-button>
          <el-button @click="handleReset" icon="RefreshRight">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 日历视图 -->
    <el-card class="mb-4">
      <template #header>
        <div class="card-header">
          <span>排班日历</span>
          <el-date-picker
            v-model="currentMonth"
            type="month"
            @change="handleMonthChange"
            style="width: 200px"
          />
        </div>
      </template>
      
      <div class="calendar-container">
        <div class="calendar-header">
          <div class="calendar-weekday" v-for="day in weekDays" :key="day">{{ day }}</div>
        </div>
        <div class="calendar-body">
          <div class="calendar-row" v-for="(week, weekIndex) in calendarDays" :key="weekIndex">
            <div
              v-for="(day, dayIndex) in week"
              :key="dayIndex"
              class="calendar-day"
              :class="{
                'other-month': !day.isCurrentMonth,
                'current-day': day.isCurrentDay,
                'has-schedule': day.schedules && day.schedules.length > 0
              }"
              @click="handleDayClick(day)"
            >
              <span class="day-number">{{ day.date }}</span>
              <div class="schedule-tags">
                <el-tag
                  v-for="schedule in day.schedules"
                  :key="schedule.id"
                  size="small"
                  :type="getScheduleTagType(schedule.status)"
                  :effect="schedule.status === 'confirmed' ? 'dark' : 'plain'"
                >
                  {{ schedule.workCenter }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 排班列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ selectedDate ? `${selectedDate} 排班明细` : '排班明细' }}</span>
          <el-button type="primary" @click="handleAddSchedule" icon="Plus">
            添加排班
          </el-button>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="scheduleList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="workerCode" label="工人编号" width="120" />
        <el-table-column prop="workerName" label="工人姓名" min-width="120" />
        <el-table-column prop="workCenter" label="工作中心" width="120" />
        <el-table-column prop="scheduleDate" label="排班日期" width="150" />
        <el-table-column prop="shiftType" label="班次" width="100">
          <template #default="scope">
            <el-tag
              :type="getShiftTypeTagType(scope.row.shiftType)"
            >
              {{ getShiftTypeLabel(scope.row.shiftType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="120" />
        <el-table-column prop="endTime" label="结束时间" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag
              :type="getScheduleTagType(scope.row.status)"
              :effect="scope.row.status === 'confirmed' ? 'dark' : 'plain'"
            >
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              size="small"
              @click="handleEditSchedule(scope.row)"
              icon="Edit"
              :disabled="scope.row.status === 'confirmed' || scope.row.status === 'completed'"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteSchedule(scope.row)"
              icon="Delete"
              :disabled="scope.row.status !== 'draft'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑排班对话框 -->
    <el-dialog
      v-model="scheduleDialogVisible"
      :title="isEditSchedule ? '编辑排班' : '添加排班'"
      width="600px"
    >
      <el-form ref="scheduleFormRef" :model="scheduleForm" :rules="scheduleRules" label-width="120px">
        <el-form-item label="选择工人" prop="workerId">
          <WorkerSelector v-model="scheduleForm.workerId" />
        </el-form-item>
        
        <el-form-item label="工作中心" prop="workCenter">
          <el-select v-model="scheduleForm.workCenter" placeholder="请选择工作中心">
            <el-option label="生产车间A" value="A" />
            <el-option label="生产车间B" value="B" />
            <el-option label="质检车间" value="C" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排班日期" prop="scheduleDate">
          <el-date-picker
            v-model="scheduleForm.scheduleDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="班次" prop="shiftType">
          <el-select v-model="scheduleForm.shiftType" placeholder="请选择班次">
            <el-option label="早班" value="morning" />
            <el-option label="中班" value="afternoon" />
            <el-option label="晚班" value="night" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-time-picker
            v-model="scheduleForm.startTime"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="endTime">
          <el-time-picker
            v-model="scheduleForm.endTime"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="scheduleForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="scheduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSchedule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import WorkerSelector from './components/WorkerSelector.vue';

export default {
  name: 'WorkerSchedule',
  components: {
    WorkerSelector
  },
  setup() {
    const loading = ref(false);
    const scheduleDialogVisible = ref(false);
    const isEditSchedule = ref(false);
    const scheduleFormRef = ref(null);
    const selectedRows = ref([]);
    const selectedDate = ref('');
    const currentMonth = ref(new Date());
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    // 搜索表单
    const searchForm = reactive({
      workerName: '',
      workCenter: '',
      scheduleDate: ''
    });
    
    // 排班列表
    const scheduleList = ref([
      {
        id: '1',
        workerId: '1',
        workerCode: 'WK001',
        workerName: '张三',
        workCenter: 'A',
        scheduleDate: '2024-04-20',
        shiftType: 'morning',
        startTime: '08:00',
        endTime: '16:00',
        status: 'confirmed'
      },
      {
        id: '2',
        workerId: '2',
        workerCode: 'WK002',
        workerName: '李四',
        workCenter: 'B',
        scheduleDate: '2024-04-20',
        shiftType: 'afternoon',
        startTime: '16:00',
        endTime: '24:00',
        status: 'confirmed'
      },
      {
        id: '3',
        workerId: '3',
        workerCode: 'WK003',
        workerName: '王五',
        workCenter: 'A',
        scheduleDate: '2024-04-21',
        shiftType: 'night',
        startTime: '00:00',
        endTime: '08:00',
        status: 'draft'
      }
    ]);
    
    // 排班表单
    const scheduleForm = reactive({
      id: '',
      workerId: '',
      workCenter: '',
      scheduleDate: new Date(),
      shiftType: 'morning',
      startTime: '',
      endTime: '',
      remark: ''
    });
    
    // 表单验证规则
    const scheduleRules = {
      workerId: [
        { required: true, message: '请选择工人', trigger: 'blur' }
      ],
      workCenter: [
        { required: true, message: '请选择工作中心', trigger: 'blur' }
      ],
      scheduleDate: [
        { required: true, message: '请选择排班日期', trigger: 'change' }
      ],
      shiftType: [
        { required: true, message: '请选择班次', trigger: 'change' }
      ],
      startTime: [
        { required: true, message: '请选择开始时间', trigger: 'change' }
      ],
      endTime: [
        { required: true, message: '请选择结束时间', trigger: 'change' },
        {
          validator: (rule, value, callback) => {
            if (value && scheduleForm.startTime && value <= scheduleForm.startTime) {
              callback(new Error('结束时间必须晚于开始时间'));
            } else {
              callback();
            }
          },
          trigger: 'change'
        }
      ]
    };
    
    // 生成日历数据
    const calendarDays = computed(() => {
      const year = currentMonth.value.getFullYear();
      const month = currentMonth.value.getMonth();
      const today = new Date();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const firstDayWeek = firstDay.getDay();
      
      const calendar = [];
      let week = [];
      
      // 填充上个月的日期
      for (let i = firstDayWeek - 1; i >= 0; i--) {
        const prevMonthDay = new Date(year, month, -i);
        week.push({
          date: prevMonthDay.getDate(),
          isCurrentMonth: false,
          isCurrentDay: false,
          schedules: []
        });
      }
      
      // 填充当月的日期
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const daySchedules = scheduleList.value.filter(s => s.scheduleDate === dateStr);
        
        week.push({
          date: day,
          isCurrentMonth: true,
          isCurrentDay: currentDate.toDateString() === today.toDateString(),
          schedules: daySchedules
        });
        
        if (week.length === 7) {
          calendar.push([...week]);
          week = [];
        }
      }
      
      // 填充下个月的日期
      if (week.length > 0) {
        const remainingDays = 7 - week.length;
        for (let i = 1; i <= remainingDays; i++) {
          week.push({
            date: i,
            isCurrentMonth: false,
            isCurrentDay: false,
            schedules: []
          });
        }
        calendar.push(week);
      }
      
      return calendar;
    });
    
    // 获取班次标签类型
    const getShiftTypeTagType = (shiftType) => {
      const shiftTypeMap = {
        morning: 'primary',
        afternoon: 'success',
        night: 'warning'
      };
      return shiftTypeMap[shiftType] || 'info';
    };
    
    // 获取班次标签文本
    const getShiftTypeLabel = (shiftType) => {
      const shiftTypeMap = {
        morning: '早班',
        afternoon: '中班',
        night: '晚班'
      };
      return shiftTypeMap[shiftType] || shiftType;
    };
    
    // 获取排班状态标签类型
    const getScheduleTagType = (status) => {
      const statusMap = {
        draft: 'info',
        confirmed: 'success',
        completed: 'primary',
        cancelled: 'danger'
      };
      return statusMap[status] || 'info';
    };
    
    // 获取状态标签文本
    const getStatusLabel = (status) => {
      const statusMap = {
        draft: '草稿',
        confirmed: '已确认',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || status;
    };
    
    // 搜索
    const handleSearch = () => {
      // 实际项目中应该调用API搜索
      console.log('搜索条件:', searchForm);
    };
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        workerName: '',
        workCenter: '',
        scheduleDate: ''
      });
    };
    
    // 月份变化
    const handleMonthChange = () => {
      // 重新加载对应月份的数据
    };
    
    // 日期点击
    const handleDayClick = (day) => {
      if (day.isCurrentMonth) {
        const year = currentMonth.value.getFullYear();
        const month = currentMonth.value.getMonth();
        selectedDate.value = `${year}-${String(month + 1).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
        // 这里可以根据选中的日期筛选排班列表
      }
    };
    
    // 添加排班
    const handleAddSchedule = () => {
      isEditSchedule.value = false;
      Object.assign(scheduleForm, {
        id: '',
        workerId: '',
        workCenter: '',
        scheduleDate: new Date(),
        shiftType: 'morning',
        startTime: '',
        endTime: '',
        remark: ''
      });
      scheduleDialogVisible.value = true;
    };
    
    // 编辑排班
    const handleEditSchedule = (row) => {
      isEditSchedule.value = true;
      Object.assign(scheduleForm, {
        id: row.id,
        workerId: row.workerId,
        workCenter: row.workCenter,
        scheduleDate: new Date(row.scheduleDate),
        shiftType: row.shiftType,
        startTime: row.startTime,
        endTime: row.endTime,
        remark: row.remark || ''
      });
      scheduleDialogVisible.value = true;
    };
    
    // 删除排班
    const handleDeleteSchedule = (row) => {
      ElMessageBox.confirm('确定要删除该排班吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = scheduleList.value.findIndex(item => item.id === row.id);
        if (index > -1) {
          scheduleList.value.splice(index, 1);
        }
        ElMessage.success('删除成功');
      }).catch(() => {
        // 取消操作
      });
    };
    
    // 保存排班