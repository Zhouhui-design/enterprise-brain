<template>
  <div class="customer-info-component">
    <el-card shadow="hover" :body-style="{ padding: '20px' }">
      <template #header v-if="showHeader">
        <div class="card-header">
          <span>{{ title }}</span>
          <el-button
            v-if="editable"
            type="primary"
            size="small"
            :icon="Edit"
            @click="handleEdit"
          >
            编辑
          </el-button>
        </div>
      </template>

      <!-- 基本信息 -->
      <el-descriptions :column="column" border>
        <el-descriptions-item label="客户编码">
          {{ customerData.code || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">
          {{ customerData.name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="客户类型">
          <el-tag v-if="customerData.type" :type="getCustomerTypeTag(customerData.type)" size="small">
            {{ getCustomerTypeName(customerData.type) }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="客户等级">
          <el-rate v-if="customerData.level" v-model="customerData.level" disabled />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="联系人">
          {{ customerData.contact || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ customerData.phone || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="电子邮箱">
          {{ customerData.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="地址">
          {{ customerData.address || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 信用信息 -->
      <el-divider content-position="left" v-if="showCredit">信用信息</el-divider>
      <el-descriptions :column="column" border v-if="showCredit">
        <el-descriptions-item label="信用等级">
          <el-rate v-if="customerData.creditRating" v-model="customerData.creditRating" disabled show-score />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="信用额度">
          <span class="amount-text">¥{{ formatAmount(customerData.creditLimit) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="已用额度">
          <span class="amount-text warning">¥{{ formatAmount(customerData.usedCredit) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="可用额度">
          <span class="amount-text success">¥{{ formatAmount(customerData.availableCredit) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="付款条件">
          {{ getPaymentTermName(customerData.paymentTerm) }}
        </el-descriptions-item>
        <el-descriptions-item label="账期(天)">
          {{ customerData.paymentDays || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 信用额度进度条 -->
      <div class="credit-progress" v-if="showCredit && customerData.creditLimit > 0">
        <div class="progress-label">信用额度使用情况</div>
        <el-progress
          :percentage="creditUsagePercentage"
          :color="getCreditColor(creditUsagePercentage)"
          :stroke-width="20"
        >
          <span class="progress-text">
            {{ creditUsagePercentage }}% (¥{{ formatAmount(customerData.usedCredit) }} / ¥{{ formatAmount(customerData.creditLimit) }})
          </span>
        </el-progress>
      </div>

      <!-- 应收统计 -->
      <el-divider content-position="left" v-if="showStatistics">应收统计</el-divider>
      <el-row :gutter="20" v-if="showStatistics" class="statistics-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon primary">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">应收总额</div>
              <div class="stat-value primary">¥{{ formatAmount(customerData.totalReceivable) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon success">
              <el-icon><SuccessFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">已收金额</div>
              <div class="stat-value success">¥{{ formatAmount(customerData.receivedAmount) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon warning">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">未收金额</div>
              <div class="stat-value warning">¥{{ formatAmount(customerData.unreceiveAmount) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon danger">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">逾期金额</div>
              <div class="stat-value danger">¥{{ formatAmount(customerData.overdueAmount) }}</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 合作信息 -->
      <el-divider content-position="left" v-if="showCooperation">合作信息</el-divider>
      <el-descriptions :column="column" border v-if="showCooperation">
        <el-descriptions-item label="首次合作日期">
          {{ customerData.firstCooperationDate || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="最近交易日期">
          {{ customerData.lastTransactionDate || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="累计交易次数">
          {{ customerData.transactionCount || 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="累计交易金额">
          <span class="amount-text">¥{{ formatAmount(customerData.totalTransactionAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="合作状态">
          <el-tag v-if="customerData.cooperationStatus" :type="getCooperationStatusTag(customerData.cooperationStatus)" size="small">
            {{ getCooperationStatusName(customerData.cooperationStatus) }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="客户经理">
          {{ customerData.accountManager || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 备注信息 -->
      <el-divider content-position="left" v-if="showRemark && customerData.remark">备注信息</el-divider>
      <div class="remark-section" v-if="showRemark && customerData.remark">
        {{ customerData.remark }}
      </div>

      <!-- 操作按钮 -->
      <div class="actions" v-if="showActions">
        <el-button type="primary" :icon="Document" @click="handleViewStatement">查看对账单</el-button>
        <el-button type="success" :icon="Histogram" @click="handleViewAging">账龄分析</el-button>
        <el-button type="warning" :icon="CollectionTag" @click="handleViewReceivable">应收明细</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Edit, Money, SuccessFilled, Clock, WarningFilled, Document, Histogram, CollectionTag } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  // 客户数据
  customerData: {
    type: Object,
    default: () => ({})
  },
  // 标题
  title: {
    type: String,
    default: '客户信息'
  },
  // 列数
  column: {
    type: Number,
    default: 3
  },
  // 是否可编辑
  editable: {
    type: Boolean,
    default: false
  },
  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示信用信息
  showCredit: {
    type: Boolean,
    default: true
  },
  // 是否显示统计信息
  showStatistics: {
    type: Boolean,
    default: true
  },
  // 是否显示合作信息
  showCooperation: {
    type: Boolean,
    default: true
  },
  // 是否显示备注
  showRemark: {
    type: Boolean,
    default: true
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['edit', 'view-statement', 'view-aging', 'view-receivable'])

// 计算信用额度使用百分比
const creditUsagePercentage = computed(() => {
  if (!props.customerData.creditLimit || props.customerData.creditLimit === 0) {
    return 0
  }
  const percentage = (props.customerData.usedCredit / props.customerData.creditLimit) * 100
  return Math.min(100, Math.round(percentage))
})

// 编辑
const handleEdit = () => {
  emit('edit', props.customerData)
}

// 查看对账单
const handleViewStatement = () => {
  emit('view-statement', props.customerData)
}

// 查看账龄
const handleViewAging = () => {
  emit('view-aging', props.customerData)
}

// 查看应收明细
const handleViewReceivable = () => {
  emit('view-receivable', props.customerData)
}

// 客户类型名称
const getCustomerTypeName = (type) => {
  const map = {
    ENTERPRISE: '企业客户',
    INDIVIDUAL: '个人客户',
    GOVERNMENT: '政府机构',
    OTHER: '其他'
  }
  return map[type] || type
}

// 客户类型标签
const getCustomerTypeTag = (type) => {
  const map = {
    ENTERPRISE: '',
    INDIVIDUAL: 'success',
    GOVERNMENT: 'warning',
    OTHER: 'info'
  }
  return map[type] || ''
}

// 付款条件名称
const getPaymentTermName = (term) => {
  const map = {
    IMMEDIATE: '即期',
    NET30: '30天',
    NET60: '60天',
    NET90: '90天',
    CUSTOM: '自定义'
  }
  return map[term] || term || '-'
}

// 合作状态名称
const getCooperationStatusName = (status) => {
  const map = {
    ACTIVE: '正常',
    INACTIVE: '暂停',
    TERMINATED: '终止',
    POTENTIAL: '潜在'
  }
  return map[status] || status
}

// 合作状态标签
const getCooperationStatusTag = (status) => {
  const map = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    TERMINATED: 'danger',
    POTENTIAL: 'info'
  }
  return map[status] || ''
}

// 信用额度颜色
const getCreditColor = (percentage) => {
  if (percentage < 60) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 金额格式化
const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
</script>

<style scoped lang="scss">
.customer-info-component {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .amount-text {
    font-weight: 500;

    &.success {
      color: #67c23a;
    }

    &.warning {
      color: #e6a23c;
    }

    &.danger {
      color: #f56c6c;
    }
  }

  .credit-progress {
    margin-top: 20px;

    .progress-label {
      margin-bottom: 10px;
      font-weight: 500;
      color: #606266;
    }

    .progress-text {
      font-size: 12px;
      color: #fff;
    }
  }

  .statistics-row {
    margin-top: 15px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

      .stat-icon {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        margin-right: 15px;

        .el-icon {
          font-size: 28px;
          color: #fff;
        }

        &.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.success {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        }

        &.warning {
          background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
        }

        &.danger {
          background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
        }
      }

      .stat-content {
        flex: 1;

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 20px;
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

          &.danger {
            color: #f56c6c;
          }
        }
      }
    }
  }

  .remark-section {
    padding: 15px;
    background: #f5f7fa;
    border-radius: 4px;
    color: #606266;
    line-height: 1.6;
    min-height: 60px;
  }

  .actions {
    margin-top: 20px;
    text-align: center;
  }

  .el-divider {
    margin: 20px 0;
  }
}
</style>
