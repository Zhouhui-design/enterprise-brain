<template>
  <div class="quotation-convert-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>报价转订单 - {{ quotationDetail.quotationNo }}</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>
      
      <div v-loading="loading">
        <!-- 报价信息 -->
        <div class="convert-info">
          <div class="info-section">
            <h3 class="section-title">报价信息</h3>
            <div class="info-content">
              <div class="info-item">
                <label>报价单号：</label>
                <span>{{ quotationDetail.quotationNo }}</span>
              </div>
              <div class="info-item">
                <label>客户名称：</label>
                <span>{{ quotationDetail.customerName }}</span>
              </div>
              <div class="info-item">
                <label>联系人：</label>
                <span>{{ quotationDetail.contactPerson }} / {{ quotationDetail.contactPhone }}</span>
              </div>
              <div class="info-item">
                <label>总金额：</label>
                <span class="amount">¥{{ quotationDetail.totalAmount?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <el-divider />
        
        <!-- 订单信息表单 -->
        <div class="order-form-section">
          <h3 class="section-title">订单信息</h3>
          <el-form :model="orderForm" ref="orderFormRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="订单编号" prop="orderNo">
                  <el-input v-model="orderForm.orderNo" placeholder="系统自动生成" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="订单日期" prop="orderDate">
                  <el-date-picker
                    v-model="orderForm.orderDate"
                    type="date"
                    placeholder="选择订单日期"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="交付方式" prop="deliveryMethod">
                  <el-select v-model="orderForm.deliveryMethod" placeholder="请选择交付方式">
                    <el-option label="快递配送" value="EXPRESS" />
                    <el-option label="上门自提" value="SELF_PICKUP" />
                    <el-option label="物流配送" value="LOGISTICS" />
                    <el-option label="其他" value="OTHER" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="支付方式" prop="paymentMethod">
                  <el-select v-model="orderForm.paymentMethod" placeholder="请选择支付方式">
                    <el-option label="银行转账" value="BANK_TRANSFER" />
                    <el-option label="在线支付" value="ONLINE_PAYMENT" />
                    <el-option label="现金支付" value="CASH" />
                    <el-option label="其他" value="OTHER" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="交付地址" prop="deliveryAddress">
              <el-input
                v-model="orderForm.deliveryAddress"
                type="textarea"
                rows="2"
                placeholder="请输入交付地址"
              />
            </el-form-item>
            
            <el-form-item label="订单备注" prop="remark">
              <el-input
                v-model="orderForm.remark"
                type="textarea"
                rows="3"
                placeholder="请输入订单备注"
              />
            </el-form-item>
            
            <el-form-item>
              <el-checkbox v-model="orderForm.copyQuotationRemark">同时复制报价单备注</el-checkbox>
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 操作按钮 -->
        <div class="form-actions">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConvert" :loading="converting">创建订单</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const converting = ref(false);
const orderFormRef = ref();

// 报价详情数据
const quotationDetail = reactive({
  quotationNo: '',
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  totalAmount: 0,
  remark: ''
});

// 订单表单数据
const orderForm = reactive({
  orderNo: '',
  orderDate: new Date().toISOString().split('T')[0],
  deliveryMethod: '',
  paymentMethod: '',
  deliveryAddress: '',
  remark: '',
  copyQuotationRemark: false
});

// 获取报价详情
const getQuotationDetail = async () => {
  const quotationId = route.params.id;
  if (!quotationId) {
    ElMessage.error('缺少报价单ID');
    return;
  }
  
  try {
    loading.value = true;
    // 这里使用模拟数据，实际项目中应该调用API
    // const response = await axios.get(`/api/quotation/${quotationId}`);
    // 模拟API返回数据
    setTimeout(() => {
      Object.assign(quotationDetail, {
        quotationNo: 'QUOTE2024001',
        customerName: '测试客户有限公司',
        contactPerson: '张三',
        contactPhone: '13800138000',
        totalAmount: 12345.67,
        remark: '这是报价单备注信息'
      });
      loading.value = false;
    }, 500);
  } catch (error) {
    loading.value = false;
    ElMessage.error('获取报价详情失败');
    console.error('获取报价详情失败:', error);
  }
};

// 处理报价转订单
const handleConvert = async () => {
  try {
    // 表单验证
    if (!orderForm.orderDate) {
      ElMessage.warning('请选择订单日期');
      return;
    }
    
    if (!orderForm.deliveryMethod) {
      ElMessage.warning('请选择交付方式');
      return;
    }
    
    if (!orderForm.paymentMethod) {
      ElMessage.warning('请选择支付方式');
      return;
    }
    
    if (!orderForm.deliveryAddress) {
      ElMessage.warning('请输入交付地址');
      return;
    }
    
    // 如果选择复制报价单备注
    if (orderForm.copyQuotationRemark) {
      orderForm.remark = quotationDetail.remark;
    }
    
    converting.value = true;
    
    // 构建订单数据
    const orderData = {
      quotationId: route.params.id,
      orderDate: orderForm.orderDate,
      deliveryMethod: orderForm.deliveryMethod,
      paymentMethod: orderForm.paymentMethod,
      deliveryAddress: orderForm.deliveryAddress,
      remark: orderForm.remark,
      // 从报价单复制的信息
      customerName: quotationDetail.customerName,
      contactPerson: quotationDetail.contactPerson,
      contactPhone: quotationDetail.contactPhone,
      totalAmount: quotationDetail.totalAmount
    };
    
    // 这里使用模拟数据，实际项目中应该调用API
    // const response = await axios.post('/api/quotation/convert', orderData);
    
    // 模拟API调用
    setTimeout(() => {
      converting.value = false;
      ElMessage.success('报价单转订单成功');
      
      // 跳转到订单列表或订单详情页面
      ElMessage({ 
        message: '订单创建成功！',
        type: 'success',
        duration: 3000,
        onClose: () => {
          router.push('/quotation/list');
        }
      });
    }, 1000);
  } catch (error) {
    converting.value = false;
    ElMessage.error('报价单转订单失败');
    console.error('报价单转订单失败:', error);
  }
};

// 处理返回
const handleBack = () => {
  router.push('/quotation/list');
};

// 处理取消
const handleCancel = () => {
  router.push('/quotation/list');
};

// 页面加载时获取报价详情
onMounted(() => {
  getQuotationDetail();
});
</script>

<style scoped>
.quotation-convert-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.convert-info {
  margin-bottom: 20px;
}

.info-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #303133;
}

.info-content {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.info-item {
  display: flex;
  margin-bottom: 10px;
}

.info-item label {
  width: 100px;
  font-weight: 500;
  color: #606266;
}

.info-item span {
  color: #303133;
}

.amount {
  font-size: 18px;
  font-weight: 600;
  color: #f56c6c;
}

.order-form-section {
  margin-top: 20px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>