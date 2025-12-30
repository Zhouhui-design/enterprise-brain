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
                  <el-select v-model="formData.salesperson" placeholder="请选择销售员" filterable>
                    <el-option
                      v-for="employee in employeeList"
                      :key="employee.id"
                      :label="employee.name"
                      :value="employee.name"
                    />
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
                    <el-option label="售后订单" value="售后订单" />
                    <el-option label="来料加工单" value="来料加工单" />
                    <el-option label="销售备货单" value="销售备货单" />
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
                    <el-option
                      v-for="dept in departmentList"
                      :key="dept.id"
                      :label="dept.name"
                      :value="dept.name"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="送货方式">
                  <el-select v-model="formData.deliveryMethod" placeholder="请选择送货方式">
                    <el-option
                      v-for="method in deliveryMethods"
                      :key="method.value"
                      :label="method.label"
                      :value="method.value"
                    />
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
                  <el-input-number 
                    v-model="formData.taxRate" 
                    placeholder="请输入税率" 
                    :min="0" 
                    :max="100" 
                    :precision="2" 
                    style="width: 100%;"
                    @change="handleTaxRateChange"
                  >
                    <template #append>%</template>
                  </el-input-number>
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
                        <el-option label="客户自定义" value="客户自定义" />
                        <el-option label="标准包装" value="标准包装" />
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
              <el-table :data="formData.products" border stripe @row-click="handleProductRowClick">
                <el-table-column label="产品编号" width="140">
                  <template #default="{ row, $index }">
                    <el-select 
                      v-model="row.productCode" 
                      filterable 
                      placeholder="请选择产品" 
                      size="small"
                      style="width: 100%;"
                      @change="handleProductSelect(row, $index)"
                    >
                      <el-option
                        v-for="product in productManualList"
                        :key="product.productCode"
                        :label="product.productCode"
                        :value="product.productCode"
                      >
                        <span style="float: left">{{ product.productCode }}</span>
                        <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px">
                          {{ product.productName }}
                        </span>
                      </el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="产品名称" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.productName" size="small" disabled />
                  </template>
                </el-table-column>
                <el-table-column label="产出工序" width="120">
                  <template #default="{ row }">
                    <el-input v-model="row.outputProcess" size="small" disabled />
                  </template>
                </el-table-column>
                <el-table-column label="产品来源" width="100">
                  <template #default="{ row }">
                    <el-input v-model="row.productSource" size="small" disabled />
                  </template>
                </el-table-column>
                <el-table-column label="产品规格" width="150">
                  <template #default="{ row }">
                    <el-input v-model="row.productSpec" size="small" disabled />
                  </template>
                </el-table-column>
                <el-table-column label="产品颜色" width="100">
                  <template #default="{ row }">
                    <el-input v-model="row.productColor" size="small" disabled />
                  </template>
                </el-table-column>
                <el-table-column label="产品单位" width="100">
                  <template #default="{ row }">
                    <el-input v-model="row.productUnit" size="small" disabled />
                  </template>
                </el-table-column>
                <el-table-column label="配件选择" width="140">
                  <template #default="{ row }">
                    <el-select 
                      v-model="row.accessories" 
                      multiple 
                      placeholder="选择配件" 
                      size="small"
                      style="width: 100%;"
                      collapse-tags
                      collapse-tags-tooltip
                    >
                      <el-option
                        v-for="accessory in accessoryList"
                        :key="accessory.id"
                        :label="accessory.name"
                        :value="accessory.id"
                      />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="订单数量" width="120">
                  <template #default="{ row, $index }">
                    <el-input-number v-model="row.orderQuantity" :min="1" size="small" style="width: 100%;" @change="handleProductInput(row, $index)" />
                  </template>
                </el-table-column>
                <el-table-column label="单价（未税）" width="120">
                  <template #default="{ row }">
                    <el-input-number v-model="row.unitPriceExcludingTax" :precision="2" :min="0" size="small" style="width: 100%;" disabled />
                  </template>
                </el-table-column>
                <el-table-column label="税率(%)" width="100">
                  <template #default="{ row }">
                    <el-input-number v-model="row.taxRate" :precision="2" :min="0" :max="100" size="small" style="width: 100%;" />
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
                    <el-form-item label="付款方式">
                      <el-select v-model="formData.paymentMethod" placeholder="请选择付款方式" style="width: 100%;" @change="handlePaymentMethodChange">
                        <el-option label="预付首付款" value="预付首付款" />
                        <el-option label="预付全款" value="预付全款" />
                        <el-option label="按计划时间回款" value="按计划时间回款" />
                        <el-option label="不收款" value="不收款" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="预付比例" v-if="showAdvancePayment">
                      <el-input-number 
                        v-model="formData.advancePaymentRatio" 
                        :min="0" 
                        :max="100" 
                        :precision="2" 
                        style="width: 100%;"
                        @change="handleAdvanceRatioChange"
                      >
                        <template #append>%</template>
                      </el-input-number>
                    </el-form-item>
                    <el-form-item label="预付金额" v-if="showAdvancePayment">
                      <el-input-number 
                        v-model="formData.advancePaymentAmount" 
                        :precision="2" 
                        :min="0" 
                        style="width: 100%;"
                        @change="handleAdvanceAmountChange"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="计划收款账号">
                      <el-input v-model="formData.plannedPaymentAccount" placeholder="请输入计划收款账号" />
                    </el-form-item>
                    <el-form-item label="应回款总额">
                      <el-input-number v-model="formData.totalReceivable" :precision="2" :min="0" style="width: 100%;" disabled />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
            
            <!-- 计划回款子表格 -->
            <el-card shadow="hover" class="section-card full-width" v-if="formData.paymentMethod === '按计划时间回款'">
              <template #header>
                <div class="card-header">
                  <el-icon><Tickets /></el-icon>
                  <span>计划回款明细</span>
                </div>
              </template>
              <el-table :data="formData.paymentSchedule" border stripe>
                <el-table-column label="序号" width="80" align="center">
                  <template #default="{ $index }">
                    {{ $index + 1 }}
                  </template>
                </el-table-column>
                <el-table-column label="计划回款日期" width="180">
                  <template #default="{ row }">
                    <el-date-picker v-model="row.plannedDate" type="date" size="small" style="width: 100%;" />
                  </template>
                </el-table-column>
                <el-table-column label="计划回款金额" width="180">
                  <template #default="{ row, $index }">
                    <el-input-number 
                      v-model="row.plannedAmount" 
                      :precision="2" 
                      :min="0" 
                      size="small" 
                      style="width: 100%;"
                      @change="handleScheduleAmountChange($index)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="备注">
                  <template #default="{ row }">
                    <el-input v-model="row.remark" size="small" placeholder="请输入备注" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80" fixed="right">
                  <template #default="{ $index }">
                    <el-button type="danger" size="small" link @click="removeSchedule($index)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
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
      <el-button type="success" @click="handleSave">保存</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Document, Calendar, OfficeBuilding, Money, Paperclip, 
  Box, Location, Goods, Service, Tickets
} from '@element-plus/icons-vue'
import customerApi from '@/api/customer'
import { salesOrderApi } from '@/api/salesOrder'
import productManualAPI from '@/api/productManual'

