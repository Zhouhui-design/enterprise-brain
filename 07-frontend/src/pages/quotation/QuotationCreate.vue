<template>
  <div class="quotation-create-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>创建报价单</span>
        </div>
      </template>
      
      <el-form :model="quotationForm" ref="quotationFormRef" label-width="100px" class="quotation-form">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="报价编号" required>
              <el-input v-model="quotationForm.quotationNo" placeholder="自动生成" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户名称" required>
              <el-select v-model="quotationForm.customerId" placeholder="请选择客户" filterable>
                <el-option
                  v-for="customer in customerList"
                  :key="customer.id"
                  :label="customer.name"
                  :value="customer.id"
                  @click="handleCustomerSelect(customer)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系人" required>
              <el-input v-model="quotationForm.contactPerson" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="联系电话" required>
              <el-input v-model="quotationForm.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价日期" required>
              <el-date-picker
                v-model="quotationForm.quotationDate"
                type="date"
                placeholder="请选择报价日期"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="有效期至" required>
              <el-date-picker
                v-model="quotationForm.validUntil"
                type="date"
                placeholder="请选择有效期至"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="quotationForm.remark"
                type="textarea"
                placeholder="请输入备注信息"
                :rows="3"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 报价明细 -->
        <el-divider content-position="left">报价明细</el-divider>
        <el-table :data="quotationForm.items" border style="width: 100%" class="quotation-items-table">
          <el-table-column prop="productName" label="产品名称" width="200">
            <template #default="scope">
              <el-select
                v-model="quotationForm.items[scope.$index].productId"
                placeholder="请选择产品"
                style="width: 100%"
                @change="handleProductSelect(scope.$index)"
              >
                <el-option
                  v-for="product in productList"
                  :key="product.id"
                  :label="product.name"
                  :value="product.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="120">
            <template #default="scope">
              <el-input-number
                v-model="quotationForm.items[scope.$index].quantity"
                :min="1"
                :step="1"
                @change="handleQuantityChange"
              />
            </template>
          </el-table-column>
          <el-table-column prop="unitPrice" label="单价" width="150" align="right">
            <template #default="scope">
              <el-input
                v-model.number="quotationForm.items[scope.$index].unitPrice"
                type="number"
                placeholder="0.00"
                @change="handlePriceChange"
              />
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="150" align="right">
            <template #default="scope">
              ¥ {{ scope.row.amount.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述">
            <template #default="scope">
              <el-input
                v-model="quotationForm.items[scope.$index].description"
                placeholder="请输入描述"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="scope">
              <el-button
                type="danger"
                size="small"
                @click="handleDeleteItem(scope.$index)"
                :disabled="quotationForm.items.length <= 1"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div style="margin-top: 10px; text-align: right;">
          <el-button @click="handleAddItem">
            <el-icon><Plus /></el-icon>
            添加行
          </el-button>
        </div>
        
        <!-- 费用汇总 -->
        <el-divider content-position="left">费用汇总</el-divider>
        <el-row :gutter="20">
          <el-col :span="6" :offset="18">
            <el-form-item label="商品总价">
              <el-input v-model="quotationForm.subtotal" placeholder="0.00" readonly />
            </el-form-item>
            <el-form-item label="运费">
              <el-input
                v-model.number="quotationForm.shippingFee"
                type="number"
                placeholder="0.00"
                @change="calculateTotalAmount"
              />
            </el-form-item>
            <el-form-item label="其他费用">
              <el-input
                v-model.number="quotationForm.otherFee"
                type="number"
                placeholder="0.00"
                @change="calculateTotalAmount"
              />
            </el-form-item>
            <el-form-item label="折扣金额">
              <el-input
                v-model.number="quotationForm.discountAmount"
                type="number"
                placeholder="0.00"
                @change="calculateTotalAmount"
              />
            </el-form-item>
            <el-form-item label="总计金额" required>
              <el-input
                v-model="quotationForm.totalAmount"
                placeholder="0.00"
                readonly
                class="total-amount-input"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="success" @click="handleSubmitReview">提交审核</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, FormInstance } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';

// 定义接口
interface Customer {
  id: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface QuotationItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  description: string;
}

interface QuotationForm {
  id?: string;
  quotationNo: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  contactPhone: string;
  quotationDate: string;
  validUntil: string;
  remark: string;
  items: QuotationItem[];
  subtotal: number;
  shippingFee: number;
  otherFee: number;
  discountAmount: number;
  totalAmount: number;
}

// 路由和表单引用
const router = useRouter();
const route = useRoute();
const quotationFormRef = ref<FormInstance>();

// 模拟客户数据
const customerList = ref<Customer[]>([
  {
    id: '1',
    name: '北京科技有限公司',
    contactPerson: '张经理',
    contactPhone: '13800138001'
  },
  {
    id: '2',
    name: '上海贸易有限公司',
    contactPerson: '李总',
    contactPhone: '13800138002'
  },
  {
    id: '3',
    name: '广州制造有限公司',
    contactPerson: '王总',
    contactPhone: '13800138003'
  }
]);

// 模拟产品数据
const productList = ref<Product[]>([
  {
    id: '1',
    name: '产品A',
    price: 1000.00,
    description: '标准型产品'
  },
  {
    id: '2',
    name: '产品B',
    price: 2000.00,
    description: '增强型产品'
  },
  {
    id: '3',
    name: '产品C',
    price: 3000.00,
    description: '高级型产品'
  }
]);

// 生成报价编号
const generateQuotationNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `QT${year}${month}${day}${random}`;
};

