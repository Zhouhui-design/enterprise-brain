<template>
  <div class="audit-log-container">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operator" placeholder="请输入操作人"></el-input>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="tableData" border style="width: 100%; margin-top: 10px">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="operator" label="操作人" width="120"></el-table-column>
      <el-table-column prop="operation" label="操作内容"></el-table-column>
      <el-table-column prop="ip" label="IP地址" width="150"></el-table-column>
      <el-table-column prop="createTime" label="操作时间" width="180"></el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="scope">
          <el-button size="small" type="text" @click="handleViewDetail(scope.row)">查看详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination" style="margin-top: 10px; text-align: right">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50]"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
      ></el-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 搜索表单数据
const searchForm = ref({
  operator: '',
  timeRange: [] as [Date, Date] | []
});

// 表格数据
const tableData = ref([
  { id: 1, operator: '周辉', operation: '登录系统', ip: '192.168.1.100', createTime: '2024-05-20 10:00:00' },
  // 更多模拟数据...
]);

// 分页参数
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(100);

// 搜索事件
const handleSearch = () => {
  console.log('搜索参数:', searchForm.value);
  // 实际项目中调用接口获取数据
};

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    operator: '',
    timeRange: []
  };
};

// 查看详情
const handleViewDetail = (row: any) => {
  router.push(`/system/audit/log-detail?id=${row.id}`);
};

// 分页事件
const handleSizeChange = (val: number) => {
  pageSize.value = val;
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
};
</script>

<style scoped>
.audit-log-container {
  padding: 20px;
}
.search-form {
  margin-bottom: 10px;
}
</style>
