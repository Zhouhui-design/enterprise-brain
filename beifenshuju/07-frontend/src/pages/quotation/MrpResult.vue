<template>
  <div class="mrp-result-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>MRP计算结果</h2>
      <div class="header-actions">
        <el-button type="primary" @click="exportReport">导出报告</el-button>
        <el-button @click="backToCalculation">返回计算</el-button>
      </div>
    </div>

    <!-- 结果概览卡片 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-title">总物料项</div>
            <div class="card-value">{{ totalItems }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-title">短缺物料</div>
            <div class="card-value shortfall">{{ shortfallItems }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-title">计划订单</div>
            <div class="card-value">{{ plannedOrders }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="overview-card">
            <div class="card-title">例外信息</div>
            <div class="card-value alert">{{ exceptionCount }}</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 结果过滤器 -->
    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="物料类型">
          <el-select v-model="filterForm.itemType" placeholder="全部">
            <el-option label="成品" value="finished"></el-option>
            <el-option label="半成品" value="semi-finished"></el-option>
            <el-option label="原材料" value="raw-material"></el-option>
            <el-option label="采购件" value="purchased"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="需求状态">
          <el-select v-model="filterForm.status" placeholder="全部">
            <el-option label="短缺" value="shortfall"></el-option>
            <el-option label="充足" value="sufficient"></el-option>
            <el-option label="计划中" value="planned"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 切换视图模式 -->
    <div class="view-mode-section">
      <el-radio-group v-model="viewMode" size="medium">
        <el-radio-button label="table">表格视图</el-radio-button>
        <el-radio-button label="chart">图表分析</el-radio-button>
        <el-radio-button label="matrix">矩阵视图</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 表格视图 -->
    <div v-if="viewMode === 'table'" class="result-table-section">
      <el-table
        :data="filteredResults"
        style="width: 100%"
        @row-click="viewItemDetails"
      >
        <el-table-column prop="itemCode" label="物料编码" width="120"></el-table-column>
        <el-table-column prop="itemName" label="物料名称" width="200"></el-table-column>
        <el-table-column prop="itemType" label="物料类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="getItemTypeTag(scope.row.itemType)">
              {{ getItemTypeName(scope.row.itemType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentStock" label="当前库存" width="100"></el-table-column>
        <el-table-column prop="grossRequirement" label="毛需求" width="100"></el-table-column>
        <el-table-column prop="netRequirement" label="净需求" width="100">
          <template slot-scope="scope">
            <span :class="{ 'shortfall-value': scope.row.netRequirement > 0 }">
              {{ scope.row.netRequirement }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="plannedOrder" label="计划订单" width="100"></el-table-column>
        <el-table-column prop="dueDate" label="到期日期" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusName(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="150"></el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click.stop="viewItemDetails(scope.row)">详情</el-button>
            <el-button type="text" size="small" @click.stop="generatePurchaseOrder(scope.row)">采购</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-section">
        <el-pagination
          background
          layout="prev, pager, next, jumper, ->, total"
          :total="filteredResults.length"
          :page-size="pageSize"
          v-model="currentPage"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </div>

    <!-- 图表分析视图 -->
    <div v-if="viewMode === 'chart'" class="chart-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-title">物料需求分布</div>
            <div class="chart-container" ref="requirementChart"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-title">库存状态分析</div>
            <div class="chart-container" ref="inventoryChart"></div>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="chart-card">
            <div class="chart-title">物料需求趋势</div>
            <div class="chart-container" ref="trendChart"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 矩阵视图 -->
    <div v-if="viewMode === 'matrix'" class="matrix-section">
      <mrp-matrix :data="mrpMatrixData"></mrp-matrix>
    </div>

    <!-- 例外报告 -->
    <div class="exception-section">
      <h3>例外报告</h3>
      <el-table :data="exceptionList" style="width: 100%">
        <el-table-column prop="itemCode" label="物料编码" width="120"></el-table-column>
        <el-table-column prop="itemName" label="物料名称" width="200"></el-table-column>
        <el-table-column prop="exceptionType" label="例外类型" width="120"></el-table-column>
        <el-table-column prop="description" label="描述" width="400"></el-table-column>
        <el-table-column prop="suggestion" label="建议" width="200"></el-table-column>
        <el-table-column prop="date" label="日期" width="120"></el-table-column>
      </el-table>
    </div>

    <!-- 物料详情对话框 -->
    <el-dialog
      title="物料需求详情"
      :visible.sync="itemDetailsVisible"
      width="800px"
    >
      <div v-if="selectedItem" class="item-details">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form label-width="100px">
              <el-form-item label="物料编码">
                {{ selectedItem.itemCode }}
              </el-form-item>
              <el-form-item label="物料名称">
                {{ selectedItem.itemName }}
              </el-form-item>
              <el-form-item label="物料类型">
                {{ getItemTypeName(selectedItem.itemType) }}
              </el-form-item>
              <el-form-item label="当前库存">
                {{ selectedItem.currentStock }}
              </el-form-item>
              <el-form-item label="安全库存">
                {{ selectedItem.safetyStock }}
              </el-form-item>
              <el-form-item label="提前期">
                {{ selectedItem.leadTime }}天
              </el-form-item>
            </el-form>
          </el-col>
          <el-col :span="12">
            <el-form label-width="100px">
              <el-form-item label="供应商">
                {{ selectedItem.supplier || '-' }}
              </el-form-item>
              <el-form-item label="单位">
                {{ selectedItem.unit }}
              </el-form-item>
              <el-form-item label="成本">
                ¥{{ selectedItem.cost }}
              </el-form-item>
              <el-form-item label="状态">
                <el-tag :type="getStatusTag(selectedItem.status)">
                  {{ getStatusName(selectedItem.status) }}
                </el-tag>
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>
        
        <h4 style="margin-top: 20px">时间分段需求</h4>
        <time-phased-view :data="selectedItem.timePhasedData"></time-phased-view>

        <h4 style="margin-top: 20px">相关需求</h4>
        <el-table :data="selectedItem.relatedItems" style="width: 100%" size="small">
          <el-table-column prop="parentItemCode" label="父项编码" width="120"></el-table-column>
          <el-table-column prop="parentItemName" label="父项名称" width="200"></el-table-column>
          <el-table-column prop="quantityPer" label="用量" width="80"></el-table-column>
          <el-table-column prop="requiredQuantity" label="需求数量" width="100"></el-table-column>
        </el-table>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="itemDetailsVisible = false">关闭</el-button>
        <el-button type="primary" @click="generatePurchaseOrder(selectedItem)">生成采购订单</el-button>
      </div>
    </el-dialog>

    <!-- 采购订单生成确认对话框 -->
    <el-dialog
      title="生成采购订单"
      :visible.sync="purchaseOrderVisible"
      width="600px"
    >
      <div v-if="selectedItem" class="purchase-order-form">
        <el-form :model="purchaseOrderForm" label-width="100px">
          <el-form-item label="物料编码">
            {{ selectedItem.itemCode }}
          </el-form-item>
          <el-form-item label="物料名称">
            {{ selectedItem.itemName }}
          </el-form-item>
          <el-form-item label="采购数量" :required="true">
            <el-input v-model.number="purchaseOrderForm.quantity"></el-input>
          </el-form-item>
          <el-form-item label="供应商" :required="true">
            <el-select v-model="purchaseOrderForm.supplier">
              <el-option v-for="supplier in suppliers" :key="supplier.id" :label="supplier.name" :value="supplier.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="期望到货日期" :required="true">
            <el-date-picker v-model="purchaseOrderForm.expectedDate" type="date" placeholder="选择日期"></el-date-picker>
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="purchaseOrderForm.remark"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="purchaseOrderVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPurchaseOrder">确认生成</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 导入MRP相关组件
import MrpMatrix from './components/MrpMatrix.vue';
import TimePhasedView from './components/TimePhasedView.vue';

export default {
  name: 'MrpResult',
  components: {
    MrpMatrix,
    TimePhasedView
  },
  data() {
    return {
      // 分页数据
      currentPage: 1,
      pageSize: 20,
      // 视图模式
      viewMode: 'table',
      // 过滤表单
      filterForm: {
        itemType: '',
        status: '',
        timeRange: null
      },
      // 对话框状态
      itemDetailsVisible: false,
      purchaseOrderVisible: false,
      // 选中的物料
      selectedItem: null,
      // 采购订单表单
      purchaseOrderForm: {
        quantity: 0,
        supplier: '',
        expectedDate: null,
        remark: ''
      },
      // 供应商列表
      suppliers: [
        { id: 1, name: '供应商A' },
        { id: 2, name: '供应商B' },
        { id: 3, name: '供应商C' }
      ],
      // MRP计算结果数据
      mrpResults: [
        {
          itemCode: 'P001',
          itemName: '成品A',
          itemType: 'finished',
          currentStock: 50,
          safetyStock: 20,
          grossRequirement: 100,
          netRequirement: 0,
          plannedOrder: 0,
          dueDate: '2023-12-15',
          status: 'sufficient',
          supplier: '',
          leadTime: 15,
          unit: '个',
          cost: 1000,
          timePhasedData: [
            { period: '第1周', beginningInventory: 50, grossRequirements: 30, scheduledReceipts: 0, projectedOnHand: 20, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 },
            { period: '第2周', beginningInventory: 20, grossRequirements: 20, scheduledReceipts: 0, projectedOnHand: 0, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 },
            { period: '第3周', beginningInventory: 0, grossRequirements: 50, scheduledReceipts: 0, projectedOnHand: 0, netRequirements: 50, plannedOrderReceipts: 50, plannedOrderReleases: 50 },
            { period: '第4周', beginningInventory: 0, grossRequirements: 0, scheduledReceipts: 50, projectedOnHand: 50, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 }
          ],
          relatedItems: [
            { parentItemCode: '', parentItemName: '', quantityPer: 0, requiredQuantity: 100 }
          ]
        },
        {
          itemCode: 'S001',
          itemName: '半成品B',
          itemType: 'semi-finished',
          currentStock: 30,
          safetyStock: 10,
          grossRequirement: 150,
          netRequirement: 70,
          plannedOrder: 70,
          dueDate: '2023-12-10',
          status: 'shortfall',
          supplier: '',
          leadTime: 10,
          unit: '个',
          cost: 500,
          timePhasedData: [
            { period: '第1周', beginningInventory: 30, grossRequirements: 40, scheduledReceipts: 0, projectedOnHand: -10, netRequirements: 20, plannedOrderReceipts: 20, plannedOrderReleases: 20 },
            { period: '第2周', beginningInventory: 0, grossRequirements: 60, scheduledReceipts: 20, projectedOnHand: -40, netRequirements: 50, plannedOrderReceipts: 50, plannedOrderReleases: 50 },
            { period: '第3周', beginningInventory: 0, grossRequirements: 50, scheduledReceipts: 50, projectedOnHand: 0, netRequirements: 10, plannedOrderReceipts: 10, plannedOrderReleases: 0 },
            { period: '第4周', beginningInventory: 0, grossRequirements: 0, scheduledReceipts: 10, projectedOnHand: 10, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 }
          ],
          relatedItems: [
            { parentItemCode: 'P001', parentItemName: '成品A', quantityPer: 2, requiredQuantity: 100 }
          ]
        },
        {
          itemCode: 'RM001',
          itemName: '原材料C',
          itemType: 'raw-material',
          currentStock: 0,
          safetyStock: 50,
          grossRequirement: 250,
          netRequirement: 300,
          plannedOrder: 300,
          dueDate: '2023-12-05',
          status: 'shortfall',
          supplier: '供应商A',
          leadTime: 5,
          unit: 'kg',
          cost: 100,
          timePhasedData: [
            { period: '第1周', beginningInventory: 0, grossRequirements: 0, scheduledReceipts: 0, projectedOnHand: 0, netRequirements: 50, plannedOrderReceipts: 50, plannedOrderReleases: 50 },
            { period: '第2周', beginningInventory: 0, grossRequirements: 100, scheduledReceipts: 50, projectedOnHand: -50, netRequirements: 100, plannedOrderReceipts: 100, plannedOrderReleases: 100 },
            { period: '第3周', beginningInventory: 0, grossRequirements: 150, scheduledReceipts: 100, projectedOnHand: -50, netRequirements: 150, plannedOrderReceipts: 150, plannedOrderReleases: 0 },
            { period: '第4周', beginningInventory: 0, grossRequirements: 0, scheduledReceipts: 150, projectedOnHand: 150, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 }
          ],
          relatedItems: [
            { parentItemCode: 'S001', parentItemName: '半成品B', quantityPer: 3, requiredQuantity: 210 },
            { parentItemCode: 'P001', parentItemName: '成品A', quantityPer: 0.5, requiredQuantity: 40 }
          ]
        },
        {
          itemCode: 'P002',
          itemName: '采购件D',
          itemType: 'purchased',
          currentStock: 200,
          safetyStock: 30,
          grossRequirement: 150,
          netRequirement: 0,
          plannedOrder: 0,
          dueDate: '2023-12-20',
          status: 'sufficient',
          supplier: '供应商B',
          leadTime: 3,
          unit: '个',
          cost: 50,
          timePhasedData: [
            { period: '第1周', beginningInventory: 200, grossRequirements: 50, scheduledReceipts: 0, projectedOnHand: 150, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 },
            { period: '第2周', beginningInventory: 150, grossRequirements: 30, scheduledReceipts: 0, projectedOnHand: 120, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 },
            { period: '第3周', beginningInventory: 120, grossRequirements: 40, scheduledReceipts: 0, projectedOnHand: 80, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 },
            { period: '第4周', beginningInventory: 80, grossRequirements: 30, scheduledReceipts: 0, projectedOnHand: 50, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 }
          ],
          relatedItems: [
            { parentItemCode: 'P001', parentItemName: '成品A', quantityPer: 1, requiredQuantity: 100 },
            { parentItemCode: 'S001', parentItemName: '半成品B', quantityPer: 0.5, requiredQuantity: 50 }
          ]
        },
        {
          itemCode: 'RM002',
          itemName: '原材料E',
          itemType: 'raw-material',
          currentStock: 100,
          safetyStock: 20,
          grossRequirement: 180,
          netRequirement: 0,
          plannedOrder: 100,
          dueDate: '2023-12-18',
          status: 'planned',
          supplier: '供应商C',
          leadTime: 7,
          unit: 'kg',
          cost: 80,
          timePhasedData: [
            { period: '第1周', beginningInventory: 100, grossRequirements: 60, scheduledReceipts: 0, projectedOnHand: 40, netRequirements: 0, plannedOrderReceipts: 0, plannedOrderReleases: 0 },
            { period: '第2周', beginningInventory: 40, grossRequirements: 50, scheduledReceipts: 0, projectedOnHand: -10, netRequirements: 30, plannedOrderReceipts: 30, plannedOrderReleases: 30 },
            { period: '第3周', beginningInventory: 0, grossRequirements: 40, scheduledReceipts: 30, projectedOnHand: -10, netRequirements: 30, plannedOrderReceipts: 30, plannedOrderReleases: 30 },
            { period: '第4周', beginningInventory: 0, grossRequirements: 30, scheduledReceipts: 30, projectedOnHand: 0, netRequirements: 20, plannedOrderReceipts: 20, plannedOrderReleases: 20 }
          ],
          relatedItems: [
            { parentItemCode: 'S001', parentItemName: '半成品B', quantityPer: 2, requiredQuantity: 140 },
            { parentItemCode: 'P001', parentItemName: '成品A', quantityPer: 0.5, requiredQuantity: 40 }
          ]
        }
      ],
      // 例外报告数据
      exceptionList: [
        {
          itemCode: 'RM001',
          itemName: '原材料C',
          exceptionType: '严重短缺',
          description: '当前库存为0，净需求300kg，超过安全库存50kg',
          suggestion: '紧急采购',
          date: '2023-12-01'
        },
        {
          itemCode: 'S001',
          itemName: '半成品B',
          exceptionType: '库存为负',
          description: '第1周期末库存为-10个，低于安全库存',
          suggestion: '提前生产',
          date: '2023-12-01'
        },
        {
          itemCode: 'P001',
          itemName: '成品A',
          exceptionType: '接近安全库存',
          description: '第1周期末库存为20个，等于安全库存',
          suggestion: '考虑补货',
          date: '2023-12-01'
        }
      ]
    };
  },
  computed: {
    // 计算概览数据
    totalItems() {
      return this.mrpResults.length;
    },
    shortfallItems() {
      return this.mrpResults.filter(item => item.status === 'shortfall').length;
    },
    plannedOrders() {
      return this.mrpResults.filter(item => item.plannedOrder > 0).length;
    },
    exceptionCount() {
      return this.exceptionList.length;
    },
    // 过滤后的结果
    filteredResults() {
      let results = [...this.mrpResults];
      
      // 按物料类型过滤
      if (this.filterForm.itemType) {
        results = results.filter(item => item.itemType === this.filterForm.itemType);
      }
      
      // 按状态过滤
      if (this.filterForm.status) {
        results = results.filter(item => item.status === this.filterForm.status);
      }
      
      // 按时间范围过滤
      if (this.filterForm.timeRange && this.filterForm.timeRange.length === 2) {
        const startDate = new Date(this.filterForm.timeRange[0]);
        const endDate = new Date(this.filterForm.timeRange[1]);
        results = results.filter(item => {
          const itemDate = new Date(item.dueDate);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
      
      return results;
    },
    // MRP矩阵数据
    mrpMatrixData() {
      return this.mrpResults.map(item => ({
        itemCode: item.itemCode,
        itemName: item.itemName,
        currentStock: item.currentStock,
        netRequirement: item.netRequirement,
        timeData: item.timePhasedData
      }));
    }
  },
  mounted() {
    // 初始化图表（这里可以集成echarts等图表库）
    this.initCharts();
  },
  methods: {
    // 获取物料类型标签类型
    getItemTypeTag(type) {
      const tagMap = {
        'finished': 'success',
        'semi-finished': 'primary',
        'raw-material': 'warning',
        'purchased': 'info'
      };
      return tagMap[type] || 'default';
    },
    // 获取物料类型名称
    getItemTypeName(type) {
      const nameMap = {
        'finished': '成品',
        'semi-finished': '半成品',
        'raw-material': '原材料',
        'purchased': '采购件'
      };
      return nameMap[type] || type;
    },
    // 获取状态标签类型
    getStatusTag(status) {
      const tagMap = {
        'sufficient': 'success',
        'shortfall': 'danger',
        'planned': 'warning'
      };
      return tagMap[status] || 'default';
    },
    // 获取状态名称
    getStatusName(status) {
      const nameMap = {
        'sufficient': '充足',
        'shortfall': '短缺',
        'planned': '计划中'
      };
      return nameMap[status] || status;
    },
    // 应用过滤器
    applyFilter() {
      this.currentPage = 1;
      // 这里可以添加过滤逻辑的额外处理
    },
    // 重置过滤器
    resetFilter() {
      this.filterForm = {
        itemType: '',
        status: '',
        timeRange: null
      };
      this.currentPage = 1;
    },
    // 处理分页变化
    handleCurrentChange(val) {
      this.currentPage = val;
    },
    // 查看物料详情
    viewItemDetails(item) {
      this.selectedItem = item;
      this.itemDetailsVisible = true;
    },
    // 生成采购订单
    generatePurchaseOrder(item) {
      this.selectedItem = item;
      this.purchaseOrderForm = {
        quantity: item.netRequirement,
        supplier: item.supplier || '',
        expectedDate: new Date(),
        remark: `MRP计算自动生成 - ${item.itemCode}`
      };
      this.purchaseOrderVisible = true;
    },
    // 确认生成采购订单
    confirmPurchaseOrder() {
      // 这里添加采购订单生成逻辑
      this.$message.success('采购订单生成成功');
      this.purchaseOrderVisible = false;
    },
    // 导出报告
    exportReport() {
      // 这里添加导出报告逻辑
      this.$message.success('报告导出成功');
    },
    // 返回计算页面
    backToCalculation() {
      this.$router.push('/quotation/mrp-calculation');
    },
    // 初始化图表
    initCharts() {
      // 在实际应用中，这里可以集成echarts等图表库
      console.log('初始化图表');
      // 这里是占位，实际项目中应该使用真实的图表库
    }
  }
};
</script>

<style scoped>
.mrp-result-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.overview-section {
  margin-bottom: 30px;
}

.overview-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.card-value.shortfall {
  color: #f56c6c;
}

.card-value.alert {
  color: #e6a23c;
}

.filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.view-mode-section {
  margin-bottom: 20px;
}

.result-table-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-section {
  margin-top: 20px;
  text-align: right;
}

.chart-section {
  margin-bottom: 30px;
}

.chart-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #303133;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.matrix-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.exception-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.exception-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

.item-details {
  padding: 10px 0;
}

.purchase-order-form {
  padding: 10px 0;
}

.shortfall-value {
  color: #f56c6c;
  font-weight: bold;
}

.el-table tbody tr:hover {
  background-color: #f5f7fa;
}
</style>