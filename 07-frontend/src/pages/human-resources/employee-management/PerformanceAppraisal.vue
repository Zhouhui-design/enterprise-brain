<template>
  <div class="performance-appraisal-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>绩效考核管理</span>
          <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">新建考核</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="员工姓名">
          <el-input v-model="searchForm.employeeName" clearable />
        </el-form-item>
        <el-form-item label="考核周期">
          <el-date-picker v-model="searchForm.period" type="month" />
        </el-form-item>
        <el-form-item label="考核状态">
          <el-select v-model="searchForm.status" clearable>
            <el-option label="待评分" value="pending" />
            <el-option label="已评分" value="scored" />
            <el-option label="已审批" value="approved" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadPerformanceList">查询</el-button>
        </el-form-item>
      </el-form>

      <!-- 绩效统计 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card>
            <el-statistic title="优秀" :value="stats.excellentCount" suffix="人" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic title="良好" :value="stats.goodCount" suffix="人" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic title="合格" :value="stats.qualifiedCount" suffix="人" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card>
            <el-statistic title="待改进" :value="stats.needImproveCount" suffix="人" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 绩效列表 -->
      <el-table :data="performanceList" border v-loading="loading">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="employeeName" label="员工姓名" />
        <el-table-column prop="employeeNo" label="工号" />
        <el-table-column prop="departmentName" label="部门" />
        <el-table-column prop="period" label="考核周期" />
        <el-table-column label="考核分数" width="120">
          <template #default="scope">
            <el-progress 
              :percentage="scope.row.score" 
              :color="getScoreColor(scope.row.score)"
              :stroke-width="20"
            >
              <span style="font-size: 12px;">{{ scope.row.score }}分</span>
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="考核等级" width="100">
          <template #default="scope">
            <el-tag :type="getLevelType(scope.row.level)">
              {{ getLevelText(scope.row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="success" size="small" link @click="handleScore(scope.row)" v-if="scope.row.status === 'pending'">
              评分
            </el-button>
            <el-button type="warning" size="small" link @click="handleApprove(scope.row)" v-if="scope.row.status === 'scored'">
              审批
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pageNum"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadPerformanceList"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 新建考核对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建考核" width="600px">
      <el-form :model="performanceForm" ref="formRef" label-width="100px">
        <el-form-item label="考核周期">
          <el-date-picker v-model="performanceForm.period" type="month" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="考核对象">
          <el-select v-model="performanceForm.scope" style="width: 100%;">
            <el-option label="全员" value="all" />
            <el-option label="部门" value="department" />
            <el-option label="指定员工" value="specific" />
          </el-select>
        </el-form-item>
        <el-form-item label="考核模板">
          <el-select v-model="performanceForm.templateId" style="width: 100%;">
            <el-option label="月度考核模板" value="1" />
            <el-option label="季度考核模板" value="2" />
            <el-option label="年度考核模板" value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- 评分对话框 -->
    <el-dialog v-model="showScoreDialog" title="绩效评分" width="800px">
      <el-form :model="scoreForm" label-width="120px">
        <el-form-item label="员工">
          {{ currentPerformance?.employeeName }} ({{ currentPerformance?.employeeNo }})
        </el-form-item>
        <el-form-item label="考核周期">
          {{ currentPerformance?.period }}
        </el-form-item>
        
        <el-divider>考核指标</el-divider>
        
        <el-form-item label="工作质量(30%)">
          <el-rate v-model="scoreForm.qualityScore" :max="10" show-score />
        </el-form-item>
        <el-form-item label="工作效率(30%)">
          <el-rate v-model="scoreForm.efficiencyScore" :max="10" show-score />
        </el-form-item>
        <el-form-item label="团队协作(20%)">
          <el-rate v-model="scoreForm.teamworkScore" :max="10" show-score />
        </el-form-item>
        <el-form-item label="创新能力(20%)">
          <el-rate v-model="scoreForm.innovationScore" :max="10" show-score />
        </el-form-item>
        
        <el-form-item label="总分">
          <el-tag size="large" type="success">{{ totalScore }} 分</el-tag>
        </el-form-item>
        
        <el-form-item label="评价">
          <el-input v-model="scoreForm.remark" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showScoreDialog = false">取消</el-button>
        <el-button type="primary" @click="submitScore">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { performanceApi } from '@/api/hr/employee'

const loading = ref(false)
const showCreateDialog = ref(false)
const showScoreDialog = ref(false)
const performanceList = ref([])
const currentPerformance = ref(null)
const pageNum = ref(1)
const total = ref(0)
const formRef = ref(null)

const stats = reactive({
  excellentCount: 0,
  goodCount: 0,
  qualifiedCount: 0,
  needImproveCount: 0
})

const searchForm = reactive({
  employeeName: '',
  period: '',
  status: ''
})

const performanceForm = reactive({
  period: '',
  scope: 'all',
  templateId: '1'
})

const scoreForm = reactive({
  qualityScore: 0,
  efficiencyScore: 0,
  teamworkScore: 0,
  innovationScore: 0,
  remark: ''
})

const totalScore = computed(() => {
  return Math.round(
    scoreForm.qualityScore * 3 +
    scoreForm.efficiencyScore * 3 +
    scoreForm.teamworkScore * 2 +
    scoreForm.innovationScore * 2
  )
})

const loadPerformanceList = async () => {
  loading.value = true
  try {
    const res = await performanceApi.getPerformanceList({ ...searchForm, pageNum: pageNum.value, pageSize: 20 })
    performanceList.value = res.data?.records || mockData()
    total.value = res.data?.total || 30
    updateStats()
  } catch (error) {
    performanceList.value = mockData()
    updateStats()
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  stats.excellentCount = performanceList.value.filter(item => item.level === 'excellent').length
  stats.goodCount = performanceList.value.filter(item => item.level === 'good').length
  stats.qualifiedCount = performanceList.value.filter(item => item.level === 'qualified').length
  stats.needImproveCount = performanceList.value.filter(item => item.level === 'needImprove').length
}

const mockData = () => {
  const levels = ['excellent', 'good', 'qualified', 'needImprove']
  const statuses = ['pending', 'scored', 'approved']
  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    employeeName: `员工${i + 1}`,
    employeeNo: `EMP00${i + 1}`,
    departmentName: ['研发部', '销售部', '财务部'][i % 3],
    period: '2024-01',
    score: 60 + Math.floor(Math.random() * 40),
    level: levels[i % 4],
    status: statuses[i % 3]
  }))
}

const viewDetail = (row) => {
  ElMessage.info('查看详情功能开发中...')
}

const handleScore = (row) => {
  currentPerformance.value = row
  Object.assign(scoreForm, {
    qualityScore: 0,
    efficiencyScore: 0,
    teamworkScore: 0,
    innovationScore: 0,
    remark: ''
  })
  showScoreDialog.value = true
}

const handleApprove = (row) => {
  ElMessage.info('审批功能开发中...')
}

const submitCreate = async () => {
  await performanceApi.createPerformance(performanceForm)
  ElMessage.success('创建成功')
  showCreateDialog.value = false
  loadPerformanceList()
}

const submitScore = async () => {
  await performanceApi.submitScore({
    performanceId: currentPerformance.value.id,
    score: totalScore.value,
    ...scoreForm
  })
  ElMessage.success('评分提交成功')
  showScoreDialog.value = false
  loadPerformanceList()
}

const getScoreColor = (score) => {
  if (score >= 90) return '#67c23a'
  if (score >= 80) return '#95d475'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getLevelType = (level) => {
  const map = { excellent: 'success', good: '', qualified: 'warning', needImprove: 'danger' }
  return map[level] || 'info'
}

const getLevelText = (level) => {
  const map = { excellent: '优秀', good: '良好', qualified: '合格', needImprove: '待改进' }
  return map[level] || '未知'
}

const getStatusType = (status) => {
  const map = { pending: 'info', scored: 'warning', approved: 'success' }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = { pending: '待评分', scored: '已评分', approved: '已审批' }
  return map[status] || '未知'
}

onMounted(() => {
  loadPerformanceList()
})
</script>

<style scoped>
.performance-appraisal-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-row {
  margin-bottom: 20px;
}
</style>
