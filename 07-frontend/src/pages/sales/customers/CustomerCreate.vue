<template>
  <div class="customer-create">
    <!-- 顶部标签页导航 -->
    <el-tabs v-model="activeTab" type="card" class="customer-tabs">
      <el-tab-pane label="基本信息" name="basic">
        <el-scrollbar height="600px">
          <div class="form-section-grid">
            <!-- 客户基本信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><User /></el-icon>
                  <span>客户基本信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="客户编号">
                  <el-input v-model="formData.customerCode" placeholder="自动生成" disabled />
                </el-form-item>
                <el-form-item label="客户名称" required>
                  <el-input v-model="formData.customerName" placeholder="请输入客户名称" />
                </el-form-item>
                <el-form-item label="客户类型">
                  <el-input v-model="formData.customerType" placeholder="如：VIP客户、普通客户、潜在客户" />
                </el-form-item>
                <el-form-item label="客户状态">
                  <el-input v-model="formData.status" placeholder="如：合作中、已流失、已冻结" />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 联系信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Phone /></el-icon>
                  <span>联系信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="联系人" required>
                  <el-input v-model="formData.contactPerson" placeholder="请输入联系人姓名" />
                </el-form-item>
                <el-form-item label="联系电话" required>
                  <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
                </el-form-item>
                <el-form-item label="邮箱">
                  <el-input v-model="formData.contactEmail" placeholder="请输入邮箱地址" />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 公司信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><OfficeBuilding /></el-icon>
                  <span>公司信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="公司名称">
                  <el-input v-model="formData.company" placeholder="请输入公司名称" />
                </el-form-item>
                <el-form-item label="所属行业">
                  <el-input v-model="formData.industry" placeholder="如：电子制造" />
                </el-form-item>
                <el-form-item label="所属区域">
                  <el-input v-model="formData.region" placeholder="如：华东区、华南区、华北区" />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 地址信息 -->
            <el-card shadow="hover" class="section-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Location /></el-icon>
                  <span>地址信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px" class="compact-form">
                <el-form-item label="详细地址">
                  <el-input 
                    v-model="formData.address" 
                    type="textarea" 
                    :rows="3" 
                    placeholder="请输入详细地址" 
                  />
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 业务信息 -->
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Briefcase /></el-icon>
                  <span>业务信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="负责销售">
                      <el-input v-model="formData.salesPerson" placeholder="请输入销售人员姓名" />
                    </el-form-item>
                    <el-form-item label="信用额度">
                      <el-input-number v-model="formData.creditLimit" :precision="2" :min="0" style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="付款方式">
                      <el-input v-model="formData.paymentTerm" placeholder="如：月结30天、货到付款、预付款" />
                    </el-form-item>
                    <el-form-item label="备注">
                      <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="账款信息" name="payment">
        <el-scrollbar height="600px">
          <div class="form-section-grid">
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Money /></el-icon>
                  <span>账款信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="信用额度">
                      <el-input-number v-model="formData.creditLimit" :precision="2" :min="0" style="width: 100%;" />
                    </el-form-item>
                    <el-form-item label="已用额度">
                      <el-input-number v-model="formData.usedCredit" :precision="2" :min="0" disabled style="width: 100%;" />
                    </el-form-item>
                    <el-form-item label="可用额度">
                      <el-input-number 
                        :model-value="formData.creditLimit - formData.usedCredit" 
                        :precision="2" 
                        disabled 
                        style="width: 100%;" 
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="累计交易额">
                      <el-input-number v-model="formData.totalAmount" :precision="2" :min="0" disabled style="width: 100%;" />
                    </el-form-item>
                    <el-form-item label="订单数量">
                      <el-input-number v-model="formData.totalOrders" :min="0" disabled style="width: 100%;" />
                    </el-form-item>
                    <el-form-item label="最后下单日期">
                      <el-date-picker v-model="formData.lastOrderDate" type="date" disabled style="width: 100%;" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="开票信息" name="invoice">
        <el-scrollbar height="600px">
          <div class="form-section-grid">
            <el-card shadow="hover" class="section-card full-width">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>开票信息</span>
                </div>
              </template>
              <el-form :model="formData" label-width="140px">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="税号">
                      <el-input v-model="formData.taxNumber" placeholder="请输入税号" />
                    </el-form-item>
                    <el-form-item label="开户银行">
                      <el-input v-model="formData.bankName" placeholder="请输入开户银行" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="银行账号">
                      <el-input v-model="formData.bankAccount" placeholder="请输入银行账号" />
                    </el-form-item>
                    <el-form-item label="开票地址">
                      <el-input v-model="formData.invoiceAddress" placeholder="请输入开票地址" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </el-card>
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="历史下单" name="orderHistory">
        <el-scrollbar height="600px">
          <el-empty description="暂无历史下单记录" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="专属产品" name="products">
        <el-scrollbar height="600px">
          <el-empty description="暂无专属产品" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="未发货订单" name="unshippedOrders">
        <el-scrollbar height="600px">
          <el-empty description="暂无未发货订单" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="往来公函" name="correspondence">
        <el-scrollbar height="600px">
          <el-empty description="暂无往来公函" />
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="客户图纸" name="drawings">
        <el-scrollbar height="600px">
          <el-empty description="暂无客户图纸" />
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>

    <!-- 底部按钮 -->
    <div class="footer-buttons">
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="handleSaveDraft">保存草稿</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, Phone, OfficeBuilding, Location, Briefcase, 
  Money, Document 
} from '@element-plus/icons-vue'

