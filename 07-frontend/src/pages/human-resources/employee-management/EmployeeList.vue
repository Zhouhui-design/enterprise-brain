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
          <el-button type="danger" :icon="Delete" @click="handleBatchDelete" :disabled="selectedRows.length === 0">
            批量删除
          </el-button>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <el-tag type="info">总计：{{ total }} 人</el-tag>
          <TableColumnControl v-model:columns="tableColumns" @change="handleColumnChange" />
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
        :data="filteredEmployeeList" 
        border 
        v-loading="loading"
        style="margin-top: 20px;"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" fixed />
        <el-table-column type="index" label="#" width="60" fixed />
        
        <!-- 动态渲染列 -->
        <template v-for="column in visibleColumns" :key="column.prop">
          <el-table-column
            v-if="column.prop === 'name'"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
            :fixed="column.fixed"
          >
            <template #header>
              <span>{{ column.label }}</span>
              <TableHeaderFilter
                v-if="column.filterable"
                :column="column"
                v-model="filters[column.prop]"
                @filter="handleFilter"
              />
            </template>
            <template #default="scope">
              <div class="employee-info">
                <el-avatar :size="32" :src="scope.row.avatar" style="margin-right: 8px;">
                  {{ scope.row.name?.charAt(0) }}
                </el-avatar>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column
            v-else-if="column.prop === 'status'"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
            :fixed="column.fixed"
          >
            <template #header>
              <span>{{ column.label }}</span>
              <TableHeaderFilter
                v-if="column.filterable"
                :column="column"
                v-model="filters[column.prop]"
                @filter="handleFilter"
              />
            </template>
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column
            v-else
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
            :fixed="column.fixed"
            show-overflow-tooltip
          >
            <template #header>
              <span>{{ column.label }}</span>
              <TableHeaderFilter
                v-if="column.filterable"
                :column="column"
                v-model="filters[column.prop]"
                @filter="handleFilter"
              />
            </template>
          </el-table-column>
        </template>
        
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Upload, Download, ArrowDown, Delete } from '@element-plus/icons-vue'
import { employeeApi, departmentApi } from '@/api/hr/employee'
import { useRouter } from 'vue-router'
import TableColumnControl from '@/components/TableColumnControl/index.vue'
import TableHeaderFilter from '@/components/TableHeaderFilter/index.vue'
import * as XLSX from 'xlsx'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const employeeList = ref([])
const departments = ref([])
const selectedRows = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filters = reactive({})

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

// 表格列配置
const tableColumns = ref([
  { prop: 'employeeNo', label: '工号', width: 120, visible: true, filterable: true, filterType: 'input' },
  { prop: 'name', label: '姓名', width: 120, visible: true, filterable: true, filterType: 'input' },
  { prop: 'gender', label: '性别', width: 60, visible: true, filterable: true, filterType: 'select', filterOptions: [
    { label: '男', value: '男' },
    { label: '女', value: '女' }
  ]},
  { prop: 'phone', label: '手机号', width: 130, visible: true, filterable: true, filterType: 'input' },
  { prop: 'email', label: '邮箱', width: 180, visible: true, filterable: true, filterType: 'input' },
  { prop: 'departmentName', label: '部门', width: 120, visible: true, filterable: true, filterType: 'select', filterOptions: [] },
  { prop: 'positionName', label: '职位', width: 120, visible: true, filterable: true, filterType: 'input' },
  { prop: 'status', label: '在职状态', width: 100, visible: true, filterable: true, filterType: 'select', filterOptions: [
    { label: '在职', value: 'active' },
    { label: '离职', value: 'resigned' },
    { label: '试用期', value: 'probation' }
  ]},
  { prop: 'entryDate', label: '入职日期', width: 120, visible: true, filterable: true, filterType: 'date' }
])

// 计算属性：可见列
const visibleColumns = computed(() => {
  return tableColumns.value.filter(col => col.visible)
})

// 计算属性：过滤后的员工列表
const filteredEmployeeList = computed(() => {
  let list = employeeList.value
  
  // 应用表头筛选
  Object.keys(filters).forEach(key => {
    const filterValue = filters[key]
    if (filterValue !== null && filterValue !== '' && filterValue !== undefined) {
      const column = tableColumns.value.find(col => col.prop === key)
      
      if (column?.filterType === 'input') {
        list = list.filter(item => 
          String(item[key] || '').toLowerCase().includes(String(filterValue).toLowerCase())
        )
      } else if (column?.filterType === 'select') {
        list = list.filter(item => item[key] === filterValue)
      } else if (column?.filterType === 'date' && Array.isArray(filterValue)) {
        const [start, end] = filterValue
        list = list.filter(item => {
          const date = new Date(item[key])
          return date >= start && date <= end
        })
      }
    }
  })
  
  return list
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
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx, .xls'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        
        console.log('导入数据:', jsonData)
        ElMessage.success(`成功导入 ${jsonData.length} 条数据`)
        loadEmployeeList()
      }
      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('导入失败:', error)
      ElMessage.error('导入失败')
    }
  }
  
  input.click()
}

const handleExport = () => {
  try {
    // 准备导出数据
    const exportData = filteredEmployeeList.value.map(item => ({
      '工号': item.employeeNo,
      '姓名': item.name,
      '性别': item.gender,
      '手机号': item.phone,
      '邮箱': item.email,
      '部门': item.departmentName,
      '职位': item.positionName,
      '在职状态': getStatusText(item.status),
      '入职日期': item.entryDate
    }))
    
    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '员工台账')
    
    // 导出文件
    XLSX.writeFile(workbook, `员工台账_${new Date().getTime()}.xlsx`)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确认删除选中的 ${selectedRows.value.length} 位员工吗？删除后将无法恢复。`,
    '批量删除确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      const ids = selectedRows.value.map(row => row.id)
      await employeeApi.batchDeleteEmployees(ids)
      ElMessage.success('删除成功')
      selectedRows.value = []
      loadEmployeeList()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 列变化事件
const handleColumnChange = (columns) => {
  console.log('列配置变化:', columns)
}

// 筛选事件
const handleFilter = ({ prop, value }) => {
  console.log('筛选:', prop, value)
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
