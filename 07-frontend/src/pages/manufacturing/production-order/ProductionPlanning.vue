<template>
  <div class="production-planning">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>生产计划</h2>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
          <el-breadcrumb-item>生产管理</el-breadcrumb-item>
          <el-breadcrumb-item>生产计划</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreatePlan" :icon="Plus">
          新建计划
        </el-button>
        <el-button @click="handleExport" :icon="Download">
          导出
        </el-button>
      </div>
    </div>

    <!-- 筛选和统计 -->
    <div class="filter-stats-section">
      <el-card class="filter-card" shadow="never">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="计划周期">
            <el-select v-model="filterForm.period" @change="handlePeriodChange">
              <el-option label="日计划" value="daily" />
              <el-option label="周计划" value="weekly" />
              <el-option label="月计划" value="monthly" />
              <el-option label="季度计划" value="quarterly" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="filterForm.department" placeholder="请选择部门">
              <el-option label="全部" value="" />
              <el-option label="生产一部" value="dept1" />
              <el-option label="生产二部" value="dept2" />
              <el-option label="生产三部" value="dept3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter" :icon="Search">查询</el-button>
            <el-button @click="handleReset" :icon="Refresh">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <el-icon><Calendar /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalPlans }}</div>
                <div class="stat-label">计划总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                <el-icon><Timer /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.inProgress }}</div>
                <div class="stat-label">执行中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.completionRate }}%</div>
                <div class="stat-label">完成率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                <el-icon><Box /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalOutput }}</div>
                <div class="stat-label">计划产量</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 计划列表 -->
        <el-col :span="12">
          <el-card class="plan-list-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>生产计划列表</span>
                <el-tag type="info">{{ planList.length }} 个</el-tag>
              </div>
            </template>
            
            <el-table
              :data="planList"
              height="600"
              @row-click="handlePlanSelect"
              highlight-current-row
            >
              <el-table-column type="index" width="50" />
              <el-table-column prop="planNumber" label="计划编号" width="120" />
              <el-table-column prop="planName" label="计划名称" min-width="150" />
              <el-table-column prop="period" label="计划周期" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ getPeriodLabel(row.period) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)" size="small">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="startDate" label="开始日期" width="110">
                <template #default="{ row }">
                  {{ formatDate(row.startDate) }}
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="进度" width="80">
                <template #default="{ row }">
                  {{ row.progress }}%
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <!-- 计划详情 -->
        <el-col :span="12">
          <el-card class="plan-detail-card" shadow="never" v-if="selectedPlan">
            <template #header>
              <div class="card-header">
                <span>计划详情</span>
                <div class="header-actions">
                  <el-button size="small" @click="handleEditPlan" :icon="Edit">编辑</el-button>
                  <el-button size="small" type="success" @click="handleExecutePlan" :icon="VideoPlay">执行</el-button>
                </div>
              </div>
            </template>

            <div class="plan-detail-content">
              <!-- 基本信息 -->
              <div class="detail-section">
                <h4>基本信息</h4>
                <el-descriptions :column="2" size="small">
                  <el-descriptions-item label="计划编号">{{ selectedPlan.planNumber }}</el-descriptions-item>
                  <el-descriptions-item label="计划名称">{{ selectedPlan.planName }}</el-descriptions-item>
                  <el-descriptions-item label="计划周期">{{ getPeriodLabel(selectedPlan.period) }}</el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag :type="getStatusTagType(selectedPlan.status)">
                      {{ getStatusLabel(selectedPlan.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="开始时间">{{ formatDate(selectedPlan.startDate) }}</el-descriptions-item>
                  <el-descriptions-item label="结束时间">{{ formatDate(selectedPlan.endDate) }}</el-descriptions-item>
                </el-descriptions>
              </div>

              <!-- 生产目标 -->
              <div class="detail-section">
                <h4>生产目标</h4>
                <el-descriptions :column="2" size="small">
                  <el-descriptions-item label="计划产量">{{ selectedPlan.targetOutput }}</el-descriptions-item>
                  <el-descriptions-item label="已完成产量">{{ selectedPlan.completedOutput }}</el-descriptions-item>
                  <el-descriptions-item label="完成进度">{{ selectedPlan.progress }}%</el-descriptions-item>
                  <el-descriptions-item label="目标产值">¥{{ formatNumber(selectedPlan.targetValue) }}</el-descriptions-item>
                </el-descriptions>
                <div class="progress-section">
                  <span>完成进度</span>
                  <el-progress
                    :percentage="selectedPlan.progress"
                    :color="getProgressColor(selectedPlan.progress)"
                    :stroke-width="8"
                  />
                </div>
              </div>

              <!-- 包含的订单 -->
              <div class="detail-section">
                <h4>包含的订单</h4>
                <el-table :data="selectedPlan.orders" size="small" max-height="200">
                  <el-table-column prop="orderNumber" label="订单号" width="120" />
                  <el-table-column prop="productName" label="产品名称" min-width="120" />
                  <el-table-column prop="quantity" label="数量" width="80" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="getStatusTagType(row.status)" size="small">
                        {{ getStatusLabel(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </el-card>

          <!-- 空状态 -->
          <el-card class="empty-card" shadow="never" v-else>
            <el-empty description="请选择一个计划查看详情" />
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 计划甘特图 -->
    <el-card class="gantt-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>计划甘特图</span>
          <el-button-group>
            <el-button size="small" @click="handleZoomIn" :icon="ZoomIn">放大</el-button>
            <el-button size="small" @click="handleZoomOut" :icon="ZoomOut">缩小</el-button>
            <el-button size="small" @click="handleFitScreen" :icon="FullScreen">适应</el-button>
          </el-button-group>
        </div>
      </template>
      
      <div ref="ganttChartRef" class="gantt-container"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus, Download, Search, Refresh, Calendar, Timer, TrendCharts, Box,
  Edit, VideoPlay, ZoomIn, ZoomOut, FullScreen
} from '@element-plus/icons-vue'

const router = useRouter()

// 响应式数据
const filterForm = reactive({
  period: 'weekly',
  dateRange: [],
  department: ''
})

const statistics = reactive({
  totalPlans: 0,
  inProgress: 0,
  completionRate: 0,
  totalOutput: 0
})

const planList = ref([])
const selectedPlan = ref(null)
const ganttChartRef = ref()

// 方法
const handleCreatePlan = () => {
  router.push('/manufacturing/production-plan/create')
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handlePeriodChange = () => {
  handleFilter()
}

const handleFilter = () => {
  loadPlanList()
}

const handleReset = () => {
  Object.assign(filterForm, {
    period: 'weekly',
    dateRange: [],
    department: ''
  })
  handleFilter()
}

const handlePlanSelect = (row) => {
  selectedPlan.value = row
}

const handleEditPlan = () => {
  if (!selectedPlan.value) return
  router.push(`/manufacturing/production-plan/edit/${selectedPlan.value.id}`)
}

const handleExecutePlan = async () => {
  if (!selectedPlan.value) return
  
  try {
    // 这里调用执行计划API
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('计划执行成功')
    loadPlanList()
  } catch (error) {
    ElMessage.error('计划执行失败')
  }
}

const handleZoomIn = () => {
  // 甘特图放大
}

const handleZoomOut = () => {
  // 甘特图缩小
}

const handleFitScreen = () => {
  // 甘特图适应屏幕
}

// 工具方法
const getPeriodLabel = (period) => {
  const map = {
    daily: '日计划',
    weekly: '周计划',
    monthly: '月计划',
    quarterly: '季度计划'
  }
  return map[period] || period
}

const getStatusTagType = (status) => {
  const map = {
    draft: 'info',
    pending: 'warning',
    approved: 'primary',
    in_progress: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    draft: '草稿',
    pending: '待审批',
    approved: '已审批',
    in_progress: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getProgressColor = (progress) => {
  if (progress >= 90) return '#67c23a'
  if (progress >= 70) return '#409eff'
  if (progress >= 50) return '#e6a23c'
  return '#f56c6c'
}

const formatNumber = (num) => {
  return Number(num).toLocaleString()
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// 加载数据
const loadPlanList = async () => {
  try {
    // 这里调用API获取计划列表
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    planList.value = [
      {
        id: 1,
        planNumber: 'PP202401001',
        planName: '一月生产计划',
        period: 'monthly',
        status: 'in_progress',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        progress: 65,
        targetOutput: 10000,
        completedOutput: 6500,
        targetValue: 5000000,
        orders: [
          {
            orderNumber: 'PO000001',
            productName: '产品A',
            quantity: 5000,
            status: 'in_progress'
          },
          {
            orderNumber: 'PO000002',
            productName: '产品B',
            quantity: 5000,
            status: 'pending'
          }
        ]
      },
      {
        id: 2,
        planNumber: 'PP202401002',
        planName: '第二周生产计划',
        period: 'weekly',
        status: 'approved',
        startDate: '2024-01-08',
        endDate: '2024-01-14',
        progress: 30,
        targetOutput: 3000,
        completedOutput: 900,
        targetValue: 1500000,
        orders: [
          {
            orderNumber: 'PO000003',
            productName: '产品C',
            quantity: 2000,
            status: 'in_progress'
          },
          {
            orderNumber: 'PO000004',
            productName: '产品D',
            quantity: 1000,
            status: 'pending'
          }
        ]
      }
    ]
    
    // 更新统计数据
    statistics.totalPlans = planList.value.length
    statistics.inProgress = planList.value.filter(plan => plan.status === 'in_progress').length
    statistics.totalOutput = planList.value.reduce((sum, plan) => sum + plan.targetOutput, 0)
    
    const totalProgress = planList.value.reduce((sum, plan) => sum + plan.progress, 0)
    statistics.completionRate = Math.round(totalProgress / planList.value.length)
    
    if (planList.value.length > 0) {
      selectedPlan.value = planList.value[0]
    }
  } catch (error) {
    ElMessage.error('获取计划列表失败')
  }
}

// 初始化甘特图
const initGanttChart = () => {
  if (!ganttChartRef.value) return
  
  // 这里应该使用甘特图库
  // 为了示例，创建一个简单的甘特图
  ganttChartRef.value.innerHTML = `
    <div class="gantt-placeholder">
      <div class="placeholder-content">
        <el-icon size="48" color="#c0c4cc"><Calendar /></el-icon>
        <p>甘特图组件</p>
        <p class="placeholder-text">需要集成甘特图库来显示生产计划时间轴</p>
      </div>
    </div>
  `
}

onMounted(() => {
  loadPlanList()
  nextTick(() => {
    initGanttChart()
  })
})
</script>

<style scoped lang="scss">
.production-planning {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #303133;
      }
    }
    
    .header-right {
      display: flex;
      gap: 12px;
    }
  }
  
  .filter-stats-section {
    .filter-card {
      margin-bottom: 20px;
    }
    
    .stats-row {
      margin-bottom: 20px;
      
      .stat-card {
        .stat-content {
          display: flex;
          align-items: center;
          gap: 16px;
          
          .stat-icon {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
          }
          
          .stat-info {
            flex: 1;
            
            .stat-value {
              font-size: 28px;
              font-weight: bold;
              color: #303133;
              line-height: 1;
            }
            
            .stat-label {
              font-size: 14px;
              color: #909399;
              margin-top: 4px;
            }
          }
        }
      }
    }
  }
  
  .main-content {
    margin-bottom: 20px;
    
    .plan-list-card, .plan-detail-card, .empty-card {
      height: 600px;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .header-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
    
    .plan-detail-card {
      .plan-detail-content {
        height: 520px;
        overflow-y: auto;
        
        .detail-section {
          margin-bottom: 24px;
          
          h4 {
            margin: 0 0 12px 0;
            color: #303133;
            border-bottom: 1px solid #e4e7ed;
            padding-bottom: 8px;
          }
          
          .progress-section {
            margin-top: 12px;
            
            span {
              display: block;
              margin-bottom: 8px;
              font-size: 14px;
              color: #606266;
            }
          }
        }
      }
    }
  }
  
  .gantt-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .gantt-container {
      height: 400px;
      border: 1px dashed #dcdfe6;
      border-radius: 4px;
      
      .gantt-placeholder {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .placeholder-content {
          text-align: center;
          
          p {
            margin: 8px 0;
            color: #606266;
          }
          
          .placeholder-text {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>