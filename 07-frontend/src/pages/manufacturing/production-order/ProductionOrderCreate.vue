<template>
  <div class="production-order-create">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>{{ isEdit ? '编辑生产订单' : '新建生产订单' }}</h1>
      </div>
    </div>

    <!-- 表单卡片 -->
    <el-card class="form-card">
      <el-form
        ref="orderFormRef"
        :model="orderForm"
        :rules="orderRules"
        label-width="120px"
        class="create-form"
      >
        <el-divider content-position="left">基本信息</el-divider>
        
        <el-form-item label="订单编号" prop="orderCode">
          <el-input v-model="orderForm.orderCode" :disabled="isEdit" placeholder="系统自动生成" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// 组件逻辑将在此处添加
const isEdit = false
const orderForm = {
  orderCode: ''
}
const orderRules = {
  orderCode: [{ required: true, message: '请输入订单编号', trigger: 'blur' }]
}
const orderFormRef = null
const handleBack = () => {
  // 返回逻辑
}
</script>

<style scoped>
.production-order-create {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.form-card {
  margin-bottom: 20px;
}

.create-form {
  max-width: 800px;
}
</style>