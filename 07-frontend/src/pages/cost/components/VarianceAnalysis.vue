<template>
  <div class="variance-analysis-container">
    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="分析期间">
          <el-date-picker
            v-model="filterForm.period"
            type="month"
            placeholder="选择月份"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="成本中心">
          <el-select v-model="filterForm.costCenter" placeholder="选择成本中心" clearable>
            <el-option v-for="center in costCenters" :key="center.id" :label="center.name" :value="center.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="成本项目">
          <el-input v-model="filterForm.costItem" placeholder="成本项目" clearable />
        </el-form-item>
        <el-form-item label="差异类型">
          <el-select v-model="filterForm.varianceType" placeholder="选择差异类型" clearable>
            <el-option label="有利差异" value="favorable" />
            <el-option label="不利差异" value="unfavorable" />
            <el-option label="无差异" value="none" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="refreshData" icon="el-icon-search">查询</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="analysis-content">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <el-card class="card-item">
          <div class="card-header">
            <h3>总差异金额</h3>
          </div>
          <div class="card-content">
            <div class="amount :class="getVarianceClass(totalVariance)">"{{ formatCurrency(totalVariance) }}"</div>
            <div class="percentage" :class="getVarianceClass(totalVariance)">
              ({{ totalVariancePercentage.toFixed(2) }}%)
            </div>
          </div>
        </el-card>
        
        <el-card class="card-item">
          <div class="card-header">
            <h3>有利差异</h3>
          </div>
          <div class="card-content">
            <div class="amount favorable">{{ formatCurrency(favorableVariance) }}</div>
            <div class="percentage favorable">{{ favorableVariancePercentage.toFixed(2) }}%</div>
          </div>
        </el-card>
        
        <el-card class="card-item">
          <div class="card-header">
            <h3>不利差异</h3>
          </div>
          <div class="card-content">
            <div class="amount unfavorable">{{ formatCurrency(unfavorableVariance) }}</div>
            <div class="percentage unfavorable">{{ unfavorableVariancePercentage.toFixed(2) }}%</div>
          </div>
        </el-card>
        
        <el-card class="card-item">
          <div class="card-header">
            <h3>差异项目数</h3>
          </div>
          <div class="card-content">
            <div class="amount">{{ varianceItemsCount }}</div>
            <div class="sub-text">其中异常项目 {{ abnormalItemsCount }}</div>
          </div>
        </el-card>
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3>成本差异分布</h3>
            </div>
            <div class="chart-content">
              <div ref="distributionChart" class="chart"></div>
            </div>
          </div>
          
          <div class="chart-card">
            <div class="chart-header">
              <h3>差异趋势分析</h3>
            </div>
            <div class="chart-content">
              <div ref="trendChart" class="chart"></div>
            </div>
          </div>
        </div>
        
        <div class="chart-card full-width">
          <div class="chart-header">
            <h3>成本中心差异对比</h3>
          </div>
          <div class="chart-content">
            <div ref="comparisonChart" class="chart"></div>
          </div>
        </div>
      </div>
      
      <!-- 差异明细表格 -->
      <div class="table-section">
        <div class="table-header">
          <h3>差异明细</h3>
          <div class="table-actions">
            <el-button type="primary" size="small" @click="exportData" icon="el-icon-download">导出</el-button>
            <el-button type="warning" size="small" @click="highlightAbnormal" icon="el-icon-warning">高亮异常</el-button>
          </div>
        </div>
        
        <el-table
          :data="filteredVarianceDetails"
          style="width: 100%"
          border
          @sort-change="handleSortChange"
        >
          <el-table-column prop="code" label="成本编码" width="120" />
          <el-table-column prop="costItem" label="成本项目" width="180">
            <template v-slot="scope">
              <el-tooltip :content="scope.row.description" placement="top">
                <div class="cost-item-name">{{ scope.row.costItem }}</div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="costCenter" label="成本中心" width="120" />
          <el-table-column prop="budgetAmount" label="预算金额" width="120" align="right" sortable="custom">
            <template v-slot="scope">
              <span class="amount">{{ formatCurrency(scope.row.budgetAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="actualAmount" label="实际金额" width="120" align="right" sortable="custom">
            <template v-slot="scope">
              <span class="amount">{{ formatCurrency(scope.row.actualAmount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="varianceAmount" label="差异金额" width="120" align="right" sortable="custom">
            <template v-slot="scope">
              <span :class="['amount', getVarianceClass(scope.row.varianceAmount)]">
                {{ formatCurrency(scope.row.varianceAmount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="variancePercentage" label="差异率" width="100" align="right" sortable="custom">
            <template v-slot="scope">
              <span :class="getVarianceClass(scope.row.varianceAmount)">
                {{ scope.row.variancePercentage.toFixed(2) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="varianceType" label="差异类型" width="100">
            <template v-slot="scope">
              <el-tag :type="getVarianceTypeTag(scope.row.varianceType)">
                {{ scope.row.varianceType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template v-slot="scope">
              <el-tag :type="getStatusTag(scope.row.status)">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responsible" label="负责人" width="100" />
          <el-table-column prop="period" label="期间" width="120" />
          <el-table-column label="操作" width="150" fixed="right">
            <template v-slot="scope">
              <el-button size="mini" type="primary" @click="viewDetails(scope.row)" icon="el-icon-view">查看</el-button>
              <el-button size="mini" type="success" @click="analyzeVariance(scope.row)" icon="el-icon-data-line">分析</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            background
            layout="prev, pager, next, jumper, sizes, total"
            :total="filteredVarianceDetails.length"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
    
    <!-- 差异详情对话框 -->
    <el-dialog
      :title="dialog.title"
      :visible.sync="dialog.visible"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="dialog.type === 'view'" class="variance-detail-content">
        <div class="detail-card">
          <div class="detail-header">
            <div class="header-info">
              <h3>{{ currentVariance.costItem }}</h3>
              <div class="detail-meta">
                <span class="meta-item"><strong>编码:</strong> {{ currentVariance.code }}</span>
                <span class="meta-item"><strong>成本中心:</strong> {{ currentVariance.costCenter }}</span>
                <span class="meta-item"><strong>期间:</strong> {{ currentVariance.period }}</span>
                <span class="meta-item"><strong>负责人:</strong> {{ currentVariance.responsible }}</span>
              </div>
            </div>
            <div class="variance-summary">
              <div class="summary-item">
                <label>差异金额:</label>
                <span :class="['amount', getVarianceClass(currentVariance.varianceAmount)]">
                  {{ formatCurrency(currentVariance.varianceAmount) }}
                </span>
              </div>
              <div class="summary-item">
                <label>差异率:</label>
                <span :class="['amount', getVarianceClass(currentVariance.varianceAmount)]">
                  {{ currentVariance.variancePercentage.toFixed(2) }}%
                </span>
              </div>
              <div class="summary-item">
                <label>差异类型:</label>
                <el-tag :type="getVarianceTypeTag(currentVariance.varianceType)">
                  {{ currentVariance.varianceType }}
                </el-tag>
              </div>
              <div class="summary-item">
                <label>状态:</label>
                <el-tag :type="getStatusTag(currentVariance.status)">
                  {{ currentVariance.status }}
                </el-tag>
              </div>
            </div>
          </div>
          
          <div class="detail-body">
            <!-- 对比数据 -->
            <div class="comparison-section">
              <h4>预算与实际对比</h4>
              <div class="comparison-table">
                <div class="comparison-row">
                  <div class="comparison-label">预算金额:</div>
                  <div class="comparison-value budget">{{ formatCurrency(currentVariance.budgetAmount) }}</div>
                </div>
                <div class="comparison-row">
                  <div class="comparison-label">实际金额:</div>
                  <div class="comparison-value actual">{{ formatCurrency(currentVariance.actualAmount) }}</div>
                </div>
                <div class="comparison-row">
                  <div class="comparison-label">差异金额:</div>
                  <div :class="['comparison-value', getVarianceClass(currentVariance.varianceAmount)]">
                    {{ formatCurrency(currentVariance.varianceAmount) }}
                  </div>
                </div>
                <div class="comparison-row">
                  <div class="comparison-label">差异率:</div>
                  <div :class="['comparison-value', getVarianceClass(currentVariance.varianceAmount)]">
                    {{ currentVariance.variancePercentage.toFixed(2) }}%
                  </div>
                </div>
              </div>
              <div ref="comparisonBarChart" class="comparison-chart"></div>
            </div>
            
            <!-- 成本明细 -->
            <div class="details-section">
              <h4>成本明细</h4>
              <div class="details-tabs">
                <el-tabs v-model="activeTab">
                  <el-tab-pane label="预算明细">
                    <el-table
                      :data="budgetDetails"
                      style="width: 100%"
                      size="small"
                    >
                      <el-table-column prop="item" label="明细项目" width="200" />
                      <el-table-column prop="amount" label="金额" width="120" align="right">
                        <template v-slot="scope">{{ formatCurrency(scope.row.amount) }}</template>
                      </el-table-column>
                      <el-table-column prop="percentage" label="占比" width="100" align="right">
                        <template v-slot="scope">{{ scope.row.percentage.toFixed(2) }}%</template>
                      </el-table-column>
                      <el-table-column prop="notes" label="说明" />
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane label="实际明细">
                    <el-table
                      :data="actualDetails"
                      style="width: 100%"
                      size="small"
                    >
                      <el-table-column prop="item" label="明细项目" width="200" />
                      <el-table-column prop="amount" label="金额" width="120" align="right">
                        <template v-slot="scope">{{ formatCurrency(scope.row.amount) }}</template>
                      </el-table-column>
                      <el-table-column prop="percentage" label="占比" width="100" align="right">
                        <template v-slot="scope">{{ scope.row.percentage.toFixed(2) }}%</template>
                      </el-table-column>
                      <el-table-column prop="notes" label="说明" />
                    </el-table>
                  </el-tab-pane>
                  <el-tab-pane label="差异分析">
                    <div class="analysis-result">
                      <h5>差异原因分析</h5>
                      <p>{{ currentVariance.analysis || '暂无分析结果，点击分析按钮生成' }}</p>
                      
                      <h5>改进建议</h5>
                      <p>{{ currentVariance.suggestions || '暂无建议，点击分析按钮生成' }}</p>
                      
                      <div class="analysis-actions">
                        <el-button type="primary" @click="analyzeVariance(currentVariance)">重新分析</el-button>
                        <el-button type="success" @click="saveAnalysis">保存分析结果</el-button>
                      </div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
            
            <!-- 历史趋势 -->
            <div class="history-section">
              <h4>历史趋势</h4>
              <div ref="historyChart" class="history-chart"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="variance-analysis-content">
        <div class="analysis-process">
          <el-steps :active="analysisStep" finish-status="success" size="small">
            <el-step title="数据收集" />
            <el-step title="差异计算" />
            <el-step title="原因分析" />
            <el-step title="生成建议" />
          </el-steps>
          
          <div class="analysis-content">
            <div v-if="analysisStep === 0" class="step-content">
              <p>正在收集数据，请稍候...</p>
            </div>
            <div v-else-if="analysisStep === 1" class="step-content">
              <p>正在计算差异，请稍候...</p>
            </div>
            <div v-else-if="analysisStep === 2" class="step-content">
              <p>正在分析原因，请稍候...</p>
            </div>
            <div v-else-if="analysisStep === 3" class="step-content">
              <div class="analysis-result">
                <h4>分析结果</h4>
                
                <div class="result-section">
                  <h5>差异原因</h5>
                  <p>{{ analysisResult.causes || '未能生成原因分析' }}</p>
                </div>
                
                <div class="result-section">
                  <h5>影响因素</h5>
                  <el-tag v-for="factor in analysisResult.factors" :key="factor" class="factor-tag" effect="plain">
                    {{ factor }}
                  </el-tag>
                </div>
                
                <div class="result-section">
                  <h5>改进建议</h5>
                  <ol>
                    <li v-for="(suggestion, index) in analysisResult.suggestions" :key="index">
                      {{ suggestion }}
                    </li>
                  </ol>
                </div>
                
                <div class="analysis-actions">
                  <el-button type="primary" @click="saveAnalysisResult">保存分析</el-button>
                  <el-button @click="dialog.visible = false">取消</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialog.visible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'VarianceAnalysis',
  data() {
    return {
      filterForm: {
        period: new Date(),
        costCenter: '',
        costItem: '',
        varianceType: ''
      },
      costCenters: [
        { id: 1, name: '研发中心' },
        { id: 2, name: '生产中心' },
        { id: 3, name: '销售中心' },
        { id: 4, name: '行政中心' },
        { id: 5, name: '财务中心' }
      ],
      varianceDetails: [
        {
          id: 1,
          code: 'VA001',
          costItem: '员工薪资',
          costCenter: '研发中心',
          budgetAmount: 250000,
          actualAmount: 256250,
          varianceAmount: 6250,
          variancePercentage: 2.5,
          varianceType: '不利差异',
          status: '已审核',
          responsible: '张三',
          period: '2023-10',
          description: '研发部门月度人员薪资费用'
        },
        {
          id: 2,
          code: 'VA002',
          costItem: '原材料采购',
          costCenter: '生产中心',
          budgetAmount: 200000,
          actualAmount: 180000,
          varianceAmount: -20000,
          variancePercentage: -10,
          varianceType: '有利差异',
          status: '已审核',
          responsible: '李四',
          period: '2023-10',
          description: '主要原材料采购成本'
        },
        {
          id: 3,
          code: 'VA003',
          costItem: '设备折旧',
          costCenter: '生产中心',
          budgetAmount: 85000,
          actualAmount: 85000,
          varianceAmount: 0,
          variancePercentage: 0,
          varianceType: '无差异',
          status: '已审核',
          responsible: '王五',
          period: '2023-10',
          description: '生产设备月度折旧'
        },
        {
          id: 4,
          code: 'VA004',
          costItem: '办公费用',
          costCenter: '行政中心',
          budgetAmount: 40000,
          actualAmount: 45000,
          varianceAmount: 5000,
          variancePercentage: 12.5,
          varianceType: '不利差异',
          status: '待审核',
          responsible: '赵六',
          period: '2023-10',
          description: '公司日常办公开支'
        },
        {
          id: 5,
          code: 'VA005',
          costItem: '市场推广',
          costCenter: '销售中心',
          budgetAmount: 80000,
          actualAmount: 75000,
          varianceAmount: -5000,
          variancePercentage: -6.25,
          varianceType: '有利差异',
          status: '已审核',
          responsible: '钱七',
          period: '2023-10',
          description: '产品市场推广费用'
        },
        {
          id: 6,
          code: 'VA006',
          costItem: '研发项目费用',
          costCenter: '研发中心',
          budgetAmount: 100000,
          actualAmount: 75000,
          varianceAmount: -25000,
          variancePercentage: -25,
          varianceType: '有利差异',
          status: '已审核',
          responsible: '孙八',
          period: '2023-10',
          description: '新产品研发投入'
        }
      ],
      pageSize: 10,
      currentPage: 1,
      sortField: '',
      sortOrder: '',
      dialog: {
        visible: false,
        title: '',
        type: 'view' // view, analyze
      },
      currentVariance: {},
      activeTab: '0',
      budgetDetails: [],
      actualDetails: [],
      analysisStep: 0,
      analysisResult: {
        causes: '',
        factors: [],
        suggestions: []
      },
      highlightAbnormalEnabled: false,
      // 图表实例
      distributionChart: null,
      trendChart: null,
      comparisonChart: null,
      comparisonBarChart: null,
      historyChart: null
    }
  },
  computed: {
    filteredVarianceDetails() {
      let result = [...this.varianceDetails]
      
      // 根据过滤条件筛选
      if (this.filterForm.costCenter) {
        result = result.filter(item => item.costCenter === this.filterForm.costCenter)
      }
      
      if (this.filterForm.costItem) {
        result = result.filter(item => item.costItem.includes(this.filterForm.costItem))
      }
      
      if (this.filterForm.varianceType) {
        const typeMap = {
          'favorable': '有利差异',
          'unfavorable': '不利差异',
          'none': '无差异'
        }
        result = result.filter(item => item.varianceType === typeMap[this.filterForm.varianceType])
      }
      
      // 按字段排序
      if (this.sortField) {
        result.sort((a, b) => {
          let valueA = a[this.sortField]
          let valueB = b[this.sortField]
          
          if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase()
            valueB = valueB.toLowerCase()
          }
          
          if (this.sortOrder === 'ascending') {
            return valueA > valueB ? 1 : -1
          } else {
            return valueA < valueB ? 1 : -1
          }
        })
      }
      
      return result
    },
    
    paginatedVarianceDetails() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredVarianceDetails.slice(start, end)
    },
    
    // 计算总差异
    totalVariance() {
      return this.varianceDetails.reduce((sum, item) => sum + item.varianceAmount, 0)
    },
    
    // 计算总差异率
    totalVariancePercentage() {
      const totalBudget = this.varianceDetails.reduce((sum, item) => sum + item.budgetAmount, 0)
      const totalActual = this.varianceDetails.reduce((sum, item) => sum + item.actualAmount, 0)
      return totalBudget ? ((totalActual - totalBudget) / totalBudget) * 100 : 0
    },
    
    // 计算有利差异
    favorableVariance() {
      return this.varianceDetails
        .filter(item => item.varianceAmount < 0)
        .reduce((sum, item) => sum + Math.abs(item.varianceAmount), 0)
    },
    
    // 计算有利差异率
    favorableVariancePercentage() {
      const favorableTotal = this.favorableVariance
      const totalBudget = this.varianceDetails.reduce((sum, item) => sum + item.budgetAmount, 0)
      return totalBudget ? (favorableTotal / totalBudget) * 100 : 0
    },
    
    // 计算不利差异
    unfavorableVariance() {
      return this.varianceDetails
        .filter(item => item.varianceAmount > 0)
        .reduce((sum, item) => sum + item.varianceAmount, 0)
    },
    
    // 计算不利差异率
    unfavorableVariancePercentage() {
      const unfavorableTotal = this.unfavorableVariance
      const totalBudget = this.varianceDetails.reduce((sum, item) => sum + item.budgetAmount, 0)
      return totalBudget ? (unfavorableTotal / totalBudget) * 100 : 0
    },
    
    // 计算差异项目数
    varianceItemsCount() {
      return this.varianceDetails.length
    },
    
    // 计算异常项目数（差异率超过10%）
    abnormalItemsCount() {
      return this.varianceDetails.filter(item => Math.abs(item.variancePercentage) > 10).length
    },
    
    // 图表数据
    distributionChartData() {
      const favorable = this.varianceDetails.filter(item => item.varianceType === '有利差异').length
      const unfavorable = this.varianceDetails.filter(item => item.varianceType === '不利差异').length
      const none = this.varianceDetails.filter(item => item.varianceType === '无差异').length
      
      return [
        { name: '有利差异', value: favorable },
        { name: '不利差异', value: unfavorable },
        { name: '无差异', value: none }
      ]
    },
    
    trendChartData() {
      return {
        months: ['6月', '7月', '8月', '9月', '10月'],
        favorable: [50000, 45000, 60000, 40000, 50000],
        unfavorable: [30000, 35000, 25000, 40000, 11250]
      }
    },
    
    comparisonChartData() {
      const centers = [...new Set(this.varianceDetails.map(item => item.costCenter))]
      const data = centers.map(center => {
        const items = this.varianceDetails.filter(item => item.costCenter === center)
        const variance = items.reduce((sum, item) => sum + item.varianceAmount, 0)
        return {
          name: center,
          variance: variance
        }
      })
      return data
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
    
    getVarianceClass(variance) {
      if (variance < 0) return 'favorable'
      if (variance > 0) return 'unfavorable'
      return 'neutral'
    },
    
    getVarianceTypeTag(type) {
      const tagMap = {
        '有利差异': 'success',
        '不利差异': 'danger',
        '无差异': 'info'
      }
      return tagMap[type] || 'info'
    },
    
    getStatusTag(status) {
      const tagMap = {
        '已审核': 'success',
        '待审核': 'warning',
        '异常': 'danger'
      }
      return tagMap[status] || 'info'
    },
    
    initCharts() {
      this.initDistributionChart()
      this.initTrendChart()
      this.initComparisonChart()
    },
    
    initDistributionChart() {
      const chartDom = this.$refs.distributionChart
      if (!chartDom) return
      
      this.distributionChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: ['有利差异', '不利差异', '无差异']
        },
        series: [
          {
            name: '差异分布',
            type: 'pie',
            radius: '60%',
            data: this.distributionChartData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            itemStyle: {
              normal: {
                color: function(params) {
                  const colors = ['#67c23a', '#f56c6c', '#909399']
                  return colors[params.dataIndex]
                }
              }
            }
          }
        ]
      }
      this.distributionChart.setOption(option)
    },
    
    initTrendChart() {
      const chartDom = this.$refs.trendChart
      if (!chartDom) return
      
      this.trendChart = echarts.init(chartDom)
      const data = this.trendChartData
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
          data: ['有利差异', '不利差异']
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
          data: data.months
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
            name: '有利差异',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: data.favorable,
            itemStyle: {
              color: '#67c23a'
            }
          },
          {
            name: '不利差异',
            type: 'line',
            stack: 'Total',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: data.unfavorable,
            itemStyle: {
              color: '#f56c6c'
            }
          }
        ]
      }
      this.trendChart.setOption(option)
    },
    
    initComparisonChart() {
      const chartDom = this.$refs.comparisonChart
      if (!chartDom) return
      
      this.comparisonChart = echarts.init(chartDom)
      const data = this.comparisonChartData
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            const value = params[0].value
            const sign = value < 0 ? '-' : ''
            return `${params[0].name}<br/>${params[0].marker}差异金额: ${sign}¥${Math.abs(value).toLocaleString()}`
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
          data: data.map(item => item.name)
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
            name: '差异金额',
            type: 'bar',
            data: data.map(item => item.variance),
            itemStyle: {
              normal: {
                color: function(params) {
                  return params.value < 0 ? '#67c23a' : '#f56c6c'
                }
              }
            },
            label: {
              show: true,
              position: 'top',
              formatter: function(params) {
                const value = params.value
                const sign = value < 0 ? '-' : '+'
                return `${sign}¥${Math.abs(value).toLocaleString()}`
              }
            }
          }
        ]
      }
      this.comparisonChart.setOption(option)
    },
    
    initComparisonBarChart() {
      const chartDom = this.$refs.comparisonBarChart
      if (!chartDom) return
      
      this.comparisonBarChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            let result = ''
            params.forEach(param => {
              result += `${param.marker}${param.seriesName}: ¥${param.value.toLocaleString()}<br/>`
            })
            return result
          }
        },
        legend: {
          data: ['预算金额', '实际金额']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['金额']
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
            name: '预算金额',
            type: 'bar',
            data: [this.currentVariance.budgetAmount],
            itemStyle: {
              color: '#409eff'
            }
          },
          {
            name: '实际金额',
            type: 'bar',
            data: [this.currentVariance.actualAmount],
            itemStyle: {
              color: '#67c23a'
            }
          }
        ]
      }
      this.comparisonBarChart.setOption(option)
    },
    
    initHistoryChart() {
      const chartDom = this.$refs.historyChart
      if (!chartDom) return
      
      this.historyChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              const sign = param.seriesName === '预算金额' ? '' : (param.value < 0 ? '-' : '+')
              result += `${param.marker}${param.seriesName}: ${sign}¥${Math.abs(param.value).toLocaleString()}<br/>`
            })
            return result
          }
        },
        legend: {
          data: ['预算金额', '实际金额', '差异金额']
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
          data: ['6月', '7月', '8月', '9月', '10月']
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
            name: '预算金额',
            type: 'line',
            data: [240000, 245000, 250000, 255000, 250000],
            itemStyle: {
              color: '#409eff'
            }
          },
          {
            name: '实际金额',
            type: 'line',
            data: [235000, 240000, 245000, 250000, 245000],
            itemStyle: {
              color: '#67c23a'
            }
          },
          {
            name: '差异金额',
            type: 'line',
            data: [-5000, -5000, -5000, -5000, -5000],
            itemStyle: {
              color: '#f56c6c'
            }
          }
        ]
      }
      this.historyChart.setOption(option)
    },
    
    handleResize() {
      this.distributionChart && this.distributionChart.resize()
      this.trendChart && this.trendChart.resize()
      this.comparisonChart && this.comparisonChart.resize()
      this.comparisonBarChart && this.comparisonBarChart.resize()
      this.historyChart && this.historyChart.resize()
    },
    
    disposeCharts() {
      this.distributionChart && this.distributionChart.dispose()
      this.trendChart && this.trendChart.dispose()
      this.comparisonChart && this.comparisonChart.dispose()
      this.comparisonBarChart && this.comparisonBarChart.dispose()
      this.historyChart && this.historyChart.dispose()
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
    },
    
    exportData() {
      // 模拟导出数据
      this.$message.success('导出成功')
    },
    
    highlightAbnormal() {
      this.highlightAbnormalEnabled = !this.highlightAbnormalEnabled
      this.$message.success(this.highlightAbnormalEnabled ? '已开启异常高亮' : '已关闭异常高亮')
    },
    
    viewDetails(variance) {
      this.currentVariance = { ...variance }
      // 模拟加载详细数据
      this.budgetDetails = [
        { item: '基本工资', amount: 150000, percentage: 60, notes: '月度基本工资' },
        { item: '绩效奖金', amount: 60000, percentage: 24, notes: '月度绩效发放' },
        { item: '社保公积金', amount: 30000, percentage: 12, notes: '社保及公积金缴纳' },
        { item: '其他补贴', amount: 10000, percentage: 4, notes: '交通、餐补等' }
      ]
      this.actualDetails = [
        { item: '基本工资', amount: 150000, percentage: 58.54, notes: '月度基本工资' },
        { item: '绩效奖金', amount: 66250, percentage: 25.86, notes: '月度绩效发放' },
        { item: '社保公积金', amount: 30000, percentage: 11.70, notes: '社保及公积金缴纳' },
        { item: '其他补贴', amount: 10000, percentage: 3.90, notes: '交通、餐补等' }
      ]
      this.dialog = {
        visible: true,
        title: `差异详情 - ${variance.costItem}`,
        type: 'view'
      }
      this.$nextTick(() => {
        this.initComparisonBarChart()
        this.initHistoryChart()
      })
    },
    
    analyzeVariance(variance) {
      this.currentVariance = { ...variance }
      this.analysisStep = 0
      this.dialog = {
        visible: true,
        title: `差异分析 - ${variance.costItem}`,
        type: 'analyze'
      }
      
      // 模拟分析过程
      this.simulateAnalysis()
    },
    
    simulateAnalysis() {
      // 模拟分析步骤
      setTimeout(() => {
        this.analysisStep = 1
        setTimeout(() => {
          this.analysisStep = 2
          setTimeout(() => {
            this.analysisStep = 3
            // 设置分析结果
            this.analysisResult = {
              causes: `该成本项目存在${this.currentVariance.variancePercentage.toFixed(2)}%的${this.currentVariance.varianceType}。主要原因是${this.currentVariance.varianceAmount > 0 ? '绩效奖金发放超出预期' : '采购成本降低，议价能力提升'}。`,
              factors: ['绩效考核标准调整', '人员变动', '市场价格波动', '管理流程优化'],
              suggestions: [
                '建立更精确的预算编制模型，考虑更多影响因素',
                '加强成本控制，特别是变动成本的管理',
                '定期审查绩效标准，确保与实际情况相符',
                '优化采购流程，进一步降低采购成本'
              ]
            }
          }, 1000)
        }, 1000)
      }, 1000)
    },
    
    saveAnalysisResult() {
      // 将分析结果保存到当前差异对象
      this.currentVariance.analysis = this.analysisResult.causes
      this.currentVariance.suggestions = this.analysisResult.suggestions.join('\n')
      this.currentVariance.status = '已分析'
      
      // 更新列表中的数据
      const index = this.varianceDetails.findIndex(item => item.id === this.currentVariance.id)
      if (index > -1) {
        this.varianceDetails[index] = { ...this.currentVariance }
      }
      
      this.dialog.visible = false
      this.$message.success('分析结果已保存')
    },
    
    saveAnalysis() {
      // 模拟保存分析
      this.$message.success('分析结果已保存')
    }
  }
}
</script>

