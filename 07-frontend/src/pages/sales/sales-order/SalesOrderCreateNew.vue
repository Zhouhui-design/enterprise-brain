<template>
  <div class="sales-order-create-new">
    <h1>新增销售订单</h1>
    <!-- 使用已有的销售订单创建组件 -->
    <SalesOrderCreate @success="handleSuccess" @cancel="handleCancel" />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import SalesOrderCreate from './SalesOrderCreate.vue'

const router = useRouter()

// 成功处理
const handleSuccess = () => {
  router.push('/sales/orders/list')
}

// 取消处理
const handleCancel = () => {
  router.push('/sales/orders/list')
}
</script>

<style scoped>
.sales-order-create-new {
  padding: 20px;
}
</style>