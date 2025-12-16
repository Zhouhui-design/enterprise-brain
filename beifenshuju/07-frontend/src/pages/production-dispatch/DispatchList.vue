<template>
  <div class="dispatch-list">
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item>首页</el-breadcrumb-item>
        <el-breadcrumb-item>生产管理</el-breadcrumb-item>
        <el-breadcrumb-item>生产派工管理</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <h1>派工单列表</h1>
        <el-button type="primary" @click="createDispatch" size="large">
          <el-icon><Plus /></el-icon>
          新建派工单
        </el-button>
      </div>
    </div>
    
    <el-card shadow="never">
      <div class="search-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="派工单编号">
            <el-input
              v-model="searchForm.dispatchNumber"
              placeholder="请输入派工单编号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="产品名称">
            <el-input
              v-model="searchForm.productName"
              placeholder="请输入产品名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="所属车间">
            <el-select
              v-model="searchForm.workshopId"
              placeholder="请选择车间"
              clearable
            >
              <el-option
                v-for="workshop in workshops"
                :key="workshop.id"
                :label="workshop.name"
                :value="workshop.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
            >
              <el-option
                v-for="status in dispatchStatuses"
                :key="status.value"
                :label="status.label"
                :value="status.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="searchForm.createTimeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-form>
        
        <div class="search-actions">
          <el-button @click="handleSearch" type="primary">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button @click="exportData">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </div>
      </div>
      
      <div class="table-section">
        <div class="table-header" v-if="total > 0">
          <span>共 {{ total }} 条数据</span>
          <el-dropdown @command="handleBatchCommand">
            <el-button>
              批量操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="batchCancel">批量取消</el-dropdown-item>
                <el-dropdown-item command="batchClose">批量关闭</el-dropdown-item>
                <el-dropdown-item command="batchExport">批量导出</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <el-table
          v-loading="loading"
          :data="filteredData"
          style="width: 100%"
          border
          stripe
          @selection-change="handleSelectionChange"
          @row-dblclick="handleRowDblClick"
        >
          <el-table-column type="selection" width="55" fixed="left" />
          
          <el-table-column
            prop="dispatchNumber"
            label="派工单编号"
            min-width="180"
            sortable
            fixed="left"
          >
            <template #default="scope">
              <el-link type="primary" @click="viewDetail(scope.row)">
                {{ scope.row.dispatchNumber }}
              </el-link>
            </template>
          </el-table-column>
          
          <el-table-column prop="productionOrderNumber" label="生产工单" min-width="150" />
          
          <el-table-column prop="productName" label="产品名称" min-width="150" />
          
          <el-table-column prop="totalQuantity" label="派工总数" width="100" sortable center />
          
          <el-table-column prop="completedQuantity" label="已完成数量" width="120" sortable center>
            <template #default="scope">
              <div>
                <span>{{ scope.row.completedQuantity }}</span>
                <span class="completion-rate">
                  ({{ scope.row.completionRate }}%)
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="workshopName" label="所属车间" min-width="120" />
          
          <el-table-column prop="priority" label="优先级" width="100" center>
            <template #default="scope">
              <el-tag
                :type="getPriorityType(scope.row.priority)"
                size="small"
              >
                {{ getPriorityText(scope.row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="100" center>
            <template #default="scope">
              <el-tag
                :type="getStatusType(scope.row.status)"
                size="small"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="plannedStartTime" label="计划开始时间" min-width="160" sortable />
          
          <el-table-column prop="plannedEndTime" label="计划完成时间" min-width="160" sortable />
          
          <el-table-column prop="createdByName" label="创建人" min-width="100" />
          
          <el-table-column prop="createdAt" label="创建时间" min-width="160" sortable />
          
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button-group>
                <el-button
                  @click="viewDetail(scope.row)"
                  size="small"
                  type="primary"
                  text
                >
                  <el-icon><View /></el-icon>
                  查看
                </el-button>
                <el-button
                  v-if="canEdit(scope.row)"
                  @click="editDispatch(scope.row)"
                  size="small"
                  type="primary"
                  text
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button
                  v-if="canCancel(scope.row)"
                  @click="cancelDispatch(scope.row)"
                  size="small"
                  type="danger"
                  text
                >
                  <el-icon><Close /></el-icon>
                  取消
                </el-button>
                <el-dropdown @command="(command) => handleAction(scope.row, command)">
                  <el-button size="small">
                    更多
                    <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="print">打印派工单</el-dropdown-item>
                      <el-dropdown-item command="export">导出详情</el-dropdown-item>
                      <el-dropdown-item command="copy" v-if="canEdit(scope.row)">复制派工单</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
        
        <div v-else class="empty-state">
          <el-empty description="暂无数据" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  Search,
  Download,
  ArrowDown,
  View,
  Edit,
  Close
} from '@element-plus/icons-vue';

const router = useRouter();

// 响应式数据
const loading = ref(false);
const selectedRows = ref([]);
const pagination = reactive({
  currentPage: 1,
  pageSize: 10
});

// 搜索表单
const searchForm = reactive({
  dispatchNumber: '',
  productName: '',
  workshopId: '',
  status: '',
  createTimeRange: null
});

// 模拟数据：派工单列表
const dispatchList = ref([]);

// 模拟数据：车间列表
const workshops = ref([
  { id: '1', name: '装配车间' },
  { id: '2', name: '机加工车间' },
  { id: '3', name: '质检车间' },
  { id: '4', name: '电子车间' }
]);

// 派工单状态
const dispatchStatuses = [
  { value: 'PENDING', label: '待执行' },
  { value: 'IN_PROGRESS', label: '执行中' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELLED', label: '已取消' },
  { value: 'CLOSED', label: '已关闭' }
];

// 计算属性：总数据量
const total = computed(() => {
  return dispatchList.value.length;
});

// 计算属性：分页后的数据
const filteredData = computed(() => {
  // 实际项目中，这里应该是服务端分页
  // 这里简化为前端分页
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  return dispatchList.value.slice(start, end);
});

// 生命周期
onMounted(() => {
  loadDispatchData();
});

// 方法：加载派工单数据
const loadDispatchData = () => {
  loading.value = true;
  
  // 模拟API调用
  setTimeout(() => {
    // 生成模拟数据
    dispatchList.value = generateMockData();
    loading.value = false;
  }, 500);
};

// 方法：生成模拟数据
const generateMockData = () => {
  const data = [];
  const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const priorities = ['HIGH', 'MEDIUM', 'LOW'];
  const workshops = ['装配车间', '机加工车间', '质检车间', '电子车间'];
  const products = ['智能手表 Pro', '智能手机 XS', '平板电脑 Mini', '智能音箱', '无线耳机'];
  
  for (let i = 1; i <= 30; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const workshopIndex = Math.floor(Math.random() * workshops.length);
    const productIndex = Math.floor(Math.random() * products.length);
    const totalQuantity = Math.floor(Math.random() * 500) + 100;
    
    let completedQuantity = 0;
    if (status === 'IN_PROGRESS') {
      completedQuantity = Math.floor(totalQuantity * (Math.random() * 0.8 + 0.1));
    } else if (status === 'COMPLETED') {
      completedQuantity = totalQuantity;
    }
    
    const completionRate = Math.round((completedQuantity / totalQuantity) * 100);
    
    // 生成日期
    const now = new Date();
    const createdDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const plannedStartDate = new Date(createdDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    const plannedEndDate = new Date(plannedStartDate.getTime() + (Math.random() * 10 + 5) * 24 * 60 * 60 * 1000);
    
    data.push({
      id: `dispatch_${i}`,
      dispatchNumber: `PD${createdDate.getFullYear()}${String(createdDate.getMonth() + 1).padStart(2, '0')}${String(createdDate.getDate()).padStart(2, '0')}${String(i).padStart(4, '0')}`,
      productionOrderNumber: `PO${createdDate.getFullYear()}${String(createdDate.getMonth() + 1).padStart(2, '0')}${String(createdDate.getDate()).padStart(2, '0')}${String(i + 100).padStart(4, '0')}`,
      productName: products[productIndex],
      totalQuantity,
      completedQuantity,
      completionRate,
      workshopId: String(workshopIndex + 1),
      workshopName: workshops[workshopIndex],
      priority,
      status,
      plannedStartTime: plannedStartDate.toISOString().slice(0, 19).replace('T', ' '),
      plannedEndTime: plannedEndDate.toISOString().slice(0, 19).replace('T', ' '),
      createdByName: `用户${i % 10 + 1}`,
      createdAt: createdDate.toISOString().slice(0, 19).replace('T', ' '),
      updatedAt: createdDate.toISOString().slice(0, 19).replace('T', ' ')
    });
  }
  
  return data;
};

// 方法：搜索
const handleSearch = () => {
  // 实际项目中，这里应该调用API进行搜索
  // 这里简化处理
  pagination.currentPage = 1;
  ElMessage.success('搜索成功');
};

// 方法：重置搜索
const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  searchForm.createTimeRange = null;
  handleSearch();
};

// 方法：导出数据
const exportData = () => {
  // 实际项目中，这里应该调用API导出数据
  ElMessage.success('导出成功');
};

// 方法：选择行变化
const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

// 方法：批量操作
const handleBatchCommand = (command) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的数据');
    return;
  }
  
  switch (command) {
    case 'batchCancel':
      batchCancel();
      break;
    case 'batchClose':
      batchClose();
      break;
    case 'batchExport':
      batchExport();
      break;
  }
};

// 方法：批量取消
const batchCancel = () => {
  const canCancelRows = selectedRows.value.filter(row => canCancel(row));
  if (canCancelRows.length === 0) {
    ElMessage.warning('所选数据中没有可以取消的派工单');
    return;
  }
  
  ElMessageBox.confirm(
    `确定要取消选中的 ${canCancelRows.length} 个派工单吗？`,
    '确认取消',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实际项目中，这里应该调用API取消派工单
    canCancelRows.forEach(row => {
      const index = dispatchList.value.findIndex(item => item.id === row.id);
      if (index > -1) {
        dispatchList.value[index].status = 'CANCELLED';
      }
    });
    ElMessage.success('取消成功');
    selectedRows.value = [];
  });
};

