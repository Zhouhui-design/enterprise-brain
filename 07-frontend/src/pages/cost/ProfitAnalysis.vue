<template>
  <div class="profit-analysis-container">
    <div class="header">
      <h2>盈利分析</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="filters">
          <el-select
            v-model="selectedProductId"
            placeholder="选择产品/服务"
            class="filter-select"
          >
            <el-option label="全部产品" value="" />
            <el-option v-for="product in products" :key="product.id" :label="product.name" :value="product.id" />
          </el-select>
          <el-select
            v-model="selectedDepartmentId"
            placeholder="选择部门"
            class="filter-select"
          >
            <el-option label="全部部门" value="" />
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
          <el-select
            v-model="selectedPeriod"
            placeholder="选择分析周期"
            class="filter-select"
            @change="handlePeriodChange"
          >
            <el-option label="月度" value="monthly" />
            <el-option label="季度" value="quarterly" />
            <el-option label="年度" value="yearly" />
          </el-select>
          <el-date-picker
            v-if="selectedPeriod === 'monthly'"
            v-model="dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            class="date-picker"
          />
          <el-date-picker
            v-else-if="selectedPeriod === 'quarterly'"
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            class="date-picker"
          />
          <el-date-picker
            v-else
            v-model="dateRange"
            type="yearrange"
            range-separator="至"
            start-placeholder="开始年份"
            end-placeholder="结束年份"
            class="date-picker"
          />
          <el-button type="primary" @click="refreshAnalysis" icon="el-icon-refresh">刷新分析</el-button>
        </div>
      </div>
      
      <div class="card-body">
        <!-- 盈利概览 -->
        <div class="overview-section">
          <div class="overview-cards">
            <div class="overview-card total-revenue">
              <div class="card-icon">
                <i class="el-icon-s-finance"></i>
              </div>
              <div class="card-content">
                <div class="card-title">总收入</div>
                <div class="card-value">¥{{ totalRevenue.toLocaleString() }}</div>
                <div class="card-change" :class="{ 'positive': revenueChange > 0, 'negative': revenueChange < 0 }">
                  {{ revenueChange > 0 ? '+' : '' }}{{ revenueChange.toFixed(2) }}%
                </div>
              </div>
            </div>
            <div class="overview-card total-profit">
              <div class="card-icon">
                <i class="el-icon-monitor"></i>
              </div>
              <div class="card-content">
                <div class="card-title">总利润</div>
                <div class="card-value">¥{{ totalProfit.toLocaleString() }}</div>
                <div class="card-change" :class="{ 'positive': profitChange > 0, 'negative': profitChange < 0 }">
                  {{ profitChange > 0 ? '+' : '' }}{{ profitChange.toFixed(2) }}%
                </div>
              </div>
            </div>
            <div class="overview-card profit-rate">
              <div class="card-icon">
                <i class="el-icon-data-line"></i>
              </div>
              <div class="card-content">
                <div class="card-title">利润率</div>
                <div class="card-value">{{ profitRate.toFixed(2) }}%</div>
                <div class="card-change" :class="{ 'positive': profitRateChange > 0, 'negative': profitRateChange < 0 }">
                  {{ profitRateChange > 0 ? '+' : '' }}{{ profitRateChange.toFixed(2) }}%
                </div>
              </div>
            </div>
            <div class="overview-card roi">
              <div class="card-icon">
                <i class="el-icon-data-board"></i>
              </div>
              <div class="card-content">
                <div class="card-title">投资回报率</div>
                <div class="card-value">{{ roi.toFixed(2) }}%</div>
                <div class="card-change" :class="{ 'positive': roiChange > 0, 'negative': roiChange < 0 }">
                  {{ roiChange > 0 ? '+' : '' }}{{ roiChange.toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图表区域 -->
        <div class="charts-section">
          <!-- 收入成本利润趋势图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>收入成本利润趋势</h3>
            </div>
            <div class="chart-content">
              <div id="revenueCostTrendChart" ref="revenueCostTrendChart" class="chart"></div>
            </div>
          </div>
          
          <!-- 产品盈利能力分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>产品盈利能力分析</h3>
            </div>
            <div class="chart-content">
              <div id="productProfitabilityChart" ref="productProfitabilityChart" class="chart"></div>
            </div>
          </div>
          
          <!-- 利润率分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>利润率分析</h3>
            </div>
            <div class="chart-content">
              <div id="profitMarginChart" ref="profitMarginChart" class="chart"></div>
            </div>
          </div>
          
          <!-- 盈利明细 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>盈利明细</h3>
            </div>
            <div class="chart-content">
              <el-table
                :data="profitDetails"
                style="width: 100%"
                border
                height="300"
              >
                <el-table-column prop="productName" label="产品名称" width="150" />
                <el-table-column prop="departmentName" label="部门" width="120" />
                <el-table-column prop="revenue" label="收入" width="120">
                  <template v-slot="scope">
                    ¥{{ scope.row.revenue.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="cost" label="成本" width="120">
                  <template v-slot="scope">
                    ¥{{ scope.row.cost.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="profit" label="利润" width="120">
                  <template v-slot="scope">
                    <span :class="{ 'positive': scope.row.profit > 0, 'negative': scope.row.profit < 0 }">
                      {{ scope.row.profit > 0 ? '+' : '' }}¥{{ scope.row.profit.toLocaleString() }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="profitRate" label="利润率" width="100">
                  <template v-slot="scope">
                    <span :class="{ 'positive': scope.row.profitRate > 0, 'negative': scope.row.profitRate < 0 }">
                      {{ scope.row.profitRate.toFixed(2) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="contributionMargin" label="贡献毛利率" width="120">
                  <template v-slot="scope">
                    {{ scope.row.contributionMargin.toFixed(2) }}%
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
        
        <!-- 详细分析指标 -->
        <div class="indicators-section">
          <div class="indicators-card">
            <div class="indicators-header">
              <h3>盈利能力指标分析</h3>
            </div>
            <div class="indicators-content">
              <div class="indicators-grid">
                <div class="indicator-item">
                  <div class="indicator-label">毛利率</div>
                  <div class="indicator-value">{{ grossMargin.toFixed(2) }}%</div>
                  <div class="indicator-trend" :class="{ 'up': grossMarginTrend > 0, 'down': grossMarginTrend < 0 }">
                    {{ grossMarginTrend > 0 ? '↗' : '↘' }} {{ Math.abs(grossMarginTrend).toFixed(2) }}%
                  </div>
                </div>
                <div class="indicator-item">
                  <div class="indicator-label">净利率</div>
                  <div class="indicator-value">{{ netProfitRate.toFixed(2) }}%</div>
                  <div class="indicator-trend" :class="{ 'up': netProfitRateTrend > 0, 'down': netProfitRateTrend < 0 }">
                    {{ netProfitRateTrend > 0 ? '↗' : '↘' }} {{ Math.abs(netProfitRateTrend).toFixed(2) }}%
                  </div>
                </div>
                <div class="indicator-item">
                  <div class="indicator-label">营业利润率</div>
                  <div class="indicator-value">{{ operatingProfitRate.toFixed(2) }}%</div>
                  <div class="indicator-trend" :class="{ 'up': operatingProfitRateTrend > 0, 'down': operatingProfitRateTrend < 0 }">
                    {{ operatingProfitRateTrend > 0 ? '↗' : '↘' }} {{ Math.abs(operatingProfitRateTrend).toFixed(2) }}%
                  </div>
                </div>
                <div class="indicator-item">
                  <div class="indicator-label">总资产回报率</div>
                  <div class="indicator-value">{{ roa.toFixed(2) }}%</div>
                  <div class="indicator-trend" :class="{ 'up': roaTrend > 0, 'down': roaTrend < 0 }">
                    {{ roaTrend > 0 ? '↗' : '↘' }} {{ Math.abs(roaTrend).toFixed(2) }}%
                  </div>
                </div>
                <div class="indicator-item">
                  <div class="indicator-label">净资产收益率</div>
                  <div class="indicator-value">{{ roe.toFixed(2) }}%</div>
                  <div class="indicator-trend" :class="{ 'up': roeTrend > 0, 'down': roeTrend < 0 }">
                    {{ roeTrend > 0 ? '↗' : '↘' }} {{ Math.abs(roeTrend).toFixed(2) }}%
                  </div>
                </div>
                <div class="indicator-item">
                  <div class="indicator-label">EBITDA利润率</div>
                  <div class="indicator-value">{{ ebitdaMargin.toFixed(2) }}%</div>
                  <div class="indicator-trend" :class="{ 'up': ebitdaMarginTrend > 0, 'down': ebitdaMarginTrend < 0 }">
                    {{ ebitdaMarginTrend > 0 ? '↗' : '↘' }} {{ Math.abs(ebitdaMarginTrend).toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ProfitAnalysis',
  data() {
    return {
      products: [
        { id: 1, name: '产品A', code: 'P001' },
        { id: 2, name: '产品B', code: 'P002' },
        { id: 3, name: '产品C', code: 'P003' },
        { id: 4, name: '服务D', code: 'S001' },
        { id: 5, name: '服务E', code: 'S002' }
      ],
      departments: [
        { id: 1, name: '销售部', code: 'D001' },
        { id: 2, name: '市场部', code: 'D002' },
        { id: 3, name: '客服部', code: 'D003' }
      ],
      selectedProductId: '',
      selectedDepartmentId: '',
      selectedPeriod: 'monthly',
      dateRange: [new Date('2023-01-01'), new Date('2023-12-31')],
      // 模拟分析数据
      totalRevenue: 850000,
      totalProfit: 330000,
      profitRate: 38.82,
      roi: 45.6,
      revenueChange: 12.5,
      profitChange: 15.3,
      profitRateChange: 1.2,
      roiChange: 2.1,
      // 盈利能力指标
      grossMargin: 42.5,
      netProfitRate: 25.8,
      operatingProfitRate: 32.1,
      roa: 15.6,
      roe: 28.9,
      ebitdaMargin: 36.7,
      grossMarginTrend: 1.8,
      netProfitRateTrend: 0.9,
      operatingProfitRateTrend: 1.5,
      roaTrend: 0.7,
      roeTrend: 1.2,
      ebitdaMarginTrend: 2.1,
      // 盈利明细
      profitDetails: [
        {
          productName: '产品A',
          departmentName: '销售部',
          revenue: 300000,
          cost: 180000,
          profit: 120000,
          profitRate: 40,
          contributionMargin: 45
        },
        {
          productName: '产品B',
          departmentName: '销售部',
          revenue: 250000,
          cost: 150000,
          profit: 100000,
          profitRate: 40,
          contributionMargin: 42
        },
        {
          productName: '产品C',
          departmentName: '销售部',
          revenue: 180000,
          cost: 120000,
          profit: 60000,
          profitRate: 33.33,
          contributionMargin: 38
        },
        {
          productName: '服务D',
          departmentName: '客服部',
          revenue: 80000,
          cost: 30000,
          profit: 50000,
          profitRate: 62.5,
          contributionMargin: 65
        },
        {
          productName: '服务E',
          departmentName: '市场部',
          revenue: 40000,
          cost: 20000,
          profit: 20000,
          profitRate: 50,
          contributionMargin: 55
        }
      ],
      charts: {
        revenueCostTrendChart: null,
        productProfitabilityChart: null,
        profitMarginChart: null
      }
    }
  },
  mounted() {
    this.initCharts()
    this.$nextTick(() => {
      window.addEventListener('resize', this.handleResize)
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize)
    this.destroyCharts()
  },
  methods: {
    initCharts() {
      this.initRevenueCostTrendChart()
      this.initProductProfitabilityChart()
      this.initProfitMarginChart()
    },
    
    initRevenueCostTrendChart() {
      const chartDom = this.$refs.revenueCostTrendChart
      if (!chartDom) return
      
      this.charts.revenueCostTrendChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              result += `${param.marker}${param.seriesName}: ¥${param.value.toLocaleString()}<br/>`
            })
            return result
          }
        },
        legend: {
          data: ['收入', '成本', '利润']
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
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: function(value) {
              return (value / 10000) + '万'
            }
          }
        },
        series: [
          {
            name: '收入',
            type: 'line',
            data: [65000, 72000, 68000, 75000, 82000, 85000, 88000, 90000, 85000, 83000, 80000, 78000],
            smooth: true
          },
          {
            name: '成本',
            type: 'line',
            data: [40000, 43000, 42000, 46000, 49000, 50000, 52000, 53000, 50000, 48000, 46000, 44000],
            smooth: true
          },
          {
            name: '利润',
            type: 'line',
            data: [25000, 29000, 26000, 29000, 33000, 35000, 36000, 37000, 35000, 35000, 34000, 34000],
            smooth: true
          }
        ]
      }
      this.charts.revenueCostTrendChart.setOption(option)
    },
    
    initProductProfitabilityChart() {
      const chartDom = this.$refs.productProfitabilityChart
      if (!chartDom) return
      
      this.charts.productProfitabilityChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              if (param.seriesName === '利润率') {
                result += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)}%<br/>`
              } else {
                result += `${param.marker}${param.seriesName}: ¥${param.value.toLocaleString()}<br/>`
              }
            })
            return result
          }
        },
        legend: {
          data: ['收入', '利润', '利润率']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['产品A', '产品B', '产品C', '服务D', '服务E']
        },
        yAxis: [
          {
            type: 'value',
            name: '金额',
            axisLabel: {
              formatter: function(value) {
                return (value / 10000) + '万'
              }
            }
          },
          {
            type: 'value',
            name: '利润率',
            axisLabel: {
              formatter: '{value}%'
            }
          }
        ],
        series: [
          {
            name: '收入',
            type: 'bar',
            data: [300000, 250000, 180000, 80000, 40000]
          },
          {
            name: '利润',
            type: 'bar',
            data: [120000, 100000, 60000, 50000, 20000]
          },
          {
            name: '利润率',
            type: 'line',
            yAxisIndex: 1,
            data: [40, 40, 33.33, 62.5, 50]
          }
        ]
      }
      this.charts.productProfitabilityChart.setOption(option)
    },
    
    initProfitMarginChart() {
      const chartDom = this.$refs.profitMarginChart
      if (!chartDom) return
      
      this.charts.profitMarginChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              result += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)}%<br/>`
            })
            return result
          }
        },
        legend: {
          data: ['毛利率', '净利率', '营业利润率']
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
          data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: '毛利率',
            type: 'line',
            data: [40, 40.3, 38.2, 38.7, 40.2, 41.2, 40.9, 41.1, 41.2, 42.2, 42.5, 43.6],
            smooth: true
          },
          {
            name: '净利率',
            type: 'line',
            data: [23.5, 24.1, 23.8, 24.5, 25.1, 25.5, 25.8, 26.2, 26.5, 27.1, 27.5, 28.1],
            smooth: true
          },
          {
            name: '营业利润率',
            type: 'line',
            data: [30.2, 30.8, 29.7, 30.1, 31.4, 32.1, 32.5, 32.8, 33.1, 33.5, 33.8, 34.2],
            smooth: true
          }
        ]
      }
      this.charts.profitMarginChart.setOption(option)
    },
    
    handleResize() {
      Object.values(this.charts).forEach(chart => {
        if (chart && chart.resize) {
          chart.resize()
        }
      })
    },
    
    destroyCharts() {
      Object.values(this.charts).forEach(chart => {
        if (chart && chart.dispose) {
          chart.dispose()
        }
      })
    },
    
    handlePeriodChange() {
      // 根据选择的周期调整日期范围选择器
      if (this.selectedPeriod === 'monthly') {
        this.dateRange = [new Date('2023-01-01'), new Date('2023-12-31')]
      } else if (this.selectedPeriod === 'quarterly') {
        this.dateRange = [new Date('2023-01-01'), new Date('2023-12-31')]
      } else {
        this.dateRange = [new Date('2022-01-01'), new Date('2023-12-31')]
      }
    },
    
    refreshAnalysis() {
      // 这里可以添加刷新分析数据的逻辑
      this.$message.success('分析数据已刷新')
      // 重新初始化图表以更新数据
      this.destroyCharts()
      this.$nextTick(() => {
        this.initCharts()
      })
    }
  }
}
</script>

