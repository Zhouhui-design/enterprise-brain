<template>
  <div class="supplier-statement">
    <div class="header">
      <h2>供应商对账单</h2>
      <div class="header-actions">
        <el-button type="primary" @click="exportStatement">导出对账单</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="供应商">
        <el-select 
          v-model="searchForm.supplierId" 
          placeholder="请选择供应商" 
          filterable
          @change="onSupplierChange"
        >
          <el-option
            v-for="supplier in supplierList"
            :key="supplier.id"
            :label="supplier.name"
            :value="supplier.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="对账期间">
        <el-date-picker
          v-model="searchForm.statementPeriod"
          type="monthrange"
          range-separator="至"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 对账单汇总信息 -->
    <el-card class="summary-card">
      <template #header>
        <div class="card-header">
          <span>对账单汇总</span>
        </div>
      </template>
      
      <el-descriptions :column="4" border>
        <el-descriptions-item label="供应商">{{ selectedSupplier.name }}</el-descriptions-item>
        <el-descriptions-item label="对账期间">{{ formatPeriod(searchForm.statementPeriod) }}</el-descriptions-item>
        <el-descriptions-item label="期初余额">{{ formatCurrency(statementSummary.openingBalance) }}</el-descriptions-item>
        <el-descriptions-item label="期末余额">{{ formatCurrency(statementSummary.closingBalance) }}</el-descriptions-item>
        <el-descriptions-item label="本期借方">{{ formatCurrency(statementSummary.debitAmount) }}</el-descriptions-item>
        <el-descriptions-item label="本期贷方">{{ formatCurrency(statementSummary.creditAmount) }}</el-descriptions-item>
        <el-descriptions-item label="应付余额">{{ formatCurrency(statementSummary.payableBalance) }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatementStatusType(statementSummary.status)">
            {{ getStatementStatusText(statementSummary.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 对账单明细 -->
    <el-card class="details-card">
      <template #header>
        <div class="card-header">
          <span>对账单明细</span>
        </div>
      </template>
      
      <el-table
        v-loading="loading"
        :data="statementDetails"
        style="width: 100%"
        border
      >
        <el-table-column prop="date" label="日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="documentType" label="单据类型" width="120">
          <template #default="{ row }">
            {{ getDocumentTypeText(row.documentType) }}
          </template>
        </el-table-column>
        <el-table-column prop="documentNumber" label="单据编号" width="150" />
        <el-table-column prop="description" label="摘要" min-width="200" />
        <el-table-column prop="debitAmount" label="借方金额" width="120" align="right">
          <template #default="{ row }">
            {{ row.debitAmount > 0 ? formatCurrency(row.debitAmount) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="creditAmount" label="贷方金额" width="120" align="right">
          <template #default="{ row }">
            {{ row.creditAmount > 0 ? formatCurrency(row.creditAmount) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.balance) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getDetailStatusType(row.status)">{{ getDetailStatusText(row.status) }}</el-tag>
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
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'SupplierStatement',
  setup() {
    const loading = ref(false)
    const statementDetails = ref([])

    // 搜索表单
    const searchForm = reactive({
      supplierId: '',
      statementPeriod: null
    })

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })

    // 供应商列表
    const supplierList = ref([
      { id: 1, name: '北京科技有限公司' },
      { id: 2, name: '上海贸易公司' },
      { id: 3, name: '广州制造有限公司' },
      { id: 4, name: '深圳科技集团' }
    ])

    // 选中的供应商
    const selectedSupplier = ref({
      id: 1,
      name: '北京科技有限公司'
    })

    // 对账单汇总信息
    const statementSummary = ref({
      openingBalance: 100000.00,
      closingBalance: 120000.00,
      debitAmount: 300000.00,
      creditAmount: 280000.00,
      payableBalance: 120000.00,
      status: 'confirmed'
    })

    // 供应商选择变化
    const onSupplierChange = (supplierId) => {
      const supplier = supplierList.value.find(s => s.id === supplierId)
      if (supplier) {
        selectedSupplier.value = supplier
      }
    }

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    // 格式化期间
    const formatPeriod = (period) => {
      if (!period || period.length !== 2) return ''
      const start = new Date(period[0])
      const end = new Date(period[1])
      return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')} 至 ${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`
    }

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00'
      return value.toFixed(2)
    }

    // 获取单据类型文本
    const getDocumentTypeText = (type) => {
      switch (type) {
        case 'invoice': return '采购发票'
        case 'payment': return '付款单'
        case 'refund': return '退款单'
        case 'adjustment': return '调整单'
        default: return '其他'
      }
    }

    // 获取对账单状态类型
    const getStatementStatusType = (status) => {
      switch (status) {
        case 'draft': return 'info'
        case 'confirmed': return 'success'
        case 'closed': return 'warning'
        default: return 'default'
      }
    }

    // 获取对账单状态文本
    const getStatementStatusText = (status) => {
      switch (status) {
        case 'draft': return '草稿'
        case 'confirmed': return '已确认'
        case 'closed': return '已关闭'
        default: return '未知'
      }
    }

    // 获取明细状态类型
    const getDetailStatusType = (status) => {
      switch (status) {
        case 'open': return 'warning'
        case 'closed': return 'success'
        default: return 'default'
      }
    }

    // 获取明细状态文本
    const getDetailStatusText = (status) => {
      switch (status) {
        case 'open': return '未结清'
        case 'closed': return '已结清'
        default: return '未知'
      }
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
      searchForm.supplierId = ''
      searchForm.statementPeriod = null
      pagination.currentPage = 1
      loadData()
    }

    // 导出对账单
    const exportStatement = () => {
      ElMessageBox.confirm('确定要导出当前对账单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        // 模拟导出
        setTimeout(() => {
          ElMessage.success('对账单导出成功')
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
            date: '2024-01-01',
            documentType: 'invoice',
            documentNumber: 'INV20240001',
            description: '采购服务器设备',
            debitAmount: 50000.00,
            creditAmount: 0,
            balance: 150000.00,
            status: 'closed'
          },
          {
            id: 2,
            date: '2024-01-15',
            documentType: 'payment',
            documentNumber: 'PAY20240001',
            description: '支付采购款',
            debitAmount: 0,
            creditAmount: 30000.00,
            balance: 120000.00,
            status: 'closed'
          },
          {
            id: 3,
            date: '2024-01-20',
            documentType: 'invoice',
            documentNumber: 'INV20240002',
            description: '采购办公用品',
            debitAmount: 20000.00,
            creditAmount: 0,
            balance: 140000.00,
            status: 'open'
          }
        ]

        statementDetails.value = mockData
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
      statementDetails,
      searchForm,
      pagination,
      supplierList,
      selectedSupplier,
      statementSummary,
      onSupplierChange,
      formatDate,
      formatPeriod,
      formatCurrency,
      getDocumentTypeText,
      getStatementStatusType,
      getStatementStatusText,
      getDetailStatusType,
      getDetailStatusText,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      exportStatement,
      refreshData
    }
  }
}
</script>

<style scoped>
.supplier-statement {
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

.summary-card,
.details-card {
  margin-bottom: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-header {
  font-weight: bold;
  color: #303133;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>