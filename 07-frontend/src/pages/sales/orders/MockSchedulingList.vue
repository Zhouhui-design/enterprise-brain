<template>
  <div class="mock-scheduling-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>模拟排程列表</span>
          <div>
            <el-button type="success" @click="handleCreateScheduling">
              <el-icon><Plus /></el-icon>
              新建排程
            </el-button>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="销售订单号">
          <el-input
            v-model="queryForm.salesOrderNo"
            placeholder="请输入销售订单号"
            clearable
          />
        </el-form-item>
        <el-form-item label="客户名称">
          <el-input
            v-model="queryForm.customerName"
            placeholder="请输入客户名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="排程状态">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="待排程" value="pending" />
            <el-option label="排程中" value="scheduling" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
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

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="schedulingNo" label="排程编号" width="150" />
        <el-table-column prop="salesOrderNo" label="销售订单号" width="150" />
        <el-table-column prop="customerName" label="客户名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="productName" label="产品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="100" align="right" />
        <el-table-column prop="deliveryDate" label="交货日期" width="110" />
        <el-table-column label="排程状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalProcesses" label="总工序数" width="100" align="center" />
        <el-table-column prop="completedProcesses" label="已完成工序" width="110" align="center" />
        <el-table-column label="完成进度" width="120">
          <template #default="{ row }">
            <el-progress
              :percentage="Math.round((row.completedProcesses / row.totalProcesses) * 100)"
              :color="getProgressColor(row.completedProcesses, row.totalProcesses)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handleViewProcesses(row)">
              工序表
            </el-button>
            <el-button link type="warning" size="small" @click="handleEdit(row)" v-if="row.status === 'pending'">
              编辑
            </el-button>
            <el-button link type="success" size="small" @click="handleStart(row)" v-if="row.status === 'pending'">
              开始排程
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';

const router = useRouter();

// 数据
const loading = ref(false);

const queryForm = reactive({
  salesOrderNo: '',
  customerName: '',
  status: '',
  dateRange: []
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const tableData = ref([]);

// 方法
const fetchData = async () => {
  loading.value = true;
  try {
    // TODO: 调用实际API
    // 模拟数据
    const mockData = [];
    const today = new Date();
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      const dateStr = date.toISOString().split('T')[0];
      
      const totalProcesses = Math.floor(Math.random() * 10) + 5;
      const completedProcesses = Math.floor(Math.random() * totalProcesses);
      
      const statuses = ['pending', 'scheduling', 'completed'];
      const status = completedProcesses === 0 ? 'pending' : 
                     completedProcesses === totalProcesses ? 'completed' : 'scheduling';
      
      mockData.push({
        id: i + 1,
        schedulingNo: `MS${dateStr.replace(/-/g, '')}${String(i + 1).padStart(4, '0')}`,
        salesOrderNo: `SO${dateStr.replace(/-/g, '')}${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
        customerName: ['深圳科技公司', '广州贸易公司', '上海制造公司', '北京实业公司'][Math.floor(Math.random() * 4)],
        productName: ['健身器材A型', '运动器材B型', '训练设备C型', '康复设备D型'][Math.floor(Math.random() * 4)],
        quantity: Math.floor(Math.random() * 100) + 50,
        deliveryDate: new Date(date.setDate(date.getDate() + 30)).toISOString().split('T')[0],
        status,
        totalProcesses,
        completedProcesses,
        createdBy: ['张三', '李四', '王五'][Math.floor(Math.random() * 3)],
        createdAt: `${dateStr} ${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
      });
    }
    
    tableData.value = mockData.slice(
      (pagination.page - 1) * pagination.pageSize,
      pagination.page * pagination.pageSize
    );
    pagination.total = mockData.length;
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
  queryForm.salesOrderNo = '';
  queryForm.customerName = '';
  queryForm.status = '';
  queryForm.dateRange = [];
  handleQuery();
};

const refreshData = () => {
  fetchData();
};

const handleCreateScheduling = () => {
  ElMessage.info('新建排程功能开发中...');
};

const handleView = (row) => {
  ElMessage.info(`查看排程: ${row.schedulingNo}`);
};

const handleViewProcesses = (row) => {
  router.push({
    path: '/sales/orders/mock-scheduling-process-list',
    query: { schedulingNo: row.schedulingNo }
  });
};

const handleEdit = (row) => {
  ElMessage.info(`编辑排程: ${row.schedulingNo}`);
};

const handleStart = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要开始排程 ${row.schedulingNo} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // TODO: 调用实际API
    ElMessage.success('排程已开始');
    fetchData();
  } catch (error) {
    // 用户取消
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除排程 ${row.schedulingNo} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // TODO: 调用实际API
    ElMessage.success('删除成功');
    fetchData();
  } catch (error) {
    // 用户取消
  }
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

const getProgressColor = (completed, total) => {
  const percentage = (completed / total) * 100;
  if (percentage === 100) return '#67c23a';
  if (percentage >= 50) return '#e6a23c';
  return '#909399';
};

// 生命周期
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.mock-scheduling-list {
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
</style>