<style scoped>
.variance-analysis-container {
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

.analysis-content {
  gap: 20px;
  display: flex;
  flex-direction: column;
}

/* 概览卡片样式 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.card-item {
  transition: all 0.3s ease;
}

.card-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.1);
}

.card-header h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #606266;
}

.card-content {
  text-align: center;
}

.card-content .amount {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.card-content .percentage {
  font-size: 14px;
}

.amount.favorable,
.percentage.favorable {
  color: #67c23a;
}

.amount.unfavorable,
.percentage.unfavorable {
  color: #f56c6c;
}

.amount.neutral,
.percentage.neutral {
  color: #909399;
}

.card-content .sub-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
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

.chart-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.chart-card.full-width {
  grid-column: 1 / -1;
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

/* 表格区域样式 */
.table-section {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 10px;
}

.cost-item-name {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 对话框样式 */
.variance-detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-card {
  background: #f5f7fa;
  border-radius: 4px;
  padding: 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-info h3 {
  margin: 0 0 10px 0;
  color: #303133;
}

.detail-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 14px;
  color: #606266;
}

.variance-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-item label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
}

.detail-body {
  padding: 20px;
}

.comparison-section {
  margin-bottom: 30px;
}

.comparison-section h4,
.details-section h4,
.history-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.comparison-table {
  background: #fff;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
}

.comparison-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ebeef5;
}

