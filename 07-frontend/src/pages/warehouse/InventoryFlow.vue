<template>
  <div class="inventory-flow">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>出入库流水账</span>
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

      <!-- 筛选条件 -->
      <el-form :inline="true" :model="queryForm" class="query-form">
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
        <el-form-item label="单据类型">
          <el-select v-model="queryForm.type" placeholder="请选择类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库">
          <el-select v-model="queryForm.warehouseId" placeholder="请选择仓库" clearable>
            <el-option
              v-for="warehouse in warehouseList"
              :key="warehouse.id"
              :label="warehouse.name"
              :value="warehouse.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物料编号">
          <el-input
            v-model="queryForm.materialCode"
            placeholder="请输入物料编号"
            clearable
          />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input
            v-model="queryForm.materialName"
            placeholder="请输入物料名称"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="statistics">
        <el-col :span="6">
          <el-statistic title="今日入库次数" :value="statistics.todayInCount">
            <template #suffix>
              <span style="font-size: 14px">次</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日出库次数" :value="statistics.todayOutCount">
            <template #suffix>
              <span style="font-size: 14px">次</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日入库数量" :value="statistics.todayInQuantity">
            <template #suffix>
              <span style="font-size: 14px">件</span>
            </template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="今日出库数量" :value="statistics.todayOutQuantity">
            <template #suffix>
              <span style="font-size: 14px">件</span>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <!-- 数据表格 -->
      <el-table
        :data="tableData"
        border
        stripe
        v-loading="loading"
        style="margin-top: 20px"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="time" label="时间" width="90" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'in' ? 'success' : 'danger'">
              {{ row.type === 'in' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="documentNo" label="单据号" width="150" />
        <el-table-column prop="warehouseName" label="仓库" width="120" />
        <el-table-column prop="materialCode" label="物料编号" width="150" />
        <el-table-column prop="materialName" label="物料名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="specification" label="规格" width="120" show-overflow-tooltip />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="quantity" label="数量" width="100" align="right">
          <template #default="{ row }">
            <span :class="{ 'quantity-in': row.type === 'in', 'quantity-out': row.type === 'out' }">
              {{ row.type === 'in' ? '+' : '-' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="结余" width="100" align="right" />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="handlePrint(row)">
              打印
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="流水详情" width="60%">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="单据号">{{ currentRow.documentNo }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="currentRow.type === 'in' ? 'success' : 'danger'">
            {{ currentRow.type === 'in' ? '入库' : '出库' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="日期时间">{{ currentRow.date }} {{ currentRow.time }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ currentRow.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="物料编号">{{ currentRow.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ currentRow.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ currentRow.specification }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ currentRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="结余">{{ currentRow.balance }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentRow.operator }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRow.remark }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, Refresh } from '@element-plus/icons-vue';

// 数据
const loading = ref(false);
const detailVisible = ref(false);
const currentRow = ref({});

const queryForm = reactive({
  dateRange: [],
  type: '',
  warehouseId: '',
  materialCode: '',
  materialName: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const statistics = ref({
  todayInCount: 0,
  todayOutCount: 0,
  todayInQuantity: 0,
  todayOutQuantity: 0
});

const warehouseList = ref([]);
const tableData = ref([]);

// 方法
const fetchWarehouseList = async () => {
  try {
    // TODO: 调用实际API
    warehouseList.value = [
      { id: 1, name: '原材料仓' },
      { id: 2, name: '半成品仓' },
      { id: 3, name: '成品仓' }
    ];
  } catch (error) {
    console.error('获取仓库列表失败:', error);
  }
};

const fetchStatistics = async () => {
  try {
    // TODO: 调用实际API
    statistics.value = {
      todayInCount: 15,
      todayOutCount: 23,
      todayInQuantity: 1580,
      todayOutQuantity: 2340
    };
  } catch (error) {
    console.error('获取统计数据失败:', error);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    // TODO: 调用实际API
    // 模拟数据
    const mockData = [];
    const today = new Date();
    let balance = 1000;
    
    for (let i = 0; i < 100; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - Math.floor(i / 3));
      const dateStr = date.toISOString().split('T')[0];
      const time = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
      
      const type = Math.random() > 0.5 ? 'in' : 'out';
      const quantity = Math.floor(Math.random() * 50) + 10;
      
      if (type === 'in') {
        balance += quantity;
      } else {
        balance -= quantity;
      }
      
      mockData.push({
        id: i + 1,
        date: dateStr,
        time,
        type,
        documentNo: `${type === 'in' ? 'RK' : 'CK'}${dateStr.replace(/-/g, '')}${String(i + 1).padStart(4, '0')}`,
        warehouseName: ['原材料仓', '半成品仓', '成品仓'][Math.floor(Math.random() * 3)],
        materialCode: `MAT${String(Math.floor(Math.random() * 1000) + 1).padStart(4, '0')}`,
        materialName: ['方管', '圆管', '铁板', '螺丝', '螺母'][Math.floor(Math.random() * 5)],
        specification: ['40*40*2.0', '25*25*1.5', '2.0*1220*2440'][Math.floor(Math.random() * 3)],
        unit: ['米', '件', '张'][Math.floor(Math.random() * 3)],
        quantity,
        balance,
        operator: ['张三', '李四', '王五'][Math.floor(Math.random() * 3)],
        remark: Math.random() > 0.7 ? '正常出入库' : ''
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
  queryForm.dateRange = [];
  queryForm.type = '';
  queryForm.warehouseId = '';
  queryForm.materialCode = '';
  queryForm.materialName = '';
  handleQuery();
};

const refreshData = () => {
  fetchStatistics();
  fetchData();
};

const handleView = (row) => {
  currentRow.value = row;
  detailVisible.value = true;
};

const handlePrint = (row) => {
  ElMessage.info('打印功能开发中...');
};

const handleExport = () => {
  ElMessage.info('导出功能开发中...');
};

const tableRowClassName = ({ row }) => {
  return row.type === 'in' ? 'row-in' : 'row-out';
};

// 生命周期
onMounted(async () => {
  await fetchWarehouseList();
  await fetchStatistics();
  await fetchData();
});
</script>

<style scoped>
.inventory-flow {
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

.statistics {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.quantity-in {
  color: #67c23a;
  font-weight: bold;
}

.quantity-out {
  color: #f56c6c;
  font-weight: bold;
}

:deep(.row-in) {
  background-color: #f0f9ff;
}

:deep(.row-out) {
  background-color: #fef0f0;
}
</style>
