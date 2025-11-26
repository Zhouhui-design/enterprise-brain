<template>
  <div class="quotation-detail-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>报价详情 - {{ quotationDetail.quotationNo }}</span>
          <el-button type="primary" @click="handleBack">返回列表</el-button>
        </div>
      </template>
      
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="报价编号">{{ quotationDetail.quotationNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTagType(quotationDetail.status)">
            {{ getStatusText(quotationDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ quotationDetail.customerName }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ quotationDetail.contactPerson }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ quotationDetail.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="报价日期">{{ quotationDetail.quotationDate }}</el-descriptions-item>
        <el-descriptions-item label="有效期至">{{ quotationDetail.validUntil }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ quotationDetail.creator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ quotationDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ quotationDetail.remark || '-' }}</el-descriptions-item>
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
      <el-descriptions :column="4" border>
        <el-descriptions-item label="商品总价" :span="1">¥ {{ quotationDetail.subtotal.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="运费" :span="1">¥ {{ quotationDetail.shippingFee.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="其他费用" :span="1">¥ {{ quotationDetail.otherFee.toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="折扣金额" :span="1">¥ {{ quotationDetail.discountAmount.toFixed(2) }}</el-descriptions-item>
      </el-descriptions>
      
      <div class="total-amount-container">
        <span class="total-amount-label">总计金额：</span>
        <span class="total-amount-value">¥ {{ quotationDetail.totalAmount.toFixed(2) }}</span>
      </div>
      
      <!-- 操作记录 -->
      <el-divider content-position="left">操作记录</el-divider>
      <el-timeline>
        <el-timeline-item
          v-for="(record, index) in operationRecords"
          :key="index"
          :timestamp="record.time"
          :type="record.type"
        >
          <div>
            <h4>{{ record.title }}</h4>
            <p class="timeline-content">{{ record.content }}</p>
          </div>
        </el-timeline-item>
      </el-timeline>
      
      <!-- 操作按钮 -->
      <div class="form-actions" v-if="showActions">
        <template v-if="quotationDetail.status === 'draft'">
          <el-button type="primary" @click="handleEdit">编辑</el-button>
          <el-button type="success" @click="handleSubmitReview">提交审核</el-button>
        </template>
        <template v-else-if="['reviewed', 'approved'].includes(quotationDetail.status)">
          <el-button type="warning" @click="handleConvertToOrder">转订单</el-button>
        </template>
        <template v-else-if="quotationDetail.status === 'pending_review' && isReviewer">
          <el-button type="primary" @click="handleReview">审核</el-button>
        </template>
        <template v-else-if="quotationDetail.status === 'pending_approval' && isApprover">
          <el-button type="primary" @click="handleApprove">审批</el-button>
        </template>
        <el-button @click="handlePrint">打印</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

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
  status: string;
  items: QuotationItem[];
  subtotal: number;
  shippingFee: number;
  otherFee: number;
  discountAmount: number;
  totalAmount: number;
}

interface OperationRecord {
  time: string;
  title: string;
  content: string;
  type: string;
}

// 路由引用
const router = useRouter();
const route = useRoute();

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
  status: '',
  items: [],
  subtotal: 0,
  shippingFee: 0,
  otherFee: 0,
  discountAmount: 0,
  totalAmount: 0
});

// 操作记录
const operationRecords = ref<OperationRecord[]>([]);

// 模拟用户角色（实际应从登录信息获取）
const currentUser = {
  id: '1',
  name: '当前用户',
  roles: ['reviewer', 'approver'] // 假设当前用户有审核和审批权限
};

// 计算属性
const isReviewer = computed(() => currentUser.roles.includes('reviewer'));
const isApprover = computed(() => currentUser.roles.includes('approver'));
const showActions = computed(() => {
  // 根据状态和用户角色决定是否显示操作按钮
  return true; // 简化处理，实际应根据业务逻辑判断
});

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'info',
    pending_review: 'warning',
    reviewing: 'primary',
    reviewed: 'success',
    pending_approval: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info',
    completed: 'success'
  };
  return statusMap[status] || 'info';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    pending_review: '待审核',
    reviewing: '审核中',
    reviewed: '已审核',
    pending_approval: '待审批',
    approved: '已审批',
    rejected: '已拒绝',
    cancelled: '已取消',
    completed: '已完成'
  };
  return statusMap[status] || status;
};

// 模拟获取报价详情数据
const fetchQuotationDetail = () => {
  const id = route.params.id;
  if (!id) {
    ElMessage.error('报价单ID不存在');
    router.push('/quotation/list');
    return;
  }
  
  // 模拟API调用，实际项目中应该替换为真实API
  // 这里使用模拟数据
  Object.assign(quotationDetail, {
    id: id as string,
    quotationNo: 'QT2023001',
    customerName: '北京科技有限公司',
    contactPerson: '张经理',
    contactPhone: '13800138001',
    quotationDate: '2023-10-15',
    validUntil: '2023-12-31',
    remark: '客户要求尽快发货',
    creator: '张三',
    createTime: '2023-10-15 09:30:00',
    status: 'approved',
    items: [
      {
        productName: '产品A',
        quantity: 50,
        unitPrice: 1000.00,
        amount: 50000.00,
        description: '标准型产品'
      },
      {
        productName: '产品B',
        quantity: 25,
        unitPrice: 2000.00,
        amount: 50000.00,
        description: '增强型产品'
      },
      {
        productName: '产品C',
        quantity: 8,
        unitPrice: 3000.00,
        amount: 24000.00,
        description: '高级型产品'
      }
    ],
    subtotal: 124000.00,
    shippingFee: 1000.00,
    otherFee: 0.00,
    discountAmount: 0.00,
    totalAmount: 125000.00
  });
  
  // 模拟操作记录
  operationRecords.value = [
    {
      time: '2023-10-15 14:30:00',
      title: '审批通过',
      content: '李四审批通过了报价单',
      type: 'success'
    },
    {
      time: '2023-10-15 11:00:00',
      title: '审核通过',
      content: '王五审核通过了报价单',
      type: 'primary'
    },
    {
      time: '2023-10-15 10:00:00',
      title: '提交审核',
      content: '张三提交了报价单审核',
      type: 'info'
    },
    {
      time: '2023-10-15 09:30:00',
      title: '创建报价单',
      content: '张三创建了报价单',
      type: 'info'
    }
  ];
};

// 返回列表
const handleBack = () => {
  router.push('/quotation/list');
};

// 编辑报价单
const handleEdit = () => {
  router.push(`/quotation/edit/${quotationDetail.id}`);
};

// 提交审核
const handleSubmitReview = () => {
  ElMessage.success('报价单已提交审核');
  fetchQuotationDetail(); // 刷新页面数据
};

// 审核
const handleReview = () => {
  router.push(`/quotation/review/${quotationDetail.id}`);
};

// 审批
const handleApprove = () => {
  router.push(`/quotation/approve/${quotationDetail.id}`);
};

// 转订单
const handleConvertToOrder = () => {
  router.push(`/quotation/convert/${quotationDetail.id}`);
};

// 打印
const handlePrint = () => {
  window.print();
};

// 组件挂载时获取数据
onMounted(() => {
  fetchQuotationDetail();
});
</script>

<style scoped>
.quotation-detail-container {
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

.timeline-content {
  color: #606266;
  margin-top: 5px;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>