const props = defineProps({
  customerData: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['success', 'cancel'])

const activeTab = ref('basic')

// 表单数据
const formData = reactive({
  // 基本信息
  customerCode: '',
  customerName: '',
  customerType: '',
  status: '',
  
  // 联系信息
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  
  // 公司信息
  company: '',
  industry: '',
  region: '',
  address: '',
  
  // 业务信息
  salesPerson: '',
  creditLimit: 0,
  paymentTerm: '',
  remark: '',
  
  // 账款信息
  usedCredit: 0,
  totalAmount: 0,
  totalOrders: 0,
  lastOrderDate: '',
  
  // 开票信息
  taxNumber: '',
  bankName: '',
  bankAccount: '',
  invoiceAddress: ''
})

// 监听 props 变化，编辑模式下填充数据
watch(() => props.customerData, (newVal) => {
  if (newVal && props.isEdit) {
    Object.assign(formData, newVal)
  }
}, { immediate: true })

// 取消
const handleCancel = () => {
  emit('cancel')
}

// 保存草稿
const handleSaveDraft = () => {
  ElMessage.success('草稿保存成功')
}

// 提交
const handleSubmit = () => {
  // 验证
  if (!formData.customerName) {
    ElMessage.warning('请输入客户名称')
    activeTab.value = 'basic'
    return
  }
  if (!formData.contactPerson) {
    ElMessage.warning('请输入联系人')
    activeTab.value = 'basic'
    return
  }
  if (!formData.contactPhone) {
    ElMessage.warning('请输入联系电话')
    activeTab.value = 'basic'
    return
  }
  
  // 提交 - 将表单数据传递给父组件
  emit('success', {
    customerName: formData.customerName,
    customerType: formData.customerType,
    status: formData.status,
    contactPerson: formData.contactPerson,
    contactPhone: formData.contactPhone,
    contactEmail: formData.contactEmail,
    company: formData.company,
    industry: formData.industry,
    region: formData.region,
    address: formData.address,
    salesPerson: formData.salesPerson,
    creditLimit: formData.creditLimit,
    paymentTerm: formData.paymentTerm,
    remark: formData.remark,
    usedCredit: formData.usedCredit,
    totalAmount: formData.totalAmount,
    totalOrders: formData.totalOrders,
    lastOrderDate: formData.lastOrderDate,
    taxNumber: formData.taxNumber,
    bankName: formData.bankName,
    bankAccount: formData.bankAccount,
    invoiceAddress: formData.invoiceAddress
  })
}
</script>

<style scoped>
.customer-create {
  width: 100%;
  height: 100%;
}

.customer-tabs {
  height: 100%;
}

.customer-tabs :deep(.el-tabs__content) {
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
