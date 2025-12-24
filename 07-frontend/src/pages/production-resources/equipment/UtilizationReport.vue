cat > production-resources/equipment/UtilizationReport.vue <<'EOF'
<template>
  <div class="utilization-report">
    <div class="header">
      <h1>设备利用率报表</h1>
      <div class="export-actions">
        <el-button @click="handleExportPDF">导出PDF</el-button>
        <el-button type="primary" @click="handleExportExcel">导出Excel</el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-bar">
      <el-form :model="filterForm" inline>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :default-time="['00:00:00', '23:59:59']"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="filterForm.department" placeholder="选择部门">
            <el-option label="全部" value="" />
            <el-option label="生产一部" value="production1" />
            <el-option label="生产二部" value="production2" />
            <el-option label="质检部" value="quality" />
            <el-option label="研发部" value="rd" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="filterForm.equipmentType" placeholder="设备类型">
            <el-option label="全部" value="" />
            <el-option label="注塑机" value="injection" />
            <el-option label="CNC机床" value="cnc" />
            <el-option label="机器人" value="robot" />
            <el-option label="检测设备" value="inspection" />
            <el-option label="冲压机" value="press" />
          </el-select>
        </el-form-item>
        <el-form-item label="报表周期">
          <el-select v-model="filterForm.period" placeholder="报表周期" @change="handlePeriodChange">
            <el-option label="日" value="day" />
            <el-option label="周" value="week" />
            <el-option label="月" value="month" />
            <el-option label="季度" value="quarter" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="summary-cards">
      <el-card class="summary-card">
        <template #header>
          <span>平均利用率</span>
        </template>
        <div class="card-content">
          <el-statistic :value="averageUtilization" suffix="%" />
          <el-progress :percentage="averageUtilization" :show-text="false" :color="progressColors" />
        </div>
      </el-card>

      <el-card class="summary-card">
        <template #header>
          <span>最高利用率</span>
        </template>
        <div class="card-content">
          <el-statistic :value="maxUtilization" suffix="%" />
          <div class="equipment-name">{{ maxUtilizationEquipment }}</div>
        </div>
      </el-card>

      <el-card class="summary-card">
        <template #header>
          <span>最低利用率</span>
        </template>
        <div class="card-content">
          <el-statistic :value="minUtilization" suffix="%" />
          <div class="equipment-name">{{ minUtilizationEquipment }}</div>
        </div>
      </el-card>

      <el-card class="summary-card">
        <template #header>
          <span>总运行时长</span>
        </template>
        <div class="card-content">
          <el-statistic :value="totalRunningHours" />
          <div class="unit">小时</div>
        </div>
      </el-card>

      <el-card class="summary-card">
        <template #header>
          <span>总停机时长</span>
        </template>
        <div class="card-content">
          <el-statistic :value="totalDowntime" />
          <div class="unit">小时</div>
        </div>
      </el-card>

      <el-card class="summary-card">
        <template #header>
          <span>设备平均OEE</span>
        </template>
        <div class="card-content">
          <el-statistic :value="averageOEE" suffix="%" />
          <el-progress :percentage="averageOEE" :show-text="false" :color="progressColors" />
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-container">
      <div class="chart-row">
        <div class="chart-item">
          <el-card>
            <template #header>
              <span>设备利用率趋势</span>
            </template>
            <div id="utilization-trend-chart" class="chart" ref="trendChartRef"></div>
          </el-card>
        </div>
        <div class="chart-item">
          <el-card>
            <template #header>
              <span>部门利用率对比</span>
            </template>
            <div id="department-comparison-chart" class="chart" ref="departmentChartRef"></div>
          </el-card>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-item">
          <el-card>
            <template #header>
              <span>设备状态分布</span>
            </template>
            <div id="equipment-status-chart" class="chart" ref="statusChartRef"></div>
          </el-card>
        </div>
        <div class="chart-item">
          <el-card>
            <template #header>
              <span>设备OEE分析</span>
            </template>
            <div id="oee-analysis-chart" class="chart" ref="oeeChartRef"></div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-card>
        <template #header>
          <div class="table-header">
            <span>设备利用率明细</span>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索设备名称/编号"
              style="width: 240px"
              clearable
              @input="handleTableSearch"
            />
          </div>
        </template>
        <el-table 
          :data="paginatedData" 
          style="width: 100%"
          v-loading="loading"
          @sort-change="handleSort"
        >
          <el-table-column prop="equipmentCode" label="设备编号" width="120" sortable />
          <el-table-column prop="equipmentName" label="设备名称" width="180" sortable />
          <el-table-column prop="department" label="所属部门" width="120" />
          <el-table-column prop="equipmentType" label="设备类型" width="120" />
          <el-table-column prop="totalHours" label="总时长(小时)" width="120" sortable />
          <el-table-column prop="runningHours" label="运行时长(小时)" width="120" sortable />
          <el-table-column prop="utilization" label="利用率" width="150" sortable>
            <template #default="scope">
              <div class="utilization-cell">
                <span class="utilization-value">{{ scope.row.utilization }}%</span>
                <el-progress 
                  :percentage="scope.row.utilization" 
                  :color="getUtilizationColor(scope.row.utilization)"
                  :show-text="false"
                  class="utilization-progress"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="oee" label="OEE" width="100" sortable>
            <template #default="scope">
              <span :class="getOEEClass(scope.row.oee)">{{ scope.row.oee }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="downtime" label="停机时长(小时)" width="120" sortable />
          <el-table-column prop="maintenanceHours" label="保养时长(小时)" width="120" sortable />
          <el-table-column prop="downtimeRate" label="停机率" width="100" sortable>
            <template #default="scope">
              <span :class="getDowntimeClass(scope.row.downtimeRate)">{{ scope.row.downtimeRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button link type="primary" @click="handleViewDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredData.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 设备详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`设备详情 - ${currentEquipment?.equipmentName || ''}`"
      width="700px"
    >
      <div v-if="currentEquipment" class="equipment-detail">
        <el-descriptions :column="{ xs: 1, sm: 2 }" border>
          <el-descriptions-item label="设备编号">{{ currentEquipment.equipmentCode }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentEquipment.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ currentEquipment.equipmentType }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ currentEquipment.department }}</el-descriptions-item>
          <el-descriptions-item label="总时长" span="2">
            <el-progress 
              :percentage="100" 
              :color="['#e0e0e0']" 
              :show-text="false" 
              class="detail-progress"
            />
            <div class="progress-label">{{ currentEquipment.totalHours }}小时</div>
          </el-descriptions-item>
          <el-descriptions-item label="运行时长" span="2">
            <el-progress 
              :percentage="currentEquipment.utilization" 
              :color="getUtilizationColor(currentEquipment.utilization)" 
              :show-text="false" 
              class="detail-progress"
            />
            <div class="progress-label">{{ currentEquipment.runningHours }}小时 ({{ currentEquipment.utilization }}%)</div>
          </el-descriptions-item>
          <el-descriptions-item label="停机时长" span="2">
            <el-progress 
              :percentage="currentEquipment.downtimeRate" 
              :color="['#f56c6c']" 
              :show-text="false" 
              class="detail-progress"
            />
            <div class="progress-label">{{ currentEquipment.downtime }}小时 ({{ currentEquipment.downtimeRate }}%)</div>
          </el-descriptions-item>
          <el-descriptions-item label="保养时长" span="2">
            <el-progress 
              :percentage="(currentEquipment.maintenanceHours / currentEquipment.totalHours * 100).toFixed(1)" 
              :color="['#e6a23c']" 
              :show-text="false" 
              class="detail-progress"
            />
            <div class="progress-label">{{ currentEquipment.maintenanceHours }}小时</div>
          </el-descriptions-item>
          <el-descriptions-item label="OEE" span="2">
            <el-statistic :value="currentEquipment.oee" suffix="%" />
          </el-descriptions-item>
        </el-descriptions>
        
        <!-- 设备趋势图 -->
        <div class="detail-chart-section">
          <h3>近期利用率趋势</h3>
          <div id="equipment-detail-chart" class="detail-chart" ref="detailChartRef"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 响应式数据
const filterForm = ref({
  dateRange: [],
  department: '',
  equipmentType: '',
  period: 'month' // 默认按月统计
})

const utilizationData = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const detailDialogVisible = ref(false)
const currentEquipment = ref(null)

// 图表实例引用
const trendChartRef = ref(null)
const departmentChartRef = ref(null)
const statusChartRef = ref(null)
const oeeChartRef = ref(null)
const detailChartRef = ref(null)

// 图表实例
let trendChart = null
let departmentChart = null
let statusChart = null
let oeeChart = null
let detailChart = null

// 进度条颜色配置
const progressColors = [
  {
    colorStops: [
      { offset: 0, color: '#f56c6c' },
      { offset: 0.7, color: '#e6a23c' },
      { offset: 1, color: '#67c23a' }
    ]
  }
]

// 计算属性
const averageUtilization = computed(() => {
  if (utilizationData.value.length === 0) return 0
  const total = utilizationData.value.reduce((sum, item) => sum + item.utilization, 0)
  return Math.round(total / utilizationData.value.length)
})

const maxUtilization = computed(() => {
  if (utilizationData.value.length === 0) return 0
  return Math.max(...utilizationData.value.map(item => item.utilization))
})

const minUtilization = computed(() => {
  if (utilizationData.value.length === 0) return 0
  return Math.min(...utilizationData.value.map(item => item.utilization))
})

const maxUtilizationEquipment = computed(() => {
  const maxItem = utilizationData.value.find(item => item.utilization === maxUtilization.value)
  return maxItem ? `${maxItem.equipmentName} (${maxItem.equipmentCode})` : ''
})

const minUtilizationEquipment = computed(() => {
  const minItem = utilizationData.value.find(item => item.utilization === minUtilization.value)
  return minItem ? `${minItem.equipmentName} (${minItem.equipmentCode})` : ''
})

const totalRunningHours = computed(() => {
  return utilizationData.value.reduce((sum, item) => sum + item.runningHours, 0)
})

const totalDowntime = computed(() => {
  return utilizationData.value.reduce((sum, item) => sum + item.downtime, 0)
})

const averageOEE = computed(() => {
  if (utilizationData.value.length === 0) return 0
  const total = utilizationData.value.reduce((sum, item) => sum + item.oee, 0)
  return Math.round(total / utilizationData.value.length)
})

// 筛选后的数据
const filteredData = computed(() => {
  let data = utilizationData.value
  
  // 搜索关键词筛选
  if (searchKeyword.value) {
    data = data.filter(item => 
      item.equipmentName.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      item.equipmentCode.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 部门筛选
  if (filterForm.value.department) {
    data = data.filter(item => item.department === getDepartmentName(filterForm.value.department))
  }
  
  // 设备类型筛选
  if (filterForm.value.equipmentType) {
    data = data.filter(item => item.equipmentType === getEquipmentTypeName(filterForm.value.equipmentType))
  }
  
  return data
})

// 分页数据
const paginatedData = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredData.value.slice(startIndex, endIndex)
})

// 生命周期钩子
onMounted(() => {
  // 设置默认日期范围（最近30天）
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  filterForm.value.dateRange = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
  
  loadUtilizationData()
  
  // 监听窗口大小变化，重新调整图表大小
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 销毁图表实例
  if (trendChart) trendChart.dispose()
  if (departmentChart) departmentChart.dispose()
  if (statusChart) statusChart.dispose()
  if (oeeChart) oeeChart.dispose()
  if (detailChart) detailChart.dispose()
  
  window.removeEventListener('resize', handleResize)
})

// 监听数据变化，重新渲染图表
watch(() => utilizationData.value, () => {
  nextTick(() => {
    initCharts()
  })
}, { deep: true })

// 方法
const loadUtilizationData = () => {
  loading.value = true
  
  // 模拟数据加载延迟
  setTimeout(() => {
    // 生成模拟数据
    utilizationData.value = [
      {
        equipmentCode: 'EQ001',
        equipmentName: '注塑机-1#',
        department: '生产一部',
        equipmentType: '注塑机',
        totalHours: 720,
        runningHours: 612,
        utilization: 85,
        oee: 78.5,
        downtime: 48,
        downtimeRate: 6.7,
        maintenanceHours: 60
      },
      {
        equipmentCode: 'EQ002',
        equipmentName: 'CNC机床-2#',
        department: '生产二部',
        equipmentType: 'CNC机床',
        totalHours: 720,
        runningHours: 662,
        utilization: 92,
        oee: 88.3,
        downtime: 28,
        downtimeRate: 3.9,
        maintenanceHours: 30
      },
      {
        equipmentCode: 'EQ003',
        equipmentName: '装配机器人-1#',
        department: '生产一部',
        equipmentType: '机器人',
        totalHours: 720,
        runningHours: 562,
        utilization: 78,
        oee: 72.1,
        downtime: 98,
        downtimeRate: 13.6,
        maintenanceHours: 60
      },
      {
        equipmentCode: 'EQ004',
        equipmentName: '三坐标测量仪',
        department: '质检部',
        equipmentType: '检测设备',
        totalHours: 720,
        runningHours: 432,
        utilization: 60,
        oee: 55.8,
        downtime: 248,
        downtimeRate: 34.4,
        maintenanceHours: 40
      },
      {
        equipmentCode: 'EQ005',
        equipmentName: '冲压机-3#',
        department: '生产二部',
        equipmentType: '冲压机',
        totalHours: 720,
        runningHours: 583,
        utilization: 81,
        oee: 75.2,
        downtime: 87,
        downtimeRate: 12.1,
        maintenanceHours: 50
      },
      {
        equipmentCode: 'EQ006',
        equipmentName: '注塑机-2#',
        department: '生产一部',
        equipmentType: '注塑机',
        totalHours: 720,
        runningHours: 590,
        utilization: 82,
        oee: 76.5,
        downtime: 70,
        downtimeRate: 9.7,
        maintenanceHours: 60
      },
      {
        equipmentCode: 'EQ007',
        equipmentName: 'CNC机床-1#',
        department: '生产二部',
        equipmentType: 'CNC机床',
        totalHours: 720,
        runningHours: 648,
        utilization: 90,
        oee: 85.7,
        downtime: 32,
        downtimeRate: 4.4,
        maintenanceHours: 40
      },
      {
        equipmentCode: 'EQ008',
        equipmentName: '激光切割机',
        department: '研发部',
        equipmentType: '其他设备',
        totalHours: 720,
        runningHours: 360,
        utilization: 50,
        oee: 47.2,
        downtime: 320,
        downtimeRate: 44.4,
        maintenanceHours: 40
      }
    ]
    
    loading.value = false
    
    // 初始化图表
    nextTick(() => {
      initCharts()
    })
  }, 800)
}

const getUtilizationColor = (utilization) => {
  if (utilization >= 90) return '#67c23a'
  if (utilization >= 80) return '#409eff'
  if (utilization >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getOEEClass = (oee) => {
  if (oee >= 85) return 'oee-excellent'
  if (oee >= 75) return 'oee-good'
  if (oee >= 60) return 'oee-average'
  return 'oee-poor'
}

const getDowntimeClass = (rate) => {
  if (rate <= 5) return 'downtime-low'
  if (rate <= 15) return 'downtime-medium'
  return 'downtime-high'
}

const getDepartmentName = (code) => {
  const map = {
    production1: '生产一部',
    production2: '生产二部',
    quality: '质检部',
    rd: '研发部'
  }
  return map[code] || ''
}

const getEquipmentTypeName = (code) => {
  const map = {
    injection: '注塑机',
    cnc: 'CNC机床',
    robot: '机器人',
    inspection: '检测设备',
    press: '冲压机'
  }
  return map[code] || ''
}

const handleQuery = () => {
  loading.value = true
  currentPage.value = 1
  
  // 模拟查询
  setTimeout(() => {
    loadUtilizationData()
    loading.value = false
  }, 500)
}

const handleReset = () => {
  filterForm.value = {
    dateRange: [],
    department: '',
    equipmentType: '',
    period: 'month'
  }
  searchKeyword.value = ''
  currentPage.value = 1
  
  // 设置默认日期范围
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  filterForm.value.dateRange = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
}

const handlePeriodChange = () => {
  // 根据选择的周期调整默认日期范围
  const endDate = new Date()
  const startDate = new Date()
  
  switch (filterForm.value.period) {
    case 'day':
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'week':
      startDate.setDate(startDate.getDate() - 28)
      break
    case 'month':
      startDate.setMonth(startDate.getMonth() - 6)
      break
    case 'quarter':
      startDate.setMonth(startDate.getMonth() - 12)
      break
  }
  
  filterForm.value.dateRange = [
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  ]
}

const handleTableSearch = () => {
  currentPage.value = 1
}

const handleSort = (column) => {
  const { prop, order } = column
  filteredData.value.sort((a, b) => {
    if (order === 'ascending') {
      return a[prop] - b[prop]
    } else {
      return b[prop] - a[prop]
    }
  })
}

const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

const handleViewDetail = (equipment) => {
  currentEquipment.value = { ...equipment }
  detailDialogVisible.value = true
  
  nextTick(() => {
    initDetailChart()
  })
}

const handleExportPDF = () => {
  ElMessage.success('PDF导出功能开发中...')
  // 实际项目中可以使用如 jsPDF 等库实现PDF导出
}

const handleExportExcel = () => {
  ElMessage.success('Excel导出功能开发中...')
  // 实际项目中可以使用如 xlsx 等库实现Excel导出
}

const handleResize = () => {
  // 调整所有图表大小
  if (trendChart) trendChart.resize()
  if (departmentChart) departmentChart.resize()
  if (statusChart) statusChart.resize()
  if (oeeChart) oeeChart.resize()
  if (detailChart) detailChart.resize()
}

// 初始化所有图表
const initCharts = () => {
  initTrendChart()
  initDepartmentChart()
  initStatusChart()
  initOEEChart()
}

// 初始化利用率趋势图
const initTrendChart = () => {
  if (!trendChartRef.value) return
  
  // 销毁旧实例
  if (trendChart) {
    trendChart.dispose()
  }
  
  trendChart = echarts.init(trendChartRef.value)
  
  // 生成模拟数据
  const dates = []
  const values = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0].slice(5))
    values.push(Math.round(Math.random() * 30 + 70)) // 70-100之间的随机数
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        interval: Math.floor(dates.length / 7),
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [{
      name: '利用率',
      type: 'line',
      data: values,
      smooth: true,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
        ])
      },
      lineStyle: {
        color: '#409eff',
        width: 3
      },
      itemStyle: {
        color: '#409eff'
      },
      markLine: {
        silent: true,
        lineStyle: {
          color: '#67c23a'
        },
        data: [{
          yAxis: averageUtilization.value,
          name: '平均值'
        }]
      }
    }]
  }
  
  trendChart.setOption(option)
}

