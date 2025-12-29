<template>
  <div class="mock-scheduling-process-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <el-button @click="handleBack" link>
              <el-icon><ArrowLeft /></el-icon>
              返回排程列表
            </el-button>
            <span style="margin-left: 20px; font-size: 16px; font-weight: bold;">
              模拟排程工序表 - {{ queryParams.schedulingNo || '全部' }}
            </span>
          </div>
          <div>
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 排程信息 -->
      <el-descriptions
        v-if="schedulingInfo"
        :column="4"
        border
        class="scheduling-info"
      >
        <el-descriptions-item label="排程编号">{{ schedulingInfo.schedulingNo }}</el-descriptions-item>
        <el-descriptions-item label="销售订单">{{ schedulingInfo.salesOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ schedulingInfo.customerName }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ schedulingInfo.productName }}</el-descriptions-item>
        <el-descriptions-item label="订单数量">{{ schedulingInfo.quantity }}</el-descriptions-item>
        <el-descriptions-item label="交货日期">{{ schedulingInfo.deliveryDate }}</el-descriptions-item>
        <el-descriptions-item label="排程状态">
          <el-tag :type="getStatusType(schedulingInfo.status)">
            {{ getStatusText(schedulingInfo.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="工序完成进度">
          {{ schedulingInfo.completedProcesses }} / {{ schedulingInfo.totalProcesses }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="工序名称">
          <el-input
            v-model="queryForm.processName"
            placeholder="请输入工序名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="工序状态">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="未开始" value="pending" />
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已延期" value="delayed" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input
            v-model="queryForm.assignee"
            placeholder="请输入负责人"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 工序甘特图 -->
      <div class="gantt-section">
        <h3>工序时间轴</h3>
        <div ref="ganttRef" class="gantt-container"></div>
      </div>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="processSeq" label="工序序号" width="90" align="center" />
        <el-table-column prop="processCode" label="工序编码" width="120" />
        <el-table-column prop="processName" label="工序名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="workCenter" label="工作中心" width="120" />
        <el-table-column prop="equipment" label="设备" width="120" show-overflow-tooltip />
        <el-table-column label="工序状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getProcessStatusType(row.status)">
              {{ getProcessStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="planStartDate" label="计划开始" width="110" />
        <el-table-column prop="planEndDate" label="计划结束" width="110" />
        <el-table-column prop="actualStartDate" label="实际开始" width="110" />
        <el-table-column prop="actualEndDate" label="实际结束" width="110" />
        <el-table-column prop="duration" label="工期(天)" width="90" align="right" />
        <el-table-column prop="assignee" label="负责人" width="100" />
        <el-table-column label="完成率" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="row.completionRate"
              :color="getCompletionColor(row.completionRate)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button link type="success" size="small" @click="handleStart(row)" v-if="row.status === 'pending'">
              开始
            </el-button>
            <el-button link type="warning" size="small" @click="handleComplete(row)" v-if="row.status === 'processing'">
              完成
            </el-button>
            <el-button link type="info" size="small" @click="handleAdjust(row)">
              调整
            </el-button>
          </template>
        </el-table-column>
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
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Download, Refresh } from '@element-plus/icons-vue';
import * as echarts from 'echarts';

const router = useRouter();
const route = useRoute();

// 数据
const loading = ref(false);
const ganttRef = ref(null);
let ganttChart = null;

const queryParams = reactive({
  schedulingNo: route.query.schedulingNo || ''
});

const schedulingInfo = ref(null);

const queryForm = reactive({
  processName: '',
  status: '',
  assignee: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const tableData = ref([]);

// 方法
const initGanttChart = () => {
  if (!ganttRef.value) return;
  
  ganttChart = echarts.init(ganttRef.value);
  
  const option = {
    tooltip: {
      formatter: function (params) {
        return `${params.marker}${params.name}<br/>
                开始: ${params.value[1]}<br/>
                结束: ${params.value[2]}<br/>
                工期: ${params.value[3]}天`;
      }
    },
    grid: {
      left: '15%',
      right: '5%',
      top: '10%',
      bottom: '10%'
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: function (value) {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }
    },
    yAxis: {
      type: 'category',
      data: []
    },
    series: [
      {
        type: 'custom',
        renderItem: function (params, api) {
          const categoryIndex = api.value(0);
          const start = api.coord([api.value(1), categoryIndex]);
          const end = api.coord([api.value(2), categoryIndex]);
          const height = api.size([0, 1])[1] * 0.6;
          
          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height: height
            },
            style: api.style({
              fill: params.value[4]
            })
          };
        },
        encode: {
          x: [1, 2],
          y: 0
        },
        data: []
      }
    ]
  };
  
  ganttChart.setOption(option);
};

const updateGanttChart = (data) => {
  if (!ganttChart) return;
  
  const processNames = data.map(item => item.processName);
  const seriesData = data.map((item, index) => {
    const color = item.status === 'completed' ? '#67c23a' :
                  item.status === 'processing' ? '#e6a23c' :
                  item.status === 'delayed' ? '#f56c6c' : '#909399';
    
    return [
      index,
      new Date(item.planStartDate).getTime(),
      new Date(item.planEndDate).getTime(),
      item.duration,
      color
    ];
  });
  
  ganttChart.setOption({
    yAxis: {
      data: processNames
    },
    series: [{
      data: seriesData
    }]
  });
};

const fetchSchedulingInfo = async () => {
  try {
    // TODO: 调用实际API
    schedulingInfo.value = {
      schedulingNo: queryParams.schedulingNo,
      salesOrderNo: 'SO2024122901',
      customerName: '深圳科技公司',
      productName: '健身器材A型',
      quantity: 100,
      deliveryDate: '2025-01-31',
      status: 'scheduling',
      totalProcesses: 8,
      completedProcesses: 3
    };
  } catch (error) {
    console.error('获取排程信息失败:', error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    // TODO: 调用实际API
    // 模拟数据
    const mockData = [];
    const baseDate = new Date('2025-01-01');
    const processes = [
      { code: 'P001', name: '激光下料', workCenter: '下料车间', equipment: '激光切割机1' },
      { code: 'P002', name: '折弯', workCenter: '折弯车间', equipment: '折弯机2' },
      { code: 'P003', name: '打孔', workCenter: '下料车间', equipment: '冲床1' },
      { code: 'P004', name: '焊接', workCenter: '焊接车间', equipment: '焊接机3' },
      { code: 'P005', name: '打磨', workCenter: '打磨车间', equipment: '打磨机1' },
      { code: 'P006', name: '喷塑', workCenter: '喷涂车间', equipment: '喷塑线1' },
      { code: 'P007', name: '组装', workCenter: '组装车间', equipment: '组装线1' },
      { code: 'P008', name: '打包', workCenter: '包装车间', equipment: '打包线1' }
    ];
    
    let currentDate = new Date(baseDate);
    
    processes.forEach((process, i) => {
      const duration = Math.floor(Math.random() * 3) + 2;
      const planStartDate = new Date(currentDate);
      const planEndDate = new Date(currentDate);
      planEndDate.setDate(planEndDate.getDate() + duration);
      
      const statuses = ['pending', 'processing', 'completed', 'delayed'];
      let status;
      if (i < 3) {
        status = 'completed';
      } else if (i === 3) {
        status = 'processing';
      } else {
        status = 'pending';
      }
      
      const completionRate = status === 'completed' ? 100 :
                             status === 'processing' ? Math.floor(Math.random() * 70) + 20 : 0;
      
      mockData.push({
        id: i + 1,
        processSeq: i + 1,
        processCode: process.code,
        processName: process.name,
        workCenter: process.workCenter,
        equipment: process.equipment,
        status,
        planStartDate: planStartDate.toISOString().split('T')[0],
        planEndDate: planEndDate.toISOString().split('T')[0],
        actualStartDate: status !== 'pending' ? planStartDate.toISOString().split('T')[0] : '',
        actualEndDate: status === 'completed' ? planEndDate.toISOString().split('T')[0] : '',
        duration,
        assignee: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
        completionRate,
        remark: status === 'delayed' ? '设备故障导致延期' : ''
      });
      
      currentDate = new Date(planEndDate);
      currentDate.setDate(currentDate.getDate() + 1);
    });
    
    tableData.value = mockData.slice(
      (pagination.page - 1) * pagination.pageSize,
      pagination.page * pagination.pageSize
    );
    pagination.total = mockData.length;
    
    // 更新甘特图
    updateGanttChart(mockData);
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
  queryForm.processName = '';
  queryForm.status = '';
  queryForm.assignee = '';
  handleQuery();
};

const refreshData = () => {
  fetchSchedulingInfo();
  fetchData();
};

const handleBack = () => {
  router.push('/sales/orders/mock-scheduling-list');
};

const handleExport = () => {
  ElMessage.info('导出功能开发中...');
};

const handleViewDetail = (row) => {
  ElMessage.info(`查看工序详情: ${row.processName}`);
};

const handleStart = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要开始工序 ${row.processName} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // TODO: 调用实际API
    ElMessage.success('工序已开始');
    fetchData();
  } catch (error) {
    // 用户取消
  }
};

const handleComplete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要完成工序 ${row.processName} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // TODO: 调用实际API
    ElMessage.success('工序已完成');
    fetchData();
  } catch (error) {
    // 用户取消
  }
};

const handleAdjust = (row) => {
  ElMessage.info(`调整工序: ${row.processName}`);
};

const getStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    scheduling: 'warning',
    completed: 'success'
  };
  return typeMap[status] || 'info';
};

const getStatusText = (status) => {
  const textMap = {
    pending: '待排程',
    scheduling: '排程中',
    completed: '已完成'
  };
  return textMap[status] || '未知';
};

const getProcessStatusType = (status) => {
  const typeMap = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    delayed: 'danger'
  };
  return typeMap[status] || 'info';
};

const getProcessStatusText = (status) => {
  const textMap = {
    pending: '未开始',
    processing: '进行中',
    completed: '已完成',
    delayed: '已延期'
  };
  return textMap[status] || '未知';
};

const getCompletionColor = (rate) => {
  if (rate === 100) return '#67c23a';
  if (rate >= 50) return '#e6a23c';
  return '#909399';
};

const tableRowClassName = ({ row }) => {
  if (row.status === 'delayed') return 'row-delayed';
  if (row.status === 'completed') return 'row-completed';
  return '';
};

// 生命周期
onMounted(async () => {
  await fetchSchedulingInfo();
  await fetchData();
  await nextTick();
  initGanttChart();
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    ganttChart?.resize();
  });
});
</script>

<style scoped>
.mock-scheduling-process-list {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.scheduling-info {
  margin-bottom: 20px;
}

.query-form {
  margin-bottom: 20px;
}

.gantt-section {
  margin-bottom: 20px;
}

.gantt-section h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: bold;
}

.gantt-container {
  width: 100%;
  height: 400px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

:deep(.row-delayed) {
  background-color: #fef0f0;
}

:deep(.row-completed) {
  background-color: #f0f9ff;
}
</style>
