<template>
  <div class="capacity-view">
    <el-card shadow="never">
      <div slot="header" class="header">
        <span>产能视图</span>
        <el-select v-model="viewMode" placeholder="选择视图模式" size="small" @change="handleViewModeChange">
          <el-option label="图表视图" value="chart"></el-option>
          <el-option label="列表视图" value="list"></el-option>
        </el-select>
      </div>
      
      <!-- 图表视图 -->
      <div v-if="viewMode === 'chart'" class="chart-view">
        <div class="chart-container">
          <!-- 这里应该使用图表库，如ECharts -->
          <div class="chart-placeholder">
            <el-empty description="产能分布图表" style="margin: 40px 0;"></el-empty>
          </div>
        </div>
        
        <!-- 产能指标 -->
        <div class="capacity-indicators">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">平均产能利用率</div>
                <div class="indicator-value">{{ averageUtilization }}%</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">瓶颈设备数</div>
                <div class="indicator-value">{{ bottleneckCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">空闲设备数</div>
                <div class="indicator-value">{{ idleCount }}</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="indicator-card">
                <div class="indicator-title">总体负载均衡度</div>
                <div class="indicator-value">{{ balanceDegree }}%</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      
      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table :data="capacityData" style="width: 100%" border>
          <el-table-column prop="workshop" label="所属车间" width="150"></el-table-column>
          <el-table-column prop="equipmentCode" label="设备编号" width="120"></el-table-column>
          <el-table-column prop="equipmentName" label="设备名称" width="180"></el-table-column>
          <el-table-column prop="capacity" label="理论产能" width="120"></el-table-column>
          <el-table-column prop="available" label="可用产能" width="120"></el-table-column>
          <el-table-column prop="utilization" label="利用率" width="120">
            <template slot-scope="scope">
              <el-progress :percentage="scope.row.utilization" :status="getUtilizationStatus(scope.row.utilization)" :format="percentageFormat"></el-progress>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'CapacityView',
  props: {
    workshop: {
      type: String,
      default: ''
    },
    dateRange: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      viewMode: 'chart',
      capacityData: [
        { workshop: '1号车间', equipmentCode: 'EQ001', equipmentName: '数控车床A', capacity: 120, available: 45, utilization: 62.5, status: '正常' },
        { workshop: '1号车间', equipmentCode: 'EQ002', equipmentName: '数控车床B', capacity: 120, available: 15, utilization: 87.5, status: '重载' },
        { workshop: '2号车间', equipmentCode: 'EQ003', equipmentName: '铣床A', capacity: 100, available: 80, utilization: 20, status: '空闲' },
        { workshop: '2号车间', equipmentCode: 'EQ004', equipmentName: '铣床B', capacity: 100, available: 25, utilization: 75, status: '正常' },
        { workshop: '3号车间', equipmentCode: 'EQ005', equipmentName: '钻床A', capacity: 80, available: 5, utilization: 93.75, status: '瓶颈' },
        { workshop: '3号车间', equipmentCode: 'EQ006', equipmentName: '钻床B', capacity: 80, available: 40, utilization: 50, status: '正常' }
      ]
    }
  },
  computed: {
    // 平均产能利用率
    averageUtilization() {
      if (!this.capacityData.length) return 0
      const total = this.capacityData.reduce((sum, item) => sum + item.utilization, 0)
      return Math.round(total / this.capacityData.length)
    },
    // 瓶颈设备数
    bottleneckCount() {
      return this.capacityData.filter(item => item.status === '瓶颈').length
    },
    // 空闲设备数
    idleCount() {
      return this.capacityData.filter(item => item.status === '空闲').length
    },
    // 总体负载均衡度
    balanceDegree() {
      if (!this.capacityData.length) return 0
      // 简化的均衡度计算：基于利用率标准差的倒数
      const avg = this.averageUtilization
      const variance = this.capacityData.reduce((sum, item) => sum + Math.pow(item.utilization - avg, 2), 0) / this.capacityData.length
      const stdDev = Math.sqrt(variance)
      // 转换为0-100的百分比，标准差越小，均衡度越高
      return Math.round(100 - Math.min(stdDev, 50) * 2)
    }
  },
  methods: {
    // 处理视图模式切换
    handleViewModeChange() {
      this.$emit('view-mode-change', this.viewMode)
    },
    // 获取利用率状态对应的进度条状态
    getUtilizationStatus(utilization) {
      if (utilization >= 90) return 'exception'
      if (utilization >= 80) return 'warning'
      return ''
    },
    // 获取状态对应的标签类型
    getStatusType(status) {
      const statusMap = {
        '正常': 'success',
        '重载': 'warning',
        '瓶颈': 'danger',
        '空闲': 'info'
      }
      return statusMap[status] || 'default'
    },
    // 自定义进度条显示格式
    percentageFormat(percentage) {
      return `${percentage}%`
    },
    // 加载产能数据
    loadCapacityData() {
      // 模拟API调用
      this.$emit('data-loading', true)
      setTimeout(() => {
        // 这里可以根据props中的workshop和dateRange过滤数据
        this.$emit('data-loading', false)
        this.$emit('data-loaded', this.capacityData)
      }, 500)
    },
    // 导出产能报告
    exportCapacityReport() {
      this.$emit('export-report', this.capacityData)
    }
  },
  watch: {
    workshop: {
      handler() {
        this.loadCapacityData()
      },
      immediate: false
    },
    dateRange: {
      handler() {
        this.loadCapacityData()
      },
      deep: true,
      immediate: false
    }
  },
  mounted() {
    this.loadCapacityData()
  }
}
</script>

<style scoped>
.capacity-view {
  padding: 10px 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-view {
  padding: 20px 0;
}

.chart-container {
  height: 300px;
  margin-bottom: 30px;
  background-color: #fafafa;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.chart-placeholder {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.capacity-indicators {
  margin-top: 20px;
}

.indicator-card {
  background-color: #fafafa;
  padding: 20px;
  border-radius: 4px;
  text-align: center;
  transition: all 0.3s ease;
}

.indicator-card:hover {
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.indicator-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.indicator-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.list-view {
  padding: 10px 0;
}

.el-progress {
  margin-top: 10px;
}
</style>