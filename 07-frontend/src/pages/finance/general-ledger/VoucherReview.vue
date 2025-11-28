<template>
  <div class="voucher-review-container">
    <el-card shadow="hover">
      <template #header>
        <span>凭证审核</span>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="凭证日期">
          <el-date-picker v-model="searchForm.dateRange" type="daterange" />
        </el-form-item>
        <el-form-item label="凭证字号">
          <el-select v-model="searchForm.voucherType" clearable>
            <el-option label="全部" value="" />
            <el-option label="记" value="JZ" />
            <el-option label="收" value="SZ" />
            <el-option label="付" value="FZ" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" clearable>
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审核" value="approved" />
            <el-option label="已驳回" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadVoucherList">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 凭证列表 -->
      <el-table :data="voucherList" border v-loading="loading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="voucherNo" label="凭证号" width="150" />
        <el-table-column prop="voucherDate" label="凭证日期" width="120" />
        <el-table-column label="金额" align="right" width="150">
          <template #default="scope">
            {{ formatAmount(scope.row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="attachmentCount" label="附件数" width="80" align="center" />
        <el-table-column prop="createBy" label="制单人" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewBy" label="审核人" width="100" />
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">
              查看
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="success"
              size="small"
              link
              @click="handleReview(scope.row, 'approved')"
            >
              通过
            </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="danger"
              size="small"
              link
              @click="handleReview(scope.row, 'rejected')"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadVoucherList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="凭证详情" width="900px">
      <el-descriptions :column="3" border>
        <el-descriptions-item label="凭证号">{{ currentVoucher.voucherNo }}</el-descriptions-item>
        <el-descriptions-item label="凭证日期">{{ currentVoucher.voucherDate }}</el-descriptions-item>
        <el-descriptions-item label="附件数">{{ currentVoucher.attachmentCount }}</el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-table :data="currentVoucher.entries" border>
        <el-table-column prop="summary" label="摘要" />
        <el-table-column prop="subjectName" label="会计科目" />
        <el-table-column label="借方" align="right">
          <template #default="scope">
            <span v-if="scope.row.debitAmount > 0">{{ formatAmount(scope.row.debitAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="贷方" align="right">
          <template #default="scope">
            <span v-if="scope.row.creditAmount > 0">{{ formatAmount(scope.row.creditAmount) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { voucherApi } from '@/api/finance'

const loading = ref(false)
const showDetailDialog = ref(false)
const voucherList = ref([])
const currentVoucher = ref({ entries: [] })
const pageNum = ref(1)
const total = ref(0)

const searchForm = reactive({
  dateRange: [],
  voucherType: '',
  status: ''
})

const loadVoucherList = async () => {
  loading.value = true
  try {
    const res = await voucherApi.getVoucherList({ ...searchForm, pageNum: pageNum.value, pageSize: 20 })
    voucherList.value = res.data?.records || mockData()
    total.value = res.data?.total || 30
  } catch (error) {
    voucherList.value = mockData()
  } finally {
    loading.value = false
  }
}

const mockData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    voucherNo: `JZ202401${String(i + 1).padStart(3, '0')}`,
    voucherDate: '2024-01-15',
    amount: 10000 + i * 1000,
    attachmentCount: i % 3,
    createBy: '张三',
    status: ['pending', 'approved', 'rejected'][i % 3],
    reviewBy: i % 3 !== 0 ? '李四' : ''
  }))
}

const viewDetail = async (row) => {
  currentVoucher.value = {
    ...row,
    entries: [
      { summary: '销售收入', subjectName: '1001 - 库存现金', debitAmount: 5000, creditAmount: 0 },
      { summary: '销售收入', subjectName: '6001 - 主营业务收入', debitAmount: 0, creditAmount: 5000 }
    ]
  }
  showDetailDialog.value = true
}

const handleReview = async (row, result) => {
  try {
    await ElMessageBox.confirm(
      `确认${result === 'approved' ? '通过' : '驳回'}该凭证吗？`,
      '审核确认'
    )
    await voucherApi.reviewVoucher({ id: row.id, result })
    ElMessage.success('审核成功')
    loadVoucherList()
  } catch (error) {
    // 取消操作
  }
}

const resetSearch = () => {
  Object.assign(searchForm, { dateRange: [], voucherType: '', status: '' })
  loadVoucherList()
}

const formatAmount = (amount) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getStatusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待审核', approved: '已审核', rejected: '已驳回' }
  return map[status] || '未知'
}

onMounted(() => {
  loadVoucherList()
})
</script>

<style scoped>
.voucher-review-container {
  padding: 20px;
}
</style>
