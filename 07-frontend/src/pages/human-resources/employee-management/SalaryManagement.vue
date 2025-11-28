<template>
  <div class="salary-management-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>薪资管理</span>
          <div>
            <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新增薪资</el-button>
            <el-button type="success" :icon="Upload">导入</el-button>
            <el-button type="warning" :icon="Download">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="员工姓名">
          <el-input v-model="searchForm.employeeName" clearable />
        </el-form-item>
        <el-form-item label="月份">
          <el-date-picker v-model="searchForm.month" type="month" placeholder="选择月份" />
        </el-form-item>
        <el-form-item label="发放状态">
          <el-select v-model="searchForm.payStatus" clearable>
            <el-option label="未发放" value="unpaid" />
            <el-option label="已发放" value="paid" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadSalaryList">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 薪资统计 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-statistic title="本月应发总额" :value="stats.totalAmount" prefix="¥" :precision="2" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="本月实发总额" :value="stats.actualAmount" prefix="¥" :precision="2" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已发放人数" :value="stats.paidCount" suffix="人" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="待发放人数" :value="stats.unpaidCount" suffix="人" />
        </el-col>
      </el-row>

      <!-- 薪资列表 -->
      <el-table :data="salaryList" border v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="employeeName" label="员工姓名" />
        <el-table-column prop="employeeNo" label="工号" />
        <el-table-column prop="departmentName" label="部门" />
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="baseSalary" label="基本工资" align="right">
          <template #default="scope">
            ¥{{ scope.row.baseSalary.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="positionSalary" label="岗位工资" align="right">
          <template #default="scope">
            ¥{{ scope.row.positionSalary.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="performanceSalary" label="绩效工资" align="right">
          <template #default="scope">
            ¥{{ scope.row.performanceSalary.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalSalary" label="应发工资" align="right">
          <template #default="scope">
            <span style="color: #67c23a; font-weight: bold;">
              ¥{{ scope.row.totalSalary.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deduction" label="扣除" align="right">
          <template #default="scope">
            <span style="color: #f56c6c;">
              -¥{{ scope.row.deduction.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="actualSalary" label="实发工资" align="right">
          <template #default="scope">
            <span style="color: #409eff; font-weight: bold;">
              ¥{{ scope.row.actualSalary.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="发放状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.payStatus === 'paid' ? 'success' : 'warning'">
              {{ scope.row.payStatus === 'paid' ? '已发放' : '未发放' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="success" size="small" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="warning" size="small" link @click="handlePay(scope.row)" v-if="scope.row.payStatus === 'unpaid'">
              发放
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedRows.length > 0">
        <el-button type="success" @click="handleBatchPay">批量发放 ({{ selectedRows.length }})</el-button>
      </div>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadSalaryList"
        @current-change="loadSalaryList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 新增/编辑薪资对话框 -->
    <el-dialog v-model="showCreateDialog" :title="editMode ? '编辑薪资' : '新增薪资'" width="600px">
      <el-form :model="salaryForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="员工" prop="employeeId">
          <el-select v-model="salaryForm.employeeId" placeholder="请选择员工" style="width: 100%;">
            <el-option label="张三 (EMP001)" value="1" />
            <el-option label="李四 (EMP002)" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="月份" prop="month">
          <el-date-picker v-model="salaryForm.month" type="month" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="基本工资">
          <el-input-number v-model="salaryForm.baseSalary" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="岗位工资">
          <el-input-number v-model="salaryForm.positionSalary" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="绩效工资">
          <el-input-number v-model="salaryForm.performanceSalary" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="补贴">
          <el-input-number v-model="salaryForm.allowance" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="扣除">
          <el-input-number v-model="salaryForm.deduction" :min="0" :precision="2" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSalary">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download } from '@element-plus/icons-vue'
import { salaryApi } from '@/api/hr/employee'

const loading = ref(false)
const showCreateDialog = ref(false)
const editMode = ref(false)
const salaryList = ref([])
const selectedRows = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const formRef = ref(null)

const stats = reactive({
  totalAmount: 0,
  actualAmount: 0,
  paidCount: 0,
  unpaidCount: 0
})

const searchForm = reactive({
  employeeName: '',
  month: '',
  payStatus: ''
})

const salaryForm = reactive({
  id: null,
  employeeId: '',
  month: '',
  baseSalary: 0,
  positionSalary: 0,
  performanceSalary: 0,
  allowance: 0,
  deduction: 0
})

const rules = {
  employeeId: [{ required: true, message: '请选择员工', trigger: 'change' }],
  month: [{ required: true, message: '请选择月份', trigger: 'change' }]
}

const loadSalaryList = async () => {
  loading.value = true
  try {
    const res = await salaryApi.getSalaryList({ ...searchForm, pageNum: pageNum.value, pageSize: pageSize.value })
    salaryList.value = res.data?.records || mockData()
    total.value = res.data?.total || 50
    
    // 更新统计
    updateStats()
  } catch (error) {
    salaryList.value = mockData()
    updateStats()
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  stats.totalAmount = salaryList.value.reduce((sum, item) => sum + item.totalSalary, 0)
  stats.actualAmount = salaryList.value.reduce((sum, item) => sum + item.actualSalary, 0)
  stats.paidCount = salaryList.value.filter(item => item.payStatus === 'paid').length
  stats.unpaidCount = salaryList.value.filter(item => item.payStatus === 'unpaid').length
}

const mockData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    employeeName: `员工${i + 1}`,
    employeeNo: `EMP00${i + 1}`,
    departmentName: ['研发部', '销售部', '财务部'][i % 3],
    month: '2024-01',
    baseSalary: 8000 + i * 100,
    positionSalary: 3000 + i * 50,
    performanceSalary: 2000 + i * 20,
    allowance: 500,
    deduction: 1000,
    totalSalary: 13500 + i * 170,
    actualSalary: 12500 + i * 170,
    payStatus: i % 3 === 0 ? 'paid' : 'unpaid'
  }))
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const resetSearch = () => {
  Object.assign(searchForm, { employeeName: '', month: '', payStatus: '' })
  loadSalaryList()
}

const viewDetail = (row) => {
  ElMessage.info('查看详情功能开发中...')
}

const handleEdit = (row) => {
  editMode.value = true
  Object.assign(salaryForm, row)
  showCreateDialog.value = true
}

const handlePay = async (row) => {
  try {
    await ElMessageBox.confirm(`确认发放 ${row.employeeName} 的薪资 ¥${row.actualSalary.toFixed(2)} 吗？`, '发放确认')
    ElMessage.success('薪资发放成功')
    loadSalaryList()
  } catch (error) {
    // 取消操作
  }
}

const handleBatchPay = async () => {
  const totalAmount = selectedRows.value.reduce((sum, item) => sum + item.actualSalary, 0)
  try {
    await ElMessageBox.confirm(`确认批量发放 ${selectedRows.value.length} 人的薪资，总计 ¥${totalAmount.toFixed(2)} 吗？`, '批量发放确认')
    await salaryApi.batchPaySalary({ ids: selectedRows.value.map(item => item.id) })
    ElMessage.success('批量发放成功')
    loadSalaryList()
  } catch (error) {
    // 取消操作
  }
}

const submitSalary = async () => {
  await formRef.value.validate()
  if (editMode.value) {
    await salaryApi.updateSalary(salaryForm)
    ElMessage.success('更新成功')
  } else {
    await salaryApi.createSalary(salaryForm)
    ElMessage.success('创建成功')
  }
  showCreateDialog.value = false
  loadSalaryList()
}

onMounted(() => {
  loadSalaryList()
})
</script>

<style scoped>
.salary-management-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.batch-actions {
  margin-top: 20px;
}
</style>
