<template>
  <div class="mrp-netting-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>MRP净需求计算</h2>
      <div class="header-actions">
        <el-button type="primary" @click="calculateNetRequirements">计算净需求</el-button>
        <el-button @click="resetCalculation">重置</el-button>
        <el-button @click="saveScenario">保存方案</el-button>
      </div>
    </div>

    <!-- 物料选择和基本信息 -->
    <div class="material-selection-section">
      <el-form :inline="true" :model="materialForm" class="material-form">
        <el-form-item label="物料编码">
          <el-select v-model="materialForm.itemCode" placeholder="选择物料" @change="onMaterialChange">
            <el-option 
              v-for="item in availableMaterials" 
              :key="item.itemCode" 
              :label="`${item.itemCode} - ${item.itemName}`" 
              :value="item.itemCode"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="materialForm.itemName" disabled></el-input>
        </el-form-item>
        <el-form-item label="物料类型">
          <el-input v-model="materialForm.itemType" disabled></el-input>
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="materialForm.unit" disabled></el-input>
        </el-form-item>
      </el-form>
    </div>

    <!-- 计算参数设置 -->
    <div class="parameters-section">
      <h3>计算参数</h3>
      <el-form :model="calculationParams" class="params-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="计划周期" :required="true">
              <el-select v-model="calculationParams.periodType" placeholder="选择周期类型">
                <el-option label="周" value="week"></el-option>
                <el-option label="日" value="day"></el-option>
                <el-option label="月" value="month"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计划期数" :required="true">
              <el-input-number v-model="calculationParams.periodCount" :min="1" :max="24" :step="1"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="计算起始日期" :required="true">
              <el-date-picker v-model="calculationParams.startDate" type="date" placeholder="选择日期"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="当前库存" :required="true">
              <el-input-number v-model="calculationParams.currentStock" :min="0" :step="1"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="安全库存" :required="true">
              <el-input-number v-model="calculationParams.safetyStock" :min="0" :step="1"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="提前期(天)" :required="true">
              <el-input-number v-model="calculationParams.leadTime" :min="1" :step="1"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px;">批量规则</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="批量政策" :required="true">
              <el-select v-model="calculationParams.lotPolicy" placeholder="选择批量政策">
                <el-option label="按需订购(Lot-for-Lot)" value="lfl"></el-option>
                <el-option label="固定批量(Fixed Order Quantity)" value="foq"></el-option>
                <el-option label="经济订购量(EOQ)" value="eoq"></el-option>
                <el-option label="定期订购(Period Order Quantity)" value="poq"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="批量大小" v-if="calculationParams.lotPolicy === 'foq'">
              <el-input-number v-model="calculationParams.lotSize" :min="1" :step="1"></el-input-number>
            </el-form-item>
            <el-form-item label="订购周期" v-if="calculationParams.lotPolicy === 'poq'">
              <el-input-number v-model="calculationParams.orderPeriod" :min="1" :step="1"></el-input-number>
            </el-form-item>
            <el-form-item v-else>
              <el-input disabled placeholder="不适用"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最大库存">
              <el-input-number v-model="calculationParams.maxStock" :min="0" :step="1"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 需求和供应数据编辑 -->
    <div class="data-editing-section">
      <div class="section-tabs">
        <el-tabs v-model="activeTab">
          <el-tab-pane label="毛需求" name="grossRequirements">
            <div class="table-container">
              <el-table :data="grossRequirementsData" style="width: 100%" border>
                <el-table-column prop="period" label="周期" width="80"></el-table-column>
                <el-table-column prop="date" label="日期" width="120"></el-table-column>
                <el-table-column prop="quantity" label="毛需求数量" width="150">
                  <template slot-scope="scope">
                    <el-input-number 
                      v-model="scope.row.quantity" 
                      :min="0" 
                      :step="1" 
                      size="small"
                    ></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="source" label="需求来源" width="120">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.source" placeholder="来源" size="small">
                      <el-option label="销售订单" value="sales"></el-option>
                      <el-option label="预测" value="forecast"></el-option>
                      <el-option label="计划订单" value="planned"></el-option>
                      <el-option label="其他" value="other"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="reference" label="参考单号" width="150">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.reference" size="small"></el-input>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template slot-scope="scope">
                    <el-button type="danger" size="small" icon="el-icon-delete" @click="removeGrossRequirement(scope.$index)"></el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div style="margin-top: 10px; text-align: right;">
                <el-button type="primary" size="small" @click="addGrossRequirement">添加需求行</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="计划接收量" name="scheduledReceipts">
            <div class="table-container">
              <el-table :data="scheduledReceiptsData" style="width: 100%" border>
                <el-table-column prop="period" label="周期" width="80"></el-table-column>
                <el-table-column prop="date" label="日期" width="120">
                  <template slot-scope="scope">
                    <el-date-picker 
                      v-model="scope.row.date" 
                      type="date" 
                      size="small"
                      placeholder="选择日期"
                    ></el-date-picker>
                  </template>
                </el-table-column>
                <el-table-column prop="quantity" label="接收数量" width="150">
                  <template slot-scope="scope">
                    <el-input-number 
                      v-model="scope.row.quantity" 
                      :min="0" 
                      :step="1" 
                      size="small"
                    ></el-input-number>
                  </template>
                </el-table-column>
                <el-table-column prop="source" label="来源" width="120">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.source" placeholder="来源" size="small">
                      <el-option label="采购订单" value="po"></el-option>
                      <el-option label="生产订单" value="mo"></el-option>
                      <el-option label="其他" value="other"></el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="reference" label="参考单号" width="150">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.reference" size="small"></el-input>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template slot-scope="scope">
                    <el-button type="danger" size="small" icon="el-icon-delete" @click="removeScheduledReceipt(scope.$index)"></el-button>
                  </template>
                </el-table-column>
              </el-table>
              <div style="margin-top: 10px; text-align: right;">
                <el-button type="primary" size="small" @click="addScheduledReceipt">添加接收行</el-button>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="库存预计" name="onHand">
            <div class="table-container">
              <el-table :data="onHandData" style="width: 100%" border>
                <el-table-column prop="period" label="周期" width="80"></el-table-column>
                <el-table-column prop="date" label="日期" width="120"></el-table-column>
                <el-table-column prop="beginning" label="期初库存" width="120"></el-table-column>
                <el-table-column prop="receipts" label="计划接收" width="120"></el-table-column>
                <el-table-column prop="requirements" label="毛需求" width="120"></el-table-column>
                <el-table-column prop="projected" label="预计可用量" width="120">
                  <template slot-scope="scope">
                    <span :class="{ 'shortfall-cell': scope.row.projected < 0 }">
                      {{ scope.row.projected }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="safetyStock" label="安全库存" width="120"></el-table-column>
                <el-table-column prop="netRequirement" label="净需求" width="120">
                  <template slot-scope="scope">
                    <span :class="{ 'requirement-cell': scope.row.netRequirement > 0 }">
                      {{ scope.row.netRequirement }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 净需求计算结果 -->
    <div class="results-section" v-if="calculationResults.length > 0">
      <h3>计算结果</h3>
      <div class="results-tabs">
        <el-tabs v-model="resultsTab">
          <el-tab-pane label="计划订单" name="plannedOrders">
            <div class="table-container">
              <el-table :data="calculationResults" style="width: 100%" border>
                <el-table-column prop="period" label="需求周期" width="100"></el-table-column>
                <el-table-column prop="dueDate" label="到期日期" width="120"></el-table-column>
                <el-table-column prop="orderPeriod" label="订单周期" width="100"></el-table-column>
                <el-table-column prop="releaseDate" label="下达日期" width="120"></el-table-column>
                <el-table-column prop="netRequirement" label="净需求" width="100"></el-table-column>
                <el-table-column prop="plannedOrder" label="计划订单数量" width="120"></el-table-column>
                <el-table-column prop="lotSize" label="批量大小" width="100"></el-table-column>
                <el-table-column prop="orderAction" label="建议操作" width="120">
                  <template slot-scope="scope">
                    <el-tag :type="getActionType(scope.row.orderAction)">
                      {{ getActionName(scope.row.orderAction) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" fixed="right">
                  <template slot-scope="scope">
                    <el-button type="primary" size="small" @click="viewOrderDetails(scope.row)">查看详情</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="时间分段视图" name="timePhased">
            <div class="table-container">
              <time-phased-view :data="timePhasedData"></time-phased-view>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="例外信息" name="exceptions">
            <div class="table-container">
              <el-table :data="exceptionMessages" style="width: 100%" border>
                <el-table-column prop="period" label="周期" width="100"></el-table-column>
                <el-table-column prop="type" label="类型" width="100">
                  <template slot-scope="scope">
                    <el-tag :type="getExceptionTypeTag(scope.row.type)">
                      {{ scope.row.type }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="描述" width="600"></el-table-column>
                <el-table-column prop="suggestion" label="建议" width="200"></el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 图表分析 -->
    <div class="chart-section" v-if="calculationResults.length > 0">
      <h3>需求分析图表</h3>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-title">库存与需求趋势</div>
            <div class="chart-container" ref="inventoryChart"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-title">计划订单分布</div>
            <div class="chart-container" ref="orderChart"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 计划订单详情对话框 -->
    <el-dialog
      title="计划订单详情"
      :visible.sync="orderDetailsVisible"
      width="600px"
    >
      <div v-if="selectedOrder" class="order-details">
        <el-form :model="selectedOrder" label-width="120px">
          <el-form-item label="物料编码">
            {{ materialForm.itemCode }}
          </el-form-item>
          <el-form-item label="物料名称">
            {{ materialForm.itemName }}
          </el-form-item>
          <el-form-item label="需求周期">
            {{ selectedOrder.period }}
          </el-form-item>
          <el-form-item label="到期日期">
            {{ selectedOrder.dueDate }}
          </el-form-item>
          <el-form-item label="下达日期">
            {{ selectedOrder.releaseDate }}
          </el-form-item>
          <el-form-item label="净需求数量">
            {{ selectedOrder.netRequirement }}
          </el-form-item>
          <el-form-item label="计划订单数量">
            <el-input-number v-model="selectedOrder.plannedOrder" :min="1" :step="1"></el-input-number>
          </el-form-item>
          <el-form-item label="建议操作">
            <el-select v-model="selectedOrder.orderAction" placeholder="选择操作">
              <el-option label="下达订单" value="release"></el-option>
              <el-option label="推迟" value="postpone"></el-option>
              <el-option label="提前" value="expedite"></el-option>
              <el-option label="取消" value="cancel"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="selectedOrder.remark"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="orderDetailsVisible = false">关闭</el-button>
        <el-button type="primary" @click="saveOrderDetails">保存修改</el-button>
      </div>
    </el-dialog>

    <!-- 保存方案对话框 -->
    <el-dialog
      title="保存方案"
      :visible.sync="saveScenarioVisible"
      width="400px"
    >
      <el-form :model="scenarioForm" :rules="scenarioRules" ref="scenarioForm" label-width="80px">
        <el-form-item label="方案名称" prop="name">
          <el-input v-model="scenarioForm.name" placeholder="请输入方案名称"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="scenarioForm.description" placeholder="请输入方案描述"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="saveScenarioVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveScenario">确认保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
// 导入时间分段视图组件
import TimePhasedView from './components/TimePhasedView.vue';

export default {
  name: 'MrpNetting',
  components: {
    TimePhasedView
  },
  data() {
    return {
      // 当前激活的标签页
      activeTab: 'grossRequirements',
      resultsTab: 'plannedOrders',
      // 物料选择表单
      materialForm: {
        itemCode: '',
        itemName: '',
        itemType: '',
        unit: ''
      },
      // 计算参数
      calculationParams: {
        periodType: 'week',
        periodCount: 8,
        startDate: new Date(),
        currentStock: 100,
        safetyStock: 20,
        leadTime: 10,
        lotPolicy: 'lfl',
        lotSize: 0,
        orderPeriod: 1,
        maxStock: 0
      },
      // 可用物料列表
      availableMaterials: [
        { itemCode: 'RM001', itemName: '原材料C', itemType: '原材料', unit: 'kg' },
        { itemCode: 'RM002', itemName: '原材料E', itemType: '原材料', unit: 'kg' },
        { itemCode: 'S001', itemName: '半成品B', itemType: '半成品', unit: '个' },
        { itemCode: 'P001', itemName: '成品A', itemType: '成品', unit: '个' },
        { itemCode: 'P002', itemName: '采购件D', itemType: '采购件', unit: '个' }
      ],
      // 毛需求数据
      grossRequirementsData: [
        { period: 1, date: '2023-12-01', quantity: 50, source: 'sales', reference: 'SO1001' },
        { period: 2, date: '2023-12-08', quantity: 30, source: 'sales', reference: 'SO1002' },
        { period: 3, date: '2023-12-15', quantity: 40, source: 'forecast', reference: 'FC202312' },
        { period: 4, date: '2023-12-22', quantity: 30, source: 'sales', reference: 'SO1003' }
      ],
      // 计划接收量数据
      scheduledReceiptsData: [
        { period: 2, date: '2023-12-10', quantity: 50, source: 'po', reference: 'PO2001' },
        { period: 4, date: '2023-12-25', quantity: 30, source: 'mo', reference: 'MO3001' }
      ],
      // 库存预计数据
      onHandData: [],
      // 计算结果数据
      calculationResults: [],
      // 时间分段数据
      timePhasedData: [],
      // 例外信息
      exceptionMessages: [],
      // 对话框状态
      orderDetailsVisible: false,
      saveScenarioVisible: false,
      // 选中的订单
      selectedOrder: null,
      // 方案保存表单
      scenarioForm: {
        name: '',
        description: ''
      },
      scenarioRules: {
        name: [
          { required: true, message: '请输入方案名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ]
      }
    };
  },
  methods: {
    // 物料选择变化处理
    onMaterialChange(value) {
      const selectedMaterial = this.availableMaterials.find(m => m.itemCode === value);
      if (selectedMaterial) {
        this.materialForm = { ...selectedMaterial };
        // 重置相关数据
        this.resetCalculation();
      }
    },
    
    // 添加毛需求行
    addGrossRequirement() {
      const newPeriod = this.grossRequirementsData.length > 0 
        ? Math.max(...this.grossRequirementsData.map(item => item.period)) + 1 
        : 1;
      
      this.grossRequirementsData.push({
        period: newPeriod,
        date: '',
        quantity: 0,
        source: 'sales',
        reference: ''
      });
    },
    
    // 移除毛需求行
    removeGrossRequirement(index) {
      this.grossRequirementsData.splice(index, 1);
      // 重新计算周期号
      this.grossRequirementsData.forEach((item, i) => {
        item.period = i + 1;
      });
    },
    
    // 添加计划接收行
    addScheduledReceipt() {
      this.scheduledReceiptsData.push({
        period: 0,
        date: '',
        quantity: 0,
        source: 'po',
        reference: ''
      });
    },
    
    // 移除计划接收行
    removeScheduledReceipt(index) {
      this.scheduledReceiptsData.splice(index, 1);
    },
    
    // 计算净需求
    calculateNetRequirements() {
      // 重置结果
      this.onHandData = [];
      this.calculationResults = [];
      this.exceptionMessages = [];
      
      const { periodCount, currentStock, safetyStock, leadTime } = this.calculationParams;
      
      // 计算每个周期的库存预计和净需求
      let beginningInventory = currentStock;
      
      for (let period = 1; period <= periodCount; period++) {
        // 获取当前周期的毛需求
        const grossReq = this.grossRequirementsData.find(item => item.period === period)?.quantity || 0;
        // 获取当前周期的计划接收量
        const scheduledRec = this.scheduledReceiptsData.find(item => item.period === period)?.quantity || 0;
        
        // 计算预计可用量
        const projectedOnHand = beginningInventory + scheduledRec - grossReq;
        
        // 计算净需求
        let netRequirement = 0;
        if (projectedOnHand < safetyStock) {
          netRequirement = safetyStock - projectedOnHand;
        }
        
        // 添加到库存预计数据
        this.onHandData.push({
          period: period,
          date: this.getPeriodDate(period),
          beginning: beginningInventory,
          receipts: scheduledRec,
          requirements: grossReq,
          projected: projectedOnHand,
          safetyStock: safetyStock,
          netRequirement: netRequirement
        });
        
        // 更新期初库存
        beginningInventory = projectedOnHand;
        
        // 检查例外情况
        if (projectedOnHand < 0) {
          this.exceptionMessages.push({
            period: period,
            type: '库存为负',
            message: `第${period}周期预计可用量为${projectedOnHand}，低于零`,
            suggestion: '考虑增加计划接收量或调整需求'
          });
        } else if (projectedOnHand < safetyStock && projectedOnHand >= 0) {
          this.exceptionMessages.push({
            period: period,
            type: '低于安全库存',
            message: `第${period}周期预计可用量为${projectedOnHand}，低于安全库存${safetyStock}`,
            suggestion: '考虑补货'
          });
        }
      }
      
      // 生成计划订单
      this.generatePlannedOrders();
      
      // 生成时间分段数据
      this.generateTimePhasedData();
      
      // 初始化图表
      this.initCharts();
      
      this.$message.success('净需求计算完成');
    },
    
    // 生成计划订单
    generatePlannedOrders() {
      const { leadTime, lotPolicy, lotSize, orderPeriod, maxStock } = this.calculationParams;
      const leadTimePeriods = Math.ceil(leadTime / 7); // 假设周期是周
      
      // 收集有净需求的周期
      const netRequirementPeriods = this.onHandData.filter(item => item.netRequirement > 0);
      
      if (lotPolicy === 'lfl') {
        // 按需订购
        netRequirementPeriods.forEach(item => {
          const orderQuantity = item.netRequirement;
          const releasePeriod = Math.max(1, item.period - leadTimePeriods);
          
          this.calculationResults.push({
            period: item.period,
            dueDate: this.getPeriodDate(item.period),
            orderPeriod: releasePeriod,
            releaseDate: this.getPeriodDate(releasePeriod),
            netRequirement: item.netRequirement,
            plannedOrder: orderQuantity,
            lotSize: orderQuantity,
            orderAction: releasePeriod === 1 ? 'release' : 'planned',
            remark: ''
          });
        });
      } else if (lotPolicy === 'foq') {
        // 固定批量
        netRequirementPeriods.forEach(item => {
          // 计算需要多少个固定批量
          const quantityNeeded = item.netRequirement;
          const orderQuantity = Math.ceil(quantityNeeded / lotSize) * lotSize;
          const releasePeriod = Math.max(1, item.period - leadTimePeriods);
          
          this.calculationResults.push({
            period: item.period,
            dueDate: this.getPeriodDate(item.period),
            orderPeriod: releasePeriod,
            releaseDate: this.getPeriodDate(releasePeriod),
            netRequirement: item.netRequirement,
            plannedOrder: orderQuantity,
            lotSize: lotSize,
            orderAction: releasePeriod === 1 ? 'release' : 'planned',
            remark: ''
          });
        });
      } else if (lotPolicy === 'poq') {
        // 定期订购
        // 按订购周期合并需求
        const groupedRequirements = {};
        netRequirementPeriods.forEach(item => {
          const groupKey = Math.ceil(item.period / orderPeriod) * orderPeriod;
          if (!groupedRequirements[groupKey]) {
            groupedRequirements[groupKey] = 0;
          }
          groupedRequirements[groupKey] += item.netRequirement;
        });
        
        // 为每个订购周期生成计划订单
        Object.keys(groupedRequirements).forEach(groupKey => {
          const period = parseInt(groupKey);
          const quantityNeeded = groupedRequirements[groupKey];
          const releasePeriod = Math.max(1, period - leadTimePeriods);
          
          this.calculationResults.push({
            period: period,
            dueDate: this.getPeriodDate(period),
            orderPeriod: releasePeriod,
            releaseDate: this.getPeriodDate(releasePeriod),
            netRequirement: quantityNeeded,
            plannedOrder: quantityNeeded,
            lotSize: quantityNeeded,
            orderAction: releasePeriod === 1 ? 'release' : 'planned',
            remark: ''
          });
        });
      }
      
      // 按到期日期排序
      this.calculationResults.sort((a, b) => a.period - b.period);
    },
    
    // 生成时间分段数据
    generateTimePhasedData() {
      const { currentStock, safetyStock } = this.calculationParams;
      
      this.timePhasedData = this.onHandData.map(item => {
        // 查找该周期的计划订单
        const plannedOrder = this.calculationResults.find(order => order.period === item.period)?.plannedOrder || 0;
        const plannedRelease = this.calculationResults.find(order => order.orderPeriod === item.period)?.plannedOrder || 0;
        
        return {
          period: item.period,
          beginningInventory: item.beginning,
          scheduledReceipts: item.receipts,
          grossRequirements: item.requirements,
          projectedOnHand: item.projected,
          netRequirements: item.netRequirement,
          plannedOrderReceipts: plannedOrder,
          plannedOrderReleases: plannedRelease,
          safetyStock: safetyStock
        };
      });
    },
    
    // 获取周期对应的日期
    getPeriodDate(period) {
      const { periodType, startDate } = this.calculationParams;
      const date = new Date(startDate);
      
      if (periodType === 'week') {
        date.setDate(date.getDate() + (period - 1) * 7);
      } else if (periodType === 'day') {
        date.setDate(date.getDate() + (period - 1));
      } else if (periodType === 'month') {
        date.setMonth(date.getMonth() + (period - 1));
      }
      
      return date.toISOString().split('T')[0];
    },
    
    // 查看订单详情
    viewOrderDetails(order) {
      this.selectedOrder = { ...order };
      this.orderDetailsVisible = true;
    },
    
    // 保存订单详情
    saveOrderDetails() {
      // 找到并更新原订单数据
      const index = this.calculationResults.findIndex(order => 
        order.period === this.selectedOrder.period && 
        order.dueDate === this.selectedOrder.dueDate
      );
      
      if (index !== -1) {
        this.calculationResults[index] = { ...this.selectedOrder };
        // 重新生成时间分段数据
        this.generateTimePhasedData();
        this.$message.success('订单详情已更新');
      }
      
      this.orderDetailsVisible = false;
    },
    
    // 重置计算
    resetCalculation() {
      this.onHandData = [];
      this.calculationResults = [];
      this.exceptionMessages = [];
      this.timePhasedData = [];
    },
    
    // 保存方案
    saveScenario() {
      this.scenarioForm = {
        name: '',
        description: ''
      };
      this.saveScenarioVisible = true;
    },
    
    // 确认保存方案
    confirmSaveScenario() {
      this.$refs.scenarioForm.validate((valid) => {
        if (valid) {
          // 这里添加保存方案的逻辑
          this.$message.success('方案保存成功');
          this.saveScenarioVisible = false;
        }
      });
    },
    
    // 获取操作类型标签
    getActionType(action) {
      const typeMap = {
        'release': 'primary',
        'planned': 'info',
        'postpone': 'warning',
        'expedite': 'danger',
        'cancel': 'default'
      };
      return typeMap[action] || 'default';
    },
    
    // 获取操作名称
    getActionName(action) {
      const nameMap = {
        'release': '下达订单',
        'planned': '计划中',
        'postpone': '推迟',
        'expedite': '提前',
        'cancel': '取消'
      };
      return nameMap[action] || action;
    },
    
    // 获取例外类型标签
    getExceptionTypeTag(type) {
      if (type === '库存为负') {
        return 'danger';
      } else if (type === '低于安全库存') {
        return 'warning';
      } else {
        return 'info';
      }
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
.mrp-netting-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.material-selection-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.parameters-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.parameters-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

.params-form {
  margin-top: 10px;
}

.data-editing-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-tabs {
  margin-top: 10px;
}

.table-container {
  margin-top: 15px;
}

.results-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.results-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

.results-tabs {
  margin-top: 10px;
}

.chart-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #303133;
}

.chart-card {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
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

.order-details {
  padding: 10px 0;
}

.shortfall-cell {
  color: #f56c6c;
  font-weight: bold;
}

.requirement-cell {
  color: #e6a23c;
  font-weight: bold;
}

.el-table tbody tr:hover {
  background-color: #f5f7fa;
}
</style>