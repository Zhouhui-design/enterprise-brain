<template>
  <div class="sales-order-view">
    <!-- 顶部标签页导航 -->
    <el-tabs v-model="activeTab" type="card" class="order-tabs">
      <el-tab-pane label="订单详情" name="orderDetail">
        <el-scrollbar height="600px">
          <div class="form-section-grid">
            <!-- 基本信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>基本信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="compact-form view-form">
                <el-form-item label="内部订单编号">
                  <el-input :model-value="orderData.internal_order_no || orderData.internalOrderNo" disabled />
                </el-form-item>
                <el-form-item label="客户订单编号">
                  <el-input :model-value="orderData.customer_order_no || orderData.customerOrderNo" disabled />
                </el-form-item>
                <el-form-item label="客户名称">
                  <el-input :model-value="orderData.customer_name || orderData.customerName" disabled />
                </el-form-item>
                <el-form-item label="销售员">
                  <el-input :model-value="orderData.salesperson" disabled />
                </el-form-item>
                <el-form-item label="报价单号">
                  <el-input :model-value="orderData.quotation_no || orderData.quotationNo" disabled />
                </el-form-item>
                <el-form-item label="订单类型">
                  <el-input :model-value="orderData.order_type || orderData.orderType" disabled />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 时间信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Calendar /></el-icon>
                  <span>时间信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="compact-form view-form">
                <el-form-item label="下单时间">
                  <el-input :model-value="formatDateTime(orderData.order_time || orderData.orderTime)" disabled />
                </el-form-item>
                <el-form-item label="承诺交期">
                  <el-input :model-value="formatDate(orderData.promised_delivery || orderData.promisedDelivery)" disabled />
                </el-form-item>
                <el-form-item label="客户交期">
                  <el-input :model-value="formatDate(orderData.customer_delivery || orderData.customerDelivery)" disabled />
                </el-form-item>
                <el-form-item label="预计完成日期">
                  <el-input :model-value="formatDate(orderData.estimated_completion_date || orderData.estimatedCompletionDate)" disabled />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 销售部门信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><OfficeBuilding /></el-icon>
                  <span>部门信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="compact-form view-form">
                <el-form-item label="销售部门">
                  <el-input :model-value="orderData.sales_department || orderData.salesDepartment" disabled />
                </el-form-item>
                <el-form-item label="送货方式">
                  <el-input :model-value="orderData.delivery_method || orderData.deliveryMethod" disabled />
                </el-form-item>
                <el-form-item label="销售退货单号">
                  <el-input :model-value="orderData.return_order_no || orderData.returnOrderNo" disabled />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 金额信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Money /></el-icon>
                  <span>金额信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="compact-form view-form">
                <el-form-item label="订单币种">
                  <el-input :model-value="orderData.order_currency || orderData.orderCurrency" disabled />
                </el-form-item>
                <el-form-item label="当前汇率">
                  <el-input :model-value="orderData.current_exchange_rate || orderData.currentExchangeRate" disabled />
                </el-form-item>
                <el-form-item label="税率(%)">
                  <el-input :model-value="orderData.tax_rate || orderData.taxRate" disabled />
                </el-form-item>
                <el-form-item label="手续费或其他费用">
                  <el-input :model-value="orderData.fees" disabled />
                </el-form-item>
                <el-form-item label="订单总金额">
                  <el-input :model-value="orderData.total_amount || orderData.totalAmount" disabled />
                </el-form-item>
                <el-form-item label="总金额(未税)">
                  <el-input :model-value="orderData.total_amount_excluding_tax || orderData.totalAmountExcludingTax" disabled />
                </el-form-item>
                <el-form-item label="总税额">
                  <el-input :model-value="orderData.total_tax || orderData.totalTax" disabled />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 附件和备注 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Files /></el-icon>
                  <span>附件和备注</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="view-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="订单附件">
                      <el-input :model-value="orderData.order_attachment || orderData.orderAttachment" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="包装附件">
                      <el-input :model-value="orderData.packaging_attachment || orderData.packagingAttachment" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="订单说明">
                  <el-input :model-value="orderData.order_notes || orderData.orderNotes" type="textarea" :rows="3" disabled />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 包装信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Box /></el-icon>
                  <span>包装信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="view-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="包装方式">
                      <el-input :model-value="orderData.packaging_method || orderData.packagingMethod" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="包装需求描述">
                      <el-input :model-value="orderData.packaging_requirements || orderData.packagingRequirements" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>

            <!-- 收货信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Location /></el-icon>
                  <span>收货信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="view-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="收货人">
                      <el-input :model-value="orderData.consignee" disabled />
                    </el-form-item>
                    <el-form-item label="收货地址">
                      <el-input :model-value="orderData.delivery_address || orderData.deliveryAddress" type="textarea" :rows="2" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="账单收件人">
                      <el-input :model-value="orderData.bill_recipient || orderData.billRecipient" disabled />
                    </el-form-item>
                    <el-form-item label="账单收件地址">
                      <el-input :model-value="orderData.bill_address || orderData.billAddress" type="textarea" :rows="2" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>

            <!-- 产品信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Goods /></el-icon>
                  <span>产品信息</span>
                </div>
              </template>
              <el-table :data="productList" border stripe max-height="300">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="product_code" label="产品编号" width="140" />
                <el-table-column prop="product_name" label="产品名称" width="150" />
                <el-table-column prop="product_spec" label="规格" width="100" />
                <el-table-column prop="product_color" label="颜色" width="80" />
                <el-table-column prop="product_unit" label="单位" width="70" />
                <el-table-column prop="order_quantity" label="订单数量" width="100" />
                <el-table-column prop="unit_price_excluding_tax" label="销售单价(未税)" width="130" />
                <el-table-column prop="tax_rate" label="税率(%)" width="90" />
              </el-table>
            </el-card>

            <!-- 回款信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Wallet /></el-icon>
                  <span>回款信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="view-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="收款方式">
                      <el-input :model-value="orderData.payment_method || orderData.paymentMethod" disabled />
                    </el-form-item>
                    <el-form-item label="预收占比(%)">
                      <el-input :model-value="orderData.advance_payment_ratio || orderData.advancePaymentRatio" disabled />
                    </el-form-item>
                    <el-form-item label="预收金额">
                      <el-input :model-value="orderData.advance_payment_amount || orderData.advancePaymentAmount" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="计划回款账户">
                      <el-input :model-value="orderData.planned_payment_account || orderData.plannedPaymentAccount" disabled />
                    </el-form-item>
                    <el-form-item label="应回款总额">
                      <el-input :model-value="orderData.total_receivable || orderData.totalReceivable" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
              
              <!-- 回款计划表格 -->
              <el-divider content-position="left">回款计划</el-divider>
              <el-table :data="paymentScheduleList" border stripe max-height="200">
                <el-table-column type="index" label="序号" width="60" />
                <el-table-column prop="payment_ratio" label="回款比例(%)" width="120" />
                <el-table-column prop="payment_amount" label="回款金额" width="120" />
                <el-table-column prop="payment_date" label="计划回款日期" width="150">
                  <template #default="{ row }">
                    {{ formatDate(row.payment_date) }}
                  </template>
                </el-table-column>
                <el-table-column prop="payment_account" label="回款账户" />
              </el-table>
            </el-card>

            <!-- 售后信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Service /></el-icon>
                  <span>售后信息</span>
                </div>
              </template>
              <el-form :model="orderData" label-width="140px" class="view-form">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="是否有售后">
                      <el-input :model-value="orderData.has_after_sales ? '是' : '否'" disabled />
                    </el-form-item>
                    <el-form-item label="售后订单号">
                      <el-input :model-value="orderData.after_sales_order_no || orderData.afterSalesOrderNo" disabled />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="售后详情">
                      <el-input :model-value="orderData.after_sales_details || orderData.afterSalesDetails" type="textarea" :rows="3" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </div>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>

    <div class="footer-buttons">
      <el-button type="primary" @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { 
  Document, Calendar, OfficeBuilding, Money, Files, Box, 
  Location, Goods, Wallet, Service 
} from '@element-plus/icons-vue'
import salesOrderApi from '@/api/salesOrder'