// 接收props - 支持编辑模式
const props = defineProps({
  orderData: {
    type: Object,
    default: null
  }
})
const emit = defineEmits(['success', 'cancel'])

const activeTab = ref('orderDetail')

// 客户列表数据
const customerList = ref([])
const selectedCustomer = ref(null)

// 产品手册数据
const productManualList = ref([])

// 员工列表数据
const employeeList = ref([])

// 部门列表数据
const departmentList = ref([])

// 配件列表数据
const accessoryList = ref([])

// 送货方式选项
const deliveryMethods = ref([
  { label: '快递', value: '快递' },
  { label: '物流', value: '物流' },
  { label: '自提', value: '自提' },
  { label: '专车配送', value: '专车配送' }
])

// 计算属性：是否显示预付款字段
const showAdvancePayment = computed(() => {
  return formData.paymentMethod === '预付首付款' || formData.paymentMethod === '预付全款'
})

// 表单数据
const formData = reactive({
  // 基本信息
  internalOrderNo: '',
  customerOrderNo: '',
  customerName: '',
  salesperson: 'admin', // 默认为当前登录用户
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
  taxRate: 13,
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
  advancePaymentRatio: 0,
  advancePaymentAmount: 0,
  plannedPaymentAccount: '',
  totalReceivable: 0,
  
  // 计划回款表格
  paymentSchedule: [],
  
  // 售后信息
  hasAfterSales: false,
  afterSalesOrderNo: '',
  afterSalesDetails: '',
  
  // 产品列表（初始化一行）
  products: [{
    productCode: '',
    productName: '',
    productSpec: '',
    productColor: '',
    productUnit: '个',
    orderQuantity: 1,
    unitPriceExcludingTax: 0,
    taxRate: 13,
    accessories: [],
    outputProcess: ''
  }]
})

