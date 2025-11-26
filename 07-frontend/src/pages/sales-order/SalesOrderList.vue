<template>
  <div class="sales-order-list">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <span class="title">销售订单管理</span>
          <el-button type="primary" @click="createOrder">
            <i class="el-icon-plus"></i>
            新建订单
          </el-button>
        </div>
      </template>
      
      <!-- 搜索筛选区 -->
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="订单编号">
            <el-input v-model="searchForm.orderCode" placeholder="请输入订单编号" clearable />
          </el-form-item>
          <el-form-item label="客户名称">
            <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select v-model="searchForm.status" placeholder="请选择订单状态" clearable>
              <el-option label="全部" value="" />
              <el-option label="草稿" value="DRAFT" />
              <el-option label="待审核" value="PENDING_REVIEW" />
              <el-option label="审核中" value="REVIEWING" />
              <el-option label="待审批" value="PENDING_APPROVAL" />
              <el-option label="已审批" value="APPROVED" />
              <el-option label="已拒绝" value="REJECTED" />
              <el-option label="已取消" value="CANCELLED" />
              <el-option label="已完成" value="COMPLETED" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建日期">
            <el-date-picker
              v-model="searchForm.createDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="search">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 数据表格 -->
      <div class="table-section">
        <el-table
          :data="orderList"
          stripe
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="orderCode" label="订单编号" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <el-button type="text" @click="viewOrder(row.id)">{{ row.orderCode }}</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="customerName" label="客户名称" width="180" show-overflow-tooltip />
          <el-table-column prop="totalAmount" label="订单金额" width="120" align="right">
            <template #default="{ row }">
              {{ formatCurrency(row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column prop="orderDate" label="订单日期" width="140" />
          <el-table-column prop="deliveryDate" label="预计交付日期" width="140" />
          <el-table-column prop="status" label="订单状态" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="creatorName" label="创建人" width="120" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="text" @click="viewOrder(row.id)" size="small">查看</el-button>
              <el-button type="text" @click="editOrder(row.id)" size="small" v-if="canEditOrder(row)">编辑</el-button>
              <el-button type="text" @click="deleteOrder(row.id)" size="small" v-if="canDeleteOrder(row)">删除</el-button>
              <el-button type="text" @click="submitOrder(row.id)" size="small" v-if="row.status === 'DRAFT'">提交</el-button>
              <el-button type="text" @click="trackOrder(row.id)" size="small" v-if="canTrackOrder(row)">跟踪</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 分页 -->
      <div class="pagination-section">
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
      
      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedOrders.length > 0">
        <el-tag>已选择 {{ selectedOrders.length }} 项</el-tag>
        <el-button type="danger" @click="batchDelete" :disabled="!canBatchDelete">批量删除</el-button>
        <el-button type="primary" @click="batchSubmit" :disabled="!canBatchSubmit">批量提交</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'SalesOrderList',
  data() {
    return {
      searchForm: {
        orderCode: '',
        customerName: '',
        status: '',
        createDateRange: null
      },
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      orderList: [],
      selectedOrders: []
    }
  },
  mounted() {
    this.fetchOrderList()
  },
  methods: {
    // 获取订单列表
    fetchOrderList() {
      // 模拟API请求
      setTimeout(() => {
        this.orderList = this.getMockOrderList()
        this.pagination.total = this.orderList.length
      }, 500)
    },
    
    // 搜索
    search() {
      this.pagination.currentPage = 1
      this.fetchOrderList()
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        orderCode: '',
        customerName: '',
        status: '',
        createDateRange: null
      }
      this.fetchOrderList()
    },
    
    // 查看订单
    viewOrder(orderId) {
      this.$router.push(`/sales-order/detail/${orderId}`)
    },
    
    // 编辑订单
    editOrder(orderId) {
      this.$router.push(`/sales-order/edit/${orderId}`)
    },
    
    // 创建订单
    createOrder() {
      this.$router.push('/sales-order/create')
    },
    
    // 删除订单
    deleteOrder(orderId) {
      ElMessageBox.confirm('确定要删除该订单吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.orderList = this.orderList.filter(order => order.id !== orderId)
        this.pagination.total = this.orderList.length
        ElMessage.success('订单删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 提交订单
    submitOrder(orderId) {
      ElMessageBox.confirm('确定要提交该订单进行审核吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        // 模拟提交操作
        const order = this.orderList.find(o => o.id === orderId)
        if (order) {
          order.status = 'PENDING_REVIEW'
          ElMessage.success('订单提交成功')
        }
      }).catch(() => {
        // 取消提交
      })
    },
    
    // 跟踪订单
    trackOrder(orderId) {
      this.$router.push(`/sales-order/tracking/${orderId}`)
    },
    
    // 批量删除
    batchDelete() {
      ElMessageBox.confirm(`确定要删除选中的 ${this.selectedOrders.length} 个订单吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idsToDelete = this.selectedOrders.map(order => order.id)
        this.orderList = this.orderList.filter(order => !idsToDelete.includes(order.id))
        this.pagination.total = this.orderList.length
        this.selectedOrders = []
        ElMessage.success('批量删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 批量提交
    batchSubmit() {
      ElMessageBox.confirm(`确定要提交选中的 ${this.selectedOrders.length} 个订单进行审核吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        this.selectedOrders.forEach(order => {
          const o = this.orderList.find(item => item.id === order.id)
          if (o) {
            o.status = 'PENDING_REVIEW'
          }
        })
        this.selectedOrders = []
        ElMessage.success('批量提交成功')
      }).catch(() => {
        // 取消提交
      })
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedOrders = selection
    },
    
    // 处理页码变化
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.fetchOrderList()
    },
    
    // 处理每页条数变化
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.fetchOrderList()
    },
    
    // 判断是否可以编辑订单
    canEditOrder(order) {
      return ['DRAFT', 'REJECTED'].includes(order.status)
    },
    
    // 判断是否可以删除订单
    canDeleteOrder(order) {
      return ['DRAFT', 'REJECTED'].includes(order.status)
    },
    
    // 判断是否可以跟踪订单
    canTrackOrder(order) {
      return ['APPROVED', 'COMPLETED'].includes(order.status)
    },
    
    // 判断是否可以批量删除
    get canBatchDelete() {
      return this.selectedOrders.every(order => this.canDeleteOrder(order))
    },
    
    // 判断是否可以批量提交
    get canBatchSubmit() {
      return this.selectedOrders.every(order => order.status === 'DRAFT')
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      const statusMap = {
        DRAFT: 'info',
        PENDING_REVIEW: 'warning',
        REVIEWING: 'primary',
        PENDING_APPROVAL: 'warning',
        APPROVED: 'success',
        REJECTED: 'danger',
        CANCELLED: 'danger',
        COMPLETED: 'success'
      }
      return statusMap[status] || 'info'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        DRAFT: '草稿',
        PENDING_REVIEW: '待审核',
        REVIEWING: '审核中',
        PENDING_APPROVAL: '待审批',
        APPROVED: '已审批',
        REJECTED: '已拒绝',
        CANCELLED: '已取消',
        COMPLETED: '已完成'
      }
      return statusMap[status] || status
    },
    
    // 格式化货币
    formatCurrency(amount) {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2
      }).format(amount || 0)
    },
    
    // 模拟订单数据
    getMockOrderList() {
      const statuses = ['DRAFT', 'PENDING_REVIEW', 'REVIEWING', 'APPROVED', 'COMPLETED', 'REJECTED']
      const now = new Date()
      
      return Array.from({ length: 50 }, (_, index) => {
        const orderDate = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        const deliveryDate = new Date(orderDate.getTime() + Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000)
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        return {
          id: index + 1,
          orderCode: `SO${String(index + 1).padStart(6, '0')}`,
          customerName: `客户${index + 1}`,
          totalAmount: Math.floor(Math.random() * 100000) / 100,
          orderDate: orderDate.toISOString().split('T')[0],
          deliveryDate: deliveryDate.toISOString().split('T')[0],
          status,
          creatorName: '管理员',
          createTime: orderDate.toISOString().replace('T', ' ').substring(0, 19)
        }
      })
    }
  }
}
</script>

<style scoped>
.sales-order-list {
  padding: 20px;
}

.page-card {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.table-section {
  margin-bottom: 20px;
}

.pagination-section {
  text-align: right;
  margin-top: 20px;
}

.batch-actions {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f9eb;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>