<template>
  <div class="production-plan-list">
    <div class="header">
      <el-page-header :title="'生产计划管理'" :content="'生产计划列表'" />
      <el-button type="primary" @click="handleCreatePlan">创建生产计划</el-button>
    </div>

    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="计划编号">
          <el-input v-model="searchForm.planCode" placeholder="请输入计划编号" clearable />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
        </el-form-item>
        <el-form-item label="计划状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="未开始" value="0" />
            <el-option label="进行中" value="1" />
            <el-option label="已完成" value="2" />
            <el-option label="已暂停" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划周期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="data-card">
      <div class="table-header">
        <span>生产计划列表</span>
        <div class="batch-actions">
          <el-button type="danger" :disabled="selectedPlans.length === 0" @click="handleBatchDelete">批量删除</el-button>
          <el-button :disabled="selectedPlans.length === 0" @click="handleBatchExport">导出</el-button>
        </div>
      </div>
      
      <el-table
        v-loading="loading"
        :data="planListData"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="planCode" label="计划编号" width="180" />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="orderQuantity" label="计划数量" width="120" align="right">
          <template slot-scope="scope">{{ scope.row.orderQuantity.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="150" />
        <el-table-column prop="endDate" label="结束日期" width="150" />
        <el-table-column prop="status" label="计划状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="statusType[scope.row.status]">{{ statusText[scope.row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responsiblePerson" label="负责人" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button size="small" @click="handleViewDetail(scope.row)">查看详情</el-button>
            <el-button size="small" type="primary" @click="handleEditPlan(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeletePlan(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          v-model="currentPage"
          v-model:page-size="pageSize"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ProductionPlanList',
  data() {
    return {
      loading: false,
      searchForm: {
        planCode: '',
        productName: '',
        status: '',
      },
      dateRange: [],
      planListData: [],
      selectedPlans: [],
      currentPage: 1,
      pageSize: 10,
      total: 0,
      statusText: {
        0: '未开始',
        1: '进行中',
        2: '已完成',
        3: '已暂停'
      },
      statusType: {
        0: 'info',
        1: 'primary',
        2: 'success',
        3: 'warning'
      }
    };
  },
  mounted() {
    this.fetchPlanList();
  },
  methods: {
    fetchPlanList() {
      this.loading = true;
      // 模拟API调用
      setTimeout(() => {
        const mockData = this.generateMockData();
        this.planListData = mockData.data;
        this.total = mockData.total;
        this.loading = false;
      }, 500);
    },
    
    generateMockData() {
      const data = [];
      const statuses = ['0', '1', '2', '3'];
      const products = ['智能手机A', '笔记本电脑B', '平板电脑C', '智能手表D'];
      
      for (let i = (this.currentPage - 1) * this.pageSize; i < this.currentPage * this.pageSize && i < 100; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + i);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 10);
        
        data.push({
          id: i + 1,
          planCode: `PP${new Date().getFullYear()}${String(i + 1).padStart(4, '0')}`,
          productName: products[i % products.length],
          orderQuantity: Math.floor(Math.random() * 1000) + 500,
          startDate: this.formatDate(startDate),
          endDate: this.formatDate(endDate),
          status: statuses[i % statuses.length],
          responsiblePerson: `负责人${i + 1}`
        });
      }
      
      return {
        data,
        total: 100
      };
    },
    
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    handleSearch() {
      this.currentPage = 1;
      this.fetchPlanList();
    },
    
    handleReset() {
      this.searchForm = {
        planCode: '',
        productName: '',
        status: '',
      };
      this.dateRange = [];
      this.currentPage = 1;
      this.fetchPlanList();
    },
    
    handleSelectionChange(val) {
      this.selectedPlans = val;
    },
    
    handleSizeChange(size) {
      this.pageSize = size;
      this.fetchPlanList();
    },
    
    handleCurrentChange(current) {
      this.currentPage = current;
      this.fetchPlanList();
    },
    
    handleCreatePlan() {
      this.$router.push('/production-planning/create');
    },
    
    handleViewDetail(plan) {
      this.$router.push(`/production-planning/detail/${plan.id}`);
    },
    
    handleEditPlan(plan) {
      this.$router.push(`/production-planning/create?id=${plan.id}`);
    },
    
    handleDeletePlan(plan) {
      this.$confirm(`确定要删除生产计划"${plan.planCode}"吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.$message({
          type: 'success',
          message: '删除成功'
        });
        this.fetchPlanList();
      }).catch(() => {
        // 用户取消操作
      });
    },
    
    handleBatchDelete() {
      this.$confirm(`确定要删除选中的${this.selectedPlans.length}个生产计划吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量删除操作
        this.$message({
          type: 'success',
          message: '批量删除成功'
        });
        this.fetchPlanList();
        this.selectedPlans = [];
      }).catch(() => {
        // 用户取消操作
      });
    },
    
    handleBatchExport() {
      // 模拟导出操作
      this.$message({
        type: 'info',
        message: '导出成功'
      });
    }
  }
};
</script>

<style scoped>
.production-plan-list {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin-top: 10px;
}

.data-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: bold;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>