<template>
  <div class="sales-order-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 2L3 7v9a2 2 0 002 2h4v5l3-3 3 3v-5h4a2 2 0 002-2V7l-6-5H9z" fill="#2196F3"/>
          </svg>
        </div>
        <div class="header-info">
          <h1>销售订单管理</h1>
          <p>管理和跟踪所有销售订单的整个生命周期</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="createOrder">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          新建订单
        </el-button>
        <el-button @click="exportOrders">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stat-card">
        <div class="stat-icon total">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M3 13h2v8H3zM7 9h2v12H7zM11 5h2v16h-2zM15 11h2v10h-2zM19 7h2v12h-2z" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总订单数</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon pending">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon approved">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="2" fill="none"/>
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">已审批</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon completed">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon revenue">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="currentColor"/>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ formatAmount(stats.totalRevenue) }}</div>
          <div class="stat-label">总收入</div>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filters">
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索订单编号、客户名称、产品名称..."
          prefix-icon="Search"
          @input="handleSearch"
          clearable
        />
      </div>
      
      <div class="filters">
        <el-select v-model="filters.status" placeholder="订单状态" clearable @change="handleFilter">
          <el-option label="待处理" value="pending" />
          <el-option label="审批中" value="reviewing" />
          <el-option label="已审批" value="approved" />
          <el-option label="生产中" value="production" />
          <el-option label="配送中" value="delivering" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        
        <el-select v-model="filters.customerType" placeholder="客户类型" clearable @change="handleFilter">
          <el-option label="VIP客户" value="vip" />
          <el-option label="普通客户" value="regular" />
          <el-option label="新客户" value="new" />
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        />
        
        <el-button @click="resetFilters">重置筛选</el-button>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="orders-table">
      <el-table
        :data="filteredOrders"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        height="calc(100vh - 400px)"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="orderNumber" label="订单编号" width="140">
          <template #default="{ row }">
            <el-link @click="viewOrder(row.id)" type="primary">
              {{ row.orderNumber }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="customerName" label="客户名称" width="120">
          <template #default="{ row }">
            <div class="customer-info">
              <span>{{ row.customerName }}</span>
              <el-tag v-if="row.customerType" size="small" :type="getCustomerTypeColor(row.customerType)">
                {{ getCustomerTypeLabel(row.customerType) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="productCount" label="产品数量" width="100" align="center" />
        
        <el-table-column prop="totalAmount" label="订单金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ formatAmount(row.totalAmount) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityColor(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="salesPerson" label="销售人员" width="100" />
        
        <el-table-column prop="orderDate" label="下单时间" width="140">
          <template #default="{ row }">
            {{ formatDate(row.orderDate) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="deliveryDate" label="预计交付" width="140">
          <template #default="{ row }">
            <span :class="{ 'overdue': isOverdue(row.deliveryDate) }">
              {{ formatDate(row.deliveryDate) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button @click="viewOrder(row.id)" type="primary" size="small">查看</el-button>
              <el-button @click="editOrder(row.id)" size="small" :disabled="!canEdit(row.status)">编辑</el-button>
              <el-button @click="approveOrder(row.id)" size="small" type="success" :disabled="!canApprove(row.status)">审批</el-button>
              <el-dropdown @command="(cmd) => handleMoreAction(cmd, row)">
                <el-button size="small">
                  更多<el-icon><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="track">跟踪订单</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制订单</el-dropdown-item>
                    <el-dropdown-item command="export">导出PDF</el-dropdown-item>
                    <el-dropdown-item command="cancel" divided :disabled="!canCancel(row.status)">取消订单</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="totalOrders"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedOrders.length > 0" class="batch-actions">
      <div class="selection-info">
        已选择 {{ selectedOrders.length }} 个订单
      </div>
      <div class="batch-buttons">
        <el-button @click="batchApprove" type="success" :disabled="!canBatchApprove">批量审批</el-button>
        <el-button @click="batchExport">批量导出</el-button>
        <el-button @click="batchCancel" type="danger" :disabled="!canBatchCancel">批量取消</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

// 接口定义
interface SalesOrder {
  id: string
  orderNumber: string
  customerName: string
  customerType: 'vip' | 'regular' | 'new'
  productCount: number
  totalAmount: number
  status: 'pending' | 'reviewing' | 'approved' | 'production' | 'delivering' | 'completed' | 'cancelled'
  priority: 'high' | 'medium' | 'low'
  salesPerson: string
  orderDate: Date
  deliveryDate: Date
  trackingInfo?: string
}

interface Stats {
  total: number
  pending: number
  approved: number
  completed: number
  totalRevenue: number
}

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const totalOrders = ref(0)
const dateRange = ref<[Date, Date] | null>(null)
const selectedOrders = ref<SalesOrder[]>([])

const stats = ref<Stats>({
  total: 0,
  pending: 0,
  approved: 0,
  completed: 0,
  totalRevenue: 0
})

const filters = reactive({
  status: '',
  customerType: ''
})

const orders = ref<SalesOrder[]>([
  {
    id: '1',
    orderNumber: 'SO2024120101',
    customerName: '科技有限公司',
    customerType: 'vip',
    productCount: 5,
    totalAmount: 125000,
    status: 'approved',
    priority: 'high',
    salesPerson: '张三',
    orderDate: new Date('2024-12-01'),
    deliveryDate: new Date('2024-12-15')
  },
  {
    id: '2',
    orderNumber: 'SO2024120102',
    customerName: '制造公司',
    customerType: 'regular',
    productCount: 3,
    totalAmount: 78000,
    status: 'pending',
    priority: 'medium',
    salesPerson: '李四',
    orderDate: new Date('2024-12-02'),
    deliveryDate: new Date('2024-12-20')
  }
])

// 计算属性
const filteredOrders = computed(() => {
  let result = orders.value

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(order => 
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.salesPerson.toLowerCase().includes(query)
    )
  }

  // 状态过滤
  if (filters.status) {
    result = result.filter(order => order.status === filters.status)
  }

  // 客户类型过滤
  if (filters.customerType) {
    result = result.filter(order => order.customerType === filters.customerType)
  }

  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(order => {
      const orderDate = new Date(order.orderDate)
      return orderDate >= start && orderDate <= end
    })
  }

  totalOrders.value = result.length
  return result
})

const canBatchApprove = computed(() => {
  return selectedOrders.value.some(order => order.status === 'pending')
})

const canBatchCancel = computed(() => {
  return selectedOrders.value.some(order => 
    ['pending', 'reviewing', 'approved'].includes(order.status)
  )
})

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString()
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    reviewing: 'primary',
    approved: 'success',
    production: 'info',
    delivering: 'primary',
    completed: 'success',
    cancelled: 'danger'
  }
  return colors[status] || ''
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '待处理',
    reviewing: '审批中',
    approved: '已审批',
    production: '生产中',
    delivering: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return labels[status] || status
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return colors[priority] || ''
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || priority
}

const getCustomerTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    vip: 'danger',
    regular: 'primary',
    new: 'success'
  }
  return colors[type] || ''
}

const getCustomerTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    vip: 'VIP',
    regular: '普通',
    new: '新客'
  }
  return labels[type] || type
}

