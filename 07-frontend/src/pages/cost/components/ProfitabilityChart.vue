<template>
  <div class="profitability-chart-container">
    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="分析维度">
          <el-select v-model="filterForm.dimension" placeholder="选择维度" clearable>
            <el-option label="按部门" value="department" />
            <el-option label="按产品" value="product" />
            <el-option label="按区域" value="region" />
            <el-option label="按客户" value="customer" />
          </el-select>
        </el-form-item>
        <el-form-item label="指标类型">
          <el-select v-model="filterForm.metricType" placeholder="选择指标" clearable>
            <el-option label="毛利率" value="grossMargin" />
            <el-option label="净利率" value="netMargin" />
            <el-option label="ROI" value="roi" />
            <el-option label="所有指标" value="all" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshData" icon="el-icon-search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="chart-content">
      <!-- 盈利能力指标卡片 -->
      <div class="metric-cards">
        <el-card class="metric-card">
          <div class="metric-header">
            <h3>毛利率</h3>
            <span class="trend-icon" :class="getTrendClass(grossMarginTrend)">
              <i :class="grossMarginTrend > 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
              {{ Math.abs(grossMarginTrend).toFixed(2) }}%
            </span>
          </div>
          <div class="metric-value">
            {{ grossMargin.toFixed(2) }}%
          </div>
          <div class="metric-subtitle">
            较上期{{ grossMarginTrend > 0 ? '上升' : '下降' }}
          </div>
        </el-card>
        
        <el-card class="metric-card">
          <div class="metric-header">
            <h3>净利率</h3>
            <span class="trend-icon" :class="getTrendClass(netMarginTrend)">
              <i :class="netMarginTrend > 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
              {{ Math.abs(netMarginTrend).toFixed(2) }}%
            </span>
          </div>
          <div class="metric-value">
            {{ netMargin.toFixed(2) }}%
          </div>
          <div class="metric-subtitle">
            较上期{{ netMarginTrend > 0 ? '上升' : '下降' }}
          </div>
        </el-card>
        
        <el-card class="metric-card">
          <div class="metric-header">
            <h3>ROI</h3>
            <span class="trend-icon" :class="getTrendClass(roiTrend)">
              <i :class="roiTrend > 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
              {{ Math.abs(roiTrend).toFixed(2) }}%
            </span>
          </div>
          <div class="metric-value">
            {{ roi.toFixed(2) }}%
          </div>
          <div class="metric-subtitle">
            较上期{{ roiTrend > 0 ? '上升' : '下降' }}
          </div>
        </el-card>
        
        <el-card class="metric-card">
          <div class="metric-header">
            <h3>盈利能力指数</h3>
            <span class="trend-icon" :class="getTrendClass(profitIndexTrend)">
              <i :class="profitIndexTrend > 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
              {{ Math.abs(profitIndexTrend).toFixed(2) }}
            </span>
          </div>
          <div class="metric-value">
            {{ profitIndex.toFixed(2) }}
          </div>
          <div class="metric-subtitle">
            较上期{{ profitIndexTrend > 0 ? '上升' : '下降' }}
          </div>
        </el-card>
      </div>
      
      <!-- 图表展示区 -->
      <div class="charts-section">
        <div class="chart-row">
          <!-- 盈利能力趋势图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>盈利能力趋势</h3>
              <div class="chart-actions">
                <el-select v-model="trendChartType" size="small" @change="updateTrendChart">
                  <el-option label="折线图" value="line" />
                  <el-option label="柱状图" value="bar" />
                  <el-option label="面积图" value="area" />
                </el-select>
              </div>
            </div>
            <div class="chart-wrapper">
              <div ref="trendChart" class="chart"></div>
            </div>
          </div>
          
          <!-- 盈利能力对比图 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>盈利能力对比</h3>
              <div class="chart-actions">
                <el-select v-model="comparisonChartType" size="small" @change="updateComparisonChart">
                  <el-option label="柱状图" value="bar" />
                  <el-option label="雷达图" value="radar" />
                </el-select>
              </div>
            </div>
            <div class="chart-wrapper">
              <div ref="comparisonChart" class="chart"></div>
            </div>
          </div>
        </div>
        
        <!-- 盈利能力分布热力图 -->
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>盈利能力分布</h3>
            <div class="chart-actions">
              <el-button size="small" type="primary" @click="exportHeatmap" icon="el-icon-download">导出</el-button>
            </div>
          </div>
          <div class="chart-wrapper">
            <div ref="heatmapChart" class="chart"></div>
          </div>
        </div>
        
        <!-- 盈利能力分析表格 -->
        <div class="table-card">
          <div class="table-header">
            <h3>盈利能力明细</h3>
            <div class="table-actions">
              <el-button type="primary" size="small" @click="exportData" icon="el-icon-download">导出</el-button>
              <el-button type="success" size="small" @click="exportReport" icon="el-icon-document">生成报告</el-button>
            </div>
          </div>
          <el-table
            :data="profitabilityDetails"
            style="width: 100%"
            border
            @sort-change="handleSortChange"
          >
            <el-table-column prop="name" label="名称" width="150" sortable="custom">
              <template v-slot="scope">
                <el-tooltip :content="scope.row.description" placement="top">
                  <div>{{ scope.row.name }}</div>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="revenue" label="营业收入" width="120" align="right" sortable="custom">
              <template v-slot="scope">{{ formatCurrency(scope.row.revenue) }}</template>
            </el-table-column>
            <el-table-column prop="cost" label="营业成本" width="120" align="right" sortable="custom">
              <template v-slot="scope">{{ formatCurrency(scope.row.cost) }}</template>
            </el-table-column>
            <el-table-column prop="grossProfit" label="毛利" width="120" align="right" sortable="custom">
              <template v-slot="scope">{{ formatCurrency(scope.row.grossProfit) }}</template>
            </el-table-column>
            <el-table-column prop="grossMargin" label="毛利率" width="100" align="right" sortable="custom">
              <template v-slot="scope">
                <el-progress :percentage="scope.row.grossMargin" :format="() => `${scope.row.grossMargin.toFixed(2)}%`" />
              </template>
            </el-table-column>
            <el-table-column prop="netProfit" label="净利润" width="120" align="right" sortable="custom">
              <template v-slot="scope">{{ formatCurrency(scope.row.netProfit) }}</template>
            </el-table-column>
            <el-table-column prop="netMargin" label="净利率" width="100" align="right" sortable="custom">
              <template v-slot="scope">
                <el-progress :percentage="scope.row.netMargin" :format="() => `${scope.row.netMargin.toFixed(2)}%`" />
              </template>
            </el-table-column>
            <el-table-column prop="roi" label="ROI" width="100" align="right" sortable="custom">
              <template v-slot="scope">{{ scope.row.roi.toFixed(2) }}%</template>
            </el-table-column>
            <el-table-column prop="trend" label="趋势" width="80" align="center">
              <template v-slot="scope">
                <span :class="['trend-badge', getTrendClass(scope.row.trend)]">
                  <i :class="scope.row.trend > 0 ? 'el-icon-caret-top' : scope.row.trend < 0 ? 'el-icon-caret-bottom' : 'el-icon-minus'"></i>
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template v-slot="scope">
                <el-tag :type="getStatusTag(scope.row.status)">
                  {{ scope.row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template v-slot="scope">
                <el-button size="mini" type="primary" @click="viewDetails(scope.row)" icon="el-icon-view">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              background
              layout="prev, pager, next, jumper, sizes, total"
              :total="profitabilityDetails.length"
              :page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 详情对话框 -->
    <el-dialog
      :title="dialog.title"
      :visible.sync="dialog.visible"
      width="90%"
      :close-on-click-modal="false"
    >
      <div class="detail-content">
        <div class="detail-header">
          <div class="detail-title">
            <h2>{{ currentDetail.name }}</h2>
            <span class="detail-period">{{ filterForm.dateRange ? `${formatDate(filterForm.dateRange[0])} 至 ${formatDate(filterForm.dateRange[1])}` : '全部期间' }}</span>
          </div>
          <div class="detail-status">
            <el-tag :type="getStatusTag(currentDetail.status)" size="medium">{{ currentDetail.status }}</el-tag>
          </div>
        </div>
        
        <div class="detail-metrics">
          <div class="metric-item">
            <div class="metric-label">营业收入</div>
            <div class="metric-value-large">{{ formatCurrency(currentDetail.revenue) }}</div>
            <div class="metric-trend" :class="getTrendClass(currentDetail.revenueTrend)">
              <i :class="currentDetail.revenueTrend > 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
              {{ Math.abs(currentDetail.revenueTrend).toFixed(2) }}%
            </div>
          </div>
          
          <div class="metric-item">
            <div class="metric-label">营业成本</div>
            <div class="metric-value-large">{{ formatCurrency(currentDetail.cost) }}</div>
            <div class="metric-trend" :class="getTrendClass(-currentDetail.costTrend)">
              <i :class="currentDetail.costTrend > 0 ? 'el-icon-caret-bottom' : 'el-icon-caret-top'"></i>
              {{ Math.abs(currentDetail.costTrend).toFixed(2) }}%
            </div>
          </div>
          
          <div class="metric-item">
            <div class="metric-label">毛利</div>
            <div class="metric-value-large">{{ formatCurrency(currentDetail.grossProfit) }}</div>
            <div class="metric-trend" :class="getTrendClass(currentDetail.grossProfitTrend)">
              <i :class="currentDetail.grossProfitTrend > 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
              {{ Math.abs(currentDetail.grossProfitTrend).toFixed(2) }}%
            </div>
          </div>
          
          <div class="metric-item">
            <div class="metric-label">净利润</div>
            <div class="metric-value-large">{{ formatCurrency(currentDetail.netProfit) }}</div>
            <div class="metric-trend" :class="getTrendClass(currentDetail.netProfitTrend)">
              <i :class="currentDetail.netProfitTrend > 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
              {{ Math.abs(currentDetail.netProfitTrend).toFixed(2) }}%
            </div>
          </div>
        </div>
        
        <div class="detail-charts">
          <div class="detail-chart-row">
            <div class="detail-chart-item">
              <h3>收入成本构成</h3>
              <div ref="revenueCostChart" class="detail-chart"></div>
            </div>
            
            <div class="detail-chart-item">
              <h3>盈利指标趋势</h3>
              <div ref="detailTrendChart" class="detail-chart"></div>
            </div>
          </div>
          
          <div class="detail-chart-full">
            <h3>盈利能力分析</h3>
            <div ref="analysisChart" class="detail-chart"></div>
          </div>
        </div>
        
        <div class="detail-details">
          <div class="detail-tabs">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="收入明细">
                <el-table
                  :data="currentDetail.revenueDetails"
                  style="width: 100%"
                  size="small"
                  border
                >
                  <el-table-column prop="item" label="项目" width="200" />
                  <el-table-column prop="amount" label="金额" width="150" align="right">
                    <template v-slot="scope">{{ formatCurrency(scope.row.amount) }}</template>
                  </el-table-column>
                  <el-table-column prop="percentage" label="占比" width="100" align="right">
                    <template v-slot="scope">{{ scope.row.percentage.toFixed(2) }}%</template>
                  </el-table-column>
                  <el-table-column prop="trend" label="环比" width="100" align="right">
                    <template v-slot="scope">
                      <span :class="getTrendClass(scope.row.trend)">
                        {{ scope.row.trend > 0 ? '+' : '' }}{{ scope.row.trend.toFixed(2) }}%
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="notes" label="说明" />
                </el-table>
              </el-tab-pane>
              
              <el-tab-pane label="成本明细">
                <el-table
                  :data="currentDetail.costDetails"
                  style="width: 100%"
                  size="small"
                  border
                >
                  <el-table-column prop="item" label="项目" width="200" />
                  <el-table-column prop="amount" label="金额" width="150" align="right">
                    <template v-slot="scope">{{ formatCurrency(scope.row.amount) }}</template>
                  </el-table-column>
                  <el-table-column prop="percentage" label="占比" width="100" align="right">
                    <template v-slot="scope">{{ scope.row.percentage.toFixed(2) }}%</template>
                  </el-table-column>
                  <el-table-column prop="trend" label="环比" width="100" align="right">
                    <template v-slot="scope">
                      <span :class="getTrendClass(-scope.row.trend)">
                        {{ scope.row.trend > 0 ? '+' : '' }}{{ scope.row.trend.toFixed(2) }}%
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="notes" label="说明" />
                </el-table>
              </el-tab-pane>
              
              <el-tab-pane label="分析报告">
                <div class="analysis-report">
                  <div class="report-section">
                    <h3>盈利能力总结</h3>
                    <p>{{ currentDetail.summary || '暂无总结信息' }}</p>
                  </div>
                  
                  <div class="report-section">
                    <h3>关键指标分析</h3>
                    <ul>
                      <li v-for="(analysis, index) in currentDetail.keyMetricsAnalysis" :key="index">
                        <strong>{{ analysis.metric }}:</strong> {{ analysis.description }}
                      </li>
                    </ul>
                  </div>
                  
                  <div class="report-section">
                    <h3>风险因素</h3>
                    <el-tag v-for="(risk, index) in currentDetail.risks" :key="index" type="danger" effect="plain" class="risk-tag">
                      {{ risk }}
                    </el-tag>
                  </div>
                  
                  <div class="report-section">
                    <h3>改进建议</h3>
                    <ol>
                      <li v-for="(suggestion, index) in currentDetail.suggestions" :key="index">
                        {{ suggestion }}
                      </li>
                    </ol>
                  </div>
                </div>
              </el-tab-pane>
              
              <el-tab-pane label="历史数据">
                <el-table
                  :data="currentDetail.historyData"
                  style="width: 100%"
                  size="small"
                  border
                >
                  <el-table-column prop="period" label="期间" width="150" />
                  <el-table-column prop="revenue" label="营业收入" width="150" align="right">
                    <template v-slot="scope">{{ formatCurrency(scope.row.revenue) }}</template>
                  </el-table-column>
                  <el-table-column prop="cost" label="营业成本" width="150" align="right">
                    <template v-slot="scope">{{ formatCurrency(scope.row.cost) }}</template>
                  </el-table-column>
                  <el-table-column prop="grossMargin" label="毛利率" width="100" align="right">
                    <template v-slot="scope">{{ scope.row.grossMargin.toFixed(2) }}%</template>
                  </el-table-column>
                  <el-table-column prop="netMargin" label="净利率" width="100" align="right">
                    <template v-slot="scope">{{ scope.row.netMargin.toFixed(2) }}%</template>
                  </el-table-column>
                  <el-table-column prop="roi" label="ROI" width="100" align="right">
                    <template v-slot="scope">{{ scope.row.roi.toFixed(2) }}%</template>
                  </el-table-column>
                </el-table>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="exportDetailReport">导出报告</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ProfitabilityChart',
  data() {
    return {
      filterForm: {
        dateRange: [new Date(new Date().setMonth(new Date().getMonth() - 6)), new Date()],
        dimension: 'department',
        metricType: 'all'
      },
      pageSize: 10,
      currentPage: 1,
      sortField: '',
      sortOrder: '',
      trendChartType: 'line',
      comparisonChartType: 'bar',
      dialog: {
        visible: false,
        title: ''
      },
      currentDetail: {},
      activeTab: '0',
      // 盈利能力指标
      grossMargin: 42.5,
      grossMarginTrend: 2.3,
      netMargin: 18.7,
      netMarginTrend: -1.2,
      roi: 28.3,
      roiTrend: 3.5,
      profitIndex: 85.6,
      profitIndexTrend: 4.2,
      // 盈利能力明细数据
      profitabilityDetails: [
        {
          id: 1,
          name: '研发中心',
          revenue: 12000000,
          cost: 6500000,
          grossProfit: 5500000,
          grossMargin: 45.83,
          netProfit: 2200000,
          netMargin: 18.33,
          roi: 33.85,
          trend: 5.2,
          status: '优秀',
          description: '负责公司核心产品研发，盈利能力强'
        },
        {
          id: 2,
          name: '生产中心',
          revenue: 8500000,
          cost: 5500000,
          grossProfit: 3000000,
          grossMargin: 35.29,
          netProfit: 1500000,
          netMargin: 17.65,
          roi: 27.27,
          trend: 2.1,
          status: '良好',
          description: '负责产品生产制造，保持稳定盈利'
        },
        {
          id: 3,
          name: '销售中心',
          revenue: 5600000,
          cost: 3200000,
          grossProfit: 2400000,
          grossMargin: 42.86,
          netProfit: 1100000,
          netMargin: 19.64,
          roi: 34.38,
          trend: -1.5,
          status: '良好',
          description: '负责产品销售与市场拓展'
        },
        {
          id: 4,
          name: '行政中心',
          revenue: 0,
          cost: 1200000,
          grossProfit: -1200000,
          grossMargin: -100,
          netProfit: -1200000,
          netMargin: -100,
          roi: -100,
          trend: 0,
          status: '成本中心',
          description: '行政支持部门，非盈利单位'
        },
        {
          id: 5,
          name: '财务中心',
          revenue: 0,
          cost: 800000,
          grossProfit: -800000,
          grossMargin: -100,
          netProfit: -800000,
          netMargin: -100,
          roi: -100,
          trend: 0,
          status: '成本中心',
          description: '财务管理部门，非盈利单位'
        },
        {
          id: 6,
          name: '客服中心',
          revenue: 200000,
          cost: 600000,
          grossProfit: -400000,
          grossMargin: -200,
          netProfit: -400000,
          netMargin: -200,
          roi: -66.67,
          trend: -3.2,
          status: '需改进',
          description: '客户服务部门，需要优化成本结构'
        }
      ],
      // 图表实例
      trendChart: null,
      comparisonChart: null,
      heatmapChart: null,
      revenueCostChart: null,
      detailTrendChart: null,
      analysisChart: null
    }
  },
  computed: {
    // 趋势图数据
    trendChartData() {
      return {
        periods: ['1月', '2月', '3月', '4月', '5月', '6月'],
        grossMargin: [38.5, 40.2, 41.1, 40.8, 42.0, 42.5],
        netMargin: [20.5, 19.8, 19.5, 19.2, 19.0, 18.7],
        roi: [22.1, 24.5, 25.8, 26.5, 27.2, 28.3]
      }
    },
    
    // 对比图数据
    comparisonChartData() {
      return [
        { name: '研发中心', grossMargin: 45.83, netMargin: 18.33, roi: 33.85 },
        { name: '生产中心', grossMargin: 35.29, netMargin: 17.65, roi: 27.27 },
        { name: '销售中心', grossMargin: 42.86, netMargin: 19.64, roi: 34.38 },
        { name: '客服中心', grossMargin: 0, netMargin: 0, roi: 0 }
      ]
    },
    
    // 热力图数据
    heatmapChartData() {
      const departments = ['研发中心', '生产中心', '销售中心', '客服中心']
      const metrics = ['毛利率', '净利率', 'ROI', '盈利指数']
      const data = []
      
      // 生成热力图数据
      departments.forEach((dept, i) => {
        metrics.forEach((metric, j) => {
          let value = 0
          switch (metric) {
            case '毛利率':
              value = i === 0 ? 45.83 : i === 1 ? 35.29 : i === 2 ? 42.86 : 0
              break
            case '净利率':
              value = i === 0 ? 18.33 : i === 1 ? 17.65 : i === 2 ? 19.64 : 0
              break
            case 'ROI':
              value = i === 0 ? 33.85 : i === 1 ? 27.27 : i === 2 ? 34.38 : 0
              break
            case '盈利指数':
              value = i === 0 ? 92 : i === 1 ? 78 : i === 2 ? 88 : 0
              break
          }
          data.push([j, i, value])
        })
      })
      
      return {
        departments,
        metrics,
        data
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
    this.disposeCharts()
  },
  methods: {
    formatCurrency(amount) {
      return '¥' + amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    
    formatDate(date) {
      if (!date) return ''
      const d = new Date(date)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    
    getTrendClass(trend) {
      if (trend > 0) return 'trend-up'
      if (trend < 0) return 'trend-down'
      return 'trend-neutral'
    },
    
    getStatusTag(status) {
      const tagMap = {
        '优秀': 'success',
        '良好': 'primary',
        '一般': 'info',
        '需改进': 'danger',
        '成本中心': 'warning'
      }
      return tagMap[status] || 'info'
    },
    
    initCharts() {
      this.initTrendChart()
      this.initComparisonChart()
      this.initHeatmapChart()
    },
    
    initTrendChart() {
      const chartDom = this.$refs.trendChart
      if (!chartDom) return
      
      this.trendChart = echarts.init(chartDom)
      const data = this.trendChartData
      
      const series = []
      if (this.filterForm.metricType === 'all' || this.filterForm.metricType === 'grossMargin') {
        series.push({
          name: '毛利率',
          type: this.trendChartType,
          data: data.grossMargin,
          smooth: true,
          itemStyle: { color: '#67c23a' },
          areaStyle: this.trendChartType === 'area' ? {} : undefined
        })
      }
      if (this.filterForm.metricType === 'all' || this.filterForm.metricType === 'netMargin') {
        series.push({
          name: '净利率',
          type: this.trendChartType,
          data: data.netMargin,
          smooth: true,
          itemStyle: { color: '#409eff' },
          areaStyle: this.trendChartType === 'area' ? {} : undefined
        })
      }
      if (this.filterForm.metricType === 'all' || this.filterForm.metricType === 'roi') {
        series.push({
          name: 'ROI',
          type: this.trendChartType,
          data: data.roi,
          smooth: true,
          itemStyle: { color: '#e6a23c' },
          areaStyle: this.trendChartType === 'area' ? {} : undefined
        })
      }
      
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              result += `${param.marker}${param.seriesName}: ${param.value.toFixed(2)}%<br/>`
            })
            return result
          }
        },
        legend: {
          data: ['毛利率', '净利率', 'ROI']
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
          data: data.periods
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: series
      }
      
      this.trendChart.setOption(option)
    },
    
    initComparisonChart() {
      const chartDom = this.$refs.comparisonChart
      if (!chartDom) return
      
      this.comparisonChart = echarts.init(chartDom)
      const data = this.comparisonChartData
      
      if (this.comparisonChartType === 'bar') {
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          legend: {
            data: ['毛利率', '净利率', 'ROI']
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: data.map(item => item.name)
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
              type: 'bar',
              data: data.map(item => item.grossMargin),
              itemStyle: { color: '#67c23a' }
            },
            {
              name: '净利率',
              type: 'bar',
              data: data.map(item => item.netMargin),
              itemStyle: { color: '#409eff' }
            },
            {
              name: 'ROI',
              type: 'bar',
              data: data.map(item => item.roi),
              itemStyle: { color: '#e6a23c' }
            }
          ]
        }
        this.comparisonChart.setOption(option)
      } else if (this.comparisonChartType === 'radar') {
        const option = {
          tooltip: {},
          legend: {
            data: data.map(item => item.name)
          },
          radar: {
            indicator: [
              { name: '毛利率', max: 50 },
              { name: '净利率', max: 30 },
              { name: 'ROI', max: 40 }
            ]
          },
          series: [
            {
              name: '盈利能力对比',
              type: 'radar',
              data: data.map((item, index) => {
                const colors = ['#67c23a', '#409eff', '#e6a23c', '#f56c6c']
                return {
                  value: [item.grossMargin, item.netMargin, item.roi],
                  name: item.name,
                  areaStyle: {
                    color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                      { color: colors[index], opacity: 0.8 },
                      { color: colors[index], opacity: 0.3 }
                    ])
                  }
                }
              })
            }
          ]
        }
        this.comparisonChart.setOption(option)
      }
    },
    
    initHeatmapChart() {
      const chartDom = this.$refs.heatmapChart
      if (!chartDom) return
      
      this.heatmapChart = echarts.init(chartDom)
      const data = this.heatmapChartData
      
      const option = {
        tooltip: {
          position: 'top',
          formatter: function(params) {
            return `${data.metrics[params.value[0]]} - ${data.departments[params.value[1]]}<br/>值: ${params.value[2].toFixed(2)}`
          }
        },
        grid: {
          height: '50%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: data.metrics,
          splitArea: {
            show: true
          }
        },
        yAxis: {
          type: 'category',
          data: data.departments,
          splitArea: {
            show: true
          }
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          }
        },
        series: [
          {
            name: '盈利能力分布',
            type: 'heatmap',
            data: data.data,
            label: {
              show: true,
              formatter: function(params) {
                return params.value[2].toFixed(1)
              }
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      this.heatmapChart.setOption(option)
    },
    
    initRevenueCostChart() {
      const chartDom = this.$refs.revenueCostChart
      if (!chartDom) return
      
      this.revenueCostChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '收入构成',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: this.currentDetail.revenue * 0.45, name: '产品销售' },
              { value: this.currentDetail.revenue * 0.35, name: '服务收入' },
              { value: this.currentDetail.revenue * 0.15, name: '其他收入' },
              { value: this.currentDetail.revenue * 0.05, name: '其他业务' }
            ]
          }
        ]
      }
      
      this.revenueCostChart.setOption(option)
    },
    
    initDetailTrendChart() {
      const chartDom = this.$refs.detailTrendChart
      if (!chartDom) return
      
      this.detailTrendChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['毛利率', '净利率']
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
          data: ['1月', '2月', '3月', '4月', '5月', '6月']
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
            data: [40, 41, 42, 43, 44, 45.83],
            smooth: true,
            itemStyle: { color: '#67c23a' }
          },
          {
            name: '净利率',
            type: 'line',
            data: [16, 17, 17.5, 18, 18.2, 18.33],
            smooth: true,
            itemStyle: { color: '#409eff' }
          }
        ]
      }
      
      this.detailTrendChart.setOption(option)
    },
    
    initAnalysisChart() {
      const chartDom = this.$refs.analysisChart
      if (!chartDom) return
      
      this.analysisChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
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
        xAxis: [
          {
            type: 'category',
            data: ['Q1', 'Q2', 'Q3', 'Q4'],
            axisPointer: {
              type: 'shadow'
            }
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '金额 (百万)',
            axisLabel: {
              formatter: '{value}'
            }
          }
        ],
        series: [
          {
            name: '收入',
            type: 'bar',
            stack: 'total',
            itemStyle: { color: '#67c23a' },
            emphasis: {
              focus: 'series'
            },
            data: [2.5, 2.8, 3.2, 3.5]
          },
          {
            name: '成本',
            type: 'bar',
            stack: 'total',
            itemStyle: { color: '#f56c6c' },
            emphasis: {
              focus: 'series'
            },
            data: [1.3, 1.5, 1.7, 1.8]
          },
          {
            name: '利润',
            type: 'line',
            itemStyle: { color: '#409eff' },
            emphasis: {
              focus: 'series'
            },
            data: [1.2, 1.3, 1.5, 1.7]
          }
        ]
      }
      
      this.analysisChart.setOption(option)
    },
    
    updateTrendChart() {
      this.initTrendChart()
    },
    
    updateComparisonChart() {
      this.initComparisonChart()
    },
    
    handleResize() {
      this.trendChart && this.trendChart.resize()
      this.comparisonChart && this.comparisonChart.resize()
      this.heatmapChart && this.heatmapChart.resize()
      this.revenueCostChart && this.revenueCostChart.resize()
      this.detailTrendChart && this.detailTrendChart.resize()
      this.analysisChart && this.analysisChart.resize()
    },
    
    disposeCharts() {
      this.trendChart && this.trendChart.dispose()
      this.comparisonChart && this.comparisonChart.dispose()
      this.heatmapChart && this.heatmapChart.dispose()
      this.revenueCostChart && this.revenueCostChart.dispose()
      this.detailTrendChart && this.detailTrendChart.dispose()
      this.analysisChart && this.analysisChart.dispose()
    },
    
    handleSortChange({ prop, order }) {
      this.sortField = prop
      this.sortOrder = order
    },
    
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    
    handleCurrentChange(current) {
      this.currentPage = current
    },
    
    refreshData() {
      // 模拟刷新数据
      this.$message.success('数据已刷新')
      this.initCharts()
    },
    
    exportData() {
      // 模拟导出数据
      this.$message.success('数据导出成功')
    },
    
    exportHeatmap() {
      // 模拟导出热力图
      this.$message.success('热力图导出成功')
    },
    
    exportReport() {
      // 模拟生成报告
      this.$message.success('报告生成成功')
    },
    
    viewDetails(detail) {
      this.currentDetail = {
        ...detail,
        // 添加详细数据
        revenueTrend: 8.5,
        costTrend: 6.2,
        grossProfitTrend: 12.5,
        netProfitTrend: 5.8,
        revenueDetails: [
          { item: '产品A销售', amount: 6000000, percentage: 50, trend: 12.5, notes: '主打产品销售' },
          { item: '产品B销售', amount: 3000000, percentage: 25, trend: 8.3, notes: '新产品销售' },
          { item: '服务收入', amount: 2400000, percentage: 20, trend: 15.6, notes: '技术服务' },
          { item: '其他收入', amount: 600000, percentage: 5, trend: -2.3, notes: '其他业务' }
        ],
        costDetails: [
          { item: '人员成本', amount: 3200000, percentage: 49.23, trend: 7.8, notes: '薪资福利' },
          { item: '研发材料', amount: 1800000, percentage: 27.69, trend: 4.5, notes: '研发用原材料' },
          { item: '设备折旧', amount: 800000, percentage: 12.31, trend: 0, notes: '固定资产折旧' },
          { item: '其他成本', amount: 700000, percentage: 10.77, trend: 3.2, notes: '其他费用' }
        ],
        summary: '研发中心整体盈利能力优秀，毛利率达到45.83%，高于公司平均水平。主要得益于产品A的市场表现良好以及成本控制有效。',
        keyMetricsAnalysis: [
          {
            metric: '毛利率',
            description: '毛利率45.83%，同比增长5.2%，主要是由于产品结构优化和高附加值产品比例提升。'
          },
          {
            metric: '净利率',
            description: '净利率18.33%，同比增长3.8%，显示出良好的成本控制能力。'
          },
          {
            metric: 'ROI',
            description: 'ROI达到33.85%，说明研发投入产出比较高，投资效率良好。'
          }
        ],
        risks: ['人力成本上升风险', '研发周期延长风险', '市场竞争加剧风险'],
        suggestions: [
          '继续优化产品结构，加大高附加值产品投入',
          '加强研发项目管理，提高研发效率',
          '建立更精准的成本控制机制',
          '关注人才梯队建设，降低人才流失风险'
        ],
        historyData: [
          { period: '2022-Q1', revenue: 8000000, cost: 5000000, grossMargin: 37.5, netMargin: 16.2, roi: 26.5 },
          { period: '2022-Q2', revenue: 9000000, cost: 5500000, grossMargin: 38.9, netMargin: 16.8, roi: 27.8 },
          { period: '2022-Q3', revenue: 10000000, cost: 6000000, grossMargin: 40.0, netMargin: 17.2, roi: 28.6 },
          { period: '2022-Q4', revenue: 11000000, cost: 6200000, grossMargin: 43.6, netMargin: 17.8, roi: 30.5 },
          { period: '2023-Q1', revenue: 11500000, cost: 6300000, grossMargin: 45.2, netMargin: 18.0, roi: 32.5 },
          { period: '2023-Q2', revenue: 12000000, cost: 6500000, grossMargin: 45.83, netMargin: 18.33, roi: 33.85 }
        ]
      }
      
      this.dialog = {
        visible: true,
        title: `盈利能力详情 - ${detail.name}`
      }
      
      this.$nextTick(() => {
        this.initRevenueCostChart()
        this.initDetailTrendChart()
        this.initAnalysisChart()
      })
    },
    
    exportDetailReport() {
      // 模拟导出详细报告
      this.$message.success('详细报告导出成功')
    }
  }
}
</script>

