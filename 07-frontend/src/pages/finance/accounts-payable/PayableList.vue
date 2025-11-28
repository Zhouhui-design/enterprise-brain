<template>
  <div class="payable-list">
    <div class="header">
      <h2>应付账款列表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="createPayable">新增应付账款</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="供应商名称">
        <el-input v-model="searchForm.supplierName" placeholder="请输入供应商名称" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态">
          <el-option label="全部" value="" />
          <el-option label="待付款" value="pending" />
          <el-option label="部分付款" value="partial" />
          <el-option label="已付款" value="paid" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人">
        <el-select v-model="searchForm.responsiblePerson" placeholder="请选择负责人">
          <el-option label="全部" value="" />
          <el-option label="张三" value="张三" />
          <el-option label="李四" value="李四" />
          <el-option label="王五" value="王五" />
        </el-select>
      </el-form-item>
      <el-form-item label="日期范围">
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

    <!-- 应付账款统计 -->
    <div class="stats-container">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">应付总额</div>
              <div class="stat-value primary">{{ formatCurrency(totalPayable) }}</div>
              <div class="stat-desc">{{ payableCount }} 笔应付账款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">已付金额</div>
              <div class="stat-value success">{{ formatCurrency(paidAmount) }}</div>
              <div class="stat-desc">付款完成率 {{ paymentRate }}%</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">待付金额</div>
              <div class="stat-value warning">{{ formatCurrency(pendingAmount) }}</div>
              <div class="stat-desc">{{ pendingCount }} 笔待付款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-label">逾期金额</div>
              <div class="stat-value danger">{{ formatCurrency(overdueAmount) }}</div>
              <div class="stat-desc">{{ overdueCount }} 笔已逾期</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 应付账款列表 -->
    <el-table
      v-loading="loading"
      :data="payableList"
      style="width: 100%"
      @selection-change="handleSelectionChange"
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="supplierName" label="供应商名称" width="180" />
      <el-table-column prop="invoiceNumber" label="发票编号" width="150" />
      <el-table-column prop="poNumber" label="采购订单号" width="150" />
      <el-table-column prop="totalAmount" label="应付金额" width="120" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.totalAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="paidAmount" label="已付金额" width="120" align="right">
        <template #default="{ row }">
          {{ formatCurrency(row.paidAmount) }}
        </template>
      </el-table-column>
      <el-table-column prop="outstandingAmount" label="未付金额" width="120" align="right">
        <template #default="{ row }">
          <span :class="row.outstandingAmount > 0 ? 'text-danger' : ''">
            {{ formatCurrency(row.outstandingAmount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="invoiceDate" label="发票日期" width="120">
        <template #default="{ row }">
          {{ formatDate(row.invoiceDate) }}
        </template>
      </el-table-column>
      <el-table-column prop="dueDate" label="到期日期" width="120">
        <template #default="{ row }">
          <span :class="getDueDateClass(row.dueDate)">
            {{ formatDate(row.dueDate) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="responsiblePerson" label="负责人" width="100" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetails(row)">详情</el-button>
          <el-button
            v-if="row.status !== 'paid' && row.status !== 'cancelled'"
            type="primary"
            size="small"
            @click="makePayment(row)"
          >
            付款
          </el-button>
          <el-button size="small" @click="editPayable(row)">编辑</el-button>
          <el-button
            v-if="row.status !== 'paid' && row.status !== 'cancelled'"
            type="danger"
            size="small"
            @click="cancelPayable(row)"
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

export default {
  name: 'PayableList',
  setup() {
    // 状态管理
    const loading = ref(false)
    const payableList = ref([])
    const selectedRows = ref([])

    // 搜索表单
    const searchForm = reactive({
      supplierName: '',
      status: '',
      responsiblePerson: '',
      dateRange: null
    })

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })

    // 计算属性
    const totalPayable = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.totalAmount, 0)
    })

    const paidAmount = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.paidAmount, 0)
    })

    const pendingAmount = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.outstandingAmount, 0)
    })

    const overdueAmount = computed(() => {
      const today = new Date()
      return payableList.value
        .filter(item => new Date(item.dueDate) < today && item.outstandingAmount > 0)
        .reduce((sum, item) => sum + item.outstandingAmount, 0)
    })

    const payableCount = computed(() => payableList.value.length)
    
    const pendingCount = computed(() => {
      return payableList.value.filter(item => item.outstandingAmount > 0).length
    })
    
    const overdueCount = computed(() => {
      const today = new Date()
      return payableList.value
        .filter(item => new Date(item.dueDate) < today && item.outstandingAmount > 0)
        .length
    })
    
    const paymentRate = computed(() => {
      if (totalPayable.value === 0) return 0
      return Math.round((paidAmount.value / totalPayable.value) * 100)
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
        case 'partial': return 'primary'
        case 'paid': return 'success'
        case 'cancelled': return 'info'
        default: return 'default'
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待付款'
        case 'partial': return '部分付款'
        case 'paid': return '已付款'
        case 'cancelled': return '已取消'
        default: return '未知'
      }
    }

    // 获取到期日期样式
    const getDueDateClass = (dueDate) => {
      if (!dueDate) return ''
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0)

      if (due < today) return 'text-danger'
      if (due.getTime() === today.getTime()) return 'text-warning'
      return ''
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

    // 新增应付账款
    const createPayable = () => {
      ElMessage.info('跳转到新增应付账款页面')
    }

    // 编辑应付账款
    const editPayable = (row) => {
      ElMessage.info(`编辑应付账款: ${row.id}`)
    }

    // 查看详情
    const viewDetails = (row) => {
      ElMessage.info(`查看应付账款详情: ${row.id}`)
    }

    // 付款
    const makePayment = (row) => {
      ElMessageBox.confirm(`确定要对应付账款 ${row.invoiceNumber} 进行付款吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('付款成功')
        loadData()
      }).catch(() => {})
    }

    // 取消应付账款
    const cancelPayable = (row) => {
      ElMessageBox.confirm(`确定要取消应付账款 ${row.invoiceNumber} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('取消成功')
        loadData()
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
            supplierName: '北京科技有限公司',
            invoiceNumber: 'INV20240001',
            poNumber: 'PO20240001',
            totalAmount: 50000.00,
            paidAmount: 0,
            outstandingAmount: 50000.00,
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            status: 'pending',
            responsiblePerson: '张三'
          },
          {
            id: 2,
            supplierName: '上海贸易公司',
            invoiceNumber: 'INV20240002',
            poNumber: 'PO20240002',
            totalAmount: 120000.00,
            paidAmount: 60000.00,
            outstandingAmount: 60000.00,
            invoiceDate: '2024-01-20',
            dueDate: '2024-02-20',
            status: 'partial',
            responsiblePerson: '李四'
          },
          {
            id: 3,
            supplierName: '广州制造有限公司',
            invoiceNumber: 'INV20240003',
            poNumber: 'PO20240003',
            totalAmount: 80000.00,
            paidAmount: 80000.00,
            outstandingAmount: 0,
            invoiceDate: '2024-01-10',
            dueDate: '2024-02-10',
            status: 'paid',
            responsiblePerson: '王五'
          },
          {
            id: 4,
            supplierName: '深圳科技集团',
            invoiceNumber: 'INV20240004',
            poNumber: 'PO20240004',
            totalAmount: 150000.00,
            paidAmount: 0,
            outstandingAmount: 150000.00,
            invoiceDate: '2024-01-25',
            dueDate: '2024-01-25',
            status: 'pending',
            responsiblePerson: '张三'
          }
        ]

        payableList.value = mockData
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
      payableList,
      selectedRows,
      searchForm,
      pagination,
      totalPayable,
      paidAmount,
      pendingAmount,
      overdueAmount,
      payableCount,
      pendingCount,
      overdueCount,
      paymentRate,
      formatDate,
      formatCurrency,
      getStatusType,
      getStatusText,
      getDueDateClass,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      createPayable,
      editPayable,
      viewDetails,
      makePayment,
      cancelPayable,
      refreshData
    }
  }
}
</script>