const isOverdue = (deliveryDate: Date) => {
  return new Date() > deliveryDate
}

const canEdit = (status: string) => {
  return ['pending', 'reviewing'].includes(status)
}

const canApprove = (status: string) => {
  return status === 'pending'
}

const canCancel = (status: string) => {
  return ['pending', 'reviewing', 'approved'].includes(status)
}

// 事件处理
const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleDateChange = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  filters.status = ''
  filters.customerType = ''
  dateRange.value = null
  searchQuery.value = ''
  currentPage.value = 1
}

const handleSelectionChange = (selection: SalesOrder[]) => {
  selectedOrders.value = selection
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

const handleMoreAction = (command: string, order: SalesOrder) => {
  switch (command) {
    case 'track':
      trackOrder(order.id)
      break
    case 'duplicate':
      duplicateOrder(order.id)
      break
    case 'export':
      exportOrderPDF(order.id)
      break
    case 'cancel':
      cancelOrder(order.id)
      break
  }
}

// 操作方法
const createOrder = () => {
  router.push('/sales/sales-order/create')
}

const viewOrder = (id: string) => {
  router.push(`/sales/sales-order/${id}`)
}

const editOrder = (id: string) => {
  router.push(`/sales/sales-order/${id}/edit`)
}

const approveOrder = (id: string) => {
  router.push(`/sales/sales-order/${id}/approve`)
}

const trackOrder = (id: string) => {
  router.push(`/sales/sales-order/${id}/track`)
}

const duplicateOrder = (id: string) => {
  ElMessage.success('订单复制成功')
}

const exportOrderPDF = (id: string) => {
  ElMessage.success('PDF导出成功')
}

const cancelOrder = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '确认操作', {
      type: 'warning'
    })
    ElMessage.success('订单已取消')
  } catch {
    // 用户取消
  }
}