// 方法：批量关闭
const batchClose = () => {
  // 类似批量取消的实现
  ElMessage.success('批量关闭成功');
};

// 方法：批量导出
const batchExport = () => {
  ElMessage.success(`已导出 ${selectedRows.value.length} 条数据`);
};

// 方法：创建派工单
const createDispatch = () => {
  router.push('/production-dispatch/create');
};

// 方法：查看详情
const viewDetail = (row) => {
  router.push(`/production-dispatch/detail/${row.id}`);
};

// 方法：编辑派工单
const editDispatch = (row) => {
  router.push(`/production-dispatch/edit/${row.id}`);
};

// 方法：取消派工单
const cancelDispatch = (row) => {
  ElMessageBox.confirm(
    `确定要取消派工单 ${row.dispatchNumber} 吗？`,
    '确认取消',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 实际项目中，这里应该调用API取消派工单
    const index = dispatchList.value.findIndex(item => item.id === row.id);
    if (index > -1) {
      dispatchList.value[index].status = 'CANCELLED';
    }
    ElMessage.success('取消成功');
  });
};

// 方法：处理更多操作
const handleAction = (row, command) => {
  switch (command) {
    case 'print':
      ElMessage.info('打印功能开发中');
      break;
    case 'export':
      ElMessage.success('导出成功');
      break;
    case 'copy':
      router.push(`/production-dispatch/create?copyFrom=${row.id}`);
      break;
  }
};