<style scoped>
.profitability-chart-container {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-form {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
}

.chart-content {
  gap: 20px;
  display: flex;
  flex-direction: column;
}

/* 指标卡片样式 */
.metric-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.metric-card {
  transition: all 0.3s ease;
  border-top: 4px solid #409eff;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.1);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.metric-header h3 {
  margin: 0;
  font-size: 16px;
  color: #606266;
}

.trend-icon {
  font-size: 14px;
  font-weight: bold;
}

.trend-icon.trend-up {
  color: #67c23a;
}

.trend-icon.trend-down {
  color: #f56c6c;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.metric-subtitle {
  font-size: 12px;
  color: #909399;
}

/* 图表区域样式 */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.chart-card,
.table-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header,
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.chart-header h3,
.table-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chart-actions,
.table-actions {
  display: flex;
  gap: 10px;
}

.chart-wrapper {
  height: 350px;
}

.chart {
  width: 100%;
  height: 100%;
}

/* 表格样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.trend-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.trend-badge.trend-up {
  background-color: #f0f9eb;
  color: #67c23a;
}

.trend-badge.trend-down {
  background-color: #fef0f0;
  color: #f56c6c;
}

.trend-badge.trend-neutral {
  background-color: #f4f4f5;
  color: #909399;
}

/* 对话框样式 */
.detail-content {
  max-height: 700px;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.detail-title h2 {
  margin: 0 0 5px 0;
  color: #303133;
}

.detail-period {
  color: #909399;
  font-size: 14px;
}

.detail-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric-item {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
}

.metric-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.metric-value-large {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.metric-trend {
  font-size: 14px;
  font-weight: bold;
}

.metric-trend.trend-up {
  color: #67c23a;
}

.metric-trend.trend-down {
  color: #f56c6c;
}

.detail-charts {
  margin-bottom: 30px;
}

.detail-chart-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.detail-chart-full {
  margin-bottom: 20px;
}

.detail-chart-item h3,
.detail-chart-full h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.detail-chart {
  width: 100%;
  height: 300px;
}

.detail-tabs {
  background: #fff;
  border-radius: 4px;
  padding: 0;
}

.analysis-report {
  padding: 20px;
}

.report-section {
  margin-bottom: 25px;
}

.report-section h3 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.report-section p {
  margin: 0 0 10px 0;
  color: #606266;
  line-height: 1.6;
}

.report-section ul,
.report-section ol {
  margin: 0;
  color: #606266;
  line-height: 1.8;
}

.report-section li {
  margin-bottom: 8px;
}

.risk-tag {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chart-row,
  .detail-chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .metric-cards,
  .detail-metrics {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .chart-header,
  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .chart-actions,
  .table-actions {
    justify-content: center;
  }
}
</style>