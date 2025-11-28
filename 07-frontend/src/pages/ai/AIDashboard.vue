<template>
  <div class="ai-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>AI智能分析中心</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showModelDialog = true">
          <i class="fas fa-plus"></i> 添加模型
        </el-button>
        <el-button @click="refreshData" :loading="refreshing">
          <i class="fas fa-sync"></i> 刷新数据
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6" v-for="(stat, index) in statsData" :key="index">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                <i :class="stat.icon"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-trend" :class="stat.trend">
                  <i :class="stat.trend === 'up' ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- AI模型管理 -->
    <div class="models-section">
      <el-card>
        <template #header>
          <div class="section-header">
            <span>AI模型管理</span>
            <div class="header-controls">
              <el-select v-model="modelFilter" placeholder="筛选模型" size="small" style="width: 150px">
                <el-option label="全部" value="all" />
                <el-option label="运行中" value="running" />
                <el-option label="已停止" value="stopped" />
                <el-option label="训练中" value="training" />
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table :data="filteredModels" v-loading="modelsLoading" stripe>
          <el-table-column prop="name" label="模型名称" width="200" />
          <el-table-column prop="type" label="模型类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getModelTypeTag(row.type)">
                {{ getModelTypeLabel(row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="accuracy" label="准确率" width="100">
            <template #default="{ row }">
              <span :class="getAccuracyClass(row.accuracy)">
                {{ row.accuracy }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="lastTrained" label="最后训练" width="140" />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewModel(row)">详情</el-button>
              <el-button size="small" type="primary" @click="trainModel(row)" v-if="row.status !== 'training'">
                训练
              </el-button>
              <el-button size="small" type="success" @click="deployModel(row)" v-if="row.status === 'stopped'">
                部署
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 智能分析 -->
    <div class="analysis-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="section-header">
                <span>异常检测</span>
                <el-button size="small" @click="runAnomalyDetection">开始检测</el-button>
              </div>
            </template>
            <div class="anomaly-content">
              <div class="anomaly-stats">
                <div class="stat-item">
                  <div class="stat-number">{{ anomalyStats.total }}</div>
                  <div class="stat-desc">检测项目</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number anomaly">{{ anomalyStats.anomalies }}</div>
                  <div class="stat-desc">异常项目</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number normal">{{ anomalyStats.normal }}</div>
                  <div class="stat-desc">正常项目</div>
                </div>
              </div>
              <div class="anomaly-chart">
                <el-progress
                  type="circle"
                  :percentage="anomalyStats.normalPercentage"
                  :width="120"
                  :color="['#409EFF', '#67C23A']"
                >
                  <span class="progress-text">{{ anomalyStats.normalPercentage }}%</span>
                </el-progress>
                <div class="chart-label">正常率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="section-header">
                <span>预测分析</span>
                <el-select v-model="predictionType" size="small" style="width: 150px">
                  <el-option label="销售预测" value="sales" />
                  <el-option label="库存预测" value="inventory" />
                  <el-option label="生产预测" value="production" />
                </el-select>
              </div>
            </template>
            <div class="prediction-content">
              <div class="prediction-result">
                <div class="result-title">{{ getPredictionTitle() }}</div>
                <div class="result-value">{{ currentPrediction.value }}</div>
                <div class="result-trend" :class="currentPrediction.trend">
                  <i :class="getTrendIcon(currentPrediction.trend)"></i>
                  {{ currentPrediction.change }}
                </div>
              </div>
              <div class="prediction-chart">
                <div class="mini-chart">
                  <div v-for="(point, index) in predictionData" :key="index" 
                       class="chart-bar" 
                       :style="{ height: `${(point.value / maxValue) * 100}%` }"
                       :title="`日期: ${point.date}, 值: ${point.value}`">
                  </div>
                </div>
                <div class="chart-label">趋势图</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- AI建议 -->
    <div class="suggestions-section">
      <el-card>
        <template #header>
          <div class="section-header">
            <span>智能建议</span>
            <el-button size="small" @click="refreshSuggestions">刷新建议</el-button>
          </div>
        </template>
        <div class="suggestions-list">
          <div v-for="(suggestion, index) in suggestions" :key="index" class="suggestion-item">
            <div class="suggestion-icon" :class="suggestion.priority">
              <i :class="getSuggestionIcon(suggestion.priority)"></i>
            </div>
            <div class="suggestion-content">
              <div class="suggestion-title">{{ suggestion.title }}</div>
              <div class="suggestion-desc">{{ suggestion.description }}</div>
              <div class="suggestion-actions">
                <el-button size="small" type="primary" @click="acceptSuggestion(suggestion)">
                  采纳建议
                </el-button>
                <el-button size="small" @click="ignoreSuggestion(suggestion)">
                  忽略
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 模型详情对话框 -->
    <el-dialog v-model="showModelDetail" title="模型详情" width="800px">
      <div class="model-detail" v-if="selectedModel">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="模型名称">{{ selectedModel.name }}</el-descriptions-item>
          <el-descriptions-item label="模型类型">{{ getModelTypeLabel(selectedModel.type) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(selectedModel.status)">
              {{ getStatusLabel(selectedModel.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="准确率">{{ selectedModel.accuracy }}%</el-descriptions-item>
          <el-descriptions-item label="训练样本数">{{ selectedModel.samples.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="训练时间">{{ selectedModel.trainingTime }}</el-descriptions-item>
          <el-descriptions-item label="最后训练">{{ selectedModel.lastTrained }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedModel.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedModel.description }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="model-metrics" style="margin-top: 20px;">
          <h4>性能指标</h4>
          <el-row :gutter="15">
            <el-col :span="8" v-for="(metric, key) in selectedModel.metrics" :key="key">
              <div class="metric-card">
                <div class="metric-label">{{ key }}</div>
                <div class="metric-value">{{ metric }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-dialog>

    <!-- 添加模型对话框 -->
    <el-dialog v-model="showModelDialog" title="添加AI模型" width="600px">
      <el-form :model="newModel" :rules="modelRules" ref="modelFormRef" label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="newModel.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="模型类型" prop="type">
          <el-select v-model="newModel.type" placeholder="请选择模型类型" style="width: 100%">
            <el-option label="图像识别" value="image" />
            <el-option label="文本分析" value="text" />
            <el-option label="预测分析" value="prediction" />
            <el-option label="异常检测" value="anomaly" />
            <el-option label="推荐系统" value="recommendation" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newModel.description" type="textarea" :rows="3" placeholder="请输入模型描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showModelDialog = false">取消</el-button>
          <el-button type="primary" @click="saveModel" :loading="saving">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface AIModel {
  id: string
  name: string
  type: string
  status: string
  accuracy: number
  samples: number
  trainingTime: string
  lastTrained: string
  createdAt: string
  description: string
  metrics: Record<string, string>
}

interface Suggestion {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: string
}

interface Prediction {
  value: string
  trend: 'up' | 'down' | 'stable'
  change: string
}

interface PredictionPoint {
  date: string
  value: number
}

const refreshing = ref(false)
const modelsLoading = ref(false)
const saving = ref(false)
const showModelDialog = ref(false)
const showModelDetail = ref(false)
const selectedModel = ref<AIModel | null>(null)
const modelFilter = ref('all')
const predictionType = ref('sales')

const newModel = reactive({
  name: '',
  type: '',
  description: ''
})

const modelRules = {
  name: [
    { required: true, message: '请输入模型名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择模型类型', trigger: 'change' }
  ]
}

const statsData = reactive([
  { label: '活跃模型', value: '12', icon: 'fas fa-robot', color: '#409EFF', trend: 'up', change: '2' },
  { label: '日均请求', value: '15.2K', icon: 'fas fa-chart-line', color: '#67C23A', trend: 'up', change: '18%' },
  { label: '准确率', value: '94.5%', icon: 'fas fa-bullseye', color: '#E6A23C', trend: 'up', change: '2.3%' },
  { label: '异常检测', value: '23', icon: 'fas fa-exclamation-triangle', color: '#F56C6C', trend: 'down', change: '5' }
])

const anomalyStats = reactive({
  total: 156,
  anomalies: 23,
  normal: 133,
  normalPercentage: 85
})

const currentPrediction = reactive<Prediction>({
  value: '¥125,600',
  trend: 'up',
  change: '+12.5%'
})

const predictionData = reactive<PredictionPoint[]>([
  { date: '01', value: 80 },
  { date: '02', value: 95 },
  { date: '03', value: 88 },
  { date: '04', value: 102 },
  { date: '05', value: 98 },
  { date: '06', value: 110 },
  { date: '07', value: 115 }
])

const suggestions = reactive<Suggestion[]>([
  {
    id: '1',
    title: '优化库存管理',
    description: '根据历史数据分析，建议将安全库存从1000件调整至800件，预计可降低15%库存成本',
    priority: 'high',
    category: 'inventory'
  },
  {
    id: '2',
    title: '提升生产效率',
    description: '机器A3的停机时间异常增加，建议进行预防性维护，预计可减少2小时停机时间',
    priority: 'medium',
    category: 'production'
  },
  {
    id: '3',
    title: '销售策略调整',
    description: '区域B的产品需求呈下降趋势，建议调整促销策略或优化产品组合',
    priority: 'low',
    category: 'sales'
  }
])

const aiModels = reactive<AIModel[]>([
  {
    id: '1',
    name: '销量预测模型',
    type: 'prediction',
    status: 'running',
    accuracy: 94.5,
    samples: 50000,
    trainingTime: '2小时15分钟',
    lastTrained: '2024-01-14 15:30:00',
    createdAt: '2024-01-01 10:00:00',
    description: '基于历史销售数据的销量预测模型，支持未来7天的销量预测',
    metrics: {
      '精确率': '94.5%',
      '召回率': '92.3%',
      'F1分数': '93.4%',
      'MAE': '125.6',
      'RMSE': '189.2'
    }
  }
])

const filteredModels = computed(() => {
  if (modelFilter.value === 'all') return aiModels
  return aiModels.filter(model => model.status === modelFilter.value)
})

const maxValue = computed(() => Math.max(...predictionData.map(item => item.value)))

const getModelTypeLabel = (type: string) => {
  const typeMap: Record<string, string> = {
    image: '图像识别',
    text: '文本分析',
    prediction: '预测分析',
    anomaly: '异常检测',
    recommendation: '推荐系统'
  }
  return typeMap[type] || type
}

const getModelTypeTag = (type: string) => {
  const typeMap: Record<string, string> = {
    image: 'primary',
    text: 'success',
    prediction: 'warning',
    anomaly: 'danger',
    recommendation: 'info'
  }
  return typeMap[type] || ''
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    training: '训练中'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    running: 'success',
    stopped: 'info',
    training: 'warning'
  }
  return statusMap[status] || ''
}

const getAccuracyClass = (accuracy: number) => {
  if (accuracy >= 95) return 'high-accuracy'
  if (accuracy >= 90) return 'medium-accuracy'
  return 'low-accuracy'
}

const getTrendIcon = (trend: string) => {
  return trend === 'up' ? 'fas fa-arrow-up' : trend === 'down' ? 'fas fa-arrow-down' : 'fas fa-minus'
}

const getSuggestionIcon = (priority: string) => {
  return priority === 'high' ? 'fas fa-exclamation-circle' : 
         priority === 'medium' ? 'fas fa-info-circle' : 'fas fa-lightbulb'
}

const getPredictionTitle = () => {
  const titles: Record<string, string> = {
    sales: '预计本月销售额',
    inventory: '预计库存周转率',
    production: '预计产量'
  }
  return titles[predictionType.value] || '预测结果'
}

const refreshData = async () => {
  refreshing.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const viewModel = (model: AIModel) => {
  selectedModel.value = model
  showModelDetail.value = true
}

const trainModel = async (model: AIModel) => {
  try {
    await ElMessageBox.confirm(`确认开始训练模型 "${model.name}"？`, '确认训练', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    model.status = 'training'
    ElMessage.success('模型训练已开始')
  } catch (error) {
    // 用户取消
  }
}

const deployModel = async (model: AIModel) => {
  try {
    await ElMessageBox.confirm(`确认部署模型 "${model.name}"？`, '确认部署', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    model.status = 'running'
    ElMessage.success('模型部署成功')
  } catch (error) {
    // 用户取消
  }
}

const runAnomalyDetection = async () => {
  ElMessage.success('异常检测已开始，请稍候查看结果')
  // 模拟更新统计
  setTimeout(() => {
    anomalyStats.total = 160
    anomalyStats.anomalies = 18
    anomalyStats.normal = 142
    anomalyStats.normalPercentage = 89
  }, 2000)
}

const refreshSuggestions = () => {
  ElMessage.success('智能建议已刷新')
}

const acceptSuggestion = (suggestion: Suggestion) => {
  ElMessage.success(`已采纳建议: ${suggestion.title}`)
  // 可以从列表中移除已采纳的建议
  const index = suggestions.findIndex(s => s.id === suggestion.id)
  if (index > -1) {
    suggestions.splice(index, 1)
  }
}

const ignoreSuggestion = (suggestion: Suggestion) => {
  ElMessage.info(`已忽略建议: ${suggestion.title}`)
}

const saveModel = async () => {
  const formRef = ref()
  try {
    await formRef.value.validate()
    saving.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    aiModels.push({
      id: String(aiModels.length + 1),
      name: newModel.name,
      type: newModel.type,
      status: 'stopped',
      accuracy: 0,
      samples: 0,
      trainingTime: '待训练',
      lastTrained: '待训练',
      createdAt: new Date().toLocaleString(),
      description: newModel.description,
      metrics: {}
    })
    
    ElMessage.success('模型添加成功')
    showModelDialog.value = false
    Object.assign(newModel, { name: '', type: '', description: '' })
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.ai-dashboard {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: 16px;
}

.stat-icon i {
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.stat-trend {
  font-size: 12px;
  margin-top: 3px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.models-section,
.analysis-section,
.suggestions-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 10px;
}

.high-accuracy {
  color: #67C23A;
  font-weight: 500;
}

.medium-accuracy {
  color: #E6A23C;
  font-weight: 500;
}

.low-accuracy {
  color: #F56C6C;
  font-weight: 500;
}

.anomaly-content {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 20px 0;
}

.anomaly-stats {
  display: flex;
  gap: 30px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-number.anomaly {
  color: #F56C6C;
}

.stat-number.normal {
  color: #67C23A;
}

.stat-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.anomaly-chart {
  text-align: center;
}

.progress-text {
  font-size: 18px;
  font-weight: bold;
}

.chart-label {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.prediction-content {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 20px 0;
}

.prediction-result {
  flex: 1;
}

.result-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
}

.result-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.result-trend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.result-trend.up {
  color: #67C23A;
}

.result-trend.down {
  color: #F56C6C;
}

.prediction-chart {
  text-align: center;
}

.mini-chart {
  display: flex;
  align-items: flex-end;
  height: 60px;
  gap: 8px;
  margin-bottom: 10px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #409eff, #67c23a);
  border-radius: 2px 2px 0 0;
  min-height: 5px;
  cursor: pointer;
  transition: opacity 0.3s;
}

.chart-bar:hover {
  opacity: 0.8;
}

.suggestions-list {
  display: grid;
  gap: 15px;
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s;
}

.suggestion-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.suggestion-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.suggestion-icon.high {
  background-color: #F56C6C;
}

.suggestion-icon.medium {
  background-color: #E6A23C;
}

.suggestion-icon.low {
  background-color: #409EFF;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
}

.suggestion-desc {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 12px;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.model-metrics h4 {
  margin-bottom: 15px;
  color: #303133;
}

.metric-card {
  text-align: center;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.metric-value {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .el-col-6 {
    margin-bottom: 15px;
  }
  
  .anomaly-content,
  .prediction-content {
    flex-direction: column;
    gap: 20px;
  }
}
</style>