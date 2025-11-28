<template>
  <div class="payment-application">
    <div class="header">
      <h2>付款申请</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createApplication">新建申请</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="申请人">
        <el-input v-model="searchForm.applicant" placeholder="请输入申请人" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态">
          <el-option label="全部" value="" />
          <el-option label="待审批" value="pending" />
          <el-option label="已批准" value="approved" />
          <el-option label="已拒绝" value="rejected" />
          <el-option label="已付款" value="paid" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请日期">
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

    <!-- 付款申请统计 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">申请总额</div>
              <div class="stat-value primary">{{ formatCurrency(totalAmount) }}</div>
              <div class="stat-desc">{{ applicationCount }} 笔申请</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">待审批</div>
              <div class="stat-value warning">{{ formatCurrency(pendingAmount) }}</div>
              <div class="stat-desc">{{ pendingCount }} 笔待审批</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">已批准</div>
              <div class="stat-value success">{{ formatCurrency(approvedAmount) }}</div>
              <div class="stat-desc">{{ approvedCount }} 笔已批准</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">已付款</div>
              <div class="stat-value info">{{ formatCurrency(paidAmount) }}</div>
              <div class="stat-desc">{{ paidCount }} 笔已付款</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 付款申请列表 -->
    <el-table
      v-loading="loading"
      :data="applicationList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="applicant" label="申请人" width="120" />
      <el-table-column prop="supplierName" label="供应商名称" width="180" />
      <el-table-column prop="invoiceNumber" label="发票编号" width="150" />
      <el-table-column prop="applicationAmount" label="申请金额" width="120" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.applicationAmount) }}
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
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="approver" label="审批人" width="120" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetails(row)">详情</el-button>
          <el-button
            v-if="row.status === 'pending'"
            type="primary"
            size="small"
            @click="approveApplication(row)"
          >
            审批
          </el-button>
          <el-button
            v-if="row.status === 'approved'"
            type="success"
            size="small"
            @click="executePayment(row)"
          >
            付款
          </el-button>
          <el-button
            v-if="row.status === 'pending' || row.status === 'approved'"
            type="danger"
            size="small"
            @click="cancelApplication(row)"
          >
            取消
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
import { useRouter } from 'vue-router'

export default {
  name: 'PaymentApplication',
  setup() {
    const router = useRouter()
    const loading = ref(false)
    const applicationList = ref([])
    const selectedRows = ref([])

    // 搜索表单
    const searchForm = reactive({
      applicant: '',
      status: '',
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
      return applicationList.value.reduce((sum, item) => sum + item.applicationAmount, 0)
    })

    const pendingAmount = computed(() => {
      return applicationList.value
        .filter(item => item.status === 'pending')
        .reduce((sum, item) => sum + item.applicationAmount, 0)
    })

    const approvedAmount = computed(() => {
      return applicationList.value
        .filter(item => item.status === 'approved')
        .reduce((sum, item) => sum + item.applicationAmount, 0)
    })

    const paidAmount = computed(() => {
      return applicationList.value
        .filter(item => item.status === 'paid')
        .reduce((sum, item) => sum + item.applicationAmount, 0)
    })

    const applicationCount = computed(() => applicationList.value.length)
    
    const pendingCount = computed(() => {
      return applicationList.value.filter(item => item.status === 'pending').length
    })
    
    const approvedCount = computed(() => {
      return applicationList.value.filter(item => item.status === 'approved').length
    })
    
    const paidCount = computed(() => {
      return applicationList.value.filter(item => item.status === 'paid').length
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

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'pending': return 'warning'
        case 'approved': return 'primary'
        case 'rejected': return 'danger'
        case 'paid': return 'success'
        default: return 'default'
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待审批'
        case 'approved': return '已批准'
        case 'rejected': return '已拒绝'
        case 'paid': return '已付款'
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

    // 新建申请
    const createApplication = () => {
      router.push('/finance/accounts-payable/payment-application/create')
    }

    // 查看详情
    const viewDetails = (row) => {
      router.push(`/finance/accounts-payable/payment-application/${row.id}`)
    }

    // 审批申请
    const approveApplication = (row) => {
      router.push(`/finance/accounts-payable/payment-application/${row.id}/approve`)
    }

    // 执行付款
    const executePayment = (row) => {
      ElMessageBox.confirm(`确定要执行付款申请 ${row.id} 吗？`, '提示', {
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

    // 取消申请
    const cancelApplication = (row) => {
      ElMessageBox.confirm(`确定要取消付款申请 ${row.id} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟取消
        setTimeout(() => {
          ElMessage.success('取消成功')
          loadData()
        }, 500)
      }).catch(() => {})
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
            applicant: '张三',
            supplierName: '北京科技有限公司',
            invoiceNumber: 'INV20240001',
            applicationAmount: 50000.00,
            applyDate: '2024-01-15',
            paymentDate: '2024-02-15',
            status: 'pending',
            approver: '李四'
          },
          {
            id: 2,
            applicant: '王五',
            supplierName: '上海贸易公司',
            invoiceNumber: 'INV20240002',
            applicationAmount: 120000.00,
            applyDate: '2024-01-20',
            paymentDate: '2024-02-20',
            status: 'approved',
            approver: '李四'
          },
          {
            id: 3,
            applicant: '赵六',
            supplierName: '广州制造有限公司',
            invoiceNumber: 'INV20240003',
            applicationAmount: 80000.00,
            applyDate: '2024-01-10',
            paymentDate: '2024-02-10',
            status: 'paid',
            approver: '李四'
          }
        ]

        applicationList.value = mockData
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
      applicationList,
      selectedRows,
      searchForm,
      pagination,
      totalAmount,
      pendingAmount,
      approvedAmount,
      paidAmount,
      applicationCount,
      pendingCount,
      approvedCount,
      paidCount,
      formatDate,
      formatCurrency,
      getStatusType,
      getStatusText,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      createApplication,
      viewDetails,
      approveApplication,
      executePayment,
      cancelApplication,
      refreshData
    }
  }
}
</script>

<style scoped>
.payment-application {
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

.stat-value.info {
  color: #909399;
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