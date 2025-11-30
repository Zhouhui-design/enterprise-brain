<template>
  <div class="server-monitor">
    <h2>服务器监控</h2>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">CPU使用率</div>
            <div class="stat-value">{{ cpuUsage }}%</div>
            <el-progress :percentage="cpuUsage" :stroke-width="10" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">内存使用率</div>
            <div class="stat-value">{{ memoryUsage }}%</div>
            <el-progress :percentage="memoryUsage" :stroke-width="10" status="success" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">磁盘使用率</div>
            <div class="stat-value">{{ diskUsage }}%</div>
            <el-progress :percentage="diskUsage" :stroke-width="10" status="warning" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">网络流量</div>
            <div class="stat-value">{{ networkTraffic }} MB/s</div>
            <div class="traffic-indicator">
              <i class="el-icon-arrow-up"></i> {{ uploadSpeed }} MB/s
              <i class="el-icon-arrow-down"></i> {{ downloadSpeed }} MB/s
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">
            <span>CPU使用率趋势</span>
          </div>
          <div ref="cpuChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <div slot="header">
            <span>内存使用率趋势</span>
          </div>
          <div ref="memoryChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const cpuUsage = ref(45)
const memoryUsage = ref(68)
const diskUsage = ref(32)
const networkTraffic = ref(15.2)
const uploadSpeed = ref(8.5)
const downloadSpeed = ref(6.7)

const cpuChart = ref(null)
const memoryChart = ref(null)
let cpuChartInstance = null
let memoryChartInstance = null
let timer = null

// 初始化图表
const initCharts = () => {
  cpuChartInstance = echarts.init(cpuChart.value)
  memoryChartInstance = echarts.init(memoryChart.value)
  
  // CPU图表配置
  const cpuOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} %'
      }
    },
    series: [{
      data: [30, 45, 50, 40, 60, 55, 45],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  }
  
  // 内存图表配置
  const memoryOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} %'
      }
    },
    series: [{
      data: [50, 55, 60, 65, 70, 68, 65],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  }
  
  cpuChartInstance.setOption(cpuOption)
  memoryChartInstance.setOption(memoryOption)
}

// 模拟数据更新
const updateData = () => {
  cpuUsage.value = Math.floor(Math.random() * 30) + 30
  memoryUsage.value = Math.floor(Math.random() * 20) + 60
  diskUsage.value = Math.floor(Math.random() * 10) + 30
  networkTraffic.value = (Math.random() * 20 + 5).toFixed(1)
  uploadSpeed.value = (Math.random() * 10 + 5).toFixed(1)
  downloadSpeed.value = (Math.random() * 10).toFixed(1)
}

onMounted(() => {
  initCharts()
  timer = setInterval(updateData, 3000)
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (cpuChartInstance) cpuChartInstance.resize()
    if (memoryChartInstance) memoryChartInstance.resize()
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (cpuChartInstance) cpuChartInstance.dispose()
  if (memoryChartInstance) memoryChartInstance.dispose()
})
</script>

<style scoped>
.server-monitor {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
}

.traffic-indicator {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.traffic-indicator i {
  margin: 0 5px;
}
</style>