<style scoped>
.payable-list {
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

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}
</style>
</file>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'PayableList',
  setup() {
    // 状态管理
    const loading = ref(false)
    const payableList = ref([])
    const selectedRows = ref([])

    // 搜索表单
    const searchForm = reactive({
      supplierName: '',
      status: '',
      responsiblePerson: '',
      dateRange: null
    })

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })

    // 计算属性
    const totalPayable = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.totalAmount, 0)
    })

    const paidAmount = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.paidAmount, 0)
    })

    const pendingAmount = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.outstandingAmount, 0)
    })

    const overdueAmount = computed(() => {
      const today = new Date()
      return payableList.value
        .filter(item => new Date(item.dueDate) < today && item.outstandingAmount > 0)
        .reduce((sum, item) => sum + item.outstandingAmount, 0)
    })

    const payableCount = computed(() => payableList.value.length)
    
    const pendingCount = computed(() => {
      return payableList.value.filter(item => item.outstandingAmount > 0).length
    })
    
    const overdueCount = computed(() => {
      const today = new Date()
      return payableList.value
        .filter(item => new Date(item.dueDate) < today && item.outstandingAmount > 0)
        .length
    })
    
    const paymentRate = computed(() => {
      if (totalPayable.value === 0) return 0
      return Math.round((paidAmount.value / totalPayable.value) * 100)
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
        case 'partial': return 'primary'
        case 'paid': return 'success'
        case 'cancelled': return 'info'
        default: return 'default'
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待付款'
        case 'partial': return '部分付款'
        case 'paid': return '已付款'
        case 'cancelled': return '已取消'
        default: return '未知'
      }
    }

    // 获取到期日期样式
    const getDueDateClass = (dueDate) => {
      if (!dueDate) return ''
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0)

      if (due < today) return 'text-danger'
      if (due.getTime() === today.getTime()) return 'text-warning'
      return ''
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

    // 新增应付账款
    const createPayable = () => {
      ElMessage.info('跳转到新增应付账款页面')
    }

    // 编辑应付账款
    const editPayable = (row) => {
      ElMessage.info(`编辑应付账款: ${row.id}`)
    }

    // 查看详情
    const viewDetails = (row) => {
      ElMessage.info(`查看应付账款详情: ${row.id}`)
    }

    // 付款
    const makePayment = (row) => {
      ElMessageBox.confirm(`确定要对应付账款 ${row.invoiceNumber} 进行付款吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('付款成功')
        loadData()
      }).catch(() => {})
    }

    // 取消应付账款
    const cancelPayable = (row) => {
      ElMessageBox.confirm(`确定要取消应付账款 ${row.invoiceNumber} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('取消成功')
        loadData()
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
            supplierName: '北京科技有限公司',
            invoiceNumber: 'INV20240001',
            poNumber: 'PO20240001',
            totalAmount: 50000.00,
            paidAmount: 0,
            outstandingAmount: 50000.00,
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            status: 'pending',
            responsiblePerson: '张三'
          },
          {
            id: 2,
            supplierName: '上海贸易公司',
            invoiceNumber: 'INV20240002',
            poNumber: 'PO20240002',
            totalAmount: 120000.00,
            paidAmount: 60000.00,
            outstandingAmount: 60000.00,
            invoiceDate: '2024-01-20',
            dueDate: '2024-02-20',
            status: 'partial',
            responsiblePerson: '李四'
          },
          {
            id: 3,
            supplierName: '广州制造有限公司',
            invoiceNumber: 'INV20240003',
            poNumber: 'PO20240003',
            totalAmount: 80000.00,
            paidAmount: 80000.00,
            outstandingAmount: 0,
            invoiceDate: '2024-01-10',
            dueDate: '2024-02-10',
            status: 'paid',
            responsiblePerson: '王五'
          },
          {
            id: 4,
            supplierName: '深圳科技集团',
            invoiceNumber: 'INV20240004',
            poNumber: 'PO20240004',
            totalAmount: 150000.00,
            paidAmount: 0,
            outstandingAmount: 150000.00,
            invoiceDate: '2024-01-25',
            dueDate: '2024-01-25',
            status: 'pending',
            responsiblePerson: '张三'
          }
        ]

        payableList.value = mockData
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
      payableList,
      selectedRows,
      searchForm,
      pagination,
      totalPayable,
      paidAmount,
      pendingAmount,
      overdueAmount,
      payableCount,
      pendingCount,
      overdueCount,
      paymentRate,
      formatDate,
      formatCurrency,
      getStatusType,
      getStatusText,
      getDueDateClass,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      createPayable,
      editPayable,
      viewDetails,
      makePayment,
      cancelPayable,
      refreshData
    }
  }
}
</script>

