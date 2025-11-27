<template>
  <div class="mold-lifecycle">
    <div class="header">
      <h1>模具生命周期</h1>
      <div class="actions">
        <el-button type="primary" @click="handleExport">导出报表</el-button>
        <el-button @click="handleRefresh">刷新数据</el-button>
      </div>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-form :model="searchForm" inline>
        <el-form-item label="模具编号/名称">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="请输入编号或名称" 
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="模具状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="使用中" value="in_use" />
            <el-option label="待机" value="standby" />
            <el-option label="保养中" value="maintenance" />
            <el-option label="故障" value="broken" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品">
          <el-select v-model="searchForm.product" placeholder="全部产品" clearable>
            <el-option v-for="product in productList" :key="product" :label="product" :value="product" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon primary">
          <Box />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ totalMolds }}</div>
          <div class="stat-label">模具总数</div>
          <div class="stat-unit">套</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">
          <Cpu />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ activeMolds }}</div>
          <div class="stat-label">活跃模具</div>
          <div class="stat-unit">套</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">
          <Clock />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ averageLifeSpan }}</div>
          <div class="stat-label">平均寿命</div>
          <div class="stat-unit">万模次</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">
          <AlertTriangle />
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ needMaintenanceMolds }}</div>
          <div class="stat-label">需保养</div>
          <div class="stat-unit">套</div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-section">
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>模具寿命趋势</span>
            <el-select v-model="chartTimeRange" placeholder="选择时间范围" style="width: 150px;">
              <el-option label="近1个月" value="1m" />
              <el-option label="近3个月" value="3m" />
              <el-option label="近6个月" value="6m" />
              <el-option label="近1年" value="1y" />
            </el-select>
          </div>
        </template>
        <div ref="lifeSpanChart" class="chart-container"></div>
      </el-card>

      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span>模具状态分布</span>
          </div>
        </template>
        <div ref="statusChart" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 模具列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <h3>模具生命周期列表</h3>
        <el-select v-model="viewMode" placeholder="显示模式">
          <el-option label="表格视图" value="table" />
          <el-option label="卡片视图" value="card" />
        </el-select>
      </div>
      
      <!-- 表格视图 -->
      <el-table 
        v-if="viewMode === 'table'"
        :data="paginatedMolds" 
        style="width: 100%"
        v-loading="loading"
        @sort-change="handleSort"
      >
        <el-table-column prop="code" label="模具编号" width="120" sortable />
        <el-table-column prop="name" label="模具名称" width="180" sortable />
        <el-table-column prop="model" label="模具型号" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentProduct" label="当前产品" width="120" />
        <el-table-column prop="totalShots" label="总模次" width="120" sortable>
          <template #default="scope">
            <el-progress 
              :percentage="Math.min(100, (scope.row.totalShots / scope.row.expectedLifeShots * 100))" 
              :color="getProgressColor(scope.row.totalShots / scope.row.expectedLifeShots)"
              style="height: 10px; margin-top: 8px;"
              :show-text="false"
            />
            <div class="shots-info">
              {{ scope.row.totalShots.toLocaleString() }}
              <span class="total-life">({{ Math.round(scope.row.totalShots / 10000 * 10) / 10 }}万/{{ scope.row.expectedLifeShots / 10000 }}万)</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="productionRate" label="生产效率" width="120" sortable>
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.productionRate || 0" 
              :color="scope.row.productionRate >= 90 ? '#67C23A' : scope.row.productionRate >= 70 ? '#E6A23C' : '#F56C6C'"
              style="height: 10px; margin-top: 8px;"
              :show-text="false"
            />
            <span>{{ scope.row.productionRate || 0 }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="createDate" label="创建日期" width="120" sortable />
        <el-table-column prop="lastMaintenance" label="最后保养" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button link type="primary" @click="handleView(scope.row)">详情</el-button>
            <el-button link @click="handleMaintenance(scope.row)">保养</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="card-grid">
        <el-card 
          v-for="mold in paginatedMolds" 
          :key="mold.id"
          class="mold-card"
          shadow="hover"
        >
          <div class="mold-card-header">
            <h3>{{ mold.name }}</h3>
            <el-tag :type="getStatusType(mold.status)">{{ getStatusText(mold.status) }}</el-tag>
          </div>
          <div class="mold-card-content">
            <p><strong>编号:</strong> {{ mold.code }}</p>
            <p><strong>型号:</strong> {{ mold.model }}</p>
            <p><strong>产品:</strong> {{ mold.currentProduct }}</p>
            <div class="life-progress-section">
              <p><strong>生命周期进度</strong></p>
              <el-progress 
                :percentage="Math.min(100, (mold.totalShots / mold.expectedLifeShots * 100))" 
                :color="getProgressColor(mold.totalShots / mold.expectedLifeShots)"
                style="height: 10px; margin: 10px 0;"
              />
              <div class="shots-info">
                <span>{{ Math.round(mold.totalShots / 10000 * 10) / 10 }}万</span>
                <span> / {{ mold.expectedLifeShots / 10000 }}万模次</span>
              </div>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="handleView(mold)">查看详情</el-button>
              <el-button size="small" type="primary" @click="handleMaintenance(mold)">安排保养</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredMolds.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 模具详情对话框 -->
    <el-dialog
      v-model="detailVisible"
      :title="`模具详情 - ${selectedMold?.name || ''}`"
      width="800px"
    >
      <div v-if="selectedMold" class="mold-detail">
        <div class="detail-header">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="模具编号">{{ selectedMold.code }}</el-descriptions-item>
            <el-descriptions-item label="模具名称">{{ selectedMold.name }}</el-descriptions-item>
            <el-descriptions-item label="模具型号">{{ selectedMold.model }}</el-descriptions-item>
            <el-descriptions-item label="模具状态">
              <el-tag :type="getStatusType(selectedMold.status)">{{ getStatusText(selectedMold.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前产品">{{ selectedMold.currentProduct }}</el-descriptions-item>
            <el-descriptions-item label="生产效率">{{ selectedMold.productionRate || 0 }}%</el-descriptions-item>
          </el-descriptions>
        </div>
        
        <!-- 生命周期进度 -->
        <div class="lifecycle-progress">
          <h3>生命周期进度</h3>
          <el-progress 
            :percentage="Math.min(100, (selectedMold.totalShots / selectedMold.expectedLifeShots * 100))" 
            :color="getProgressColor(selectedMold.totalShots / selectedMold.expectedLifeShots)"
            :format="progressFormat"
          />
          <div class="progress-info">
            <span>当前: {{ selectedMold.totalShots.toLocaleString() }} 模次</span>
            <span>预期寿命: {{ selectedMold.expectedLifeShots.toLocaleString() }} 模次</span>
            <span>剩余: {{ (selectedMold.expectedLifeShots - selectedMold.totalShots).toLocaleString() }} 模次</span>
          </div>
        </div>

        <!-- 维修保养历史 -->
        <div class="maintenance-history">
          <h3>维修保养历史</h3>
          <el-table :data="selectedMold.maintenanceHistory" style="width: 100%; margin-top: 10px;">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'maintenance' ? 'warning' : 'danger'">
                  {{ scope.row.type === 'maintenance' ? '保养' : '维修' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="content" label="内容" />
            <el-table-column prop="shots" label="保养时模次" width="120" />
            <el-table-column prop="technician" label="技师" width="100" />
          </el-table>
          <div v-if="!selectedMold.maintenanceHistory || selectedMold.maintenanceHistory.length === 0" class="empty-state">
            暂无维修保养历史
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleMaintenance(selectedMold)">安排保养</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Box, Cpu, Clock, AlertTriangle, Download, Refresh } from '@element-plus/icons-vue'

// 响应式数据
const moldList = ref([])
const loading = ref(false)
const searchForm = reactive({
  keyword: '',
  status: '',
  product: ''
})

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)
const viewMode = ref('table')
const chartTimeRange = ref('6m')

// 对话框相关
const detailVisible = ref(false)
const selectedMold = ref(null)

// 图表引用
const lifeSpanChart = ref(null)
const statusChart = ref(null)
let lifeSpanChartInstance = null
let statusChartInstance = null

// 产品列表
const productList = ref([
  '产品A', '产品B', '产品C', '产品D', '产品E', '产品F'
])

// 计算属性
const filteredMolds = computed(() => {
  return moldList.value.filter(mold => {
    // 关键词搜索
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      if (!mold.code.toLowerCase().includes(keyword) && 
          !mold.name.toLowerCase().includes(keyword)) {
        return false
      }
    }
    
    // 状态筛选
    if (searchForm.status && mold.status !== searchForm.status) {
      return false
    }
    
    // 产品筛选
    if (searchForm.product && mold.currentProduct !== searchForm.product) {
      return false
    }
    
    return true
  })
})

const paginatedMolds = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filteredMolds.value.slice(startIndex, endIndex)
})

// 统计数据
const totalMolds = computed(() => moldList.value.length)
const activeMolds = computed(() => 
  moldList.value.filter(mold => 
    mold.status === 'in_use' || mold.status === 'standby'
  ).length
)
const averageLifeSpan = computed(() => {
  const activeMolds = moldList.value.filter(mold => 
    mold.status !== 'scrapped' && mold.totalShots > 0
  )
  if (activeMolds.length === 0) return 0
  const totalShots = activeMolds.reduce((sum, mold) => sum + mold.totalShots, 0)
  return Math.round((totalShots / activeMolds.length / 10000) * 10) / 10
})
const needMaintenanceMolds = computed(() => 
  moldList.value.filter(mold => 
    mold.status === 'maintenance' || 
    (mold.nextMaintenanceShots && mold.totalShots >= mold.nextMaintenanceShots - 2000)
  ).length
)

// 生命周期钩子
onMounted(() => {
  loadMoldList()
})

// 监听时间范围变化
watch(chartTimeRange, () => {
  nextTick(() => {
    updateLifeSpanChart()
  })
})

// 方法
const loadMoldList = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    moldList.value = [
      {
        id: 1,
        code: 'M001',
        name: '产品A上模',
        model: 'M-A-001',
        status: 'in_use',
        currentProduct: '产品A',
        totalShots: 15000,
        expectedLifeShots: 50000,
        productionRate: 92,
        maintenanceCycle: 5000,
        createDate: '2023-01-15',
        lastMaintenance: '2024-01-10',
        nextMaintenanceShots: 20000,
        location: '模房A区',
        maintenanceHistory: [
          {
            date: '2024-01-10',
            type: 'maintenance',
            content: '常规保养，更换易损件',
            shots: 15000,
            technician: '张师傅'
          },
          {
            date: '2023-12-10',
            type: 'maintenance',
            content: '清洁模具，检查精度',
            shots: 10000,
            technician: '张师傅'
          }
        ]
      },
      {
        id: 2,
        code: 'M002',
        name: '产品B下模',
        model: 'M-B-001',
        status: 'maintenance',
        currentProduct: '产品B',
        totalShots: 35000,
        expectedLifeShots: 60000,
        productionRate: 88,
        maintenanceCycle: 6000,
        createDate: '2023-03-20',
        lastMaintenance: '2024-01-12',
        nextMaintenanceShots: 42000,
        location: '模房B区',
        maintenanceHistory: [
          {
            date: '2024-01-12',
            type: 'maintenance',
            content: '更换模具配件，校准精度',
            shots: 35000,
            technician: '李师傅'
          }
        ]
      },
      {
        id: 3,
        code: 'M003',
        name: '产品C侧模',
        model: 'M-C-001',
        status: 'standby',
        currentProduct: '产品C',
        totalShots: 8000,
        expectedLifeShots: 40000,
        productionRate: 95,
        maintenanceCycle: 4000,
        createDate: '2023-11-05',
        lastMaintenance: '2024-01-05',
        nextMaintenanceShots: 12000,
        location: '模房C区',
        maintenanceHistory: []
      },
      {
        id: 4,
        code: 'M004',
        name: '产品A下模',
        model: 'M-A-002',
        status: 'broken',
        currentProduct: '产品A',
        totalShots: 25000,
        expectedLifeShots: 50000,
        productionRate: 75,
        maintenanceCycle: 5000,
        createDate: '2022-12-25',
        lastMaintenance: '2023-12-25',
        nextMaintenanceShots: 30000,
        location: '维修区',
        maintenanceHistory: [
          {
            date: '2023-12-25',
            type: 'repair',
            content: '修复模具损坏部分',
            shots: 25000,
            technician: '王师傅'
          }
        ]
      },
      {
        id: 5,
        code: 'M005',
        name: '产品D前模',
        model: 'M-D-001',
        status: 'in_use',
        currentProduct: '产品D',
        totalShots: 5000,
        expectedLifeShots: 80000,
        productionRate: 98,
        maintenanceCycle: 8000,
        createDate: '2023-12-15',
        lastMaintenance: '2024-01-15',
        nextMaintenanceShots: 13000,
        location: '模房A区',
        maintenanceHistory: []
      },
      {
        id: 6,
        code: 'M006',
        name: '产品E后模',
        model: 'M-E-001',
        status: 'scrapped',
        currentProduct: '产品E',
        totalShots: 60000,
        expectedLifeShots: 50000,
        productionRate: 60,
        maintenanceCycle: 5000,
        createDate: '2022-06-10',
        lastMaintenance: '2023-11-10',
        location: '废料区',
        maintenanceHistory: [
          {
            date: '2023-11-10',
            type: 'repair',
            content: '尝试修复，但损坏严重',
            shots: 60000,
            technician: '刘师傅'
          }
        ]
      }
    ]
    loading.value = false
    
    // 初始化图表
    nextTick(() => {
      initCharts()
    })
  }, 500)
}