// 初始化部门对比图
const initDepartmentChart = () => {
  if (!departmentChartRef.value) return
  
  // 销毁旧实例
  if (departmentChart) {
    departmentChart.dispose()
  }
  
  departmentChart = echarts.init(departmentChartRef.value)
  
  // 按部门统计数据
  const departmentStats = {}
  utilizationData.value.forEach(item => {
    if (!departmentStats[item.department]) {
      departmentStats[item.department] = {
        count: 0,
        totalUtilization: 0,
        totalRunningHours: 0
      }
    }
    departmentStats[item.department].count++
    departmentStats[item.department].totalUtilization += item.utilization
    departmentStats[item.department].totalRunningHours += item.runningHours
  })
  
  const departments = Object.keys(departmentStats)
  const avgUtilizations = departments.map(dept => 
    Math.round(departmentStats[dept].totalUtilization / departmentStats[dept].count)
  )
  const runningHours = departments.map(dept => departmentStats[dept].totalRunningHours)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['平均利用率', '运行时长']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: departments
    },
    yAxis: [
      {
        type: 'value',
        name: '利用率(%)',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      {
        type: 'value',
        name: '运行时长(小时)',
        min: 0,
        axisLabel: {
          formatter: '{value}h'
        }
      }
    ],
    series: [
      {
        name: '平均利用率',
        type: 'bar',
        data: avgUtilizations,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#85ce61' }
          ])
        }
      },
      {
        name: '运行时长',
        type: 'line',
        yAxisIndex: 1,
        data: runningHours,
        lineStyle: {
          color: '#f56c6c',
          width: 3
        },
        itemStyle: {
          color: '#f56c6c'
        }
      }
    ]
  }
  
  departmentChart.setOption(option)
}

