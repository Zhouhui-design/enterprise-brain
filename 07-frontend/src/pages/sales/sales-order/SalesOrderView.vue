<template>
  <div class="sales-order-view">
    <el-tabs type="border-card">
      <el-tab-pane label="基本信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单状态">
            <el-tag :type="getStatusType(orderData?.orderStatus)">{{ orderData?.orderStatus }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="内部订单编号">{{ orderData?.internalOrderNo }}</el-descriptions-item>
          <el-descriptions-item label="客户订单编号">{{ orderData?.customerOrderNo }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ orderData?.customerName }}</el-descriptions-item>
          <el-descriptions-item label="销售员">{{ orderData?.salesperson }}</el-descriptions-item>
          <el-descriptions-item label="报价单号">{{ orderData?.quotationNo }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ orderData?.orderTime }}</el-descriptions-item>
          <el-descriptions-item label="承诺交期">{{ orderData?.promisedDelivery }}</el-descriptions-item>
          <el-descriptions-item label="客户交期">{{ orderData?.customerDelivery }}</el-descriptions-item>
          <el-descriptions-item label="预计完成日期">{{ orderData?.estimatedCompletionDate }}</el-descriptions-item>
          <el-descriptions-item label="订单类型">{{ orderData?.orderType }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ orderData?.createTime }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="金额信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单币种">{{ orderData?.orderCurrency }}</el-descriptions-item>
          <el-descriptions-item label="当前汇率">{{ orderData?.currentExchangeRate }}</el-descriptions-item>
          <el-descriptions-item label="税率">{{ orderData?.taxRate }}</el-descriptions-item>
          <el-descriptions-item label="订单总金额（未税）">{{ formatCurrency(orderData?.totalAmountExcludingTax) }}</el-descriptions-item>
          <el-descriptions-item label="订单总金额（含税）">{{ formatCurrency(orderData?.totalAmountIncludingTax) }}</el-descriptions-item>
          <el-descriptions-item label="手续费或其他费用">{{ formatCurrency(orderData?.fees) }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="收货信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="送货方式">{{ orderData?.deliveryMethod }}</el-descriptions-item>
          <el-descriptions-item label="收货人">{{ orderData?.consignee }}</el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">{{ orderData?.deliveryAddress }}</el-descriptions-item>
          <el-descriptions-item label="账单收件人">{{ orderData?.billRecipient }}</el-descriptions-item>
          <el-descriptions-item label="账单收件地址" :span="2">{{ orderData?.billAddress }}</el-descriptions-item>
          <el-descriptions-item label="包装方式">{{ orderData?.packagingMethod }}</el-descriptions-item>
          <el-descriptions-item label="包装需求描述">{{ orderData?.packagingRequirements }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="回款信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="收款方式">{{ orderData?.paymentMethod }}</el-descriptions-item>
          <el-descriptions-item label="预收占比">{{ orderData?.advancePaymentRatio }}</el-descriptions-item>
          <el-descriptions-item label="回款计划">{{ orderData?.paymentPlan }}</el-descriptions-item>
          <el-descriptions-item label="应回款总额">{{ formatCurrency(orderData?.totalReceivable) }}</el-descriptions-item>
          <el-descriptions-item label="计划回款日期">{{ orderData?.plannedPaymentDate }}</el-descriptions-item>
          <el-descriptions-item label="计划回款金额">{{ formatCurrency(orderData?.plannedPaymentAmount) }}</el-descriptions-item>
          <el-descriptions-item label="已回款金额">{{ formatCurrency(orderData?.receivedAmount) }}</el-descriptions-item>
          <el-descriptions-item label="未回款金额">{{ formatCurrency(orderData?.unreceivedAmount) }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="产品信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="产品编号">{{ orderData?.productCode }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ orderData?.productName }}</el-descriptions-item>
          <el-descriptions-item label="产品规格">{{ orderData?.productSpec }}</el-descriptions-item>
          <el-descriptions-item label="产品颜色">{{ orderData?.productColor }}</el-descriptions-item>
          <el-descriptions-item label="产品材质">{{ orderData?.productMaterial }}</el-descriptions-item>
          <el-descriptions-item label="产品单位">{{ orderData?.productUnit }}</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ orderData?.orderQuantity }}</el-descriptions-item>
          <el-descriptions-item label="销售单价（未税）">{{ formatCurrency(orderData?.unitPriceExcludingTax) }}</el-descriptions-item>
          <el-descriptions-item label="含税单价">{{ formatCurrency(orderData?.unitPriceIncludingTax) }}</el-descriptions-item>
          <el-descriptions-item label="金额（未税）">{{ formatCurrency(orderData?.amountExcludingTax) }}</el-descriptions-item>
          <el-descriptions-item label="含税金额">{{ formatCurrency(orderData?.amountIncludingTax) }}</el-descriptions-item>
          <el-descriptions-item label="产品详述" :span="2">{{ orderData?.productDescription }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="发货信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="已申请发货数量">{{ orderData?.appliedShipmentQty }}</el-descriptions-item>
          <el-descriptions-item label="未申请发货数量">{{ orderData?.unappliedShipmentQty }}</el-descriptions-item>
          <el-descriptions-item label="已发货数量">{{ orderData?.shippedQty }}</el-descriptions-item>
          <el-descriptions-item label="未发货数量">{{ orderData?.unshippedQty }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="售后信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="是否有售后">
            <el-tag :type="orderData?.hasAfterSales ? 'warning' : 'success'">
              {{ orderData?.hasAfterSales ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="售后订单号">{{ orderData?.afterSalesOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="售后详情" :span="2">{{ orderData?.afterSalesDetails || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="其他信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="销售部门">{{ orderData?.salesDepartment }}</el-descriptions-item>
          <el-descriptions-item label="销售退货单号">{{ orderData?.returnOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="大类">{{ orderData?.majorCategory }}</el-descriptions-item>
          <el-descriptions-item label="中类">{{ orderData?.middleCategory }}</el-descriptions-item>
          <el-descriptions-item label="小类">{{ orderData?.minorCategory }}</el-descriptions-item>
          <el-descriptions-item label="产品来源">{{ orderData?.productSource }}</el-descriptions-item>
          <el-descriptions-item label="订单说明" :span="2">{{ orderData?.orderNotes || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>

    <div class="footer-buttons">
      <el-button type="primary" @click="handleClose">关闭</el-button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  orderData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getStatusType = (status) => {
  const typeMap = {
    '草稿': 'info',
    '待审核': 'warning',
    '已审核': 'success',
    '生产中': 'primary',
    '已发货': 'primary',
    '已完成': 'success',
    '已取消': 'danger',
    '手动终止': 'danger'
  }
  return typeMap[status] || 'info'
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.sales-order-view {
  padding: 20px;
}

.footer-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
