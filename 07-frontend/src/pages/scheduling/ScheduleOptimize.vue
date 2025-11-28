<template>
  <div class="scheduling-optimize">
    <!-- 页面标题和操作按钮 -->
    <div class="header">
      <h2>排程优化</h2>
      <div class="header-actions">
        <el-button type="primary" @click="handleOptimize" :loading="isOptimizing">
          开始优化
        </el-button>
        <el-button @click="exportReport">
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 优化参数设置 -->
    <el-card v-if="!optimizationResult" class="optimize-form">
      <template #header>
        <div class="card-header">
          <span>优化参数设置</span>
        </div>
      </template>
      <el-form label-position="top">
        <div class="form-row">
          <!-- 优化目标 -->
          <el-form-item label="优化目标">
            <el-radio-group v-model="optimizeParams.optimizeGoal">
              <el-radio label="minimizeMakespan">最小化完工时间</el-radio>
              <el-radio label="minimizeCost">最小化生产成本</el-radio>
              <el-radio label="maximizeUtilization">最大化资源利用率</el-radio>
              <el-radio label="balanceLoad">平衡负载</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 时间范围选择器 -->
          <el-form-item label="考虑时间范围">
            <el-date-picker
              v-model="optimizeParams.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <!-- 考虑约束 -->
          <el-form-item label="考虑约束">
            <el-checkbox-group v-model="optimizeParams.constraints">
              <el-checkbox label="resourceCapacity">资源能力</el-checkbox>
              <el-checkbox label="precedence">工序优先级</el-checkbox>
              <el-checkbox label="dueDate">交付期限</el-checkbox>
              <el-checkbox label="setupTime">换型时间</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <!-- 优化算法 -->
          <el-form-item label="优化算法">
            <el-select v-model="optimizeParams.algorithm" placeholder="请选择算法">
              <el-option label="遗传算法" value="genetic" />
              <el-option label="模拟退火" value="simulatedAnnealing" />
              <el-option label="粒子群算法" value="particleSwarm" />
              <el-option label="启发式算法" value="heuristic" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>
    </el-card>

    <!-- 优化结果分析 -->
    <div v-if="optimizationResult" class="optimization-results">
      <!-- 指标对比卡片 -->
      <div class="comparison-cards">
        <div class="indicator-card" v-for="item in optimizationResult.comparisonData" :key="item.indicator">
          <div class="indicator-title">{{ item.indicator }}</div>
          <div class="indicator-comparison">
            <div class="before">优化前: {{ item.before }}</div>
            <div class="after">优化后: {{ item.after }}</div>
            <div class="improvement" :class="{ positive: item.improvement.startsWith('+') }">
              {{ item.improvement }}
            </div>
          </div>
        </div>
      </div>

      <!-- 图表对比 -->
      <el-card class="comparison-charts">
        <template #header>
          <div class="card-header">
            <span>优化前后对比图表</span>
          </div>
        </template>
        <div class="chart-row">
          <div class="chart-placeholder">资源利用率对比图表</div>
          <div class="chart-placeholder">产能负载对比图表</div>
        </div>
      </el-card>

      <!-- 优化建议 -->
      <el-card v-if="optimizationResult.suggestions && optimizationResult.suggestions.length > 0" class="optimization-suggestions">
        <template #header>
          <div class="card-header">
            <span>优化建议</span>
          </div>
        </template>
        <div class="suggestion-list">
          <div class="suggestion-text" v-for="(suggestion, index) in optimizationResult.suggestions" :key="index">
            {{ index + 1 }}. {{ suggestion }}
          </div>
        </div>
      </el-card>

      <!-- 优化操作按钮 -->
      <div class="optimization-actions">
        <el-button type="primary" @click="applyOptimization">应用优化</el-button>
        <el-button @click="saveOptimization">保存方案</el-button>
        <el-button @click="discardOptimization">放弃优化</el-button>
      </div>
    </div>

    <!-- 优化历史记录 -->
    <el-card class="history-card">
      <template #header>
        <div class="card-header">
          <span>优化历史记录</span>
        </div>
      </template>
      <el-table :data="paginatedHistory" style="width: 100%">
        <el-table-column prop="optimizeTime" label="优化时间" />
        <el-table-column prop="optimizeGoal" label="优化目标" :formatter="getGoalText" />
        <el-table-column prop="algorithm" label="优化算法" />
        <el-table-column prop="improvementRate" label="综合改进率" :formatter="formatPercent" />
        <el-table-column prop="status" label="状态" :formatter="getStatusText" />
        <el-table-column prop="duration" label="优化时长(秒)" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="viewHistoryDetail(scope.row)">查看详情</el-button>
            <el-button size="small" v-if="scope.row.status !== 'applied'" @click="reapplyHistory(scope.row)">重新应用</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="optimizationHistory.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 优化详情对话框 -->
    <el-dialog
      v-model="historyDetailVisible"
      title="优化详情"
      width="70%"
      :before-close="closeHistoryDetail"
    >
      <div class="history-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3>基本信息</h3>
          <el-descriptions border :column="2">
            <el-descriptions-item label="优化时间">{{ selectedHistory?.optimizeTime }}</el-descriptions-item>
            <el-descriptions-item label="优化目标">{{ selectedHistory ? getGoalText(selectedHistory) : '' }}</el-descriptions-item>
            <el-descriptions-item label="优化算法">{{ selectedHistory?.algorithm }}</el-descriptions-item>
            <el-descriptions-item label="优化时长">{{ selectedHistory?.duration }}秒</el-descriptions-item>
            <el-descriptions-item label="综合改进率">{{ selectedHistory?.improvementRate }}%</el-descriptions-item>
            <el-descriptions-item label="状态">
              <span :class="{ 'text-success': selectedHistory?.status === 'applied' }">{{ selectedHistory ? getStatusText(selectedHistory) : '' }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 效果对比 -->
        <div class="detail-section">
          <h3>效果对比</h3>
          <el-table :data="selectedHistory?.comparisonData" style="width: 100%">
            <el-table-column prop="indicator" label="指标" />
            <el-table-column prop="before" label="优化前" />
            <el-table-column prop="after" label="优化后" />
            <el-table-column prop="improvement" label="改进" :formatter="formatImprovement" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 定义类型
interface OptimizeParams {
  optimizeGoal: string
  dateRange: [string, string] | null
  constraints: string[]
  algorithm: string
}

interface ComparisonData {
  indicator: string
  before: string
  after: string
  improvement: string
}

interface OptimizationResult {
  before: {
    makespan: number
    cost: number
    utilization: number
    balance: number
  }
  after: {
    makespan: number
    cost: number
    utilization: number
    balance: number
  }
  improvement: {
    makespan: number
    cost: number
    utilization: number
    balance: number
  }
  comparisonData: ComparisonData[]
  suggestions: string[]
}

interface HistoryItem {
  id: string
  optimizeTime: string
  optimizeGoal: string
  algorithm: string
  improvementRate: number
  status: string
  duration: number
  comparisonData: ComparisonData[]
}

interface Pagination {
  currentPage: number
  pageSize: number
}

// 响应式数据
const isOptimizing = ref(false)
const optimizeParams = ref<OptimizeParams>({
  optimizeGoal: 'minimizeMakespan',
  dateRange: null,
  constraints: ['resourceCapacity', 'precedence'],
  algorithm: 'genetic'
})
const optimizationResult = ref<OptimizationResult | null>(null)
const optimizationHistory = ref<HistoryItem[]>([])
const pagination = ref<Pagination>({
  currentPage: 1,
  pageSize: 10
})
const historyDetailVisible = ref(false)
const selectedHistory = ref<HistoryItem | null>(null)

// 计算属性：分页后的历史记录
const paginatedHistory = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return optimizationHistory.value.slice(start, end)
})