// 初始化设备状态分布图
const initStatusChart = () => {
  if (!statusChartRef.value) return
  
  // 销毁旧实例
  if (statusChart) {
    statusChart.dispose()
  }
  
  statusChart = echarts.init(statusChartRef.value)
  
  // 计算总时长分布
  let totalRunningHours = 0
  let totalDowntime = 0
  let totalMaintenanceHours = 0
  
  utilizationData.value.forEach(item => {
    totalRunningHours += item.runningHours
    totalDowntime += item.downtime
    totalMaintenanceHours += item.maintenanceHours
  })
  
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
        name: '设备状态',
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: [
          { value: totalRunningHours, name: '运行时间' },
          { value: totalDowntime, name: '停机时间' },
          { value: totalMaintenanceHours, name: '保养时间' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        itemStyle: {
          color: function(params) {
            const colors = ['#67c23a', '#f56c6c', '#e6a23c']
            return colors[params.dataIndex]
          }
        },
        label: {
          formatter: '{b}: {d}%'
        }
      }
    ]
  }
  
  statusChart.setOption(option)
}

// 初始化OEE分析图
const initOEEChart = () => {
  if (!oeeChartRef.value) return
  
  // 销毁旧实例
  if (oeeChart) {
    oeeChart.dispose()
  }
  
  oeeChart = echarts.init(oeeChartRef.value)
  
  // 按设备类型统计OEE
  const typeStats = {}
  utilizationData.value.forEach(item => {
    if (!typeStats[item.equipmentType]) {
      typeStats[item.equipmentType] = {
        count: 0,
        totalOEE: 0
      }
    }
    typeStats[item.equipmentType].count++
    typeStats[item.equipmentType].totalOEE += item.oee
  })
  
  const types = Object.keys(typeStats)
  const avgOEEs = types.map(type => 
    Math.round(typeStats[type].totalOEE / typeStats[type].count)
  )
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: '{b}: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    yAxis: {
      type: 'category',
      data: types
    },
    series: [{
      name: 'OEE',
      type: 'bar',
      data: avgOEEs,
      label: {
        show: true,
        position: 'right',
        formatter: '{c}%'
      },
      itemStyle: {
        color: function(params) {
          const value = params.value
          if (value >= 85) return '#67c23a'
          if (value >= 75) return '#409eff'
          if (value >= 60) return '#e6a23c'
          return '#f56c6c'
        }
      }
    }]
  }
  
  oeeChart.setOption(option)
}

