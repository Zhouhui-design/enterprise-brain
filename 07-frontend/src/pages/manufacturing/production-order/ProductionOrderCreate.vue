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

        <el-form-item label="产品信息" prop="productId">
          <el-select
            v-model="orderForm.productId"
            placeholder="请选择产品"
            filterable
            :loading="productLoading"
            @change="handleProductChange"
          >
            <el-option
              v-for="product in productList"
              :key="product.id"
              :label="`${product.name} (${product.code})`"
              :value="product.id"
            >
              <div class="product-option">
                <span>{{ product.name }}</span>
                <small>{{ product.code }}</small>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="订单数量" prop="quantity">
          <el-input-number
            v-model="orderForm.quantity"
            :min="1"
            :precision="0"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="orderForm.unit" placeholder="请输入计量单位" />
        </el-form-item>

        <el-form-item label="订单优先级" prop="priority">
          <el-radio-group v-model="orderForm.priority">
            <el-radio :label="1">低</el-radio>
            <el-radio :label="2">中</el-radio>
            <el-radio :label="3">高</el-radio>
            <el-radio :label="4">紧急</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider content-position="left">时间信息</el-divider>

        <el-form-item label="计划开始日期" prop="plannedStartDate">
          <el-date-picker
            v-model="orderForm.plannedStartDate"
            type="datetime"
            placeholder="请选择计划开始日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="计划完成日期" prop="plannedEndDate">
          <el-date-picker
            v-model="orderForm.plannedEndDate"
            type="datetime"
            placeholder="请选择计划完成日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="客户需求日期" prop="customerDemandDate">
          <el-date-picker
            v-model="orderForm.customerDemandDate"
            type="date"
            placeholder="请选择客户需求日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-divider content-position="left">BOM信息</el-divider>

        <el-form-item label="选择BOM" prop="bomId">
          <el-select
            v-model="orderForm.bomId"
            placeholder="请选择BOM版本"
            @change="handleBomChange"
          >
            <el-option
              v-for="bom in bomList"
              :key="bom.id"
              :label="`${bom.version} (${bom.createTime})`"
              :value="bom.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="openBomSelector">选择BOM组件</el-button>
        </el-form-item>

        <!-- BOM明细预览 -->
        <el-form-item v-if="selectedBomItems.length > 0">
          <div class="bom-preview">
            <h3>BOM明细预览</h3>
            <el-table :data="selectedBomItems" stripe size="small">
              <el-table-column prop="materialCode" label="物料编码" width="150" />
              <el-table-column prop="materialName" label="物料名称" width="200" />
              <el-table-column prop="spec" label="规格型号" width="150" />
              <el-table-column prop="quantity" label="用量" width="100" align="right" />
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="type" label="类型" width="100" />
            </el-table>
          </div>
        </el-form-item>

        <el-divider content-position="left">备注信息</el-divider>

        <el-form-item label="订单备注" prop="remark">
          <el-input
            v-model="orderForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请输入订单备注信息"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleBack">取消</el-button>
        </el-form-item>

