<template>
  <div class="data-change-container">
    <el-page-header content="数据变更记录"></el-page-header>
    <el-card>
      <div class="search-bar">
        <el-input v-model="searchForm.tableName" placeholder="表名" style="width: 200px; margin-right: 10px;"></el-input>
        <el-input v-model="searchForm.recordId" placeholder="记录ID" style="width: 200px; margin-right: 10px;"></el-input>
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="To" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 300px; margin-right: 10px;"></el-date-picker>
        <el-button type="primary" @click="fetchDataChanges">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="dataChanges" border style="width: 100%; margin-top: 20px;">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="tableName" label="表名" width="150"></el-table-column>
        <el-table-column prop="recordId" label="记录ID" width="150"></el-table-column>
        <el-table-column prop="changeType" label="变更类型" width="120">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.changeType)">
              {{ scope.row.changeType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorId" label="操作人ID" width="120"></el-table-column>
        <el-table-column prop="changeTime" label="变更时间" width="200"></el-table-column>
        <el-table-column label="变更内容">
          <template #default="scope">
            <el-popover trigger="hover" placement="top" width="600">
              <div class="change-content">
                <p><strong>旧值:</strong></p>
                <pre>{{ formatJson(scope.row.oldValue) }}</pre>
                <p><strong>新值:</strong></p>
                <pre>{{ formatJson(scope.row.newValue) }}</pre>
              </div>
              <span slot="reference">查看变更</span>
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
import { dataChangeApi } from '@/api/system/audit';

// 响应式数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const dataChanges = ref([]);
const searchForm = reactive({
  tableName: '',
  recordId: '',
  timeRange: []
});

// 获取标签类型
const getTagType = (changeType) => {
  switch (changeType) {
    case 'INSERT':
      return 'success';
    case 'UPDATE':
      return 'warning';
    case 'DELETE':
      return 'danger';
    default:
      return 'info';
  }
};

// 格式化JSON
const formatJson = (jsonStr) => {
  if (!jsonStr) return '无';
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch (e) {
    return jsonStr;
  }
};

// 搜索
const fetchDataChanges = async () => {
  try {
    const params = {
      tableName: searchForm.tableName,
      recordId: searchForm.recordId,
      startTime: searchForm.timeRange?.[0],
      endTime: searchForm.timeRange?.[1],
      pageNum: currentPage.value,
      pageSize: pageSize.value
    };
    const res = await dataChangeApi.getDataChanges(params);
    dataChanges.value = res.records;
    total.value = res.total;
  } catch (error) {
    console.error('获取数据变更记录失败:', error);
  }
};

// 重置
const resetSearch = () => {
  searchForm.tableName = '';
  searchForm.recordId = '';
  searchForm.timeRange = [];
  currentPage.value = 1;
  fetchDataChanges();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchDataChanges();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchDataChanges();
};

// 初始化
onMounted(() => {
  fetchDataChanges();
});
</script>

<style scoped>
.data-change-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.change-content {
  max-height: 400px;
  overflow: auto;
  font-family: monospace;
}

pre {
  white-space: pre-wrap;
  margin: 5px 0;
  padding: 5px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
</style>
