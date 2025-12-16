<template>
  <div class="sales-order-create">
    <el-card class="page-card">
      <template #header>
        <div class="page-header">
          <span class="title">{{ isEdit ? '编辑销售订单' : '创建销售订单' }}</span>
          <div class="header-actions">
            <el-button @click="saveDraft">保存草稿</el-button>
            <el-button type="primary" @click="submitOrder" v-if="!isEdit">提交审核</el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </template>
      
      <el-form ref="orderForm" :model="orderForm" label-width="120px" :rules="orderRules">
        <!-- 订单基本信息 -->
        <el-divider>基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="订单编号" prop="orderCode">
              <el-input v-model="orderForm.orderCode" :disabled="isEdit" placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户信息" prop="customerId">
              <el-select v-model="orderForm.customerId" placeholder="请选择客户" filterable>
                <el-option v-for="customer in customers" :key="customer.id" :label="customer.name" :value="customer.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单日期" prop="orderDate">
              <el-date-picker v-model="orderForm.orderDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="交付日期" prop="deliveryDate">
              <el-date-picker v-model="orderForm.deliveryDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="销售员" prop="salesmanId">
              <el-select v-model="orderForm.salesmanId" placeholder="请选择销售员" filterable>
                <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="订单状态" prop="status">
              <el-input v-model="orderForm.statusText" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 订单项目 -->
        <el-divider>订单项目</el-divider>
        <div class="order-items-section">
          <order-items-editor 
            ref="orderItemsEditor"
            v-model="orderForm.orderItems" 
            @items-changed="handleItemsChanged"
          />
        </div>
        
        <!-- 交付计划 -->
        <el-divider>交付计划</el-divider>
        <div class="delivery-section">
          <delivery-schedule 
            v-model="orderForm.deliverySchedules"
            :order-items="orderForm.orderItems"
          />
        </div>
        
        <!-- 付款条款 -->
        <el-divider>付款条款</el-divider>
        <div class="payment-section">
          <payment-terms 
            v-model="orderForm.paymentTerms"
            :total-amount="orderForm.totalAmount"
          />
        </div>
        
        <!-- 订单摘要 -->
        <el-divider>订单摘要</el-divider>
        <div class="summary-section">
          <el-row :gutter="20">
            <el-col :span="8" :offset="16">
              <el-form-item label="商品总额">
                <el-input v-model="orderForm.subtotal" disabled style="text-align: right;" />
              </el-form-item>
              <el-form-item label="运费">
                <el-input-number v-model="orderForm.shippingFee" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="税额">
                <el-input v-model="orderForm.taxAmount" disabled style="text-align: right;" />
              </el-form-item>
              <el-form-item label="优惠金额">
                <el-input-number v-model="orderForm.discountAmount" :min="0" :precision="2" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="订单总额" prop="totalAmount">
                <el-input v-model="orderForm.totalAmount" disabled style="text-align: right; font-weight: bold;" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        
        <!-- 备注信息 -->
        <el-divider>备注信息</el-divider>
        <el-form-item label="订单备注" prop="remarks">
          <el-input v-model="orderForm.remarks" type="textarea" rows="4" placeholder="请输入订单备注信息" />
        </el-form-item>
        
        <!-- 操作按钮 -->
        <el-form-item>
          <div class="form-actions">
            <el-button @click="saveDraft">保存草稿</el-button>
            <el-button type="primary" @click="submitOrder" v-if="!isEdit">提交审核</el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ElMessage, ElMessageBox } from 'element-plus'
import OrderItemsEditor from './components/OrderItemsEditor.vue'
import DeliverySchedule from './components/DeliverySchedule.vue'
import PaymentTerms from './components/PaymentTerms.vue'

