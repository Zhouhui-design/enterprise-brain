<template>
  <div class="hr-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>人力资源管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showEmployeeDialog = true">
          <i class="fas fa-user-plus"></i> 添加员工
        </el-button>
        <el-button @click="exportReport">
          <i class="fas fa-file-export"></i> 导出报表
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in statsData" :key="index">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <i :class="stat.icon"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-trend" :class="stat.trend">
                  <i :class="stat.trend === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card>
        <template #header>
          <span>快捷操作</span>
        </template>
        <div class="action-grid">
          <div class="action-item" @click="showAttendanceDialog = true">
            <i class="fas fa-clock"></i>
            <span>考勤管理</span>
          </div>
          <div class="action-item" @click="showSalaryDialog = true">
            <i class="fas fa-money-check-alt"></i>
            <span>薪资管理</span>
          </div>
          <div class="action-item" @click="showRecruitDialog = true">
            <i class="fas fa-user-tie"></i>
            <span>招聘管理</span>
          </div>
          <div class="action-item" @click="showTrainingDialog = true">
            <i class="fas fa-graduation-cap"></i>
            <span>培训管理</span>
          </div>
          <div class="action-item" @click="showPerformanceDialog = true">
            <i class="fas fa-chart-line"></i>
            <span>绩效管理</span>
          </div>
          <div class="action-item" @click="showLeaveDialog = true">
            <i class="fas fa-calendar-times"></i>
            <span>请假管理</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 员工列表 -->
    <div class="employee-section">
      <el-card>
        <template #header>
          <div class="section-header">
            <span>员工列表</span>
            <div class="header-controls">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索员工"
                prefix-icon="Search"
                size="small"
                style="width: 200px; margin-right: 10px"
                @input="handleSearch"
              />
              <el-select v-model="departmentFilter" placeholder="部门" size="small" style="width: 120px">
                <el-option label="全部" value="all" />
                <el-option label="技术部" value="tech" />
                <el-option label="销售部" value="sales" />
                <el-option label="人事部" value="hr" />
                <el-option label="财务部" value="finance" />
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table :data="filteredEmployees" v-loading="loading" stripe>
          <el-table-column prop="avatar" label="头像" width="80">
            <template #default="{ row }">
              <el-avatar :src="row.avatar" :size="40">
                {{ row.name.charAt(0) }}
              </el-avatar>
            </template>
          </el-table-column>
          <el-table-column prop="employeeId" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="department" label="部门" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getDepartmentLabel(row.department) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="position" label="职位" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="joinDate" label="入职时间" width="120" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column prop="email" label="邮箱" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewEmployee(row)">查看</el-button>
              <el-button size="small" type="primary" @click="editEmployee(row)">编辑</el-button>
              <el-dropdown @command="handleMoreAction" trigger="click">
                <el-button size="small">
                  更多<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'attendance', row }">考勤记录</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'salary', row }">薪资信息</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'performance', row }">绩效评估</el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'training', row }">培训记录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 部门分布图表 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>部门人员分布</span>
            </template>
            <div class="chart-container">
              <div class="department-chart">
                <div v-for="(dept, index) in departmentStats" :key="index" class="dept-item">
                  <div class="dept-info">
                    <span class="dept-name">{{ dept.name }}</span>
                    <span class="dept-count">{{ dept.count }}人</span>
                  </div>
                  <div class="dept-progress">
                    <el-progress
                      :percentage="(dept.count / maxDeptCount) * 100"
                      :stroke-width="8"
                      :show-text="false"
                      :color="dept.color"
                    />
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>人员状态分布</span>
            </template>
            <div class="chart-container">
              <el-progress
                type="circle"
                :percentage="employeeStatus.active"
                :width="150"
                :color="['#67C23A', '#E6A23C', '#F56C6C']"
              >
                <div class="progress-inner">
                  <div class="progress-number">{{ employeeStats.active }}</div>
                  <div class="progress-label">在职</div>
                </div>
              </el-progress>
              <div class="status-legend">
                <div class="legend-item">
                  <div class="legend-color active"></div>
                  <span>在职: {{ employeeStats.active }}</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color leave"></div>
                  <span>请假: {{ employeeStats.leave }}</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color quit"></div>
                  <span>离职: {{ employeeStats.quit }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 添加员工对话框 -->
    <el-dialog
      v-model="showEmployeeDialog"
      title="添加员工"
      width="600px"
      @close="resetEmployeeForm"
    >
      <el-form :model="employeeForm" :rules="employeeRules" ref="employeeFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="employeeForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工号" prop="employeeId">
              <el-input v-model="employeeForm.employeeId" placeholder="请输入工号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-select v-model="employeeForm.department" placeholder="请选择部门" style="width: 100%">
                <el-option label="技术部" value="tech" />
                <el-option label="销售部" value="sales" />
                <el-option label="人事部" value="hr" />
                <el-option label="财务部" value="finance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="职位" prop="position">
              <el-input v-model="employeeForm.position" placeholder="请输入职位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="employeeForm.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="employeeForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="入职日期" prop="joinDate">
          <el-date-picker
            v-model="employeeForm.joinDate"
            type="date"
            placeholder="选择入职日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEmployeeDialog = false">取消</el-button>
          <el-button type="primary" @click="saveEmployee" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Employee {
  id: string
  employeeId: string
  name: string
  department: string
  position: string
  status: string
  joinDate: string
  phone: string
  email: string
  avatar?: string
}

interface Department {
  name: string
  count: number
  color: string
}

const loading = ref(false)
const saving = ref(false)
const showEmployeeDialog = ref(false)
const showAttendanceDialog = ref(false)
const showSalaryDialog = ref(false)
const showRecruitDialog = ref(false)
const showTrainingDialog = ref(false)
const showPerformanceDialog = ref(false)
const showLeaveDialog = ref(false)
const searchKeyword = ref('')
const departmentFilter = ref('all')

const employeeForm = reactive({
  name: '',
  employeeId: '',
  department: '',
  position: '',
  phone: '',
  email: '',
  joinDate: ''
})

const employeeRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  employeeId: [
    { required: true, message: '请输入工号', trigger: 'blur' }
  ],
  department: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  position: [
    { required: true, message: '请输入职位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  joinDate: [
    { required: true, message: '请选择入职日期', trigger: 'change' }
  ]
}

const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

const statsData = reactive([
  { label: '总员工数', value: '156', icon: 'fas fa-users', color: '#409EFF', trend: 'up', change: '12' },
  { label: '在职员工', value: '142', icon: 'fas fa-user-check', color: '#67C23A', trend: 'up', change: '8' },
  { label: '请假人员', value: '8', icon: 'fas fa-calendar-alt', color: '#E6A23C', trend: 'down', change: '3' },
  { label: '本月入职', value: '6', icon: 'fas fa-user-plus', color: '#F56C6C', trend: 'up', change: '6' }
])

const departmentStats = reactive<Department[]>([
  { name: '技术部', count: 45, color: '#409EFF' },
  { name: '销售部', count: 38, color: '#67C23A' },
  { name: '人事部', count: 12, color: '#E6A23C' },
  { name: '财务部', count: 18, color: '#F56C6C' },
  { name: '运营部', count: 28, color: '#909399' },
  { name: '行政部', count: 15, color: '#606266' }
])

const employeeStats = reactive({
  active: 142,
  leave: 8,
  quit: 6
})

const employeeStatus = computed(() => {
  const total = employeeStats.active + employeeStats.leave + employeeStats.quit
  return {
    active: Math.round((employeeStats.active / total) * 100),
    leave: Math.round((employeeStats.leave / total) * 100),
    quit: Math.round((employeeStats.quit / total) * 100)
  }
})

const maxDeptCount = computed(() => Math.max(...departmentStats.map(dept => dept.count)))

const employees = ref<Employee[]>([
  {
    id: '1',
    employeeId: 'EMP001',
    name: '张三',
    department: 'tech',
    position: '前端开发工程师',
    status: 'active',
    joinDate: '2023-01-15',
    phone: '13800138001',
    email: 'zhangsan@company.com'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    name: '李四',
    department: 'sales',
    position: '销售经理',
    status: 'active',
    joinDate: '2022-08-20',
    phone: '13800138002',
    email: 'lisi@company.com'
  }
])

const filteredEmployees = computed(() => {
  let result = employees.value
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(emp => 
      emp.name.toLowerCase().includes(keyword) ||
      emp.employeeId.toLowerCase().includes(keyword) ||
      emp.phone.includes(keyword) ||
      emp.email.toLowerCase().includes(keyword)
    )
  }
  
  // 按部门筛选
  if (departmentFilter.value !== 'all') {
    result = result.filter(emp => emp.department === departmentFilter.value)
  }
  
  pagination.total = result.length
  return result
})

