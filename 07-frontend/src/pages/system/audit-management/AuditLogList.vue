<template>
  <div class="audit-log-container">
    <el-page-header content="审计日志列表"></el-page-header>
    <el-card>
      <div class="search-bar">
        <el-input v-model="searchForm.userName" placeholder="操作人" style="width: 200px; margin-right: 10px;"></el-input>
        <el-input v-model="searchForm.module" placeholder="操作模块" style="width: 200px; margin-right: 10px;"></el-input>
        <el-date-picker v-model="searchForm.timeRange" type="daterange" range-separator="To" start-placeholder="开始时间" end-placeholder="结束时间" style="width: 300px; margin-right: 10px;"></el-date-picker>
        <el-button type="primary" @click="fetchAuditLogs">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </div>

      <el-table :data="auditLogs" border style="width: 100%; margin-top: 20px;">
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="userName" label="操作人" width="120"></el-table-column>
        <el-table-column prop="operation" label="操作内容" width="150"></el-table-column>
        <el-table-column prop="module" label="操作模块" width="120"></el-table-column>
        <el-table-column prop="ipAddress" label="IP地址" width="150"></el-table-column>
        <el-table-column prop="operationTime" label="操作时间" width="200"></el-table-column>
        <el-table-column prop="details" label="操作详情">
          <template #default="scope">
            <el-popover trigger="hover" placement="top">
              <div class="detail-content" v-html="formatDetails(scope.row.details)"></div>
              <span slot="reference">查看详情</span>
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
import { auditLogApi } from '@/api/system/audit';

// 响应式数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const auditLogs = ref([]);
const searchForm = reactive({
  userName: '',
  module: '',
  timeRange: []
});

// 格式化详情
const formatDetails = (details) => {
  if (!details) return '';
  // 处理JSON格式的详情
  try {
    const obj = JSON.parse(details);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return details;
  }
};

// 搜索
const fetchAuditLogs = async () => {
  try {
    const params = {
      userName: searchForm.userName,
      module: searchForm.module,
      startTime: searchForm.timeRange?.[0],
      endTime: searchForm.timeRange?.[1],
      pageNum: currentPage.value,
      pageSize: pageSize.value
    };
    const res = await auditLogApi.getAuditLogs(params);
    auditLogs.value = res.records;
    total.value = res.total;
  } catch (error) {
    console.error('获取审计日志失败:', error);
  }
};

// 重置
const resetSearch = () => {
  searchForm.userName = '';
  searchForm.module = '';
  searchForm.timeRange = [];
  currentPage.value = 1;
  fetchAuditLogs();
};

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchAuditLogs();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchAuditLogs();
};

// 初始化
onMounted(() => {
  fetchAuditLogs();
});
</script>

<style scoped>
.audit-log-container {
  padding: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.detail-content {
  max-width: 500px;
  max-height: 300px;
  overflow: auto;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
