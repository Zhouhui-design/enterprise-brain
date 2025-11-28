<template>
  <div class="voucher-table-component">
    <!-- 凭证分录表格 -->
    <el-table
      :data="entries"
      border
      :show-summary="showSummary"
      :summary-method="getSummaries"
      class="voucher-table"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      
      <el-table-column label="摘要" min-width="200">
        <template #default="{ row, $index }">
          <el-input
            v-if="editable"
            v-model="row.summary"
            placeholder="请输入摘要"
            @input="handleChange"
          />
          <span v-else>{{ row.summary }}</span>
        </template>
      </el-table-column>

      <el-table-column label="会计科目" width="250">
        <template #default="{ row, $index }">
          <el-select
            v-if="editable"
            v-model="row.subjectId"
            placeholder="请选择科目"
            filterable
            style="width: 100%;"
            @change="handleChange"
          >
            <el-option
              v-for="subject in accountSubjects"
              :key="subject.id"
              :label="`${subject.code} - ${subject.name}`"
              :value="subject.id"
            />
          </el-select>
          <span v-else>{{ getSubjectName(row.subjectId) }}</span>
        </template>
      </el-table-column>

      <el-table-column label="借方金额" width="150" align="right">
        <template #default="{ row, $index }">
          <el-input-number
            v-if="editable"
            v-model="row.debitAmount"
            :precision="2"
            :min="0"
            placeholder="0.00"
            :controls="false"
            style="width: 100%;"
            @input="handleAmountChange(row, 'debit')"
          />
          <span v-else :class="{'text-success': row.debitAmount > 0}">
            {{ row.debitAmount > 0 ? formatAmount(row.debitAmount) : '' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column label="贷方金额" width="150" align="right">
        <template #default="{ row, $index }">
          <el-input-number
            v-if="editable"
            v-model="row.creditAmount"
            :precision="2"
            :min="0"
            placeholder="0.00"
            :controls="false"
            style="width: 100%;"
            @input="handleAmountChange(row, 'credit')"
          />
          <span v-else :class="{'text-danger': row.creditAmount > 0}">
            {{ row.creditAmount > 0 ? formatAmount(row.creditAmount) : '' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column v-if="editable" label="操作" width="100" align="center">
        <template #default="{ row, $index }">
          <el-button
            type="danger"
            size="small"
            :icon="Delete"
            link
            @click="handleRemove($index)"
            :disabled="entries.length <= minRows"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 操作按钮 -->
    <div v-if="editable" class="table-actions">
      <el-button :icon="Plus" @click="handleAdd">添加分录</el-button>
      <el-button :icon="Document" @click="handleCopy" v-if="allowCopy">复制上一行</el-button>
    </div>

    <!-- 借贷平衡提示 -->
    <div class="balance-info">
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="balance-item">
            <span class="label">借方合计：</span>
            <span class="value text-success">{{ formatAmount(totalDebit) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="balance-item">
            <span class="label">贷方合计：</span>
            <span class="value text-danger">{{ formatAmount(totalCredit) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="balance-item">
            <span class="label">平衡状态：</span>
            <el-tag :type="isBalanced ? 'success' : 'danger'" size="large">
              {{ isBalanced ? '借贷平衡' : `不平衡 (差额: ${formatAmount(Math.abs(balanceDiff))})` }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { Plus, Delete, Document } from '@element-plus/icons-vue'

const props = defineProps({
  // 凭证分录数据
  entries: {
    type: Array,
    required: true,
    default: () => []
  },
  // 是否可编辑
  editable: {
    type: Boolean,
    default: true
  },
  // 会计科目列表
  accountSubjects: {
    type: Array,
    default: () => [
      { id: '1', code: '1001', name: '库存现金' },
      { id: '2', code: '1002', name: '银行存款' },
      { id: '3', code: '1122', name: '应收账款' },
      { id: '4', code: '1123', name: '预付账款' },
      { id: '5', code: '2202', name: '应付账款' },
      { id: '6', code: '6001', name: '主营业务收入' },
      { id: '7', code: '6401', name: '主营业务成本' }
    ]
  },
  // 是否显示合计
  showSummary: {
    type: Boolean,
    default: true
  },
  // 最小行数
  minRows: {
    type: Number,
    default: 2
  },
  // 是否允许复制
  allowCopy: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:entries', 'change', 'add', 'remove', 'balance-change'])

// 计算借方合计
const totalDebit = computed(() => {
  return props.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0)
})

// 计算贷方合计
const totalCredit = computed(() => {
  return props.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0)
})

// 计算差额
const balanceDiff = computed(() => {
  return totalDebit.value - totalCredit.value
})

// 是否平衡
const isBalanced = computed(() => {
  return Math.abs(balanceDiff.value) < 0.01 && totalDebit.value > 0
})

// 监听平衡状态变化
watch(isBalanced, (newVal) => {
  emit('balance-change', {
    isBalanced: newVal,
    totalDebit: totalDebit.value,
    totalCredit: totalCredit.value,
    balanceDiff: balanceDiff.value
  })
})

// 获取科目名称
const getSubjectName = (subjectId) => {
  const subject = props.accountSubjects.find(s => s.id === subjectId)
  return subject ? `${subject.code} - ${subject.name}` : ''
}

// 格式化金额
const formatAmount = (amount) => {
  return `¥${(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 汇总方法
const getSummaries = (param) => {
  const { columns } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
    } else if (index === 1 || index === 2) {
      sums[index] = ''
    } else if (index === 3) {
      sums[index] = formatAmount(totalDebit.value)
    } else if (index === 4) {
      sums[index] = formatAmount(totalCredit.value)
    } else {
      sums[index] = ''
    }
  })
  
  return sums
}

// 添加分录
const handleAdd = () => {
  const newEntry = {
    summary: '',
    subjectId: '',
    debitAmount: 0,
    creditAmount: 0
  }
  const newEntries = [...props.entries, newEntry]
  emit('update:entries', newEntries)
  emit('add', newEntry)
  emit('change', newEntries)
}

// 删除分录
const handleRemove = (index) => {
  if (props.entries.length <= props.minRows) {
    return
  }
  const newEntries = props.entries.filter((_, i) => i !== index)
  emit('update:entries', newEntries)
  emit('remove', index)
  emit('change', newEntries)
}

// 复制上一行
const handleCopy = () => {
  if (props.entries.length === 0) return
  
  const lastEntry = props.entries[props.entries.length - 1]
  const newEntry = {
    summary: lastEntry.summary,
    subjectId: lastEntry.subjectId,
    debitAmount: 0,
    creditAmount: 0
  }
  const newEntries = [...props.entries, newEntry]
  emit('update:entries', newEntries)
  emit('add', newEntry)
  emit('change', newEntries)
}

// 金额变化处理
const handleAmountChange = (row, type) => {
  // 如果输入了借方，清空贷方；反之亦然
  if (type === 'debit' && row.debitAmount > 0) {
    row.creditAmount = 0
  } else if (type === 'credit' && row.creditAmount > 0) {
    row.debitAmount = 0
  }
  emit('change', props.entries)
}

// 内容变化处理
const handleChange = () => {
  emit('change', props.entries)
}
</script>

<style scoped>
.voucher-table-component {
  width: 100%;
}

.voucher-table {
  margin-bottom: 15px;
}

.table-actions {
  margin-bottom: 20px;
}

.balance-info {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.balance-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.balance-item .label {
  margin-right: 8px;
  color: #606266;
}

.balance-item .value {
  font-weight: bold;
  font-size: 18px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: right;
}
</style>