// 初始化表单数据
const quotationForm = reactive<QuotationForm>({
  quotationNo: generateQuotationNo(),
  customerId: '',
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  quotationDate: new Date().toISOString().split('T')[0],
  validUntil: '',
  remark: '',
  items: [
    {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      description: ''
    }
  ],
  subtotal: 0,
  shippingFee: 0,
  otherFee: 0,
  discountAmount: 0,
  totalAmount: 0
});

// 处理客户选择
const handleCustomerSelect = (customer: Customer) => {
  quotationForm.customerName = customer.name;
  quotationForm.contactPerson = customer.contactPerson;
  quotationForm.contactPhone = customer.contactPhone;
};

// 处理产品选择
const handleProductSelect = (index: number) => {
  const productId = quotationForm.items[index].productId;
  const product = productList.value.find(p => p.id === productId);
  
  if (product) {
    quotationForm.items[index].productName = product.name;
    quotationForm.items[index].unitPrice = product.price;
    quotationForm.items[index].amount = product.price * quotationForm.items[index].quantity;
    quotationForm.items[index].description = product.description;
  }
  
  calculateSubtotal();
};

// 处理数量变化
const handleQuantityChange = () => {
  quotationForm.items.forEach(item => {
    item.amount = item.unitPrice * item.quantity;
  });
  calculateSubtotal();
};

// 处理价格变化
const handlePriceChange = () => {
  quotationForm.items.forEach(item => {
    item.amount = item.unitPrice * item.quantity;
  });
  calculateSubtotal();
};

// 计算小计
const calculateSubtotal = () => {
  quotationForm.subtotal = quotationForm.items.reduce((sum, item) => sum + item.amount, 0);
  calculateTotalAmount();
};

// 计算总金额
const calculateTotalAmount = () => {
  quotationForm.totalAmount = quotationForm.subtotal + quotationForm.shippingFee + quotationForm.otherFee - quotationForm.discountAmount;
};

// 添加明细行
const handleAddItem = () => {
  quotationForm.items.push({
    productId: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    description: ''
  });
};

// 删除明细行
const handleDeleteItem = (index: number) => {
  quotationForm.items.splice(index, 1);
  calculateSubtotal();
};

// 保存草稿
const handleSaveDraft = async () => {
  if (!quotationFormRef.value) return;
  
  try {
    await quotationFormRef.value.validate();
    
    // 模拟保存草稿操作
    console.log('保存草稿:', quotationForm);
    ElMessage.success('草稿保存成功');
    router.push('/quotation/list');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 提交审核
const handleSubmitReview = async () => {
  if (!quotationFormRef.value) return;
  
  try {
    await quotationFormRef.value.validate();
    
    // 模拟提交审核操作
    console.log('提交审核:', quotationForm);
    ElMessage.success('报价单已提交审核');
    router.push('/quotation/list');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 取消
const handleCancel = () => {
  router.push('/quotation/list');
};

// 组件挂载时
onMounted(() => {
  // 如果是编辑模式，获取报价单数据
  const id = route.params.id;
  if (id) {
    // 这里应该根据ID从API获取数据
    // 模拟编辑场景
    console.log('编辑报价单ID:', id);
  }
});
</script>

<style scoped>
.quotation-create-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quotation-form {
  margin-top: 20px;
}

.quotation-items-table {
  margin-bottom: 10px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.total-amount-input {
  font-weight: bold;
  font-size: 16px;
}
</style>