<template>
  <div class="sales-order-review">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item><a href="#/sales-order/list">销售订单管理</a></el-breadcrumb-item>
      <el-breadcrumb-item>订单审核</el-breadcrumb-item>
    </el-breadcrumb>
    
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>订单审核</span>
        <el-button type="info" size="small" @click="handleBack" class="back-button">
          返回列表
        </el-button>
      </div>

      <!-- 订单基本信息 -->
      <div class="review-section">
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
      <div class="review-section">
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

      <!-- 交付和付款信息 -->
      <div class="review-section">
        <h3 class="section-title">交付与付款信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">交付方式：</span>
            <span class="value">{{ getDeliveryMethodText(orderInfo.deliveryMethod) }}</span>
          </div>
          <div class="info-item">
            <span class="label">预计交付日期：</span>
            <span class="value">{{ formatDate(orderInfo.expectedDeliveryDate) }}</span>
          </div>
          <div class="info-item">
            <span class="label">付款方式：</span>
            <span class="value">{{ getPaymentMethodText(orderInfo.paymentMethod) }}</span>
          </div>
          <div class="info-item">
            <span class="label">付款条件：</span>
            <span class="value">{{ orderInfo.paymentTerms || '-' }}</span>
          </div>
        </div>
      </div>

      <!-- 订单金额汇总 -->
      <div class="review-section">
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
      <div class="review-section" v-if="orderInfo.remark">
        <h3 class="section-title">订单备注</h3>
        <div class="remark-content">
          {{ orderInfo.remark }}
        </div>
      </div>

      <!-- 审核操作 -->
      <div class="review-section">
        <h3 class="section-title">审核操作</h3>
        <el-form ref="reviewForm" :model="reviewForm" label-width="80px">
          <el-form-item label="审核意见">
            <el-input
              type="textarea"
              v-model="reviewForm.comment"
              placeholder="请输入审核意见"
              :rows="4"
            ></el-input>
          </el-form-item>
          
          <el-form-item>
            <div class="action-buttons">
              <el-button type="success" @click="handleApprove">通过</el-button>
              <el-button type="danger" @click="handleReject">拒绝</el-button>
              <el-button @click="handleBack">取消</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import orderApi from '@/api/sales/orderApi'

export default {
  name: 'SalesOrderReview',
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
        expectedDeliveryDate: '',
        paymentMethod: '',
        paymentTerms: '',
        totalAmount: 0,
        freight: 0,
        discount: 0,
        grandTotal: 0,
        remark: '',
        orderItems: []
      },
      reviewForm: {
        comment: ''
      }
    }
  },
  created() {
    this.orderId = this.$route.params.id
    this.fetchOrderDetail()
  },
  methods: {
    // 获取订单详情
    async fetchOrderDetail() {
      try {
        // 获取订单详情
        const response = await orderApi.getOrderDetail(this.orderId)
        this.orderInfo = response || this.orderInfo
        
        // 确保订单状态为可审核状态
        if (!['SUBMITTED', 'PENDING_REVIEW'].includes(this.orderInfo.status)) {
          ElMessage.warning('该订单当前状态不可审核')
        }
      } catch (error) {
        ElMessage.error('获取订单详情失败: ' + (error.message || '未知错误'))
        console.error('获取订单详情失败:', error)
        
        // 加载失败时使用模拟数据作为备份
        this.loadMockData()
      }
    },
    
    // 加载模拟数据（作为备份）
    loadMockData() {
      this.orderInfo = {
        orderNo: 'SO20240521001',
        status: 'SUBMITTED',
        customerName: '广州市贸易有限公司',
        contactPerson: '赵六',
        contactPhone: '13700137000',
        createTime: '2024-05-21T10:00:00',
        createBy: '钱七',
        orderDate: '2024-05-21',
        deliveryMethod: 'LOGISTICS',
        expectedDeliveryDate: '2024-05-28',
        paymentMethod: 'CREDIT',
        paymentTerms: '60天',
        totalAmount: 58500.00,
        freight: 1000.00,
        discount: 2000.00,
        grandTotal: 57500.00,
        remark: '请尽快处理',
        orderItems: [
          {
            productCode: 'P003',
            productName: '企业级存储设备',
            specification: '100TB 高速缓存',
            unit: '台',
            quantity: 1,
            unitPrice: 45000.00,
            amount: 45000.00,
            remark: ''
          },
          {
            productCode: 'P004',
            productName: '网络安全设备',
            specification: '企业级防火墙',
            unit: '套',
            quantity: 1,
            unitPrice: 13500.00,
            amount: 13500.00,
            remark: ''
          }
        ]
      }
    },
    
    // 审核通过
    handleApprove() {
      ElMessageBox.confirm('确定要通过此订单审核吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }).then(() => {
        this.submitReview('APPROVED')
      }).catch(() => {
        ElMessage.info('已取消操作')
      })
    },
    
    // 审核拒绝
    handleReject() {
      if (!this.reviewForm.comment) {
        ElMessage.warning('请输入拒绝原因')
        return
      }
      
      ElMessageBox.confirm('确定要拒绝此订单审核吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.submitReview('REJECTED')
      }).catch(() => {
        ElMessage.info('已取消操作')
      })
    },
    
    // 提交审核结果
    async submitReview(result) {
      try {
        // 准备审核数据
        const reviewData = {
          result,
          comment: this.reviewForm.comment
        }
        
        // 调用审核API
        await orderApi.reviewOrder(this.orderId, reviewData)
        
        ElMessage.success(`订单${result === 'APPROVED' ? '审核通过' : '审核拒绝'}`)
        this.$router.push('/sales-order/list')
      } catch (error) {
        ElMessage.error('提交审核结果失败: ' + (error.message || '未知错误'))
        console.error('提交审核结果失败:', error)
      }
    },
    
    // 返回列表
    handleBack() {
      this.$router.push('/sales-order/list')
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '-'  
      return new Date(date).toLocaleDateString('zh-CN')
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
    }
  }
}
</script>

<style scoped>
.sales-order-review {
  padding: 20px;
}

.back-button {
  float: right;
}

.review-section {
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

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
</style>