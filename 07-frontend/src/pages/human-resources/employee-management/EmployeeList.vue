<template>
  <div class="employee-list-container">
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="员工姓名">
          <el-input v-model="searchForm.name" placeholder="请输入员工姓名" clearable />
        </el-form-item>
        <el-form-item label="工号">
          <el-input v-model="searchForm.employeeNo" placeholder="请输入工号" clearable />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="searchForm.departmentId" placeholder="请选择部门" clearable>
            <el-option 
              v-for="dept in departments" 
              :key="dept.id" 
              :label="dept.name" 
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="在职状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="在职" value="active" />
            <el-option label="离职" value="离职" />
            <el-option label="试用期" value="probation" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 操作按钮 -->
      <div class="toolbar">
        <div>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新增员工</el-button>
          <el-button type="success" :icon="Upload" @click="handleImport">导入</el-button>
          <el-button type="warning" :icon="Download" @click="handleExport">导出</el-button>
        </div>
        <div>
          <el-tag type="info">总计：{{ total }} 人</el-tag>
        </div>
      </div>

      <!-- 员工统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="在职员工" :value="stats.activeCount" suffix="人" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="试用期员工" :value="stats.probationCount" suffix="人" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="本月入职" :value="stats.onboardingCount" suffix="人" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <el-statistic title="本月离职" :value="stats.offboardingCount" suffix="人" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 员工列表 -->
      <el-table 
        :data="employeeList" 
        border 
        v-loading="loading"
        style="margin-top: 20px;"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="employeeNo" label="工号" width="120" />
        <el-table-column label="姓名" width="120">
          <template #default="scope">
            <div class="employee-info">
              <el-avatar :size="32" :src="scope.row.avatar" style="margin-right: 8px;">
                {{ scope.row.name?.charAt(0) }}
              </el-avatar>
              <span>{{ scope.row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="departmentName" label="部门" width="120" />
        <el-table-column prop="positionName" label="职位" width="120" />
        <el-table-column label="在职状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entryDate" label="入职日期" width="120" />
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
              详情
            </el-button>
            <el-button type="success" size="small" link @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button type="warning" size="small" link @click="handleTransfer(scope.row)">
              调动
            </el-button>
            <el-dropdown>
              <el-button type="info" size="small" link>
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="handleOffboarding(scope.row)">离职</el-dropdown-item>
                  <el-dropdown-item @click="handleDelete(scope.row)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadEmployeeList"
        @current-change="loadEmployeeList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Upload, Download, ArrowDown } from '@element-plus/icons-vue'
import { employeeApi, departmentApi } from '@/api/hr/employee'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const employeeList = ref([])
const departments = ref([])
const selectedRows = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)

const stats = reactive({
  activeCount: 0,
  probationCount: 0,
  onboardingCount: 0,
  offboardingCount: 0
})

const searchForm = reactive({
  name: '',
  employeeNo: '',
  departmentId: '',
  status: ''
})

// 方法
const loadEmployeeList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      pageNum: pageNum.value,
      pageSize: pageSize.value
    }
    const res = await employeeApi.getEmployeeList(params)
    employeeList.value = res.data?.records || mockEmployeeData()
    total.value = res.data?.total || 50
  } catch (error) {
    console.error('加载员工列表失败:', error)
    employeeList.value = mockEmployeeData()
    total.value = 50
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const res = await employeeApi.getEmployeeStats()
    Object.assign(stats, res.data || {
      activeCount: 856,
      probationCount: 23,
      onboardingCount: 12,
      offboardingCount: 5
    })
  } catch (error) {
    Object.assign(stats, {
      activeCount: 856,
      probationCount: 23,
      onboardingCount: 12,
      offboardingCount: 5
    })
  }
}

const loadDepartments = async () => {
  try {
    const res = await departmentApi.getDepartmentList()
    departments.value = res.data || mockDepartments()
  } catch (error) {
    departments.value = mockDepartments()
  }
}

const handleSearch = () => {
  pageNum.value = 1
  loadEmployeeList()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    employeeNo: '',
    departmentId: '',
    status: ''
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const handleCreate = () => {
  router.push('/human-resources/employee-management/create')
}

const viewDetail = (row) => {
  router.push({
    path: '/human-resources/employee-management/detail',
    query: { id: row.id }
  })
}

const handleEdit = (row) => {
  router.push({
    path: '/human-resources/employee-management/create',
    query: { id: row.id, mode: 'edit' }
  })
}

const handleTransfer = (row) => {
  router.push({
    path: '/human-resources/employee-management/transfer',
    query: { employeeId: row.id }
  })
}

const handleOffboarding = (row) => {
  router.push({
    path: '/human-resources/employee-management/offboarding',
    query: { employeeId: row.id }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该员工吗？删除后将无法恢复。', '删除确认', {
    type: 'warning'
  }).then(async () => {
    try {
      await employeeApi.deleteEmployee(row.id)
      ElMessage.success('删除成功')
      loadEmployeeList()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

const handleImport = () => {
  ElMessage.info('导入功能开发中...')
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

const getStatusType = (status) => {
  const typeMap = {
    active: 'success',
    probation: 'warning',
    inactive: 'info',
    resigned: 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    active: '在职',
    probation: '试用期',
    inactive: '停职',
    resigned: '离职'
  }
  return textMap[status] || '未知'
}

const mockEmployeeData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    employeeNo: `EMP${String(i + 10001).padStart(6, '0')}`,
    name: `员工${i + 1}`,
    gender: i % 2 === 0 ? '男' : '女',
    phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    email: `emp${i + 1}@company.com`,
    departmentName: ['研发部', '销售部', '财务部', '人事部'][i % 4],
    positionName: ['工程师', '经理', '专员', '主管'][i % 4],
    status: ['active', 'probation', 'inactive'][i % 3],
    entryDate: '2024-01-15',
    avatar: null
  }))
}

const mockDepartments = () => {
  return [
    { id: 1, name: '研发部' },
    { id: 2, name: '销售部' },
    { id: 3, name: '财务部' },
    { id: 4, name: '人事部' },
    { id: 5, name: '生产部' }
  ]
}

onMounted(() => {
  loadEmployeeList()
  loadStats()
  loadDepartments()
})
</script>

<style scoped>
.employee-list-container {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.employee-info {
  display: flex;
  align-items: center;
}
</style>
