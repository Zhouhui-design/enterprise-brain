<template>
  <div class="payment-follow-up">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>财务管理</el-breadcrumb-item>
      <el-breadcrumb-item>尾款跟催</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="content-container">
      <div class="header">
        <h1>尾款跟催</h1>
        <div class="header-actions">
          <el-button type="primary" @click="followUpSelected" :disabled="selectedRows.length === 0">批量跟催</el-button>
          <el-button type="success" @click="exportData">导出数据</el-button>
          <el-button @click="printSelected" :disabled="selectedRows.length === 0">打印选中</el-button>
          <el-button @click="refreshData">刷新</el-button>
        </div>
      </div>

      <!-- 搜索筛选区域 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="订单编号">
          <el-input v-model="searchForm.orderNumber" placeholder="请输入订单编号" />
        </el-form-item>
        <el-form-item label="跟催状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="待跟催" value="pending" />
            <el-option label="跟进中" value="following" />
            <el-option label="已付款" value="paid" />
            <el-option label="已逾期" value="overdue" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="searchForm.followUpPerson" placeholder="请选择负责人">
            <el-option label="全部" value="" />
            <el-option label="张三" value="zhangsan" />
            <el-option label="李四" value="lisi" />
            <el-option label="王五" value="wangwu" />
            <el-option label="赵六" value="zhaoliu" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款期限">
          <el-date-picker
            v-model="searchForm.paymentDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据统计 -->
      <div class="stats-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">待跟催订单</div>
                <div class="stat-value primary">{{ pendingCount }}</div>
                <div class="stat-desc">金额: {{ pendingAmount.toFixed(2) }} 元</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">逾期订单</div>
                <div class="stat-value danger">{{ overdueCount }}</div>
                <div class="stat-desc">金额: {{ overdueAmount.toFixed(2) }} 元</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">本月已回款</div>
                <div class="stat-value success">{{ monthlyPaymentAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ monthlyPaymentCount }} 笔</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">未回款总额</div>
                <div class="stat-value warning">{{ totalUnpaidAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ totalUnpaidCount }} 笔</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 跟催提醒图表 -->
      <div class="chart-container">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>跟催提醒统计</span>
              <el-select v-model="chartTimeRange" style="width: 150px;">
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
                <el-option label="本季度" value="quarter" />
              </el-select>
            </div>
          </template>
          <div id="reminderChart" class="chart"></div>
        </el-card>
      </div>

      <!-- 跟催列表 -->
      <el-table
        v-loading="loading"
        :data="paymentList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="orderNumber" label="订单编号" width="150">
          <template #default="{ row }">
            <a href="#" @click.stop="viewOrderDetails(row)">{{ row.orderNumber }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户名称" width="180" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="totalAmount" label="订单总额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已付金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.paidAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remainingAmount" label="剩余尾款" width="120" align="right">
          <template #default="{ row }">
            <span class="font-bold text-danger">{{ formatCurrency(row.remainingAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentDate" label="付款期限" width="130">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row.paymentDate) }">
              {{ formatDate(row.paymentDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="daysRemaining" label="剩余天数" width="100" align="center">
          <template #default="{ row }">
            <span :class="getDaysClass(row.daysRemaining)">
              {{ row.daysRemaining >= 0 ? `还剩${row.daysRemaining}天` : `逾期${Math.abs(row.daysRemaining)}天` }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="followUpPerson" label="负责人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastFollowUpDate" label="最后跟进" width="130">
          <template #default="{ row }">
            {{ row.lastFollowUpDate ? formatDate(row.lastFollowUpDate) : '未跟进' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'paid' && row.status !== 'completed'"
              type="primary"
              size="small"
              @click="followUpOrder(row)"
            >
              跟进
            </el-button>
            <el-button
              v-if="row.status !== 'paid' && row.status !== 'completed'"
              type="success"
              size="small"
              @click="markAsPaid(row)"
            >
              标记已付
            </el-button>
            <el-button size="small" @click="viewFollowUpHistory(row)">跟进记录</el-button>
            <el-button size="small" @click="editOrder(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 跟催对话框 -->
    <el-dialog
      v-model="followUpDialogVisible"
      title="订单跟进"
      width="600px"
      @close="resetFollowUpForm"
    >
      <el-form
        ref="followUpFormRef"
        :model="followUpForm"
        :rules="followUpRules"
        label-width="120px"
      >
        <el-form-item label="订单编号">
          <el-input v-model="followUpForm.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="followUpForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="剩余尾款">
          <el-input v-model="followUpForm.remainingAmount" disabled />
        </el-form-item>
        <el-form-item label="跟进方式" prop="followUpType">
          <el-radio-group v-model="followUpForm.followUpType">
            <el-radio label="phone">电话</el-radio>
            <el-radio label="email">邮件</el-radio>
            <el-radio label="sms">短信</el-radio>
            <el-radio label="visit">拜访</el-radio>
            <el-radio label="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="跟进时间" prop="followUpDate">
          <el-date-picker
            v-model="followUpForm.followUpDate"
            type="datetime"
            placeholder="请选择跟进时间"
          />
        </el-form-item>
        <el-form-item label="跟进人" prop="followUpPerson">
          <el-select v-model="followUpForm.followUpPerson" placeholder="请选择跟进人">
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
            <el-option label="赵六" value="赵六" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户反馈" prop="feedback">
          <el-select v-model="followUpForm.feedback" placeholder="请选择客户反馈">
            <el-option label="已承诺付款" value="promised" />
            <el-option label="正在审批" value="approving" />
            <el-option label="资金紧张" value="cash_strapped" />
            <el-option label="质量问题" value="quality_issue" />
            <el-option label="其他原因" value="other_reason" />
          </el-select>
        </el-form-item>
        <el-form-item label="预计付款时间" prop="expectedPaymentDate">
          <el-date-picker
            v-model="followUpForm.expectedPaymentDate"
            type="date"
            placeholder="请选择预计付款时间"
          />
        </el-form-item>
        <el-form-item label="跟进内容" prop="content">
          <el-input
            v-model="followUpForm.content"
            type="textarea"
            placeholder="请输入跟进内容"
            rows="4"
          />
        </el-form-item>
        <el-form-item label="下次跟进时间" prop="nextFollowUpDate">
          <el-date-picker
            v-model="followUpForm.nextFollowUpDate"
            type="date"
            placeholder="请选择下次跟进时间"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="followUpForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="followUpDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFollowUp">保存记录</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 跟进历史对话框 -->
    <el-dialog
      v-model="historyDialogVisible"
      title="跟进历史"
      width="700px"
    >
      <div v-if="currentOrder" class="history-content">
        <div class="order-info">
          <h3>{{ currentOrder.customerName }} - {{ currentOrder.orderNumber }}</h3>
          <el-descriptions border :column="2">
            <el-descriptions-item label="订单总额">{{ formatCurrency(currentOrder.totalAmount) }}</el-descriptions-item>
            <el-descriptions-item label="已付金额">{{ formatCurrency(currentOrder.paidAmount) }}</el-descriptions-item>
            <el-descriptions-item label="剩余尾款">{{ formatCurrency(currentOrder.remainingAmount) }}</el-descriptions-item>
            <el-descriptions-item label="付款期限">{{ formatDate(currentOrder.paymentDate) }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">{{ getStatusText(currentOrder.status) }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ currentOrder.followUpPerson }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="follow-up-history">
          <h3>跟进记录</h3>
          <el-timeline v-if="followUpHistory.length > 0">
            <el-timeline-item
              v-for="(item, index) in followUpHistory"
              :key="index"
              :timestamp="formatDateTime(item.followUpDate)"
              :type="getFollowUpType(item.followUpType)"
            >
              <div class="history-item">
                <div class="history-header">
                  <span class="follow-up-person">{{ item.followUpPerson }}</span>
                  <span class="follow-up-type">{{ getFollowUpTypeText(item.followUpType) }}</span>
                </div>
                <div class="history-content">
                  <p>{{ item.content }}</p>
                </div>
                <div class="history-meta">
                  <span v-if="item.feedback" class="feedback">客户反馈: {{ getFeedbackText(item.feedback) }}</span>
                  <span v-if="item.expectedPaymentDate" class="expected-date">预计付款: {{ formatDate(item.expectedPaymentDate) }}</span>
                </div>
                <div v-if="item.remark" class="history-remark">
                  备注: {{ item.remark }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <div v-else class="empty-history">
            <el-empty description="暂无跟进记录" />
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 标记已付对话框 -->
    <el-dialog
      v-model="markPaidDialogVisible"
      title="标记已付款"
      width="600px"
      @close="resetPaidForm"
    >
      <el-form
        ref="paidFormRef"
        :model="paidForm"
        :rules="paidRules"
        label-width="120px"
      >
        <el-form-item label="订单编号">
          <el-input v-model="paidForm.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="paidForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="应付款金额">
          <el-input v-model="paidForm.remainingAmount" disabled />
        </el-form-item>
        <el-form-item label="实际付款金额" prop="actualAmount">
          <el-input
            v-model.number="paidForm.actualAmount"
            type="number"
            placeholder="请输入实际付款金额"
            min="0"
            step="0.01"
          />
        </el-form-item>
        <el-form-item label="付款日期" prop="paymentDate">
          <el-date-picker
            v-model="paidForm.paymentDate"
            type="date"
            placeholder="请选择付款日期"
          />
        </el-form-item>
        <el-form-item label="付款方式" prop="paymentMethod">
          <el-select v-model="paidForm.paymentMethod" placeholder="请选择付款方式">
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="现金" value="cash" />
            <el-option label="支票" value="check" />
            <el-option label="线上支付" value="online" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付流水号" prop="transactionNumber">
          <el-input v-model="paidForm.transactionNumber" placeholder="请输入支付流水号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="paidForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="markPaidDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmMarkPaid">确认付款</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑订单对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑订单信息"
      width="600px"
      @close="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="120px"
      >
        <el-form-item label="订单编号">
          <el-input v-model="editForm.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="editForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="editForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="editForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="订单总额">
          <el-input v-model="editForm.totalAmount" disabled />
        </el-form-item>
        <el-form-item label="已付金额" prop="paidAmount">
          <el-input
            v-model.number="editForm.paidAmount"
            type="number"
            placeholder="请输入已付金额"
            min="0"
            step="0.01"
          />
        </el-form-item>
        <el-form-item label="付款期限" prop="paymentDate">
          <el-date-picker
            v-model="editForm.paymentDate"
            type="date"
            placeholder="请选择付款期限"
          />
        </el-form-item>
        <el-form-item label="负责人" prop="followUpPerson">
          <el-select v-model="editForm.followUpPerson" placeholder="请选择负责人">
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
            <el-option label="赵六" value="赵六" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 模拟图表功能
let chartInstance = null;

export default {
  name: 'PaymentFollowUp',
  setup() {
    // 状态管理
    const loading = ref(false);
    const paymentList = ref([]);
    const selectedRows = ref([]);
    const followUpDialogVisible = ref(false);
    const historyDialogVisible = ref(false);
    const markPaidDialogVisible = ref(false);
    const editDialogVisible = ref(false);
    const currentOrder = ref(null);
    const followUpHistory = ref([]);
    const chartTimeRange = ref('month');

    // 表单引用
    const followUpFormRef = ref(null);
    const paidFormRef = ref(null);
    const editFormRef = ref(null);

    // 搜索表单
    const searchForm = reactive({
      customerName: '',
      orderNumber: '',
      status: '',
      followUpPerson: '',
      paymentDateRange: null
    });

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });

    // 跟进表单
    const followUpForm = reactive({
      orderId: '',
      orderNumber: '',
      customerName: '',
      remainingAmount: 0,
      followUpType: 'phone',
      followUpDate: new Date(),
      followUpPerson: '张三',
      feedback: '',
      expectedPaymentDate: null,
      content: '',
      nextFollowUpDate: null,
      remark: ''
    });

    // 标记已付表单
    const paidForm = reactive({
      orderId: '',
      orderNumber: '',
      customerName: '',
      remainingAmount: 0,
      actualAmount: 0,
      paymentDate: new Date(),
      paymentMethod: 'bank_transfer',
      transactionNumber: '',
      remark: ''
    });

    // 编辑表单
    const editForm = reactive({
      orderId: '',
      orderNumber: '',
      customerName: '',
      contactPerson: '',
      contactPhone: '',
      totalAmount: 0,
      paidAmount: 0,
      paymentDate: null,
      followUpPerson: '',
      remark: ''
    });

    // 表单验证规则
    const followUpRules = {
      followUpType: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
      followUpDate: [{ required: true, message: '请选择跟进时间', trigger: 'change' }],
      followUpPerson: [{ required: true, message: '请选择跟进人', trigger: 'change' }],
      feedback: [{ required: true, message: '请选择客户反馈', trigger: 'change' }],
      content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
    };

    const paidRules = {
      actualAmount: [
        { required: true, message: '请输入实际付款金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '付款金额必须大于0', trigger: 'blur' }
      ],
      paymentDate: [{ required: true, message: '请选择付款日期', trigger: 'change' }],
      paymentMethod: [{ required: true, message: '请选择付款方式', trigger: 'change' }],
      transactionNumber: [{ required: true, message: '请输入支付流水号', trigger: 'blur' }]
    };

    const editRules = {
      contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
      contactPhone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
      ],
      paidAmount: [
        { required: true, message: '请输入已付金额', trigger: 'blur' },
        { type: 'number', min: 0, message: '已付金额必须大于等于0', trigger: 'blur' }
      ],
      paymentDate: [{ required: true, message: '请选择付款期限', trigger: 'change' }],
      followUpPerson: [{ required: true, message: '请选择负责人', trigger: 'change' }]
    };

    // 计算属性
    const pendingCount = computed(() => {
      return paymentList.value.filter(item => item.status === 'pending').length;
    });

    const pendingAmount = computed(() => {
      return paymentList.value
        .filter(item => item.status === 'pending')
        .reduce((sum, item) => sum + item.remainingAmount, 0);
    });

    const overdueCount = computed(() => {
      return paymentList.value.filter(item => item.status === 'overdue').length;
    });

    const overdueAmount = computed(() => {
      return paymentList.value
        .filter(item => item.status === 'overdue')
        .reduce((sum, item) => sum + item.remainingAmount, 0);
    });

    const monthlyPaymentAmount = ref(185000.00);
    const monthlyPaymentCount = ref(12);

    const totalUnpaidAmount = computed(() => {
      return paymentList.value
        .filter(item => item.status !== 'paid' && item.status !== 'completed')
        .reduce((sum, item) => sum + item.remainingAmount, 0);
    });

    const totalUnpaidCount = computed(() => {
      return paymentList.value.filter(item => item.status !== 'paid' && item.status !== 'completed').length;
    });

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
      return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${value.toFixed(2)} 元`;
    };

    // 判断是否逾期
    const isOverdue = (paymentDate) => {
      if (!paymentDate) return false;
      const now = new Date();
      const payment = new Date(paymentDate);
      return payment < now;
    };

    // 获取剩余天数样式
    const getDaysClass = (days) => {
      if (days > 30) return 'text-success';
      if (days > 15) return 'text-primary';
      if (days > 7) return 'text-warning';
      return 'text-danger';
    };

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'pending': return 'warning';
        case 'following': return 'primary';
        case 'overdue': return 'danger';
        case 'paid': return 'success';
        case 'completed': return 'info';
        default: return 'default';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待跟催';
        case 'following': return '跟进中';
        case 'overdue': return '已逾期';
        case 'paid': return '已付款';
        case 'completed': return '已完成';
        default: return '未知';
      }
    };

    // 获取跟进方式类型
    const getFollowUpType = (type) => {
      switch (type) {
        case 'phone': return 'primary';
        case 'email': return 'info';
        case 'sms': return 'warning';
        case 'visit': return 'success';
        default: return 'default';
      }
    };

    // 获取跟进方式文本
    const getFollowUpTypeText = (type) => {
      switch (type) {
        case 'phone': return '电话';
        case 'email': return '邮件';
        case 'sms': return '短信';
        case 'visit': return '拜访';
        case 'other': return '其他';
        default: return '未知';
      }
    };

    // 获取反馈文本
    const getFeedbackText = (feedback) => {
      switch (feedback) {
        case 'promised': return '已承诺付款';
        case 'approving': return '正在审批';
        case 'cash_strapped': return '资金紧张';
        case 'quality_issue': return '质量问题';
        case 'other_reason': return '其他原因';
        default: return '未知';
      }
    };

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
      loadData();
    };

    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
      loadData();
    };

    // 搜索
    const search = () => {
      pagination.currentPage = 1;
      loadData();
    };

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key === 'paymentDateRange') {
          searchForm[key] = null;
        } else {
          searchForm[key] = '';
        }
      });
      pagination.currentPage = 1;
      loadData();
    };

    // 重置跟进表单
    const resetFollowUpForm = () => {
      if (followUpFormRef.value) {
        followUpFormRef.value.resetFields();
      }
      Object.assign(followUpForm, {
        orderId: '',
        orderNumber: '',
        customerName: '',
        remainingAmount: 0,
        followUpType: 'phone',
        followUpDate: new Date(),
        followUpPerson: '张三',
        feedback: '',
        expectedPaymentDate: null,
        content: '',
        nextFollowUpDate: null,
        remark: ''
      });
    };

    // 重置已付表单
    const resetPaidForm = () => {
      if (paidFormRef.value) {
        paidFormRef.value.resetFields();
      }
      Object.assign(paidForm, {
        orderId: '',
        orderNumber: '',
        customerName: '',
        remainingAmount: 0,
        actualAmount: 0,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        transactionNumber: '',
        remark: ''
      });
    };

    // 重置编辑表单
    const resetEditForm = () => {
      if (editFormRef.value) {
        editFormRef.value.resetFields();
      }
      Object.assign(editForm, {
        orderId: '',
        orderNumber: '',
        customerName: '',
        contactPerson: '',
        contactPhone: '',
        totalAmount: 0,
        paidAmount: 0,
        paymentDate: null,
        followUpPerson: '',
        remark: ''
      });
    };

    // 跟进订单
    const followUpOrder = (row) => {
      currentOrder.value = { ...row };
      followUpForm.orderId = row.id;
      followUpForm.orderNumber = row.orderNumber;
      followUpForm.customerName = row.customerName;
      followUpForm.remainingAmount = row.remainingAmount;
      followUpDialogVisible.value = true;
    };

    // 批量跟进
    const followUpSelected = () => {
      ElMessageBox.confirm(`确定要批量跟进选中的 ${selectedRows.value.length} 个订单吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量跟进
        setTimeout(() => {
          ElMessage.success('批量跟进成功');
          selectedRows.value = [];
          loadData();
        }, 500);
      }).catch(() => {});
    };

    // 提交跟进记录
    const submitFollowUp = () => {
      followUpFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟提交
          setTimeout(() => {
            ElMessage.success('跟进记录保存成功');
            followUpDialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 标记已付
    const markAsPaid = (row) => {
      currentOrder.value = { ...row };
      paidForm.orderId = row.id;
      paidForm.orderNumber = row.orderNumber;
      paidForm.customerName = row.customerName;
      paidForm.remainingAmount = row.remainingAmount;
      paidForm.actualAmount = row.remainingAmount;
      markPaidDialogVisible.value = true;
    };

    // 确认标记已付
    const confirmMarkPaid = () => {
      paidFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟提交
          setTimeout(() => {
            ElMessage.success('标记付款成功');
            markPaidDialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 编辑订单
    const editOrder = (row) => {
      currentOrder.value = { ...row };
      editForm.orderId = row.id;
      editForm.orderNumber = row.orderNumber;
      editForm.customerName = row.customerName;
      editForm.contactPerson = row.contactPerson;
      editForm.contactPhone = row.contactPhone;
      editForm.totalAmount = row.totalAmount;
      editForm.paidAmount = row.paidAmount;
      editForm.paymentDate = new Date(row.paymentDate);
      editForm.followUpPerson = row.followUpPerson;
      editForm.remark = row.remark || '';
      editDialogVisible.value = true;
    };

    // 保存编辑
    const saveEdit = () => {
      editFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟保存
          setTimeout(() => {
            ElMessage.success('编辑保存成功');
            editDialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 查看订单详情
    const viewOrderDetails = (row) => {
      ElMessage.info('查看订单详情功能待实现');
    };

    // 查看跟进历史
    const viewFollowUpHistory = (row) => {
      currentOrder.value = { ...row };
      // 模拟加载跟进历史
      followUpHistory.value = [
        {
          id: '1',
          followUpDate: '2024-01-20 10:30:00',
          followUpPerson: '张三',
          followUpType: 'phone',
          content: '客户表示正在走财务审批流程，预计下周可以付款',
          feedback: 'approving',
          expectedPaymentDate: '2024-01-26',
          nextFollowUpDate: '2024-01-27',
          remark: '客户态度良好'
        },
        {
          id: '2',
          followUpDate: '2024-01-15 14:20:00',
          followUpPerson: '张三',
          followUpType: 'email',
          content: '发送付款提醒邮件，附上发票和对账单',
          feedback: 'promised',
          expectedPaymentDate: '2024-01-25',
          remark: '已发送邮件回执'
        }
      ];
      historyDialogVisible.value = true;
    };

    // 导出数据
    const exportData = () => {
      ElMessage.success('数据导出成功');
    };

    // 打印选中
    const printSelected = () => {
      ElMessage.info(`正在打印选中的 ${selectedRows.value.length} 个订单`);
    };

    // 刷新数据
    const refreshData = () => {
      loadData();
      ElMessage.success('数据已刷新');
    };

    // 渲染图表
    const renderChart = () => {
      // 模拟图表渲染
      console.log('渲染图表', chartTimeRange.value);
      // 实际项目中可以使用 ECharts 等图表库
    };

    // 监听图表时间范围变化
    watch(chartTimeRange, () => {
      renderChart();
    });

    // 加载数据
    const loadData = () => {
      loading.value = true;
      // 模拟API调用延迟
      setTimeout(() => {
        // 模拟数据
        const mockData = [
          {
            id: '1',
            orderNumber: 'SO20240001',
            customerName: '北京科技有限公司',
            contactPerson: '王经理',
            contactPhone: '13800138001',
            totalAmount: 250000.00,
            paidAmount: 150000.00,
            remainingAmount: 100000.00,
            paymentDate: '2024-01-30',
            daysRemaining: 5,
            followUpPerson: '张三',
            status: 'following',
            lastFollowUpDate: '2024-01-25',
            remark: '合同尾款，客户承诺月底付款'
          },
          {
            id: '2',
            orderNumber: 'SO20240002',
            customerName: '上海贸易公司',
            contactPerson: '李总',
            contactPhone: '13900139002',
            totalAmount: 180000.00,
            paidAmount: 90000.00,
            remainingAmount: 90000.00,
            paymentDate: '2024-01-20',
            daysRemaining: -5,
            followUpPerson: '李四',
            status: 'overdue',
            lastFollowUpDate: '2024-01-23',
            remark: '逾期5天，客户表示资金紧张'
          },
          {
            id: '3',
            orderNumber: 'SO20240003',
            customerName: '广州制造有限公司',
            contactPerson: '张经理',
            contactPhone: '13700137003',
            totalAmount: 320000.00,
            paidAmount: 160000.00,
            remainingAmount: 160000.00,
            paymentDate: '2024-02-10',
            daysRemaining: 15,
            followUpPerson: '王五',
            status: 'pending',
            lastFollowUpDate: null,
            remark: '待跟进'
          },
          {
            id: '4',
            orderNumber: 'SO20240004',
            customerName: '深圳科技集团',
            contactPerson: '刘总',
            contactPhone: '13600136004',
            totalAmount: 280000.00,
            paidAmount: 280000.00,
            remainingAmount: 0.00,
            paymentDate: '2024-01-15',
            daysRemaining: -10,
            followUpPerson: '赵六',
            status: 'paid',
            lastFollowUpDate: '2024-01-14',
            remark: '已全额付款'
          },
          {
            id: '5',
            orderNumber: 'SO20240005',
            customerName: '杭州电子有限公司',
            contactPerson: '陈经理',
            contactPhone: '13500135005',
            totalAmount: 450000.00,
            paidAmount: 225000.00,
            remainingAmount: 225000.00,
            paymentDate: '2024-01-28',
            daysRemaining: 3,
            followUpPerson: '张三',
            status: 'following',
            lastFollowUpDate: '2024-01-26',
            remark: '正在走审批流程'
          },
          {
            id: '6',
            orderNumber: 'SO20240006',
            customerName: '成都软件有限公司',
            contactPerson: '杨总',
            contactPhone: '13400134006',
            totalAmount: 150000.00,
            paidAmount: 0.00,
            remainingAmount: 150000.00,
            paymentDate: '2024-01-25',
            daysRemaining: -1,
            followUpPerson: '李四',
            status: 'overdue',
            lastFollowUpDate: '2024-01-26',
            remark: '首次合作，需要加强跟进'
          },
          {
            id: '7',
            orderNumber: 'SO20240007',
            customerName: '武汉科技有限公司',
            contactPerson: '黄经理',
            contactPhone: '13300133007',
            totalAmount: 220000.00,
            paidAmount: 110000.00,
            remainingAmount: 110000.00,
            paymentDate: '2024-02-05',
            daysRemaining: 10,
            followUpPerson: '王五',
            status: 'pending',
            lastFollowUpDate: null,
            remark: '季度付款计划'
          }
        ];

        // 应用搜索过滤
        let filteredData = [...mockData];
        if (searchForm.customerName) {
          filteredData = filteredData.filter(item => 
            item.customerName.includes(searchForm.customerName)
          );
        }
        if (searchForm.orderNumber) {
          filteredData = filteredData.filter(item => 
            item.orderNumber.includes(searchForm.orderNumber)
          );
        }
        if (searchForm.status) {
          filteredData = filteredData.filter(item => 
            item.status === searchForm.status
          );
        }
        if (searchForm.followUpPerson) {
          filteredData = filteredData.filter(item => 
            item.followUpPerson === searchForm.followUpPerson
          );
        }
        if (searchForm.paymentDateRange && searchForm.paymentDateRange.length === 2) {
          const startDate = new Date(searchForm.paymentDateRange[0]);
          const endDate = new Date(searchForm.paymentDateRange[1]);
          filteredData = filteredData.filter(item => {
            const paymentDate = new Date(item.paymentDate);
            return paymentDate >= startDate && paymentDate <= endDate;
          });
        }

        // 分页处理
        const start = (pagination.currentPage - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        paymentList.value = filteredData.slice(start, end);
        pagination.total = filteredData.length;
        
        loading.value = false;
        
        // 渲染图表
        renderChart();
      }, 500);
    };

    // 生命周期
    onMounted(() => {
      loadData();
    });

    return {
      loading,
      paymentList,
      selectedRows,
      searchForm,
      pagination,
      followUpDialogVisible,
      historyDialogVisible,
      markPaidDialogVisible,
      editDialogVisible,
      currentOrder,
      followUpHistory,
      chartTimeRange,
      followUpForm,
      followUpFormRef,
      paidForm,
      paidFormRef,
      editForm,
      editFormRef,
      followUpRules,
      paidRules,
      editRules,
      pendingCount,
      pendingAmount,
      overdueCount,
      overdueAmount,
      monthlyPaymentAmount,
      monthlyPaymentCount,
      totalUnpaidAmount,
      totalUnpaidCount,
      formatDate,
      formatDateTime,
      formatCurrency,
      isOverdue,
      getDaysClass,
      getStatusType,
      getStatusText,
      getFollowUpType,
      getFollowUpTypeText,
      getFeedbackText,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      resetFollowUpForm,
      resetPaidForm,
      resetEditForm,
      followUpOrder,
      followUpSelected,
      submitFollowUp,
      markAsPaid,
      confirmMarkPaid,
      editOrder,
      saveEdit,
      viewOrderDetails,
      viewFollowUpHistory,
      exportData,
      printSelected,
      refreshData
    };
  }
};
</script>

<style scoped>
.payment-follow-up {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.content-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.search-form {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.stats-container {
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-value.primary {
  color: #409eff;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  height: 300px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart {
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.font-bold {
  font-weight: bold;
}

.text-success {
  color: #67c23a;
}

.text-primary {
  color: #409eff;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.history-content {
  max-height: 600px;
  overflow-y: auto;
}

.order-info {
  margin-bottom: 30px;
}

.order-info h3 {
  margin-bottom: 15px;
  color: #303133;
}

.follow-up-history h3 {
  margin-bottom: 20px;
  color: #303133;
}

.history-item {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.follow-up-person {
  font-weight: bold;
  color: #303133;
}

.follow-up-type {
  color: #909399;
}

.history-content p {
  margin: 0 0 10px 0;
  color: #606266;
  line-height: 1.5;
}

.history-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}

.history-remark {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
}

.empty-history {
  text-align: center;
  padding: 40px;
}
</style>