<template>
  <div class="finance-overview">
    <div class="header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>财务管理</el-breadcrumb-item>
        <el-breadcrumb-item>财务概览</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
        <el-button @click="exportReport">导出报表</el-button>
      </div>
    </div>

    <!-- 财务关键指标 -->
    <div class="key-metrics">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="metric-card primary">
            <div class="metric-content">
              <div class="metric-label">应收账款</div>
              <div class="metric-value">{{ formatCurrency(accountsReceivable) }}</div>
              <div class="metric-change" :class="{ positive: arChange > 0, negative: arChange < 0 }">
                <span>{{ arChange > 0 ? '+' : '' }}{{ arChange }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="metric-card success">
            <div class="metric-content">
              <div class="metric-label">应付账款</div>
              <div class="metric-value">{{ formatCurrency(accountsPayable) }}</div>
              <div class="metric-change" :class="{ positive: apChange > 0, negative: apChange < 0 }">
                <span>{{ apChange > 0 ? '+' : '' }}{{ apChange }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="metric-card warning">
            <div class="metric-content">
              <div class="metric-label">本月收入</div>
              <div class="metric-value">{{ formatCurrency(currentMonthRevenue) }}</div>
              <div class="metric-change" :class="{ positive: revenueChange > 0, negative: revenueChange < 0 }">
                <span>{{ revenueChange > 0 ? '+' : '' }}{{ revenueChange }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="metric-card info">
            <div class="metric-content">
              <div class="metric-label">本月支出</div>
              <div class="metric-value">{{ formatCurrency(currentMonthExpense) }}</div>
              <div class="metric-change" :class="{ positive: expenseChange > 0, negative: expenseChange < 0 }">
                <span>{{ expenseChange > 0 ? '+' : '' }}{{ expenseChange }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="metric-card danger">
            <div class="metric-content">
              <div class="metric-label">可用资金</div>
              <div class="metric-value">{{ formatCurrency(availableFunds) }}</div>
              <div class="metric-change" :class="{ positive: fundsChange > 0, negative: fundsChange < 0 }">
                <span>{{ fundsChange > 0 ? '+' : '' }}{{ fundsChange }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="metric-card primary">
            <div class="metric-content">
              <div class="metric-label">本月净利润</div>
              <div class="metric-value">{{ formatCurrency(netProfit) }}</div>
              <div class="metric-change" :class="{ positive: profitChange > 0, negative: profitChange < 0 }">
                <span>{{ profitChange > 0 ? '+' : '' }}{{ profitChange }}%</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 财务图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 收支趋势图 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>收支趋势</span>
                <el-select v-model="trendChartPeriod" placeholder="选择周期" style="width: 120px;">
                  <el-option label="近6个月" value="6months" />
                  <el-option label="近12个月" value="12months" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <canvas id="trendChart" ref="trendChartRef"></canvas>
            </div>
          </el-card>
        </el-col>
        <!-- 应收账款分布 -->
        <el-col :span="12">
          <el-card class="chart-card">
            <template #header>
              <div class="chart-header">
                <span>应收账款分布</span>
                <el-select v-model="arChartType" placeholder="图表类型" style="width: 120px;">
                  <el-option label="饼图" value="pie" />
                  <el-option label="柱状图" value="bar" />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <canvas id="arChart" ref="arChartRef"></canvas>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 待办事项 -->
    <div class="todo-section">
      <el-card class="todo-card">
        <template #header>
          <div class="todo-header">
            <span>财务待办</span>
            <el-button type="text" @click="viewAllTodos">查看全部</el-button>
          </div>
        </template>
        <el-table
          :data="todoItems.slice(0, 5)"
          style="width: 100%"
          @row-click="handleTodoClick"
        >
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getTodoTypeTag(row.type)">{{ getTodoTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" :show-overflow-tooltip="true" />
          <el-table-column prop="deadline" label="截止日期" width="130">
            <template #default="{ row }">
              <span :class="{ 'overdue': row.overdue }">
                {{ formatDate(row.deadline) }}
                <span v-if="row.overdue" style="color: #f56c6c;">(已逾期)</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="getPriorityTag(row.priority)">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="text" size="small" @click.stop="completeTodo(row)">完成</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 最近交易 -->
    <div class="recent-transactions">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card class="transaction-card">
            <template #header>
              <div class="transaction-header">
                <span>最近收款</span>
                <el-button type="text" @click="navigateTo('CollectionManagement')">查看全部</el-button>
              </div>
            </template>
            <el-table
              :data="recentCollections.slice(0, 5)"
              style="width: 100%"
              @row-click="handleTransactionClick"
            >
              <el-table-column prop="transactionDate" label="日期" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.transactionDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="customerName" label="客户" :show-overflow-tooltip="true" />
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="{ row }">
                  <span style="color: #67c23a;">{{ formatCurrency(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="transaction-card">
            <template #header>
              <div class="transaction-header">
                <span>最近付款</span>
                <el-button type="text" @click="navigateTo('PaymentApplication')">查看全部</el-button>
              </div>
            </template>
            <el-table
              :data="recentPayments.slice(0, 5)"
              style="width: 100%"
              @row-click="handleTransactionClick"
            >
              <el-table-column prop="transactionDate" label="日期" width="120">
                <template #default="{ row }">
                  {{ formatDate(row.transactionDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="vendorName" label="供应商" :show-overflow-tooltip="true" />
              <el-table-column prop="amount" label="金额" width="120" align="right">
                <template #default="{ row }">
                  <span style="color: #f56c6c;">{{ formatCurrency(row.amount) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTag(row.status)">{{ getStatusText(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 财务预警 -->
    <div class="alert-section">
      <el-card class="alert-card" v-if="alertItems.length > 0">
        <template #header>
          <div class="alert-header">
            <span>财务预警</span>
            <el-button type="text" @click="dismissAllAlerts">全部忽略</el-button>
          </div>
        </template>
        <div class="alert-list">
          <el-alert
            v-for="alert in alertItems"
            :key="alert.id"
            :title="alert.title"
            :description="alert.description"
            :type="alert.type"
            show-icon
            :closable="true"
            @close="dismissAlert(alert.id)"
            :class="{ 'alert-item': true }"
          >
            <template #action>
              <el-button type="text" size="small" @click="handleAlertAction(alert)">
                {{ alert.actionText }}
              </el-button>
            </template>
          </el-alert>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

export default {
  name: 'FinanceOverview',
  setup() {
    // 状态管理
    const loading = ref(false);
    const trendChartPeriod = ref('6months');
    const arChartType = ref('pie');
    const trendChartRef = ref(null);
    const arChartRef = ref(null);
    let trendChart = null;
    let arChart = null;

    // 财务数据
    const accountsReceivable = ref(1250000.00);
    const accountsPayable = ref(850000.00);
    const currentMonthRevenue = ref(520000.00);
    const currentMonthExpense = ref(380000.00);
    const availableFunds = ref(1560000.00);
    const netProfit = ref(140000.00);

    // 变化率
    const arChange = ref(12.5);
    const apChange = ref(-8.2);
    const revenueChange = ref(15.3);
    const expenseChange = ref(5.7);
    const fundsChange = ref(22.1);
    const profitChange = ref(25.8);

    // 待办事项
    const todoItems = ref([
      {
        id: 1,
        type: 'payment',
        title: '支付供应商A的季度服务费',
        deadline: new Date(Date.now() + 86400000 * 3),
        priority: 'high',
        overdue: false,
        link: '/finance/PaymentApplication'
      },
      {
        id: 2,
        type: 'approval',
        title: '审批张三的差旅费报销申请',
        deadline: new Date(Date.now() - 86400000),
        priority: 'medium',
        overdue: true,
        link: '/finance/PaymentApplication'
      },
      {
        id: 3,
        type: 'collection',
        title: '跟进客户B的逾期账款',
        deadline: new Date(Date.now() - 86400000 * 5),
        priority: 'high',
        overdue: true,
        link: '/finance/PaymentFollowUp'
      },
      {
        id: 4,
        type: 'invoice',
        title: '给客户C开具增值税专用发票',
        deadline: new Date(Date.now() + 86400000 * 2),
        priority: 'medium',
        overdue: false,
        link: '/finance/InvoiceManagement'
      },
      {
        id: 5,
        type: 'report',
        title: '编制月度财务报表',
        deadline: new Date(Date.now() + 86400000 * 10),
        priority: 'low',
        overdue: false,
        link: '/finance/reports'
      },
      {
        id: 6,
        type: 'tax',
        title: '申报增值税和附加税',
        deadline: new Date(Date.now() + 86400000 * 7),
        priority: 'high',
        overdue: false,
        link: '/finance/tax'
      }
    ]);

    // 最近收款
    const recentCollections = ref([
      {
        id: 101,
        transactionDate: new Date(Date.now() - 86400000 * 2),
        customerName: '北京科技有限公司',
        amount: 150000.00,
        status: 'completed',
        orderNumber: 'ORD-202401001'
      },
      {
        id: 102,
        transactionDate: new Date(Date.now() - 86400000 * 5),
        customerName: '上海网络科技公司',
        amount: 85000.00,
        status: 'completed',
        orderNumber: 'ORD-202401002'
      },
      {
        id: 103,
        transactionDate: new Date(Date.now() - 86400000 * 8),
        customerName: '广州贸易有限公司',
        amount: 220000.00,
        status: 'completed',
        orderNumber: 'ORD-202401003'
      },
      {
        id: 104,
        transactionDate: new Date(Date.now() - 86400000 * 12),
        customerName: '深圳电子有限公司',
        amount: 95000.00,
        status: 'processing',
        orderNumber: 'ORD-202401004'
      },
      {
        id: 105,
        transactionDate: new Date(Date.now() - 86400000 * 15),
        customerName: '成都软件科技有限公司',
        amount: 130000.00,
        status: 'completed',
        orderNumber: 'ORD-202401005'
      },
      {
        id: 106,
        transactionDate: new Date(Date.now() - 86400000 * 18),
        customerName: '杭州信息技术有限公司',
        amount: 75000.00,
        status: 'completed',
        orderNumber: 'ORD-202401006'
      }
    ]);

    // 最近付款
    const recentPayments = ref([
      {
        id: 201,
        transactionDate: new Date(Date.now() - 86400000),
        vendorName: '北京电子元件供应商',
        amount: 65000.00,
        status: 'completed',
        paymentNumber: 'PAY-202401001'
      },
      {
        id: 202,
        transactionDate: new Date(Date.now() - 86400000 * 4),
        vendorName: '上海物流公司',
        amount: 32000.00,
        status: 'completed',
        paymentNumber: 'PAY-202401002'
      },
      {
        id: 203,
        transactionDate: new Date(Date.now() - 86400000 * 7),
        vendorName: '广州办公设备供应商',
        amount: 48000.00,
        status: 'completed',
        paymentNumber: 'PAY-202401003'
      },
      {
        id: 204,
        transactionDate: new Date(Date.now() - 86400000 * 10),
        vendorName: '深圳技术服务公司',
        amount: 95000.00,
        status: 'processing',
        paymentNumber: 'PAY-202401004'
      },
      {
        id: 205,
        transactionDate: new Date(Date.now() - 86400000 * 14),
        vendorName: '成都软件开发公司',
        amount: 120000.00,
        status: 'completed',
        paymentNumber: 'PAY-202401005'
      },
      {
        id: 206,
        transactionDate: new Date(Date.now() - 86400000 * 20),
        vendorName: '办公用品供应商',
        amount: 15000.00,
        status: 'completed',
        paymentNumber: 'PAY-202401006'
      }
    ]);

    // 财务预警
    const alertItems = ref([
      {
        id: 301,
        type: 'warning',
        title: '多笔款项即将到期',
        description: '有3笔付款申请将在3天内到期，请注意安排资金。',
        actionText: '查看详情',
        link: '/finance/PaymentApplication'
      },
      {
        id: 302,
        type: 'danger',
        title: '客户账款逾期',
        description: '客户B的账款已逾期15天，金额50万元，请尽快跟进。',
        actionText: '立即跟进',
        link: '/finance/PaymentFollowUp'
      },
      {
        id: 303,
        type: 'info',
        title: '税务申报提醒',
        description: '本月增值税申报截止日期为15日，请提前准备申报材料。',
        actionText: '查看日程',
        link: '/finance/tax'
      }
    ]);

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

    // 获取待办类型标签
    const getTodoTypeTag = (type) => {
      switch (type) {
        case 'payment': return 'primary';
        case 'approval': return 'success';
        case 'collection': return 'warning';
        case 'invoice': return 'info';
        case 'report': return 'info';
        case 'tax': return 'danger';
        default: return 'info';
      }
    };

    // 获取待办类型文本
    const getTodoTypeText = (type) => {
      switch (type) {
        case 'payment': return '付款';
        case 'approval': return '审批';
        case 'collection': return '收款';
        case 'invoice': return '发票';
        case 'report': return '报表';
        case 'tax': return '税务';
        default: return '其他';
      }
    };

    // 获取优先级标签
    const getPriorityTag = (priority) => {
      switch (priority) {
        case 'high': return 'danger';
        case 'medium': return 'warning';
        case 'low': return 'success';
        default: return 'info';
      }
    };

    // 获取优先级文本
    const getPriorityText = (priority) => {
      switch (priority) {
        case 'high': return '高';
        case 'medium': return '中';
        case 'low': return '低';
        default: return '普通';
      }
    };

    // 获取状态标签
    const getStatusTag = (status) => {
      switch (status) {
        case 'completed': return 'success';
        case 'processing': return 'primary';
        case 'pending': return 'warning';
        case 'failed': return 'danger';
        default: return 'info';
      }
    };

    // 获取状态文本
    const getStatusText = (status) => {
      switch (status) {
        case 'completed': return '已完成';
        case 'processing': return '处理中';
        case 'pending': return '待处理';
        case 'failed': return '失败';
        default: return '未知';
      }
    };

    // 初始化图表
    const initCharts = async () => {
      await nextTick();
      
      // 确保Chart.js已加载
      if (!window.Chart) {
        console.error('Chart.js is not loaded');
        return;
      }

      // 销毁现有图表
      if (trendChart) trendChart.destroy();
      if (arChart) arChart.destroy();

      // 初始化收支趋势图
      const trendCtx = document.getElementById('trendChart');
      if (trendCtx) {
        const months = trendChartPeriod.value === '6months' ? 
          ['6月前', '5月前', '4月前', '3月前', '2月前', '1月前', '本月'] :
          Array.from({length: 12}, (_, i) => `${12 - i}月前`).concat(['本月']);
          
        trendChart = new window.Chart(trendCtx, {
          type: 'line',
          data: {
            labels: months,
            datasets: [
              {
                label: '收入',
                data: trendChartPeriod.value === '6months' ? 
                  [350000, 420000, 380000, 450000, 480000, 500000, 520000] :
                  [280000, 310000, 330000, 350000, 380000, 400000, 420000, 450000, 430000, 480000, 500000, 510000, 520000],
                borderColor: '#67c23a',
                backgroundColor: 'rgba(103, 194, 58, 0.1)',
                fill: true,
                tension: 0.4
              },
              {
                label: '支出',
                data: trendChartPeriod.value === '6months' ? 
                  [280000, 320000, 290000, 340000, 360000, 370000, 380000] :
                  [220000, 250000, 260000, 280000, 290000, 310000, 320000, 340000, 330000, 360000, 370000, 375000, 380000],
                borderColor: '#f56c6c',
                backgroundColor: 'rgba(245, 108, 108, 0.1)',
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value.toLocaleString() + ' 元';
                  }
                }
              }
            }
          }
        });
      }

      // 初始化应收账款分布图
      const arCtx = document.getElementById('arChart');
      if (arCtx) {
        const labels = ['0-30天', '31-60天', '61-90天', '91-120天', '120天以上'];
        const data = [550000, 320000, 200000, 100000, 80000];
        const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399'];

        arChart = new window.Chart(arCtx, {
          type: arChartType.value,
          data: {
            labels: labels,
            datasets: [{
              label: '应收账款金额',
              data: data,
              backgroundColor: colors,
              borderColor: arChartType.value === 'pie' ? colors : '#ffffff',
              borderWidth: arChartType.value === 'pie' ? 0 : 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: arChartType.value === 'pie' ? 'right' : 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${context.label}: ${value.toLocaleString()} 元 (${percentage}%)`;
                  }
                }
              }
            },
            scales: arChartType.value === 'bar' ? {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return value.toLocaleString() + ' 元';
                  }
                }
              }
            } : undefined
          }
        });
      }
    };

    // 刷新图表
    const refreshCharts = () => {
      initCharts();
    };

    // 刷新数据
    const refreshData = () => {
      loading.value = true;
      // 模拟API调用
      setTimeout(() => {
        // 更新模拟数据
        accountsReceivable.value = 1250000.00 + Math.random() * 100000 - 50000;
        accountsPayable.value = 850000.00 + Math.random() * 100000 - 50000;
        currentMonthRevenue.value = 520000.00 + Math.random() * 50000 - 25000;
        currentMonthExpense.value = 380000.00 + Math.random() * 50000 - 25000;
        availableFunds.value = 1560000.00 + Math.random() * 200000 - 100000;
        netProfit.value = currentMonthRevenue.value - currentMonthExpense.value;
        
        ElMessage.success('数据已刷新');
        refreshCharts();
        loading.value = false;
      }, 500);
    };

    // 导出报表
    const exportReport = () => {
      ElMessageBox.confirm('请选择导出格式', '导出财务报表', {
        confirmButtonText: 'PDF',
        cancelButtonText: 'Excel',
        type: 'info'
      }).then(() => {
        ElMessage.success('PDF报表导出中...');
      }).catch(() => {
        ElMessage.success('Excel报表导出中...');
      });
    };

    // 导航到指定页面
    const navigateTo = (page) => {
      ElMessage.info(`导航到${page}页面`);
      // 实际项目中这里应该使用路由跳转
      // this.$router.push(`/finance/${page}`);
    };

    // 查看全部待办
    const viewAllTodos = () => {
      ElMessage.info('查看全部待办事项');
    };

    // 处理待办点击
    const handleTodoClick = (row) => {
      ElMessage.info(`查看待办：${row.title}`);
    };

    // 完成待办
    const completeTodo = (row) => {
      ElMessageBox.confirm(`确定要标记"${row.title}"为已完成吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        todoItems.value = todoItems.value.filter(item => item.id !== row.id);
        ElMessage.success('待办已标记为完成');
      }).catch(() => {});
    };

    // 处理交易点击
    const handleTransactionClick = (row) => {
      ElMessage.info(`查看交易详情：${row.customerName || row.vendorName}`);
    };

    // 忽略预警
    const dismissAlert = (id) => {
      alertItems.value = alertItems.value.filter(item => item.id !== id);
      ElMessage.success('预警已忽略');
    };

    // 忽略所有预警
    const dismissAllAlerts = () => {
      ElMessageBox.confirm('确定要忽略所有预警吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        alertItems.value = [];
        ElMessage.success('所有预警已忽略');
      }).catch(() => {});
    };

    // 处理预警操作
    const handleAlertAction = (alert) => {
      ElMessage.info(`执行操作：${alert.actionText}`);
    };

    // 监听图表类型变化
    const watchChartChanges = () => {
      window.addEventListener('resize', refreshCharts);
    };

    // 生命周期
    onMounted(() => {
      // 模拟加载数据
      setTimeout(() => {
        initCharts();
        watchChartChanges();
      }, 300);
    });

    return {
      loading,
      trendChartPeriod,
      arChartType,
      trendChartRef,
      arChartRef,
      accountsReceivable,
      accountsPayable,
      currentMonthRevenue,
      currentMonthExpense,
      availableFunds,
      netProfit,
      arChange,
      apChange,
      revenueChange,
      expenseChange,
      fundsChange,
      profitChange,
      todoItems,
      recentCollections,
      recentPayments,
      alertItems,
      formatDate,
      formatCurrency,
      getTodoTypeTag,
      getTodoTypeText,
      getPriorityTag,
      getPriorityText,
      getStatusTag,
      getStatusText,
      refreshData,
      exportReport,
      navigateTo,
      viewAllTodos,
      handleTodoClick,
      completeTodo,
      handleTransactionClick,
      dismissAlert,
      dismissAllAlerts,
      handleAlertAction
    };
  }
};
</script>

<style scoped>
.finance-overview {
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

.header-actions {
  display: flex;
  gap: 10px;
}

/* 关键指标样式 */
.key-metrics {
  margin-bottom: 20px;
}

.metric-card {
  transition: transform 0.3s ease;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-card.primary {
  border-left: 4px solid #409eff;
}

.metric-card.success {
  border-left: 4px solid #67c23a;
}

.metric-card.warning {
  border-left: 4px solid #e6a23c;
}

.metric-card.danger {
  border-left: 4px solid #f56c6c;
}

.metric-card.info {
  border-left: 4px solid #909399;
}

.metric-content {
  text-align: center;
  padding: 20px 0;
}

.metric-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #303133;
}

.metric-change {
  font-size: 12px;
}

.metric-change.positive {
  color: #f56c6c;
}

.metric-change.negative {
  color: #67c23a;
}

/* 图表样式 */
.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  flex: 1;
  position: relative;
  height: calc(100% - 60px);
}

/* 待办样式 */
.todo-section {
  margin-bottom: 20px;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 交易样式 */
.recent-transactions {
  margin-bottom: 20px;
}

.transaction-card {
  height: 350px;
  display: flex;
  flex-direction: column;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 预警样式 */
.alert-section {
  margin-bottom: 20px;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-item {
  margin-bottom: 10px;
}

.overdue {
  color: #f56c6c;
  font-weight: bold;
}
</style>