// 生命周期
onMounted(() => {
  loadHistoryData()
})

// 方法实现
const handleOptimize = async () => {
  isOptimizing.value = true
  
  try {
    // 模拟优化过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 生成模拟结果
    const result = generateMockResult()
    optimizationResult.value = result
    
    ElMessage.success('排程优化完成')
  } catch (error) {
    ElMessage.error('优化过程中发生错误')
  } finally {
    isOptimizing.value = false
  }
}

const generateMockResult = (): OptimizationResult => {
  // 生成随机的优化结果
  const beforeMakespan = Math.floor(Math.random() * 10) + 20
  const beforeCost = Math.floor(Math.random() * 50000) + 50000
  const beforeUtilization = Math.floor(Math.random() * 20) + 70
  const beforeBalance = Math.floor(Math.random() * 20) + 65
  
  let improvementMakespan = Math.floor(Math.random() * 20) + 5
  let improvementCost = Math.floor(Math.random() * 25) + 5
  let improvementUtilization = Math.floor(Math.random() * 30) - 10
  let improvementBalance = Math.floor(Math.random() * 30) - 10
  
  // 根据优化目标调整改进幅度
  if (optimizeParams.value.optimizeGoal === 'minimizeMakespan') {
    improvementMakespan = Math.floor(Math.random() * 20) + 15
  } else if (optimizeParams.value.optimizeGoal === 'minimizeCost') {
    improvementCost = Math.floor(Math.random() * 25) + 15
  } else if (optimizeParams.value.optimizeGoal === 'maximizeUtilization') {
    improvementUtilization = Math.floor(Math.random() * 20) + 10
  } else if (optimizeParams.value.optimizeGoal === 'balanceLoad') {
    improvementBalance = Math.floor(Math.random() * 20) + 10
  }
  
  const afterMakespan = Math.max(1, beforeMakespan - Math.floor(beforeMakespan * improvementMakespan / 100))
  const afterCost = Math.max(1, beforeCost - Math.floor(beforeCost * improvementCost / 100))
  const afterUtilization = Math.min(100, beforeUtilization + improvementUtilization)
  const afterBalance = Math.min(100, beforeBalance + improvementBalance)
  
  // 生成优化建议
  const suggestions: string[] = []
  if (improvementMakespan > 10) {
    suggestions.push('优化了关键路径，缩短了生产周期')
  }
  if (improvementCost > 10) {
    suggestions.push('减少了资源空闲时间，降低了生产成本')
  }
  if (improvementUtilization > 5) {
    suggestions.push('提高了设备利用率，增加了产能')
  }
  if (improvementBalance > 5) {
    suggestions.push('均衡了各工序负载，提高了整体效率')
  }
  
  return {
    before: {
      makespan: beforeMakespan,
      cost: beforeCost,
      utilization: beforeUtilization,
      balance: beforeBalance
    },
    after: {
      makespan: afterMakespan,
      cost: afterCost,
      utilization: afterUtilization,
      balance: afterBalance
    },
    improvement: {
      makespan: improvementMakespan,
      cost: improvementCost,
      utilization: improvementUtilization,
      balance: improvementBalance
    },
    comparisonData: [
      { 
        indicator: '完工时间', 
        before: `${beforeMakespan}天`, 
        after: `${afterMakespan}天`, 
        improvement: `+${improvementMakespan}%`
      },
      { 
        indicator: '生产成本', 
        before: `¥${beforeCost.toLocaleString()}`, 
        after: `¥${afterCost.toLocaleString()}`, 
        improvement: `+${improvementCost}%`
      },
      { 
        indicator: '资源利用率', 
        before: `${beforeUtilization}%`, 
        after: `${afterUtilization}%`, 
        improvement: `${improvementUtilization > 0 ? '+' : ''}${improvementUtilization}%`
      },
      { 
        indicator: '负载均衡度', 
        before: `${beforeBalance}%`, 
        after: `${afterBalance}%`, 
        improvement: `${improvementBalance > 0 ? '+' : ''}${improvementBalance}%`
      }
    ],
    suggestions
  }
}