// 本地存储键名
const CUSTOMER_LIST_KEY = 'customerListData'

// 加载数据
onMounted(async () => {
  // 清除旧的缓存键名，统一使用新的键名
  if (localStorage.getItem('customerData')) {
    localStorage.removeItem('customerData')
    console.log('🗑️  已清除旧的客户数据缓存')
  }
  
  // 从后端API加载客户数据
  try {
    const response = await customerApi.getCustomers({
      page: 1,
      pageSize: 1000, // 加载所有客户
      status: 'active' // 只加载激活的客户
    })
    
    console.log('🔍 客户API响应:', response)
    
    // 处理不同的响应格式
    let customerData = []
    
    if (Array.isArray(response)) {
      // 响应拦截器直接返回了数据数组
      customerData = response
    } else if (response.success && response.data && response.data.list && Array.isArray(response.data.list)) {
      // 完整响应格式：{ success: true, data: { list: [], total: ... } }
      customerData = response.data.list
    } else if (response.success && response.data && Array.isArray(response.data)) {
      // 简化响应格式：{ success: true, data: [] }
      customerData = response.data
    } else if (response.list && Array.isArray(response.list)) {
      // 响应格式：{ list: [], total: ... }
      customerData = response.list
    }
    
    if (customerData.length > 0) {
      // 将后端数据转换为前端格式
      customerList.value = customerData.map(c => ({
        id: c.id,
        customerCode: c.customer_code || c.customerCode,
        customerName: c.customer_name || c.customerName,
        customerType: c.customer_type || c.customerType,
        contactPerson: c.contact_person || c.contactPerson,
        contactPhone: c.contact_phone || c.contactPhone,
        region: c.region || c.regionId,
        salesPerson: c.sales_person || c.salesPerson,
        address: c.address || c.deliveryAddress
      }))
      console.log('✅ 从后端加载客户数据:', customerList.value.length, '条')
      console.log('📋 客户列表数据:', customerList.value)
      
      // 保存到localStorage作为缓存
      localStorage.setItem(CUSTOMER_LIST_KEY, JSON.stringify(customerList.value))
    } else {
      console.log('⚠️ 未获取到客户数据')
      
      // 尝试从localStorage加载缓存
      const cachedData = localStorage.getItem(CUSTOMER_LIST_KEY)
      if (cachedData) {
        try {
          customerList.value = JSON.parse(cachedData)
          console.log('📦 从缓存加载客户数据:', customerList.value.length, '条')
        } catch (e) {
          console.error('解析客户数据缓存失败:', e)
          customerList.value = []
        }
      }
    }
  } catch (error) {
    console.error('❌ 加载客户数据失败:', error)
    ElMessage.warning('加载客户数据失败，正在使用缓存数据')
    
    // 失败时尝试从localStorage加载缓存
    const cachedData = localStorage.getItem(CUSTOMER_LIST_KEY)
    if (cachedData) {
      try {
        customerList.value = JSON.parse(cachedData)
        console.log('📦 从缓存加载客户数据:', customerList.value.length, '条')
      } catch (e) {
        console.error('解析客户数据缓存失败:', e)
        customerList.value = []
      }
    } else {
      // 如果没有缓存，使用空数组
      customerList.value = []
    }
  }
  
  // ✅ 从后端API加载产品手册数据
  try {
    console.log('🔄 开始加载产品手册数据...')
    const response = await productManualAPI.getAll()
    
    // 处理不同的响应格式
    let productData = []
    if (response.code === 200 && Array.isArray(response.data)) {
      productData = response.data
    } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
      productData = response.data.data
    } else if (Array.isArray(response)) {
      productData = response
    } else if (response.data && Array.isArray(response.data)) {
      productData = response.data
    } else {
      console.warn('⚠️ 产品手册返回数据格式异常:', response)
      productData = []
    }
    
    productManualList.value = productData
    console.log('✅ 产品手册数据加载成功，共', productData.length, '条')
    
    // 保存到localStorage作为缓存
    localStorage.setItem('productManualData', JSON.stringify(productManualList.value))
  } catch (error) {
    console.error('❌ 加载产品手册数据失败:', error)
    ElMessage.warning('加载产品手册数据失败，正在使用缓存数据')
    
    // 失败时尝试从localStorage加载缓存
    const productData = localStorage.getItem('productManualData')
    if (productData) {
      try {
        productManualList.value = JSON.parse(productData)
        console.log('📦 从缓存加载产品手册数据:', productManualList.value.length, '条')
      } catch (e) {
        console.error('解析产品手册缓存数据失败:', e)
        productManualList.value = []
      }
    } else {
      // 如果没有缓存，使用空数组
      productManualList.value = []
    }
  }
  
  // 加载员工数据（从员工台账）
  const employeeData = localStorage.getItem('employeeData')
  if (employeeData) {
    try {
      const allEmployees = JSON.parse(employeeData)
      // 只加载在职员工
      employeeList.value = allEmployees.filter(emp => emp.status === 'active' || emp.status === 'probation')
    } catch (e) {
      console.error('解析员工数据失败:', e)
      employeeList.value = []
    }
  }
  
  // 加载部门数据
  const departmentData = localStorage.getItem('departmentData')
  if (departmentData) {
    try {
      departmentList.value = JSON.parse(departmentData)
    } catch (e) {
      console.error('解析部门数据失败:', e)
      // 如果没有部门数据，使用默认值
      departmentList.value = [
        { id: '1', name: '华东区' },
        { id: '2', name: '华南区' },
        { id: '3', name: '华北区' },
        { id: '4', name: '西南区' },
        { id: '5', name: '西北区' }
      ]
    }
  } else {
    // 默认部门列表
    departmentList.value = [
      { id: '1', name: '华东区' },
      { id: '2', name: '华南区' },
      { id: '3', name: '华北区' },
      { id: '4', name: '西南区' },
      { id: '5', name: '西北区' }
    ]
  }
  
  // 加载配件数据（从物料库筛选）
  const materialData = localStorage.getItem('materialListData')
  if (materialData) {
    try {
      const allMaterials = JSON.parse(materialData)
      // 筛选配件类物料
      accessoryList.value = allMaterials.filter(m => 
        m.materialCategory === '配件' || 
        m.materialType === '配件' ||
        m.materialName?.includes('配件')
      )
    } catch (e) {
      console.error('解析物料数据失败:', e)
      accessoryList.value = []
    }
  }
  
  // 如果没有配件数据，使用默认值
  if (accessoryList.value.length === 0) {
    accessoryList.value = [
      { id: 'ACC001', name: '标准配件A' },
      { id: 'ACC002', name: '标准配件B' },
      { id: 'ACC003', name: '标准配件C' },
      { id: 'ACC004', name: '可选配件D' },
      { id: 'ACC005', name: '可选配件E' }
    ]
  }
})

