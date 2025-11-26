<template>
  <div class="purchase-order-approve">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>采购订单审批</h1>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单编号"></el-input>
        </el-form-item>
        <el-form-item label="供应商">
          <el-input v-model="searchForm.supplierName" placeholder="请输入供应商名称"></el-input>
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="searchForm.creator" placeholder="请输入创建人"></el-input>
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
        <el-table-column prop="totalAmount" label="订单金额" width="120" formatter="formatCurrency"></el-table-column>
        <el-table-column prop="creator" label="创建人" width="100"></el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="180"></el-table-column>
        <el-table-column prop="urgency" label="紧急程度" width="100">
          <template slot-scope="scope">
            <el-tag :type="getUrgencyTagType(scope.row.urgency)">
              {{ getUrgencyText(scope.row.urgency) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleViewDetails(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleApprove(scope.row)">审批</el-button>
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
          <el-descriptions-item label="创建人">{{ currentOrder.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentOrder.createdTime }}</el-descriptions-item>
          <el-descriptions-item label="预计到货日期">{{ currentOrder.expectedDeliveryDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="紧急程度" :span="1">
            <el-tag :type="getUrgencyTagType(currentOrder.urgency)">
              {{ getUrgencyText(currentOrder.urgency) }}
            </el-tag>
          </el-descriptions-item>
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
            <el-table-column prop="unitPrice" label="单价" width="100" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="totalPrice" label="金额" width="100" formatter="formatCurrency"></el-table-column>
            <el-table-column prop="deliveryDate" label="交货日期" width="150"></el-table-column>
            <el-table-column prop="remark" label="备注" min-width="100"></el-table-column>
          </el-table>
        </div>

        <!-- 订单总额 -->
        <div class="mt-4 text-right">
          <el-descriptions border column="2" :column-setting="[{ type: 'flex', flex: 4 }, { type: 'flex', flex: 1 }]">
            <el-descriptions-item label="订单总额">{{ formatCurrency(currentOrder.totalAmount) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseDetailDialog">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog
      title="订单审批"
      :visible.sync="approveDialogVisible"
      width="600px"
      :before-close="handleCloseApproveDialog"
    >
      <div class="approve-form">
        <el-form :model="approveForm" label-width="80px">
          <el-form-item label="订单编号">
            <el-input v-model="approveForm.orderNo" disabled></el-input>
          </el-form-item>
          <el-form-item label="审批结果" prop="result" required>
            <el-radio-group v-model="approveForm.result">
              <el-radio label="APPROVED">同意</el-radio>
              <el-radio label="REJECTED">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审批意见" prop="comments" required>
            <el-input
              v-model="approveForm.comments"
              type="textarea"
              rows="4"
              placeholder="请输入审批意见"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleCloseApproveDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmitApproval">提交审批</el-button>
      </div>
    </el-dialog>

    <!-- 确认对话框 -->
    <el-dialog
      :title="confirmDialogTitle"
      :visible.sync="confirmDialogVisible"
      width="400px"
    >
      <p>{{ confirmDialogMessage }}</p>
      <div slot="footer" class="dialog-footer">
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmAction">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'PurchaseOrderApprove',
  data() {
    return {
      // 搜索表单
      searchForm: {
        orderNo: '',
        supplierName: '',
        creator: ''
      },
      dateRange: [],
      // 待审批订单列表
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
      // 审批对话框
      approveDialogVisible: false,
      approveForm: {
        orderId: null,
        orderNo: '',
        result: '',
        comments: ''
      },
      // 确认对话框
      confirmDialogVisible: false,
      confirmDialogTitle: '',
      confirmDialogMessage: '',
      confirmAction: null
    }
  },
  created() {
    this.loadOrderList()
  },
  methods: {
    // 加载待审批订单列表
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
      const urgencyLevels = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
      const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D']
      const data = []
      
      for (let i = 1; i <= 30; i++) {
        const urgency = urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)]
        const totalAmount = Math.floor(Math.random() * 100000) + 10000
        data.push({
          id: i,
          orderNo: `PO${new Date().getFullYear()}${String(i).padStart(4, '0')}`,
          supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
          contactPerson: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
          contactPhone: `1380013800${Math.floor(Math.random() * 10) + 1}`,
          totalAmount: totalAmount,
          creator: `用户${Math.floor(Math.random() * 10) + 1}`,
          createdTime: this.formatDate(new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000)),
          expectedDeliveryDate: this.formatDate(new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000)),
          urgency: urgency,
          remark: '请尽快审批',
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
        items.push({
          id: i,
          itemNo: `ITEM${String(Math.floor(Math.random() * 9000) + 1000)}`,
          itemName: `物料名称${i}`,
          specification: `规格${i}`,
          unit: ['个', '件', '箱', '套'][Math.floor(Math.random() * 4)],
          orderQuantity: orderQuantity,
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
    formatCurrency(value) {
      if (!value) return '¥0.00'
      return `¥${Number(value).toFixed(2)}`
    },
    // 获取紧急程度标签类型
    getUrgencyTagType(urgency) {
      const typeMap = {
        LOW: 'info',
        MEDIUM: 'warning',
        HIGH: 'primary',
        URGENT: 'danger'
      }
      return typeMap[urgency] || 'default'
    },
    // 获取紧急程度文本
    getUrgencyText(urgency) {
      const textMap = {
        LOW: '一般',
        MEDIUM: '中等',
        HIGH: '紧急',
        URGENT: '非常紧急'
      }
      return textMap[urgency] || urgency
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
        supplierName: '',
        creator: ''
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
    // 查看详情
    handleViewDetails(row) {
      this.currentOrder = { ...row }
      this.detailDialogVisible = true
    },
    // 审批订单
    handleApprove(row) {
      this.approveForm = {
        orderId: row.id,
        orderNo: row.orderNo,
        result: 'APPROVED',
        comments: ''
      }
      this.approveDialogVisible = true
    },
    // 提交审批
    handleSubmitApproval() {
      if (!this.approveForm.result) {
        this.$message.error('请选择审批结果')
        return
      }
      if (!this.approveForm.comments) {
        this.$message.error('请输入审批意见')
        return
      }
      
      // 模拟提交审批
      setTimeout(() => {
        this.$message.success('审批提交成功')
        this.approveDialogVisible = false
        this.loadOrderList()
      }, 500)
    },
    // 关闭详情对话框
    handleCloseDetailDialog() {
      this.detailDialogVisible = false
      this.currentOrder = {}
    },
    // 关闭审批对话框
    handleCloseApproveDialog() {
      this.approveDialogVisible = false
      this.approveForm = {
        orderId: null,
        orderNo: '',
        result: '',
        comments: ''
      }
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
.purchase-order-approve {
  padding: 20px;
}

.page-header {
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

.approve-form {
  line-height: 1.8;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
}
</style>