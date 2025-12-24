<template>
  <div class="production-order-schedule">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>生产订单排程</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAutoSchedule">
          <el-icon><Setting /></el-icon>
          自动排程
        </el-button>
        <el-button @click="handleManualAdjust">
          <el-icon><EditPen /></el-icon>
          手动调整
        </el-button>
        <el-button @click="handleSaveSchedule">
          <el-icon><Save /></el-icon>
          保存排程
        </el-button>
      </div>
    </div>

    <!-- 订单选择和搜索 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderCode" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// 组件逻辑将在此处添加
const searchForm = {
  orderCode: '',
  productName: ''
}
const handleBack = () => {
  // 返回逻辑
}
const handleAutoSchedule = () => {
  // 自动排程逻辑
}
const handleManualAdjust = () => {
  // 手动调整逻辑
}
const handleSaveSchedule = () => {
  // 保存排程逻辑
}
</script>

<style scoped>
.production-order-schedule {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}
</style>