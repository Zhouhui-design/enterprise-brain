<template>
  <div class="account-receivable">
    <div class="header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>财务管理</el-breadcrumb-item>
        <el-breadcrumb-item>应收账款</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <el-button type="primary" @click="exportData">导出数据</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="客户名称">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
      </el-form-item>
      <el-form-item label="发票编号">
        <el-input v-model="searchForm.invoiceNumber" placeholder="请输入发票编号" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="searchForm.status" placeholder="请选择状态">
          <el-option label="全部" value="" />
          <el-option label="未结算" value="unsettled" />
          <el-option label="部分结算" value="partially_settled" />
          <el-option label="已结算" value="settled" />
          <el-option label="逾期" value="overdue" />
        </el-select>
      </el-form-item>
      <el-form-item label="负责人">
        <el-select v-model="searchForm.salesPerson" placeholder="请选择负责人">
          <el-option label="全部" value="" />
          <el-option label="张三" value="张三" />
          <el-option label="李四" value="李四" />
          <el-option label="王五" value="王五" />
          <el-option label="赵六" value="赵六" />
        </el-select>
      </el-form-item>
      <el-form-item label="开票日期">
        <el-date-picker
          v-model="searchForm.invoiceDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        />
      </el-form-item>
      <el-form-item label="到期日期">
        <el-date-picker
          v-model="searchForm.dueDateRange"
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

    <!-- 应收账款概览 -->
    <div class="overview-container">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">应收账款总额</div>
              <div class="overview-value primary">{{ formatCurrency(totalReceivable) }}</div>
              <div class="overview-desc">共 {{ totalCount }} 笔应收账款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">已结算金额</div>
              <div class="overview-value success">{{ formatCurrency(settledAmount) }}</div>
              <div class="overview-desc">结算率 {{ settlementRate }}%</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">未结算金额</div>
              <div class="overview-value warning">{{ formatCurrency(unsettledAmount) }}</div>
              <div class="overview-desc">共 {{ unsettledCount }} 笔</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">逾期未付</div>
              <div class="overview-value danger">{{ formatCurrency(overdueAmount) }}</div>
              <div class="overview-desc">共 {{ overdueCount }} 笔</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">本月新增</div>
              <div class="overview-value info">{{ formatCurrency(currentMonthNew) }}</div>
              <div class="overview-desc">共 {{ currentMonthCount }} 笔</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">坏账准备</div>
              <div class="overview-value warning">{{ formatCurrency(badDebtProvision) }}</div>
              <div class="overview-desc">占应收总额 {{ badDebtRate }}%</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>应收账款趋势</span>
                <el-select v-model="trendTimeRange" @change="updateCharts">
                  <el-option label="近3个月" value="3months" />
                  <el-option label="近6个月" value="6months" />
                  <el-option label="近12个月" value="12months" />
                </el-select>
              </div>
            </template>
            <div ref="receivableTrendChart" class="chart-item"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>应收账款分布</span>
              </div>
            </template>
            <div ref="receivableDistributionChart" class="chart-item"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 应收账款列表 -->
    <el-card class="data-table-card">
      <template #header>
        <div class="table-header">
          <span>应收账款列表</span>
          <div class="table-actions">
            <el-select v-model="tableFilter.status" placeholder="快速筛选" style="width: 120px; margin-right: 10px;">
              <el-option label="全部" value="" />
              <el-option label="未结算" value="unsettled" />
              <el-option label="已结算" value="settled" />
              <el-option label="逾期" value="overdue" />
            </el-select>
            <el-input
              v-model="tableFilter.searchText"
              placeholder="搜索客户/发票号"
              style="width: 200px; margin-right: 10px;"
              @input="handleTableSearch"
            />
          </div>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="filteredReceivables"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="invoiceNumber" label="发票编号" width="180" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <a href="#" @click.stop="viewInvoiceDetails(row)">{{ row.invoiceNumber }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户名称" width="180" :show-overflow-tooltip="true" />
        <el-table-column prop="invoiceDate" label="开票日期" width="130">
          <template #default="{ row }">
            {{ formatDate(row.invoiceDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日期" width="130">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row.dueDate) }">
              {{ formatDate(row.dueDate) }}
              <i v-if="isOverdue(row.dueDate)" class="el-icon-warning" style="margin-left: 5px;"></i>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="salesPerson" label="负责人" width="100" />
        <el-table-column prop="originalAmount" label="发票金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.originalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paidAmount" label="已收金额" width="120" align="right">
          <template #default="{ row }">
            <span class="text-success">{{ formatCurrency(row.paidAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="outstandingAmount" label="未收金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.outstandingAmount > 0 }">{{ formatCurrency(row.outstandingAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="settlementRate" label="结算率" width="100" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.settlementRate"
              :color="getSettlementRateColor(row.settlementRate)"
              :show-text="true"
              :format="(percentage) => `${percentage}%`"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="overdueDays" label="逾期天数" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.overdueDays > 0" class="text-danger">{{ row.overdueDays }}天</span>
            <span v-else>0天</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewInvoiceDetails(row)">详情</el-button>
            <el-button
              v-if="row.outstandingAmount > 0"
              type="primary"
              size="small"
              @click="recordPayment(row)"
            >
              登记收款
            </el-button>
            <el-button
              v-if="row.overdueDays > 0"
              type="danger"
              size="small"
              @click="sendReminder(row)"
            >
              发送提醒
            </el-button>
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
    </el-card>

    <!-- 发票详情对话框 -->
    <el-dialog
      v-model="invoiceDetailDialogVisible"
      title="应收账款详情"
      width="800px"
    >
      <div v-if="selectedInvoice" class="invoice-detail">
        <el-descriptions border :column="2" :title="selectedInvoice.invoiceNumber">
          <el-descriptions-item label="客户名称">{{ selectedInvoice.customerName }}</el-descriptions-item>
          <el-descriptions-item label="客户代码">{{ selectedInvoice.customerCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedInvoice.salesPerson }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedInvoice.customerPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开票日期">{{ formatDate(selectedInvoice.invoiceDate) }}</el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ formatDate(selectedInvoice.dueDate) }}</el-descriptions-item>
          <el-descriptions-item label="账期">{{ selectedInvoice.creditPeriod }}天</el-descriptions-item>
          <el-descriptions-item label="发票金额">{{ formatCurrency(selectedInvoice.originalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="已收金额">{{ formatCurrency(selectedInvoice.paidAmount) }}</el-descriptions-item>
          <el-descriptions-item label="未收金额">{{ formatCurrency(selectedInvoice.outstandingAmount) }}</el-descriptions-item>
          <el-descriptions-item label="结算状态">{{ getStatusText(selectedInvoice.status) }}</el-descriptions-item>
          <el-descriptions-item label="逾期天数">{{ selectedInvoice.overdueDays > 0 ? selectedInvoice.overdueDays + '天' : '0天' }}</el-descriptions-item>
          <el-descriptions-item label="业务类型">{{ selectedInvoice.businessType || '-' }}</el-descriptions-item>
          <el-descriptions-item label="交易编号">{{ selectedInvoice.transactionNumber || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedInvoice.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 收款记录 -->
        <div class="payment-history">
          <h4>收款记录</h4>
          <el-table
            v-if="selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0"
            :data="selectedInvoice.paymentHistory"
            style="width: 100%"
            border
          >
            <el-table-column prop="paymentDate" label="收款日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.paymentDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="paymentAmount" label="收款金额" width="130" align="right">
              <template #default="{ row }">
                <span class="text-success">{{ formatCurrency(row.paymentAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="收款方式" width="120">
              <template #default="{ row }">
                {{ getPaymentMethodText(row.paymentMethod) }}
              </template>
            </el-table-column>
            <el-table-column prop="transactionNumber" label="交易流水号" width="180" />
            <el-table-column prop="payer" label="付款方" width="120" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
          <div v-else class="empty-state">暂无收款记录</div>
        </div>

        <!-- 相关单据 -->
        <div class="related-documents">
          <h4>相关单据</h4>
          <el-table
            v-if="selectedInvoice.relatedDocuments && selectedInvoice.relatedDocuments.length > 0"
            :data="selectedInvoice.relatedDocuments"
            style="width: 100%"
            border
          >
            <el-table-column prop="documentType" label="单据类型" width="120" />
            <el-table-column prop="documentNumber" label="单据编号" width="180" />
            <el-table-column prop="documentDate" label="单据日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.documentDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="documentAmount" label="单据金额" width="120" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.documentAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" type="text">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-else class="empty-state">暂无相关单据</div>
        </div>
      </div>
    </el-dialog>

    <!-- 登记收款对话框 -->
    <el-dialog
      v-model="recordPaymentDialogVisible"
      title="登记收款"
      width="600px"
    >
      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="120px"
      >
        <el-form-item label="发票编号">
          <el-input v-model="paymentForm.invoiceNumber" disabled />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="paymentForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="未收金额">
          <el-input v-model="paymentForm.outstandingAmount" disabled />
        </el-form-item>
        <el-form-item label="收款金额" prop="paymentAmount">
          <el-input-number
            v-model="paymentForm.paymentAmount"
            :min="0"
            :max="paymentForm.outstandingAmount"
            :precision="2"
            style="width: 100%;"
            placeholder="请输入收款金额"
          />
        </el-form-item>
        <el-form-item label="收款日期" prop="paymentDate">
          <el-date-picker
            v-model="paymentForm.paymentDate"
            type="date"
            placeholder="请选择收款日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="收款方式" prop="paymentMethod">
          <el-select v-model="paymentForm.paymentMethod" placeholder="请选择收款方式">
            <el-option label="银行转账" value="bankTransfer" />
            <el-option label="支付宝" value="alipay" />
            <el-option label="微信支付" value="wechat" />
            <el-option label="现金" value="cash" />
            <el-option label="支票" value="check" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易流水号" prop="transactionNumber">
          <el-input v-model="paymentForm.transactionNumber" placeholder="请输入交易流水号" />
        </el-form-item>
        <el-form-item label="银行名称" prop="bankName">
          <el-input v-model="paymentForm.bankName" placeholder="请输入银行名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="paymentForm.remark"
            type="textarea"
            placeholder="请输入备注"
            rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="recordPaymentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRecordPayment">确认收款</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 发送提醒对话框 -->
    <el-dialog
      v-model="reminderDialogVisible"
      title="发送还款提醒"
      width="600px"
    >
      <el-form
        ref="reminderFormRef"
        :model="reminderForm"
        :rules="reminderRules"
        label-width="120px"
      >
        <el-form-item label="客户名称">
          <el-input v-model="reminderForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="未收金额">
          <el-input v-model="reminderForm.outstandingAmount" disabled />
        </el-form-item>
        <el-form-item label="发票编号">
          <el-input v-model="reminderForm.invoiceNumber" disabled />
        </el-form-item>
        <el-form-item label="提醒类型" prop="reminderType">
          <el-select v-model="reminderForm.reminderType" placeholder="请选择提醒类型">
            <el-option label="邮件提醒" value="email" />
            <el-option label="短信提醒" value="sms" />
            <el-option label="内部通知" value="internal" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒内容" prop="content">
          <el-input
            v-model="reminderForm.content"
            type="textarea"
            placeholder="请输入提醒内容"
            rows="4"
          />
        </el-form-item>
        <el-form-item label="抄送人" prop="ccRecipients">
          <el-input v-model="reminderForm.ccRecipients" placeholder="多个抄送人用逗号分隔" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reminderDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSendReminder">发送提醒</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'AccountReceivable',
  setup() {
    // 状态管理
    const loading = ref(false);
    const receivables = ref([]);
    const selectedRows = ref([]);
    const invoiceDetailDialogVisible = ref(false);
    const recordPaymentDialogVisible = ref(false);
    const reminderDialogVisible = ref(false);
    const selectedInvoice = ref(null);
    const trendTimeRange = ref('6months');

    // 图表引用
    const receivableTrendChart = ref(null);
    const receivableDistributionChart = ref(null);

    // 表单引用
    const paymentFormRef = ref(null);
    const reminderFormRef = ref(null);

    // 搜索表单
    const searchForm = reactive({
      customerName: '',
      invoiceNumber: '',
      status: '',
      salesPerson: '',
      invoiceDateRange: null,
      dueDateRange: null
    });

    // 表格筛选
    const tableFilter = reactive({
      status: '',
      searchText: ''
    });

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });

    // 收款表单
    const paymentForm = reactive({
      invoiceNumber: '',
      customerName: '',
      outstandingAmount: 0,
      paymentAmount: 0,
      paymentDate: new Date(),
      paymentMethod: 'bankTransfer',
      transactionNumber: '',
      bankName: '',
      remark: ''
    });

    // 提醒表单
    const reminderForm = reactive({
      customerName: '',
      outstandingAmount: '',
      invoiceNumber: '',
      reminderType: 'email',
      content: '',
      ccRecipients: ''
    });

    // 表单验证规则
    const paymentRules = {
      paymentAmount: [
        { required: true, message: '请输入收款金额', trigger: 'blur' },
        { min: 0.01, message: '收款金额必须大于0', trigger: 'blur' }
      ],
      paymentDate: [{ required: true, message: '请选择收款日期', trigger: 'change' }],
      paymentMethod: [{ required: true, message: '请选择收款方式', trigger: 'change' }],
      transactionNumber: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }]
    };

    const reminderRules = {
      reminderType: [{ required: true, message: '请选择提醒类型', trigger: 'change' }],
      content: [{ required: true, message: '请输入提醒内容', trigger: 'blur' }]
    };

    // 计算属性
    const filteredReceivables = computed(() => {
      let data = [...receivables.value];
      
      // 应用搜索条件
      if (searchForm.customerName) {
        data = data.filter(item => 
          item.customerName.toLowerCase().includes(searchForm.customerName.toLowerCase())
        );
      }
      if (searchForm.invoiceNumber) {
        data = data.filter(item => 
          item.invoiceNumber.toLowerCase().includes(searchForm.invoiceNumber.toLowerCase())
        );
      }
      if (searchForm.status) {
        data = data.filter(item => item.status === searchForm.status);
      }
      if (searchForm.salesPerson) {
        data = data.filter(item => item.salesPerson === searchForm.salesPerson);
      }
      if (searchForm.invoiceDateRange && searchForm.invoiceDateRange.length === 2) {
        data = data.filter(item => {
          const invoiceDate = new Date(item.invoiceDate);
          return invoiceDate >= searchForm.invoiceDateRange[0] && 
                 invoiceDate <= searchForm.invoiceDateRange[1];
        });
      }
      if (searchForm.dueDateRange && searchForm.dueDateRange.length === 2) {
        data = data.filter(item => {
          const dueDate = new Date(item.dueDate);
          return dueDate >= searchForm.dueDateRange[0] && 
                 dueDate <= searchForm.dueDateRange[1];
        });
      }
      
      // 应用表格快速筛选
      if (tableFilter.status) {
        data = data.filter(item => item.status === tableFilter.status);
      }
      if (tableFilter.searchText) {
        const searchText = tableFilter.searchText.toLowerCase();
        data = data.filter(item => 
          item.customerName.toLowerCase().includes(searchText) || 
          item.invoiceNumber.toLowerCase().includes(searchText)
        );
      }
      
      // 分页
      const start = (pagination.currentPage - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      pagination.total = data.length;
      
      return data.slice(start, end);
    });

    // 应收账款总额
    const totalReceivable = computed(() => {
      return receivables.value.reduce((sum, item) => sum + item.originalAmount, 0);
    });

    // 已结算金额
    const settledAmount = computed(() => {
      return receivables.value.reduce((sum, item) => sum + item.paidAmount, 0);
    });

    // 结算率
    const settlementRate = computed(() => {
      if (totalReceivable.value === 0) return 0;
      return Math.round((settledAmount.value / totalReceivable.value) * 100);
    });

    // 未结算金额
    const unsettledAmount = computed(() => {
      return receivables.value.reduce((sum, item) => sum + item.outstandingAmount, 0);
    });

    // 未结算笔数
    const unsettledCount = computed(() => {
      return receivables.value.filter(item => item.outstandingAmount > 0).length;
    });

    // 逾期未付金额
    const overdueAmount = computed(() => {
      return receivables.value.filter(item => item.overdueDays > 0)
        .reduce((sum, item) => sum + item.outstandingAmount, 0);
    });

    // 逾期笔数
    const overdueCount = computed(() => {
      return receivables.value.filter(item => item.overdueDays > 0).length;
    });

    // 本月新增
    const currentMonthNew = computed(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      return receivables.value
        .filter(item => {
          const invoiceDate = new Date(item.invoiceDate);
          return invoiceDate.getMonth() === currentMonth && 
                 invoiceDate.getFullYear() === currentYear;
        })
        .reduce((sum, item) => sum + item.originalAmount, 0);
    });

    // 本月新增笔数
    const currentMonthCount = computed(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      return receivables.value.filter(item => {
        const invoiceDate = new Date(item.invoiceDate);
        return invoiceDate.getMonth() === currentMonth && 
               invoiceDate.getFullYear() === currentYear;
      }).length;
    });

    // 坏账准备
    const badDebtProvision = computed(() => {
      return receivables.value.filter(item => item.overdueDays > 90)
        .reduce((sum, item) => sum + item.outstandingAmount * 0.5, 0);
    });

    // 坏账率
    const badDebtRate = computed(() => {
      if (totalReceivable.value === 0) return 0;
      return Math.round((badDebtProvision.value / totalReceivable.value) * 100);
    });

    // 总笔数
    const totalCount = computed(() => {
      return receivables.value.length;
    });

    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '0.00 元';
      return `${value.toFixed(2)} 元`;
    };

    // 判断是否逾期
    const isOverdue = (date) => {
      if (!date) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    };

    // 获取结算率颜色
    const getSettlementRateColor = (rate) => {
      if (rate >= 100) return '#67c23a';
      if (rate >= 50) return '#e6a23c';
      return '#f56c6c';
    };

    // 获取状态标签类型
    const getStatusTagType = (status) => {
      switch (status) {
        case 'unsettled': return 'danger';
        case 'partially_settled': return 'warning';
        case 'settled': return 'success';
        case 'overdue': return 'danger';
        default: return 'info';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'unsettled': return '未结算';
        case 'partially_settled': return '部分结算';
        case 'settled': return '已结算';
        case 'overdue': return '逾期';
        default: return '未知';
      }
    };

    // 获取收款方式文本
    const getPaymentMethodText = (method) => {
      switch (method) {
        case 'bankTransfer': return '银行转账';
        case 'alipay': return '支付宝';
        case 'wechat': return '微信支付';
        case 'cash': return '现金';
        case 'check': return '支票';
        default: return '其他';
      }
    };

    // 处理选择变化
    const handleSelectionChange = (val) => {
      selectedRows.value = val;
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
    };

    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
    };

    // 表格搜索
    const handleTableSearch = () => {
      pagination.currentPage = 1;
    };

    // 搜索
    const search = () => {
      pagination.currentPage = 1;
    };

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key.endsWith('Range')) {
          searchForm[key] = null;
        } else {
          searchForm[key] = '';
        }
      });
      tableFilter.status = '';
      tableFilter.searchText = '';
      pagination.currentPage = 1;
    };

    // 查看发票详情
    const viewInvoiceDetails = (row) => {
      // 模拟加载详情数据
      selectedInvoice.value = {
        ...row,
        customerCode: 'CUST' + String(row.id).padStart(4, '0'),
        customerPhone: '138****' + Math.floor(Math.random() * 10000),
        creditPeriod: 30,
        businessType: '销售业务',
        transactionNumber: 'TRX' + Math.floor(Math.random() * 100000000),
        paymentHistory: [
          {
            paymentDate: '2024-01-15',
            paymentAmount: Math.random() * 50000,
            paymentMethod: 'bankTransfer',
            transactionNumber: 'TRX' + Math.floor(Math.random() * 100000000),
            payer: row.customerName,
            operator: '张三',
            remark: '收到部分货款'
          }
        ],
        relatedDocuments: [
          {
            documentType: '销售订单',
            documentNumber: 'SO2024' + String(Math.floor(Math.random() * 10000)),
            documentDate: '2024-01-05',
            documentAmount: row.originalAmount,
            status: '已完成'
          },
          {
            documentType: '出库单',
            documentNumber: 'DO2024' + String(Math.floor(Math.random() * 10000)),
            documentDate: '2024-01-10',
            documentAmount: row.originalAmount,
            status: '已出库'
          }
        ]
      };
      invoiceDetailDialogVisible.value = true;
    };

    // 登记收款
    const recordPayment = (row) => {
      paymentForm.invoiceNumber = row.invoiceNumber;
      paymentForm.customerName = row.customerName;
      paymentForm.outstandingAmount = row.outstandingAmount;
      paymentForm.paymentAmount = 0;
      paymentForm.paymentDate = new Date();
      paymentForm.paymentMethod = 'bankTransfer';
      paymentForm.transactionNumber = '';
      paymentForm.bankName = '';
      paymentForm.remark = '';
      recordPaymentDialogVisible.value = true;
    };

    // 确认登记收款
    const confirmRecordPayment = () => {
      paymentFormRef.value.validate((valid) => {
        if (valid) {
          ElMessageBox.confirm('确定要登记这笔收款吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }).then(() => {
            // 模拟保存
            setTimeout(() => {
              ElMessage.success('收款登记成功');
              recordPaymentDialogVisible.value = false;
              loadData(); // 重新加载数据
            }, 500);
          }).catch(() => {});
        }
      });
    };

    // 发送提醒
    const sendReminder = (row) => {
      reminderForm.customerName = row.customerName;
      reminderForm.outstandingAmount = formatCurrency(row.outstandingAmount);
      reminderForm.invoiceNumber = row.invoiceNumber;
      reminderForm.reminderType = 'email';
      reminderForm.content = `尊敬的客户，您的应收账款（发票号：${row.invoiceNumber}）已逾期${row.overdueDays}天，金额为${formatCurrency(row.outstandingAmount)}，请尽快安排付款。`;
      reminderForm.ccRecipients = '';
      reminderDialogVisible.value = true;
    };

    // 确认发送提醒
    const confirmSendReminder = () => {
      reminderFormRef.value.validate((valid) => {
        if (valid) {
          ElMessageBox.confirm('确定要发送还款提醒吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'info'
          }).then(() => {
            // 模拟发送
            setTimeout(() => {
              ElMessage.success('提醒发送成功');
              reminderDialogVisible.value = false;
            }, 500);
          }).catch(() => {});
        }
      });
    };

    // 导出数据
    const exportData = () => {
      ElMessageBox.confirm('确定要导出应收账款数据吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        loading.value = true;
        // 模拟导出
        setTimeout(() => {
          ElMessage.success('数据导出成功');
          loading.value = false;
        }, 1000);
      }).catch(() => {});
    };

    // 刷新数据
    const refreshData = () => {
      loadData();
      updateCharts();
      ElMessage.success('数据已刷新');
    };

    // 更新图表
    const updateCharts = () => {
      // 这里应该使用真实的图表库，如 ECharts
      ElMessage.info('图表数据已更新');
    };

    // 加载数据
    const loadData = () => {
      loading.value = true;
      // 模拟API调用延迟
      setTimeout(() => {
        // 模拟数据
        const now = new Date();
        const mockData = [
          {
            id: 1,
            invoiceNumber: 'INV2024010001',
            customerName: '北京科技有限公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
            salesPerson: '张三',
            originalAmount: 200000.00,
            paidAmount: 50000.00,
            outstandingAmount: 150000.00,
            settlementRate: 25,
            status: 'overdue',
            overdueDays: 45,
            remark: '季度结算'
          },
          {
            id: 2,
            invoiceNumber: 'INV2024010002',
            customerName: '上海贸易公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 1, 10),
            dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
            salesPerson: '李四',
            originalAmount: 350000.00,
            paidAmount: 200000.00,
            outstandingAmount: 150000.00,
            settlementRate: 57,
            status: 'partially_settled',
            overdueDays: 0,
            remark: '部分预付'
          },
          {
            id: 3,
            invoiceNumber: 'INV2024010003',
            customerName: '广州制造有限公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 3, 5),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 5),
            salesPerson: '王五',
            originalAmount: 120000.00,
            paidAmount: 120000.00,
            outstandingAmount: 0.00,
            settlementRate: 100,
            status: 'settled',
            overdueDays: 0,
            remark: '已全额付款'
          },
          {
            id: 4,
            invoiceNumber: 'INV2024010004',
            customerName: '深圳科技集团',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 1, 20),
            dueDate: new Date(now.getFullYear(), now.getMonth(), 20),
            salesPerson: '赵六',
            originalAmount: 500000.00,
            paidAmount: 0.00,
            outstandingAmount: 500000.00,
            settlementRate: 0,
            status: 'unsettled',
            overdueDays: 0,
            remark: '待付款'
          },
          {
            id: 5,
            invoiceNumber: 'INV2024010005',
            customerName: '杭州电子有限公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 4, 25),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 3, 25),
            salesPerson: '张三',
            originalAmount: 80000.00,
            paidAmount: 30000.00,
            outstandingAmount: 50000.00,
            settlementRate: 37.5,
            status: 'overdue',
            overdueDays: 120,
            remark: '需跟进'
          },
          {
            id: 6,
            invoiceNumber: 'INV2024010006',
            customerName: '南京自动化科技',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 2, 12),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 12),
            salesPerson: '李四',
            originalAmount: 150000.00,
            paidAmount: 150000.00,
            outstandingAmount: 0.00,
            settlementRate: 100,
            status: 'settled',
            overdueDays: 0,
            remark: '已全额付款'
          },
          {
            id: 7,
            invoiceNumber: 'INV2024010007',
            customerName: '成都软件科技有限公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 3, 20),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 20),
            salesPerson: '王五',
            originalAmount: 180000.00,
            paidAmount: 180000.00,
            outstandingAmount: 0.00,
            settlementRate: 100,
            status: 'settled',
            overdueDays: 0,
            remark: '已全额付款'
          },
          {
            id: 8,
            invoiceNumber: 'INV2024010008',
            customerName: '武汉网络科技公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 2, 5),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 1, 5),
            salesPerson: '赵六',
            originalAmount: 220000.00,
            paidAmount: 100000.00,
            outstandingAmount: 120000.00,
            settlementRate: 45.5,
            status: 'overdue',
            overdueDays: 30,
            remark: '需跟进付款'
          },
          {
            id: 9,
            invoiceNumber: 'INV2024010009',
            customerName: '西安电子信息公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
            dueDate: new Date(now.getFullYear(), now.getMonth(), 15),
            salesPerson: '张三',
            originalAmount: 160000.00,
            paidAmount: 0.00,
            outstandingAmount: 160000.00,
            settlementRate: 0,
            status: 'unsettled',
            overdueDays: 0,
            remark: '新客户'
          },
          {
            id: 10,
            invoiceNumber: 'INV2024010010',
            customerName: '重庆智能科技有限公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 3, 10),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 2, 10),
            salesPerson: '李四',
            originalAmount: 250000.00,
            paidAmount: 250000.00,
            outstandingAmount: 0.00,
            settlementRate: 100,
            status: 'settled',
            overdueDays: 0,
            remark: '已全额付款'
          },
          {
            id: 11,
            invoiceNumber: 'INV2024010011',
            customerName: '长沙信息技术公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 4, 20),
            dueDate: new Date(now.getFullYear(), now.getMonth() - 3, 20),
            salesPerson: '王五',
            originalAmount: 90000.00,
            paidAmount: 0.00,
            outstandingAmount: 90000.00,
            settlementRate: 0,
            status: 'overdue',
            overdueDays: 150,
            remark: '高风险客户'
          },
          {
            id: 12,
            invoiceNumber: 'INV2024010012',
            customerName: '天津电子科技公司',
            invoiceDate: new Date(now.getFullYear(), now.getMonth() - 1, 25),
            dueDate: new Date(now.getFullYear(), now.getMonth(), 25),
            salesPerson: '赵六',
            originalAmount: 180000.00,
            paidAmount: 180000.00,
            outstandingAmount: 0.00,
            settlementRate: 100,
            status: 'settled',
            overdueDays: 0,
            remark: '已全额付款'
          }
        ];

        receivables.value = mockData;
        loading.value = false;
        
        // 初始化图表
        nextTick(() => {
          updateCharts();
        });
      }, 500);
    };

    // 生命周期
    onMounted(() => {
      loadData();
    });

    return {
      loading,
      receivables,
      selectedRows,
      searchForm,
      tableFilter,
      pagination,
      invoiceDetailDialogVisible,
      recordPaymentDialogVisible,
      reminderDialogVisible,
      selectedInvoice,
      trendTimeRange,
      receivableTrendChart,
      receivableDistributionChart,
      paymentForm,
      paymentFormRef,
      reminderForm,
      reminderFormRef,
      paymentRules,
      reminderRules,
      filteredReceivables,
      totalReceivable,
      settledAmount,
      settlementRate,
      unsettledAmount,
      unsettledCount,
      overdueAmount,
      overdueCount,
      currentMonthNew,
      currentMonthCount,
      badDebtProvision,
      badDebtRate,
      totalCount,
      formatDate,
      formatCurrency,
      isOverdue,
      getSettlementRateColor,
      getStatusTagType,
      getStatusText,
      getPaymentMethodText,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      handleTableSearch,
      search,
      resetSearch,
      viewInvoiceDetails,
      recordPayment,
      confirmRecordPayment,
      sendReminder,
      confirmSendReminder,
      exportData,
      refreshData,
      updateCharts
    };
  }
};
</script>

<style scoped>
.account-receivable {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-form {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.overview-container {
  margin-bottom: 20px;
}

.overview-card {
  border-radius: 4px;
  overflow: hidden;
}

.overview-content {
  text-align: center;
  padding: 20px 0;
}

.overview-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.overview-value.primary {
  color: #409eff;
}

.overview-value.success {
  color: #67c23a;
}

.overview-value.warning {
  color: #e6a23c;
}

.overview-value.danger {
  color: #f56c6c;
}

.overview-value.info {
  color: #909399;
}

.overview-desc {
  color: #909399;
  font-size: 12px;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  margin-bottom: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-item {
  height: 300px;
  width: 100%;
}

.data-table-card {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  padding: 20px;
  border-top: 1px solid #ebeef5;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.invoice-detail {
  max-height: 600px;
  overflow-y: auto;
}

.payment-history,
.related-documents {
  margin-top: 25px;
}

.payment-history h4,
.related-documents h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.empty-state {
  text-align: center;
  padding: 30px;
  color: #909399;
  font-size: 14px;
}
</style>