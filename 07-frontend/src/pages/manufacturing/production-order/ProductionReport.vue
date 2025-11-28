<template>
  <div class="production-report">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack" type="text">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>生产报表管理</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleExportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button @click="handleSettings">
          <el-icon><Setting /></el-icon>
          设置
        </el-button>
      </div>
    </div>

    <!-- 报表筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" label-width="100px">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="['00:00:00', '23:59:59']"
          />
        </el-form-item>
        <el-form-item label="报表类型">
          <el-select v-model="filterForm.reportType" placeholder="请选择报表类型">
            <el-option label="日报表" value="daily" />
            <el-option label="周报表" value="weekly" />
            <el-option label="月报表" value="monthly" />
            <el-option label="季度报表" value="quarterly" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产车间">
          <el-select v-model="filterForm.workshopId" placeholder="请选择生产车间">
            <el-option label="全部" value="" />
            <el-option label="装配车间" value="workshop1" />
            <el-option label="测试车间" value="workshop2" />
            <el-option label="电子车间" value="workshop3" />
            <el-option label="组装车间" value="workshop4" />
            <el-option label="线缆车间" value="workshop5" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品类别">
          <el-select v-model="filterForm.productCategory" placeholder="请选择产品类别">
            <el-option label="全部" value="" />
            <el-option label="智能控制器" value="controller" />
            <el-option label="传感器" value="sensor" />
            <el-option label="电源模块" value="power" />
            <el-option label="控制面板" value="panel" />
            <el-option label="连接线束" value="cable" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleGenerateReport">生成报表</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据概览卡片 -->
    <div class="overview-cards">
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ summary.totalProduction }}</div>
          <div class="overview-label">总产量</div>
        </div>
        <el-icon class="overview-icon"><TrendCharts /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ summary.qualifiedRate }}%</div>
          <div class="overview-label">合格率</div>
        </div>
        <el-icon class="overview-icon"><Check /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ summary.overdueOrders }}</div>
          <div class="overview-label">逾期订单</div>
        </div>
        <el-icon class="overview-icon"><Warning /></el-icon>
      </el-card>
      <el-card class="overview-card">
        <div class="overview-content">
          <div class="overview-number">{{ summary.efficiencyRate }}%</div>
          <div class="overview-label">生产效率</div>
        </div>
        <el-icon class="overview-icon"><Timer /></el-icon>
      </el-card>
    </div>

    <!-- 图表展示区域 -->
    <div class="chart-container">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>生产趋势分析</span>
            <el-select v-model="chartOptions.timeUnit" size="small" @change="updateCharts">
              <el-option label="日" value="day" />
              <el-option label="周" value="week" />
              <el-option label="月" value="month" />
            </el-select>
          </div>
        </template>
        <div class="chart-wrapper">
          <div ref="productionTrendChartRef" class="chart"></div>
        </div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>产品产量分布</span>
            <el-select v-model="chartOptions.chartType" size="small" @change="updateCharts">
              <el-option label="饼图" value="pie" />
              <el-option label="柱状图" value="bar" />
            </el-select>
          </div>
        </template>
        <div class="chart-wrapper">
          <div ref="productDistributionChartRef" class="chart"></div>
        </div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>质量趋势分析</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <div ref="qualityTrendChartRef" class="chart"></div>
        </div>
      </el-card>
      
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>车间产能利用率</span>
          </div>
        </template>
        <div class="chart-wrapper">
          <div ref="workshopUtilizationChartRef" class="chart"></div>
        </div>
      </el-card>
    </div>

    <!-- 详细报表数据 -->
    <el-card class="report-data-card">
      <template #header>
        <div class="card-header">
          <span>详细报表数据</span>
          <el-button size="small" @click="handleToggleTableExpand">
            {{ isTableExpanded ? '收起' : '展开' }}
          </el-button>
        </div>
      </template>
      
      <div v-if="isTableExpanded" class="table-container">
        <el-table
          v-loading="loading"
          :data="reportData"
          stripe
          show-summary
          :summary-method="getSummary"
        >
          <el-table-column prop="date" label="日期" width="150" />
          <el-table-column prop="productCode" label="产品编码" width="120" />
          <el-table-column prop="productName" label="产品名称" width="180" />
          <el-table-column prop="workshopName" label="生产车间" width="120" />
          <el-table-column prop="plannedQuantity" label="计划数量" width="100" align="right" />
          <el-table-column prop="actualQuantity" label="实际产量" width="100" align="right" />
          <el-table-column prop="completionRate" label="完成率" width="100" align="right">
            <template #default="{ row }">
              <span>{{ row.completionRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="qualifiedQuantity" label="合格数量" width="100" align="right" />
          <el-table-column prop="unqualifiedQuantity" label="不合格数量" width="120" align="right" />
          <el-table-column prop="qualifiedRate" label="合格率" width="100" align="right">
            <template #default="{ row }">
              <span :class="getQualifiedRateClass(row.qualifiedRate)">{{ row.qualifiedRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="defectRate" label="不良率" width="100" align="right">
            <template #default="{ row }">
              <span :class="getDefectRateClass(row.defectRate)">{{ row.defectRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="workHours" label="工时" width="100" align="right" />
          <el-table-column prop="remarks" label="备注" />
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
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
    </el-card>

    <!-- 报表设置对话框 -->
    <el-dialog
      v-model="settingsDialogVisible"
      title="报表设置"
      width="600px"
      @close="handleSettingsDialogClose"
    >
      <el-form :model="reportSettings" label-width="120px">
        <el-form-item label="默认时间范围">
          <el-radio-group v-model="reportSettings.defaultTimeRange">
            <el-radio :label="'today'">今日</el-radio>
            <el-radio :label="'week'">本周</el-radio>
            <el-radio :label="'month'">本月</el-radio>
            <el-radio :label="'quarter'">本季度</el-radio>
            <el-radio :label="'custom'">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="显示图表类型">
          <el-checkbox-group v-model="reportSettings.visibleCharts">
            <el-checkbox label="productionTrend">生产趋势</el-checkbox>
            <el-checkbox label="productDistribution">产品分布</el-checkbox>
            <el-checkbox label="qualityTrend">质量趋势</el-checkbox>
            <el-checkbox label="workshopUtilization">车间利用率</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="数据刷新频率">
          <el-select v-model="reportSettings.refreshInterval">
            <el-option label="不自动刷新" value="0" />
            <el-option label="5分钟" value="5" />
            <el-option label="15分钟" value="15" />
            <el-option label="30分钟" value="30" />
            <el-option label="1小时" value="60" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出格式">
          <el-checkbox-group v-model="reportSettings.exportFormats">
            <el-checkbox label="excel">Excel</el-checkbox>
            <el-checkbox label="pdf">PDF</el-checkbox>
            <el-checkbox label="csv">CSV</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSettings">保存设置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft, Download, Refresh, Setting, TrendCharts, Check, Warning, Timer } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

// 报表数据类型定义
interface ReportData {
  date: string
  productCode: string
  productName: string
  workshopName: string
  plannedQuantity: number
  actualQuantity: number
  completionRate: number
  qualifiedQuantity: number
  unqualifiedQuantity: number
  qualifiedRate: number
  defectRate: number
  workHours: number
  remarks?: string
}

// 响应式数据
const loading = ref(false)
const isTableExpanded = ref(false)
const settingsDialogVisible = ref(false)
const productionTrendChartRef = ref<HTMLElement>()
const productDistributionChartRef = ref<HTMLElement>()
const qualityTrendChartRef = ref<HTMLElement>()
const workshopUtilizationChartRef = ref<HTMLElement>()
let productionTrendChart: echarts.ECharts | null = null
let productDistributionChart: echarts.ECharts | null = null
let qualityTrendChart: echarts.ECharts | null = null
let workshopUtilizationChart: echarts.ECharts | null = null
let refreshTimer: number | null = null

// 筛选表单
const filterForm = reactive({
  dateRange: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()] as [Date, Date],
  reportType: 'daily',
  workshopId: '',
  productCategory: ''
})

// 图表选项
const chartOptions = reactive({
  timeUnit: 'day',
  chartType: 'pie'
})

// 报表设置
const reportSettings = reactive({
  defaultTimeRange: 'month',
  visibleCharts: ['productionTrend', 'productDistribution', 'qualityTrend', 'workshopUtilization'],
  refreshInterval: 15,
  exportFormats: ['excel', 'pdf']
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 数据概览
const summary = reactive({
  totalProduction: 0,
  qualifiedRate: 0,
  overdueOrders: 0,
  efficiencyRate: 0
})

// 报表数据
const reportData = ref<ReportData[]>([])

// 生成报表
const handleGenerateReport = async () => {
  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟详细报表数据
    const mockData: ReportData[] = [
      { date: '2024-01-10', productCode: 'PROD001', productName: '智能控制器', workshopName: '装配车间', plannedQuantity: 200, actualQuantity: 180, completionRate: 90, qualifiedQuantity: 175, unqualifiedQuantity: 5, qualifiedRate: 97.2, defectRate: 2.8, workHours: 80 },
      { date: '2024-01-10', productCode: 'PROD002', productName: '传感器模组', workshopName: '测试车间', plannedQuantity: 150, actualQuantity: 145, completionRate: 96.7, qualifiedQuantity: 140, unqualifiedQuantity: 5, qualifiedRate: 96.6, defectRate: 3.4, workHours: 65 },
      { date: '2024-01-09', productCode: 'PROD001', productName: '智能控制器', workshopName: '装配车间', plannedQuantity: 200, actualQuantity: 195, completionRate: 97.5, qualifiedQuantity: 190, unqualifiedQuantity: 5, qualifiedRate: 97.4, defectRate: 2.6, workHours: 82 },
      { date: '2024-01-09', productCode: 'PROD003', productName: '电源模块', workshopName: '电子车间', plannedQuantity: 100, actualQuantity: 105, completionRate: 105, qualifiedQuantity: 102, unqualifiedQuantity: 3, qualifiedRate: 97.1, defectRate: 2.9, workHours: 50 },
      { date: '2024-01-08', productCode: 'PROD001', productName: '智能控制器', workshopName: '装配车间', plannedQuantity: 200, actualQuantity: 190, completionRate: 95, qualifiedQuantity: 185, unqualifiedQuantity: 5, qualifiedRate: 97.4, defectRate: 2.6, workHours: 80 },
      { date: '2024-01-08', productCode: 'PROD002', productName: '传感器模组', workshopName: '测试车间', plannedQuantity: 150, actualQuantity: 148, completionRate: 98.7, qualifiedQuantity: 145, unqualifiedQuantity: 3, qualifiedRate: 98.0, defectRate: 2.0, workHours: 65 },
      { date: '2024-01-08', productCode: 'PROD004', productName: '控制面板', workshopName: '组装车间', plannedQuantity: 250, actualQuantity: 240, completionRate: 96, qualifiedQuantity: 235, unqualifiedQuantity: 5, qualifiedRate: 97.9, defectRate: 2.1, workHours: 95 },
      { date: '2024-01-07', productCode: 'PROD001', productName: '智能控制器', workshopName: '装配车间', plannedQuantity: 200, actualQuantity: 205, completionRate: 102.5, qualifiedQuantity: 200, unqualifiedQuantity: 5, qualifiedRate: 97.6, defectRate: 2.4, workHours: 85 },
      { date: '2024-01-07', productCode: 'PROD005', productName: '连接线束', workshopName: '线缆车间', plannedQuantity: 500, actualQuantity: 490, completionRate: 98, qualifiedQuantity: 485, unqualifiedQuantity: 5, qualifiedRate: 99.0, defectRate: 1.0, workHours: 75 },
      { date: '2024-01-06', productCode: 'PROD001', productName: '智能控制器', workshopName: '装配车间', plannedQuantity: 200, actualQuantity: 195, completionRate: 97.5, qualifiedQuantity: 190, unqualifiedQuantity: 5, qualifiedRate: 97.4, defectRate: 2.6, workHours: 80 },
      { date: '2024-01-06', productCode: 'PROD002', productName: '传感器模组', workshopName: '测试车间', plannedQuantity: 150, actualQuantity: 155, completionRate: 103.3, qualifiedQuantity: 150, unqualifiedQuantity: 5, qualifiedRate: 96.8, defectRate: 3.2, workHours: 70 },
      { date: '2024-01-06', productCode: 'PROD003', productName: '电源模块', workshopName: '电子车间', plannedQuantity: 100, actualQuantity: 100, completionRate: 100, qualifiedQuantity: 98, unqualifiedQuantity: 2, qualifiedRate: 98.0, defectRate: 2.0, workHours: 50 },
    ]
    
    // 过滤数据
    let filteredData = [...mockData]
    if (filterForm.workshopId) {
      const workshopMap: Record<string, string> = {
        'workshop1': '装配车间',
        'workshop2': '测试车间',
        'workshop3': '电子车间',
        'workshop4': '组装车间',
        'workshop5': '线缆车间'
      }
      filteredData = filteredData.filter(item => item.workshopName === workshopMap[filterForm.workshopId])
    }
    
    if (filterForm.productCategory) {
      const categoryMap: Record<string, string> = {
        'controller': '智能控制器',
        'sensor': '传感器模组',
        'power': '电源模块',
        'panel': '控制面板',
        'cable': '连接线束'
      }
      filteredData = filteredData.filter(item => item.productName === categoryMap[filterForm.productCategory])
    }
    
    // 更新报表数据
    pagination.total = filteredData.length
    reportData.value = filteredData.slice(
      (pagination.currentPage - 1) * pagination.pageSize,
      pagination.currentPage * pagination.pageSize
    )
    
    // 更新数据概览
    const totalQuantity = filteredData.reduce((sum, item) => sum + item.actualQuantity, 0)
    const qualifiedQuantity = filteredData.reduce((sum, item) => sum + item.qualifiedQuantity, 0)
    const totalPlannedQuantity = filteredData.reduce((sum, item) => sum + item.plannedQuantity, 0)
    const actualTotalQuantity = filteredData.reduce((sum, item) => sum + item.actualQuantity, 0)
    
    summary.totalProduction = totalQuantity
    summary.qualifiedRate = totalQuantity > 0 ? Math.round((qualifiedQuantity / totalQuantity) * 100 * 10) / 10 : 0
    summary.overdueOrders = filteredData.filter(item => item.completionRate < 100).length
    summary.efficiencyRate = totalPlannedQuantity > 0 ? Math.round((actualTotalQuantity / totalPlannedQuantity) * 100 * 10) / 10 : 0
    
    // 延迟更新图表，确保DOM已经渲染
    nextTick(() => {
      updateCharts()
    })
  } catch (error) {
    console.error('生成报表失败:', error)
  } finally {
    loading.value = false
  }
}

// 更新图表
const updateCharts = async () => {
  // 模拟数据准备
  const dates = ['1月1日', '1月2日', '1月3日', '1月4日', '1月5日', '1月6日', '1月7日', '1月8日', '1月9日', '1月10日']
  const productionData = [180, 200, 220, 210, 230, 195, 205, 190, 195, 180]
  const qualifiedData = [175, 195, 210, 205, 220, 190, 200, 185, 190, 175]
  
  // 初始化或更新生产趋势图表
  if (productionTrendChartRef.value) {
    if (!productionTrendChart) {
      productionTrendChart = echarts.init(productionTrendChartRef.value)
    }
    
    const productionTrendOption: EChartsOption = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['计划产量', '实际产量', '合格产量'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: 'value',
      },
      series: [
        {
          name: '计划产量',
          type: 'line',
          data: Array(dates.length).fill(200),
          lineStyle: { color: '#909399' },
        },
        {
          name: '实际产量',
          type: 'line',
          data: productionData,
          lineStyle: { color: '#1989fa' },
        },
        {
          name: '合格产量',
          type: 'line',
          data: qualifiedData,
          lineStyle: { color: '#67c23a' },
        },
      ],
    }
    
    productionTrendChart.setOption(productionTrendOption)
  }
  
  // 初始化或更新产品分布图表
  if (productDistributionChartRef.value) {
    if (!productDistributionChart) {
      productDistributionChart = echarts.init(productDistributionChartRef.value)
    }
    
    const productData = [
      { name: '智能控制器', value: 960 },
      { name: '传感器模组', value: 448 },
      { name: '电源模块', value: 205 },
      { name: '控制面板', value: 240 },
      { name: '连接线束', value: 490 },
    ]
    
    let productDistributionOption: EChartsOption
    
    if (chartOptions.chartType === 'pie') {
      productDistributionOption = {
        tooltip: {
          trigger: 'item',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
        },
        series: [
          {
            name: '产品产量',
            type: 'pie',
            radius: '50%',
            data: productData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      }
    } else {
      productDistributionOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: productData.map(item => item.name),
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '产量',
            type: 'bar',
            data: productData.map(item => item.value),
          },
        ],
      }
    }
    
    productDistributionChart.setOption(productDistributionOption)
  }
  
  // 初始化或更新质量趋势图表
  if (qualityTrendChartRef.value) {
    if (!qualityTrendChart) {
      qualityTrendChart = echarts.init(qualityTrendChartRef.value)
    }
    
    const qualityTrendOption: EChartsOption = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['合格率', '不良率'],
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
      series: [
        {
          name: '合格率',
          type: 'line',
          data: [97.2, 97.5, 95.5, 97.6, 95.7, 97.4, 97.6, 97.4, 97.4, 97.2],
          lineStyle: { color: '#67c23a' },
        },
        {
          name: '不良率',
          type: 'line',
          data: [2.8, 2.5, 4.5, 2.4, 4.3, 2.6, 2.4, 2.6, 2.6, 2.8],
          lineStyle: { color: '#f56c6c' },
        },
      ],
    }
    
    qualityTrendChart.setOption(qualityTrendOption)
  }
  
  // 初始化或更新车间利用率图表
  if (workshopUtilizationChartRef.value) {
    if (!workshopUtilizationChart) {
      workshopUtilizationChart = echarts.init(workshopUtilizationChartRef.value)
    }
    
    const workshopUtilizationOption: EChartsOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
        },
      },
      yAxis: {
        type: 'category',
        data: ['装配车间', '测试车间', '电子车间', '组装车间', '线缆车间'],
      },
      series: [
        {
          name: '利用率',
          type: 'bar',
          data: [96.5, 94.3, 88.7, 92.1, 95.8],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' },
            ]),
          },
        },
      ],
    }
    
    workshopUtilizationChart.setOption(workshopUtilizationOption)
  }
}

