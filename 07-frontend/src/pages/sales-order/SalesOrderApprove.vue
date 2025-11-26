<template>
  <div class="sales-order-approve">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>销售订单审批</span>
        </div>
      </template>
      
      <div v-loading="loading" class="approve-content">
        <!-- 订单基本信息 -->
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单编号">{{ orderDetail.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">{{ getStatusText(orderDetail.status) }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ orderDetail.customerName }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">{{ formatCurrency(orderDetail.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="订单日期">{{ orderDetail.orderDate }}</el-descriptions-item>
          <el-descriptions-item label="预计交付日期">{{ orderDetail.deliveryDate }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">{{ getOrderTypeText(orderDetail.orderType) }}</el-descriptions-item>
          <el-descriptions-item label="付款方式">{{ getPaymentMethodText(orderDetail.paymentMethod) }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 审核历史 -->
        <el-divider content-position="left">审核历史</el-divider>
        <el-timeline>
          <el-timeline-item
            v-for="(record, index) in approvalHistory"
            :key="index"
            :timestamp="record.timestamp"
            :type="record.type"
          >
            <div class="timeline-content">
              <h4>{{ record.title }}</h4>
              <p>{{ record.description }}</p>
              <p v-if="record.comments" class="comments">{{ record.comments }}</p>
              <p class="timeline-footer">
                操作人：{{ record.operator }} | 
                时间：{{ record.timestamp }}
              </p>
            </div>
          </el-timeline-item>
        </el-timeline>
        
        <!-- 审批表单 -->
        <el-divider content-position="left">审批意见</el-divider>
        <el-form ref="approveForm" :model="approveData" label-width="120px">
          <el-form-item label="审批决策" prop="decision">
            <el-radio-group v-model="approveData.decision">
              <el-radio label="APPROVE">批准</el-radio>
              <el-radio label="REJECT">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="审批意见" prop="comments" v-if="approveData.decision">
            <el-input
              v-model="approveData.comments"
              type="textarea"
              rows="4"
              placeholder="请输入详细审批意见"
            ></el-input>
          </el-form-item>
          
          <el-form-item label="审批附件" v-if="approveData.decision">
            <el-upload
              class="upload-demo"
              action=""
              :on-preview="handlePreview"
              :on-remove="handleRemove"
              :file-list="fileList"
              :auto-upload="false"
              multiple
            >
              <el-button size="small" type="primary">点击上传</el-button>
              <template #tip>
                <div class="el-upload__tip">
                  只能上传jpg/png文件，且不超过500kb
                </div>
              </template>
            </el-upload>
          </el-form-item>
          
          <el-form-item>
            <el-checkbox v-model="approveData.notifyCustomer">审批完成后通知客户</el-checkbox>
          </el-form-item>
        </el-form>
        
        <!-- 审批操作 -->
        <div class="approve-actions">
          <el-button type="success" @click="handleSubmitApproval" :disabled="!approveData.decision">提交审批</el-button>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'SalesOrderApprove',
  data() {
    return {
      loading: false,
      orderId: null,
      orderDetail: {
        id: '',
        orderNo: '',
        status: '',
        customerName: '',
        totalAmount: 0,
        orderDate: '',
        deliveryDate: '',
        orderType: '',
        paymentMethod: ''
      },
      approvalHistory: [],
      approveData: {
        decision: '',
        comments: '',
        notifyCustomer: false
      },
      fileList: []
    }
  },
  created() {
    this.orderId = this.$route.params.id
    if (this.orderId) {
      this.loadOrderDetail()
    }
  },
  methods: {
    loadOrderDetail() {
      this.loading = true
      // 模拟加载订单详情和审批历史
      setTimeout(() => {
        this.orderDetail = {
          id: this.orderId,
          orderNo: 'SO20240105001',
          status: 'REVIEWED',
          customerName: '东方贸易公司',
          totalAmount: 67800.00,
          orderDate: '2024-01-05',
          deliveryDate: '2024-02-05',
          orderType: 'STANDARD',
          paymentMethod: 'BANK_TRANSFER'
        }
        
        this.approvalHistory = [
          {
            timestamp: '2024-01-05 11:20:00',
            type: 'primary',
            title: '订单创建',
            description: '销售代表创建销售订单',
            operator: '系统管理员'
          },
          {
            timestamp: '2024-01-05 15:45:00',
            type: 'success',
            title: '销售经理审核通过',
            description: '审核通过该销售订单',
            comments: '订单信息完整，价格合理，同意提交审批。',
            operator: '销售经理'
          }
        ]
        
        this.loading = false
      }, 500)
    },
    
    getStatusText(status) {
      const statusMap = {
        'PENDING_REVIEW': '待审核',
        'REVIEWED': '已审核',
        'APPROVED': '已批准',
        'REJECTED': '已拒绝'
      }
      return statusMap[status] || status
    },
    
    getOrderTypeText(orderType) {
      const typeMap = {
        'STANDARD': '标准订单',
        'URGENT': '紧急订单',
        'CUSTOM': '定制订单'
      }
      return typeMap[orderType] || orderType
    },
    
    getPaymentMethodText(paymentMethod) {
      const methodMap = {
        'BANK_TRANSFER': '银行转账',
        'WIRE_TRANSFER': '电汇',
        'CHECK': '支票',
        'CASH_ON_DELIVERY': '货到付款'
      }
      return methodMap[paymentMethod] || paymentMethod
    },
    
    formatCurrency(value) {
      return '¥' + (value || 0).toFixed(2)
    },
    
    handleSubmitApproval() {
      this.$refs.approveForm.validate(valid => {
        if (valid && this.approveData.decision && this.approveData.comments) {
          const action = this.approveData.decision === 'APPROVE' ? '批准' : '拒绝'
          
          this.$confirm(`确定要${action}该订单吗