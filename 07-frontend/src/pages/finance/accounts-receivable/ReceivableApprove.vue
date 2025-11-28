<template>
  <div class="receivable-approve-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>应收单审核</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>

      <!-- 基本信息 -->
      <el-descriptions title="基本信息" :column="3" border>
        <el-descriptions-item label="应收单号">{{ detail.receivableNo }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">
          <el-tag>{{ getBusinessTypeName(detail.businessType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusTag(detail.status)">
            {{ getStatusName(detail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ detail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="应收日期">{{ detail.receivableDate }}</el-descriptions-item>
        <el-descriptions-item label="到期日期">
          <span :class="{ 'overdue': isOverdue(detail.dueDate) }">
            {{ detail.dueDate }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="付款条件">{{ detail.paymentTerm }}</el-descriptions-item>
        <el-descriptions-item label="币种">{{ detail.currency }}</el-descriptions-item>
        <el-descriptions-item label="汇率">{{ detail.exchangeRate }}</el-descriptions-item>
        <el-descriptions-item label="关联单据">{{ detail.relatedDocNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detail.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ detail.createTime }}</el-descriptions-item>
      </el-descriptions>

      <!-- 应收明细 -->
      <el-divider content-position="left">应收明细</el-divider>
      <el-table :data="detail.items" border show-summary :summary-method="getSummaries">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="feeType" label="费用项目" width="120">
          <template #default="{ row }">
            {{ getFeeTypeName(row.feeType) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="费用说明" min-width="200" />
        <el-table-column prop="quantity" label="数量" width="100" align="right" />
        <el-table-column prop="unitPrice" label="单价" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.unitPrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="140" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="taxRate" label="税率(%)" width="100" align="right" />
        <el-table-column prop="taxAmount" label="税额" width="120" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.taxAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="价税合计" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text primary">{{ formatAmount(row.totalAmount) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 收款计划 -->
      <el-divider content-position="left">收款计划</el-divider>
      <el-table :data="detail.collectionPlan" border v-if="detail.collectionPlan?.length > 0">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="planDate" label="计划收款日期" width="150" />
        <el-table-column prop="planAmount" label="计划收款金额" width="150" align="right">
          <template #default="{ row }">
            {{ formatAmount(row.planAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="收款方式" width="120">
          <template #default="{ row }">
            {{ getPaymentMethodName(row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="200" />
      </el-table>
      <el-empty v-else description="暂无收款计划" />

      <!-- 附件 -->
      <el-divider content-position="left">附件信息</el-divider>
      <div class="attachments" v-if="detail.attachments?.length > 0">
        <div v-for="(file, index) in detail.attachments" :key="index" class="attachment-item">
          <el-link :href="file.url" target="_blank">{{ file.name }}</el-link>
        </div>
      </div>
      <el-empty v-else description="暂无附件" />

      <!-- 备注 -->
      <el-divider content-position="left">备注信息</el-divider>
      <div class="remark-section">
        {{ detail.remark || '无' }}
      </div>

      <!-- 审批历史 -->
      <el-divider content-position="left">审批历史</el-divider>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in approvalHistory"
          :key="index"
          :timestamp="item.createTime"
          placement="top"
          :type="getTimelineType(item.status)"
        >
          <el-card>
            <div class="approval-item">
              <div class="approval-header">
                <span class="approver">{{ item.approver }}</span>
                <el-tag :type="getApprovalStatusTag(item.status)" size="small">
                  {{ getApprovalStatusName(item.status) }}
                </el-tag>
              </div>
              <div class="approval-content" v-if="item.comment">
                <div class="label">审批意见:</div>
                <div class="content">{{ item.comment }}</div>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <!-- 审批操作 -->
      <el-divider content-position="left">审批操作</el-divider>
      <el-form :model="approvalForm" ref="approvalFormRef" label-width="100px">
        <el-form-item label="审批决定" prop="decision" required>
          <el-radio-group v-model="approvalForm.decision">
            <el-radio label="APPROVED">通过</el-radio>
            <el-radio label="REJECTED">驳回</el-radio>
            <el-radio label="RETURNED">退回修改</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" prop="comment">
          <el-input
            v-model="approvalForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入审批意见"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="handleApprove('APPROVED')" :loading="submitting">
            通过
          </el-button>
          <el-button type="danger" @click="handleApprove('REJECTED')" :loading="submitting">
            驳回
          </el-button>
          <el-button type="warning" @click="handleApprove('RETURNED')" :loading="submitting">
            退回修改
          </el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const approvalFormRef = ref(null)

// 详情数据
const detail = ref({
  receivableNo: 'AR202311280001',
  businessType: 'SALE',
  status: 'PENDING',
  customerName: '深圳ABC科技有限公司',
  receivableDate: '2023-11-28',
  dueDate: '2023-12-28',
  paymentTerm: '30天',
  currency: 'CNY',
  exchangeRate: 1,
  relatedDocNo: 'SO202311280001',
  creator: '张三',
  createTime: '2023-11-28 10:00:00',
  items: [
    {
      feeType: 'GOODS',
      description: '产品销售款',
      quantity: 10,
      unitPrice: 8000,
      amount: 80000,
      taxRate: 13,
      taxAmount: 10400,
      totalAmount: 90400
    },
    {
      feeType: 'SERVICE',
      description: '技术服务费',
      quantity: 1,
      unitPrice: 10000,
      amount: 10000,
      taxRate: 6,
      taxAmount: 600,
      totalAmount: 10600
    }
  ],
  collectionPlan: [
    {
      planDate: '2023-12-15',
      planAmount: 50000,
      paymentMethod: 'BANK',
      remark: '首期款'
    },
    {
      planDate: '2023-12-28',
      planAmount: 51000,
      paymentMethod: 'BANK',
      remark: '尾款'
    }
  ],
  attachments: [],
  remark: '重要客户，请及时跟进收款'
})

// 审批历史
const approvalHistory = ref([
  {
    approver: '张三',
    status: 'SUBMITTED',
    comment: '提交审核',
    createTime: '2023-11-28 10:00:00'
  }
])

// 审批表单
const approvalForm = reactive({
  decision: 'APPROVED',
  comment: ''
})

const submitting = ref(false)

// 加载数据
const loadData = async () => {
  const id = route.params.id
  // TODO: 调用API获取数据
  // const res = await receivableApi.getDetail(id)
  // detail.value = res.data
  // approvalHistory.value = res.data.approvalHistory
}

// 审批
const handleApprove = async (decision) => {
  try {
    await ElMessageBox.confirm(
      `确定要${getApprovalStatusName(decision)}该应收单吗？`,
      '提示',
      { type: 'warning' }
    )

    approvalForm.decision = decision
    submitting.value = true

    // TODO: 调用API提交审批
    // await receivableApi.approve({
    //   id: route.params.id,
    //   ...approvalForm
    // })

    ElMessage.success('审批成功')
    router.back()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审批失败')
    }
  } finally {
    submitting.value = false
  }
}

// 返回
const handleBack = () => {
  router.back()
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
    
    if (['amount', 'taxAmount', 'totalAmount'].includes(column.property)) {
      const values = data.map(item => Number(item[column.property]))
      const sum = values.reduce((prev, curr) => prev + curr, 0)
      sums[index] = formatAmount(sum)
    } else {
      sums[index] = ''
    }
  })

  return sums
}

// 业务类型名称
const getBusinessTypeName = (type) => {
  const map = {
    SALE: '销售应收',
    SERVICE: '服务应收',
    LEASE: '租赁应收',
    OTHER: '其他应收'
  }
  return map[type] || type
}

// 状态名称
const getStatusName = (status) => {
  const map = {
    PENDING: '待审核',
    APPROVED: '已审核',
    PARTIAL: '部分收款',
    COMPLETED: '已完成',
    OVERDUE: '已逾期'
  }
  return map[status] || status
}

// 状态标签
const getStatusTag = (status) => {
  const map = {
    PENDING: 'info',
    APPROVED: '',
    PARTIAL: 'warning',
    COMPLETED: 'success',
    OVERDUE: 'danger'
  }
  return map[status] || ''
}

// 费用类型名称
const getFeeTypeName = (type) => {
  const map = {
    GOODS: '货款',
    SERVICE: '服务费',
    FREIGHT: '运费',
    OTHER: '其他'
  }
  return map[type] || type
}

// 收款方式名称
const getPaymentMethodName = (method) => {
  const map = {
    BANK: '银行转账',
    CASH: '现金',
    CHECK: '支票',
    ACCEPTANCE: '承兑汇票'
  }
  return map[method] || method
}

// 审批状态名称
const getApprovalStatusName = (status) => {
  const map = {
    SUBMITTED: '提交审核',
    APPROVED: '通过',
    REJECTED: '驳回',
    RETURNED: '退回修改'
  }
  return map[status] || status
}

// 审批状态标签
const getApprovalStatusTag = (status) => {
  const map = {
    SUBMITTED: 'info',
    APPROVED: 'success',
    REJECTED: 'danger',
    RETURNED: 'warning'
  }
  return map[status] || ''
}

// 时间线类型
const getTimelineType = (status) => {
  const map = {
    SUBMITTED: 'primary',
    APPROVED: 'success',
    REJECTED: 'danger',
    RETURNED: 'warning'
  }
  return map[status] || 'primary'
}

// 判断是否逾期
const isOverdue = (dueDate) => {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
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
.receivable-approve-container {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .el-descriptions {
    margin-bottom: 20px;
  }

  .overdue {
    color: #f56c6c;
    font-weight: 500;
  }

  .amount-text {
    font-weight: 500;

    &.primary {
      color: #409eff;
    }
  }

  .attachments {
    .attachment-item {
      margin-bottom: 10px;
    }
  }

  .remark-section {
    padding: 15px;
    background: #f5f7fa;
    border-radius: 4px;
    min-height: 60px;
  }

  .approval-item {
    .approval-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;

      .approver {
        font-weight: 500;
      }
    }

    .approval-content {
      .label {
        color: #909399;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .content {
        color: #606266;
      }
    }
  }
}
</style>
