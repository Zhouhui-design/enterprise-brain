<template>
  <div class="sales-order-form">
    <h2>{{ isEdit ? '编辑销售订单' : '新建销售订单' }}</h2>
    
    <el-form :model="formData" :rules="formRules" ref="formRef" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="订单号" prop="orderNumber">
            <el-input v-model="formData.orderNumber" placeholder="请输入订单号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户名称" prop="customerName">
            <el-input v-model="formData.customerName" placeholder="请输入客户名称" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="订单日期" prop="orderDate">
            <el-date-picker 
              v-model="formData.orderDate" 
              type="date" 
              placeholder="选择日期" 
              style="width: 100%" 
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="销售人员" prop="salesPerson">
            <el-input v-model="formData.salesPerson" placeholder="请输入销售人员" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-divider>订单明细</el-divider>
      
      <el-table :data="formData.items" border style="margin-bottom: 20px;">
        <el-table-column label="产品编码" width="150">
          <template #default="{ row }">
            <el-input v-model="row.productCode" placeholder="产品编码" />
          </template>
        </el-table-column>
        <el-table-column label="产品名称" width="200">
          <template #default="{ row }">
            <el-input v-model="row.productName" placeholder="产品名称" />
          </template>
        </el-table-column>
        <el-table-column label="数量" width="100">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="1" />
          </template>
        </el-table-column>
        <el-table-column label="单价" width="120">
          <template #default="{ row }">
            <el-input-number v-model="row.unitPrice" :min="0" :precision="2" />
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            ¥{{ (row.quantity * row.unitPrice).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="{ $index }">
            <el-button type="danger" link @click="removeItem($index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-button type="primary" @click="addItem">添加明细</el-button>
      
      <div style="margin-top: 20px; text-align: center;">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const formRef = ref(null)

const isEdit = ref(route.name === 'SalesOrderEdit')

const formData = reactive({
  orderNumber: isEdit.value ? 'SO20251201001' : '',
  customerName: '',
  orderDate: '',
  salesPerson: '',
  items: [
    {
      productCode: '',
      productName: '',
      quantity: 1,
      unitPrice: 0
    }
  ]
})

const formRules = {
  orderNumber: [{ required: true, message: '请输入订单号', trigger: 'blur' }],
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  orderDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }]
}

const addItem = () => {
  formData.items.push({
    productCode: '',
    productName: '',
    quantity: 1,
    unitPrice: 0
  })
}

const removeItem = (index) => {
  if (formData.items.length > 1) {
    formData.items.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一项')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success(`${isEdit.value ? '更新' : '创建'}订单成功`)
      router.push('/sales/orders/list')
    }
  })
}

const handleCancel = () => {
  router.go(-1)
}
</script>

<style scoped>
.sales-order-form {
  padding: 20px;
}
</style>