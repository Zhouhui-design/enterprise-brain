<template>
  <div class="customer-statement-container">
    <el-card shadow="hover">
      <!-- 查询表单 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户名称">
          <el-select
            v-model="searchForm.customerId"
            filterable
            remote
            placeholder="请选择客户"
            :remote-method="searchCustomer"
            @change="handleCustomerChange"
            style="width: 300px"
          >
            <el-option
              v-for="item in customerList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="统计周期">
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

      <!-- 客户信息 -->
      <el-divider content-position="left">客户信息</el-divider>
      <el-descriptions :column="4" border>
        <el-descriptions-item label="客户名称">{{ customerInfo.name }}</el-descriptions-item>
        <el-descriptions-item label="客户编码">{{ customerInfo.code }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ customerInfo.contact }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ customerInfo.phone }}</el-descriptions-item>
        <el-descriptions-item label="信用额度">
          ¥{{ formatAmount(customerInfo.creditLimit) }}
        </el-descriptions-item>
        <el-descriptions-item label="已用额度">
          ¥{{ formatAmount(customerInfo.usedCredit) }}
        </el-descriptions-item>
        <el-descriptions-item label="可用额度">
          ¥{{ formatAmount(customerInfo.availableCredit) }}
        </el-descriptions-item>
        <el-descriptions-item label="信用等级">
          <el-rate v-model="customerInfo.creditRating" disabled show-score />
        </el-descriptions-item>
      </el-descriptions>

      <!-- 汇总信息 -->
      <el-divider content-position="left">汇总信息</el-divider>
      <el-row :gutter="20" class="summary-row">
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-label">期初应收</div>
            <div class="summary-value">¥{{ formatAmount(summary.openingBalance) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-label">本期应收</div>
            <div class="summary-value primary">¥{{ formatAmount(summary.periodReceivable) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-label">本期实收</div>
            <div class="summary-value success">¥{{ formatAmount(summary.periodReceived) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-label">期末应收</div>
            <div class="summary-value warning">¥{{ formatAmount(summary.closingBalance) }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" :icon="Printer" @click="handlePrint">打印</el-button>
        <el-button type="success" :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Share" @click="handleSend">发送给客户</el-button>
      </div>

      <!-- 明细表格 -->
      <el-divider content-position="left">往来明细</el-divider>
      <el-table :data="tableData" border stripe v-loading="loading" show-summary :summary-method="getSummaries">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="businessDate" label="业务日期" width="120" />
        <el-table-column prop="businessType" label="业务类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getBusinessTypeTag(row.businessType)" size="small">
              {{ getBusinessTypeName(row.businessType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="docNo" label="单据号" width="180" />
        <el-table-column prop="description" label="摘要" min-width="200" />
        <el-table-column prop="receivableAmount" label="应收金额" width="140" align="right">
          <template #default="{ row }">
            <span v-if="row.receivableAmount" class="amount-text">
              ¥{{ formatAmount(row.receivableAmount) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="receivedAmount" label="实收金额" width="140" align="right">
          <template #default="{ row }">
            <span v-if="row.receivedAmount" class="amount-text success">
              ¥{{ formatAmount(row.receivedAmount) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text" :class="{ 'warning': row.balance > 0 }">
              ¥{{ formatAmount(row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              查看详情
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

      <!-- 账龄分析 -->
      <el-divider content-position="left">账龄分析</el-divider>
      <el-table :data="agingData" border>
        <el-table-column prop="period" label="账龄区间" width="150" />
        <el-table-column prop="amount" label="金额" align="right">
          <template #default="{ row }">
            ¥{{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" align="right">
          <template #default="{ row }">
            {{ row.percentage }}%
          </template>
        </el-table-column>
        <el-table-column label="进度">
          <template #default="{ row }">
            <el-progress :percentage="row.percentage" :color="getProgressColor(row.period)" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 发送对话框 -->
    <el-dialog v-model="sendDialogVisible" title="发送对账单" width="500px">
      <el-form :model="sendForm" ref="sendFormRef" label-width="100px">
        <el-form-item label="收件人邮箱" required>
          <el-input v-model="sendForm.email" placeholder="请输入收件人邮箱" />
        </el-form-item>
        <el-form-item label="抄送">
          <el-input v-model="sendForm.cc" placeholder="请输入抄送邮箱，多个用逗号分隔" />
        </el-form-item>
        <el-form-item label="邮件主题" required>
          <el-input v-model="sendForm.subject" placeholder="请输入邮件主题" />
        </el-form-item>
        <el-form-item label="邮件内容">
          <el-input
            v-model="sendForm.content"
            type="textarea"
            :rows="5"
            placeholder="请输入邮件内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSend" :loading="sending">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Printer, Download, Share } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const sendFormRef = ref(null)

// 搜索表单
const searchForm = reactive({
  customerId: null,
  dateRange: []
})

// 客户列表
const customerList = ref([])

// 客户信息
const customerInfo = reactive({
  name: '',
  code: '',
  contact: '',
  phone: '',
  creditLimit: 0,
  usedCredit: 0,
  availableCredit: 0,
  creditRating: 0
})

// 汇总信息
const summary = reactive({
  openingBalance: 0,
  periodReceivable: 0,
  periodReceived: 0,
  closingBalance: 0
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页
const pagination = reactive({
  current: 1,
  size: 20,
  total: 0
})

// 账龄数据
const agingData = ref([])

// 发送对话框
const sendDialogVisible = ref(false)
const sendForm = reactive({
  email: '',
  cc: '',
  subject: '',
  content: ''
})
const sending = ref(false)

// 搜索客户
const searchCustomer = async (query) => {
  if (query) {
    // TODO: 调用API搜索客户
    customerList.value = [
      { id: 1, name: '深圳ABC科技有限公司' },
      { id: 2, name: '广州XYZ贸易公司' }
    ]
  }
}

// 客户变更
const handleCustomerChange = (customerId) => {
  loadData()
}

// 加载数据
const loadData = async () => {
  if (!searchForm.customerId) {
    return
  }

  loading.value = true
  try {
    // TODO: 调用API获取数据
    // 客户信息
    Object.assign(customerInfo, {
      name: '深圳ABC科技有限公司',
      code: 'C001',
      contact: '张先生',
      phone: '13800138000',
      creditLimit: 1000000,
      usedCredit: 300000,
      availableCredit: 700000,
      creditRating: 4
    })

    // 汇总信息
    Object.assign(summary, {
      openingBalance: 200000,
      periodReceivable: 150000,
      periodReceived: 50000,
      closingBalance: 300000
    })

    // 明细数据
    tableData.value = [
      {
        id: 1,
        businessDate: '2023-11-01',
        businessType: 'OPENING',
        docNo: '-',
        description: '期初余额',
        receivableAmount: 0,
        receivedAmount: 0,
        balance: 200000,
        remark: ''
      },
      {
        id: 2,
        businessDate: '2023-11-10',
        businessType: 'SALE',
        docNo: 'AR202311100001',
        description: '销售应收',
        receivableAmount: 100000,
        receivedAmount: 0,
        balance: 300000,
        remark: ''
      },
      {
        id: 3,
        businessDate: '2023-11-15',
        businessType: 'COLLECTION',
        docNo: 'CA202311150001',
        description: '收款',
        receivableAmount: 0,
        receivedAmount: 50000,
        balance: 250000,
        remark: '银行转账'
      },
      {
        id: 4,
        businessDate: '2023-11-20',
        businessType: 'SALE',
        docNo: 'AR202311200001',
        description: '销售应收',
        receivableAmount: 50000,
        receivedAmount: 0,
        balance: 300000,
        remark: ''
      }
    ]

    pagination.total = 4

    // 账龄数据
    agingData.value = [
      { period: '30天以内', amount: 100000, percentage: 33.33 },
      { period: '31-60天', amount: 100000, percentage: 33.33 },
      { period: '61-90天', amount: 50000, percentage: 16.67 },
      { period: '91-180天', amount: 30000, percentage: 10.00 },
      { period: '180天以上', amount: 20000, percentage: 6.67 }
    ]
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
    customerId: null,
    dateRange: []
  })
  
  // 重置客户信息
  Object.assign(customerInfo, {
    name: '',
    code: '',
    contact: '',
    phone: '',
    creditLimit: 0,
    usedCredit: 0,
    availableCredit: 0,
    creditRating: 0
  })
  
  tableData.value = []
  agingData.value = []
}

// 打印
const handlePrint = () => {
  window.print()
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}

// 发送
const handleSend = () => {
  if (!searchForm.customerId) {
    ElMessage.warning('请先选择客户')
    return
  }
  
  sendDialogVisible.value = true
  sendForm.email = ''
  sendForm.cc = ''
  sendForm.subject = `${customerInfo.name} - 对账单`
  sendForm.content = `尊敬的${customerInfo.contact}：

附件为贵司的往来对账单，请查收确认。

此致
敬礼`
}

// 提交发送
const submitSend = async () => {
  if (!sendForm.email) {
    ElMessage.warning('请输入收件人邮箱')
    return
  }
  
  sending.value = true
  try {
    // TODO: 调用API发送邮件
    // await statementApi.send(sendForm)
    
    ElMessage.success('发送成功')
    sendDialogVisible.value = false
  } catch (error) {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
  }
}

// 查看详情
const handleViewDetail = (row) => {
  if (row.businessType === 'SALE') {
    router.push(`/finance/accounts-receivable/detail/${row.id}`)
  } else if (row.businessType === 'COLLECTION') {
    router.push(`/finance/accounts-receivable/collection-detail/${row.id}`)
  }
}

// 汇总方法
const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []

  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    if (['receivableAmount', 'receivedAmount'].includes(column.property)) {
      const values = data.map(item => Number(item[column.property]))
      const sum = values.reduce((prev, curr) => prev + curr, 0)
      sums[index] = `¥${formatAmount(sum)}`
    } else {
      sums[index] = ''
    }
  })

  return sums
}

// 业务类型名称
const getBusinessTypeName = (type) => {
  const map = {
    OPENING: '期初余额',
    SALE: '销售应收',
    SERVICE: '服务应收',
    COLLECTION: '收款',
    DISCOUNT: '折扣',
    OTHER: '其他'
  }
  return map[type] || type
}

// 业务类型标签
const getBusinessTypeTag = (type) => {
  const map = {
    OPENING: 'info',
    SALE: '',
    SERVICE: 'success',
    COLLECTION: 'success',
    DISCOUNT: 'warning',
    OTHER: 'info'
  }
  return map[type] || ''
}

// 进度条颜色
const getProgressColor = (period) => {
  if (period.includes('30天以内')) return '#67c23a'
  if (period.includes('31-60天')) return '#409eff'
  if (period.includes('61-90天')) return '#e6a23c'
  if (period.includes('91-180天')) return '#f56c6c'
  return '#909399'
}

// 金额格式化
const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 初始化
onMounted(() => {
  if (route.query.customerId) {
    searchForm.customerId = parseInt(route.query.customerId)
    loadData()
  }
})
</script>

<style scoped lang="scss">
.customer-statement-container {
  padding: 20px;

  .search-form {
    margin-bottom: 20px;
  }

  .summary-row {
    margin-bottom: 20px;

    .summary-card {
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      text-align: center;
      color: white;

      .summary-label {
        font-size: 14px;
        margin-bottom: 10px;
        opacity: 0.9;
      }

      .summary-value {
        font-size: 24px;
        font-weight: bold;

        &.primary {
          color: #ffd700;
        }

        &.success {
          color: #90ee90;
        }

        &.warning {
          color: #ffa500;
        }
      }
    }

    .summary-card:nth-child(2) .summary-card {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .summary-card:nth-child(3) .summary-card {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .summary-card:nth-child(4) .summary-card {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
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

    &.warning {
      color: #e6a23c;
    }
  }

  .el-pagination {
    margin: 20px 0;
    justify-content: flex-end;
  }
}

@media print {
  .search-form,
  .toolbar,
  .el-pagination {
    display: none;
  }
}
</style>
