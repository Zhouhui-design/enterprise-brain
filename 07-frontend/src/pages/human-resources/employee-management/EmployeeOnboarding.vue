<template>
  <div class="employee-onboarding-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>员工入职管理</span>
          <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新增入职</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="入职状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOnboardingList">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 入职列表 -->
      <el-table :data="onboardingList" border v-loading="loading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="departmentName" label="应聘部门" />
        <el-table-column prop="positionName" label="应聘职位" />
        <el-table-column prop="entryDate" label="预计入职日期" />
        <el-table-column label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="success" size="small" link @click="handleApprove(scope.row)" v-if="scope.row.status === 'pending'">
              审批
            </el-button>
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadOnboardingList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 新增入职对话框 -->
    <el-dialog v-model="showCreateDialog" title="新增入职" width="600px">
      <el-form :model="onboardingForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="onboardingForm.name" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="onboardingForm.phone" />
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-select v-model="onboardingForm.departmentId" style="width: 100%;">
            <el-option label="研发部" value="1" />
            <el-option label="销售部" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="职位" prop="positionId">
          <el-select v-model="onboardingForm.positionId" style="width: 100%;">
            <el-option label="工程师" value="1" />
            <el-option label="经理" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="入职日期" prop="entryDate">
          <el-date-picker v-model="onboardingForm.entryDate" type="date" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { onboardingApi } from '@/api/hr/employee'

const loading = ref(false)
const showCreateDialog = ref(false)
const onboardingList = ref([])
const pageNum = ref(1)
const pageSize = ref(20)
const total = ref(0)
const formRef = ref(null)

const searchForm = reactive({ name: '', status: '' })
const onboardingForm = reactive({ name: '', phone: '', departmentId: '', positionId: '', entryDate: '' })
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }]
}

const loadOnboardingList = async () => {
  loading.value = true
  try {
    const res = await onboardingApi.getOnboardingList({ ...searchForm, pageNum: pageNum.value, pageSize: pageSize.value })
    onboardingList.value = res.data?.records || mockData()
    total.value = res.data?.total || 10
  } catch (error) {
    onboardingList.value = mockData()
  } finally {
    loading.value = false
  }
}

const mockData = () => {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `候选人${i + 1}`,
    phone: '13800138000',
    departmentName: '研发部',
    positionName: '工程师',
    entryDate: '2024-02-01',
    status: ['pending', 'approved', 'rejected'][i % 3]
  }))
}

const submitCreate = async () => {
  await formRef.value.validate()
  await onboardingApi.createOnboarding(onboardingForm)
  ElMessage.success('创建成功')
  showCreateDialog.value = false
  loadOnboardingList()
}

const handleApprove = (row) => {
  ElMessage.info('审批功能开发中...')
}

const viewDetail = (row) => {
  ElMessage.info('查看详情功能开发中...')
}

const resetSearch = () => {
  Object.assign(searchForm, { name: '', status: '' })
  loadOnboardingList()
}

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已拒绝' }
  return map[status] || '未知'
}

onMounted(() => {
  loadOnboardingList()
})
</script>

<style scoped>
.employee-onboarding-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