const exportReport = () => {
  if (!optimizationResult.value) {
    ElMessage.warning('请先执行优化操作')
    return
  }
  
  ElMessage.success('报告导出成功')
}

const applyOptimization = () => {
  if (!optimizationResult.value) return
  
  addToHistory('applied')
  ElMessage.success('优化方案已成功应用')
}

const saveOptimization = () => {
  if (!optimizationResult.value) return
  
  addToHistory('saved')
  ElMessage.success('优化方案已保存')
}

const discardOptimization = () => {
  optimizationResult.value = null
  ElMessage.info('已放弃当前优化结果')
}

const viewHistoryDetail = (row: HistoryItem) => {
  selectedHistory.value = row
  historyDetailVisible.value = true
}

const closeHistoryDetail = () => {
  historyDetailVisible.value = false
  selectedHistory.value = null
}

const reapplyHistory = (row: HistoryItem) => {
  // 更新历史记录状态
  optimizationHistory.value.forEach(item => {
    if (item.status === 'applied') {
      item.status = 'saved'
    }
  })
  
  row.status = 'applied'
  ElMessage.success('已重新应用历史优化方案')
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
}

const handleCurrentChange = (current: number) => {
  pagination.value.currentPage = current
}

const getGoalText = (row: { optimizeGoal: string }) => {
  const goalMap: Record<string, string> = {
    'minimizeMakespan': '最小化完工时间',
    'minimizeCost': '最小化生产成本',
    'maximizeUtilization': '最大化资源利用率',
    'balanceLoad': '平衡负载'
  }
  return goalMap[row.optimizeGoal] || row.optimizeGoal
}

