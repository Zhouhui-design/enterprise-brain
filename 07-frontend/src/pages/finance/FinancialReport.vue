<template>
  <div class="financial-report">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>财务管理</el-breadcrumb-item>
      <el-breadcrumb-item>财务报表</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="content-container">
      <div class="header">
        <h1>财务报表</h1>
        <div class="header-actions">
          <el-button type="primary" @click="generateReport">生成报表</el-button>
          <el-button type="success" @click="exportReport" :disabled="!reportData.length">导出报表</el-button>
          <el-button @click="printReport" :disabled="!reportData.length">打印报表</el-button>
          <el-button @click="saveAsTemplate">保存为模板</el-button>
        </div>
      </div>

      <!-- 报表配置区域 -->
      <el-card class="config-card">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="报表基本信息">
            <el-form :model="reportConfig" :inline="true" label-width="120px">
              <el-form-item label="报表类型">
                <el-select v-model="reportConfig.reportType" placeholder="请选择报表类型">
                  <el-option label="资产负债表" value="balance_sheet" />
                  <el-option label="利润表" value="income_statement" />
                  <el-option label="现金流量表" value="cash_flow" />
                  <el-option label="应收账款明细表" value="ar_detail" />
                  <el-option label="应付账款明细表" value="ap_detail" />
                  <el-option label="销售汇总表" value="sales_summary" />
                  <el-option label="费用明细表" value="expense_detail" />
                </el-select>
              </el-form-item>
              <el-form-item label="报表期间">
                <el-select v-model="reportConfig.periodType" placeholder="请选择期间类型">
                  <el-option label="月度" value="monthly" />
                  <el-option label="季度" value="quarterly" />
                  <el-option label="年度" value="yearly" />
                  <el-option label="自定义" value="custom" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="reportConfig.periodType === 'monthly'" label="月份">
                <el-date-picker
                  v-model="reportConfig.monthDate"
                  type="month"
                  placeholder="选择月份"
                />
              </el-form-item>
              <el-form-item v-if="reportConfig.periodType === 'quarterly'" label="季度">
                <el-date-picker
                  v-model="reportConfig.quarterDate"
                  type="year"
                  placeholder="选择年份"
                />
                <el-select v-model="reportConfig.quarter" placeholder="选择季度">
                  <el-option label="第一季度" value="1" />
                  <el-option label="第二季度" value="2" />
                  <el-option label="第三季度" value="3" />
                  <el-option label="第四季度" value="4" />
                </el-select>
              </el-form-item>
              <el-form-item v-if="reportConfig.periodType === 'yearly'" label="年度">
                <el-date-picker
                  v-model="reportConfig.yearDate"
                  type="year"
                  placeholder="选择年份"
                />
              </el-form-item>
              <el-form-item v-if="reportConfig.periodType === 'custom'" label="自定义日期">
                <el-date-picker
                  v-model="reportConfig.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                />
              </el-form-item>
              <el-form-item label="包含未审核单据">
                <el-switch v-model="reportConfig.includeUnapproved" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="报表筛选条件">
            <el-form :model="reportConfig" :inline="true" label-width="120px">
              <el-form-item label="部门">
                <el-select v-model="reportConfig.departmentId" placeholder="选择部门" multiple>
                  <el-option
                    v-for="dept in departmentList"
                    :key="dept.id"
                    :label="dept.name"
                    :value="dept.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="客户">
                <el-select v-model="reportConfig.customerIds" placeholder="选择客户" multiple filterable>
                  <el-option
                    v-for="customer in customerList"
                    :key="customer.id"
                    :label="customer.name"
                    :value="customer.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="供应商">
                <el-select v-model="reportConfig.supplierIds" placeholder="选择供应商" multiple filterable>
                  <el-option
                    v-for="supplier in supplierList"
                    :key="supplier.id"
                    :label="supplier.name"
                    :value="supplier.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="科目范围">
                <el-select v-model="reportConfig.accountRange" placeholder="选择科目范围">
                  <el-option label="全部科目" value="all" />
                  <el-option label="流动资产" value="current_assets" />
                  <el-option label="非流动资产" value="non_current_assets" />
                  <el-option label="流动负债" value="current_liabilities" />
                  <el-option label="非流动负债" value="non_current_liabilities" />
                  <el-option label="所有者权益" value="equity" />
                  <el-option label="收入" value="income" />
                  <el-option label="成本费用" value="expenses" />
                </el-select>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="报表展示设置">
            <el-form :model="reportConfig" label-width="150px">
              <el-form-item label="显示格式">
                <el-radio-group v-model="reportConfig.displayFormat">
                  <el-radio label="表格">表格</el-radio>
                  <el-radio label="图表">图表</el-radio>
                  <el-radio label="表格+图表">表格+图表</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="图表类型" v-if="reportConfig.displayFormat !== 'table'">
                <el-select v-model="reportConfig.chartType" placeholder="选择图表类型">
                  <el-option label="柱状图" value="bar" />
                  <el-option label="折线图" value="line" />
                  <el-option label="饼图" value="pie" />
                  <el-option label="环形图" value="doughnut" />
                  <el-option label="雷达图" value="radar" />
                </el-select>
              </el-form-item>
              <el-form-item label="排序方式">
                <el-select v-model="reportConfig.sortBy" placeholder="选择排序方式">
                  <el-option label="按代码排序" value="code" />
                  <el-option label="按金额大小排序" value="amount" />
                  <el-option label="按名称排序" value="name" />
                </el-select>
                <el-select v-model="reportConfig.sortOrder" placeholder="排序方向">
                  <el-option label="升序" value="asc" />
                  <el-option label="降序" value="desc" />
                </el-select>
              </el-form-item>
              <el-form-item label="显示累计数">
                <el-switch v-model="reportConfig.showCumulative" />
              </el-form-item>
              <el-form-item label="显示百分比">
                <el-switch v-model="reportConfig.showPercentage" />
              </el-form-item>
              <el-form-item label="显示明细">
                <el-switch v-model="reportConfig.showDetails" />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 报表结果区域 -->
      <div v-if="reportData.length > 0" class="report-result">
        <div class="report-header">
          <h2>{{ getReportTitle() }}</h2>
          <div class="report-info">
            <span>生成时间：{{ formatDateTime(new Date()) }}</span>
            <span>期间：{{ getReportPeriodText() }}</span>
            <span>报表类型：{{ getReportTypeText() }}</span>
          </div>
        </div>

        <!-- 图表展示 -->
        <el-card v-if="showChart" class="chart-card">
          <div ref="chartContainer" style="width: 100%; height: 400px;"></div>
        </el-card>

        <!-- 表格展示 -->
        <el-card v-if="showTable" class="table-card">
          <el-table
            v-loading="loading"
            :data="reportData"
            style="width: 100%"
            border
            :default-expand-all="true"
          >
            <template v-if="reportConfig.showDetails">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <el-table :data="row.details || []" style="width: 100%" size="small">
                    <el-table-column prop="date" label="日期" width="120" />
                    <el-table-column prop="code" label="凭证号" width="100" />
                    <el-table-column prop="description" label="摘要" min-width="150" />
                    <el-table-column prop="debit" label="借方" width="120" align="right" :formatter="formatCurrency" />
                    <el-table-column prop="credit" label="贷方" width="120" align="right" :formatter="formatCurrency" />
                    <el-table-column prop="balance" label="余额" width="120" align="right" :formatter="formatCurrency" />
                  </el-table>
                </template>
              </el-table-column>
            </template>
            
            <el-table-column prop="code" label="代码" width="100" />
            <el-table-column prop="name" label="名称" min-width="200" />
            <el-table-column v-if="isBalanceSheet" prop="beginningBalance" label="期初余额" width="150" align="right" :formatter="formatCurrency" />
            <el-table-column v-if="!isBalanceSheet" prop="previousPeriod" label="上期金额" width="150" align="right" :formatter="formatCurrency" />
            <el-table-column prop="currentPeriod" label="本期金额" width="150" align="right" :formatter="formatCurrency" />
            <el-table-column v-if="reportConfig.showCumulative" prop="cumulative" label="累计金额" width="150" align="right" :formatter="formatCurrency" />
            <el-table-column v-if="reportConfig.showPercentage" prop="percentage" label="占比" width="100" align="right">
              <template #default="{ row }">
                {{ (row.percentage || 0).toFixed(2) }}%
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 报表汇总信息 -->
        <div class="report-summary" v-if="reportSummary">
          <el-descriptions border :column="3" title="报表汇总">
            <el-descriptions-item v-for="(value, key) in reportSummary" :key="key" :label="getSummaryLabel(key)">
              <span v-if="typeof value === 'number'" class="font-bold">{{ formatCurrency({ value }) }}</span>
              <span v-else class="font-bold">{{ value }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading" class="empty-state">
        <el-empty description="请配置报表参数并点击生成报表按钮" />
      </div>
    </div>

    <!-- 保存模板对话框 -->
    <el-dialog
      v-model="saveTemplateVisible"
      title="保存为模板"
      width="500px"
    >
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateRules"
        label-width="120px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            placeholder="请输入模板描述"
            rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="saveTemplateVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSaveTemplate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 加载中状态 -->
    <el-dialog
      v-model="generatingVisible"
      title="正在生成报表"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="loading-content">
        <el-progress :percentage="progress" />
        <p class="loading-text">{{ progressText }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';

export default {
  name: 'FinancialReport',
  setup() {
    // 状态管理
    const loading = ref(false);
    const activeTab = ref('0');
    const reportData = ref([]);
    const reportSummary = ref(null);
    const saveTemplateVisible = ref(false);
    const generatingVisible = ref(false);
    const progress = ref(0);
    const progressText = ref('正在准备数据...');
    const chartContainer = ref(null);
    let chartInstance = null;

    // 报表配置
    const reportConfig = reactive({
      reportType: 'balance_sheet',
      periodType: 'monthly',
      monthDate: new Date(),
      quarterDate: new Date(),
      quarter: '1',
      yearDate: new Date(),
      dateRange: [new Date(), new Date()],
      includeUnapproved: false,
      departmentId: [],
      customerIds: [],
      supplierIds: [],
      accountRange: 'all',
      displayFormat: 'table',
      chartType: 'bar',
      sortBy: 'code',
      sortOrder: 'asc',
      showCumulative: false,
      showPercentage: false,
      showDetails: false
    });

    // 模板表单
    const templateForm = reactive({
      name: '',
      description: ''
    });

    const templateRules = {
      name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }]
    };

    // 模拟数据
    const departmentList = ref([
      { id: '1', name: '销售部' },
      { id: '2', name: '采购部' },
      { id: '3', name: '财务部' },
      { id: '4', name: '技术部' },
      { id: '5', name: '行政部' }
    ]);

    const customerList = ref([
      { id: '1', name: '北京科技有限公司' },
      { id: '2', name: '上海贸易公司' },
      { id: '3', name: '广州制造有限公司' },
      { id: '4', name: '深圳科技集团' },
      { id: '5', name: '杭州电子有限公司' }
    ]);

    const supplierList = ref([
      { id: '1', name: '北京供应商A' },
      { id: '2', name: '上海供应商B' },
      { id: '3', name: '广州供应商C' }
    ]);

    // 计算属性
    const showTable = computed(() => {
      return reportConfig.displayFormat === 'table' || reportConfig.displayFormat === 'table+chart';
    });

    const showChart = computed(() => {
      return reportConfig.displayFormat === 'chart' || reportConfig.displayFormat === 'table+chart';
    });

    const isBalanceSheet = computed(() => {
      return reportConfig.reportType === 'balance_sheet';
    });

    // 监听报表类型变化，更新图表类型建议
    watch(
      () => reportConfig.reportType,
      (newType) => {
        // 根据报表类型推荐合适的图表类型
        if (['income_statement', 'cash_flow'].includes(newType)) {
          reportConfig.chartType = 'bar';
        } else if (['sales_summary'].includes(newType)) {
          reportConfig.chartType = 'pie';
        }
      }
    );

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
      return `${formatDate(date)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    };

    // 格式化货币
    const formatCurrency = ({ value }) => {
      return `${value.toFixed(2)} 元`;
    };

    // 获取报表标题
    const getReportTitle = () => {
      const titles = {
        balance_sheet: '资产负债表',
        income_statement: '利润表',
        cash_flow: '现金流量表',
        ar_detail: '应收账款明细表',
        ap_detail: '应付账款明细表',
        sales_summary: '销售汇总表',
        expense_detail: '费用明细表'
      };
      return titles[reportConfig.reportType] || '财务报表';
    };

    // 获取报表类型文本
    const getReportTypeText = () => {
      return getReportTitle();
    };

    // 获取报表期间文本
    const getReportPeriodText = () => {
      switch (reportConfig.periodType) {
        case 'monthly':
          const month = new Date(reportConfig.monthDate);
          return `${month.getFullYear()}年${month.getMonth() + 1}月`;
        case 'quarterly':
          const quarterYear = new Date(reportConfig.quarterDate);
          return `${quarterYear.getFullYear()}年第${reportConfig.quarter}季度`;
        case 'yearly':
          const year = new Date(reportConfig.yearDate);
          return `${year.getFullYear()}年度`;
        case 'custom':
          return `${formatDate(reportConfig.dateRange[0])} 至 ${formatDate(reportConfig.dateRange[1])}`;
        default:
          return '';
      }
    };

    // 获取汇总标签
    const getSummaryLabel = (key) => {
      const labels = {
        totalAssets: '资产总计',
        totalLiabilities: '负债总计',
        totalEquity: '所有者权益总计',
        totalIncome: '收入总计',
        totalExpenses: '费用总计',
        netProfit: '净利润',
        totalCashFlow: '现金流量净额',
        totalAR: '应收账款合计',
        totalAP: '应付账款合计',
        totalSales: '销售总额',
        totalExpense: '费用总额'
      };
      return labels[key] || key;
    };

    // 生成模拟数据
    const generateMockData = () => {
      switch (reportConfig.reportType) {
        case 'balance_sheet':
          return generateBalanceSheetData();
        case 'income_statement':
          return generateIncomeStatementData();
        case 'cash_flow':
          return generateCashFlowData();
        case 'ar_detail':
          return generateARDetailData();
        case 'ap_detail':
          return generateAPDetailData();
        case 'sales_summary':
          return generateSalesSummaryData();
        case 'expense_detail':
          return generateExpenseDetailData();
        default:
          return [];
      }
    };

    // 生成资产负债表数据
    const generateBalanceSheetData = () => {
      return [
        { code: '1001', name: '库存现金', beginningBalance: 50000.00, currentPeriod: 60000.00, cumulative: 60000.00, percentage: 0.5, details: generateDetails() },
        { code: '1002', name: '银行存款', beginningBalance: 1500000.00, currentPeriod: 1800000.00, cumulative: 1800000.00, percentage: 15.0, details: generateDetails() },
        { code: '1122', name: '应收账款', beginningBalance: 800000.00, currentPeriod: 950000.00, cumulative: 950000.00, percentage: 7.9, details: generateDetails() },
        { code: '1123', name: '预付账款', beginningBalance: 300000.00, currentPeriod: 350000.00, cumulative: 350000.00, percentage: 2.9, details: generateDetails() },
        { code: '1403', name: '原材料', beginningBalance: 600000.00, currentPeriod: 700000.00, cumulative: 700000.00, percentage: 5.8, details: generateDetails() },
        { code: '1405', name: '库存商品', beginningBalance: 1200000.00, currentPeriod: 1300000.00, cumulative: 1300000.00, percentage: 10.8, details: generateDetails() },
        { code: '1601', name: '固定资产', beginningBalance: 5000000.00, currentPeriod: 5000000.00, cumulative: 5000000.00, percentage: 41.7, details: generateDetails() },
        { code: '1602', name: '累计折旧', beginningBalance: -1000000.00, currentPeriod: -1100000.00, cumulative: -1100000.00, percentage: -9.2, details: generateDetails() },
        { code: '1801', name: '长期待摊费用', beginningBalance: 200000.00, currentPeriod: 150000.00, cumulative: 150000.00, percentage: 1.3, details: generateDetails() },
        { code: '2001', name: '短期借款', beginningBalance: 800000.00, currentPeriod: 800000.00, cumulative: 800000.00, percentage: 6.7, details: generateDetails() },
        { code: '2202', name: '应付账款', beginningBalance: 600000.00, currentPeriod: 650000.00, cumulative: 650000.00, percentage: 5.4, details: generateDetails() },
        { code: '2203', name: '预收账款', beginningBalance: 200000.00, currentPeriod: 250000.00, cumulative: 250000.00, percentage: 2.1, details: generateDetails() },
        { code: '2211', name: '应付职工薪酬', beginningBalance: 150000.00, currentPeriod: 180000.00, cumulative: 180000.00, percentage: 1.5, details: generateDetails() },
        { code: '2221', name: '应交税费', beginningBalance: 100000.00, currentPeriod: 120000.00, cumulative: 120000.00, percentage: 1.0, details: generateDetails() },
        { code: '2501', name: '长期借款', beginningBalance: 2000000.00, currentPeriod: 2000000.00, cumulative: 2000000.00, percentage: 16.7, details: generateDetails() },
        { code: '4001', name: '实收资本', beginningBalance: 3000000.00, currentPeriod: 3000000.00, cumulative: 3000000.00, percentage: 25.0, details: generateDetails() },
        { code: '4103', name: '本年利润', beginningBalance: 800000.00, currentPeriod: 1050000.00, cumulative: 1050000.00, percentage: 8.8, details: generateDetails() }
      ];
    };

    // 生成利润表数据
    const generateIncomeStatementData = () => {
      return [
        { code: '6001', name: '主营业务收入', previousPeriod: 2500000.00, currentPeriod: 2800000.00, cumulative: 5300000.00, percentage: 93.0, details: generateDetails() },
        { code: '6051', name: '其他业务收入', previousPeriod: 150000.00, currentPeriod: 200000.00, cumulative: 350000.00, percentage: 6.1, details: generateDetails() },
        { code: '6301', name: '营业外收入', previousPeriod: 50000.00, currentPeriod: 50000.00, cumulative: 100000.00, percentage: 0.9, details: generateDetails() },
        { code: '6401', name: '主营业务成本', previousPeriod: 1500000.00, currentPeriod: 1680000.00, cumulative: 3180000.00, percentage: 82.7, details: generateDetails() },
        { code: '6402', name: '其他业务成本', previousPeriod: 90000.00, currentPeriod: 120000.00, cumulative: 210000.00, percentage: 5.5, details: generateDetails() },
        { code: '6403', name: '营业税金及附加', previousPeriod: 130000.00, currentPeriod: 145000.00, cumulative: 275000.00, percentage: 7.2, details: generateDetails() },
        { code: '6601', name: '销售费用', previousPeriod: 200000.00, currentPeriod: 220000.00, cumulative: 420000.00, percentage: 10.9, details: generateDetails() },
        { code: '6602', name: '管理费用', previousPeriod: 180000.00, currentPeriod: 200000.00, cumulative: 380000.00, percentage: 9.9, details: generateDetails() },
        { code: '6603', name: '财务费用', previousPeriod: 50000.00, currentPeriod: 55000.00, cumulative: 105000.00, percentage: 2.7, details: generateDetails() },
        { code: '6711', name: '营业外支出', previousPeriod: 30000.00, currentPeriod: 35000.00, cumulative: 65000.00, percentage: 1.7, details: generateDetails() },
        { code: '6801', name: '所得税费用', previousPeriod: 100000.00, currentPeriod: 120000.00, cumulative: 220000.00, percentage: 5.7, details: generateDetails() }
      ];
    };

    // 生成现金流量表数据
    const generateCashFlowData = () => {
      return [
        { code: '1', name: '经营活动现金流入', previousPeriod: 3000000.00, currentPeriod: 3200000.00, cumulative: 6200000.00, percentage: 80.5, details: generateDetails() },
        { code: '2', name: '销售商品、提供劳务收到的现金', previousPeriod: 2800000.00, currentPeriod: 3000000.00, cumulative: 5800000.00, percentage: 93.5, details: generateDetails() },
        { code: '3', name: '收到的税费返还', previousPeriod: 100000.00, currentPeriod: 100000.00, cumulative: 200000.00, percentage: 3.2, details: generateDetails() },
        { code: '4', name: '收到的其他与经营活动有关的现金', previousPeriod: 100000.00, currentPeriod: 100000.00, cumulative: 200000.00, percentage: 3.2, details: generateDetails() },
        { code: '5', name: '经营活动现金流出', previousPeriod: 2400000.00, currentPeriod: 2550000.00, cumulative: 4950000.00, percentage: 82.5, details: generateDetails() },
        { code: '6', name: '购买商品、接受劳务支付的现金', previousPeriod: 1600000.00, currentPeriod: 1700000.00, cumulative: 3300000.00, percentage: 66.7, details: generateDetails() },
        { code: '7', name: '支付给职工以及为职工支付的现金', previousPeriod: 350000.00, currentPeriod: 380000.00, cumulative: 730000.00, percentage: 14.7, details: generateDetails() },
        { code: '8', name: '支付的各项税费', previousPeriod: 250000.00, currentPeriod: 270000.00, cumulative: 520000.00, percentage: 10.5, details: generateDetails() },
        { code: '9', name: '支付的其他与经营活动有关的现金', previousPeriod: 200000.00, currentPeriod: 200000.00, cumulative: 400000.00, percentage: 8.1, details: generateDetails() },
        { code: '10', name: '经营活动产生的现金流量净额', previousPeriod: 600000.00, currentPeriod: 650000.00, cumulative: 1250000.00, percentage: 68.5, details: generateDetails() },
        { code: '11', name: '投资活动现金流入', previousPeriod: 100000.00, currentPeriod: 150000.00, cumulative: 250000.00, percentage: 3.2, details: generateDetails() },
        { code: '12', name: '投资活动现金流出', previousPeriod: 500000.00, currentPeriod: 600000.00, cumulative: 1100000.00, percentage: 18.3, details: generateDetails() },
        { code: '13', name: '投资活动产生的现金流量净额', previousPeriod: -400000.00, currentPeriod: -450000.00, cumulative: -850000.00, percentage: -46.7, details: generateDetails() },
        { code: '14', name: '筹资活动现金流入', previousPeriod: 500000.00, currentPeriod: 400000.00, cumulative: 900000.00, percentage: 11.7, details: generateDetails() },
        { code: '15', name: '筹资活动现金流出', previousPeriod: 200000.00, currentPeriod: 200000.00, cumulative: 400000.00, percentage: 6.7, details: generateDetails() },
        { code: '16', name: '筹资活动产生的现金流量净额', previousPeriod: 300000.00, currentPeriod: 200000.00, cumulative: 500000.00, percentage: 27.5, details: generateDetails() },
        { code: '17', name: '现金及现金等价物净增加额', previousPeriod: 500000.00, currentPeriod: 400000.00, cumulative: 900000.00, percentage: 49.4, details: generateDetails() }
      ];
    };

    // 生成应收账款明细数据
    const generateARDetailData = () => {
      return customerList.value.map((customer, index) => ({
        code: `AR${index + 1}`,
        name: customer.name,
        previousPeriod: (500000 + index * 100000),
        currentPeriod: (550000 + index * 120000),
        cumulative: (1050000 + index * 220000),
        percentage: (15 - index * 2),
        details: generateDetails()
      }));
    };

    // 生成应付账款明细数据
    const generateAPDetailData = () => {
      return supplierList.value.map((supplier, index) => ({
        code: `AP${index + 1}`,
        name: supplier.name,
        previousPeriod: (300000 + index * 150000),
        currentPeriod: (350000 + index * 180000),
        cumulative: (650000 + index * 330000),
        percentage: (40 - index * 10),
        details: generateDetails()
      }));
    };

    // 生成销售汇总数据
    const generateSalesSummaryData = () => {
      return [
        { code: 'S1', name: '产品A', previousPeriod: 800000.00, currentPeriod: 950000.00, cumulative: 1750000.00, percentage: 33.0, details: generateDetails() },
        { code: 'S2', name: '产品B', previousPeriod: 700000.00, currentPeriod: 850000.00, cumulative: 1550000.00, percentage: 29.2, details: generateDetails() },
        { code: 'S3', name: '产品C', previousPeriod: 600000.00, currentPeriod: 700000.00, cumulative: 1300000.00, percentage: 24.5, details: generateDetails() },
        { code: 'S4', name: '产品D', previousPeriod: 300000.00, currentPeriod: 350000.00, cumulative: 650000.00, percentage: 12.3, details: generateDetails() },
        { code: 'S5', name: '产品E', previousPeriod: 100000.00, currentPeriod: 100000.00, cumulative: 200000.00, percentage: 3.8, details: generateDetails() }
      ];
    };

    // 生成费用明细数据
    const generateExpenseDetailData = () => {
      return [
        { code: 'E1', name: '差旅费', previousPeriod: 150000.00, currentPeriod: 160000.00, cumulative: 310000.00, percentage: 18.5, details: generateDetails() },
        { code: 'E2', name: '办公费', previousPeriod: 120000.00, currentPeriod: 130000.00, cumulative: 250000.00, percentage: 14.9, details: generateDetails() },
        { code: 'E3', name: '水电费', previousPeriod: 80000.00, currentPeriod: 85000.00, cumulative: 165000.00, percentage: 9.8, details: generateDetails() },
        { code: 'E4', name: '通讯费', previousPeriod: 60000.00, currentPeriod: 65000.00, cumulative: 125000.00, percentage: 7.5, details: generateDetails() },
        { code: 'E5', name: '广告费', previousPeriod: 200000.00, currentPeriod: 220000.00, cumulative: 420000.00, percentage: 25.0, details: generateDetails() },
        { code: 'E6', name: '招待费', previousPeriod: 90000.00, currentPeriod: 95000.00, cumulative: 185000.00, percentage: 11.0, details: generateDetails() },
        { code: 'E7', name: '培训费', previousPeriod: 70000.00, currentPeriod: 75000.00, cumulative: 145000.00, percentage: 8.6, details: generateDetails() },
        { code: 'E8', name: '其他费用', previousPeriod: 80000.00, currentPeriod: 85000.00, cumulative: 165000.00, percentage: 9.8, details: generateDetails() }
      ];
    };

    // 生成明细数据
    const generateDetails = () => {
      const details = [];
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        details.push({
          date: formatDate(date),
          code: `VOU${date.getMonth() + 1}${String(date.getDate()).padStart(2, '0')}`,
          description: `业务描述${i + 1}`,
          debit: Math.random() * 100000,
          credit: Math.random() * 80000,
          balance: Math.random() * 200000
        });
      }
      return details;
    };

    // 生成汇总信息
    const generateSummary = (data) => {
      switch (reportConfig.reportType) {
        case 'balance_sheet':
          const assets = data.filter(item => item.code.startsWith('1')).reduce((sum, item) => sum + item.currentPeriod, 0);
          const liabilities = data.filter(item => item.code.startsWith('2')).reduce((sum, item) => sum + item.currentPeriod, 0);
          const equity = data.filter(item => item.code.startsWith('4')).reduce((sum, item) => sum + item.currentPeriod, 0);
          return {
            totalAssets: assets,
            totalLiabilities: liabilities,
            totalEquity: equity
          };
        case 'income_statement':
          const income = data.filter(item => ['6001', '6051', '6301'].includes(item.code)).reduce((sum, item) => sum + item.currentPeriod, 0);
          const expenses = data.filter(item => ['6401', '6402', '6403', '6601', '6602', '6603', '6711'].includes(item.code)).reduce((sum, item) => sum + item.currentPeriod, 0);
          const profit = income - expenses;
          return {
            totalIncome: income,
            totalExpenses: expenses,
            netProfit: profit
          };
        case 'cash_flow':
          const cashFlow = data.find(item => item.code === '17');
          return {
            totalCashFlow: cashFlow ? cashFlow.currentPeriod : 0
          };
        case 'ar_detail':
          const totalAR = data.reduce((sum, item) => sum + item.currentPeriod, 0);
          return {
            totalAR: totalAR
          };
        case 'ap_detail':
          const totalAP = data.reduce((sum, item) => sum + item.currentPeriod, 0);
          return {
            totalAP: totalAP
          };
        case 'sales_summary':
          const totalSales = data.reduce((sum, item) => sum + item.currentPeriod, 0);
          return {
            totalSales: totalSales
          };
        case 'expense_detail':
          const totalExpense = data.reduce((sum, item) => sum + item.currentPeriod, 0);
          return {
            totalExpense: totalExpense
          };
        default:
          return null;
      }
    };

    // 生成图表
    const generateChart = () => {
      if (!chartContainer.value || !reportData.value.length) return;

      // 销毁旧图表
      if (chartInstance) {
        chartInstance.dispose();
      }

      // 创建新图表
      chartInstance = echarts.init(chartContainer.value);

      let option = {};
      const names = reportData.value.map(item => item.name);
      const values = reportData.value.map(item => item.currentPeriod);

      switch (reportConfig.chartType) {
        case 'bar':
          option = {
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              },
              formatter: function(params) {
                const data = params[0];
                return `${data.name}<br/>金额: ${data.value.toFixed(2)} 元`;
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: names,
              axisLabel: {
                rotate: 45,
                interval: 0
              }
            },
            yAxis: {
              type: 'value',
              axisLabel: {
                formatter: function(value) {
                  return (value / 10000) + '万';
                }
              }
            },
            series: [{
              data: values,
              type: 'bar',
              showBackground: true,
              backgroundStyle: {
                color: 'rgba(180, 180, 180, 0.2)'
              },
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#83bff6' },
                  { offset: 0.5, color: '#188df0' },
                  { offset: 1, color: '#188df0' }
                ])
              }
            }]
          };
          break;
        case 'line':
          option = {
            tooltip: {
              trigger: 'axis',
              formatter: function(params) {
                let result = `${params[0].name}<br/>`;
                params.forEach(param => {
                  result += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)} 元<br/>`;
                });
                return result;
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              boundaryGap: false,
              data: names
            },
            yAxis: {
              type: 'value',
              axisLabel: {
                formatter: function(value) {
                  return (value / 10000) + '万';
                }
              }
            },
            series: [
              {
                name: '本期金额',
                type: 'line',
                stack: 'Total',
                data: values,
                smooth: true,
                lineStyle: {
                  width: 3
                },
                areaStyle: {
                  color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(24, 144, 255, 0.5)' },
                    { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
                  ])
                }
              }
            ]
          };
          break;
        case 'pie':
        case 'doughnut':
          const pieData = names.map((name, index) => ({
            name: name,
            value: values[index]
          })).filter(item => item.value > 0);
          
          option = {
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} 元 ({d}%)'
            },
            legend: {
              orient: 'vertical',
              left: 'left',
              top: 'middle'
            },
            series: [
              {
                name: getReportTitle(),
                type: 'pie',
                radius: reportConfig.chartType === 'doughnut' ? ['40%', '70%'] : '60%',
                center: ['60%', '50%'],
                data: pieData,
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                  }
                },
                label: {
                  formatter: '{b}\n{d}%'
                }
              }
            ]
          };
          break;
        case 'radar':
          const radarIndicator = names.map(name => ({
            name: name,
            max: Math.max(...values) * 1.2
          }));
          
          option = {
            tooltip: {},
            radar: {
              indicator: radarIndicator,
              center: ['50%', '50%'],
              radius: '70%'
            },
            series: [
              {
                type: 'radar',
                data: [
                  {
                    value: values,
                    name: '本期金额',
                    areaStyle: {
                      color: 'rgba(24, 144, 255, 0.3)'
                    },
                    lineStyle: {
                      color: '#1890ff'
                    }
                  }
                ]
              }
            ]
          };
          break;
      }

      chartInstance.setOption(option);

      // 响应式调整
      window.addEventListener('resize', () => {
        chartInstance && chartInstance.resize();
      });
    };

    // 生成报表
    const generateReport = () => {
      generatingVisible.value = true;
      progress.value = 0;
      progressText.value = '正在准备数据...';

      // 模拟进度
      const timer = setInterval(() => {
        progress.value += 10;
        if (progress.value <= 30) {
          progressText.value = '正在准备数据...';
        } else if (progress.value <= 60) {
          progressText.value = '正在处理数据...';
        } else if (progress.value <= 90) {
          progressText.value = '正在生成报表...';
        } else {
          progressText.value = '报表生成完成...';
        }

        if (progress.value >= 100) {
          clearInterval(timer);
          
          // 生成数据
          reportData.value = generateMockData();
          reportSummary.value = generateSummary(reportData.value);
          
          // 延迟关闭对话框并生成图表
          setTimeout(() => {
            generatingVisible.value = false;
            ElMessage.success('报表生成成功');
            
            nextTick(() => {
              if (showChart.value) {
                generateChart();
              }
            });
          }, 500);
        }
      }, 200);
    };

    // 导出报表
    const exportReport = () => {
      ElMessageBox.confirm('请选择导出格式', '导出报表', {
        confirmButtonText: 'Excel',
        cancelButtonText: 'PDF',
        type: 'info'
      }).then(() => {
        // 模拟导出Excel
        ElMessage.success('Excel报表导出成功');
      }).catch(() => {
        // 模拟导出PDF
        ElMessage.success('PDF报表导出成功');
      });
    };

    // 打印报表
    const printReport = () => {
      ElMessage.info('正在准备打印...');
      setTimeout(() => {
        ElMessage.success('报表打印成功');
      }, 1000);
    };

    // 保存为模板
    const saveAsTemplate = () => {
      templateForm.name = `${getReportTitle()}_${formatDate(new Date())}`;
      templateForm.description = '';
      saveTemplateVisible.value = true;
    };

    // 确认保存模板
    const confirmSaveTemplate = () => {
      ElMessage.success('模板保存成功');
      saveTemplateVisible.value = false;
    };

    return {
      loading,
      activeTab,
      reportData,
      reportSummary,
      reportConfig,
      templateForm,
      templateRules,
      saveTemplateVisible,
      generatingVisible,
      progress,
      progressText,
      chartContainer,
      departmentList,
      customerList,
      supplierList,
      showTable,
      showChart,
      isBalanceSheet,
      formatDate,
      formatDateTime,
      formatCurrency,
      getReportTitle,
      getReportTypeText,
      getReportPeriodText,
      getSummaryLabel,
      generateReport,
      exportReport,
      printReport,
      saveAsTemplate,
      confirmSaveTemplate
    };
  }
};
</script>

<style scoped>
.financial-report {
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

.config-card {
  margin-bottom: 20px;
}

.report-result {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e4e7ed;
}

.report-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  color: #303133;
}

.report-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 14px;
  color: #606266;
}

.chart-card,
.table-card {
  margin-bottom: 20px;
}

.report-summary {
  margin-top: 30px;
}

.empty-state {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  padding: 20px 0;
}

.loading-text {
  margin-top: 20px;
  color: #606266;
}

.font-bold {
  font-weight: bold;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .header-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .report-info {
    flex-direction: column;
    gap: 10px;
  }
}
</style>