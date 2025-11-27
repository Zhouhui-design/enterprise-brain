<template>
  <CommonFinanceTemplate
    pageTitle="财务分析"
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
        <el-radio-button label="salesChart">销售额趋势</el-radio-button>
        <el-radio-button label="expenseChart">费用分析</el-radio-button>
        <el-radio-button label="profitChart">利润分析</el-radio-button>
        <el-radio-button label="cashFlowChart">现金流分析</el-radio-button>
        <el-radio-button label="categoryChart">分类占比</el-radio-button>
      </el-radio-group>
    </template>
    
    <!-- 销售额趋势图表 -->
    <template #salesChart>
      <div class="chart-container">
        <canvas ref="salesChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 费用分析图表 -->
    <template #expenseChart>
      <div class="chart-container">
        <canvas ref="expenseChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 利润分析图表 -->
    <template #profitChart>
      <div class="chart-container">
        <canvas ref="profitChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 现金流分析图表 -->
    <template #cashFlowChart>
      <div class="chart-container">
        <canvas ref="cashFlowChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 分类占比图表 -->
    <template #categoryChart>
      <div class="chart-container">
        <canvas ref="categoryChartRef" :width="chartWidth" :height="chartHeight"></canvas>
      </div>
    </template>
    
    <!-- 自定义操作列 -->
    <template #operation="{ row }">
      <el-button type="primary" size="small" @click="handleViewDetails(row)">详情</el-button>
      <el-button type="success" size="small" @click="handleExportData(row)">导出</el-button>
      <el-button type="info" size="small" @click="handleCompareData(row)">对比</el-button>
    </template>
    
    <!-- 详情查看对话框 -->
    <template #dialog-view-details="{ dialog }">
      <div class="analysis-details">
        <h3>{{ currentAnalysisDetail.title }}</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="分析期间">{{ currentAnalysisDetail.periodText }}</el-descriptions-item>
          <el-descriptions-item label="销售收入">{{ formatCurrency(currentAnalysisDetail.salesAmount) }}</el-descriptions-item>
          <el-descriptions-item label="营业成本">{{ formatCurrency(currentAnalysisDetail.costAmount) }}</el-descriptions-item>
          <el-descriptions-item label="营业利润">{{ formatCurrency(currentAnalysisDetail.operatingProfit) }}</el-descriptions-item>
          <el-descriptions-item label="净利润">{{ formatCurrency(currentAnalysisDetail.netProfit) }}</el-descriptions-item>
          <el-descriptions-item label="同比增长率">{{ formatPercentage(currentAnalysisDetail.yearOnYearGrowth) }}</el-descriptions-item>
          <el-descriptions-item label="环比增长率">{{ formatPercentage(currentAnalysisDetail.sequentialGrowth) }}</el-descriptions-item>
          <el-descriptions-item label="毛利率">{{ formatPercentage(currentAnalysisDetail.grossMargin) }}</el-descriptions-item>
          <el-descriptions-item label="净利率">{{ formatPercentage(currentAnalysisDetail.netMargin) }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 详细数据表格 -->
        <h4 style="margin-top: 30px;">详细数据</h4>
        <el-tabs v-model="detailTab">
          <el-tab-pane label="收入明细">
            <el-table :data="currentAnalysisDetail.incomeDetails" border style="width: 100%;">
              <el-table-column prop="category" label="收入类别" width="180" />
              <el-table-column prop="amount" label="金额" width="150" :formatter="formatCurrency" />
              <el-table-column prop="percentage" label="占比" width="100" :formatter="formatPercentage" />
              <el-table-column prop="yoyChange" label="同比变化" width="120" :formatter="formatPercentage" />
              <el-table-column prop="remark" label="说明" min-width="200" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="费用明细">
            <el-table :data="currentAnalysisDetail.expenseDetails" border style="width: 100%;">
              <el-table-column prop="category" label="费用类别" width="180" />
              <el-table-column prop="amount" label="金额" width="150" :formatter="formatCurrency" />
              <el-table-column prop="percentage" label="占比" width="100" :formatter="formatPercentage" />
              <el-table-column prop="yoyChange" label="同比变化" width="120" :formatter="formatPercentage" />
              <el-table-column prop="remark" label="说明" min-width="200" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="成本明细">
            <el-table :data="currentAnalysisDetail.costDetails" border style="width: 100%;">
              <el-table-column prop="category" label="成本类别" width="180" />
              <el-table-column prop="amount" label="金额" width="150" :formatter="formatCurrency" />
              <el-table-column prop="percentage" label="占比" width="100" :formatter="formatPercentage" />
              <el-table-column prop="yoyChange" label="同比变化" width="120" :formatter="formatPercentage" />
              <el-table-column prop="remark" label="说明" min-width="200" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="趋势图">
            <div class="detail-chart-container">
              <canvas ref="detailChartRef" :width="chartWidth - 100" :height="chartHeight - 50"></canvas>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
    
    <!-- 数据对比对话框 -->
    <template #dialog-data-comparison="{ dialog }">
      <div class="comparison-container">
        <h3>数据对比分析</h3>
        <div class="comparison-controls">
          <el-select v-model="comparisonPeriod1" placeholder="选择对比期间1" style="width: 200px; margin-right: 10px;">
            <el-option v-for="option in periodOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <span style="margin: 0 10px;">VS</span>
          <el-select v-model="comparisonPeriod2" placeholder="选择对比期间2" style="width: 200px; margin-left: 10px;">
            <el-option v-for="option in periodOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <el-button type="primary" style="margin-left: 10px;" @click="handleComparePeriods">对比</el-button>
        </div>
        
        <!-- 对比结果 -->
        <div class="comparison-result" v-if="comparisonResult">
          <el-table :data="comparisonResult" border style="width: 100%;">
            <el-table-column prop="index" label="序号" width="80" />
            <el-table-column prop="indicator" label="指标" min-width="150" />
            <el-table-column prop="period1" label="{{ getPeriodLabel(comparisonPeriod1) }}" width="180" :formatter="formatComparisonValue" />
            <el-table-column prop="period2" label="{{ getPeriodLabel(comparisonPeriod2) }}" width="180" :formatter="formatComparisonValue" />
            <el-table-column prop="difference" label="差值" width="150" :formatter="formatDifference" />
            <el-table-column prop="changeRate" label="变化率" width="120" :formatter="formatChangeRate" />
          </el-table>
          
          <!-- 对比图表 -->
          <div class="comparison-chart-container">
            <canvas ref="comparisonChartRef" :width="chartWidth" :height="chartHeight - 50"></canvas>
          </div>
        </div>
      </div>
    </template>
    
    <!-- 分析报告生成对话框 -->
    <template #dialog-generate-report="{ dialog }">
      <div class="report-generation">
        <el-form :model="reportForm" :rules="reportFormRules" ref="reportFormRef" label-width="120px">
          <el-form-item label="报告名称" prop="title">
            <el-input v-model="reportForm.title" placeholder="请输入报告名称" />
          </el-form-item>
          <el-form-item label="报告期间" prop="period">
            <el-select v-model="reportForm.period" placeholder="请选择报告期间">
              <el-option v-for="option in periodOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="报告类型" prop="type">
            <el-select v-model="reportForm.type" placeholder="请选择报告类型">
              <el-option label="月度财务报告" value="monthly" />
              <el-option label="季度财务报告" value="quarterly" />
              <el-option label="年度财务报告" value="annual" />
              <el-option label="自定义报告" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item label="包含内容">
            <el-checkbox-group v-model="reportForm.includeItems">
              <el-checkbox label="sales" border>销售分析</el-checkbox>
              <el-checkbox label="expense" border>费用分析</el-checkbox>
              <el-checkbox label="profit" border>利润分析</el-checkbox>
              <el-checkbox label="cashFlow" border>现金流分析</el-checkbox>
              <el-checkbox label="trend" border>趋势对比</el-checkbox>
              <el-checkbox label="recommendation" border>建议与总结</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="报告说明" prop="description">
            <el-input v-model="reportForm.description" type="textarea" :rows="3" placeholder="请输入报告说明（选填）" />
          </el-form-item>
        </el-form>
        
        <!-- 生成进度 -->
        <div class="progress-section" v-if="reportGenerationProgress > 0 && reportGenerationProgress < 100">
          <h4>生成进度</h4>
          <el-progress :percentage="reportGenerationProgress" :status="reportGenerationStatus" />
          <p class="progress-text">{{ reportGenerationMessage }}</p>
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
  name: 'FinancialAnalysis',
  components: {
    CommonFinanceTemplate
  },
  setup() {
    // 模板引用
    const templateRef = ref(null);
    const reportFormRef = ref(null);
    
    // 图表引用
    const salesChartRef = ref(null);
    const expenseChartRef = ref(null);
    const profitChartRef = ref(null);
    const cashFlowChartRef = ref(null);
    const categoryChartRef = ref(null);
    const detailChartRef = ref(null);
    const comparisonChartRef = ref(null);
    
    // 图表实例
    const chartInstances = reactive({
      salesChart: null,
      expenseChart: null,
      profitChart: null,
      cashFlowChart: null,
      categoryChart: null,
      detailChart: null,
      comparisonChart: null
    });
    
    // 状态管理
    const activeChartTab = ref('salesChart');
    const chartWidth = ref(800);
    const chartHeight = ref(400);
    const currentAnalysisDetail = reactive({});
    const detailTab = ref('0');
    const comparisonPeriod1 = ref('');
    const comparisonPeriod2 = ref('');
    const comparisonResult = ref([]);
    const reportGenerationProgress = ref(0);
    const reportGenerationStatus = ref('success');
    const reportGenerationMessage = ref('');
    
    // 分析数据
    const analysisData = ref([]);
    
    // 报告表单
    const reportForm = reactive({
      title: '',
      period: '',
      type: 'monthly',
      includeItems: ['sales', 'expense', 'profit'],
      description: ''
    });
    
    // 报告表单验证规则
    const reportFormRules = {
      title: [
        { required: true, message: '请输入报告名称', trigger: 'blur' },
        { min: 2, max: 100, message: '报告名称长度在 2 到 100 个字符', trigger: 'blur' }
      ],
      period: [
        { required: true, message: '请选择报告期间', trigger: 'change' }
      ],
      type: [
        { required: true, message: '请选择报告类型', trigger: 'change' }
      ],
      includeItems: [
        { required: true, message: '请至少选择一项包含内容', trigger: 'change' }
      ]
    };
    
    // 期间选项
    const periodOptions = ref([
      { label: '2023年1月', value: '2023-01' },
      { label: '2023年2月', value: '2023-02' },
      { label: '2023年3月', value: '2023-03' },
      { label: '2023年4月', value: '2023-04' },
      { label: '2023年5月', value: '2023-05' },
      { label: '2023年6月', value: '2023-06' },
      { label: '2023年7月', value: '2023-07' },
      { label: '2023年8月', value: '2023-08' },
      { label: '2023年9月', value: '2023-09' },
      { label: '2023年10月', value: '2023-10' },
      { label: '2023年11月', value: '2023-11' },
      { label: '2023年12月', value: '2023-12' },
      { label: '2024年1月', value: '2024-01' },
      { label: '2024年2月', value: '2024-02' },
      { label: '2024年3月', value: '2024-03' },
      { label: '2024年4月', value: '2024-04' },
      { label: '2024年5月', value: '2024-05' },
      { label: '2024年6月', value: '2024-06' },
      { label: '2023年Q1', value: '2023-Q1' },
      { label: '2023年Q2', value: '2023-Q2' },
      { label: '2023年Q3', value: '2023-Q3' },
      { label: '2023年Q4', value: '2023-Q4' },
      { label: '2024年Q1', value: '2024-Q1' },
      { label: '2024年Q2', value: '2024-Q2' },
      { label: '2023年', value: '2023' },
      { label: '2024年上半年', value: '2024-H1' }
    ]);
    
    // 初始化搜索字段
    const initSearchFields = () => {
      const searchFields = [
        {
          key: 'analysisType',
          type: 'select',
          label: '分析类型',
          options: [
            { label: '销售分析', value: 'sales' },
            { label: '费用分析', value: 'expense' },
            { label: '利润分析', value: 'profit' },
            { label: '现金流分析', value: 'cashFlow' },
            { label: '综合分析', value: 'comprehensive' }
          ],
          clearable: true
        },
        {
          key: 'timeRange',
          type: 'date',
          label: '分析期间',
          dateType: 'daterange',
          startPlaceholder: '开始日期',
          endPlaceholder: '结束日期'
        },
        {
          key: 'department',
          type: 'select',
          label: '部门',
          options: [
            { label: '全部部门', value: 'all' },
            { label: '销售部', value: 'sales' },
            { label: '市场部', value: 'marketing' },
            { label: '技术部', value: 'tech' },
            { label: '财务部', value: 'finance' },
            { label: '运营部', value: 'operation' }
          ],
          clearable: true
        },
        {
          key: 'productCategory',
          type: 'select',
          label: '产品类别',
          options: [
            { label: '产品A', value: 'productA' },
            { label: '产品B', value: 'productB' },
            { label: '产品C', value: 'productC' },
            { label: '服务', value: 'service' },
            { label: '配件', value: 'accessory' }
          ],
          clearable: true
        },
        {
          key: 'showComparison',
          type: 'switch',
          label: '显示同比',
          activeText: '是',
          inactiveText: '否'
        },
        {
          key: 'showSequential',
          type: 'switch',
          label: '显示环比',
          activeText: '是',
          inactiveText: '否'
        }
      ];
      
      templateRef.value?.initSearchForm(searchFields);
    };
    
    // 初始化统计卡片
    const initStatisticsCards = () => {
      const cards = [
        {
          label: '累计销售额',
          value: '0.00 元',
          type: 'success',
          description: '当前分析期间的销售总额'
        },
        {
          label: '累计费用',
          value: '0.00 元',
          type: 'warning',
          description: '当前分析期间的费用总额'
        },
        {
          label: '净利润',
          value: '0.00 元',
          type: 'primary',
          description: '当前分析期间的净利润'
        },
        {
          label: '净利率',
          value: '0.00%',
          type: 'info',
          description: '净利润占销售收入的比例'
        },
        {
          label: '同比增长',
          value: '0.00%',
          type: 'success',
          description: '与去年同期相比的增长率'
        },
        {
          label: '环比增长',
          value: '0.00%',
          type: 'warning',
          description: '与上一期间相比的增长率'
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
          prop: 'period',
          label: '分析期间',
          width: 150
        },
        {
          prop: 'salesAmount',
          label: '销售收入',
          width: 150,
          formatter: (row) => formatCurrency(row.salesAmount)
        },
        {
          prop: 'costAmount',
          label: '成本',
          width: 120,
          formatter: (row) => formatCurrency(row.costAmount)
        },
        {
          prop: 'grossMargin',
          label: '毛利率',
          width: 100,
          formatter: (row) => formatPercentage(row.grossMargin)
        },
        {
          prop: 'expenseAmount',
          label: '费用',
          width: 120,
          formatter: (row) => formatCurrency(row.expenseAmount)
        },
        {
          prop: 'netProfit',
          label: '净利润',
          width: 120,
          formatter: (row) => formatCurrency(row.netProfit)
        },
        {
          prop: 'netMargin',
          label: '净利率',
          width: 100,
          formatter: (row) => formatPercentage(row.netMargin)
        },
        {
          prop: 'yearOnYearGrowth',
          label: '同比增长',
          width: 120,
          formatter: (row) => formatPercentage(row.yearOnYearGrowth)
        },
        {
          type: 'action',
          label: '操作',
          width: 180,
          template: 'operation'
        }
      ];
      
      templateRef.value?.setTableColumns(columns);
    };
    
    // 初始化对话框
    const initDialogs = () => {
      const dialogs = [
        {
          key: 'view-details',
          visible: false,
          title: '分析详情',
          width: '900px',
          onClose: () => {
            // 清空当前详情数据
            Object.keys(currentAnalysisDetail).forEach(key => delete currentAnalysisDetail[key]);
            detailTab.value = '0';
          },
          hideCancel: true,
          buttons: []
        },
        {
          key: 'data-comparison',
          visible: false,
          title: '数据对比',
          width: '900px',
          onClose: () => {
            comparisonResult.value = [];
            comparisonPeriod1.value = '';
            comparisonPeriod2.value = '';
          },
          buttons: [
            {
              key: 'export',
              text: '导出对比结果',
              type: 'success',
              handler: handleExportComparison
            }
          ]
        },
        {
          key: 'generate-report',
          visible: false,
          title: '生成分析报告',
          width: '700px',
          onClose: () => {
            reportFormRef.value?.resetFields();
            reportGenerationProgress.value = 0;
            reportGenerationMessage.value = '';
            Object.assign(reportForm, {
              title: '',
              period: '',
              type: 'monthly',
              includeItems: ['sales', 'expense', 'profit'],
              description: ''
            });
          },
          buttons: [
            {
              key: 'generate',
              text: '生成报告',
              type: 'primary',
              handler: handleGenerateReport
            }
          ]
        }
      ];
      
      templateRef.value?.setDialogs(dialogs);
    };
    
    // 初始化头部操作按钮
    const initHeaderActions = () => {
      const actions = [
        {
          key: 'refresh',
          text: '刷新数据',
          type: 'primary',
          icon: 'el-icon-refresh',
          handler: handleRefreshData
        },
        {
          key: 'exportAnalysis',
          text: '导出分析',
          type: 'success',
          icon: 'el-icon-download',
          handler: handleExportAnalysis
        },
        {
          key: 'printAnalysis',
          text: '打印分析',
          type: 'info',
          icon: 'el-icon-printer',
          handler: handlePrintAnalysis
        },
        {
          key: 'dataComparison',
          text: '数据对比',
          type: 'warning',
          icon: 'el-icon-s-operation',
          handler: handleOpenDataComparison
        },
        {
          key: 'generateReport',
          text: '生成报告',
          type: 'success',
          icon: 'el-icon-document',
          handler: handleOpenGenerateReport
        },
        {
          key: 'saveConfiguration',
          text: '保存配置',
          type: 'info',
          icon: 'el-icon-save',
          handler: handleSaveConfiguration
        }
      ];
      
      templateRef.value?.setHeaderActions(actions);
    };
    
    // 加载分析数据
    const loadAnalysisData = () => {
      // 模拟数据加载
      const mockData = generateMockAnalysisData();
      analysisData.value = mockData;
      
      // 更新统计信息
      updateStatistics(mockData);
      
      // 更新分页信息
      templateRef.value?.updatePagination(mockData.length, 1, 10);
    };
    
    // 生成模拟分析数据
    const generateMockAnalysisData = () => {
      const data = [];
      const baseSales = 1000000;
      const baseCost = 600000;
      const baseExpense = 200000;
      
      // 生成2023年全年数据
      for (let month = 1; month <= 12; month++) {
        const monthStr = String(month).padStart(2, '0');
        const season = Math.floor((month - 1) / 3) + 1;
        const seasonalFactor = 0.8 + 0.4 * Math.sin((month - 1) * Math.PI / 6); // 季节性波动
        const randomFactor = 0.95 + 0.1 * Math.random(); // 随机波动
        
        const salesAmount = Math.round(baseSales * seasonalFactor * randomFactor);
        const costAmount = Math.round(salesAmount * (0.55 + 0.1 * Math.random())); // 成本率在55%-65%之间
        const expenseAmount = Math.round(baseExpense * seasonalFactor * randomFactor * (0.8 + 0.4 * Math.random()));
        const grossProfit = salesAmount - costAmount;
        const operatingProfit = grossProfit - expenseAmount;
        const netProfit = Math.round(operatingProfit * (0.9 + 0.1 * Math.random())); // 考虑税费等因素
        
        const grossMargin = grossProfit / salesAmount;
        const netMargin = netProfit / salesAmount;
        
        // 计算同比和环比增长（2023年数据无同比，2024年数据会有）
        const yearOnYearGrowth = 0; // 2023年无同比数据
        const sequentialGrowth = month > 1 ? (salesAmount - data[month - 2].salesAmount) / data[month - 2].salesAmount : 0;
        
        data.push({
          id: `2023-${monthStr}`,
          period: `2023年${month}月`,
          periodValue: `2023-${monthStr}`,
          year: 2023,
          month,
          quarter: season,
          salesAmount,
          costAmount,
          expenseAmount,
          grossProfit,
          operatingProfit,
          netProfit,
          grossMargin,
          netMargin,
          yearOnYearGrowth,
          sequentialGrowth,
          incomeDetails: generateIncomeDetails(salesAmount),
          expenseDetails: generateExpenseDetails(expenseAmount),
          costDetails: generateCostDetails(costAmount),
          cashFlow: {
            operatingCashFlow: netProfit + (costAmount - expenseAmount) * 0.5,
            investingCashFlow: -Math.random() * 100000,
            financingCashFlow: Math.random() * 50000,
            netCashFlow: 0 // 将在后面计算
          }
        });
      }
      
      // 生成2024年上半年数据
      for (let month = 1; month <= 6; month++) {
        const monthStr = String(month).padStart(2, '0');
        const season = Math.floor((month - 1) / 3) + 1;
        const seasonalFactor = 0.8 + 0.4 * Math.sin((month - 1) * Math.PI / 6);
        const randomFactor = 0.95 + 0.1 * Math.random();
        const growthFactor = 1.15 + 0.1 * Math.random(); // 比2023年增长15%-25%
        
        const lastYearSales = data[month - 1].salesAmount;
        const salesAmount = Math.round(lastYearSales * growthFactor * seasonalFactor * randomFactor);
        const costAmount = Math.round(salesAmount * (0.53 + 0.1 * Math.random())); // 成本率略有下降
        const expenseAmount = Math.round(salesAmount * 0.18 * seasonalFactor * randomFactor); // 费用率在18%左右
        const grossProfit = salesAmount - costAmount;
        const operatingProfit = grossProfit - expenseAmount;
        const netProfit = Math.round(operatingProfit * (0.92 + 0.08 * Math.random())); // 税率优化
        
        const grossMargin = grossProfit / salesAmount;
        const netMargin = netProfit / salesAmount;
        
        // 计算同比和环比增长
        const yearOnYearGrowth = (salesAmount - lastYearSales) / lastYearSales;
        const sequentialGrowth = month > 1 ? (salesAmount - data[data.length - 1].salesAmount) / data[data.length - 1].salesAmount : 0;
        
        data.push({
          id: `2024-${monthStr}`,
          period: `2024年${month}月`,
          periodValue: `2024-${monthStr}`,
          year: 2024,
          month,
          quarter: season,
          salesAmount,
          costAmount,
          expenseAmount,
          grossProfit,
          operatingProfit,
          netProfit,
          grossMargin,
          netMargin,
          yearOnYearGrowth,
          sequentialGrowth,
          incomeDetails: generateIncomeDetails(salesAmount),
          expenseDetails: generateExpenseDetails(expenseAmount),
          costDetails: generateCostDetails(costAmount),
          cashFlow: {
            operatingCashFlow: netProfit + (costAmount - expenseAmount) * 0.55,
            investingCashFlow: -Math.random() * 120000,
            financingCashFlow: Math.random() * 60000,
            netCashFlow: 0 // 将在后面计算
          }
        });
      }
      
      // 计算现金流净额
      data.forEach(item => {
        item.cashFlow.netCashFlow = item.cashFlow.operatingCashFlow + item.cashFlow.investingCashFlow + item.cashFlow.financingCashFlow;
      });
      
      // 按期间降序排序
      return data.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    };
    
    // 生成收入明细
    const generateIncomeDetails = (totalAmount) => {
      const categories = [
        { name: '产品销售', ratio: 0.65, minRatio: 0.6, maxRatio: 0.7 },
        { name: '服务收入', ratio: 0.25, minRatio: 0.2, maxRatio: 0.3 },
        { name: '配件销售', ratio: 0.07, minRatio: 0.05, maxRatio: 0.1 },
        { name: '其他收入', ratio: 0.03, minRatio: 0.02, maxRatio: 0.05 }
      ];
      
      let remainingAmount = totalAmount;
      return categories.map((category, index) => {
        const isLast = index === categories.length - 1;
        const variation = (Math.random() - 0.5) * 2 * (category.maxRatio - category.minRatio);
        const actualRatio = Math.max(category.minRatio, Math.min(category.maxRatio, category.ratio + variation));
        const amount = isLast ? remainingAmount : Math.round(totalAmount * actualRatio);
        const actualAmount = Math.min(amount, remainingAmount);
        remainingAmount -= actualAmount;
        
        return {
          category: category.name,
          amount: actualAmount,
          percentage: actualAmount / totalAmount,
          yoyChange: (Math.random() - 0.2) * 0.5, // 模拟同比变化
          remark: `${category.name}收入明细`
        };
      });
    };
    
    // 生成费用明细
    const generateExpenseDetails = (totalAmount) => {
      const categories = [
        { name: '销售费用', ratio: 0.4, minRatio: 0.35, maxRatio: 0.45 },
        { name: '管理费用', ratio: 0.3, minRatio: 0.25, maxRatio: 0.35 },
        { name: '研发费用', ratio: 0.2, minRatio: 0.15, maxRatio: 0.25 },
        { name: '财务费用', ratio: 0.05, minRatio: 0.03, maxRatio: 0.07 },
        { name: '其他费用', ratio: 0.05, minRatio: 0.02, maxRatio: 0.08 }
      ];
      
      let remainingAmount = totalAmount;
      return categories.map((category, index) => {
        const isLast = index === categories.length - 1;
        const variation = (Math.random() - 0.5) * 2 * (category.maxRatio - category.minRatio);
        const actualRatio = Math.max(category.minRatio, Math.min(category.maxRatio, category.ratio + variation));
        const amount = isLast ? remainingAmount : Math.round(totalAmount * actualRatio);
        const actualAmount = Math.min(amount, remainingAmount);
        remainingAmount -= actualAmount;
        
        return {
          category: category.name,
          amount: actualAmount,
          percentage: actualAmount / totalAmount,
          yoyChange: (Math.random() - 0.3) * 0.4, // 模拟同比变化
          remark: `${category.name}明细`
        };
      });
    };
    
    // 生成成本明细
    const generateCostDetails = (totalAmount) => {
      const categories = [
        { name: '直接材料', ratio: 0.45, minRatio: 0.4, maxRatio: 0.5 },
        { name: '直接人工', ratio: 0.3, minRatio: 0.25, maxRatio: 0.35 },
        { name: '制造费用', ratio: 0.15, minRatio: 0.1, maxRatio: 0.2 },
        { name: '其他成本', ratio: 0.1, minRatio: 0.05, maxRatio: 0.15 }
      ];
      
      let remainingAmount = totalAmount;
      return categories.map((category, index) => {
        const isLast = index === categories.length - 1;
        const variation = (Math.random() - 0.5) * 2 * (category.maxRatio - category.minRatio);
        const actualRatio = Math.max(category.minRatio, Math.min(category.maxRatio, category.ratio + variation));
        const amount = isLast ? remainingAmount : Math.round(totalAmount * actualRatio);
        const actualAmount = Math.min(amount, remainingAmount);
        remainingAmount -= actualAmount;
        
        return {
          category: category.name,
          amount: actualAmount,
          percentage: actualAmount / totalAmount,
          yoyChange: (Math.random() - 0.25) * 0.3, // 模拟同比变化
          remark: `${category.name}明细`
        };
      });
    };
    
    // 更新统计信息
    const updateStatistics = (data) => {
      if (data.length === 0) return;
      
      // 获取最新的数据项（假设是最近一个月）
      const latestData = data[0];
      
      // 计算累计数据（这里简化为最近6个月的累计）
      const recentData = data.slice(0, 6);
      const totalSales = recentData.reduce((sum, item) => sum + item.salesAmount, 0);
      const totalExpense = recentData.reduce((sum, item) => sum + item.expenseAmount, 0);
      const totalNetProfit = recentData.reduce((sum, item) => sum + item.netProfit, 0);
      
      const cards = templateRef.value?.statisticsCards || [];
      if (cards.length >= 6) {
        cards[0].value = formatCurrency(totalSales);
        cards[1].value = formatCurrency(totalExpense);
        cards[2].value = formatCurrency(totalNetProfit);
        cards[3].value = formatPercentage(totalNetProfit / totalSales);
        cards[4].value = formatPercentage(latestData.yearOnYearGrowth);
        cards[5].value = formatPercentage(latestData.sequentialGrowth);
      }
    };
    
    // 处理搜索
    const handleSearch = (searchParams) => {
      console.log('搜索参数:', searchParams);
      // 模拟搜索延迟
      templateRef.value.loading = true;
      setTimeout(() => {
        loadAnalysisData(); // 实际应用中应该根据搜索条件获取数据
        updateCharts();
        templateRef.value.loading = false;
      }, 500);
    };
    
    // 处理重置
    const handleReset = (resetParams) => {
      console.log('重置参数:', resetParams);
      loadAnalysisData();
      updateCharts();
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
      loadAnalysisData();
      
      // 等待DOM更新后初始化图表
      nextTick(() => {
        updateCharts();
      });
    };
    
    // 刷新数据
    const handleRefreshData = () => {
      templateRef.value.loading = true;
      setTimeout(() => {
        loadAnalysisData();
        updateCharts();
        templateRef.value.loading = false;
        ElMessage.success('数据刷新成功');
      }, 800);
    };
    
    // 导出分析
    const handleExportAnalysis = () => {
      ElMessage.info('导出分析功能待实现');
    };
    
    // 打印分析
    const handlePrintAnalysis = () => {
      ElMessage.info('打印分析功能待实现');
    };
    
    // 打开数据对比
    const handleOpenDataComparison = () => {
      // 默认选择最近的两个期间
      if (analysisData.value.length >= 2) {
        comparisonPeriod1.value = analysisData.value[0].periodValue;
        comparisonPeriod2.value = analysisData.value[1].periodValue;
      }
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'data-comparison');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 打开生成报告
    const handleOpenGenerateReport = () => {
      // 默认选择最近的期间
      if (analysisData.value.length > 0) {
        reportForm.period = analysisData.value[0].periodValue;
        reportForm.title = `${analysisData.value[0].period}财务分析报告`;
      }
      
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'generate-report');
      if (dialog) {
        dialog.visible = true;
      }
    };
    
    // 保存配置
    const handleSaveConfiguration = () => {
      ElMessage.success('配置保存成功');
    };
    
    // 查看详情
    const handleViewDetails = (row) => {
      // 复制分析数据
      Object.assign(currentAnalysisDetail, JSON.parse(JSON.stringify(row)));
      
      // 打开对话框
      const dialog = templateRef.value?.dialogs.find(d => d.key === 'view-details');
      if (dialog) {
        dialog.title = `${row.period}分析详情`;
        dialog.visible = true;
      }
      
      // 等待DOM更新后初始化详情图表
      nextTick(() => {
        initDetailChart();
      });
    };
    
    // 导出数据
    const handleExportData = (row) => {
      ElMessage.success(`已导出${row.period}的分析数据`);
    };
    
    // 对比数据
    const handleCompareData = (row) => {
      if (!comparisonPeriod1.value) {
        comparisonPeriod1.value = row.periodValue;
      } else if (!comparisonPeriod2.value && comparisonPeriod1.value !== row.periodValue) {
        comparisonPeriod2.value = row.periodValue;
        // 自动执行对比
        handleComparePeriods();
        
        // 打开对话框
        const dialog = templateRef.value?.dialogs.find(d => d.key === 'data-comparison');
        if (dialog) {
          dialog.visible = true;
        }
      } else {
        // 重置并选择当前项
        comparisonPeriod1.value = row.periodValue;
        comparisonPeriod2.value = '';
        comparisonResult.value = [];
        
        const dialog = templateRef.value?.dialogs.find(d => d.key === 'data-comparison');
        if (dialog) {
          dialog.visible = true;
        }
      }
    };
    
    // 导出对比结果
    const handleExportComparison = () => {
      ElMessage.success('对比结果导出成功');
    };
    
    // 对比期间数据
    const handleComparePeriods = () => {
      if (!comparisonPeriod1.value || !comparisonPeriod2.value) {
        ElMessage.warning('请选择需要对比的两个期间');
        return;
      }
      
      // 查找两个期间的数据
      const data1 = analysisData.value.find(item => item.periodValue === comparisonPeriod1.value);
      const data2 = analysisData.value.find(item => item.periodValue === comparisonPeriod2.value);
      
      if (!data1 || !data2) {
        ElMessage.warning('找不到所选期间的数据');
        return;
      }
      
      // 生成对比结果
      comparisonResult.value = generateComparisonResult(data1, data2);
      
      // 初始化对比图表
      nextTick(() => {
        initComparisonChart();
      });
    };
    
    // 生成对比结果
    const generateComparisonResult = (data1, data2) => {
      const indicators = [
        { key: 'salesAmount', name: '销售收入', isCurrency: true },
        { key: 'costAmount', name: '成本', isCurrency: true },
        { key: 'grossProfit', name: '毛利', isCurrency: true },
        { key: 'expenseAmount', name: '费用', isCurrency: true },
        { key: 'netProfit', name: '净利润', isCurrency: true },
        { key: 'grossMargin', name: '毛利率', isPercentage: true },
        { key: 'netMargin', name: '净利率', isPercentage: true },
        { key: 'yearOnYearGrowth', name: '同比增长率', isPercentage: true },
        { key: 'cashFlow.netCashFlow', name: '现金流量净额', isCurrency: true }
      ];
      
      return indicators.map((indicator, index) => {
        const value1 = getNestedValue(data1, indicator.key);
        const value2 = getNestedValue(data2, indicator.key);
        const difference = value1 - value2;
        const changeRate = value2 !== 0 ? difference / value2 : 0;
        
        return {
          index: index + 1,
          indicator: indicator.name,
          period1: value1,
          period2: value2,
          difference,
          changeRate,
          isCurrency: indicator.isCurrency,
          isPercentage: indicator.isPercentage
        };
      });
    };
    
    // 获取嵌套对象的值
    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : 0;
      }, obj);
    };
    
    // 生成分析报告
    const handleGenerateReport = () => {
      reportFormRef.value?.validate((valid) => {
        if (valid) {
          // 模拟报告生成过程
          reportGenerationProgress.value = 0;
          reportGenerationMessage.value = '开始生成报告...';
          
          const progressSteps = [20, 45, 70, 90, 100];
          const progressMessages = [
            '收集数据中...',
            '分析数据中...',
            '生成图表中...',
            '汇总报告中...',
            '报告生成完成！'
          ];
          
          let step = 0;
          const timer = setInterval(() => {
            if (step < progressSteps.length) {
              reportGenerationProgress.value = progressSteps[step];
              reportGenerationMessage.value = progressMessages[step];
              step++;
            } else {
              clearInterval(timer);
              setTimeout(() => {
                ElMessage.success('报告生成成功，可以下载了！');
                // 重置进度
                reportGenerationProgress.value = 0;
                reportGenerationMessage.value = '';
              }, 1000);
            }
          }, 800);
        }
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
        case 'salesChart':
          initSalesChart();
          break;
        case 'expenseChart':
          initExpenseChart();
          break;
        case 'profitChart':
          initProfitChart();
          break;
        case 'cashFlowChart':
          initCashFlowChart();
          break;
        case 'categoryChart':
          initCategoryChart();
          break;
      }
    };
    
    // 初始化销售额趋势图表
    const initSalesChart = () => {
      if (!salesChartRef.value) return;
      
      // 获取最近12个月的数据
      const chartData = analysisData.value.slice(0, 12).reverse();
      
      const config = {
        type: 'line',
        data: {
          labels: chartData.map(item => item.period),
          datasets: [
            {
              label: '销售额',
              data: chartData.map(item => item.salesAmount),
              borderColor: '#67c23a',
              backgroundColor: 'rgba(103, 194, 58, 0.1)',
              tension: 0.4
            },
            {
              label: '成本',
              data: chartData.map(item => item.costAmount),
              borderColor: '#e6a23c',
              backgroundColor: 'rgba(230, 162, 60, 0.1)',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '最近12个月销售额与成本趋势'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
              }
            }
          }
        }
      };
      
      chartInstances.salesChart = new MockChart(salesChartRef.value, config);
    };
    
    // 初始化费用分析图表
    const initExpenseChart = () => {
      if (!expenseChartRef.value) return;
      
      // 获取最近6个月的数据
      const chartData = analysisData.value.slice(0, 6).reverse();
      
      const config = {
        type: 'bar',
        data: {
          labels: chartData.map(item => item.period),
          datasets: [
            {
              label: '销售费用',
              data: chartData.map(item => item.expenseDetails.find(d => d.category === '销售费用')?.amount || 0),
              backgroundColor: '#67c23a'
            },
            {
              label: '管理费用',
              data: chartData.map(item => item.expenseDetails.find(d => d.category === '管理费用')?.amount || 0),
              backgroundColor: '#e6a23c'
            },
            {
              label: '研发费用',
              data: chartData.map(item => item.expenseDetails.find(d => d.category === '研发费用')?.amount || 0),
              backgroundColor: '#f56c6c'
            },
            {
              label: '财务费用',
              data: chartData.map(item => item.expenseDetails.find(d => d.category === '财务费用')?.amount || 0),
              backgroundColor: '#409eff'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '最近6个月费用结构分析'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
              }
            }
          }
        }
      };
      
      chartInstances.expenseChart = new MockChart(expenseChartRef.value, config);
    };
    
    // 初始化利润分析图表
    const initProfitChart = () => {
      if (!profitChartRef.value) return;
      
      // 获取最近12个月的数据
      const chartData = analysisData.value.slice(0, 12).reverse();
      
      const config = {
        type: 'line',
        data: {
          labels: chartData.map(item => item.period),
          datasets: [
            {
              label: '净利润',
              data: chartData.map(item => item.netProfit),
              borderColor: '#67c23a',
              backgroundColor: 'rgba(103, 194, 58, 0.1)',
              tension: 0.4,
              yAxisID: 'y'
            },
            {
              label: '净利率',
              data: chartData.map(item => item.netMargin * 100),
              borderColor: '#409eff',
              backgroundColor: 'rgba(64, 158, 255, 0.1)',
              tension: 0.4,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            title: {
              display: true,
              text: '最近12个月净利润与净利率趋势'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  if (context.datasetIndex === 0) {
                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                  }
                  return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                }
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left'
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              }
            }
          }
        }
      };
      
      chartInstances.profitChart = new MockChart(profitChartRef.value, config);
    };
    
    // 初始化现金流分析图表
    const initCashFlowChart = () => {
      if (!cashFlowChartRef.value) return;
      
      // 获取最近6个月的数据
      const chartData = analysisData.value.slice(0, 6).reverse();
      
      const config = {
        type: 'bar',
        data: {
          labels: chartData.map(item => item.period),
          datasets: [
            {
              label: '经营活动现金流',
              data: chartData.map(item => item.cashFlow.operatingCashFlow),
              backgroundColor: '#67c23a'
            },
            {
              label: '投资活动现金流',
              data: chartData.map(item => item.cashFlow.investingCashFlow),
              backgroundColor: '#e6a23c'
            },
            {
              label: '筹资活动现金流',
              data: chartData.map(item => item.cashFlow.financingCashFlow),
              backgroundColor: '#409eff'
            },
            {
              label: '净现金流',
              data: chartData.map(item => item.cashFlow.netCashFlow),
              backgroundColor: '#f56c6c',
              type: 'line',
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '最近6个月现金流分析'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
              }
            }
          }
        }
      };
      
      chartInstances.cashFlowChart = new MockChart(cashFlowChartRef.value, config);
    };
    
    // 初始化分类占比图表
    const initCategoryChart = () => {
      if (!categoryChartRef.value) return;
      
      // 使用最新期间的数据
      const latestData = analysisData.value[0];
      if (!latestData) return;
      
      const config = {
        type: 'doughnut',
        data: {
          labels: latestData.incomeDetails.map(item => item.category),
          datasets: [
            {
              data: latestData.incomeDetails.map(item => item.amount),
              backgroundColor: [
                '#409eff',
                '#67c23a',
                '#e6a23c',
                '#f56c6c'
              ]
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `${latestData.period}收入结构占比`
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const value = formatCurrency(context.parsed);
                  const percentage = ((context.parsed / latestData.salesAmount) * 100).toFixed(2);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      };
      
      chartInstances.categoryChart = new MockChart(categoryChartRef.value, config);
    };
    
    // 初始化详情图表
    const initDetailChart = () => {
      if (!detailChartRef.value || !currentAnalysisDetail.period) return;
      
      // 获取同比数据
      const currentYear = parseInt(currentAnalysisDetail.periodValue.substring(0, 4));
      const currentMonth = currentAnalysisDetail.periodValue.substring(5, 7);
      const lastYearPeriod = `${currentYear - 1}-${currentMonth}`;
      const lastYearData = analysisData.value.find(item => item.periodValue === lastYearPeriod);
      
      // 准备图表数据
      const labels = ['销售收入', '成本', '费用', '净利润'];
      const currentValues = [
        currentAnalysisDetail.salesAmount,
        currentAnalysisDetail.costAmount,
        currentAnalysisDetail.expenseAmount,
        currentAnalysisDetail.netProfit
      ];
      const lastYearValues = lastYearData ? [
        lastYearData.salesAmount,
        lastYearData.costAmount,
        lastYearData.expenseAmount,
        lastYearData.netProfit
      ] : [0, 0, 0, 0];
      
      const config = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: currentAnalysisDetail.period,
              data: currentValues,
              backgroundColor: '#409eff'
            },
            {
              label: lastYearPeriod ? `${currentYear - 1}年${currentMonth}月` : '去年同期',
              data: lastYearValues,
              backgroundColor: '#67c23a'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '本期与去年同期对比'
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
              }
            }
          }
        }
      };
      
      // 销毁现有图表
      if (chartInstances.detailChart) {
        chartInstances.detailChart.destroy();
      }
      
      chartInstances.detailChart = new MockChart(detailChartRef.value, config);
    };
    
    // 初始化对比图表
    const initComparisonChart = () => {
      if (!comparisonChartRef.value || comparisonResult.value.length === 0) return;
      
      // 筛选需要显示的指标
      const displayIndicators = comparisonResult.value.filter(item => 
        ['销售收入', '净利润', '毛利率', '净利率'].includes(item.indicator)
      );
      
      // 准备图表数据
      const labels = displayIndicators.map(item => item.indicator);
      let period1Values, period2Values;
      
      if (displayIndicators[0]?.isPercentage) {
        // 百分比数据
        period1Values = displayIndicators.map(item => item.period1 * 100);
        period2Values = displayIndicators.map(item => item.period2 * 100);
      } else {
        // 金额数据
        period1Values = displayIndicators.map(item => item.period1);
        period2Values = displayIndicators.map(item => item.period2);
      }
      
      const config = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: getPeriodLabel(comparisonPeriod1.value),
              data: period1Values,
              backgroundColor: '#409eff'
            },
            {
              label: getPeriodLabel(comparisonPeriod2.value),
              data: period2Values,
              backgroundColor: '#67c23a'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: '期间对比分析'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const item = displayIndicators[context.dataIndex];
                  if (item?.isPercentage) {
                    return `${context.dataset.label}: ${context.parsed.y.toFixed(2)}%`;
                  }
                  return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          }
        }
      };
      
      // 销毁现有图表
      if (chartInstances.comparisonChart) {
        chartInstances.comparisonChart.destroy();
      }
      
      chartInstances.comparisonChart = new MockChart(comparisonChartRef.value, config);
    };
    
    // 获取期间标签
    const getPeriodLabel = (periodValue) => {
      const option = periodOptions.value.find(opt => opt.value === periodValue);
      return option ? option.label : periodValue;
    };
    
    // 格式化对比值
    const formatComparisonValue = (row, column, cellValue, index) => {
      const item = comparisonResult.value.find(i => i.index === index + 1);
      if (item?.isPercentage) {
        return formatPercentage(cellValue);
      } else if (item?.isCurrency) {
        return formatCurrency(cellValue);
      }
      return cellValue;
    };
    
    // 格式化差值
    const formatDifference = (row, column, cellValue, index) => {
      const item = comparisonResult.value.find(i => i.index === index + 1);
      if (item?.isPercentage) {
        return formatPercentage(cellValue);
      } else if (item?.isCurrency) {
        const formatted = formatCurrency(cellValue);
        return cellValue > 0 ? `+${formatted}` : formatted;
      }
      return cellValue;
    };
    
    // 格式化变化率
    const formatChangeRate = (row, column, cellValue, index) => {
      const percentage = (cellValue * 100).toFixed(2);
      return cellValue > 0 ? `+${percentage}%` : `${percentage}%`;
    };
    
    // 格式化金额
    const formatCurrency = (value) => {
      if (typeof value !== 'number' || isNaN(value)) return '0.00 元';
      return `${value.toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} 元`;
    };
    
    // 格式化百分比
    const formatPercentage = (value) => {
      if (typeof value !== 'number' || isNaN(value)) return '0.00%';
      return `${(value * 100).toFixed(2)}%`;
    };
    
    // 窗口大小变化处理
    const handleResize = () => {
      nextTick(() => {
        updateCharts();
      });
    };
    
    // 组件销毁前清理
    onBeforeUnmount(() => {
      window.removeEventListener('resize', handleResize);
      Object.values(chartInstances).forEach(instance => {
        if (instance) {
          instance.destroy();
        }
      });
    });
    
    // 监听窗口大小变化
    onMounted(() => {
      window.addEventListener('resize', handleResize);
    });
    
    // 监听详情标签页切换
    watch(detailTab, () => {
      if (detailTab.value === '3') { // 趋势图标签页
        nextTick(() => {
          initDetailChart();
        });
      }
    });
    
    return {
      templateRef,
      reportFormRef,
      activeChartTab,
      chartWidth,
      chartHeight,
      salesChartRef,
      expenseChartRef,
      profitChartRef,
      cashFlowChartRef,
      categoryChartRef,
      detailChartRef,
      comparisonChartRef,
      currentAnalysisDetail,
      detailTab,
      comparisonPeriod1,
      comparisonPeriod2,
      comparisonResult,
      reportForm,
      reportFormRules,
      periodOptions,
      reportGenerationProgress,
      reportGenerationStatus,
      reportGenerationMessage,
      handleSearch,
      handleReset,
      handlePageChange,
      handleMounted,
      handleRefreshData,
      handleExportAnalysis,
      handlePrintAnalysis,
      handleOpenDataComparison,
      handleOpenGenerateReport,
      handleSaveConfiguration,
      handleViewDetails,
      handleExportData,
      handleCompareData,
      handleExportComparison,
      handleComparePeriods,
      handleGenerateReport,
      handleChartTabChange,
      formatCurrency,
      formatPercentage,
      formatComparisonValue,
      formatDifference,
      formatChangeRate,
      getPeriodLabel
    };
  }
};
</script>

<style scoped>
.analysis-details {
  padding: 20px;
}

.analysis-details h3 {
  margin-bottom: 20px;
  color: #303133;
}

.analysis-details h4 {
  margin-top: 30px;
  margin-bottom: 15px;
  color: #606266;
}

.detail-chart-container {
  margin-top: 20px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.comparison-container {
  padding: 20px;
}

.comparison-controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.comparison-result {
  margin-top: 20px;
}

.comparison-chart-container {
  margin-top: 30px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.report-generation {
  padding: 20px;
}

.progress-section {
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.progress-section h4 {
  margin-bottom: 10px;
  color: #606266;
}

.progress-text {
  margin-top: 10px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.chart-container {
  margin: 0 auto;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .chart-container {
    width: 100% !important;
  }
  
  .comparison-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .comparison-controls .el-select,
  .comparison-controls .el-button {
    margin: 5px 0;
    width: 100%;
  }
}
</style>