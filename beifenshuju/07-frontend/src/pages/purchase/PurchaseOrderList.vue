<template>
  <div class="purchase-order-list">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <h1>采购订单管理</h1>
      <el-button type="primary" icon="el-icon-plus" @click="handleCreateOrder">
        新建采购订单
      </el-button>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单编号"></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="请选择供应商">
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="待确认" value="PENDING"></el-option>
            <el-option label="已确认" value="CONFIRMED"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
            <el-option label="已取消" value="CANCELLED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="orderList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="id" label="订单ID" width="80"></el-table-column>
        <el-table-column prop="orderNo" label="订单编号" width="180"></el-table-column>
        <el-table-column prop="supplierName" label="供应商" width="150"></el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="100"></el-table-column>
        <el-table-column prop="contactPhone" label="联系电话" width="120"></el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" width="120" formatter="formatCurrency"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="180"></el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">查看</el-button>
            <el-button
              v-if="scope.row.status === 'PENDING'"
              size="small"
              type="primary"
              @click="handleEditOrder(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="scope.row.status === 'PENDING'"
              size="small"
              type="danger"
              @click="handleCancelOrder(scope.row)"
            >
              取消
            </el-button>
            <el-button
              v-if="scope.row.status === 'CONFIRMED'"
              size="small"
              type="success"
              @click="handleCompleteOrder(scope.row)"
            >
              完成
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination">
        <el-pagination
          background
          layout="prev, pager, next, jumper, total, sizes"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog
      title="采购订单详情"
      :visible.sync="detailDialogVisible"
      width="80%"
      :before-close="handleCloseDetailDialog"
    >
      <div class="order-detail">
        <!-- 订单基本信息 -->
        <el-descriptions title="基本信息" border>
          <el-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentOrder.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentOrder.contactPerson }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentOrder.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="订单状态" :span="1">
            <el-tag :type="getStatusTagType(currentOrder.status)">
              {{ getStatusText(currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentOrder.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.createdTime }}</el-descriptions-item>
          <el-descriptions-item label="预计到货日期">{{ currentOrder.expectedDeliveryDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 订单物料列表 -->
        <div class="mt-4">
          <h3>订单物料</h3>
          <el-table :data="currentOrder.items" style="width: 100%">
            <el-table-column prop="itemNo" label="物料编码" width="150"></el-table-column>
            <el-table-column prop="itemName" label="物料名称" width="200"></el-table-column>
            <el-table-column prop="specification" label="规格型号" width="150"></el-table-column>
            <el-table-column prop="unit" label="单位" width="80"></el-table-column>
            <el-table-column prop="orderQuantity" label="订购数量" width="100"></el-table-column>
            <el-table-column prop="receivedQuantity" label="已收数量" width="100"></el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="100" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="totalPrice" label="金额" width="100" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="deliveryDate" label="交货日期" width="150"></el-table-column>
            <el-table-column prop="remark" label="备注" min-width="100"></el-table-column>
          </el-table>
        </div>

        <!-- 订单总额 -->
        <div class="mt-4 text-right">
          <el-descriptions border column="2" :column-setting="[{ type: 'flex', flex: 4 }, { type: 'flex', flex: 1 }]">
            <el-descriptions-item label="订单总额">{{ formatCurrency(null, null, currentOrder.totalAmount) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseDetailDialog">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      :title="confirmDialogTitle"
      :visible.sync="confirmDialogVisible"
      width="400px"
      :before-close="handleCloseConfirmDialog"
    >
      <p>{{ confirmDialogMessage }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseConfirmDialog">取消</el-button>
        <el-button type="primary" @click="handleConfirmAction">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PurchaseOrderList',
  data() {
    return {
      // 搜索表单
      searchForm: {
        orderNo: '',
        supplierId: '',
        status: ''
      },
      dateRange: [],
      // 供应商列表
      suppliers: [],
      // 采购订单列表数据
      orderList: [],
      // 分页信息
      currentPage: 1,
      pageSize: 10,
      total: 0,
      // 加载状态
      loading: false,
      // 选中的行
      selectedRows: [],
      // 详情对话框
      detailDialogVisible: false,
      currentOrder: {},
      // 确认对话框
      confirmDialogVisible: false,
      confirmDialogTitle: '',
      confirmDialogMessage: '',
      confirmAction: null
    }
  },
  created() {
    this.initData()
  },
  methods: {
    // 初始化数据
    initData() {
      this.loadSuppliers()
      this.loadOrderList()
    },
    // 加载供应商列表
    loadSuppliers() {
      // 模拟数据，实际应该从API获取
      this.suppliers = [
        { id: 1, name: '供应商A', contactPerson: '张三', contactPhone: '13800138001' },
        { id: 2, name: '供应商B', contactPerson: '李四', contactPhone: '13800138002' },
        { id: 3, name: '供应商C', contactPerson: '王五', contactPhone: '13800138003' },
        { id: 4, name: '供应商D', contactPerson: '赵六', contactPhone: '13800138004' }
      ]
    },
    // 加载采购订单列表
    loadOrderList() {
      this.loading = true
      // 模拟API请求
      setTimeout(() => {
        // 模拟数据
        this.orderList = this.generateMockData()
        this.total = this.orderList.length
        this.loading = false
      }, 500)
    },
    // 生成模拟数据
    generateMockData() {
      const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
      const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D']
      const data = []
      
      for (let i = 1; i <= 50; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const totalAmount = Math.floor(Math.random() * 100000) + 10000
        data.push({
          id: i,
          orderNo: `PO${new Date().getFullYear()}${String(i).padStart(4, '0')}`,
          supplierId: Math.floor(Math.random() * 4) + 1,
          supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
          contactPerson: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
          contactPhone: `1380013800${Math.floor(Math.random() * 10) + 1}`,
          totalAmount: totalAmount,
          status: status,
          createdTime: this.formatDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
          creator: `用户${Math.floor(Math.random() * 10) + 1}`,
          expectedDeliveryDate: this.formatDate(new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000)),
          remark: '请按时交货',
          items: this.generateMockItems()
        })
      }
      return data
    },
    // 生成模拟物料数据
    generateMockItems() {
      const items = []
      const itemCount = Math.floor(Math.random() * 5) + 1
      
      for (let i = 1; i <= itemCount; i++) {
        const orderQuantity = Math.floor(Math.random() * 100) + 1
        const unitPrice = Math.floor(Math.random() * 1000) + 100
        const receivedQuantity = Math.random() > 0.5 ? Math.floor(orderQuantity * (Math.random() * 0.8 + 0.2)) : 0
        items.push({
          id: i,
          itemNo: `ITEM${String(Math.floor(Math.random() * 9000) + 1000)}`,
          itemName: `物料名称${i}`,
          specification: `规格${i}`,
          unit: ['个', '件', '箱', '套'][Math.floor(Math.random() * 4)],
          orderQuantity: orderQuantity,
          receivedQuantity: receivedQuantity,
          unitPrice: unitPrice,
          totalPrice: orderQuantity * unitPrice,
          deliveryDate: this.formatDate(new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000)),
          remark: ''
        })
      }
      return items
    },
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
    // 格式化货币
    formatCurrency(row, column, cellValue) {
      if (!cellValue) return '¥0.00'
      return `¥${cellValue.toFixed(2)}`
    },
    // 获取状态标签类型
    getStatusTagType(status) {
      const typeMap = {
        PENDING: 'warning',
        CONFIRMED: 'primary',
        COMPLETED: 'success',
        CANCELLED: 'danger'
      }
      return typeMap[status] || 'default'
    },
    // 获取状态文本
    getStatusText(status) {
      const textMap = {
        PENDING: '待确认',
        CONFIRMED: '已确认',
        COMPLETED: '已完成',
        CANCELLED: '已取消'
      }
      return textMap[status] || status
    },
    // 处理搜索
    handleSearch() {
      this.currentPage = 1
      this.loadOrderList()
    },
    // 处理重置
    handleReset() {
      this.searchForm = {
        orderNo: '',
        supplierId: '',
        status: ''
      }
      this.dateRange = []
      this.handleSearch()
    },
    // 处理分页大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.loadOrderList()
    },
    // 处理当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current
      this.loadOrderList()
    },
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection
    },
    // 新建采购订单
    handleCreateOrder() {
      // 跳转到创建页面，实际应该使用路由跳转
      this.$message.info('跳转到创建采购订单页面')
    },
    // 编辑采购订单
    handleEditOrder(row) {
      this.$message.info(`编辑采购订单：${row.orderNo}`)
    },
    // 查看详情
    handleViewDetails(row) {
      this.currentOrder = { ...row }
      this.detailDialogVisible = true
    },
    // 取消订单
    handleCancelOrder(row) {
      this.confirmDialogTitle = '取消订单确认'
      this.confirmDialogMessage = `确定要取消采购订单 ${row.orderNo} 吗？`
      this.confirmAction = () => {
        // 模拟取消订单
        setTimeout(() => {
          this.$message.success('订单已取消')
          this.loadOrderList()
        }, 500)
        this.confirmDialogVisible = false
      }
      this.confirmDialogVisible = true
    },
    // 完成订单
    handleCompleteOrder(row) {
      this.confirmDialogTitle = '完成订单确认'
      this.confirmDialogMessage = `确定要将采购订单 ${row.orderNo} 标记为完成吗？`
      this.confirmAction = () => {
        // 模拟完成订单
        setTimeout(() => {
          this.$message.success('订单已完成')
          this.loadOrderList()
        }, 500)
        this.confirmDialogVisible = false
      }
      this.confirmDialogVisible = true
    },
    // 关闭详情对话框
    handleCloseDetailDialog() {
      this.detailDialogVisible = false
      this.currentOrder = {}
    },
    // 关闭确认对话框
    handleCloseConfirmDialog() {
      this.confirmDialogVisible = false
      this.confirmAction = null
    },
    // 处理确认操作
    handleConfirmAction() {
      if (this.confirmAction) {
        this.confirmAction()
      }
    }
  }
}
</script>

<style scoped>
.purchase-order-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-section {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.order-detail {
  line-height: 1.8;
}

.mt-4 {
  margin-top: 20px;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>