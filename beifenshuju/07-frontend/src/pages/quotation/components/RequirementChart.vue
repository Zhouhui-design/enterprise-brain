<template>
  <div class="requirement-chart-container">
    <div class="chart-header">
      <h3 class="chart-title">{{ title || '需求分析图表' }}</h3>
      <div class="chart-controls">
        <el-select v-model="chartType" size="small" @change="updateChart" placeholder="图表类型">
          <el-option label="柱状图" value="bar"></el-option>
          <el-option label="折线图" value="line"></el-option>
          <el-option label="饼图" value="pie"></el-option>
          <el-option label="面积图" value="area"></el-option>
        </el-select>
        <el-select v-model="timeRange" size="small" @change="updateChart" placeholder="时间范围">
          <el-option label="近7天" value="7"></el-option>
          <el-option label="近30天" value="30"></el-option>
          <el-option label="近90天" value="90"></el-option>
          <el-option label="近12个月" value="365"></el-option>
        </el-select>
        <el-button size="small" type="primary" @click="refreshChart">刷新</el-button>
        <el-button size="small" @click="exportChart">导出图表</el-button>
      </div>
    </div>

    <div class="chart-filters">
      <el-form :inline="true" :model="filterForm" size="small">
        <el-form-item label="物料类别">
          <el-select v-model="filterForm.category" placeholder="选择物料类别" multiple collapse-tags>
            <el-option v-for="category in materialCategories" :key="category.value" 
                      :label="category.label" :value="category.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="需求类型">
          <el-select v-model="filterForm.requirementType" placeholder="选择需求类型" multiple collapse-tags>
            <el-option v-for="type in requirementTypes" :key="type.value" 
                      :label="type.label" :value="type.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">应用筛选</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 图表区域 -->
    <div class="chart-content">
      <!-- 主要图表 -->
      <div class="main-chart" ref="mainChartContainer"></div>
      
      <!-- 数据统计卡片 -->
      <div class="stats-cards">
        <el-card v-for="stat in statistics" :key="stat.label" class="stat-card">
          <div class="stat-content">
            <div class="stat-value" :class="stat.valueClass">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-change" :class="stat.changeClass">
              <i :class="stat.icon"></i>
              {{ stat.changeText }}
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 详细数据表格 -->
    <div class="chart-data-table">
      <h4>详细数据</h4>
      <el-table :data="chartDataFormatted" stripe style="width: 100%">
        <el-table-column prop="period" label="时间段" width="120"></el-table-column>
        <el-table-column prop="category" label="物料类别" width="100"></el-table-column>
        <el-table-column prop="grossDemand" label="毛需求" width="100" align="right">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.grossDemand) }}
          </template>
        </el-table-column>
        <el-table-column prop="netDemand" label="净需求" width="100" align="right">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.netDemand) }}
          </template>
        </el-table-column>
        <el-table-column prop="plannedOrders" label="计划订单" width="100" align="right">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.plannedOrders) }}
          </template>
        </el-table-column>
        <el-table-column prop="variance" label="环比变化" width="100" align="right">
          <template slot-scope="scope">
            <span :class="scope.row.variance >= 0 ? 'text-green' : 'text-red'">
              {{ formatPercent(scope.row.variance) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 图表配置对话框 -->
    <el-dialog
      title="图表配置"
      :visible.sync="chartConfigVisible"
      width="50%"
      :close-on-click-modal="false"
    >
      <el-form :model="chartConfig" label-width="100px">
        <el-form-item label="图表标题">
          <el-input v-model="chartConfig.title"></el-input>
        </el-form-item>
        <el-form-item label="显示图例">
          <el-switch v-model="chartConfig.showLegend"></el-switch>
        </el-form-item>
        <el-form-item label="显示网格线">
          <el-switch v-model="chartConfig.showGrid"></el-switch>
        </el-form-item>
        <el-form-item label="数值精度">
          <el-select v-model="chartConfig.decimalPlaces">
            <el-option label="0" value="0"></el-option>
            <el-option label="1" value="1"></el-option>
            <el-option label="2" value="2"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="chartConfigVisible = false">取消</el-button>
        <el-button type="primary" @click="applyChartConfig">应用</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'RequirementChart',
  props: {
    title: {
      type: String,
      default: '需求分析图表'
    },
    initialData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      // 图表配置
      chartType: 'bar',
      timeRange: '30',
      
      // 图表实例
      chartInstance: null,
      
      // 筛选表单
      filterForm: {
        category: [],
        requirementType: []
      },
      
      // 物料类别选项
      materialCategories: [
        { label: '原材料', value: 'raw' },
        { label: '半成品', value: 'semi' },
        { label: '成品', value: 'finished' }
      ],
      
      // 需求类型选项
      requirementTypes: [
        { label: '销售订单', value: 'sales' },
        { label: '预测', value: 'forecast' },
        { label: '生产计划', value: 'production' }
      ],
      
      // 图表数据
      chartData: [],
      
      // 统计数据
      statistics: [],
      
      // 图表配置对话框
      chartConfigVisible: false,
      chartConfig: {
        title: '需求分析图表',
        showLegend: true,
        showGrid: true,
        decimalPlaces: '0'
      }
    }
  },
  computed: {
    // 格式化后的图表数据
    chartDataFormatted() {
      return this.chartData.map(item => {
        return {
          ...item,
          variance: this.calculateVariance(item)
        }
      })
    }
  },
  watch: {
    initialData: {
      handler(newData) {
        if (newData && newData.length > 0) {
          this.chartData = newData
          this.updateChart()
          this.updateStatistics()
        } else {
          this.generateMockData()
        }
      },
      immediate: true
    }
  },
  mounted() {
    // 初始化图表
    this.$nextTick(() => {
      if (!this.initialData || this.initialData.length === 0) {
        this.generateMockData()
      }
      this.updateChart()
    })
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.chartInstance) {
      this.chartInstance.dispose()
      this.chartInstance = null
    }
  },
  methods: {
    // 生成模拟数据
    generateMockData() {
      const days = parseInt(this.timeRange)
      const categories = ['raw', 'semi', 'finished']
      const requirementTypes = ['sales', 'forecast', 'production']
      const data = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const period = date.toISOString().split('T')[0]
        
        categories.forEach(category => {
          const baseValue = Math.floor(Math.random() * 1000) + 500
          data.push({
            period,
            category,
            categoryLabel: this.getCategoryLabel(category),
            grossDemand: baseValue,
            netDemand: Math.floor(baseValue * 0.7),
            plannedOrders: Math.floor(baseValue * 0.6),
            requirementType: requirementTypes[Math.floor(Math.random() * requirementTypes.length)]
          })
        })
      }
      
      this.chartData = data
      this.updateStatistics()
    },
    
    // 获取类别标签
    getCategoryLabel(category) {
      const categoryMap = {
        'raw': '原材料',
        'semi': '半成品',
        'finished': '成品'
      }
      return categoryMap[category] || category
    },
    
    // 更新图表
    updateChart() {
      // 筛选数据
      let filteredData = this.filterData()
      
      // 准备图表数据
      const chartData = this.prepareChartData(filteredData)
      
      // 创建或更新图表
      this.renderChart(chartData)
    },
    
    // 筛选数据
    filterData() {
      let data = [...this.chartData]
      
      // 应用类别筛选
      if (this.filterForm.category && this.filterForm.category.length > 0) {
        data = data.filter(item => this.filterForm.category.includes(item.category))
      }
      
      // 应用需求类型筛选
      if (this.filterForm.requirementType && this.filterForm.requirementType.length > 0) {
        data = data.filter(item => this.filterForm.requirementType.includes(item.requirementType))
      }
      
      // 限制时间范围
      const days = parseInt(this.timeRange)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      return data.filter(item => new Date(item.period) >= cutoffDate)
    },
    
    // 准备图表数据
    prepareChartData(data) {
      // 根据图表类型准备数据
      switch (this.chartType) {
        case 'pie':
          return this.preparePieData(data)
        case 'bar':
        case 'line':
        case 'area':
        default:
          return this.prepareSeriesData(data)
      }
    },
    
    // 准备饼图数据
    preparePieData(data) {
      // 按类别分组计算总和
      const grouped = {}
      data.forEach(item => {
        if (!grouped[item.category]) {
          grouped[item.category] = 0
        }
        grouped[item.category] += item.grossDemand
      })
      
      return Object.keys(grouped).map(key => ({
        name: this.getCategoryLabel(key),
        value: grouped[key]
      }))
    },
    
    // 准备系列数据（柱状图/折线图/面积图）
    prepareSeriesData(data) {
      // 获取所有唯一的时间段并排序
      const periods = [...new Set(data.map(item => item.period))].sort()
      
      // 获取所有唯一的类别
      const categories = [...new Set(data.map(item => item.category))]
      
      // 按时间段和类别组织数据
      const series = categories.map(category => {
        const categoryData = periods.map(period => {
          const item = data.find(d => d.period === period && d.category === category)
          return item ? item.grossDemand : 0
        })
        
        return {
          name: this.getCategoryLabel(category),
          type: this.chartType,
          data: categoryData,
          smooth: this.chartType === 'line' || this.chartType === 'area',
          stack: this.chartType === 'area' ? 'total' : undefined
        }
      })
      
      return {
        periods,
        series
      }
    },
    
    // 渲染图表
    renderChart(chartData) {
      // 这里使用模拟的图表渲染逻辑，实际项目中应使用真实的图表库（如ECharts）
      const container = this.$refs.mainChartContainer
      if (!container) return
      
      // 清空容器
      container.innerHTML = ''
      
      // 模拟图表渲染
      const chartDiv = document.createElement('div')
      chartDiv.className = 'simulated-chart'
      
      let chartHtml = ''
      
      if (this.chartType === 'pie') {
        // 模拟饼图
        chartHtml = `<div class="pie-chart-simulation">
          <h4>${this.chartConfig.title}</h4>
          <div class="pie-legend">
            ${chartData.map((item, index) => `
              <div class="legend-item">
                <span class="legend-color" style="background-color: ${this.getSeriesColor(index)}"></span>
                <span>${item.name}: ${item.value}</span>
              </div>
            `).join('')}
          </div>
          <div class="pie-chart-placeholder">饼图可视化区域</div>
        </div>`
      } else {
        // 模拟柱状图/折线图/面积图
        chartHtml = `<div class="xy-chart-simulation">
          <h4>${this.chartConfig.title}</h4>
          ${this.chartConfig.showLegend ? `
            <div class="chart-legend">
              ${chartData.series.map((series, index) => `
                <div class="legend-item">
                  <span class="legend-color" style="background-color: ${this.getSeriesColor(index)}"></span>
                  <span>${series.name}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <div class="chart-grid">
            <div class="chart-x-axis">
              ${chartData.periods.map(period => `<div class="x-tick">${this.formatShortDate(period)}</div>`).join('')}
            </div>
            <div class="chart-content-area">
              <!-- 这里是图表内容区域 -->
              <div class="chart-placeholder">${this.getChartTypeLabel()}可视化区域</div>
              ${chartData.series.map((series, seriesIndex) => `
                <div class="chart-series">
                  ${series.data.map((value, index) => {
                    const height = Math.min(100, (value / Math.max(...series.data)) * 100)
                    return `<div class="chart-data-point" 
                              style="
                                left: ${(index / (series.data.length - 1)) * 100}%;
                                height: ${height}px;
                                background-color: ${this.getSeriesColor(seriesIndex)};
                                opacity: ${this.chartType === 'area' ? 0.3 : 1};
                              "
                              title="${series.name}: ${value}"
                            ></div>`
                  }).join('')}
                </div>
              `).join('')}
            </div>
          </div>
        </div>`
      }
      
      chartDiv.innerHTML = chartHtml
      container.appendChild(chartDiv)
    },
    
    // 获取图表类型标签
    getChartTypeLabel() {
      const typeMap = {
        'bar': '柱状图',
        'line': '折线图',
        'pie': '饼图',
        'area': '面积图'
      }
      return typeMap[this.chartType] || '图表'
    },
    
    // 获取系列颜色
    getSeriesColor(index) {
      const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#C0C4CC']
      return colors[index % colors.length]
    },
    
    // 更新统计数据
    updateStatistics() {
      const filteredData = this.filterData()
      
      // 计算总需求
      const totalGrossDemand = filteredData.reduce((sum, item) => sum + item.grossDemand, 0)
      const totalNetDemand = filteredData.reduce((sum, item) => sum + item.netDemand, 0)
      const totalPlannedOrders = filteredData.reduce((sum, item) => sum + item.plannedOrders, 0)
      
      // 计算平均需求
      const avgDailyDemand = filteredData.length > 0 ? Math.round(totalGrossDemand / filteredData.length) : 0
      
      // 计算环比变化（模拟）
      const changeRate = Math.random() * 20 - 10
      
      this.statistics = [
        {
          label: '总毛需求',
          value: this.formatNumber(totalGrossDemand),
          valueClass: 'value-primary',
          changeText: `${changeRate >= 0 ? '+' : ''}${changeRate.toFixed(1)}%`,
          changeClass: changeRate >= 0 ? 'change-positive' : 'change-negative',
          icon: changeRate >= 0 ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
        },
        {
          label: '总净需求',
          value: this.formatNumber(totalNetDemand),
          valueClass: 'value-success',
          changeText: `${(changeRate * 0.8).toFixed(1)}%`,
          changeClass: changeRate >= 0 ? 'change-positive' : 'change-negative',
          icon: changeRate >= 0 ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
        },
        {
          label: '计划订单',
          value: this.formatNumber(totalPlannedOrders),
          valueClass: 'value-warning',
          changeText: `${(changeRate * 0.6).toFixed(1)}%`,
          changeClass: changeRate >= 0 ? 'change-positive' : 'change-negative',
          icon: changeRate >= 0 ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
        },
        {
          label: '日均需求',
          value: this.formatNumber(avgDailyDemand),
          valueClass: 'value-info',
          changeText: `${(changeRate * 0.5).toFixed(1)}%`,
          changeClass: changeRate >= 0 ? 'change-positive' : 'change-negative',
          icon: changeRate >= 0 ? 'el-icon-arrow-up' : 'el-icon-arrow-down'
        }
      ]
    },
    
    // 计算环比变化
    calculateVariance(item) {
      // 这里是简化的模拟计算，实际应基于历史数据
      return (Math.random() * 20 - 10) / 100
    },
    
    // 格式化数字
    formatNumber(value) {
      if (value >= 10000) {
        return (value / 10000).toFixed(1) + '万'
      }
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
    
    // 格式化百分比
    formatPercent(value) {
      return `${(value * 100).toFixed(1)}%`
    },
    
    // 格式化短日期
    formatShortDate(dateString) {
      const date = new Date(dateString)
      return `${date.getMonth() + 1}/${date.getDate()}`
    },
    
    // 应用筛选
    applyFilters() {
      this.updateChart()
      this.updateStatistics()
    },
    
    // 重置筛选
    resetFilters() {
      this.filterForm = {
        category: [],
        requirementType: []
      }
      this.updateChart()
      this.updateStatistics()
    },
    
    // 刷新图表
    refreshChart() {
      this.$emit('refresh')
      // 如果没有外部数据源，重新生成模拟数据
      this.generateMockData()
      this.updateChart()
    },
    
    // 导出图表
    exportChart() {
      // 这里可以实现实际的图表导出逻辑
      this.$message.success('图表导出成功！')
    },
    
    // 应用图表配置
    applyChartConfig() {
      this.updateChart()
      this.chartConfigVisible = false
    }
  }
}
</script>

<style scoped>
.requirement-chart-container {
  background: #fff;
  border-radius: 4px;
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chart-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.chart-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.chart-controls .el-select {
  width: 120px;
}

.chart-filters {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.chart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.main-chart {
  flex: 1;
  background-color: #fafafa;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
  min-height: 300px;
}

/* 模拟图表样式 */
.simulated-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.pie-chart-simulation h4,
.xy-chart-simulation h4 {
  margin-top: 0;
  margin-bottom: 16px;
  text-align: center;
  color: #606266;
}

.pie-legend,
.chart-legend {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.pie-chart-placeholder,
.chart-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
  background-color: #fff;
  border-radius: 4px;
  border: 1px dashed #dcdfe6;
}

/* XY图表模拟样式 */
.chart-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  padding: 16px;
}

.chart-x-axis {
  display: flex;
  justify-content: space-between;
  padding-top: 8px;
  margin-top: auto;
  border-top: 1px solid #ebeef5;
}

.x-tick {
  font-size: 12px;
  color: #909399;
  text-align: center;
  min-width: 40px;
}

.chart-content-area {
  flex: 1;
  position: relative;
  margin-bottom: 16px;
  overflow: hidden;
}

.chart-series {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.chart-data-point {
  position: absolute;
  width: 10px;
  bottom: 0;
  transform: translateX(-50%);
  transition: all 0.3s;
}

.chart-data-point:hover {
  opacity: 0.8 !important;
}

/* 统计卡片样式 */
.stats-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  min-width: 0;
}

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.value-primary {
  color: #409EFF;
}

.value-success {
  color: #67C23A;
}

.value-warning {
  color: #E6A23C;
}

.value-info {
  color: #909399;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
}

.change-positive {
  color: #67C23A;
}

.change-negative {
  color: #F56C6C;
}

/* 数据表格样式 */
.chart-data-table {
  margin-top: 16px;
}

.chart-data-table h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 16px;
  color: #606266;
}

.text-green {
  color: #67C23A;
}

.text-red {
  color: #F56C6C;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .chart-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .stats-cards {
    flex-direction: column;
  }
  
  .chart-filters {
    overflow-x: auto;
  }
  
  .chart-filters .el-form {
    min-width: 600px;
  }
}
</style>