// 处理重置
const handleReset = () => {
  filterForm.dateRange = [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()]
  filterForm.reportType = 'daily'
  filterForm.workshopId = ''
  filterForm.productCategory = ''
}

// 处理刷新
const handleRefresh = () => {
  handleGenerateReport()
}

// 处理导出报表
const handleExportReport = () => {
  // 模拟导出操作
  ElMessage.success('报表导出成功')
}

// 处理设置
const handleSettings = () => {
  settingsDialogVisible.value = true
}

// 处理保存设置
const handleSaveSettings = () => {
  // 保存设置
  ElMessage.success('设置保存成功')
  settingsDialogVisible.value = false
  
  // 更新刷新定时器
  updateRefreshTimer()
}

// 更新刷新定时器
const updateRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  if (reportSettings.refreshInterval > 0) {
    refreshTimer = window.setInterval(() => {
      handleRefresh()
    }, reportSettings.refreshInterval * 60 * 1000)
  }
}

// 处理设置对话框关闭
const handleSettingsDialogClose = () => {
  // 可以在这里恢复默认设置
}

// 处理切换表格展开/收起
const handleToggleTableExpand = () => {
  isTableExpanded.value = !isTableExpanded.value
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  handleGenerateReport()
}

// 处理页码变化
const handleCurrentChange = (current: number) => {
  pagination.currentPage = current
  handleGenerateReport()
}