.comparison-row:last-child {
  border-bottom: none;
}

.comparison-label {
  font-weight: 500;
  color: #606266;
}

.comparison-value {
  font-weight: bold;
}

.comparison-value.budget {
  color: #409eff;
}

.comparison-value.actual {
  color: #67c23a;
}

.comparison-chart {
  width: 100%;
  height: 200px;
}

.details-tabs {
  background: #fff;
  border-radius: 4px;
  padding: 15px;
}

.analysis-result {
  background: #fff;
  border-radius: 4px;
  padding: 20px;
}

.analysis-result h5 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 14px;
}

.analysis-result p {
  margin: 0 0 20px 0;
  color: #606266;
  line-height: 1.6;
}

.analysis-result ol {
  margin: 0 0 20px 0;
  color: #606266;
  line-height: 1.6;
}

.analysis-result li {
  margin-bottom: 8px;
}

.analysis-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.result-section {
  margin-bottom: 20px;
}

.factor-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.history-chart {
  width: 100%;
  height: 300px;
}

/* 分析过程样式 */
.variance-analysis-content {
  padding: 20px 0;
}

.analysis-process {
  max-width: 600px;
  margin: 0 auto;
}

.step-content {
  margin-top: 30px;
  text-align: center;
  padding: 40px 0;
  background: #f5f7fa;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .detail-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .detail-meta {
    flex-direction: column;
    gap: 10px;
  }
  
  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .table-actions {
    justify-content: center;
  }
}
</style>