// 初始化设备详情趋势图
const initDetailChart = () => {
  if (!detailChartRef.value || !currentEquipment.value) return
  
  // 销毁旧实例
  if (detailChart) {
    detailChart.dispose()
  }
  
  detailChart = echarts.init(detailChartRef.value)
  
  // 生成模拟的历史数据
  const weeks = []
  const utilizations = []
  const oees = []
  
  for (let i = 11; i >= 0; i--) {
    weeks.push(`第${12-i}周`)
    const baseUtil = currentEquipment.value.utilization
    const baseOEE = currentEquipment.value.oee
    utilizations.push(Math.round(baseUtil + (Math.random() - 0.5) * 10))
    oees.push(Math.round(baseOEE + (Math.random() - 0.5) * 10))
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['利用率', 'OEE']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: weeks
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%'
      }
    },
    series: [
      {
        name: '利用率',
        type: 'line',
        data: utilizations,
        smooth: true,
        lineStyle: {
          color: '#409eff',
          width: 3
        },
        itemStyle: {
          color: '#409eff'
        }
      },
      {
        name: 'OEE',
        type: 'line',
        data: oees,
        smooth: true,
        lineStyle: {
          color: '#67c23a',
          width: 3
        },
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }
  
  detailChart.setOption(option)
}
</script>