const getDepartmentLabel = (department: string) => {
  const deptMap: Record<string, string> = {
    tech: '技术部',
    sales: '销售部',
    hr: '人事部',
    finance: '财务部',
    operations: '运营部',
    admin: '行政部'
  }
  return deptMap[department] || department
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    active: '在职',
    leave: '请假',
    quit: '离职'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    active: 'success',
    leave: 'warning',
    quit: 'danger'
  }
  return statusMap[status] || ''
}

const handleSearch = () => {
  pagination.currentPage = 1
}

const handleSizeChange = (val: number) => {
  pagination.pageSize = val
}

const handleCurrentChange = (val: number) => {
  pagination.currentPage = val
}

const viewEmployee = (employee: Employee) => {
  ElMessage.info(`查看员工: ${employee.name}`)
}

const editEmployee = (employee: Employee) => {
  ElMessage.info(`编辑员工: ${employee.name}`)
}

const handleMoreAction = ({ action, row }: { action: string; row: Employee }) => {
  const actionMessages: Record<string, string> = {
    attendance: `查看考勤记录: ${row.name}`,
    salary: `查看薪资信息: ${row.name}`,
    performance: `查看绩效评估: ${row.name}`,
    training: `查看培训记录: ${row.name}`
  }
  ElMessage.info(actionMessages[action] || '操作开发中')
}

