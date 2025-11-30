<template>
  <div class="sales-order-approval">
    <h2>销售订单审批</h2>
    
    <el-form :model="searchForm" :inline="true" class="search-form">
      <el-form-item label="订单号">
        <el-input v-model="searchForm.orderNumber" placeholder="请输入订单号" clearable />
      </el-form-item>
      <el-form-item label="客户名称">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
    
    <el-table :data="tableData" border stripe>
      <el-table-column prop="orderNumber" label="订单号" width="150" fixed="left" />
      <el-table-column prop="customerName" label="客户名称" width="200" />
      <el-table-column prop="orderDate" label="订单日期" width="120" />
      <el-table-column prop="totalAmount" label="总金额" width="120" align="right">
        <template #default="{ row }">¥{{ row.totalAmount }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.status === 'pending'" type="warning">待审批</el-tag>
          <el-tag v-else-if="row.status === 'approved'" type="success">已批准</el-tag>
          <el-tag v-else-if="row.status === 'rejected'" type="danger">已拒绝</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="submitter" label="提交人" width="120" />
      <el-table-column prop="submitDate" label="提交日期" width="120" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="handleApprove(row)">审批</el-button>
          <el-button size="small" @click="handleView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <el-dialog v-model="approvalDialogVisible" title="订单审批" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ currentOrder.orderNumber }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentOrder.customerName }}</el-descriptions-item>
        <el-descriptions-item label="订单日期">{{ currentOrder.orderDate }}</el-descriptions-item>
        <el-descriptions-item label="总金额">¥{{ currentOrder.totalAmount }}</el-descriptions-item>
        <el-descriptions-item label="提交人">{{ currentOrder.submitter }}</el-descriptions-item>
        <el-descriptions-item label="提交日期">{{ currentOrder.submitDate }}</el-descriptions-item>
      </el-descriptions>
      
      <el-table :data="currentOrder.items" style="margin-top: 20px;" border>
        <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
        <el-table-column prop="productName" label="产品名称" width="200"></el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" align="right"></el-table-column>
        <el-table-column prop="unitPrice" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.unitPrice }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
      </el-table>
      
      <el-form :model="approvalForm" style="margin-top: 20px;">
        <el-form-item label="审批意见">
          <el-input 
            v-model="approvalForm.comment" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入审批意见" 
          />
        </el-form-item>
        <el-form-item label="审批结果">
          <el-radio-group v-model="approvalForm.result">
            <el-radio label="approved">批准</el-radio>
            <el-radio label="rejected">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApproval">提交审批</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'

const searchForm = reactive({
  orderNumber: '',
  customerName: ''
})

const approvalDialogVisible = ref(false)
const currentOrder = ref({})

const approvalForm = reactive({
  comment: '',
  result: 'approved'
})

// 模拟数据
const allOrders = ref([
  {
    id: 1,
    orderNumber: 'SO20251201001',
    customerName: 'ABC科技有限公司',
    orderDate: '2025-12-01',
    totalAmount: 125000,
    status: 'pending',
    submitter: '张三',
    submitDate: '2025-12-01',
    items: [
      {
        productCode: 'P2025001',
        productName: '高精度传感器A1',
        quantity: 1000,
        unitPrice: 125,
        amount: 125000
      }
    ]
  },
  {
    id: 2,
    orderNumber: 'SO20251201002',
    customerName: 'XYZ电子有限公司',
    orderDate: '2025-12-01',
    totalAmount: 85000,
    status: 'pending',
    submitter: '李四',
    submitDate: '2025-12-01',
    items: [
      {
        productCode: 'P2025002',
        productName: '工业控制器B2',
        quantity: 500,
        unitPrice: 170,
        amount: 85000
      }
    ]
  }
])

const tableData = computed(() => {
  let data = allOrders.value
  if (searchForm.orderNumber) {
    data = data.filter(order => 
      order.orderNumber.includes(searchForm.orderNumber)
    )
  }
  if (searchForm.customerName) {
    data = data.filter(order => 
      order.customerName.includes(searchForm.customerName)
    )
  }
  return data
})

const handleSearch = () => {
  // 搜索逻辑已在computed中实现
}

const handleReset = () => {
  searchForm.orderNumber = ''
  searchForm.customerName = ''
}

const handleApprove = (row) => {
  currentOrder.value = { ...row }
  approvalForm.comment = ''
  approvalForm.result = 'approved'
  approvalDialogVisible.value = true
}

const handleView = (row) => {
  currentOrder.value = { ...row }
  approvalDialogVisible.value = true
}

const submitApproval = () => {
  const index = allOrders.value.findIndex(order => order.id === currentOrder.value.id)
  if (index !== -1) {
    allOrders.value[index].status = approvalForm.result
    ElMessage.success(`订单${approvalForm.result === 'approved' ? '批准' : '拒绝'}成功`)
    approvalDialogVisible.value = false
  }
}
</script>

<style scoped>
.sales-order-approval {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>