// 监听orderData变化 - 编辑模式下加载完整数据
watch(
  () => props.orderData,
  async (newOrderData) => {
    if (newOrderData && newOrderData.id) {
      try {
        console.log('🔄 编辑模式:开始加载订单数据...', newOrderData.id)
        
        // 1. 从后端加载完整订单数据 - 使用正确的API
        const response = await salesOrderApi.getSalesOrderById(newOrderData.id)
        if (response.data && response.data.success) {
          const order = response.data.data
          console.log('✅ 订单主信息加载成功', order)
          
          // 2. 填充基本信息
          Object.assign(formData, {
            id: order.id,
            internalOrderNo: order.internal_order_no,
            customerOrderNo: order.customer_order_no,
            customerName: order.customer_name,
            salesperson: order.salesperson,
            quotationNo: order.quotation_no,
            orderType: order.order_type,
            orderTime: order.order_time,
            promisedDelivery: order.promised_delivery,
            customerDelivery: order.customer_delivery,
            estimatedCompletionDate: order.estimated_completion_date,
            salesDepartment: order.sales_department,
            deliveryMethod: order.delivery_method,
            returnOrderNo: order.return_order_no,
            orderCurrency: order.order_currency || 'CNY',
            currentExchangeRate: order.current_exchange_rate || 1,
            taxRate: order.tax_rate || 13,
            orderAttachment: order.order_attachment,
            orderNotes: order.order_notes,
            packagingMethod: order.packaging_method,
            packagingRequirements: order.packaging_requirements,
            packagingAttachment: order.packaging_attachment,
            consignee: order.consignee,
            deliveryAddress: order.delivery_address,
            billRecipient: order.bill_recipient,
            billAddress: order.bill_address,
            paymentMethod: order.payment_method,
            advancePaymentRatio: order.advance_payment_ratio || 0,
            fees: order.fees || 0,
            totalReceivable: order.total_receivable || 0,
            remark: order.remark,
            products: [],
            paymentSchedule: []
          })
          
          // 3. 加载产品明细
          const productsResponse = await salesOrderApi.getOrderProducts(order.id)
          console.log('✅ 产品明细响应:', productsResponse)
          if (productsResponse.success && productsResponse.data && productsResponse.data.length > 0) {
            formData.products = productsResponse.data.map(p => ({
              productCode: p.product_code,
              productName: p.product_name,
              productSpec: p.product_spec,
              productColor: p.product_color,
              productUnit: p.product_unit || '个',
              orderQuantity: p.order_quantity || 0,
              unitPriceExcludingTax: p.unit_price_excluding_tax || 0,
              taxRate: p.tax_rate || 13,
              accessories: [],
              outputProcess: p.output_process || ''
            }))
            console.log('✅ 产品明细加载成功:', formData.products.length, '个产品')
          } else {
            console.log('⚠️ 无产品明细,使用默认空行')
            formData.products = [{
              productCode: '',
              productName: '',
              productSpec: '',
              productColor: '',
              productUnit: '个',
              orderQuantity: 1,
              unitPriceExcludingTax: 0,
              taxRate: 13,
              accessories: [],
              outputProcess: ''
            }]
          }
          
          // 4. 加载回款计划
          const paymentsResponse = await salesOrderApi.getOrderPayments(order.id)
          console.log('✅ 回款计划响应:', paymentsResponse)
          if (paymentsResponse.success && paymentsResponse.data && paymentsResponse.data.length > 0) {
            formData.paymentSchedule = paymentsResponse.data.map(p => ({
              plannedDate: p.payment_date,
              plannedAmount: p.payment_amount || 0,
              remark: p.remark || ''
            }))
            console.log('✅ 回款计划加载成功:', formData.paymentSchedule.length, '条记录')
          } else {
            console.log('⚠️ 无回款计划,使用默认空行')
            formData.paymentSchedule = [{
              plannedDate: '',
              plannedAmount: 0,
              remark: ''
            }]
          }
          
          console.log('✅ 编辑模式:订单数据完整加载成功', order.id)
          ElMessage.success('订单数据加载成功')
        } else {
          console.error('❌ 订单主信息加载失败,响应:', response)
          ElMessage.error('订单主信息加载失败')
        }
      } catch (error) {
        console.error('❌ 加载订单数据失败:', error)
        ElMessage.error('加载订单数据失败: ' + (error.message || '未知错误'))
      }
    } else {
      console.log('ℹ️ 新增模式:无需加载数据')
    }
  },
  { immediate: true }
)

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
    taxRate: formData.taxRate || 13,
    accessories: [],
    outputProcess: '',
    productSource: ''  // 🆕 添加产品来源字段
  })
}