const saveEmployee = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    saving.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    employees.value.push({
      id: String(employees.value.length + 1),
      ...employeeForm,
      status: 'active'
    })
    
    ElMessage.success('员工添加成功')
    showEmployeeDialog.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetEmployeeForm = () => {
  Object.assign(employeeForm, {
    name: '',
    employeeId: '',
    department: '',
    position: '',
    phone: '',
    email: '',
    joinDate: ''
  })
}

const exportReport = () => {
  ElMessage.success('报表导出功能开发中')
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.hr-dashboard {
  padding: 20px;
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
  gap: 12px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.stat-icon i {
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-trend {
  font-size: 12px;
  margin-top: 3px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.action-item i {
  font-size: 24px;
  color: #409eff;
  margin-bottom: 8px;
}

.action-item span {
  font-size: 14px;
  color: #606266;
}

.employee-section,
.charts-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.chart-container {
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.department-chart {
  width: 100%;
  padding: 0 20px;
}

.dept-item {
  margin-bottom: 15px;
}

.dept-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.dept-name {
  font-weight: 500;
  color: #303133;
}

.dept-count {
  color: #606266;
  font-size: 12px;
}

.dept-progress {
  margin-top: 5px;
}

.progress-inner {
  text-align: center;
}

.progress-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.progress-label {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.status-legend {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.active {
  background-color: #67C23A;
}

.legend-color.leave {
  background-color: #E6A23C;
}

.legend-color.quit {
  background-color: #F56C6C;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .el-col-6 {
    margin-bottom: 15px;
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>