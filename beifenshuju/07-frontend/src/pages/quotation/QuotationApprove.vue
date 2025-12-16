<template>
  <div class="quotation-approve-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>报价审批 - {{ quotationDetail.quotationNo }}</span>
          <el-button @click="handleBack">返回</el-button>
        </div>
      </template>
      
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报价编号">{{ quotationDetail.quotationNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ quotationDetail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ quotationDetail.contactPerson }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ quotationDetail.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="报价日期">{{ quotationDetail.quotationDate }}</el-descriptions-item>
        <el-descriptions-item label="有效期至">{{ quotationDetail.validUntil }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ quotationDetail.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ quotationDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ quotationDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 审核信息 -->
      <el-divider content-position="left">审核信息</el-divider>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="审核人">{{ quotationDetail.reviewerName }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ quotationDetail.reviewTime }}</el-descriptions-item>
        <el-descriptions-item label="审核结果">{{ quotationDetail.reviewResult }}</el-descriptions-item>
        <el-descriptions-item label="审核意见" :span="2">{{ quotationDetail.reviewComment || '-' }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 报价明细 -->
      <el-divider content-position="left">报价明细</el-divider>
      <el-table :data="quotationDetail.items" border style="width: 100%">
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="unitPrice" label="单价" width="120" align="right">
          <template #default="scope">
            ¥ {{ scope.row.unitPrice.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="scope">
            ¥ {{ scope.row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
      </el-table>
      
      <!-- 费用汇总 -->
      <el-divider content-position="left">费用汇总</el-divider>
      <div class="total-amount-container">
        <span class="total-amount-label">总计金额：</span>
        <span class="total-amount-value">¥ {{ quotationDetail.totalAmount.toFixed(2) }}</span>
      </div>
      
      <!-- 审批区域 -->
      <el-divider content-position="left">审批意见</el-divider>
      <el-form :model="approveForm" ref="approveFormRef" label-width="100px" class="approve-form">
        <el-form-item label="审批结果" required>
          <el-radio-group v-model="approveForm.result">
            <el-radio :label="'approved'">通过</el-radio>
            <el-radio :label="'rejected'">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审批意见" :required="approveForm.result === 'rejected'">
          <el-input
            v-model="approveForm.comment"
            type="textarea"
            placeholder="请输入审批意见（拒绝时必填）"
            :rows="4"
          />
        </el-form-item>
      </el-form>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmitApprove">提交审批</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, FormInstance } from 'element-plus';

// 定义接口
interface QuotationItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  description: string;
}

interface QuotationDetail {
  id: string;
  quotationNo: string;
  customerName: string;
  contactPerson: string;
  contactPhone: string;
  quotationDate: string;
  validUntil: string;
  remark: string;
  creator: string;
  createTime: string;
  reviewerName: string;
  reviewTime: string;
  reviewResult: string;
  reviewComment: string;
  items: QuotationItem[];
  totalAmount: number;
}

interface ApproveForm {
  result: string; // 'approved' | 'rejected'
  comment: string;
}

// 路由和表单引用
const router = useRouter();
const route = useRoute();
const approveFormRef = ref<FormInstance>();

// 报价详情数据
const quotationDetail = reactive<QuotationDetail>({
  id: '',
  quotationNo: '',
  customerName: '',
  contactPerson: '',
  contactPhone: '',
  quotationDate: '',
  validUntil: '',
  remark: '',
  creator: '',
  createTime: '',
  reviewerName: '',
  reviewTime: '',
  reviewResult: '',
  reviewComment: '',
  items: [],
  totalAmount: 0
});

// 审批表单数据
const approveForm = reactive<ApproveForm>({
  result: 'approved',
  comment: ''
});

// 模拟获取报价详情数据
const fetchQuotationDetail = () => {
  const id = route.params.id;
  if (!id) {
    ElMessage.error('报价单ID不存在');
    router.push('/quotation/list');
    return;
  }
  
  // 模拟API调用，实际项目中应该替换为真实API
  Object.assign(quotationDetail, {
    id: id as string,
    quotationNo: 'QT2023003',
    customerName: '广州制造有限公司',
    contactPerson: '王总',
    contactPhone: '13800138003',
    quotationDate: '2023-10-18',
    validUntil: '2024-01-15',
    remark: '大批量采购，需要尽快确认',
    creator: '王五',
    createTime: '2023-10-18 10:00:00',
    reviewerName: '赵六',
    reviewTime: '2023-10-18 11:30:00',
    reviewResult: '审核通过',
    reviewComment: '价格合理，同意提交审批',
    items: [
      {
        productName: '产品A',
        quantity: 100,
        unitPrice: 1000.00,
        amount: 100000.00,
        description: '标准型产品'
      },
      {
        productName: '产品B',
        quantity: 30,
        unitPrice: 2000.00,
        amount: 60000.00,
        description: '增强型产品'
      },
      {
        productName: '产品C',
        quantity: 18,
        unitPrice: 3000.00,
        amount: 54000.00,
        description: '高级型产品'
      }
    ],
    totalAmount: 215000.00
  });
};

// 返回
const handleBack = () => {
  router.back();
};

// 取消
const handleCancel = () => {
  router.back();
};

// 提交审批
const handleSubmitApprove = async () => {
  if (!approveFormRef.value) return;
  
  try {
    await approveFormRef.value.validate();
    
    // 模拟提交审批操作
    console.log('提交审批:', approveForm);
    
    // 显示成功消息
    const message = approveForm.result === 'approved' ? '审批通过' : '审批拒绝';
    ElMessage.success(message);
    
    // 跳转回详情页
    router.push(`/quotation/detail/${quotationDetail.id}`);
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchQuotationDetail();
});
</script>

<style scoped>
.quotation-approve-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-amount-container {
  margin-top: 20px;
  text-align: right;
}

.total-amount-label {
  font-size: 16px;
  font-weight: 500;
}

.total-amount-value {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
  margin-left: 10px;
}

.approve-form {
  margin-top: 20px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>