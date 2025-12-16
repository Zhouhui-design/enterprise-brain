<template>
  <div class="supplier-evaluation-container">
    <el-card class="page-card">
      <div slot="header" class="card-header">
        <span class="title">供应商评估管理</span>
      </div>

      <!-- 搜索筛选区域 -->
      <div class="search-filters">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="供应商名称">
            <el-input v-model="searchForm.supplierName" placeholder="请输入供应商名称" clearable />
          </el-form-item>
          <el-form-item label="评估周期">
            <el-date-picker
              v-model="searchForm.evaluationPeriod"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
            />
          </el-form-item>
          <el-form-item label="评估等级">
            <el-select v-model="searchForm.evaluationLevel" placeholder="请选择评估等级" clearable>
              <el-option label="A级" value="A" />
              <el-option label="B级" value="B" />
              <el-option label="C级" value="C" />
              <el-option label="D级" value="D" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch" icon="el-icon-search">搜索</el-button>
            <el-button @click="resetForm" icon="el-icon-refresh">重置</el-button>
            <el-button @click="exportData" icon="el-icon-download">导出</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 评估概览统计 -->
      <div class="statistics-container">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-number">{{ totalSuppliers }}</div>
                <div class="stat-label">评估供应商总数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card good">
              <div class="stat-content">
                <div class="stat-number">{{ aLevelSuppliers }}</div>
                <div class="stat-label">A级供应商</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card warning">
              <div class="stat-content">
                <div class="stat-number">{{ bLevelSuppliers }}</div>
                <div class="stat-label">B级供应商</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card danger">
              <div class="stat-content">
                <div class="stat-number">{{ cLevelSuppliers + dLevelSuppliers }}</div>
                <div class="stat-label">需优化供应商</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 操作按钮区域 -->
      <div class="action-buttons">
        <el-button type="primary" @click="startNewEvaluation" icon="el-icon-circle-plus-outline">发起新评估</el-button>
        <el-button type="danger" @click="batchDeleteEvaluations" icon="el-icon-delete">批量删除</el-button>
      </div>

      <!-- 评估列表 -->
      <div class="evaluation-table-container">
        <el-table
          v-loading="loading"
          :data="evaluationList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          @row-click="handleRowClick"
          row-key="evaluationId"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="evaluationId" label="评估ID" width="120" />
          <el-table-column prop="supplierName" label="供应商名称" width="180" />
          <el-table-column prop="supplierCode" label="供应商编码" width="120" />
          <el-table-column prop="contactPerson" label="联系人" width="120" />
          <el-table-column prop="contactPhone" label="联系电话" width="150" />
          <el-table-column prop="evaluationPeriodText" label="评估周期" width="180" />
          <el-table-column prop="evaluationDate" label="评估日期" width="150" />
          <el-table-column prop="overallScore" label="总得分" width="100">
            <template slot-scope="scope">
              <span>{{ scope.row.overallScore.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="evaluationLevel" label="评估等级" width="100">
            <template slot-scope="scope">
              <el-tag :type="getLevelTagType(scope.row.evaluationLevel)">
                {{ scope.row.evaluationLevel }}级
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="evaluator" label="评估人" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">
                {{ scope.row.status === 'COMPLETED' ? '已完成' : '进行中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template slot-scope="scope">
              <el-button type="primary" size="mini" @click="viewEvaluationDetail(scope.row)">查看详情</el-button>
              <el-button type="warning" size="mini" @click="editEvaluation(scope.row)" v-if="scope.row.status === 'IN_PROGRESS'">编辑</el-button>
              <el-button type="danger" size="mini" @click="deleteEvaluation(scope.row)" v-if="scope.row.status === 'COMPLETED'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper, sizes, total"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          :current-page.sync="pagination.currentPage"
          :page-size.sync="pagination.pageSize"
          @current-change="handleCurrentChange"
          @size-change="handleSizeChange"
        />
      </div>

      <!-- 供应商评分分布图 -->
      <div class="chart-container">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>供应商评分分布</span>
          </div>
          <div id="scoreDistributionChart" style="width: 100%; height: 400px;"></div>
        </el-card>
      </div>

      <!-- 详情弹窗 -->
      <el-dialog
        title="供应商评估详情"
        :visible.sync="detailVisible"
        width="80%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <div class="evaluation-detail">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息">
              <div class="info-section">
                <h3>评估基本信息</h3>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="评估ID">{{ selectedEvaluation.evaluationId }}</el-descriptions-item>
                  <el-descriptions-item label="评估周期">{{ selectedEvaluation.evaluationPeriodText }}</el-descriptions-item>
                  <el-descriptions-item label="评估日期">{{ selectedEvaluation.evaluationDate }}</el-descriptions-item>
                  <el-descriptions-item label="评估人">{{ selectedEvaluation.evaluator }}</el-descriptions-item>
                </el-descriptions>
              </div>
              <div class="info-section">
                <h3>供应商信息</h3>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="供应商名称">{{ selectedEvaluation.supplierName }}</el-descriptions-item>
                  <el-descriptions-item label="供应商编码">{{ selectedEvaluation.supplierCode }}</el-descriptions-item>
                  <el-descriptions-item label="联系人">{{ selectedEvaluation.contactPerson }}</el-descriptions-item>
                  <el-descriptions-item label="联系电话">{{ selectedEvaluation.contactPhone }}</el-descriptions-item>
                  <el-descriptions-item label="邮箱">{{ selectedEvaluation.email }}</el-descriptions-item>
                  <el-descriptions-item label="地址">{{ selectedEvaluation.address }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </el-tab-pane>
            <el-tab-pane label="评分明细">
              <div class="score-details">
                <el-table :data="selectedEvaluation.scoreDetails" style="width: 100%">
                  <el-table-column prop="category" label="评分类别" width="150" />
                  <el-table-column prop="score" label="得分" width="100" />
                  <el-table-column prop="weight" label="权重" width="100">
                    <template slot-scope="scope">{{ scope.row.weight }}%</template>
                  </el-table-column>
                  <el-table-column prop="weightedScore" label="加权得分" width="120">
                    <template slot-scope="scope">{{ scope.row.weightedScore.toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column prop="comments" label="备注" />
                </el-table>
                <div class="total-score">
                  <div class="total-score-label">总体得分：</div>
                  <div class="total-score-value">{{ selectedEvaluation.overallScore.toFixed(2) }}</div>
                  <div class="total-score-level">等级：<el-tag :type="getLevelTagType(selectedEvaluation.evaluationLevel)">{{ selectedEvaluation.evaluationLevel }}级</el-tag></div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="评估结论">
              <div class="conclusion-section">
                <el-form :model="conclusionForm" label-width="100px">
                  <el-form-item label="评估结论">
                    <el-input type="textarea" :rows="6" v-model="conclusionForm.conclusion" disabled />
                  </el-form-item>
                  <el-form-item label="改善建议">
                    <el-input type="textarea" :rows="4" v-model="conclusionForm.suggestions" disabled />
                  </el-form-item>
                  <el-form-item label="后续计划">
                    <el-input type="textarea" :rows="4" v-model="conclusionForm.followUpPlan" disabled />
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <div slot="footer" class="dialog-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
        </div>
      </el-dialog>

      <!-- 发起评估弹窗 -->
      <el-dialog
        title="发起新评估"
        :visible.sync="createVisible"
        width="70%"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-form :model="evaluationForm" :rules="rules" ref="evaluationForm">
          <div class="form-section">
            <h3>评估基本信息</h3>
            <el-form-item label="评估周期" prop="evaluationPeriod">
              <el-date-picker
                v-model="evaluationForm.evaluationPeriod"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="评估人" prop="evaluator">
              <el-input v-model="evaluationForm.evaluator" disabled />
            </el-form-item>
          </div>
          <div class="form-section">
            <h3>选择供应商</h3>
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="evaluationForm.supplierId" placeholder="请选择供应商" filterable>
                <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id" />
              </el-select>
            </el-form-item>
          </div>
          <div class="form-section">
            <h3>评分项设置</h3>
            <div class="score-items">
              <el-table :data="evaluationForm.scoreItems" style="width: 100%">
                <el-table-column prop="category" label="评分类别" />
                <el-table-column prop="weight" label="权重" width="100">
                  <template slot-scope="scope">
                    <el-input-number v-model="evaluationForm.scoreItems[scope.$index].weight" :min="0" :max="100" :step="5" size="small" />
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="说明" />
              </el-table>
            </div>
          </div>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="createVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEvaluationForm">确定</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'SupplierEvaluation',
  data() {
    return {
      loading: false,
      searchForm: {
        supplierName: '',
        evaluationPeriod: null,
        evaluationLevel: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 10
      },
      total: 0,
      evaluationList: [],
      selectedRows: [],
      detailVisible: false,
      createVisible: false,
      activeTab: '0',
      selectedEvaluation: {},
      evaluationForm: {
        evaluationPeriod: null,
        evaluator: '当前登录用户',
        supplierId: '',
        scoreItems: [
          { category: '产品质量', weight: 30, description: '产品质量稳定性、合格率等' },
          { category: '交付能力', weight: 25, description: '交付及时性、准确性等' },
          { category: '价格合理性', weight: 20, description: '价格竞争力、成本效益等' },
          { category: '服务水平', weight: 15, description: '售前售后服务、响应速度等' },
          { category: '合规性', weight: 10, description: '资质认证、合同执行等' }
        ]
      },
      conclusionForm: {
        conclusion: '',
        suggestions: '',
        followUpPlan: ''
      },
      suppliers: [],
      rules: {
        evaluationPeriod: [{ required: true, message: '请选择评估周期', trigger: 'change' }],
        supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }]
      },
      // 统计数据
      totalSuppliers: 0,
      aLevelSuppliers: 0,
      bLevelSuppliers: 0,
      cLevelSuppliers: 0,
      dLevelSuppliers: 0,
      scoreDistributionChart: null
    };
  },
  computed: {
    // 计算属性可以在这里定义
  },
  mounted() {
    this.loadData();
    this.initChart();
    this.loadSuppliers();
  },
  beforeDestroy() {
    if (this.scoreDistributionChart) {
      this.scoreDistributionChart.dispose();
    }
  },
  methods: {
    // 加载数据
    loadData() {
      this.loading = true;
      // 模拟API请求
      setTimeout(() => {
        this.evaluationList = this.generateMockData();
        this.total = this.evaluationList.length;
        this.calculateStatistics();
        this.updateChart();
        this.loading = false;
      }, 500);
    },
    
    // 加载供应商列表
    loadSuppliers() {
      // 模拟供应商数据
      this.suppliers = [
        { id: '1', name: '供应商A' },
        { id: '2', name: '供应商B' },
        { id: '3', name: '供应商C' },
        { id: '4', name: '供应商D' },
        { id: '5', name: '供应商E' }
      ];
    },
    
    // 生成模拟数据
    generateMockData() {
      const mockData = [];
      const levels = ['A', 'B', 'C', 'D'];
      const statuses = ['COMPLETED', 'IN_PROGRESS'];
      
      for (let i = 1; i <= 50; i++) {
        const score = Math.random() * 50 + 50; // 50-100分
        let level = 'D';
        if (score >= 90) level = 'A';
        else if (score >= 75) level = 'B';
        else if (score >= 60) level = 'C';
        
        const startDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 30);
        
        const evaluationDate = new Date(startDate);
        evaluationDate.setDate(endDate.getDate() + Math.floor(Math.random() * 5) + 1);
        
        mockData.push({
          evaluationId: 'EVAL' + String(i).padStart(5, '0'),
          supplierName: '供应商' + ['A', 'B', 'C', 'D', 'E'][i % 5],
          supplierCode: 'SUPP' + String(i).padStart(4, '0'),
          contactPerson: '联系人' + i,
          contactPhone: '1380013800' + (i % 10),
          email: 'contact' + i + '@example.com',
          address: '测试地址' + i,
          evaluationPeriodText: this.formatDate(startDate) + ' 至 ' + this.formatDate(endDate),
          evaluationDate: this.formatDate(evaluationDate),
          overallScore: score,
          evaluationLevel: level,
          evaluator: '管理员' + (i % 3 + 1),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          scoreDetails: [
            { category: '产品质量', score: Math.random() * 30 + 70, weight: 30, weightedScore: (Math.random() * 30 + 70) * 0.3, comments: '质量稳定，符合要求' },
            { category: '交付能力', score: Math.random() * 25 + 75, weight: 25, weightedScore: (Math.random() * 25 + 75) * 0.25, comments: '交付及时，偶尔有延误' },
            { category: '价格合理性', score: Math.random() * 20 + 80, weight: 20, weightedScore: (Math.random() * 20 + 80) * 0.2, comments: '价格具有竞争力' },
            { category: '服务水平', score: Math.random() * 15 + 85, weight: 15, weightedScore: (Math.random() * 15 + 85) * 0.15, comments: '服务响应及时' },
            { category: '合规性', score: Math.random() * 10 + 90, weight: 10, weightedScore: (Math.random() * 10 + 90) * 0.1, comments: '资质齐全，合规运营' }
          ],
          conclusion: '该供应商整体表现' + (level === 'A' ? '优秀' : level === 'B' ? '良好' : '一般') + '，建议' + (level === 'A' || level === 'B' ? '继续合作' : '改进后继续观察')。',
          suggestions: '建议' + (level === 'A' || level === 'B' ? '在保持现有服务水平的基础上，进一步优化成本' : '重点改进产品质量和交付及时性') + '。',
          followUpPlan: '下一季度将再次评估，重点关注' + (level === 'A' || level === 'B' ? '创新能力和成本优化' : '质量稳定性和交付准确性') + '。'
        });
      }
      
      return mockData;
    },
    
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    
    // 计算统计数据
    calculateStatistics() {
      const completedEvaluations = this.evaluationList.filter(item => item.status === 'COMPLETED');
      this.totalSuppliers = completedEvaluations.length;
      this.aLevelSuppliers = completedEvaluations.filter(item => item.evaluationLevel === 'A').length;
      this.bLevelSuppliers = completedEvaluations.filter(item => item.evaluationLevel === 'B').length;
      this.cLevelSuppliers = completedEvaluations.filter(item => item.evaluationLevel === 'C').length;
      this.dLevelSuppliers = completedEvaluations.filter(item => item.evaluationLevel === 'D').length;
    },
    
    // 搜索
    handleSearch() {
      this.pagination.currentPage = 1;
      this.loadData();
    },
    
    // 重置
    resetForm() {
      this.searchForm = {
        supplierName: '',
        evaluationPeriod: null,
        evaluationLevel: ''
      };
      this.pagination.currentPage = 1;
      this.loadData();
    },
    
    // 分页变化
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.loadData();
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.currentPage = 1;
      this.loadData();
    },
    
    // 选择变化
    handleSelectionChange(val) {
      this.selectedRows = val;
    },
    
    // 行点击
    handleRowClick(row) {
      // 可以在这里实现行点击逻辑
    },
    
    // 获取等级标签类型
    getLevelTagType(level) {
      const tagTypes = {
        'A': 'success',
        'B': 'warning',
        'C': 'info',
        'D': 'danger'
      };
      return tagTypes[level] || 'default';
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      return status === 'COMPLETED' ? 'success' : 'info';
    },
    
    // 查看详情
    viewEvaluationDetail(row) {
      this.selectedEvaluation = { ...row };
      this.conclusionForm = {
        conclusion: row.conclusion || '',
        suggestions: row.suggestions || '',
        followUpPlan: row.followUpPlan || ''
      };
      this.detailVisible = true;
    },
    
    // 编辑评估
    editEvaluation(row) {
      this.$message.warning('编辑功能开发中');
    },
    
    // 删除评估
    deleteEvaluation(row) {
      this.$confirm('确定要删除这条评估记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        setTimeout(() => {
          this.$message.success('删除成功');
          this.loadData();
        }, 300);
      }).catch(() => {
        // 取消删除
      });
    },
    
    // 批量删除
    batchDeleteEvaluations() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('请选择要删除的评估记录');
        return;
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedRows.length} 条评估记录吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量删除操作
        setTimeout(() => {
          this.$message.success('批量删除成功');
          this.loadData();
          this.selectedRows = [];
        }, 300);
      }).catch(() => {
        // 取消删除
      });
    },
    
    // 发起新评估
    startNewEvaluation() {
      this.evaluationForm = {
        evaluationPeriod: null,
        evaluator: '当前登录用户',
        supplierId: '',
        scoreItems: [
          { category: '产品质量', weight: 30, description: '产品质量稳定性、合格率等' },
          { category: '交付能力', weight: 25, description: '交付及时性、准确性等' },
          { category: '价格合理性', weight: 20, description: '价格竞争力、成本效益等' },
          { category: '服务水平', weight: 15, description: '售前售后服务、响应速度等' },
          { category: '合规性', weight: 10, description: '资质认证、合同执行等' }
        ]
      };
      this.createVisible = true;
    },
    
    // 提交评估表单
    submitEvaluationForm() {
      this.$refs.evaluationForm.validate((valid) => {
        if (valid) {
          // 验证权重总和是否为100
          const totalWeight = this.evaluationForm.scoreItems.reduce((sum, item) => sum + item.weight, 0);
          if (totalWeight !== 100) {
            this.$message.error('评分权重总和必须为100%');
            return;
          }
          
          // 模拟提交
          setTimeout(() => {
            this.createVisible = false;
            this.$message.success('评估已发起');
            this.loadData();
          }, 500);
        } else {
          return false;
        }
      });
    },
    
    // 导出数据
    exportData() {
      this.$message.success('数据导出成功');
    },
    
    // 初始化图表
    initChart() {
      this.scoreDistributionChart = echarts.init(document.getElementById('scoreDistributionChart'));
      this.updateChart();
    },
    
    // 更新图表
    updateChart() {
      if (!this.scoreDistributionChart) return;
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['A级 (90-100)', 'B级 (75-89)', 'C级 (60-74)', 'D级 (<60)']
        },
        yAxis: {
          type: 'value',
          name: '供应商数量'
        },
        series: [
          {
            name: '供应商数量',
            type: 'bar',
            data: [
              { value: this.aLevelSuppliers, itemStyle: { color: '#67C23A' } },
              { value: this.bLevelSuppliers, itemStyle: { color: '#E6A23C' } },
              { value: this.cLevelSuppliers, itemStyle: { color: '#909399' } },
              { value: this.dLevelSuppliers, itemStyle: { color: '#F56C6C' } }
            ],
            barWidth: '60%',
            label: {
              show: true,
              position: 'top'
            }
          }
        ]
      };
      
      this.scoreDistributionChart.setOption(option);
    }
  }
};
</script>

