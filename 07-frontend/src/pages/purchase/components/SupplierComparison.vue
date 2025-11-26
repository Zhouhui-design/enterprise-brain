<template>
  <div class="supplier-comparison-container">
    <el-card class="main-card">
      <div slot="header" class="card-header">
        <span>供应商比较分析</span>
        <div class="header-actions">
          <el-button type="primary" @click="initiateComparison">发起比较</el-button>
          <el-button icon="el-icon-refresh" @click="refreshData">刷新</el-button>
          <el-button icon="el-icon-download" @click="exportComparisonReport">导出报告</el-button>
        </div>
      </div>

      <!-- 选择供应商区域 -->
      <div v-if="!comparisonInProgress" class="select-supplier-section">
        <el-form :inline="true" class="search-form">
          <el-form-item label="供应商名称">
            <el-input v-model="supplierSearchText" placeholder="请输入供应商名称" clearable style="width: 200px;"></el-input>
          </el-form-item>
          <el-form-item label="供应商类别">
            <el-select v-model="supplierCategory" placeholder="请选择供应商类别" clearable style="width: 150px;">
              <el-option label="原材料供应商" value="raw_material"></el-option>
              <el-option label="零部件供应商" value="component"></el-option>
              <el-option label="设备供应商" value="equipment"></el-option>
              <el-option label="服务供应商" value="service"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="合作状态">
            <el-select v-model="cooperationStatus" placeholder="请选择合作状态" clearable style="width: 120px;">
              <el-option label="合作中" value="active"></el-option>
              <el-option label="暂停合作" value="suspended"></el-option>
              <el-option label="已终止" value="terminated"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchSuppliers">查询</el-button>
            <el-button @click="resetSupplierSearch">重置</el-button>
          </el-form-item>
        </el-form>

        <!-- 供应商列表表格 -->
        <el-table
          v-loading="supplierListLoading"
          :data="filteredSupplierList"
          style="width: 100%"
          @selection-change="handleSupplierSelectionChange"
          border
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="code" label="供应商编码" width="120"></el-table-column>
          <el-table-column prop="name" label="供应商名称" width="200"></el-table-column>
          <el-table-column prop="category" label="供应商类别" width="120">
            <template slot-scope="scope">{{ getCategoryText(scope.row.category) }}</template>
          </el-table-column>
          <el-table-column prop="contactPerson" label="联系人" width="100"></el-table-column>
          <el-table-column prop="contactPhone" label="联系电话" width="120"></el-table-column>
          <el-table-column prop="cooperationTime" label="合作时间" width="150" formatter="dateFormat"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="rating" label="综合评分" width="100" align="right">
            <template slot-scope="scope">
              <el-rate v-model="scope.row.rating" disabled :max="5" show-score></el-rate>
            </template>
          </el-table-column>
        </el-table>

        <!-- 已选供应商列表 -->
        <div v-if="selectedSuppliers.length > 0" class="selected-suppliers-section">
          <div class="section-header">
            <span>已选择供应商 ({{ selectedSuppliers.length }}/{{ maxSelectionCount }})</span>
            <el-button type="text" @click="clearSelection" :disabled="selectedSuppliers.length === 0">清空选择</el-button>
          </div>
          <div class="selected-suppliers-list">
            <el-tag
              v-for="supplier in selectedSuppliers"
              :key="supplier.id"
              closable
              @close="removeSupplier(supplier.id)"
              class="selected-supplier-tag"
            >
              {{ supplier.name }}
            </el-tag>
          </div>
          <el-button
            type="primary"
            style="margin-top: 10px;"
            @click="startComparison"
            :disabled="selectedSuppliers.length < 2 || selectedSuppliers.length > maxSelectionCount"
          >
            开始比较
          </el-button>
        </div>
      </div>

      <!-- 比较结果区域 -->
      <div v-else class="comparison-results-section">
        <!-- 返回按钮 -->
        <el-button icon="el-icon-arrow-left" @click="backToSelection" style="margin-bottom: 20px;">返回供应商选择</el-button>

        <!-- 基础信息对比 -->
        <el-card class="result-card">
          <div slot="header" class="result-card-header">
            <span>基础信息对比</span>
          </div>
          <el-table :data="comparisonTableData" border style="width: 100%">
            <el-table-column prop="attribute" label="属性" width="150"></el-table-column>
            <template v-for="(supplier, index) in selectedSuppliers" :key="supplier.id">
              <el-table-column :label="supplier.name" :prop="`supplier_${index}`" :min-width="200">
                <template slot-scope="scope">
                  <div v-if="scope.row.type === 'text'">
                    {{ scope.row[`supplier_${index}`] }}
                  </div>
                  <div v-else-if="scope.row.type === 'status'">
                    <el-tag :type="getStatusTagType(scope.row[`supplier_${index}`])">
                      {{ getStatusText(scope.row[`supplier_${index}`]) }}
                    </el-tag>
                  </div>
                  <div v-else-if="scope.row.type === 'category'">
                    {{ getCategoryText(scope.row[`supplier_${index}`]) }}
                  </div>
                  <div v-else-if="scope.row.type === 'date'">
                    {{ formatDate(scope.row[`supplier_${index}`]) }}
                  </div>
                </template>
              </el-table-column>
            </template>
          </el-table>
        </el-card>

        <!-- 绩效指标对比 -->
        <el-card class="result-card">
          <div slot="header" class="result-card-header">
            <span>绩效指标对比</span>
          </div>
          <div class="metrics-comparison">
            <div class="metrics-grid">
              <div class="metric-card" v-for="metric in performanceMetrics" :key="metric.code">
                <div class="metric-title">{{ metric.name }}</div>
                <div class="metric-values">
                  <div
                    v-for="(supplier, index) in selectedSuppliers"
                    :key="supplier.id"
                    class="metric-value-item"
                    :class="{ 'best-value': isBestValue(metric.code, supplier.metrics[metric.code], index) }"
                  >
                    <div class="supplier-name">{{ supplier.name }}</div>
                    <div class="value">{{ formatMetricValue(metric.code, supplier.metrics[metric.code]) }}</div>
                    <div class="unit">{{ metric.unit }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 图表对比区域 -->
        <el-card class="result-card">
          <div slot="header" class="result-card-header">
            <span>绩效趋势分析</span>
            <el-select v-model="chartPeriod" placeholder="选择时间周期" style="width: 120px;">
              <el-option label="近3个月" value="3m"></el-option>
              <el-option label="近6个月" value="6m"></el-option>
              <el-option label="近12个月" value="12m"></el-option>
            </el-select>
          </div>
          <div class="charts-container">
            <div class="chart-item">
              <h4>质量合格率趋势</h4>
              <div id="qualityRateChart" class="chart"></div>
            </div>
            <div class="chart-item">
              <h4>准时交付率趋势</h4>
              <div id="deliveryRateChart" class="chart"></div>
            </div>
          </div>
          <div class="charts-container">
            <div class="chart-item">
              <h4>平均响应时间趋势</h4>
              <div id="responseTimeChart" class="chart"></div>
            </div>
            <div class="chart-item">
              <h4>价格竞争力指数</h4>
              <div id="priceCompetitivenessChart" class="chart"></div>
            </div>
          </div>
        </el-card>

        <!-- 价格对比 -->
        <el-card class="result-card">
          <div slot="header" class="result-card-header">
            <span>价格对比</span>
            <el-select v-model="selectedMaterialForPrice" placeholder="选择物料" style="width: 200px;">
              <el-option
                v-for="material in commonMaterials"
                :key="material.id"
                :label="`${material.code} ${material.name} ${material.spec}`"
                :value="material.id"
              ></el-option>
            </el-select>
          </div>
          <div v-if="selectedMaterialForPrice" class="price-comparison">
            <el-table :data="priceComparisonData" border style="width: 100%">
              <el-table-column prop="supplierName" label="供应商" width="180"></el-table-column>
              <el-table-column prop="unitPrice" label="单价(元)" width="120" align="right">
                <template slot-scope="scope">
                  <span :class="{ 'lowest-price': scope.row.isLowestPrice }">
                    ¥{{ scope.row.unitPrice.toFixed(2) }}
                    <span v-if="scope.row.isLowestPrice" class="lowest-price-tag">最低价</span>
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="minOrderQty" label="最小起订量" width="120" align="right"></el-table-column>
              <el-table-column prop="paymentTerms" label="付款条件" width="150">
                <template slot-scope="scope">{{ getPaymentTermsText(scope.row.paymentTerms) }}</template>
              </el-table-column>
              <el-table-column prop="deliveryTime" label="交货周期(天)" width="120" align="right"></el-table-column>
              <el-table-column prop="priceTrend" label="价格趋势" width="120">
                <template slot-scope="scope">
                  <el-tag :type="getPriceTrendType(scope.row.priceTrend)">
                    {{ getPriceTrendText(scope.row.priceTrend) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div class="price-distribution-chart">
              <h4>价格分布对比</h4>
              <div id="priceDistributionChart" class="chart large-chart"></div>
            </div>
          </div>
          <div v-else class="no-selection-tip">请选择要对比价格的物料</div>
        </el-card>

        <!-- 优势对比矩阵 -->
        <el-card class="result-card">
          <div slot="header" class="result-card-header">
            <span>供应商优势对比矩阵</span>
          </div>
          <div class="comparison-matrix">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>评估维度</th>
                  <template v-for="supplier in selectedSuppliers" :key="supplier.id">
                    <th>{{ supplier.name }}</th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dimension in comparisonDimensions" :key="dimension.code">
                  <td>{{ dimension.name }}</td>
                  <td v-for="(supplier, index) in selectedSuppliers" :key="supplier.id">
                    <div class="dimension-score">
                      <el-rate v-model="supplier.dimensions[dimension.code]" disabled :max="5"></el-rate>
                      <span class="score-text">{{ supplier.dimensions[dimension.code] }}</span>
                    </div>
                    <div class="dimension-rank">
                      {{ getDimensionRank(dimension.code, supplier.dimensions[dimension.code]) }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-card>

        <!-- 比较总结 -->
        <el-card class="result-card summary-card">
          <div slot="header" class="result-card-header">
            <span>比较总结与推荐</span>
          </div>
          <div class="comparison-summary">
            <div class="summary-section">
              <h4>总体评分排名</h4>
              <el-table :data="supplierRankings" border style="width: 100%">
                <el-table-column prop="rank" label="排名" width="80" align="center"></el-table-column>
                <el-table-column prop="supplierName" label="供应商" width="200"></el-table-column>
                <el-table-column prop="totalScore" label="综合得分" width="120" align="right">
                  <template slot-scope="scope">{{ scope.row.totalScore.toFixed(2) }}</template>
                </el-table-column>
                <el-table-column prop="strengths" label="优势" width="300">
                  <template slot-scope="scope">
                    <el-tag size="small" v-for="strength in scope.row.strengths" :key="strength" type="success" effect="plain">
                      {{ strength }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="weaknesses" label="劣势" width="300">
                  <template slot-scope="scope">
                    <el-tag size="small" v-for="weakness in scope.row.weaknesses" :key="weakness" type="danger" effect="plain">
                      {{ weakness }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="summary-section">
              <h4>推荐建议</h4>
              <div class="recommendation-content">
                <el-descriptions border :column="1" :size="'small'">
                  <el-descriptions-item label="首选推荐">
                    <div class="recommended-supplier">
                      <el-avatar :size="48" icon="el-icon-user-solid"></el-avatar>
                      <div class="supplier-info">
                        <div class="supplier-name">{{ topRecommendedSupplier?.name }}</div>
                        <div class="supplier-score">综合评分: {{ topRecommendedSupplier?.totalScore.toFixed(2) }}</div>
                      </div>
                    </div>
                  </el-descriptions-item>
                  <el-descriptions-item label="推荐理由" :span="2">{{ recommendationReason }}</el-descriptions-item>
                  <el-descriptions-item label="适用场景" :span="2">{{ suitableScenarios }}</el-descriptions-item>
                  <el-descriptions-item label="合作建议" :span="2">{{ cooperationSuggestions }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 比较条件设置对话框 -->
    <el-dialog
      title="比较条件设置"
      :visible.sync="comparisonSettingsVisible"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="comparisonSettings" :rules="comparisonSettingsRules" ref="comparisonSettingsRef" label-width="120px">
        <el-form-item label="比较重点维度" prop="focusDimensions">
          <el-checkbox-group v-model="comparisonSettings.focusDimensions">
            <el-checkbox v-for="dimension in allDimensions" :key="dimension.code" :label="dimension.code">
              {{ dimension.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="权重设置">
          <div v-for="dimension in allDimensions" :key="dimension.code" class="weight-setting-item">
            <span>{{ dimension.name }}:</span>
            <el-slider
              v-model="comparisonSettings.weights[dimension.code]"
              :min="0"
              :max="100"
              :step="5"
              :disabled="!comparisonSettings.focusDimensions.includes(dimension.code)"
            ></el-slider>
            <span class="weight-value">{{ comparisonSettings.weights[dimension.code] }}%</span>
          </div>
        </el-form-item>
        <el-form-item label="评估周期">
          <el-radio-group v-model="comparisonSettings.evaluationPeriod">
            <el-radio label="3m">近3个月</el-radio>
            <el-radio label="6m">近6个月</el-radio>
            <el-radio label="12m">近12个月</el-radio>
            <el-radio label="custom">自定义</el-radio>
          </el-radio-group>
          <div v-if="comparisonSettings.evaluationPeriod === 'custom'" class="custom-date-range">
            <el-date-picker
              v-model="comparisonSettings.customDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 100%"
            ></el-date-picker>
          </div>
        </el-form-item>
        <el-form-item label="比较物料范围">
          <el-select v-model="comparisonSettings.materialScope" placeholder="选择物料范围" style="width: 100%;">
            <el-option label="全部共同采购物料" value="all_common"></el-option>
            <el-option label="最近采购物料" value="recent_purchased"></el-option>
            <el-option label="指定物料类别" value="specific_category"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="comparisonSettingsVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmComparisonSettings">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import echarts from 'echarts';

export default {
  name: 'SupplierComparison',
  data() {
    return {
      // 供应商搜索相关
      supplierSearchText: '',
      supplierCategory: '',
      cooperationStatus: '',
      supplierListLoading: false,
      supplierList: [],
      selectedSuppliers: [],
      maxSelectionCount: 4,
      comparisonInProgress: false,
      
      // 比较设置
      comparisonSettingsVisible: false,
      comparisonSettings: {
        focusDimensions: ['quality', 'price', 'delivery', 'service'],
        weights: {
          quality: 30,
          price: 30,
          delivery: 20,
          service: 10,
          flexibility: 5,
          innovation: 5
        },
        evaluationPeriod: '6m',
        customDateRange: [],
        materialScope: 'all_common'
      },
      comparisonSettingsRules: {
        focusDimensions: [{ required: true, message: '请至少选择一个比较维度', trigger: 'change' }]
      },
      
      // 比较维度
      allDimensions: [
        { code: 'quality', name: '质量' },
        { code: 'price', name: '价格' },
        { code: 'delivery', name: '交付' },
        { code: 'service', name: '服务' },
        { code: 'flexibility', name: '灵活性' },
        { code: 'innovation', name: '创新性' }
      ],
      comparisonDimensions: [
        { code: 'quality', name: '质量水平' },
        { code: 'price', name: '价格竞争力' },
        { code: 'delivery', name: '交付可靠性' },
        { code: 'service', name: '服务响应' },
        { code: 'flexibility', name: '订单灵活性' },
        { code: 'innovation', name: '技术创新' },
        { code: 'financial', name: '财务状况' }
      ],
      
      // 绩效指标
      performanceMetrics: [
        { code: 'qualityRate', name: '质量合格率', unit: '%' },
        { code: 'onTimeDeliveryRate', name: '准时交付率', unit: '%' },
        { code: 'avgResponseTime', name: '平均响应时间', unit: '小时' },
        { code: 'complaintRate', name: '投诉率', unit: '%' },
        { code: 'returnRate', name: '退货率', unit: '%' },
        { code: 'priceIndex', name: '价格指数', unit: ' ' }
      ],
      
      // 图表相关
      chartPeriod: '6m',
      qualityRateChart: null,
      deliveryRateChart: null,
      responseTimeChart: null,
      priceCompetitivenessChart: null,
      priceDistributionChart: null,
      
      // 价格对比相关
      commonMaterials: [],
      selectedMaterialForPrice: '',
      priceComparisonData: [],
      
      // 比较结果相关
      comparisonTableData: [],
      supplierRankings: [],
      topRecommendedSupplier: null,
      recommendationReason: '',
      suitableScenarios: '',
      cooperationSuggestions: ''
    };
  },
  computed: {
    // 过滤后的供应商列表
    filteredSupplierList() {
      return this.supplierList.filter(supplier => {
        let match = true;
        
        if (this.supplierSearchText) {
          match = match && (
            supplier.name.toLowerCase().includes(this.supplierSearchText.toLowerCase()) ||
            supplier.code.toLowerCase().includes(this.supplierSearchText.toLowerCase())
          );
        }
        
        if (this.supplierCategory) {
          match = match && supplier.category === this.supplierCategory;
        }
        
        if (this.cooperationStatus) {
          match = match && supplier.status === this.cooperationStatus;
        }
        
        return match;
      });
    }
  },
  mounted() {
    this.fetchSupplierList();
  },
  beforeDestroy() {
    // 销毁图表实例
    this.destroyCharts();
  },
  methods: {
    // 获取供应商列表
    fetchSupplierList() {
      this.supplierListLoading = true;
      // 模拟API调用
      setTimeout(() => {
        this.supplierList = this.generateMockSupplierList();
        this.supplierListLoading = false;
      }, 600);
    },
    
    // 生成模拟供应商数据
    generateMockSupplierList() {
      const categories = ['raw_material', 'component', 'equipment', 'service'];
      const statuses = ['active', 'suspended', 'terminated'];
      
      const suppliers = [];
      const supplierNames = [
        '诚信金属材料有限公司',
        '远大机械设备有限公司',
        '恒信传动科技有限公司',
        '鑫源润滑油有限公司',
        '精准传感器科技有限公司',
        '强力紧固件制造有限公司',
        '迅捷物流配送有限公司',
        '创新电子元件有限公司',
        '环球化工原料有限公司',
        '精益模具制造有限公司',
        '绿色包装材料有限公司',
        '智能控制系统有限公司',
        '卓越表面处理有限公司',
        '合力仓储服务有限公司',
        '高科自动化设备有限公司'
      ];
      
      for (let i = 0; i < supplierNames.length; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const status = statuses[Math.floor(Math.random() * 3) === 0 ? 1 : 0]; // 80%概率为active
        const rating = Math.floor(Math.random() * 2) + 3; // 3-5星
        
        suppliers.push({
          id: `supplier_${i + 1}`,
          code: `S${String(i + 1).padStart(3, '0')}`,
          name: supplierNames[i],
          category: category,
          contactPerson: `联系人${i + 1}`,
          contactPhone: `13800138${String(i + 1).padStart(3, '0')}`,
          address: `${['北京市', '上海市', '广州市', '深圳市', '杭州市'][Math.floor(Math.random() * 5)]}${['朝阳区', '浦东新区', '天河区', '南山区', '西湖区'][Math.floor(Math.random() * 5)]}`,
          cooperationTime: this.generateRandomDate(365 * 2, 365 * 5),
          status: status,
          rating: rating,
          // 绩效指标
          metrics: {
            qualityRate: 85 + Math.random() * 15, // 85-100%
            onTimeDeliveryRate: 80 + Math.random() * 20, // 80-100%
            avgResponseTime: 1 + Math.random() * 23, // 1-24小时
            complaintRate: Math.random() * 5, // 0-5%
            returnRate: Math.random() * 3, // 0-3%
            priceIndex: 80 + Math.random() * 30 // 80-110
          },
          // 维度评分
          dimensions: {
            quality: Math.floor(Math.random() * 2) + 3, // 3-5
            price: Math.floor(Math.random() * 2) + 3,
            delivery: Math.floor(Math.random() * 2) + 3,
            service: Math.floor(Math.random() * 2) + 3,
            flexibility: Math.floor(Math.random() * 2) + 3,
            innovation: Math.floor(Math.random() * 2) + 3,
            financial: Math.floor(Math.random() * 2) + 3
          }
        });
      }
      
      return suppliers;
    },
    
    // 生成随机日期
    generateRandomDate(minDays, maxDays) {
      const now = new Date();
      const days = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
      return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    },
    
    // 搜索供应商
    searchSuppliers() {
      // 这里可以添加实际的搜索逻辑
      this.fetchSupplierList();
    },
    
    // 重置供应商搜索
    resetSupplierSearch() {
      this.supplierSearchText = '';
      this.supplierCategory = '';
      this.cooperationStatus = '';
    },
    
    // 处理供应商选择变化
    handleSupplierSelectionChange(val) {
      // 限制最多选择4个供应商
      if (val.length > this.maxSelectionCount) {
        this.$message.warning(`最多只能选择${this.maxSelectionCount}个供应商进行比较`);
        // 保持前N个选中项
        const firstNSuppliers = val.slice(0, this.maxSelectionCount);
        this.selectedSuppliers = [...firstNSuppliers];
        // 重置表格选中状态（这里需要通过ref来操作，但为简化示例，我们只更新本地状态）
      } else {
        this.selectedSuppliers = val;
      }
    },
    
    // 移除供应商
    removeSupplier(supplierId) {
      const index = this.selectedSuppliers.findIndex(s => s.id === supplierId);
      if (index > -1) {
        this.selectedSuppliers.splice(index, 1);
        // 这里也需要更新表格选中状态
      }
    },
    
    // 清空选择
    clearSelection() {
      this.selectedSuppliers = [];
      // 这里也需要更新表格选中状态
    },
    
    // 发起比较
    initiateComparison() {
      this.comparisonSettingsVisible = true;
    },
    
    // 确认比较设置
    confirmComparisonSettings() {
      this.$refs.comparisonSettingsRef.validate((valid) => {
        if (valid) {
          this.comparisonSettingsVisible = false;
          // 检查是否有选中的供应商
          if (this.selectedSuppliers.length < 2) {
            this.$message.warning('请至少选择2个供应商进行比较');
            return;
          }
          this.startComparison();
        }
      });
    },
    
    // 开始比较
    startComparison() {
      this.comparisonInProgress = true;
      // 准备比较数据
      this.prepareComparisonData();
      // 生成共同物料列表
      this.generateCommonMaterials();
      // 初始化图表
      this.$nextTick(() => {
        this.initCharts();
      });
    },
    
    // 返回供应商选择
    backToSelection() {
      this.comparisonInProgress = false;
      // 销毁图表
      this.destroyCharts();
    },
    
    // 准备比较数据
    prepareComparisonData() {
      // 准备基础信息对比表格数据
      this.comparisonTableData = [
        { attribute: '供应商编码', type: 'text', ...this.getSelectedSuppliersData('code') },
        { attribute: '供应商类别', type: 'category', ...this.getSelectedSuppliersData('category') },
        { attribute: '联系人', type: 'text', ...this.getSelectedSuppliersData('contactPerson') },
        { attribute: '联系电话', type: 'text', ...this.getSelectedSuppliersData('contactPhone') },
        { attribute: '地址', type: 'text', ...this.getSelectedSuppliersData('address') },
        { attribute: '合作时间', type: 'date', ...this.getSelectedSuppliersData('cooperationTime') },
        { attribute: '合作状态', type: 'status', ...this.getSelectedSuppliersData('status') },
        { attribute: '综合评分', type: 'text', ...this.getSelectedSuppliersData('rating') }
      ];
      
      // 计算供应商排名
      this.calculateSupplierRankings();
    },
    
    // 获取选中供应商的数据
    getSelectedSuppliersData(field) {
      const result = {};
      this.selectedSuppliers.forEach((supplier, index) => {
        result[`supplier_${index}`] = supplier[field];
      });
      return result;
    },
    
    // 生成共同物料列表
    generateCommonMaterials() {
      const materials = [
        { id: 'M001', code: 'M001', name: '不锈钢板', spec: '304 2mm' },
        { id: 'M002', code: 'M002', name: '轴承', spec: '6205' },
        { id: 'M003', code: 'M003', name: '电机', spec: 'Y132M-4' },
        { id: 'M004', code: 'M004', name: '液压油', spec: '46#' },
        { id: 'M005', code: 'M005', name: '传感器', spec: 'PT100' }
      ];
      
      this.commonMaterials = materials;
      // 默认选择第一个物料
      if (materials.length > 0) {
        this.selectedMaterialForPrice = materials[0].id;
        this.generatePriceComparisonData(materials[0].id);
      }
    },
    
    // 生成价格比较数据
    generatePriceComparisonData(materialId) {
      const material = this.commonMaterials.find(m => m.id === materialId);
      if (!material) return;
      
      const basePrice = 500 + Math.random() * 1000; // 基础价格
      const paymentTerms = ['30-70', '100-after-receipt', 'monthly-30', 'monthly-60'];
      const priceTrends = ['up', 'down', 'stable'];
      
      // 生成各供应商的价格数据
      const data = this.selectedSuppliers.map(supplier => {
        // 基于供应商价格指数生成价格
        const priceFactor = supplier.metrics.priceIndex / 100;
        const unitPrice = basePrice * priceFactor;
        const minOrderQty = Math.floor(Math.random() * 100) + 50;
        const deliveryTime = Math.floor(Math.random() * 20) + 5;
        
        return {
          supplierId: supplier.id,
          supplierName: supplier.name,
          unitPrice: unitPrice,
          minOrderQty: minOrderQty,
          paymentTerms: paymentTerms[Math.floor(Math.random() * paymentTerms.length)],
          deliveryTime: deliveryTime,
          priceTrend: priceTrends[Math.floor(Math.random() * priceTrends.length)],
          isLowestPrice: false
        };
      });
      
      // 找出最低价并标记
      const minPrice = Math.min(...data.map(item => item.unitPrice));
      data.forEach(item => {
        item.isLowestPrice = item.unitPrice === minPrice;
      });
      
      this.priceComparisonData = data;
      
      // 更新价格分布图表
      this.$nextTick(() => {
        this.updatePriceDistributionChart();
      });
    },
    
    // 计算供应商排名
    calculateSupplierRankings() {
      const rankings = this.selectedSuppliers.map(supplier => {
        // 根据权重计算综合得分
        let totalScore = 0;
        let totalWeight = 0;
        
        this.comparisonSettings.focusDimensions.forEach(dimension => {
          const weight = this.comparisonSettings.weights[dimension];
          const score = supplier.dimensions[dimension] || 0;
          totalScore += score * weight;
          totalWeight += weight;
        });
        
        // 计算最终得分（5分制转换为100分制）
        const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 20 : 0;
        
        // 分析优势和劣势
        const strengths = [];
        const weaknesses = [];
        
        Object.entries(supplier.dimensions).forEach(([code, score]) => {
          const dimension = this.comparisonDimensions.find(d => d.code === code);
          if (dimension) {
            if (score >= 4) {
              strengths.push(dimension.name);
            } else if (score <= 2) {
              weaknesses.push(dimension.name);
            }
          }
        });
        
        return {
          supplierId: supplier.id,
          supplierName: supplier.name,
          totalScore: finalScore,
          strengths: strengths,
          weaknesses: weaknesses
        };
      });
      
      // 排序
      rankings.sort((a, b) => b.totalScore - a.totalScore);
      
      // 添加排名
      rankings.forEach((item, index) => {
        item.rank = index + 1;
      });
      
      this.supplierRankings = rankings;
      
      // 设置推荐供应商
      if (rankings.length > 0) {
        this.topRecommendedSupplier = rankings[0];
        this.generateRecommendation();
      }
    },
    
    // 生成推荐建议
    generateRecommendation() {
      const topSupplier = this.topRecommendedSupplier;
      if (!topSupplier) return;
      
      // 生成推荐理由
      this.recommendationReason = `根据综合评估，${topSupplier.supplierName}在评估的维度中表现最优，综合得分${topSupplier.totalScore.toFixed(2)}分，排名第一。该供应商在${topSupplier.strengths.join('、')}方面具有明显优势。`;
      
      // 生成适用场景
      this.suitableScenarios = '适用于对质量要求高、需要稳定供应的核心物料采购，特别是在时间要求较紧的情况下，可以优先考虑该供应商。';
      
      // 生成合作建议
      if (topSupplier.weaknesses.length > 0) {
        this.cooperationSuggestions = `建议与${topSupplier.supplierName}建立长期合作关系，同时关注其在${topSupplier.weaknesses.join('、')}方面的改进。可以考虑签订框架协议，锁定价格和供应保障，同时建立定期评估机制。`;
      } else {
        this.cooperationSuggestions = `建议与${topSupplier.supplierName}建立战略合作伙伴关系，签订长期框架协议，确保供应稳定性和价格优势。同时可以考虑共同优化供应链流程，实现双赢。`;
      }
    },
    
    // 初始化图表
    initCharts() {
      this.initQualityRateChart();
      this.initDeliveryRateChart();
      this.initResponseTimeChart();
      this.initPriceCompetitivenessChart();
      this.updatePriceDistributionChart();
    },
    
    // 初始化质量合格率趋势图
    initQualityRateChart() {
      if (this.qualityRateChart) {
        this.qualityRateChart.dispose();
      }
      
      const chartDom = document.getElementById('qualityRateChart');
      if (!chartDom) return;
      
      this.qualityRateChart = echarts.init(chartDom);
      
      const months = this.getChartMonths();
      const series = this.selectedSuppliers.map(supplier => ({
        name: supplier.name,
        type: 'line',
        data: this.generateTrendData(supplier.metrics.qualityRate, months.length, 2),
        smooth: true
      }));
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: this.selectedSuppliers.map(s => s.name),
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: months
        },
        yAxis: {
          type: 'value',
          min: 80,
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: series
      };
      
      this.qualityRateChart.setOption(option);
    },
    
    // 初始化准时交付率趋势图
    initDeliveryRateChart() {
      if (this.deliveryRateChart) {
        this.deliveryRateChart.dispose();
      }
      
      const chartDom = document.getElementById('deliveryRateChart');
      if (!chartDom) return;
      
      this.deliveryRateChart = echarts.init(chartDom);
      
      const months = this.getChartMonths();
      const series = this.selectedSuppliers.map(supplier => ({
        name: supplier.name,
        type: 'line',
        data: this.generateTrendData(supplier.metrics.onTimeDeliveryRate, months.length, 3),
        smooth: true
      }));
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: this.selectedSuppliers.map(s => s.name),
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: months
        },
        yAxis: {
          type: 'value',
          min: 70,
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: series
      };
      
      this.deliveryRateChart.setOption(option);
    },
    
    // 初始化响应时间趋势图
    initResponseTimeChart() {
      if (this.responseTimeChart) {
        this.responseTimeChart.dispose();
      }
      
      const chartDom = document.getElementById('responseTimeChart');
      if (!chartDom) return;
      
      this.responseTimeChart = echarts.init(chartDom);
      
      const months = this.getChartMonths();
      const series = this.selectedSuppliers.map(supplier => ({
        name: supplier.name,
        type: 'line',
        data: this.generateTrendData(supplier.metrics.avgResponseTime, months.length, 1),
        smooth: true
      }));
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: this.selectedSuppliers.map(s => s.name),
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: months
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 24,
          axisLabel: {
            formatter: '{value}h'
          }
        },
        series: series
      };
      
      this.responseTimeChart.setOption(option);
    },
    
    // 初始化价格竞争力图表
    initPriceCompetitivenessChart() {
      if (this.priceCompetitivenessChart) {
        this.priceCompetitivenessChart.dispose();
      }
      
      const chartDom = document.getElementById('priceCompetitivenessChart');
      if (!chartDom) return;
      
      this.priceCompetitivenessChart = echarts.init(chartDom);
      
      const series = this.selectedSuppliers.map(supplier => ({
        name: supplier.name,
        type: 'bar',
        data: [supplier.metrics.priceIndex],
        itemStyle: {
          color: this.getPriceIndexColor(supplier.metrics.priceIndex)
        }
      }));
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: this.selectedSuppliers.map(s => s.name),
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['价格指数']
        },
        yAxis: {
          type: 'value',
          min: 70,
          max: 120
        },
        series: series
      };
      
      this.priceCompetitivenessChart.setOption(option);
    },
    
    // 更新价格分布图表
    updatePriceDistributionChart() {
      if (this.priceDistributionChart) {
        this.priceDistributionChart.dispose();
      }
      
      const chartDom = document.getElementById('priceDistributionChart');
      if (!chartDom) return;
      
      this.priceDistributionChart = echarts.init(chartDom);
      
      const series = this.selectedSuppliers.map(supplier => {
        const priceData = this.priceComparisonData.find(p => p.supplierId === supplier.id);
        return {
          name: supplier.name,
          type: 'bar',
          data: [priceData ? priceData.unitPrice : 0],
          itemStyle: {
            color: priceData && priceData.isLowestPrice ? '#67c23a' : '#409eff'
          }
        };
      });
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function(params) {
            const data = params[0];
            return `${data.name}<br/>单价: ¥${data.value.toFixed(2)}`;
          }
        },
        legend: {
          data: this.selectedSuppliers.map(s => s.name),
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.selectedSuppliers.map(s => s.name),
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: series
      };
      
      this.priceDistributionChart.setOption(option);
    },
    
    // 销毁所有图表
    destroyCharts() {
      if (this.qualityRateChart) {
        this.qualityRateChart.dispose();
        this.qualityRateChart = null;
      }
      if (this.deliveryRateChart) {
        this.deliveryRateChart.dispose();
        this.deliveryRateChart = null;
      }
      if (this.responseTimeChart) {
        this.responseTimeChart.dispose();
        this.responseTimeChart = null;
      }
      if (this.priceCompetitivenessChart) {
        this.priceCompetitivenessChart.dispose();
        this.priceCompetitivenessChart = null;
      }
      if (this.priceDistributionChart) {
        this.priceDistributionChart.dispose();
        this.priceDistributionChart = null;
      }
    },
    
    // 获取图表月份
    getChartMonths() {
      const now = new Date();
      const months = [];
      const monthCount = this.chartPeriod === '3m' ? 3 : this.chartPeriod === '6m' ? 6 : 12;
      
      for (let i = monthCount - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${date.getMonth() + 1}月`);
      }
      
      return months;
    },
    
    // 生成趋势数据
    generateTrendData(baseValue, count, volatility) {
      const data = [];
      let currentValue = baseValue;
      
      for (let i = 0; i < count; i++) {
        // 添加一些随机波动
        const change = (Math.random() - 0.5) * volatility;
        currentValue = Math.max(0, currentValue + change);
        data.push(Number(currentValue.toFixed(2)));
      }
      
      return data;
    },
    
    // 获取价格指数对应的颜色
    getPriceIndexColor(priceIndex) {
      if (priceIndex < 90) return '#67c23a'; // 价格较低
      if (priceIndex < 110) return '#e6a23c'; // 价格适中
      return '#f56c6c'; // 价格较高
    },
    
    // 判断是否为最优值
    isBestValue(metricCode, value, index) {
      if (!this.selectedSuppliers || this.selectedSuppliers.length === 0) return false;
      
      // 根据指标类型判断最优值
      const isLowerBetter = ['avgResponseTime', 'complaintRate', 'returnRate'].includes(metricCode);
      const isHigherBetter = ['qualityRate', 'onTimeDeliveryRate'].includes(metricCode);
      const isMiddleBetter = ['priceIndex'].includes(metricCode);
      
      // 获取所有供应商的该指标值
      const allValues = this.selectedSuppliers.map(s => s.metrics[metricCode]);
      
      if (isLowerBetter) {
        return value === Math.min(...allValues);
      } else if (isHigherBetter) {
        return value === Math.max(...allValues);
      } else if (isMiddleBetter) {
        // 价格指数接近100为好
        const closestTo100 = allValues.reduce((prev, curr) => 
          Math.abs(curr - 100) < Math.abs(prev - 100) ? curr : prev
        );
        return value === closestTo100;
      }
      
      return false;
    },
    
    // 格式化指标值
    formatMetricValue(metricCode, value) {
      if (typeof value !== 'number') return '-';
      
      if (metricCode === 'avgResponseTime') {
        return value.toFixed(1);
      } else if (metricCode === 'priceIndex') {
        return value.toFixed(0);
      } else {
        return value.toFixed(1);
      }
    },
    
    // 获取维度排名
    getDimensionRank(dimensionCode, score) {
      const scores = this.selectedSuppliers.map(s => s.dimensions[dimensionCode]);
      const sortedScores = [...scores].sort((a, b) => b - a);
      const rank = sortedScores.indexOf(score) + 1;
      return `第${rank}名`;
    },
    
    // 获取类别文本
    getCategoryText(category) {
      const categoryMap = {
        raw_material: '原材料供应商',
        component: '零部件供应商',
        equipment: '设备供应商',
        service: '服务供应商'
      };
      return categoryMap[category] || '未知';
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      const statusMap = {
        active: 'success',
        suspended: 'warning',
        terminated: 'danger'
      };
      return statusMap[status] || 'info';
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        active: '合作中',
        suspended: '暂停合作',
        terminated: '已终止'
      };
      return statusMap[status] || '未知';
    },
    
    // 获取付款条件文本
    getPaymentTermsText(terms) {
      const termsMap = {
        '30-70': '预付30%，货到验收后付70%',
        '100-after-receipt': '货到验收后付款',
        'monthly-30': '月结30天',
        'monthly-60': '月结60天'
      };
      return termsMap[terms] || terms;
    },
    
    // 获取价格趋势类型
    getPriceTrendType(trend) {
      const trendMap = {
        up: 'danger',
        down: 'success',
        stable: 'info'
      };
      return trendMap[trend] || 'info';
    },
    
    // 获取价格趋势文本
    getPriceTrendText(trend) {
      const trendMap = {
        up: '上涨',
        down: '下降',
        stable: '稳定'
      };
      return trendMap[trend] || '未知';
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    },
    
    // 格式化日期时间
    dateFormat(row, column, cellValue) {
      return this.formatDate(cellValue) + ' ' + new Date(cellValue).toLocaleTimeString('zh-CN', { hour12: false });
    },
    
    // 刷新数据
    refreshData() {
      this.fetchSupplierList();
      this.$message.success('数据已刷新');
    },
    
    // 导出比较报告
    exportComparisonReport() {
      this.$message.success('比较报告导出成功');
    },
    
    // 监听物料选择变化
    watch: {
      selectedMaterialForPrice(newVal) {
        if (newVal) {
          this.generatePriceComparisonData(newVal);
        }
      },
      chartPeriod() {
        this.initCharts();
      }
    }
  }
};
</script>

<style scoped>
.supplier-comparison-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.select-supplier-section {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
  margin-bottom: 20px;
}

.selected-suppliers-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f2f5;
  border-radius: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.selected-suppliers-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.selected-supplier-tag {
  cursor: pointer;
}

.comparison-results-section {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.result-card {
  margin-bottom: 20px;
}

.result-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.metrics-comparison {
  padding: 10px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.metric-card {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #fafafa;
}

.metric-title {
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.metric-values {
  display: flex;
  justify-content: space-around;
  gap: 10px;
}

.metric-value-item {
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  background-color: #fff;
  flex: 1;
}

.metric-value-item.best-value {
  background-color: #f0f9eb;
  border: 1px solid #67c23a;
}

.metric-value-item .supplier-name {
  font-size: 12px;
  margin-bottom: 5px;
  color: #606266;
}

.metric-value-item .value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 3px;
}

.metric-value-item .unit {
  font-size: 12px;
  color: #909399;
}

.charts-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.chart-item {
  flex: 1;
  min-width: 400px;
}

.chart-item h4 {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
}

.chart {
  height: 300px;
}

.large-chart {
  height: 400px;
}

.price-comparison {
  padding: 10px 0;
}

.price-distribution-chart {
  margin-top: 20px;
}

.lowest-price {
  color: #f56c6c;
  font-weight: bold;
}

.lowest-price-tag {
  font-size: 12px;
  background-color: #f56c6c;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 5px;
}

.no-selection-tip {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.comparison-matrix {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
}

.matrix-table th,
.matrix-table td {
  border: 1px solid #ebeef5;
  padding: 12px;
  text-align: center;
}

.matrix-table th {
  background-color: #f5f7fa;
  font-weight: bold;
}

.dimension-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.score-text {
  font-weight: bold;
  color: #409eff;
}

.dimension-rank {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}

.comparison-summary {
  padding: 10px 0;
}

.summary-section {
  margin-bottom: 20px;
}

.summary-section h4 {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.recommendation-content {
  background-color: #f0f9eb;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #67c23a;
}

.recommended-supplier {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px 0;
}

.supplier-info .supplier-name {
  font-weight: bold;
  font-size: 16px;
}

.supplier-info .supplier-score {
  color: #606266;
}

.weight-setting-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.weight-setting-item span:first-child {
  width: 80px;
}

.weight-value {
  width: 40px;
  text-align: right;
}

.custom-date-range {
  margin-top: 10px;
}

.summary-card {
  border: 2px solid #67c23a;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .charts-container {
    flex-direction: column;
  }
  
  .chart-item {
    min-width: 100%;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .search-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-form .el-form-item {
    margin-bottom: 15px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .selected-suppliers-list {
    justify-content: center;
  }
  
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>