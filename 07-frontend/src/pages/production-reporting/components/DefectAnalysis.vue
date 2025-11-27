<template>
  <div class="defect-analysis">
    <div class="analysis-header">
      <h3>缺陷分析统计</h3>
      <div class="header-controls">
        <el-select v-model="analysisType" placeholder="分析类型">
          <el-option label="按类型分析" value="byType" />
          <el-option label="按时间分析" value="byTime" />
          <el-option label="按部门分析" value="byDepartment" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          @change="handleDateRangeChange"
        />
      </div>
    </div>

    <div class="analysis-content">
      <!-- 数据概览 -->
      <div class="data-overview">
        <el-card shadow="hover" v-for="stat in statistics" :key="stat.key" class="overview-card">
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
        <!-- 饼图：缺陷类型分布 -->
        <el-card shadow="hover" v-if="analysisType === 'byType'" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>缺陷类型分布</span>
            </div>
          </template>
          <div ref="pieChartRef" class="chart"></div>
        </el-card>

        <!-- 柱状图：按时间趋势 -->
        <el-card shadow="hover" v-if="analysisType === 'byTime'" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>缺陷趋势分析</span>
            </div>
          </template>
          <div ref="barChartRef" class="chart"></div>
        </el-card>

        <!-- 柱状图：按部门统计 -->
        <el-card shadow="hover" v-if="analysisType === 'byDepartment'" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>部门缺陷统计</span>
            </div>
          </template>
          <div ref="deptChartRef" class="chart"></div>
        </el-card>
      </div>

      <!-- 详细缺陷列表 -->
      <div class="defect-list-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>缺陷明细</span>
            </div>
          </template>
          <el-table
            :data="defectList"
            style="width: 100%"
            border
            stripe
            :row-class-name="tableRowClassName"
          >
            <el-table-column prop="defectId" label="缺陷ID" width="120" />
            <el-table-column prop="workOrderNumber" label="工单编号" width="150" />
            <el-table-column prop="productName" label="产品名称" width="180" />
            <el-table-column prop="defectType" label="缺陷类型" width="120">
              <template #default="scope">
                <el-tag :type="getDefectTypeTagType(scope.row.defectType)">
                  {{ getDefectTypeName(scope.row.defectType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="defectQuantity" label="缺陷数量" width="100" align="center" />
            <el-table-column prop="reportDate" label="报告日期" width="120" />
            <el-table-column prop="responsibleDepartment" label="责任部门" width="120" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="defectDescription" label="缺陷描述" show-overflow-tooltip />
            <el-table-column prop="status" label="处理状态" width="100" align="center">
              <template #default="scope">
                <el-tag :type="getDefectStatusTagType(scope.row.status)">
                  {{ getDefectStatusName(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
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
  name: 'DefectAnalysis',
  data() {
    return {
      analysisType: 'byType',
      dateRange: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      statistics: [
        { key: 'totalDefects', label: '缺陷总数', value: 0, trendType: 'down', trendValue: 5.2 },
        { key: 'defectRate', label: '缺陷率', value: '0.00%', trendType: 'down', trendValue: 1.8 },
        { key: 'pendingDefects', label: '待处理缺陷', value: 0, trendType: 'up', trendValue: 2.3 },
        { key: 'resolvedDefects', label: '已解决缺陷', value: 0, trendType: 'down', trendValue: 3.1 }
      ],
      defectList: [],
      // 图表实例
      pieChart: null,
      barChart: null,
      deptChart: null,
      // 缺陷类型映射
      defectTypeMap: {
        'appearance': '外观缺陷',
        'dimension': '尺寸偏差',
        'performance': '性能不达标',
        'assembly': '装配问题',
        'other': '其他'
      },
      // 缺陷状态映射
      defectStatusMap: {
        'pending': '待处理',
        'processing': '处理中',
        'resolved': '已解决',
        'rejected': '已驳回'
      }
    };
  },
  mounted() {
    this.initDateRange();
    this.loadDefectData();
    this.$nextTick(() => {
      this.initCharts();
    });
  },
  beforeUnmount() {
    // 销毁图表实例
    this.disposeCharts();
  },
  watch: {
    analysisType() {
      this.$nextTick(() => {
        this.updateCharts();
      });
    }
  },
  methods: {
    initDateRange() {
      // 默认查询最近7天
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      this.dateRange = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ];
    },
    handleDateRangeChange() {
      this.currentPage = 1;
      this.loadDefectData();
    },
    loadDefectData() {
      // 模拟加载数据
      this.mockLoadStatistics();
      this.mockLoadDefectList();
      this.$nextTick(() => {
        this.updateCharts();
      });
    },
    mockLoadStatistics() {
      // 模拟统计数据
      this.statistics = [
        { key: 'totalDefects', label: '缺陷总数', value: 256, trendType: 'down', trendValue: 5.2 },
        { key: 'defectRate', label: '缺陷率', value: '3.8%', trendType: 'down', trendValue: 1.8 },
        { key: 'pendingDefects', label: '待处理缺陷', value: 42, trendType: 'up', trendValue: 2.3 },
        { key: 'resolvedDefects', label: '已解决缺陷', value: 208, trendType: 'down', trendValue: 3.1 }
      ];
    },
    mockLoadDefectList() {
      // 模拟缺陷列表数据
      const mockData = [];
      const statuses = ['pending', 'processing', 'resolved', 'rejected'];
      const types = ['appearance', 'dimension', 'performance', 'assembly', 'other'];
      const departments = ['生产部', '质量部', '研发部', '工艺部'];
      
      for (let i = 1; i <= this.pageSize; i++) {
        const index = (this.currentPage - 1) * this.pageSize + i;
        mockData.push({
          defectId: `DEF${2024}${String(index).padStart(4, '0')}`,
          workOrderNumber: `WO${2024}${String(1000 + index).padStart(5, '0')}`,
          productName: `产品${String.fromCharCode(65 + Math.floor(i % 5))}`,
          defectType: types[Math.floor(Math.random() * types.length)],
          defectQuantity: Math.floor(Math.random() * 10) + 1,
          reportDate: this.getRandomDate(),
          responsibleDepartment: departments[Math.floor(Math.random() * departments.length)],
          operator: `操作员${i}`,
          defectDescription: `这是一个${this.defectTypeMap[types[Math.floor(Math.random() * types.length)]]}的详细描述，需要进行进一步分析和处理。`,
          status: statuses[Math.floor(Math.random() * statuses.length)]
        });
      }
      
      this.defectList = mockData;
      this.total = 256; // 模拟总数据量
    },
    getRandomDate() {
      const [start, end] = this.dateRange;
      const startDate = new Date(start);
      const endDate = new Date(end);
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      return randomDate.toISOString().split('T')[0];
    },
    initCharts() {
      // 实际使用时需要引入 ECharts 并初始化
      // 这里只提供占位逻辑
      console.log('初始化图表');
      // this.pieChart = echarts.init(this.$refs.pieChartRef);
      // this.barChart = echarts.init(this.$refs.barChartRef);
      // this.deptChart = echarts.init(this.$refs.deptChartRef);
      this.updateCharts();
    },
    updateCharts() {
      // 实际使用时根据 analysisType 更新对应图表
      console.log('更新图表', this.analysisType);
    },
    disposeCharts() {
      // 实际使用时销毁图表实例
      if (this.pieChart) {
        this.pieChart.dispose();
      }
      if (this.barChart) {
        this.barChart.dispose();
      }
      if (this.deptChart) {
        this.deptChart.dispose();
      }
    },
    getDefectTypeName(type) {
      return this.defectTypeMap[type] || '未知';
    },
    getDefectTypeTagType(type) {
      const typeMap = {
        'appearance': 'warning',
        'dimension': 'danger',
        'performance': 'error',
        'assembly': 'info',
        'other': 'success'
      };
      return typeMap[type] || 'default';
    },
    getDefectStatusName(status) {
      return this.defectStatusMap[status] || '未知';
    },
    getDefectStatusTagType(status) {
      const statusMap = {
        'pending': 'warning',
        'processing': 'primary',
        'resolved': 'success',
        'rejected': 'danger'
      };
      return statusMap[status] || 'default';
    },
    tableRowClassName({ row }) {
      return row.status === 'pending' ? 'row-pending' : '';
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.loadDefectData();
    },
    handleCurrentChange(current) {
      this.currentPage = current;
      this.loadDefectData();
    }
  }
};
</script>

<style scoped>
.defect-analysis {
  padding: 20px;
  background-color: #f5f7fa;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.analysis-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.header-controls {
  display: flex;
  gap: 16px;
}

.data-overview {
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
  color: #f56c6c;
}

.stat-trend.down {
  color: #67c23a;
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

.defect-list-section {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.row-pending) {
  background-color: #fdf6ec;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>