<style scoped>
.supplier-evaluation-container {
  padding: 20px;
  background-color: #f5f7fa;
}

.page-card {
  margin-bottom: 20px;
}

.card-header .title {
  font-size: 18px;
  font-weight: bold;
}

.search-filters {
  margin-bottom: 20px;
}

.search-form {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.statistics-container {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-card.good {
  border-left: 4px solid #67C23A;
}

.stat-card.warning {
  border-left: 4px solid #E6A23C;
}

.stat-card.danger {
  border-left: 4px solid #F56C6C;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.action-buttons {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.evaluation-table-container {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.chart-container {
  margin-top: 30px;
}

.chart-card {
  background-color: #fff;
}

.chart-header .title {
  font-size: 16px;
  font-weight: bold;
}

/* 详情弹窗样式 */
.evaluation-detail {
  max-height: 600px;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;
}

.info-section h3 {
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.score-details {
  margin-top: 20px;
}

.total-score {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.total-score-label {
  font-size: 16px;
  font-weight: bold;
}

.total-score-value {
  font-size: 32px;
  font-weight: bold;
  color: #409EFF;
}

.total-score-level {
  font-size: 16px;
}

.conclusion-section {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

/* 表单样式 */
.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #303133;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.score-items {
  margin-top: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .supplier-evaluation-container {
    padding: 10px;
  }
  
  .search-form {
    padding: 10px;
  }
  
  .evaluation-table-container {
    padding: 10px;
    overflow-x: auto;
  }
  
  .stat-card {
    margin-bottom: 10px;
  }
}
</style>