<style scoped>
.utilization-report {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-bar {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 10px 0;
}

.equipment-name {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.unit {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.charts-container {
  margin-bottom: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.chart-item {
  height: 400px;
}

.chart {
  height: calc(100% - 50px);
}

.table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.utilization-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.utilization-value {
  font-weight: bold;
  text-align: center;
  color: #606266;
}

.utilization-progress {
  height: 8px;
}

.oee-excellent {
  color: #67c23a;
  font-weight: bold;
}

.oee-good {
  color: #409eff;
  font-weight: bold;
}

.oee-average {
  color: #e6a23c;
  font-weight: bold;
}

.oee-poor {
  color: #f56c6c;
  font-weight: bold;
}

.downtime-low {
  color: #67c23a;
  font-weight: bold;
}

.downtime-medium {
  color: #e6a23c;
  font-weight: bold;
}

.downtime-high {
  color: #f56c6c;
  font-weight: bold;
}

.equipment-detail {
  padding: 10px 0;
}

.detail-progress {
  margin-bottom: 5px;
}

.progress-label {
  font-size: 12px;
  color: #909399;
}

.detail-chart-section {
  margin-top: 30px;
}

.detail-chart-section h3 {
  font-size: 16px;
  margin-bottom: 15px;
  color: #303133;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.detail-chart {
  height: 300px;
}

@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .chart-item {
    height: 350px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .filter-bar .el-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  
  .table-header .el-input {
    width: 100% !important;
  }
}
</style>
EOF