// 处理返回
const handleBack = () => {
  window.location.href = '/#/manufacturing/production-order/list'
}

// 获取汇总数据
const getSummary = ({ columns, data }: { columns: any[], data: ReportData[] }) => {
  const sums: any[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    const field = column.property
    if (['plannedQuantity', 'actualQuantity', 'qualifiedQuantity', 'unqualifiedQuantity', 'workHours'].includes(field)) {
      sums[index] = data.reduce((sum, item) => {
        const value = Number(item[field as keyof ReportData])
        return sum + (isNaN(value) ? 0 : value)
      }, 0)
    } else if (['completionRate', 'qualifiedRate', 'defectRate'].includes(field)) {
      const sum = data.reduce((sum, item) => {
        const value = Number(item[field as keyof ReportData])
        return sum + (isNaN(value) ? 0 : value)
      }, 0)
      sums[index] = `${(sum / data.length).toFixed(1)}%`
    } else {
      sums[index] = '-'
    }
  })
  return sums
}

// 获取合格率样式类
const getQualifiedRateClass = (rate: number): string => {
  if (rate >= 98) return 'high-rate'
  if (rate >= 95) return 'medium-rate'
  return 'low-rate'
}

// 获取不良率样式类
const getDefectRateClass = (rate: number): string => {
  if (rate <= 1) return 'low-defect'
  if (rate <= 3) return 'medium-defect'
  return 'high-defect'
}

