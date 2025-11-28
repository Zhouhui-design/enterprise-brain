<template>
  <div class="employee-transfer-container">
    <el-card shadow="hover">
      <template #header>
        <span>员工调动管理</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="员工姓名">
          <el-input v-model="searchForm.employeeName" clearable />
        </el-form-item>
        <el-form-item label="调动状态">
          <el-select v-model="searchForm.status" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadTransferList">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 调动列表 -->
      <el-table :data="transferList" border v-loading="loading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="employeeName" label="员工姓名" />
        <el-table-column prop="employeeNo" label="工号" />
        <el-table-column label="原部门/职位">
          <template #default="scope">
            {{ scope.row.fromDepartment }} / {{ scope.row.fromPosition }}
          </template>
        </el-table-column>
        <el-table-column label="目标部门/职位">
          <template #default="scope">
            {{ scope.row.toDepartment }} / {{ scope.row.toPosition }}
          </template>
        </el-table-column>
        <el-table-column prop="transferDate" label="调动日期" />
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
        @current-change="loadTransferList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { transferApi } from '@/api/hr/employee'

const loading = ref(false)
const transferList = ref([])
const pageNum = ref(1)
const total = ref(0)
const searchForm = reactive({ employeeName: '', status: '' })

const loadTransferList = async () => {
  loading.value = true
  try {
    const res = await transferApi.getTransferList({ ...searchForm, pageNum: pageNum.value, pageSize: 20 })
    transferList.value = res.data?.records || mockData()
    total.value = res.data?.total || 6
  } catch (error) {
    transferList.value = mockData()
  } finally {
    loading.value = false
  }
}

const mockData = () => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    employeeName: `员工${i + 1}`,
    employeeNo: `EMP00${i + 1}`,
    fromDepartment: '研发部',
    fromPosition: '工程师',
    toDepartment: '销售部',
    toPosition: '销售经理',
    transferDate: '2024-02-01',
    status: ['pending', 'approved', 'rejected'][i % 3]
  }))
}

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
  return map[status] || '未知'
}

onMounted(() => {
  loadTransferList()
})
</script>

<style scoped>
.employee-transfer-container {
  padding: 20px;
}
</style>
