<template>
  <div class="cost-analysis-container">
    <div class="header">
      <h2>成本分析</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <div class="filters">
          <el-select
            v-model="selectedCenterId"
            placeholder="选择成本中心"
            class="filter-select"
          >
            <el-option label="全部成本中心" value="" />
            <el-option v-for="center in costCenters" :key="center.id" :label="center.name" :value="center.id" />
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
        <!-- 成本概览 -->
        <div class="overview-section">
          <div class="overview-cards">
            <div class="overview-card total-cost">
              <div class="card-icon">
                <i class="el-icon-finished"></i>
              </div>
              <div class="card-content">
                <div class="card-title">总成本</div>
                <div class="card-value">¥{{ totalCost.toLocaleString() }}</div>
                <div class="card-change" :class="{ 'positive': costChange > 0, 'negative': costChange < 0 }">
                  {{ costChange > 0 ? '+' : '' }}{{ costChange.toFixed(2) }}%
                </div>
              </div>
            </div>
            <div class="overview-card direct-cost">
              <div class="card-icon">
                <i class="el-icon-s-order"></i>
              </div>
              <div class="card-content">
                <div class="card-title">直接成本</div>
                <div class="card-value">¥{{ directCost.toLocaleString() }}</div>
                <div class="card-change" :class="{ 'positive': directCostChange > 0, 'negative': directCostChange < 0 }">
                  {{ directCostChange > 0 ? '+' : '' }}{{ directCostChange.toFixed(2) }}%
                </div>
              </div>
            </div>
            <div class="overview-card indirect-cost">
              <div class="card-icon">
                <i class="el-icon-s-operation"></i>
              </div>
              <div class="card-content">
                <div class="card-title">间接成本</div>
                <div class="card-value">¥{{ indirectCost.toLocaleString() }}</div>
                <div class="card-change" :class="{ 'positive': indirectCostChange > 0, 'negative': indirectCostChange < 0 }">
                  {{ indirectCostChange > 0 ? '+' : '' }}{{ indirectCostChange.toFixed(2) }}%
                </div>
              </div>
            </div>
            <div class="overview-card average-cost">
              <div class="card-icon">
                <i class="el-icon-data-line"></i>
              </div>
              <div class="card-content">
                <div class="card-title">平均单位成本</div>
                <div class="card-value">¥{{ averageUnitCost.toLocaleString() }}</div>
                <div class="card-change" :class="{ 'positive': unitCostChange > 0, 'negative': unitCostChange < 0 }">
                  {{ unitCostChange > 0 ? '+' : '' }}{{ unitCostChange.toFixed(2) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 图表区域 -->
        <div class="charts-section">
          <!-- 成本趋势图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>成本趋势分析</h3>
            </div>
            <div class="chart-content">
              <div id="costTrendChart" ref="costTrendChart" class="chart"></div>
            </div>
          </div>
          
          <!-- 成本构成图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>成本构成分析</h3>
            </div>
            <div class="chart-content">
              <div id="costStructureChart" ref="costStructureChart" class="chart"></div>
            </div>
          </div>
          
          <!-- 成本中心对比图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>成本中心对比</h3>
            </div>
            <div class="chart-content">
              <div id="centerComparisonChart" ref="centerComparisonChart" class="chart"></div>
            </div>
          </div>
          
          <!-- 成本异常分析 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>成本异常监控</h3>
            </div>
            <div class="chart-content">
              <el-table
                :data="anomalyItems"
                style="width: 100%"
                border
              >
                <el-table-column prop="costItemName" label="成本项目" width="180" />
                <el-table-column prop="costCenterName" label="成本中心" width="150" />
                <el-table-column prop="actualAmount" label="实际金额" width="120">
                  <template v-slot="scope">
                    ¥{{ scope.row.actualAmount.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="budgetAmount" label="预算金额" width="120">
                  <template v-slot="scope">
                    ¥{{ scope.row.budgetAmount.toLocaleString() }}
                  </template>
                </el-table-column>
                <el-table-column prop="variance" label="差异金额" width="120">
                  <template v-slot="scope">
                    <span :class="{ 'positive': scope.row.variance > 0, 'negative': scope.row.variance < 0 }">
                      {{ scope.row.variance > 0 ? '+' : '' }}¥{{ scope.row.variance.toLocaleString() }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="varianceRate" label="差异率" width="100">
                  <template v-slot="scope">
                    <span :class="{ 'positive': scope.row.varianceRate > 0, 'negative': scope.row.varianceRate < 0 }">
                      {{ scope.row.varianceRate > 0 ? '+' : '' }}{{ scope.row.varianceRate.toFixed(2) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="anomalyLevel" label="异常等级" width="100">
                  <template v-slot="scope">
                    <el-tag :type="getAnomalyLevelType(scope.row.anomalyLevel)">
                      {{ scope.row.anomalyLevel }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
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
  name: 'CostAnalysis',
  data() {
    return {
      costCenters: [
        { id: 1, name: '财务部', code: 'CC001' },
        { id: 2, name: '生产部', code: 'CC002' },
        { id: 3, name: '销售部', code: 'CC003' },
        { id: 4, name: '研发部', code: 'CC004' },
        { id: 5, name: '行政部', code: 'CC005' }
      ],
      selectedCenterId: '',
      selectedPeriod: 'monthly',
      dateRange: [new Date('2023-01-01'), new Date('2023-12-31')],
      // 模拟分析数据
      totalCost: 520000,
      directCost: 350000,
      indirectCost: 170000,
      averageUnitCost: 1200,
      costChange: -5.2,
      directCostChange: -3.8,
      indirectCostChange: -7.5,
      unitCostChange: -4.3,
      anomalyItems: [
        {
          costItemName: '原材料A',
          costCenterName: '生产部',
          actualAmount: 120000,
          budgetAmount: 100000,
          variance: 20000,
          varianceRate: 20,
          anomalyLevel: '高'
        },
        {
          costItemName: '水电费',
          costCenterName: '生产部',
          actualAmount: 60000,
          budgetAmount: 50000,
          variance: 10000,
          varianceRate: 20,
          anomalyLevel: '中'
        },
        {
          costItemName: '设备折旧',
          costCenterName: '研发部',
          actualAmount: 35000,
          budgetAmount: 30000,
          variance: 5000,
          varianceRate: 16.67,
          anomalyLevel: '中'
        },
        {
          costItemName: '销售费用',
          costCenterName: '销售部',
          actualAmount: 90000,
          budgetAmount: 80000,
          variance: 10000,
          varianceRate: 12.5,
          anomalyLevel: '低'
        }
      ],
      charts: {
        costTrendChart: null,
        costStructureChart: null,
        centerComparisonChart: null
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
      this.initCostTrendChart()
      this.initCostStructureChart()
      this.initCenterComparisonChart()
    },
    
    initCostTrendChart() {
      const chartDom = this.$refs.costTrendChart
      if (!chartDom) return
      
      this.charts.costTrendChart = echarts.init(chartDom)
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
          data: ['直接成本', '间接成本', '总成本']
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
            name: '直接成本',
            type: 'line',
            stack: 'Total',
            data: [30000, 35000, 32000, 38000, 40000, 42000, 45000, 43000, 41000, 39000, 37000, 36000]
          },
          {
            name: '间接成本',
            type: 'line',
            stack: 'Total',
            data: [15000, 17000, 16000, 18000, 20000, 22000, 24000, 23000, 21000, 19000, 18000, 17000]
          },
          {
            name: '总成本',
            type: 'line',
            stack: 'Total',
            data: [45000, 52000, 48000, 56000, 60000, 64000, 69000, 66000, 62000, 58000, 55000, 53000],
            smooth: true
          }
        ]
      }
      this.charts.costTrendChart.setOption(option)
    },
    
    initCostStructureChart() {
      const chartDom = this.$refs.costStructureChart
      if (!chartDom) return
      
      this.charts.costStructureChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
        },
        series: [
          {
            name: '成本构成',
            type: 'pie',
            radius: '60%',
            center: ['50%', '50%'],
            data: [
              { value: 180000, name: '原材料' },
              { value: 170000, name: '人工成本' },
              { value: 70000, name: '制造费用' },
              { value: 50000, name: '销售费用' },
              { value: 30000, name: '管理费用' },
              { value: 20000, name: '财务费用' }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      this.charts.costStructureChart.setOption(option)
    },
    
    initCenterComparisonChart() {
      const chartDom = this.$refs.centerComparisonChart
      if (!chartDom) return
      
      this.charts.centerComparisonChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['实际成本', '预算成本']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['财务部', '生产部', '销售部', '研发部', '行政部']
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
            name: '实际成本',
            type: 'bar',
            data: [45000, 280000, 90000, 65000, 40000]
          },
          {
            name: '预算成本',
            type: 'bar',
            data: [40000, 250000, 80000, 60000, 35000]
          }
        ]
      }
      this.charts.centerComparisonChart.setOption(option)
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
    },
    
    getAnomalyLevelType(level) {
      const typeMap = {
        '高': 'danger',
        '中': 'warning',
        '低': 'info'
      }
      return typeMap[level] || 'info'
    }
  }
}
</script>

<style scoped>
.cost-analysis-container {
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

.overview-card.total-cost {
  border-left: 4px solid #409eff;
}

.overview-card.direct-cost {
  border-left: 4px solid #67c23a;
}

.overview-card.indirect-cost {
  border-left: 4px solid #e6a23c;
}

.overview-card.average-cost {
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

.total-cost .card-icon {
  background: #409eff;
}

.direct-cost .card-icon {
  background: #67c23a;
}

.indirect-cost .card-icon {
  background: #e6a23c;
}

.average-cost .card-icon {
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
  color: #f56c6c;
}

.card-change.negative {
  color: #67c23a;
}

/* 图表区域样式 */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
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
  color: #f56c6c;
}

.negative {
  color: #67c23a;
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
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: 1fr;
  }
}
</style>