export default {
  name: 'SalesOrderCreate',
  components: {
    OrderItemsEditor,
    DeliverySchedule,
    PaymentTerms
  },
  data() {
    return {
      isEdit: false,
      orderId: null,
      orderForm: {
        orderCode: '',
        customerId: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        salesmanId: '',
        status: 'DRAFT',
        statusText: '草稿',
        orderItems: [],
        deliverySchedules: [],
        paymentTerms: [],
        subtotal: 0,
        shippingFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        remarks: ''
      },
      orderRules: {
        customerId: [{ required: true, message: '请选择客户', trigger: 'blur' }],
        orderDate: [{ required: true, message: '请选择订单日期', trigger: 'blur' }],
        deliveryDate: [{ required: true, message: '请选择交付日期', trigger: 'blur' }],
        salesmanId: [{ required: true, message: '请选择销售员', trigger: 'blur' }]
      },
      customers: [],
      users: []
    }
  },
  mounted() {
    this.initData()
  },
  methods: {
    // 初始化数据
    initData() {
      this.loadCustomers()
      this.loadUsers()
      
      // 检查是否是编辑模式
      const path = this.$route.path
      if (path.includes('/edit/')) {
        this.isEdit = true
        this.orderId = this.$route.params.id
        this.loadOrderData()
      } else {
        // 生成订单编号
        this.orderForm.orderCode = this.generateOrderCode()
      }
    },
    
    // 生成订单编号
    generateOrderCode() {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
      return `SO${year}${month}${day}${random}`
    },
    
    // 加载客户数据
    loadCustomers() {
      // 模拟数据
      this.customers = Array.from({ length: 10 }, (_, index) => ({
        id: index + 1,
        name: `客户${index + 1}`,
        contactPerson: `联系人${index + 1}`,
        phone: `1380013800${index}`,
        email: `customer${index + 1}@example.com`
      }))
    },
    
    // 加载用户数据
    loadUsers() {
      // 模拟数据
      this.users = Array.from({ length: 5 }, (_, index) => ({
        id: index + 1,
        name: `销售员${index + 1}`,
        username: `sales${index + 1}`
      }))
    },
    
    // 加载订单数据
    loadOrderData() {
      // 模拟加载订单数据
      setTimeout(() => {
        const mockOrder = {
          id: this.orderId,
          orderCode: `SO202401${String(this.orderId).padStart(4, '0')}`,
          customerId: Math.floor(Math.random() * 10) + 1,
          orderDate: new Date().toISOString().split('T')[0],
          deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          salesmanId: Math.floor(Math.random() * 5) + 1,
          status: 'DRAFT',
          statusText: '草稿',
          orderItems: [
            {
              id: 1,
              productId: 1,
              productCode: 'P001',
              productName: '精密轴承',
              unit: '个',
              quantity: 100,
              unitPrice: 120.50,
              amount: 12050.00
            },
            {
              id: 2,
              productId: 2,
              productCode: 'P002',
              productName: '电机控制器',
              unit: '台',
              quantity: 50,
              unitPrice: 580.00,
              amount: 29000.00
            }
          ],
          deliverySchedules: [
            {
              id: 1,
              deliveryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              deliveryItems: [
                { productId: 1, productName: '精密轴承', quantity: 50 },
                { productId: 2, productName: '电机控制器', quantity: 25 }
              ]
            },
            {
              id: 2,
              deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              deliveryItems: [
                { productId: 1, productName: '精密轴承', quantity: 50 },
                { productId: 2, productName: '电机控制器', quantity: 25 }
              ]
            }
          ],
          paymentTerms: [
            { id: 1, paymentPercentage: 30, paymentDueDays: 0, description: '预付30%' },
            { id: 2, paymentPercentage: 70, paymentDueDays: 30, description: '发货后30天付70%' }
          ],
          subtotal: 41050.00,
          shippingFee: 500.00,
          taxAmount: 5336.50,
          discountAmount: 0,
          totalAmount: 46886.50,
          remarks: '客户要求加急生产'
        }
        
        this.orderForm = mockOrder
        this.calculateOrderTotals()
      }, 500)
    },
    
    // 处理订单项变化
    handleItemsChanged(items) {
      this.orderForm.orderItems = items
      this.calculateOrderTotals()
    },
    
    // 计算订单总金额
    calculateOrderTotals() {
      // 计算商品总额
      this.orderForm.subtotal = this.orderForm.orderItems.reduce((sum, item) => sum + (item.amount || 0), 0)
      
      // 计算税额（假设税率13%）
      this.orderForm.taxAmount = this.orderForm.subtotal * 0.13
      
      // 计算订单总额
      this.orderForm.totalAmount = this.orderForm.subtotal + this.orderForm.shippingFee + this.orderForm.taxAmount - this.orderForm.discountAmount
    },
    
    // 保存草稿
    saveDraft() {
      this.$refs.orderForm.validate(valid => {
        if (valid) {
          // 模拟保存操作
          setTimeout(() => {
            ElMessage.success('草稿保存成功')
          }, 500)
        }
      })
    },
    
    // 提交订单
    submitOrder() {
      this.$refs.orderForm.validate(valid => {
        if (valid) {
          ElMessageBox.confirm('确定要提交该订单进行审核吗？提交后将无法修改。', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }).then(() => {
            // 模拟提交操作
            setTimeout(() => {
              ElMessage.success('订单提交成功')
              this.$router.push('/sales-order/list')
            }, 500)
          }).catch(() => {
            // 取消提交
          })
        }
      })
    },
    
    // 返回
    goBack() {
      this.$router.go(-1)
    }
  },
  watch: {
    'orderForm.shippingFee': function() {
      this.calculateOrderTotals()
    },
    'orderForm.discountAmount': function() {
      this.calculateOrderTotals()
    }
  }
}
</script>

<style scoped>
.sales-order-create {
  padding: 20px;
}

.page-card {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.order-items-section,
.delivery-section,
.payment-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-section {
  margin-bottom: 30px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
</style>