<template>
  <div class="sales-order-detail">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item><a href="#/sales-order/list">销售订单管理</a></el-breadcrumb-item>
      <el-breadcrumb-item>订单详情</el-breadcrumb-item>
    </el-breadcrumb>
    
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>订单详情</span>
        <div class="card-header-actions">
          <el-button type="primary" size="small" @click="handleEdit" v-if="hasPermission('edit')">
            编辑
          </el-button>
          <el-button type="success" size="small" @click="handlePrint" v-if="hasPermission('print')">
            打印订单
          </el-button>
          <el-button type="warning" size="small" @click="handleCancel" v-if="orderStatus === 'DRAFT'">
            取消订单
          </el-button>
        </div>
      </div>

      <!-- 订单基本信息 -->
      <div class="detail-section">
        <h3 class="section-title">基本信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">订单编号：</span>
            <span class="value">{{ orderInfo.orderNo || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">订单状态：</span>
            <span class="value"><el-tag :type="getStatusType(orderInfo.status)">{{ getStatusText(orderInfo.status) }}</el-tag></span>
          </div>
          <div class="info-item">
            <span class="label">客户名称：</span>
            <span class="value">{{ orderInfo.customerName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系人：</span>
            <span class="value">{{ orderInfo.contactPerson || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话：</span>
            <span class="value">{{ orderInfo.contactPhone || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(orderInfo.createTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建人：</span>
            <span class="value">{{ orderInfo.createBy || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">订单日期：</span>
            <span class="value">{{ formatDate(orderInfo.orderDate) }}</span>
          </div>
        </div>
      </div>

      <!-- 订单商品信息 -->
      <div class="detail-section">
        <h3 class="section-title">商品信息</h3>
        <el-table :data="orderInfo.orderItems" style="width: 100%" stripe>
          <el-table-column prop="productCode" label="商品编码" width="120"></el-table-column>
          <el-table-column prop="productName" label="商品名称" width="200"></el-table-column>
          <el-table-column prop="specification" label="规格型号" width="150"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>
          <el-table-column prop="quantity" label="数量" width="100" align="right"></el-table-column>
          <el-table-column prop="unitPrice" label="单价（元）" width="120" align="right">
            <template slot-scope="scope">
              {{ formatCurrency(scope.row.unitPrice) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额（元）" width="120" align="right">
            <template slot-scope="scope">
              {{ formatCurrency(scope.row.amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150"></el-table-column>
        </el-table>
      </div>

      <!-- 交付信息 -->
      <div class="detail-section">
        <h3 class="section-title">交付信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">交付方式：</span>
            <span class="value">{{ getDeliveryMethodText(orderInfo.deliveryMethod) }}</span>
          </div>
          <div class="info-item">
            <span class="label">交付地址：</span>
            <span class="value">{{ orderInfo.deliveryAddress || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">预计交付日期：</span>
            <span class="value">{{ formatDate(orderInfo.expectedDeliveryDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">收货人：</span>
            <span class="value">{{ orderInfo.receiverName || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">联系电话：</span>
            <span class="value">{{ orderInfo.receiverPhone || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 付款信息 -->
      <div class="detail-section">
        <h3 class="section-title">付款信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">付款方式：</span>
            <span class="value">{{ getPaymentMethodText(orderInfo.paymentMethod) }}</span>
          </div>
          <div class="info-item">
            <span class="label">付款条件：</span>
            <span class="value">{{ orderInfo.paymentTerms || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">已付金额：</span>
            <span class="value">{{ formatCurrency(orderInfo.paidAmount) }}</span>
          </div>
          <div class="info-item">
            <span class="label">未付金额：</span>
            <span class="value">{{ formatCurrency(orderInfo.unpaidAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- 订单金额汇总 -->
      <div class="detail-section">
        <h3 class="section-title">金额汇总</h3>
        <div class="amount-summary">
          <div class="summary-item">
            <span class="label">商品总价：</span>
            <span class="value">{{ formatCurrency(orderInfo.totalAmount) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">运费：</span>
            <span class="value">{{ formatCurrency(orderInfo.freight) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">折扣：</span>
            <span class="value">{{ formatCurrency(orderInfo.discount) }}</span>
          </div>
          <div class="summary-item total">
            <span class="label">订单总计：</span>
            <span class="value">{{ formatCurrency(orderInfo.grandTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- 订单备注 -->
      <div class="detail-section" v-if="orderInfo.remark">
        <h3 class="section-title">订单备注</h3>
        <div class="remark-content">
          {{ orderInfo.remark }}
        </div>
      </div>

      <!-- 操作日志 -->
      <div class="detail-section">
        <h3 class="section-title">操作日志</h3>
        <el-table :data="orderLogs" style="width: 100%" size="small">
          <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
          <el-table-column prop="action" label="操作类型" width="150"></el-table-column>
          <el-table-column prop="content" label="操作内容" min-width="200"></el-table-column>
          <el-table-column prop="createTime" label="操作时间" width="180">
            <template slot-scope="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SalesOrderDetail',
  data() {
    return {
      orderId: '',
      orderInfo: {
        orderNo: '',
        status: '',
        customerName: '',
        contactPerson: '',
        contactPhone: '',
        createTime: '',
        createBy: '',
        orderDate: '',
        deliveryMethod: '',
        deliveryAddress: '',
        expectedDeliveryDate: '',
        receiverName: '',
        receiverPhone: '',
        paymentMethod: '',
        paymentTerms: '',
        paidAmount: 0,
        unpaidAmount: 0,
        totalAmount: 0,
        freight: 0,
        discount: 0,
        grandTotal: 0,
        remark: '',
        orderItems: []
      },
      orderLogs: [],
      permissions: ['view', 'edit', 'print'] // 模拟权限数据
    }
  },
  computed: {
    orderStatus() {
      return this.orderInfo.status
    }
  },
  created() {
    this.orderId = this.$route.params.id
    this.fetchOrderDetail()
    this.fetchOrderLogs()
  },
  methods: {
    // 获取订单详情
    async fetchOrderDetail() {
      try {
        // 模拟API调用
        // const response = await this.$axios.get(`/api/sales-orders/${this.orderId}`)
        // this.orderInfo = response.data
        
        // 模拟数据
        this.orderInfo = {
          orderNo: 'SO20240520001',
          status: 'CONFIRMED',
          customerName: '深圳市科技发展有限公司',
          contactPerson: '张三',
          contactPhone: '13800138000',
          createTime: '2024-05-20T10:00:00',
          createBy: '李四',
          orderDate: '2024-05-20',
          deliveryMethod: 'EXPRESS',
          deliveryAddress: '广东省深圳市南山区科技园路100号',
          expectedDeliveryDate: '2024-05-25',
          receiverName: '王五',
          receiverPhone: '13900139000',
          paymentMethod: 'BANK_TRANSFER',
          paymentTerms: '30天',
          paidAmount: 0,
          unpaidAmount: 29600.00,
          totalAmount: 29600.00,
          freight: 0,
          discount: 0,
          grandTotal: 29600.00,
          remark: '加急订单，请优先处理',
          orderItems: [
            {
              productCode: 'P001',
              productName: '高性能服务器',
              specification: 'Intel Xeon 32核 128GB',
              unit: '台',
              quantity: 2,
              unitPrice: 12000.00,
              amount: 24000.00,
              remark: ''
            },
            {
              productCode: 'P002',
              productName: '企业级交换机',
              specification: '48端口千兆',
              unit: '台',
              quantity: 1,
              unitPrice: 5600.00,
              amount: 5600.00,
              remark: ''
            }
          ]
        }
      } catch (error) {
        this.$message.error('获取订单详情失败')
        console.error('获取订单详情失败:', error)
      }
    },
    
    // 获取订单操作日志
    async fetchOrderLogs() {
      try {
        // 模拟API调用
        // const response = await this.$axios.get(`/api/sales-orders/${this.orderId}/logs`)
        // this.orderLogs = response.data
        
        // 模拟数据
        this.orderLogs = [
          {
            operator: '李四',
            action: '创建订单',
            content: '创建了订单SO20240520001',
            createTime: '2024-05-20T10:00:00'
          },
          {
            operator: '张三',
            action: '审核通过',
            content: '审核通过了订单SO20240520001',
            createTime: '2024-05-20T14:30:00'
          },
          {
            operator: '王五',
            action: '确认订单',
            content: '确认了订单SO20240520001',
            createTime: '2024-05-20T16:00:00'
          }
        ]
      } catch (error) {
        this.$message.error('获取操作日志失败')
        console.error('获取操作日志失败:', error)
      }
    },
    
    // 编辑订单
    handleEdit() {
      this.$router.push({ path: `/sales-order/create?id=${this.orderId}` })
    },
    
    // 打印订单
    handlePrint() {
      window.print()
    },
    
    // 取消订单
    handleCancel() {
      this.$confirm('确定要取消此订单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟取消订单API调用
        setTimeout(() => {
          this.$message.success('订单已取消')
          this.fetchOrderDetail()
        }, 500)
      }).catch(() => {
        this.$message.info('已取消操作')
      })
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '-'  
      return new Date(date).toLocaleDateString('zh-CN')
    },
    
    // 格式化日期时间
    formatDateTime(date) {
      if (!date) return '-'  
      return new Date(date).toLocaleString('zh-CN')
    },
    
    // 格式化货币
    formatCurrency(value) {
      if (value === null || value === undefined) return '0.00'
      return Number(value).toFixed(2)
    },
    
    // 获取状态标签类型
    getStatusType(status) {
      const statusMap = {
        'DRAFT': 'info',
        'SUBMITTED': 'primary', 
        'APPROVED': 'success',
        'REJECTED': 'danger',
        'CONFIRMED': 'warning',
        'CANCELLED': 'text'
      }
      return statusMap[status] || 'default'
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'DRAFT': '草稿',
        'SUBMITTED': '已提交',
        'APPROVED': '已审批',
        'REJECTED': '已拒绝',
        'CONFIRMED': '已确认',
        'CANCELLED': '已取消'
      }
      return statusMap[status] || status
    },
    
    // 获取交付方式文本
    getDeliveryMethodText(method) {
      const methodMap = {
        'SELF_PICKUP': '自提',
        'EXPRESS': '快递配送',
        'LOGISTICS': '物流配送',
        'OTHER': '其他'
      }
      return methodMap[method] || method
    },
    
    // 获取付款方式文本
    getPaymentMethodText(method) {
      const methodMap = {
        'CASH': '现金',
        'BANK_TRANSFER': '银行转账',
        'ONLINE_PAY': '在线支付',
        'CREDIT': '信用支付',
        'OTHER': '其他'
      }
      return methodMap[method] || method
    },
    
    // 检查权限
    hasPermission(permission) {
      return this.permissions.includes(permission)
    }
  }
}
</script>

<style scoped>
.sales-order-detail {
  padding: 20px;
}

.card-header-actions {
  float: right;
}

.card-header-actions .el-button {
  margin-left: 10px;
}

.detail-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 4px;
}

.section-title {
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  font-size: 16px;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  margin-bottom: 10px;
}

.info-item .label {
  flex: 0 0 100px;
  color: #606266;
}

.info-item .value {
  flex: 1;
  color: #303133;
}

.amount-summary {
  margin-left: auto;
  width: 400px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  padding: 5px 0;
}

.summary-item.total {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  font-size: 16px;
  font-weight: 500;
}

.summary-item .value {
  color: #f56c6c;
  font-weight: 500;
}

.remark-content {
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  min-height: 60px;
  white-space: pre-wrap;
}

@media print {
  .card-header-actions {
    display: none;
  }
  
  .sales-order-detail {
    padding: 0;
  }
}
</style>