<template>
  <div class="collection-plan-component">
    <el-card shadow="hover" :body-style="{ padding: '15px' }">
      <template #header v-if="showHeader">
        <div class="card-header">
          <span>{{ title }}</span>
          <el-button
            v-if="editable"
            type="primary"
            size="small"
            :icon="Plus"
            @click="handleAdd"
          >
            添加计划
          </el-button>
        </div>
      </template>

      <!-- 计划表格 -->
      <el-table :data="planList" border :max-height="maxHeight">
        <el-table-column type="index" label="序号" width="60" />
        
        <!-- 计划日期 -->
        <el-table-column label="计划日期" width="180">
          <template #default="{ row }">
            <el-date-picker
              v-if="editable"
              v-model="row.planDate"
              type="date"
              placeholder="选择日期"
              style="width: 100%"
              @change="handleChange"
            />
            <span v-else>{{ row.planDate }}</span>
          </template>
        </el-table-column>

        <!-- 计划金额 -->
        <el-table-column label="计划金额" width="160">
          <template #default="{ row }">
            <el-input-number
              v-if="editable"
              v-model="row.planAmount"
              :min="0"
              :precision="2"
              style="width: 100%"
              @change="handleChange"
            />
            <span v-else class="amount-text">¥{{ formatAmount(row.planAmount) }}</span>
          </template>
        </el-table-column>

        <!-- 收款方式 -->
        <el-table-column label="收款方式" width="150">
          <template #default="{ row }">
            <el-select
              v-if="editable"
              v-model="row.paymentMethod"
              placeholder="请选择"
              style="width: 100%"
              @change="handleChange"
            >
              <el-option label="银行转账" value="BANK" />
              <el-option label="现金" value="CASH" />
              <el-option label="支票" value="CHECK" />
              <el-option label="承兑汇票" value="ACCEPTANCE" />
              <el-option label="其他" value="OTHER" />
            </el-select>
            <span v-else>{{ getPaymentMethodName(row.paymentMethod) }}</span>
          </template>
        </el-table-column>

        <!-- 执行状态 -->
        <el-table-column label="执行状态" width="100" v-if="showStatus">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 实际收款日期 -->
        <el-table-column label="实际收款日期" width="120" v-if="showActual">
          <template #default="{ row }">
            {{ row.actualDate || '-' }}
          </template>
        </el-table-column>

        <!-- 实际收款金额 -->
        <el-table-column label="实际金额" width="140" v-if="showActual" align="right">
          <template #default="{ row }">
            <span v-if="row.actualAmount" class="amount-text success">
              ¥{{ formatAmount(row.actualAmount) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 差额 -->
        <el-table-column label="差额" width="120" v-if="showActual" align="right">
          <template #default="{ row }">
            <span
              v-if="row.actualAmount"
              class="amount-text"
              :class="{ warning: getDifference(row) !== 0 }"
            >
              ¥{{ formatAmount(getDifference(row)) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <!-- 备注 -->
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <el-input
              v-if="editable"
              v-model="row.remark"
              placeholder="请输入备注"
              @change="handleChange"
            />
            <span v-else>{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>

        <!-- 操作 -->
        <el-table-column label="操作" width="150" fixed="right" v-if="editable || showActions">
          <template #default="{ row, $index }">
            <!-- 编辑模式操作 -->
            <template v-if="editable">
              <el-button
                link
                type="primary"
                size="small"
                :icon="CopyDocument"
                @click="handleCopy($index)"
              >
                复制
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                :icon="Delete"
                @click="handleRemove($index)"
              >
                删除
              </el-button>
            </template>
            
            <!-- 查看模式操作 -->
            <template v-else-if="showActions">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleViewDetail(row)"
              >
                查看
              </el-button>
              <el-button
                v-if="row.status === 'PENDING'"
                link
                type="success"
                size="small"
                @click="handleExecute(row)"
              >
                执行
              </el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 统计信息 -->
      <div class="plan-summary" v-if="showSummary">
        <div class="summary-item">
          <span class="label">计划总额:</span>
          <span class="value">¥{{ formatAmount(totalPlanAmount) }}</span>
        </div>
        <div class="summary-item" v-if="showActual">
          <span class="label">实际总额:</span>
          <span class="value success">¥{{ formatAmount(totalActualAmount) }}</span>
        </div>
        <div class="summary-item" v-if="showActual">
          <span class="label">差额:</span>
          <span class="value" :class="{ warning: totalDifference !== 0 }">
            ¥{{ formatAmount(totalDifference) }}
          </span>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="plan-progress" v-if="showProgress && totalPlanAmount > 0">
        <el-progress
          :percentage="progressPercentage"
          :color="getProgressColor(progressPercentage)"
          :stroke-width="20"
        >
          <span class="progress-text">
            已完成 {{ progressPercentage }}%
          </span>
        </el-progress>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, CopyDocument, Delete } from '@element-plus/icons-vue'

// Props
const props = defineProps({
  // 计划列表
  planData: {
    type: Array,
    default: () => []
  },
  // 标题
  title: {
    type: String,
    default: '收款计划'
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
  // 是否显示状态
  showStatus: {
    type: Boolean,
    default: false
  },
  // 是否显示实际数据
  showActual: {
    type: Boolean,
    default: false
  },
  // 是否显示汇总
  showSummary: {
    type: Boolean,
    default: true
  },
  // 是否显示进度
  showProgress: {
    type: Boolean,
    default: false
  },
  // 是否显示操作列
  showActions: {
    type: Boolean,
    default: false
  },
  // 最大高度
  maxHeight: {
    type: Number,
    default: 400
  }
})

// Emits
const emit = defineEmits(['update:planData', 'change', 'add', 'remove', 'copy', 'view-detail', 'execute'])

// 计划列表
const planList = ref([...props.planData])

// 监听外部数据变化
watch(() => props.planData, (newVal) => {
  planList.value = [...newVal]
}, { deep: true })

// 计算计划总额
const totalPlanAmount = computed(() => {
  return planList.value.reduce((sum, item) => sum + (item.planAmount || 0), 0)
})

// 计算实际总额
const totalActualAmount = computed(() => {
  return planList.value.reduce((sum, item) => sum + (item.actualAmount || 0), 0)
})

// 计算总差额
const totalDifference = computed(() => {
  return totalActualAmount.value - totalPlanAmount.value
})

// 计算完成百分比
const progressPercentage = computed(() => {
  if (totalPlanAmount.value === 0) return 0
  const percentage = (totalActualAmount.value / totalPlanAmount.value) * 100
  return Math.min(100, Math.round(percentage))
})

// 添加计划
const handleAdd = () => {
  const newPlan = {
    planDate: '',
    planAmount: 0,
    paymentMethod: 'BANK',
    status: 'PENDING',
    actualDate: null,
    actualAmount: 0,
    remark: ''
  }
  planList.value.push(newPlan)
  emitChange()
  emit('add', newPlan)
}

// 复制计划
const handleCopy = (index) => {
  const copyPlan = { ...planList.value[index] }
  planList.value.splice(index + 1, 0, copyPlan)
  emitChange()
  emit('copy', copyPlan, index)
}

// 删除计划
const handleRemove = (index) => {
  if (planList.value.length <= 1) {
    ElMessage.warning('至少保留一条计划')
    return
  }
  
  const removedPlan = planList.value[index]
  planList.value.splice(index, 1)
  emitChange()
  emit('remove', removedPlan, index)
}

// 查看详情
const handleViewDetail = (row) => {
  emit('view-detail', row)
}

// 执行收款
const handleExecute = (row) => {
  emit('execute', row)
}

// 数据变更
const handleChange = () => {
  emitChange()
}

// 发送变更事件
const emitChange = () => {
  emit('update:planData', planList.value)
  emit('change', planList.value)
}

// 计算差额
const getDifference = (row) => {
  return (row.actualAmount || 0) - (row.planAmount || 0)
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

// 进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 50) return '#f56c6c'
  if (percentage < 80) return '#e6a23c'
  if (percentage < 100) return '#409eff'
  return '#67c23a'
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
.collection-plan-component {
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
  }

  .plan-summary {
    display: flex;
    justify-content: flex-end;
    gap: 30px;
    margin-top: 15px;
    padding: 15px;
    background: #f5f7fa;
    border-radius: 4px;

    .summary-item {
      display: flex;
      align-items: center;
      gap: 10px;

      .label {
        color: #606266;
        font-size: 14px;
      }

      .value {
        font-size: 16px;
        font-weight: bold;
        color: #303133;

        &.success {
          color: #67c23a;
        }

        &.warning {
          color: #e6a23c;
        }
      }
    }
  }

  .plan-progress {
    margin-top: 15px;

    .progress-text {
      font-size: 12px;
      color: #fff;
    }
  }
}
</style>