// 方法：双击行事件
const handleRowDblClick = (row) => {
  viewDetail(row);
};

// 方法：分页大小变化
const handleSizeChange = (size) => {
  pagination.pageSize = size;
};

// 方法：当前页变化
const handleCurrentChange = (current) => {
  pagination.currentPage = current;
};

// 方法：获取优先级样式类型
const getPriorityType = (priority) => {
  switch (priority) {
    case 'HIGH':
      return 'danger';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'success';
    default:
      return 'info';
  }
};

// 方法：获取优先级文本
const getPriorityText = (priority) => {
  switch (priority) {
    case 'HIGH':
      return '高';
    case 'MEDIUM':
      return '中';
    case 'LOW':
      return '低';
    default:
      return priority;
  }
};

// 方法：获取状态样式类型
const getStatusType = (status) => {
  switch (status) {
    case 'PENDING':
      return 'info';
    case 'IN_PROGRESS':
      return 'primary';
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    case 'CLOSED':
      return 'warning';
    default:
      return 'info';
  }
};

// 方法：获取状态文本
const getStatusText = (status) => {
  const statusObj = dispatchStatuses.find(s => s.value === status);
  return statusObj ? statusObj.label : status;
};

// 方法：判断是否可以编辑
const canEdit = (row) => {
  return row.status === 'PENDING' || row.status === 'IN_PROGRESS';
};

// 方法：判断是否可以取消
const canCancel = (row) => {
  return row.status === 'PENDING' || row.status === 'IN_PROGRESS';
};
</script>

<style scoped>
.dispatch-list {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.header-actions h1 {
  font-size: 24px;
  color: #303133;
  margin: 0;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 16px;
}

.search-actions {
  display: flex;
  gap: 10px;
}

.table-section {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  padding: 40px 0;
}

.completion-rate {
  font-size: 12px;
  color: #67c23a;
  margin-left: 5px;
}

/* 自定义表格行悬停样式 */
.el-table__row:hover {
  background-color: #f5f7fa;
}

/* 自定义表格列宽度 */
.el-table-column--selection {
  background-color: #fafafa;
}

.el-table-column--fixed-right {
  background-color: #fafafa;
}
</style>