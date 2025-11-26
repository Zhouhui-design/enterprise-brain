<template>
  <div class="operation-trace-container">
    <el-page-header content="操作轨迹跟踪"></el-page-header>
    <el-card>
      <div class="search-bar">
        <el-input v-model="searchForm.userId" placeholder="用户ID" style="width: 200px; margin-right: 10px;"></el-input>
        <el-input v-model="searchForm.sessionId" placeholder="会话ID" style="width: 200px; margin-right: 10px;"></el-input>
        <el-select v-model="searchForm.status" placeholder="操作状态" style="width: 150px; margin-right: 10px;">
          <el-option label="成功" value="SUCCESS"></el-option>
          <el-option label="失败" value="FAIL"></el-option>
        </el-select>
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="To" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 300px; margin-right: 10px;"></el-date-picker>
        <el-button type="primary" @click="fetchOperationTraces">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="operationTraces" border style="width: 100%; margin-top: 20px;">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="userId" label="用户ID" width="120"></el-table-column>
        <el-table-column prop="sessionId" label="会话ID" width="200"></el-table-column>
        <el-table-column prop="operation" label="操作内容" width="180"></el-table-column>
        <el-table-column prop="startTime" label="开始时间" width="200"></el-table-column>
        <el-table-column prop="endTime" label="结束时间" width="200"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'SUCCESS' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="errorMsg" label="错误信息">
          <template #default="scope">
            <el-popover trigger="hover" placement="top">
              <p style="max-width: 500px; word-break: break-all;">{{ scope.row.errorMsg || '无' }}</p>
              <span slot="reference">{{ scope.row.errorMsg ? '查看错误' : '无' }}</span>
            </el-popover>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination 
        @size-change="handleSizeChange" 
        @current-change="handleCurrentChange"
        :current-page="currentPage" 
        :page-sizes="[10, 20, 50]" 
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next" 
        :total="total"
        style="margin-top: 20px; text-align: right;"
      ></el-pagination>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { operationTraceApi } from '@/api/system/audit';

// 响应式数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const operationTraces = ref([]);
const searchForm = reactive({
  userId: '',
  sessionId: '',
  status: '',
  timeRange: []
});

// 搜索
const fetchOperationTraces = async () => {
  try {
    const params = {
      userId: searchForm.userId,
      sessionId: searchForm.sessionId,
      status: searchForm.status,
      startTime: searchForm.timeRange?.[0],
      endTime: searchForm.timeRange?.[1],
      pageNum: currentPage.value,
      pageSize: pageSize.value
    };
    const res = await operationTraceApi.getOperationTraces(params);
    operationTraces.value = res.records;
    total.value = res.total;
  } catch (error) {
    console.error('获取操作轨迹失败:', error);
  }
};

// 重置
const resetSearch = () => {
  searchForm.userId = '';
  searchForm.sessionId = '';
  searchForm.status = '';
  searchForm.timeRange = [];
  currentPage.value = 1;
  fetchOperationTraces();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchOperationTraces();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchOperationTraces();
};

// 初始化
onMounted(() => {
  fetchOperationTraces();
});
</script>

<style scoped>
.operation-trace-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
</style>