const getStatusType = (status) => {
  const types = {
    in_use: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger',
    scrapped: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    in_use: '使用中',
    standby: '待机',
    maintenance: '保养中',
    broken: '故障',
    scrapped: '报废'
  }
  return texts[status] || '未知'
}

const getProgressColor = (ratio) => {
  if (ratio >= 0.8) return '#F56C6C'
  if (ratio >= 0.6) return '#E6A23C'
  return '#67C23A'
}

const progressFormat = (percentage) => {
  return `${percentage.toFixed(1)}%`
}

// 搜索和重置
const handleSearch = () => {
  currentPage.value = 1
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    product: ''
  })
  currentPage.value = 1
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 排序处理
const handleSort = (sort) => {
  // 排序逻辑可以在这里实现
  console.log('Sort:', sort)
}

// 查看详情
const handleView = (mold) => {
  selectedMold.value = { ...mold }
  detailVisible.value = true
}

// 安排保养
const handleMaintenance = (mold) => {
  ElMessage.success(`已为模具 ${mold.code} 安排保养`)
}

// 导出数据
const handleExport = () => {
  ElMessage.success('报表导出成功')
}

// 刷新数据
const handleRefresh = () => {
  loadMoldList()
  ElMessage.success('数据已刷新')
}

// 初始化图表
const initCharts = () => {
  // 初始化寿命趋势图
  if (lifeSpanChart.value) {
    lifeSpanChartInstance = echarts.init(lifeSpanChart.value)
    updateLifeSpanChart()
  }
  
  // 初始化状态分布图
  if (statusChart.value) {
    statusChartInstance = echarts.init(statusChart.value)
    updateStatusChart()
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
}

// 更新寿命趋势图
const updateLifeSpanChart = () => {
  if (!lifeSpanChartInstance) return
  
  // 模拟数据 - 根据时间范围生成
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const currentMonth = new Date().getMonth()
  const dataCount = chartTimeRange.value === '1m' ? 1 : 
                    chartTimeRange.value === '3m' ? 3 : 
                    chartTimeRange.value === '6m' ? 6 : 12
  
  const monthsData = []
  const moldsData = []
  const shotsData = []
  
  for (let i = dataCount - 1; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12
    monthsData.push(months[monthIndex])
    moldsData.push(Math.floor(Math.random() * 5) + 3)
    shotsData.push(Math.floor(Math.random() * 50000) + 30000)
  }
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新增模具', '总模次']
    },
    xAxis: {
      type: 'category',
      data: monthsData
    },
    yAxis: [
      {
        type: 'value',
        name: '模具数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '模次',
        position: 'right'
      }
    ],
    series: [
      {
        name: '新增模具',
        type: 'bar',
        data: moldsData,
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '总模次',
        type: 'line',
        yAxisIndex: 1,
        data: shotsData,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
  
  lifeSpanChartInstance.setOption(option)
}

// 更新状态分布图
const updateStatusChart = () => {
  if (!statusChartInstance) return
  
  const statusCount = {
    in_use: 0,
    standby: 0,
    maintenance: 0,
    broken: 0,
    scrapped: 0
  }
  
  moldList.value.forEach(mold => {
    if (statusCount.hasOwnProperty(mold.status)) {
      statusCount[mold.status]++
    }
  })
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '模具状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: statusCount.in_use, name: '使用中', itemStyle: { color: '#67C23A' } },
          { value: statusCount.standby, name: '待机', itemStyle: { color: '#409EFF' } },
          { value: statusCount.maintenance, name: '保养中', itemStyle: { color: '#E6A23C' } },
          { value: statusCount.broken, name: '故障', itemStyle: { color: '#F56C6C' } },
          { value: statusCount.scrapped, name: '报废', itemStyle: { color: '#909399' } }
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
  
  statusChartInstance.setOption(option)
}

// 处理窗口大小变化
const handleResize = () => {
  if (lifeSpanChartInstance) {
    lifeSpanChartInstance.resize()
  }
  if (statusChartInstance) {
    statusChartInstance.resize()
  }
}
</script>

<style scoped>
.mold-lifecycle {
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
  color: #303133;
}

.actions {
  display: flex;
  gap: 10px;
}

.filter-bar {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 28px;
  margin-right: 20px;
  color: white;
}

.stat-icon.primary {
  background-color: #409EFF;
}

.stat-icon.success {
  background-color: #67C23A;
}

.stat-icon.warning {
  background-color: #E6A23C;
}

.stat-icon.danger {
  background-color: #F56C6C;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  display: flex;
  align-items: baseline;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-unit {
  font-size: 16px;
  color: #909399;
  margin-left: 5px;
  font-weight: normal;
}

.chart-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: calc(100% - 50px);
  width: 100%;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h3 {
  margin: 0;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.shots-info {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 12px;
}

.total-life {
  color: #909399;
}

/* 卡片视图样式 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.mold-card {
  height: 100%;
}

.mold-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.mold-card-header h3 {
  margin: 0;
  font-size: 16px;
}

.life-progress-section {
  margin: 15px 0;
}

.life-progress-section p {
  margin: 5px 0;
}

.card-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

/* 详情页样式 */
.mold-detail {
  padding: 10px 0;
}

.detail-header {
  margin-bottom: 20px;
}

.lifecycle-progress {
  margin: 20px 0;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.lifecycle-progress h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}

.maintenance-history {
  margin-top: 30px;
}

.maintenance-history h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chart-section {
    grid-template-columns: 1fr;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .filter-bar {
    overflow-x: auto;
  }
  
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>