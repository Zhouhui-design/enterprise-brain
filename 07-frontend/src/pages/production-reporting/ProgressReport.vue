<template>
  <div class="progress-report">
    <!-- 页面标题和面包屑 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/production-reporting' }">生产报工</el-breadcrumb-item>
        <el-breadcrumb-item>进度报工</el-breadcrumb-item>
      </el-breadcrumb>
      <h2 class="page-title">进度报工</h2>
    </div>

    <!-- 操作面板 -->
    <div class="operation-panel">
      <div class="panel-left">
        <el-button type="primary" @click="showReportForm = true">
          <el-icon><Plus /></el-icon>
          新增进度报工
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
      <div class="panel-right">
        <el-input
          v-model="searchQuery"
          placeholder="搜索报工单号/工单编号/产品名称"
          prefix-icon="Search"
          style="width: 300px"
          clearable
        />
      </div>
    </div>

    <!-- 报工列表 -->
    <div class="report-list">
      <el-card shadow="hover">
        <el-table
          :data="progressReports"
          style="width: 100%"
          border
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="reportNo" label="报工单号" width="180" show-overflow-tooltip />
          <el-table-column prop="workOrderNo" label="工单编号" width="180" show-overflow-tooltip />
          <el-table-column prop="productName" label="产品名称" width="150" show-overflow-tooltip />
          <el-table-column prop="workshopName" label="车间" width="120" />
          <el-table-column prop="lineName" label="产线" width="100" />
          <el-table-column prop="planQuantity" label="计划数量" width="100" align="center" />
          <el-table-column prop="reportedQuantity" label="已报工数量" width="120" align="center" />
          <el-table-column prop="progressRate" label="完成进度" width="150" align="center">
            <template #default="scope">
              <el-progress :percentage="parseFloat(scope.row.progressRate)" :format="rateFormat" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="reportDate" label="报工日期" width="150" />
          <el-table-column prop="reporterName" label="报工人" width="100" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="viewProgressReport(scope.row)">查看</el-button>
              <el-button
                v-if="scope.row.status === 'draft' || scope.row.status === 'rejected'"
                size="small"
                type="primary"
                @click="editProgressReport(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="scope.row.status === 'draft'"
                size="small"
                type="danger"
                @click="deleteProgressReport(scope.row.id)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 进度报工表单对话框 -->
    <el-dialog
      v-model="showReportForm"
      :title="editingReport ? '编辑进度报工' : '新增进度报工'"
      width="800px"
      :close-on-click-modal="false"
    >
      <report-form
        ref="reportFormRef"
        :report-type="'progress'"
        :report-data="editingReport"
        @submit="handleReportFormSubmit"
        @cancel="handleReportFormCancel"
      />
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showDetail"
      title="进度报工详情"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedReport" class="report-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="报工单号">{{ selectedReport.reportNo }}</el-descriptions-item>
          <el-descriptions-item label="工单编号">{{ selectedReport.workOrderNo }}</el-descriptions-item>
          <el-descriptions-item label="产品名称">{{ selectedReport.productName }}</el-descriptions-item>
          <el-descriptions-item label="产品型号">{{ selectedReport.productModel }}</el-descriptions-item>
          <el-descriptions-item label="车间">{{ selectedReport.workshopName }}</el-descriptions-item>
          <el-descriptions-item label="产线">{{ selectedReport.lineName }}</el-descriptions-item>
          <el-descriptions-item label="班次">{{ selectedReport.shiftName }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ selectedReport.responsiblePerson }}</el-descriptions-item>
          <el-descriptions-item label="计划数量" :span="2">{{ selectedReport.planQuantity }}</el-descriptions-item>
          <el-descriptions-item label="本次报工数量" :span="2">{{ selectedReport.currentReportQuantity }}</el-descriptions-item>
          <el-descriptions-item label="累计报工数量" :span="2">{{ selectedReport.reportedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="完成进度" :span="2">
            <el-progress :percentage="parseFloat(selectedReport.progressRate)" :format="rateFormat" />
          </el-descriptions-item>
          <el-descriptions-item label="报工日期">{{ selectedReport.reportDate }}</el-descriptions-item>
          <el-descriptions-item label="报工人">{{ selectedReport.reporterName }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ selectedReport.auditorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核日期">{{ selectedReport.auditDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(selectedReport.status) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedReport.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 报工明细 -->
        <div class="detail-section">
          <h4>报工明细</h4>
          <el-table
            :data="selectedReport.details"
            style="width: 100%"
            border
            stripe
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="processName" label="工序" width="150" />
            <el-table-column prop="processNo" label="工序号" width="120" />
            <el-table-column prop="startTime" label="开始时间" width="180" />
            <el-table-column prop="endTime" label="结束时间" width="180" />
            <el-table-column prop="reportedQuantity" label="报工数量" width="120" align="center" />
            <el-table-column prop="operatorName" label="操作员" width="100" />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Download, Search } from '@element-plus/icons-vue';
import ReportForm from './components/ReportForm.vue';

export default {
  name: 'ProgressReport',
  components: {
    ReportForm,
    Plus,
    Download,
    Search
  },
  data() {
    return {
      showReportForm: false,
      showDetail: false,
      searchQuery: '',
      currentPage: 1,
      pageSize: 20,
      total: 0,
      progressReports: [],
      selectedRows: [],
      editingReport: null,
      selectedReport: null
    };
  },
  mounted() {
    this.loadProgressReports();
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
      this.loadProgressReports();
    }
  },
  methods: {
    loadProgressReports() {
      // 模拟加载进度报工数据
      this.mockLoadProgressReports();
    },
    mockLoadProgressReports() {
      // 生成模拟数据
      const mockData = [];
      const workshops = ['冲压车间', '装配车间', '机加工车间', '焊接车间'];
      const lines = ['产线1', '产线2', '产线3', '产线4'];
      const products = ['高精度轴承', '不锈钢法兰', '液压油缸', '齿轮箱', '电机外壳', '精密模具'];
      const statuses = ['draft', 'submitted', 'approved', 'rejected'];
      const reporters = ['张三', '李四', '王五', '赵六', '钱七'];
      
      for (let i = 1; i <= this.pageSize; i++) {
        const index = (this.currentPage - 1) * this.pageSize + i;
        const planQuantity = Math.floor(Math.random() * 1000) + 500;
        const reportedQuantity = Math.floor(planQuantity * (0.1 + Math.random() * 0.9));
        const progressRate = ((reportedQuantity / planQuantity) * 100).toFixed(1);
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        mockData.push({
          id: `PR${index.toString().padStart(6, '0')}`,
          reportNo: `PGR${new Date().getFullYear()}${index.toString().padStart(6, '0')}`,
          workOrderNo: `WO${new Date().getFullYear()}${(index + 100).toString().padStart(6, '0')}`,
          productName: products[Math.floor(Math.random() * products.length)],
          productModel: `Model-${Math.floor(Math.random() * 1000) + 100}`,
          workshopName: workshops[Math.floor(Math.random() * workshops.length)],
          lineName: lines[Math.floor(Math.random() * lines.length)],
          planQuantity,
          reportedQuantity,
          progressRate,
          reportDate: this.generateRandomDate(),
          reporterName: reporters[Math.floor(Math.random() * reporters.length)],
          status,
          // 为了查看详情时使用
          currentReportQuantity: Math.floor(Math.random() * 200) + 50,
          shiftName: `第${Math.floor(Math.random() * 3) + 1}班`,
          responsiblePerson: reporters[Math.floor(Math.random() * reporters.length)],
          auditorName: status !== 'draft' && status !== 'submitted' ? reporters[Math.floor(Math.random() * reporters.length)] : null,
          auditDate: status !== 'draft' && status !== 'submitted' ? this.generateRandomDate() : null,
          remark: Math.random() > 0.7 ? '生产正常' : '',
          details: this.generateMockDetails()
        });
      }
      
      // 根据搜索条件过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        this.progressReports = mockData.filter(item => 
          item.reportNo.toLowerCase().includes(query) ||
          item.workOrderNo.toLowerCase().includes(query) ||
          item.productName.toLowerCase().includes(query)
        );
        this.total = this.progressReports.length;
      } else {
        this.progressReports = mockData;
        this.total = 500; // 模拟总数据量
      }
    },
    generateRandomDate() {
      const date = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      date.setDate(date.getDate() - randomDays);
      return date.toISOString().split('T')[0];
    },
    generateMockDetails() {
      const details = [];
      const processCount = Math.floor(Math.random() * 5) + 3;
      const processes = ['备料', '粗加工', '热处理', '精加工', '检验', '包装'];
      const operators = ['操作员1', '操作员2', '操作员3', '操作员4', '操作员5'];
      
      for (let i = 0; i < processCount; i++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (processCount - i + 1));
        const endDate = new Date(startDate);
        endDate.setHours(startDate.getHours() + 8 + Math.floor(Math.random() * 8));
        
        details.push({
          processName: processes[i % processes.length],
          processNo: `P${(i + 1).toString().padStart(3, '0')}`,
          startTime: startDate.toISOString().replace('T', ' ').substring(0, 19),
          endTime: endDate.toISOString().replace('T', ' ').substring(0, 19),
          reportedQuantity: Math.floor(Math.random() * 100) + 50,
          operatorName: operators[Math.floor(Math.random() * operators.length)],
          remark: Math.random() > 0.8 ? '工序正常' : ''
        });
      }
      
      return details;
    },
    handleReportFormSubmit(formData) {
      // 处理表单提交
      console.log('提交进度报工数据:', formData);
      
      // 模拟保存成功
      this.$message({
        type: 'success',
        message: '保存成功'
      });
      
      this.showReportForm = false;
      this.editingReport = null;
      this.loadProgressReports();
    },
    handleReportFormCancel() {
      this.showReportForm = false;
      this.editingReport = null;
      // 重置表单
      if (this.$refs.reportFormRef) {
        this.$refs.reportFormRef.resetForm();
      }
    },
    viewProgressReport(report) {
      // 查看报工详情
      this.selectedReport = { ...report };
      this.showDetail = true;
    },
    editProgressReport(report) {
      // 编辑报工
      this.editingReport = { ...report };
      this.showReportForm = true;
    },
    deleteProgressReport(id) {
      // 删除报工
      this.$confirm('确定要删除这条报工记录吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        console.log('删除报工ID:', id);
        this.$message({
          type: 'success',
          message: '删除成功'
        });
        this.loadProgressReports();
      }).catch(() => {
        // 用户取消删除
      });
    },
    exportReport() {
      // 导出报表
      this.$message({
        type: 'info',
        message: '报表导出中，请稍候...'
      });
      // 模拟导出操作
      setTimeout(() => {
        this.$message({
          type: 'success',
          message: '报表导出成功'
        });
      }, 1500);
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.loadProgressReports();
    },
    handleCurrentChange(current) {
      this.currentPage = current;
      this.loadProgressReports();
    },
    getStatusText(status) {
      const statusMap = {
        draft: '草稿',
        submitted: '已提交',
        approved: '已审核',
        rejected: '已驳回'
      };
      return statusMap[status] || status;
    },
    getStatusTagType(status) {
      const typeMap = {
        draft: 'info',
        submitted: 'primary',
        approved: 'success',
        rejected: 'danger'
      };
      return typeMap[status] || 'info';
    },
    rateFormat(percentage) {
      return `${percentage}%`;
    }
  }
};
</script>

<style scoped>
.progress-report {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 10px 0 0 0;
  color: #303133;
  font-size: 20px;
}

.operation-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.panel-left {
  display: flex;
  gap: 12px;
}

.report-list {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.report-detail {
  padding: 20px 0;
}

.detail-section {
  margin-top: 30px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

@media (max-width: 768px) {
  .operation-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .panel-right .el-input {
    width: 100% !important;
  }
}
</style>