const getStatusText = (row: { status: string }) => {
  const statusMap: Record<string, string> = {
    'applied': '已应用',
    'saved': '已保存',
    'discarded': '已放弃'
  }
  return statusMap[row.status] || row.status
}

const formatPercent = (row: { improvementRate: number }) => {
  return `${row.improvementRate}%`
}

const formatImprovement = (row: { improvement: string }) => {
  return row.improvement
}

const loadHistoryData = () => {
  const history: HistoryItem[] = [
    {
      id: '1',
      optimizeTime: '2024-01-10 09:23:45',
      optimizeGoal: 'minimizeMakespan',
      algorithm: '遗传算法',
      improvementRate: 25,
      status: 'applied',
      duration: 23,
      comparisonData: [
        { indicator: '完工时间', before: '35天', after: '28天', improvement: '+20.0%' },
        { indicator: '生产成本', before: '¥89,000', after: '¥78,320', improvement: '+12.0%' },
        { indicator: '资源利用率', before: '68%', after: '75%', improvement: '+10.3%' },
        { indicator: '负载均衡度', before: '62%', after: '65%', improvement: '+4.8%' }
      ]
    },
    {
      id: '2',
      optimizeTime: '2024-01-08 14:36:18',
      optimizeGoal: 'minimizeCost',
      algorithm: '模拟退火',
      improvementRate: 15,
      status: 'saved',
      duration: 25,
      comparisonData: [
        { indicator: '完工时间', before: '32天', after: '31天', improvement: '+3.1%' },
        { indicator: '生产成本', before: '¥82,000', after: '¥67,240', improvement: '+18.0%' },
        { indicator: '资源利用率', before: '75%', after: '72%', improvement: '-4.0%' },
        { indicator: '负载均衡度', before: '70%', after: '68%', improvement: '-2.9%' }
      ]
    },
    {
      id: '3',
      optimizeTime: '2024-01-05 16:45:12',
      optimizeGoal: 'balanceLoad',
      algorithm: '粒子群算法',
      improvementRate: 22,
      status: 'applied',
      duration: 18,
      comparisonData: [
        { indicator: '完工时间', before: '26天', after: '24天', improvement: '+7.7%' },
        { indicator: '生产成本', before: '¥75,000', after: '¥71,250', improvement: '+5.0%' },
        { indicator: '资源利用率', before: '72%', after: '81%', improvement: '+12.5%' },
        { indicator: '负载均衡度', before: '65%', after: '82%', improvement: '+26.2%' }
      ]
    }
  ]
  
  optimizationHistory.value = history
}

