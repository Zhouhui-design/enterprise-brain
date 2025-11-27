<template>
  <div class="efficiency-chart">
    <div class="chart-header">
      <h3>生产效率分析</h3>
      <div class="header-controls">
        <el-select v-model="chartType" placeholder="图表类型">
          <el-option label="效率趋势图" value="trend" />
          <el-option label="效率对比图" value="comparison" />
          <el-option label="工时利用率" value="utilization" />
        </el-select>
        <el-select v-model="timeRange" placeholder="时间范围">
          <el-option label="近7天" value="7days" />
          <el-option label="近30天" value="30days" />
          <el-option label="近90天" value="90days" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <el-date-picker
          v-if="timeRange === 'custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleCustomDateChange"
        />
        <el-select v-model="workshopId" placeholder="选择车间">
          <el-option label="全部车间" value="" />
          <el-option v-for="workshop in workshops" :key="workshop.id" :label="workshop.name" :value="workshop.id" />
        </el-select>
      </div>
    </div>

    <div class="efficiency-content">
      <!-- 效率概览 -->
      <div class="efficiency-overview">
        <el-card shadow="hover" v-for="stat in efficiencyStats" :key="stat.key" class="overview-card">
          <div class="stat-item">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-trend" :class="stat.trendType">
              <el-icon v-if="stat.trendType === 'up'"><ArrowUp /></el-icon>
              <el-icon v-else-if="stat.trendType === 'down'"><ArrowDown /></el-icon>
              <span>{{ stat.trendValue }}%</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 图表展示 -->
      <div class="charts-container">
        <!-- 趋势图 -->
        <el-card shadow="hover" v-if="chartType === 'trend'" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>生产效率趋势</span>
              <el-select v-model="trendMetric" placeholder="指标" size="small">
                <el-option label="综合效率" value="oee" />
                <el-option label="产出效率" value="output" />
                <el-option label="工时效率" value="labor" />
              </el-select>
            </div>
          </template>
          <div ref="trendChartRef" class="chart"></div>
        </el-card>

        <!-- 对比图 -->
        <el-card shadow="hover" v-if="chartType === 'comparison'" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>效率对比分析</span>
              <el-select v-model="comparisonDimension" placeholder="维度" size="small">
                <el-option label="按车间" value="workshop" />
                <el-option label="按产线" value="line" />
                <el-option label="按班次" value="shift" />
              </el-select>
            </div>
          </template>
          <div ref="comparisonChartRef" class="chart"></div>
        </el-card>

        <!-- 利用率图 -->
        <el-card shadow="hover" v-if="chartType === 'utilization'" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>工时利用率分析</span>
            </div>
          </template>
          <div ref="utilizationChartRef" class="chart"></div>
        </el-card>
      </div>

      <!-- 详细数据表格 -->
      <div class="efficiency-table-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>效率明细数据</span>
            </div>
          </template>
          <el-table
            :data="efficiencyData"
            style="width: 100%"
            border
            stripe
          >
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="workshopName" label="车间" width="120" />
            <el-table-column prop="lineName" label="产线" width="120" />
            <el-table-column prop="productName" label="产品" width="150" />
            <el-table-column prop="plannedOutput" label="计划产量" width="100" align="center" />
            <el-table-column prop="actualOutput" label="实际产量" width="100" align="center" />
            <el-table-column prop="outputRate" label="产出率" width="100" align="center">
              <template #default="scope">
                <el-progress :percentage="parseFloat(scope.row.outputRate)" :format="rateFormat" size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="plannedHours" label="计划工时" width="100" align="center" />
            <el-table-column prop="actualHours" label="实际工时" width="100" align="center" />
            <el-table-column prop="efficiencyRate" label="效率" width="100" align="center">
              <template #default="scope">
                <el-tag :type="getEfficiencyTagType(scope.row.efficiencyRate)">
                  {{ scope.row.efficiencyRate }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script>
// 这里假设项目中已经引入了 ECharts
// 实际使用时需要确保已安装并引入 echarts
// import * as echarts from 'echarts'

export default {
  name: 'EfficiencyChart',
  data() {
    return {
      chartType: 'trend',
      timeRange: '30days',
      customDateRange: [],
      workshopId: '',
      trendMetric: 'oee',
      comparisonDimension: 'workshop',
      currentPage: 1,
      pageSize: 20,
      total: 0,
      efficiencyStats: [
        { key: 'avgEfficiency', label: '平均效率', value: '0.00%', trendType: 'up', trendValue: 2.5 },
        { key: 'oee', label: 'OEE', value: '0.00%', trendType: 'up', trendValue: 1.8 },
        { key: 'outputRate', label: '产出达成率', value: '0.00%', trendType: 'down', trendValue: 0.5 },
        { key: 'laborEfficiency', label: '工时效率', value: '0.00%', trendType: 'up', trendValue: 3.2 }
      ],
      efficiencyData: [],
      workshops: [
        { id: 'workshop1', name: '冲压车间' },
        { id: 'workshop2', name: '装配车间' },
        { id: 'workshop3', name: '机加工车间' },
        { id: 'workshop4', name: '焊接车间' }
      ],
      // 图表实例
      trendChart: null,
      comparisonChart: null,
      utilizationChart: null
    };
  },
  mounted() {
    this.initDateRange();
    this.loadEfficiencyData();
    this.$nextTick(() => {
      this.initCharts();
    });
  },
  beforeUnmount() {
    // 销毁图表实例
    this.disposeCharts();
  },
  watch: {
    chartType() {
      this.$nextTick(() => {
        this.updateCharts();
      });
    },
    timeRange() {
      this.currentPage = 1;
      this.loadEfficiencyData();
    },
    workshopId() {
      this.currentPage = 1;
      this.loadEfficiencyData();
    }
  },
  methods: {
    initDateRange() {
      // 初始化自定义日期范围为近30天
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      this.customDateRange = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ];
    },
    handleCustomDateChange() {
      this.currentPage = 1;
      this.loadEfficiencyData();
    },
    loadEfficiencyData() {
      // 模拟加载数据
      this.mockLoadEfficiencyStats();
      this.mockLoadEfficiencyData();
      this.$nextTick(() => {
        this.updateCharts();
      });
    },
    mockLoadEfficiencyStats() {
      // 模拟统计数据
      this.efficiencyStats = [
        { key: 'avgEfficiency', label: '平均效率', value: '87.5%', trendType: 'up', trendValue: 2.5 },
        { key: 'oee', label: 'OEE', value: '82.3%', trendType: 'up', trendValue: 1.8 },
        { key: 'outputRate', label: '产出达成率', value: '96.2%', trendType: 'down', trendValue: 0.5 },
        { key: 'laborEfficiency', label: '工时效率', value: '91.8%', trendType: 'up', trendValue: 3.2 }
      ];
    },
    mockLoadEfficiencyData() {
      // 模拟效率数据列表
      const mockData = [];
      const workshops = ['冲压车间', '装配车间', '机加工车间', '焊接车间'];
      const lines = ['产线1', '产线2', '产线3', '产线4'];
      const products = ['产品A', '产品B', '产品C', '产品D'];
      const operators = ['操作员1', '操作员2', '操作员3', '操作员4', '操作员5'];
      
      // 生成日期数组
      const dates = this.generateDateArray();
      
      for (let i = 1; i <= this.pageSize; i++) {
        const index = (this.currentPage - 1) * this.pageSize + i;
        const dateIndex = index % dates.length;
        const plannedOutput = Math.floor(Math.random() * 500) + 500;
        const actualOutput = Math.floor(plannedOutput * (0.8 + Math.random() * 0.3));
        const plannedHours = Math.floor(Math.random() * 40) + 40;
        const actualHours = Math.floor(plannedHours * (0.7 + Math.random() * 0.4));
        const outputRate = ((actualOutput / plannedOutput) * 100).toFixed(1) + '%';
        const efficiencyRate = ((plannedHours / actualHours) * 100).toFixed(1) + '%';
        
        mockData.push({
          date: dates[dateIndex],
          workshopName: workshops[Math.floor(Math.random() * workshops.length)],
          lineName: lines[Math.floor(Math.random() * lines.length)],
          productName: products[Math.floor(Math.random() * products.length)],
          plannedOutput,
          actualOutput,
          outputRate,
          plannedHours,
          actualHours,
          efficiencyRate,
          operator: operators[Math.floor(Math.random() * operators.length)],
          remark: Math.random() > 0.7 ? '设备调整影响效率' : ''
        });
      }
      
      this.efficiencyData = mockData;
      this.total = 500; // 模拟总数据量
    },
    generateDateArray() {
      const dates = [];
      let days = 30;
      
      if (this.timeRange === '7days') days = 7;
      if (this.timeRange === '90days') days = 90;
      if (this.timeRange === 'custom' && this.customDateRange.length === 2) {
        const start = new Date(this.customDateRange[0]);
        const end = new Date(this.customDateRange[1]);
        days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      
      return dates;
    },
    initCharts() {
      // 实际使用时需要引入 ECharts 并初始化
      // 这里只提供占位逻辑
      console.log('初始化效率图表');
      // this.trendChart = echarts.init(this.$refs.trendChartRef);
      // this.comparisonChart = echarts.init(this.$refs.comparisonChartRef);
      // this.utilizationChart = echarts.init(this.$refs.utilizationChartRef);
      this.updateCharts();
    },
    updateCharts() {
      // 实际使用时根据 chartType 更新对应图表
      console.log('更新效率图表', this.chartType);
    },
    disposeCharts() {
      // 实际使用时销毁图表实例
      if (this.trendChart) {
        this.trendChart.dispose();
      }
      if (this.comparisonChart) {
        this.comparisonChart.dispose();
      }
      if (this.utilizationChart) {
        this.utilizationChart.dispose();
      }
    },
    getEfficiencyTagType(rate) {
      const numRate = parseFloat(rate);
      if (numRate >= 90) return 'success';
      if (numRate >= 80) return 'primary';
      if (numRate >= 70) return 'warning';
      return 'danger';
    },
    rateFormat(percentage) {
      return `${percentage}%`;
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.loadEfficiencyData();
    },
    handleCurrentChange(current) {
      this.currentPage = current;
      this.loadEfficiencyData();
    }
  }
};
</script>

<style scoped>
.efficiency-chart {
  padding: 20px;
  background-color: #f5f7fa;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.efficiency-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  height: 120px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

.charts-container {
  margin-bottom: 24px;
}

.chart-card {
  margin-bottom: 24px;
}

.chart {
  height: 400px;
  width: 100%;
}

.efficiency-table-section {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .header-controls {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>