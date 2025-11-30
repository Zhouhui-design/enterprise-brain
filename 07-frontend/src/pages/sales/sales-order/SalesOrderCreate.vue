<template>
  <div class="sales-order-create">
    <!-- 顶部标签页导航 -->
    <el-tabs v-model="activeTab" type="card" class="order-tabs">
      <el-tab-pane label="订单详情" name="orderDetail">
        <el-scrollbar height="600px">
          <div class="form-section-grid">
            <!-- 基本信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>基本信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="内部订单编号">
                  <el-input v-model="formData.internalOrderNo" placeholder="自动生成" disabled />
                </el-form-item>
                <el-form-item label="客户订单编号">
                  <el-input v-model="formData.customerOrderNo" placeholder="请输入客户订单编号" />
                </el-form-item>
                <el-form-item label="客户名称">
                  <el-select 
                    v-model="formData.customerName" 
                    placeholder="请选择客户" 
                    filterable
                    style="width: 100%;"
                    @change="handleCustomerChange"
                  >
                    <el-option
                      v-for="customer in customerList"
                      :key="customer.id"
                      :label="customer.customerName"
                      :value="customer.customerName"
                    >
                      <span style="float: left">{{ customer.customerName }}</span>
                      <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                        {{ customer.customerCode }}
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="销售员">
                  <el-select v-model="formData.salesperson" placeholder="请选择销售员">
                    <el-option label="张三" value="张三" />
                    <el-option label="李四" value="李四" />
                  </el-select>
                </el-form-item>
                <el-form-item label="报价单号">
                  <el-input v-model="formData.quotationNo" placeholder="请输入报价单号" />
                </el-form-item>
                <el-form-item label="订单类型">
                  <el-select v-model="formData.orderType" placeholder="请选择订单类型">
                    <el-option label="标准订单" value="标准订单" />
                    <el-option label="定制订单" value="定制订单" />
                    <el-option label="样品订单" value="样品订单" />
                  </el-select>
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 时间信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Calendar /></el-icon>
                  <span>时间信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="下单时间">
                  <el-date-picker v-model="formData.orderTime" type="datetime" placeholder="选择下单时间" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="承诺交期">
                  <el-date-picker v-model="formData.promisedDelivery" type="date" placeholder="选择承诺交期" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="客户交期">
                  <el-date-picker v-model="formData.customerDelivery" type="date" placeholder="选择客户交期" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="预计完成日期">
                  <el-date-picker v-model="formData.estimatedCompletionDate" type="date" placeholder="选择预计完成日期" style="width: 100%;" />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 销售部门信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><OfficeBuilding /></el-icon>
                  <span>部门信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="销售部门">
                  <el-select v-model="formData.salesDepartment" placeholder="请选择销售部门">
                    <el-option label="华东区" value="华东区" />
                    <el-option label="华南区" value="华南区" />
                    <el-option label="华北区" value="华北区" />
                  </el-select>
                </el-form-item>
                <el-form-item label="送货方式">
                  <el-select v-model="formData.deliveryMethod" placeholder="请选择送货方式">
                    <el-option label="快递" value="快递" />
                    <el-option label="物流" value="物流" />
                    <el-option label="自提" value="自提" />
                  </el-select>
                </el-form-item>
                <el-form-item label="销售退货单号">
                  <el-input v-model="formData.returnOrderNo" placeholder="如有退货单号请输入" />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 金额信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Money /></el-icon>
                  <span>金额信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="订单币种">
                  <el-select v-model="formData.orderCurrency" placeholder="请选择币种">
                    <el-option label="CNY" value="CNY" />
                    <el-option label="USD" value="USD" />
                    <el-option label="EUR" value="EUR" />
                  </el-select>
                </el-form-item>
                <el-form-item label="当前汇率">
                  <el-input-number v-model="formData.currentExchangeRate" :precision="4" :step="0.0001" :min="0" style="width: 100%;" />
                </el-form-item>
                <el-form-item label="税率">
                  <el-select v-model="formData.taxRate" placeholder="请选择税率">
                    <el-option label="13%" value="13%" />
                    <el-option label="9%" value="9%" />
                    <el-option label="6%" value="6%" />
                  </el-select>
                </el-form-item>
                <el-form-item label="手续费/其他费用">
                  <el-input-number v-model="formData.fees" :precision="2" :min="0" style="width: 100%;" />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 附件说明 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Paperclip /></el-icon>
                  <span>附件与说明</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="订单附件">
                      <el-upload
                        class="upload-demo"
                        action="#"
                        :auto-upload="false"
                      >
                        <el-button size="small" type="primary">点击上传</el-button>
                      </el-upload>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="包装附件">
                      <el-upload
                        class="upload-demo"
                        action="#"
                        :auto-upload="false"
                      >
                        <el-button size="small" type="primary">点击上传</el-button>
                      </el-upload>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="订单说明">
                  <el-input v-model="formData.orderNotes" type="textarea" :rows="3" placeholder="请输入订单说明" />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 包装信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Box /></el-icon>
                  <span>包装信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="包装方式">
                      <el-select v-model="formData.packagingMethod" placeholder="请选择包装方式" style="width: 100%;">
                        <el-option label="纸箱" value="纸箱" />
                        <el-option label="木箱" value="木箱" />
                        <el-option label="托盘" value="托盘" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="包装需求描述">
                      <el-input v-model="formData.packagingRequirements" placeholder="请输入包装需求" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>

            <!-- 收货信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Location /></el-icon>
                  <span>收货信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="收货人">
                      <el-input v-model="formData.consignee" placeholder="请输入收货人" />
                    </el-form-item>
                    <el-form-item label="收货地址">
                      <el-input v-model="formData.deliveryAddress" type="textarea" :rows="2" placeholder="请输入收货地址" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="账单收件人">
                      <el-input v-model="formData.billRecipient" placeholder="请输入账单收件人" />
                    </el-form-item>
                    <el-form-item label="账单收件地址">
                      <el-input v-model="formData.billAddress" type="textarea" :rows="2" placeholder="请输入账单收件地址" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>

            <!-- 产品信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Goods /></el-icon>
                  <span>产品信息</span>
                  <el-button type="primary" size="small" style="margin-left: auto;" @click="addProduct">添加产品</el-button>
                </div>
              </template>
              <el-table :data="formData.products" border stripe>
                <el-table-column label="产品编号" width="140">
                  <template #default="{ row }">
                    <el-input v-model="row.productCode" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="产品名称" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.productName" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="产品规格" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.productSpec" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="产品颜色" width="100">
                  <template #default="{ row }">
                    <el-input v-model="row.productColor" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="产品单位" width="100">
                  <template #default="{ row }">
                    <el-input v-model="row.productUnit" size="small" />
                  </template>
                </el-table-column>
                <el-table-column label="订单数量" width="120">
                  <template #default="{ row }">
                    <el-input-number v-model="row.orderQuantity" :min="1" size="small" style="width: 100%;" />
                  </template>
                </el-table-column>
                <el-table-column label="单价（未税）" width="120">
                  <template #default="{ row }">
                    <el-input-number v-model="row.unitPriceExcludingTax" :precision="2" :min="0" size="small" style="width: 100%;" />
                  </template>
                </el-table-column>
                <el-table-column label="金额（未税）" width="120">
                  <template #default="{ row }">
                    {{ (row.orderQuantity * row.unitPriceExcludingTax).toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template #default="{ $index }">
                    <el-button type="danger" size="small" link @click="removeProduct($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="生产进度" name="production">
        <el-scrollbar height="600px">
          <el-empty description="暂无生产进度信息" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="采购进度" name="purchase">
        <el-scrollbar height="600px">
          <el-empty description="暂无采购进度信息" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="回款进度" name="payment">
        <el-scrollbar height="600px">
          <div class="form-section-grid">
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Money /></el-icon>
                  <span>回款信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="收款方式">
                      <el-select v-model="formData.paymentMethod" placeholder="请选择收款方式" style="width: 100%;">
                        <el-option label="银行转账" value="银行转账" />
                        <el-option label="现金" value="现金" />
                        <el-option label="支票" value="支票" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="预收占比">
                      <el-input v-model="formData.advancePaymentRatio" placeholder="如：30%" />
                    </el-form-item>
                    <el-form-item label="应回款总额">
                      <el-input-number v-model="formData.totalReceivable" :precision="2" :min="0" style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="回款计划">
                      <el-input v-model="formData.paymentPlan" placeholder="如：3期" />
                    </el-form-item>
                    <el-form-item label="计划回款日期">
                      <el-date-picker v-model="formData.plannedPaymentDate" type="date" style="width: 100%;" />
                    </el-form-item>
                    <el-form-item label="计划回款金额">
                      <el-input-number v-model="formData.plannedPaymentAmount" :precision="2" :min="0" style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="开票进度" name="invoice">
        <el-scrollbar height="600px">
          <el-empty description="暂无开票进度信息" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="发货进度" name="shipment">
        <el-scrollbar height="600px">
          <el-empty description="暂无发货进度信息" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="质量问题" name="quality">
        <el-scrollbar height="600px">
          <el-empty description="暂无质量问题" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="售后相关" name="afterSales">
        <el-scrollbar height="600px">
          <div class="form-section-grid">
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Service /></el-icon>
                  <span>售后信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-form-item label="是否有售后">
                  <el-radio-group v-model="formData.hasAfterSales">
                    <el-radio :label="true">是</el-radio>
                    <el-radio :label="false">否</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="售后订单号" v-if="formData.hasAfterSales">
                  <el-input v-model="formData.afterSalesOrderNo" placeholder="请输入售后订单号" />
                </el-form-item>
                <el-form-item label="售后详情" v-if="formData.hasAfterSales">
                  <el-input v-model="formData.afterSalesDetails" type="textarea" :rows="4" placeholder="请输入售后详情" />
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="成本费用" name="cost">
        <el-scrollbar height="600px">
          <el-empty description="暂无成本费用信息" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="客户信息" name="customer">
        <el-scrollbar height="600px">
          <el-empty description="暂无客户详细信息" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="合同信息" name="contract">
        <el-scrollbar height="600px">
          <el-empty description="暂无合同信息" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="其他公函" name="official">
        <el-scrollbar height="600px">
          <el-empty description="暂无其他公函" />
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>

    <!-- 底部按钮 -->
    <div class="footer-buttons">
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="handleSaveDraft">保存草稿</el-button>
      <el-button type="primary" @click="handleSubmit">提交订单</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Document, Calendar, OfficeBuilding, Money, Paperclip, 
  Box, Location, Goods, Service 
} from '@element-plus/icons-vue'

const emit = defineEmits(['success', 'cancel'])

const activeTab = ref('orderDetail')

// 客户列表数据
const customerList = ref([])
const selectedCustomer = ref(null)

// 表单数据
const formData = reactive({
  // 基本信息
  internalOrderNo: '',
  customerOrderNo: '',
  customerName: '',
  salesperson: '',
  quotationNo: '',
  orderType: '',
  
  // 时间信息
  orderTime: new Date(),
  promisedDelivery: '',
  customerDelivery: '',
  estimatedCompletionDate: '',
  
  // 部门信息
  salesDepartment: '',
  deliveryMethod: '',
  returnOrderNo: '',
  
  // 金额信息
  orderCurrency: 'CNY',
  currentExchangeRate: 1.0000,
  taxRate: '13%',
  fees: 0,
  
  // 附件说明
  orderAttachment: '',
  packagingAttachment: '',
  orderNotes: '',
  
  // 包装信息
  packagingMethod: '',
  packagingRequirements: '',
  
  // 收货信息
  consignee: '',
  deliveryAddress: '',
  billRecipient: '',
  billAddress: '',
  
  // 回款信息
  paymentMethod: '',
  advancePaymentRatio: '',
  paymentPlan: '',
  totalReceivable: 0,
  plannedPaymentDate: '',
  plannedPaymentAmount: 0,
  
  // 售后信息
  hasAfterSales: false,
  afterSalesOrderNo: '',
  afterSalesDetails: '',
  
  // 产品列表
  products: []
})

// 加载客户数据
onMounted(() => {
  const customerData = localStorage.getItem('customerListData')
  if (customerData) {
    try {
      customerList.value = JSON.parse(customerData)
    } catch (e) {
      console.error('解析客户数据失败:', e)
      customerList.value = []
    }
  }
})

// 客户选择变化事件
const handleCustomerChange = (customerName) => {
  // 查找选中的客户
  selectedCustomer.value = customerList.value.find(c => c.customerName === customerName)
  
  if (selectedCustomer.value) {
    // 自动填充客户相关信息
    formData.consignee = selectedCustomer.value.contactPerson || ''
    formData.deliveryAddress = selectedCustomer.value.address || ''
    formData.billRecipient = selectedCustomer.value.contactPerson || ''
    formData.billAddress = selectedCustomer.value.address || ''
  }
}

// 添加产品
const addProduct = () => {
  formData.products.push({
    productCode: '',
    productName: '',
    productSpec: '',
    productColor: '',
    productUnit: '个',
    orderQuantity: 1,
    unitPriceExcludingTax: 0,
    productTaxRate: '13%'
  })
}

// 删除产品
const removeProduct = (index) => {
  formData.products.splice(index, 1)
}

// 取消
const handleCancel = () => {
  emit('cancel')
}

// 保存草稿
const handleSaveDraft = () => {
  ElMessage.success('草稿保存成功')
}

// 提交订单
const handleSubmit = () => {
  // 验证
  if (!formData.customerName) {
    ElMessage.warning('请选择客户')
    return
  }
  if (!formData.salesperson) {
    ElMessage.warning('请选择销售员')
    return
  }
  if (formData.products.length === 0) {
    ElMessage.warning('请至少添加一个产品')
    return
  }
  
  // 提交
  ElMessage.success('订单提交成功')
  emit('success')
}
</script>

<style scoped>
.sales-order-create {
  width: 100%;
  height: 100%;
}

.order-tabs {
  height: 100%;
}

.order-tabs :deep(.el-tabs__content) {
  height: calc(100% - 100px);
}

.form-section-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px;
}

.section-card {
  height: fit-content;
}

.section-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.card-header .el-icon {
  font-size: 18px;
  color: #409EFF;
}

.compact-form .el-form-item {
  margin-bottom: 18px;
}

.footer-buttons {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 15px 20px;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  z-index: 100;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .form-section-grid {
    grid-template-columns: 1fr;
  }
  
  .section-card.full-width {
    grid-column: 1;
  }
}
</style>
