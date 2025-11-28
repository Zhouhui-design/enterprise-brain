<template>
  <div class="collection-execution-container">
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="申请单号">
          <el-input v-model="searchForm.applicationNo" placeholder="请输入申请单号" clearable />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="收款状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待执行" value="PENDING" />
            <el-option label="执行中" value="EXECUTING" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">待执行金额</div>
            <div class="stat-value warning">¥{{ formatAmount(stats.pendingAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">执行中金额</div>
            <div class="stat-value primary">¥{{ formatAmount(stats.executingAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">已完成金额</div>
            <div class="stat-value success">¥{{ formatAmount(stats.completedAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">今日到账</div>
            <div class="stat-value primary">¥{{ formatAmount(stats.todayAmount) }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleBatchExecute">批量执行</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="applicationNo" label="申请单号" width="180" fixed />
        <el-table-column prop="receivableNo" label="应收单号" width="180" />
        <el-table-column prop="customerName" label="客户名称" width="200" />
        <el-table-column prop="collectionAmount" label="收款金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ formatAmount(row.collectionAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实际到账" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text success">¥{{ formatAmount(row.actualAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="收款方式" width="120">
          <template #default="{ row }">
            {{ getPaymentMethodName(row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="collectionDate" label="收款日期" width="120" />
        <el-table-column prop="executionDate" label="执行日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="executor" label="执行人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button
              link
              type="success"
              size="small"
              @click="handleExecute(row)"
              v-if="row.status === 'PENDING'"
            >
              执行
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              @click="handleConfirm(row)"
              v-if="row.status === 'EXECUTING'"
            >
              确认到账
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleCancel(row)"
              v-if="row.status !== 'COMPLETED'"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.current"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <!-- 执行对话框 -->
    <el-dialog v-model="executeDialogVisible" title="执行收款" width="600px">
      <el-form :model="executeForm" :rules="executeRules" ref="executeFormRef" label-width="120px">
        <el-form-item label="执行日期" prop="executionDate">
          <el-date-picker
            v-model="executeForm.executionDate"
            type="datetime"
            placeholder="选择执行日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="实际到账金额" prop="actualAmount">
          <el-input-number
            v-model="executeForm.actualAmount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="银行流水号" prop="bankTransNo">
          <el-input v-model="executeForm.bankTransNo" placeholder="请输入银行流水号" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="executeForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="executeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitExecute" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 确认到账对话框 -->
    <el-dialog v-model="confirmDialogVisible" title="确认到账" width="500px">
      <el-form :model="confirmForm" ref="confirmFormRef" label-width="120px">
        <el-form-item label="到账日期">
          <el-date-picker
            v-model="confirmForm.confirmDate"
            type="datetime"
            placeholder="选择到账日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="confirmForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConfirm" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download } from '@element-plus/icons-vue'

const router = useRouter()
const executeFormRef = ref(null)
const confirmFormRef = ref(null)

// 搜索表单
const searchForm = reactive({
  applicationNo: '',
  customerName: '',
  status: '',
  dateRange: []
})

// 统计数据
const stats = reactive({
  pendingAmount: 0,
  executingAmount: 0,
  completedAmount: 0,
  todayAmount: 0
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const selectedRows = ref([])

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 执行对话框
const executeDialogVisible = ref(false)
const executeForm = reactive({
  id: null,
  executionDate: new Date(),
  actualAmount: 0,
  bankTransNo: '',
  remark: ''
})
const executeRules = {
  executionDate: [{ required: true, message: '请选择执行日期', trigger: 'change' }],
  actualAmount: [{ required: true, message: '请输入实际到账金额', trigger: 'blur' }]
}

// 确认到账对话框
const confirmDialogVisible = ref(false)
const confirmForm = reactive({
  id: null,
  confirmDate: new Date(),
  remark: ''
})

const submitting = ref(false)

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取数据
    tableData.value = [
      {
        id: 1,
        applicationNo: 'CA202311280001',
        receivableNo: 'AR202311280001',
        customerName: '深圳ABC科技有限公司',
        collectionAmount: 50000,
        actualAmount: 50000,
        paymentMethod: 'BANK',
        collectionDate: '2023-11-28',
        executionDate: '2023-11-28',
        status: 'COMPLETED',
        executor: '张三',
        createTime: '2023-11-28 10:00:00'
      },
      {
        id: 2,
        applicationNo: 'CA202311280002',
        receivableNo: 'AR202311280002',
        customerName: '广州XYZ贸易公司',
        collectionAmount: 80000,
        actualAmount: 0,
        paymentMethod: 'BANK',
        collectionDate: '2023-11-29',
        executionDate: null,
        status: 'PENDING',
        executor: null,
        createTime: '2023-11-28 14:00:00'
      }
    ]

    pagination.total = 2

    // 更新统计数据
    stats.pendingAmount = 80000
    stats.executingAmount = 0
    stats.completedAmount = 50000
    stats.todayAmount = 50000
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.current = 1
  loadData()
}

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    applicationNo: '',
    customerName: '',
    status: '',
    dateRange: []
  })
  handleSearch()
}

// 选择变更
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 批量执行
const handleBatchExecute = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要执行的记录')
    return
  }
  ElMessage.info('批量执行功能开发中...')
}

// 查看
const handleView = (row) => {
  router.push(`/finance/accounts-receivable/collection-detail/${row.id}`)
}

// 执行
const handleExecute = (row) => {
  executeDialogVisible.value = true
  executeForm.id = row.id
  executeForm.executionDate = new Date()
  executeForm.actualAmount = row.collectionAmount
  executeForm.bankTransNo = ''
  executeForm.remark = ''
}

// 提交执行
const submitExecute = async () => {
  try {
    await executeFormRef.value.validate()
    submitting.value = true

    // TODO: 调用API执行
    // await collectionApi.execute(executeForm)

    ElMessage.success('执行成功')
    executeDialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('执行失败')
    }
  } finally {
    submitting.value = false
  }
}

// 确认到账
const handleConfirm = (row) => {
  confirmDialogVisible.value = true
  confirmForm.id = row.id
  confirmForm.confirmDate = new Date()
  confirmForm.remark = ''
}

// 提交确认
const submitConfirm = async () => {
  try {
    submitting.value = true

    // TODO: 调用API确认
    // await collectionApi.confirm(confirmForm)

    ElMessage.success('确认成功')
    confirmDialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error('确认失败')
  } finally {
    submitting.value = false
  }
}

// 取消
const handleCancel = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消该收款执行吗？', '提示', {
      type: 'warning'
    })

    // TODO: 调用API取消
    // await collectionApi.cancel(row.id)

    ElMessage.success('取消成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 收款方式名称
const getPaymentMethodName = (method) => {
  const map = {
    BANK: '银行转账',
    CASH: '现金',
    CHECK: '支票',
    ACCEPTANCE: '承兑汇票',
    OTHER: '其他'
  }
  return map[method] || method
}

// 状态名称
const getStatusName = (status) => {
  const map = {
    PENDING: '待执行',
    EXECUTING: '执行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

// 状态标签
const getStatusTag = (status) => {
  const map = {
    PENDING: 'warning',
    EXECUTING: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'info'
  }
  return map[status] || ''
}

// 金额格式化
const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.collection-execution-container {
  padding: 20px;

  .search-form {
    margin-bottom: 20px;
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      padding: 20px;
      background: #f5f7fa;
      border-radius: 4px;
      text-align: center;

      .stat-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: bold;

        &.primary {
          color: #409eff;
        }

        &.success {
          color: #67c23a;
        }

        &.warning {
          color: #e6a23c;
        }
      }
    }
  }

  .toolbar {
    margin-bottom: 20px;
  }

  .amount-text {
    font-weight: 500;

    &.success {
      color: #67c23a;
    }
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
