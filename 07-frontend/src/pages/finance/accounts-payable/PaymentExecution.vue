<template>
  <div class="payment-execution">
    <div class="header">
      <h2>付款执行</h2>
      <div class="header-actions">
        <el-button type="primary" @click="executeBatchPayment">批量付款</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="供应商名称">
        <el-input v-model="searchForm.supplierName" placeholder="请输入供应商名称" />
      </el-form-item>
      <el-form-item label="付款状态">
        <el-select v-model="searchForm.paymentStatus" placeholder="请选择付款状态">
          <el-option label="全部" value="" />
          <el-option label="待付款" value="pending" />
          <el-option label="付款中" value="processing" />
          <el-option label="已付款" value="paid" />
          <el-option label="付款失败" value="failed" />
        </el-select>
      </el-form-item>
      <el-form-item label="付款日期">
        <el-date-picker
          v-model="searchForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 付款执行统计 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">付款总额</div>
              <div class="stat-value primary">{{ formatCurrency(totalAmount) }}</div>
              <div class="stat-desc">{{ paymentCount }} 笔付款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">待付款</div>
              <div class="stat-value warning">{{ formatCurrency(pendingAmount) }}</div>
              <div class="stat-desc">{{ pendingCount }} 笔待付款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">已付款</div>
              <div class="stat-value success">{{ formatCurrency(paidAmount) }}</div>
              <div class="stat-desc">{{ paidCount }} 笔已付款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">付款失败</div>
              <div class="stat-value danger">{{ formatCurrency(failedAmount) }}</div>
              <div class="stat-desc">{{ failedCount }} 笔付款失败</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 付款执行列表 -->
    <el-table
      v-loading="loading"
      :data="paymentList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="supplierName" label="供应商名称" width="180" />
      <el-table-column prop="invoiceNumber" label="发票编号" width="150" />
      <el-table-column prop="paymentAmount" label="付款金额" width="120" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.paymentAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="applyDate" label="申请日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.applyDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="paymentDate" label="计划付款日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.paymentDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="actualPaymentDate" label="实际付款日期" width="120">
        <template #default="{ row }">
          {{ row.actualPaymentDate ? formatDate(row.actualPaymentDate) : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="paymentMethod" label="付款方式" width="120">
        <template #default="{ row }">
          {{ getPaymentMethodText(row.paymentMethod) }}
        </template>
      </el-table-column>
      <el-table-column prop="paymentStatus" label="付款状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getPaymentStatusType(row.paymentStatus)">{{ getPaymentStatusText(row.paymentStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetails(row)">详情</el-button>
          <el-button
            v-if="row.paymentStatus === 'pending'"
            type="primary"
            size="small"
            @click="executePayment(row)"
          >
            执行付款
          </el-button>
          <el-button
            v-if="row.paymentStatus === 'failed'"
            type="warning"
            size="small"
            @click="retryPayment(row)"
          >
            重试
          </el-button>
          <el-button
            v-if="row.paymentStatus === 'paid'"
            size="small"
            @click="printReceipt(row)"
          >
            打印回单
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'PaymentExecution',
  setup() {
    const loading = ref(false)
    const paymentList = ref([])
    const selectedRows = ref([])

    // 搜索表单
    const searchForm = reactive({
      supplierName: '',
      paymentStatus: '',
      dateRange: null
    })

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })

    // 计算属性
    const totalAmount = computed(() => {
      return paymentList.value.reduce((sum, item) => sum + item.paymentAmount, 0)
    })

    const pendingAmount = computed(() => {
      return paymentList.value
        .filter(item => item.paymentStatus === 'pending')
        .reduce((sum, item) => sum + item.paymentAmount, 0)
    })

    const paidAmount = computed(() => {
      return paymentList.value
        .filter(item => item.paymentStatus === 'paid')
        .reduce((sum, item) => sum + item.paymentAmount, 0)
    })

    const failedAmount = computed(() => {
      return paymentList.value
        .filter(item => item.paymentStatus === 'failed')
        .reduce((sum, item) => sum + item.paymentAmount, 0)
    })

    const paymentCount = computed(() => paymentList.value.length)
    
    const pendingCount = computed(() => {
      return paymentList.value.filter(item => item.paymentStatus === 'pending').length
    })
    
    const paidCount = computed(() => {
      return paymentList.value.filter(item => item.paymentStatus === 'paid').length
    })
    
    const failedCount = computed(() => {
      return paymentList.value.filter(item => item.paymentStatus === 'failed').length
    })

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00'
      return value.toFixed(2)
    }

    // 获取付款方式文本
    const getPaymentMethodText = (method) => {
      switch (method) {
        case 'bankTransfer': return '银行转账'
        case 'check': return '支票'
        case 'onlineBanking': return '网银'
        case 'alipay': return '支付宝'
        case 'wechat': return '微信'
        default: return '其他'
      }
    }

    // 获取付款状态类型
    const getPaymentStatusType = (status) => {
      switch (status) {
        case 'pending': return 'warning'
        case 'processing': return 'primary'
        case 'paid': return 'success'
        case 'failed': return 'danger'
        default: return 'default'
      }
    }

    // 获取付款状态文本
    const getPaymentStatusText = (status) => {
      switch (status) {
        case 'pending': return '待付款'
        case 'processing': return '付款中'
        case 'paid': return '已付款'
        case 'failed': return '付款失败'
        default: return '未知'
      }
    }

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val
    }

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadData()
    }

    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadData()
    }

    // 搜索
    const search = () => {
      pagination.currentPage = 1
      loadData()
    }

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key === 'dateRange') {
          searchForm[key] = null
        } else {
          searchForm[key] = ''
        }
      })
      pagination.currentPage = 1
      loadData()
    }

    // 批量付款
    const executeBatchPayment = () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请至少选择一条记录')
        return
      }
      
      const pendingRows = selectedRows.value.filter(row => row.paymentStatus === 'pending')
      if (pendingRows.length === 0) {
        ElMessage.warning('请选择待付款的记录')
        return
      }
      
      ElMessageBox.confirm(`确定要对选中的 ${pendingRows.length} 笔付款进行批量执行吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量付款执行
        setTimeout(() => {
          ElMessage.success('批量付款执行成功')
          loadData()
        }, 1000)
      }).catch(() => {})
    }

    // 查看详情
    const viewDetails = (row) => {
      ElMessage.info(`查看付款详情: ${row.id}`)
    }

    // 执行付款
    const executePayment = (row) => {
      ElMessageBox.confirm(`确定要执行付款 ${row.invoiceNumber} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟付款执行
        setTimeout(() => {
          ElMessage.success('付款执行成功')
          loadData()
        }, 500)
      }).catch(() => {})
    }

    // 重试付款
    const retryPayment = (row) => {
      ElMessageBox.confirm(`确定要重新执行付款 ${row.invoiceNumber} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟重试付款
        setTimeout(() => {
          ElMessage.success('重试付款成功')
          loadData()
        }, 500)
      }).catch(() => {})
    }

    // 打印回单
    const printReceipt = (row) => {
      ElMessage.info(`打印回单: ${row.invoiceNumber}`)
    }

    // 刷新数据
    const refreshData = () => {
      loadData()
      ElMessage.success('数据已刷新')
    }

    // 加载数据
    const loadData = () => {
      loading.value = true
      // 模拟API调用延迟
      setTimeout(() => {
        // 模拟数据
        const mockData = [
          {
            id: 1,
            supplierName: '北京科技有限公司',
            invoiceNumber: 'INV20240001',
            paymentAmount: 50000.00,
            applyDate: '2024-01-15',
            paymentDate: '2024-02-15',
            actualPaymentDate: null,
            paymentMethod: 'bankTransfer',
            paymentStatus: 'pending',
            operator: '张三'
          },
          {
            id: 2,
            supplierName: '上海贸易公司',
            invoiceNumber: 'INV20240002',
            paymentAmount: 120000.00,
            applyDate: '2024-01-20',
            paymentDate: '2024-02-20',
            actualPaymentDate: '2024-02-20',
            paymentMethod: 'onlineBanking',
            paymentStatus: 'paid',
            operator: '李四'
          },
          {
            id: 3,
            supplierName: '广州制造有限公司',
            invoiceNumber: 'INV20240003',
            paymentAmount: 80000.00,
            applyDate: '2024-01-10',
            paymentDate: '2024-02-10',
            actualPaymentDate: null,
            paymentMethod: 'bankTransfer',
            paymentStatus: 'failed',
            operator: '王五'
          }
        ]

        paymentList.value = mockData
        pagination.total = mockData.length
        loading.value = false
      }, 500)
    }

    // 生命周期
    onMounted(() => {
      loadData()
    })

    return {
      loading,
      paymentList,
      selectedRows,
      searchForm,
      pagination,
      totalAmount,
      pendingAmount,
      paidAmount,
      failedAmount,
      paymentCount,
      pendingCount,
      paidCount,
      failedCount,
      formatDate,
      formatCurrency,
      getPaymentMethodText,
      getPaymentStatusType,
      getPaymentStatusText,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      executeBatchPayment,
      viewDetails,
      executePayment,
      retryPayment,
      printReceipt,
      refreshData
    }
  }
}
</script>

<style scoped>
.payment-execution {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 4px;
  overflow: hidden;
}

.stat-content {
  text-align: center;
  padding: 20px 0;
}

.stat-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-desc {
  color: #909399;
  font-size: 12px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>