<template>
  <div class="aging-analysis">
    <div class="header">
      <h2>账龄分析</h2>
      <div class="header-actions">
        <el-button type="primary" @click="exportAnalysis">导出分析报表</el-button>
        <el-button @click="refreshData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="分析日期">
        <el-date-picker
          v-model="searchForm.analysisDate"
          type="date"
          placeholder="请选择分析日期"
          :default-value="new Date()"
        />
      </el-form-item>
      <el-form-item label="客户名称">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户名称" />
      </el-form-item>
      <el-form-item label="客户类型">
        <el-select v-model="searchForm.customerType" placeholder="请选择客户类型">
          <el-option label="全部" value="" />
          <el-option label="直销客户" value="direct" />
          <el-option label="经销客户" value="distributor" />
          <el-option label="零售客户" value="retail" />
          <el-option label="大客户" value="vip" />
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
      <el-form-item label="金额范围">
        <el-input-number
          v-model="searchForm.amountMin"
          :min="0"
          placeholder="最小金额"
          style="width: 120px;"
        />
        <span style="margin: 0 10px;">-</span>
        <el-input-number
          v-model="searchForm.amountMax"
          :min="0"
          placeholder="最大金额"
          style="width: 120px;"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="search">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 账龄分析概览 -->
    <div class="overview-container">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">应收账款总额</div>
              <div class="overview-value primary">{{ formatCurrency(totalReceivable) }}</div>
              <div class="overview-desc">{{ agingData.length }} 笔应收账款</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">逾期金额</div>
              <div class="overview-value danger">{{ formatCurrency(overdueAmount) }}</div>
              <div class="overview-desc">{{ overdueRate }}% 的总应收</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">平均账龄</div>
              <div class="overview-value warning">{{ avgAgingDays }} 天</div>
              <div class="overview-desc">较上期 {{ agingTrend > 0 ? '↑' : agingTrend < 0 ? '↓' : '→' }} {{ Math.abs(agingTrend) }}%</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">超期客户数</div>
              <div class="overview-value danger">{{ overdueCustomerCount }}</div>
              <div class="overview-desc">{{ overdueCustomerRate }}% 的客户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">坏账风险金额</div>
              <div class="overview-value warning">{{ formatCurrency(badDebtRiskAmount) }}</div>
              <div class="overview-desc">超期90天以上</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="overview-card">
            <div class="overview-content">
              <div class="overview-label">本月回收</div>
              <div class="overview-value success">{{ formatCurrency(currentMonthRecovery) }}</div>
              <div class="overview-desc">占计划 {{ monthRecoveryRate }}%</div>
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
                <span>账龄分布</span>
              </div>
            </template>
            <div ref="agingDistributionChart" class="chart-item"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>账龄趋势</span>
                <el-select v-model="trendTimeRange" @change="updateCharts">
                  <el-option label="近6个月" value="6months" />
                  <el-option label="近12个月" value="12months" />
                </el-select>
              </div>
            </template>
            <div ref="agingTrendChart" class="chart-item"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>按客户类型分布</span>
              </div>
            </template>
            <div ref="customerTypeChart" class="chart-item"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>按负责人分布</span>
              </div>
            </template>
            <div ref="salesPersonChart" class="chart-item"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 账龄分析详情表 -->
    <el-card class="data-table-card">
      <template #header>
        <div class="table-header">
          <span>账龄分析详情</span>
          <div class="table-actions">
            <el-checkbox v-model="showZeroBalance">显示余额为零的客户</el-checkbox>
          </div>
        </div>
      </template>
      <el-table
        v-loading="loading"
        :data="filteredAgingData"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="customerName" label="客户名称" width="180" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <a href="#" @click.stop="viewCustomerDetails(row)">{{ row.customerName }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="customerType" label="客户类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getCustomerTypeTag(row.customerType)">{{ getCustomerTypeText(row.customerType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="salesPerson" label="负责人" width="100" />
        <el-table-column prop="creditLimit" label="信用额度" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.creditLimit) }}
          </template>
        </el-table-column>
        <el-table-column prop="currentBalance" label="当前余额" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.currentBalance > 0 }">
              {{ formatCurrency(row.currentBalance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days0To30" label="0-30天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-primary': row.days0To30 > 0 }">
              {{ formatCurrency(row.days0To30) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days31To60" label="31-60天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-warning': row.days31To60 > 0 }">
              {{ formatCurrency(row.days31To60) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days61To90" label="61-90天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.days61To90 > 0 }">
              {{ formatCurrency(row.days61To90) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="days91To180" label="91-180天" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.days91To180 > 0 }">
              {{ formatCurrency(row.days91To180) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="daysOver180" label="180天以上" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.daysOver180 > 0 }">
              {{ formatCurrency(row.daysOver180) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="overdueDays" label="逾期天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getOverdueDaysTag(row.overdueDays)">{{ row.overdueDays }}天</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="agingLevel" label="账龄等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getAgingLevelTag(row.agingLevel)">{{ getAgingLevelText(row.agingLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskLevel" label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getRiskLevelTag(row.riskLevel)">{{ getRiskLevelText(row.riskLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewCustomerDetails(row)">详情</el-button>
            <el-button
              v-if="row.currentBalance > 0"
              type="primary"
              size="small"
              @click="sendReminder(row)"
            >
              发送提醒
            </el-button>
            <el-button
              v-if="row.overdueDays > 0"
              type="danger"
              size="small"
              @click="followUpOverdue(row)"
            >
              逾期跟进
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

    <!-- 客户详情对话框 -->
    <el-dialog
      v-model="customerDetailDialogVisible"
      title="客户账龄详情"
      width="800px"
    >
      <div v-if="selectedCustomer" class="customer-detail">
        <el-descriptions border :column="2" :title="selectedCustomer.customerName">
          <el-descriptions-item label="客户代码">{{ selectedCustomer.customerCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户类型">{{ getCustomerTypeText(selectedCustomer.customerType) }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedCustomer.salesPerson }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedCustomer.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="信用额度">{{ formatCurrency(selectedCustomer.creditLimit) }}</el-descriptions-item>
          <el-descriptions-item label="信用等级">{{ getCreditLevelText(selectedCustomer.creditLevel) }}</el-descriptions-item>
          <el-descriptions-item label="平均账期">{{ selectedCustomer.averagePaymentDays }}天</el-descriptions-item>
          <el-descriptions-item label="逾期次数">{{ selectedCustomer.overdueCount }}次</el-descriptions-item>
          <el-descriptions-item label="当前余额" :span="2">
            <span class="text-danger">{{ formatCurrency(selectedCustomer.currentBalance) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="累计销售" :span="2">{{ formatCurrency(selectedCustomer.totalSalesAmount) }}</el-descriptions-item>
          <el-descriptions-item label="累计回款" :span="2">{{ formatCurrency(selectedCustomer.totalPaymentAmount) }}</el-descriptions-item>
        </el-descriptions>

        <!-- 账龄明细 -->
        <div class="aging-details">
          <h4>账龄明细</h4>
          <el-table
            :data="selectedCustomer.invoiceDetails"
            style="width: 100%"
            border
          >
            <el-table-column prop="invoiceNumber" label="发票编号" width="180" />
            <el-table-column prop="invoiceDate" label="开票日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.invoiceDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="dueDate" label="到期日期" width="130">
              <template #default="{ row }">
                <span :class="{ 'text-danger': isOverdue(row.dueDate) }">
                  {{ formatDate(row.dueDate) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="invoiceAmount" label="发票金额" width="120" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.invoiceAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="paidAmount" label="已付金额" width="120" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.paidAmount) }}
              </template>
            </el-table-column>
            <el-table-column prop="outstandingAmount" label="未付金额" width="120" align="right">
              <template #default="{ row }">
                <span class="text-danger">{{ formatCurrency(row.outstandingAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="overdueDays" label="逾期天数" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.overdueDays > 0 ? 'danger' : 'success'">
                  {{ row.overdueDays > 0 ? row.overdueDays : 0 }}天
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
        </div>

        <!-- 还款记录 -->
        <div class="payment-records">
          <h4>还款记录（最近5条）</h4>
          <el-table
            :data="selectedCustomer.recentPayments"
            style="width: 100%"
            border
          >
            <el-table-column prop="paymentDate" label="还款日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.paymentDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="paymentAmount" label="还款金额" width="130" align="right">
              <template #default="{ row }">
                <span class="text-success">{{ formatCurrency(row.paymentAmount) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="paymentMethod" label="还款方式" width="120">
              <template #default="{ row }">
                {{ getPaymentMethodText(row.paymentMethod) }}
              </template>
            </el-table-column>
            <el-table-column prop="transactionNumber" label="交易流水号" width="180" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
        </div>
      </div>
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
        <el-form-item label="未付金额">
          <el-input v-model="reminderForm.outstandingAmount" disabled />
        </el-form-item>
        <el-form-item label="提醒类型" prop="reminderType">
          <el-select v-model="reminderForm.reminderType" placeholder="请选择提醒类型">
            <el-option label="邮件提醒" value="email" />
            <el-option label="短信提醒" value="sms" />
            <el-option label="内部通知" value="internal" />
          </el-select>
        </el-form-item>
        <el-form-item label="提醒模板" prop="templateId">
          <el-select v-model="reminderForm.templateId" placeholder="请选择提醒模板" @change="onTemplateChange">
            <el-option
              v-for="template in reminderTemplates"
              :key="template.id"
              :label="template.name"
              :value="template.id"
            />
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

    <!-- 逾期跟进对话框 -->
    <el-dialog
      v-model="followUpDialogVisible"
      title="逾期跟进"
      width="700px"
    >
      <el-form
        ref="followUpFormRef"
        :model="followUpForm"
        :rules="followUpRules"
        label-width="120px"
      >
        <el-form-item label="客户名称">
          <el-input v-model="followUpForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="逾期金额">
          <el-input v-model="followUpForm.overdueAmount" disabled />
        </el-form-item>
        <el-form-item label="逾期天数">
          <el-input v-model="followUpForm.overdueDays" disabled />
        </el-form-item>
        <el-form-item label="跟进日期" prop="followUpDate">
          <el-date-picker
            v-model="followUpForm.followUpDate"
            type="date"
            placeholder="请选择跟进日期"
          />
        </el-form-item>
        <el-form-item label="跟进人" prop="follower">
          <el-select v-model="followUpForm.follower" placeholder="请选择跟进人">
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
            <el-option label="赵六" value="赵六" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进方式" prop="followUpMethod">
          <el-select v-model="followUpForm.followUpMethod" placeholder="请选择跟进方式">
            <el-option label="电话" value="phone" />
            <el-option label="邮件" value="email" />
            <el-option label="面谈" value="faceToFace" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户反馈" prop="customerFeedback">
          <el-input
            v-model="followUpForm.customerFeedback"
            type="textarea"
            placeholder="请输入客户反馈"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="还款计划" prop="paymentPlan">
          <el-input
            v-model="followUpForm.paymentPlan"
            type="textarea"
            placeholder="请输入还款计划"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="跟进备注" prop="remark">
          <el-input
            v-model="followUpForm.remark"
            type="textarea"
            placeholder="请输入跟进备注"
            rows="2"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="followUpDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmFollowUp">保存跟进记录</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'AgingAnalysis',
  setup() {
    // 状态管理
    const loading = ref(false);
    const agingData = ref([]);
    const selectedRows = ref([]);
    const customerDetailDialogVisible = ref(false);
    const reminderDialogVisible = ref(false);
    const followUpDialogVisible = ref(false);
    const selectedCustomer = ref(null);
    const showZeroBalance = ref(false);
    const trendTimeRange = ref('6months');

    // 图表引用
    const agingDistributionChart = ref(null);
    const agingTrendChart = ref(null);
    const customerTypeChart = ref(null);
    const salesPersonChart = ref(null);

    // 表单引用
    const reminderFormRef = ref(null);
    const followUpFormRef = ref(null);

    // 搜索表单
    const searchForm = reactive({
      analysisDate: new Date(),
      customerName: '',
      customerType: '',
      salesPerson: '',
      amountMin: null,
      amountMax: null
    });

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });

    // 提醒表单
    const reminderForm = reactive({
      customerName: '',
      outstandingAmount: '',
      reminderType: 'email',
      templateId: '',
      content: '',
      ccRecipients: ''
    });

    // 跟进表单
    const followUpForm = reactive({
      customerName: '',
      overdueAmount: '',
      overdueDays: '',
      followUpDate: new Date(),
      follower: '张三',
      followUpMethod: 'phone',
      customerFeedback: '',
      paymentPlan: '',
      remark: ''
    });

    // 提醒模板
    const reminderTemplates = ref([
      { id: '1', name: '常规提醒', content: '尊敬的客户，您的应收账款已到期，请及时安排付款。' },
      { id: '2', name: '紧急提醒', content: '尊敬的客户，您的应收账款已逾期，请尽快安排付款，以免影响后续合作。' },
      { id: '3', name: '友好提醒', content: '亲爱的客户，温馨提醒您，您的账款即将到期，请提前安排付款。' }
    ]);

    // 表单验证规则
    const reminderRules = {
      reminderType: [{ required: true, message: '请选择提醒类型', trigger: 'change' }],
      templateId: [{ required: true, message: '请选择提醒模板', trigger: 'change' }],
      content: [{ required: true, message: '请输入提醒内容', trigger: 'blur' }]
    };

    const followUpRules = {
      followUpDate: [{ required: true, message: '请选择跟进日期', trigger: 'change' }],
      follower: [{ required: true, message: '请选择跟进人', trigger: 'change' }],
      followUpMethod: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
      customerFeedback: [{ required: true, message: '请输入客户反馈', trigger: 'blur' }],
      paymentPlan: [{ required: true, message: '请输入还款计划', trigger: 'blur' }]
    };

    // 计算属性
    const filteredAgingData = computed(() => {
      let data = [...agingData.value];
      
      // 筛选零余额
      if (!showZeroBalance.value) {
        data = data.filter(item => item.currentBalance > 0);
      }
      
      // 应用搜索条件
      if (searchForm.customerName) {
        data = data.filter(item => 
          item.customerName.toLowerCase().includes(searchForm.customerName.toLowerCase())
        );
      }
      if (searchForm.customerType) {
        data = data.filter(item => item.customerType === searchForm.customerType);
      }
      if (searchForm.salesPerson) {
        data = data.filter(item => item.salesPerson === searchForm.salesPerson);
      }
      if (searchForm.amountMin !== null && searchForm.amountMin !== undefined) {
        data = data.filter(item => item.currentBalance >= searchForm.amountMin);
      }
      if (searchForm.amountMax !== null && searchForm.amountMax !== undefined) {
        data = data.filter(item => item.currentBalance <= searchForm.amountMax);
      }
      
      // 分页
      const start = (pagination.currentPage - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      pagination.total = data.length;
      
      return data.slice(start, end);
    });

    // 应收账款总额
    const totalReceivable = computed(() => {
      return agingData.value.reduce((sum, item) => sum + item.currentBalance, 0);
    });

    // 逾期金额
    const overdueAmount = computed(() => {
      return agingData.value.reduce((sum, item) => {
        const overdue = item.days31To60 + item.days61To90 + item.days91To180 + item.daysOver180;
        return sum + overdue;
      }, 0);
    });

    // 逾期率
    const overdueRate = computed(() => {
      if (totalReceivable.value === 0) return 0;
      return Math.round((overdueAmount.value / totalReceivable.value) * 100);
    });

    // 平均账龄
    const avgAgingDays = computed(() => {
      let totalDays = 0;
      let totalAmount = 0;
      
      agingData.value.forEach(item => {
        const amount = item.currentBalance;
        if (amount > 0) {
          // 加权平均计算账龄
          totalDays += (item.days0To30 * 15) + (item.days31To60 * 45) + 
                      (item.days61To90 * 75) + (item.days91To180 * 135) + 
                      (item.daysOver180 * 200);
          totalAmount += amount;
        }
      });
      
      if (totalAmount === 0) return 0;
      return Math.round(totalDays / totalAmount);
    });

    // 账龄趋势
    const agingTrend = ref(-5); // 模拟数据，较上期下降5%

    // 超期客户数
    const overdueCustomerCount = computed(() => {
      return agingData.value.filter(item => item.overdueDays > 0).length;
    });

    // 超期客户比例
    const overdueCustomerRate = computed(() => {
      if (agingData.value.length === 0) return 0;
      return Math.round((overdueCustomerCount.value / agingData.value.length) * 100);
    });

    // 坏账风险金额（超期90天以上）
    const badDebtRiskAmount = computed(() => {
      return agingData.value.reduce((sum, item) => {
        return sum + item.days91To180 + item.daysOver180;
      }, 0);
    });

    // 本月回收
    const currentMonthRecovery = ref(125000.00); // 模拟数据

    // 本月回收计划完成率
    const monthRecoveryRate = ref(83); // 模拟数据

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

    // 获取客户类型标签样式
    const getCustomerTypeTag = (type) => {
      switch (type) {
        case 'direct': return 'primary';
        case 'distributor': return 'success';
        case 'retail': return 'info';
        case 'vip': return 'warning';
        default: return 'default';
      }
    };

    // 获取客户类型文本
    const getCustomerTypeText = (type) => {
      switch (type) {
        case 'direct': return '直销客户';
        case 'distributor': return '经销客户';
        case 'retail': return '零售客户';
        case 'vip': return '大客户';
        default: return '其他';
      }
    };

    // 获取信用等级文本
    const getCreditLevelText = (level) => {
      switch (level) {
        case 'AAA': return 'AAA级';
        case 'AA': return 'AA级';
        case 'A': return 'A级';
        case 'BBB': return 'BBB级';
        case 'BB': return 'BB级';
        case 'B': return 'B级';
        default: return 'C级';
      }
    };

    // 获取逾期天数标签样式
    const getOverdueDaysTag = (days) => {
      if (days === 0) return 'success';
      if (days <= 30) return 'warning';
      if (days <= 90) return 'danger';
      return 'danger';
    };

    // 获取账龄等级标签样式
    const getAgingLevelTag = (level) => {
      switch (level) {
        case 'normal': return 'success';
        case 'warning': return 'warning';
        case 'danger': return 'danger';
        default: return 'info';
      }
    };

    // 获取账龄等级文本
    const getAgingLevelText = (level) => {
      switch (level) {
        case 'normal': return '正常';
        case 'warning': return '预警';
        case 'danger': return '危险';
        default: return '未知';
      }
    };

    // 获取风险等级标签样式
    const getRiskLevelTag = (level) => {
      switch (level) {
        case 'low': return 'success';
        case 'medium': return 'warning';
        case 'high': return 'danger';
        default: return 'info';
      }
    };

    // 获取风险等级文本
    const getRiskLevelText = (level) => {
      switch (level) {
        case 'low': return '低风险';
        case 'medium': return '中风险';
        case 'high': return '高风险';
        default: return '未知';
      }
    };

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'unpaid': return 'danger';
        case 'partially_paid': return 'warning';
        case 'paid': return 'success';
        default: return 'info';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'unpaid': return '未付款';
        case 'partially_paid': return '部分付款';
        case 'paid': return '已付款';
        default: return '未知';
      }
    };

    // 获取还款方式文本
    const getPaymentMethodText = (method) => {
      switch (method) {
        case 'bankTransfer': return '银行转账';
        case 'alipay': return '支付宝';
        case 'wechat': return '微信支付';
        case 'cash': return '现金';
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

    // 搜索
    const search = () => {
      pagination.currentPage = 1;
    };

    // 重置搜索
    const resetSearch = () => {
      Object.keys(searchForm).forEach(key => {
        if (key === 'analysisDate') {
          searchForm[key] = new Date();
        } else if (key === 'amountMin' || key === 'amountMax') {
          searchForm[key] = null;
        } else {
          searchForm[key] = '';
        }
      });
      pagination.currentPage = 1;
    };

    // 查看客户详情
    const viewCustomerDetails = (row) => {
      // 模拟加载客户详情
      selectedCustomer.value = {
        ...row,
        customerCode: 'CUST' + String(row.id).padStart(4, '0'),
        phone: '138****' + Math.floor(Math.random() * 10000),
        averagePaymentDays: row.overdueDays > 0 ? row.overdueDays : 30,
        overdueCount: Math.floor(Math.random() * 5),
        totalSalesAmount: Math.random() * 1000000,
        totalPaymentAmount: Math.random() * 800000,
        invoiceDetails: [
          {
            invoiceNumber: 'INV2024' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
            invoiceDate: '2024-01-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
            dueDate: '2024-02-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
            invoiceAmount: Math.random() * 50000 + 10000,
            paidAmount: Math.random() * 30000,
            outstandingAmount: Math.random() * 20000 + 5000,
            overdueDays: Math.floor(Math.random() * 60),
            status: Math.random() > 0.5 ? 'unpaid' : 'partially_paid',
            remark: Math.random() > 0.5 ? '待跟进' : ''
          },
          {
            invoiceNumber: 'INV2024' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
            invoiceDate: '2024-01-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
            dueDate: '2024-02-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
            invoiceAmount: Math.random() * 30000 + 5000,
            paidAmount: Math.random() * 10000,
            outstandingAmount: Math.random() * 15000 + 2000,
            overdueDays: Math.floor(Math.random() * 30),
            status: 'partially_paid',
            remark: Math.random() > 0.5 ? '客户承诺本周付款' : ''
          }
        ],
        recentPayments: [
          {
            paymentDate: '2024-01-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
            paymentAmount: Math.random() * 30000 + 5000,
            paymentMethod: Math.random() > 0.5 ? 'bankTransfer' : 'alipay',
            transactionNumber: 'TRX' + Math.floor(Math.random() * 100000000),
            operator: '张三',
            remark: '收到部分货款'
          },
          {
            paymentDate: '2023-12-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
            paymentAmount: Math.random() * 50000 + 10000,
            paymentMethod: Math.random() > 0.5 ? 'bankTransfer' : 'wechat',
            transactionNumber: 'TRX' + Math.floor(Math.random() * 100000000),
            operator: '李四',
            remark: '年末回款'
          }
        ]
      };
      customerDetailDialogVisible.value = true;
    };

    // 发送提醒
    const sendReminder = (row) => {
      reminderForm.customerName = row.customerName;
      reminderForm.outstandingAmount = formatCurrency(row.currentBalance);
      reminderForm.reminderType = 'email';
      reminderForm.templateId = '';
      reminderForm.content = '';
      reminderForm.ccRecipients = '';
      reminderDialogVisible.value = true;
    };

    // 模板选择变化
    const onTemplateChange = () => {
      const template = reminderTemplates.value.find(t => t.id === reminderForm.templateId);
      if (template) {
        reminderForm.content = template.content;
      }
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

    // 逾期跟进
    const followUpOverdue = (row) => {
      followUpForm.customerName = row.customerName;
      followUpForm.overdueAmount = formatCurrency(row.currentBalance);
      followUpForm.overdueDays = row.overdueDays + '天';
      followUpForm.followUpDate = new Date();
      followUpForm.follower = '张三';
      followUpForm.followUpMethod = 'phone';
      followUpForm.customerFeedback = '';
      followUpForm.paymentPlan = '';
      followUpForm.remark = '';
      followUpDialogVisible.value = true;
    };

    // 确认跟进
    const confirmFollowUp = () => {
      followUpFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟保存
          setTimeout(() => {
            ElMessage.success('跟进记录保存成功');
            followUpDialogVisible.value = false;
          }, 500);
        }
      });
    };

    // 导出分析报表
    const exportAnalysis = () => {
      ElMessageBox.confirm('确定要导出账龄分析报表吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        loading.value = true;
        // 模拟导出
        setTimeout(() => {
          ElMessage.success('报表导出成功');
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
        const mockData = [
          {
            id: 1,
            customerName: '北京科技有限公司',
            customerType: 'direct',
            salesPerson: '张三',
            creditLimit: 1000000.00,
            creditLevel: 'AAA',
            currentBalance: 150000.00,
            days0To30: 50000.00,
            days31To60: 80000.00,
            days61To90: 20000.00,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 45,
            agingLevel: 'warning',
            riskLevel: 'medium',
            lastPaymentDate: '2024-01-15'
          },
          {
            id: 2,
            customerName: '上海贸易公司',
            customerType: 'distributor',
            salesPerson: '李四',
            creditLimit: 800000.00,
            creditLevel: 'AA',
            currentBalance: 280000.00,
            days0To30: 100000.00,
            days31To60: 50000.00,
            days61To90: 70000.00,
            days91To180: 40000.00,
            daysOver180: 20000.00,
            overdueDays: 75,
            agingLevel: 'danger',
            riskLevel: 'high',
            lastPaymentDate: '2023-12-20'
          },
          {
            id: 3,
            customerName: '广州制造有限公司',
            customerType: 'direct',
            salesPerson: '王五',
            creditLimit: 1500000.00,
            creditLevel: 'AAA',
            currentBalance: 80000.00,
            days0To30: 80000.00,
            days31To60: 0,
            days61To90: 0,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 0,
            agingLevel: 'normal',
            riskLevel: 'low',
            lastPaymentDate: '2024-01-25'
          },
          {
            id: 4,
            customerName: '深圳科技集团',
            customerType: 'vip',
            salesPerson: '赵六',
            creditLimit: 2000000.00,
            creditLevel: 'AAA',
            currentBalance: 320000.00,
            days0To30: 200000.00,
            days31To60: 120000.00,
            days61To90: 0,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 15,
            agingLevel: 'warning',
            riskLevel: 'medium',
            lastPaymentDate: '2024-01-20'
          },
          {
            id: 5,
            customerName: '杭州电子有限公司',
            customerType: 'retail',
            salesPerson: '张三',
            creditLimit: 500000.00,
            creditLevel: 'A',
            currentBalance: 120000.00,
            days0To30: 0,
            days31To60: 0,
            days61To90: 80000.00,
            days91To180: 40000.00,
            daysOver180: 0,
            overdueDays: 85,
            agingLevel: 'danger',
            riskLevel: 'high',
            lastPaymentDate: '2023-11-30'
          },
          {
            id: 6,
            customerName: '南京自动化科技',
            customerType: 'direct',
            salesPerson: '李四',
            creditLimit: 600000.00,
            creditLevel: 'AA',
            currentBalance: 0,
            days0To30: 0,
            days31To60: 0,
            days61To90: 0,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 0,
            agingLevel: 'normal',
            riskLevel: 'low',
            lastPaymentDate: '2024-01-30'
          },
          {
            id: 7,
            customerName: '成都软件科技有限公司',
            customerType: 'vip',
            salesPerson: '王五',
            creditLimit: 1200000.00,
            creditLevel: 'AAA',
            currentBalance: 180000.00,
            days0To30: 150000.00,
            days31To60: 30000.00,
            days61To90: 0,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 10,
            agingLevel: 'normal',
            riskLevel: 'low',
            lastPaymentDate: '2024-01-28'
          },
          {
            id: 8,
            customerName: '武汉网络科技公司',
            customerType: 'retail',
            salesPerson: '赵六',
            creditLimit: 300000.00,
            creditLevel: 'B',
            currentBalance: 60000.00,
            days0To30: 0,
            days31To60: 0,
            days61To90: 0,
            days91To180: 30000.00,
            daysOver180: 30000.00,
            overdueDays: 195,
            agingLevel: 'danger',
            riskLevel: 'high',
            lastPaymentDate: '2023-10-15'
          },
          {
            id: 9,
            customerName: '西安电子信息公司',
            customerType: 'direct',
            salesPerson: '张三',
            creditLimit: 900000.00,
            creditLevel: 'AA',
            currentBalance: 90000.00,
            days0To30: 90000.00,
            days31To60: 0,
            days61To90: 0,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 0,
            agingLevel: 'normal',
            riskLevel: 'low',
            lastPaymentDate: '2024-01-22'
          },
          {
            id: 10,
            customerName: '重庆智能科技有限公司',
            customerType: 'distributor',
            salesPerson: '李四',
            creditLimit: 700000.00,
            creditLevel: 'A',
            currentBalance: 140000.00,
            days0To30: 0,
            days31To60: 100000.00,
            days61To90: 40000.00,
            days91To180: 0,
            daysOver180: 0,
            overdueDays: 55,
            agingLevel: 'warning',
            riskLevel: 'medium',
            lastPaymentDate: '2023-12-15'
          }
        ];

        agingData.value = mockData;
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
      agingData,
      selectedRows,
      searchForm,
      pagination,
      customerDetailDialogVisible,
      reminderDialogVisible,
      followUpDialogVisible,
      selectedCustomer,
      showZeroBalance,
      trendTimeRange,
      agingDistributionChart,
      agingTrendChart,
      customerTypeChart,
      salesPersonChart,
      reminderForm,
      reminderFormRef,
      followUpForm,
      followUpFormRef,
      reminderTemplates,
      reminderRules,
      followUpRules,
      filteredAgingData,
      totalReceivable,
      overdueAmount,
      overdueRate,
      avgAgingDays,
      agingTrend,
      overdueCustomerCount,
      overdueCustomerRate,
      badDebtRiskAmount,
      currentMonthRecovery,
      monthRecoveryRate,
      formatDate,
      formatCurrency,
      isOverdue,
      getCustomerTypeTag,
      getCustomerTypeText,
      getCreditLevelText,
      getOverdueDaysTag,
      getAgingLevelTag,
      getAgingLevelText,
      getRiskLevelTag,
      getRiskLevelText,
      getStatusType,
      getStatusText,
      getPaymentMethodText,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      viewCustomerDetails,
      sendReminder,
      onTemplateChange,
      confirmSendReminder,
      followUpOverdue,
      confirmFollowUp,
      exportAnalysis,
      refreshData,
      updateCharts
    };
  }
};
</script>

<style scoped>
.aging-analysis {
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

.customer-detail {
  max-height: 600px;
  overflow-y: auto;
}

.aging-details,
.payment-records {
  margin-top: 25px;
}

.aging-details h4,
.payment-records h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #303133;
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}
</style>