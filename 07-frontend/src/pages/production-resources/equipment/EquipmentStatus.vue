<template>
  <div class="equipment-status">
    <div class="header">
      <h1>设备状态监控</h1>
      <div class="header-actions">
        <div class="stats">
          <el-statistic 
            title="运行中" 
            :value="runningCount" 
            class="stat-item"
            :value-style="{ color: '#67C23A' }"
          />
          <el-statistic 
            title="待机" 
            :value="standbyCount" 
            class="stat-item"
            :value-style="{ color: '#909399' }"
          />
          <el-statistic 
            title="维修中" 
            :value="maintenanceCount" 
            class="stat-item"
            :value-style="{ color: '#E6A23C' }"
          />
          <el-statistic 
            title="故障" 
            :value="brokenCount" 
            class="stat-item"
            :value-style="{ color: '#F56C6C' }"
          />
        </div>
        <div class="control-buttons">
          <el-button type="primary" @click="refreshData">
            <template #icon><Refresh /></template>
            刷新数据
          </el-button>
          <el-button @click="openAlertSettings">
            <template #icon><Settings /></template>
            告警设置
          </el-button>
          <el-button @click="exportData">
            <template #icon><Download /></template>
            导出数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <el-input v-model="searchKeyword" placeholder="搜索设备名称/编号" style="width: 250px">
        <template #append>
          <el-button :icon="Search" @click="handleSearch" />
        </template>
      </el-input>
      <el-select v-model="filterStatus" placeholder="设备状态" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="运行中" value="running" />
        <el-option label="待机" value="standby" />
        <el-option label="维修中" value="maintenance" />
        <el-option label="故障" value="broken" />
      </el-select>
      <el-select v-model="filterDepartment" placeholder="所属部门" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="生产一部" value="生产一部" />
        <el-option label="生产二部" value="生产二部" />
        <el-option label="质检部" value="质检部" />
        <el-option label="研发部" value="研发部" />
      </el-select>
      <el-select v-model="filterType" placeholder="设备类型" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="注塑机" value="注塑机" />
        <el-option label="CNC机床" value="CNC机床" />
        <el-option label="机器人" value="机器人" />
        <el-option label="测量设备" value="测量设备" />
        <el-option label="切割设备" value="切割设备" />
      </el-select>
      <el-switch
        v-model="showAlertOnly"
        active-text="仅显示告警"
        inactive-text="全部显示"
        @change="handleSearch"
      />
    </div>

    <!-- 设备状态卡片网格 -->
    <div class="monitor-grid">
      <div 
        class="status-card" 
        v-for="equipment in filteredEquipmentList" 
        :key="equipment.id"
        :class="{
          'status-running': equipment.status === 'running',
          'status-standby': equipment.status === 'standby',
          'status-maintenance': equipment.status === 'maintenance',
          'status-broken': equipment.status === 'broken',
          'has-alert': hasAlert(equipment)
        }"
      >
        <div class="card-header">
          <div class="header-left">
            <h3>{{ equipment.name }}</h3>
            <span class="equipment-code">{{ equipment.code }}</span>
          </div>
          <div class="header-right">
            <el-tag 
              :type="getStatusType(equipment.status)" 
              effect="dark"
              class="status-tag"
            >
              {{ getStatusText(equipment.status) }}
            </el-tag>
            <el-badge 
              :value="getAlertLevel(equipment)" 
              v-if="hasAlert(equipment)"
              class="alert-badge"
            />
          </div>
        </div>
        
        <div class="card-content">
          <div class="info-item">
            <span>设备类型:</span>
            <el-tag size="small">{{ equipment.type || '未知' }}</el-tag>
          </div>
          <div class="info-item">
            <span>当前任务:</span>
            <span class="task-name">{{ equipment.currentTask || '无' }}</span>
          </div>
          <div class="info-item">
            <span>运行时长:</span>
            <span>{{ formatRunningHours(equipment.runningHours) }}</span>
          </div>
          
          <!-- 设备效率 -->
          <div class="info-item" v-if="equipment.status === 'running'">
            <span>设备效率:</span>
            <div class="metric-container">
              <span>{{ ((equipment.energyConsumption / 10) * 100).toFixed(0) }}%</span>
              <el-progress 
                :percentage="(equipment.energyConsumption / 10) * 100" 
                :color="getEfficiencyColor(equipment.energyConsumption)"
                :show-text="false"
                class="mini-progress"
              />
            </div>
          </div>
          
          <!-- 温度监控 -->
          <div class="info-item">
            <span>温度:</span>
            <div class="metric-container">
              <span 
                :class="getAlertClass('temperature', equipment.temperature)"
              >
                {{ equipment.temperature.toFixed(1) }}°C
              </span>
              <el-progress 
                :percentage="getPercentage('temperature', equipment.temperature)" 
                :color="getProgressColor('temperature', equipment.temperature)"
                :show-text="false"
                class="mini-progress"
              />
            </div>
          </div>
          
          <!-- 振动监控 -->
          <div class="info-item">
            <span>振动:</span>
            <div class="metric-container">
              <span 
                :class="getAlertClass('vibration', equipment.vibration)"
              >
                {{ equipment.vibration.toFixed(1) }} mm/s
              </span>
              <el-progress 
                :percentage="getPercentage('vibration', equipment.vibration)" 
                :color="getProgressColor('vibration', equipment.vibration)"
                :show-text="false"
                class="mini-progress"
              />
            </div>
          </div>
          
          <!-- 能耗监控 -->
          <div class="info-item">
            <span>能耗:</span>
            <span 
              :class="getAlertClass('energy', equipment.energyConsumption)"
            >
              {{ equipment.energyConsumption.toFixed(1) }} kW
            </span>
          </div>
          
          <!-- 噪音监控 -->
          <div class="info-item">
            <span>噪音:</span>
            <span 
              :class="getAlertClass('noise', equipment.noiseLevel)"
            >
              {{ equipment.noiseLevel.toFixed(1) }} dB
            </span>
          </div>
        </div>
        
        <div class="card-actions">
          <el-button 
            link 
            type="primary" 
            size="small" 
            @click="handleViewDetail(equipment)"
          >
            详情
          </el-button>
          <el-button 
            link 
            type="warning" 
            size="small" 
            v-if="equipment.status === 'running'" 
            @click="handleStop(equipment)"
          >
            停机
          </el-button>
          <el-button 
            link 
            type="success" 
            size="small" 
            v-if="equipment.status === 'standby'" 
            @click="handleStart(equipment)"
          >
            启动
          </el-button>
          <el-button 
            link 
            type="info" 
            size="small" 
            @click="handleMaintenance(equipment)"
            v-if="equipment.status !== 'maintenance'"
          >
            维修
          </el-button>
          <el-button 
            link 
            type="success" 
            size="small" 
            @click="handleResume(equipment)"
            v-if="equipment.status === 'maintenance'"
          >
            恢复
          </el-button>
        </div>
        <div class="alert-history-preview" v-if="equipment.recentAlerts && equipment.recentAlerts.length > 0">
          <div class="alert-header">
            <el-icon class="alert-icon"><AlertCircle /></el-icon>
            <span class="alert-count">{{ equipment.recentAlerts.length }}条告警</span>
            <el-button 
              link 
              size="small" 
              @click="showAlertHistory(equipment)"
            >
              查看全部
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史告警对话框 -->
    <el-dialog v-model="alertHistoryVisible" title="设备告警历史" width="800px">
      <el-table 
        :data="selectedEquipment.alertsHistory || []" 
        style="width: 100%"
        v-loading="loadingAlerts"
      >
        <el-table-column prop="time" label="告警时间" width="180" />
        <el-table-column prop="type" label="告警类型" width="100" />
        <el-table-column prop="level" label="告警级别" width="80">
          <template #default="scope">
            <el-tag 
              :type="scope.row.level === 'high' ? 'danger' : scope.row.level === 'medium' ? 'warning' : 'info'"
              size="small"
            >
              {{ scope.row.level === 'high' ? '高' : scope.row.level === 'medium' ? '中' : '低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="告警值" width="100" />
        <el-table-column prop="message" label="告警描述" />
        <el-table-column prop="status" label="处理状态" width="100">
          <template #default="scope">
            <el-tag 
              :type="scope.row.status === 'handled' ? 'success' : 'warning'"
              size="small"
            >
              {{ scope.row.status === 'handled' ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 实时趋势图表 -->
    <div class="charts-section">
      <div class="chart-row">
        <div class="chart-item">
          <h3>设备运行趋势</h3>
          <div ref="trendChartRef" style="height: 350px;"></div>
        </div>
        <div class="chart-item">
          <h3>设备状态分布</h3>
          <div ref="statusChartRef" style="height: 350px;"></div>
        </div>
      </div>
      <div class="chart-row">
        <div class="chart-item">
          <h3>温度异常监控</h3>
          <div ref="tempAlertChartRef" style="height: 300px;"></div>
        </div>
        <div class="chart-item">
          <h3>设备告警统计</h3>
          <div ref="alertStatsChartRef" style="height: 300px;"></div>
        </div>
      </div>
    </div>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="设备详情" width="800px" destroy-on-close>
      <div class="equipment-detail">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-descriptions border :column="1" title="基本信息">
              <el-descriptions-item label="设备编号">{{ selectedEquipment.code }}</el-descriptions-item>
              <el-descriptions-item label="设备名称">{{ selectedEquipment.name }}</el-descriptions-item>
              <el-descriptions-item label="设备型号">{{ selectedEquipment.model }}</el-descriptions-item>
              <el-descriptions-item label="所属部门">{{ selectedEquipment.department }}</el-descriptions-item>
              <el-descriptions-item label="设备状态">
                <el-tag :type="getStatusType(selectedEquipment.status)" effect="dark">
                  {{ getStatusText(selectedEquipment.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="当前任务">{{ selectedEquipment.currentTask || '无' }}</el-descriptions-item>
              <el-descriptions-item label="运行时长">{{ formatRunningHours(selectedEquipment.runningHours) }}</el-descriptions-item>
            </el-descriptions>
          </el-col>
          <el-col :span="12">
            <el-descriptions border :column="1" title="实时参数">
              <el-descriptions-item label="温度">
                <div class="metric-detail">
                  <span 
                    :class="getAlertClass('temperature', selectedEquipment.temperature)"
                  >
                    {{ selectedEquipment.temperature.toFixed(1) }}°C
                  </span>
                  <span class="threshold-info">
                    (阈值: 80°C)
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="振动">
                <div class="metric-detail">
                  <span 
                    :class="getAlertClass('vibration', selectedEquipment.vibration)"
                  >
                    {{ selectedEquipment.vibration.toFixed(1) }} mm/s
                  </span>
                  <span class="threshold-info">
                    (阈值: 7 mm/s)
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="能耗">
                <div class="metric-detail">
                  <span 
                    :class="getAlertClass('energy', selectedEquipment.energyConsumption)"
                  >
                    {{ selectedEquipment.energyConsumption.toFixed(1) }} kW
                  </span>
                  <span class="threshold-info">
                    (阈值: 10 kW)
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="噪音">
                <div class="metric-detail">
                  <span 
                    :class="getAlertClass('noise', selectedEquipment.noiseLevel)"
                  >
                    {{ selectedEquipment.noiseLevel.toFixed(1) }} dB
                  </span>
                  <span class="threshold-info">
                    (阈值: 85 dB)
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="最后维护时间">
                {{ selectedEquipment.lastMaintenance || '未知' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
        
        <el-divider />
        
        <div class="recent-alerts" v-if="selectedEquipment.recentAlerts && selectedEquipment.recentAlerts.length > 0">
          <h4>最近告警</h4>
          <el-table :data="selectedEquipment.recentAlerts" style="width: 100%">
            <el-table-column prop="time" label="时间" width="150" />
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="level" label="级别" width="80">
              <template #default="scope">
                <el-tag 
                  :type="scope.row.level === 'high' ? 'danger' : 'warning'"
                  size="small"
                >
                  {{ scope.row.level === 'high' ? '高' : '中' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="描述" />
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 告警设置对话框 -->
    <el-dialog v-model="alertSettingsVisible" title="告警阈值设置" width="500px">
      <el-form :model="alertThresholds" label-width="120px">
        <el-form-item label="温度阈值(°C)">
          <el-slider 
            v-model="alertThresholds.temperature" 
            :min="60" 
            :max="100" 
            :step="1"
            show-input
          />
        </el-form-item>
        <el-form-item label="振动阈值(mm/s)">
          <el-slider 
            v-model="alertThresholds.vibration" 
            :min="5" 
            :max="15" 
            :step="0.1"
            show-input
          />
        </el-form-item>
        <el-form-item label="能耗阈值(kW)">
          <el-slider 
            v-model="alertThresholds.energy" 
            :min="5" 
            :max="20" 
            :step="0.1"
            show-input
          />
        </el-form-item>
        <el-form-item label="噪音阈值(dB)">
          <el-slider 
            v-model="alertThresholds.noise" 
            :min="70" 
            :max="100" 
            :step="1"
            show-input
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="alertSettingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveAlertSettings">保存设置</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { Search, Download, Clock, BarChart, Settings, AlertCircle, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 响应式数据
const realTimeStatus = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const filterDepartment = ref('')
const filterType = ref('')
const showAlertOnly = ref(false)
const alertSettingsVisible = ref(false)
const detailDialogVisible = ref(false)
const alertHistoryVisible = ref(false)
const selectedEquipment = ref({})
const loadingAlerts = ref(false)

// 图表引用
const trendChartRef = ref(null)
const statusChartRef = ref(null)
const tempAlertChartRef = ref(null)
const alertStatsChartRef = ref(null)
const energyChartRef = ref(null)
let trendChart = null
let statusChart = null
let tempAlertChart = null
let alertStatsChart = null
let energyChart = null

// 告警阈值设置
const alertThresholds = ref({
  temperature: 80,
  vibration: 7,
  energy: 10,
  noise: 85
})

// 状态计数器
const runningCount = computed(() => 
  realTimeStatus.value.filter(e => e.status === 'running').length
)
const standbyCount = computed(() => 
  realTimeStatus.value.filter(e => e.status === 'standby').length
)
const maintenanceCount = computed(() => 
  realTimeStatus.value.filter(e => e.status === 'maintenance').length
)
const brokenCount = computed(() => 
  realTimeStatus.value.filter(e => e.status === 'broken').length
)

// 定时器
let updateInterval
let chartUpdateInterval

// 计算属性 - 筛选后的设备列表
const filteredEquipmentList = computed(() => {
  let filtered = [...realTimeStatus.value]
  
  // 搜索关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.code.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.model.toLowerCase().includes(keyword)
    )
  }
  
  // 状态筛选
  if (filterStatus.value) {
    filtered = filtered.filter(item => item.status === filterStatus.value)
  }
  
  // 部门筛选
  if (filterDepartment.value) {
    filtered = filtered.filter(item => item.department === filterDepartment.value)
  }
  
  // 设备类型筛选
  if (filterType.value) {
    filtered = filtered.filter(item => item.name.includes(filterType.value))
  }
  
  // 仅显示告警设备
  if (showAlertOnly.value) {
    filtered = filtered.filter(item => hasAlert(item))
  }
  
  return filtered
})

// 生命周期钩子
onMounted(async () => {
  await loadRealTimeStatus()
  await nextTick()
  initCharts()
  
  // 模拟实时更新
  updateInterval = setInterval(updateRealTimeData, 5000)
  chartUpdateInterval = setInterval(updateCharts, 10000)
})

onUnmounted(() => {
  clearInterval(updateInterval)
  clearInterval(chartUpdateInterval)
  // 销毁图表
  if (trendChart) trendChart.dispose()
  if (statusChart) statusChart.dispose()
  if (tempAlertChart) tempAlertChart.dispose()
  if (alertStatsChart) alertStatsChart.dispose()
})

// 加载实时数据
const loadRealTimeStatus = () => {
  // 模拟实时数据
  realTimeStatus.value = [
    {
      id: 1,
      code: 'EQ001',
      name: '注塑机',
      type: '注塑机',
      model: 'ZS-2000',
      department: '生产一部',
      status: 'running',
      currentTask: '产品A-注塑',
      runningHours: 156.8,
      temperature: 75.2,
      vibration: 5.2,
      energyConsumption: 8.5,
      noiseLevel: 78.5,
      lastMaintenance: '2024-01-10',
      recentAlerts: [
        { time: '2024-01-15 10:30', type: '温度', level: 'medium', message: '温度接近阈值' },
        { time: '2024-01-14 16:45', type: '振动', level: 'medium', message: '振动异常波动' }
      ]
    },
    {
      id: 2,
      code: 'EQ002',
      name: 'CNC机床',
      type: 'CNC机床',
      model: 'CNC-850',
      department: '生产二部',
      status: 'maintenance',
      currentTask: null,
      runningHours: 203.5,
      temperature: 65.3,
      vibration: 3.1,
      energyConsumption: 1.2,
      noiseLevel: 65.2,
      lastMaintenance: '2024-01-05',
      recentAlerts: [
        { time: '2024-01-15 09:15', type: '故障', level: 'high', message: '主轴异常' }
      ]
    },
    {
      id: 3,
      code: 'EQ003',
      name: '装配机器人',
      type: '机器人',
      model: 'ABB-6700',
      department: '生产一部',
      status: 'standby',
      currentTask: null,
      runningHours: 89.2,
      temperature: 45.8,
      vibration: 2.3,
      energyConsumption: 0.5,
      noiseLevel: 55.0,
      lastMaintenance: '2024-01-12',
      recentAlerts: []
    },
    {
      id: 4,
      code: 'EQ004',
      name: '激光切割机',
      type: '切割设备',
      model: 'LC-3015',
      department: '研发部',
      status: 'running',
      currentTask: '样品切割',
      runningHours: 120.5,
      temperature: 82.5, // 超过阈值
      vibration: 4.8,
      energyConsumption: 9.2,
      noiseLevel: 82.3,
      lastMaintenance: '2024-01-08',
      recentAlerts: [
        { time: '2024-01-15 11:20', type: '温度', level: 'high', message: '温度超过阈值' }
      ]
    },
    {
      id: 5,
      code: 'EQ005',
      name: '三坐标测量机',
      type: '测量设备',
      model: 'CMM-500',
      department: '质检部',
      status: 'running',
      currentTask: '产品尺寸检测',
      runningHours: 95.6,
      temperature: 25.3,
      vibration: 1.2,
      energyConsumption: 3.5,
      noiseLevel: 58.7,
      lastMaintenance: '2023-12-28',
      recentAlerts: []
    },
    {
      id: 6,
      code: 'EQ006',
      name: '冲床',
      type: '其他设备',
      model: 'P-300',
      department: '生产二部',
      status: 'broken',
      currentTask: null,
      runningHours: 350.2,
      temperature: 55.8,
      vibration: 8.5, // 超过阈值
      energyConsumption: 0.8,
      noiseLevel: 62.1,
      lastMaintenance: '2023-12-20',
      recentAlerts: [
        { time: '2024-01-15 08:45', type: '振动', level: 'high', message: '振动严重超标' },
        { time: '2024-01-14 22:10', type: '故障', level: 'high', message: '液压系统故障' }
      ]
    }
  ]
}

// 更新实时数据
const updateRealTimeData = () => {
  realTimeStatus.value.forEach(equipment => {
    if (equipment.status === 'running') {
      // 模拟数据更新
      equipment.runningHours += 0.0014 // 模拟5秒增加
      equipment.temperature = Math.max(40, Math.min(90, equipment.temperature + (Math.random() * 2 - 1))) // 温度波动
      equipment.vibration = Math.max(1, Math.min(10, equipment.vibration + (Math.random() * 0.5 - 0.25))) // 振动波动
      equipment.energyConsumption = Math.max(0.5, Math.min(15, equipment.energyConsumption + (Math.random() * 0.4 - 0.2))) // 能耗波动
      equipment.noiseLevel = Math.max(50, Math.min(95, equipment.noiseLevel + (Math.random() * 2 - 1))) // 噪音波动
      
      // 模拟随机告警产生
      if (Math.random() > 0.9) {
        const alertTypes = ['温度', '振动', '能耗', '噪音']
        const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
        const now = new Date()
        const alertTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        
        if (!equipment.recentAlerts) equipment.recentAlerts = []
        equipment.recentAlerts.unshift({
          time: alertTime,
          type: randomType,
          level: Math.random() > 0.7 ? 'high' : 'medium',
          message: `${randomType}异常波动`
        })
        
        // 只保留最近5条告警
        if (equipment.recentAlerts.length > 5) {
          equipment.recentAlerts.pop()
        }
      }
    }
  })
}

// 初始化图表
const initCharts = () => {
  // 运行趋势图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    updateTrendChart()
  }
  
  // 状态分布图
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    updateStatusChart()
  }
  
  // 温度异常监控图
  if (tempAlertChartRef.value) {
    tempAlertChart = echarts.init(tempAlertChartRef.value)
    updateTempAlertChart()
  }
  
  // 告警统计图表
  if (alertStatsChartRef.value) {
    alertStatsChart = echarts.init(alertStatsChartRef.value)
    updateAlertStatsChart()
  }
  
  // 能耗趋势图表
  if (energyChartRef.value) {
    energyChart = echarts.init(energyChartRef.value)
    updateEnergyTrendChart()
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
}

// 更新所有图表
const updateCharts = () => {
  updateTrendChart()
  updateStatusChart()
  updateTempAlertChart()
  updateAlertStatsChart()
  updateEnergyTrendChart()
}

// 更新趋势图
const updateTrendChart = () => {
  if (!trendChart) return
  
  const runningEquipments = realTimeStatus.value.filter(e => e.status === 'running')
  const categories = runningEquipments.map(e => e.name)
  const temperatures = runningEquipments.map(e => e.temperature)
  const vibrations = runningEquipments.map(e => e.vibration)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    legend: {
      data: ['温度(°C)', '振动(mm/s)']
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisPointer: {
        type: 'shadow'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '温度(°C)',
        min: 0,
        max: 100,
        interval: 20
      },
      {
        type: 'value',
        name: '振动(mm/s)',
        min: 0,
        max: 10,
        interval: 2
      }
    ],
    series: [
      {
        name: '温度(°C)',
        type: 'bar',
        data: temperatures,
        itemStyle: {
          color: '#F56C6C'
        }
      },
      {
        name: '振动(mm/s)',
        type: 'line',
        yAxisIndex: 1,
        data: vibrations,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 更新状态分布图
const updateStatusChart = () => {
  if (!statusChart) return
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['运行中', '待机', '维修中', '故障']
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: '55%',
        center: ['50%', '60%'],
        data: [
          { value: runningCount.value, name: '运行中', itemStyle: { color: '#67C23A' } },
          { value: standbyCount.value, name: '待机', itemStyle: { color: '#909399' } },
          { value: maintenanceCount.value, name: '维修中', itemStyle: { color: '#E6A23C' } },
          { value: brokenCount.value, name: '故障', itemStyle: { color: '#F56C6C' } }
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
  
  statusChart.setOption(option)
}

// 获取效率颜色
const getEfficiencyColor = (consumption) => {
  if (consumption < 5) return '#67C23A'
  if (consumption < 8) return '#E6A23C'
  return '#F56C6C'
}

// 温度异常监控图
const updateTempAlertChart = () => {
  if (!tempAlertChart) return
  
  const equipments = realTimeStatus.value.sort((a, b) => b.temperature - a.temperature).slice(0, 5)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '温度(°C)'
    },
    yAxis: {
      type: 'category',
      data: equipments.map(e => e.name)
    },
    series: [
      {
        name: '温度',
        type: 'bar',
        data: equipments.map(e => ({
          value: e.temperature,
          itemStyle: {
            color: e.temperature > alertThresholds.value.temperature ? '#F56C6C' : '#67C23A'
          }
        }))
      },
      {
        name: '阈值线',
        type: 'scatter',
        symbolSize: 10,
        data: equipments.map(() => alertThresholds.value.temperature),
        itemStyle: {
          color: '#E6A23C'
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: alertThresholds.value.temperature,
              lineStyle: {
                color: '#E6A23C',
                type: 'dashed'
              },
              label: {
                formatter: '阈值: ' + alertThresholds.value.temperature + '°C'
              }
            }
          ]
        }
      }
    },
  ]
  
  tempAlertChart.setOption(option)
}

// 能耗趋势图表
const updateEnergyTrendChart = () => {
  if (!energyChart) return
  
  const runningEquipments = realTimeStatus.value.filter(e => e.status === 'running')
  const categories = runningEquipments.map(e => e.name)
  const energies = runningEquipments.map(e => e.energyConsumption)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
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
      data: categories,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '能耗(kW)'
    },
    series: [
      {
        name: '能耗',
        type: 'bar',
        data: energies.map(value => ({
          value,
          itemStyle: {
            color: value > alertThresholds.value.energy ? '#F56C6C' : '#67C23A'
          }
        })),
        markLine: {
          data: [{
            yAxis: alertThresholds.value.energy,
            name: '能耗阈值',
            lineStyle: {
              color: '#E6A23C',
              type: 'dashed'
            }
          }]
        }
      }
    ]
  }
  
  energyChart.setOption(option)
}

// 更新告警统计图表
const updateAlertStatsChart = () => {
  if (!alertStatsChart) return
  
  // 统计告警类型
  const alertStats = {
    温度: 0,
    振动: 0,
    能耗: 0,
    噪音: 0,
    故障: 0
  }
  
  realTimeStatus.value.forEach(equipment => {
    if (equipment.recentAlerts) {
      equipment.recentAlerts.forEach(alert => {
        alertStats[alert.type] = (alertStats[alert.type] || 0) + 1
      })
    }
  })
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}次'
    },
    radar: {
      indicator: Object.keys(alertStats).map(key => ({
        name: key,
        max: Math.max(...Object.values(alertStats)) * 1.2 || 1
      }))
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: Object.values(alertStats),
            name: '告警统计',
            itemStyle: {
              color: '#67C23A'
            },
            areaStyle: {
              color: 'rgba(103, 194, 58, 0.3)'
            }
          }
        ]
      }
    ]
  }
  
  alertStatsChart.setOption(option)
}

// 处理窗口大小变化
const handleResize = () => {
  if (trendChart) trendChart.resize()
  if (statusChart) statusChart.resize()
  if (tempAlertChart) tempAlertChart.resize()
  if (alertStatsChart) alertStatsChart.resize()
  if (energyChart) energyChart.resize()
}

// 获取状态类型样式
const getStatusType = (status) => {
  const types = {
    running: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    standby: '待机',
    maintenance: '维修中',
    broken: '故障'
  }
  return texts[status] || '未知'
}

// 格式化运行时长
const formatRunningHours = (hours) => {
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  if (days > 0) {
    return `${days}天${remainingHours.toFixed(1)}小时`
  }
  return `${hours.toFixed(1)}小时`
}

// 检查设备是否有告警
const hasAlert = (equipment) => {
  return (
    equipment.temperature > alertThresholds.value.temperature * 0.9 ||
    equipment.vibration > alertThresholds.value.vibration * 0.9 ||
    equipment.energyConsumption > alertThresholds.value.energy * 0.9 ||
    equipment.noiseLevel > alertThresholds.value.noise * 0.9 ||
    (equipment.recentAlerts && equipment.recentAlerts.length > 0)
  )
}

// 获取告警级别
const getAlertLevel = (equipment) => {
  const hasHighAlert = (
    equipment.temperature > alertThresholds.value.temperature ||
    equipment.vibration > alertThresholds.value.vibration ||
    equipment.energyConsumption > alertThresholds.value.energy ||
    equipment.noiseLevel > alertThresholds.value.noise ||
    (equipment.recentAlerts && equipment.recentAlerts.some(a => a.level === 'high'))
  )
  return hasHighAlert ? '高' : '中'
}

// 获取告警样式类
const getAlertClass = (type, value) => {
  const threshold = alertThresholds.value[type]
  if (value > threshold) return 'alert-high'
  if (value > threshold * 0.9) return 'alert-medium'
  return 'alert-normal'
}

// 获取进度条颜色
const getProgressColor = (type, value) => {
  const threshold = alertThresholds.value[type]
  if (value > threshold) return '#F56C6C'
  if (value > threshold * 0.9) return '#E6A23C'
  return '#67C23A'
}

// 获取百分比
const getPercentage = (type, value) => {
  const threshold = alertThresholds.value[type]
  return Math.min(100, (value / threshold) * 100)
}

// 搜索处理
const handleSearch = () => {
  // 搜索已经通过计算属性自动处理
}

// 查看设备详情
const handleViewDetail = (equipment) => {
  selectedEquipment.value = { ...equipment }
  detailDialogVisible.value = true
}

// 停机设备
const handleStop = (equipment) => {
  ElMessageBox.confirm(
    `确定要停机设备「${equipment.name}」吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    equipment.status = 'standby'
    equipment.currentTask = null
    ElMessage.success('设备已停机')
  })
}

// 启动设备
const handleStart = (equipment) => {
  ElMessageBox.confirm(
    `确定要启动设备「${equipment.name}」吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    equipment.status = 'running'
    equipment.currentTask = '生产任务'
    ElMessage.success('设备已启动')
  })
}

