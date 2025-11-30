<template>
  <div class="customer-view">
    <el-tabs type="border-card">
      <el-tab-pane label="基本信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="客户编号">{{ customerData?.customerCode }}</el-descriptions-item>
          <el-descriptions-item label="客户名称">{{ customerData?.customerName }}</el-descriptions-item>
          <el-descriptions-item label="客户类型">
            <el-tag :type="getCustomerTypeColor(customerData?.customerType)">
              {{ getCustomerTypeLabel(customerData?.customerType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="客户状态">
            <el-tag :type="getStatusColor(customerData?.status)">
              {{ getStatusLabel(customerData?.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="联系人">{{ customerData?.contactPerson }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ customerData?.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ customerData?.contactEmail || '-' }}</el-descriptions-item>
          <el-descriptions-item label="公司名称">{{ customerData?.company || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属行业">{{ customerData?.industry || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所属区域">{{ customerData?.region || '-' }}</el-descriptions-item>
          <el-descriptions-item label="详细地址" :span="2">{{ customerData?.address || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ customerData?.createTime }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="账款信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="信用额度">{{ formatCurrency(customerData?.creditLimit) }}</el-descriptions-item>
          <el-descriptions-item label="已用额度">{{ formatCurrency(customerData?.usedCredit) }}</el-descriptions-item>
          <el-descriptions-item label="可用额度">
            {{ formatCurrency((customerData?.creditLimit || 0) - (customerData?.usedCredit || 0)) }}
          </el-descriptions-item>
          <el-descriptions-item label="累计交易额">{{ formatCurrency(customerData?.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="订单数量">{{ customerData?.totalOrders || 0 }}</el-descriptions-item>
          <el-descriptions-item label="最后下单日期">{{ customerData?.lastOrderDate || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="开票信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="税号">{{ customerData?.taxNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开户银行">{{ customerData?.bankName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="银行账号">{{ customerData?.bankAccount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开票地址">{{ customerData?.invoiceAddress || '-' }}</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>

      <el-tab-pane label="业务信息">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="负责销售">{{ customerData?.salesPerson || '-' }}</el-descriptions-item>
          <el-descriptions-item label="付款方式">{{ customerData?.paymentTerm || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ customerData?.remark || '-' }}</el-descriptions-item>
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
  customerData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const formatCurrency = (value) => {
  if (!value) return '¥0.00'
  return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const getCustomerTypeLabel = (type) => {
  const typeMap = {
    'vip': 'VIP客户',
    'regular': '普通客户',
    'potential': '潜在客户'
  }
  return typeMap[type] || type || '-'
}

const getCustomerTypeColor = (type) => {
  const colorMap = {
    'vip': 'warning',
    'regular': 'success',
    'potential': 'info'
  }
  return colorMap[type] || 'info'
}

const getStatusLabel = (status) => {
  const statusMap = {
    'active': '合作中',
    'lost': '已流失',
    'frozen': '已冻结'
  }
  return statusMap[status] || status || '-'
}

const getStatusColor = (status) => {
  const colorMap = {
    'active': 'success',
    'lost': 'danger',
    'frozen': 'warning'
  }
  return colorMap[status] || 'info'
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.customer-view {
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
