<template>
  <div class="capacity-load-flow">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>产能负荷流</span>
          <el-button type="primary" @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="工序">
          <el-select v-model="queryForm.processId" placeholder="请选择工序" clearable>
            <el-option
              v-for="process in processList"
              :key="process.id"
              :label="process.name"
              :value="process.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 负荷流图表 -->
      <div ref="chartRef" class="chart-container"></div>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        style="margin-top: 20px"
      >
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="processName" label="工序" width="150" />
        <el-table-column prop="capacity" label="产能" width="100" align="right" />
        <el-table-column prop="load" label="负荷" width="100" align="right" />
        <el-table-column prop="loadRate" label="负荷率" width="100" align="right">
          <template #default="{ row }">
            <el-tag :type="getLoadRateType(row.loadRate)">
              {{ row.loadRate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="availableCapacity" label="剩余产能" width="100" align="right" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.loadRate)">
              {{ getStatusText(row.loadRate) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import * as echarts from 'echarts';

// 数据
const loading = ref(false);
const chartRef = ref(null);
let chartInstance = null;

const queryForm = reactive({
  processId: '',
  dateRange: []
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const processList = ref([]);
const tableData = ref([]);

// 方法
const initChart = () => {
  if (!chartRef.value) return;
  
  chartInstance = echarts.init(chartRef.value);
  
  const option = {
    title: {
      text: '产能负荷流趋势图',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['产能', '负荷', '负荷率'],
      top: 30
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: []
    },
    yAxis: [
      {
        type: 'value',
        name: '产能/负荷',
        position: 'left'
      },
      {
        type: 'value',
        name: '负荷率(%)',
        position: 'right',
        max: 150
      }
    ],
    series: [
      {
        name: '产能',
        type: 'line',
        data: [],
        smooth: true
      },
      {
        name: '负荷',
        type: 'line',
        data: [],
        smooth: true,
        areaStyle: {
          opacity: 0.3
        }
      },
      {
        name: '负荷率',
        type: 'line',
        yAxisIndex: 1,
        data: [],
        smooth: true,
        lineStyle: {
          type: 'dashed'
        }
      }
    ]
  };
  
  chartInstance.setOption(option);
};

const updateChart = (data) => {
  if (!chartInstance) return;
  
  const dates = data.map(item => item.date);
  const capacity = data.map(item => item.capacity);
  const load = data.map(item => item.load);
  const loadRate = data.map(item => item.loadRate);
  
  chartInstance.setOption({
    xAxis: {
      data: dates
    },
    series: [
      { data: capacity },
      { data: load },
      { data: loadRate }
    ]
  });
};

const fetchProcessList = async () => {
  try {
    // TODO: 调用实际API
    processList.value = [
      { id: 1, name: '激光下料' },
      { id: 2, name: '折弯' },
      { id: 3, name: '焊接' },
      { id: 4, name: '喷塑' },
      { id: 5, name: '组装' },
      { id: 6, name: '打包' }
    ];
  } catch (error) {
    console.error('获取工序列表失败:', error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    // TODO: 调用实际API
    // 模拟数据
    const mockData = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const capacity = 100;
      const load = Math.floor(Math.random() * 120) + 20;
      const loadRate = Math.round((load / capacity) * 100);
      
      mockData.push({
        id: i + 1,
        date: dateStr,
        processName: '激光下料',
        capacity,
        load,
        loadRate,
        availableCapacity: capacity - load,
        remark: loadRate > 100 ? '产能超负荷' : loadRate > 80 ? '产能趋于饱和' : '产能正常'
      });
    }
    
    tableData.value = mockData.slice(
      (pagination.page - 1) * pagination.pageSize,
      pagination.page * pagination.pageSize
    );
    pagination.total = mockData.length;
    
    // 更新图表
    updateChart(mockData);
  } catch (error) {
    console.error('获取数据失败:', error);
    ElMessage.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

const handleQuery = () => {
  pagination.page = 1;
  fetchData();
};

const handleReset = () => {
  queryForm.processId = '';
  queryForm.dateRange = [];
  handleQuery();
};

const refreshData = () => {
  fetchData();
};

const getLoadRateType = (rate) => {
  if (rate > 100) return 'danger';
  if (rate > 80) return 'warning';
  return 'success';
};

const getStatusType = (rate) => {
  if (rate > 100) return 'danger';
  if (rate > 80) return 'warning';
  return 'success';
};

const getStatusText = (rate) => {
  if (rate > 100) return '超负荷';
  if (rate > 80) return '趋饱和';
  return '正常';
};

// 生命周期
onMounted(async () => {
  await fetchProcessList();
  await fetchData();
  await nextTick();
  initChart();
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    chartInstance?.resize();
  });
});
</script>

<style scoped>
.capacity-load-flow {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-form {
  margin-bottom: 20px;
}

.chart-container {
  width: 100%;
  height: 400px;
}
</style>