// 响应窗口大小变化
const handleResize = () => {
  productionTrendChart?.resize()
  productDistributionChart?.resize()
  qualityTrendChart?.resize()
  workshopUtilizationChart?.resize()
}

// 组件挂载时初始化
onMounted(() => {
  handleGenerateReport()
  window.addEventListener('resize', handleResize)
  updateRefreshTimer()
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  productionTrendChart?.dispose()
  productDistributionChart?.dispose()
  qualityTrendChart?.dispose()
  workshopUtilizationChart?.dispose()
})
</script>

<style scoped>
.production-report {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.overview-card {
  position: relative;
  overflow: hidden;
}

.overview-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.overview-number {
  font-size: 32px;
  font-weight: 700;
  color: #1989fa;
}

.overview-label {
  font-size: 14px;
  color: #606266;
}

.overview-icon {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 48px;
  color: rgba(25, 137, 250, 0.1);
}

.chart-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  height: 350px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  height: calc(100% - 56px);
}

.chart {
  height: 100%;
  width: 100%;
}

.report-data-card {
  margin-bottom: 20px;
}

.table-container {
  overflow-x: auto;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.high-rate {
  color: #67c23a;
  font-weight: 500;
}

.medium-rate {
  color: #e6a23c;
  font-weight: 500;
}

.low-rate {
  color: #f56c6c;
  font-weight: 500;
}

.high-defect {
  color: #f56c6c;
  font-weight: 500;
}

.medium-defect {
  color: #e6a23c;
  font-weight: 500;
}

.low-defect {
  color: #67c23a;
  font-weight: 500;
}

@media (max-width: 768px) {
  .chart-container {
    grid-template-columns: 1fr;
  }
  
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>