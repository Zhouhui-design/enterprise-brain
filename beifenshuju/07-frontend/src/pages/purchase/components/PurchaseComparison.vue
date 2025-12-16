<template>
  <div class="purchase-comparison-container">
    <el-card class="main-card">
      <div slot="header" class="card-header">
        <span>采购比价管理</span>
        <div class="header-actions">
          <el-button type="primary" icon="el-icon-plus" @click="createNewComparison">新建比价</el-button>
          <el-button icon="el-icon-refresh" @click="refreshData">刷新</el-button>
          <el-button icon="el-icon-download" @click="exportData">导出</el-button>
        </div>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="search-filter-section">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="比价单号">
            <el-input v-model="searchForm.comparisonNo" placeholder="请输入比价单号" clearable style="width: 180px;"></el-input>
          </el-form-item>
          <el-form-item label="物料名称">
            <el-input v-model="searchForm.materialName" placeholder="请输入物料名称" clearable style="width: 180px;"></el-input>
          </el-form-item>
          <el-form-item label="比价状态">
            <el-select v-model="searchForm.status" placeholder="请选择比价状态" clearable style="width: 150px;">
              <el-option label="待比价" value="pending"></el-option>
              <el-option label="比价中" value="comparing"></el-option>
              <el-option label="已完成" value="completed"></el-option>
              <el-option label="已取消" value="cancelled"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="searchForm.createTimeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px;"
            ></el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="search">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 比价列表 -->
      <div class="comparison-list-section">
        <el-table
          v-loading="listLoading"
          :data="comparisonList"
          style="width: 100%"
          @selection-change="handleSelectionChange"
          border
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="comparisonNo" label="比价单号" width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="materialCode" label="物料编码" width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="materialName" label="物料名称" width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="specification" label="规格型号" width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="quantity" label="需求数量" width="100" align="right">
            <template slot-scope="scope">{{ scope.row.quantity }} {{ scope.row.unit }}</template>
          </el-table-column>
          <el-table-column prop="createBy" label="创建人" width="100"></el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="160" formatter="dateFormat"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lowestQuoteAmount" label="最低报价" width="120" align="right">
            <template slot-scope="scope">{{ formatCurrency(scope.row.lowestQuoteAmount) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template slot-scope="scope">
              <el-button size="small" type="primary" @click="viewComparisonDetails(scope.row)">查看详情</el-button>
              <el-button size="small" @click="editComparison(scope.row)" :disabled="scope.row.status === 'completed' || scope.row.status === 'cancelled'">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteComparison(scope.row)" :disabled="scope.row.status === 'completed'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            background
            layout="prev, pager, next, jumper, ->, total"
            :total="total"
            :current-page.sync="pagination.currentPage"
            :page-size.sync="pagination.pageSize"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
          ></el-pagination>
        </div>
      </div>
    </el-card>

    <!-- 比价详情对话框 -->
    <el-dialog
      title="比价详情"
      :visible.sync="detailDialogVisible"
      width="90%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div v-if="currentComparison" class="comparison-detail-content">
        <!-- 比价基本信息 -->
        <el-card class="detail-card">
          <div slot="header" class="detail-card-header">
            <span>基本信息</span>
          </div>
          <el-descriptions border :column="2" :size="'small'">
            <el-descriptions-item label="比价单号">{{ currentComparison.comparisonNo }}</el-descriptions-item>
            <el-descriptions-item label="比价名称">{{ currentComparison.comparisonName }}</el-descriptions-item>
            <el-descriptions-item label="物料编码">{{ currentComparison.materialCode }}</el-descriptions-item>
            <el-descriptions-item label="物料名称">{{ currentComparison.materialName }}</el-descriptions-item>
            <el-descriptions-item label="规格型号">{{ currentComparison.specification }}</el-descriptions-item>
            <el-descriptions-item label="单位">{{ currentComparison.unit }}</el-descriptions-item>
            <el-descriptions-item label="需求数量">{{ currentComparison.quantity }}</el-descriptions-item>
            <el-descriptions-item label="预计交付日期">{{ formatDate(currentComparison.expectedDeliveryDate) }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ currentComparison.createBy }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(currentComparison.createTime) }}</el-descriptions-item>
            <el-descriptions-item label="比价状态">
              <el-tag :type="getStatusTagType(currentComparison.status)">{{ getStatusText(currentComparison.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备注">{{ currentComparison.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 供应商报价列表 -->
        <el-card class="detail-card">
          <div slot="header" class="detail-card-header">
            <span>供应商报价明细</span>
            <el-button size="small" type="primary" @click="addSupplierQuote" :disabled="currentComparison.status === 'completed' || currentComparison.status === 'cancelled'">
              添加报价
            </el-button>
          </div>
          <el-table :data="supplierQuotes" style="width: 100%" border>
            <el-table-column prop="supplierCode" label="供应商编码" width="120"></el-table-column>
            <el-table-column prop="supplierName" label="供应商名称" width="180"></el-table-column>
            <el-table-column prop="contactPerson" label="联系人" width="100"></el-table-column>
            <el-table-column prop="contactPhone" label="联系电话" width="120"></el-table-column>
            <el-table-column prop="unitPrice" label="单价" width="100" align="right">
              <template slot-scope="scope">{{ formatCurrency(scope.row.unitPrice) }}</template>
            </el-table-column>
            <el-table-column prop="totalAmount" label="总价" width="120" align="right">
              <template slot-scope="scope">{{ formatCurrency(scope.row.totalAmount) }}</template>
            </el-table-column>
            <el-table-column prop="deliveryTime" label="交货期(天)" width="100" align="right"></el-table-column>
            <el-table-column prop="paymentTerms" label="付款条件" width="150"></el-table-column>
            <el-table-column prop="quoteTime" label="报价时间" width="160" formatter="dateFormat"></el-table-column>
            <el-table-column prop="isLowest" label="最低价" width="80" align="center">
              <template slot-scope="scope">
                <el-tag v-if="scope.row.isLowest" type="success">是</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template slot-scope="scope">
                <el-button size="small" @click="editSupplierQuote(scope.row)" :disabled="currentComparison.status === 'completed' || currentComparison.status === 'cancelled'">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteSupplierQuote(scope.row.id)" :disabled="currentComparison.status === 'completed' || currentComparison.status === 'cancelled'">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 比价分析图表 -->
        <el-card class="detail-card">
          <div slot="header" class="detail-card-header">
            <span>比价分析</span>
          </div>
          <div class="chart-container">
            <div class="chart-item">
              <h4>供应商报价对比</h4>
              <div id="quoteComparisonChart" class="chart"></div>
            </div>
            <div class="chart-item">
              <h4>价格与交货期分析</h4>
              <div id="priceDeliveryChart" class="chart"></div>
            </div>
          </div>
        </el-card>

        <!-- 比价结果 -->
        <el-card v-if="currentComparison.status === 'completed'" class="detail-card result-card">
          <div slot="header" class="detail-card-header">
            <span>比价结果</span>
          </div>
          <el-descriptions border :column="2" :size="'small'">
            <el-descriptions-item label="推荐供应商">{{ recommendedSupplier?.supplierName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="推荐价格">{{ formatCurrency(recommendedSupplier?.unitPrice || 0) }}/{{ currentComparison.unit }}</el-descriptions-item>
            <el-descriptions-item label="总金额">{{ formatCurrency(recommendedSupplier?.totalAmount || 0) }}</el-descriptions-item>
            <el-descriptions-item label="交货期">{{ recommendedSupplier?.deliveryTime || 0 }}天</el-descriptions-item>
            <el-descriptions-item label="比价结论" :span="2">{{ comparisonResult?.conclusion || '-' }}</el-descriptions-item>
            <el-descriptions-item label="比价人">{{ comparisonResult?.comparisonBy || '-' }}</el-descriptions-item>
            <el-descriptions-item label="比价完成时间">{{ formatDate(comparisonResult?.comparisonTime) || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 操作按钮 -->
        <div v-if="currentComparison.status === 'comparing'" class="dialog-footer">
          <el-button type="primary" @click="completeComparison">完成比价</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 添加/编辑比价对话框 -->
    <el-dialog
      :title="isEditMode ? '编辑比价' : '新建比价'"
      :visible.sync="formDialogVisible"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="resetForm"
    >
      <el-form :model="comparisonForm" :rules="comparisonRules" ref="comparisonFormRef" label-width="100px">
        <el-form-item label="比价名称" prop="comparisonName">
          <el-input v-model="comparisonForm.comparisonName" placeholder="请输入比价名称"></el-input>
        </el-form-item>
        <el-form-item label="物料选择" prop="materialId">
          <el-select v-model="comparisonForm.materialId" placeholder="请选择物料" filterable remote :remote-method="remoteSearchMaterial" :loading="materialLoading">
            <el-option
              v-for="material in materialOptions"
              :key="material.id"
              :label="`${material.code} ${material.name} ${material.specification}`"
              :value="material.id"
              @click="selectMaterial(material)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="物料编码" prop="materialCode">
          <el-input v-model="comparisonForm.materialCode" disabled></el-input>
        </el-form-item>
        <el-form-item label="物料名称" prop="materialName">
          <el-input v-model="comparisonForm.materialName" disabled></el-input>
        </el-form-item>
        <el-form-item label="规格型号" prop="specification">
          <el-input v-model="comparisonForm.specification" disabled></el-input>
        </el-form-item>
        <el-form-item label="需求数量" prop="quantity">
          <el-input-number v-model="comparisonForm.quantity" :min="1" :step="1" style="width: 100%" placeholder="请输入需求数量"></el-input-number>
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="comparisonForm.unit" disabled></el-input>
        </el-form-item>
        <el-form-item label="预计交付日期" prop="expectedDeliveryDate">
          <el-date-picker v-model="comparisonForm.expectedDeliveryDate" type="date" style="width: 100%" placeholder="请选择预计交付日期"></el-date-picker>
        </el-form-item>
        <el-form-item label="备注">
          <el-input type="textarea" v-model="comparisonForm.remark" placeholder="请输入备注信息" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </div>
    </el-dialog>

    <!-- 供应商报价对话框 -->
    <el-dialog
      :title="isQuoteEditMode ? '编辑报价' : '添加供应商报价'"
      :visible.sync="quoteDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      @close="resetQuoteForm"
    >
      <el-form :model="quoteForm" :rules="quoteRules" ref="quoteFormRef" label-width="100px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select v-model="quoteForm.supplierId" placeholder="请选择供应商" filterable remote :remote-method="remoteSearchSupplier" :loading="supplierLoading">
            <el-option
              v-for="supplier in supplierOptions"
              :key="supplier.id"
              :label="`${supplier.code} ${supplier.name}`"
              :value="supplier.id"
              @click="selectSupplier(supplier)"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="quoteForm.contactPerson" placeholder="请输入联系人"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="quoteForm.contactPhone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        <el-form-item label="报价单价" prop="unitPrice">
          <el-input-number v-model="quoteForm.unitPrice" :min="0" :step="0.01" :precision="2" style="width: 100%" placeholder="请输入报价单价"></el-input-number>
        </el-form-item>
        <el-form-item label="总价" prop="totalAmount">
          <el-input-number v-model="quoteForm.totalAmount" :min="0" :step="0.01" :precision="2" style="width: 100%" disabled></el-input-number>
        </el-form-item>
        <el-form-item label="交货期(天)" prop="deliveryTime">
          <el-input-number v-model="quoteForm.deliveryTime" :min="1" :step="1" style="width: 100%" placeholder="请输入交货期"></el-input-number>
        </el-form-item>
        <el-form-item label="付款条件" prop="paymentTerms">
          <el-select v-model="quoteForm.paymentTerms" placeholder="请选择付款条件">
            <el-option label="预付30%，货到验收后付70%" value="30-70"></el-option>
            <el-option label="货到验收后付款" value="100-after-receipt"></el-option>
            <el-option label="月结30天" value="monthly-30"></el-option>
            <el-option label="月结60天" value="monthly-60"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="报价备注">
          <el-input type="textarea" v-model="quoteForm.remark" placeholder="请输入报价备注信息" :rows="2"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="quoteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuoteForm">提交</el-button>
      </div>
    </el-dialog>

    <!-- 完成比价对话框 -->
    <el-dialog
      title="完成比价"
      :visible.sync="completeComparisonDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="comparisonResultForm" :rules="comparisonResultRules" ref="comparisonResultFormRef" label-width="100px">
        <el-form-item label="推荐供应商" prop="recommendedSupplierId">
          <el-select v-model="comparisonResultForm.recommendedSupplierId" placeholder="请选择推荐供应商">
            <el-option
              v-for="quote in supplierQuotes"
              :key="quote.id"
              :label="quote.supplierName"
              :value="quote.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="比价结论" prop="conclusion">
          <el-input type="textarea" v-model="comparisonResultForm.conclusion" placeholder="请输入比价结论" :rows="3"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="completeComparisonDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCompleteComparison">确认完成</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import echarts from 'echarts';

export default {
  name: 'PurchaseComparison',
  data() {
    return {
      // 搜索表单
      searchForm: {
        comparisonNo: '',
        materialName: '',
        status: '',
        createTimeRange: []
      },
      // 比价列表数据
      comparisonList: [],
      listLoading: false,
      total: 0,
      pagination: {
        currentPage: 1,
        pageSize: 10
      },
      selectedRows: [],
      // 对话框状态
      detailDialogVisible: false,
      formDialogVisible: false,
      quoteDialogVisible: false,
      completeComparisonDialogVisible: false,
      isEditMode: false,
      isQuoteEditMode: false,
      // 当前比价
      currentComparison: null,
      // 供应商报价列表
      supplierQuotes: [],
      // 推荐供应商
      recommendedSupplier: null,
      // 比价结果
      comparisonResult: null,
      // 表单数据
      comparisonForm: {
        id: '',
        comparisonNo: '',
        comparisonName: '',
        materialId: '',
        materialCode: '',
        materialName: '',
        specification: '',
        quantity: 1,
        unit: '',
        expectedDeliveryDate: '',
        remark: ''
      },
      quoteForm: {
        id: '',
        supplierId: '',
        supplierCode: '',
        supplierName: '',
        contactPerson: '',
        contactPhone: '',
        unitPrice: 0,
        totalAmount: 0,
        deliveryTime: 0,
        paymentTerms: '',
        remark: ''
      },
      comparisonResultForm: {
        recommendedSupplierId: '',
        conclusion: ''
      },
      // 下拉选项
      materialOptions: [],
      supplierOptions: [],
      materialLoading: false,
      supplierLoading: false,
      // 表单验证规则
      comparisonRules: {
        comparisonName: [{ required: true, message: '请输入比价名称', trigger: 'blur' }],
        materialId: [{ required: true, message: '请选择物料', trigger: 'change' }],
        quantity: [{ required: true, message: '请输入需求数量', trigger: 'blur' }],
        expectedDeliveryDate: [{ required: true, message: '请选择预计交付日期', trigger: 'change' }]
      },
      quoteRules: {
        supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
        contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
        contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
        unitPrice: [{ required: true, message: '请输入报价单价', trigger: 'blur' }],
        deliveryTime: [{ required: true, message: '请输入交货期', trigger: 'blur' }],
        paymentTerms: [{ required: true, message: '请选择付款条件', trigger: 'change' }]
      },
      comparisonResultRules: {
        recommendedSupplierId: [{ required: true, message: '请选择推荐供应商', trigger: 'change' }],
        conclusion: [{ required: true, message: '请输入比价结论', trigger: 'blur' }]
      },
      // 图表实例
      quoteComparisonChart: null,
      priceDeliveryChart: null
    };
  },
  mounted() {
    this.fetchComparisonList();
  },
  beforeDestroy() {
    if (this.quoteComparisonChart) {
      this.quoteComparisonChart.dispose();
    }
    if (this.priceDeliveryChart) {
      this.priceDeliveryChart.dispose();
    }
  },
  methods: {
    // 获取比价列表
    fetchComparisonList() {
      this.listLoading = true;
      // 模拟API调用
      setTimeout(() => {
        const mockData = this.generateMockComparisonList();
        this.comparisonList = mockData;
        this.total = mockData.length;
        this.listLoading = false;
      }, 500);
    },
    
    // 生成模拟比价列表数据
    generateMockComparisonList() {
      const statuses = ['pending', 'comparing', 'completed', 'cancelled'];
      const materials = [
        { code: 'M001', name: '不锈钢板', spec: '304 2mm', unit: '张' },
        { code: 'M002', name: '轴承', spec: '6205', unit: '个' },
        { code: 'M003', name: '电机', spec: 'Y132M-4', unit: '台' },
        { code: 'M004', name: '液压油', spec: '46#', unit: '桶' },
        { code: 'M005', name: '传感器', spec: 'PT100', unit: '个' }
      ];
      
      const list = [];
      for (let i = 1; i <= 50; i++) {
        const material = materials[Math.floor(Math.random() * materials.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const quantity = Math.floor(Math.random() * 100) + 10;
        const lowestPrice = Math.random() * 1000 + 100;
        
        list.push({
          id: `comparison_${i}`,
          comparisonNo: `COMP${2024}${String(i).padStart(4, '0')}`,
          comparisonName: `${material.name}比价单`,
          materialCode: material.code,
          materialName: material.name,
          specification: material.spec,
          quantity: quantity,
          unit: material.unit,
          expectedDeliveryDate: this.generateRandomDate(),
          createBy: `用户${Math.floor(Math.random() * 10) + 1}`,
          createTime: this.generateRandomDate(),
          status: status,
          lowestQuoteAmount: status === 'completed' ? lowestPrice * quantity : 0,
          remark: status === 'completed' ? '比价已完成，已选择最优供应商' : ''
        });
      }
      
      return list;
    },
    
    // 生成随机日期
    generateRandomDate() {
      const start = new Date(2024, 0, 1);
      const end = new Date();
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    },
    
    // 搜索
    search() {
      this.pagination.currentPage = 1;
      this.fetchComparisonList();
    },
    
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        comparisonNo: '',
        materialName: '',
        status: '',
        createTimeRange: []
      };
      this.pagination.currentPage = 1;
      this.fetchComparisonList();
    },
    
    // 分页处理
    handleCurrentChange(val) {
      this.pagination.currentPage = val;
      this.fetchComparisonList();
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.currentPage = 1;
      this.fetchComparisonList();
    },
    
    // 选择行处理
    handleSelectionChange(val) {
      this.selectedRows = val;
    },
    
    // 刷新数据
    refreshData() {
      this.fetchComparisonList();
    },
    
    // 导出数据
    exportData() {
      this.$message.success('数据导出成功');
    },
    
    // 新建比价
    createNewComparison() {
      this.isEditMode = false;
      this.resetForm();
      this.formDialogVisible = true;
    },
    
    // 编辑比价
    editComparison(row) {
      this.isEditMode = true;
      this.comparisonForm = {
        id: row.id,
        comparisonNo: row.comparisonNo,
        comparisonName: row.comparisonName,
        materialId: row.materialId || '',
        materialCode: row.materialCode,
        materialName: row.materialName,
        specification: row.specification,
        quantity: row.quantity,
        unit: row.unit,
        expectedDeliveryDate: row.expectedDeliveryDate,
        remark: row.remark || ''
      };
      this.formDialogVisible = true;
    },
    
    // 删除比价
    deleteComparison(row) {
      this.$confirm(`确定要删除比价单「${row.comparisonNo}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.$message.success('删除成功');
        this.fetchComparisonList();
      }).catch(() => {});
    },
    
    // 查看比价详情
    viewComparisonDetails(row) {
      this.currentComparison = row;
      this.detailDialogVisible = true;
      // 加载供应商报价数据
      this.fetchSupplierQuotes(row.id);
      // 加载比价结果
      if (row.status === 'completed') {
        this.fetchComparisonResult(row.id);
      }
    },
    
    // 获取供应商报价
    fetchSupplierQuotes(comparisonId) {
      // 模拟API调用
      setTimeout(() => {
        this.supplierQuotes = this.generateMockSupplierQuotes();
        // 初始化图表
        this.initCharts();
      }, 300);
    },
    
    // 生成模拟供应商报价
    generateMockSupplierQuotes() {
      const suppliers = [
        { code: 'S001', name: '诚信金属材料有限公司', contact: '张三', phone: '13800138001' },
        { code: 'S002', name: '远大机械设备有限公司', contact: '李四', phone: '13800138002' },
        { code: 'S003', name: '恒信传动科技有限公司', contact: '王五', phone: '13800138003' },
        { code: 'S004', name: '鑫源润滑油有限公司', contact: '赵六', phone: '13800138004' },
        { code: 'S005', name: '精准传感器科技有限公司', contact: '孙七', phone: '13800138005' }
      ];
      
      const paymentTerms = ['30-70', '100-after-receipt', 'monthly-30', 'monthly-60'];
      const quotes = [];
      
      // 随机生成3-5个供应商报价
      const quoteCount = Math.floor(Math.random() * 3) + 3;
      let minPrice = Infinity;
      let minPriceIndex = 0;
      
      for (let i = 0; i < quoteCount; i++) {
        const supplier = suppliers[i];
        const unitPrice = Math.random() * 1000 + 100;
        const quantity = this.currentComparison?.quantity || 100;
        const totalAmount = unitPrice * quantity;
        const deliveryTime = Math.floor(Math.random() * 30) + 5;
        
        if (unitPrice < minPrice) {
          minPrice = unitPrice;
          minPriceIndex = i;
        }
        
        quotes.push({
          id: `quote_${i}`,
          supplierCode: supplier.code,
          supplierName: supplier.name,
          contactPerson: supplier.contact,
          contactPhone: supplier.phone,
          unitPrice: Number(unitPrice.toFixed(2)),
          totalAmount: Number(totalAmount.toFixed(2)),
          deliveryTime: deliveryTime,
          paymentTerms: paymentTerms[Math.floor(Math.random() * paymentTerms.length)],
          quoteTime: this.generateRandomDate(),
          isLowest: false,
          remark: ''
        });
      }
      
      // 设置最低价标记
      if (quotes.length > 0) {
        quotes[minPriceIndex].isLowest = true;
      }
      
      return quotes;
    },
    
    // 获取比价结果
    fetchComparisonResult(comparisonId) {
      // 模拟API调用
      setTimeout(() => {
        // 获取最低价的供应商作为推荐供应商
        this.recommendedSupplier = this.supplierQuotes.find(quote => quote.isLowest) || this.supplierQuotes[0];
        
        this.comparisonResult = {
          conclusion: `经综合评估，推荐选择${this.recommendedSupplier?.supplierName}，该供应商报价最低，交货期合理，信誉良好。`,
          comparisonBy: `用户${Math.floor(Math.random() * 10) + 1}`,
          comparisonTime: new Date()
        };
      }, 300);
    },
    
    // 添加供应商报价
    addSupplierQuote() {
      this.isQuoteEditMode = false;
      this.resetQuoteForm();
      this.quoteDialogVisible = true;
    },
    
    // 编辑供应商报价
    editSupplierQuote(row) {
      this.isQuoteEditMode = true;
      this.quoteForm = {
        id: row.id,
        supplierId: row.id,
        supplierCode: row.supplierCode,
        supplierName: row.supplierName,
        contactPerson: row.contactPerson,
        contactPhone: row.contactPhone,
        unitPrice: row.unitPrice,
        totalAmount: row.totalAmount,
        deliveryTime: row.deliveryTime,
        paymentTerms: row.paymentTerms,
        remark: row.remark || ''
      };
      this.quoteDialogVisible = true;
    },
    
    // 删除供应商报价
    deleteSupplierQuote(quoteId) {
      this.$confirm('确定要删除该供应商报价吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        const index = this.supplierQuotes.findIndex(quote => quote.id === quoteId);
        if (index > -1) {
          this.supplierQuotes.splice(index, 1);
          // 重新计算最低价
          this.recalculateLowestPrice();
          // 更新图表
          this.updateCharts();
          this.$message.success('删除成功');
        }
      }).catch(() => {});
    },
    
    // 重新计算最低价
    recalculateLowestPrice() {
      if (this.supplierQuotes.length === 0) return;
      
      // 重置所有最低价标记
      this.supplierQuotes.forEach(quote => {
        quote.isLowest = false;
      });
      
      // 找出新的最低价
      let minPrice = Infinity;
      let minPriceIndex = 0;
      
      this.supplierQuotes.forEach((quote, index) => {
        if (quote.unitPrice < minPrice) {
          minPrice = quote.unitPrice;
          minPriceIndex = index;
        }
      });
      
      // 设置新的最低价标记
      this.supplierQuotes[minPriceIndex].isLowest = true;
    },
    
    // 完成比价
    completeComparison() {
      if (this.supplierQuotes.length === 0) {
        this.$message.warning('请先添加供应商报价');
        return;
      }
      
      this.comparisonResultForm = {
        recommendedSupplierId: this.supplierQuotes.find(quote => quote.isLowest)?.id || this.supplierQuotes[0].id,
        conclusion: ''
      };
      
      this.completeComparisonDialogVisible = true;
    },
    
    // 确认完成比价
    confirmCompleteComparison() {
      this.$refs.comparisonResultFormRef.validate((valid) => {
        if (valid) {
          // 模拟API调用
          setTimeout(() => {
            const selectedQuote = this.supplierQuotes.find(quote => quote.id === this.comparisonResultForm.recommendedSupplierId);
            this.recommendedSupplier = selectedQuote;
            this.comparisonResult = {
              conclusion: this.comparisonResultForm.conclusion,
              comparisonBy: '当前用户',
              comparisonTime: new Date()
            };
            
            // 更新当前比价状态
            this.currentComparison.status = 'completed';
            this.currentComparison.lowestQuoteAmount = selectedQuote.totalAmount;
            
            this.completeComparisonDialogVisible = false;
            this.$message.success('比价完成');
            this.fetchComparisonList();
          }, 500);
        }
      });
    },
    
    // 远程搜索物料
    remoteSearchMaterial(query) {
      if (query !== '') {
        this.materialLoading = true;
        // 模拟API调用
        setTimeout(() => {
          this.materialLoading = false;
          const mockMaterials = [
            { id: 'M001', code: 'M001', name: '不锈钢板', specification: '304 2mm', unit: '张' },
            { id: 'M002', code: 'M002', name: '轴承', specification: '6205', unit: '个' },
            { id: 'M003', code: 'M003', name: '电机', specification: 'Y132M-4', unit: '台' },
            { id: 'M004', code: 'M004', name: '液压油', specification: '46#', unit: '桶' },
            { id: 'M005', code: 'M005', name: '传感器', specification: 'PT100', unit: '个' }
          ];
          
          this.materialOptions = mockMaterials.filter(item => {
            return item.code.toLowerCase().includes(query.toLowerCase()) ||
                   item.name.toLowerCase().includes(query.toLowerCase()) ||
                   item.specification.toLowerCase().includes(query.toLowerCase());
          });
        }, 300);
      } else {
        this.materialOptions = [];
      }
    },
    
    // 选择物料
    selectMaterial(material) {
      this.comparisonForm.materialCode = material.code;
      this.comparisonForm.materialName = material.name;
      this.comparisonForm.specification = material.specification;
      this.comparisonForm.unit = material.unit;
    },
    
    // 远程搜索供应商
    remoteSearchSupplier(query) {
      if (query !== '') {
        this.supplierLoading = true;
        // 模拟API调用
        setTimeout(() => {
          this.supplierLoading = false;
          const mockSuppliers = [
            { id: 'S001', code: 'S001', name: '诚信金属材料有限公司' },
            { id: 'S002', code: 'S002', name: '远大机械设备有限公司' },
            { id: 'S003', code: 'S003', name: '恒信传动科技有限公司' },
            { id: 'S004', code: 'S004', name: '鑫源润滑油有限公司' },
            { id: 'S005', code: 'S005', name: '精准传感器科技有限公司' }
          ];
          
          this.supplierOptions = mockSuppliers.filter(item => {
            return item.code.toLowerCase().includes(query.toLowerCase()) ||
                   item.name.toLowerCase().includes(query.toLowerCase());
          });
        }, 300);
      } else {
        this.supplierOptions = [];
      }
    },
    
    // 选择供应商
    selectSupplier(supplier) {
      this.quoteForm.supplierCode = supplier.code;
      this.quoteForm.supplierName = supplier.name;
    },
    
    // 提交比价表单
    submitForm() {
      this.$refs.comparisonFormRef.validate((valid) => {
        if (valid) {
          // 模拟API调用
          setTimeout(() => {
            if (!this.isEditMode) {
              // 生成比价单号
              const timestamp = Date.now();
              this.comparisonForm.comparisonNo = `COMP${new Date().getFullYear()}${String(timestamp).slice(-6)}`;
            }
            
            this.formDialogVisible = false;
            this.$message.success(this.isEditMode ? '编辑成功' : '创建成功');
            this.fetchComparisonList();
          }, 500);
        }
      });
    },
    
    // 提交报价表单
    submitQuoteForm() {
      // 计算总价
      this.quoteForm.totalAmount = Number((this.quoteForm.unitPrice * (this.currentComparison?.quantity || 1)).toFixed(2));
      
      this.$refs.quoteFormRef.validate((valid) => {
        if (valid) {
          // 模拟API调用
          setTimeout(() => {
            if (this.isQuoteEditMode) {
              // 编辑现有报价
              const index = this.supplierQuotes.findIndex(quote => quote.id === this.quoteForm.id);
              if (index > -1) {
                this.supplierQuotes.splice(index, 1, { ...this.quoteForm });
              }
            } else {
              // 添加新报价
              const newQuote = {
                ...this.quoteForm,
                id: `quote_${Date.now()}`,
                quoteTime: new Date(),
                isLowest: false
              };
              this.supplierQuotes.push(newQuote);
            }
            
            // 重新计算最低价
            this.recalculateLowestPrice();
            // 更新图表
            this.updateCharts();
            
            this.quoteDialogVisible = false;
            this.$message.success(this.isQuoteEditMode ? '编辑成功' : '添加成功');
          }, 500);
        }
      });
    },
    
    // 重置表单
    resetForm() {
      if (this.$refs.comparisonFormRef) {
        this.$refs.comparisonFormRef.resetFields();
      }
      this.comparisonForm = {
        id: '',
        comparisonNo: '',
        comparisonName: '',
        materialId: '',
        materialCode: '',
        materialName: '',
        specification: '',
        quantity: 1,
        unit: '',
        expectedDeliveryDate: '',
        remark: ''
      };
    },
    
    // 重置报价表单
    resetQuoteForm() {
      if (this.$refs.quoteFormRef) {
        this.$refs.quoteFormRef.resetFields();
      }
      this.quoteForm = {
        id: '',
        supplierId: '',
        supplierCode: '',
        supplierName: '',
        contactPerson: '',
        contactPhone: '',
        unitPrice: 0,
        totalAmount: 0,
        deliveryTime: 0,
        paymentTerms: '',
        remark: ''
      };
    },
    
    // 初始化图表
    initCharts() {
      this.$nextTick(() => {
        this.initQuoteComparisonChart();
        this.initPriceDeliveryChart();
      });
    },
    
    // 初始化报价对比图表
    initQuoteComparisonChart() {
      if (this.quoteComparisonChart) {
        this.quoteComparisonChart.dispose();
      }
      
      const chartDom = document.getElementById('quoteComparisonChart');
      if (!chartDom) return;
      
      this.quoteComparisonChart = echarts.init(chartDom);
      
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
        xAxis: {
          type: 'category',
          data: this.supplierQuotes.map(quote => quote.supplierName),
          axisLabel: {
            rotate: 45,
            interval: 0
          }
        },
        yAxis: {
          type: 'value',
          name: '单价(元)',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [{
          data: this.supplierQuotes.map(quote => ({
            value: quote.unitPrice,
            itemStyle: {
              color: quote.isLowest ? '#67c23a' : '#409eff'
            }
          })),
          type: 'bar',
          barWidth: '60%'
        }]
      };
      
      this.quoteComparisonChart.setOption(option);
    },
    
    // 初始化价格交货期分析图表
    initPriceDeliveryChart() {
      if (this.priceDeliveryChart) {
        this.priceDeliveryChart.dispose();
      }
      
      const chartDom = document.getElementById('priceDeliveryChart');
      if (!chartDom) return;
      
      this.priceDeliveryChart = echarts.init(chartDom);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            return `${params.name}<br/>单价: ¥${params.value[0].toFixed(2)}<br/>交货期: ${params.value[1]}天`;
          }
        },
        xAxis: {
          type: 'value',
          name: '单价(元)',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        yAxis: {
          type: 'value',
          name: '交货期(天)'
        },
        series: [{
          data: this.supplierQuotes.map(quote => ({
            name: quote.supplierName,
            value: [quote.unitPrice, quote.deliveryTime],
            itemStyle: {
              color: quote.isLowest ? '#67c23a' : '#409eff'
            },
            symbolSize: 15
          })),
          type: 'scatter'
        }]
      };
      
      this.priceDeliveryChart.setOption(option);
    },
    
    // 更新图表
    updateCharts() {
      if (this.quoteComparisonChart) {
        this.quoteComparisonChart.setOption({
          xAxis: {
            data: this.supplierQuotes.map(quote => quote.supplierName)
          },
          series: [{
            data: this.supplierQuotes.map(quote => ({
              value: quote.unitPrice,
              itemStyle: {
                color: quote.isLowest ? '#67c23a' : '#409eff'
              }
            }))
          }]
        });
      }
      
      if (this.priceDeliveryChart) {
        this.priceDeliveryChart.setOption({
          series: [{
            data: this.supplierQuotes.map(quote => ({
              name: quote.supplierName,
              value: [quote.unitPrice, quote.deliveryTime],
              itemStyle: {
                color: quote.isLowest ? '#67c23a' : '#409eff'
              },
              symbolSize: 15
            }))
          }]
        });
      }
    },
    
    // 格式化状态标签类型
    getStatusTagType(status) {
      const statusMap = {
        pending: 'info',
        comparing: 'warning',
        completed: 'success',
        cancelled: 'danger'
      };
      return statusMap[status] || 'info';
    },
    
    // 格式化状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待比价',
        comparing: '比价中',
        completed: '已完成',
        cancelled: '已取消'
      };
      return statusMap[status] || '未知';
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
    
    // 格式化货币
    formatCurrency(value) {
      return `¥${Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
};
</script>

<style scoped>
.purchase-comparison-container {
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

.search-filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: flex-end;
}

.comparison-list-section {
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

.comparison-detail-content {
  max-height: 600px;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.chart-container {
  display: flex;
  gap: 20px;
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

.result-card {
  border: 2px solid #67c23a;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .chart-container {
    flex-direction: column;
  }
  
  .chart-item {
    min-width: 100%;
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
}
</style>