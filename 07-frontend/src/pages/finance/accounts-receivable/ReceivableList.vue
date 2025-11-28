<template>
  <div class="receivable-list-container">
    <el-card shadow="hover">
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="应收单号">
          <el-input v-model="searchForm.receivableNo" placeholder="请输入应收单号" clearable />
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.businessType" placeholder="请选择业务类型" clearable>
            <el-option label="销售应收" value="SALE" />
            <el-option label="服务应收" value="SERVICE" />
            <el-option label="租赁应收" value="LEASE" />
            <el-option label="其他应收" value="OTHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="应收状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="PENDING" />
            <el-option label="已审核" value="APPROVED" />
            <el-option label="部分收款" value="PARTIAL" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已逾期" value="OVERDUE" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
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

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">应收总额</div>
            <div class="stat-value primary">¥{{ formatAmount(stats.totalAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">已收金额</div>
            <div class="stat-value success">¥{{ formatAmount(stats.receivedAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">未收金额</div>
            <div class="stat-value warning">¥{{ formatAmount(stats.unreceiveAmount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">逾期金额</div>
            <div class="stat-value danger">¥{{ formatAmount(stats.overdueAmount) }}</div>
          </div>
        </el-col>
      </el-row>

      <!-- 操作按钮 -->
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="handleCreate">新建应收单</el-button>
        <el-button :icon="Download" @click="handleExport">导出</el-button>
        <el-button :icon="Refresh" @click="loadData">刷新</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="receivableNo" label="应收单号" width="180" fixed />
        <el-table-column prop="customerName" label="客户名称" width="200" />
        <el-table-column prop="businessType" label="业务类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getBusinessTypeTag(row.businessType)">
              {{ getBusinessTypeName(row.businessType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="应收金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ formatAmount(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="receivedAmount" label="已收金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text success">¥{{ formatAmount(row.receivedAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unreceiveAmount" label="未收金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-text warning">¥{{ formatAmount(row.unreceiveAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="receivableDate" label="应收日期" width="120" />
        <el-table-column prop="dueDate" label="到期日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'overdue-date': isOverdue(row.dueDate) }">
              {{ row.dueDate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)" v-if="row.status === 'PENDING'">编辑</el-button>
            <el-button link type="success" size="small" @click="handleCollect(row)" v-if="row.status !== 'COMPLETED'">收款</el-button>
            <el-button link type="warning" size="small" @click="handleStatement(row)">对账单</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)" v-if="row.status === 'PENDING'">删除</el-button>
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Download } from '@element-plus/icons-vue'

const router = useRouter()

// 搜索表单
const searchForm = reactive({
  customerName: '',
  receivableNo: '',
  businessType: '',
  status: '',
  dateRange: []
})

// 统计数据
const stats = reactive({
  totalAmount: 0,
  receivedAmount: 0,
  unreceiveAmount: 0,
  overdueAmount: 0
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

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取数据
    // const res = await receivableApi.getList({
    //   ...searchForm,
    //   page: pagination.current,
    //   size: pagination.size
    // })
    
    // 模拟数据
    tableData.value = [
      {
        id: 1,
        receivableNo: 'AR202311280001',
        customerName: '深圳ABC科技有限公司',
        businessType: 'SALE',
        totalAmount: 100000,
        receivedAmount: 50000,
        unreceiveAmount: 50000,
        receivableDate: '2023-11-28',
        dueDate: '2023-12-28',
        status: 'PARTIAL',
        creator: '张三',
        createTime: '2023-11-28 10:00:00'
      },
      {
        id: 2,
        receivableNo: 'AR202311280002',
        customerName: '广州XYZ贸易公司',
        businessType: 'SERVICE',
        totalAmount: 80000,
        receivedAmount: 0,
        unreceiveAmount: 80000,
        receivableDate: '2023-11-20',
        dueDate: '2023-11-25',
        status: 'OVERDUE',
        creator: '李四',
        createTime: '2023-11-20 14:30:00'
      }
    ]
    
    pagination.total = 2
    
    // 更新统计数据
    stats.totalAmount = 180000
    stats.receivedAmount = 50000
    stats.unreceiveAmount = 130000
    stats.overdueAmount = 80000
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
    customerName: '',
    receivableNo: '',
    businessType: '',
    status: '',
    dateRange: []
  })
  handleSearch()
}

// 新建
const handleCreate = () => {
  router.push('/finance/accounts-receivable/create')
}

// 查看
const handleView = (row) => {
  router.push(`/finance/accounts-receivable/detail/${row.id}`)
}

// 编辑
const handleEdit = (row) => {
  router.push(`/finance/accounts-receivable/edit/${row.id}`)
}

// 收款
const handleCollect = (row) => {
  router.push(`/finance/accounts-receivable/collection?id=${row.id}`)
}

// 对账单
const handleStatement = (row) => {
  router.push(`/finance/accounts-receivable/statement?customerId=${row.customerId}`)
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该应收单吗？', '提示', {
      type: 'warning'
    })
    
    // TODO: 调用删除API
    // await receivableApi.delete(row.id)
    
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 导出
const handleExport = () => {
  ElMessage.info('导出功能开发中...')
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

// 业务类型标签
const getBusinessTypeTag = (type) => {
  const map = {
    SALE: '',
    SERVICE: 'success',
    LEASE: 'warning',
    OTHER: 'info'
  }
  return map[type] || ''
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
.receivable-list-container {
  padding: 20px;

  .search-form {
    margin-bottom: 20px;
  }

  .stats-row {
    margin-bottom: 20px;

    .stat-card {
      padding: 20px;
      background: #f5f7fa;
      border-radius: 4px;
      text-align: center;

      .stat-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 10px;
      }

      .stat-value {
        font-size: 24px;
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

  .overdue-date {
    color: #f56c6c;
    font-weight: 500;
  }

  .el-pagination {
    margin-top: 20px;
    justify-content: flex-end;
  }
}
</style>