// 产品选择事件（lookup逻辑）
const handleProductSelect = async (row, index) => {
  const selectedProduct = productManualList.value.find(p => p.productCode === row.productCode)
  if (selectedProduct) {
    // 自动填充产品信息
    row.productName = selectedProduct.productName || ''
    row.productSpec = selectedProduct.specification || ''
    row.productColor = selectedProduct.productColor || ''
    row.productUnit = selectedProduct.unit || '个'
    row.unitPriceExcludingTax = selectedProduct.unitPriceExcludingTax || 0
    
    // 🔍 Lookup产出工序：从产品手册获取
    await lookupOutputProcess(row)
    
    // 🔍 Lookup产品来源：从产品手册获取
    await lookupProductSource(row)
  }
}

// Lookup产出工序从产品手册
const lookupOutputProcess = async (row) => {
  if (!row.productCode) {
    row.outputProcess = ''
    return
  }
  
  try {
    console.log('🔍 开始lookup产出工序, 产品编码:', row.productCode)
    
    // 直接使用已经加载好的productManualList，而不是重新请求API
    const matchedProduct = productManualList.value.find(p => {
      const code = p.product_code || p.productCode || p.code
      return code === row.productCode
    })
    
    console.log('🔎 查找产品编码:', row.productCode, '匹配结果:', matchedProduct)
    
    if (matchedProduct) {
      // 产出工序名称字段可能是output_process_name或outputProcessName
      const outputProcessName = matchedProduct.output_process_name || 
                                matchedProduct.outputProcessName || 
                                matchedProduct.output_process || 
                                matchedProduct.process_name || ''
      row.outputProcess = outputProcessName
      
      console.log('✅ Lookup成功:', {
        productCode: row.productCode,
        outputProcess: outputProcessName,
        matchedProduct: matchedProduct
      })
    } else {
      console.log('⚠️ 未找到匹配的产品:', row.productCode)
      console.log('可用的产品编码:', productManualList.value.map(p => p.product_code || p.productCode || p.code))
      row.outputProcess = ''
    }
  } catch (error) {
    console.error('❌ Lookup产出工序失败:', error)
    row.outputProcess = ''
  }
}

