<template>
  <div class="capacity-planning">
    <el-page-header :title="'产能规划'" :content="'分析和规划生产产能'" />
    
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="时间周期">
          <el-date-picker
            v-model="dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="yyyy-MM"
          />
        </el-form-item>
        <el-form-item label="车间">
          <el-select v-model="searchForm.workshopId" placeholder="请选择车间" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="workshop in workshops" :key="workshop.id" :label="workshop.name" :value="workshop.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="生产线">
          <el-select v-model="searchForm.productionLineId" placeholder="请选择生产线" clearable>
            <el-option label="全部" value="" />
            <el-option v-for="line in productionLines" :key="line.id" :label="line.name" :value="line.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-row :gutter="20">
      <!-- 产能概览 -->
      <el-col :span="24">
        <el-card class="overview-card">
          <div class="card-header">
            <h3>产能概览</h3>
            <el-select v-model="viewMode" placeholder="视图模式">
              <el-option label="月视图" value="month" />
              <el-option label="周视图" value="week" />
              <el-option label="日视图" value="day" />
            </el-select>
          </div>
          <div class="overview-stats">
            <el-statistic :value="totalCapacity" suffix="件" title="总产能" />
            <el-statistic :value="plannedProduction" suffix="件" title="计划产量" />
            <el-statistic :value="actualProduction" suffix="件" title="实际产量" />
            <el-statistic :value="utilizationRate" suffix="%" :precision="2" title="产能利用率" />
          </div>
          <div class="chart-container">
            <!-- 这里可以集成ECharts或其他图表库 -->
            <div class="chart-placeholder">产能趋势图表区域</div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 产能明细 -->
      <el-col :span="16">
        <el-card class="detail-card">
          <h3>产能明细</h3>
          <el-table
            v-loading="loading"
            :data="capacityDetails"
            style="width: 100%"
          >
            <el-table-column prop="period" label="时间段" width="150" />
            <el-table-column prop="workshopName" label="车间" width="120" />
            <el-table-column prop="productionLineName" label="生产线" width="120" />
            <el-table-column prop="capacity" label="理论产能" width="120" align="right" />
            <el-table-column prop="planned" label="计划使用" width="120" align="right" />
            <el-table-column prop="actual" label="实际使用" width="120" align="right" />
            <el-table-column prop="available" label="可用产能" width="120" align="right">
              <template slot-scope="scope">
                <span :class="{ 'available-low': scope.row.available < 0 }">
                  {{ scope.row.available }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="utilization" label="利用率" width="100" align="right">
              <template slot-scope="scope">
                <span :class="{ 'utilization-high': scope.row.utilization > 90 }">
                  {{ scope.row.utilization.toFixed(2) }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <!-- 产能预警 -->
      <el-col :span="8">
        <el-card class="alert-card">
          <h3>产能预警</h3>
          <el-empty v-if="capacityAlerts.length === 0" description="暂无预警信息" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(alert, index) in capacityAlerts"
              :key="index"
              :timestamp="alert.time"
              :type="alert.level === 'high' ? 'danger' : 'warning'"
            >
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-description">{{ alert.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
        
        <!-- 资源分配 -->
        <el-card class="allocation-card">
          <h3>资源分配</h3>
          <resource-allocation :workshop-id="searchForm.workshopId" :date-range="dateRange" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import ResourceAllocation from './components/ResourceAllocation.vue';

export default {
  name: 'CapacityPlanning',
  components: {
    ResourceAllocation
  },
  data() {
    return {
      loading: false,
      searchForm: {
        workshopId: '',
        productionLineId: ''
      },
      dateRange: [],
      viewMode: 'month',
      workshops: [
        { id: '1', name: '总装车间' },
        { id: '2', name: '部件车间' },
        { id: '3', name: '测试车间' }
      ],
      productionLines: [
        { id: '1', name: '生产线A', workshopId: '1' },
        { id: '2', name: '生产线B', workshopId: '1' },
        { id: '3', name: '生产线C', workshopId: '2' },
        { id: '4', name: '生产线D', workshopId: '3' }
      ],
      totalCapacity: 0,
      plannedProduction: 0,
      actualProduction: 0,
      utilizationRate: 0,
      capacityDetails: [],
      capacityAlerts: []
    };
  },
  created() {
    // 设置默认时间范围（最近6个月）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5);
    
    this.dateRange = [
      `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`,
      `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}`
    ];
    
    this.fetchCapacityData();
  },
  methods: {
    fetchCapacityData() {
      this.loading = true;
      // 模拟API调用
      setTimeout(() => {
        this.generateMockData();
        this.loading = false;
      }, 800);
    },
    
    generateMockData() {
      // 生成模拟数据
      this.totalCapacity = 50000;
      this.plannedProduction = 35000;
      this.actualProduction = 32000;
      this.utilizationRate = (this.actualProduction / this.totalCapacity) * 100;
      
      // 生成产能明细数据
      this.capacityDetails = [];
      const periods = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
      
      periods.forEach(period => {
        this.workshops.forEach(workshop => {
          const workshopLines = this.productionLines.filter(line => line.workshopId === workshop.id);
          workshopLines.forEach(line => {
            const capacity = Math.floor(Math.random() * 5000) + 8000;
            const planned = Math.floor(Math.random() * 3000) + 5000;
            const actual = Math.floor(Math.random() * 2000) + 4500;
            
            this.capacityDetails.push({
              period,
              workshopName: workshop.name,
              productionLineName: line.name,
              capacity,
              planned,
              actual,
              available: capacity - planned,
              utilization: (actual / capacity) * 100
            });
          });
        });
      });
      
      // 生成产能预警
      this.capacityAlerts = [
        {
          time: '2024-06-10 14:30',
          level: 'high',
          title: '产能不足预警',
          description: '总装车间生产线A在2024-06月份产能严重不足，建议调整生产计划。'
        },
        {
          time: '2024-06-08 09:15',
          level: 'warning',
          title: '产能紧张提醒',
          description: '测试车间生产线D在2024-06月中旬计划产能使用率达到85%，请注意监控。'
        },
        {
          time: '2024-06-05 16:45',
          level: 'high',
          title: '设备维护通知',
          description: '部件车间将于2024-06-15至2024-06-16进行设备维护，期间产能将下降30%。'
        }
      ];
    },
    
    handleSearch() {
      this.fetchCapacityData();
    },
    
    handleReset() {
      this.searchForm = {
        workshopId: '',
        productionLineId: ''
      };
      this.fetchCapacityData();
    }
  }
};
</script>

<style scoped>
.capacity-planning {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-top: 10px;
}

.overview-card,
.detail-card,
.alert-card,
.allocation-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.overview-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

.overview-stats .el-statistic {
  width: 23%;
}

.chart-container {
  height: 300px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  color: #909399;
  font-size: 14px;
}

.detail-card h3,
.alert-card h3,
.allocation-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: #333;
  padding-bottom: 10px;
  border-bottom: 1px solid #eaeaea;
}

.available-low {
  color: #f56c6c;
  font-weight: bold;
}

.utilization-high {
  color: #e6a23c;
  font-weight: bold;
}

.alert-content {
  padding: 5px 0;
}

.alert-title {
  font-weight: bold;
  margin-bottom: 5px;
}

.alert-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
}
</style>