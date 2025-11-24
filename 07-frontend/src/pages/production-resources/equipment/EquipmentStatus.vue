cat > production-resources/equipment/EquipmentStatus.vue <<'EOF'
<template>
  <div class="equipment-status">
    <div class="header">
      <h1>设备状态监控</h1>
      <div class="stats">
        <el-statistic title="运行中" :value="runningCount" />
        <el-statistic title="待机" :value="standbyCount" />
        <el-statistic title="维修中" :value="maintenanceCount" />
        <el-statistic title="故障" :value="brokenCount" />
      </div>
    </div>

    <div class="monitor-grid">
      <div class="status-card" v-for="equipment in realTimeStatus" :key="equipment.id">
        <div class="card-header">
          <h3>{{ equipment.name }}</h3>
          <el-tag :type="getStatusType(equipment.status)">
            {{ getStatusText(equipment.status) }}
          </el-tag>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span>设备编号:</span>
            <span>{{ equipment.code }}</span>
          </div>
          <div class="info-item">
            <span>当前任务:</span>
            <span>{{ equipment.currentTask || '无' }}</span>
          </div>
          <div class="info-item">
            <span>运行时长:</span>
            <span>{{ equipment.runningHours }}小时</span>
          </div>
          <div class="info-item">
            <span>温度:</span>
            <span :class="{ 'warning': equipment.temperature > 80 }">
              {{ equipment.temperature }}°C
            </span>
          </div>
          <div class="info-item">
            <span>振动:</span>
            <span :class="{ 'warning': equipment.vibration > 7 }">
              {{ equipment.vibration }} mm/s
            </span>
          </div>
        </div>
        <div class="card-actions">
          <el-button link type="primary" @click="handleViewDetail(equipment)">详情</el-button>
          <el-button link type="warning" v-if="equipment.status === 'running'" @click="handleStop(equipment)">
            停机
          </el-button>
          <el-button link type="success" v-if="equipment.status === 'standby'" @click="handleStart(equipment)">
            启动
          </el-button>
        </div>
      </div>
    </div>

    <div class="real-time-chart">
      <h3>设备运行趋势</h3>
      <div id="equipment-trend-chart" style="height: 300px;"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const realTimeStatus = ref([])

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

let updateInterval

onMounted(() => {
  loadRealTimeStatus()
  // 模拟实时更新
  updateInterval = setInterval(updateRealTimeData, 5000)
})

onUnmounted(() => {
  clearInterval(updateInterval)
})

const loadRealTimeStatus = () => {
  // 模拟实时数据
  realTimeStatus.value = [
    {
      id: 1,
      code: 'EQ001',
      name: '注塑机',
      status: 'running',
      currentTask: '产品A-注塑',
      runningHours: 156,
      temperature: 75,
      vibration: 5.2
    },
    {
      id: 2,
      code: 'EQ002',
      name: 'CNC机床',
      status: 'maintenance',
      currentTask: null,
      runningHours: 203,
      temperature: 65,
      vibration: 3.1
    },
    {
      id: 3,
      code: 'EQ003',
      name: '装配机器人',
      status: 'standby',
      currentTask: null,
      runningHours: 89,
      temperature: 45,
      vibration: 2.3
    }
  ]
}

const updateRealTimeData = () => {
  // 模拟数据更新
  realTimeStatus.value.forEach(equipment => {
    if (equipment.status === 'running') {
      equipment.runningHours += 0.0014 // 模拟5秒增加
      equipment.temperature += Math.random() * 2 - 1 // 温度波动
      equipment.vibration += Math.random() * 0.5 - 0.25 // 振动波动
    }
  })
}

const getStatusType = (status) => {
  const types = {
    running: 'success',
    standby: 'info',
    maintenance: 'warning',
    broken: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    running: '运行中',
    standby: '待机',
    maintenance: '维修中',
    broken: '故障'
  }
  return texts[status] || '未知'
}

const handleViewDetail = (equipment) => {
  console.log('查看设备详情:', equipment)
}

const handleStop = (equipment) => {
  console.log('停机设备:', equipment)
}

const handleStart = (equipment) => {
  console.log('启动设备:', equipment)
}
</script>

<style scoped>
.equipment-status {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats {
  display: flex;
  gap: 30px;
}

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.status-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-item span:first-child {
  color: #606266;
}

.info-item span:last-child {
  font-weight: 500;
}

.warning {
  color: #e6a23c;
  font-weight: bold;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.real-time-chart {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}
</style>
EOF