<style scoped>
.profit-analysis-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.filters {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-select {
  width: 180px;
}

.date-picker {
  width: 300px;
}

.card-body {
  padding: 20px;
}

/* 概览卡片样式 */
.overview-section {
  margin-bottom: 30px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.overview-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
}

.overview-card.total-revenue {
  border-left: 4px solid #409eff;
}

.overview-card.total-profit {
  border-left: 4px solid #67c23a;
}

.overview-card.profit-rate {
  border-left: 4px solid #e6a23c;
}

.overview-card.roi {
  border-left: 4px solid #f56c6c;
}

.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: #fff;
}

.total-revenue .card-icon {
  background: #409eff;
}

.total-profit .card-icon {
  background: #67c23a;
}

.profit-rate .card-icon {
  background: #e6a23c;
}

.roi .card-icon {
  background: #f56c6c;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.card-change {
  font-size: 12px;
}

.card-change.positive {
  color: #67c23a;
}

.card-change.negative {
  color: #f56c6c;
}

/* 图表区域样式 */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  margin-bottom: 15px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chart-content {
  height: 300px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* 表格样式 */
.el-table {
  width: 100%;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

/* 指标分析区域 */
.indicators-section {
  margin-top: 30px;
}

.indicators-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.indicators-header {
  margin-bottom: 20px;
}

.indicators-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.indicators-content {
  padding: 10px 0;
}

.indicators-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.indicator-item {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.indicator-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.indicator-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.indicator-trend {
  font-size: 12px;
}

.indicator-trend.up {
  color: #67c23a;
}

.indicator-trend.down {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-select,
  .date-picker {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .charts-section,
  .indicators-grid {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>