<template>
  <div class="standard-time">
    <!-- 基本信息栏 -->
    <el-card class="mb-4">
      <div class="basic-info">
        <el-form :inline="true" :model="basicForm" label-width="80px">
          <el-form-item label="工序编码">
            <el-input v-model="basicForm.operationCode" placeholder="请输入工序编码" style="width: 150px;" />
          </el-form-item>
          <el-form-item label="工序名称">
            <el-input v-model="basicForm.operationName" placeholder="请输入工序名称" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="产品型号">
            <el-input v-model="basicForm.productModel" placeholder="请输入产品型号" style="width: 150px;" />
          </el-form-item>
          <el-form-item label="计算方法">
            <el-select v-model="basicForm.calculationMethod" placeholder="请选择计算方法" style="width: 150px;">
              <el-option v-for="method in calculationMethods" :key="method.value" :label="method.label" :value="method.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="saveStandardTime">保存标准工时</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 工时计算区域 -->
    <div class="calculation-section">
      <el-tabs v-model="activeTab">
        <!-- 时间研究法 -->
        <el-tab-pane label="时间研究法" name="timeStudy">
          <el-card>
            <div class="tab-content">
              <!-- 观察记录表格 -->
              <div class="mb-4">
                <div class="section-header">
                  <h4>观察记录</h4>
                  <div class="header-actions">
                    <el-button size="small" type="primary" @click="addObservation">添加记录</el-button>
                    <el-button size="small" @click="batchAddObservations">批量添加</el-button>
                    <el-button size="small" type="danger" @click="clearObservations" v-if="observations.length > 0">清空记录</el-button>
                  </div>
                </div>
                
                <el-table :data="observations" style="width: 100%" border>
                  <el-table-column prop="sequence" label="序号" width="60" type="index" />
                  <el-table-column prop="cycleTime" label="周期时间(秒)" width="120">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.cycleTime"
                        :min="0"
                        :step="0.1"
                        @change="calculateTimeStudy"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="performanceRating" label="绩效评级(%)" width="120">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.performanceRating"
                        :min="50"
                        :max="150"
                        :step="1"
                        @change="calculateTimeStudy"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="normalTime" label="正常时间(秒)" width="120" :formatter="formatNumber" />
                  <el-table-column prop="remarks" label="备注" min-width="150">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remarks" size="small" placeholder="备注" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80">
                    <template slot-scope="scope">
                      <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteObservation(scope.$index)" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 宽放率设置 -->
              <div class="mb-4">
                <div class="section-header">
                  <h4>宽放率设置</h4>
                </div>
                
                <el-table :data="allowanceFactors" style="width: 100%" border>
                  <el-table-column prop="type" label="宽放类型" width="120">
                    <template slot-scope="scope">
                      <el-select v-model="scope.row.type" placeholder="请选择类型" :disabled="!editable">
                        <el-option v-for="type in allowanceTypes" :key="type.value" :label="type.label" :value="type.value" />
                      </el-select>
                    </template>
                  </el-table-column>
                  <el-table-column prop="name" label="名称" width="120">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.name" size="small" :disabled="!editable" />
                    </template>
                  </el-table-column>
                  <el-table-column prop="percentage" label="宽放率(%)" width="120">
                    <template slot-scope="scope">
                      <el-input-number
                        v-model="scope.row.percentage"
                        :min="0"
                        :max="100"
                        :step="0.1"
                        @change="calculateTimeStudy"
                        :disabled="!editable"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="说明" min-width="200">
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.description" size="small" placeholder="说明" :disabled="!editable" />
                    </template>
                  </el-table-column>
                  <el-table-column label="操作" width="80" v-if="editable">
                    <template slot-scope="scope">
                      <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteAllowanceFactor(scope.$index)" />
                    </template>
                  </el-table-column>
                </el-table>
                
                <div class="mt-2" v-if="editable">
                  <el-button size="small" type="primary" @click="addAllowanceFactor">添加宽放率</el-button>
                </div>
              </div>

              <!-- 计算结果 -->
              <div class="results-section">
                <el-descriptions :column="4" border>
                  <el-descriptions-item label="观察次数">{{ observations.length }}</el-descriptions-item>
                  <el-descriptions-item label="平均周期时间">{{ averageCycleTime }}秒</el-descriptions-item>
                  <el-descriptions-item label="平均绩效评级">{{ averagePerformanceRating }}%</el-descriptions-item>
                  <el-descriptions-item label="正常时间">{{ normalTime }}秒</el-descriptions-item>
                  <el-descriptions-item label="总宽放率">{{ totalAllowancePercentage }}%</el-descriptions-item>
                  <el-descriptions-item label="标准工时">{{ standardTime }}秒</el-descriptions-item>
                  <el-descriptions-item label="标准工时(分钟)">{{ standardTime / 60 | numberFormat(2) }}分钟</el-descriptions-item>
                  <el-descriptions-item label="产能(件/小时)">{{ hourlyCapacity | numberFormat(1) }}件/小时</el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 预定动作时间标准法 -->
        <el-tab-pane label="预定动作时间标准法" name="predeterminedTime">
          <el-card>
            <div class="tab-content">
              <div class="section-header">
                <h4>动作元素列表</h4>
                <div class="header-actions">
                  <el-button size="small" type="primary" @click="addMotionElement">添加动作元素</el-button>
                  <el-button size="small" type="danger" @click="clearMotionElements" v-if="motionElements.length > 0">清空</el-button>
                </div>
              </div>
              
              <el-table :data="motionElements" style="width: 100%" border>
                <el-table-column prop="sequence" label="序号" width="60" type="index" />
                <el-table-column prop="elementName" label="动作元素" width="150">
                  <template slot-scope="scope">
                    <el-select v-model="scope.row.elementName" placeholder="请选择动作元素" @change="calculatePredeterminedTime">
                      <el-option v-for="element in motionElementOptions" :key="element.value" :label="element.label" :value="element.value" />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="180">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.description" size="small" placeholder="动作描述" />
                  </template>
                </el-table-column>
                <el-table-column prop="tmU" label="时间值(TMU)" width="120">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.tmU"
                      :min="0"
                      :step="0.1"
                      @change="calculatePredeterminedTime"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="frequency" label="频次" width="80">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.frequency"
                      :min="1"
                      :step="1"
                      @change="calculatePredeterminedTime"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="totalTmU" label="总TMU" width="100" :formatter="formatNumber" />
                <el-table-column label="操作" width="80">
                  <template slot-scope="scope">
                    <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteMotionElement(scope.$index)" />
                  </template>
                </el-table-column>
              </el-table>

              <!-- 宽放设置 -->
              <div class="mt-4">
                <div class="section-header">
                  <h4>宽放设置</h4>
                </div>
                <el-form :inline="true" :model="predeterminedForm" label-width="100px">
                  <el-form-item label="基本宽放率(%)">
                    <el-input-number
                      v-model="predeterminedForm.basicAllowance"
                      :min="0"
                      :max="100"
                      :step="0.1"
                      @change="calculatePredeterminedTime"
                    />
                  </el-form-item>
                  <el-form-item label="特殊宽放率(%)">
                    <el-input-number
                      v-model="predeterminedForm.specialAllowance"
                      :min="0"
                      :max="100"
                      :step="0.1"
                      @change="calculatePredeterminedTime"
                    />
                  </el-form-item>
                  <el-form-item label="学习曲线因子(\%)">
                    <el-input-number
                      v-model="predeterminedForm.learningFactor"
                      :min="70"
                      :max="100"
                      :step="1"
                      @change="calculatePredeterminedTime"
                    />
                  </el-form-item>
                </el-form>
              </div>

              <!-- 计算结果 -->
              <div class="results-section mt-4">
                <el-descriptions :column="4" border>
                  <el-descriptions-item label="动作元素数量">{{ motionElements.length }}</el-descriptions-item>
                  <el-descriptions-item label="总TMU">{{ totalTMU | numberFormat(2) }}</el-descriptions-item>
                  <el-descriptions-item label="基本时间">{{ basicTimeFromTMU }}秒</el-descriptions-item>
                  <el-descriptions-item label="总宽放率">{{ totalPredeterminedAllowance }}%</el-descriptions-item>
                  <el-descriptions-item label="标准工时">{{ predeterminedStandardTime }}秒</el-descriptions-item>
                  <el-descriptions-item label="标准工时(分钟)">{{ predeterminedStandardTime / 60 | numberFormat(2) }}分钟</el-descriptions-item>
                  <el-descriptions-item label="产能(件/小时)">{{ predeterminedHourlyCapacity | numberFormat(1) }}件/小时</el-descriptions-item>
                  <el-descriptions-item label="学习后工时">{{ learnedStandardTime }}秒</el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 历史数据法 -->
        <el-tab-pane label="历史数据法" name="historicalData">
          <el-card>
            <div class="tab-content">
              <div class="section-header">
                <h4>历史记录</h4>
                <div class="header-actions">
                  <el-button size="small" type="primary" @click="addHistoricalRecord">添加历史记录</el-button>
                  <el-button size="small" @click="importHistoricalData">导入历史数据</el-button>
                </div>
              </div>
              
              <el-table :data="historicalRecords" style="width: 100%" border>
                <el-table-column prop="sequence" label="序号" width="60" type="index" />
                <el-table-column prop="date" label="日期" width="120">
                  <template slot-scope="scope">
                    <el-date-picker
                      v-model="scope.row.date"
                      type="date"
                      value-format="yyyy-MM-dd"
                      placeholder="选择日期"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="batchNo" label="批次号" width="120">
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.batchNo" size="small" placeholder="批次号" />
                  </template>
                </el-table-column>
                <el-table-column prop="quantity" label="生产数量" width="100">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.quantity"
                      :min="1"
                      :step="1"
                      @change="calculateHistoricalData"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="totalTime" label="总耗时(分钟)" width="120">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.totalTime"
                      :min="0"
                      :step="0.1"
                      @change="calculateHistoricalData"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="unitTime" label="单位时间(分钟)" width="120" :formatter="formatNumber" />
                <el-table-column prop="efficiency" label="效率因子" width="100">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.efficiency"
                      :min="0.5"
                      :max="2"
                      :step="0.01"
                      @change="calculateHistoricalData"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="adjustedTime" label="调整后时间" width="120" :formatter="formatNumber" />
                <el-table-column label="操作" width="80">
                  <template slot-scope="scope">
                    <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteHistoricalRecord(scope.$index)" />
                  </template>
                </el-table-column>
              </el-table>

              <!-- 数据过滤和计算参数 -->
              <div class="mt-4">
                <div class="section-header">
                  <h4>数据处理参数</h4>
                </div>
                <el-form :inline="true" :model="historicalForm" label-width="120px">
                  <el-form-item label="数据过滤方法">
                    <el-select v-model="historicalForm.filterMethod" placeholder="请选择过滤方法" @change="calculateHistoricalData">
                      <el-option label="全部数据" value="all" />
                      <el-option label="去除异常值" value="removeOutliers" />
                      <el-option label="移动平均" value="movingAverage" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="置信水平(\%)">
                    <el-input-number
                      v-model="historicalForm.confidenceLevel"
                      :min="80"
                      :max="99"
                      :step="1"
                      @change="calculateHistoricalData"
                    />
                  </el-form-item>
                  <el-form-item label="趋势调整因子">
                    <el-input-number
                      v-model="historicalForm.trendFactor"
                      :min="0.8"
                      :max="1.2"
                      :step="0.01"
                      @change="calculateHistoricalData"
                    />
                  </el-form-item>
                  <el-form-item label="样本数量">
                    <span class="sample-count">{{ validHistoricalRecords.length }}</span>
                  </el-form-item>
                </el-form>
              </div>

              <!-- 计算结果 -->
              <div class="results-section mt-4">
                <el-descriptions :column="4" border>
                  <el-descriptions-item label="平均单位时间">{{ averageHistoricalTime }}分钟</el-descriptions-item>
                  <el-descriptions-item label="中位数时间">{{ medianHistoricalTime }}分钟</el-descriptions-item>
                  <el-descriptions-item label="标准差" :formatter="formatNumber">{{ stdDevHistoricalTime }}</el-descriptions-item>
                  <el-descriptions-item label="数据分布" :formatter="formatDistribution">{{ dataDistribution }}</el-descriptions-item>
                  <el-descriptions-item label="推荐标准工时" :formatter="formatNumber">{{ recommendedHistoricalTime }}</el-descriptions-item>
                  <el-descriptions-item label="预测产能" :formatter="formatNumber">{{ historicalCapacity }}件/小时</el-descriptions-item>
                  <el-descriptions-item label="数据可靠性" :formatter="formatReliability">{{ dataReliability }}</el-descriptions-item>
                  <el-descriptions-item label="时间趋势" :formatter="formatTrend">{{ timeTrend }}</el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 数据分析 -->
        <el-tab-pane label="数据分析" name="analysis">
          <el-card>
            <div class="tab-content">
              <div class="chart-container">
                <div class="chart-wrapper">
                  <h4>工时分布直方图</h4>
                  <div class="chart-placeholder">
                    <div class="chart-loading">
                      <i class="el-icon-loading"></i>
                      <span>图表加载中...</span>
                    </div>
                    <!-- 这里可以集成ECharts等图表库 -->
                  </div>
                </div>
                <div class="chart-wrapper">
                  <h4>工时趋势图</h4>
                  <div class="chart-placeholder">
                    <div class="chart-loading">
                      <i class="el-icon-loading"></i>
                      <span>图表加载中...</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="analysis-results mt-4">
                <div class="section-header">
                  <h4>统计分析结果</h4>
                </div>
                <el-table :data="analysisResults" style="width: 100%" border>
                  <el-table-column prop="name" label="分析项" width="180" />
                  <el-table-column prop="value" label="数值" width="120" :formatter="formatAnalysisValue" />
                  <el-table-column prop="description" label="说明" min-width="300" />
                  <el-table-column prop="status" label="状态" width="80">
                    <template slot-scope="scope">
                      <el-tag :type="getStatusType(scope.row.status)">
                        {{ scope.row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <!-- 改进建议 -->
              <div class="improvement-section mt-4">
                <div class="section-header">
                  <h4>改进建议</h4>
                </div>
                <el-table :data="improvementSuggestions" style="width: 100%" border>
                  <el-table-column prop="category" label="类别" width="120" />
                  <el-table-column prop="suggestion" label="建议内容" min-width="400" />
                  <el-table-column prop="priority" label="优先级" width="100">
                    <template slot-scope="scope">
                      <el-tag :type="getPriorityType(scope.row.priority)">
                        {{ scope.row.priority }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="estimatedBenefit" label="预计收益" width="120" />
                </el-table>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 版本管理 -->
        <el-tab-pane label="版本管理" name="versions">
          <el-card>
            <div class="tab-content">
              <div class="section-header">
                <h4>标准工时版本历史</h4>
                <div class="header-actions">
                  <el-button size="small" type="primary" @click="createNewVersion">创建新版本</el-button>
                  <el-button size="small" @click="compareVersions">版本对比</el-button>
                </div>
              </div>
              
              <el-table :data="versionHistory" style="width: 100%" border>
                <el-table-column prop="version" label="版本号" width="100" />
                <el-table-column prop="standardTime" label="标准工时(分钟)" width="120" :formatter="formatNumber" />
                <el-table-column prop="calculationMethod" label="计算方法" width="120" />
                <el-table-column prop="creator" label="创建人" width="100" />
                <el-table-column prop="createdAt" label="创建时间" width="160" />
                <el-table-column prop="effectiveDate" label="生效日期" width="120" />
                <el-table-column prop="status" label="状态" width="80">
                  <template slot-scope="scope">
                    <el-tag :type="getStatusType(scope.row.status)">
                      {{ scope.row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remarks" label="备注" min-width="150" />
                <el-table-column label="操作" width="120">
                  <template slot-scope="scope">
                    <el-button size="mini" @click="viewVersionDetail(scope.row)">查看</el-button>
                    <el-button size="mini" type="primary" v-if="scope.row.status === '草稿'" @click="approveVersion(scope.row)">启用</el-button>
                    <el-button size="mini" type="danger" v-if="scope.row.status === '生效'" @click="disableVersion(scope.row)">禁用</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 批量添加观察记录对话框 -->
    <el-dialog
      title="批量添加观察记录"
      :visible.sync="batchAddDialogVisible"
      width="600px"
      :before-close="handleBatchAddDialogClose"
    >
      <el-form :model="batchAddForm" label-width="100px">
        <el-form-item label="观察次数">
          <el-input-number v-model="batchAddForm.count" :min="1" :max="100" :step="1" />
        </el-form-item>
        <el-form-item label="平均时间(秒)">
          <el-input-number v-model="batchAddForm.avgTime" :min="0" :step="0.1" />
        </el-form-item>
        <el-form-item label="时间波动范围(±%)">
          <el-input-number v-model="batchAddForm.variation" :min="0" :max="50" :step="1" />
        </el-form-item>
        <el-form-item label="默认绩效评级(%)">
          <el-input-number v-model="batchAddForm.defaultRating" :min="50" :max="150" :step="1" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleBatchAddDialogClose">取消</el-button>
        <el-button type="primary" @click="confirmBatchAdd">确定</el-button>
      </div>
    </el-dialog>

    <!-- 版本详情对话框 -->
    <el-dialog
      title="版本详情"
      :visible.sync="versionDetailDialogVisible"
      width="800px"
      :before-close="handleVersionDetailClose"
    >
      <div class="version-detail" v-if="currentVersion">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="版本号">{{ currentVersion.version }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentVersion.status }}</el-descriptions-item>
          <el-descriptions-item label="标准工时">{{ currentVersion.standardTime }}分钟</el-descriptions-item>
          <el-descriptions-item label="计算方法">{{ currentVersion.calculationMethod }}</el-descriptions-item>
          <el-descriptions-item label="创建人">{{ currentVersion.creator }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentVersion.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="生效日期">{{ currentVersion.effectiveDate }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentVersion.updatedAt }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentVersion.remarks }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="mt-4">
          <h4>工时构成明细</h4>
          <el-table :data="currentVersion.detailItems" style="width: 100%" border v-if="currentVersion.detailItems">
            <el-table-column prop="item" label="项目" width="150" />
            <el-table-column prop="value" label="数值" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="description" label="说明" min-width="300" />
          </el-table>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="handleVersionDetailClose">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'StandardTime',
  props: {
    operationData: {
      type: Object,
      default: () => ({})
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      // 基本信息表单
      basicForm: {
        operationCode: '',
        operationName: '',
        productModel: '',
        calculationMethod: 'timeStudy'
      },
      
      // 激活的标签页
      activeTab: 'timeStudy',
      
      // 计算方法选项
      calculationMethods: [
        { value: 'timeStudy', label: '时间研究法' },
        { value: 'predeterminedTime', label: '预定动作时间标准法' },
        { value: 'historicalData', label: '历史数据法' }
      ],
      
      // 时间研究法数据
      observations: [],
      allowanceFactors: [
        { type: 'personal', name: '个人宽放', percentage: 5, description: '操作人员生理需求宽放' },
        { type: 'fatigue', name: '疲劳宽放', percentage: 10, description: '由于疲劳导致的宽放' },
        { type: 'delay', name: '延迟宽放', percentage: 3, description: '不可避免的工作延迟' }
      ],
      allowanceTypes: [
        { value: 'personal', label: '个人宽放' },
        { value: 'fatigue', label: '疲劳宽放' },
        { value: 'delay', label: '延迟宽放' },
        { value: 'policy', label: '政策宽放' },
        { value: 'special', label: '特殊宽放' }
      ],
      
      // 预定动作时间标准法数据
      motionElements: [],
      motionElementOptions: [
        { value: 'reach', label: '伸手' },
        { value: 'grasp', label: '抓取' },
        { value: 'move', label: '移动' },
        { value: 'position', label: '定位' },
        { value: 'release', label: '释放' },
        { value: 'use', label: '使用' },
        { value: 'disassemble', label: '拆卸' },
        { value: 'mental', label: '心理过程' }
      ],
      predeterminedForm: {
        basicAllowance: 15,
        specialAllowance: 5,
        learningFactor: 80
      },
      
      // 历史数据法数据
      historicalRecords: [],
      historicalForm: {
        filterMethod: 'all',
        confidenceLevel: 95,
        trendFactor: 1
      },
      
      // 批量添加对话框
      batchAddDialogVisible: false,
      batchAddForm: {
        count: 10,
        avgTime: 60,
        variation: 10,
        defaultRating: 100
      },
      
      // 版本管理数据
      versionHistory: [],
      currentVersion: null,
      versionDetailDialogVisible: false,
      
      // 分析结果数据
      analysisResults: [],
      improvementSuggestions: []
    }
  },
  computed: {
    // 时间研究法计算结果
    averageCycleTime() {
      if (this.observations.length === 0) return 0
      const sum = this.observations.reduce((acc, obs) => acc + (obs.cycleTime || 0), 0)
      return Number((sum / this.observations.length).toFixed(2))
    },
    averagePerformanceRating() {
      if (this.observations.length === 0) return 0
      const sum = this.observations.reduce((acc, obs) => acc + (obs.performanceRating || 100), 0)
      return Number((sum / this.observations.length).toFixed(1))
    },
    normalTime() {
      if (this.observations.length === 0) return 0
      // 计算所有正常时间的平均值
      const normalTimes = this.observations.map(obs => {
        return ((obs.cycleTime || 0) * (obs.performanceRating || 100)) / 100
      })
      const sum = normalTimes.reduce((acc, time) => acc + time, 0)
      return Number((sum / normalTimes.length).toFixed(2))
    },
    totalAllowancePercentage() {
      return Number(this.allowanceFactors.reduce((acc, factor) => acc + (factor.percentage || 0), 0).toFixed(2))
    },
    standardTime() {
      return Number((this.normalTime * (1 + this.totalAllowancePercentage / 100)).toFixed(2))
    },
    hourlyCapacity() {
      if (this.standardTime <= 0) return 0
      return Number((3600 / this.standardTime).toFixed(1))
    },
    
    // 预定动作时间标准法计算结果
    totalTMU() {
      return this.motionElements.reduce((acc, element) => {
        return acc + ((element.tmU || 0) * (element.frequency || 1))
      }, 0)
    },
    basicTimeFromTMU() {
      // 1 TMU = 0.036 秒
      return Number((this.totalTMU * 0.036).toFixed(2))
    },
    totalPredeterminedAllowance() {
      return Number((this.predeterminedForm.basicAllowance + this.predeterminedForm.specialAllowance).toFixed(2))
    },
    predeterminedStandardTime() {
      return Number((this.basicTimeFromTMU * (1 + this.totalPredeterminedAllowance / 100)).toFixed(2))
    },
    predeterminedHourlyCapacity() {
      if (this.predeterminedStandardTime <= 0) return 0
      return Number((3600 / this.predeterminedStandardTime).toFixed(1))
    },
    learnedStandardTime() {
      // 简化的学习曲线计算
      const learningRate = this.predeterminedForm.learningFactor / 100
      const n = Math.log(learningRate) / Math.log(2) // 学习指数
      const unitNumber = 100 // 假设生产到第100件
      const learningRatio = Math.pow(unitNumber, n)
      return Number((this.predeterminedStandardTime * learningRatio).toFixed(2))
    },
    
    // 历史数据法计算结果
    validHistoricalRecords() {
      return this.historicalRecords.filter(record => 
        record.quantity > 0 && record.totalTime > 0 && record.efficiency > 0
      )
    },
    averageHistoricalTime() {
      if (this.validHistoricalRecords.length === 0) return 0
      
      let records = [...this.validHistoricalRecords]
      // 应用数据过滤
      if (this.historicalForm.filterMethod === 'removeOutliers') {
        records = this.removeOutliers(records)
      }
      
      const times = records.map(record => {
        const unitTime = (record.totalTime / record.quantity) / record.efficiency
        return unitTime * this.historicalForm.trendFactor
      })
      
      const sum = times.reduce((acc, time) => acc + time, 0)
      return Number((sum / times.length).toFixed(2))
    },
    medianHistoricalTime() {
      if (this.validHistoricalRecords.length === 0) return 0
      
      let records = [...this.validHistoricalRecords]
      // 应用数据过滤
      if (this.historicalForm.filterMethod === 'removeOutliers') {
        records = this.removeOutliers(records)
      }
      
      const times = records.map(record => {
        return (record.totalTime / record.quantity) / record.efficiency
      }).sort((a, b) => a - b)
      
      const mid = Math.floor(times.length / 2)
      const median = times.length % 2 !== 0 ? times[mid] : (times[mid - 1] + times[mid]) / 2
      return Number((median * this.historicalForm.trendFactor).toFixed(2))
    },
    stdDevHistoricalTime() {
      if (this.validHistoricalRecords.length < 2) return 0
      
      let records = [...this.validHistoricalRecords]
      // 应用数据过滤
      if (this.historicalForm.filterMethod === 'removeOutliers') {
        records = this.removeOutliers(records)
      }
      
      const times = records.map(record => {
        return (record.totalTime / record.quantity) / record.efficiency
      })
      
      const mean = times.reduce((acc, time) => acc + time, 0) / times.length
      const variance = times.reduce((acc, time) => acc + Math.pow(time - mean, 2), 0) / times.length
      return Number(Math.sqrt(variance).toFixed(3))
    },
    dataDistribution() {
      const stdDev = this.stdDevHistoricalTime
      const mean = this.averageHistoricalTime
      
      if (mean === 0) return '数据不足'
      
      const cv = (stdDev / mean) * 100 // 变异系数
      
      if (cv < 10) return '非常集中'
      if (cv < 20) return '集中'
      if (cv < 30) return '一般'
      if (cv < 50) return '分散'
      return '非常分散'
    },
    recommendedHistoricalTime() {
      // 根据置信水平计算推荐工时
      const mean = this.averageHistoricalTime
      const stdDev = this.stdDevHistoricalTime
      const n = this.validHistoricalRecords.length
      
      if (n < 3) return mean
      
      // 简化的置信区间计算
      let confidenceFactor = 1.96 // 95%置信度
      if (this.historicalForm.confidenceLevel === 90) confidenceFactor = 1.645
      if (this.historicalForm.confidenceLevel === 99) confidenceFactor = 2.576
      
      const margin = (confidenceFactor * stdDev) / Math.sqrt(n)
      return Number((mean + margin).toFixed(2))
    },
    historicalCapacity() {
      if (this.recommendedHistoricalTime <= 0) return 0
      return Number((60 / this.recommendedHistoricalTime).toFixed(1))
    },
    dataReliability() {
      const n = this.validHistoricalRecords.length
      
      if (n < 5) return '低'
      if (n < 10) return '中低'
      if (n < 20) return '中'
      if (n < 50) return '中高'
      return '高'
    },
    timeTrend() {
      if (this.validHistoricalRecords.length < 3) return '数据不足'
      
      // 简单线性回归判断趋势
      const records = [...this.validHistoricalRecords].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      )
      
      const n = records.length
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
      
      records.forEach((record, index) => {
        const x = index
        const y = (record.totalTime / record.quantity) / record.efficiency
        sumX += x
        sumY += y
        sumXY += x * y
        sumX2 += x * x
      })
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
      const changeRate = (slope / (sumY / n)) * 100
      
      if (Math.abs(changeRate) < 5) return '稳定'
      if (changeRate < -10) return '显著下降'
      if (changeRate < 0) return '下降'
      if (changeRate > 10) return '显著上升'
      return '上升'
    }
  },
  watch: {
    // 监听operationData变化，更新基本信息
    operationData: {
      handler(newVal) {
        if (newVal) {
          this.basicForm.operationCode = newVal.operationCode || ''
          this.basicForm.operationName = newVal.operationName || ''
        }
      },
      immediate: true
    }
  },
  filters: {
    // 数字格式化过滤器
    numberFormat(value, decimals = 2) {
      if (typeof value !== 'number' || isNaN(value)) return '0'
      return value.toFixed(decimals)
    }
  },
  mounted() {
    // 初始化模拟数据
    this.initMockData()
    // 计算初始值
    this.calculateTimeStudy()
    this.calculatePredeterminedTime()
    this.calculateHistoricalData()
    // 初始化分析数据
    this.initAnalysisData()
  },
  methods: {
    // 初始化模拟数据
    initMockData() {
      // 初始化观察记录
      this.observations = [
        { cycleTime: 62.5, performanceRating: 95, normalTime: 59.4, remarks: '' },
        { cycleTime: 61.2, performanceRating: 98, normalTime: 59.9, remarks: '' },
        { cycleTime: 63.8, performanceRating: 96, normalTime: 61.2, remarks: '' },
        { cycleTime: 60.5, performanceRating: 102, normalTime: 61.7, remarks: '' },
        { cycleTime: 62.1, performanceRating: 97, normalTime: 60.2, remarks: '' },
        { cycleTime: 63.2, performanceRating: 99, normalTime: 62.6, remarks: '' },
        { cycleTime: 61.8, performanceRating: 96, normalTime: 59.3, remarks: '' },
        { cycleTime: 62.9, performanceRating: 100, normalTime: 62.9, remarks: '' },
        { cycleTime: 60.9, performanceRating: 101, normalTime: 61.5, remarks: '' },
        { cycleTime: 63.5, performanceRating: 98, normalTime: 62.2, remarks: '' }
      ]
      
      // 初始化预定动作时间数据
      this.motionElements = [
        { elementName: 'reach', description: '伸手到零件盒', tmU: 10, frequency: 1, totalTmU: 10 },
        { elementName: 'grasp', description: '抓取零件', tmU: 5, frequency: 1, totalTmU: 5 },
        { elementName: 'move', description: '移动到工作台', tmU: 15, frequency: 1, totalTmU: 15 },
        { elementName: 'position', description: '定位零件', tmU: 20, frequency: 1, totalTmU: 20 },
        { elementName: 'use', description: '加工操作', tmU: 45, frequency: 1, totalTmU: 45 },
        { elementName: 'release', description: '放置完成零件', tmU: 5, frequency: 1, totalTmU: 5 },
        { elementName: 'move', description: '返回取料位置', tmU: 12, frequency: 1, totalTmU: 12 }
      ]
      
      // 初始化历史数据
      const today = new Date()
      const historicalRecords = []
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        // 模拟数据，呈现轻微下降趋势
        const variation = (Math.random() - 0.5) * 10
        const baseTime = 6.5 - (29 - i) * 0.03 // 轻微下降趋势
        const totalTime = Math.max(40, (baseTime + variation) * 10)
        
        historicalRecords.push({
          date: dateStr,
          batchNo: `BATCH-${dateStr.replace(/-/g, '')}`,
          quantity: 10,
          totalTime: Number(totalTime.toFixed(1)),
          unitTime: 0,
          efficiency: Number((0.95 + Math.random() * 0.1).toFixed(2)),
          adjustedTime: 0
        })
      }
      
      this.historicalRecords = historicalRecords
      
      // 初始化版本历史
      this.versionHistory = [
        {
          version: 'V1.3',
          standardTime: 8.2,
          calculationMethod: '时间研究法',
          creator: '张三',
          createdAt: '2023-06-15 10:30:00',
          effectiveDate: '2023-06-20',
          status: '生效',
          remarks: '基于最新观察数据更新',
          updatedAt: '2023-06-15 10:30:00',
          detailItems: [
            { item: '平均周期时间', value: 62.3, unit: '秒', description: '10次观察的平均值' },
            { item: '绩效评级', value: 98.2, unit: '%', description: '操作人员平均绩效水平' },
            { item: '正常时间', value: 61.2, unit: '秒', description: '考虑绩效后的实际时间' },
            { item: '个人宽放', value: 5, unit: '%', description: '生理需求宽放' },
            { item: '疲劳宽放', value: 10, unit: '%', description: '体力和精神疲劳宽放' },
            { item: '延迟宽放', value: 3, unit: '%', description: '不可避免的工作延迟' }
          ]
        },
        {
          version: 'V1.2',
          standardTime: 8.5,
          calculationMethod: '时间研究法',
          creator: '李四',
          createdAt: '2023-03-10 14:20:00',
          effectiveDate: '2023-03-15',
          status: '失效',
          remarks: '季度审核调整',
          updatedAt: '2023-03-10 14:20:00',
          detailItems: []
        },
        {
          version: 'V1.1',
          standardTime: 9.0,
          calculationMethod: '预定动作时间标准法',
          creator: '王五',
          createdAt: '2022-12-05 09:15:00',
          effectiveDate: '2023-01-01',
          status: '失效',
          remarks: '初始版本',
          updatedAt: '2022-12-05 09:15:00',
          detailItems: []
        },
        {
          version: 'V2.0-Draft',
          standardTime: 7.8,
          calculationMethod: '综合分析法',
          creator: '赵六',
          createdAt: '2023-07-01 16:45:00',
          effectiveDate: '',
          status: '草稿',
          remarks: '基于工艺改进的新版本',
          updatedAt: '2023-07-01 16:45:00',
          detailItems: []
        }
      ]
    },
    
    // 初始化分析数据
    initAnalysisData() {
      this.analysisResults = [
        { name: '工时稳定性', value: '良好', description: '数据变异系数小于20%，工时稳定性良好', status: '正常' },
        { name: '数据充足性', value: '充足', description: '样本数量大于20，满足统计分析要求', status: '正常' },
        { name: '工时趋势', value: '下降', description: '近30天工时呈现下降趋势，工艺持续改善', status: '良好' },
        { name: '宽放率合理性', value: '18%', description: '总宽放率在合理范围内(15%-25%)', status: '正常' },
        { name: '绩效一致性', value: '良好', description: '绩效评级标准差小于10，操作人员表现稳定', status: '正常' },
        { name: '标准偏差', value: '0.42', description: '标准偏差较小，数据可靠性高', status: '正常' }
      ]
      
      this.improvementSuggestions = [
        { category: '操作优化', suggestion: '优化取料路径，减少物料移动距离', priority: '高', estimatedBenefit: '减少10%移动时间' },
        { category: '工装改进', suggestion: '设计专用夹具，提高零件定位效率', priority: '中', estimatedBenefit: '减少15%定位时间' },
        { category: '培训提升', suggestion: '对新员工进行专项培训，提高操作熟练度', priority: '中', estimatedBenefit: '提高5%平均绩效' },
        { category: '流程重组', suggestion: '重新规划工序顺序，减少等待时间', priority: '低', estimatedBenefit: '优化整体流程' },
        { category: '设备维护', suggestion: '加强设备日常维护，减少故障率', priority: '高', estimatedBenefit: '提高设备利用率' }
      ]
    },
    
    // 计算时间研究法数据
    calculateTimeStudy() {
      // 计算每个观察记录的正常时间
      this.observations.forEach(obs => {
        obs.normalTime = Number(((obs.cycleTime || 0) * (obs.performanceRating || 100) / 100).toFixed(2))
      })
      
      // 触发计算属性更新
      this.$forceUpdate()
    },
    
    // 计算预定动作时间法数据
    calculatePredeterminedTime() {
      // 计算每个动作元素的总TMU
      this.motionElements.forEach(element => {
        element.totalTmU = Number(((element.tmU || 0) * (element.frequency || 1)).toFixed(2))
      })
      
      // 触发计算属性更新
      this.$forceUpdate()
    },
    
    // 计算历史数据法数据
    calculateHistoricalData() {
      // 计算单位时间和调整后时间
      this.historicalRecords.forEach(record => {
        if (record.quantity > 0 && record.totalTime > 0) {
          record.unitTime = Number((record.totalTime / record.quantity).toFixed(2))
          if (record.efficiency > 0) {
            record.adjustedTime = Number((record.unitTime / record.efficiency * this.historicalForm.trendFactor).toFixed(2))
          }
        }
      })
      
      // 触发计算属性更新
      this.$forceUpdate()
    },
    
    // 添加观察记录
    addObservation() {
      this.observations.push({
        cycleTime: 60,
        performanceRating: 100,
        normalTime: 60,
        remarks: ''
      })
      this.calculateTimeStudy()
    },
    
    // 删除观察记录
    deleteObservation(index) {
      this.observations.splice(index, 1)
      this.calculateTimeStudy()
    },
    
    // 清空观察记录
    clearObservations() {
      this.$confirm('确定要清空所有观察记录吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.observations = []
        this.calculateTimeStudy()
        this.$message.success('清空成功')
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 批量添加观察记录
    batchAddObservations() {
      this.batchAddDialogVisible = true
    },
    
    // 确认批量添加
    confirmBatchAdd() {
      const { count, avgTime, variation, defaultRating } = this.batchAddForm
      
      for (let i = 0; i < count; i++) {
        // 生成随机波动的时间值
        const variationFactor = 1 + (Math.random() - 0.5) * variation / 50
        const cycleTime = Number((avgTime * variationFactor).toFixed(1))
        const normalTime = Number((cycleTime * defaultRating / 100).toFixed(2))
        
        this.observations.push({
          cycleTime,
          performanceRating: defaultRating,
          normalTime,
          remarks: `批量添加 - ${i + 1}`
        })
      }
      
      this.calculateTimeStudy()
      this.handleBatchAddDialogClose()
      this.$message.success(`成功添加${count}条观察记录`)
    },
    
    // 关闭批量添加对话框
    handleBatchAddDialogClose() {
      this.batchAddDialogVisible = false
    },
    
    // 添加宽放率
    addAllowanceFactor() {
      this.allowanceFactors.push({
        type: 'special',
        name: '新增宽放',
        percentage: 0,
        description: ''
      })
    },
    
    // 删除宽放率
    deleteAllowanceFactor(index) {
      this.allowanceFactors.splice(index, 1)
      this.calculateTimeStudy()
    },
    
    // 添加动作元素
    addMotionElement() {
      this.motionElements.push({
        elementName: 'reach',
        description: '',
        tmU: 10,
        frequency: 1,
        totalTmU: 10
      })
    },
    
    // 删除动作元素
    deleteMotionElement(index) {
      this.motionElements.splice(index, 1)
      this.calculatePredeterminedTime()
    },
    
    // 清空动作元素
    clearMotionElements() {
      this.$confirm('确定要清空所有动作元素吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.motionElements = []
        this.calculatePredeterminedTime()
        this.$message.success('清空成功')
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 添加历史记录
    addHistoricalRecord() {
      const today = new Date().toISOString().split('T')[0]
      this.historicalRecords.push({
        date: today,
        batchNo: `NEW-${Date.now()}`,
        quantity: 10,
        totalTime: 60,
        unitTime: 6,
        efficiency: 1,
        adjustedTime: 6
      })
    },
    
    // 删除历史记录
    deleteHistoricalRecord(index) {
      this.historicalRecords.splice(index, 1)
      this.calculateHistoricalData()
    },
    
    // 导入历史数据
    importHistoricalData() {
      this.$message.info('导入功能待实现')
    },
    
    // 创建新版本
    createNewVersion() {
      // 获取当前计算的标准工时（根据当前激活的标签页）
      let standardTime = 0
      let calculationMethod = ''
      
      switch (this.activeTab) {
        case 'timeStudy':
          standardTime = Number((this.standardTime / 60).toFixed(2))
          calculationMethod = '时间研究法'
          break
        case 'predeterminedTime':
          standardTime = Number((this.predeterminedStandardTime / 60).toFixed(2))
          calculationMethod = '预定动作时间标准法'
          break
        case 'historicalData':
          standardTime = this.recommendedHistoricalTime
          calculationMethod = '历史数据法'
          break
      }
      
      if (standardTime <= 0) {
        this.$message.warning('请先完成工时计算')
        return
      }
      
      // 创建新版本
      const newVersion = {
        version: this.generateNewVersion(),
        standardTime,
        calculationMethod,
        creator: '当前用户',
        createdAt: new Date().toLocaleString('zh-CN'),
        effectiveDate: '',
        status: '草稿',
        remarks: '',
        updatedAt: new Date().toLocaleString('zh-CN'),
        detailItems: []
      }
      
      this.versionHistory.unshift(newVersion)
      this.$message.success('新版本创建成功')
    },
    
    // 生成新版本号
    generateNewVersion() {
      // 查找最新版本号
      const versions = this.versionHistory
        .filter(v => !v.version.includes('Draft'))
        .map(v => v.version)
        .sort()
        .reverse()
      
      let newVersion = 'V1.0'
      
      if (versions.length > 0) {
        const latest = versions[0]
        const parts = latest.match(/V(\d+)\.(\d+)/)
        if (parts) {
          const major = parseInt(parts[1])
          const minor = parseInt(parts[2]) + 1
          newVersion = `V${major}.${minor}`
        }
      }
      
      return newVersion
    },
    
    // 查看版本详情
    viewVersionDetail(version) {
      this.currentVersion = { ...version }
      this.versionDetailDialogVisible = true
    },
    
    // 关闭版本详情对话框
    handleVersionDetailClose() {
      this.versionDetailDialogVisible = false
      this.currentVersion = null
    },
    
    // 版本对比
    compareVersions() {
      this.$message.info('版本对比功能待实现')
    },
    
    // 启用版本
    approveVersion(version) {
      this.$confirm(`确定要启用版本 ${version.version} 吗？启用后其他版本将自动失效。`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 先将所有版本设置为失效
        this.versionHistory.forEach(v => {
          if (v.status === '生效') {
            v.status = '失效'
          }
        })
        
        // 启用当前版本
        const targetVersion = this.versionHistory.find(v => v.version === version.version)
        if (targetVersion) {
          targetVersion.status = '生效'
          targetVersion.effectiveDate = new Date().toISOString().split('T')[0]
          this.$message.success('版本启用成功')
        }
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 禁用版本
    disableVersion(version) {
      this.$confirm(`确定要禁用版本 ${version.version} 吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const targetVersion = this.versionHistory.find(v => v.version === version.version)
        if (targetVersion) {
          targetVersion.status = '失效'
          this.$message.success('版本禁用成功')
        }
      }).catch(() => {
        // 取消操作
      })
    },
    
    // 保存标准工时
    saveStandardTime() {
      // 获取当前计算的标准工时
      let standardTime = 0
      let calculationMethod = ''
      
      switch (this.activeTab) {
        case 'timeStudy':
          standardTime = Number((this.standardTime / 60).toFixed(2))
          calculationMethod = '时间研究法'
          break
        case 'predeterminedTime':
          standardTime = Number((this.predeterminedStandardTime / 60).toFixed(2))
          calculationMethod = '预定动作时间标准法'
          break
        case 'historicalData':
          standardTime = this.recommendedHistoricalTime
          calculationMethod = '历史数据法'
          break
      }
      
      if (standardTime <= 0) {
        this.$message.warning('请先完成工时计算')
        return
      }
      
      const standardTimeData = {
        operationCode: this.basicForm.operationCode,
        operationName: this.basicForm.operationName,
        productModel: this.basicForm.productModel,
        standardTime,
        calculationMethod,
        calculatedAt: new Date().toLocaleString('zh-CN')
      }
      
      // 模拟保存操作
      setTimeout(() => {
        this.$message.success('标准工时保存成功')
        this.$emit('standard-time-saved', standardTimeData)
      }, 500)
    },
    
    // 移除异常值
    removeOutliers(records) {
      if (records.length < 4) return records
      
      const times = records.map(record => (record.totalTime / record.quantity) / record.efficiency)
      const sorted = [...times].sort((a, b) => a - b)
      
      // 使用四分位距法移除异常值
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr
      
      return records.filter(record => {
        const time = (record.totalTime / record.quantity) / record.efficiency
        return time >= lowerBound && time <= upperBound
      })
    },
    
    // 格式化工具方法
    formatNumber(row, column, cellValue) {
      if (typeof cellValue !== 'number' || isNaN(cellValue)) return '0'
      return cellValue.toFixed(2)
    },
    
    formatDistribution(value) {
      return value
    },
    
    formatReliability(value) {
      return value
    },
    
    formatTrend(value) {
      return value
    },
    
    formatAnalysisValue(row, column, cellValue) {
      return cellValue
    },
    
    getStatusType(status) {
      const statusMap = {
        '正常': 'success',
        '良好': 'success',
        '生效': 'success',
        '失效': 'info',
        '草稿': 'warning',
        '异常': 'danger'
      }
      return statusMap[status] || 'default'
    },
    
    getPriorityType(priority) {
      const priorityMap = {
        '高': 'danger',
        '中': 'warning',
        '低': 'info'
      }
      return priorityMap[priority] || 'default'
    }
  }
}
</script>

<style scoped>
.standard-time {
  padding: 20px;
  background-color: #f5f7fa;
}

/* 基本信息栏 */
.basic-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

/* 标签页内容 */
.tab-content {
  padding: 20px;
}

/* 区域标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.section-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 结果区域 */
.results-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f0f2f5;
  border-radius: