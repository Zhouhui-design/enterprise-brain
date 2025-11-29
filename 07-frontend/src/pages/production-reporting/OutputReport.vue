<template>
  <div class="output-report">
    <!-- 页面标题和面包屑 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/production-reporting' }">生产报工</el-breadcrumb-item>
        <el-breadcrumb-item>产量报工</el-breadcrumb-item>
      </el-breadcrumb>
      <h2 class="page-title">产量报工</h2>
    </div>

    <!-- 操作面板 -->
    <div class="operation-panel">
      <div class="panel-left">
        <el-button type="primary" @click="showReportForm = true">
          <el-icon><Plus /></el-icon>
          新增产量报工
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
        <el-button @click="batchImport">
          <el-icon><Upload /></el-icon>
          批量导入
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

    <!-- 产量统计概览 -->
    <div class="output-overview">
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ totalOutput }}</div>
          <div class="stat-label">总产量</div>
          <div class="stat-trend" :class="outputTrendType">
            <el-icon v-if="outputTrendType === 'up'"><ArrowUp /></el-icon>
            <el-icon v-else-if="outputTrendType === 'down'"><ArrowDown /></el-icon>
            <span>{{ outputTrendValue }}%</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ qualifiedOutput }}</div>
          <div class="stat-label">合格产量</div>
          <div class="stat-trend" :class="qualifiedTrendType">
            <el-icon v-if="qualifiedTrendType === 'up'"><ArrowUp /></el-icon>
            <el-icon v-else-if="qualifiedTrendType === 'down'"><ArrowDown /></el-icon>
            <span>{{ qualifiedTrendValue }}%</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ passRate }}</div>
          <div class="stat-label">合格率</div>
          <div class="stat-trend" :class="passRateTrendType">
            <el-icon v-if="passRateTrendType === 'up'"><ArrowUp /></el-icon>
            <el-icon v-else-if="passRateTrendType === 'down'"><ArrowDown /></el-icon>
            <span>{{ passRateTrendValue }}%</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ reportCount }}</div>
          <div class="stat-label">报工次数</div>
        </div>
      </el-card>
    </div>

    <!-- 效率分析图表 -->
    <div class="analysis-section">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>生产效率分析</span>
          </div>
        </template>
        <efficiency-chart />
      </el-card>
    </div>

    <!-- 产量报工列表 -->
    <div class="report-list">
      <el-card shadow="hover">
        <el-table
          :data="outputReports"
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
          <el-table-column prop="processName" label="工序" width="100" />
          <el-table-column prop="planQuantity" label="计划数量" width="100" align="center" />
          <el-table-column prop="reportQuantity" label="报工数量" width="100" align="center">
            <template #default="scope">
              <el-tag type="primary">{{ scope.row.reportQuantity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="qualifiedQuantity" label="合格数量" width="100" align="center">
            <template #default="scope">
              <el-tag type="success">{{ scope.row.qualifiedQuantity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rejectQuantity" label="不合格数量" width="120" align="center">
            <template #default="scope">
              <el-tag type="danger">{{ scope.row.rejectQuantity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="passRate" label="合格率" width="100" align="center">
            <template #default="scope">
              <el-progress 
                :percentage="parseFloat(scope.row.passRate)" 
                :format="(percentage) => `${percentage}%`"
                size="small" 
                :color="getPassRateColor(scope.row.passRate)"
              />
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
              <el-button size="small" @click="viewOutputReport(scope.row)">查看</el-button>
              <el-button
                v-if="scope.row.status === 'draft' || scope.row.status === 'rejected'"
                size="small"
                type="primary"
                @click="editOutputReport(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="scope.row.status === 'draft'"
                size="small"
                type="danger"
                @click="deleteOutputReport(scope.row.id)"
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

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="批量导入产量报工"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="import-content">
        <el-upload
          class="upload-excel"
          action=""
          :on-change="handleFileChange"
          :before-upload="beforeUpload"
          accept=".xlsx, .xls"
          :auto-upload="false"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            选择Excel文件
          </el-button>
          <template #tip>
            <div class="el-upload__tip">
              请上传.xlsx或.xls格式的Excel文件，<el-button type="text" @click="downloadTemplate">下载模板</el-button>
            </div>
          </template>
        </el-upload>
        
        <div v-if="selectedFile" class="selected-file">
          <el-icon><Document /></el-icon>
          <span>{{ selectedFile.name }}</span>
          <el-button type="text" @click="removeFile" style="margin-left: auto;">移除</el-button>
        </div>
        
        <div class="import-preview" v-if="previewData.length > 0">
          <h4>数据预览</h4>
          <el-table :data="previewData" style="width: 100%;" border size="small">
            <el-table-column prop="workOrderNo" label="工单编号" width="150" />
            <el-table-column prop="productName" label="产品名称" width="120" />
            <el-table-column prop="reportQuantity" label="报工数量" width="100" />
            <el-table-column prop="qualifiedQuantity" label="合格数量" width="100" />
            <el-table-column prop="rejectQuantity" label="不合格数量" width="120" />
            <el-table-column prop="error" label="错误信息" width="150" show-overflow-tooltip>
              <template #default="scope">
                <span v-if="scope.row.error" style="color: #f56c6c;">{{ scope.row.error }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelImport">取消</el-button>
          <el-button type="primary" :disabled="!selectedFile" @click="confirmImport">确认导入</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 产量报工表单对话框 -->
    <el-dialog
      v-model="showReportForm"
      :title="editingReport ? '编辑产量报工' : '新增产量报工'"
      width="800px"
      :close-on-click-modal="false"
    >
      <report-form
        ref="reportFormRef"
        :report-type="'output'"
        :report-data="editingReport"
        @submit="handleReportFormSubmit"
        @cancel="handleReportFormCancel"
      />
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showDetail"
      title="产量报工详情"
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
          <el-descriptions-item label="工序">{{ selectedReport.processName }}</el-descriptions-item>
          <el-descriptions-item label="班次">{{ selectedReport.shiftName }}</el-descriptions-item>
          <el-descriptions-item label="计划数量">{{ selectedReport.planQuantity }}</el-descriptions-item>
          <el-descriptions-item label="报工数量">{{ selectedReport.reportQuantity }}</el-descriptions-item>
          <el-descriptions-item label="合格数量">{{ selectedReport.qualifiedQuantity }}</el-descriptions-item>
          <el-descriptions-item label="不合格数量">{{ selectedReport.rejectQuantity }}</el-descriptions-item>
          <el-descriptions-item label="合格率">{{ selectedReport.passRate }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ selectedReport.startTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ selectedReport.endTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="实际工时(h)">{{ selectedReport.actualWorkHours || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报工日期">{{ selectedReport.reportDate }}</el-descriptions-item>
          <el-descriptions-item label="报工人">{{ selectedReport.reporterName }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ selectedReport.auditorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核日期">{{ selectedReport.auditDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(selectedReport.status) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedReport.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Download, Upload, Search, ArrowUp, ArrowDown, Document } from '@element-plus/icons-vue';
import ReportForm from './components/ReportForm.vue';
import EfficiencyChart from './components/EfficiencyChart.vue';

export default {
  name: 'OutputReport',
  components: {
    ReportForm,
    EfficiencyChart,
    Plus,
    Download,
    Upload,
    Search,
    ArrowUp,
    ArrowDown,
    Document
  },
  data() {
    return {
      showReportForm: false,
      showDetail: false,
      showImportDialog: false,
      searchQuery: '',
      currentPage: 1,
      pageSize: 20,
      total: 0,
      outputReports: [],
      selectedRows: [],
      editingReport: null,
      selectedReport: null,
      selectedFile: null,
      previewData: [],
      // 统计数据
      totalOutput: '0',
      qualifiedOutput: '0',
      passRate: '0.00%',
      reportCount: '0',
      outputTrendType: 'up',
      outputTrendValue: 8.5,
      qualifiedTrendType: 'up',
      qualifiedTrendValue: 7.2,
      passRateTrendType: 'down',
      passRateTrendValue: 0.5
    };
  },
  mounted() {
    this.loadOutputReports();
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
      this.loadOutputReports();
    }
  },
  methods: {
    loadOutputReports() {
      // 模拟加载产量报工数据
      this.mockLoadOutputReports();
      this.mockLoadStatistics();
    },
    mockLoadStatistics() {
      // 模拟统计数据
      this.totalOutput = Math.floor(Math.random() * 5000) + 3000;
      const qualified = Math.floor(this.totalOutput * (0.85 + Math.random() * 0.15));
      this.qualifiedOutput = qualified;
      this.passRate = ((qualified / this.totalOutput) * 100).toFixed(2) + '%';
      this.reportCount = Math.floor(Math.random() * 50) + 20;
      this.outputTrendType = Math.random() > 0.7 ? 'down' : 'up';
      this.outputTrendValue = (Math.random() * 15).toFixed(1);
      this.qualifiedTrendType = Math.random() > 0.6 ? 'down' : 'up';
      this.qualifiedTrendValue = (Math.random() * 10).toFixed(1);
      this.passRateTrendType = Math.random() > 0.8 ? 'down' : 'up';
      this.passRateTrendValue = (Math.random() * 2).toFixed(1);
    },
    mockLoadOutputReports() {
      // 生成模拟数据
      const mockData = [];
      const workshops = ['冲压车间', '装配车间', '机加工车间', '焊接车间'];
      const lines = ['产线1', '产线2', '产线3', '产线4'];
      const processes = ['备料', '粗加工', '热处理', '精加工', '检验', '包装'];
      const products = ['高精度轴承', '不锈钢法兰', '液压油缸', '齿轮箱', '电机外壳', '精密模具'];
      const statuses = ['draft', 'submitted', 'approved', 'rejected'];
      const reporters = ['张三', '李四', '王五', '赵六', '钱七'];
      
      for (let i = 1; i <= this.pageSize; i++) {
        const index = (this.currentPage - 1) * this.pageSize + i;
        const planQuantity = Math.floor(Math.random() * 500) + 100;
        const reportQuantity = Math.floor(planQuantity * (0.9 + Math.random() * 0.2));
        const qualifiedQuantity = Math.floor(reportQuantity * (0.85 + Math.random() * 0.15));
        const rejectQuantity = reportQuantity - qualifiedQuantity;
        
        mockData.push({
          id: `OR${index.toString().padStart(6, '0')}`,
          reportNo: `OUT${new Date().getFullYear()}${index.toString().padStart(6, '0')}`,
          workOrderNo: `WO${new Date().getFullYear()}${(index + 200).toString().padStart(6, '0')}`,
          productName: products[Math.floor(Math.random() * products.length)],
          productModel: `Model-${Math.floor(Math.random() * 1000) + 100}`,
          workshopName: workshops[Math.floor(Math.random() * workshops.length)],
          lineName: lines[Math.floor(Math.random() * lines.length)],
          processName: processes[Math.floor(Math.random() * processes.length)],
          planQuantity,
          reportQuantity,
          qualifiedQuantity,
          rejectQuantity,
          passRate: ((qualifiedQuantity / reportQuantity) * 100).toFixed(2) + '%',
          reportDate: this.generateRandomDate(),
          reporterName: reporters[Math.floor(Math.random() * reporters.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          // 为了查看详情时使用
          shiftName: `第${Math.floor(Math.random() * 3) + 1}班`,
          startTime: Math.random() > 0.2 ? `${this.generateRandomDate()} ${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:00` : null,
          endTime: Math.random() > 0.2 ? `${this.generateRandomDate()} ${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:00` : null,
          actualWorkHours: Math.random() > 0.2 ? (Math.random() * 16 + 1).toFixed(2) : null,
          auditorName: statuses.includes(statuses[Math.floor(Math.random() * statuses.length)]) ? reporters[Math.floor(Math.random() * reporters.length)] : null,
          auditDate: statuses.includes(statuses[Math.floor(Math.random() * statuses.length)]) ? this.generateRandomDate() : null,
          remark: Math.random() > 0.7 ? '生产顺利完成' : ''
        });
      }
      
      // 根据搜索条件过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        this.outputReports = mockData.filter(item => 
          item.reportNo.toLowerCase().includes(query) ||
          item.workOrderNo.toLowerCase().includes(query) ||
          item.productName.toLowerCase().includes(query)
        );
        this.total = this.outputReports.length;
      } else {
        this.outputReports = mockData;
        this.total = 500; // 模拟总数据量
      }
    },
    generateRandomDate() {
      const date = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      date.setDate(date.getDate() - randomDays);
      return date.toISOString().split('T')[0];
    },
    handleReportFormSubmit(formData) {
      // 处理表单提交
      console.log('提交产量报工数据:', formData);
      
      // 模拟保存成功
      this.$message({
        type: 'success',
        message: '保存成功'
      });
      
      this.showReportForm = false;
      this.editingReport = null;
      this.loadOutputReports();
    },
    handleReportFormCancel() {
      this.showReportForm = false;
      this.editingReport = null;
      // 重置表单
      if (this.$refs.reportFormRef) {
        this.$refs.reportFormRef.resetForm();
      }
    },
    viewOutputReport(report) {
      // 查看报工详情
      this.selectedReport = { ...report };
      this.showDetail = true;
    },
    editOutputReport(report) {
      // 编辑报工
      this.editingReport = { ...report };
      this.showReportForm = true;
    },
    deleteOutputReport(id) {
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
        this.loadOutputReports();
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
    batchImport() {
      this.showImportDialog = true;
      this.selectedFile = null;
      this.previewData = [];
    },
    handleFileChange(file) {
      this.selectedFile = file;
      // 模拟预览数据
      this.previewData = this.generatePreviewData();
    },
    beforeUpload(file) {
      const isExcel = file.type === 'application/vnd.ms-excel' || 
                      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      if (!isExcel) {
        this.$message.error('只能上传Excel文件！');
      }
      return isExcel;
    },
    generatePreviewData() {
      // 生成模拟的预览数据
      const data = [];
      const products = ['高精度轴承', '不锈钢法兰', '液压油缸', '齿轮箱', '电机外壳', '精密模具'];
      
      for (let i = 0; i < 5; i++) {
        const workOrderNo = `WO${new Date().getFullYear()}${(Math.floor(Math.random() * 10000) + 1000).toString().padStart(6, '0')}`;
        const reportQuantity = Math.floor(Math.random() * 200) + 50;
        const qualifiedQuantity = Math.floor(reportQuantity * (0.8 + Math.random() * 0.15));
        const rejectQuantity = reportQuantity - qualifiedQuantity;
        
        // 随机生成一些错误数据用于演示
        const hasError = Math.random() > 0.8;
        
        data.push({
          workOrderNo,
          productName: products[Math.floor(Math.random() * products.length)],
          reportQuantity: hasError ? 0 : reportQuantity,
          qualifiedQuantity: hasError ? reportQuantity + 1 : qualifiedQuantity,
          rejectQuantity: hasError ? -1 : rejectQuantity,
          error: hasError ? '合格数量不能大于报工数量' : ''
        });
      }
      
      return data;
    },
    removeFile() {
      this.selectedFile = null;
      this.previewData = [];
    },
    downloadTemplate() {
      this.$message({
        type: 'info',
        message: '模板下载中...'
      });
      // 模拟下载
      setTimeout(() => {
        this.$message({
          type: 'success',
          message: '模板下载成功'
        });
      }, 1000);
    },
    confirmImport() {
      if (!this.selectedFile) return;
      
      this.$confirm('确定要导入这些数据吗？', '导入确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$message({
          type: 'info',
          message: '数据导入中，请稍候...'
        });
        
        // 模拟导入操作
        setTimeout(() => {
          this.$message({
            type: 'success',
            message: '数据导入成功'
          });
          this.cancelImport();
          this.loadOutputReports();
        }, 2000);
      }).catch(() => {
        // 用户取消导入
      });
    },
    cancelImport() {
      this.showImportDialog = false;
      this.selectedFile = null;
      this.previewData = [];
    },
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.loadOutputReports();
    },
    handleCurrentChange(current) {
      this.currentPage = current;
      this.loadOutputReports();
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
    getPassRateColor(passRateStr) {
      const passRate = parseFloat(passRateStr);
      if (passRate >= 95) return '#67c23a';
      if (passRate >= 85) return '#e6a23c';
      return '#f56c6c';
    }
  }
};
</script>

<style scoped>
.output-report {
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

.output-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.overview-card {
  height: 120px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

.analysis-section {
  margin-bottom: 24px;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 导入对话框样式 */
.import-content {
  padding: 20px 0;
}

.selected-file {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin: 15px 0;
}

.selected-file .el-icon {
  margin-right: 8px;
}

.import-preview {
  margin-top: 20px;
}

.import-preview h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.upload-excel {
  text-align: center;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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