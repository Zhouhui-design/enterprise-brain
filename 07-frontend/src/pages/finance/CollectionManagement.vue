<template>
  <div class="collection-management">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>财务管理</el-breadcrumb-item>
      <el-breadcrumb-item>回款管理</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="content-container">
      <div class="header">
        <h1>回款管理</h1>
        <div class="header-actions">
          <el-button type="primary" @click="addCollection">新增回款</el-button>
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
        <el-form-item label="回款状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态">
            <el-option label="全部" value="" />
            <el-option label="待回款" value="pending" />
            <el-option label="部分回款" value="partial" />
            <el-option label="已完成" value="completed" />
            <el-option label="已逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="searchForm.responsiblePerson" placeholder="请选择负责人">
            <el-option label="全部" value="" />
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
            <el-option label="赵六" value="赵六" />
          </el-select>
        </el-form-item>
        <el-form-item label="回款日期">
          <el-date-picker
            v-model="searchForm.collectionDateRange"
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
                <div class="stat-label">本月回款总额</div>
                <div class="stat-value success">{{ monthlyCollectionAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ monthlyCollectionCount }} 笔</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">待回款总额</div>
                <div class="stat-value warning">{{ pendingCollectionAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ pendingCollectionCount }} 笔</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">逾期未回款</div>
                <div class="stat-value danger">{{ overdueCollectionAmount.toFixed(2) }} 元</div>
                <div class="stat-desc">{{ overdueCollectionCount }} 笔</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-label">累计回款率</div>
                <div class="stat-value primary">{{ totalCollectionRate.toFixed(1) }}%</div>
                <div class="stat-desc">已完成 {{ totalCompletedCount }} 笔</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 回款趋势图表 -->
      <div class="chart-container">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>回款趋势分析</span>
              <el-select v-model="chartTimeRange" style="width: 150px;">
                <el-option label="近7天" value="week" />
                <el-option label="近30天" value="month" />
                <el-option label="近3个月" value="quarter" />
                <el-option label="近1年" value="year" />
              </el-select>
            </div>
          </template>
          <div id="collectionChart" class="chart"></div>
        </el-card>
      </div>

      <!-- 回款列表 -->
      <el-table
        v-loading="loading"
        :data="collectionList"
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
        <el-table-column prop="contractAmount" label="合同金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.contractAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCollectionAmount" label="已回款金额" width="120" align="right">
          <template #default="{ row }">
            <span class="text-success">{{ formatCurrency(row.totalCollectionAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="remainingAmount" label="待回款金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'text-danger': row.remainingAmount > 0 }">{{ formatCurrency(row.remainingAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="collectionRate" label="回款率" width="100" align="center">
          <template #default="{ row }">
            <el-progress :percentage="row.collectionRate" :color="getProgressColor(row.collectionRate)" stroke-width="6" />
          </template>
        </el-table-column>
        <el-table-column prop="paymentTerm" label="账期" width="100">
          <template #default="{ row }">
            {{ row.paymentTerm }} 天
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日期" width="130">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isOverdue(row.dueDate) }">
              {{ formatDate(row.dueDate) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="responsiblePerson" label="负责人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCollectionDate" label="最后回款" width="130">
          <template #default="{ row }">
            {{ row.lastCollectionDate ? formatDate(row.lastCollectionDate) : '未回款' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status !== 'completed'"
              type="primary"
              size="small"
              @click="addPayment(row)"
            >
              录入回款
            </el-button>
            <el-button size="small" @click="viewCollectionDetails(row)">回款明细</el-button>
            <el-button size="small" @click="editCollection(row)">编辑</el-button>
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

    <!-- 新增回款对话框 -->
    <el-dialog
      v-model="addCollectionDialogVisible"
      :title="isEdit ? '编辑回款' : '新增回款'"
      width="700px"
      @close="resetCollectionForm"
    >
      <el-form
        ref="collectionFormRef"
        :model="collectionForm"
        :rules="collectionRules"
        label-width="120px"
      >
        <el-form-item label="订单编号" prop="orderNumber">
          <el-select v-model="collectionForm.orderNumber" placeholder="请选择订单编号">
            <el-option
              v-for="order in orderOptions"
              :key="order.orderNumber"
              :label="order.orderNumber"
              :value="order.orderNumber"
              @click="onOrderSelect(order)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="collectionForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="合同金额">
          <el-input v-model="collectionForm.contractAmount" disabled />
        </el-form-item>
        <el-form-item label="已回款金额">
          <el-input v-model="collectionForm.collectedAmount" disabled />
        </el-form-item>
        <el-form-item label="剩余金额">
          <el-input v-model="collectionForm.remainingAmount" disabled />
        </el-form-item>
        <el-form-item label="本次回款金额" prop="amount">
          <el-input
            v-model.number="collectionForm.amount"
            type="number"
            placeholder="请输入本次回款金额"
            min="0"
            step="0.01"
          />
        </el-form-item>
        <el-form-item label="回款日期" prop="collectionDate">
          <el-date-picker
            v-model="collectionForm.collectionDate"
            type="date"
            placeholder="请选择回款日期"
          />
        </el-form-item>
        <el-form-item label="回款方式" prop="collectionMethod">
          <el-select v-model="collectionForm.collectionMethod" placeholder="请选择回款方式">
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="现金" value="cash" />
            <el-option label="支票" value="check" />
            <el-option label="线上支付" value="online" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款方" prop="payer">
          <el-input v-model="collectionForm.payer" placeholder="请输入付款方名称" />
        </el-form-item>
        <el-form-item label="收款账户" prop="accountId">
          <el-select v-model="collectionForm.accountId" placeholder="请选择收款账户">
            <el-option label="中国银行 8888 **** 1234" value="bank1" />
            <el-option label="工商银行 6666 **** 5678" value="bank2" />
            <el-option label="建设银行 9999 **** 9012" value="bank3" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易流水号" prop="transactionNo">
          <el-input v-model="collectionForm.transactionNo" placeholder="请输入交易流水号" />
        </el-form-item>
        <el-form-item label="回款类型" prop="collectionType">
          <el-select v-model="collectionForm.collectionType" placeholder="请选择回款类型">
            <el-option label="正常回款" value="normal" />
            <el-option label="预付款" value="prepayment" />
            <el-option label="订金" value="deposit" />
            <el-option label="尾款" value="balance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="responsiblePerson">
          <el-select v-model="collectionForm.responsiblePerson" placeholder="请选择负责人">
            <el-option label="张三" value="张三" />
            <el-option label="李四" value="李四" />
            <el-option label="王五" value="王五" />
            <el-option label="赵六" value="赵六" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="collectionForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addCollectionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveCollection">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 录入回款对话框 -->
    <el-dialog
      v-model="addPaymentDialogVisible"
      title="录入回款"
      width="600px"
      @close="resetPaymentForm"
    >
      <el-form
        ref="paymentFormRef"
        :model="paymentForm"
        :rules="paymentRules"
        label-width="120px"
      >
        <el-form-item label="订单编号">
          <el-input v-model="paymentForm.orderNumber" disabled />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input v-model="paymentForm.customerName" disabled />
        </el-form-item>
        <el-form-item label="剩余金额">
          <el-input v-model="paymentForm.remainingAmount" disabled />
        </el-form-item>
        <el-form-item label="回款金额" prop="amount">
          <el-input
            v-model.number="paymentForm.amount"
            type="number"
            placeholder="请输入回款金额"
            min="0"
            step="0.01"
          />
        </el-form-item>
        <el-form-item label="回款日期" prop="collectionDate">
          <el-date-picker
            v-model="paymentForm.collectionDate"
            type="date"
            placeholder="请选择回款日期"
          />
        </el-form-item>
        <el-form-item label="回款方式" prop="collectionMethod">
          <el-select v-model="paymentForm.collectionMethod" placeholder="请选择回款方式">
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="现金" value="cash" />
            <el-option label="支票" value="check" />
            <el-option label="线上支付" value="online" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易流水号" prop="transactionNo">
          <el-input v-model="paymentForm.transactionNo" placeholder="请输入交易流水号" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="paymentForm.remark"
            type="textarea"
            placeholder="请输入备注信息"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addPaymentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmPayment">确认录入</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 回款明细对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="回款明细"
      width="700px"
    >
      <div v-if="currentCollection" class="detail-content">
        <div class="order-info">
          <h3>{{ currentCollection.customerName }} - {{ currentCollection.orderNumber }}</h3>
          <el-descriptions border :column="2">
            <el-descriptions-item label="合同金额">{{ formatCurrency(currentCollection.contractAmount) }}</el-descriptions-item>
            <el-descriptions-item label="已回款金额">{{ formatCurrency(currentCollection.totalCollectionAmount) }}</el-descriptions-item>
            <el-descriptions-item label="待回款金额">{{ formatCurrency(currentCollection.remainingAmount) }}</el-descriptions-item>
            <el-descriptions-item label="回款率">{{ currentCollection.collectionRate }}%</el-descriptions-item>
            <el-descriptions-item label="账期">{{ currentCollection.paymentTerm }} 天</el-descriptions-item>
            <el-descriptions-item label="到期日期">{{ formatDate(currentCollection.dueDate) }}</el-descriptions-item>
            <el-descriptions-item label="负责人">{{ currentCollection.responsiblePerson }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">{{ getStatusText(currentCollection.status) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="collection-details">
          <h3>回款记录</h3>
          <el-table
            :data="collectionDetails"
            style="width: 100%"
            border
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="collectionDate" label="回款日期" width="130">
              <template #default="{ row }">
                {{ formatDate(row.collectionDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="回款金额" width="120" align="right">
              <template #default="{ row }">
                {{ formatCurrency(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="collectionMethod" label="回款方式" width="120">
              <template #default="{ row }">
                {{ getMethodText(row.collectionMethod) }}
              </template>
            </el-table-column>
            <el-table-column prop="transactionNo" label="交易流水号" min-width="150" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="150" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 模拟图表功能
let chartInstance = null;

export default {
  name: 'CollectionManagement',
  setup() {
    // 状态管理
    const loading = ref(false);
    const collectionList = ref([]);
    const selectedRows = ref([]);
    const addCollectionDialogVisible = ref(false);
    const addPaymentDialogVisible = ref(false);
    const detailDialogVisible = ref(false);
    const currentCollection = ref(null);
    const collectionDetails = ref([]);
    const chartTimeRange = ref('month');
    const isEdit = ref(false);

    // 表单引用
    const collectionFormRef = ref(null);
    const paymentFormRef = ref(null);

    // 搜索表单
    const searchForm = reactive({
      customerName: '',
      orderNumber: '',
      status: '',
      responsiblePerson: '',
      collectionDateRange: null
    });

    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });

    // 订单选项
    const orderOptions = ref([
      { orderNumber: 'SO20240001', customerName: '北京科技有限公司', contractAmount: 250000.00 },
      { orderNumber: 'SO20240002', customerName: '上海贸易公司', contractAmount: 180000.00 },
      { orderNumber: 'SO20240003', customerName: '广州制造有限公司', contractAmount: 320000.00 },
      { orderNumber: 'SO20240004', customerName: '深圳科技集团', contractAmount: 280000.00 },
      { orderNumber: 'SO20240005', customerName: '杭州电子有限公司', contractAmount: 450000.00 }
    ]);

    // 回款表单
    const collectionForm = reactive({
      id: '',
      orderNumber: '',
      customerName: '',
      contractAmount: 0,
      collectedAmount: 0,
      remainingAmount: 0,
      amount: 0,
      collectionDate: new Date(),
      collectionMethod: 'bank_transfer',
      payer: '',
      accountId: '',
      transactionNo: '',
      collectionType: 'normal',
      responsiblePerson: '张三',
      remark: ''
    });

    // 录入回款表单
    const paymentForm = reactive({
      id: '',
      orderNumber: '',
      customerName: '',
      remainingAmount: 0,
      amount: 0,
      collectionDate: new Date(),
      collectionMethod: 'bank_transfer',
      transactionNo: '',
      remark: ''
    });

    // 表单验证规则
    const collectionRules = {
      orderNumber: [{ required: true, message: '请选择订单编号', trigger: 'change' }],
      amount: [
        { required: true, message: '请输入回款金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '回款金额必须大于0', trigger: 'blur' }
      ],
      collectionDate: [{ required: true, message: '请选择回款日期', trigger: 'change' }],
      collectionMethod: [{ required: true, message: '请选择回款方式', trigger: 'change' }],
      payer: [{ required: true, message: '请输入付款方名称', trigger: 'blur' }],
      accountId: [{ required: true, message: '请选择收款账户', trigger: 'change' }],
      transactionNo: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }],
      collectionType: [{ required: true, message: '请选择回款类型', trigger: 'change' }],
      responsiblePerson: [{ required: true, message: '请选择负责人', trigger: 'change' }]
    };

    const paymentRules = {
      amount: [
        { required: true, message: '请输入回款金额', trigger: 'blur' },
        { type: 'number', min: 0.01, message: '回款金额必须大于0', trigger: 'blur' }
      ],
      collectionDate: [{ required: true, message: '请选择回款日期', trigger: 'change' }],
      collectionMethod: [{ required: true, message: '请选择回款方式', trigger: 'change' }],
      transactionNo: [{ required: true, message: '请输入交易流水号', trigger: 'blur' }]
    };

    // 计算属性
    const monthlyCollectionAmount = ref(450000.00);
    const monthlyCollectionCount = ref(18);

    const pendingCollectionAmount = computed(() => {
      return collectionList.value
        .filter(item => item.status === 'pending' || item.status === 'partial' || item.status === 'overdue')
        .reduce((sum, item) => sum + item.remainingAmount, 0);
    });

    const pendingCollectionCount = computed(() => {
      return collectionList.value.filter(item => item.status === 'pending' || item.status === 'partial').length;
    });

    const overdueCollectionAmount = computed(() => {
      return collectionList.value
        .filter(item => item.status === 'overdue')
        .reduce((sum, item) => sum + item.remainingAmount, 0);
    });

    const overdueCollectionCount = computed(() => {
      return collectionList.value.filter(item => item.status === 'overdue').length;
    });

    const totalCompletedCount = computed(() => {
      return collectionList.value.filter(item => item.status === 'completed').length;
    });

    const totalCollectionRate = computed(() => {
      const totalContractAmount = collectionList.value.reduce((sum, item) => sum + item.contractAmount, 0);
      const totalCollectedAmount = collectionList.value.reduce((sum, item) => sum + item.totalCollectionAmount, 0);
      return totalContractAmount > 0 ? (totalCollectedAmount / totalContractAmount) * 100 : 0;
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
    const isOverdue = (dueDate) => {
      if (!dueDate) return false;
      const now = new Date();
      const due = new Date(dueDate);
      return due < now;
    };

    // 获取状态类型
    const getStatusType = (status) => {
      switch (status) {
        case 'pending': return 'warning';
        case 'partial': return 'primary';
        case 'completed': return 'success';
        case 'overdue': return 'danger';
        default: return 'default';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'pending': return '待回款';
        case 'partial': return '部分回款';
        case 'completed': return '已完成';
        case 'overdue': return '已逾期';
        default: return '未知';
      }
    };

    // 获取进度条颜色
    const getProgressColor = (rate) => {
      if (rate === 100) return '#67c23a';
      if (rate >= 80) return '#409eff';
      if (rate >= 50) return '#e6a23c';
      return '#f56c6c';
    };

    // 获取回款方式文本
    const getMethodText = (method) => {
      switch (method) {
        case 'bank_transfer': return '银行转账';
        case 'cash': return '现金';
        case 'check': return '支票';
        case 'online': return '线上支付';
        case 'other': return '其他';
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
        if (key === 'collectionDateRange') {
          searchForm[key] = null;
        } else {
          searchForm[key] = '';
        }
      });
      pagination.currentPage = 1;
      loadData();
    };

    // 重置回款表单
    const resetCollectionForm = () => {
      if (collectionFormRef.value) {
        collectionFormRef.value.resetFields();
      }
      Object.assign(collectionForm, {
        id: '',
        orderNumber: '',
        customerName: '',
        contractAmount: 0,
        collectedAmount: 0,
        remainingAmount: 0,
        amount: 0,
        collectionDate: new Date(),
        collectionMethod: 'bank_transfer',
        payer: '',
        accountId: '',
        transactionNo: '',
        collectionType: 'normal',
        responsiblePerson: '张三',
        remark: ''
      });
      isEdit.value = false;
    };

    // 重置付款表单
    const resetPaymentForm = () => {
      if (paymentFormRef.value) {
        paymentFormRef.value.resetFields();
      }
      Object.assign(paymentForm, {
        id: '',
        orderNumber: '',
        customerName: '',
        remainingAmount: 0,
        amount: 0,
        collectionDate: new Date(),
        collectionMethod: 'bank_transfer',
        transactionNo: '',
        remark: ''
      });
    };

    // 新增回款
    const addCollection = () => {
      resetCollectionForm();
      addCollectionDialogVisible.value = true;
    };

    // 编辑回款
    const editCollection = (row) => {
      currentCollection.value = { ...row };
      collectionForm.id = row.id;
      collectionForm.orderNumber = row.orderNumber;
      collectionForm.customerName = row.customerName;
      collectionForm.contractAmount = row.contractAmount;
      collectionForm.collectedAmount = row.totalCollectionAmount;
      collectionForm.remainingAmount = row.remainingAmount;
      collectionForm.amount = 0;
      collectionForm.collectionDate = new Date();
      collectionForm.collectionMethod = 'bank_transfer';
      collectionForm.responsiblePerson = row.responsiblePerson;
      isEdit.value = true;
      addCollectionDialogVisible.value = true;
    };

    // 订单选择处理
    const onOrderSelect = (order) => {
      collectionForm.customerName = order.customerName;
      collectionForm.contractAmount = order.contractAmount;
      collectionForm.collectedAmount = 0;
      collectionForm.remainingAmount = order.contractAmount;
    };

    // 保存回款
    const saveCollection = () => {
      collectionFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟提交
          setTimeout(() => {
            ElMessage.success(isEdit.value ? '编辑成功' : '新增回款成功');
            addCollectionDialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 录入回款
    const addPayment = (row) => {
      currentCollection.value = { ...row };
      paymentForm.id = row.id;
      paymentForm.orderNumber = row.orderNumber;
      paymentForm.customerName = row.customerName;
      paymentForm.remainingAmount = row.remainingAmount;
      paymentForm.amount = row.remainingAmount;
      addPaymentDialogVisible.value = true;
    };

    // 确认录入回款
    const confirmPayment = () => {
      paymentFormRef.value.validate((valid) => {
        if (valid) {
          // 验证金额是否超过剩余金额
          if (paymentForm.amount > paymentForm.remainingAmount) {
            ElMessage.error('回款金额不能超过剩余金额');
            return;
          }
          
          // 模拟提交
          setTimeout(() => {
            ElMessage.success('回款录入成功');
            addPaymentDialogVisible.value = false;
            loadData();
          }, 500);
        }
      });
    };

    // 查看订单详情
    const viewOrderDetails = (row) => {
      ElMessage.info('查看订单详情功能待实现');
    };

    // 查看回款明细
    const viewCollectionDetails = (row) => {
      currentCollection.value = { ...row };
      // 模拟加载回款明细
      collectionDetails.value = [
        {
          id: '1',
          collectionDate: '2024-01-10',
          amount: 125000.00,
          collectionMethod: 'bank_transfer',
          transactionNo: 'TR202401100001',
          operator: '张三',
          remark: '首付款'
        },
        {
          id: '2',
          collectionDate: '2024-01-20',
          amount: 75000.00,
          collectionMethod: 'bank_transfer',
          transactionNo: 'TR202401200001',
          operator: '张三',
          remark: '进度款'
        }
      ];
      detailDialogVisible.value = true;
    };

    // 导出数据
    const exportData = () => {
      ElMessage.success('数据导出成功');
    };

    // 打印选中
    const printSelected = () => {
      ElMessage.info(`正在打印选中的 ${selectedRows.value.length} 条记录`);
    };

    // 刷新数据
    const refreshData = () => {
      loadData();
      ElMessage.success('数据已刷新');
    };

    // 渲染图表
    const renderChart = () => {
      // 模拟图表渲染
      console.log('渲染回款趋势图表', chartTimeRange.value);
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
            contractAmount: 250000.00,
            totalCollectionAmount: 200000.00,
            remainingAmount: 50000.00,
            collectionRate: 80,
            paymentTerm: 30,
            dueDate: '2024-01-30',
            responsiblePerson: '张三',
            status: 'partial',
            lastCollectionDate: '2024-01-25',
            remark: '合同执行中，部分回款'
          },
          {
            id: '2',
            orderNumber: 'SO20240002',
            customerName: '上海贸易公司',
            contractAmount: 180000.00,
            totalCollectionAmount: 0.00,
            remainingAmount: 180000.00,
            collectionRate: 0,
            paymentTerm: 45,
            dueDate: '2024-01-20',
            responsiblePerson: '李四',
            status: 'overdue',
            lastCollectionDate: null,
            remark: '已逾期，需要紧急跟进'
          },
          {
            id: '3',
            orderNumber: 'SO20240003',
            customerName: '广州制造有限公司',
            contractAmount: 320000.00,
            totalCollectionAmount: 320000.00,
            remainingAmount: 0.00,
            collectionRate: 100,
            paymentTerm: 60,
            dueDate: '2024-02-15',
            responsiblePerson: '王五',
            status: 'completed',
            lastCollectionDate: '2024-01-15',
            remark: '已全额回款'
          },
          {
            id: '4',
            orderNumber: 'SO20240004',
            customerName: '深圳科技集团',
            contractAmount: 280000.00,
            totalCollectionAmount: 140000.00,
            remainingAmount: 140000.00,
            collectionRate: 50,
            paymentTerm: 30,
            dueDate: '2024-02-10',
            responsiblePerson: '赵六',
            status: 'partial',
            lastCollectionDate: '2024-01-18',
            remark: '按合同约定分期付款'
          },
          {
            id: '5',
            orderNumber: 'SO20240005',
            customerName: '杭州电子有限公司',
            contractAmount: 450000.00,
            totalCollectionAmount: 450000.00,
            remainingAmount: 0.00,
            collectionRate: 100,
            paymentTerm: 15,
            dueDate: '2024-01-25',
            responsiblePerson: '张三',
            status: 'completed',
            lastCollectionDate: '2024-01-24',
            remark: '已全额回款'
          },
          {
            id: '6',
            orderNumber: 'SO20240006',
            customerName: '成都软件有限公司',
            contractAmount: 150000.00,
            totalCollectionAmount: 0.00,
            remainingAmount: 150000.00,
            collectionRate: 0,
            paymentTerm: 30,
            dueDate: '2024-02-05',
            responsiblePerson: '李四',
            status: 'pending',
            lastCollectionDate: null,
            remark: '新客户，需要重点关注'
          },
          {
            id: '7',
            orderNumber: 'SO20240007',
            customerName: '武汉科技有限公司',
            contractAmount: 220000.00,
            totalCollectionAmount: 110000.00,
            remainingAmount: 110000.00,
            collectionRate: 50,
            paymentTerm: 45,
            dueDate: '2024-02-20',
            responsiblePerson: '王五',
            status: 'pending',
            lastCollectionDate: '2024-01-10',
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
        if (searchForm.responsiblePerson) {
          filteredData = filteredData.filter(item => 
            item.responsiblePerson === searchForm.responsiblePerson
          );
        }
        if (searchForm.collectionDateRange && searchForm.collectionDateRange.length === 2) {
          const startDate = new Date(searchForm.collectionDateRange[0]);
          const endDate = new Date(searchForm.collectionDateRange[1]);
          // 这里简化处理，实际应该根据回款日期过滤
        }

        // 分页处理
        const start = (pagination.currentPage - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        collectionList.value = filteredData.slice(start, end);
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
      collectionList,
      selectedRows,
      searchForm,
      pagination,
      addCollectionDialogVisible,
      addPaymentDialogVisible,
      detailDialogVisible,
      currentCollection,
      collectionDetails,
      chartTimeRange,
      isEdit,
      orderOptions,
      collectionForm,
      collectionFormRef,
      paymentForm,
      paymentFormRef,
      collectionRules,
      paymentRules,
      monthlyCollectionAmount,
      monthlyCollectionCount,
      pendingCollectionAmount,
      pendingCollectionCount,
      overdueCollectionAmount,
      overdueCollectionCount,
      totalCompletedCount,
      totalCollectionRate,
      formatDate,
      formatCurrency,
      isOverdue,
      getStatusType,
      getStatusText,
      getProgressColor,
      getMethodText,
      handleSelectionChange,
      handleSizeChange,
      handleCurrentChange,
      search,
      resetSearch,
      resetCollectionForm,
      resetPaymentForm,
      addCollection,
      editCollection,
      onOrderSelect,
      saveCollection,
      addPayment,
      confirmPayment,
      viewOrderDetails,
      viewCollectionDetails,
      exportData,
      printSelected,
      refreshData
    };
  }
};
</script>

<style scoped>
.collection-management {
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

.text-success {
  color: #67c23a;
}

.text-danger {
  color: #f56c6c;
}

.detail-content {
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

.collection-details h3 {
  margin-bottom: 20px;
  color: #303133;
}
</style>