// 维修设备
const handleMaintenance = (equipment) => {
  ElMessageBox.confirm(
    `确定要将设备「${equipment.name}」设为维修状态吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    equipment.status = 'maintenance'
    equipment.currentTask = null
    ElMessage.success('设备已进入维修状态')
  })
}

// 恢复设备
const handleResume = (equipment) => {
  ElMessageBox.confirm(
    `确定要恢复设备「${equipment.name}」的运行吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    equipment.status = 'standby'
    ElMessage.success('设备已恢复')
  })
}

// 打开告警设置
const openAlertSettings = () => {
  alertSettingsVisible.value = true
}

// 显示告警历史
const showAlertHistory = (equipment) => {
  selectedEquipment.value = { ...equipment }
  loadingAlerts.value = true
  
  // 模拟加载历史告警数据
  setTimeout(() => {
    // 生成模拟历史告警数据
    const historyData = []
    const now = new Date()
    
    for (let i = 0; i < 20; i++) {
      const alertTime = new Date(now.getTime() - i * 2 * 60 * 60 * 1000) // 每2小时一条
      const alertTypes = ['温度', '振动', '能耗', '噪音', '故障']
      const levels = ['high', 'medium', 'low']
      const statuses = ['handled', 'pending']
      
      historyData.push({
        id: i + 1,
        time: `${alertTime.getFullYear()}-${String(alertTime.getMonth() + 1).padStart(2, '0')}-${String(alertTime.getDate()).padStart(2, '0')} ${String(alertTime.getHours()).padStart(2, '0')}:${String(alertTime.getMinutes()).padStart(2, '0')}`,
        type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
        level: levels[Math.floor(Math.random() * levels.length)],
        value: (Math.random() * 50 + 30).toFixed(1),
        message: `${equipment.name}${alertTypes[Math.floor(Math.random() * alertTypes.length)]}异常`,
        status: i < 15 ? statuses[0] : statuses[1]
      })
    }
    
    selectedEquipment.value.alertsHistory = historyData
    loadingAlerts.value = false
    alertHistoryVisible.value = true
  }, 500)
}

