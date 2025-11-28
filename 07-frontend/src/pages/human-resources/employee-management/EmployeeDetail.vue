<template>
  <div class="employee-detail-container">
    <el-page-header content="员工详情" @back="$router.back()" />
    
    <el-card class="main-card" shadow="hover" v-loading="loading">
      <el-tabs v-model="activeTab">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <PersonalInfo :employee="employee" @refresh="loadEmployeeDetail" />
        </el-tab-pane>

        <!-- 工作信息 -->
        <el-tab-pane label="工作信息" name="work">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工号">{{ employee.employeeNo }}</el-descriptions-item>
            <el-descriptions-item label="入职日期">{{ employee.entryDate }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ employee.departmentName }}</el-descriptions-item>
            <el-descriptions-item label="职位">{{ employee.positionName }}</el-descriptions-item>
            <el-descriptions-item label="在职状态">
              <el-tag :type="getStatusType(employee.status)">{{ getStatusText(employee.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="工作年限">{{ employee.workYears }} 年</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <!-- 履历记录 -->
        <el-tab-pane label="履历记录" name="history">
          <EmploymentHistory :employeeId="employee.id" />
        </el-tab-pane>

        <!-- 薪资信息 -->
        <el-tab-pane label="薪资信息" name="salary">
          <el-table :data="salaryList" border>
            <el-table-column prop="month" label="月份" width="120" />
            <el-table-column prop="baseSalary" label="基本工资" />
            <el-table-column prop="positionSalary" label="岗位工资" />
            <el-table-column prop="performanceSalary" label="绩效工资" />
            <el-table-column prop="totalSalary" label="应发工资" />
            <el-table-column prop="actualSalary" label="实发工资" />
          </el-table>
        </el-tab-pane>

        <!-- 绩效考核 -->
        <el-tab-pane label="绩效考核" name="performance">
          <el-table :data="performanceList" border>
            <el-table-column prop="period" label="考核周期" />
            <el-table-column prop="score" label="考核分数" />
            <el-table-column prop="level" label="考核等级" />
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { employeeApi } from '@/api/hr/employee'
import PersonalInfo from './components/PersonalInfo.vue'
import EmploymentHistory from './components/EmploymentHistory.vue'

const route = useRoute()
const loading = ref(false)
const activeTab = ref('basic')
const employee = ref({})
const salaryList = ref([])
const performanceList = ref([])

const loadEmployeeDetail = async () => {
  loading.value = true
  try {
    const res = await employeeApi.getEmployeeDetail(route.query.id)
    employee.value = res.data || mockEmployeeData()
  } catch (error) {
    employee.value = mockEmployeeData()
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const map = { active: 'success', probation: 'warning', resigned: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { active: '在职', probation: '试用期', resigned: '离职' }
  return map[status] || '未知'
}

const mockEmployeeData = () => ({
  id: 1,
  employeeNo: 'EMP001',
  name: '张三',
  gender: '男',
  phone: '13800138000',
  email: 'zhangsan@company.com',
  departmentName: '研发部',
  positionName: '高级工程师',
  status: 'active',
  entryDate: '2020-01-15',
  workYears: 4
})

onMounted(() => {
  loadEmployeeDetail()
})
</script>

<style scoped>
.employee-detail-container {
  padding: 20px;
}

.main-card {
  margin-top: 20px;
}
</style>
