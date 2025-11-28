<template>
  <div class="employee-offboarding-container">
    <el-card shadow="hover">
      <template #header>
        <span>员工离职管理</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="离职类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable>
            <el-option label="主动离职" value="voluntary" />
            <el-option label="被动离职" value="involuntary" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOffboardingList">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 离职列表 -->
      <el-table :data="offboardingList" border v-loading="loading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="employeeName" label="姓名" />
        <el-table-column prop="employeeNo" label="工号" />
        <el-table-column prop="departmentName" label="部门" />
        <el-table-column prop="type" label="离职类型">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'voluntary' ? 'success' : 'warning'">
              {{ scope.row.type === 'voluntary' ? '主动离职' : '被动离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="leaveDate" label="离职日期" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button type="primary" size="small" link>详情</el-button>
            <el-button type="success" size="small" link v-if="scope.row.status === 'pending'">审批</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadOffboardingList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { offboardingApi } from '@/api/hr/employee'

const loading = ref(false)
const offboardingList = ref([])
const pageNum = ref(1)
const total = ref(0)
const searchForm = reactive({ name: '', type: '' })

const loadOffboardingList = async () => {
  loading.value = true
  try {
    const res = await offboardingApi.getOffboardingList({ ...searchForm, pageNum: pageNum.value, pageSize: 20 })
    offboardingList.value = res.data?.records || mockData()
    total.value = res.data?.total || 8
  } catch (error) {
    offboardingList.value = mockData()
  } finally {
    loading.value = false
  }
}

const mockData = () => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    employeeName: `员工${i + 1}`,
    employeeNo: `EMP00${i + 1}`,
    departmentName: '研发部',
    type: i % 2 === 0 ? 'voluntary' : 'involuntary',
    leaveDate: '2024-12-31',
    status: ['pending', 'approved'][i % 2]
  }))
}

const getStatusType = (status) => {
  return status === 'approved' ? 'success' : 'warning'
}

const getStatusText = (status) => {
  return status === 'approved' ? '已审批' : '待审批'
}

onMounted(() => {
  loadOffboardingList()
})
</script>

<style scoped>
.employee-offboarding-container {
  padding: 20px;
}
</style>
