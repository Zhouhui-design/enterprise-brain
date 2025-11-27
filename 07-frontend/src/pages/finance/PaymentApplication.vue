<template>
  <div class="payment-application">
    <div class="header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>财务管理</el-breadcrumb-item>
        <el-breadcrumb-item>付款申请</el-breadcrumb-item>
      </el-breadcrumb>
      <h1 class="page-title">付款申请管理</h1>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" layout="inline" :inline-message="false">
        <el-form-item label="申请单号">
          <el-input v-model="searchForm.applicationNumber" placeholder="请输入申请单号" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.vendorName" placeholder="请输入供应商名称" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="申请状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px;">
            <el-option label="待审批" value="pending"></el-option>
            <el-option label="审批中" value="processing"></el-option>
            <el-option label="已批准" value="approved"></el-option>
            <el-option label="已拒绝" value="rejected"></el-option>
            <el-option label="已付款" value="paid"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="申请人">
          <el-input v-model="searchForm.applicant" placeholder="请输入申请人" clearable style="width: 150px;"></el-input>
        </el-form-item>
        <el-form-item label="申请日期">
          <el-date-picker
            v-model="searchForm.applicationDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
            style="width: 240px;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 统计概览 -->
    <div class="statistics">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="stat-card primary">
            <div class="stat-content">
              <div class="stat-label">待审批申请</div>
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-amount">{{ formatCurrency(pendingAmount) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card success">
            <div class="stat-content">
              <div class="stat-label">本月已付款</div>
              <div class="stat-value">{{ paidCount }}</div>
              <div class="stat-amount">{{ formatCurrency(paidAmount) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card warning">
            <div class="stat-content">
              <div class="stat-label">即将到期</div>
              <div class="stat-value">{{ upcomingCount }}</div>
              <div class="stat-amount">{{ formatCurrency(upcomingAmount) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card danger">
            <div class="stat-content">
              <div class="stat-label">已逾期</div>
              <div class="stat-value">{{ overdueCount }}</div>
              <div class="stat-amount">{{ formatCurrency(overdueAmount) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="stat-card info">
            <div class="stat-content full-width">
              <div class="stat-label">本月申请总额</div>
              <div class="stat-value-large">{{ formatCurrency(totalAmount) }}</div>
              <div class="stat-change">
                <span class="change-label">较上月</span>
                <span class="change-value" :class="{ positive: monthlyChange > 0, negative: monthlyChange < 0 }">
                  {{ monthlyChange > 0 ? '+' : '' }}{{ monthlyChange }}%
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <el-button type="primary" @click="createApplication">
        <el-icon><Plus /></el-icon> 新增申请
      </el-button>
      <el-button @click="batchDelete" :disabled="selectedApplications.length === 0">
        <el-icon><Delete /></el-icon> 批量删除
      </el-button>
      <el-button @click="exportData">
        <el-icon><Download /></el-icon> 导出数据
      </el-button>
      <el-button @click="printData" :disabled="selectedApplications.length === 0">
        <el-icon><Printer /></el-icon> 打印选中
      </el-button>
    </div>

    <!-- 付款申请列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="filteredApplications"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="applicationNumber" label="申请单号" width="160" fixed="left" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="vendorName" label="供应商名称" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="amount" label="申请金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentType" label="付款类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getPaymentTypeTag(row.paymentType)">{{ getPaymentTypeText(row.paymentType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="申请状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applicant" label="申请人" width="120"></el-table-column>
        <el-table-column prop="applicationDate" label="申请日期" width="130">
          <template #default="{ row }">
            {{ formatDate(row.applicationDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="预计付款日期" width="130">
          <template #default="{ row }">
            <span :class="{ 'overdue': isOverdue(row.dueDate) }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="付款说明" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewDetails(row)" plain>详情</el-button>
            <template v-if="row.status === 'pending'">
              <el-button type="warning" size="small" @click="editApplication(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="cancelApplication(row)">取消</el-button>
            </template>
            <template v-else-if="row.status === 'approved'">
              <el-button type="success" size="small" @click="markAsPaid(row)">标记付款</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredApplications.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'create' ? '新增付款申请' : '编辑付款申请'"
      width="700px"
      :before-close="handleDialogClose"
    >
      <el-form
        ref="applicationFormRef"
        :model="applicationForm"
        :rules="formRules"
        label-width="120px"
        style="max-height: 500px; overflow-y: auto;"
      >
        <el-form-item label="供应商名称" prop="vendorName">
          <el-input v-model="applicationForm.vendorName" placeholder="请输入供应商名称" clearable></el-input>
        </el-form-item>
        <el-form-item label="供应商联系人" prop="vendorContact">
          <el-input v-model="applicationForm.vendorContact" placeholder="请输入联系人姓名" clearable></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="applicationForm.contactPhone" placeholder="请输入联系电话" clearable></el-input>
        </el-form-item>
        <el-form-item label="申请金额" prop="amount">
          <el-input
            v-model.number="applicationForm.amount"
            type="number"
            placeholder="请输入申请金额"
            :min="0"
            :step="0.01"
          ></el-input>
        </el-form-item>
        <el-form-item label="付款类型" prop="paymentType">
          <el-select v-model="applicationForm.paymentType" placeholder="请选择付款类型">
            <el-option label="采购付款" value="purchase"></el-option>
            <el-option label="服务费" value="service"></el-option>
            <el-option label="报销" value="reimbursement"></el-option>
            <el-option label="工资" value="salary"></el-option>
            <el-option label="其他" value="other"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="付款方式" prop="paymentMethod">
          <el-select v-model="applicationForm.paymentMethod" placeholder="请选择付款方式">
            <el-option label="银行转账" value="bankTransfer"></el-option>
            <el-option label="支付宝" value="alipay"></el-option>
            <el-option label="微信支付" value="wechat"></el-option>
            <el-option label="支票" value="check"></el-option>
            <el-option label="现金" value="cash"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="收款账户" prop="receivingAccount">
          <el-input v-model="applicationForm.receivingAccount" placeholder="请输入收款账户" clearable></el-input>
        </el-form-item>
        <el-form-item label="开户行" prop="bankName">
          <el-input v-model="applicationForm.bankName" placeholder="请输入开户行" clearable></el-input>
        </el-form-item>
        <el-form-item label="预计付款日期" prop="dueDate">
          <el-date-picker
            v-model="applicationForm.dueDate"
            type="date"
            placeholder="请选择付款日期"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="付款说明" prop="description">
          <el-input
            v-model="applicationForm.description"
            type="textarea"
            placeholder="请输入付款说明"
            :rows="3"
          ></el-input>
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon> 选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">只能上传jpg/png/pdf文件，且不超过5MB</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailsVisible" title="付款申请详情" width="600px">
      <div class="detail-section">
        <div class="detail-header">
          <h3>{{ applicationDetails.applicationNumber }}</h3>
          <el-tag :type="getStatusTag(applicationDetails.status)">{{ getStatusText(applicationDetails.status) }}</el-tag>
        </div>
        <div class="detail-info">
          <div class="detail-row">
            <span class="detail-label">供应商名称：</span>
            <span class="detail-value">{{ applicationDetails.vendorName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">申请金额：</span>
            <span class="detail-value amount">{{ formatCurrency(applicationDetails.amount) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">付款类型：</span>
            <span class="detail-value">{{ getPaymentTypeText(applicationDetails.paymentType) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">付款方式：</span>
            <span class="detail-value">{{ getPaymentMethodText(applicationDetails.paymentMethod) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">申请人：</span>
            <span class="detail-value">{{ applicationDetails.applicant }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">申请日期：</span>
            <span class="detail-value">{{ formatDate(applicationDetails.applicationDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">预计付款日期：</span>
            <span class="detail-value" :class="{ 'overdue': isOverdue(applicationDetails.dueDate) }">
              {{ formatDate(applicationDetails.dueDate) }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">收款账户：</span>
            <span class="detail-value">{{ applicationDetails.receivingAccount }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">开户行：</span>
            <span class="detail-value">{{ applicationDetails.bankName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">付款说明：</span>
            <span class="detail-value">{{ applicationDetails.description }}</span>
          </div>
        </div>
        
        <!-- 审批流程 -->
        <div class="approval-flow" v-if="applicationDetails.approvalHistory && applicationDetails.approvalHistory.length > 0">
          <h4>审批流程</h4>
          <div class="approval-steps">
            <div
              v-for="(step, index) in applicationDetails.approvalHistory"
              :key="index"
              class="approval-step"
              :class="{ 'current': index === currentStepIndex, 'completed': index < currentStepIndex }"
            >
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-content">
                <div class="step-title">{{ step.approver }} - {{ step.action === 'approve' ? '已批准' : '已拒绝' }}</div>
                <div class="step-time">{{ formatDateTime(step.approveTime) }}</div>
                <div class="step-comment" v-if="step.comment">{{ step.comment }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 标记付款对话框 -->
    <el-dialog v-model="markPaidVisible" title="标记付款" width="500px">
      <el-form
        ref="markPaidFormRef"
        :model="markPaidForm"
        :rules="markPaidRules"
        label-width="100px"
      >
        <el-form-item label="实际付款日期" prop="actualPaidDate">
          <el-date-picker
            v-model="markPaidForm.actualPaidDate"
            type="date"
            placeholder="请选择付款日期"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="实际付款金额" prop="actualAmount">
          <el-input
            v-model.number="markPaidForm.actualAmount"
            type="number"
            placeholder="请输入实际付款金额"
            :min="0"
            :step="0.01"
          ></el-input>
        </el-form-item>
        <el-form-item label="付款凭证号" prop="paymentProofNumber">
          <el-input v-model="markPaidForm.paymentProofNumber" placeholder="请输入付款凭证号" clearable></el-input>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="markPaidForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="2"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="markPaidVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMarkPaid">确认付款</el-button>
      </template>
    </el-dialog>

    <!-- 审批对话框 -->
    <el-dialog v-model="approvalVisible" title="审批付款申请" width="500px">
      <div class="approval-info">
        <div class="approval-application-info">
          <div class="info-row">
            <span class="info-label">申请单号：</span>
            <span class="info-value">{{ currentApproval?.applicationNumber }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">供应商：</span>
            <span class="info-value">{{ currentApproval?.vendorName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">申请金额：</span>
            <span class="info-value amount">{{ formatCurrency(currentApproval?.amount) }}</span>
          </div>
        </div>
        <el-form
          ref="approvalFormRef"
          :model="approvalForm"
          :rules="approvalRules"
          label-width="100px"
          style="margin-top: 20px;"
        >
          <el-form-item label="审批结果" prop="approvalResult">
            <el-radio-group v-model="approvalForm.approvalResult">
              <el-radio label="approve">批准</el-radio>
              <el-radio label="reject">拒绝</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="审批意见" prop="comment">
            <el-input
              v-model="approvalForm.comment"
              type="textarea"
              placeholder="请输入审批意见"
              :rows="3"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="approvalVisible = false">取消</el-button>
        <el-button type="primary" @click="submitApproval">提交审批</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Download, Printer, Upload } from '@element-plus/icons-vue';

export default {
  name: 'PaymentApplication',
  components: {
    Plus,
    Delete,
    Download,
    Printer,
    Upload
  },
  setup() {
    // 状态管理
    const loading = ref(false);
    const dialogVisible = ref(false);
    const detailsVisible = ref(false);
    const markPaidVisible = ref(false);
    const approvalVisible = ref(false);
    const dialogType = ref('create');
    const selectedApplications = ref([]);
    const applicationFormRef = ref(null);
    const markPaidFormRef = ref(null);
    const approvalFormRef = ref(null);
    const fileList = ref([]);
    const currentStepIndex = ref(0);
    
    // 分页
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10
    });

    // 搜索表单
    const searchForm = reactive({
      applicationNumber: '',
      vendorName: '',
      status: '',
      applicant: '',
      applicationDateRange: []
    });

    // 应用表单
    const applicationForm = reactive({
      id: '',
      applicationNumber: '',
      vendorName: '',
      vendorContact: '',
      contactPhone: '',
      amount: null,
      paymentType: 'purchase',
      paymentMethod: 'bankTransfer',
      receivingAccount: '',
      bankName: '',
      dueDate: '',
      description: '',
      status: 'pending'
    });

    // 标记付款表单
    const markPaidForm = reactive({
      actualPaidDate: '',
      actualAmount: null,
      paymentProofNumber: '',
      remark: ''
    });

    // 审批表单
    const approvalForm = reactive({
      approvalResult: 'approve',
      comment: ''
    });

    // 详情数据
    const applicationDetails = reactive({
      id: '',
      applicationNumber: '',
      vendorName: '',
      vendorContact: '',
      contactPhone: '',
      amount: 0,
      paymentType: '',
      paymentMethod: '',
      receivingAccount: '',
      bankName: '',
      dueDate: '',
      applicationDate: '',
      applicant: '',
      description: '',
      status: '',
      approvalHistory: []
    });

    // 当前审批项
    const currentApproval = ref(null);

    // 模拟数据
    const paymentApplications = ref([
      {
        id: 1,
        applicationNumber: 'PAY-202401001',
        vendorName: '北京电子元件供应商',
        vendorContact: '张三',
        contactPhone: '13812345678',
        amount: 65000.00,
        paymentType: 'purchase',
        paymentMethod: 'bankTransfer',
        receivingAccount: '6222020200012345678',
        bankName: '中国工商银行北京分行',
        dueDate: new Date(Date.now() + 86400000 * 5),
        applicationDate: new Date(Date.now() - 86400000 * 2),
        applicant: '李四',
        description: '采购电子元件一批',
        status: 'processing',
        approvalHistory: [
          {
            approver: '部门经理',
            action: 'approve',
            approveTime: new Date(Date.now() - 86400000 * 1),
            comment: '同意，请财务审核'
          }
        ]
      },
      {
        id: 2,
        applicationNumber: 'PAY-202401002',
        vendorName: '上海物流公司',
        vendorContact: '王五',
        contactPhone: '13987654321',
        amount: 32000.00,
        paymentType: 'service',
        paymentMethod: 'bankTransfer',
        receivingAccount: '6222020200087654321',
        bankName: '中国工商银行上海分行',
        dueDate: new Date(Date.now() - 86400000 * 2),
        applicationDate: new Date(Date.now() - 86400000 * 7),
        applicant: '赵六',
        description: '支付物流服务费',
        status: 'approved',
        approvalHistory: [
          {
            approver: '部门经理',
            action: 'approve',
            approveTime: new Date(Date.now() - 86400000 * 6),
            comment: '同意'
          },
          {
            approver: '财务经理',
            action: 'approve',
            approveTime: new Date(Date.now() - 86400000 * 5),
            comment: '同意付款'
          }
        ]
      },
      {
        id: 3,
        applicationNumber: 'PAY-202401003',
        vendorName: '广州办公设备供应商',
        vendorContact: '钱七',
        contactPhone: '13711223344',
        amount: 48000.00,
        paymentType: 'purchase',
        paymentMethod: 'bankTransfer',
        receivingAccount: '6222020200056789012',
        bankName: '中国工商银行广州分行',
        dueDate: new Date(Date.now() + 86400000 * 10),
        applicationDate: new Date(Date.now() - 86400000 * 1),
        applicant: '孙八',
        description: '采购办公设备',
        status: 'pending',
        approvalHistory: []
      },
      {
        id: 4,
        applicationNumber: 'PAY-202401004',
        vendorName: '深圳技术服务公司',
        vendorContact: '周九',
        contactPhone: '13655667788',
        amount: 95000.00,
        paymentType: 'service',
        paymentMethod: 'bankTransfer',
        receivingAccount: '6222020200090123456',
        bankName: '中国工商银行深圳分行',
        dueDate: new Date(Date.now() - 86400000 * 10),
        applicationDate: new Date(Date.now() - 86400000 * 15),
        applicant: '吴十',
        description: '技术服务费',
        status: 'rejected',
        approvalHistory: [
          {
            approver: '部门经理',
            action: 'reject',
            approveTime: new Date(Date.now() - 86400000 * 14),
            comment: '需要提供更详细的服务清单'
          }
        ]
      },
      {
        id: 5,
        applicationNumber: 'PAY-202401005',
        vendorName: '成都软件开发公司',
        vendorContact: '郑十一',
        contactPhone: '13599887766',
        amount: 120000.00,
        paymentType: 'service',
        paymentMethod: 'bankTransfer',
        receivingAccount: '6222020200034567890',
        bankName: '中国工商银行成都分行',
        dueDate: new Date(Date.now() - 86400000 * 30),
        applicationDate: new Date(Date.now() - 86400000 * 40),
        applicant: '王十二',
        description: '软件开发服务费用',
        status: 'paid',
        approvalHistory: [
          {
            approver: '部门经理',
            action: 'approve',
            approveTime: new Date(Date.now() - 86400000 * 39),
            comment: '同意'
          },
          {
            approver: '财务经理',
            action: 'approve',
            approveTime: new Date(Date.now() - 86400000 * 38),
            comment: '同意付款'
          }
        ]
      },
      {
        id: 6,
        applicationNumber: 'PAY-202401006',
        vendorName: '办公用品供应商',
        vendorContact: '陈十三',
        contactPhone: '13477889900',
        amount: 15000.00,
        paymentType: 'purchase',
        paymentMethod: 'alipay',
        receivingAccount: 'chen123@alipay.com',
        bankName: '支付宝',
        dueDate: new Date(Date.now() + 86400000 * 15),
        applicationDate: new Date(Date.now() - 86400000 * 3),
        applicant: '林十四',
        description: '办公用品采购',
        status: 'processing',
        approvalHistory: [
          {
            approver: '部门经理',
            action: 'approve',
            approveTime: new Date(Date.now() - 86400000 * 2),
            comment: '同意'
          }
        ]
      },
      {
        id: 7,
        applicationNumber: 'PAY-202401007',
        vendorName: '网络服务商',
        vendorContact: '黄十五',
        contactPhone: '13366778899',
        amount: 8000.00,
        paymentType: 'service',
        paymentMethod: 'bankTransfer',
        receivingAccount: '6222020200045678901',
        bankName: '中国建设银行北京分行',
        dueDate: new Date(Date.now() + 86400000 * 20),
        applicationDate: new Date(Date.now()),
        applicant: '刘十六',
        description: '网络服务年费',
        status: 'pending',
        approvalHistory: []
      }
    ]);

    // 表单验证规则
    const formRules = {
      vendorName: [
        { required: true, message: '请输入供应商名称', trigger: 'blur' }
      ],
      amount: [
        { required: true, message: '请输入申请金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
      ],
      paymentType: [
        { required: true, message: '请选择付款类型', trigger: 'change' }
      ],
      dueDate: [
        { required: true, message: '请选择预计付款日期', trigger: 'change' }
      ]
    };

    const markPaidRules = {
      actualPaidDate: [
        { required: true, message: '请选择实际付款日期', trigger: 'change' }
      ],
      actualAmount: [
        { required: true, message: '请输入实际付款金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
      ]
    };

    const approvalRules = {
      approvalResult: [
        { required: true, message: '请选择审批结果', trigger: 'change' }
      ],
      comment: [
        { required: true, message: '请输入审批意见', trigger: 'blur' }
      ]
    };

    // 计算属性 - 筛选后的应用列表
    const filteredApplications = computed(() => {
      return paymentApplications.value.filter(app => {
        let match = true;
        
        if (searchForm.applicationNumber && !app.applicationNumber.includes(searchForm.applicationNumber)) {
          match = false;
        }
        if (searchForm.vendorName && !app.vendorName.includes(searchForm.vendorName)) {
          match = false;
        }
        if (searchForm.status && app.status !== searchForm.status) {
          match = false;
        }
        if (searchForm.applicant && !app.applicant.includes(searchForm.applicant)) {
          match = false;
        }
        if (searchForm.applicationDateRange && searchForm.applicationDateRange.length === 2) {
          const startDate = new Date(searchForm.applicationDateRange[0]);
          const endDate = new Date(searchForm.applicationDateRange[1]);
          const appDate = new Date(app.applicationDate);
          if (appDate < startDate || appDate > endDate) {
            match = false;
          }
        }
        
        return match;
      });
    });

    // 统计数据
    const pendingCount = computed(() => {
      return paymentApplications.value.filter(app => app.status === 'pending').length;
    });

    const pendingAmount = computed(() => {
      return paymentApplications.value
        .filter(app => app.status === 'pending')
        .reduce((sum, app) => sum + app.amount, 0);
    });

    const paidCount = computed(() => {
      return paymentApplications.value.filter(app => app.status === 'paid').length;
    });

    const paidAmount = computed(() => {
      return paymentApplications.value
        .filter(app => app.status === 'paid')
        .reduce((sum, app) => sum + app.amount, 0);
    });

    const upcomingCount = computed(() => {
      const today = new Date();
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      
      return paymentApplications.value.filter(app => {
        if (app.status !== 'approved' && app.status !== 'pending' && app.status !== 'processing') return false;
        const dueDate = new Date(app.dueDate);
        return dueDate >= today && dueDate <= threeDaysLater;
      }).length;
    });

    const upcomingAmount = computed(() => {
      const today = new Date();
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      
      return paymentApplications.value
        .filter(app => {
          if (app.status !== 'approved' && app.status !== 'pending' && app.status !== 'processing') return false;
          const dueDate = new Date(app.dueDate);
          return dueDate >= today && dueDate <= threeDaysLater;
        })
        .reduce((sum, app) => sum + app.amount, 0);
    });

    const overdueCount = computed(() => {
      const today = new Date();
      return paymentApplications.value.filter(app => {
        if (app.status !== 'approved' && app.status !== 'pending' && app.status !== 'processing') return false;
        return new Date(app.dueDate) < today;
      }).length;
    });

    const overdueAmount = computed(() => {
      const today = new Date();
      return paymentApplications.value
        .filter(app => {
          if (app.status !== 'approved' && app.status !== 'pending' && app.status !== 'processing') return false;
          return new Date(app.dueDate) < today;
        })
        .reduce((sum, app) => sum + app.amount, 0);
    });

    const totalAmount = computed(() => {
      // 计算本月申请总额
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      return paymentApplications.value
        .filter(app => {
          const appDate = new Date(app.applicationDate);
          return appDate >= startOfMonth && appDate <= endOfMonth;
        })
        .reduce((sum, app) => sum + app.amount, 0);
    });

    const monthlyChange = ref(15.2); // 模拟月度变化率

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 格式化日期时间
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${value.toFixed(2)} 元`;
    };

    // 获取付款类型标签
    const getPaymentTypeTag = (type) => {
      switch (type) {
        case 'purchase': return 'primary';
        case 'service': return 'success';
        case 'reimbursement': return 'warning';
        case 'salary': return 'info';
        case 'other': return 'info';
        default: return 'info';
      }
    };

    // 获取付款类型文本
    const getPaymentTypeText = (type) => {
      switch (type) {
        case 'purchase': return '采购付款';
        case 'service': return '服务费';
        case 'reimbursement': return '报销';
        case 'salary': return '工资';
        case 'other': return '其他';
        default: return '未知';
      }
    };

    // 获取付款方式文本
    const getPaymentMethodText = (method) => {
      switch (method) {
        case 'bankTransfer': return '银行转账';
        case 'alipay': return '支付宝';
        case 'wechat': return '微信支付';
        case 'check': return '支票';
        case 'cash': return '现金';
        default: return '未知';
      }
    };

    // 获取状态标签
    const getStatusTag = (status) => {
      switch (status) {
        case 'pending': return 'warning';
        case 'processing': return 'primary';
        case 'approved': return 'success';
        case 'rejected': return 'danger';
        case 'paid': return 'info';
        case 'cancelled': return 'info';
        default: return 'info';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待审批';
        case 'processing': return '审批中';
        case 'approved': return '已批准';
        case 'rejected': return '已拒绝';
        case 'paid': return '已付款';
        case 'cancelled': return '已取消';
        default: return '未知';
      }
    };

    // 判断是否逾期
    const isOverdue = (dueDate) => {
      if (!dueDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(dueDate) < today;
    };

    // 生成申请单号
    const generateApplicationNumber = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      return `PAY-${year}${month}${day}${random}`;
    };

    // 重置表单
    const resetForm = () => {
      if (applicationFormRef.value) {
        applicationFormRef.value.resetFields();
      }
      Object.assign(applicationForm, {
        id: '',
        applicationNumber: '',
        vendorName: '',
        vendorContact: '',
        contactPhone: '',
        amount: null,
        paymentType: 'purchase',
        paymentMethod: 'bankTransfer',
        receivingAccount: '',
        bankName: '',
        dueDate: '',
        description: '',
        status: 'pending'
      });
      fileList.value = [];
    };

    // 搜索
    const handleSearch = () => {
      loading.value = true;
      // 模拟API调用
      setTimeout(() => {
        loading.value = false;
        ElMessage.success('搜索成功');
      }, 300);
    };

    // 重置搜索
    const resetSearch = () => {
      Object.assign(searchForm, {
        applicationNumber: '',
        vendorName: '',
        status: '',
        applicant: '',
        applicationDateRange: []
      });
      handleSearch();
    };

    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedApplications.value = selection;
    };

    // 处理行点击
    const handleRowClick = (row, column, event) => {
      // 如果点击的不是选择框，不处理
      if (column.type !== 'selection') {
        // 可以添加行点击的处理逻辑
      }
    };

    // 创建新申请
    const createApplication = () => {
      dialogType.value = 'create';
      resetForm();
      dialogVisible.value = true;
    };

    // 编辑申请
    const editApplication = (row) => {
      dialogType.value = 'edit';
      Object.assign(applicationForm, row);
      dialogVisible.value = true;
    };

    // 查看详情
    const viewDetails = (row) => {
      Object.assign(applicationDetails, row);
      // 计算当前步骤索引
      if (row.status === 'approved' || row.status === 'paid') {
        currentStepIndex.value = row.approvalHistory.length;
      } else if (row.status === 'rejected') {
        currentStepIndex.value = row.approvalHistory.length;
      } else {
        currentStepIndex.value = row.approvalHistory.length;
      }
      detailsVisible.value = true;
    };

    // 取消申请
    const cancelApplication = (row) => {
      ElMessageBox.confirm(`确定要取消申请"${row.applicationNumber}"吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = paymentApplications.value.findIndex(app => app.id === row.id);
        if (index !== -1) {
          paymentApplications.value[index].status = 'cancelled';
          ElMessage.success('申请已取消');
        }
      }).catch(() => {});
    };

    // 标记为已付款
    const markAsPaid = (row) => {
      currentApproval.value = row;
      Object.assign(markPaidForm, {
        actualPaidDate: new Date(),
        actualAmount: row.amount,
        paymentProofNumber: '',
        remark: ''
      });
      markPaidVisible.value = true;
    };

    // 批量删除
    const batchDelete = () => {
      if (selectedApplications.value.length === 0) {
        ElMessage.warning('请先选择要删除的申请');
        return;
      }
      
      ElMessageBox.confirm(`确定要删除选中的${selectedApplications.value.length}个申请吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const idsToDelete = selectedApplications.value.map(app => app.id);
        paymentApplications.value = paymentApplications.value.filter(app => !idsToDelete.includes(app.id));
        selectedApplications.value = [];
        ElMessage.success('删除成功');
      }).catch(() => {});
    };

    // 导出数据
    const exportData = () => {
      ElMessageBox.confirm('请选择导出格式', '导出数据', {
        confirmButtonText: 'Excel',
        cancelButtonText: 'PDF',
        type: 'info'
      }).then(() => {
        ElMessage.success('Excel文件导出中...');
      }).catch(() => {
        ElMessage.success('PDF文件导出中...');
      });
    };

    // 打印选中
    const printData = () => {
      if (selectedApplications.value.length === 0) {
        ElMessage.warning('请先选择要打印的申请');
        return;
      }
      ElMessage.success(`正在打印${selectedApplications.value.length}个申请...`);
    };

    // 提交表单
    const submitForm = () => {
      applicationFormRef.value.validate((valid) => {
        if (valid) {
          if (dialogType.value === 'create') {
            // 创建新申请
            const newApplication = {
              ...applicationForm,
              id: Date.now(),
              applicationNumber: generateApplicationNumber(),
              applicationDate: new Date(),
              applicant: '当前用户', // 实际项目中应从登录信息获取
              approvalHistory: []
            };
            paymentApplications.value.unshift(newApplication);
            ElMessage.success('申请创建成功');
          } else {
            // 编辑现有申请
            const index = paymentApplications.value.findIndex(app => app.id === applicationForm.id);
            if (index !== -1) {
              paymentApplications.value[index] = { ...applicationForm };
              ElMessage.success('申请更新成功');
            }
          }
          dialogVisible.value = false;
        }
      });
    };

    // 提交标记付款
    const submitMarkPaid = () => {
      markPaidFormRef.value.validate((valid) => {
        if (valid) {
          if (currentApproval.value) {
            const index = paymentApplications.value.findIndex(app => app.id === currentApproval.value.id);
            if (index !== -1) {
              paymentApplications.value[index].status = 'paid';
              paymentApplications.value[index].actualPaidDate = markPaidForm.actualPaidDate;
              paymentApplications.value[index].actualAmount = markPaidForm.actualAmount;
              paymentApplications.value[index].paymentProofNumber = markPaidForm.paymentProofNumber;
              paymentApplications.value[index].paymentRemark = markPaidForm.remark;
              ElMessage.success('付款标记成功');
            }
          }
          markPaidVisible.value = false;
        }
      });
    };

    // 提交审批
    const submitApproval = () => {
      approvalFormRef.value.validate((valid) => {
        if (valid) {
          if (currentApproval.value) {
            const index = paymentApplications.value.findIndex(app => app.id === currentApproval.value.id);
            if (index !== -1) {
              const newHistory = {
                approver: '当前审批人', // 实际项目中应从登录信息获取
                action: approvalForm.approvalResult,
                approveTime: new Date(),
                comment: approvalForm.comment
              };
              
              paymentApplications.value[index].approvalHistory.push(newHistory);
              
              if (approvalForm.approvalResult === 'reject') {
                paymentApplications.value[index].status = 'rejected';
              } else {
                // 简化的审批流程，实际项目中可能需要更复杂的流程控制
                if (paymentApplications.value[index].approvalHistory.length >= 2) {
                  paymentApplications.value[index].status = 'approved';
                } else {
                  paymentApplications.value[index].status = 'processing';
                }
              }
              
              ElMessage.success('审批提交成功');
            }
          }
          approvalVisible.value = false;
        }
      });
    };

    // 处理对话框关闭
    const handleDialogClose = () => {
      if (dialogType.value === 'create') {
        resetForm();
      }
      dialogVisible.value = false;
    };

    // 处理文件变化
    const handleFileChange = (file, fileList) => {
      // 处理文件上传逻辑
      console.log('File changed:', file);
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
    };

    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
    };

    // 生命周期
    onMounted(() => {
      // 模拟加载数据
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
      }, 500);
    });

    return {
      loading,
      dialogVisible,
      detailsVisible,
      markPaidVisible,
      approvalVisible,
      dialogType,
      selectedApplications,
      applicationFormRef,
      markPaidFormRef,
      approvalFormRef,
      fileList,
      currentStepIndex,
      pagination,
      searchForm,
      applicationForm,
      markPaidForm,
      approvalForm,
      applicationDetails,
      currentApproval,
      filteredApplications,
      pendingCount,
      pendingAmount,
      paidCount,
      paidAmount,
      upcomingCount,
      upcomingAmount,
      overdueCount,
      overdueAmount,
      totalAmount,
      monthlyChange,
      formRules,
      markPaidRules,
      approvalRules,
      formatDate,
      formatDateTime,
      formatCurrency,
      getPaymentTypeTag,
      getPaymentTypeText,
      getPaymentMethodText,
      getStatusTag,
      getStatusText,
      isOverdue,
      handleSearch,
      resetSearch,
      handleSelectionChange,
      handleRowClick,
      createApplication,
      editApplication,
      viewDetails,
      cancelApplication,
      markAsPaid,
      batchDelete,
      exportData,
      printData,
      submitForm,
      submitMarkPaid,
      submitApproval,
      handleDialogClose,
      handleFileChange,
      handleSizeChange,
      handleCurrentChange
    };
  }
};
</script>

<style scoped>
.payment-application {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0 0 0;
  color: #303133;
}

.search-card {
  margin-bottom: 20px;
}

/* 统计样式 */
.statistics {
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s ease;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.primary {
  border-left: 4px solid #409eff;
}

.stat-card.success {
  border-left: 4px solid #67c23a;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.danger {
  border-left: 4px solid #f56c6c;
}

.stat-card.info {
  border-left: 4px solid #909399;
}

.stat-content {
  text-align: center;
  padding: 15px 0;
}

.stat-content.full-width {
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.stat-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-value-large {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-amount {
  font-size: 16px;
  color: #67c23a;
  font-weight: 500;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 10px;
}

.change-label {
  color: #606266;
  font-size: 14px;
}

.change-value {
  font-size: 16px;
  font-weight: bold;
}

.change-value.positive {
  color: #f56c6c;
}

.change-value.negative {
  color: #67c23a;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

/* 表格样式 */
.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情页样式 */
.detail-section {
  padding: 10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.detail-info {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  margin-bottom: 15px;
  line-height: 24px;
}

.detail-label {
  width: 120px;
  color: #606266;
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: #303133;
}

.detail-value.amount {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}

/* 审批流程样式 */
.approval-flow {
  margin-top: 30px;
}

.approval-flow h4 {
  margin-bottom: 15px;
  color: #303133;
}

.approval-steps {
  padding-left: 20px;
}

.approval-step {
  position: relative;
  padding-left: 30px;
  padding-bottom: 20px;
}

.approval-step:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 24px;
  bottom: 0;
  width: 2px;
  background-color: #e4e7ed;
}

.step-number {
  position: absolute;
  left: 0;
  top: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #e4e7ed;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.approval-step.completed .step-number {
  background-color: #67c23a;
  color: white;
}

.approval-step.current .step-number {
  background-color: #409eff;
  color: white;
}

.step-content {
  background-color: #f5f7fa;
  padding: 10px 15px;
  border-radius: 4px;
}

.step-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.step-time {
  color: #909399;
  font-size: 12px;
  margin-bottom: 5px;
}

.step-comment {
  color: #606266;
  font-size: 14px;
  padding-top: 5px;
  border-top: 1px solid #e4e7ed;
  margin-top: 5px;
}

/* 审批信息样式 */
.approval-info {
  padding: 10px;
}

.approval-application-info {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
  line-height: 24px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.info-value {
  flex: 1;
  color: #303133;
}

.info-value.amount {
  color: #f56c6c;
  font-weight: bold;
}
</style>