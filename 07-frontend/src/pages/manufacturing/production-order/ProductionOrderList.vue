<template>
  <div class="production-order-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>生产订单管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreateOrder">
          <el-icon><Plus /></el-icon>
          新建订单
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderCode" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择订单状态">
            <el-option label="全部" value="" />
            <el-option label="未开始" value="not_started" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker
            v-model="searchForm.createDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.totalOrders }}</div>
          <div class="stat-label">总订单数</div>
        </div>
        <el-icon class="stat-icon"><Document /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.inProgressOrders }}</div>
          <div class="stat-label">进行中订单</div>
        </div>
        <el-icon class="stat-icon"><Timer /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.completedOrders }}</div>
          <div class="stat-label">已完成订单</div>
        </div>
        <el-icon class="stat-icon"><Check /></el-icon>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ statistics.delayedOrders }}</div>
          <div class="stat-label">延期订单</div>
        </div>
        <el-icon class="stat-icon"><Warning /></el-icon>
      </el-card>
    </div>

    <!-- 订单列表 -->
    <el-card class="data-card">
      <div class="table-actions">
        <el-button type="danger" @click="handleBatchDelete" :disabled="selectedOrderIds.length === 0">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
      
      <el-table
        v-loading="loading"
        :data="orderList"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderCode" label="订单编号" width="180" />
        <el-table-column prop="productName" label="产品名称" width="180" />
        <el-table-column prop="productCode" label="产品编码" width="150" />
        <el-table-column prop="quantity" label="订单数量" width="100" align="right" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="plannedStartDate" label="计划开始日期" width="150" />
        <el-table-column prop="plannedEndDate" label="计划完成日期" width="150" />
        <el-table-column prop="actualStartDate" label="实际开始日期" width="150" />
        <el-table-column prop="actualEndDate" label="实际完成日期" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="handleViewOrder(row)">查看</el-button>
            <el-button text @click="handleEditOrder(row)">编辑</el-button>
            <el-button type="danger" text @click="handleDeleteOrder(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
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

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="订单编号">{{ currentOrder.orderCode }}</el-descriptions-item>
          <el-descriptions-item label="产品信息">{{ currentOrder.productName }} ({{ currentOrder.productCode }})</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ currentOrder.quantity }} {{ currentOrder.unit }}</el-descriptions-item>
          <el-descriptions-item label="订单状态"><el-tag :type="getStatusTagType(currentOrder.status)">{{ getStatusText(currentOrder.status) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="计划时间">
            {{ currentOrder.plannedStartDate }} 至 {{ currentOrder.plannedEndDate }}
          </el-descriptions-item>
          <el-descriptions-item label="实际时间" v-if="currentOrder.actualStartDate">
            {{ currentOrder.actualStartDate }} 至 {{ currentOrder.actualEndDate || '未完成' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentOrder.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建信息">
            {{ currentOrder.creator }} 于 {{ currentOrder.createTime }} 创建
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Refresh, Download, Document, Timer, Check, Warning, Delete } from '@element-plus/icons-vue'
import type { ElTable } from 'element-plus'

// 订单类型定义
interface ProductionOrder {
  id: string
  orderCode: string
  productCode: string
  productName: string
  quantity: number
  unit: string
  status: string
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate?: string
  actualEndDate?: string
  remark?: string
  creator: string
  createTime: string
}

// 响应式数据
const loading = ref(false)
const orderList = ref<ProductionOrder[]>([])
const selectedOrderIds = ref<string[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const currentOrder = ref<ProductionOrder | null>(null)

// 搜索表单
const searchForm = reactive({
  orderCode: '',
  productName: '',
  status: '',
  createDate: null as [string, string] | null
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 统计数据
const statistics = reactive({
  totalOrders: 0,
  inProgressOrders: 0,
  completedOrders: 0,
  delayedOrders: 0
})

// 获取订单列表
const getOrderList = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    const mockData: ProductionOrder[] = [
      {
        id: '1',
        orderCode: 'PO2024001',
        productCode: 'PROD001',
        productName: '智能控制器',
        quantity: 1000,
        unit: '台',
        status: 'in_progress',
        plannedStartDate: '2024-01-01',
        plannedEndDate: '2024-01-15',
        actualStartDate: '2024-01-01',
        remark: '客户紧急订单',
        creator: '张三',
        createTime: '2023-12-28 10:30:00'
      },
      {
        id: '2',
        orderCode: 'PO2024002',
        productCode: 'PROD002',
        productName: '传感器模组',
        quantity: 500,
        unit: '套',
        status: 'completed',
        plannedStartDate: '2024-01-05',
        plannedEndDate: '2024-01-20',
        actualStartDate: '2024-01-05',
        actualEndDate: '2024-01-18',
        creator: '李四',
        createTime: '2023-12-30 14:20:00'
      },
      {
        id: '3',
        orderCode: 'PO2024003',
        productCode: 'PROD003',
        productName: '电源模块',
        quantity: 800,
        unit: '个',
        status: 'not_started',
        plannedStartDate: '2024-01-20',
        plannedEndDate: '2024-02-05',
        creator: '王五',
        createTime: '2024-01-10 09:15:00'
      },
      {
        id: '4',
        orderCode: 'PO2024004',
        productCode: 'PROD004',
        productName: '控制面板',
        quantity: 1200,
        unit: '件',
        status: 'paused',
        plannedStartDate: '2024-01-10',
        plannedEndDate: '2024-01-25',
        actualStartDate: '2024-01-10',
        remark: '等待物料',
        creator: '赵六',
        createTime: '2024-01-05 16:45:00'
      },
      {
        id: '5',
        orderCode: 'PO2024005',
        productCode: 'PROD005',
        productName: '连接线束',
        quantity: 2000,
        unit: '条',
        status: 'cancelled',
        plannedStartDate: '2024-01-15',
        plannedEndDate: '2024-01-30',
        remark: '客户取消订单',
        creator: '孙七',
        createTime: '2024-01-08 11:20:00'
      }
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (searchForm.orderCode) {
      filteredData = filteredData.filter(order => 
        order.orderCode.includes(searchForm.orderCode)
      )
    }
    if (searchForm.productName) {
      filteredData = filteredData.filter(order => 
        order.productName.includes(searchForm.productName)
      )
    }
    if (searchForm.status) {
      filteredData = filteredData.filter(order => 
        order.status === searchForm.status
      )
    }
    
    // 更新分页数据
    pagination.total = filteredData.length
    orderList.value = filteredData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    )
    
    // 更新统计数据
    statistics.totalOrders = mockData.length
    statistics.inProgressOrders = mockData.filter(o => o.status === 'in_progress').length
    statistics.completedOrders = mockData.filter(o => o.status === 'completed').length
    statistics.delayedOrders = mockData.filter(o => {
      if (o.status === 'completed') return false
      const today = new Date()
      const plannedEnd = new Date(o.plannedEndDate)
      return plannedEnd < today
    }).length
  } catch (error) {
    console.error('获取订单列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取状态文本
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

// 获取状态标签类型
const getStatusTagType = (status: string): string => {
  const typeMap: Record<string, string> = {
    not_started: 'info',
    in_progress: 'primary',
    completed: 'success',
    paused: 'warning',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 处理搜索
const handleSearch = () => {
  pagination.currentPage = 1
  getOrderList()
}

// 处理重置
const handleReset = () => {
  Object.assign(searchForm, {
    orderCode: '',
    productName: '',
    status: '',
    createDate: null
  })
  pagination.currentPage = 1
  getOrderList()
}

// 处理刷新
const handleRefresh = () => {
  getOrderList()
}

// 处理创建订单
const handleCreateOrder = () => {
  // 跳转到创建页面
  window.location.href = '/#/manufacturing/production-order/create'
}

// 处理查看订单
const handleViewOrder = (order: ProductionOrder) => {
  dialogTitle.value = '订单详情'
  currentOrder.value = { ...order }
  dialogVisible.value = true
}

// 处理编辑订单
const handleEditOrder = (order: ProductionOrder) => {
  // 跳转到编辑页面
  window.location.href = `/#/manufacturing/production-order/edit?id=${order.id}`
}

// 处理删除订单
const handleDeleteOrder = (id: string) => {
  ElMessageBox.confirm('确定要删除这条订单吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除操作
    orderList.value = orderList.value.filter(order => order.id !== id)
    ElMessage.success('删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 处理批量删除
const handleBatchDelete = () => {
  if (selectedOrderIds.value.length === 0) {
    ElMessage.warning('请选择要删除的订单')
    return
  }
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedOrderIds.value.length} 条订单吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟批量删除操作
    orderList.value = orderList.value.filter(
      order => !selectedOrderIds.value.includes(order.id)
    )
    selectedOrderIds.value = []
    ElMessage.success('批量删除成功')
  }).catch(() => {
    // 取消删除
  })
}

// 处理导出
const handleExport = () => {
  // 模拟导出操作
  ElMessage.success('数据导出成功')
}

// 处理选择变化
const handleSelectionChange = (selection: ProductionOrder[]) => {
  selectedOrderIds.value = selection.map(order => order.id)
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  getOrderList()
}

// 处理页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  getOrderList()
}

// 处理对话框关闭
const handleDialogClose = () => {
  currentOrder.value = null
}

// 组件挂载时获取数据
onMounted(() => {
  getOrderList()
})
</script>

<style scoped>
.production-order-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1989fa;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 48px;
  color: rgba(25, 137, 250, 0.1);
}

.data-card {
  margin-bottom: 20px;
}

.table-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-detail {
  padding: 10px;
}
</style>