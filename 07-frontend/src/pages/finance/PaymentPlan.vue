<template>
  <CommonFinanceTemplate
    pageTitle="付款计划管理"
    :show-search="true"
    :show-table="true"
    :show-pagination="true"
    :show-statistics="true"
    :show-chart="true"
    ref="templateRef"
    @search="handleSearch"
    @reset="handleReset"
    @page-change="handlePageChange"
    @mounted="handleMounted"
  >
    <!-- 图表切换标签 -->
    <template #chart-tabs>
      <el-radio-group v-model="activeChartTab" @change="handleChartTabChange" style="margin-bottom: 20px;">
        <el-radio-button label="paymentTrendChart">付款趋势图</el-radio-button>
        <el-radio-button label="categoryDistributionChart">类别分布</el-radio-button>
        <el-radio-button label="statusChart">状态分析</el-radio-button>
        <el-radio-button label="paymentTimingChart">付款时间分布</el-radio-button>
      </el-radio-group>
    </template>
    
    <!-- 付款趋势图 -->
    <template #paymentTrendChart>
      <div class="chart-container">
        <canvas ref="paymentTrendChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 类别分布图 -->
    <template #categoryDistributionChart>
      <div class="chart-container">
        <canvas ref="categoryDistributionChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 状态分析图 -->
    <template #statusChart>
      <div class="chart-container">
        <canvas ref="statusChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 付款时间分布图 -->
    <template #paymentTimingChart>
      <div class="chart-container">
        <canvas ref="paymentTimingChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 自定义操作列 -->
    <template #operation="{ row }">
      <el-button type="primary" size="small" @click="handleViewDetail(row)">查看</el-button>
      <el-button type="success" size="small" @click="handleEditPlan(row)" :disabled="row.status === 'paid' || row.status === 'cancelled'">编辑</el-button>
      <el-button type="warning" size="small" @click="handleExecutePayment(row)" :disabled="row.status === 'paid' || row.status === 'cancelled'">执行付款</el-button>
      <el-button type="danger" size="small" @click="handleCancelPlan(row)" :disabled="row.status === 'paid' || row.status === 'cancelled'">取消</el-button>
    </template>
    
    <!-- 付款计划编辑对话框 -->
    <template #dialog-edit="{ dialog }">
      <div class="payment-plan-form-container">
        <el-form :model="paymentPlanForm" :rules="paymentPlanFormRules" ref="paymentPlanFormRef" label-width="120px">
          <el-form-item label="计划名称" prop="planName">
            <el-input v-model="paymentPlanForm.planName" placeholder="请输入付款计划名称" />
          </el-form-item>
          <el-form-item label="供应商" prop="supplierId">
            <el-select v-model="paymentPlanForm.supplierId" placeholder="请选择供应商" filterable>
              <el-option v-for="supplier in supplierOptions" :key="supplier.value" :label="supplier.label" :value="supplier.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="付款金额" prop="amount">
            <el-input v-model.number="paymentPlanForm.amount" type="number" placeholder="请输入付款金额" suffix-icon="el-icon-money" />
          </el-form-item>
          <el-form-item label="计划日期" prop="planDate">
            <el-date-picker v-model="paymentPlanForm.planDate" type="date" placeholder="选择计划日期" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="优先级" prop="priority">
            <el-rate v-model="paymentPlanForm.priority" :max="5" show-score />
          </el-form-item>
          <el-form-item label="付款类别" prop="category">
            <el-select v-model="paymentPlanForm.category" placeholder="请选择付款类别">
              <el-option v-for="category in categoryOptions" :key="category.value" :label="category.label" :value="category.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="支付方式" prop="paymentMethod">
            <el-select v-model="paymentPlanForm.paymentMethod" placeholder="请选择支付方式">
              <el-option label="银行转账" value="bank_transfer" />
              <el-option label="支付宝" value="alipay" />
              <el-option label="微信支付" value="wechat_pay" />
              <el-option label="支票" value="check" />
              <el-option label="现金" value="cash" />
            </el-select>
          </el-form-item>
          <el-form-item label="结算周期" prop="settlementPeriod">
            <el-select v-model="paymentPlanForm.settlementPeriod" placeholder="请选择结算周期">
              <el-option label="一次性" value="one_time" />
              <el-option label="月度" value="monthly" />
              <el-option label="季度" value="quarterly" />
              <el-option label="半年" value="half_yearly" />
              <el-option label="年度" value="yearly" />
            </el-select>
          </el-form-item>
          <el-form-item label="关联合同" prop="contractId">
            <el-input v-model="paymentPlanForm.contractId" placeholder="请输入合同编号" />
          </el-form-item>
          <el-form-item label="负责人" prop="responsiblePerson">
            <el-select v-model="paymentPlanForm.responsiblePerson" placeholder="请选择负责人">
              <el-option v-for="person in personOptions" :key="person.value" :label="person.label" :value="person.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="备注说明" prop="description">
            <el-input v-model="paymentPlanForm.description" type="textarea" :rows="3" placeholder="请输入备注说明" />
          </el-form-item>
        </el-form>
      </div>
    </template>
    
    <!-- 执行付款对话框 -->
    <template #dialog-execute="{ dialog }">
      <div class="execute-payment-container">
        <el-form :model="executePaymentForm" :rules="executePaymentFormRules" ref="executePaymentFormRef" label-width="120px">
          <el-form-item label="计划名称" prop="planName">
            <el-input v-model="executePaymentForm.planName" disabled />
          </el-form-item>
          <el-form-item label="实际付款金额" prop="actualAmount">
            <el-input v-model.number="executePaymentForm.actualAmount" type="number" placeholder="请输入实际付款金额" suffix-icon="el-icon-money" />
          </el-form-item>
          <el-form-item label="付款日期" prop="actualDate">
            <el-date-picker v-model="executePaymentForm.actualDate" type="date" placeholder="选择实际付款日期" style="width: 100%;" />
          </el-form-item>
          <el-form-item label="支付方式" prop="paymentMethod">
            <el-select v-model="executePaymentForm.paymentMethod" placeholder="请选择支付方式">
              <el-option label="银行转账" value="bank_transfer" />
              <el-option label="支付宝" value="alipay" />
              <el-option label="微信支付" value="wechat_pay" />
              <el-option label="支票" value="check" />
              <el-option label="现金" value="cash" />
            </el-select>
          </el-form-item>
          <el-form-item label="交易流水号" prop="transactionId">
            <el-input v-model="executePaymentForm.transactionId" placeholder="请输入交易流水号" />
          </el-form-item>
          <el-form-item label="付款账号" prop="paymentAccount">
            <el-select v-model="executePaymentForm.paymentAccount" placeholder="请选择付款账号">
              <el-option v-for="account in accountOptions" :key="account.value" :label="account.label" :value="account.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="财务审核人" prop="approver">
            <el-select v-model="executePaymentForm.approver" placeholder="请选择财务审核人">
              <el-option v-for="person in personOptions" :key="person.value" :label="person.label" :value="person.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="付款凭证" prop="receipt">
            <el-upload
              class="upload-demo"
              drag
              action=""
              :auto-upload="false"
              :file-list="executePaymentForm.receipts"
              @change="handleReceiptChange"
              multiple
            >
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              <template #tip>
                <div class="el-upload__tip">
                  请上传银行回单、付款凭证等文件，支持 PDF、JPG、PNG 格式，单个文件不超过 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item label="付款说明" prop="paymentDescription">
            <el-input v-model="executePaymentForm.paymentDescription" type="textarea" :rows="3" placeholder="请输入付款说明" />
          </el-form-item>
        </el-form>
      </div>
    </template>
    
    <!-- 付款计划详情查看对话框 -->
    <template #dialog-view-detail="{ dialog }">
      <div class="payment-plan-detail-container">
        <h3>{{ currentPlanDetail.planName }} - 详细信息</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="计划名称">{{ currentPlanDetail.planName }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ getSupplierText(currentPlanDetail.supplierId) }}</el-descriptions-item>
          <el-descriptions-item label="计划金额">{{ formatCurrency(currentPlanDetail.amount) }}</el-descriptions-item>
          <el-descriptions-item label="实际付款金额">{{ currentPlanDetail.actualAmount ? formatCurrency(currentPlanDetail.actualAmount) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="计划日期">{{ formatDate(currentPlanDetail.planDate) }}</el-descriptions-item>
          <el-descriptions-item label="实际付款日期">{{ currentPlanDetail.actualDate ? formatDate(currentPlanDetail.actualDate) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="优先级">{{ getPriorityText(currentPlanDetail.priority) }}</el-descriptions-item>
          <el-descriptions-item label="付款类别">{{ getCategoryText(currentPlanDetail.category) }}</el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPaymentMethodText(currentPlanDetail.paymentMethod) }}</el-descriptions-item>
          <el-descriptions-item label="结算周期">{{ getSettlementPeriodText(currentPlanDetail.settlementPeriod) }}</el-descriptions-item>
          <el-descriptions-item label="关联合同">{{ currentPlanDetail.contractId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ getPersonText(currentPlanDetail.responsiblePerson) }}</el-descriptions-item>
          <el-descriptions-item label="财务审核人">{{ currentPlanDetail.approver ? getPersonText(currentPlanDetail.approver) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="交易流水号">{{ currentPlanDetail.transactionId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusTag(currentPlanDetail.status) }}</el-descriptions-item>
          <el-descriptions-item label="创建日期">{{ formatDateTime(currentPlanDetail.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新日期">{{ formatDateTime(currentPlanDetail.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注说明">{{ currentPlanDetail.description || '-' }}</el-descriptions-item>
          <el-descriptions-item label="付款说明">{{ currentPlanDetail.paymentDescription || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 付款凭证 -->
        <div v-if="currentPlanDetail.receipts && currentPlanDetail.receipts.length > 0" style="margin-top: 20px;">
          <h4>付款凭证</h4>
          <el-image
            v-for="(receipt, index) in currentPlanDetail.receipts"
            :key="index"
            :src="receipt.url || ''"
            :preview-src-list="currentPlanDetail.receipts.map(r => r.url || '')"
            style="width: 100px; height: 100px; margin-right: 10px; margin-bottom: 10px;"
            fit="cover"
          >
            <template #placeholder>
              <div class="image-placeholder">{{ receipt.name }}</div>
            </template>
          </el-image>
        </div>
      </div>
    </template>
  </CommonFinanceTemplate>
</template>

<script>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import CommonFinanceTemplate from './template/CommonFinanceTemplate.vue';

// 模拟图表库，实际应用中应引入真实的图表库如 Chart.js
class MockChart {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    this.destroyed = false;
    console.log('Mock Chart initialized:', config);
    // 在实际应用中，这里会初始化真实的图表
  }
  
  update() {
    if (!this.destroyed) {
      console.log('Mock Chart updated');
    }
  }
  
  destroy() {
    this.destroyed = true;
    console.log('Mock Chart destroyed');
  }
}

export default {
  name: 'PaymentPlan',
  components: {
    CommonFinanceTemplate
  },
  setup() {
    // 模板引用
    const templateRef = ref(null);
    const paymentPlanFormRef = ref(null);
    const executePaymentFormRef = ref(null);
    
    // 图表引用
    const paymentTrendChartRef = ref(null);
    const categoryDistributionChartRef = ref(null);
    const statusChartRef = ref(null);
    const paymentTimingChartRef = ref(null);
    
    // 图表实例
    const chartInstances = reactive({
      paymentTrendChart: null,
      categoryDistributionChart: null,
      statusChart: null,
      paymentTimingChart: null
    });
    
    // 状态管理
    const activeChartTab = ref('paymentTrendChart');
    const chartWidth = ref(800);
    const chartHeight = ref(400);
    const currentPlanDetail = reactive({});
    const isEditMode = ref(false);
    
    // 付款计划数据
    const paymentPlanData = ref([]);
    
    // 供应商选项
    const supplierOptions = ref([
      { label: '供应商A', value: 'supplier_001' },
      { label: '供应商B', value: 'supplier_002' },
      { label: '供应商C', value: 'supplier_003' },
      { label: '供应商D', value: 'supplier_004' },
      { label: '供应商E', value: 'supplier_005' }
    ]);
    
    // 付款类别选项
    const categoryOptions = ref([
      { label: '原材料采购', value: 'material_purchase' },
      { label: '设备采购', value: 'equipment_purchase' },
      { label: '服务费用', value: 'service_fee' },
      { label: '运输费用', value: 'transport_fee' },
      { label: '办公费用', value: 'office_expense' },
      { label: '租金', value: 'rent' },
      { label: '水电费', value: 'utility_bill' },
      { label: '税费', value: 'tax_payment' },
      { label: '工资薪资', value: 'salary' },
      { label: '其他费用', value: 'other' }
    ]);
    
    // 人员选项
    const personOptions = ref([
      { label: '张三', value: 'person_001' },
      { label: '李四', value: 'person_002' },
      { label: '王五', value: 'person_003' },
      { label: '赵六', value: 'person_004' },
      { label: '钱七', value: 'person_005' }
    ]);
    
    // 银行账户选项
    const accountOptions = ref([
      { label: '工商银行-基本户', value: 'account_001' },
      { label: '建设银行-一般户', value: 'account_002' },
      { label: '中国银行-外汇户', value: 'account_003' },
      { label: '农业银行-专用户', value: 'account_004' }
    ]);
    
    // 付款计划表单
    const paymentPlanForm = reactive({
      id: '',
      planName: '',
      supplierId: '',
      amount: '',
      planDate: '',
      priority: 3,
      category: '',
      paymentMethod: '',
      settlementPeriod: 'one_time',
      contractId: '',
      responsiblePerson: '',
      description: ''
    });
    
    // 付款计划表单验证规则
    const paymentPlanFormRules = {
      planName: [
        { required: true, message: '请输入付款计划名称', trigger: 'blur' },
        { min: 2, max: 100, message: '计划名称长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      supplierId: [
        { required: true, message: '请选择供应商', trigger: 'change' }
      ],
      amount: [
        { required: true, message: '请输入付款金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '付款金额必须大于0', trigger: 'blur' }
      ],
      planDate: [
        { required: true, message: '请选择计划日期', trigger: 'change' }
      ],
      category: [
        { required: true, message: '请选择付款类别', trigger: 'change' }
      ],
      paymentMethod: [
        { required: true, message: '请选择支付方式', trigger: 'change' }
      ],
      settlementPeriod: [
        { required: true, message: '请选择结算周期', trigger: 'change' }
      ],
      responsiblePerson: [
        { required: true, message: '请选择负责人', trigger: 'change' }
      ]
    };
    
    // 执行付款表单
    const executePaymentForm = reactive({
      id: '',
      planId: '',
      planName: '',
      actualAmount: '',
      actualDate: '',
      paymentMethod: '',
      transactionId: '',
      paymentAccount: '',
      approver: '',
      receipts: [],
      paymentDescription: ''
    });
    
    // 执行付款表单验证规则
    const executePaymentFormRules = {
      actualAmount: [
        { required: true, message: '请输入实际付款金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '付款金额必须大于0', trigger: 'blur' }
      ],
      actualDate: [
        { required: true, message: '请选择实际付款日期', trigger: 'change' }
      ],
      paymentMethod: [
        { required: true, message: '请选择支付方式', trigger: 'change' }
      ],
      transactionId: [
        { required: true, message: '请输入交易流水号', trigger: 'blur' }
      ],
      paymentAccount: [
        { required: true, message: '请选择付款账号', trigger: 'change' }
      ],
      approver: [
        { required: true, message: '请选择财务审核人', trigger: 'change' }
      ],
      receipts: [
        {
          validator: (rule, value, callback) => {
            if (value.length === 0) {
              callback(new Error('请至少上传一张付款凭证'));
            } else {
              callback();
            }
          },
          trigger: 'change'
        }
      ]
    };
    
    // 初始化搜索字段
    const initSearchFields = () => {
      const searchFields = [
        {
          key: 'planName',
          type: 'input',
          label: '计划名称',
          placeholder: '请输入付款计划名称'
        },
        {
          key: 'supplierId',
          type: 'select',
          label: '供应商',
          options: supplierOptions.value,
          clearable: true
        },
        {
          key: 'status',
          type: 'select',
          label: '状态',
          options: [
            { label: '待执行', value: 'pending' },
            { label: '已付款', value: 'paid' },
            { label: '已取消', value: 'cancelled' },
            { label: '部分付款', value: 'partially_paid' },
            { label: '逾期未付', value: 'overdue' }
          ],
          clearable: true
        },
        {
          key: 'category',
          type: 'select',
          label: '付款类别',
          options: categoryOptions.value,
          clearable: true
        },
        {
          key: 'priority',
          type: 'select',
          label: '优先级',
          options: [
            { label: '1星', value: 1 },
            { label: '2星', value: 2 },
            { label: '3星', value: 3 },
            { label: '4星', value: 4 },
            { label: '5星', value: 5 }
          ],
          clearable: true
        },
        {
          key: 'amountRange',
          type: 'input',
          label: '金额范围',
          placeholder: '例如: 1000-5000',
          description: '输入格式为: 最小值-最大值'
        },
        {
          key: 'planDateRange',
          type: 'date',
          label: '计划日期范围',
          dateType: 'daterange',
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期'
        },
        {
          key: 'responsiblePerson',
          type: 'select',
          label: '负责人',
          options: personOptions.value,
          clearable: true
        }
      ];
      
      templateRef.value?.initSearchForm(searchFields);
    };
    
    // 初始化统计卡片
    const initStatisticsCards = () => {
      const cards = [
        {
          label: '计划总数',
          value: '0',
          type: 'primary',
          description: '当前所有付款计划数量'
        },
        {
          label: '待执行计划',
          value: '0',
          type: 'warning',
          description: '尚未执行的付款计划数量'
        },
        {
          label: '本月计划金额',
          value: '0.00 元',
          type: 'success',
          description: '当月计划付款总额'
        },
        {
          label: '已执行金额',
          value: '0.00 元',
          type: 'info',
          description: '已完成付款的总额'
        },
        {
          label: '逾期计划',
          value: '0',
          type: 'danger',
          description: '超过计划日期未执行的数量'
        },
        {
          label: '总计划金额',
          value: '0.00 元',
          type: 'primary',
          description: '所有计划的付款总额'
        }
      ];
      
      templateRef.value?.setStatisticsCards(cards);
    };
    
    // 初始化表格列
    const initTableColumns = () => {
      const columns = [
        {
          type: 'index',
          label: '序号'
        },
        {
          prop: 'planName',
          label: '计划名称',
          minWidth: 180
        },
        {
          prop: 'supplierId',
          label: '供应商',
          width: 120,
          formatter: (row) => getSupplierText(row.supplierId)
        },
        {
          prop: 'amount',
          label: '计划金额',
          width: 120,
          formatter: (row) => formatCurrency(row.amount)
        },
        {
          prop: 'actualAmount',
          label: '已付金额',
          width: 120,
          formatter: (row) => formatCurrency(row.actualAmount || 0)
        },
        {
          prop: 'planDate',
          label: '计划日期',
          width: 120,
          formatter: (row) => formatDate(row.planDate)
        },
        {
          prop: 'priority',
          label: '优先级',
          width: 80,
          formatter: (row) => getPriorityText(row.priority)
        },
        {
          prop: 'category',
          label: '类别',
          width: 100,
          formatter: (row) => getCategoryText(row.category)
        },
        {
          prop: 'status',
          label: '状态',
          width: 100,
          formatter: (row) => getStatusTag(row.status)
        },
        {
          prop: 'responsiblePerson',
          label: '负责人',
          width: 80,
          formatter: (row) => getPersonText(row.responsiblePerson)
        },
        {
          prop: 'createdAt',
          label: '创建日期',
          width: 120,
          formatter: (row) => formatDate(row.createdAt)
        },
        {
          type: 'action',
          label: '操作',
          width: 240,
          template: 'operation'
        }
      ];
      
      templateRef.value?.setTableColumns(columns);
    };
    
    // 初始化对话框
    const initDialogs = () => {
      const dialogs = [
        {
          key: 'edit',
          visible: false,
          title: '编辑付款计划',
          width: '700px',
          onClose: () => {
            resetPaymentPlanForm();
          },
          buttons: [
            {
              key: 'save',
              text: '保存',
              type: 'primary',
              handler: handleSavePlan
            }
          ]
        },
        {
          key: 'execute',
          visible: false,
          title: '执行付款',
          width: '700px',
          onClose: () => {
            resetExecutePaymentForm();
          },
          buttons: [
            {
              key: 'confirm',
              text: '确认付款',
              type: 'primary',
              handler: handleConfirmPayment
            }
          ]
        },
        {
          key: 'view-detail',
          visible: false,
          title: '付款计划详情',
          width: '900px',
          onClose: () => {
            Object.keys(currentPlanDetail).forEach(key => delete currentPlanDetail[key]);
          },
          hideCancel: true,
          buttons: []
        }
      ];
      
      templateRef.value?.setDialogs(dialogs);
    };
    
    // 初始化头部操作按钮
    const initHeaderActions = () => {
      const actions = [
        {
          key: 'add',
          text: '新增付款计划',
          type: 'primary',
          icon: 'el-icon-plus',
          handler: handleAddPlan
        },
        {
          key: 'import',
          text: '导入计划',
          type: 'success',
          icon: 'el-icon-upload',
          handler: handleImportPlans
        },
        {
          key: 'export',
          text: '导出计划',
          type: 'info',
          icon: 'el-icon-download',
          handler: handleExportPlans
        },
        {
          key: 'batchExecute',
          text: '批量执行',
          type: 'warning',
          icon: 'el-icon-finished',
          handler: handleBatchExecute
        },
        {
          key: 'printReport',
          text: '打印报表',
          type: 'info',
          icon: 'el-icon-printer',
          handler: handlePrintReport
        },
        {
          key: 'refresh',
          text: '刷新数据',
          type: 'info',
          icon: 'el-icon-refresh',
          handler: handleRefreshData
        }
      ];
      
      templateRef.value?.setHeaderActions(actions);
    };
    
    // 加载付款计划数据
    const loadPaymentPlanData = () => {
      // 模拟数据加载
      const mockData = generateMockPaymentPlanData();
      paymentPlanData.value = mockData;
      
      // 更新统计信息
      updateStatistics(mockData);
      
      // 更新分页信息
      templateRef.value?.updatePagination(mockData.length, 1, 10);
    };
    
    // 生成模拟付款计划数据
    const generateMockPaymentPlanData = () => {
      const plans = [];
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      // 生成60条模拟数据
      for (let i = 0; i < 60; i++) {
        // 随机日期，范围为过去6个月到未来3个月
        const randomMonthOffset = Math.floor(Math.random() * 9) - 6;
        const planDate = new Date(currentYear, currentMonth + randomMonthOffset, Math.floor(Math.random() * 28) + 1);
        
        // 随机金额，1000-100000之间
        const amount = Math.floor(Math.random() * 99000) + 1000;
        
        // 随机状态
        const statusOptions = ['pending', 'paid', 'cancelled', 'partially_paid', 'overdue'];
        let status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
        
        // 根据日期判断是否应该逾期
        if (planDate < currentDate && status === 'pending') {
          status = 'overdue';
        }
        
        // 实际付款金额
        let actualAmount = null;
        let actualDate = null;
        if (status === 'paid') {
          actualAmount = amount;
          actualDate = new Date(planDate);
          // 付款日期在计划日期附近
          actualDate.setDate(planDate.getDate() + Math.floor(Math.random() * 3) - 1);
        } else if (status === 'partially_paid') {
          actualAmount = Math.floor(amount * (0.3 + Math.random() * 0.6)); // 30%-90%的随机比例
          actualDate = new Date(planDate);
        }
        
        // 随机供应商
        const supplierIndex = Math.floor(Math.random() * supplierOptions.value.length);
        const supplier = supplierOptions.value[supplierIndex];
        
        // 随机类别
        const categoryIndex = Math.floor(Math.random() * categoryOptions.value.length);
        const category = categoryOptions.value[categoryIndex];
        
        // 随机负责人
        const personIndex = Math.floor(Math.random() * personOptions.value.length);
        const person = personOptions.value[personIndex];
        
        // 支付方式
        const paymentMethods = ['bank_transfer', 'alipay', 'wechat_pay', 'check', 'cash'];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // 结算周期
        const settlementPeriods = ['one_time', 'monthly', 'quarterly', 'half_yearly', 'yearly'];
        const settlementPeriod = settlementPeriods[Math.floor(Math.random() * settlementPeriods.length)];
        
        // 优先级
        const priority = Math.floor(Math.random() * 5) + 1;
        
        const plan = {
          id: `plan_${i + 1}`,
          planName: `${category.label}-${supplier.label}-${i + 1}`,
          supplierId: supplier.value,
          amount,
          planDate: planDate.toISOString(),
          priority,
          category: category.value,
          paymentMethod,
          settlementPeriod,
          contractId: `CONTRACT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          responsiblePerson: person.value,
          description: `${category.label}付款计划`,
          status,
          actualAmount,
          actualDate: actualDate ? actualDate.toISOString() : null,
          transactionId: status === 'paid' ? `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}` : null,
          paymentAccount: status === 'paid' ? accountOptions.value[Math.floor(Math.random() * accountOptions.value.length)].value : null,
          approver: status === 'paid' ? personOptions.value[Math.floor(Math.random() * personOptions.value.length)].value : null,
          paymentDescription: status === 'paid' ? `${category.label}付款` : null,
          receipts: status === 'paid' ? [
            {
              name: '付款凭证.pdf',
              url: '',
              size: Math.floor(Math.random() * 500) + 100
            }
          ] : [],
          createdAt: new Date(currentYear, currentMonth - Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
          updatedAt: new Date(currentYear, currentMonth - Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString()
        };
        
        plans.push(plan);
      }
      
      // 按计划日期排序（最近的在前）
      plans.sort((a, b) => new Date(a.planDate) - new Date(b.planDate));
      
      return plans;
    };
    
    // 更新统计信息
    const updateStatistics = (data) => {
      if (data.length === 0) return;
      
      // 计算统计数据
      const totalCount = data.length;
      const pendingCount = data.filter(plan => plan.status === 'pending').length;
      const overdueCount = data.filter(plan => plan.status === 'overdue').length;
      
      // 获取当前月份
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      
      // 计算本月计划金额
      let currentMonthTotal = 0;
      data.forEach(plan => {
        const planDate = new Date(plan.planDate);
        if (planDate.getFullYear() === currentYear && planDate.getMonth() + 1 === currentMonth) {
          currentMonthTotal += plan.amount;
        }
      });
      
      // 计算已执行金额
      let executedTotal = 0;
      data.forEach(plan => {
        if (plan.actualAmount) {
          executedTotal += plan.actualAmount;
        }
      });
      
      // 计算总计划金额
      const totalAmount = data.reduce((sum, plan) => sum + plan.amount, 0);
      
      const cards = templateRef.value?.statisticsCards || [];
      if (cards.length >= 6) {
        cards[0].value = totalCount.toString();
        cards[1].value = pendingCount.toString();
        cards[2].value = formatCurrency(currentMonthTotal);
        cards[3].value = formatCurrency(executedTotal);
        cards[4].value = overdueCount.toString();
        cards[5].value = formatCurrency(totalAmount);
      }
    };
    
    // 处理搜索
    const handleSearch = (searchParams) => {
      console.log('搜索参数:', searchParams);
      // 模拟搜索延迟
      templateRef.value.loading = true;
      setTimeout(() => {
        // 实际应用中应该根据搜索条件过滤数据
        templateRef.value.loading = false;
      }, 500);
    };
    
    // 处理重置
    const handleReset = (resetParams) => {
      console.log('重置参数:', resetParams);
      loadPaymentPlanData();
    };
    
    // 处理分页变化
    const handlePageChange = (pageParams) => {
      console.log('分页参数:', pageParams);
      // 实际应用中应该根据分页参数获取数据
    };
    
    // 处理页面挂载
    const handleMounted = () => {
      initSearchFields();
      initStatisticsCards();
      initTableColumns();
      initDialogs();
      initHeaderActions();
      loadPaymentPlanData();
      
      // 等待DOM更新后初始化图表
      nextTick(() => {
        updateCharts();
      });
    };
    
    // 新增付款计划
    const handleAddPlan = () => {
      isEditMode.value = false;
      resetPaymentPlanForm();
      
      // 设置默认值
      paymentPlanForm.priority = 3;
      paymentPlanForm.settlementPeriod = 'one_time';
      paymentPlanForm.planDate = new Date(); // 默认今天
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit');
      if (dialog) {
        dialog.title = '新增付款计划';
        dialog.visible = true;
      }
    };
    
    // 编辑付款计划
    const handleEditPlan = (row) => {
      isEditMode.value = true;
      resetPaymentPlanForm();
      
      // 复制数据到表单
      Object.assign(paymentPlanForm, JSON.parse(JSON.stringify(row)));
      
      // 格式化日期
      if (paymentPlanForm.planDate) {
        paymentPlanForm.planDate = new Date(paymentPlanForm.planDate);
      }
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit');
      if (dialog) {
        dialog.title = '编辑付款计划';
        dialog.visible = true;
      }
    };
    
    // 保存付款计划
    const handleSavePlan = () => {
      paymentPlanFormRef.value?.validate((valid) => {
        if (valid) {
          // 准备保存数据
          const saveData = { ...paymentPlanForm };
          
          // 格式化日期
          if (saveData.planDate instanceof Date) {
            saveData.planDate = saveData.planDate.toISOString();
          }
          
          // 模拟保存操作
          setTimeout(() => {
            if (isEditMode.value) {
              // 更新现有记录
              const index = paymentPlanData.value.findIndex(item => item.id === saveData.id);
              if (index !== -1) {
                paymentPlanData.value[index] = {
                  ...saveData,
                  updatedAt: new Date().toISOString()
                };
              }
            } else {
              // 添加新记录
              const newId = `plan_${Date.now()}`;
              paymentPlanData.value.unshift({
                ...saveData,
                id: newId,
                status: 'pending',
                actualAmount: null,
                actualDate: null,
                transactionId: null,
                paymentAccount: null,
                approver: null,
                paymentDescription: null,
                receipts: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
            
            // 更新统计和图表
            updateStatistics(paymentPlanData.value);
            updateCharts();
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'edit');
            if (dialog) {
              dialog.visible = false;
            }
            
            ElMessage.success(isEditMode.value ? '付款计划更新成功' : '付款计划添加成功');
          }, 500);
        }
      });
    };
    
    // 取消付款计划
    const handleCancelPlan = (row) => {
      ElMessageBox.confirm(
        `确定要取消付款计划「${row.planName}」吗？`,
        '确认取消',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        // 模拟取消操作
        setTimeout(() => {
          const index = paymentPlanData.value.findIndex(item => item.id === row.id);
          if (index !== -1) {
            paymentPlanData.value[index].status = 'cancelled';
            paymentPlanData.value[index].updatedAt = new Date().toISOString();
            updateStatistics(paymentPlanData.value);
            updateCharts();
            ElMessage.success('付款计划已取消');
          }
        }, 300);
      }).catch(() => {
        // 用户取消操作
      });
    };
    
    // 查看付款计划详情
    const handleViewDetail = (row) => {
      // 复制数据到详情对象
      Object.assign(currentPlanDetail, JSON.parse(JSON.stringify(row)));
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'view-detail');
      if (dialog) {
        dialog.title = `${row.planName} - 详细信息`;
        dialog.visible = true;
      }
    };
    
    // 执行付款
    const handleExecutePayment = (row) => {
      resetExecutePaymentForm();
      
      // 设置基本信息
      executePaymentForm.planId = row.id;
      executePaymentForm.planName = row.planName;
      executePaymentForm.actualAmount = row.amount; // 默认全额付款
      executePaymentForm.actualDate = new Date(); // 默认今天
      executePaymentForm.paymentMethod = row.paymentMethod; // 沿用计划的支付方式
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'execute');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 确认付款
    const handleConfirmPayment = () => {
      executePaymentFormRef.value?.validate((valid) => {
        if (valid) {
          // 准备提交数据
          const submitData = { ...executePaymentForm };
          
          // 格式化日期
          if (submitData.actualDate instanceof Date) {
            submitData.actualDate = submitData.actualDate.toISOString();
          }
          
          // 模拟提交操作
          setTimeout(() => {
            // 查找对应的付款计划并更新状态
            const planIndex = paymentPlanData.value.findIndex(item => item.id === submitData.planId);
            if (planIndex !== -1) {
              const plan = paymentPlanData.value[planIndex];
              const isFullPayment = submitData.actualAmount >= plan.amount;
              
              paymentPlanData.value[planIndex] = {
                ...plan,
                actualAmount: submitData.actualAmount,
                actualDate: submitData.actualDate,
                paymentMethod: submitData.paymentMethod,
                transactionId: submitData.transactionId,
                paymentAccount: submitData.paymentAccount,
                approver: submitData.approver,
                paymentDescription: submitData.paymentDescription,
                receipts: submitData.receipts,
                status: isFullPayment ? 'paid' : 'partially_paid',
                updatedAt: new Date().toISOString()
              };
            }
            
            // 更新统计和图表
            updateStatistics(paymentPlanData.value);
            updateCharts();
            
            // 关闭对话框
            const dialog = templateRef.value?.dialogs.find(d => d.key === 'execute');
            if (dialog) {
              dialog.visible = false;
            }
            
            ElMessage.success('付款执行成功');
          }, 500);
        }
      });
    };
    
    // 导入计划
    const handleImportPlans = () => {
      ElMessage.info('导入功能待实现');
    };
    
    // 导出计划
    const handleExportPlans = () => {
      ElMessage.info('导出功能待实现');
    };
    
    // 批量执行
    const handleBatchExecute = () => {
      ElMessage.info('批量执行功能待实现');
    };
    
    // 打印报表
    const handlePrintReport = () => {
      ElMessage.info('打印报表功能待实现');
    };
    
    // 刷新数据
    const handleRefreshData = () => {
      templateRef.value.loading = true;
      setTimeout(() => {
        loadPaymentPlanData();
        updateCharts();
        templateRef.value.loading = false;
        ElMessage.success('数据刷新成功');
      }, 800);
    };
    
    // 处理凭证上传变化
    const handleReceiptChange = (file, fileList) => {
      executePaymentForm.receipts = fileList;
    };
    
    // 重置付款计划表单
    const resetPaymentPlanForm = () => {
      paymentPlanFormRef.value?.resetFields();
      Object.assign(paymentPlanForm, {
        id: '',
        planName: '',
        supplierId: '',
        amount: '',
        planDate: '',
        priority: 3,
        category: '',
        paymentMethod: '',
        settlementPeriod: 'one_time',
        contractId: '',
        responsiblePerson: '',
        description: ''
      });
    };
    
    // 重置执行付款表单
    const resetExecutePaymentForm = () => {
      executePaymentFormRef.value?.resetFields();
      Object.assign(executePaymentForm, {
        id: '',
        planId: '',
        planName: '',
        actualAmount: '',
        actualDate: '',
        paymentMethod: '',
        transactionId: '',
        paymentAccount: '',
        approver: '',
        receipts: [],
        paymentDescription: ''
      });
    };
    
    // 处理图表标签切换
    const handleChartTabChange = () => {
      nextTick(() => {
        updateCurrentChart();
      });
    };
    
    // 更新所有图表
    const updateCharts = () => {
      // 销毁现有图表
      Object.values(chartInstances).forEach(instance => {
        if (instance) {
          instance.destroy();
        }
      });
      
      // 初始化当前活动的图表
      updateCurrentChart();
    };
    
    // 更新当前活动的图表
    const updateCurrentChart = () => {
      switch (activeChartTab.value) {
        case 'paymentTrendChart':
          initPaymentTrendChart();
          break;
        case 'categoryDistributionChart':
          initCategoryDistributionChart();
          break;
        case 'statusChart':
          initStatusChart();
          break;
        case 'paymentTimingChart':
          initPaymentTimingChart();
          break;
      }
    };
    
    // 初始化付款趋势图表
    const initPaymentTrendChart = () => {
      if (!paymentTrendChartRef.value || paymentPlanData.value.length === 0) return;
      
      // 获取最近6个月的数据
      const months = [];
      const monthLabels = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = monthDate.getFullYear();
        const month = String(monthDate.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${month}`;
        const monthLabel = `${year}年${monthDate.getMonth() + 1}月`;
        
        months.push(monthKey);
        monthLabels.push(monthLabel);
      }
      
      // 计算每月计划金额
      const monthlyPlanAmounts = months.map(month => {
        let total = 0;
        paymentPlanData.value.forEach(plan => {
          const planDate = new Date(plan.planDate);
          const planMonthKey = `${planDate.getFullYear()}-${String(planDate.getMonth() + 1).padStart(2, '0')}`;
          if (planMonthKey === month) {
            total += plan.amount;
          }
        });
        return total;
      });
      
      // 计算每月实际付款金额
      const monthlyActualAmounts = months.map(month => {
        let total = 0;
        paymentPlanData.value.forEach(plan => {
          if (plan.actualDate) {
            const actualDate = new Date(plan.actualDate);
            const actualMonthKey = `${actualDate.getFullYear()}-${String(actualDate.getMonth() + 1).padStart(2, '0')}`;
            if (actualMonthKey === month && plan.actualAmount) {
              total += plan.actualAmount;
            }
          }
        });
        return total;
      });
      
      const config = {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [
            {
              label: '计划金额',
              data: monthlyPlanAmounts,
              borderColor: '#409eff',
              backgroundColor: 'rgba(64, 158, 255, 0.1)',
              tension: 0.4
            },
            {
              label: '实际付款金额',
              data: monthlyActualAmounts,
              borderColor: '#67c23a',
              backgroundColor: 'rgba(103, 194, 58, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '最近6个月付款趋势'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatCurrency(value);
                }
              }
            }
          }
        }
      };
      
      chartInstances.paymentTrendChart = new MockChart(paymentTrendChartRef.value, config);
    };
    
    // 初始化类别分布图表
    const initCategoryDistributionChart = () => {
      if (!categoryDistributionChartRef.value || paymentPlanData.value.length === 0) return;
      
      // 统计各类别金额
      const categoryTotals = {};
      const categoryNames = {};
      
      // 初始化类别映射
      categoryOptions.value.forEach(category => {
        categoryTotals[category.value] = 0;
        categoryNames[category.value] = category.label;
      });
      
      // 计算各类别金额
      paymentPlanData.value.forEach(plan => {
        if (categoryTotals.hasOwnProperty(plan.category)) {
          categoryTotals[plan.category] += plan.amount;
        }
      });
      
      // 过滤掉金额为0的类别
      const filteredCategories = Object.keys(categoryTotals).filter(key => categoryTotals[key] > 0);
      
      // 准备图表数据
      const labels = filteredCategories.map(key => categoryNames[key]);
      const data = filteredCategories.map(key => categoryTotals[key]);
      
      // 生成随机颜色
      const backgroundColors = labels.map(() => {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
      });
      
      const config = {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: backgroundColors,
              borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '付款类别金额分布'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = formatCurrency(context.parsed);
                  const total = data.reduce((sum, item) => sum + item, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(2);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      };
      
      chartInstances.categoryDistributionChart = new MockChart(categoryDistributionChartRef.value, config);
    };
    
    // 初始化状态分析图表
    const initStatusChart = () => {
      if (!statusChartRef.value || paymentPlanData.value.length === 0) return;
      
      // 统计各状态数量和金额
      const statusCounts = {
        'pending': 0,
        'paid': 0,
        'cancelled': 0,
        'partially_paid': 0,
        'overdue': 0
      };
      
      const statusAmounts = {
        'pending': 0,
        'paid': 0,
        'cancelled': 0,
        'partially_paid': 0,
        'overdue': 0
      };
      
      // 计算各状态数量和金额
      paymentPlanData.value.forEach(plan => {
        statusCounts[plan.status] = (statusCounts[plan.status] || 0) + 1;
        statusAmounts[plan.status] = (statusAmounts[plan.status] || 0) + plan.amount;
      });
      
      const labels = [
        '待执行',
        '已付款',
        '已取消',
        '部分付款',
        '逾期未付'
      ];
      
      const statusKeys = [
        'pending',
        'paid',
        'cancelled',
        'partially_paid',
        'overdue'
      ];
      
      const countData = statusKeys.map(key => statusCounts[key]);
      const amountData = statusKeys.map(key => statusAmounts[key]);
      
      const config = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '计划数量',
              data: countData,
              backgroundColor: '#409eff'
            },
            {
              label: '计划金额',
              data: amountData,
              backgroundColor: '#67c23a',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '付款计划状态分析'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  if (context.datasetIndex === 0) {
                    return `${context.dataset.label}: ${context.parsed.y}`;
                  } else {
                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                  }
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '数量'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: '金额'
              },
              grid: {
                drawOnChartArea: false
              },
              ticks: {
                callback: function(value) {
                  return formatCurrency(value);
                }
              }
            }
          }
        }
      };
      
      chartInstances.statusChart = new MockChart(statusChartRef.value, config);
    };
    
    // 初始化付款时间分布图表
    const initPaymentTimingChart = () => {
      if (!paymentTimingChartRef.value || paymentPlanData.value.length === 0) return;
      
      // 统计不同时间段的付款数量
      const timeDistribution = {
        'morning': 0,  // 6:00-12:00
        'afternoon': 0, // 12:00-18:00
        'evening': 0,   // 18:00-24:00
        'night': 0      // 0:00-6:00
      };
      
      // 分析已付款的记录
      paymentPlanData.value.forEach(plan => {
        if (plan.actualDate && plan.status === 'paid') {
          const actualDate = new Date(plan.actualDate);
          const hour = actualDate.getHours();
          
          if (hour >= 6 && hour < 12) {
            timeDistribution.morning++;
          } else if (hour >= 12 && hour < 18) {
            timeDistribution.afternoon++;
          } else if (hour >= 18 && hour < 24) {
            timeDistribution.evening++;
          } else {
            timeDistribution.night++;
          }
        }
      });
      
      const labels = ['上午 (6:00-12:00)', '下午 (12:00-18:00)', '晚上 (18:00-24:00)', '凌晨 (0:00-6:00)'];
      const timeKeys = ['morning', 'afternoon', 'evening', 'night'];
      const data = timeKeys.map(key => timeDistribution[key]);
      
      const config = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: '付款次数',
              data,
              backgroundColor: [
                '#409eff',
                '#67c23a',
                '#e6a23c',
                '#909399'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '付款时间分布'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      };
      
      chartInstances.paymentTimingChart = new MockChart(paymentTimingChartRef.value, config);
    };
    
    // 格式化日期时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    };
    
    // 格式化日期
    const formatDate = (dateTime) => {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // 格式化货币
    const formatCurrency = (value) => {
      if (value === null || value === undefined || isNaN(value)) return '0.00 元';
      return `${parseFloat(value).toFixed(2)} 元`;
    };
    
    // 获取供应商文本
    const getSupplierText = (supplierId) => {
      const supplier = supplierOptions.value.find(opt => opt.value === supplierId);
      return supplier ? supplier.label : supplierId;
    };
    
    // 获取人员文本
    const getPersonText = (personId) => {
      const person = personOptions.value.find(opt => opt.value === personId);
      return person ? person.label : personId;
    };
    
    // 获取优先级文本
    const getPriorityText = (priority) => {
      const priorityMap = {
        1: '1星',
        2: '2星',
        3: '3星',
        4: '4星',
        5: '5星'
      };
      return priorityMap[priority] || `${priority}星`;
    };
    
    // 获取类别文本
    const getCategoryText = (category) => {
      const categoryInfo = categoryOptions.value.find(opt => opt.value === category);
      return categoryInfo ? categoryInfo.label : category;
    };
    
    // 获取支付方式文本
    const getPaymentMethodText = (method) => {
      const methodMap = {
        'bank_transfer': '银行转账',
        'alipay': '支付宝',
        'wechat_pay': '微信支付',
        'check': '支票',
        'cash': '现金'
      };
      return methodMap[method] || method;
    };
    
    // 获取结算周期文本
    const getSettlementPeriodText = (period) => {
      const periodMap = {
        'one_time': '一次性',
        'monthly': '月度',
        'quarterly': '季度',
        'half_yearly': '半年',
        'yearly': '年度'
      };
      return periodMap[period] || period;
    };
    
    // 获取状态标签
    const getStatusTag = (status) => {
      const statusMap = {
        'pending': { text: '待执行', type: 'primary' },
        'paid': { text: '已付款', type: 'success' },
        'cancelled': { text: '已取消', type: 'danger' },
        'partially_paid': { text: '部分付款', type: 'warning' },
        'overdue': { text: '逾期未付', type: 'danger' }
      };
      
      const statusInfo = statusMap[status];
      if (statusInfo) {
        return `<el-tag type="${statusInfo.type}" size="small">${statusInfo.text}</el-tag>`;
      }
      return `<el-tag size="small">${status}</el-tag>`;
    };
    
    // 处理窗口大小变化
    const handleResize = () => {
      // 更新图表尺寸
      nextTick(() => {
        updateCharts();
      });
    };
    
    // 组件挂载
    onMounted(() => {
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize);
    });
    
    // 组件卸载前
    onBeforeUnmount(() => {
      // 移除事件监听
      window.removeEventListener('resize', handleResize);
      
      // 销毁图表实例
      Object.values(chartInstances).forEach(instance => {
        if (instance) {
          instance.destroy();
        }
      });
    });
    
    // 监听activeChartTab变化，切换图表
    watch(activeChartTab, () => {
      nextTick(() => {
        updateCurrentChart();
      });
    });
    
    // 监听数据变化，更新图表
    watch(paymentPlanData, () => {
      nextTick(() => {
        updateCharts();
      });
    }, { deep: true });
    
    return {
      // 模板引用
      templateRef,
      paymentPlanFormRef,
      executePaymentFormRef,
      
      // 图表引用
      paymentTrendChartRef,
      categoryDistributionChartRef,
      statusChartRef,
      paymentTimingChartRef,
      
      // 状态管理
      activeChartTab,
      chartWidth,
      chartHeight,
      currentPlanDetail,
      isEditMode,
      paymentPlanData,
      
      // 表单数据
      paymentPlanForm,
      paymentPlanFormRules,
      executePaymentForm,
      executePaymentFormRules,
      
      // 选项数据
      supplierOptions,
      categoryOptions,
      personOptions,
      accountOptions,
      
      // 方法
      handleSearch,
      handleReset,
      handlePageChange,
      handleMounted,
      handleAddPlan,
      handleEditPlan,
      handleSavePlan,
      handleCancelPlan,
      handleViewDetail,
      handleExecutePayment,
      handleConfirmPayment,
      handleImportPlans,
      handleExportPlans,
      handleBatchExecute,
      handlePrintReport,
      handleRefreshData,
      handleReceiptChange,
      handleChartTabChange,
      
      // 辅助函数
      getSupplierText,
      getPersonText,
      getPriorityText,
      getCategoryText,
      getPaymentMethodText,
      getSettlementPeriodText,
      getStatusTag,
      formatDateTime,
      formatDate,
      formatCurrency
    };
  }
};
</script>

<style scoped>
.payment-plan-form-container {
  padding: 20px 0;
}

.execute-payment-container {
  padding: 20px 0;
}

.payment-plan-detail-container {
  padding: 10px 0;
}

.payment-plan-detail-container h3 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 16px;
  font-weight: bold;
}

.payment-plan-detail-container h4 {
  margin: 20px 0 10px 0;
  color: #303133;
  font-size: 14px;
  font-weight: bold;
}

.chart-container {
  margin-top: 20px;
  position: relative;
  height: 400px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .chart-container {
    height: 300px;
  }
  
  .payment-plan-form-container,
  .execute-payment-container,
  .payment-plan-detail-container {
    padding: 10px 0;
  }
}
</style>