const batchApprove = () => {
  const approvableOrders = selectedOrders.value.filter(order => order.status === 'pending')
  ElMessage.success(`已批量审批 ${approvableOrders.length} 个订单`)
  selectedOrders.value = []
}

const batchExport = () => {
  ElMessage.success('批量导出成功')
}

const batchCancel = async () => {
  try {
    await ElMessageBox.confirm(`确定要批量取消选中的 ${selectedOrders.value.length} 个订单吗？`, '确认操作', {
      type: 'warning'
    })
    ElMessage.success('批量取消成功')
    selectedOrders.value = []
  } catch {
    // 用户取消
  }
}

const exportOrders = () => {
  ElMessage.success('数据导出成功')
}

// 初始化
onMounted(() => {
  // 初始化统计数据
  stats.value = {
    total: orders.value.length,
    pending: orders.value.filter(o => o.status === 'pending').length,
    approved: orders.value.filter(o => o.status === 'approved').length,
    completed: orders.value.filter(o => o.status === 'completed').length,
    totalRevenue: orders.value.reduce((sum, order) => sum + order.totalAmount, 0)
  }
})
</script>

<style scoped>
.sales-order-list {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: var(--primary-color);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon svg {
  width: 24px;
  height: 24px;
  fill: white;
}

.header-info h1 {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-primary);
}

.header-info p {
  margin: 0.5rem 0 0 0;
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-icon.total {
  background: rgba(33, 150, 243, 0.1);
  color: var(--primary-color);
}

.stat-icon.pending {
  background: rgba(255, 152, 0, 0.1);
  color: var(--warning-color);
}

.stat-icon.approved {
  background: rgba(76, 175, 80, 0.1);
  color: var(--success-color);
}

.stat-icon.completed {
  background: rgba(156, 39, 176, 0.1);
  color: var(--info-color);
}

.stat-icon.revenue {
  background: rgba(255, 193, 7, 0.1);
  color: var(--warning-color);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.search-filters {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  min-width: 300px;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.orders-table {
  background: var(--surface-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 2rem;
}

.customer-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.amount {
  font-weight: 600;
  color: var(--primary-color);
}

.overdue {
  color: var(--error-color);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.batch-actions {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface-color);
  border-radius: 12px;
  padding: 1rem 2rem;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 2rem;
  border: 1px solid var(--border-color);
  z-index: 1000;
}

.selection-info {
  font-weight: 600;
  color: var(--text-primary);
}

.batch-buttons {
  display: flex;
  gap: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sales-order-list {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .search-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-bar {
    min-width: auto;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .stats-overview {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .batch-actions {
    flex-direction: column;
    gap: 1rem;
    width: 90%;
  }
}
</style>