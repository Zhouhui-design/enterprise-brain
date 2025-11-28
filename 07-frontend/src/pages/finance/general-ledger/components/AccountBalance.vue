<template>
  <div class="account-balance-component">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>{{ title }}</span>
          <div v-if="showActions">
            <el-button type="primary" size="small" :icon="Refresh" @click="handleRefresh">刷新</el-button>
            <el-button type="success" size="small" :icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="stats-row" v-if="showStats">
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">期初余额</div>
            <div class="stat-value" :class="getAmountClass(stats.openingBalance)">
              {{ formatAmount(stats.openingBalance) }}
            </div>
            <div class="stat-direction">
              <el-tag size="small" :type="stats.openingBalance >= 0 ? 'success' : 'danger'">
                {{ stats.openingBalance >= 0 ? '借' : '贷' }}
              </el-tag>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">本期借方</div>
            <div class="stat-value text-success">
              {{ formatAmount(stats.debitAmount) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">本期贷方</div>
            <div class="stat-value text-danger">
              {{ formatAmount(stats.creditAmount) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item">
            <div class="stat-label">期末余额</div>
            <div class="stat-value" :class="getAmountClass(stats.closingBalance)">
              {{ formatAmount(stats.closingBalance) }}
            </div>
            <div class="stat-direction">
              <el-tag size="small" :type="stats.closingBalance >= 0 ? 'success' : 'danger'">
                {{ stats.closingBalance >= 0 ? '借' : '贷' }}
              </el-tag>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 科目余额列表 -->
      <el-table
        :data="balanceData"
        border
        v-loading="loading"
        :show-summary="showSummary"
        :summary-method="getSummaries"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        row-key="id"
        :default-expand-all="expandAll"
      >
        <el-table-column prop="subjectCode" label="科目编码" width="120" fixed />
        <el-table-column prop="subjectName" label="科目名称" min-width="200" fixed />
        
        <el-table-column label="期初余额" align="center">
          <el-table-column label="借方" align="right" width="130">
            <template #default="scope">
              <span v-if="scope.row.openingDebit > 0" class="text-success">
                {{ formatAmount(scope.row.openingDebit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="130">
            <template #default="scope">
              <span v-if="scope.row.openingCredit > 0" class="text-danger">
                {{ formatAmount(scope.row.openingCredit) }}
              </span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="本期发生额" align="center">
          <el-table-column label="借方" align="right" width="130">
            <template #default="scope">
              <span class="text-success">{{ formatAmount(scope.row.currentDebit) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="130">
            <template #default="scope">
              <span class="text-danger">{{ formatAmount(scope.row.currentCredit) }}</span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column v-if="showYearTotal" label="本年累计" align="center">
          <el-table-column label="借方" align="right" width="130">
            <template #default="scope">
              <span class="text-success">{{ formatAmount(scope.row.yearDebit) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="130">
            <template #default="scope">
              <span class="text-danger">{{ formatAmount(scope.row.yearCredit) }}</span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column label="期末余额" align="center">
          <el-table-column label="借方" align="right" width="130">
            <template #default="scope">
              <span v-if="scope.row.closingDebit > 0" class="text-success font-bold">
                {{ formatAmount(scope.row.closingDebit) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="贷方" align="right" width="130">
            <template #default="scope">
              <span v-if="scope.row.closingCredit > 0" class="text-danger font-bold">
                {{ formatAmount(scope.row.closingCredit) }}
              </span>
            </template>
          </el-table-column>
        </el-table-column>

        <el-table-column v-if="showActions" label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="handleViewDetail(scope.row)">
              查看明细
            </el-button>
            <el-button type="success" size="small" link @click="handleViewVoucher(scope.row)">
              查看凭证
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-if="showPagination"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Refresh, Download } from '@element-plus/icons-vue'

const props = defineProps({
  // 标题
  title: {
    type: String,
    default: '科目余额'
  },
  // 余额数据
  balanceData: {
    type: Array,
    required: true,
    default: () => []
  },
  // 是否显示统计信息
  showStats: {
    type: Boolean,
    default: true
  },
  // 统计数据
  stats: {
    type: Object,
    default: () => ({
      openingBalance: 0,
      debitAmount: 0,
      creditAmount: 0,
      closingBalance: 0
    })
  },
  // 是否显示本年累计
  showYearTotal: {
    type: Boolean,
    default: true
  },
  // 是否显示合计
  showSummary: {
    type: Boolean,
    default: true
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: true
  },
  // 是否显示分页
  showPagination: {
    type: Boolean,
    default: false
  },
  // 总数
  total: {
    type: Number,
    default: 0
  },
  // 是否展开全部
  expandAll: {
    type: Boolean,
    default: false
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'export', 'view-detail', 'view-voucher', 'page-change'])

const currentPage = ref(1)
const pageSize = ref(20)

// 格式化金额
const formatAmount = (amount) => {
  return `¥${Math.abs(amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 获取金额样式类
const getAmountClass = (amount) => {
  return amount >= 0 ? 'text-success' : 'text-danger'
}

// 汇总方法
const getSummaries = (param) => {
  const { columns, data } = param
  const sums = []
  
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
    } else if (index === 1) {
      sums[index] = ''
    } else {
      const values = data.map(item => {
        const prop = column.property
        return Number(item[prop])
      })
      
      if (!values.every(value => isNaN(value))) {
        const sum = values.reduce((prev, curr) => {
          const value = Number(curr)
          if (!isNaN(value)) {
            return prev + value
          } else {
            return prev
          }
        }, 0)
        sums[index] = formatAmount(sum)
      } else {
        sums[index] = ''
      }
    }
  })
  
  return sums
}

// 刷新
const handleRefresh = () => {
  emit('refresh')
}

// 导出
const handleExport = () => {
  emit('export')
}

// 查看明细
const handleViewDetail = (row) => {
  emit('view-detail', row)
}

// 查看凭证
const handleViewVoucher = (row) => {
  emit('view-voucher', row)
}

// 分页大小变化
const handleSizeChange = (val) => {
  emit('page-change', { page: currentPage.value, size: val })
}

// 当前页变化
const handleCurrentChange = (val) => {
  emit('page-change', { page: val, size: pageSize.value })
}
</script>

<style scoped>
.account-balance-component {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-direction {
  margin-top: 5px;
}

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.font-bold {
  font-weight: bold;
}

:deep(.el-table__row--level-1) {
  background-color: #fafafa;
}

:deep(.el-table__row--level-2) {
  background-color: #f5f5f5;
}
</style>