<style scoped>
.payable-list {
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

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}
</style>
</file>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'PayableList',
  setup() {
    // 状态管理
    const loading = ref(false)
    const payableList = ref([])
    const selectedRows = ref([])

    // 搜索表单
    const searchForm = reactive({
      supplierName: '',
      status: '',
      responsiblePerson: '',
      dateRange: null
    })

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })

    // 计算属性
    const totalPayable = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.totalAmount, 0)
    })

    const paidAmount = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.paidAmount, 0)
    })

    const pendingAmount = computed(() => {
      return payableList.value.reduce((sum, item) => sum + item.outstandingAmount, 0)
    })

    const overdueAmount = computed(() => {
      const today = new Date()
      return payableList.value
        .filter(item => new Date(item.dueDate) < today && item.outstandingAmount > 0)
        .reduce((sum, item) => sum + item.outstandingAmount, 0)
    })

    const payableCount = computed(() => payableList.value.length)
    
    const pendingCount = computed(() => {
      return payableList.value.filter(item => item.outstandingAmount > 0).length
    })
    
    const overdueCount = computed(() => {
      const today = new Date()
      return payableList.value
        .filter(item => new Date(item.dueDate) < today && item.outstandingAmount > 0)
        .length
    })
    
    const paymentRate = computed(() => {
      if (totalPayable.value === 0) return 0
      return Math.round((paidAmount.value / totalPayable.value) * 100)
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
        case 'partial': return 'primary'
        case 'paid': return 'success'
        case 'cancelled': return 'info'
        default: return 'default'
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待付款'
        case 'partial': return '部分付款'
        case 'paid': return '已付款'
        case 'cancelled': return '已取消'
        default: return '未知'
      }
    }

    // 获取到期日期样式
    const getDueDateClass = (dueDate) => {
      if (!dueDate) return ''
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(dueDate)
      due.setHours(0, 0, 0, 0)

      if (due < today) return 'text-danger'
      if (due.getTime() === today.getTime()) return 'text-warning'
      return ''
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

    // 新增应付账款
    const createPayable = () => {
      ElMessage.info('跳转到新增应付账款页面')
    }

    // 编辑应付账款
    const editPayable = (row) => {
      ElMessage.info(`编辑应付账款: ${row.id}`)
    }

    // 查看详情
    const viewDetails = (row) => {
      ElMessage.info(`查看应付账款详情: ${row.id}`)
    }

    // 付款
    const makePayment = (row) => {
      ElMessageBox.confirm(`确定要对应付账款 ${row.invoiceNumber} 进行付款吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('付款成功')
        loadData()
      }).catch(() => {})
    }

    // 取消应付账款
    const cancelPayable = (row) => {
      ElMessageBox.confirm(`确定要取消应付账款 ${row.invoiceNumber} 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage.success('取消成功')
        loadData()
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
            supplierName: '北京科技有限公司',
            invoiceNumber: 'INV20240001',
            poNumber: 'PO20240001',
            totalAmount: 50000.00,
            paidAmount: 0,
            outstandingAmount: 50000.00,
            invoiceDate: '2024-01-15',
            dueDate: '2024-02-15',
            status: 'pending',
            responsiblePerson: '张三'
          },
          {
            id: 2,
            supplierName: '上海贸易公司',
            invoiceNumber: 'INV20240002',
            poNumber: 'PO20240002',
            totalAmount: 120000.00,
            paidAmount: 60000.00,
            outstandingAmount: 60000.00,
            invoiceDate: '2024-01-20',
            dueDate: '2024-02-20',
            status: 'partial',
            responsiblePerson: '李四'
          },
          {
            id: 3,
            supplierName: '广州制造有限公司',
            invoiceNumber: 'INV20240003',
            poNumber: 'PO20240003',
            totalAmount: 80000.00,
            paidAmount: 80000.00,
            outstandingAmount: 0,
            invoiceDate: '2024-01-10',
            dueDate: '2024-02-10',
            status: 'paid',
            responsiblePerson: '王五'
          },
          {
            id: 4,
            supplierName: '深圳科技集团',
            invoiceNumber: 'INV20240004',
            poNumber: 'PO20240004',
            totalAmount: 150000.00,
            paidAmount: 0,
            outstandingAmount: 150000.00,
            invoiceDate: '2024-01-25',
            dueDate: '2024-01-25',
            status: 'pending',
            responsiblePerson: '张三'
          }
        ]

        payableList.value = mockData
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
      payableList,
      selectedRows,
      searchForm,
      pagination,
      totalPayable,
      paidAmount,
      pendingAmount,
      overdueAmount,
      payableCount,
      pendingCount,
      overdueCount,
      paymentRate,
      formatDate,
      formatCurrency,
      getStatusType,
      getStatusText,
      getDueDateClass,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      createPayable,
      editPayable,
      viewDetails,
      makePayment,
      cancelPayable,
      refreshData
    }
  }
}
</script>

<style scoped>
.payable-list {
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

.text-danger {
  color: #f56c6c;
}

.text-warning {
  color: #e6a23c;
}
</style>