const addToHistory = (status: string) => {
  if (!optimizationResult.value) return
  
  const now = new Date()
  const newHistory: HistoryItem = {
    id: Date.now().toString(),
    optimizeTime: now.toLocaleString('zh-CN'),
    optimizeGoal: optimizeParams.value.optimizeGoal,
    algorithm: getAlgorithmText(optimizeParams.value.algorithm),
    improvementRate: Math.round((
      optimizationResult.value.improvement.makespan +
      optimizationResult.value.improvement.cost +
      optimizationResult.value.improvement.utilization +
      optimizationResult.value.improvement.balance
    ) / 4),
    status: status,
    duration: Math.floor(Math.random() * 20) + 10,
    comparisonData: [
      { 
        indicator: '完工时间', 
        before: `${optimizationResult.value.before.makespan}天`, 
        after: `${optimizationResult.value.after.makespan}天`, 
        improvement: `${optimizationResult.value.improvement.makespan > 0 ? '+' : ''}${optimizationResult.value.improvement.makespan}%`
      },
      { 
        indicator: '生产成本', 
        before: `¥${optimizationResult.value.before.cost.toLocaleString()}`, 
        after: `¥${optimizationResult.value.after.cost.toLocaleString()}`, 
        improvement: `${optimizationResult.value.improvement.cost > 0 ? '+' : ''}${optimizationResult.value.improvement.cost}%`
      },
      { 
        indicator: '资源利用率', 
        before: `${optimizationResult.value.before.utilization}%`, 
        after: `${optimizationResult.value.after.utilization}%`, 
        improvement: `${optimizationResult.value.improvement.utilization > 0 ? '+' : ''}${optimizationResult.value.improvement.utilization}%`
      },
      { 
        indicator: '负载均衡度', 
        before: `${optimizationResult.value.before.balance}%`, 
        after: `${optimizationResult.value.after.balance}%`, 
        improvement: `${optimizationResult.value.improvement.balance > 0 ? '+' : ''}${optimizationResult.value.improvement.balance}%`
      }
    ]
  }
  
  optimizationHistory.value.unshift(newHistory)
}

const getAlgorithmText = (algorithm: string): string => {
  const algorithmMap: Record<string, string> = {
    'genetic': '遗传算法',
    'simulatedAnnealing': '模拟退火',
    'particleSwarm': '粒子群算法',
    'heuristic': '启发式算法'
  }
  return algorithmMap[algorithm] || algorithm
}
</script>

<style scoped>
.scheduling-optimize {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.optimize-form {
  margin-top: 20px;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.form-row .el-form-item {
  flex: 1;
  min-width: 200px;
}

.comparison-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.indicator-card {
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.indicator-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #303133;
}

.indicator-comparison {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.before, .after {
  font-size: 14px;
  color: #606266;
}

.improvement {
  font-size: 18px;
  font-weight: 600;
  margin-top: 5px;
}

.improvement.positive {
  color: #67c23a;
}

.improvement:not(.positive) {
  color: #f56c6c;
}

.comparison-charts {
  margin-top: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
  color: #909399;
}

.optimization-suggestions {
  margin-top: 20px;
}

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-text {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.optimization-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.history-card {
  margin-top: 30px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.history-detail {
  padding: 10px 0;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #303133;
}

.text-success {
  color: #67c23a;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .scheduling-optimize {
    padding: 10px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .comparison-cards {
    grid-template-columns: 1fr;
  }
  
  .chart-row {
    grid-template-columns: 1fr;
  }
  
  .indicator-comparison {
    font-size: 12px;
  }
}
</style>