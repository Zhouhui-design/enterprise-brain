<template>
  <div class="defect-report">
    <!-- 页面标题和面包屑 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item :to="{ path: '/production-reporting' }">生产报工</el-breadcrumb-item>
        <el-breadcrumb-item>缺陷报工</el-breadcrumb-item>
      </el-breadcrumb>
      <h2 class="page-title">缺陷报工</h2>
    </div>

    <!-- 操作面板 -->
    <div class="operation-panel">
      <div class="panel-left">
        <el-button type="primary" @click="showReportForm = true">
          <el-icon><Plus /></el-icon>
          新增缺陷报工
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

    <!-- 缺陷统计概览 -->
    <div class="defect-overview">
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ totalDefectCount }}</div>
          <div class="stat-label">缺陷总数</div>
          <div class="stat-trend" :class="defectTrendType">
            <el-icon v-if="defectTrendType === 'up'"><ArrowUp /></el-icon>
            <el-icon v-else-if="defectTrendType === 'down'"><ArrowDown /></el-icon>
            <span>{{ defectTrendValue }}%</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ defectRate }}</div>
          <div class="stat-label">不良率</div>
          <div class="stat-trend" :class="defectRateTrendType">
            <el-icon v-if="defectRateTrendType === 'up'"><ArrowUp /></el-icon>
            <el-icon v-else-if="defectRateTrendType === 'down'"><ArrowDown /></el-icon>
            <span>{{ defectRateTrendValue }}%</span>
          </div>
        </div>
      </el-card>
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ majorDefectCount }}</div>
          <div class="stat-label">重大缺陷</div>
        </div>
      </el-card>
      <el-card shadow="hover" class="overview-card">
        <div class="stat-item">
          <div class="stat-value">{{ defectTypeCount }}</div>
          <div class="stat-label">缺陷类型数</div>
        </div>
      </el-card>
    </div>

    <!-- 缺陷分析图表 -->
    <div class="analysis-section">
      <el-card shadow="hover">
        <template #header>
          <div class="card-header">
            <span>缺陷分析</span>
          </div>
        </template>
        <defect-analysis />
      </el-card>
    </div>

    <!-- 缺陷报工列表 -->
    <div class="report-list">
      <el-card shadow="hover">
        <el-table
          :data="defectReports"
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
          <el-table-column prop="defectQuantity" label="缺陷数量" width="120" align="center">
            <template #default="scope">
              <el-tag type="danger">{{ scope.row.defectQuantity }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="defectType" label="缺陷类型" width="120">
            <template #default="scope">
              <el-tag :type="getDefectTypeTagType(scope.row.defectType)">
                {{ scope.row.defectType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="defectLevel" label="严重程度" width="100" align="center">
            <template #default="scope">
              <el-tag :type="getDefectLevelTagType(scope.row.defectLevel)">
                {{ getDefectLevelText(scope.row.defectLevel) }}
              </el-tag>
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
              <el-button size="small" @click="viewDefectReport(scope.row)">查看</el-button>
              <el-button
                v-if="scope.row.status === 'draft' || scope.row.status === 'rejected'"
                size="small"
                type="primary"
                @click="editDefectReport(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                v-if="scope.row.status === 'draft'"
                size="small"
                type="danger"
                @click="deleteDefectReport(scope.row.id)"
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

    <!-- 缺陷报工表单对话框 -->
    <el-dialog
      v-model="showReportForm"
      :title="editingReport ? '编辑缺陷报工' : '新增缺陷报工'"
      width="800px"
      :close-on-click-modal="false"
    >
      <report-form
        ref="reportFormRef"
        :report-type="'defect'"
        :report-data="editingReport"
        @submit="handleReportFormSubmit"
        @cancel="handleReportFormCancel"
      />
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showDetail"
      title="缺陷报工详情"
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
          <el-descriptions-item label="缺陷类型">{{ selectedReport.defectType }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">{{ getDefectLevelText(selectedReport.defectLevel) }}</el-descriptions-item>
          <el-descriptions-item label="缺陷数量" :span="2">{{ selectedReport.defectQuantity }}</el-descriptions-item>
          <el-descriptions-item label="缺陷位置" :span="2">{{ selectedReport.defectLocation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="缺陷描述" :span="2">{{ selectedReport.defectDescription || '-' }}</el-descriptions-item>
          <el-descriptions-item label="可能原因" :span="2">{{ selectedReport.possibleReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理措施" :span="2">{{ selectedReport.measure || '-' }}</el-descriptions-item>
          <el-descriptions-item label="报工日期">{{ selectedReport.reportDate }}</el-descriptions-item>
          <el-descriptions-item label="报工人">{{ selectedReport.reporterName }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ selectedReport.auditorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核日期">{{ selectedReport.auditDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusText(selectedReport.status) }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedReport.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <!-- 缺陷图片 -->
        <div v-if="selectedReport.defectImages && selectedReport.defectImages.length > 0" class="detail-section">
          <h4>缺陷图片</h4>
          <el-image
            v-for="(url, index) in selectedReport.defectImages"
            :key="index"
            :src="url"
            :preview-src-list="selectedReport.defectImages"
            fit="cover"
            style="width: 200px; height: 150px; margin: 0 10px 10px 0; cursor: pointer;"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Plus, Download, Search, ArrowUp, ArrowDown, Picture } from '@element-plus/icons-vue';
import ReportForm from './components/ReportForm.vue';
import DefectAnalysis from './components/DefectAnalysis.vue';

export default {
  name: 'DefectReport',
  components: {
    ReportForm,
    DefectAnalysis,
    Plus,
    Download,
    Search,
    ArrowUp,
    ArrowDown,
    Picture
  },
  data() {
    return {
      showReportForm: false,
      showDetail: false,
      searchQuery: '',
      currentPage: 1,
      pageSize: 20,
      total: 0,
      defectReports: [],
      selectedRows: [],
      editingReport: null,
      selectedReport: null,
      // 统计数据
      totalDefectCount: '0',
      defectRate: '0.00%',
      majorDefectCount: '0',
      defectTypeCount: '0',
      defectTrendType: 'down',
      defectTrendValue: 5.2,
      defectRateTrendType: 'down',
      defectRateTrendValue: 0.8
    };
  },
  mounted() {
    this.loadDefectReports();
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
      this.loadDefectReports();
    }
  },
  methods: {
    loadDefectReports() {
      // 模拟加载缺陷报工数据
      this.mockLoadDefectReports();
      this.mockLoadStatistics();
    },
    mockLoadStatistics() {
      // 模拟统计数据
      this.totalDefectCount = Math.floor(Math.random() * 500) + 200;
      this.defectRate = (Math.random() * 5 + 0.5).toFixed(2) + '%';
      this.majorDefectCount = Math.floor(this.totalDefectCount * (0.1 + Math.random() * 0.2));
      this.defectTypeCount = Math.floor(Math.random() * 10) + 5;
      this.defectTrendType = Math.random() > 0.5 ? 'down' : 'up';
      this.defectTrendValue = (Math.random() * 10).toFixed(1);
      this.defectRateTrendType = Math.random() > 0.6 ? 'down' : 'up';
      this.defectRateTrendValue = (Math.random() * 2).toFixed(1);
    },
    mockLoadDefectReports() {
      // 生成模拟数据
      const mockData = [];
      const workshops = ['冲压车间', '装配车间', '机加工车间', '焊接车间'];
      const lines = ['产线1', '产线2', '产线3', '产线4'];
      const processes = ['备料', '粗加工', '热处理', '精加工', '检验', '包装'];
      const products = ['高精度轴承', '不锈钢法兰', '液压油缸', '齿轮箱', '电机外壳', '精密模具'];
      const defectTypes = ['尺寸超差', '表面划伤', '装配不良', '焊接缺陷', '材质问题', '外观缺陷'];
      const statuses = ['draft', 'submitted', 'approved', 'rejected'];
      const reporters = ['张三', '李四', '王五', '赵六', '钱七'];
      
      for (let i = 1; i <= this.pageSize; i++) {
        const index = (this.currentPage - 1) * this.pageSize + i;
        const defectLevel = Math.floor(Math.random() * 4) + 1;
        const defectType = defectTypes[Math.floor(Math.random() * defectTypes.length)];
        
        mockData.push({
          id: `DR${index.toString().padStart(6, '0')}`,
          reportNo: `DFR${new Date().getFullYear()}${index.toString().padStart(6, '0')}`,
          workOrderNo: `WO${new Date().getFullYear()}${(index + 100).toString().padStart(6, '0')}`,
          productName: products[Math.floor(Math.random() * products.length)],
          productModel: `Model-${Math.floor(Math.random() * 1000) + 100}`,
          workshopName: workshops[Math.floor(Math.random() * workshops.length)],
          lineName: lines[Math.floor(Math.random() * lines.length)],
          processName: processes[Math.floor(Math.random() * processes.length)],
          defectType,
          defectLevel,
          defectQuantity: Math.floor(Math.random() * 50) + 1,
          reportDate: this.generateRandomDate(),
          reporterName: reporters[Math.floor(Math.random() * reporters.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          // 为了查看详情时使用
          shiftName: `第${Math.floor(Math.random() * 3) + 1}班`,
          defectLocation: Math.random() > 0.3 ? `位置${Math.floor(Math.random() * 10) + 1}` : '',
          defectDescription: Math.random() > 0.3 ? `${defectType}，具体描述内容...` : '',
          possibleReason: Math.random() > 0.4 ? '可能的原因分析...' : '',
          measure: Math.random() > 0.4 ? '已采取的处理措施...' : '',
          auditorName: statuses.includes(statuses[Math.floor(Math.random() * statuses.length)]) ? reporters[Math.floor(Math.random() * reporters.length)] : null,
          auditDate: statuses.includes(statuses[Math.floor(Math.random() * statuses.length)]) ? this.generateRandomDate() : null,
          remark: Math.random() > 0.7 ? '已通知相关部门处理' : '',
          defectImages: Math.random() > 0.6 ? this.generateMockImages() : []
        });
      }
      
      // 根据搜索条件过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        this.defectReports = mockData.filter(item => 
          item.reportNo.toLowerCase().includes(query) ||
          item.workOrderNo.toLowerCase().includes(query) ||
          item.productName.toLowerCase().includes(query)
        );
        this.total = this.defectReports.length;
      } else {
        this.defectReports = mockData;
        this.total = 500; // 模拟总数据量
      }
    },
    generateRandomDate() {
      const date = new Date();
      const randomDays = Math.floor(Math.random() * 30);
      date.setDate(date.getDate() - randomDays);
      return date.toISOString().split('T')[0];
    },
    generateMockImages() {
      // 生成模拟图片URL数组
      const images = [];
      const imageCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < imageCount; i++) {
        // 使用占位图片服务
        images.push(`https://picsum.photos/800/600?random=${Math.random()}`);
      }
      return images;
    },
    handleReportFormSubmit(formData) {
      // 处理表单提交
      console.log('提交缺陷报工数据:', formData);
      
      // 模拟保存成功
      this.$message({
        type: 'success',
        message: '保存成功'
      });
      
      this.showReportForm = false;
      this.editingReport = null;
      this.loadDefectReports();
    },
    handleReportFormCancel() {
      this.showReportForm = false;
      this.editingReport = null;
      // 重置表单
      if (this.$refs.reportFormRef) {
        this.$refs.reportFormRef.resetForm();
      }
    },
    viewDefectReport(report) {
      // 查看报工详情
      this.selectedReport = { ...report };
      this.showDetail = true;
    },
    editDefectReport(report) {
      // 编辑报工
      this.editingReport = { ...report };
      this.showReportForm = true;
    },
    deleteDefectReport(id) {
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
        this.loadDefectReports();
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
      this.loadDefectReports();
    },
    handleCurrentChange(current) {
      this.currentPage = current;
      this.loadDefectReports();
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
    getDefectLevelText(level) {
      const levelMap = {
        1: '致命',
        2: '严重',
        3: '一般',
        4: '轻微'
      };
      return levelMap[level] || level;
    },
    getDefectLevelTagType(level) {
      const typeMap = {
        1: 'danger',
        2: 'warning',
        3: 'primary',
        4: 'info'
      };
      return typeMap[level] || 'info';
    },
    getDefectTypeTagType(type) {
      // 根据缺陷类型返回不同的标签类型
      const typeMap = {
        '尺寸超差': 'warning',
        '表面划伤': 'primary',
        '装配不良': 'danger',
        '焊接缺陷': 'warning',
        '材质问题': 'danger',
        '外观缺陷': 'info'
      };
      return typeMap[type] || 'info';
    }
  }
};
</script>

<style scoped>
.defect-report {
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

.defect-overview {
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

.detail-section {
  margin-top: 30px;
}

.detail-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
  color: #909399;
  font-size: 32px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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