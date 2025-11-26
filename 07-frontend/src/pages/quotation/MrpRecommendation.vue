<template>
  <div class="mrp-recommendation-container">
    <!-- 页面标题 -->
    <el-card class="page-header-card" shadow="never">
      <div class="page-header">
        <h2 class="page-title">MRP采购与生产推荐</h2>
        <div class="page-description">基于MRP计算结果，生成智能采购和生产建议，优化库存和生产计划</div>
      </div>
    </el-card>

    <!-- 操作工具栏 -->
    <el-card class="toolbar-card" shadow="never">
      <div class="toolbar">
        <div class="left-actions">
          <el-button type="primary" @click="generateRecommendations" :loading="generatingRecommendations">
            <i class="el-icon-lightning"></i> 生成推荐
          </el-button>
          <el-button @click="refreshRecommendations">
            <i class="el-icon-refresh"></i> 刷新
          </el-button>
        </div>
        <div class="right-actions">
          <el-button @click="exportRecommendations">
            <i class="el-icon-download"></i> 导出推荐
          </el-button>
          <el-button @click="saveAsScenario">
            <i class="el-icon-save"></i> 保存方案
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 推荐规则设置 -->
    <el-card class="rules-card">
      <div slot="header" class="rules-header">
        <span>推荐规则设置</span>
      </div>
      
      <div class="rules-content">
        <el-form :inline="true" :model="recommendationRules" class="inline-form">
          <!-- 时间范围设置 -->
          <el-form-item label="计划周期:">
            <el-select v-model="recommendationRules.planHorizon" placeholder="选择计划周期" style="width: 140px;">
              <el-option label="1周" :value="7"></el-option>
              <el-option label="2周" :value="14"></el-option>
              <el-option label="1个月" :value="30"></el-option>
              <el-option label="3个月" :value="90"></el-option>
              <el-option label="6个月" :value="180"></el-option>
            </el-select>
          </el-form-item>
          
          <!-- 优化目标 -->
          <el-form-item label="优化目标:">
            <el-select v-model="recommendationRules.optimizationGoal" placeholder="选择优化目标" style="width: 160px;">
              <el-option label="最低库存成本" :value="'minInventoryCost'"></el-option>
              <el-option label="最小订单次数" :value="'minOrderCount'"></el-option>
              <el-option label="平衡库存与采购" :value="'balanced'"></el-option>
              <el-option label="最大周转率" :value="'maxTurnover'"></el-option>
            </el-select>
          </el-form-item>
          
          <!-- 供应商交付优先级 -->
          <el-form-item label="供应商优先级:">
            <el-select v-model="recommendationRules.supplierPriority" placeholder="供应商优先级" style="width: 160px;">
              <el-option label="成本优先" :value="'cost'"></el-option>
              <el-option label="交付时间优先" :value="'leadTime'"></el-option>
              <el-option label="质量优先" :value="'quality'"></el-option>
              <el-option label="综合评分" :value="'comprehensive'"></el-option>
            </el-select>
          </el-form-item>
          
          <!-- 库存策略 -->
          <el-form-item label="库存策略:">
            <el-select v-model="recommendationRules.inventoryStrategy" placeholder="库存策略" style="width: 140px;">
              <el-option label="安全库存" :value="'safetyStock'"></el-option>
              <el-option label="JIT准时制" :value="'jit'"></el-option>
              <el-option label="最小最大库存" :value="'minMax'"></el-option>
              <el-option label="经济批量" :value="'eoq'"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
        
        <!-- 高级选项 -->
        <div class="advanced-options">
          <h3>高级选项</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form :model="advancedOptions" class="advanced-form">
                <el-form-item label="合并订单阈值:">
                  <el-input-number v-model="advancedOptions.orderMergeThreshold" :min="0" :step="1" :precision="0" style="width: 120px;">
                    <template slot="append">%</template>
                  </el-input-number>
                </el-form-item>
                
                <el-form-item label="短缺预警天数:">
                  <el-input-number v-model="advancedOptions.shortageAlertDays" :min="1" :step="1" style="width: 120px;">
                    <template slot="append">天</template>
                  </el-input-number>
                </el-form-item>
                
                <el-form-item label="生产批次优化:">
                  <el-switch v-model="advancedOptions.optimizeProductionBatch"></el-switch>
                </el-form-item>
              </el-form>
            </el-col>
            
            <el-col :span="12">
              <el-form :model="advancedOptions" class="advanced-form">
                <el-form-item label="考虑产能限制:">
                  <el-switch v-model="advancedOptions.considerCapacity"></el-switch>
                </el-form-item>
                
                <el-form-item label="考虑在途订单:">
                  <el-switch v-model="advancedOptions.considerInTransit"></el-switch>
                </el-form-item>
                
                <el-form-item label="考虑替代物料:">
                  <el-switch v-model="advancedOptions.considerSubstitutes"></el-switch>
                </el-form-item>
              </el-form>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 推荐概览 -->
    <el-card class="overview-card" v-if="recommendationsData.length > 0">
      <div slot="header" class="overview-header">
        <span>推荐概览</span>
      </div>
      
      <div class="overview-stats">
        <el-statistic :value="totalRecommendations" suffix="项" title="总推荐项" :precision="0"></el-statistic>
        <el-statistic :value="purchaseRecommendations" suffix="项" title="采购推荐" :precision="0"></el-statistic>
        <el-statistic :value="productionRecommendations" suffix="项" title="生产推荐" :precision="0"></el-statistic>
        <el-statistic :value="urgentRecommendations" suffix="项" title="紧急推荐" :precision="0"></el-statistic>
        <el-statistic :value="estimatedCost" suffix="元" title="预计总成本" :precision="2" :formatter="(value) => `¥${value.toLocaleString()}`"></el-statistic>
      </div>
      
      <!-- 优化指标 -->
      <div class="optimization-metrics">
        <h3>优化指标</h3>
        <el-progress :percentage="inventoryCostReduction" status="success" :format="() => `库存成本降低: ${inventoryCostReduction}%`"></el-progress>
        <el-progress :percentage="orderCountReduction" status="info" :format="() => `订单数量减少: ${orderCountReduction}%`"></el-progress>
        <el-progress :percentage="shortageRiskReduction" status="warning" :format="() => `短缺风险降低: ${shortageRiskReduction}%`"></el-progress>
      </div>
    </el-card>

    <!-- 筛选和视图切换 -->
    <el-card class="filter-view-card" v-if="recommendationsData.length > 0">
      <div class="filter-view-content">
        <div class="filter-section">
          <el-form :inline="true" :model="filterParams" class="filter-form">
            <el-form-item label="物料类型:">
              <el-select v-model="filterParams.materialType" placeholder="物料类型" style="width: 120px;">
                <el-option label="全部" :value="''"></el-option>
                <el-option label="原材料" :value="'RM'"></el-option>
                <el-option label="半成品" :value="'SFG'"></el-option>
                <el-option label="成品" :value="'FG'"></el-option>
                <el-option label="外购件" :value="'PUR'"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="推荐类型:">
              <el-select v-model="filterParams.recommendationType" placeholder="推荐类型" style="width: 120px;">
                <el-option label="全部" :value="''"></el-option>
                <el-option label="采购" :value="'purchase'"></el-option>
                <el-option label="生产" :value="'production'"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="紧急程度:">
              <el-select v-model="filterParams.priority" placeholder="紧急程度" style="width: 120px;">
                <el-option label="全部" :value="''"></el-option>
                <el-option label="紧急" :value="'high'"></el-option>
                <el-option label="一般" :value="'medium'"></el-option>
                <el-option label="常规" :value="'low'"></el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="applyFilter">筛选</el-button>
              <el-button @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
        
        <div class="view-section">
          <span class="view-label">视图方式:</span>
          <el-radio-group v-model="viewMode" size="small">
            <el-radio-button label="table">表格视图</el-radio-button>
            <el-radio-button label="gantt">甘特图</el-radio-button>
            <el-radio-button label="kanban">看板视图</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </el-card>

    <!-- 推荐列表表格视图 -->
    <el-card class="recommendations-card" v-if="recommendationsData.length > 0 && viewMode === 'table'">
      <div slot="header" class="recommendations-header">
        <div class="recommendations-title">推荐列表</div>
        <div class="batch-actions">
          <el-checkbox v-model="selectAll" @change="handleSelectAll">全选</el-checkbox>
          <el-button type="danger" @click="batchDelete" :disabled="selectedRecommendations.length === 0">批量删除</el-button>
          <el-button type="primary" @click="batchApply" :disabled="selectedRecommendations.length === 0">批量应用</el-button>
        </div>
      </div>
      
      <el-table 
        :data="filteredRecommendations" 
        style="width: 100%"
        @selection-change="handleSelectionChange"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="120"></el-table-column>
        <el-table-column prop="materialName" label="物料名称" width="180"></el-table-column>
        <el-table-column prop="materialType" label="物料类型" width="100">
          <template slot-scope="scope">
            {{ getMaterialTypeText(scope.row.materialType) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="推荐类型" width="100">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === 'purchase' ? 'success' : 'warning'">
              {{ scope.row.type === 'purchase' ? '采购' : '生产' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="建议数量" width="100" align="right"></el-table-column>
        <el-table-column prop="unit" label="单位" width="80"></el-table-column>
        <el-table-column prop="recommendedDate" label="建议日期" width="120"></el-table-column>
        <el-table-column prop="dueDate" label="需求日期" width="120"></el-table-column>
        <el-table-column prop="priority" label="紧急程度" width="100">
          <template slot-scope="scope">
            <el-tag :type="getPriorityType(scope.row.priority)">
              {{ getPriorityText(scope.row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplierName" label="供应商" width="120" v-if="showSupplierColumn"></el-table-column>
        <el-table-column prop="estimatedCost" label="预计成本" width="120" align="right">
          <template slot-scope="scope">
            {{ formatCurrency(scope.row.estimatedCost) }}
          </template>
        </el-table-column>
        <el-table-column prop="savings" label="预计节省" width="120" align="right">
          <template slot-scope="scope">
            <span class="savings-amount" v-if="scope.row.savings > 0">
              {{ formatCurrency(scope.row.savings) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="推荐原因" width="150"></el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template slot-scope="scope">
            <el-button size="mini" @click="viewDetail(scope.row)">详情</el-button>
            <el-button size="mini" type="primary" @click="applyRecommendation(scope.row)">应用</el-button>
            <el-button size="mini" type="danger" @click="deleteRecommendation(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper, sizes, total"
          :total="filteredRecommendations.length"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :current-page="currentPage"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 甘特图视图 -->
    <el-card class="gantt-card" v-if="recommendationsData.length > 0 && viewMode === 'gantt'">
      <div slot="header" class="gantt-header">
        <span>时间排程甘特图</span>
      </div>
      
      <div class="gantt-container">
        <!-- 简化版甘特图实现 -->
        <div class="gantt-chart">
          <!-- 时间轴 -->
          <div class="gantt-timeline">
            <div class="timeline-header">时间轴</div>
            <div class="timeline-days">
              <div v-for="day in timelineDays" :key="day" class="day-column">
                {{ formatTimelineDay(day) }}
              </div>
            </div>
          </div>
          
          <!-- 任务行 -->
          <div class="gantt-tasks">
            <div v-for="(item, index) in filteredRecommendations" :key="item.id" class="task-row">
              <div class="task-info">
                <div class="task-name">{{ item.materialName }}</div>
                <div class="task-details">
                  {{ item.type === 'purchase' ? '采购' : '生产' }} - {{ item.quantity }} {{ item.unit }}
                </div>
              </div>
              <div class="task-bars">
                <div 
                  class="task-bar"
                  :class="['priority-' + item.priority, 'type-' + item.type]"
                  :style="getTaskBarStyle(item)"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 看板视图 -->
    <el-card class="kanban-card" v-if="recommendationsData.length > 0 && viewMode === 'kanban'">
      <div slot="header" class="kanban-header">
        <span>推荐看板</span>
      </div>
      
      <div class="kanban-container">
        <div class="kanban-column" v-for="column in kanbanColumns" :key="column.key">
          <div class="column-header" :class="`header-${column.key}`">
            <h4>{{ column.title }}</h4>
            <span class="count">{{ getColumnCount(column.key) }}</span>
          </div>
          <div class="column-content">
            <div 
              v-for="item in getColumnItems(column.key)" 
              :key="item.id"
              class="kanban-card-item"
              :class="['priority-' + item.priority, 'type-' + item.type]"
              @click="viewDetail(item)"
            >
              <div class="card-header">
                <span class="material-code">{{ item.materialCode }}</span>
                <el-tag :type="getPriorityType(item.priority)">{{ getPriorityText(item.priority) }}</el-tag>
              </div>
              <div class="card-title">{{ item.materialName }}</div>
              <div class="card-details">
                <div class="detail-item">
                  <span class="label">建议数量:</span>
                  <span class="value">{{ item.quantity }} {{ item.unit }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">建议日期:</span>
                  <span class="value">{{ item.recommendedDate }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">需求日期:</span>
                  <span class="value">{{ item.dueDate }}</span>
                </div>
                <div class="detail-item" v-if="item.supplierName">
                  <span class="label">供应商:</span>
                  <span class="value">{{ item.supplierName }}</span>
                </div>
              </div>
              <div class="card-footer">
                <el-tag :type="item.type === 'purchase' ? 'success' : 'warning'">
                  {{ item.type === 'purchase' ? '采购' : '生产' }}
                </el-tag>
                <span class="cost">{{ formatCurrency(item.estimatedCost) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty description="暂无推荐数据，请设置规则后点击生成推荐" v-else-if="!generatingRecommendations"></el-empty>
    <el-skeleton :loading="generatingRecommendations" animated v-else>
      <el-skeleton-item variant="p" style="width: 50%; margin-bottom: 20px;"></el-skeleton-item>
      <el-skeleton-item variant="p" style="width: 70%;"></el-skeleton-item>
    </el-skeleton>

    <!-- 推荐详情对话框 -->
    <el-dialog title="推荐详情" :visible.sync="detailDialogVisible" width="60%">
      <div class="recommendation-detail" v-if="selectedRecommendation">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物料编码">{{ selectedRecommendation.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ selectedRecommendation.materialName }}</el-descriptions-item>
          <el-descriptions-item label="物料类型">{{ getMaterialTypeText(selectedRecommendation.materialType) }}</el-descriptions-item>
          <el-descriptions-item label="推荐类型">
            <el-tag :type="selectedRecommendation.type === 'purchase' ? 'success' : 'warning'">
              {{ selectedRecommendation.type === 'purchase' ? '采购' : '生产' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建议数量">{{ selectedRecommendation.quantity }} {{ selectedRecommendation.unit }}</el-descriptions-item>
          <el-descriptions-item label="预计成本">{{ formatCurrency(selectedRecommendation.estimatedCost) }}</el-descriptions-item>
          <el-descriptions-item label="推荐日期">{{ selectedRecommendation.recommendedDate }}</el-descriptions-item>
          <el-descriptions-item label="需求日期">{{ selectedRecommendation.dueDate }}</el-descriptions-item>
          <el-descriptions-item label="紧急程度">
            <el-tag :type="getPriorityType(selectedRecommendation.priority)">
              {{ getPriorityText(selectedRecommendation.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预计节省" v-if="selectedRecommendation.savings > 0">
            <span class="savings-amount">{{ formatCurrency(selectedRecommendation.savings) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="供应商" :span="2" v-if="selectedRecommendation.supplierName">
            {{ selectedRecommendation.supplierName }}
            <span v-if="selectedRecommendation.supplierRating" class="supplier-rating">
              (评分: {{ selectedRecommendation.supplierRating }}/5)
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="推荐原因" :span="2">{{ selectedRecommendation.reason }}</el-descriptions-item>
          <el-descriptions-item label="算法依据" :span="2">{{ selectedRecommendation.algorithmReasoning }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 需求分析图表 -->
        <div class="demand-analysis">
          <h4>需求分析</h4>
          <div class="analysis-content">
            <div class="analysis-item">
              <span class="label">当前库存:</span>
              <span class="value">{{ selectedRecommendation.currentStock }}</span>
            </div>
            <div class="analysis-item">
              <span class="label">安全库存:</span>
              <span class="value">{{ selectedRecommendation.safetyStock }}</span>
            </div>
            <div class="analysis-item">
              <span class="label">预计消耗:</span>
              <span class="value">{{ selectedRecommendation.projectedDemand }}</span>
            </div>
            <div class="analysis-item">
              <span class="label">在途订单:</span>
              <span class="value">{{ selectedRecommendation.inTransitOrders }}</span>
            </div>
          </div>
          
          <!-- 简化的库存趋势图 -->
          <div class="stock-trend">
            <h5>库存趋势预测</h5>
            <div class="trend-chart">
              <div 
                v-for="(point, index) in selectedRecommendation.stockTrend" 
                :key="index"
                class="trend-point"
                :class="{ 'below-safety': point.value < selectedRecommendation.safetyStock }"
                :style="{ height: `${Math.max(10, point.value / 10)}%`, left: `${index * (100 / (selectedRecommendation.stockTrend.length - 1))}%` }"
                :title="`${point.date}: ${point.value}`"
              ></div>
              <!-- 安全库存线 -->
              <div 
                class="safety-stock-line"
                :style="{ bottom: `${selectedRecommendation.safetyStock / 10}%` }"
                :title="`安全库存: ${selectedRecommendation.safetyStock}`"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- 替代方案 -->
        <div class="alternative-options" v-if="selectedRecommendation.alternatives && selectedRecommendation.alternatives.length > 0">
          <h4>替代方案</h4>
          <el-table :data="selectedRecommendation.alternatives" style="width: 100%">
            <el-table-column prop="optionName" label="方案名称" width="150"></el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" align="right"></el-table-column>
            <el-table-column prop="estimatedCost" label="预计成本" width="120" align="right">
              <template slot-scope="scope">
                {{ formatCurrency(scope.row.estimatedCost) }}
              </template>
            </el-table-column>
            <el-table-column prop="comparison" label="对比分析"></el-table-column>
          </el-table>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="applyRecommendation(selectedRecommendation)">应用推荐</el-button>
      </span>
    </el-dialog>
    
    <!-- 应用推荐对话框 -->
    <el-dialog title="应用推荐" :visible.sync="applyDialogVisible" width="50%">
      <div class="apply-dialog-content" v-if="recommendationToApply">
        <p>确认应用以下推荐:</p>
        <div class="apply-summary">
          <div class="summary-item">
            <span class="label">物料:</span>
            <span class="value">{{ recommendationToApply.materialCode }} - {{ recommendationToApply.materialName }}</span>
          </div>
          <div class="summary-item">
            <span class="label">推荐类型:</span>
            <span class="value">{{ recommendationToApply.type === 'purchase' ? '采购' : '生产' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">数量:</span>
            <span class="value">{{ recommendationToApply.quantity }} {{ recommendationToApply.unit }}</span>
          </div>
          <div class="summary-item">
            <span class="label">日期:</span>
            <span class="value">{{ recommendationToApply.recommendedDate }}</span>
          </div>
        </div>
        
        <el-form :model="applyForm" :rules="applyFormRules" ref="applyFormRef" class="apply-form">
          <el-form-item label="应用备注" prop="notes">
            <el-input type="textarea" v-model="applyForm.notes" rows="3" placeholder="请输入应用备注信息"></el-input>
          </el-form-item>
          
          <el-form-item label="负责人">
            <el-input v-model="applyForm.responsiblePerson" placeholder="请输入负责人"></el-input>
          </el-form-item>
          
          <el-form-item label="执行时间">
            <el-date-picker v-model="applyForm.executionDate" type="date" placeholder="选择执行时间"></el-date-picker>
          </el-form-item>
          
          <el-form-item label="自动生成订单">
            <el-switch v-model="applyForm.autoGenerateOrder"></el-switch>
          </el-form-item>
        </el-form>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="applyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmApplyRecommendation">确认应用</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'MrpRecommendation',
  data() {
    return {
      // 推荐规则设置
      recommendationRules: {
        planHorizon: 30,
        optimizationGoal: 'balanced',
        supplierPriority: 'comprehensive',
        inventoryStrategy: 'safetyStock'
      },
      
      // 高级选项
      advancedOptions: {
        orderMergeThreshold: 10,
        shortageAlertDays: 3,
        optimizeProductionBatch: true,
        considerCapacity: true,
        considerInTransit: true,
        considerSubstitutes: false
      },
      
      // 过滤参数
      filterParams: {
        materialType: '',
        recommendationType: '',
        priority: ''
      },
      
      // 视图模式
      viewMode: 'table',
      
      // 分页信息
      currentPage: 1,
      pageSize: 20,
      
      // 推荐数据
      recommendationsData: [],
      
      // 过滤后的推荐数据
      filteredRecommendations: [],
      
      // 状态标志
      generatingRecommendations: false,
      loading: false,
      
      // 对话框可见性
      detailDialogVisible: false,
      applyDialogVisible: false,
      
      // 选中的数据
      selectedRecommendation: null,
      recommendationToApply: null,
      selectedRecommendations: [],
      selectAll: false,
      
      // 统计数据
      totalRecommendations: 0,
      purchaseRecommendations: 0,
      productionRecommendations: 0,
      urgentRecommendations: 0,
      estimatedCost: 0,
      
      // 优化指标
      inventoryCostReduction: 0,
      orderCountReduction: 0,
      shortageRiskReduction: 0,
      
      // 看板列定义
      kanbanColumns: [
        { key: 'high', title: '紧急处理' },
        { key: 'medium', title: '待处理' },
        { key: 'low', title: '常规' },
        { key: 'applied', title: '已应用' }
      ],
      
      // 时间线数据（甘特图使用）
      timelineDays: [],
      
      // 应用推荐表单
      applyForm: {
        notes: '',
        responsiblePerson: '',
        executionDate: new Date(),
        autoGenerateOrder: false
      },
      
      applyFormRules: {
        notes: [
          { required: true, message: '请输入应用备注', trigger: 'blur' }
        ]
      }
    }
  },
  
  computed: {
    // 是否显示供应商列
    showSupplierColumn() {
      return this.filteredRecommendations.some(item => item.type === 'purchase')
    },
    
    // 分页后的数据
    paginatedRecommendations() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.filteredRecommendations.slice(start, end)
    }
  },
  
  methods: {
    // 生成推荐
    generateRecommendations() {
      this.generatingRecommendations = true
      
      // 模拟API请求延迟
      setTimeout(() => {
        // 生成模拟数据
        this.generateMockRecommendations()
        
        // 应用过滤
        this.applyFilter()
        
        // 更新统计信息
        this.updateStats()
        
        // 生成甘特图时间线
        this.generateTimelineDays()
        
        this.generatingRecommendations = false
        this.$message.success('推荐生成成功')
      }, 2000)
    },
    
    // 生成模拟推荐数据
    generateMockRecommendations() {
      const materialTypes = ['RM', 'SFG', 'FG', 'PUR']
      const materials = [
        { code: 'RM001', name: '钢材', type: 'RM', unit: 'kg' },
        { code: 'RM002', name: '铝材', type: 'RM', unit: 'kg' },
        { code: 'RM003', name: '塑料粒子', type: 'RM', unit: 'kg' },
        { code: 'RM004', name: '电子元件', type: 'RM', unit: '个' },
        { code: 'RM005', name: '包装材料', type: 'RM', unit: '箱' },
        { code: 'SFG001', name: '半成品A', type: 'SFG', unit: '个' },
        { code: 'SFG002', name: '半成品B', type: 'SFG', unit: '个' },
        { code: 'SFG003', name: '组件C', type: 'SFG', unit: '个' },
        { code: 'FG001', name: '成品X', type: 'FG', unit: '台' },
        { code: 'FG002', name: '成品Y', type: 'FG', unit: '台' },
        { code: 'PUR001', name: '外购件A', type: 'PUR', unit: '个' },
        { code: 'PUR002', name: '外购件B', type: 'PUR', unit: '套' }
      ]
      
      const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D', '供应商E']
      const priorities = ['high', 'medium', 'low']
      const reasons = [
        '库存低于安全水平',
        '预测需求增加',
        '供应商交货周期延长',
        '经济批量采购',
        '生产计划调整',
        '季节性需求变化'
      ]
      
      this.recommendationsData = []
      
      // 生成20-30条推荐数据
      const count = Math.floor(Math.random() * 10) + 20
      
      for (let i = 0; i < count; i++) {
        const material = materials[Math.floor(Math.random() * materials.length)]
        const isPurchase = ['RM', 'PUR'].includes(material.type)
        const priority = priorities[Math.floor(Math.random() * priorities.length)]
        
        // 生成日期
        const now = new Date()
        const recommendedDate = new Date(now)
        const dueDate = new Date(now)
        
        // 根据优先级设置日期
        const daysUntilRecommended = priority === 'high' ? 1 : priority === 'medium' ? 3 : 7
        const daysUntilDue = daysUntilRecommended + (priority === 'high' ? 2 : priority === 'medium' ? 5 : 10)
        
        recommendedDate.setDate(now.getDate() + daysUntilRecommended)
        dueDate.setDate(now.getDate() + daysUntilDue)
        
        // 生成随机数量和成本
        const quantity = Math.floor(Math.random() * 500) + 50
        const unitCost = Math.floor(Math.random() * 1000) + 50
        const estimatedCost = quantity * unitCost
        
        // 生成库存趋势数据
        const stockTrend = []
        const currentStock = Math.floor(Math.random() * 200)
        const safetyStock = Math.floor(Math.random() * 100) + 50
        
        for (let j = 0; j < 10; j++) {
          const date = new Date(now)
          date.setDate(now.getDate() + j)
          
          // 模拟库存变化趋势
          let value = currentStock - (j * 10) + (Math.random() > 0.7 ? Math.floor(Math.random() * 200) : 0)
          value = Math.max(0, value)
          
          stockTrend.push({
            date: date.toISOString().split('T')[0],
            value
          })
        }
        
        // 生成替代方案
        const alternatives = []
        if (Math.random() > 0.5) {
          alternatives.push({
            optionName: isPurchase ? '批量采购' : '大批量生产',
            quantity: Math.ceil(quantity * 1.5),
            estimatedCost: Math.ceil(estimatedCost * 1.3),
            comparison: '数量增加50%，成本增加30%，可降低未来采购次数'
          })
          
          alternatives.push({
            optionName: isPurchase ? '分批采购' : '分批生产',
            quantity: Math.ceil(quantity / 2),
            estimatedCost: Math.ceil(estimatedCost * 0.6),
            comparison: '数量减少50%，成本减少40%，但需增加采购次数'
          })
        }
        
        this.recommendationsData.push({
          id: `REC${i + 1000}`,
          materialCode: material.code,
          materialName: material.name,
          materialType: material.type,
          unit: material.unit,
          type: isPurchase ? 'purchase' : 'production',
          quantity,
          estimatedCost,
          recommendedDate: recommendedDate.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          priority,
          supplierName: isPurchase ? suppliers[Math.floor(Math.random() * suppliers.length)] : '',
          supplierRating: isPurchase ? Math.floor(Math.random() * 2) + 3 : null,
          reason: reasons[Math.floor(Math.random() * reasons.length)],
          algorithmReasoning: `基于${this.recommendationRules.optimizationGoal}优化算法，考虑${this.recommendationRules.inventoryStrategy}策略生成`,
          savings: Math.floor(Math.random() * 5000),
          currentStock,
          safetyStock,
          projectedDemand: Math.floor(Math.random() * 300) + 100,
          inTransitOrders: Math.floor(Math.random() * 100),
          stockTrend,
          alternatives,
          status: 'pending'
        })
      }
    },
    
    // 应用过滤
    applyFilter() {
      this.filteredRecommendations = this.recommendationsData.filter(item => {
        let match = true
        
        if (this.filterParams.materialType && item.materialType !== this.filterParams.materialType) {
          match = false
        }
        
        if (this.filterParams.recommendationType && item.type !== this.filterParams.recommendationType) {
          match = false
        }
        
        if (this.filterParams.priority && item.priority !== this.filterParams.priority) {
          match = false
        }
        
        return match
      })
      
      // 重置分页
      this.currentPage = 1
    },
    
    // 重置过滤
    resetFilter() {
      this.filterParams = {
        materialType: '',
        recommendationType: '',
        priority: ''
      }
      this.applyFilter()
    },
    
    // 刷新推荐
    refreshRecommendations() {
      this.loading = true
      
      setTimeout(() => {
        this.applyFilter()
        this.updateStats()
        this.loading = false
        this.$message.success('推荐已刷新')
      }, 800)
    },
    
    // 更新统计信息
    updateStats() {
      const data = this.filteredRecommendations
      
      this.totalRecommendations = data.length
      this.purchaseRecommendations = data.filter(item => item.type === 'purchase').length
      this.productionRecommendations = data.filter(item => item.type === 'production').length
      this.urgentRecommendations = data.filter(item => item.priority === 'high').length
      this.estimatedCost = data.reduce((sum, item) => sum + item.estimatedCost, 0)
      
      // 模拟优化指标
      this.inventoryCostReduction = Math.floor(Math.random() * 30) + 10
      this.orderCountReduction = Math.floor(Math.random() * 25) + 5
      this.shortageRiskReduction = Math.floor(Math.random() * 40) + 20
    },
    
    // 生成甘特图时间线
    generateTimelineDays() {
      const days = []
      const now = new Date()
      
      // 生成30天的时间线
      for (let i = 0; i < 30; i += 3) { // 每3天显示一个刻度
        const date = new Date(now)
        date.setDate(now.getDate() + i)
        days.push(date.toISOString().split('T')[0])
      }
      
      this.timelineDays = days
    },
    
    // 格式化时间线日期
    formatTimelineDay(dateStr) {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}`
    },
    
    // 获取任务条样式（甘特图）
    getTaskBarStyle(item) {
      const startDate = new Date(item.recommendedDate)
      const endDate = new Date(item.dueDate)
      const now = new Date()
      const totalDays = 30 // 时间线总天数
      
      // 计算相对位置和宽度
      const startDay = Math.max(0, Math.floor((startDate - now) / (1000 * 60 * 60 * 24)))
      const endDay = Math.min(totalDays, Math.floor((endDate - now) / (1000 * 60 * 60 * 24)))
      const duration = Math.max(1, endDay - startDay)
      
      return {
        left: `${(startDay / totalDays) * 100}%`,
        width: `${(duration / totalDays) * 100}%`
      }
    },
    
    // 获取看板列项
    getColumnItems(columnKey) {
      if (columnKey === 'applied') {
        return this.filteredRecommendations.filter(item => item.status === 'applied')
      }
      return this.filteredRecommendations.filter(item => item.priority === columnKey && item.status === 'pending')
    },
    
    // 获取看板列计数
    getColumnCount(columnKey) {
      return this.getColumnItems(columnKey).length
    },
    
    // 查看详情
    viewDetail(recommendation) {
      this.selectedRecommendation = JSON.parse(JSON.stringify(recommendation))
      this.detailDialogVisible = true
    },
    
    // 应用推荐
    applyRecommendation(recommendation) {
      this.recommendationToApply = JSON.parse(JSON.stringify(recommendation))
      this.applyForm = {
        notes: '',
        responsiblePerson: '',
        executionDate: new Date(),
        autoGenerateOrder: false
      }
      this.applyDialogVisible = true
    },
    
    // 确认应用推荐
    confirmApplyRecommendation() {
      this.$refs.applyFormRef.validate((valid) => {
        if (valid) {
          // 更新推荐状态
          const index = this.recommendationsData.findIndex(item => item.id === this.recommendationToApply.id)
          if (index !== -1) {
            this.recommendationsData[index].status = 'applied'
          }
          
          this.applyDialogVisible = false
          this.applyFilter()
          this.$message.success('推荐应用成功')
          
          if (this.applyForm.autoGenerateOrder) {
            this.$message.info('正在生成采购/生产订单...')
          }
        }
      })
    },
    
    // 删除推荐
    deleteRecommendation(recommendation) {
      this.$confirm(`确定要删除推荐 ${recommendation.materialCode} - ${recommendation.materialName} 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const index = this.recommendationsData.findIndex(item => item.id === recommendation.id)
        if (index !== -1) {
          this.recommendationsData.splice(index, 1)
        }
        this.applyFilter()
        this.$message.success('推荐删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 批量删除
    batchDelete() {
      if (this.selectedRecommendations.length === 0) {
        this.$message.warning('请选择要删除的推荐')
        return
      }
      
      this.$confirm(`确定要删除选中的 ${this.selectedRecommendations.length} 条推荐吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const idsToDelete = this.selectedRecommendations.map(item => item.id)
        this.recommendationsData = this.recommendationsData.filter(item => !idsToDelete.includes(item.id))
        this.applyFilter()
        this.selectedRecommendations = []
        this.selectAll = false
        this.$message.success('批量删除成功')
      }).catch(() => {
        // 取消删除
      })
    },
    
    // 批量应用
    batchApply() {
      if (this.selectedRecommendations.length === 0) {
        this.$message.warning('请选择要应用的推荐')
        return
      }
      
      this.$confirm(`确定要批量应用选中的 ${this.selectedRecommendations.length} 条推荐吗？`, '确认应用', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        const idsToApply = this.selectedRecommendations.map(item => item.id)
        this.recommendationsData.forEach(item => {
          if (idsToApply.includes(item.id)) {
            item.status = 'applied'
          }
        })
        
        this.applyFilter()
        this.selectedRecommendations = []
        this.selectAll = false
        this.$message.success('批量应用成功')
      }).catch(() => {
        // 取消应用
      })
    },
    
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRecommendations = selection
      this.selectAll = selection.length === this.filteredRecommendations.length && this.filteredRecommendations.length > 0
    },
    
    // 处理全选
    handleSelectAll(checked) {
      this.selectAll = checked
      if (checked) {
        this.selectedRecommendations = JSON.parse(JSON.stringify(this.filteredRecommendations))
      } else {
        this.selectedRecommendations = []
      }
    },
    
    // 处理分页大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    
    // 处理当前页变化
    handleCurrentChange(current) {
      this.currentPage = current
    },
    
    // 导出推荐
    exportRecommendations() {
      if (this.recommendationsData.length === 0) {
        this.$message.warning('暂无数据可导出')
        return
      }
      
      this.$message.success('推荐数据导出成功')
    },
    
    // 保存为方案
    saveAsScenario() {
      if (this.recommendationsData.length === 0) {
        this.$message.warning('暂无数据可保存')
        return
      }
      
      this.$prompt('请输入方案名称', '保存推荐方案', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: `推荐方案_${new Date().toLocaleDateString()}`
      }).then(({ value }) => {
        this.$message.success(`方案"${value}"保存成功`)
      }).catch(() => {
        // 取消保存
      })
    },
    
    // 获取物料类型文本
    getMaterialTypeText(type) {
      const typeMap = {
        'RM': '原材料',
        'SFG': '半成品',
        'FG': '成品',
        'PUR': '外购件'
      }
      return typeMap[type] || type
    },
    
    // 获取优先级类型
    getPriorityType(priority) {
      const typeMap = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'success'
      }
      return typeMap[priority] || 'default'
    },
    
    // 获取优先级文本
    getPriorityText(priority) {
      const textMap = {
        'high': '紧急',
        'medium': '一般',
        'low': '常规'
      }
      return textMap[priority] || priority
    },
    
    // 格式化货币
    formatCurrency(value) {
      return `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  }
}
</script>

<style scoped>
.mrp-recommendation-container {
  padding: 20px;
}

/* 页面头部 */
.page-header {
  margin-bottom: 10px;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.page-description {
  color: #606266;
  font-size: 14px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-actions, .right-actions {
  display: flex;
  gap: 10px;
}

/* 规则设置卡片 */
.rules-content {
  padding: 10px 0;
}

.advanced-options {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.advanced-options h3 {
  font-size: 14px;
  margin-bottom: 15px;
  color: #606266;
}

/* 概览卡片 */
.overview-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.overview-stats .el-statistic {
  min-width: 180px;
  text-align: center;
  padding: 10px;
}

.optimization-metrics h3 {
  font-size: 14px;
  margin-bottom: 15px;
  color: #606266;
}

.optimization-metrics .el-progress {
  margin-bottom: 10px;
}

/* 筛选和视图切换 */
.filter-view-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.view-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-label {
  color: #606266;
}

/* 推荐列表 */
.recommendations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommendations-title {
  font-weight: 500;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 甘特图样式 */
.gantt-container {
  overflow-x: auto;
}

.gantt-chart {
  display: flex;
  min-width: 800px;
}

.gantt-timeline {
  width: 200px;
  flex-shrink: 0;
}

.timeline-header {
  padding: 10px;
  font-weight: 500;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.timeline-days {
  display: flex;
  flex-direction: column;
}

.day-column {
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
}

.gantt-tasks {
  flex: 1;
}

.task-row {
  display: flex;
  border-bottom: 1px solid #ebeef5;
  height: 60px;
}

.task-info {
  width: 200px;
  padding: 10px;
  flex-shrink: 0;
  background-color: #fafafa;
}

.task-name {
  font-weight: 500;
  margin-bottom: 5px;
}

.task-details {
  font-size: 12px;
  color: #606266;
}

.task-bars {
  flex: 1;
  position: relative;
  padding: 20px 10px;
}

.task-bar {
  position: absolute;
  top: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.3s;
}

.task-bar:hover {
  transform: scaleY(1.2);
}

.task-bar.type-purchase {
  background-color: #67c23a;
}

.task-bar.type-production {
  background-color: #e6a23c;
}

.task-bar.priority-high {
  border: 2px solid #f56c6c;
}

.task-bar.priority-medium {
  border: 2px solid #e6a23c;
}

/* 看板样式 */
.kanban-container {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.kanban-column {
  min-width: 300px;
  flex: 1;
  max-width: 400px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.column-header {
  padding: 15px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-header h4 {
  margin: 0;
  font-size: 14px;
}

.count {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.header-high .count {
  background-color: #f56c6c;
  color: white;
}

.header-medium .count {
  background-color: #e6a23c;
  color: white;
}

.column-content {
  padding: 10px;
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
}

.kanban-card-item {
  background-color: white;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.kanban-card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.kanban-card-item.priority-high {
  border-left: 4px solid #f56c6c;
}

.kanban-card-item.priority-medium {
  border-left: 4px solid #e6a23c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.material-code {
  font-weight: 500;
  color: #606266;
}

.card-title {
  font-weight: 500;
  margin-bottom: 10px;
}

.card-details {
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
}

.detail-item {
  margin-bottom: 5px;
}

.detail-item .label {
  color: #909399;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost {
  font-weight: 500;
}

/* 详情对话框 */
.recommendation-detail h4 {
  margin: 20px 0 10px 0;
  color: #606266;
}

.demand-analysis .analysis-content {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.analysis-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  min-width: 100px;
}

.analysis-item .label {
  font-size: 12px;
  color: #606266;
  margin-bottom: 5px;
}

.analysis-item .value {
  font-weight: 600;
  font-size: 16px;
}

.stock-trend h5 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #606266;
}

.trend-chart {
  height: 120px;
  background-color: #f5f7fa;
  border-radius: 4px;
  position: relative;
  padding: 10px;
}

.trend-point {
  position: absolute;
  bottom: 10px;
  width: 8px;
  background-color: #67c23a;
  border-radius: 4px;
  transition: all 0.3s;
}

.trend-point:hover {
  width: 12px;
  background-color: #409eff;
}

.trend-point.below-safety {
  background-color: #f56c6c;
}

.safety-stock-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #e6a23c;
  opacity: 0.6;
}

.supplier-rating {
  color: #e6a23c;
  margin-left: 5px;
}

.savings-amount {
  color: #67c23a;
  font-weight: 600;
}

/* 应用对话框 */
.apply-dialog-content p {
  margin-bottom: 15px;
}

.apply-summary {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.summary-item {
  margin-bottom: 10px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item .label {
  color: #606266;
  margin-right: 10px;
}

.apply-form {
  margin-top: 10px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  
  .left-actions, .right-actions {
    justify-content: center;
  }
  
  .inline-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .inline-form .el-form-item {
    margin-bottom: 0;
  }
  
  .filter-view-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .overview-stats {
    flex-direction: column;
    align-items: center;
  }
  
  .overview-stats .el-statistic {
    width: 100%;
  }
  
  .kanban-container {
    flex-direction: column;
  }
  
  .kanban-column {
    max-width: none;
  }
  
  .demand-analysis .analysis-content {
    flex-direction: column;
    gap: 10px;
  }
  
  .analysis-item {
    width: 100%;
  }
}
</style>