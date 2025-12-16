<template>
  <div class="order-tracking">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item><a href="#/sales-order/list">销售订单管理</a></el-breadcrumb-item>
      <el-breadcrumb-item>订单跟踪</el-breadcrumb-item>
    </el-breadcrumb>
    
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>订单跟踪</span>
        <el-button type="info" size="small" @click="handleBack" class="back-button">
          返回列表
        </el-button>
      </div>

      <!-- 订单基本信息 -->
      <div class="tracking-section">
        <h3 class="section-title">订单信息</h3>
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
            <span class="label">订单金额：</span>
            <span class="value">{{ formatCurrency(orderInfo.grandTotal) }}</span>
          </div>
        </div>
      </div>

      <!-- 订单进度跟踪 -->
      <div class="tracking-section">
        <h3 class="section-title">订单进度</h3>
        <div class="timeline-container">
          <el-timeline :reverse="false">
            <el-timeline-item
              v-for="(step, index) in orderSteps"
              :key="index"
              :timestamp="formatDateTime(step.timestamp)"
              :type="step.status === 'COMPLETED' ? 'success' : step.status === 'IN_PROGRESS' ? 'primary' : 'default'"
              :icon="step.status === 'COMPLETED' ? 'el-icon-circle-check' : step.status === 'IN_PROGRESS' ? 'el-icon-loading' : 'el-icon-circle-close'"
            >
              <div class="timeline-content">
                <h4 class="step-title">{{ step.title }}</h4>
                <p class="step-description" v-if="step.description">{{ step.description }}</p>
                <div class="step-actions" v-if="step.actions && step.status === 'IN_PROGRESS'">
                  <el-button
                    v-for="(action, actionIndex) in step.actions"
                    :key="actionIndex"
                    :type="action.type || 'primary'"
                    size="small"
                    @click="handleStepAction(action, step)"
                  >
                    {{ action.text }}
                  </el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>

      <!-- 物流信息 -->
      <div class="tracking-section" v-if="logisticsInfo.trackingNo">
        <h3 class="section-title">物流信息</h3>
        <div class="logistics-info">
          <div class="logistics-header">
            <div class="logistics-company">
              <span class="label">物流公司：</span>
              <span class="value">{{ logisticsInfo.company || '-' }}</span>
            </div>
            <div class="logistics-number">
              <span class="label">物流单号：</span>
              <span class="value">{{ logisticsInfo.trackingNo }}</span>
            </div>
          </div>
          
          <div class="logistics-timeline">
            <el-timeline :reverse="true">
              <el-timeline-item
                v-for="(event, index) in logisticsEvents"
                :key="index"
                :timestamp="formatDateTime(event.time)"
                type="info"
              >
                <div class="logistics-event">
                  <p>{{ event.description }}</p>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>

      <!-- 交付信息 -->
      <div class="tracking-section">
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
            <span class="label">实际交付日期：</span>
            <span class="value">{{ formatDate(orderInfo.actualDeliveryDate) || '未交付' }}</span>
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

      <!-- 支付信息 -->
      <div class="tracking-section">
        <h3 class="section-title">支付信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">支付方式：</span>
            <span class="value">{{ getPaymentMethodText(orderInfo.paymentMethod) }}</span>
          </div>
          <div class="info-item">
            <span class="label">已付金额：</span>
            <span class="value">{{ formatCurrency(orderInfo.paidAmount) }}</span>
          </div>
          <div class="info-item">
            <span class="label">未付金额：</span>
            <span class="value">{{ formatCurrency(orderInfo.unpaidAmount) }}</span>
          </div>
          <div class="info-item">
            <span class="label">支付状态：</span>
            <span class="value"><el-tag :type="getPaymentStatusType(orderInfo.paymentStatus)">{{ getPaymentStatusText(orderInfo.paymentStatus) }}</el-tag></span>
          </div>
        </div>
      </div>

      <!-- 备注信息 -->
      <div class="tracking-section" v-if="orderInfo.trackingRemark">
        <h3 class="section-title">备注信息</h3>
        <div class="remark-content">
          {{ orderInfo.trackingRemark }}
        </div>
      </div>

      <!-- 操作记录 -->
      <div class="tracking-section">
        <h3 class="section-title">操作记录</h3>
        <el-table :data="operationLogs" style="width: 100%" size="small">
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
  name: 'OrderTracking',
  data() {
    return {
      orderId: '',
      orderInfo: {
        orderNo: '',
        status: '',
        customerName: '',
        grandTotal: 0,
        deliveryMethod: '',
        deliveryAddress: '',
        expectedDeliveryDate: '',
        actualDeliveryDate: '',
        receiverName: '',
        receiverPhone: '',
        paymentMethod: '',
        paidAmount: 0,
        unpaidAmount: 0,
        paymentStatus: '',
        trackingRemark: ''
      },
      orderSteps: [],
      logisticsInfo: {
        company: '',
        trackingNo: ''
      },
      logisticsEvents: [],
      operationLogs: []
    }
  },
  created() {
    this.orderId = this.$route.params.id || 'default'
    this.fetchOrderTrackingData()
  },
  methods: {
    // 获取订单跟踪数据
    async fetchOrderTrackingData() {
      try {
        // 模拟API调用
        // const response = await this.$axios.get(`/api/sales-orders/${this.orderId}/tracking`)
        // const data = response.data
        // this.orderInfo = data.orderInfo
        // this.orderSteps = data.orderSteps
        // this.logisticsInfo = data.logisticsInfo
        // this.logisticsEvents = data.logisticsEvents
        // this.operationLogs = data.operationLogs
        
        // 模拟数据
        this.orderInfo = {
          orderNo: 'SO20240522001',
          status: 'SHIPPED',
          customerName: '北京市科技有限公司',
          grandTotal: 36800.00,
          deliveryMethod: 'EXPRESS',
          deliveryAddress: '北京市海淀区中关村科技园区8号楼',
          expectedDeliveryDate: '2024-05-28',
          actualDeliveryDate: '',
          receiverName: '孙八',
          receiverPhone: '13600136000',
          paymentMethod: 'BANK_TRANSFER',
          paidAmount: 36800.00,
          unpaidAmount: 0,
          paymentStatus: 'PAID',
          trackingRemark: '客户要求周末送货，请提前联系确认'
        }
        
        this.orderSteps = [
          {
            title: '订单创建',
            description: '订单已创建并等待审批',
            timestamp: '2024-05-22T10:00:00',
            status: 'COMPLETED'
          },
          {
            title: '订单审批',
            description: '订单已通过审批',
            timestamp: '2024-05-22T14:30:00',
            status: 'COMPLETED'
          },
          {
            title: '订单确认',
            description: '订单已确认并安排生产',
            timestamp: '2024-05-22T16:00:00',
            status: 'COMPLETED'
          },
          {
            title: '生产完成',
            description: '产品已生产完成并准备发货',
            timestamp: '2024-05-25T10:00:00',
            status: 'COMPLETED'
          },
          {
            title: '订单发货',
            description: '订单已发货，正在配送中',
            timestamp: '2024-05-26T09:00:00',
            status: 'IN_PROGRESS',
            actions: [
              {
                text: '更新物流信息',
                type: 'primary',
                action: 'updateLogistics'
              }
            ]
          },
          {
            title: '订单送达',
            description: '订单已送达客户',
            timestamp: '',
            status: 'PENDING',
            actions: []
          },
          {
            title: '订单完成',
            description: '订单已完成',
            timestamp: '',
            status: 'PENDING',
            actions: []
          }
        ]
        
        this.logisticsInfo = {
          company: '顺丰速运',
          trackingNo: 'SF1234567890123'
        }
        
        this.logisticsEvents = [
          {
            time: '2024-05-26T09:00:00',
            description: '【北京市】快件已从北京海淀集散中心发出'
          },
          {
            time: '2024-05-26T08:30:00',
            description: '【北京市】快件已到达北京海淀集散中心'
          },
          {
            time: '2024-05-26T07:00:00',
            description: '【北京市】快件已被快递员揽收'
          }
        ]
        
        this.operationLogs = [
          {
            operator: '系统',
            action: '发货通知',
            content: '订单SO20240522001已发货，物流单号：SF1234567890123',
            createTime: '2024-05-26T09:00:00'
          },
          {
            operator: '张三',
            action: '发货处理',
            content: '处理了订单SO20240522001的发货',
            createTime: '2024-05-26T08:00:00'
          },
          {
            operator: '李四',
            action: '付款确认',
            content: '确认收到订单SO20240522001的款项36800元',
            createTime: '2024-05-23T10:00:00'
          },
          {
            operator: '王五',
            action: '订单审批',
            content: '审批通过了订单SO20240522001',
            createTime: '2024-05-22T14:30:00'
          },
          {
            operator: '赵六',
            action: '创建订单',
            content: '创建了订单SO20240522001',
            createTime: '2024-05-22T10:00:00'
          }
        ]
      } catch (error) {
        this.$message.error('获取订单跟踪数据失败')
        console.error('获取订单跟踪数据失败:', error)
      }
    },
    
    // 处理步骤操作
    handleStepAction(action, step) {
      if (action.action === 'updateLogistics') {
        this.updateLogisticsInfo()
      }
    },
    
    // 更新物流信息
    updateLogisticsInfo() {
      this.$prompt('请输入最新物流单号', '更新物流信息', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: this.logisticsInfo.trackingNo
      }).then(({ value }) => {
        // 模拟API调用
        setTimeout(() => {
          this.logisticsInfo.trackingNo = value
          this.$message.success('物流信息已更新')
          // 添加操作日志
          this.operationLogs.unshift({
            operator: '当前用户',
            action: '更新物流',
            content: `更新了订单SO20240522001的物流单号为${value}`,
            createTime: new Date().toISOString()
          })
        }, 500)
      }).catch(() => {
        this.$message.info('已取消更新')
      })
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
        'SHIPPED': 'info',
        'DELIVERED': 'success',
        'COMPLETED': 'success',
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
        'SHIPPED': '已发货',
        'DELIVERED': '已送达',
        'COMPLETED': '已完成',
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
    
    // 获取支付状态标签类型
    getPaymentStatusType(status) {
      const statusMap = {
        'UNPAID': 'danger',
        'PARTIALLY_PAID': 'warning',
        'PAID': 'success',
        'REFUNDED': 'info'
      }
      return statusMap[status] || 'default'
    },
    
    // 获取支付状态文本
    getPaymentStatusText(status) {
      const statusMap = {
        'UNPAID': '未支付',
        'PARTIALLY_PAID': '部分支付',
        'PAID': '已支付',
        'REFUNDED': '已退款'
      }
      return statusMap[status] || status
    }
  }
}
</script>

<style scoped>
.order-tracking {
  padding: 20px;
}

.back-button {
  float: right;
}

.tracking-section {
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

.timeline-container {
  padding: 10px 0;
}

.timeline-content {
  padding: 5px 0;
}

.step-title {
  margin: 0 0 5px 0;
  font-size: 14px;
  font-weight: 500;
}

.step-description {
  margin: 0;
  color: #606266;
  font-size: 13px;
}

.step-actions {
  margin-top: 10px;
}

.step-actions .el-button {
  margin-right: 10px;
}

.logistics-info {
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
}

.logistics-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.logistics-company,
.logistics-number {
  display: flex;
  align-items: center;
}

.logistics-company .label,
.logistics-number .label {
  margin-right: 5px;
  color: #606266;
}

.logistics-event p {
  margin: 0;
  line-height: 1.5;
}

.remark-content {
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  min-height: 60px;
  white-space: pre-wrap;
}
</style>