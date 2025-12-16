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
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="filterForm.department" placeholder="选择部门">
            <el-option label="全部" value="" />
            <el-option label="生产一部" value="production1" />
            <el-option label="生产二部" value="production2" />
            <el-option label="质检部" value="quality" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="filterForm.equipmentType" placeholder="设备类型">
            <el-option label="全部" value="" />
            <el-option label="注塑机" value="injection" />
            <el-option label="CNC机床" value="cnc" />
            <el-option label="机器人" value="robot" />
            <el-option label="检测设备" value="inspection" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="summary-cards">
      <el-card class="summary-card">
        <template #header>
          <span>平均利用率</span>
        </template>
        <div class="card-content">
          <el-statistic :value="averageUtilization" suffix="%" />
          <el-progress :percentage="averageUtilization" :show-text="false" />
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
    </div>

    <div class="chart-section">
      <el-card>
        <template #header>
          <span>设备利用率趋势</span>
        </template>
        <div id="utilization-trend-chart" style="height: 300px;"></div>
      </el-card>
    </div>

    <div class="table-section">
      <el-card>
        <template #header>
          <span>设备利用率明细</span>
        </template>
        <el-table :data="utilizationData" style="width: 100%">
          <el-table-column prop="equipmentCode" label="设备编号" width="120" />
          <el-table-column prop="equipmentName" label="设备名称" />
          <el-table-column prop="department" label="所属部门" />
          <el-table-column prop="totalHours" label="总时长(小时)" width="120" />
          <el-table-column prop="runningHours" label="运行时长(小时)" width="120" />
          <el-table-column prop="utilization" label="利用率" width="120">
            <template #default="scope">
              <el-progress 
                :percentage="scope.row.utilization" 
                :color="getUtilizationColor(scope.row.utilization)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="downtime" label="停机时长(小时)" width="120" />
          <el-table-column prop="maintenanceHours" label="保养时长(小时)" width="120" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const filterForm = ref({
  dateRange: [],
  department: '',
  equipmentType: ''
})

const utilizationData = ref([])

onMounted(() => {
  loadUtilizationData()
})

const loadUtilizationData = () => {
  // 模拟数据
  utilizationData.value = [
    {
      equipmentCode: 'EQ001',
      equipmentName: '注塑机',
      department: '生产一部',
      totalHours: 720,
      runningHours: 612,
      utilization: 85,
      downtime: 48,
      maintenanceHours: 60
    },
    {
      equipmentCode: 'EQ002',
      equipmentName: 'CNC机床',
      department: '生产二部',
      totalHours: 720,
      runningHours: 662,
      utilization: 92,
      downtime: 28,
      maintenanceHours: 30
    },
    {
      equipmentCode: 'EQ003',
      equipmentName: '装配机器人',
      department: '生产一部',
      totalHours: 720,
      runningHours: 562,
      utilization: 78,
      downtime: 98,
      maintenanceHours: 60
    }
  ]
}

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
  return maxItem ? maxItem.equipmentName : ''
})

const minUtilizationEquipment = computed(() => {
  const minItem = utilizationData.value.find(item => item.utilization === minUtilization.value)
  return minItem ? minItem.equipmentName : ''
})

const totalRunningHours = computed(() => {
  return utilizationData.value.reduce((sum, item) => sum + item.runningHours, 0)
})

const getUtilizationColor = (utilization) => {
  if (utilization >= 90) return '#67c23a'
  if (utilization >= 80) return '#409eff'
  if (utilization >= 70) return '#e6a23c'
  return '#f56c6c'
}

const handleQuery = () => {
  console.log('查询:', filterForm.value)
  loadUtilizationData()
}

const handleReset = () => {
  filterForm.value = {
    dateRange: [],
    department: '',
    equipmentType: ''
  }
}

const handleExportPDF = () => {
  console.log('导出PDF')
}

const handleExportExcel = () => {
  console.log('导出Excel')
}
</script>

<style scoped>
.utilization-report {
  padding: 20px;
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
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  text-align: center;
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

.chart-section {
  margin-bottom: 20px;
}

.table-section {
  margin-bottom: 20px;
}
</style>
EOF