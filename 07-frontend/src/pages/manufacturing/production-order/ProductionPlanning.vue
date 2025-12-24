<template>
  <div class="production-planning">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>生产计划管理</h1>
        <el-breadcrumb separator="/" style="margin-left: 20px;">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产计划</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleCreatePlan">
          <el-icon><Plus /></el-icon>
          新建计划
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出计划
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" label-width="100px">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planCode" placeholder="请输入计划编号" />
        </el-form-item>
        <el-form-item label="计划名称">
          <el-input v-model="searchForm.planName" placeholder="请输入计划名称" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
// 组件逻辑将在此处添加
const searchForm = {
  planCode: '',
  planName: ''
}
const handleBack = () => {
  // 返回逻辑
}
const handleCreatePlan = () => {
  // 新建计划逻辑
}
const handleRefresh = () => {
  // 刷新逻辑
}
const handleExport = () => {
  // 导出计划逻辑
}
</script>

<style scoped>
.production-planning {
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
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}
</style>