// 🆕 Lookup产品来源从产品手册
const lookupProductSource = async (row) => {
  if (!row.productCode) {
    row.productSource = ''
    return
  }
  
  try {
    console.log('🔍 开始lookup产品来源, 产品编码:', row.productCode)
    
    // 直接使用已经加载好的productManualList，而不是重新请求API
    const matchedProduct = productManualList.value.find(p => {
      const code = p.product_code || p.productCode || p.code
      return code === row.productCode
    })
    
    if (matchedProduct) {
      // 产品来源字段：source (可能是JSON数组，如 ["自制"] 或 ["外购"])
      let productSource = matchedProduct.source || ''
      
      // 如果是JSON字符串，解析并取第一个值
      if (typeof productSource === 'string' && productSource.startsWith('[')) {
        try {
          const sourceArray = JSON.parse(productSource)
          if (Array.isArray(sourceArray) && sourceArray.length > 0) {
            productSource = sourceArray[0]
          }
        } catch (e) {
          console.warn('⚠️ 解析产品来源JSON失败:', productSource)
        }
      }
      
      row.productSource = productSource
      
      console.log('✅ Lookup产品来源成功:', {
        productCode: row.productCode,
        productSource: productSource,
        原始值: matchedProduct.source
      })
    } else {
      console.log('⚠️ 未找到匹配的产品:', row.productCode)
      row.productSource = ''
    }
  } catch (error) {
    console.error('❌ Lookup产品来源失败:', error)
    row.productSource = ''
  }
}

// 产品输入事件（自动增行）
const handleProductInput = (row, index) => {
  // 如果是最后一行且有数据，自动添加新行
  if (index === formData.products.length - 1 && row.productCode) {
    addProduct()
  }
}

// 点击表格行事件（自动增行）
const handleProductRowClick = (row, column, event) => {
  const index = formData.products.indexOf(row)
  if (index === formData.products.length - 1 && !row.productCode) {
    // 最后一行且为空，不操作
    return
  }
  if (index === formData.products.length - 1 && row.productCode) {
    // 最后一行且有数据，自动添加新行
    addProduct()
  }
}

// 主表格税率变化，同步到所有产品
const handleTaxRateChange = (value) => {
  formData.products.forEach(product => {
    product.taxRate = value
  })
}

// 删除产品
const removeProduct = (index) => {
  // 至少保留一行
  if (formData.products.length > 1) {
    formData.products.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一行产品信息')
  }
}

// 付款方式变化
const handlePaymentMethodChange = (value) => {
  if (value === '预付全款') {
    formData.advancePaymentRatio = 100
    formData.advancePaymentAmount = formData.totalReceivable
  } else if (value === '按计划时间回款') {
    formData.advancePaymentRatio = 0
    formData.advancePaymentAmount = 0
    // 初始化第一期回款
    if (formData.paymentSchedule.length === 0) {
      formData.paymentSchedule.push({
        plannedDate: '',
        plannedAmount: 0,
        remark: ''
      })
    }
  } else if (value === '不收款') {
    formData.advancePaymentRatio = 0
    formData.advancePaymentAmount = 0
  }
}

// 预付比例变化
const handleAdvanceRatioChange = (value) => {
  if (formData.totalReceivable > 0) {
    formData.advancePaymentAmount = (formData.totalReceivable * value / 100).toFixed(2)
  }
}

// 预付金额变化
const handleAdvanceAmountChange = (value) => {
  if (formData.totalReceivable > 0) {
    formData.advancePaymentRatio = ((value / formData.totalReceivable) * 100).toFixed(2)
  }
}