// 保存告警设置
const saveAlertSettings = () => {
  ElMessage.success('告警阈值设置已保存')
  alertSettingsVisible.value = false
  updateCharts() // 更新图表以反映新的阈值
}

// 导出数据
const exportData = () => {
  if (filteredEquipmentList.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  // 模拟导出功能
  ElMessage.success(`成功导出 ${filteredEquipmentList.value.length} 条设备状态数据`)
}

// 刷新数据
const refreshData = () => {
  loadRealTimeStatus()
  updateCharts()
  ElMessage.success('数据已刷新')
}
</script>

<style scoped>
.equipment-status {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin-bottom: 15px;
  color: #303133;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  text-align: center;
}

.control-buttons {
  display: flex;
  gap: 10px;
}

.toolbar {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  align-items: center;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.status-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #dcdfe6;
}

.status-card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.status-running {
  border-left-color: #67C23A;
}

.status-standby {
  border-left-color: #909399;
}

.status-maintenance {
  border-left-color: #E6A23C;
}

.status-broken {
  border-left-color: #F56C6C;
}

.status-card.has-alert {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 4px 20px 0 rgba(245, 108, 108, 0.3);
  }
  100% {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.equipment-code {
  font-size: 12px;
  color: #909399;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-tag {
  font-size: 14px;
}

.alert-badge {
  background-color: #F56C6C;
}

.card-content {
  margin-bottom: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
}

.info-item span:first-child {
  color: #606266;
}

.task-name {
  font-weight: 500;
  color: #303133;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-progress {
  width: 100px;
  height: 6px;
}

.alert-high {
  color: #F56C6C;
  font-weight: bold;
}

.alert-medium {
  color: #E6A23C;
  font-weight: 500;
}

.alert-normal {
  color: #67C23A;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.charts-section {
  margin-top: 30px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.chart-item h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #303133;
}

.equipment-detail {
  padding: 10px;
}

.metric-detail {
  display: flex;
  align-items: center;
  gap: 10px;
}

.threshold-info {
  font-size: 12px;
  color: #909399;
}

.recent-alerts h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #303133;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 1200px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .stats {
    justify-content: space-around;
  }
  
  .control-buttons {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .monitor-grid {
    grid-template-columns: 1fr;
  }
  
  .stats {
    flex-wrap: wrap;
  }
}
</style>