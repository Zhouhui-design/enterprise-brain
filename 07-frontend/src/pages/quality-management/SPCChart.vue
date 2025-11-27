<template>
  <div class="spc-chart">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>SPC统计过程控制</span>
          <el-button type="primary" @click="handleCreateChart">
            <el-icon><Plus /></el-icon> 创建控制图
          </el-button>
        </div>
      </template>
      
      <!-- 搜索条件 -->
      <el-form :inline="true" :model="searchForm" class="search-form" label-width="100px">
        <el-form-item label="图表名称">
          <el-input v-model="searchForm.chartName" placeholder="请输入图表名称" clearable />
        </el-form-item>
        <el-form-item label="产品编号">
          <el-input v-model="searchForm.productCode" placeholder="请输入产品编号" clearable />
        </el-form-item>
        <el-form-item label="参数名称">
          <el-input v-model="searchForm.parameterName" placeholder="请输入参数名称" clearable />
        </el-form-item>
        <el-form-item label="图表类型">
          <el-select v-model="searchForm.chartType" placeholder="请选择图表类型" clearable>
            <el-option label="X-R图(均值-极差图)" value="xR" />
            <el-option label="X-S图(均值-标准差图)" value="xS" />
            <el-option label="P图(不良率图)" value="p" />
            <el-option label="C图(缺陷数图)" value="c" />
            <el-option label="U图(单位缺陷数图)" value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建日期">
          <el-date-picker
            v-model="searchForm.createdDate"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 控制图列表 -->
      <el-table :data="spcCharts" style="width: 100%" border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="chartName" label="图表名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="chartCode" label="图表编号" width="150" />
        <el-table-column prop="productCode" label="产品编号" width="120" />
        <el-table-column prop="parameterName" label="参数名称" width="150" />
        <el-table-column prop="chartType" label="图表类型" width="150">
          <template #default="{ row }">
            <el-tag>{{ getChartTypeText(row.chartType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdated" label="最后更新" width="130" :formatter="formatDate" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewChart(row)">查看图表</el-button>
            <el-button size="small" @click="handleEditChart(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteChart(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination" style="margin-top: 20px;">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 图表详情视图 -->
    <el-card v-if="currentChart && viewChartVisible" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>{{ currentChart.chartName }}</span>
          <div>
            <el-button size="small" @click="handleRefreshChart">刷新数据</el-button>
            <el-button size="small" @click="handleExportChart">导出图表</el-button>
            <el-button size="small" @click="handleAddDataPoint">添加数据点</el-button>
          </div>
        </div>
      </template>
      
      <!-- 图表信息 -->
      <el-descriptions :column="3" border style="margin-bottom: 20px;">
        <el-descriptions-item label="图表编号">{{ currentChart.chartCode }}</el-descriptions-item>
        <el-descriptions-item label="产品编号">{{ currentChart.productCode }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentChart.productName }}</el-descriptions-item>
        <el-descriptions-item label="参数名称">{{ currentChart.parameterName }}</el-descriptions-item>
        <el-descriptions-item label="图表类型">{{ getChartTypeText(currentChart.chartType) }}</el-descriptions-item>
        <el-descriptions-item label="规格下限">{{ currentChart.lsl }}</el-descriptions-item>
        <el-descriptions-item label="目标值">{{ currentChart.target }}</el-descriptions-item>
        <el-descriptions-item label="规格上限">{{ currentChart.usl }}</el-descriptions-item>
        <el-descriptions-item label="样本量">{{ currentChart.sampleSize }}</el-descriptions-item>
        <el-descriptions-item label="收集时间" :span="3">{{ formatDateTime(currentChart.collectionStartTime) }} 至 {{ formatDateTime(currentChart.collectionEndTime) }}</el-descriptions-item>
      </el-descriptions>
      
      <!-- 控制图区域 -->
      <div class="chart-container">
        <div id="spcChartContainer" style="height: 500px;"></div>
      </div>
      
      <!-- 统计信息 -->
      <div class="stats-container" style="margin-top: 20px;">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>统计信息</span>
            </div>
          </template>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="平均值">{{ currentChart.stats?.mean || '-' }}</el-descriptions-item>
            <el-descriptions-item label="标准差">{{ currentChart.stats?.stdDev || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Cp">{{ currentChart.stats?.cp || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Cpk">{{ currentChart.stats?.cpk || '-' }}</el-descriptions-item>
            <el-descriptions-item label="数据点总数">{{ currentChart.stats?.totalDataPoints || '-' }}</el-descriptions-item>
            <el-descriptions-item label="超出控制限点">{{ currentChart.stats?.outOfControlPoints || '-' }}</el-descriptions-item>
            <el-descriptions-item label="过程能力状态">{{ getCapabilityStatusText(currentChart.stats?.capabilityStatus) }}</el-descriptions-item>
            <el-descriptions-item label="控制状态">{{ getControlStatusText(currentChart.stats?.controlStatus) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
      
      <!-- 数据列表 -->
      <div class="data-list-container" style="margin-top: 20px;">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>数据点列表</span>
              <el-pagination
                v-model:current-page="dataPagination.currentPage"
                v-model:page-size="dataPagination.pageSize"
                layout="prev, pager, next, jumper"
                :total="currentChart.dataPoints?.length || 0"
                @size-change="handleDataSizeChange"
                @current-change="handleDataCurrentChange"
              />
            </div>
          </template>
          <el-table :data="paginatedDataPoints" style="width: 100%" border>
            <el-table-column prop="sampleNumber" label="样本号" width="100" />
            <el-table-column prop="sampleData" label="样本数据" min-width="200">
              <template #default="{ row }">
                {{ row.sampleData.join(', ') }}
              </template>
            </el-table-column>
            <el-table-column prop="sampleMean" label="样本均值" width="100" />
            <el-table-column prop="sampleRange" label="样本极差" width="100" v-if="['xR'].includes(currentChart.chartType)" />
            <el-table-column prop="sampleStdDev" label="样本标准差" width="120" v-if="['xS'].includes(currentChart.chartType)" />
            <el-table-column prop="dateTime" label="收集时间" width="150" :formatter="formatDateTime" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="handleEditDataPoint(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDeleteDataPoint(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-card>
    
    <!-- 新建/编辑控制图对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑控制图' : '创建控制图'"
      width="800px"
      destroy-on-close
    >
      <el-form :model="chartForm" :rules="chartFormRules" ref="chartFormRef" label-width="120px">
        <el-form-item label="图表名称" prop="chartName">
          <el-input v-model="chartForm.chartName" placeholder="请输入图表名称" />
        </el-form-item>
        <el-form-item label="产品编号" prop="productCode">
          <el-input v-model="chartForm.productCode" placeholder="请输入产品编号" />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-input v-model="chartForm.productName" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="参数名称" prop="parameterName">
          <el-input v-model="chartForm.parameterName" placeholder="请输入监控参数名称" />
        </el-form-item>
        <el-form-item label="图表类型" prop="chartType">
          <el-select v-model="chartForm.chartType" placeholder="请选择图表类型">
            <el-option label="X-R图(均值-极差图)" value="xR" />
            <el-option label="X-S图(均值-标准差图)" value="xS" />
            <el-option label="P图(不良率图)" value="p" />
            <el-option label="C图(缺陷数图)" value="c" />
            <el-option label="U图(单位缺陷数图)" value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="样本量" prop="sampleSize">
          <el-input v-model.number="chartForm.sampleSize" type="number" placeholder="请输入样本量" />
        </el-form-item>
        <el-form-item label="规格下限" prop="lsl">
          <el-input v-model.number="chartForm.lsl" type="number" placeholder="请输入规格下限" />
        </el-form-item>
        <el-form-item label="目标值" prop="target">
          <el-input v-model.number="chartForm.target" type="number" placeholder="请输入目标值" />
        </el-form-item>
        <el-form-item label="规格上限" prop="usl">
          <el-input v-model.number="chartForm.usl" type="number" placeholder="请输入规格上限" />
        </el-form-item>
        <el-form-item label="说明备注">
          <el-input v-model="chartForm.description" type="textarea" :rows="3" placeholder="请输入说明备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveChart">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 添加数据点对话框 -->
    <el-dialog
      v-model="addDataDialogVisible"
      title="添加数据点"
      width="700px"
      destroy-on-close
    >
      <el-form :model="dataPointForm" :rules="dataPointFormRules" ref="dataPointFormRef" label-width="100px">
        <el-form-item label="样本号" prop="sampleNumber">
          <el-input v-model.number="dataPointForm.sampleNumber" type="number" placeholder="请输入样本号" />
        </el-form-item>
        <el-form-item label="样本数据" prop="sampleData">
          <el-input
            v-model="dataPointForm.sampleDataInput"
            placeholder="请输入样本数据，多个数据用逗号分隔"
            @change="parseSampleData"
          />
        </el-form-item>
        <el-form-item label="收集时间" prop="dateTime">
          <el-date-picker
            v-model="dataPointForm.dateTime"
            type="datetime"
            placeholder="选择收集时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDataDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveDataPoint">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Download, PlusCircle, Edit, Delete } from '@element-plus/icons-vue';

export default {
  name: 'SPCChart',
  components: {
    Plus,
    Refresh,
    Download,
    PlusCircle,
    Edit,
    Delete
  },
  setup() {
    // 状态管理
    const spcCharts = ref([]);
    const dialogVisible = ref(false);
    const viewChartVisible = ref(false);
    const addDataDialogVisible = ref(false);
    const isEdit = ref(false);
    const chartFormRef = ref(null);
    const dataPointFormRef = ref(null);
    const currentChart = reactive({});
    const currentDataPoint = reactive({});
    
    // 搜索表单
    const searchForm = reactive({
      chartName: '',
      productCode: '',
      parameterName: '',
      chartType: '',
      createdDate: null
    });
    
    // 分页信息
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    });
    
    // 数据点分页
    const dataPagination = reactive({
      currentPage: 1,
      pageSize: 10
    });
    
    // 图表表单
    const chartForm = reactive({
      id: '',
      chartCode: '',
      chartName: '',
      productCode: '',
      productName: '',
      parameterName: '',
      chartType: 'xR',
      sampleSize: 5,
      lsl: 0,
      target: 100,
      usl: 200,
      description: '',
      status: 'active',
      collectionStartTime: null,
      collectionEndTime: null
    });
    
    // 数据点表单
    const dataPointForm = reactive({
      id: '',
      sampleNumber: 0,
      sampleData: [],
      sampleDataInput: '',
      sampleMean: 0,
      sampleRange: 0,
      sampleStdDev: 0,
      dateTime: new Date()
    });
    
    // 表单验证规则
    const chartFormRules = {
      chartName: [
        { required: true, message: '请输入图表名称', trigger: 'blur' }
      ],
      productCode: [
        { required: true, message: '请输入产品编号', trigger: 'blur' }
      ],
      productName: [
        { required: true, message: '请输入产品名称', trigger: 'blur' }
      ],
      parameterName: [
        { required: true, message: '请输入监控参数名称', trigger: 'blur' }
      ],
      chartType: [
        { required: true, message: '请选择图表类型', trigger: 'change' }
      ],
      sampleSize: [
        { required: true, message: '请输入样本量', trigger: 'blur' },
        { type: 'number', min: 1, message: '样本量必须大于0', trigger: 'blur' }
      ],
      lsl: [
        { required: true, message: '请输入规格下限', trigger: 'blur' }
      ],
      usl: [
        { required: true, message: '请输入规格上限', trigger: 'blur' },
        { validator: validateUSL, trigger: 'blur' }
      ]
    };
    
    // 验证规格上限
    const validateUSL = (rule, value, callback) => {
      if (value <= chartForm.lsl) {
        callback(new Error('规格上限必须大于规格下限'));
      } else {
        callback();
      }
    };
    
    // 数据点表单验证规则
    const dataPointFormRules = {
      sampleNumber: [
        { required: true, message: '请输入样本号', trigger: 'blur' }
      ],
      sampleDataInput: [
        { required: true, message: '请输入样本数据', trigger: 'blur' },
        { validator: validateSampleData, trigger: 'blur' }
      ],
      dateTime: [
        { required: true, message: '请选择收集时间', trigger: 'change' }
      ]
    };
    
    // 验证样本数据
    const validateSampleData = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入样本数据'));
        return;
      }
      
      const dataArray = value.split(',').map(item => parseFloat(item.trim()));
      
      // 检查是否都为有效数字
      const allValid = dataArray.every(item => !isNaN(item));
      if (!allValid) {
        callback(new Error('请输入有效的数字，用逗号分隔'));
        return;
      }
      
      // 检查样本数量是否符合要求
      if (dataArray.length !== chartForm.sampleSize) {
        callback(new Error(`样本数据数量必须为${chartForm.sampleSize}个`));
        return;
      }
      
      callback();
    };
    
    // 计算分页后的数据点
    const paginatedDataPoints = computed(() => {
      if (!currentChart.dataPoints || currentChart.dataPoints.length === 0) return [];
      
      const start = (dataPagination.currentPage - 1) * dataPagination.pageSize;
      const end = start + dataPagination.pageSize;
      return currentChart.dataPoints.slice(start, end);
    });
    
    // 监听当前图表变化，重新渲染图表
    watch(() => currentChart.id, (newId) => {
      if (newId && viewChartVisible.value) {
        nextTick(() => {
          renderChart();
        });
      }
    });
    
    // 初始化加载数据
    onMounted(() => {
      loadSPCCharts();
    });
    
    // 加载SPC图表数据
    const loadSPCCharts = () => {
      // 模拟数据
      spcCharts.value = generateMockSPCCharts();
      pagination.total = spcCharts.value.length;
    };
    
    // 生成模拟SPC图表数据
    const generateMockSPCCharts = () => {
      const chartTypes = ['xR', 'xS', 'p', 'c', 'u'];
      const statuses = ['active', 'inactive', 'completed'];
      const products = [
        { code: 'P001', name: '精密轴承' },
        { code: 'P002', name: '液压泵' },
        { code: 'P003', name: '气缸' },
        { code: 'P004', name: '控制阀' },
        { code: 'P005', name: '传感器' }
      ];
      const parameters = ['尺寸公差', '表面粗糙度', '硬度', '密度', '抗拉强度', '耐磨性能'];
      
      return Array.from({ length: 30 }, (_, i) => {
        const chartType = chartTypes[Math.floor(Math.random() * chartTypes.length)];
        const product = products[Math.floor(Math.random() * products.length)];
        const parameter = parameters[Math.floor(Math.random() * parameters.length)];
        const sampleSize = Math.floor(Math.random() * 5) + 3; // 3-8个样本
        
        return {
          id: i + 1,
          chartCode: `SPC${2024}${String(i + 1).padStart(5, '0')}`,
          chartName: `${product.name}${parameter}控制图`,
          productCode: product.code,
          productName: product.name,
          parameterName: parameter,
          chartType,
          sampleSize,
          lsl: Math.floor(Math.random() * 50),
          target: 100 + Math.floor(Math.random() * 50),
          usl: 200 + Math.floor(Math.random() * 50),
          description: `${product.name}的${parameter}参数监控控制图`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          createdDate: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)),
          lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)),
          collectionStartTime: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)),
          collectionEndTime: new Date(),
          dataPoints: generateDataPoints(sampleSize, chartType),
          controlLimits: generateControlLimits(chartType),
          stats: generateStatistics()
        };
      });
    };
    
    // 生成数据点
    const generateDataPoints = (sampleSize, chartType) => {
      const pointCount = Math.floor(Math.random() * 30) + 20; // 20-50个数据点
      const baseValue = 100;
      const variation = 20;
      
      return Array.from({ length: pointCount }, (_, i) => {
        const sampleData = Array.from({ length: sampleSize }, () => {
          // 生成随机数据，添加一些异常值
          const isOutlier = Math.random() < 0.05; // 5%概率为异常值
          if (isOutlier) {
            return baseValue + (Math.random() > 0.5 ? 1 : -1) * variation * 2;
          }
          return baseValue + (Math.random() - 0.5) * variation * 2;
        });
        
        const sampleMean = sampleData.reduce((sum, val) => sum + val, 0) / sampleSize;
        const sampleRange = Math.max(...sampleData) - Math.min(...sampleData);
        const sampleStdDev = Math.sqrt(
          sampleData.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / (sampleSize - 1)
        );
        
        return {
          id: i + 1,
          sampleNumber: i + 1,
          sampleData,
          sampleMean: parseFloat(sampleMean.toFixed(4)),
          sampleRange: parseFloat(sampleRange.toFixed(4)),
          sampleStdDev: parseFloat(sampleStdDev.toFixed(4)),
          dateTime: new Date(Date.now() - (pointCount - i - 1) * 24 * 60 * 60 * 1000)
        };
      });
    };
    
    // 生成控制限
    const generateControlLimits = (chartType) => {
      return {
        ucl: 120,
        cl: 100,
        lcl: 80
      };
    };
    
    // 生成统计信息
    const generateStatistics = () => {
      return {
        mean: 100.5,
        stdDev: 8.2,
        cp: 1.2,
        cpk: 1.1,
        totalDataPoints: 40,
        outOfControlPoints: 2,
        capabilityStatus: 'adequate', // excellent, adequate, poor
        controlStatus: 'stable' // stable, unstable
      };
    };
    
    // 渲染图表
    const renderChart = () => {
      // 实际项目中这里应该使用ECharts等图表库
      // 这里只做占位，实际使用时需要引入相应的图表库
      console.log('渲染SPC控制图');
    };
    
    // 搜索
    const handleSearch = () => {
      // 实际项目中这里应该调用API进行搜索
      ElMessage.success('搜索成功');
    };
    
    // 重置
    const handleReset = () => {
      Object.assign(searchForm, {
        chartName: '',
        productCode: '',
        parameterName: '',
        chartType: '',
        createdDate: null
      });
    };
    
    // 分页处理
    const handleSizeChange = (size) => {
      pagination.pageSize = size;
    };
    
    const handleCurrentChange = (current) => {
      pagination.currentPage = current;
    };
    
    // 数据点分页处理
    const handleDataSizeChange = (size) => {
      dataPagination.pageSize = size;
    };
    
    const handleDataCurrentChange = (current) => {
      dataPagination.currentPage = current;
    };
    
    // 创建控制图
    const handleCreateChart = () => {
      isEdit.value = false;
      resetChartForm();
      dialogVisible.value = true;
    };
    
    // 编辑控制图
    const handleEditChart = (row) => {
      isEdit.value = true;
      Object.assign(chartForm, JSON.parse(JSON.stringify(row)));
      dialogVisible.value = true;
    };
    
    // 查看图表
    const handleViewChart = (row) => {
      Object.assign(currentChart, JSON.parse(JSON.stringify(row)));
      viewChartVisible.value = true;
      dataPagination.currentPage = 1;
      nextTick(() => {
        renderChart();
      });
    };
    
    // 刷新图表数据
    const handleRefreshChart = () => {
      // 模拟刷新数据
      if (currentChart.id) {
        const chartIndex = spcCharts.value.findIndex(item => item.id === currentChart.id);
        if (chartIndex !== -1) {
          const updatedChart = generateMockSPCCharts()[chartIndex % 30];
          Object.assign(currentChart, updatedChart);
          currentChart.id = spcCharts.value[chartIndex].id; // 保持ID不变
          currentChart.chartCode = spcCharts.value[chartIndex].chartCode;
          currentChart.chartName = spcCharts.value[chartIndex].chartName;
          ElMessage.success('图表数据已刷新');
          nextTick(() => {
            renderChart();
          });
        }
      }
    };
    
    // 导出图表
    const handleExportChart = () => {
      ElMessage.success('图表导出功能待实现');
    };
    
    // 添加数据点
    const handleAddDataPoint = () => {
      if (!currentChart.id) return;
      
      resetDataPointForm();
      // 设置下一个样本号
      const lastPoint = currentChart.dataPoints[currentChart.dataPoints.length - 1];
      dataPointForm.sampleNumber = lastPoint ? lastPoint.sampleNumber + 1 : 1;
      addDataDialogVisible.value = true;
    };
    
    // 编辑数据点
    const handleEditDataPoint = (row) => {
      Object.assign(currentDataPoint, JSON.parse(JSON.stringify(row)));
      Object.assign(dataPointForm, JSON.parse(JSON.stringify(row)));
      dataPointForm.sampleDataInput = row.sampleData.join(', ');
      addDataDialogVisible.value = true;
    };
    
    // 删除数据点
    const handleDeleteDataPoint = (row) => {
      ElMessageBox.confirm(`确定要删除样本号${row.sampleNumber}的数据点吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = currentChart.dataPoints.findIndex(item => item.id === row.id);
        if (index !== -1) {
          currentChart.dataPoints.splice(index, 1);
          ElMessage.success('数据点删除成功');
          // 重新排序样本号
          currentChart.dataPoints.forEach((point, i) => {
            point.sampleNumber = i + 1;
          });
          nextTick(() => {
            renderChart();
          });
        }
      }).catch(() => {});
    };
    
    // 解析样本数据
    const parseSampleData = () => {
      if (!dataPointForm.sampleDataInput) return;
      
      const dataArray = dataPointForm.sampleDataInput
        .split(',')
        .map(item => parseFloat(item.trim()))
        .filter(item => !isNaN(item));
      
      dataPointForm.sampleData = dataArray;
      
      if (dataArray.length > 0) {
        // 计算均值、极差和标准差
        const mean = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;
        const range = Math.max(...dataArray) - Math.min(...dataArray);
        const stdDev = Math.sqrt(
          dataArray.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (dataArray.length - 1 || 1)
        );
        
        dataPointForm.sampleMean = parseFloat(mean.toFixed(4));
        dataPointForm.sampleRange = parseFloat(range.toFixed(4));
        dataPointForm.sampleStdDev = parseFloat(stdDev.toFixed(4));
      }
    };
    
    // 保存数据点
    const handleSaveDataPoint = () => {
      dataPointFormRef.value?.validate((valid) => {
        if (valid) {
          if (!currentDataPoint.id) {
            // 新建数据点
            const newDataPoint = {
              ...JSON.parse(JSON.stringify(dataPointForm)),
              id: Date.now()
            };
            currentChart.dataPoints.push(newDataPoint);
          } else {
            // 编辑现有数据点
            const index = currentChart.dataPoints.findIndex(item => item.id === currentDataPoint.id);
            if (index !== -1) {
              currentChart.dataPoints[index] = {
                ...JSON.parse(JSON.stringify(dataPointForm))
              };
            }
          }
          
          ElMessage.success('数据点保存成功');
          addDataDialogVisible.value = false;
          resetDataPointForm();
          
          nextTick(() => {
            renderChart();
          });
        }
      });
    };
    
    // 保存控制图
    const handleSaveChart = () => {
      chartFormRef.value?.validate((valid) => {
        if (valid) {
          if (!isEdit.value) {
            // 新建控制图，生成编号
            const chartCode = `SPC${new Date().getFullYear()}${String(spcCharts.value.length + 1).padStart(5, '0')}`;
            chartForm.chartCode = chartCode;
            chartForm.createdDate = new Date();
            chartForm.lastUpdated = new Date();
            chartForm.collectionStartTime = new Date();
            chartForm.collectionEndTime = new Date();
            chartForm.dataPoints = [];
            chartForm.controlLimits = generateControlLimits(chartForm.chartType);
            chartForm.stats = generateStatistics();
            spcCharts.value.unshift(JSON.parse(JSON.stringify(chartForm)));
            pagination.total++;
          } else {
            // 编辑现有控制图
            const index = spcCharts.value.findIndex(item => item.id === chartForm.id);
            if (index !== -1) {
              chartForm.lastUpdated = new Date();
              spcCharts.value[index] = JSON.parse(JSON.stringify(chartForm));
            }
          }
          ElMessage.success(isEdit.value ? '控制图更新成功' : '控制图创建成功');
          dialogVisible.value = false;
        }
      });
    };
    
    // 删除控制图
    const handleDeleteChart = (row) => {
      ElMessageBox.confirm(`确定要删除控制图「${row.chartName}」吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'danger'
      }).then(() => {
        const index = spcCharts.value.findIndex(item => item.id === row.id);
        if (index !== -1) {
          spcCharts.value.splice(index, 1);
          pagination.total--;
          ElMessage.success('控制图删除成功');
          // 如果删除的是当前查看的图表，关闭查看视图
          if (currentChart.id === row.id) {
            viewChartVisible.value = false;
            Object.keys(currentChart).forEach(key => delete currentChart[key]);
          }
        }
      }).catch(() => {});
    };
    
    // 重置图表表单
    const resetChartForm = () => {
      chartFormRef.value?.resetFields();
      Object.assign(chartForm, {
        id: '',
        chartCode: '',
        chartName: '',
        productCode: '',
        productName: '',
        parameterName: '',
        chartType: 'xR',
        sampleSize: 5,
        lsl: 0,
        target: 100,
        usl: 200,
        description: '',
        status: 'active'
      });
    };
    
    // 重置数据点表单
    const resetDataPointForm = () => {
      dataPointFormRef.value?.resetFields();
      Object.assign(dataPointForm, {
        id: '',
        sampleNumber: 0,
        sampleData: [],
        sampleDataInput: '',
        sampleMean: 0,
        sampleRange: 0,
        sampleStdDev: 0,
        dateTime: new Date()
      });
      Object.keys(currentDataPoint).forEach(key => delete currentDataPoint[key]);
    };
    
    // 获取图表类型文本
    const getChartTypeText = (type) => {
      const typeMap = {
        xR: 'X-R图(均值-极差图)',
        xS: 'X-S图(均值-标准差图)',
        p: 'P图(不良率图)',
        c: 'C图(缺陷数图)',
        u: 'U图(单位缺陷数图)'
      };
      return typeMap[type] || '未知类型';
    };
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        active: 'success',
        inactive: 'warning',
        completed: 'info'
      };
      return statusMap[status] || 'default';
    };
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        active: '活跃',
        inactive: '暂停',
        completed: '完成'
      };
      return statusMap[status] || '未知状态';
    };
    
    // 获取过程能力状态文本
    const getCapabilityStatusText = (status) => {
      const statusMap = {
        excellent: '优',
        adequate: '合格',
        poor: '不足'
      };
      return statusMap[status] || '-';
    };
    
    // 获取控制状态文本
    const getControlStatusText = (status) => {
      const statusMap = {
        stable: '稳定',
        unstable: '不稳定'
      };
      return statusMap[status] || '-';
    };
    
    // 格式化日期
    const formatDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    
    // 格式化日期时间
    const formatDateTime = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    
    return {
      spcCharts,
      dialogVisible,
      viewChartVisible,
      addDataDialogVisible,
      isEdit,
      chartFormRef,
      dataPointFormRef,
      currentChart,
      searchForm,
      pagination,
      dataPagination,
      chartForm,
      dataPointForm,
      chartFormRules,
      dataPointFormRules,
      paginatedDataPoints,
      
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleDataSizeChange,
      handleDataCurrentChange,
      handleCreateChart,
      handleEditChart,
      handleViewChart,
      handleRefreshChart,
      handleExportChart,
      handleAddDataPoint,
      handleEditDataPoint,
      handleDeleteDataPoint,
      parseSampleData,
      handleSaveDataPoint,
      handleSaveChart,
      handleDeleteChart,
      getChartTypeText,
      getStatusType,
      getStatusText,
      getCapabilityStatusText,
      getControlStatusText,
      formatDate,
      formatDateTime
    };
  }
};
</script>

<style scoped>
.spc-chart {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  text-align: right;
}

.chart-container {
  margin-top: 20px;
}

.stats-container {
  margin-top: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.data-list-container {
  margin-top: 20px;
}
</style>