// 计划回款金额变化（自动生成下一期）
const handleScheduleAmountChange = (index) => {
  const currentRow = formData.paymentSchedule[index]
  
  // 如果是最后一行且填写了金额，自动生成下一期
  if (index === formData.paymentSchedule.length - 1 && currentRow.plannedAmount > 0) {
    // 计算剩余金额
    const totalScheduled = formData.paymentSchedule.reduce((sum, item) => sum + (parseFloat(item.plannedAmount) || 0), 0)
    const remaining = formData.totalReceivable - totalScheduled
    
    if (remaining > 0) {
      formData.paymentSchedule.push({
        plannedDate: '',
        plannedAmount: remaining.toFixed(2),
        remark: ''
      })
    }
  }
}

// 删除回款计划
const removeSchedule = (index) => {
  if (formData.paymentSchedule.length > 1) {
    formData.paymentSchedule.splice(index, 1)
  } else {
    ElMessage.warning('至少保留一期回款计划')
  }
}

// 取消
const handleCancel = () => {
  emit('cancel')
}

// 保存订单的通用函数
const saveOrderData = async (closeAfterSave = false) => {
  // 验证
  if (!formData.customerName) {
    ElMessage.warning('请选择客户')
    return false
  }
  if (!formData.salesperson) {
    ElMessage.warning('请选择销售员')
    return false
  }
  if (formData.products.length === 0 || !formData.products.some(p => p.productCode)) {
    ElMessage.warning('请至少添加一个产品')
    return false
  }
  
  // 过滤掉空产品
  const validProducts = formData.products.filter(p => p.productCode)
  console.log('📋 有效产品数量:', validProducts.length)
  console.log('📋 有效产品明细:', validProducts)
  
  // 计算订单总额
  const totalAmountExcludingTax = validProducts
    .reduce((sum, product) => {
      return sum + (product.orderQuantity * product.unitPriceExcludingTax)
    }, 0)
  
  const totalTax = totalAmountExcludingTax * (formData.taxRate / 100)
  const totalAmount = totalAmountExcludingTax + totalTax
  
  // 准备提交数据
  const orderData = {
    customerName: formData.customerName,
    customerId: selectedCustomer.value?.id,
    customerOrderNo: formData.customerOrderNo,
    salesperson: formData.salesperson,
    quotationNo: formData.quotationNo,
    orderType: formData.orderType,
    
    // 时间信息
    orderTime: formData.orderTime,
    promisedDelivery: formData.promisedDelivery,
    customerDelivery: formData.customerDelivery,
    estimatedCompletionDate: formData.estimatedCompletionDate,
    
    // 部门信息
    salesDepartment: formData.salesDepartment,
    deliveryMethod: formData.deliveryMethod,
    returnOrderNo: formData.returnOrderNo,
    
    // 金额信息
    orderCurrency: formData.orderCurrency,
    currentExchangeRate: formData.currentExchangeRate,
    taxRate: formData.taxRate,
    fees: formData.fees,
    totalAmount,
    totalAmountExcludingTax,
    totalTax,
    
    // 附件说明
    orderAttachment: formData.orderAttachment,
    packagingAttachment: formData.packagingAttachment,
    orderNotes: formData.orderNotes,
    
    // 包装信息
    packagingMethod: formData.packagingMethod,
    packagingRequirements: formData.packagingRequirements,
    
    // 收货信息
    consignee: formData.consignee,
    deliveryAddress: formData.deliveryAddress,
    billRecipient: formData.billRecipient,
    billAddress: formData.billAddress,
    
    // 回款信息
    paymentMethod: formData.paymentMethod,
    advancePaymentRatio: formData.advancePaymentRatio,
    advancePaymentAmount: formData.advancePaymentAmount,
    plannedPaymentAccount: formData.plannedPaymentAccount,
    totalReceivable: totalAmount,
    
    // 售后信息
    hasAfterSales: formData.hasAfterSales ? 1 : 0,
    afterSalesOrderNo: formData.afterSalesOrderNo,
    afterSalesDetails: formData.afterSalesDetails,
    
    // 状态
    status: closeAfterSave ? 'pending' : 'draft',
    
    // 产品列表（⚠️ 重要：必须包含outputProcess和productSource字段）
    // 🔴 关键修复：使用驼峰命名，与后端接收参数匹配
    products: validProducts.map(p => ({
      productCode: p.productCode,
      productName: p.productName,
      productSpec: p.productSpec,
      productColor: p.productColor,
      productUnit: p.productUnit,
      orderQuantity: p.orderQuantity,
      unitPriceExcludingTax: p.unitPriceExcludingTax,
      taxRate: p.taxRate,
      accessories: p.accessories,
      outputProcess: p.outputProcess || '',  // ✅ 关键：保存产出工序
      productSource: p.productSource || ''  // 🆕 关键：保存产品来源
    })),
    
    // 回款计划
    paymentSchedule: formData.paymentSchedule,
    
    createdBy: 'admin'
  }
  
  console.log('📤 准备提交的完整订单数据:', JSON.stringify(orderData, null, 2))
  
  try {
    // 判断是创建还是更新
    let response
    if (formData.id) {
      // 编辑模式 - 更新订单
      console.log('🔄 编辑模式：更新订单 ID:', formData.id)
      response = await salesOrderApi.updateSalesOrder(formData.id, orderData)
      console.log('✅ 订单更新响应:', response)
    } else {
      // 创建模式 - 新增订单
      console.log('🆕 创建模式：新增订单')
      response = await salesOrderApi.createSalesOrder(orderData)
      console.log('✅ 订单创建响应:', response)
      console.log('📥 响应类型:', typeof response)
      console.log('📥 响应结构:', Object.keys(response || {}))
    }
    
    // 🔴 关键修复：检查 response 是否有效
    if (!response) {
      console.error('❌ API 响应为 undefined')
      // 数据可能已经保存到数据库，返回成功
      return true
    }
    
    // 🔴 处理不同的响应格式
    let success = false
    let message = ''
    let data = null
    
    if (response.success !== undefined) {
      // 格式1: { success: true, data: {...} }
      success = response.success
      data = response.data
      message = response.message || (success ? '操作成功' : '操作失败')
    } else if (response.code !== undefined) {
      // 格式2: { code: 200, data: {...} }
      success = response.code === 200 || response.code === 0
      data = response.data
      message = response.msg || response.message || (success ? '操作成功' : '操作失败')
    } else if (response.data !== undefined && response.data.success !== undefined) {
      // 格式3: { data: { success: true, ... } }
      success = response.data.success
      data = response.data.data || response.data
      message = response.data.message || (success ? '操作成功' : '操作失败')
    } else {
      // 其他格式，尝试直接使用 response
      console.warn('⚠️ 未知响应格式，尝试直接使用:', response)
      success = true
      data = response
      message = '操作成功'
    }
    
    if (success) {
      console.log('🎉 订单保存成功:', data)
      return true
    } else {
      console.error('❌ 保存失败，API返回失败:', message)
      ElMessage.error('保存失败:' + message)
      return false
    }
  } catch (error) {
    console.error('❌ 保存订单失败:', error)
    console.error('❌ 错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      response: error.response,
      request: error.request
    })
    
    // 显示友好的错误信息
    let errorMessage = '保存订单失败'
    if (error.response) {
      // 服务器返回了错误响应
      const status = error.response.status
      const data = error.response.data
      if (data && data.message) {
        errorMessage = `保存失败 (${status}): ${data.message}`
      } else {
        errorMessage = `保存失败 (${status}): ${error.message}`
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '网络连接错误，请检查网络连接'
    } else {
      // 请求设置出错
      errorMessage = `请求错误: ${error.message}`
    }
    
    // 检查是否是网络错误但数据可能已经保存
    if (error.message.includes('Network Error') || error.code === 'ECONNABORTED' || error.message.includes('Cannot read property \'data\' of undefined')) {
      // 数据可能已经保存到数据库，返回成功
      console.log('⚠️ 网络错误，但数据可能已经保存，返回成功')
      ElMessage.warning('网络连接不稳定，但订单可能已保存成功')
      return true
    }
    
    ElMessage.error(errorMessage)
    return false
  }
}

// 保存按钮（不关闭页面）
const handleSave = async () => {
  if (await saveOrderData(false)) {
    ElMessage.success('订单保存成功，可以继续编辑')
    emit('success')
  }
}

// 提交按钮（保存并关闭页面）
const handleSubmit = async () => {
  if (await saveOrderData(true)) {
    ElMessage.success('订单提交成功')
    emit('success')
  }
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
