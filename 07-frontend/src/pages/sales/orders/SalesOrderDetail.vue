<template>
  <div class="sales-order-detail">
    <h2>销售订单详情</h2>
    <div v-if="orderData">
      <el-descriptions title="订单基本信息" :column="2" border>
        <el-descriptions-item label="订单号">{{ orderData.orderNumber }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ orderData.customerName }}</el-descriptions-item>
        <el-descriptions-item label="订单日期">{{ orderData.orderDate }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ orderData.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ orderData.status }}</el-descriptions-item>
        <el-descriptions-item label="销售人员">{{ orderData.salesPerson }}</el-descriptions-item>
      </el-descriptions>
      
      <el-table :data="orderData.items" style="margin-top: 20px;" border>
        <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
        <el-table-column prop="productName" label="产品名称" width="200"></el-table-column>
        <el-table-column prop="specification" label="规格" width="150"></el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" align="right"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="unitPrice" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.unitPrice }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else>
      <el-empty description="订单信息加载中..." />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const orderData = ref(null)

onMounted(() => {
  // 模拟加载订单数据
  orderData.value = {
    orderNumber: 'SO20251201001',
    customerName: 'ABC科技有限公司',
    orderDate: '2025-12-01',
    totalAmount: 125000,
    status: '已确认',
    salesPerson: '张三',
    items: [
      {
        productCode: 'P2025001',
        productName: '高精度传感器A1',
        specification: 'M6x20mm',
        quantity: 1000,
        unit: '个',
        unitPrice: 125,
        amount: 125000
      }
    ]
  }
})
</script>

<style scoped>
.sales-order-detail {
  padding: 20px;
}
</style>