const props = defineProps({
  orderId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const activeTab = ref('orderDetail')
const orderData = ref({})
const productList = ref([])
const paymentScheduleList = ref([])

// 格式化日期时间
const formatDateTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期
const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleDateString('zh-CN')
}

// 加载订单详情
const loadOrderDetail = async () => {
  if (!props.orderId) return
  
  try {
    console.log('=== 加载订单详情 ===', props.orderId)
    const response = await salesOrderApi.getOrderDetail(props.orderId)
    
    if (response.success) {
      orderData.value = response.data
      
      // 加载产品明细
      const productsResponse = await salesOrderApi.getOrderProducts(props.orderId)
      if (productsResponse.success) {
        productList.value = productsResponse.data || []
      }
      
      // 加载回款计划
      const paymentsResponse = await salesOrderApi.getOrderPayments(props.orderId)
      if (paymentsResponse.success) {
        paymentScheduleList.value = paymentsResponse.data || []
      }
      
      console.log('✅ 订单详情加载成功')
    }
  } catch (error) {
    console.error('❌ 加载订单详情失败:', error)
  }
}

const handleClose = () => {
  emit('close')
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.sales-order-view {
  padding: 20px;
  background-color: #f5f7fa;
}

.order-tabs {
  background: white;
  border-radius: 8px;
}

.form-section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 16px;
}

.section-card {
  border-radius: 8px;
}

.section-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.compact-form .el-form-item {
  margin-bottom: 12px;
}

.view-form :deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #f5f7fa;
  cursor: default;
}

.view-form :deep(.el-textarea.is-disabled .el-textarea__inner) {
  background-color: #f5f7fa;
  cursor: default;
}

.footer-buttons {
  margin-top: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
